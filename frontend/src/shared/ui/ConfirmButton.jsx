import { useState, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Trash2, Check, X } from 'lucide-react';

const ConfirmButton = memo(function ConfirmButton({
  onConfirm,
  itemName,
  size = 18,
  className = '',
  title,
  disabled = false,
  ...rest
}) {
  const { t } = useTranslation(['common']);
  const resolvedItemName = itemName || t('common:item');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = useCallback(() => {
    if (onConfirm) {
      onConfirm();
    }
    setShowConfirm(false);
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleShowConfirm = useCallback(() => {
    setShowConfirm(true);
  }, []);

  if (showConfirm) {
    return (
      <div
        className={`flex gap-1 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleConfirm}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
          title={t('common:deleteConfirmTitle')}
          aria-label={t('common:deleteConfirmMessage', { itemName: resolvedItemName })}
        >
          <Check size={size} />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
          title={t('common:cancelDelete')}
          aria-label={t('common:cancelDeleteLabel')}
        >
          <X size={size} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShowConfirm}
      disabled={disabled}
      className={`p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={title || t('common:deleteItem', { itemName: resolvedItemName })}
      aria-label={t('common:deleteItem', { itemName: resolvedItemName })}
      {...rest}
    >
      <Trash2 size={size} />
    </button>
  );
});

ConfirmButton.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  itemName: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
  title: PropTypes.string,
  disabled: PropTypes.bool,
};

export default ConfirmButton;
