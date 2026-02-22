import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, User, Key, LogOut } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';

const UserMenuDropdown = memo(function UserMenuDropdown({
  isOpen,
  onToggle,
  menuRef,
  user,
  onChangePassword,
  onLogout,
}) {
  const { t } = useTranslation(['common', 'navigation']);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        <User size={18} />
        <span className="font-medium">
          {user?.full_name || user?.email}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500">{t('common:role')}</p>
            <p className="text-sm font-medium text-gray-700">{user?.role_id}</p>
          </div>

          <button
            onClick={onChangePassword}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Key size={16} />
            <span>{t('navigation:changePassword')}</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
          >
            <LogOut size={16} />
            <span>{t('navigation:logout')}</span>
          </button>

          <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">{t('common:language')}</span>
            <LanguageSwitcher />
          </div>

          <div className="px-4 py-1.5 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400">v{__APP_VERSION__}</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default UserMenuDropdown;
