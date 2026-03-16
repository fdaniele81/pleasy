import { useMemo, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertCircle } from 'lucide-react';
import DateInput from '../../../shared/ui/DateInput';
import { SelectionCheckbox } from '../../../shared/ui/table';
import { formatDateISO } from '../../../utils/date/dateUtils';
import { getStatusId, TASK_COLORS, getUserColor } from '../../../shared/components/gantt/utils/ganttCalculations';
import { useTimelineDrag } from '../hooks/useTimelineDrag';
import { useUpdateTaskMutation } from '../api/taskEndpoints';
import {
  formatHours,
  getUnitLabel,
  safeFormatDate,
  formatDateForInput,
  isValidDate,
  statusColors,
  statusOptions,
  getStatusLabels
} from '../utils/helpers';

export const TaskRow = memo(function TaskRow({
  task,
  project,
  selectedTasks,
  toggleTaskSelection,
  editingCell,
  editValue,
  setEditValue,
  handleCellClick,
  handleCellBlur,
  handleKeyDown,
  availableUsers,
  handleDeleteTask,
  handleInitialActualClick,
  handleTaskDetailsClick,
  showInDays,
  showTimeline,
  dateRange,
  columnWidth,
  timelineWidth,
  todayLineOffset,
  getDateInfo,
  pushUndo,
  refetchPlanning
}) {
  const { t } = useTranslation(['planning', 'common']);
  const statusLabels = getStatusLabels(t);
  const [updateTask] = useUpdateTaskMutation();
  const barRef = useRef(null);

  const isEditingStatus = editingCell?.taskId === task.task_id && editingCell?.field === 'status';
  const isEditingAssignee = editingCell?.taskId === task.task_id && editingCell?.field === 'assignee';
  const isEditingStartDate = editingCell?.taskId === task.task_id && editingCell?.field === 'start_date';
  const isEditingEndDate = editingCell?.taskId === task.task_id && editingCell?.field === 'end_date';
  const isEditingTitle = editingCell?.taskId === task.task_id && editingCell?.field === 'title';
  const isEditingBudget = editingCell?.taskId === task.task_id && editingCell?.field === 'budget';
  const isEditingEtc = editingCell?.taskId === task.task_id && editingCell?.field === 'etc';
  const isEditingExternalKey = editingCell?.taskId === task.task_id && editingCell?.field === 'external_key';

  const budgetDelta = useMemo(() => task.budget - task.eac, [task.budget, task.eac]);
  const formattedBudget = useMemo(() => formatHours(task.budget, showInDays), [task.budget, showInDays]);
  const formattedActual = useMemo(() => formatHours(task.actual, showInDays), [task.actual, showInDays]);
  const formattedEtc = useMemo(() => formatHours(task.etc, showInDays), [task.etc, showInDays]);
  const formattedEac = useMemo(() => formatHours(task.eac, showInDays), [task.eac, showInDays]);
  const formattedDelta = useMemo(() => formatHours(budgetDelta, showInDays), [budgetDelta, showInDays]);

  const { hasDateIssue, alertMessage } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = (task.end_date && isValidDate(task.end_date)) ? new Date(task.end_date) : null;
    const startDate = (task.start_date && isValidDate(task.start_date)) ? new Date(task.start_date) : null;

    const hasInvalidDate = (task.end_date && !isValidDate(task.end_date)) || (task.start_date && !isValidDate(task.start_date));

    const hasIssue = hasInvalidDate || (task.etc > 0 && (
      !task.end_date ||
      (endDate && !isNaN(endDate.getTime()) && endDate < today) ||
      (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate < startDate)
    ));

    let message = "";
    if (hasIssue) {
      if (hasInvalidDate) message = t('planning:invalidDate');
      else if (!task.end_date) message = t('planning:warningEtcNoEndDate');
      else if (startDate && endDate && endDate < startDate) message = t('planning:warningEndBeforeStart');
      else if (endDate && endDate < today) message = t('planning:warningEtcPositiveEndPassed');
    }

    return { hasDateIssue: hasIssue, alertMessage: message };
  }, [task.end_date, task.start_date, task.etc]);

  // Timeline drag/resize
  const clearPendingDatesRef = useRef(null);

  const onDateChange = useCallback(async (newStartDate, newEndDate) => {
    const prevStartDate = task.start_date ? formatDateISO(task.start_date) : null;
    const prevEndDate = task.end_date ? formatDateISO(task.end_date) : null;

    try {
      await updateTask({
        taskId: task.task_id,
        projectId: project.project_id,
        taskData: { start_date: newStartDate, end_date: newEndDate },
      }).unwrap();

      if (pushUndo) {
        pushUndo({
          type: 'UPDATE_TASK',
          taskId: task.task_id,
          projectId: project.project_id,
          field: 'start_date',
          previousValue: { start_date: prevStartDate, end_date: prevEndDate },
          newValue: { start_date: newStartDate, end_date: newEndDate },
        });
      }

      refetchPlanning();
    } catch (err) {
      clearPendingDatesRef.current?.();
    }
  }, [task.task_id, task.start_date, task.end_date, project.project_id, updateTask, pushUndo, refetchPlanning]);

  const {
    isDragging,
    dragMode,
    mousePos,
    handleCellMouseDown,
    getVisualDates,
    clearPendingDates,
  } = useTimelineDrag({ columnWidth: columnWidth || 36, onDateChange, taskStartDate: task.start_date, taskEndDate: task.end_date });
  clearPendingDatesRef.current = clearPendingDates;

  const barColor = useMemo(() => {
    return getUserColor(task.owner_id);
  }, [task.owner_id]);

  // Compute visual start/end dates (with drag delta applied)
  const { visualStart, visualEnd } = useMemo(() => {
    const dragged = getVisualDates();
    if (dragged) {
      return { visualStart: dragged.startDate, visualEnd: dragged.endDate };
    }
    return {
      visualStart: task.start_date ? formatDateISO(new Date(task.start_date)) : null,
      visualEnd: task.end_date ? formatDateISO(new Date(task.end_date)) : null,
    };
  }, [task.start_date, task.end_date, getVisualDates]);

  // Compute bar position in pixels for absolute positioning
  const barPosition = useMemo(() => {
    if (!visualStart || !visualEnd || !dateRange || dateRange.length === 0) return null;

    const rangeStartISO = formatDateISO(dateRange[0]);
    const rangeEndISO = formatDateISO(dateRange[dateRange.length - 1]);

    // Skip if bar is entirely outside visible range
    if (visualEnd < rangeStartISO || visualStart > rangeEndISO) return null;

    // Clamp to visible range
    const clampedStart = visualStart < rangeStartISO ? rangeStartISO : visualStart;
    const clampedEnd = visualEnd > rangeEndISO ? rangeEndISO : visualEnd;

    const startDate = new Date(clampedStart);
    const rangeStart = new Date(dateRange[0]);
    rangeStart.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    const dayOffset = Math.round((startDate - rangeStart) / (1000 * 60 * 60 * 24));

    const endDate = new Date(clampedEnd);
    endDate.setHours(0, 0, 0, 0);
    const durationDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const left = dayOffset * columnWidth;
    const width = durationDays * columnWidth;

    const isStartClipped = visualStart < rangeStartISO;
    const isEndClipped = visualEnd > rangeEndISO;

    return { left, width: Math.max(width, 4), isStartClipped, isEndClipped };
  }, [visualStart, visualEnd, dateRange, columnWidth]);

  // Determine drag mode from mouse position within the bar
  const handleBarMouseDown = useCallback((e) => {
    if (!barPosition) return;
    const barRect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - barRect.left;
    const EDGE_ZONE = 8;

    let mode;
    if (relativeX <= EDGE_ZONE && !barPosition.isStartClipped) {
      mode = 'resize-left';
    } else if (relativeX >= barRect.width - EDGE_ZONE && !barPosition.isEndClipped) {
      mode = 'resize-right';
    } else {
      mode = 'move';
    }

    handleCellMouseDown(e, mode, task.start_date, task.end_date);
  }, [barPosition, handleCellMouseDown, task.start_date, task.end_date]);

  return (
    <>
    <tr key={task.task_id} className="hover:bg-gray-50">
      {/* Checkbox - always shown */}
      <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
        <SelectionCheckbox
          checked={!!selectedTasks[task.task_id]}
          onChange={() => toggleTaskSelection(task.task_id)}
          size="sm"
        />
      </td>

      {/* Project/Activity - always shown */}
      <td className="border-b border-r border-gray-300 px-2 py-0 w-[130px] max-w-[130px] xl:w-[200px] xl:max-w-[200px]">
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="font-mono text-xs text-gray-500">
            {project.project_key}-{task.task_number}
          </span>
          {isEditingTitle ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleCellBlur(task.task_id, project.project_id, 'title', task.title)}
              onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'title', task.title)}
              autoFocus
              className="flex-1 px-2 py-0.5 border border-blue-300 rounded text-xs font-medium"
            />
          ) : (
            <span
              className="font-medium text-xs cursor-pointer hover:text-blue-600 truncate max-w-xs"
              onClick={() => handleTaskDetailsClick(task, project)}
              title={task.title}
            >
              {task.title}
            </span>
          )}
        </div>
      </td>

      {showTimeline ? (
        <>
          {/* Status: compact (dot only) */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
            {isEditingStatus ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellBlur(task.task_id, project.project_id, 'status', task.task_status_id)}
                onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'status', task.task_status_id)}
                autoFocus
                className="w-full px-1 py-1 border border-blue-300 rounded text-xs"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status] || status}
                  </option>
                ))}
              </select>
            ) : (
              <div
                className={`w-3 h-3 rounded-full mx-auto cursor-pointer hover:opacity-70 ${
                  task.task_status_id === 'NEW' ? 'bg-gray-400' :
                  task.task_status_id === 'IN PROGRESS' ? 'bg-blue-500' :
                  'bg-green-500'
                }`}
                onClick={() => handleCellClick(task.task_id, project.project_id, 'status', task.task_status_id)}
                title={statusLabels[task.task_status_id] || task.task_status_id}
              />
            )}
          </td>

          {/* User: compact (avatar only) */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
            {isEditingAssignee ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellBlur(task.task_id, project.project_id, 'assignee', task.owner_id || '')}
                onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'assignee', task.owner_id || '')}
                autoFocus
                className="w-full px-1 py-1 border border-blue-300 rounded text-xs"
              >
                <option value="">{t('planning:notAssigned')}</option>
                {availableUsers[project.project_id]?.users?.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            ) : (
              <div
                className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0"
                onClick={() => handleCellClick(task.task_id, project.project_id, 'assignee', task.owner_id || '')}
              >
                {task.owner_name ? (
                  <div
                    className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-medium mx-auto"
                    style={{ backgroundColor: barColor }}
                    title={task.owner_name}
                  >
                    {task.owner_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-300 mx-auto" title={t('planning:notAssigned')} />
                )}
              </div>
            )}
          </td>

          {/* Single timeline cell with absolute positioned bar */}
          <td
            className="border-b border-gray-200 p-0"
            style={{ width: timelineWidth }}
          >
            <div className="relative" style={{ width: timelineWidth, height: 24 }}>
              {/* Today line */}
              {todayLineOffset !== null && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-dashed border-orange-400/60 pointer-events-none z-10"
                  style={{ left: todayLineOffset }}
                />
              )}

              {/* Task bar + ETC label */}
              {barPosition && (() => {
                const etcText = `${formattedEtc}${getUnitLabel(showInDays)}`;
                const etcTextWidth = etcText.length * 7 + 8; // approximate px width
                const fitsInside = barPosition.width >= etcTextWidth + 8;
                return (
                  <>
                    <div
                      ref={barRef}
                      className="absolute top-0.5 h-5 select-none flex items-center"
                      style={{
                        left: barPosition.left,
                        width: barPosition.width,
                        backgroundColor: barColor,
                        borderRadius: barPosition.isStartClipped && barPosition.isEndClipped ? '0'
                          : barPosition.isStartClipped ? '0 4px 4px 0'
                          : barPosition.isEndClipped ? '4px 0 0 4px'
                          : '4px',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        opacity: isDragging ? 0.85 : 1,
                        justifyContent: fitsInside ? 'flex-end' : undefined,
                        paddingRight: fitsInside ? 4 : undefined,
                        overflow: 'hidden',
                      }}
                      onMouseDown={handleBarMouseDown}
                      onMouseMove={(e) => {
                        if (isDragging) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const rx = e.clientX - rect.left;
                        const EDGE = 8;
                        const isAtEdge = (rx <= EDGE && !barPosition.isStartClipped) ||
                                         (rx >= rect.width - EDGE && !barPosition.isEndClipped);
                        e.currentTarget.style.cursor = isAtEdge ? 'ew-resize' : 'grab';
                      }}
                      title={`${task.title}\n${visualStart} → ${visualEnd}`}
                    >
                      {fitsInside && task.etc > 0 && (
                        <span className="text-[10px] font-medium text-white whitespace-nowrap pointer-events-none leading-none">
                          {etcText}
                        </span>
                      )}
                    </div>
                    {!fitsInside && task.etc > 0 && (
                      <span
                        className="absolute top-0.5 h-5 flex items-center text-[10px] font-medium text-gray-600 whitespace-nowrap pointer-events-none leading-none"
                        style={{ left: barPosition.left + barPosition.width + 3 }}
                      >
                        {etcText}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          </td>
        </>
      ) : (
        <>
          {/* External Key */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-center w-10 max-w-10 xl:w-16 xl:max-w-16">
            {isEditingExternalKey ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellBlur(task.task_id, project.project_id, 'external_key', task.external_key || '')}
                onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'external_key', task.external_key || '')}
                autoFocus
                className="w-full px-1 py-1 border border-blue-300 rounded text-xs"
              />
            ) : (
              <div
                className="text-xs cursor-pointer hover:text-blue-600 truncate overflow-hidden"
                onClick={() => handleCellClick(task.task_id, project.project_id, 'external_key', task.external_key || '')}
                title={task.external_key || ''}
              >
                {task.external_key || '-'}
              </div>
            )}
          </td>

          {/* Status */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
            {isEditingStatus ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellBlur(task.task_id, project.project_id, 'status', task.task_status_id)}
                onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'status', task.task_status_id)}
                autoFocus
                className="w-full px-1 py-1 border border-blue-300 rounded text-xs"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status] || status}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <div
                  className={`xl:hidden w-3 h-3 rounded-full mx-auto cursor-pointer hover:opacity-70 ${
                    task.task_status_id === 'NEW' ? 'bg-gray-400' :
                    task.task_status_id === 'IN PROGRESS' ? 'bg-blue-500' :
                    'bg-green-500'
                  }`}
                  onClick={() => handleCellClick(task.task_id, project.project_id, 'status', task.task_status_id)}
                  title={statusLabels[task.task_status_id] || task.task_status_id}
                ></div>
                <span
                  className={`hidden xl:inline-block px-2 py-0 rounded-full text-xs font-medium cursor-pointer hover:opacity-70 ${
                    statusColors[task.task_status_id] || statusColors.NEW
                  }`}
                  onClick={() => handleCellClick(task.task_id, project.project_id, 'status', task.task_status_id)}
                >
                  {statusLabels[task.task_status_id] || task.task_status_id}
                </span>
              </>
            )}
          </td>

          {/* User */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
            {isEditingAssignee ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellBlur(task.task_id, project.project_id, 'assignee', task.owner_id || '')}
                onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'assignee', task.owner_id || '')}
                autoFocus
                className="w-full px-1 py-1 border border-blue-300 rounded text-xs"
              >
                <option value="">{t('planning:notAssigned')}</option>
                {availableUsers[project.project_id]?.users?.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            ) : (
              <div
                className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0"
                onClick={() => handleCellClick(task.task_id, project.project_id, 'assignee', task.owner_id || '')}
              >
                {task.owner_name ? (
                  <div className="flex items-center gap-1 justify-center">
                    <div
                      className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[10px] font-medium shrink-0"
                      title={task.owner_name}
                    >
                      {task.owner_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <span className="hidden xl:inline text-xs truncate">{task.owner_name}</span>
                  </div>
                ) : (
                  <>
                    <div className="xl:hidden w-5 h-5 rounded-full bg-gray-300 mx-auto" title={t('planning:notAssigned')}></div>
                    <span className="hidden xl:inline text-xs text-gray-400 italic">{t('planning:notAssigned')}</span>
                  </>
                )}
              </div>
            )}
          </td>

          {/* Progress */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
            <span className="xl:hidden text-xs font-medium text-gray-600">
              {Math.round(task.progress)}%
            </span>
            <div className="hidden xl:flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden min-w-10">
                <div
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${Math.min(task.progress, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-600 w-8 text-right shrink-0">
                {Math.round(task.progress)}%
              </span>
            </div>
          </td>

          {/* Budget */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-right text-xs font-medium text-gray-700 whitespace-nowrap">
            {isEditingBudget ? (
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellBlur(task.task_id, project.project_id, 'budget', formattedBudget.toString())}
                onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'budget', formattedBudget.toString())}
                onFocus={(e) => e.target.select()}
                onWheel={(e) => e.target.blur()}
                autoFocus
                className="w-full px-1 py-1 border border-blue-300 rounded text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                step="0.1"
                min="0"
              />
            ) : (
              <span
                className="cursor-pointer hover:text-blue-600"
                onClick={() => handleCellClick(task.task_id, project.project_id, 'budget', formattedBudget.toString())}
              >
                {formattedBudget}{getUnitLabel(showInDays)}
              </span>
            )}
          </td>

          {/* Actual */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-right text-xs font-medium text-gray-700 whitespace-nowrap">
            <span
              className="cursor-pointer hover:text-cyan-600 hover:underline"
              onClick={() => handleInitialActualClick({
                ...task,
                client_name: project.client_name,
                client_key: project.client_key,
                client_color: project.client_color,
                project_key: project.project_key,
                project_title: project.title,
              })}
              title={t('planning:clickEditInitialActual')}
            >
              {formattedActual}{getUnitLabel(showInDays)}
            </span>
          </td>

          {/* ETC */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-right text-xs font-medium text-gray-700 bg-yellow-50 whitespace-nowrap">
            {isEditingEtc ? (
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleCellBlur(task.task_id, project.project_id, 'etc', formattedEtc.toString())}
                onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'etc', formattedEtc.toString())}
                onFocus={(e) => e.target.select()}
                onWheel={(e) => e.target.blur()}
                autoFocus
                className="w-full px-1 py-1 border border-blue-300 rounded text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                step="0.1"
                min="0"
              />
            ) : (
              <span
                className="cursor-pointer hover:text-blue-600"
                onClick={() => handleCellClick(task.task_id, project.project_id, 'etc', formattedEtc.toString())}
              >
                {formattedEtc}{getUnitLabel(showInDays)}
              </span>
            )}
          </td>

          {/* EAC */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-right text-xs font-medium text-gray-700 whitespace-nowrap">
            {formattedEac}{getUnitLabel(showInDays)}
          </td>

          {/* Delta */}
          <td className="border-b border-r border-gray-300 px-1 py-0">
            <div className="flex items-center justify-end gap-1">
              <span className="text-xs font-medium text-gray-700">
                {budgetDelta > 0 ? '+' : ''}{formattedDelta}{getUnitLabel(showInDays)}
              </span>
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                budgetDelta > 0 ? 'bg-green-500' : budgetDelta === 0 ? 'bg-gray-400' : 'bg-red-500'
              }`}></div>
            </div>
          </td>

          {/* Start Date */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
            {isEditingStartDate ? (
              <DateInput
                value={editValue}
                onChange={(newValue) => {
                  handleCellBlur(task.task_id, project.project_id, 'start_date', formatDateForInput(task.start_date), newValue);
                }}
                onDismiss={() => {
                  handleCellBlur(task.task_id, project.project_id, 'start_date', formatDateForInput(task.start_date), formatDateForInput(task.start_date));
                }}
                autoOpen
                inputClassName="w-full px-1 py-1 bg-transparent cursor-pointer focus:outline-none text-xs text-center"
                className="w-full"
              />
            ) : (
              <span
                className="text-xs cursor-pointer hover:text-blue-600 hover:underline"
                onClick={() => handleCellClick(task.task_id, project.project_id, 'start_date', formatDateForInput(task.start_date))}
              >
                {safeFormatDate(task.start_date)}
              </span>
            )}
          </td>

          {/* End Date */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
            {isEditingEndDate ? (
              <DateInput
                value={editValue}
                onChange={(newValue) => {
                  handleCellBlur(task.task_id, project.project_id, 'end_date', formatDateForInput(task.end_date), newValue);
                }}
                onDismiss={() => {
                  handleCellBlur(task.task_id, project.project_id, 'end_date', formatDateForInput(task.end_date), formatDateForInput(task.end_date));
                }}
                autoOpen
                inputClassName="w-full px-1 py-1 bg-transparent cursor-pointer focus:outline-none text-xs text-center"
                className="w-full"
              />
            ) : (
              <div className="flex items-center justify-center gap-1">
                <span
                  className={`text-xs cursor-pointer hover:underline ${hasDateIssue ? 'text-red-600 font-bold hover:text-red-700' : 'hover:text-blue-600'}`}
                  onClick={() => handleCellClick(task.task_id, project.project_id, 'end_date', formatDateForInput(task.end_date))}
                >
                  {safeFormatDate(task.end_date)}
                </span>
                {hasDateIssue && (
                  <AlertCircle
                    size={14}
                    className="text-red-600 shrink-0"
                    title={alertMessage}
                  />
                )}
              </div>
            )}
          </td>

          {/* Delete */}
          <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
            <button
              onClick={() => handleDeleteTask(project.project_id, task.task_id, task.title)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title={t('planning:deleteActivity')}
            >
              <Trash2 size={16} />
            </button>
          </td>
        </>
      )}
    </tr>
    {isDragging && visualStart && visualEnd && barRef.current && createPortal(
      <div
        className="fixed bg-gray-900/90 text-white text-xs px-2 py-1 rounded shadow-lg z-100 pointer-events-none whitespace-nowrap"
        style={{
          left: barRef.current.getBoundingClientRect().left + barRef.current.getBoundingClientRect().width / 2,
          top: barRef.current.getBoundingClientRect().top - 28,
          transform: 'translateX(-50%)',
        }}
      >
        {safeFormatDate(visualStart)} → {safeFormatDate(visualEnd)}
      </div>,
      document.body
    )}
    </>
  );
});
