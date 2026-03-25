import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { routeIcons } from '../../../constants/routeIcons';
import { ROUTES } from '../../../constants';
import { getMenuLinkClasses, DROPDOWN_ITEM_CLASSES, DROPDOWN_CONTAINER_CLASSES } from './menuUtils';

const TimesheetMenuDropdown = memo(function TimesheetMenuDropdown({
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
        {routeIcons[ROUTES.TIMESHEET] && React.createElement(routeIcons[ROUTES.TIMESHEET], { size: 16 })}
        <span>{t('navigation:timesheet')}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={DROPDOWN_CONTAINER_CLASSES}>
          <Link
            to={ROUTES.TODO_LIST}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.TODO_LIST] && React.createElement(routeIcons[ROUTES.TODO_LIST], { size: 16 })}
            <span>{t('navigation:todoList')}</span>
          </Link>
          <Link
            to={ROUTES.TIMESHEET}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.TIMESHEET] && React.createElement(routeIcons[ROUTES.TIMESHEET], { size: 16 })}
            <span>{t('navigation:timesheet')}</span>
          </Link>
        </div>
      )}
    </div>
  );
});

export default TimesheetMenuDropdown;
