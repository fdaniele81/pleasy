import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { isRequired, isValidEmail } from '../../../utils/validation/validationUtils';
import { useFormModal } from '../../../hooks/useFormModal';
import BaseModal from '../../../shared/components/BaseModal';
import { ROLES } from '../../../constants';

const UserModal = ({
  isOpen,
  onClose,
  onConfirm,
  user = null,
  currentUserRole,
  companies = [],
  selectedCompanyId = null
}) => {
  const { t } = useTranslation(['users', 'common']);
  const isAdmin = currentUserRole === ROLES.ADMIN;

  const {
    formData,
    errors,
    isEditMode,
    isSubmitting,
    handleChange,
    handleSubmit
  } = useFormModal({
    initialValues: {
      name: '',
      surname: '',
      email: '',
      password: '',
      role_id: ROLES.USER,
      status_id: 'ACTIVE',
      company_id: selectedCompanyId || ''
    },
    entity: user,
    isOpen,
    transformForEdit: (user) => {
      const fullName = user.full_name || '';
      const nameParts = fullName.split(' ');
      const name = nameParts[0] || '';
      const surname = nameParts.slice(1).join(' ') || '';

      return {
        name,
        surname,
        email: user.email || '',
        role_id: user.role_id || ROLES.USER,
        status_id: user.status_id || 'ACTIVE',
        company_id: user.company_id || ''
      };
    },
    validate: (data) => {
      if (!isRequired(data.name)) {
        return t('users:nameRequired');
      }
      if (!isRequired(data.surname)) {
        return t('users:surnameRequired');
      }
      if (!isRequired(data.email)) {
        return t('users:emailRequired');
      }
      if (!isValidEmail(data.email)) {
        return t('users:emailInvalid');
      }
      if (!isRequired(data.role_id)) {
        return t('users:roleRequired');
      }
      const isEditing = !!user;
      if (isAdmin && !isEditing && !isRequired(data.company_id)) {
        return t('users:companyRequired');
      }
      if (!isEditing && !isRequired(data.password)) {
        return t('users:passwordRequired');
      }
      if (!isEditing && data.password && data.password.length < 6) {
        return t('users:passwordMinLength');
      }
      return null;
    },
    onSubmit: async (data) => {
      const isEditing = !!user;

      const userData = {
        full_name: `${data.name.trim()} ${data.surname.trim()}`.trim(),
        email: data.email.trim().toLowerCase(),
        role_id: data.role_id,
        status_id: data.status_id
      };

      if (isAdmin && !isEditing) {
        userData.company_id = data.company_id;
      }

      if (!isEditing) {
        userData.password = data.password;
      }

      onConfirm(userData);
      onClose();
    }
  });

  const handleConfirmClick = async () => {
    await handleSubmit();
  };

  const availableRoles = isAdmin
    ? [ROLES.ADMIN, ROLES.PM, ROLES.USER]
    : [ROLES.PM, ROLES.USER];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirmClick}
      entityName={t('users:entity')}
      icon={<User className="text-cyan-600" size={24} />}
      isEditMode={isEditMode}
      error={errors.general}
      isSubmitting={isSubmitting}
      confirmButtonColor="cyan"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users:firstNameLabel')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('users:firstNamePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users:lastNameLabel')}
            </label>
            <input
              type="text"
              value={formData.surname}
              onChange={(e) => handleChange('surname', e.target.value)}
              placeholder={t('users:lastNamePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('users:emailLabel')}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t('users:emailPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isEditMode}
          />
          {isEditMode && (
            <p className="text-xs text-gray-500 mt-1">
              {t('users:emailReadonly')}
            </p>
          )}
        </div>

        {!isEditMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users:passwordLabel')}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder={t('users:passwordPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        )}

        {isAdmin && !isEditMode && companies.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users:companyLabel')}
            </label>
            <select
              value={formData.company_id}
              onChange={(e) => handleChange('company_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">{t('users:selectCompany')}</option>
              {companies.map(company => (
                <option key={company.company_id} value={company.company_id}>
                  {company.legal_name} ({company.company_key})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users:roleLabel')}
            </label>
            <select
              value={formData.role_id}
              onChange={(e) => handleChange('role_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users:statusLabel')}
            </label>
            <select
              value={formData.status_id}
              onChange={(e) => handleChange('status_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default UserModal;
