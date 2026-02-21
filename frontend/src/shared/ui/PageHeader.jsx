import PropTypes from 'prop-types';
import { Plus } from 'lucide-react';
import Button from './Button';

const PageHeader = ({
  icon: Icon,
  title,
  description,
  actionButton
}) => {
  const ActionIcon = actionButton?.icon || Plus;

  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          {Icon && <Icon size={28} />}
          <span>{title}</span>
        </h1>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>

      {actionButton && (
        <Button
          onClick={actionButton.onClick}
          color="cyan"
          icon={ActionIcon}
        >
          {actionButton.label}
        </Button>
      )}
    </div>
  );
};

PageHeader.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actionButton: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.elementType,
  }),
};

export default PageHeader;
