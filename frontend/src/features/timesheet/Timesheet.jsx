import React, { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import ContextMenu from "../../shared/ui/ContextMenu";
import { useTimesheetData } from "./hooks/useTimesheetData";
import { useTimesheetCalculations } from "./hooks/useTimesheetCalculations";
import { useTimesheetModals } from "./hooks/useTimesheetModals";
import { useTimesheetActions } from "./hooks/useTimesheetActions";
import { formatDateLocal, generateDateRange } from "../../utils/table/tableUtils";
import { getColumnCountForWidth } from "../../constants/breakpoints";
import TimesheetHeader from "./components/TimesheetHeader";
import TimesheetTable from "./components/TimesheetTable";
import { useLocale } from "../../hooks/useLocale";

const ExportModal = lazy(() => import("../../shared/components/modals/ExportModal"));
const SubmissionPreviewModal = lazy(() => import("./components/SubmissionPreviewModal"));
const TaskModalTimesheet = lazy(() => import("./components/TaskModalTimesheet"));
const TimeOffModal = lazy(() => import("./components/TimeOffModal"));
const TimesheetDetailsModal = lazy(() => import("./components/TimesheetDetailsModal"));
const TimeOffSummaryModal = lazy(() => import("./components/TimeOffSummaryModal"));

function Timesheet() {
  const { t } = useTranslation(['timesheet', 'common']);
  const locale = useLocale();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const mondayOfCurrentWeek = useMemo(() => {
    const d = new Date(today);
    const dayOfWeek = d.getDay();
    const daysToSubtract = (dayOfWeek + 6) % 7;
    d.setDate(d.getDate() - daysToSubtract);
    return d;
  }, [today]);

  const modals = useTimesheetModals();
  const {
    showExportModal, openExportModal, closeExportModal,
    showSubmissionPreview, openSubmissionPreview, closeSubmissionPreview,
    showTaskModal, selectedTaskForModal, taskDetailsForModal,
    setTaskDetailsForModal, loadingTaskDetails, setLoadingTaskDetails,
    openTaskModal, closeTaskModal,
    showTimeOffModal, timeOffModalData, timeOffModalDate, timeOffModalType,
    openTimeOffModal, closeTimeOffModal,
    showTimesheetDetailsModal, timesheetDetailsModalData,
    timesheetDetailsModalDate, timesheetDetailsModalTask,
    timesheetDetailsModalIsSubmitted,
    openTimesheetDetailsModal, closeTimesheetDetailsModal,
  } = modals;

  const [selectedTasks, setSelectedTasks] = useState({});
  const [selectionFilters, setSelectionFilters] = useState([]);
  const [showTimeOff, setShowTimeOff] = useState(true);
  const [filterClientIds, setFilterClientIds] = useState([]);
  const [filterProjectIds, setFilterProjectIds] = useState([]);
  const [filterProjectType, setFilterProjectType] = useState([]);

  const { projects, loading, timeOffs, timeOffHistoricalTotals, holidays } = useTimesheetData(startDate, endDate);

  const allTasksFlat = useMemo(() =>
    projects
      .filter((project) => project.project_key !== 'CLOSED_ACTIVITIES')
      .flatMap((project) =>
        project.tasks.map((task) => ({
          ...task,
          project_id: project.project_id,
          project_key: project.project_key,
          project_title: project.project_title,
          project_type_id: project.project_type_id,
          client_id: project.client_id,
          client_key: project.client_key,
          client_name: project.client_name,
          client_color: project.client_color,
        }))
      ),
    [projects]
  );

  const numDays = useMemo(() => getColumnCountForWidth(), []);

  useEffect(() => {
    const startDay = new Date(mondayOfCurrentWeek);
    const endDay = new Date(startDay);
    endDay.setDate(endDay.getDate() + numDays - 1);
    setStartDate(formatDateLocal(startDay));
    setEndDate(formatDateLocal(endDay));
  }, [mondayOfCurrentWeek, numDays]);

  const isAtStart = useMemo(() => {
    if (!startDate) return true;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    return start.getTime() === mondayOfCurrentWeek.getTime();
  }, [startDate, mondayOfCurrentWeek]);

  const goToPreviousPeriod = useCallback(() => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - 7);
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + numDays - 1);
    setStartDate(formatDateLocal(newStart));
    setEndDate(formatDateLocal(newEnd));
  }, [startDate, numDays]);

  const goToNextPeriod = useCallback(() => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + 7);
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + numDays - 1);
    setStartDate(formatDateLocal(newStart));
    setEndDate(formatDateLocal(newEnd));
  }, [startDate, numDays]);

  const goToToday = useCallback(() => {
    const startDay = new Date(mondayOfCurrentWeek);
    const endDay = new Date(startDay);
    endDay.setDate(endDay.getDate() + numDays - 1);
    setStartDate(formatDateLocal(startDay));
    setEndDate(formatDateLocal(endDay));
  }, [mondayOfCurrentWeek, numDays]);

  const getPeriodLabel = useCallback(() => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const formatOptions = { day: 'numeric', month: 'short' };
    const startStr = start.toLocaleDateString(locale, formatOptions);
    const endStr = end.toLocaleDateString(locale, { ...formatOptions, year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }, [startDate, endDate, locale]);

  const dateRange = generateDateRange(startDate, endDate);

  const baseFilteredTasks = useMemo(() => {
    return allTasksFlat
      .filter((task) => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          if (!(task.client_key?.toLowerCase().includes(term) || task.client_name?.toLowerCase().includes(term) ||
            task.project_key?.toLowerCase().includes(term) || task.project_title?.toLowerCase().includes(term) ||
            task.task_title?.toLowerCase().includes(term) || task.task_description?.toLowerCase().includes(term))) return false;
        }
        if (filterClientIds.length > 0 && !filterClientIds.includes(task.client_id)) return false;
        if (filterProjectIds.length > 0 && !filterProjectIds.includes(task.project_id)) return false;
        if (filterProjectType.length > 0) {
          const taskProjectType = task.project_type_id || 'PROJECT';
          if (!filterProjectType.includes(taskProjectType)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const clientCompare = (a.client_name || "").localeCompare(b.client_name || "");
        if (clientCompare !== 0) return clientCompare;
        const projectCompare = (a.project_key || "").localeCompare(b.project_key || "");
        if (projectCompare !== 0) return projectCompare;
        return (a.task_number || 0) - (b.task_number || 0);
      });
  }, [allTasksFlat, searchTerm, filterClientIds, filterProjectIds, filterProjectType]);

  const filteredTasks = useMemo(() => {
    if (selectionFilters.length === 0 || selectionFilters.length === 2) return baseFilteredTasks;
    return baseFilteredTasks.filter((task) => {
      if (selectionFilters.includes("selected") && !selectedTasks[task.task_id]) return false;
      if (selectionFilters.includes("unselected") && selectedTasks[task.task_id]) return false;
      return true;
    });
  }, [baseFilteredTasks, selectionFilters, selectedTasks]);

  const filteredProjects = useMemo(() => {
    return projects
      .map((project) => {
        if (project.project_key === 'CLOSED_ACTIVITIES') return project;
        const projectTaskIds = new Set(filteredTasks.filter(t => t.project_id === project.project_id).map(t => t.task_id));
        const tasks = project.tasks.filter(t => projectTaskIds.has(t.task_id));
        if (tasks.length === 0) return null;
        return { ...project, tasks };
      })
      .filter(Boolean);
  }, [projects, filteredTasks]);

  const { getTotalHoursForDate, getGrandTotal, getClosedTasksHoursForDate, getClosedTasksGrandTotal } =
    useTimesheetCalculations(filteredProjects, timeOffs, timeOffHistoricalTotals, selectionFilters, selectedTasks);

  const uniqueClients = useMemo(() =>
    Array.from(
      new Map(projects.filter((p) => p.client_id && p.client_name && p.project_key !== 'CLOSED_ACTIVITIES')
        .map((p) => [p.client_id, { client_id: p.client_id, client_key: p.client_key, client_name: p.client_name, client_color: p.client_color }])
      ).values()
    ).sort((a, b) => (a.client_key || "").localeCompare(b.client_key || "")),
    [projects]
  );

  const uniqueProjects = useMemo(() =>
    Array.from(
      new Map(projects
        .filter(p => p.project_key !== 'CLOSED_ACTIVITIES' && p.project_type_id !== 'TM' && (filterClientIds.length === 0 || filterClientIds.includes(p.client_id)))
        .map((p) => [p.project_id, { project_id: p.project_id, project_key: p.project_key, project_title: p.project_title, client_id: p.client_id, client_key: p.client_key, client_color: p.client_color }])
      ).values()
    ).sort((a, b) => `${a.client_key || ""}-${a.project_key || ""}`.localeCompare(`${b.client_key || ""}-${b.project_key || ""}`)),
    [projects, filterClientIds]
  );

  const actions = useTimesheetActions({
    startDate, endDate, dateRange, projects, holidays, timeOffs, allTasksFlat, filteredTasks,
    selectedTasks, setSelectedTasks,
    openExportModal, closeExportModal, openSubmissionPreview, closeSubmissionPreview,
    openTaskModal, closeTaskModal, setTaskDetailsForModal, setLoadingTaskDetails, selectedTaskForModal,
    openTimeOffModal, closeTimeOffModal, timeOffModalDate, timeOffModalType,
    openTimesheetDetailsModal, closeTimesheetDetailsModal,
    timesheetDetailsModalDate, timesheetDetailsModalTask, timesheetDetailsModalIsSubmitted,
  });

  const {
    taskEditCell, timeOffEditCell,
    contextMenu, setContextMenu, contextMenuTimeOffData, setContextMenuTimeOffData,
    hoveredTaskId, tooltipPosition, hoveredNoteCell, noteTooltipPosition,
    showTimeOffSummaryModal, selectedTimeOffTypeForSummary,
    toggleTaskSelection, handleTooltipHover, handleTooltipLeave,
    handleNoteTooltipHover, handleNoteTooltipLeave,
    handleSubmitTimesheets, handleConfirmSubmission, handleExport,
    handleCellClick, handleCellContextMenu, handleContextMenuInsertNotes,
    handleTimeOffCellClick, handleTimeOffCellContextMenu, handleTimeOffContextMenuInsertNotes,
    handleTimeOffCellBlur, handleTimeOffKeyDown,
    handleTimeOffModalConfirm, handleTimeOffModalClose,
    handleTimeOffTotalClick, handleCloseTimeOffSummaryModal,
    handleTimesheetDetailsModalConfirm, handleTimesheetDetailsModalClose,
    handleCellBlur, handleKeyDown,
    handleTaskTitleClick, handleCloseTaskModal, handleUpdateTask,
  } = actions;

  const clearAllFilters = useCallback(() => {
    setFilterClientIds([]);
    setFilterProjectIds([]);
    setFilterProjectType([]);
    setSelectionFilters([]);
  }, []);

  if (loading && !taskEditCell.editingCell && !timeOffEditCell.editingCell) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6">
          <div className="text-xl">{t('common:loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={[{
            label: t('timesheet:insertNotes'),
            icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
            onClick: contextMenu.type === 'task' ? handleContextMenuInsertNotes : handleTimeOffContextMenuInsertNotes
          }]}
          onClose={() => { setContextMenu(null); setContextMenuTimeOffData(null); }}
        />
      )}

      <Suspense fallback={null}><ExportModal isOpen={showExportModal} onClose={closeExportModal} onExport={handleExport} title={t('timesheet:exportTimesheets')} /></Suspense>
      <Suspense fallback={null}><SubmissionPreviewModal isOpen={showSubmissionPreview} onClose={closeSubmissionPreview} onConfirm={handleConfirmSubmission} /></Suspense>
      <Suspense fallback={null}><TaskModalTimesheet key={taskDetailsForModal?.task_id} isOpen={showTaskModal} onClose={handleCloseTaskModal} onConfirm={handleUpdateTask} task={taskDetailsForModal} projectTitle={selectedTaskForModal?.project_title} clientName={selectedTaskForModal?.client_name} clientKey={selectedTaskForModal?.client_key} /></Suspense>
      <Suspense fallback={null}><TimeOffModal isOpen={showTimeOffModal} onClose={handleTimeOffModalClose} onConfirm={handleTimeOffModalConfirm} timeOffData={timeOffModalData} date={timeOffModalDate} /></Suspense>
      <Suspense fallback={null}><TimesheetDetailsModal isOpen={showTimesheetDetailsModal} onClose={handleTimesheetDetailsModalClose} onConfirm={handleTimesheetDetailsModalConfirm} timesheetData={timesheetDetailsModalData} date={timesheetDetailsModalDate} taskTitle={timesheetDetailsModalTask?.task_title} isSubmitted={timesheetDetailsModalIsSubmitted} /></Suspense>
      <Suspense fallback={null}><TimeOffSummaryModal isOpen={showTimeOffSummaryModal} onClose={handleCloseTimeOffSummaryModal} timeOffType={selectedTimeOffTypeForSummary} /></Suspense>

      <div className="p-4">
        <div className="max-w-full mx-auto">
          <div className="mt-16"></div>

          <TimesheetHeader
            searchTerm={searchTerm} onSearchChange={setSearchTerm}
            selectionFilters={selectionFilters} onSelectionFiltersChange={setSelectionFilters}
            filterClientIds={filterClientIds} onFilterClientIdsChange={setFilterClientIds}
            filterProjectIds={filterProjectIds} onFilterProjectIdsChange={setFilterProjectIds}
            filterProjectType={filterProjectType} onFilterProjectTypeChange={setFilterProjectType}
            uniqueClients={uniqueClients} uniqueProjects={uniqueProjects}
            onClearAllFilters={clearAllFilters} onExport={openExportModal}
            onSubmit={handleSubmitTimesheets} loading={loading}
            onPreviousPeriod={goToPreviousPeriod} onNextPeriod={goToNextPeriod} onToday={goToToday}
            isPreviousDisabled={false} isTodayDisabled={isAtStart} periodLabel={getPeriodLabel()}
          />

          <TimesheetTable
            dateRange={dateRange} filteredTasks={filteredTasks} selectedTasks={selectedTasks}
            editingTaskId={taskEditCell.editingRowId}
            editingCell={taskEditCell.editingCell || timeOffEditCell.editingCell}
            editValue={taskEditCell.editValue || timeOffEditCell.editValue}
            holidays={holidays} timeOffs={timeOffs} timeOffHistoricalTotals={timeOffHistoricalTotals}
            showTimeOff={showTimeOff} selectionFilters={selectionFilters}
            hoveredTaskId={hoveredTaskId} tooltipPosition={tooltipPosition}
            hoveredNoteCell={hoveredNoteCell} noteTooltipPosition={noteTooltipPosition}
            getTotalHoursForDate={getTotalHoursForDate} getGrandTotal={getGrandTotal}
            getClosedTasksHoursForDate={getClosedTasksHoursForDate} getClosedTasksGrandTotal={getClosedTasksGrandTotal}
            onSelectAll={setSelectedTasks} onTaskSelection={toggleTaskSelection}
            onTooltipHover={handleTooltipHover} onTooltipLeave={handleTooltipLeave}
            onNoteTooltipHover={handleNoteTooltipHover} onNoteTooltipLeave={handleNoteTooltipLeave}
            onTaskTitleClick={handleTaskTitleClick}
            onCellClick={handleCellClick} onCellContextMenu={handleCellContextMenu}
            onCellBlur={handleCellBlur} onKeyDown={handleKeyDown}
            onEditValueChange={(value) => {
              if (taskEditCell.editingCell) taskEditCell.handleCellChange(value);
              else if (timeOffEditCell.editingCell) timeOffEditCell.handleCellChange(value);
            }}
            onTimeOffCellClick={handleTimeOffCellClick} onTimeOffCellContextMenu={handleTimeOffCellContextMenu}
            onTimeOffCellBlur={handleTimeOffCellBlur} onTimeOffKeyDown={handleTimeOffKeyDown}
            onTimeOffTotalClick={handleTimeOffTotalClick}
          />
        </div>
      </div>
    </div>
  );
}

export default Timesheet;
