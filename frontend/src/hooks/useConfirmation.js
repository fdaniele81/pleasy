import { useState, useCallback } from 'react';

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: 'Conferma',
    message: '',
    confirmText: 'Conferma',
    cancelText: 'Annulla',
    variant: 'default',
    onConfirm: null,
    onCancel: null
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfig({
        title: options.title || 'Conferma',
        message: options.message || '',
        confirmText: options.confirmText || 'Conferma',
        cancelText: options.cancelText || 'Annulla',
        variant: options.variant || 'default',
        onConfirm: () => {
          setIsOpen(false);
          resolve(true);
        },
        onCancel: () => {
          setIsOpen(false);
          resolve(false);
        }
      });
      setIsOpen(true);
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    if (config.onCancel) {
      config.onCancel();
    }
  }, [config]);

  const handleConfirm = useCallback(() => {
    if (config.onConfirm) {
      config.onConfirm();
    }
  }, [config]);

  const handleCancel = useCallback(() => {
    if (config.onCancel) {
      config.onCancel();
    }
  }, [config]);

  return {
    isOpen,
    config,

    confirm,

    handleConfirm,
    handleCancel,
    close
  };
};

export default useConfirmation;
