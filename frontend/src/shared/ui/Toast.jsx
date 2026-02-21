import React, { useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

const Toast = memo(function Toast({ message, type = 'error', onClose, duration }) {
  const autoDuration = duration !== undefined ? duration : (type === 'error' ? 5000 : 1000);

  useEffect(() => {
    if (autoDuration > 0) {
      const timer = setTimeout(onClose, autoDuration);
      return () => clearTimeout(timer);
    }
  }, [autoDuration, onClose]);

  const styles = {
    error: {
      bg: 'bg-red-100 border-red-400',
      text: 'text-red-800',
      icon: <AlertCircle className="text-red-600" size={20} />
    },
    success: {
      bg: 'bg-green-100 border-green-400',
      text: 'text-green-800',
      icon: <CheckCircle className="text-green-600" size={20} />
    },
    info: {
      bg: 'bg-blue-100 border-blue-400',
      text: 'text-blue-800',
      icon: <Info className="text-blue-600" size={20} />
    }
  };

  const style = styles[type] || styles.error;

  return (
    <div className={`fixed top-4 right-4 max-w-md w-full ${style.bg} border-l-4 p-4 rounded shadow-lg z-9999 animate-slideIn`}>
      <div className="flex items-start gap-3">
        <div className="">
          {style.icon}
        </div>
        <div className={`flex-1 ${style.text}`}>
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className={` ${style.text} hover:opacity-70`}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
});

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['error', 'success', 'info', 'warning']),
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number,
};

export default Toast;
