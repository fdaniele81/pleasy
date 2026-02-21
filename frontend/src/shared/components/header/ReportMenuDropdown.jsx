import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { routeIcons, ReportIcon } from '../../../constants/routeIcons';
import { ROUTES } from '../../../constants';
import { getMenuLinkClasses, DROPDOWN_ITEM_CLASSES, DROPDOWN_CONTAINER_CLASSES } from './menuUtils';

const ReportMenuDropdown = memo(function ReportMenuDropdown({
  isOpen,
  isActive,
  onToggle,
  menuRef,
}) {
  const { t } = useTranslation(['navigation']);
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggle}
        className={getMenuLinkClasses(isActive)}
      >
        <ReportIcon size={16} />
        <span>{t('navigation:report')}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={DROPDOWN_CONTAINER_CLASSES}>
          <Link
            to={ROUTES.TIMEOFF_PLAN}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.TIMEOFF_PLAN] && React.createElement(routeIcons[ROUTES.TIMEOFF_PLAN], { size: 16 })}
            <span>{t('navigation:timeOffPlan')}</span>
          </Link>
          <Link
            to={ROUTES.TIMESHEET_SNAPSHOTS}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.TIMESHEET_SNAPSHOTS] && React.createElement(routeIcons[ROUTES.TIMESHEET_SNAPSHOTS], { size: 16 })}
            <span>{t('navigation:submittedTimesheets')}</span>
          </Link>
          <Link
            to={ROUTES.RECONCILIATION}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.RECONCILIATION] && React.createElement(routeIcons[ROUTES.RECONCILIATION], { size: 16 })}
            <span>{t('navigation:timesheetReconciliation')}</span>
          </Link>
        </div>
      )}
    </div>
  );
});

export default ReportMenuDropdown;
