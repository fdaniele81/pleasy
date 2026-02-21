import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { routeIcons } from '../../../constants/routeIcons';
import { ROUTES } from '../../../constants';
import { getMenuLinkClasses, DROPDOWN_ITEM_CLASSES, DROPDOWN_CONTAINER_CLASSES } from './menuUtils';

const PMFeaturesMenuDropdown = memo(function PMFeaturesMenuDropdown({
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
        {routeIcons[ROUTES.PLANNING] && React.createElement(routeIcons[ROUTES.PLANNING], { size: 16 })}
        <span>{t('navigation:pmFeatures')}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={DROPDOWN_CONTAINER_CLASSES}>
          <Link
            to={ROUTES.ESTIMATOR}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.ESTIMATOR] && React.createElement(routeIcons[ROUTES.ESTIMATOR], { size: 16 })}
            <span>{t('navigation:projectEstimation')}</span>
          </Link>
          <Link
            to={ROUTES.CAPACITY_PLAN}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.CAPACITY_PLAN] && React.createElement(routeIcons[ROUTES.CAPACITY_PLAN], { size: 16 })}
            <span>{t('navigation:macroPlanning')}</span>
          </Link>
          <Link
            to={ROUTES.CONVERT_ESTIMATE_TO_PROJECT}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.CONVERT_ESTIMATE_TO_PROJECT] && React.createElement(routeIcons[ROUTES.CONVERT_ESTIMATE_TO_PROJECT], { size: 16 })}
            <span>{t('navigation:convertEstimate')}</span>
          </Link>
          <Link
            to={ROUTES.PLANNING}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.PLANNING] && React.createElement(routeIcons[ROUTES.PLANNING], { size: 16 })}
            <span>{t('navigation:plannedActivities')}</span>
          </Link>
          <Link
            to={ROUTES.TM_PLANNING}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.HOLIDAYS] && React.createElement(routeIcons[ROUTES.HOLIDAYS], { size: 16 })}
            <span>{t('navigation:calendarActivities')}</span>
          </Link>
        </div>
      )}
    </div>
  );
});

export default PMFeaturesMenuDropdown;
