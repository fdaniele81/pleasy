import React, { memo, useMemo, useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Briefcase, FolderKanban, ListTodo, GripVertical } from 'lucide-react';
import { ProjectRow } from "./ProjectRow";
import { TaskRow } from "./TaskRow";
import useTableDateHelpers from "../../../shared/ui/table/useTableDateHelpers";
import {
  TableContainer,
  SelectionCheckbox,
  ExpandCollapseButton,
  TotalsRow,
} from "../../../shared/ui/table";
import {
  formatHours,
  getUnitLabel,
  safeFormatDate,
  isValidDate,
  getGrandTotals,
} from "../utils/helpers";
import { computeMonthMarkers } from "../utils/headerSegments";
import { useLocale } from "../../../hooks/useLocale";

export const PlanningTable = memo(function PlanningTable({
  filteredProjects,
  projects,
  selectedTasks,
  setSelectedTasks,
  toggleTaskSelection,
  toggleProjectSelection,
  expandedProjects,
  toggleProjectExpansion,
  toggleAllProjects,
  editingCell,
  editValue,
  setEditValue,
  handleCellClick,
  handleCellBlur,
  handleKeyDown,
  availableUsers,
  handleStartAddingTask,
  handleDeleteTask,
  handleInitialActualClick,
  handleTaskDetailsClick,
  hideProjectHeaders,
  showInDays,
  showTimeline,
  pushUndo,
  refetchPlanning,
  dateRange,
  columnWidth,
  timelineWidth,
  todayLineOffset,
  setAvailableWidth,
  holidays,
  timeInterval,
  setTimeInterval,
  goToPrevious,
  goToNext,
  goToToday,
  isAtToday,
  periodLabel,
  reorderingProjectId,
  localTaskOrder,
  onStartReordering,
  onSaveReordering,
  onCancelReordering,
  onDragStart,
  onDragOver,
  onDragEnd,
}) {
  const { t } = useTranslation(['planning', 'common']);
  const locale = useLocale();

  const grandTotals = useMemo(() => getGrandTotals(filteredProjects), [filteredProjects]);

  const { globalMinDate, globalMaxDate } = useMemo(() => {
    const startDates = filteredProjects
      .flatMap((p) => p.tasks)
      .filter((task) => task.start_date && isValidDate(task.start_date))
      .map((task) => task.start_date);
    const endDates = filteredProjects
      .flatMap((p) => p.tasks)
      .filter((task) => task.end_date && isValidDate(task.end_date))
      .map((task) => task.end_date);

    return {
      globalMinDate: startDates.length > 0 ? startDates.sort()[0] : null,
      globalMaxDate: endDates.length > 0 ? endDates.sort().reverse()[0] : null
    };
  }, [filteredProjects]);

  const { getDateInfo } = useTableDateHelpers(dateRange || [], holidays || []);

  // Label tooltip (same pattern as Timesheet)
  const [labelTooltip, setLabelTooltip] = useState(null);
  const labelTooltipTimeout = useRef(null);

  const showLabelTooltip = useCallback((e, content) => {
    clearTimeout(labelTooltipTimeout.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const above = rect.bottom + 60 > window.innerHeight;
    labelTooltipTimeout.current = setTimeout(() => {
      setLabelTooltip({
        content,
        x: rect.left + rect.width / 2,
        y: above ? rect.top : rect.bottom,
        above,
      });
    }, 350);
  }, []);

  const hideLabelTooltip = useCallback(() => {
    clearTimeout(labelTooltipTimeout.current);
    setLabelTooltip(null);
  }, []);

  const monthMarkers = useMemo(
    () => computeMonthMarkers(dateRange, columnWidth, locale),
    [dateRange, columnWidth, locale]
  );

  // Measure available width for adaptive column sizing
  const containerRef = useRef(null);
  useEffect(() => {
    if (!showTimeline || !containerRef.current || !setAvailableWidth) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Subtract fixed columns width (~350px: expand 32 + project 200 + status 64 + user 56)
        const fixedWidth = 352;
        setAvailableWidth(Math.max(200, entry.contentRect.width - fixedWidth));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [showTimeline, setAvailableWidth]);

  const allExpanded = useMemo(() =>
    filteredProjects.every((p) => expandedProjects[p.project_id]),
    [filteredProjects, expandedProjects]
  );

  const allSelected = useMemo(() => {
    if (filteredProjects.length === 0) return false;
    const allTasks = filteredProjects.flatMap((p) => p.tasks);
    const allTasksSelected =
      allTasks.length === 0 ||
      allTasks.every((t) => selectedTasks[t.task_id]);
    const emptyProjects = filteredProjects.filter(
      (p) => p.tasks.length === 0
    );
    const allEmptyProjectsSelected =
      emptyProjects.length === 0 ||
      emptyProjects.every((p) => selectedTasks[`project_${p.project_id}`]);
    return allTasksSelected && allEmptyProjectsSelected;
  }, [filteredProjects, selectedTasks]);

  if (filteredProjects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 text-lg">
          {projects.length === 0
            ? t('planning:noProjects')
            : t('planning:noActivitiesMatch')}
        </p>
      </div>
    );
  }

  const handleSelectAll = (e) => {
    const allTaskIds = filteredProjects.flatMap((p) =>
      p.tasks.map((t) => t.task_id)
    );
    const emptyProjectIds = filteredProjects
      .filter((p) => p.tasks.length === 0)
      .map((p) => `project_${p.project_id}`);

    const newSelected = {};
    if (e.target.checked) {
      allTaskIds.forEach((id) => (newSelected[id] = true));
      emptyProjectIds.forEach((id) => (newSelected[id] = true));
    }
    setSelectedTasks(newSelected);
  };

  return (
    <TableContainer maxHeight="calc(100vh - 300px)" overflowX={showTimeline ? 'hidden' : 'auto'}>
      <div ref={containerRef}>
        <table className={`w-full border-separate border-spacing-0 ${showTimeline ? 'table-fixed' : 'table-fixed'}`}>
          <thead>
            {showTimeline ? (
              <>
                {/* Row 1: Column headers + Period controls spanning timeline area */}
                <tr className="bg-cyan-700 text-white text-xs sticky top-0 z-41">
                  <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-8 bg-cyan-700">
                    <ExpandCollapseButton
                      onClick={toggleAllProjects}
                      isExpanded={allExpanded}
                      expandedTitle={t('planning:collapseAllProjects')}
                      collapsedTitle={t('planning:expandAllProjects')}
                      color="white"
                    />
                  </th>
                  <th className="border-t border-r border-gray-300 px-2 py-2 text-left font-semibold w-[200px] max-w-[200px] bg-cyan-700">
                    {t('planning:projectActivity')}
                  </th>
                  <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-16 bg-cyan-700">
                    {t('planning:status')}
                  </th>
                  <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-14 bg-cyan-700">
                    {t('planning:user')}
                  </th>
                  <th
                    className="border-t border-gray-300 px-1 py-1 bg-cyan-700"
                    style={{ width: timelineWidth }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <select
                        value={timeInterval}
                        onChange={(e) => setTimeInterval(parseInt(e.target.value))}
                        className="border border-cyan-500 rounded px-1.5 py-0.5 text-[10px] font-medium bg-cyan-800 text-white hover:bg-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                      >
                        <option value={2}>{t('planning:ganttInterval2w')}</option>
                        <option value={4}>{t('planning:ganttInterval1m')}</option>
                        <option value={13}>{t('planning:ganttInterval3m')}</option>
                        <option value={26}>{t('planning:ganttInterval6m')}</option>
                        <option value={52}>{t('planning:ganttInterval1y')}</option>
                      </select>
                      <button
                        type="button"
                        onClick={goToPrevious}
                        className="p-0.5 rounded border border-cyan-500 text-white hover:bg-cyan-600 transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={goToToday}
                        disabled={isAtToday}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          isAtToday
                            ? 'bg-cyan-500 text-cyan-200 cursor-not-allowed'
                            : 'bg-white text-cyan-700 hover:bg-cyan-100'
                        }`}
                      >
                        {t('common:today')}
                      </button>
                      <button
                        type="button"
                        onClick={goToNext}
                        className="p-0.5 rounded border border-cyan-500 text-white hover:bg-cyan-600 transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                      <span className="text-[10px] font-semibold text-cyan-100 whitespace-nowrap">
                        {periodLabel}
                      </span>
                    </div>
                  </th>
                </tr>

              </>
            ) : (
              <tr className="bg-cyan-700 text-white text-xs sticky top-0 z-40">
                <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-8 bg-cyan-700">
                  <ExpandCollapseButton
                    onClick={toggleAllProjects}
                    isExpanded={allExpanded}
                    expandedTitle={t('planning:collapseAllProjects')}
                    collapsedTitle={t('planning:expandAllProjects')}
                    color="white"
                  />
                </th>
                <th className="border-t border-r border-gray-300 px-2 py-2 text-left font-semibold w-[130px] max-w-[130px] xl:w-[200px] xl:max-w-[200px] bg-cyan-700">
                  {t('planning:projectActivity')}
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-10 xl:w-16 bg-cyan-700">
                  {t('planning:key')}
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-10 xl:w-[90px] bg-cyan-700">
                  {t('planning:status')}
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-10 xl:w-[100px] bg-cyan-700">
                  {t('planning:user')}
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-10 xl:w-[90px] bg-cyan-700">
                  %
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-right font-semibold w-14 xl:w-[60px] bg-cyan-700">
                  {t('planning:bdg')}
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-right font-semibold w-14 xl:w-[60px] bg-cyan-700">
                  {t('planning:act')}
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-right font-semibold w-14 xl:w-[60px] bg-cyan-700">
                  {t('planning:etc')}
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-right font-semibold w-14 xl:w-[60px] bg-cyan-700">
                  {t('planning:eac')}
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-right font-semibold w-16 xl:w-[68px] bg-cyan-700">
                  {t('planning:delta')}
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-[72px] xl:w-20 bg-cyan-700">
                  {t('planning:start')}
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-[72px] xl:w-20 bg-cyan-700">
                  {t('planning:end')}
                </th>
                <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-8 bg-cyan-700"></th>
              </tr>
            )}

            {showTimeline ? (
              <TotalsRow sticky={true} stickyTop={38} stickyZIndex={30} className="">
                <TotalsRow.Cell className="text-center bg-cyan-700">
                  <SelectionCheckbox
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                </TotalsRow.Cell>
                <TotalsRow.Cell
                  className="font-bold text-xs bg-cyan-700"
                  colSpan={3}
                  align="left"
                >
                  {t('planning:period').toUpperCase()}
                </TotalsRow.Cell>
                <TotalsRow.Cell className="p-0 bg-cyan-700 overflow-hidden">
                  <div className="relative h-5" style={{ width: timelineWidth }}>
                    {monthMarkers.map((marker, idx) => (
                      <React.Fragment key={idx}>
                        <div
                          className="absolute top-0 bottom-0 border-l border-cyan-500"
                          style={{ left: marker.pixelOffset }}
                        />
                        {marker.daysInRange >= 7 && (
                          <span
                            className="absolute text-[10px] font-medium text-white whitespace-nowrap capitalize"
                            style={{ left: marker.pixelOffset + 6, top: 2 }}
                          >
                            {marker.label}
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                    {todayLineOffset !== null && (
                      <div
                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-orange-400 pointer-events-none"
                        style={{ left: todayLineOffset }}
                      />
                    )}
                  </div>
                </TotalsRow.Cell>
              </TotalsRow>
            ) : (
              <TotalsRow
                sticky={true}
                stickyTop={38} stickyZIndex={30}
                className=""
              >
                <TotalsRow.Cell className="text-center bg-cyan-700">
                  <SelectionCheckbox
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                </TotalsRow.Cell>
                <TotalsRow.Cell
                  className="font-bold text-xs bg-cyan-700"
                  colSpan={4}
                  align="left"
                >
                  {t('planning:grandTotal')}
                </TotalsRow.Cell>
                <TotalsRow.Cell className="bg-cyan-700">
                  <span className="xl:hidden text-xs font-medium">
                    {grandTotals.progress}%
                  </span>
                  <div className="hidden xl:flex items-center gap-1 justify-center">
                    <div className="flex-1 h-2 bg-cyan-400 rounded-full overflow-hidden min-w-10">
                      <div
                        className="h-full bg-white transition-all"
                        style={{
                          width: `${Math.min(grandTotals.progress || 0, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium w-8 text-right shrink-0">
                      {grandTotals.progress}%
                    </span>
                  </div>
                </TotalsRow.Cell>
                <TotalsRow.Cell
                  align="right"
                  className="font-bold text-xs bg-cyan-700 whitespace-nowrap"
                >
                  {formatHours(grandTotals.budget, showInDays)}
                  {getUnitLabel(showInDays)}
                </TotalsRow.Cell>
                <TotalsRow.Cell
                  align="right"
                  className="font-bold text-xs bg-cyan-700 whitespace-nowrap"
                >
                  {formatHours(grandTotals.actual, showInDays)}
                  {getUnitLabel(showInDays)}
                </TotalsRow.Cell>
                <TotalsRow.Cell
                  align="right"
                  className="font-bold text-xs bg-cyan-700 whitespace-nowrap"
                >
                  {formatHours(grandTotals.etc, showInDays)}
                  {getUnitLabel(showInDays)}
                </TotalsRow.Cell>
                <TotalsRow.Cell
                  align="right"
                  className="font-bold text-xs bg-cyan-700 whitespace-nowrap"
                >
                  {formatHours(grandTotals.eac, showInDays)}
                  {getUnitLabel(showInDays)}
                </TotalsRow.Cell>
                <TotalsRow.Cell className="bg-cyan-700 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-xs font-bold text-white">
                      {grandTotals.delta > 0 ? "+" : ""}
                      {formatHours(grandTotals.delta, showInDays)}
                      {getUnitLabel(showInDays)}
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        grandTotals.delta > 0
                          ? "bg-green-400"
                          : grandTotals.delta === 0
                          ? "bg-gray-400"
                          : "bg-red-400"
                      }`}
                    ></div>
                  </div>
                </TotalsRow.Cell>
                <TotalsRow.Cell className="bg-cyan-700">
                  <span className="text-xs font-medium">
                    {globalMinDate ? safeFormatDate(globalMinDate) : "-"}
                  </span>
                </TotalsRow.Cell>
                <TotalsRow.Cell className="bg-cyan-700">
                  <span className="text-xs font-medium">
                    {globalMaxDate ? safeFormatDate(globalMaxDate) : "-"}
                  </span>
                </TotalsRow.Cell>
                <TotalsRow.Cell className="bg-cyan-700"></TotalsRow.Cell>
              </TotalsRow>
            )}
          </thead>

          <tbody>
            {filteredProjects.map((project) => (
              <React.Fragment key={project.project_id}>
                {!hideProjectHeaders && (
                  <ProjectRow
                    project={project}
                    selectedTasks={selectedTasks}
                    toggleProjectSelection={toggleProjectSelection}
                    expandedProjects={expandedProjects}
                    toggleProjectExpansion={toggleProjectExpansion}
                    handleStartAddingTask={handleStartAddingTask}
                    showInDays={showInDays}
                    showTimeline={showTimeline}
                    dateRange={dateRange}
                    columnWidth={columnWidth}
                    timelineWidth={timelineWidth}
                    todayLineOffset={todayLineOffset}
                    getDateInfo={getDateInfo}
                    onLabelTooltipHover={showLabelTooltip}
                    onLabelTooltipLeave={hideLabelTooltip}
                    reorderingProjectId={reorderingProjectId}
                    onStartReordering={onStartReordering}
                    onSaveReordering={onSaveReordering}
                    onCancelReordering={onCancelReordering}
                  />
                )}

                {(hideProjectHeaders || expandedProjects[project.project_id]) &&
                  (() => {
                    const isReordering = reorderingProjectId === project.project_id;
                    let tasksToRender = project.tasks;

                    if (isReordering && localTaskOrder.length > 0) {
                      const taskMap = new Map(project.tasks.map(t => [t.task_id, t]));
                      tasksToRender = localTaskOrder
                        .filter(id => taskMap.has(id))
                        .map(id => taskMap.get(id));
                    }

                    return tasksToRender.map((task) => (
                      <TaskRow
                        key={task.task_id}
                        task={task}
                        project={project}
                        selectedTasks={selectedTasks}
                        toggleTaskSelection={toggleTaskSelection}
                        editingCell={editingCell}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        handleCellClick={handleCellClick}
                        handleCellBlur={handleCellBlur}
                        handleKeyDown={handleKeyDown}
                        availableUsers={availableUsers}
                        handleDeleteTask={handleDeleteTask}
                        handleInitialActualClick={handleInitialActualClick}
                        handleTaskDetailsClick={handleTaskDetailsClick}
                        showInDays={showInDays}
                        showTimeline={showTimeline}
                        dateRange={dateRange}
                        columnWidth={columnWidth}
                        timelineWidth={timelineWidth}
                        todayLineOffset={todayLineOffset}
                        getDateInfo={getDateInfo}
                        pushUndo={pushUndo}
                        refetchPlanning={refetchPlanning}
                        onLabelTooltipHover={showLabelTooltip}
                        onLabelTooltipLeave={hideLabelTooltip}
                        isReordering={isReordering}
                        onDragStart={onDragStart}
                        onDragOver={onDragOver}
                        onDragEnd={onDragEnd}
                      />
                    ));
                  })()}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {labelTooltip && createPortal(
        <div
          className="fixed z-[9999] px-3 py-2.5 rounded-lg shadow-xl bg-gray-900 text-white text-xs min-w-48 max-w-sm border border-gray-600 pointer-events-none"
          style={{
            left: labelTooltip.x,
            top: labelTooltip.above ? labelTooltip.y : labelTooltip.y + 4,
            transform: labelTooltip.above
              ? 'translate(-50%, calc(-100% - 4px))'
              : 'translate(-50%, 0)',
          }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: labelTooltip.content.color || '#6366F1' }} />
              <Briefcase className="h-3 w-3 text-gray-400 shrink-0" />
              <span className="font-semibold text-gray-100">{labelTooltip.content.client}</span>
            </div>
            {labelTooltip.content.project && (
              <div className="flex items-center gap-1.5 text-gray-300 pl-4">
                <FolderKanban className="h-3 w-3 text-gray-400 shrink-0" />
                {labelTooltip.content.project}
              </div>
            )}
            {labelTooltip.content.task && (
              <div className="flex items-center gap-1.5 pl-4 text-gray-200 text-xs">
                <ListTodo className="h-3 w-3 text-gray-400 shrink-0" />
                {labelTooltip.content.task}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </TableContainer>
  );
});
