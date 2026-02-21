import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import logger from "../../../utils/logger";
import {
  useSaveTimesheetMutation,
  useDeleteTimesheetMutation,
  useSubmitTimesheetsMutation,
  useSaveTimeOffMutation,
  useLazyGetTimesheetsQuery,
} from "../api/timesheetEndpoints";
import {
  useLazyGetTaskDetailsForUserQuery,
  useUpdateTaskDetailsForUserMutation,
} from "../../planning/api/taskEndpoints";
import { useInlineEditCell } from "../../../hooks/useInlineEditCell";
import { formatDateLocal, getTimesheetForDate, getTimeOffForDate } from "../../../utils/table/tableUtils";
import { isHoliday } from "../../../utils/date/workingDays";
import { exportTimesheetToExcel } from "../../../utils/export/excel";
import { useLocale } from "../../../hooks/useLocale";

export function useTimesheetActions({
  startDate,
  endDate,
  dateRange,
  projects,
  holidays,
  timeOffs,
  allTasksFlat,
  filteredTasks,
  selectedTasks,
  setSelectedTasks,
  openExportModal,
  closeExportModal,
  openSubmissionPreview,
  closeSubmissionPreview,
  openTaskModal,
  closeTaskModal,
  setTaskDetailsForModal,
  setLoadingTaskDetails,
  selectedTaskForModal,
  openTimeOffModal,
  closeTimeOffModal,
  timeOffModalDate,
  timeOffModalType,
  openTimesheetDetailsModal,
  closeTimesheetDetailsModal,
  timesheetDetailsModalDate,
  timesheetDetailsModalTask,
  timesheetDetailsModalIsSubmitted,
}) {
  const { t } = useTranslation(['timesheet', 'common']);
  const locale = useLocale();
  const [saveTimesheet] = useSaveTimesheetMutation();
  const [deleteTimesheet] = useDeleteTimesheetMutation();
  const [submitTimesheets] = useSubmitTimesheetsMutation();
  const [saveTimeOff] = useSaveTimeOffMutation();
  const [fetchTaskDetails] = useLazyGetTaskDetailsForUserQuery();
  const [updateTaskDetails] = useUpdateTaskDetailsForUserMutation();
  const [getTimesheetsForExport] = useLazyGetTimesheetsQuery();

  const [contextMenu, setContextMenu] = useState(null);
  const [contextMenuTimeOffData, setContextMenuTimeOffData] = useState(null);

  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipTimeoutRef = useRef(null);

  const [hoveredNoteCell, setHoveredNoteCell] = useState(null);
  const [noteTooltipPosition, setNoteTooltipPosition] = useState({ x: 0, y: 0 });
  const noteTooltipTimeoutRef = useRef(null);

  const [showTimeOffSummaryModal, setShowTimeOffSummaryModal] = useState(false);
  const [selectedTimeOffTypeForSummary, setSelectedTimeOffTypeForSummary] = useState(null);

  const taskEditCell = useInlineEditCell({
    onSave: useCallback(async (taskId, dateStr, hours, _previousValue, { timesheetId }) => {
      try {
        if (hours === 0 && timesheetId) {
          await deleteTimesheet(timesheetId).unwrap();
        } else if (hours > 0) {
          const task = allTasksFlat.find(t => t.task_id === taskId);
          const projectKey = task?.project_key || null;
          await saveTimesheet({
            taskId, workDate: dateStr, hoursWorked: hours, notes: null, externalKey: projectKey,
          }).unwrap();
        }
      } catch (error) {}
    }, [saveTimesheet, deleteTimesheet, allTasksFlat]),
    getCellKey: (taskId, dateStr) => `${taskId}-${dateStr}`,
    parseValue: (val) => parseFloat(val) || 0,
  });

  const timeOffEditCell = useInlineEditCell({
    onSave: useCallback(async (timeOffTypeId, dateStr, hours) => {
      if (hours >= 0) {
        try { await saveTimeOff({ timeOffTypeId, date: dateStr, hours }).unwrap(); } catch (error) {}
      }
    }, [saveTimeOff]),
    getCellKey: (timeOffTypeId, dateStr) => `timeoff-${timeOffTypeId}-${dateStr}`,
    parseValue: (val) => parseFloat(val) || 0,
  });

  useEffect(() => {
    const clearTooltips = () => {
      if (tooltipTimeoutRef.current) { clearTimeout(tooltipTimeoutRef.current); tooltipTimeoutRef.current = null; }
      if (noteTooltipTimeoutRef.current) { clearTimeout(noteTooltipTimeoutRef.current); noteTooltipTimeoutRef.current = null; }
      setHoveredTaskId(null);
      setHoveredNoteCell(null);
    };
    taskEditCell.registerClearCallback(clearTooltips);
    timeOffEditCell.registerClearCallback(clearTooltips);
    return () => {
      taskEditCell.unregisterClearCallback(clearTooltips);
      timeOffEditCell.unregisterClearCallback(clearTooltips);
    };
  }, [taskEditCell, timeOffEditCell]);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      if (noteTooltipTimeoutRef.current) clearTimeout(noteTooltipTimeoutRef.current);
    };
  }, []);

  const toggleTaskSelection = useCallback((taskId) => {
    setSelectedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  }, [setSelectedTasks]);

  const handleTooltipHover = useCallback((event, taskId) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipPosition({ x: rect.right + 8, y: rect.top + rect.height / 2 });
      setHoveredTaskId(taskId);
    }, 1000);
  }, []);

  const handleTooltipLeave = useCallback(() => {
    if (tooltipTimeoutRef.current) { clearTimeout(tooltipTimeoutRef.current); tooltipTimeoutRef.current = null; }
    setHoveredTaskId(null);
  }, []);

  const handleNoteTooltipHover = useCallback((event, taskId, date, details, type = 'task') => {
    if (noteTooltipTimeoutRef.current) clearTimeout(noteTooltipTimeoutRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    noteTooltipTimeoutRef.current = setTimeout(() => {
      setNoteTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 8 });
      setHoveredNoteCell({ taskId, date, details, type });
    }, 500);
  }, []);

  const handleNoteTooltipLeave = useCallback(() => {
    if (noteTooltipTimeoutRef.current) { clearTimeout(noteTooltipTimeoutRef.current); noteTooltipTimeoutRef.current = null; }
    setHoveredNoteCell(null);
  }, []);

  const handleSubmitTimesheets = useCallback(() => {
    openSubmissionPreview();
  }, [openSubmissionPreview]);

  const handleConfirmSubmission = useCallback(async (timesheetIds) => {
    closeSubmissionPreview();
    if (tooltipTimeoutRef.current) { clearTimeout(tooltipTimeoutRef.current); tooltipTimeoutRef.current = null; }
    setHoveredTaskId(null);
    try { await submitTimesheets({ timesheetIds }).unwrap(); } catch (error) {}
  }, [submitTimesheets, closeSubmissionPreview]);

  const handleExport = useCallback(async ({ startDate: exportStartDate, endDate: exportEndDate }) => {
    try {
      const projects = await getTimesheetsForExport({ startDate: exportStartDate, endDate: exportEndDate }).unwrap();
      const selectedTaskIds = new Set(
        Object.entries(selectedTasks).filter(([, isSelected]) => isSelected).map(([taskId]) => String(taskId))
      );

      let projectsToExport = projects;
      if (selectedTaskIds.size > 0) {
        projectsToExport = projects
          .map(project => ({ ...project, tasks: project.tasks.filter(task => selectedTaskIds.has(String(task.task_id))) }))
          .filter(project => project.tasks.length > 0);
      }

      exportTimesheetToExcel(projectsToExport, exportStartDate, exportEndDate, holidays);
    } catch (error) {
      logger.error('Errore durante il caricamento dei dati per l\'export:', error);
    }
  }, [holidays, getTimesheetsForExport, selectedTasks]);

  const handleCellClick = useCallback((taskId, date, currentValue, isSubmitted) => {
    const dateStr = formatDateLocal(date);
    if (!isSubmitted) {
      taskEditCell.handleCellClick(taskId, dateStr, currentValue, { isLocked: false });
    } else {
      const task = allTasksFlat.find(t => t.task_id === taskId);
      if (task) {
        const timesheetData = getTimesheetForDate(task, date);
        openTimesheetDetailsModal(
          { hours: timesheetData.hours || 0, details: timesheetData.details || '' },
          date, task, isSubmitted
        );
      }
    }
  }, [taskEditCell, allTasksFlat, openTimesheetDetailsModal]);

  const handleCellContextMenu = useCallback((e, taskId, date, currentValue, isSubmitted) => {
    e.preventDefault();
    if (currentValue === 0 || !currentValue) return;
    const task = filteredTasks.find(t => t.task_id === taskId);
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'task', data: { taskId, date, currentValue, isSubmitted, task } });
  }, [filteredTasks]);

  const handleContextMenuInsertNotes = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'task') return;
    const { task, date, isSubmitted } = contextMenu.data;
    const timesheetData = getTimesheetForDate(task, date);
    openTimesheetDetailsModal(
      { hours: timesheetData.hours || 0, details: timesheetData.details || '' },
      date, task, isSubmitted
    );
    setContextMenu(null);
  }, [contextMenu, openTimesheetDetailsModal]);

  const handleTimeOffCellClick = useCallback((timeOffTypeId, date, currentValue) => {
    const dateStr = formatDateLocal(date);
    timeOffEditCell.handleCellClick(timeOffTypeId, dateStr, currentValue, { isLocked: false });
  }, [timeOffEditCell]);

  const handleTimeOffCellContextMenu = useCallback((e, timeOffTypeId, date, currentValue) => {
    e.preventDefault();
    if (currentValue === 0 || !currentValue) return;
    const dateStr = formatDateLocal(date);
    const existingTimeOff = timeOffs.find(to => to.time_off_type_id === timeOffTypeId && to.date === dateStr);
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'timeoff', data: { timeOffTypeId, date, currentValue } });
    setContextMenuTimeOffData(existingTimeOff ? { hours: existingTimeOff.hours, details: existingTimeOff.details || '' } : { hours: 0, details: '' });
  }, [timeOffs]);

  const handleTimeOffContextMenuInsertNotes = useCallback(() => {
    if (!contextMenu || contextMenu.type !== 'timeoff') return;
    const { timeOffTypeId, date } = contextMenu.data;
    openTimeOffModal(contextMenuTimeOffData, date, timeOffTypeId);
    setContextMenu(null);
    setContextMenuTimeOffData(null);
  }, [contextMenu, contextMenuTimeOffData, openTimeOffModal]);

  const handleTimeOffCellBlur = useCallback((timeOffTypeId, date, previousValue) => {
    const dateStr = formatDateLocal(date);
    timeOffEditCell.handleCellBlur(timeOffTypeId, dateStr, previousValue);
  }, [timeOffEditCell]);

  const handleTimeOffKeyDown = useCallback((e, timeOffTypeId, date, dateIdx, previousValue) => {
    const dateStr = formatDateLocal(date);
    const navigationConfig = {
      getNextCell: (direction) => {
        const timeOffTypes = ['VACATION', 'OTHER'];
        const currentTypeIdx = timeOffTypes.indexOf(timeOffTypeId);
        if (currentTypeIdx === -1) return null;
        let nextTypeIdx = currentTypeIdx;
        let nextDateIdx = dateIdx;
        const maxAttempts = timeOffTypes.length * dateRange.length;
        let attempts = 0;

        while (attempts < maxAttempts) {
          attempts++;
          switch (direction) {
            case 'right': nextDateIdx += 1; if (nextDateIdx >= dateRange.length) { nextDateIdx = 0; nextTypeIdx += 1; } break;
            case 'left': nextDateIdx -= 1; if (nextDateIdx < 0) { nextDateIdx = dateRange.length - 1; nextTypeIdx -= 1; } break;
            case 'down': nextTypeIdx += 1; break;
            case 'up': nextTypeIdx -= 1; break;
            default: return null;
          }
          if (nextTypeIdx < 0 || nextTypeIdx >= timeOffTypes.length) return null;
          if (nextDateIdx < 0 || nextDateIdx >= dateRange.length) return null;

          const nextTypeId = timeOffTypes[nextTypeIdx];
          const nextDate = dateRange[nextDateIdx];
          const nextDateStr = formatDateLocal(nextDate);
          const isWeekend = nextDate.getDay() === 0 || nextDate.getDay() === 6;
          const isHolidayDay = isHoliday(nextDate, holidays);
          if (!(isWeekend || isHolidayDay)) {
            const nextTimeOffData = getTimeOffForDate(nextTypeId, nextDate, timeOffs);
            return { rowId: nextTypeId, columnKey: nextDateStr, currentValue: nextTimeOffData || '' };
          }
        }
        return null;
      },
    };
    timeOffEditCell.handleKeyDown(e, timeOffTypeId, dateStr, previousValue, navigationConfig);
  }, [timeOffEditCell, dateRange, timeOffs, holidays]);

  const handleTimeOffModalConfirm = useCallback(async (data) => {
    if (!timeOffModalDate || !timeOffModalType) return;
    const dateStr = formatDateLocal(timeOffModalDate);
    try { await saveTimeOff({ timeOffTypeId: timeOffModalType, date: dateStr, hours: data.hours, details: data.details }).unwrap(); } catch (error) {}
    closeTimeOffModal();
  }, [saveTimeOff, timeOffModalDate, timeOffModalType, closeTimeOffModal]);

  const handleTimeOffModalClose = useCallback(() => { closeTimeOffModal(); }, [closeTimeOffModal]);

  const handleTimeOffTotalClick = useCallback((timeOffType) => {
    setSelectedTimeOffTypeForSummary(timeOffType);
    setShowTimeOffSummaryModal(true);
  }, []);

  const handleCloseTimeOffSummaryModal = useCallback(() => {
    setShowTimeOffSummaryModal(false);
    setSelectedTimeOffTypeForSummary(null);
  }, []);

  const handleTimesheetDetailsModalConfirm = useCallback(async (data) => {
    if (!timesheetDetailsModalDate || !timesheetDetailsModalTask) return;
    const dateStr = formatDateLocal(timesheetDetailsModalDate);
    const timesheetData = getTimesheetForDate(timesheetDetailsModalTask, timesheetDetailsModalDate);
    const projectKey = timesheetDetailsModalTask.project_key || null;

    try {
      if (data.hours === 0 && !timesheetDetailsModalIsSubmitted) {
        if (timesheetData.timesheetId) await deleteTimesheet(timesheetData.timesheetId).unwrap();
      } else {
        await saveTimesheet({
          taskId: timesheetDetailsModalTask.task_id, workDate: dateStr, hoursWorked: data.hours,
          notes: null, details: data.details, externalKey: projectKey,
        }).unwrap();
      }
    } catch (error) {}
    closeTimesheetDetailsModal();
  }, [saveTimesheet, deleteTimesheet, timesheetDetailsModalDate, timesheetDetailsModalTask, timesheetDetailsModalIsSubmitted, closeTimesheetDetailsModal]);

  const handleTimesheetDetailsModalClose = useCallback(() => { closeTimesheetDetailsModal(); }, [closeTimesheetDetailsModal]);

  const handleCellBlur = useCallback((taskId, date, previousValue, timesheetId) => {
    const dateStr = formatDateLocal(date);
    taskEditCell.handleCellBlur(taskId, dateStr, previousValue, { timesheetId });
  }, [taskEditCell]);

  const handleKeyDown = useCallback((e, taskId, date, dateIdx, previousValue, timesheetId) => {
    const dateStr = formatDateLocal(date);
    const navigationConfig = {
      getNextCell: (direction) => {
        const taskIdx = filteredTasks.findIndex(t => t.task_id === taskId);
        if (taskIdx === -1) return null;
        let nextTaskIdx = taskIdx;
        let nextDateIdx = dateIdx;
        const maxAttempts = filteredTasks.length * dateRange.length;
        let attempts = 0;

        while (attempts < maxAttempts) {
          attempts++;
          switch (direction) {
            case 'right': nextDateIdx += 1; if (nextDateIdx >= dateRange.length) { nextDateIdx = 0; nextTaskIdx += 1; } break;
            case 'left': nextDateIdx -= 1; if (nextDateIdx < 0) { nextDateIdx = dateRange.length - 1; nextTaskIdx -= 1; } break;
            case 'down': nextTaskIdx += 1; break;
            case 'up': nextTaskIdx -= 1; break;
            default: return null;
          }
          if (nextTaskIdx < 0 || nextTaskIdx >= filteredTasks.length) return null;
          if (nextDateIdx < 0 || nextDateIdx >= dateRange.length) return null;
          const nextTask = filteredTasks[nextTaskIdx];
          const nextDate = dateRange[nextDateIdx];
          const nextDateStr = formatDateLocal(nextDate);
          const nextTimesheetData = getTimesheetForDate(nextTask, nextDate);
          if (!(nextTimesheetData.isSubmitted && nextTimesheetData.hours > 0)) {
            return { rowId: nextTask.task_id, columnKey: nextDateStr, currentValue: nextTimesheetData.hours || '' };
          }
        }
        return null;
      },
    };
    taskEditCell.handleKeyDown(e, taskId, dateStr, previousValue, navigationConfig, { timesheetId });
  }, [taskEditCell, filteredTasks, dateRange]);

  const clearAllFilters = useCallback(() => {
    // These are managed by the parent - we return this for consistency
  }, []);

  const handleTaskTitleClick = useCallback(async (task) => {
    try {
      setLoadingTaskDetails(true);
      const result = await fetchTaskDetails(task.task_id);
      if (result.data) {
        const enrichedDetails = {
          ...result.data,
          project_title: task.project_title,
          client_name: task.client_name,
          client_key: task.client_key,
        };
        setTaskDetailsForModal(enrichedDetails);
        openTaskModal(task);
      }
    } catch (error) {
      logger.error('Errore nel caricamento dei dettagli:', error);
    } finally {
      setLoadingTaskDetails(false);
    }
  }, [fetchTaskDetails, setTaskDetailsForModal, openTaskModal, setLoadingTaskDetails]);

  const handleCloseTaskModal = useCallback(() => { closeTaskModal(); }, [closeTaskModal]);

  const handleUpdateTask = useCallback(async (taskData) => {
    try {
      await updateTaskDetails({ taskId: selectedTaskForModal.task_id, taskDetails: taskData.task_details }).unwrap();
      handleCloseTaskModal();
    } catch (error) {}
  }, [updateTaskDetails, selectedTaskForModal, handleCloseTaskModal]);

  return {
    taskEditCell,
    timeOffEditCell,
    contextMenu, setContextMenu,
    contextMenuTimeOffData, setContextMenuTimeOffData,
    hoveredTaskId, tooltipPosition,
    hoveredNoteCell, noteTooltipPosition,
    showTimeOffSummaryModal, selectedTimeOffTypeForSummary,
    toggleTaskSelection,
    handleTooltipHover, handleTooltipLeave,
    handleNoteTooltipHover, handleNoteTooltipLeave,
    handleSubmitTimesheets, handleConfirmSubmission,
    handleExport,
    handleCellClick, handleCellContextMenu,
    handleContextMenuInsertNotes,
    handleTimeOffCellClick, handleTimeOffCellContextMenu,
    handleTimeOffContextMenuInsertNotes,
    handleTimeOffCellBlur, handleTimeOffKeyDown,
    handleTimeOffModalConfirm, handleTimeOffModalClose,
    handleTimeOffTotalClick, handleCloseTimeOffSummaryModal,
    handleTimesheetDetailsModalConfirm, handleTimesheetDetailsModalClose,
    handleCellBlur, handleKeyDown,
    handleTaskTitleClick, handleCloseTaskModal, handleUpdateTask,
  };
}

export default useTimesheetActions;
