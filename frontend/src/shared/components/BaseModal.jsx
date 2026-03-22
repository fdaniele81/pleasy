import React, { useEffect } from 'react';
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
  confirmButtonColor = 'cyan',
  noBodyScroll = false
}) => {
  const { t } = useTranslation('common');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedConfirmText = confirmText || t('save');
  const resolvedCancelText = cancelText || t('cancel');

  const fullTitle = entityName
    ? `${isEditMode ? t('edit') : t('new')} ${entityName}`
    : title;

  // On mobile (< lg): full-screen regardless of size prop
  // On desktop (>= lg): respect the size prop as before
  const desktopSizeClasses = {
    sm: 'lg:max-w-md',
    md: 'lg:max-w-lg',
    lg: 'lg:max-w-2xl',
    xl: 'lg:max-w-4xl',
    '2xl': 'lg:max-w-6xl',
    '3xl': 'lg:w-[90vw] lg:max-w-[90vw] lg:min-w-[1000px]',
    full: 'lg:w-[95vw] lg:max-w-[95vw] lg:h-[90vh]',
    fit: 'lg:w-fit lg:max-w-[95vw]'
  };

  const maxWidthClass = desktopSizeClasses[size] || desktopSizeClasses.lg;

  const handleConfirmClick = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  const modalTitleId = `modal-title-${typeof fullTitle === 'string' ? fullTitle.replace(/\s+/g, '-').toLowerCase() : 'dialog'}`;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50 lg:p-4"
      role="presentation"
    >
      <div
        className={`bg-white w-full h-full lg:h-auto lg:rounded-lg shadow-xl ${maxWidthClass} p-4 sm:p-6 max-h-dvh lg:max-h-[95vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <h2 id={modalTitleId} className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
              {fullTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 p-1 min-w-11 min-h-11 flex items-center justify-center"
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

        <div className={`flex-1 ${noBodyScroll ? 'overflow-hidden' : 'overflow-y-auto'} overflow-x-hidden mb-4 sm:mb-6 p-0.5 flex flex-col min-h-0`}>
          {children}
        </div>

        {showFooter && (
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
            {customFooter || (
              <>
                <Button
                  onClick={onClose}
                  disabled={isSubmitting}
                  variant="outline"
                  color="gray"
                  size="md"
                  fullWidth={false}
                  className="w-full sm:w-auto"
                >
                  {resolvedCancelText}
                </Button>
                {onConfirm && (
                  <Button
                    onClick={handleConfirmClick}
                    loading={isSubmitting}
                    color={confirmButtonColor}
                    size="md"
                    fullWidth={false}
                    className="w-full sm:w-auto"
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
  noBodyScroll: PropTypes.bool,
};

export default BaseModal;
