import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function FilterBar({
  children,
  showClearAll = false,
  onClearAll,
  clearAllLabel,
  layout = 'wrap',
  gap = 'md',
  className = '',
  withBackground = true,
  withPadding = true,
}) {
  const { t } = useTranslation(['common']);
  const resolvedClearAllLabel = clearAllLabel || t('common:clearFilters');

  const layoutClasses = {
    row: 'flex flex-row items-center',
    column: 'flex flex-col',
    wrap: 'flex flex-wrap items-center',
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  const baseClasses = [
    layoutClasses[layout],
    gapClasses[gap],
  ];

  if (withBackground) {
    baseClasses.push('bg-white rounded-lg shadow-sm border border-gray-200');
  }

  if (withPadding) {
    baseClasses.push('p-3');
  }

  if (className) {
    baseClasses.push(className);
  }

  return (
    <div className={baseClasses.join(' ')}>
      {children}

      {showClearAll && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="
            flex items-center gap-1 px-2 py-1 rounded-lg
            text-xs text-red-600 hover:text-red-700 hover:bg-red-50
            border border-red-200 transition-colors
          "
        >
          <X size={14} />
          <span>{resolvedClearAllLabel}</span>
        </button>
      )}
    </div>
  );
}

function FilterSeparator({ className = '' }) {
  return (
    <div className={`h-6 w-px bg-gray-300 mx-1 ${className}`} />
  );
}

function FilterGroup({ label, children, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

FilterBar.Separator = FilterSeparator;
FilterBar.Group = FilterGroup;

export default FilterBar;
