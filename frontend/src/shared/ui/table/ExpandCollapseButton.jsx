import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function ExpandCollapseButton({
  isExpanded = false,
  onClick,
  size = 'md',
  className = '',
  expandedTitle,
  collapsedTitle,
  color = 'cyan',
}) {
  const { t } = useTranslation(['common']);
  const resolvedExpandedTitle = expandedTitle || t('common:collapse');
  const resolvedCollapsedTitle = collapsedTitle || t('common:expand');
  const Icon = isExpanded ? ChevronDown : ChevronRight;

  const sizeMap = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const colorClasses = {
    cyan: 'text-cyan-400 hover:text-cyan-300',
    gray: 'text-gray-500 hover:text-gray-400',
    white: 'text-white hover:text-gray-200',
  };

  const baseClasses = [
    'transition-colors',
    'focus:outline-none',
    colorClasses[color],
  ];

  if (className) baseClasses.push(className);

  return (
    <button
      type="button"
      onClick={onClick}
      className={baseClasses.join(' ')}
      title={isExpanded ? resolvedExpandedTitle : resolvedCollapsedTitle}
      aria-expanded={isExpanded}
    >
      <Icon size={sizeMap[size]} />
    </button>
  );
}

export default ExpandCollapseButton;
