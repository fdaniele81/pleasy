import React, { useState, useMemo, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, UserMinus, Search, Loader2 } from 'lucide-react';

const UserAssignmentPanel = memo(function UserAssignmentPanel({
  assignedUsers = [],
  availableUsers = [],

  onAddUser,
  onRemoveUser,

  isLoadingAvailable = false,
  isLoadingAssigned = false,
  isAdding = false,
  isRemoving = false,

  title,
  icon = null,
  emptyAssignedMessage,
  emptyAvailableMessage,
  searchPlaceholder,
  showRoleInAvailable = false,
  maxHeightAvailable = 'max-h-40',

  renderAssignedChip = null,
  renderAvailableItem = null,

  className = '',
}) {
  const { t } = useTranslation(['common']);
  const resolvedTitle = title || t('common:users');
  const resolvedEmptyAssignedMessage = emptyAssignedMessage || t('common:noUserAssigned');
  const resolvedEmptyAvailableMessage = emptyAvailableMessage || t('common:noUserAvailable');
  const resolvedSearchPlaceholder = searchPlaceholder || t('common:searchUser');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingUserId, setProcessingUserId] = useState(null);

  const filteredAvailableUsers = useMemo(() => {
    const assignedIds = assignedUsers.map(u => u.user_id);
    return availableUsers
      .filter(user => !assignedIds.includes(user.user_id))
      .filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [availableUsers, assignedUsers, searchTerm]);

  const handleAdd = useCallback(async (userId) => {
    setProcessingUserId(userId);
    try {
      await onAddUser(userId);
    } finally {
      setProcessingUserId(null);
    }
  }, [onAddUser]);

  const handleRemove = useCallback(async (userId) => {
    setProcessingUserId(userId);
    try {
      await onRemoveUser(userId);
    } finally {
      setProcessingUserId(null);
    }
  }, [onRemoveUser]);

  const defaultRenderAssignedChip = (user) => (
    <button
      key={user.user_id}
      onClick={() => handleRemove(user.user_id)}
      disabled={isRemoving || processingUserId === user.user_id}
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-sm hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 cursor-pointer"
      title={t('common:remove')}
      aria-label={t('common:removeUser', { name: user.full_name })}
    >
      <span className="font-medium text-gray-700">{user.full_name}</span>
      {processingUserId === user.user_id ? (
        <Loader2 size={16} className="animate-spin text-red-400" />
      ) : (
        <UserMinus size={16} className="text-red-400" />
      )}
    </button>
  );

  const defaultRenderAvailableItem = (user) => (
    <button
      key={user.user_id}
      onClick={() => handleAdd(user.user_id)}
      disabled={isAdding || processingUserId === user.user_id}
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:bg-cyan-50 hover:border-cyan-300 transition-colors disabled:opacity-50 cursor-pointer"
      title={t('common:add')}
      aria-label={t('common:addUser', { name: user.full_name })}
    >
      <span className="font-medium text-gray-700 text-sm">{user.full_name}</span>
      {showRoleInAvailable && user.role_id && (
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {user.role_id}
        </span>
      )}
      {processingUserId === user.user_id ? (
        <Loader2 size={16} className="animate-spin text-cyan-600" />
      ) : (
        <UserPlus size={16} className="text-cyan-600" />
      )}
    </button>
  );

  const renderAssignedChipFn = renderAssignedChip || defaultRenderAssignedChip;
  const renderAvailableItemFn = renderAvailableItem || defaultRenderAvailableItem;

  return (
    <div className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-gray-700">{resolvedTitle}</h3>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">{t('common:assigned')}</p>
        {isLoadingAssigned ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
          </div>
        ) : assignedUsers.length === 0 ? (
          <p className="text-sm text-gray-400 italic">{resolvedEmptyAssignedMessage}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignedUsers.map(renderAssignedChipFn)}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">{t('common:addLabel')}</p>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder={resolvedSearchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {isLoadingAvailable ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
          </div>
        ) : filteredAvailableUsers.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-2">{resolvedEmptyAvailableMessage}</p>
        ) : (
          <div className={`${maxHeightAvailable} overflow-y-auto`}>
            <div className="flex flex-wrap gap-2">
              {filteredAvailableUsers.map(renderAvailableItemFn)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default UserAssignmentPanel;
