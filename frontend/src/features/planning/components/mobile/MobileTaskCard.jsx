import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { SelectionCheckbox } from '../../../../shared/ui/table';
import {
  formatHours,
  getUnitLabel,
  safeFormatDate,
  isValidDate,
  getStatusLabels,
} from '../../utils/helpers';

const statusDotColors = {
  NEW: 'bg-gray-400',
  'IN PROGRESS': 'bg-blue-500',
  DONE: 'bg-green-500',
};

const statusBgColors = {
  NEW: 'bg-gray-50 border-gray-200',
  'IN PROGRESS': 'bg-blue-50 border-blue-200',
  DONE: 'bg-green-50 border-green-200',
};

export const MobileTaskCard = memo(function MobileTaskCard({
  task,
  project,
  isSelected,
  onToggleSelection,
  onOpenDetails,
  showInDays,
}) {
  const { t } = useTranslation(['planning']);
  const statusLabels = getStatusLabels(t);

  const formattedBudget = useMemo(() => formatHours(task.budget, showInDays), [task.budget, showInDays]);
  const formattedActual = useMemo(() => formatHours(task.actual, showInDays), [task.actual, showInDays]);
  const formattedEtc = useMemo(() => formatHours(task.etc, showInDays), [task.etc, showInDays]);
  const formattedEac = useMemo(() => formatHours(task.eac, showInDays), [task.eac, showInDays]);
  const unit = getUnitLabel(showInDays);
  const budgetDelta = task.budget - task.eac;
  const formattedDelta = formatHours(budgetDelta, showInDays);

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
    let message = '';
    if (hasIssue) {
      if (hasInvalidDate) message = t('planning:invalidDate');
      else if (!task.end_date) message = t('planning:warningEtcNoEndDate');
      else if (startDate && endDate && endDate < startDate) message = t('planning:warningEndBeforeStart');
      else if (endDate && endDate < today) message = t('planning:warningEtcPositiveEndPassed');
    }
    return { hasDateIssue: hasIssue, alertMessage: message };
  }, [task.end_date, task.start_date, task.etc, t]);

  const progress = task.eac > 0 ? Math.round((task.actual / task.eac) * 100) : 0;

  return (
    <div
      className={`rounded-lg border shadow-sm mb-2 overflow-hidden transition-colors ${
        isSelected ? 'border-cyan-400 bg-cyan-50/30' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Header row: checkbox + title + status */}
      <div className="flex items-start gap-2 px-3 pt-2.5 pb-1">
        <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <SelectionCheckbox
            checked={isSelected}
            onChange={() => onToggleSelection(task.task_id)}
            size="sm"
          />
        </div>
        <div
          className="flex-1 min-w-0 cursor-pointer active:opacity-70"
          onClick={() => onOpenDetails(task, project)}
        >
          <div className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">
            {task.title}
          </div>
          {task.external_key && (
            <span className="text-[11px] text-gray-400 font-mono">{task.external_key}</span>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
          <div className={`w-2.5 h-2.5 rounded-full ${statusDotColors[task.task_status_id] || statusDotColors.NEW}`} />
          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full border ${statusBgColors[task.task_status_id] || statusBgColors.NEW}`}>
            {statusLabels[task.task_status_id] || task.task_status_id}
          </span>
        </div>
      </div>

      {/* Body: tap to open details */}
      <div
        className="px-3 pb-2.5 cursor-pointer active:opacity-70"
        onClick={() => onOpenDetails(task, project)}
      >
        {/* Owner + dates row */}
        <div className="flex items-center justify-between mt-1 mb-1.5">
          <div className="flex items-center gap-1.5">
            {task.owner_name ? (
              <>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                  style={{
                    backgroundColor: task.owner_symbol_bg_color || '#6366F1',
                    color: task.owner_symbol_letter_color || '#FFFFFF',
                  }}
                >
                  {task.owner_symbol_letter || task.owner_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[120px]">{task.owner_name}</span>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">{t('planning:notAssigned')}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span>{task.start_date ? safeFormatDate(task.start_date) : '--'}</span>
            <span className="text-gray-300">&rarr;</span>
            <span className={hasDateIssue ? 'text-red-500 font-medium' : ''}>
              {task.end_date ? safeFormatDate(task.end_date) : '--'}
            </span>
            {hasDateIssue && (
              <AlertCircle size={12} className="text-red-500 shrink-0" title={alertMessage} />
            )}
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-x-2 gap-y-0.5 text-[11px]">
          <div className="text-gray-400">Budget</div>
          <div className="text-gray-400">Actual</div>
          <div className="text-gray-400">ETC</div>
          <div className="text-gray-400">EAC</div>
          <div className="font-semibold text-gray-700">{formattedBudget}{unit}</div>
          <div className="font-semibold text-gray-700">{formattedActual}{unit}</div>
          <div className="font-semibold text-amber-600">{formattedEtc}{unit}</div>
          <div className="font-semibold text-gray-700">{formattedEac}{unit}</div>
        </div>

        {/* Progress bar + delta */}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-gray-500 w-8 text-right">{progress}%</span>
          <span className={`text-[11px] font-semibold ${
            budgetDelta > 0 ? 'text-green-600' : budgetDelta < 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            {budgetDelta > 0 ? '+' : ''}{formattedDelta}{unit}
          </span>
        </div>
      </div>
    </div>
  );
});
