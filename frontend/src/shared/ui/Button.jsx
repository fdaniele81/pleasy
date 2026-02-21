import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Trash2, Check, X } from 'lucide-react';
import { buildButtonClasses } from './buttonClassBuilder';
import { ICON_SIZES } from './buttonConstants';

const Button = ({
  variant = 'solid',
  color = 'blue',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  iconSize = 20,
  isExpandButton = false,
  isExpanded = false,
  confirmAction = false,
  onConfirm,
  itemName,
  onClick,
  type = 'button',
  className = '',
  title,
  ariaLabel,
  children,
  ...rest
}) => {
  const { t } = useTranslation(['common']);
  const resolvedItemName = itemName || t('common:item');
  const [showConfirm, setShowConfirm] = useState(false);

  const isIconOnly = !children && (icon || isExpandButton || confirmAction);

  const buttonClasses = useMemo(() => buildButtonClasses({
    variant,
    color,
    size,
    isIconOnly,
    isExpandButton,
    confirmAction,
    disabled,
    loading,
    fullWidth,
    className
  }), [variant, color, size, isIconOnly, isExpandButton, confirmAction, disabled, loading, fullWidth, className]);

  if (isExpandButton) {
    const Icon = isExpanded ? ChevronDown : ChevronRight;
    return (
      <button
        type={type}
        onClick={onClick}
        className={className || "text-gray-500 hover:text-gray-700 transition-colors"}
        title={title}
        aria-label={ariaLabel || (isExpanded ? 'Collapse' : 'Expand')}
        {...rest}
      >
        <Icon size={iconSize} />
      </button>
    );
  }

  if (confirmAction && showConfirm) {
    const confirmIconSize = ICON_SIZES[size] || ICON_SIZES.md;

    return (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => {
            if (onConfirm) {
              onConfirm();
            }
            setShowConfirm(false);
          }}
          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
          title={t('common:deleteConfirmTitle')}
          aria-label={t('common:deleteConfirmMessage', { itemName: resolvedItemName })}
        >
          <Check size={confirmIconSize} />
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
          title={t('common:cancelDelete')}
          aria-label={t('common:cancelDeleteLabel')}
        >
          <X size={confirmIconSize} />
        </button>
      </div>
    );
  }

  if (confirmAction) {
    const deleteIconSize = ICON_SIZES[size] || ICON_SIZES.md;

    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
        title={title || t('common:deleteItem', { itemName: resolvedItemName })}
        aria-label={ariaLabel || t('common:deleteItem', { itemName: resolvedItemName })}
        {...rest}
      >
        <Trash2 size={deleteIconSize} />
      </button>
    );
  }

  const Icon = icon;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={buttonClasses}
      title={title}
      aria-label={ariaLabel}
      {...rest}
    >
      {iconPosition === 'left' && (
        <>
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          ) : (
            Icon && <Icon size={iconSize} />
          )}
          {(loading || Icon) && children && <span className="ml-2">{children}</span>}
          {!loading && !Icon && children}
        </>
      )}

      {iconPosition === 'right' && (
        <>
          {children && <span className={loading || Icon ? 'mr-2' : ''}>{children}</span>}
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          ) : (
            Icon && <Icon size={iconSize} />
          )}
        </>
      )}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['solid', 'outline', 'ghost']),
  color: PropTypes.oneOf(['cyan', 'indigo', 'blue', 'green', 'gray', 'red', 'yellow']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  icon: PropTypes.elementType,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  iconSize: PropTypes.number,
  isExpandButton: PropTypes.bool,
  isExpanded: PropTypes.bool,
  confirmAction: PropTypes.bool,
  onConfirm: PropTypes.func,
  itemName: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  title: PropTypes.string,
  ariaLabel: PropTypes.string,
  children: PropTypes.node,
};

export default Button;
