import { memo } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronRight } from 'lucide-react';

const ExpandButton = memo(function ExpandButton({
  isExpanded = false,
  onClick,
  size = 16,
  className = '',
  title,
  ariaLabel,
  ...rest
}) {
  const Icon = isExpanded ? ChevronDown : ChevronRight;
  const defaultClasses = 'text-gray-500 hover:text-gray-700 transition-colors';

  return (
    <button
      type="button"
      onClick={onClick}
      className={className || defaultClasses}
      title={title}
      aria-label={ariaLabel || (isExpanded ? 'Comprimi' : 'Espandi')}
      aria-expanded={isExpanded}
      {...rest}
    >
      <Icon size={size} />
    </button>
  );
});

ExpandButton.propTypes = {
  isExpanded: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
  title: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default ExpandButton;
