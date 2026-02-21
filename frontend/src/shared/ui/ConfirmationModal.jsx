import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import Button from './Button';

const ConfirmationModal = ({
  isOpen,
  config,
  onConfirm,
  onCancel
}) => {
  const modalRef = useRef(null);
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const { title, message, confirmText, cancelText, variant } = config;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          iconBg: 'bg-red-100',
          confirmColor: 'red'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          iconBg: 'bg-amber-100',
          confirmColor: 'yellow'
        };
      default:
        return {
          icon: <Info className="w-6 h-6 text-cyan-500" />,
          iconBg: 'bg-cyan-100',
          confirmColor: 'cyan'
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full ${variantStyles.iconBg} flex items-center justify-center`}>
              {variantStyles.icon}
            </div>

            <div className="flex-1">
              <h3
                id="confirmation-title"
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h3>

              <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={onCancel}
              variant="ghost"
              color="gray"
            >
              {cancelText}
            </Button>

            <Button
              ref={confirmButtonRef}
              onClick={onConfirm}
              color={variantStyles.confirmColor}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  config: PropTypes.shape({
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    variant: PropTypes.oneOf(['danger', 'warning', 'info']),
  }),
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ConfirmationModal;
