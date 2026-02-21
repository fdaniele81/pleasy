import React, { memo, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { ProjectRow } from "./ProjectRow";
import { TaskRow } from "./TaskRow";
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
}) {
  const { t } = useTranslation(['planning', 'common']);

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
    <TableContainer maxHeight="calc(100vh - 300px)">
      <table className="w-full border-separate border-spacing-0 table-fixed">
        <thead>
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
            <th className="hidden xl:table-cell border-t border-r border-gray-300 px-2 py-2 text-left font-semibold w-[100px] bg-cyan-700">
              {t('planning:client')}
            </th>
            <th className="border-t border-r border-gray-300 px-2 py-2 text-left font-semibold w-[120px] max-w-[120px] xl:w-[150px] xl:max-w-[150px] bg-cyan-700">
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
            <th className="border-t border-r border-gray-300 px-1 py-2 text-right font-semibold w-12 xl:w-[50px] bg-cyan-700">
              {t('planning:bdg')}
            </th>
            <th className="border-t border-r border-gray-300 px-1 py-2 text-right font-semibold w-12 xl:w-[50px] bg-cyan-700">
              {t('planning:act')}
            </th>
            <th className="border-t border-r border-gray-300 px-1 py-2 text-right font-semibold w-12 xl:w-[50px] bg-cyan-700">
              {t('planning:etc')}
            </th>
            <th className="border-t border-r border-gray-300 px-1 py-2 text-right font-semibold w-12 xl:w-[50px] bg-cyan-700">
              {t('planning:eac')}
            </th>
            <th className="border-t border-r border-gray-300 px-1 py-2 text-right font-semibold w-12 xl:w-[50px] bg-cyan-700">
              {t('planning:delta')}
            </th>
            <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-20 md:w-24 xl:w-20 bg-cyan-700">
              {t('planning:start')}
            </th>
            <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-20 md:w-24 xl:w-20 bg-cyan-700">
              {t('planning:end')}
            </th>
            <th className="border-t border-r border-gray-300 px-1 py-2 text-center font-semibold w-8 bg-cyan-700"></th>
          </tr>

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
              className="hidden xl:table-cell font-bold text-xs bg-cyan-700"
              colSpan={5}
              align="left"
            >
              {t('planning:grandTotal')}
            </TotalsRow.Cell>
            <TotalsRow.Cell
              className="xl:hidden font-bold text-xs bg-cyan-700"
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
              className="font-bold text-xs bg-cyan-700"
            >
              {formatHours(grandTotals.budget, showInDays)}
              {getUnitLabel(showInDays)}
            </TotalsRow.Cell>
            <TotalsRow.Cell
              align="right"
              className="font-bold text-xs bg-cyan-700"
            >
              {formatHours(grandTotals.actual, showInDays)}
              {getUnitLabel(showInDays)}
            </TotalsRow.Cell>
            <TotalsRow.Cell
              align="right"
              className="font-bold text-xs bg-cyan-700"
            >
              {formatHours(grandTotals.etc, showInDays)}
              {getUnitLabel(showInDays)}
            </TotalsRow.Cell>
            <TotalsRow.Cell
              align="right"
              className="font-bold text-xs bg-cyan-700"
            >
              {formatHours(grandTotals.eac, showInDays)}
              {getUnitLabel(showInDays)}
            </TotalsRow.Cell>
            <TotalsRow.Cell className="bg-cyan-700">
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
                />
              )}

              {(hideProjectHeaders || expandedProjects[project.project_id]) &&
                project.tasks.map((task) => (
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
                  />
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </TableContainer>
  );
});
