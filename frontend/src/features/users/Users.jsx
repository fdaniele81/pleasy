import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetCompaniesWithUsersQuery } from '../companies/api/companyEndpoints';
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation
} from './api/userEndpoints';
import { User, Edit2, Shield, Mail, KeyRound, Building } from 'lucide-react';
import UserModal from './components/UserModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import SearchFilter from '../../shared/components/SearchFilter';
import { getStatusBadgeColor } from '../../utils/ui/statusUtils';
import { useAuth } from '../../hooks';
import { ROLES } from '../../constants';
import PageHeader from '../../shared/ui/PageHeader';
import EmptyState from '../../shared/ui/EmptyState';
import Button from '../../shared/ui/Button';

function Users() {
  const { t } = useTranslation(['users', 'common']);
  const { data: companies = [], isLoading: loading } = useGetCompaniesWithUsersQuery();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [resetUserPassword] = useResetUserPasswordMutation();

  const { user: currentUser, isAdmin: isAdminFn } = useAuth();
  const isAdmin = isAdminFn();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('');

  const allUsers = isAdmin
    ? companies.flatMap(company =>
        (company.users || []).map(user => ({
          ...user,
          company_name: company.legal_name,
          company_key: company.company_key
        }))
      )
    : (companies[0]?.users || []);

  const filteredUsers = allUsers.filter(user => {
    if (isAdmin && selectedCompanyFilter && String(user.company_id) !== selectedCompanyFilter) {
      return false;
    }

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(term) ||
      user.name?.toLowerCase().includes(term) ||
      user.surname?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.role_id?.toLowerCase().includes(term) ||
      user.company_name?.toLowerCase().includes(term) ||
      user.company_key?.toLowerCase().includes(term)
    );
  });

  const handleCreateUser = async (userData) => {
    const targetCompanyId = isAdmin ? userData.company_id : companies[0]?.company_id;

    if (targetCompanyId) {
      try {
        await createUser({ companyId: targetCompanyId, userData }).unwrap();
      } catch (error) {
      }
    }
  };

  const handleUpdateUser = async (userData) => {
    if (editingUser) {
      try {
        const targetCompanyId = editingUser.company_id;

        await updateUser({
          companyId: targetCompanyId,
          userId: editingUser.user_id,
          userData: userData
        }).unwrap();
        setEditingUser(null);
      } catch (error) {
      }
    }
  };

  const handleDeleteUser = async (user) => {
    const targetCompanyId = user.company_id;

    if (targetCompanyId) {
      try {
        await deleteUser({ companyId: targetCompanyId, userId: user.user_id }).unwrap();
      } catch (error) {
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleResetPassword = (user) => {
    setResetPasswordUser(user);
    setIsResetPasswordModalOpen(true);
  };

  const handleConfirmResetPassword = async (newPassword) => {
    if (resetPasswordUser) {
      try {
        await resetUserPassword({
          userId: resetPasswordUser.user_id,
          newPassword
        }).unwrap();
        setIsResetPasswordModalOpen(false);
        setResetPasswordUser(null);
      } catch (error) {
      }
    }
  };

  const handleCloseResetPasswordModal = () => {
    setIsResetPasswordModalOpen(false);
    setResetPasswordUser(null);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case ROLES.PM:
        return 'bg-blue-100 text-blue-800';
      case ROLES.USER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && allUsers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6 pt-20">
          <div className="text-xl">{t('common:loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={editingUser ? handleUpdateUser : handleCreateUser}
        user={editingUser}
        currentUserRole={currentUser?.role_id}
        companies={companies}
        selectedCompanyId={editingUser?.company_id}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={handleCloseResetPasswordModal}
        onConfirm={handleConfirmResetPassword}
        userName={resetPasswordUser?.full_name || ''}
      />

      <div className="p-4">
        <div className="max-w-full mx-auto">
          <div className="mt-16"></div>

          <PageHeader
            icon={User}
            title={t('users:title')}
            description={isAdmin ? t('users:descriptionAdmin') : t('users:descriptionPm')}
            actionButton={{
              label: t('users:newUser'),
              onClick: () => setIsModalOpen(true)
            }}
          />

          {isAdmin && companies.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users:filterByCompany')}
              </label>
              <select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">{t('users:allCompanies')}</option>
                {companies.map(company => (
                  <option key={company.company_id} value={String(company.company_id)}>
                    {company.legal_name} ({company.company_key})
                  </option>
                ))}
              </select>
            </div>
          )}

          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={isAdmin ? t('users:searchPlaceholderAdmin') : t('users:searchPlaceholderPm')}
          />

          {filteredUsers.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('users:name')}
                      </th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('users:email')}
                      </th>
                      {isAdmin && (
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('users:company')}
                        </th>
                      )}
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('users:role')}
                      </th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common:status')}
                      </th>
                      <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common:actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-cyan-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {user.email}
                            </span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Building size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {user.company_name}
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Shield size={14} className="text-gray-400" />
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role_id)}`}>
                              {user.role_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(user.status_id)}`}>
                            {user.status_id}
                          </span>
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => handleEdit(user)}
                              variant="ghost"
                              color="blue"
                              size="sm"
                              icon={Edit2}
                              iconSize={18}
                              title={t('common:edit')}
                            />
                            <Button
                              onClick={() => handleResetPassword(user)}
                              variant="ghost"
                              color="blue"
                              size="sm"
                              icon={KeyRound}
                              iconSize={18}
                              title={t('users:resetPassword')}
                            />
                            <Button
                              confirmAction
                              onConfirm={() => handleDeleteUser(user)}
                              itemName={user.full_name}
                              size="md"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <EmptyState
              icon={User}
              title={searchTerm.trim() ? t('common:noResults') : t('users:noUsers')}
              message={
                searchTerm.trim()
                  ? `${t('users:noUsersForSearch')} "${searchTerm}"`
                  : t('users:emptyMessage')
              }
              action={!searchTerm.trim() ? {
                label: t('users:addUser'),
                onClick: () => setIsModalOpen(true)
              } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;
