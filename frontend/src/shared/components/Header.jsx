import React, { useState, useEffect, useRef, memo, lazy, Suspense, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Menu, X, Settings, FileBarChart, LogOut, KeyRound } from 'lucide-react';
import { routeIcons } from "../../constants/routeIcons";
import { ROLES, ROUTES, CONFIG_MENU_ROUTES, PM_FEATURES_MENU_ROUTES, REPORT_MENU_ROUTES } from "../../constants";
import { useAuth } from "../../hooks";
import {
  ConfigMenuDropdown,
  PMFeaturesMenuDropdown,
  ReportMenuDropdown,
  UserMenuDropdown,
  getMenuLinkClasses,
} from "./header/index";
import LanguageSwitcher from "./LanguageSwitcher";

const ChangePasswordModal = lazy(() => import("../../features/users/components/ChangePasswordModal"));

const HOME_URL = import.meta.env.VITE_HOME_URL || null;

const MobileNavLink = memo(function MobileNavLink({ to, icon, label, isActive, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon && React.createElement(icon, { size: 16, className: isActive ? 'text-blue-600' : 'text-gray-400' })}
      <span>{label}</span>
    </Link>
  );
});

const MobileNavGroup = memo(function MobileNavGroup({ icon, label, children }) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-2 px-3 py-2 mt-2">
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
});

