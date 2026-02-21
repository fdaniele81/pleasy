import { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertCircle } from 'lucide-react';
import { SelectionCheckbox } from '../../../shared/ui/table';
import {
  formatHours,
  getUnitLabel,
  safeFormatDate,
  formatDateForInput,
  isValidDate,
  statusColors,
  statusOptions,
  statusLabels
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
  showInDays
}) {
  const { t } = useTranslation(['planning', 'common']);
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

  return (
    <tr key={task.task_id} className="hover:bg-gray-50">
      <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
        <SelectionCheckbox
          checked={!!selectedTasks[task.task_id]}
          onChange={() => toggleTaskSelection(task.task_id)}
          size="sm"
        />
      </td>

      <td className="hidden xl:table-cell border-b border-r border-gray-300 px-2 py-0">
        <span className="text-xs text-gray-600 truncate block" title={project.client_name}>
          {project.client_name}
        </span>
      </td>

      <td className="border-b border-r border-gray-300 px-2 py-0 w-[120px] max-w-[120px] xl:w-[150px] xl:max-w-[150px]">
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

      <td className="border-b border-r border-gray-300 px-1 py-0 text-right text-xs font-medium text-gray-700">
        {isEditingBudget ? (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCellBlur(task.task_id, project.project_id, 'budget', task.budget?.toString() || '0')}
            onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'budget', task.budget?.toString() || '0')}
            onWheel={(e) => e.target.blur()}
            autoFocus
            className="w-full px-1 py-1 border border-blue-300 rounded text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            step="0.1"
            min="0"
          />
        ) : (
          <span
            className="cursor-pointer hover:text-blue-600"
            onClick={() => handleCellClick(task.task_id, project.project_id, 'budget', task.budget?.toString() || '0')}
          >
            {formattedBudget}{getUnitLabel(showInDays)}
          </span>
        )}
      </td>

      <td className="border-b border-r border-gray-300 px-1 py-0 text-right text-xs font-medium text-gray-700">
        <span
          className="cursor-pointer hover:text-cyan-600 hover:underline"
          onClick={() => handleInitialActualClick(task)}
          title={t('planning:clickEditInitialActual')}
        >
          {formattedActual}{getUnitLabel(showInDays)}
        </span>
      </td>

      <td className="border-b border-r border-gray-300 px-1 py-0 text-right text-xs font-medium text-gray-700 bg-yellow-50">
        {isEditingEtc ? (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCellBlur(task.task_id, project.project_id, 'etc', task.etc?.toString() || '0')}
            onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'etc', task.etc?.toString() || '0')}
            onWheel={(e) => e.target.blur()}
            autoFocus
            className="w-full px-1 py-1 border border-blue-300 rounded text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            step="0.1"
            min="0"
          />
        ) : (
          <span
            className="cursor-pointer hover:text-blue-600"
            onClick={() => handleCellClick(task.task_id, project.project_id, 'etc', task.etc?.toString() || '0')}
          >
            {formattedEtc}{getUnitLabel(showInDays)}
          </span>
        )}
      </td>

      <td className="border-b border-r border-gray-300 px-1 py-0 text-right text-xs font-medium text-gray-700">
        {formattedEac}{getUnitLabel(showInDays)}
      </td>

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

      <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
        {isEditingStartDate ? (
          <input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCellBlur(task.task_id, project.project_id, 'start_date', formatDateForInput(task.start_date))}
            onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'start_date', formatDateForInput(task.start_date))}
            autoFocus
            className="w-full px-1 py-1 border border-blue-300 rounded text-xs"
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

      <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
        {isEditingEndDate ? (
          <input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCellBlur(task.task_id, project.project_id, 'end_date', formatDateForInput(task.end_date))}
            onKeyDown={(e) => handleKeyDown(e, task.task_id, project.project_id, 'end_date', formatDateForInput(task.end_date))}
            autoFocus
            className="w-full px-1 py-1 border border-blue-300 rounded text-xs"
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

      <td className="border-b border-r border-gray-300 px-1 py-0 text-center">
        <button
          onClick={() => handleDeleteTask(project.project_id, task.task_id, task.title)}
          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
          title={t('planning:deleteActivity')}
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
});
