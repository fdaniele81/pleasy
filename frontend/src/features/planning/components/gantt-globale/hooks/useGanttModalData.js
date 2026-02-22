import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetHolidaysQuery } from '../../../../holidays/api/holidayEndpoints';
import { useGetFteReportQuery } from '../../../api/taskEndpoints';
import { useGetGanttDailyTimeOffsQuery } from '../../../../timesheet/api/timesheetEndpoints';
import { formatDateISO } from '../../../../../utils/date/dateUtils';
import { useLocale } from '../../../../../hooks/useLocale';

const NUM_COLUMNS = 14;

const dateToLocalString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEventCoordinates = (e) => {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
};

export function useGanttModalData({ isOpen, projects, filterUserIds = [], refreshTrigger = 0 }) {
  const { t } = useTranslation('planning');
  const locale = useLocale();
  const { data: holidays = [] } = useGetHolidaysQuery();
  const [expandedUsers, setExpandedUsers] = useState({});
  const [excludedTasks, setExcludedTasks] = useState({});
  const [timeInterval, setTimeInterval] = useState(12);
  const [dateOffset, setDateOffset] = useState(0);
  const [etcReferenceDate, setEtcReferenceDate] = useState(() => formatDateISO(new Date()));
  const [hoveredPeriod, setHoveredPeriod] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, isLeft: false });
  const tooltipTimeoutRef = useRef(null);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const width = 1000;
  const [height, setHeight] = useState(null);
  const [columnWidth, setColumnWidth] = useState(80);
  const [columnWidths, setColumnWidths] = useState([]);
  const [tableWidth, setTableWidth] = useState(0);

  useEffect(() => {
    const panelWidth = width;
    const availableWidth = panelWidth - 12 - 16 - 215 - 110 - 2;
    const baseColWidth = Math.floor(availableWidth / NUM_COLUMNS);
    const remainderPixels = availableWidth - (baseColWidth * NUM_COLUMNS);
    const widths = Array(NUM_COLUMNS).fill(baseColWidth).map((w, idx) =>
      idx < remainderPixels ? w + 1 : w
    );
    const totalWidth = 215 + 110 + widths.reduce((sum, w) => sum + w, 0);
    setColumnWidth(Math.max(30, baseColWidth));
    setColumnWidths(widths);
    setTableWidth(totalWidth);
  }, []);

  const dateRange = useMemo(() => {
    const totalDays = timeInterval * 7;
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() + dateOffset);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    return { startDate: formatDateISO(startDate), endDate: formatDateISO(endDate) };
  }, [timeInterval, dateOffset]);

  const { data: fteReportData = { tasks: [], intervals: [], period: {} } } = useGetFteReportQuery(
    { startDate: dateRange.startDate, endDate: dateRange.endDate, etcReferenceDate },
    { skip: !isOpen }
  );

  const { data: allUsersTimeOffs = [] } = useGetGanttDailyTimeOffsQuery(
    { startDate: dateRange.startDate, endDate: dateRange.endDate },
    { skip: !isOpen || !projects || projects.length === 0 }
  );

  useEffect(() => { setDateOffset(0); }, [timeInterval]);
  useEffect(() => { if (isOpen) { setHeight(null); } }, [isOpen]);

  const visibleUserIds = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    const userIds = new Set();
    projects.forEach(project => {
      (project.tasks || []).forEach(task => {
        if (task.owner_id) userIds.add(task.owner_id);
      });
    });
    return Array.from(userIds);
  }, [projects]);

  const fteData = useMemo(() => {
    if (!fteReportData.tasks || fteReportData.tasks.length === 0) {
      return { periods: [], userAllocations: [] };
    }
    const periods = (fteReportData.intervals || []).map((interval) => {
      const start = new Date(interval.start_date);
      const end = new Date(interval.end_date);
      return { start, end, label: `${start.getDate()}` };
    });

    let filteredTasks = fteReportData.tasks;
    if (visibleUserIds.length > 0) {
      filteredTasks = filteredTasks.filter(task => visibleUserIds.includes(task.owner_id));
    }
    if (filterUserIds.length > 0) {
      filteredTasks = filteredTasks.filter(task => filterUserIds.includes(task.owner_id));
    }

    const userMap = new Map();
    filteredTasks.forEach(task => {
      if (!task.owner_id) return;
      if (!userMap.has(task.owner_id)) {
        userMap.set(task.owner_id, {
          user_id: task.owner_id,
          user_name: task.owner_name || t('ganttNotAssigned'),
          allocation_percentage: 0,
          periodFTE: Array(periods.length).fill(0),
          periodPlannedHours: Array(periods.length).fill(0),
          periodAvailableHours: Array(periods.length).fill(0),
          periodTimeOffTypes: Array(periods.length).fill(null).map(() => new Set()),
          tasks: []
        });
      }
      const userAllocation = userMap.get(task.owner_id);
      const taskPeriodFTE = Array(periods.length).fill(0);
      const taskPeriodPlannedHours = Array(periods.length).fill(0);

      if (task.intervals && Array.isArray(task.intervals)) {
        task.intervals.forEach(interval => {
          const periodIdx = interval.interval_number - 1;
          if (periodIdx >= 0 && periodIdx < periods.length) {
            taskPeriodFTE[periodIdx] = interval.fte || 0;
            taskPeriodPlannedHours[periodIdx] = interval.planned_hours || 0;
            if (interval.available_hours > 0) {
              userAllocation.periodAvailableHours[periodIdx] = interval.available_hours;
            }
          }
        });
      }
      userAllocation.tasks.push({
        ...task,
        allocation_percentage: task.allocation_percentage || 0,
        periodFTE: taskPeriodFTE,
        periodPlannedHours: taskPeriodPlannedHours
      });
      if (!excludedTasks[task.task_id]) {
        taskPeriodFTE.forEach((fte, idx) => { userAllocation.periodFTE[idx] += fte; });
        taskPeriodPlannedHours.forEach((hours, idx) => { userAllocation.periodPlannedHours[idx] += hours; });
      }
    });

    const userTimeOffsMap = {};
    allUsersTimeOffs.forEach(timeOff => {
      if (!userTimeOffsMap[timeOff.user_id]) userTimeOffsMap[timeOff.user_id] = {};
      if (!userTimeOffsMap[timeOff.user_id][timeOff.date]) userTimeOffsMap[timeOff.user_id][timeOff.date] = [];
      userTimeOffsMap[timeOff.user_id][timeOff.date].push({ hours: timeOff.hours, type: timeOff.time_off_type_id });
    });

    userMap.forEach(userAllocation => {
      periods.forEach((period, periodIdx) => {
        const periodStart = new Date(period.start);
        const periodEnd = new Date(period.end);
        const timeOffTypesInPeriod = new Set();
        if (userTimeOffsMap[userAllocation.user_id]) {
          const current = new Date(periodStart);
          while (current <= periodEnd) {
            const dateKey = dateToLocalString(current);
            const dayTimeOffs = userTimeOffsMap[userAllocation.user_id][dateKey];
            if (dayTimeOffs && Array.isArray(dayTimeOffs)) {
              dayTimeOffs.forEach(timeOff => { timeOffTypesInPeriod.add(timeOff.type); });
            }
            current.setDate(current.getDate() + 1);
          }
        }
        userAllocation.periodTimeOffTypes[periodIdx] = timeOffTypesInPeriod;
      });

      let totalWeightedFte = 0;
      let totalAvailableHours = 0;
      const etcRefDate = fteReportData.period?.etc_reference_date
        ? new Date(fteReportData.period.etc_reference_date)
        : new Date();
      etcRefDate.setHours(0, 0, 0, 0);
      userAllocation.periodFTE.forEach((fte, idx) => {
        const periodStart = periods[idx]?.start;
        if (periodStart && periodStart >= etcRefDate) {
          const availableHours = userAllocation.periodAvailableHours[idx];
          totalWeightedFte += fte * availableHours;
          totalAvailableHours += availableHours;
        }
      });
      userAllocation.allocation_percentage = totalAvailableHours > 0
        ? (totalWeightedFte / totalAvailableHours) * 100
        : 0;
    });

    return { periods, userAllocations: Array.from(userMap.values()) };
  }, [fteReportData, allUsersTimeOffs, filterUserIds, visibleUserIds, excludedTasks]);

  const handleToggleUser = useCallback((userId) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  }, []);

  const handleToggleTaskExclusion = useCallback((taskId) => {
    setExcludedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  }, []);

  const handleTooltipHover = useCallback((event, userId, periodIdx) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    tooltipTimeoutRef.current = setTimeout(() => {
      const tooltipWidth = 280;
      const screenWidth = window.innerWidth;
      const shouldShowLeft = rect.right + tooltipWidth + 16 > screenWidth;
      setTooltipPosition({
        x: shouldShowLeft ? rect.left - 8 : rect.right + 8,
        y: rect.top + rect.height / 2,
        isLeft: shouldShowLeft,
      });
      setHoveredPeriod({ userId, periodIdx });
    }, 1000);
  }, []);

  const handleTooltipLeave = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setHoveredPeriod(null);
  }, []);

  useEffect(() => {
    return () => { if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current); };
  }, []);

  const periodLabel = useMemo(() => {
    const totalDays = timeInterval * 7;
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() + dateOffset);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays - 1);
    const formatOptions = { day: 'numeric', month: 'short' };
    const startStr = startDate.toLocaleDateString(locale, formatOptions);
    const endStr = endDate.toLocaleDateString(locale, { ...formatOptions, year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }, [timeInterval, dateOffset, locale]);

  const minDateOffset = useMemo(() => {
    if (!etcReferenceDate) return 0;
    const refDate = new Date(etcReferenceDate);
    refDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((refDate - today) / (1000 * 60 * 60 * 24));
  }, [etcReferenceDate]);

  const handlePrevious = useCallback(() => {
    if (dateOffset <= minDateOffset) return;
    const totalDays = timeInterval * 7;
    setDateOffset(prev => Math.max(minDateOffset, prev - totalDays));
  }, [dateOffset, minDateOffset, timeInterval]);

  const handleNext = useCallback(() => {
    const totalDays = timeInterval * 7;
    setDateOffset(prev => prev + totalDays);
  }, [timeInterval]);

  const handleGoToEtcRef = useCallback(() => {
    setDateOffset(minDateOffset);
  }, [minDateOffset]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.gantt-drag-handle')) {
      setIsDragging(true);
      setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('.gantt-drag-handle')) {
      const coords = getEventCoordinates(e);
      setIsDragging(true);
      setDragOffset({ x: coords.x - position.x, y: coords.y - position.y });
    }
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragOffset.x, y: Math.max(0, e.clientY - dragOffset.y) });
      }
    };
    const handleTouchMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        const coords = getEventCoordinates(e);
        setPosition({ x: coords.x - dragOffset.x, y: Math.max(0, coords.y - dragOffset.y) });
      }
    };
    const handleMouseUp = () => { setIsDragging(false); };
    const handleTouchEnd = () => { setIsDragging(false); };
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  return {
    t, holidays, allUsersTimeOffs, fteData,
    expandedUsers, excludedTasks, timeInterval, setTimeInterval,
    dateOffset, etcReferenceDate, setEtcReferenceDate,
    hoveredPeriod, tooltipPosition,
    position, isDragging, width, height,
    columnWidth, columnWidths, tableWidth,
    periodLabel, minDateOffset,
    handlePrevious, handleNext, handleGoToEtcRef,
    handleToggleUser, handleToggleTaskExclusion,
    handleTooltipHover, handleTooltipLeave,
    handleMouseDown, handleTouchStart,
  };
}
