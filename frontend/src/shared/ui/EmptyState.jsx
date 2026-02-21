import PropTypes from 'prop-types';
import Button from './Button';

const EmptyState = ({
  icon: Icon,
  title,
  message,
  action,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-12 text-center ${className}`}>
      {Icon && (
        <Icon size={64} className="mx-auto text-gray-300 mb-4" />
      )}

      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {title}
      </h3>

      <p className="text-gray-600 mb-6">
        {message}
      </p>

      {action && (
        <Button
          onClick={action.onClick}
          color="blue"
          size="lg"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.elementType,
  }),
  className: PropTypes.string,
};

export default EmptyState;
