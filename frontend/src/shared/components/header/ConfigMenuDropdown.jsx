import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Settings } from 'lucide-react';
import { routeIcons } from '../../../constants/routeIcons';
import { ROUTES } from '../../../constants';
import { getMenuLinkClasses, DROPDOWN_ITEM_CLASSES, DROPDOWN_CONTAINER_CLASSES } from './menuUtils';

const ConfigMenuDropdown = memo(function ConfigMenuDropdown({
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
        <Settings size={16} />
        <span>{t('navigation:configurations')}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={DROPDOWN_CONTAINER_CLASSES}>
          <Link
            to={ROUTES.HOLIDAYS}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.HOLIDAYS] && React.createElement(routeIcons[ROUTES.HOLIDAYS], { size: 16 })}
            <span>{t('navigation:holidayManagement')}</span>
          </Link>
          <Link
            to={ROUTES.USERS}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.USERS] && React.createElement(routeIcons[ROUTES.USERS], { size: 16 })}
            <span>{t('navigation:userDirectory')}</span>
          </Link>
          <Link
            to={ROUTES.CLIENTS}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.CLIENTS] && React.createElement(routeIcons[ROUTES.CLIENTS], { size: 16 })}
            <span>{t('navigation:clientDirectory')}</span>
          </Link>
          <Link
            to={ROUTES.PROJECTS}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.PROJECTS] && React.createElement(routeIcons[ROUTES.PROJECTS], { size: 16 })}
            <span>{t('navigation:projectManagement')}</span>
          </Link>
          <Link
            to={ROUTES.TEMPLATE_CONFIGURATION}
            className={DROPDOWN_ITEM_CLASSES}
            onClick={onToggle}
          >
            {routeIcons[ROUTES.TEMPLATE_CONFIGURATION] && React.createElement(routeIcons[ROUTES.TEMPLATE_CONFIGURATION], { size: 16 })}
            <span>{t('navigation:templateReconciliation')}</span>
          </Link>
        </div>
      )}
    </div>
  );
});

export default ConfigMenuDropdown;