const Header = memo(function Header() {
  const { t, i18n } = useTranslation(['navigation', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, handleLogout: logout } = useAuth();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isConfigMenuOpen, setIsConfigMenuOpen] = useState(false);
  const [isPmFeaturesMenuOpen, setIsPmFeaturesMenuOpen] = useState(false);
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const configMenuRef = useRef(null);
  const pmFeaturesMenuRef = useRef(null);
  const reportMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (configMenuRef.current && !configMenuRef.current.contains(event.target)) {
        setIsConfigMenuOpen(false);
      }
      if (pmFeaturesMenuRef.current && !pmFeaturesMenuRef.current.contains(event.target)) {
        setIsPmFeaturesMenuOpen(false);
      }
      if (reportMenuRef.current && !reportMenuRef.current.contains(event.target)) {
        setIsReportMenuOpen(false);
      }
    };

    if (isUserMenuOpen || isConfigMenuOpen || isPmFeaturesMenuOpen || isReportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen, isConfigMenuOpen, isPmFeaturesMenuOpen, isReportMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleLogoutClick = useCallback(async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
  }, [logout]);

  const handleLogin = useCallback(() => {
    navigate(ROUTES.LOGIN);
  }, [navigate]);

  const handleChangePassword = useCallback(() => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    setIsChangePasswordModalOpen(true);
  }, []);

  const toggleConfigMenu = useCallback(() => {
    setIsConfigMenuOpen(prev => !prev);
  }, []);

  const togglePmFeaturesMenu = useCallback(() => {
    setIsPmFeaturesMenuOpen(prev => !prev);
  }, []);

  const toggleReportMenu = useCallback(() => {
    setIsReportMenuOpen(prev => !prev);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const isActive = (path) => location.pathname === path;
  const isConfigMenuActive = CONFIG_MENU_ROUTES.includes(location.pathname);
  const isPmFeaturesMenuActive = PM_FEATURES_MENU_ROUTES.includes(location.pathname);
  const isReportMenuActive = REPORT_MENU_ROUTES.includes(location.pathname);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            {HOME_URL ? (
              <a
                href={`${HOME_URL}?lng=${i18n.language}`}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <img src="/pleasy.png" alt="pleasy" className="h-9" />
              </a>
            ) : (
              <Link
                to="/"
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <img src="/pleasy.png" alt="pleasy" className="h-9" />
              </Link>
            )}

            {/* Desktop nav - visible at xl and above */}
            {isAuthenticated && (
              <nav className="hidden xl:flex space-x-2">
                {user?.role_id === ROLES.ADMIN && (
                  <>
                    <Link
                      to={ROUTES.COMPANIES}
                      className={getMenuLinkClasses(isActive(ROUTES.COMPANIES))}
                    >
                      {routeIcons[ROUTES.COMPANIES] && React.createElement(routeIcons[ROUTES.COMPANIES], { size: 16 })}
                      <span>{t('navigation:companies')}</span>
                    </Link>
                    <Link
                      to={ROUTES.USERS}
                      className={getMenuLinkClasses(isActive(ROUTES.USERS))}
                    >
                      {routeIcons[ROUTES.USERS] && React.createElement(routeIcons[ROUTES.USERS], { size: 16 })}
                      <span>{t('navigation:users')}</span>
                    </Link>
                  </>
                )}

                {user?.role_id === ROLES.PM && (
                  <>
                    <Link
                      to={ROUTES.DASHBOARD}
                      className={getMenuLinkClasses(isActive(ROUTES.DASHBOARD))}
                    >
                      {routeIcons[ROUTES.DASHBOARD] && React.createElement(routeIcons[ROUTES.DASHBOARD], { size: 16 })}
                      <span>{t('navigation:dashboard')}</span>
                    </Link>

                    <ConfigMenuDropdown
                      isOpen={isConfigMenuOpen}
                      isActive={isConfigMenuActive}
                      onToggle={toggleConfigMenu}
                      menuRef={configMenuRef}
                    />

                    <PMFeaturesMenuDropdown
                      isOpen={isPmFeaturesMenuOpen}
                      isActive={isPmFeaturesMenuActive}
                      onToggle={togglePmFeaturesMenu}
                      menuRef={pmFeaturesMenuRef}
                    />

                    <ReportMenuDropdown
                      isOpen={isReportMenuOpen}
                      isActive={isReportMenuActive}
                      onToggle={toggleReportMenu}
                      menuRef={reportMenuRef}
                    />

                    <div className="h-8 w-px bg-gray-300 self-center" />

                    <Link
                      to={ROUTES.TIMESHEET}
                      className={getMenuLinkClasses(isActive(ROUTES.TIMESHEET))}
                    >
                      {routeIcons[ROUTES.TIMESHEET] && React.createElement(routeIcons[ROUTES.TIMESHEET], { size: 16 })}
                      <span>{t('navigation:timesheet')}</span>
                    </Link>
                  </>
                )}

                {user?.role_id === ROLES.USER && (
                  <>
                    <Link
                      to={ROUTES.TIMESHEET}
                      className={getMenuLinkClasses(isActive(ROUTES.TIMESHEET))}
                    >
                      {routeIcons[ROUTES.TIMESHEET] && React.createElement(routeIcons[ROUTES.TIMESHEET], { size: 16 })}
                      <span>{t('navigation:timesheet')}</span>
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Hamburger button - visible below xl */}
            {isAuthenticated && (
              <button
                className="xl:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Menu"
              >
                <Menu size={22} />
              </button>
            )}

            {!isAuthenticated && <LanguageSwitcher />}
            {/* Desktop user menu - visible at xl */}
            {isAuthenticated ? (
              <div className="hidden xl:block">
                <UserMenuDropdown
                  isOpen={isUserMenuOpen}
                  onToggle={toggleUserMenu}
                  menuRef={menuRef}
                  user={user}
                  onChangePassword={handleChangePassword}
                  onLogout={handleLogoutClick}
                />
              </div>
            ) : (
              location.pathname !== ROUTES.LOGIN && (
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                >
                  {t('common:login')}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer - slide-in from right */}
      {isAuthenticated && (
        <div className={`xl:hidden fixed inset-0 z-50 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ top: 0 }}>
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />

          {/* Drawer panel */}
          <div className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.full_name || user?.email}</p>
                <p className="text-xs text-gray-500">{user?.role_des || user?.role_id}</p>
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable nav content */}
            <nav className="flex-1 overflow-y-auto py-3 px-3">
              {user?.role_id === ROLES.ADMIN && (
                <div className="space-y-0.5">
                  <MobileNavLink to={ROUTES.COMPANIES} icon={routeIcons[ROUTES.COMPANIES]} label={t('navigation:companies')} isActive={isActive(ROUTES.COMPANIES)} onClick={closeMobileMenu} />
                  <MobileNavLink to={ROUTES.USERS} icon={routeIcons[ROUTES.USERS]} label={t('navigation:userDirectory')} isActive={isActive(ROUTES.USERS)} onClick={closeMobileMenu} />
                </div>
              )}

              {user?.role_id === ROLES.PM && (
                <>
                  {/* Dashboard */}
                  <div className="mb-2">
                    <MobileNavLink to={ROUTES.DASHBOARD} icon={routeIcons[ROUTES.DASHBOARD]} label={t('navigation:dashboard')} isActive={isActive(ROUTES.DASHBOARD)} onClick={closeMobileMenu} />
                  </div>

                  {/* Configurations group */}
                  <MobileNavGroup icon={<Settings size={14} />} label={t('navigation:configurations')}>
                    <MobileNavLink to={ROUTES.HOLIDAYS} icon={routeIcons[ROUTES.HOLIDAYS]} label={t('navigation:holidayManagement')} isActive={isActive(ROUTES.HOLIDAYS)} onClick={closeMobileMenu} />
                    <MobileNavLink to={ROUTES.USERS} icon={routeIcons[ROUTES.USERS]} label={t('navigation:userDirectory')} isActive={isActive(ROUTES.USERS)} onClick={closeMobileMenu} />
                    <MobileNavLink to={ROUTES.CLIENTS} icon={routeIcons[ROUTES.CLIENTS]} label={t('navigation:clientDirectory')} isActive={isActive(ROUTES.CLIENTS)} onClick={closeMobileMenu} />
                    <MobileNavLink to={ROUTES.PROJECTS} icon={routeIcons[ROUTES.PROJECTS]} label={t('navigation:projectManagement')} isActive={isActive(ROUTES.PROJECTS)} onClick={closeMobileMenu} />
                    <MobileNavLink to={ROUTES.TEMPLATE_CONFIGURATION} icon={routeIcons[ROUTES.TEMPLATE_CONFIGURATION]} label={t('navigation:templateReconciliation')} isActive={isActive(ROUTES.TEMPLATE_CONFIGURATION)} onClick={closeMobileMenu} />
                  </MobileNavGroup>

                  {/* PM Features group */}
                  <MobileNavGroup icon={React.createElement(routeIcons[ROUTES.PLANNING], { size: 14 })} label={t('navigation:pmFeatures')}>
                    <MobileNavLink to={ROUTES.ESTIMATOR} icon={routeIcons[ROUTES.ESTIMATOR]} label={t('navigation:projectEstimation')} isActive={isActive(ROUTES.ESTIMATOR)} onClick={closeMobileMenu} />
                    <MobileNavLink to={ROUTES.CAPACITY_PLAN} icon={routeIcons[ROUTES.CAPACITY_PLAN]} label={t('navigation:macroPlanning')} isActive={isActive(ROUTES.CAPACITY_PLAN)} onClick={closeMobileMenu} />
                    <MobileNavLink to={ROUTES.CONVERT_ESTIMATE_TO_PROJECT} icon={routeIcons[ROUTES.CONVERT_ESTIMATE_TO_PROJECT]} label={t('navigation:convertEstimate')} isActive={isActive(ROUTES.CONVERT_ESTIMATE_TO_PROJECT)} onClick={closeMobileMenu} />
                    <MobileNavLink to={ROUTES.PLANNING} icon={routeIcons[ROUTES.PLANNING]} label={t('navigation:plannedActivities')} isActive={isActive(ROUTES.PLANNING)} onClick={closeMobileMenu} />
                    <MobileNavLink to={ROUTES.TM_PLANNING} icon={routeIcons[ROUTES.TM_PLANNING]} label={t('navigation:calendarActivities')} isActive={isActive(ROUTES.TM_PLANNING)} onClick={closeMobileMenu} />
                  </MobileNavGroup>

                  {/* Report group */}
                  <MobileNavGroup icon={<FileBarChart size={14} />} label={t('navigation:report')}>
                    <MobileNavLink to={ROUTES.TIMEOFF_PLAN} icon={routeIcons[ROUTES.TIMEOFF_PLAN]} label={t('navigation:timeOffPlan')} isActive={isActive(ROUTES.TIMEOFF_PLAN)} onClick={closeMobileMenu} />
                    <MobileNavLink to={ROUTES.TIMESHEET_SNAPSHOTS} icon={routeIcons[ROUTES.TIMESHEET_SNAPSHOTS]} label={t('navigation:submittedTimesheets')} isActive={isActive(ROUTES.TIMESHEET_SNAPSHOTS)} onClick={closeMobileMenu} />
                    <MobileNavLink to={ROUTES.RECONCILIATION} icon={routeIcons[ROUTES.RECONCILIATION]} label={t('navigation:timesheetReconciliation')} isActive={isActive(ROUTES.RECONCILIATION)} onClick={closeMobileMenu} />
                  </MobileNavGroup>

                  {/* Timesheet separator */}
                  <div className="my-2 border-t border-gray-100" />
                  <MobileNavLink to={ROUTES.TIMESHEET} icon={routeIcons[ROUTES.TIMESHEET]} label={t('navigation:timesheet')} isActive={isActive(ROUTES.TIMESHEET)} onClick={closeMobileMenu} />
                </>
              )}

              {user?.role_id === ROLES.USER && (
                <MobileNavLink to={ROUTES.TIMESHEET} icon={routeIcons[ROUTES.TIMESHEET]} label={t('navigation:timesheet')} isActive={isActive(ROUTES.TIMESHEET)} onClick={closeMobileMenu} />
              )}
            </nav>

            {/* Drawer footer - user actions */}
            <div className="border-t border-gray-100 px-3 py-3 space-y-1">
              <button
                onClick={handleChangePassword}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <KeyRound size={16} className="text-gray-400" />
                <span>{t('navigation:changePassword')}</span>
              </button>
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                <span>{t('navigation:logout')}</span>
              </button>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-gray-400">{t('common:language')}</span>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      </Suspense>
    </header>
  );
});

export default Header;
