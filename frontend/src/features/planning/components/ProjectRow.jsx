import { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import { SelectionCheckbox } from '../../../shared/ui/table';
import { formatHours, getUnitLabel, safeFormatDate, getFilteredMetrics, getProjectDateRange } from '../utils/helpers';

export const ProjectRow = memo(function ProjectRow({
  project,
  selectedTasks,
  toggleProjectSelection,
  expandedProjects,
  toggleProjectExpansion,
  handleStartAddingTask,
  showInDays
}) {
  const { t } = useTranslation(['planning', 'common']);
  const metrics = useMemo(() => getFilteredMetrics(project), [project]);
  const variance = useMemo(() => metrics.delta, [metrics]);
  const { minDate, maxDate } = useMemo(() => getProjectDateRange(project), [project]);

  const formattedBudget = useMemo(() => formatHours(metrics.budget, showInDays), [metrics.budget, showInDays]);
  const formattedActual = useMemo(() => formatHours(metrics.actual, showInDays), [metrics.actual, showInDays]);
  const formattedEtc = useMemo(() => formatHours(metrics.etc, showInDays), [metrics.etc, showInDays]);
  const formattedEac = useMemo(() => formatHours(metrics.eac, showInDays), [metrics.eac, showInDays]);
  const formattedVariance = useMemo(() => formatHours(variance, showInDays), [variance, showInDays]);

  return (
    <tr className="bg-gray-100 group">
      <td className="border-l border-b border-r border-gray-300 px-1 py-2 text-center bg-gray-100 group-hover:bg-gray-200">
        <SelectionCheckbox
          checked={
            project.tasks.length > 0
              ? project.tasks.every(t => selectedTasks[t.task_id])
              : selectedTasks[`project_${project.project_id}`] || false
          }
          onChange={() => toggleProjectSelection(project)}
        />
      </td>
      <td
        className="hidden xl:table-cell border-b border-r border-gray-300 px-2 py-2 bg-gray-100 group-hover:bg-gray-200 border-l-[6px]"
        style={{ borderLeftColor: project.client_color || '#6B7280' }}
      >
        <div className="flex items-center gap-2">
          <Button
            onClick={() => toggleProjectExpansion(project.project_id)}
            isExpandButton
            isExpanded={expandedProjects[project.project_id]}
            title={expandedProjects[project.project_id] ? t('common:collapse') : t('common:expand')}
            className="text-gray-500 hover:text-gray-700 shrink-0"
          />
          <span className="text-xs font-medium text-gray-700 truncate">
            {project.client_name}
          </span>
        </div>
      </td>
      <td
        colSpan={4}
        className="border-b border-r border-gray-300 px-2 py-2 bg-gray-100 group-hover:bg-gray-200 border-l-[6px] xl:border-l-0"
        style={{ borderLeftColor: project.client_color || '#6B7280' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <div className="xl:hidden">
              <Button
                onClick={() => toggleProjectExpansion(project.project_id)}
                isExpandButton
                isExpanded={expandedProjects[project.project_id]}
                title={expandedProjects[project.project_id] ? t('common:collapse') : t('common:expand')}
                className="text-gray-500 hover:text-gray-700"
              />
            </div>
            <span className="font-semibold text-gray-800 text-sm truncate">
              {project.title}
              <span className="font-normal text-gray-500 text-xs ml-1">
                ({project.client_key}-{project.project_key})
              </span>
            </span>
          </div>
          <Button
            onClick={() => handleStartAddingTask(project.project_id)}
            color="cyan"
            icon={Plus}
            iconSize={14}
            size="sm"
            title={t('planning:addActivity')}
            className="xl:pr-2"
          >
            <span className="hidden xl:inline">{t('common:activity')}</span>
          </Button>
        </div>
      </td>
      <td className="border-b border-r border-gray-300 px-1 py-2 text-center bg-gray-100 group-hover:bg-gray-200">
        <span className="xl:hidden text-xs font-medium text-gray-700">
          {metrics.progress}%
        </span>
        <div className="hidden xl:flex items-center gap-1 justify-center">
          <div className="flex-1 h-2 bg-white rounded-full overflow-hidden min-w-10">
            <div
              className="h-full bg-cyan-500 transition-all"
              style={{ width: `${Math.min(metrics.progress || 0, 100)}%` }}
            ></div>
          </div>
          <span className="text-xs font-medium text-gray-700 w-8 text-right shrink-0">
            {metrics.progress}%
          </span>
        </div>
      </td>
      <td className="border-b border-r border-gray-300 px-1 py-2 text-right font-bold text-gray-700 text-xs bg-gray-100 group-hover:bg-gray-200">
        {formattedBudget}{getUnitLabel(showInDays)}
      </td>
      <td className="border-b border-r border-gray-300 px-1 py-2 text-right font-bold text-gray-700 text-xs bg-gray-100 group-hover:bg-gray-200">
        {formattedActual}{getUnitLabel(showInDays)}
      </td>
      <td className="border-b border-r border-gray-300 px-1 py-2 text-right font-bold text-gray-700 text-xs bg-gray-100 group-hover:bg-gray-200">
        {formattedEtc}{getUnitLabel(showInDays)}
      </td>
      <td className="border-b border-r border-gray-300 px-1 py-2 text-right font-bold text-gray-700 text-xs bg-gray-100 group-hover:bg-gray-200">
        {formattedEac}{getUnitLabel(showInDays)}
      </td>
      <td className="border-b border-r border-gray-300 px-1 py-2 bg-gray-100 group-hover:bg-gray-200">
        <div className="flex items-center justify-end gap-1">
          <span className="text-xs font-bold text-gray-700">
            {variance > 0 ? '+' : ''}{formattedVariance}{getUnitLabel(showInDays)}
          </span>
          <div className={`w-3 h-3 rounded-full shrink-0 ${
            variance > 0 ? 'bg-green-500' : variance === 0 ? 'bg-gray-400' : 'bg-red-500'
          }`}></div>
        </div>
      </td>
      <td className="border-b border-r border-gray-300 px-1 py-2 text-center bg-gray-100 group-hover:bg-gray-200">
        <span className="text-xs font-medium text-gray-700">
          {minDate ? safeFormatDate(minDate) : '-'}
        </span>
      </td>
      <td className="border-b border-r border-gray-300 px-1 py-2 text-center bg-gray-100 group-hover:bg-gray-200">
        <span className="text-xs font-medium text-gray-700">
          {maxDate ? safeFormatDate(maxDate) : '-'}
        </span>
      </td>
      <td className="border-b border-r border-gray-300 px-1 py-2 text-center bg-gray-100 group-hover:bg-gray-200"></td>
    </tr>
  );
});
