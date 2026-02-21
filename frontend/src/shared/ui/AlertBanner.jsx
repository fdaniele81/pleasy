import PropTypes from 'prop-types';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const AlertBanner = ({
  variant = 'info',
  message,
  children,
  icon: CustomIcon,
  className = ''
}) => {
  const variantStyles = {
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      Icon: AlertTriangle
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-600',
      Icon: AlertCircle
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      iconColor: 'text-blue-600',
      Icon: Info
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      iconColor: 'text-green-600',
      Icon: CheckCircle
    }
  };

  const style = variantStyles[variant] || variantStyles.info;
  const Icon = CustomIcon || style.Icon;

  return (
    <div className={`mb-4 p-4 ${style.bg} border ${style.border} rounded-lg ${className}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${style.iconColor}`} />
        <p className={`${style.text} text-sm font-medium`}>
          {children || message}
        </p>
      </div>
    </div>
  );
};

AlertBanner.propTypes = {
  variant: PropTypes.oneOf(['warning', 'error', 'info', 'success']),
  message: PropTypes.string,
  children: PropTypes.node,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

export default AlertBanner;
