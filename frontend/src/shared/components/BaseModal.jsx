import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../shared/ui/Button';

const BaseModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  icon,
  children,
  confirmText,
  cancelText,
  isEditMode = false,
  entityName,
  error,
  isSubmitting = false,
  size = 'lg',
  showFooter = true,
  customFooter = null,
  confirmButtonColor = 'cyan'
}) => {
  const { t } = useTranslation('common');

  if (!isOpen) return null;

  const resolvedConfirmText = confirmText || t('save');
  const resolvedCancelText = cancelText || t('cancel');

  const fullTitle = entityName
    ? `${isEditMode ? t('edit') : t('new')} ${entityName}`
    : title;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    '3xl': 'w-[90vw] max-w-[90vw] min-w-[1000px]',
    full: 'w-[95vw] max-w-[95vw] h-[90vh]',
    fit: 'w-fit max-w-[95vw]'
  };

  const maxWidthClass = sizeClasses[size] || sizeClasses.lg;

  const handleConfirmClick = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  const modalTitleId = `modal-title-${typeof fullTitle === 'string' ? fullTitle.replace(/\s+/g, '-').toLowerCase() : 'dialog'}`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="presentation"
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${maxWidthClass} p-6 max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="flex items-center justify-between mb-6 ">
          <div className="flex items-center gap-2">
            {icon}
            <h2 id={modalTitleId} className="text-xl font-semibold text-gray-800">
              {fullTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
            aria-label={t('closeModal')}
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-6 p-0.5">
          {children}
        </div>

        {showFooter && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 ">
            {customFooter || (
              <>
                <Button
                  onClick={onClose}
                  disabled={isSubmitting}
                  variant="outline"
                  color="gray"
                  size="md"
                >
                  {resolvedCancelText}
                </Button>
                {onConfirm && (
                  <Button
                    onClick={handleConfirmClick}
                    loading={isSubmitting}
                    color={confirmButtonColor}
                    size="md"
                  >
                    {resolvedConfirmText}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

BaseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  title: PropTypes.string,
  icon: PropTypes.node,
  children: PropTypes.node.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isEditMode: PropTypes.bool,
  entityName: PropTypes.string,
  error: PropTypes.string,
  isSubmitting: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full', 'fit']),
  showFooter: PropTypes.bool,
  customFooter: PropTypes.node,
  confirmButtonColor: PropTypes.string,
};

export default BaseModal;
