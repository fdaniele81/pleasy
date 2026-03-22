import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Merge, Scissors, Copy, Trash2, X } from 'lucide-react';

export function MobileSelectionBar({
  selectedTasks,
  projects,
  onClearSelection,
  onStartMerge,
  onStartSplit,
  onCloneTasks,
  onDeleteTasks,
  confirmFn,
}) {
  const { t } = useTranslation(['planning', 'common']);

  const { count, projectId } = useMemo(() => {
    const taskIds = Object.keys(selectedTasks).filter(k => selectedTasks[k] && !k.startsWith('project_'));
    if (taskIds.length === 0) return { count: 0, projectId: null };

    // Find which project the selected tasks belong to
    let pid = null;
    for (const p of projects) {
      if (p.tasks.some(task => taskIds.includes(task.task_id))) {
        pid = p.project_id;
        break;
      }
    }
    return { count: taskIds.length, projectId: pid };
  }, [selectedTasks, projects]);

  if (count === 0) return null;

  const handleDelete = async () => {
    const confirmed = await confirmFn({
      title: t('planning:deleteConfirmTitle'),
      message: t('planning:deleteConfirmMessage', { count }),
      confirmLabel: t('common:delete'),
      variant: 'danger',
    });
    if (confirmed && onDeleteTasks) {
      onDeleteTasks();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onClearSelection}
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 active:bg-gray-200"
          >
            <X size={18} />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {count} {t('planning:selected')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {count >= 2 && projectId && (
            <button
              onClick={() => onStartMerge(projectId)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-cyan-700 bg-cyan-50 active:bg-cyan-100"
            >
              <Merge size={14} />
              <span className="hidden xs:inline">{t('planning:mergeConfirm')}</span>
            </button>
          )}
          {count === 1 && projectId && (
            <button
              onClick={() => onStartSplit(projectId)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-cyan-700 bg-cyan-50 active:bg-cyan-100"
            >
              <Scissors size={14} />
              <span className="hidden xs:inline">Split</span>
            </button>
          )}
          {count >= 1 && projectId && (
            <button
              onClick={() => onCloneTasks(projectId)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 active:bg-gray-200"
            >
              <Copy size={14} />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-red-700 bg-red-50 active:bg-red-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
