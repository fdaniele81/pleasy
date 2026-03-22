import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Plus, ArrowUpDown, Check, X, Merge, Scissors, Copy } from 'lucide-react';
import { SelectionCheckbox } from '../../../../shared/ui/table';
import { formatHours, getUnitLabel, getFilteredMetrics } from '../../utils/helpers';
import { MobileTaskCard } from './MobileTaskCard';

export const MobileProjectSection = memo(function MobileProjectSection({
  project,
  isExpanded,
  onToggleExpansion,
  selectedTasks,
  onToggleProjectSelection,
  onToggleTaskSelection,
  onOpenTaskDetails,
  onAddTask,
  showInDays,
  onStartMerge,
  onStartSplit,
  onCloneTasks,
  onStartReordering,
  onSaveReordering,
  onCancelReordering,
  isReordering,
  onDragStart,
  onDragOver,
  onDragEnd,
  localTaskOrder,
}) {
  const { t } = useTranslation(['planning', 'common']);
  const metrics = useMemo(() => getFilteredMetrics(project), [project]);
  const unit = getUnitLabel(showInDays);

  const selectedTaskCount = useMemo(() => {
    return project.tasks.filter(task => selectedTasks[task.task_id]).length;
  }, [project.tasks, selectedTasks]);

  const allSelected = project.tasks.length > 0 && project.tasks.every(task => selectedTasks[task.task_id]);

  const tasks = isReordering && localTaskOrder
    ? localTaskOrder.map(id => project.tasks.find(t => t.task_id === id)).filter(Boolean)
    : project.tasks;

  return (
    <div className="mb-3">
      {/* Project header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 rounded-lg border border-gray-200 sticky top-0 z-10"
      >
        <div onClick={(e) => e.stopPropagation()}>
          <SelectionCheckbox
            checked={allSelected}
            onChange={() => onToggleProjectSelection(project)}
            size="sm"
          />
        </div>

        <div
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer active:opacity-70"
          onClick={() => onToggleExpansion(project.project_id)}
        >
          {isExpanded ? <ChevronDown size={16} className="text-gray-500 shrink-0" /> : <ChevronRight size={16} className="text-gray-500 shrink-0" />}
          <div
            className="w-6 h-6 min-w-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold leading-none"
            style={{
              backgroundColor: project.symbol_bg_color || project.client_color || '#6366F1',
              color: project.symbol_letter_color || '#FFFFFF',
            }}
          >
            {project.symbol_letter || (project.client_name || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-800 truncate">
              {project.title}
            </div>
            <div className="text-[11px] text-gray-500 truncate">
              {project.client_name} &middot; {project.client_key}-{project.project_key}
            </div>
          </div>
        </div>

        {/* Compact metrics in header */}
        <div className="shrink-0 text-right">
          <div className="text-[11px] text-gray-500">
            {formatHours(metrics.budget, showInDays)}{unit}
          </div>
          <div className={`text-[11px] font-semibold ${
            metrics.delta > 0 ? 'text-green-600' : metrics.delta < 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            {metrics.delta > 0 ? '+' : ''}{formatHours(metrics.delta, showInDays)}{unit}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-1 px-1">
          {/* Action bar for project */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <span>{project.tasks.length} {t('planning:activities')}</span>
              {selectedTaskCount > 0 && (
                <span className="text-cyan-600 font-medium">
                  &middot; {selectedTaskCount} {t('planning:selected')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {isReordering ? (
                <>
                  <button
                    onClick={onSaveReordering}
                    className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 active:bg-green-100"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={onCancelReordering}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 active:bg-red-100"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  {project.tasks.length > 1 && (
                    <button
                      onClick={() => onStartReordering(project.project_id, project.tasks)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 active:bg-gray-100"
                      title={t('planning:reorderActivities')}
                    >
                      <ArrowUpDown size={15} />
                    </button>
                  )}
                  {selectedTaskCount >= 2 && (
                    <button
                      onClick={() => onStartMerge(project.project_id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-600 active:bg-cyan-50"
                      title={t('planning:mergeActivities')}
                    >
                      <Merge size={15} />
                    </button>
                  )}
                  {selectedTaskCount === 1 && (
                    <button
                      onClick={() => onStartSplit(project.project_id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-600 active:bg-cyan-50"
                      title={t('planning:splitActivity')}
                    >
                      <Scissors size={15} />
                    </button>
                  )}
                  {selectedTaskCount >= 1 && (
                    <button
                      onClick={() => onCloneTasks(project.project_id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-600 active:bg-cyan-50"
                      title={t('planning:cloneActivities')}
                    >
                      <Copy size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => onAddTask(project.project_id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 active:bg-gray-100"
                    title={t('planning:addActivity')}
                  >
                    <Plus size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Task cards */}
          {tasks.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-400">
              {t('planning:noActivities')}
            </div>
          ) : (
            tasks.map(task => (
              <MobileTaskCard
                key={task.task_id}
                task={task}
                project={project}
                isSelected={!!selectedTasks[task.task_id]}
                onToggleSelection={onToggleTaskSelection}
                onOpenDetails={onOpenTaskDetails}
                showInDays={showInDays}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});
