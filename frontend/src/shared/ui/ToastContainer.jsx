import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectToasts, removeToast } from '../../store/slices/toastSlice';
import Toast from './Toast';

function ToastContainer() {
  const toasts = useSelector(selectToasts);
  const dispatch = useDispatch();

  const handleClose = (id) => {
    dispatch(removeToast(id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-9999 w-full max-w-md space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slideIn"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => handleClose(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
