import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Edit2, Check, Clock, Pencil } from 'lucide-react';

function TaskPreviewList({
  taskPreviews,
  onEditTaskName,
  onRemoveTask,
  onEditTask
}) {
  const { t } = useTranslation(['estimator', 'common']);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (taskId, currentName) => {
    setEditingTaskId(taskId);
    setEditValue(currentName);
  };

  const saveEdit = (taskId) => {
    if (editValue.trim()) {
      onEditTaskName(taskId, editValue.trim());
    }
    setEditingTaskId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditValue('');
  };

  const handleKeyDown = (e, taskId) => {
    if (e.key === 'Enter') {
      saveEdit(taskId);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const getSelectionTypeBadge = (type) => {
    const config = {
      ROW: { label: t('estimator:selectionRowBadge'), className: 'bg-green-100 text-green-800' },
      COLUMN: { label: t('estimator:selectionColumnBadge'), className: 'bg-blue-100 text-blue-800' },
      SPARSE: { label: t('estimator:selectionSparseBadge'), className: 'bg-gray-100 text-gray-800' }
    };

    const { label, className } = config[type] || config.SPARSE;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${className}`}>
        {label}
      </span>
    );
  };

  if (taskPreviews.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
        <Clock className="mx-auto text-gray-400 mb-2" size={32} />
        <p className="text-gray-600 text-sm">
          {t('estimator:noTasksToCreate')}
        </p>
        <p className="text-gray-500 text-xs mt-1">
          {t('estimator:selectCellsHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('estimator:tasksToCreate')} ({taskPreviews.length})
        </h3>
        <div className="text-sm text-gray-600">
          {t('estimator:totalBudget')} <span className="font-bold text-cyan-700">
            {taskPreviews.reduce((sum, t) => sum + (parseFloat(t.budget) || 0), 0).toFixed(1)}h
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {taskPreviews.map((task) => (
          <div
            key={task.id}
            className="border border-gray-200 rounded-lg hover:border-cyan-300 transition-colors"
          >
            <div className="flex items-center gap-3 px-3 py-2">
              {task.color && (
                <div
                  className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: task.color }}
                  title={`Colore: ${task.color}`}
                />
              )}

              <div className="flex-1 min-w-0">
                {editingTaskId === task.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, task.id)}
                      onBlur={() => saveEdit(task.id)}
                      autoFocus
                      className="flex-1 px-2 py-1 border border-cyan-500 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                      maxLength={255}
                    />
                    <button
                      onClick={() => saveEdit(task.id)}
                      className="text-green-600 hover:text-green-700"
                      title={t('common:save')}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </span>
                    <button
                      onClick={() => startEditing(task.id, task.title)}
                      className="text-gray-400 hover:text-cyan-600 transition-colors flex-shrink-0"
                      title={t('estimator:editTaskName')}
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {getSelectionTypeBadge(task.selectionType)}

                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock size={12} />
                  <span className="font-semibold text-cyan-700">{(parseFloat(task.budget) || 0).toFixed(1)}h</span>
                </div>

                {task.isMultiTask && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                    {task.subtasks.length}x
                  </span>
                )}

                <span className="text-xs text-gray-400">
                  {task.cellsCount} {t('estimator:cellsLabel')}
                </span>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onEditTask(task.id)}
                  className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                  title={t('estimator:editTaskUnlockCells')}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onRemoveTask(task.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  title={t('estimator:removeTask')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {task.isMultiTask && task.subtasks && task.subtasks.length > 0 && (
              <div className="px-3 pb-2 pt-0 border-t border-gray-100">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-gray-500">→</span>
                  {task.subtasks.map((subtask, index) => (
                    <span key={index} className="inline-flex items-center gap-1 text-gray-600">
                      <span className="font-medium">{subtask.title}</span>
                      <span className="text-cyan-700 font-semibold">({subtask.percentage.toFixed(0)}%)</span>
                      {index < task.subtasks.length - 1 && <span className="text-gray-400">•</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{t('estimator:tasksInPreview')}</span>
          <span className="font-bold text-lg text-gray-900">{taskPreviews.length}</span>
        </div>
        {taskPreviews.some(t => t.isMultiTask) && (
          <div className="flex items-center justify-between text-sm mt-2 text-cyan-700">
            <span className="font-medium">{t('estimator:finalActivities')}</span>
            <span className="font-bold text-lg">
              {taskPreviews.reduce((sum, t) =>
                sum + (t.isMultiTask && t.subtasks ? t.subtasks.length : 1), 0
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskPreviewList;
