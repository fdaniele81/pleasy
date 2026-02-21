import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function PeriodNavigator({
  onPrevious,
  onNext,
  onToday,
  isPreviousDisabled = false,
  isNextDisabled = false,
  isTodayDisabled = false,
  label = '',
  subLabel = '',
  todayLabel,
  size = 'md',
  className = '',
}) {
  const { t } = useTranslation('common');
  const resolvedTodayLabel = todayLabel ?? t('today');
  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
  };

  const todayButtonClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <button
        type="button"
        onClick={onPrevious}
        disabled={isPreviousDisabled}
        className={`
          rounded-lg border border-gray-300 bg-white text-gray-700
          hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          ${buttonSizeClasses[size]}
        `}
        title={t('previousWeek')}
      >
        <ChevronLeft size={iconSize} />
      </button>

      <button
        type="button"
        onClick={onToday}
        disabled={isTodayDisabled}
        className={`
          rounded-lg font-medium transition-colors
          ${isTodayDisabled
            ? 'bg-cyan-600 text-white cursor-not-allowed'
            : 'bg-cyan-500 text-white hover:bg-cyan-600'
          }
          ${todayButtonClasses[size]}
        `}
      >
        {resolvedTodayLabel}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled}
        className={`
          rounded-lg border border-gray-300 bg-white text-gray-700
          hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          ${buttonSizeClasses[size]}
        `}
        title={t('nextWeek')}
      >
        <ChevronRight size={iconSize} />
      </button>

      {label && (
        <span className={`font-semibold text-gray-700 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {label}
        </span>
      )}

      {subLabel && (
        <span className={`text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
          ({subLabel})
        </span>
      )}
    </div>
  );
}

export default PeriodNavigator;
