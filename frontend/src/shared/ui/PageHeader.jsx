import PropTypes from 'prop-types';
import { Plus } from 'lucide-react';
import Button from './Button';

const PageHeader = ({
  icon: Icon,
  title,
  description,
  actionButton,
  secondaryActionButton,
}) => {
  const ActionIcon = actionButton?.icon || Plus;
  const SecondaryIcon = secondaryActionButton?.icon;

  return (
    <div className="mb-2 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
      <div>
        <h1 className="text-base sm:text-2xl font-bold text-gray-800 mb-0 sm:mb-2 flex items-center gap-2 sm:gap-3">
          {Icon && <Icon size={18} className="sm:w-7 sm:h-7 shrink-0" />}
          <span>{title}</span>
        </h1>
        {description && (
          <p className="hidden sm:block text-sm sm:text-base text-gray-600">{description}</p>
        )}
      </div>

      <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
        {actionButton && (
          <Button
            onClick={actionButton.onClick}
            color={actionButton.color || "cyan"}
            icon={ActionIcon}
            disabled={actionButton.disabled}
            fullWidth={false}
            className="flex-1 sm:flex-none"
          >
            {actionButton.mobileLabel ? (
              <>
                <span className="sm:hidden">{actionButton.mobileLabel}</span>
                <span className="hidden sm:inline">{actionButton.label}</span>
              </>
            ) : actionButton.label}
          </Button>
        )}
        {secondaryActionButton && (
          <Button
            onClick={secondaryActionButton.onClick}
            color={secondaryActionButton.color || "cyan"}
            icon={SecondaryIcon}
            disabled={secondaryActionButton.disabled}
            fullWidth={false}
            className="flex-1 sm:flex-none"
          >
            {secondaryActionButton.mobileLabel ? (
              <>
                <span className="sm:hidden">{secondaryActionButton.mobileLabel}</span>
                <span className="hidden sm:inline">{secondaryActionButton.label}</span>
              </>
            ) : secondaryActionButton.label}
          </Button>
        )}
      </div>
    </div>
  );
};

PageHeader.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actionButton: PropTypes.shape({
    label: PropTypes.string.isRequired,
    mobileLabel: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.elementType,
    color: PropTypes.string,
    disabled: PropTypes.bool,
  }),
  secondaryActionButton: PropTypes.shape({
    label: PropTypes.string.isRequired,
    mobileLabel: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    icon: PropTypes.elementType,
    color: PropTypes.string,
    disabled: PropTypes.bool,
  }),
};

export default PageHeader;
