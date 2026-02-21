import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { isWeekend, isHoliday } from '../../utils/date/workingDays';
import { ExpandCollapseButton, NoteIndicator } from '../ui/table';
import { PeriodNavigator } from '../ui/filters';
import { useLocale } from '../../hooks/useLocale';

const TimesheetGridTable = ({
  tasks = [],
  holidays = [],
  selectable = false,
  selectedTimesheetIds = new Set(),
  onSelectionChange,
}) => {
  const { t } = useTranslation(['planning', 'common']);
  const locale = useLocale();
  const [expandedClients, setExpandedClients] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});

  const [hoveredNoteCell, setHoveredNoteCell] = useState(null);
  const [noteTooltipPosition, setNoteTooltipPosition] = useState({ x: 0, y: 0 });
  const noteTimeoutRef = useRef(null);

  const containerRef = useRef(null);

  const [weekOffset, setWeekOffset] = useState(0);

  const NUM_COLUMNS = 14;

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const allAvailableDates = useMemo(() => {
    if (tasks.length === 0) return [];

    let minDate = null;
    let maxDate = null;

    tasks.forEach(task => {
      task.timesheets.forEach(ts => {
        const tsDate = new Date(ts.timesheet_date);
        if (!minDate || tsDate < minDate) minDate = new Date(tsDate);
        if (!maxDate || tsDate > maxDate) maxDate = new Date(tsDate);
      });
    });

    if (!minDate || !maxDate) return [];

    const allDates = [];
    const currentDate = new Date(minDate);
    currentDate.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);

    while (currentDate <= maxDate) {
      allDates.push(formatDateKey(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return allDates;
  }, [tasks]);

  const totalPages = useMemo(() => {
    return Math.ceil(allAvailableDates.length / NUM_COLUMNS) || 1;
  }, [allAvailableDates, NUM_COLUMNS]);

  const uniqueDates = useMemo(() => {
    if (allAvailableDates.length === 0) return [];

    const startIdx = weekOffset * NUM_COLUMNS;
    const endIdx = startIdx + NUM_COLUMNS;

    let pageDates = allAvailableDates.slice(startIdx, endIdx);

    if (pageDates.length < NUM_COLUMNS && pageDates.length > 0) {
      const lastDate = new Date(pageDates[pageDates.length - 1]);
      while (pageDates.length < NUM_COLUMNS) {
        lastDate.setDate(lastDate.getDate() + 1);
        pageDates.push(formatDateKey(lastDate));
      }
    }

    return pageDates;
  }, [allAvailableDates, weekOffset, NUM_COLUMNS]);

  const goToPreviousPeriod = useCallback(() => {
    setWeekOffset(prev => Math.max(0, prev - 1));
  }, []);

  const goToNextPeriod = useCallback(() => {
    setWeekOffset(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  const goToStart = useCallback(() => {
    setWeekOffset(0);
  }, []);

  const isAtStart = weekOffset === 0;
  const isAtEnd = weekOffset >= totalPages - 1;

  const getPeriodLabel = useCallback(() => {
    if (uniqueDates.length === 0) return '';

    const startDate = new Date(uniqueDates[0]);
    const endDate = new Date(uniqueDates[uniqueDates.length - 1]);

    const formatOptions = { day: 'numeric', month: 'short' };
    const startStr = startDate.toLocaleDateString(locale, formatOptions);
    const endStr = endDate.toLocaleDateString(locale, { ...formatOptions, year: 'numeric' });

    return `${startStr} - ${endStr}`;
  }, [uniqueDates]);

  const isNonWorkingDay = useCallback((dateStr) => {
    const date = new Date(dateStr);
    return isWeekend(date) || isHoliday(date, holidays);
  }, [holidays]);

  const getHolidayName = useCallback((dateStr) => {
    const date = new Date(dateStr);
    const holiday = holidays.find(h => {
      const holidayDate = new Date(h.date);
      if (h.is_recurring) {
        return date.getMonth() === holidayDate.getMonth() && date.getDate() === holidayDate.getDate();
      }
      return formatDateKey(date) === formatDateKey(holidayDate);
    });
    return holiday?.name || null;
  }, [holidays]);

  const allTimesheetIds = useMemo(() => {
    const ids = new Set();
    tasks.forEach(task => {
      task.timesheets.forEach(ts => {
        ids.add(ts.timesheet_id);
      });
    });
    return ids;
  }, [tasks]);

  const groupedData = useMemo(() => {
    const typeGroups = {
      PROJECT: { label: t('planning:plannedActivities'), clients: new Map() },
      TM: { label: t('planning:calendarActivities'), clients: new Map() }
    };

    tasks.forEach(task => {
      const typeKey = task.project_type_id || 'PROJECT';
      const clientKey = task.client_id;
      const projectKey = task.project_id;

      const typeGroup = typeGroups[typeKey] || typeGroups.PROJECT;
      const clientsMap = typeGroup.clients;

      if (!clientsMap.has(clientKey)) {
        clientsMap.set(clientKey, {
          client_id: task.client_id,
          client_name: task.client_name,
          client_key: task.client_key,
          client_color: task.client_color,
          projectsMap: new Map(),
        });
      }

      const client = clientsMap.get(clientKey);

      if (!client.projectsMap.has(projectKey)) {
        client.projectsMap.set(projectKey, {
          project_id: task.project_id,
          project_key: task.project_key,
          project_title: task.project_title,
          tasks: [],
        });
      }

      const project = client.projectsMap.get(projectKey);
      project.tasks.push({
        task_id: task.task_id,
        task_number: task.task_number,
        task_title: task.task_title,
        project_id: task.project_id,
        project_key: task.project_key,
        project_title: task.project_title,
        project_type_id: task.project_type_id,
        total_hours: task.total_hours,
        timesheets: task.timesheets,
      });
    });

    const result = [];

    ['PROJECT', 'TM'].forEach(typeKey => {
      const typeGroup = typeGroups[typeKey];
      if (typeGroup.clients.size > 0) {
        const clients = Array.from(typeGroup.clients.values()).map(client => ({
          client_id: client.client_id,
          client_name: client.client_name,
          client_key: client.client_key,
          client_color: client.client_color,
          projects: Array.from(client.projectsMap.values())
            .map(project => ({
              ...project,
              tasks: project.tasks.sort((a, b) => (a.task_number || 0) - (b.task_number || 0)),
            }))
            .sort((a, b) => (a.project_key || '').localeCompare(b.project_key || '')),
        }));

        result.push({
          type_id: typeKey,
          type_label: typeGroup.label,
          clients: clients
        });
      }
    });

    return result;
  }, [tasks]);

  const grandTotal = useMemo(() => {
    let total = 0;
    tasks.forEach(task => {
      task.timesheets.forEach(ts => {
        if (uniqueDates.includes(ts.timesheet_date)) {
          total += ts.hours;
        }
      });
    });
    return total;
  }, [tasks, uniqueDates]);

  const dailyTotals = useMemo(() => {
    const totals = {};
    uniqueDates.forEach(date => {
      totals[date] = { total: 0, selected: 0 };
    });
    tasks.forEach(task => {
      task.timesheets.forEach(ts => {
        if (totals[ts.timesheet_date]) {
          totals[ts.timesheet_date].total += ts.hours;
          if (!selectable || selectedTimesheetIds.size === 0 || selectedTimesheetIds.has(ts.timesheet_id)) {
            totals[ts.timesheet_date].selected += ts.hours;
          }
        }
      });
    });
    return totals;
  }, [tasks, uniqueDates, selectable, selectedTimesheetIds]);

  useEffect(() => {
    setExpandedClients({});
    setExpandedProjects({});
    setWeekOffset(0);
  }, [tasks]);

  useEffect(() => {
    return () => {
      if (noteTimeoutRef.current) {
        clearTimeout(noteTimeoutRef.current);
      }
    };
  }, []);

  const toggleClient = (typeId, clientId) => {
    const key = `${typeId}-${clientId}`;
    setExpandedClients(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isClientExpanded = (typeId, clientId) => {
    return expandedClients[`${typeId}-${clientId}`] || false;
  };

  const toggleProject = (typeId, clientId, projectId) => {
    const key = `${typeId}-${clientId}-${projectId}`;
    setExpandedProjects(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isProjectExpanded = (typeId, clientId, projectId) => {
    return expandedProjects[`${typeId}-${clientId}-${projectId}`] || false;
  };

  const isAllClientsExpanded = useMemo(() => {
    if (groupedData.length === 0) return false;
    return groupedData.every(typeGroup =>
      typeGroup.clients.every(client => expandedClients[`${typeGroup.type_id}-${client.client_id}`])
    );
  }, [groupedData, expandedClients]);

  const toggleAllClients = () => {
    if (isAllClientsExpanded) {
      setExpandedClients({});
      setExpandedProjects({});
    } else {
      const allClientsExpanded = {};
      const allProjectsExpanded = {};
      groupedData.forEach(typeGroup => {
        typeGroup.clients.forEach(client => {
          allClientsExpanded[`${typeGroup.type_id}-${client.client_id}`] = true;
          client.projects.forEach(project => {
            allProjectsExpanded[`${typeGroup.type_id}-${client.client_id}-${project.project_id}`] = true;
          });
        });
      });
      setExpandedClients(allClientsExpanded);
      setExpandedProjects(allProjectsExpanded);
    }
  };

  const getTimesheetForTaskDate = (task, dateStr) => {
    return task.timesheets.find(ts => ts.timesheet_date === dateStr);
  };

  const clientTotals = useMemo(() => {
    const totals = {};
    groupedData.forEach(typeGroup => {
      typeGroup.clients.forEach(client => {
        const key = `${typeGroup.type_id}-${client.client_id}`;
        let clientTotal = 0;
        client.projects.forEach(project => {
          project.tasks.forEach(task => {
            task.timesheets.forEach(ts => {
              if (uniqueDates.includes(ts.timesheet_date)) {
                clientTotal += ts.hours;
              }
            });
          });
        });
        totals[key] = clientTotal;
      });
    });
    return totals;
  }, [groupedData, uniqueDates]);

  const projectTotals = useMemo(() => {
    const totals = {};
    groupedData.forEach(typeGroup => {
      typeGroup.clients.forEach(client => {
        client.projects.forEach(project => {
          const key = `${client.client_id}-${project.project_id}`;
          let projectTotal = 0;
          project.tasks.forEach(task => {
            task.timesheets.forEach(ts => {
              if (uniqueDates.includes(ts.timesheet_date)) {
                projectTotal += ts.hours;
              }
            });
          });
          totals[key] = projectTotal;
        });
      });
    });
    return totals;
  }, [groupedData, uniqueDates]);

  const taskTotals = useMemo(() => {
    const totals = {};
    tasks.forEach(task => {
      let taskTotal = 0;
      task.timesheets.forEach(ts => {
        if (uniqueDates.includes(ts.timesheet_date)) {
          taskTotal += ts.hours;
        }
      });
      totals[task.task_id] = taskTotal;
    });
    return totals;
  }, [tasks, uniqueDates]);

  const clientDailyTotals = useMemo(() => {
    const totals = {};
    groupedData.forEach(typeGroup => {
      typeGroup.clients.forEach(client => {
        const key = `${typeGroup.type_id}-${client.client_id}`;
        totals[key] = {};
        uniqueDates.forEach(dateStr => {
          let hours = 0;
          let timesheetIds = [];
          client.projects.forEach(project => {
            project.tasks.forEach(task => {
              const ts = task.timesheets.find(t => t.timesheet_date === dateStr);
              if (ts) {
                hours += ts.hours;
                timesheetIds.push(ts.timesheet_id);
              }
            });
          });
          totals[key][dateStr] = { hours, timesheetIds };
        });
      });
    });
    return totals;
  }, [groupedData, uniqueDates]);

  const projectDailyTotals = useMemo(() => {
    const totals = {};
    groupedData.forEach(typeGroup => {
      typeGroup.clients.forEach(client => {
        client.projects.forEach(project => {
          const key = `${client.client_id}-${project.project_id}`;
          totals[key] = {};
          uniqueDates.forEach(dateStr => {
            let hours = 0;
            let timesheetIds = [];
            project.tasks.forEach(task => {
              const ts = task.timesheets.find(t => t.timesheet_date === dateStr);
              if (ts) {
                hours += ts.hours;
                timesheetIds.push(ts.timesheet_id);
              }
            });
            totals[key][dateStr] = { hours, timesheetIds };
          });
        });
      });
    });
    return totals;
  }, [groupedData, uniqueDates]);

  const updateSelection = useCallback((updater) => {
    if (!selectable || !onSelectionChange) return;
    onSelectionChange(updater);
  }, [selectable, onSelectionChange]);

  const toggleClientDateSelection = useCallback((typeId, clientId, dateStr) => {
    const key = `${typeId}-${clientId}`;
    const { timesheetIds } = clientDailyTotals[key]?.[dateStr] || { timesheetIds: [] };
    if (timesheetIds.length === 0) return;

    const allSelected = timesheetIds.every(id => selectedTimesheetIds.has(id));

    updateSelection(prev => {
      const next = new Set(prev);
      if (allSelected) {
        timesheetIds.forEach(id => next.delete(id));
      } else {
        timesheetIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [clientDailyTotals, selectedTimesheetIds, updateSelection]);

  const isClientDateFullySelected = useCallback((typeId, clientId, dateStr) => {
    const key = `${typeId}-${clientId}`;
    const { timesheetIds } = clientDailyTotals[key]?.[dateStr] || { timesheetIds: [] };
    return timesheetIds.length > 0 && timesheetIds.every(id => selectedTimesheetIds.has(id));
  }, [clientDailyTotals, selectedTimesheetIds]);

  const isClientDatePartiallySelected = useCallback((typeId, clientId, dateStr) => {
    const key = `${typeId}-${clientId}`;
    const { timesheetIds } = clientDailyTotals[key]?.[dateStr] || { timesheetIds: [] };
    const selectedCount = timesheetIds.filter(id => selectedTimesheetIds.has(id)).length;
    return selectedCount > 0 && selectedCount < timesheetIds.length;
  }, [clientDailyTotals, selectedTimesheetIds]);

  const toggleClientSelection = useCallback((typeId, clientId) => {
    const key = `${typeId}-${clientId}`;
    const allTimesheetIdsForClient = [];
    uniqueDates.forEach(dateStr => {
      const { timesheetIds } = clientDailyTotals[key]?.[dateStr] || { timesheetIds: [] };
      allTimesheetIdsForClient.push(...timesheetIds);
    });
    if (allTimesheetIdsForClient.length === 0) return;

    const allSelected = allTimesheetIdsForClient.every(id => selectedTimesheetIds.has(id));

    updateSelection(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allTimesheetIdsForClient.forEach(id => next.delete(id));
      } else {
        allTimesheetIdsForClient.forEach(id => next.add(id));
      }
      return next;
    });
  }, [clientDailyTotals, uniqueDates, selectedTimesheetIds, updateSelection]);

  const toggleProjectSelection = useCallback((clientId, projectId) => {
    const key = `${clientId}-${projectId}`;
    const allTimesheetIdsForProject = [];
    uniqueDates.forEach(dateStr => {
      const { timesheetIds } = projectDailyTotals[key]?.[dateStr] || { timesheetIds: [] };
      allTimesheetIdsForProject.push(...timesheetIds);
    });
    if (allTimesheetIdsForProject.length === 0) return;

    const allSelected = allTimesheetIdsForProject.every(id => selectedTimesheetIds.has(id));

    updateSelection(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allTimesheetIdsForProject.forEach(id => next.delete(id));
      } else {
        allTimesheetIdsForProject.forEach(id => next.add(id));
      }
      return next;
    });
  }, [projectDailyTotals, uniqueDates, selectedTimesheetIds, updateSelection]);

  const toggleProjectDateSelection = useCallback((clientId, projectId, dateStr) => {
    const key = `${clientId}-${projectId}`;
    const { timesheetIds } = projectDailyTotals[key][dateStr];
    if (timesheetIds.length === 0) return;

    const allSelected = timesheetIds.every(id => selectedTimesheetIds.has(id));

    updateSelection(prev => {
      const next = new Set(prev);
      if (allSelected) {
        timesheetIds.forEach(id => next.delete(id));
      } else {
        timesheetIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [projectDailyTotals, selectedTimesheetIds, updateSelection]);

  const isProjectDateFullySelected = useCallback((clientId, projectId, dateStr) => {
    const key = `${clientId}-${projectId}`;
    const { timesheetIds } = projectDailyTotals[key]?.[dateStr] || { timesheetIds: [] };
    return timesheetIds.length > 0 && timesheetIds.every(id => selectedTimesheetIds.has(id));
  }, [projectDailyTotals, selectedTimesheetIds]);

  const isProjectDatePartiallySelected = useCallback((clientId, projectId, dateStr) => {
    const key = `${clientId}-${projectId}`;
    const { timesheetIds } = projectDailyTotals[key]?.[dateStr] || { timesheetIds: [] };
    const selectedCount = timesheetIds.filter(id => selectedTimesheetIds.has(id)).length;
    return selectedCount > 0 && selectedCount < timesheetIds.length;
  }, [projectDailyTotals, selectedTimesheetIds]);

  const toggleTimesheetSelection = useCallback((timesheetId) => {
    updateSelection(prev => {
      const next = new Set(prev);
      if (next.has(timesheetId)) {
        next.delete(timesheetId);
      } else {
        next.add(timesheetId);
      }
      return next;
    });
  }, [updateSelection]);

  const toggleTaskSelection = useCallback((task) => {
    const taskTimesheetIds = task.timesheets.map(ts => ts.timesheet_id);
    const allSelected = taskTimesheetIds.every(id => selectedTimesheetIds.has(id));

    updateSelection(prev => {
      const next = new Set(prev);
      if (allSelected) {
        taskTimesheetIds.forEach(id => next.delete(id));
      } else {
        taskTimesheetIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [selectedTimesheetIds, updateSelection]);

  const toggleDateSelection = useCallback((dateStr) => {
    const dateTimesheetIds = [];
    tasks.forEach(task => {
      task.timesheets.forEach(ts => {
        if (ts.timesheet_date === dateStr) {
          dateTimesheetIds.push(ts.timesheet_id);
        }
      });
    });
    const allSelected = dateTimesheetIds.every(id => selectedTimesheetIds.has(id));

    updateSelection(prev => {
      const next = new Set(prev);
      if (allSelected) {
        dateTimesheetIds.forEach(id => next.delete(id));
      } else {
        dateTimesheetIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [tasks, selectedTimesheetIds, updateSelection]);

  const isDateFullySelected = useCallback((dateStr) => {
    const dateTimesheetIds = [];
    tasks.forEach(task => {
      task.timesheets.forEach(ts => {
        if (ts.timesheet_date === dateStr) {
          dateTimesheetIds.push(ts.timesheet_id);
        }
      });
    });
    return dateTimesheetIds.length > 0 && dateTimesheetIds.every(id => selectedTimesheetIds.has(id));
  }, [tasks, selectedTimesheetIds]);

  const toggleSelectAll = useCallback(() => {
    if (selectedTimesheetIds.size === allTimesheetIds.size) {
      updateSelection(new Set());
    } else {
      updateSelection(new Set(allTimesheetIds));
    }
  }, [selectedTimesheetIds, allTimesheetIds, updateSelection]);

  const isAllSelected = selectedTimesheetIds.size === allTimesheetIds.size && allTimesheetIds.size > 0;

  const handleNoteTooltipHover = useCallback((event, timesheetId, details) => {
    if (noteTimeoutRef.current) {
      clearTimeout(noteTimeoutRef.current);
    }

    const rect = event.currentTarget.getBoundingClientRect();

    noteTimeoutRef.current = setTimeout(() => {
      setNoteTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
      setHoveredNoteCell({ timesheetId, details });
    }, 300);
  }, []);

  const handleNoteTooltipLeave = useCallback(() => {
    if (noteTimeoutRef.current) {
      clearTimeout(noteTimeoutRef.current);
      noteTimeoutRef.current = null;
    }
    setHoveredNoteCell(null);
  }, []);

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
    return { dayMonth: `${day}/${month}`, weekday };
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        {selectable ? (
          <button
            onClick={toggleSelectAll}
            className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
          >
            {isAllSelected ? t('common:deselectAll') : t('common:selectAll')}
          </button>
        ) : (
          <div />
        )}

        {totalPages > 1 && (
          <PeriodNavigator
            onPrevious={goToPreviousPeriod}
            onNext={goToNextPeriod}
            onToday={goToStart}
            isPreviousDisabled={isAtStart}
            isNextDisabled={isAtEnd}
            isTodayDisabled={isAtStart}
            label={getPeriodLabel()}
            todayLabel={t('common:start')}
            size="sm"
          />
        )}
      </div>

      <div ref={containerRef} className="bg-white rounded-lg shadow border border-gray-200 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-320px)]">
        <table className="border-collapse text-sm w-full table-fixed">
          <colgroup>
            <col className="w-8" />
            <col className="w-[200px]" />
            <col className="w-10" />
            {uniqueDates.map(dateStr => (
              <col key={dateStr} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20 bg-gray-50">
            <tr>
              <th className="sticky left-0 z-30 px-1 py-2 border-b border-gray-200 bg-cyan-700">
                <ExpandCollapseButton
                  onClick={toggleAllClients}
                  isExpanded={isAllClientsExpanded}
                  expandedTitle={t('common:collapseAll')}
                  collapsedTitle={t('common:expandAll')}
                  color="white"
                  size="sm"
                />
              </th>
              <th className="sticky z-30 px-2 py-2 text-left text-xs font-semibold text-white border-b border-gray-200 bg-cyan-700 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
                {t('planning:clientProjectTask')}
              </th>
              <th className="px-1 py-2 text-center text-xs font-semibold text-white border-b border-r border-gray-200 bg-cyan-800">
                {t('planning:tot')}
              </th>
              {uniqueDates.map(dateStr => {
                const { dayMonth, weekday } = formatDateHeader(dateStr);
                const isFullySelected = selectable && isDateFullySelected(dateStr);
                const nonWorking = isNonWorkingDay(dateStr);
                const holidayName = getHolidayName(dateStr);
                return (
                  <th
                    key={dateStr}
                    onClick={selectable ? () => toggleDateSelection(dateStr) : undefined}
                    className={`px-0 py-1 text-center border-b border-r border-gray-200 ${selectable ? 'cursor-pointer' : ''} transition-colors ${
                      nonWorking
                        ? (isFullySelected ? 'bg-gray-700' : 'bg-gray-600 hover:bg-gray-700')
                        : (isFullySelected ? 'bg-cyan-800' : 'bg-cyan-700 hover:bg-cyan-800')
                    } text-white`}
                    title={holidayName || undefined}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-semibold text-white">{dayMonth}</span>
                      <span className={`text-[9px] ${nonWorking ? 'text-gray-200' : 'text-cyan-100'}`}>{weekday}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groupedData.map((typeGroup) => (
              <React.Fragment key={typeGroup.type_id}>
                <tr className="bg-cyan-800">
                  <td
                    colSpan={3 + uniqueDates.length}
                    className="sticky left-0 z-10 px-3 py-2 border-b border-gray-300"
                  >
                    <span className="font-bold text-white text-xs uppercase tracking-wide">{typeGroup.type_label}</span>
                  </td>
                </tr>

                {typeGroup.clients.map((client) => {
                  const clientKey = `${typeGroup.type_id}-${client.client_id}`;
                  return (
                  <React.Fragment key={clientKey}>
                    <tr className="bg-gray-100">
                      <td
                        className="sticky left-0 z-10 px-1 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-200 bg-gray-100"
                        style={{ borderLeft: `4px solid ${client.client_color || '#3B82F6'}` }}
                        onClick={() => toggleClient(typeGroup.type_id, client.client_id)}
                      >
                        {isClientExpanded(typeGroup.type_id, client.client_id) ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                      </td>
                      <td
                        className={`sticky z-10 px-2 py-2 border-b border-gray-200 bg-gray-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)] max-w-0 ${selectable ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                        onClick={selectable ? () => toggleClientSelection(typeGroup.type_id, client.client_id) : undefined}
                      >
                        <span className="font-semibold text-gray-800 text-xs truncate block">{client.client_name}</span>
                      </td>
                      <td className="px-1 py-1 text-center border-b border-r border-gray-200 bg-cyan-50">
                        <span className="text-xs font-bold text-cyan-700">{clientTotals[clientKey]?.toFixed(1) || '0.0'}</span>
                      </td>
                      {uniqueDates.map(dateStr => {
                        const isExpanded = isClientExpanded(typeGroup.type_id, client.client_id);
                        const { hours } = clientDailyTotals[clientKey]?.[dateStr] || { hours: 0 };
                        const isFullySelected = selectable && isClientDateFullySelected(typeGroup.type_id, client.client_id, dateStr);
                        const isPartially = selectable && isClientDatePartiallySelected(typeGroup.type_id, client.client_id, dateStr);
                        const nonWorking = isNonWorkingDay(dateStr);
                        if (isExpanded) return <td key={dateStr} className={`border-b border-r border-gray-200 ${nonWorking ? 'bg-gray-300' : 'bg-gray-100'}`} />;
                        return (
                          <td key={dateStr} className={`border-b border-r border-gray-200 px-0 py-1 ${nonWorking ? 'bg-gray-300' : 'bg-gray-100'}`}>
                            {hours > 0 ? (
                              <div
                                onClick={selectable ? () => toggleClientDateSelection(typeGroup.type_id, client.client_id, dateStr) : undefined}
                                className={`flex items-center justify-center py-1 rounded ${selectable ? 'cursor-pointer' : ''} ${isFullySelected ? 'bg-cyan-200' : isPartially ? 'bg-cyan-100' : selectable ? 'hover:bg-gray-200' : ''}`}
                              >
                                <span className={`text-[10px] font-semibold ${isFullySelected ? 'text-cyan-700' : isPartially ? 'text-cyan-600' : 'text-gray-700'}`}>{hours.toFixed(1)}</span>
                              </div>
                            ) : <span className="text-[10px] text-gray-300 text-center block">-</span>}
                          </td>
                        );
                      })}
                    </tr>

                    {isClientExpanded(typeGroup.type_id, client.client_id) && client.projects.map((project) => {
                      const projectKey = `${client.client_id}-${project.project_id}`;
                      const isProjectExp = isProjectExpanded(typeGroup.type_id, client.client_id, project.project_id);
                      return (
                        <React.Fragment key={projectKey}>
                          <tr className="bg-gray-50">
                            <td className="sticky left-0 z-10 px-1 pl-3 py-1.5 border-b border-gray-200 cursor-pointer hover:bg-gray-200 bg-gray-50" onClick={() => toggleProject(typeGroup.type_id, client.client_id, project.project_id)}>
                              {isProjectExp ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
                            </td>
                            <td
                              className={`sticky z-10 px-2 py-1.5 border-b border-gray-200 bg-gray-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)] max-w-0 ${selectable ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                              onClick={selectable ? () => toggleProjectSelection(client.client_id, project.project_id) : undefined}
                            >
                              <div className="flex items-center overflow-hidden">
                                <span className="text-[10px] font-semibold text-gray-700 shrink-0">{project.project_key}</span>
                                <span className="text-[10px] text-gray-500 ml-1 truncate">{project.project_title}</span>
                              </div>
                            </td>
                            <td className="px-1 py-1 text-center border-b border-r border-gray-200 bg-cyan-50/50">
                              <span className="text-[10px] font-semibold text-cyan-600">{projectTotals[projectKey]?.toFixed(1) || '0.0'}</span>
                            </td>
                            {uniqueDates.map(dateStr => {
                              const { hours } = projectDailyTotals[projectKey]?.[dateStr] || { hours: 0 };
                              const isFullySelected = selectable && isProjectDateFullySelected(client.client_id, project.project_id, dateStr);
                              const isPartially = selectable && isProjectDatePartiallySelected(client.client_id, project.project_id, dateStr);
                              const nonWorking = isNonWorkingDay(dateStr);
                              if (isProjectExp) return <td key={dateStr} className={`border-b border-r border-gray-200 ${nonWorking ? 'bg-gray-300' : 'bg-gray-50'}`} />;
                              return (
                                <td key={dateStr} className={`border-b border-r border-gray-200 px-0 py-1 ${nonWorking ? 'bg-gray-300' : 'bg-gray-50'}`}>
                                  {hours > 0 ? (
                                    <div
                                      onClick={selectable ? () => toggleProjectDateSelection(client.client_id, project.project_id, dateStr) : undefined}
                                      className={`flex items-center justify-center py-0.5 rounded ${selectable ? 'cursor-pointer' : ''} ${isFullySelected ? 'bg-cyan-200' : isPartially ? 'bg-cyan-100' : selectable ? 'hover:bg-gray-200' : ''}`}
                                    >
                                      <span className={`text-[10px] font-semibold ${isFullySelected ? 'text-cyan-700' : isPartially ? 'text-cyan-600' : 'text-gray-600'}`}>{hours.toFixed(1)}</span>
                                    </div>
                                  ) : <span className="text-[10px] text-gray-300 text-center block">-</span>}
                                </td>
                              );
                            })}
                          </tr>

                          {isProjectExp && project.tasks.map((task) => (
                            <tr key={task.task_id} className="hover:bg-gray-50">
                              <td
                                className={`sticky left-0 z-10 px-1 py-1.5 border-b border-gray-200 bg-white ${selectable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                onClick={selectable ? () => toggleTaskSelection(task) : undefined}
                              />
                              <td
                                className={`sticky z-10 px-2 py-1.5 border-b border-gray-200 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)] max-w-0 ${selectable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                onClick={selectable ? () => toggleTaskSelection(task) : undefined}
                              >
                                <div className="flex items-center overflow-hidden">
                                  <span className="text-[10px] font-medium text-gray-500 shrink-0">#{task.task_number}</span>
                                  <span className="text-[10px] text-gray-700 ml-1 truncate">{task.task_title}</span>
                                </div>
                              </td>
                              <td className="px-1 py-1 text-center border-b border-r border-gray-200 bg-white">
                                <span className="text-[10px] font-medium text-gray-600">{taskTotals[task.task_id]?.toFixed(1) || '0.0'}</span>
                              </td>
                              {uniqueDates.map(dateStr => {
                                const ts = getTimesheetForTaskDate(task, dateStr);
                                const isSelected = selectable && ts && selectedTimesheetIds.has(ts.timesheet_id);
                                const nonWorking = isNonWorkingDay(dateStr);
                                return (
                                  <td
                                    key={dateStr}
                                    onClick={selectable && ts ? () => toggleTimesheetSelection(ts.timesheet_id) : undefined}
                                    className={`px-0 py-1 text-center border-b border-r border-gray-200 ${nonWorking ? 'bg-gray-200' : ''} ${selectable && ts ? 'cursor-pointer' : ''}`}
                                  >
                                    {ts ? (
                                      <div
                                        className={`relative flex items-center justify-center py-1 rounded ${isSelected ? 'bg-cyan-200' : selectable ? 'hover:bg-gray-100' : ''}`}
                                        onMouseEnter={ts.details ? (e) => handleNoteTooltipHover(e, ts.timesheet_id, ts.details) : undefined}
                                        onMouseLeave={ts.details ? handleNoteTooltipLeave : undefined}
                                      >
                                        {ts.details && (
                                          <div className="absolute top-0 left-0 w-0 h-0 border-t-[5px] border-t-blue-600 border-r-[5px] border-r-transparent" />
                                        )}
                                        <span className={`text-[10px] font-semibold ${isSelected ? 'text-cyan-700' : 'text-gray-700'}`}>{ts.hours.toFixed(1)}</span>
                                      </div>
                                    ) : <span className="text-[10px] text-gray-300">-</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 z-20">
            <tr className="bg-cyan-700 text-white">
              <td className="sticky left-0 z-30 px-1 py-2 border-t-2 border-cyan-800 bg-cyan-700" />
              <td className="sticky z-30 px-2 py-2 border-t-2 border-cyan-800 text-right bg-cyan-700 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
                <span className="text-xs font-bold">{t('common:total').toUpperCase()}</span>
              </td>
              <td className="px-1 py-2 text-center border-t-2 border-r border-cyan-800 bg-cyan-800">
                <span className="text-xs font-bold">{grandTotal.toFixed(1)}</span>
              </td>
              {uniqueDates.map(dateStr => {
                const nonWorking = isNonWorkingDay(dateStr);
                return (
                  <td key={dateStr} className={`px-0 py-2 text-center border-t-2 border-r border-cyan-800 ${nonWorking ? 'bg-cyan-600' : ''}`}>
                    <span className="text-[10px] font-bold">{(dailyTotals[dateStr]?.total || 0).toFixed(1)}</span>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <NoteIndicator.Tooltip
        note={hoveredNoteCell?.details}
        position={noteTooltipPosition}
        visible={!!hoveredNoteCell?.details}
      />
    </div>
  );
};

export default TimesheetGridTable;
