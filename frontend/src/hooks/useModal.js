import { useState, useCallback } from 'react';

export const useModal = (options = {}) => {
  const { initialData = null } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(initialData);

  const open = useCallback(() => {
    setData(initialData);
    setIsOpen(true);
  }, [initialData]);

  const openWithData = useCallback((itemData) => {
    setData(itemData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(initialData);
  }, [initialData]);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    openWithData,
    close,
    toggle,
    setData
  };
};

export default useModal;
