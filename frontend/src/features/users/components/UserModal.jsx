import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { isRequired, isValidEmail } from '../../../utils/validation/validationUtils';
import { useFormModal } from '../../../hooks/useFormModal';
import BaseModal from '../../../shared/components/BaseModal';
import { ROLES } from '../../../constants';

const SymbolPreview = ({ letter, bgColor, letterColor }) => (
  <div
    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold tracking-tight select-none"
    style={{
      backgroundColor: bgColor || '#6B7280',
      color: letterColor || '#FFFFFF',
      boxShadow: `0 3px 12px ${bgColor || '#6B7280'}55`
    }}
  >
    {letter || '?'}
  </div>
);

const Label = ({ children }) => (
  <label className="block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wide">{children}</label>
);

const inputBase = 'w-full px-2.5 py-1.5 text-sm bg-gray-50/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 focus:bg-white transition-all';
const monoInput = 'flex-1 min-w-0 px-2 py-1.5 text-xs bg-gray-50/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 focus:bg-white font-mono transition-all';

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
      company_id: selectedCompanyId || '',
      must_change_password: false,
      symbol_letter: '',
      symbol_bg_color: '#6B7280',
      symbol_letter_color: '#FFFFFF'
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
        company_id: user.company_id || '',
        must_change_password: !!user.must_change_password,
        symbol_letter: user.symbol_letter || '',
        symbol_bg_color: user.symbol_bg_color || '#6B7280',
        symbol_letter_color: user.symbol_letter_color || '#FFFFFF'
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
        status_id: data.status_id,
        symbol_letter: data.symbol_letter || null,
        symbol_bg_color: data.symbol_bg_color,
        symbol_letter_color: data.symbol_letter_color
      };

      if (isAdmin && !isEditing) {
        userData.company_id = data.company_id;
      }

      if (!isEditing) {
        userData.password = data.password;
      }

      if (isAdmin) {
        userData.must_change_password = !!data.must_change_password;
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

  const getDefaultInitials = (name, surname) => {
    if (!name && !surname) return '?';
    const first = (name || '').trim();
    const last = (surname || '').trim();
    if (first && last) return (first[0] + last[0]).toUpperCase();
    const combined = (first || last);
    return combined.slice(0, 2).toUpperCase();
  };

  const previewLetter = formData.symbol_letter || getDefaultInitials(formData.name, formData.surname);

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
      size="lg"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleConfirmClick(); }}>
      {/* — DETTAGLI UTENTE — */}
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('users:detailsSection')}</p>
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>{t('users:firstNameLabel')}</Label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('users:firstNamePlaceholder')}
              className={inputBase}
            />
          </div>

          <div>
            <Label>{t('users:lastNameLabel')}</Label>
            <input
              type="text"
              value={formData.surname}
              onChange={(e) => handleChange('surname', e.target.value)}
              placeholder={t('users:lastNamePlaceholder')}
              className={inputBase}
            />
          </div>
        </div>

        <div>
          <Label>{t('users:emailLabel')}</Label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t('users:emailPlaceholder')}
            className={`${inputBase} ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isEditMode}
          />
          {isEditMode && (
            <p className="text-[10px] text-gray-400 mt-0.5">{t('users:emailReadonly')}</p>
          )}
        </div>

        {!isEditMode && (
          <div>
            <Label>{t('users:passwordLabel')}</Label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder={t('users:passwordPlaceholder')}
              className={inputBase}
            />
          </div>
        )}

        {isAdmin && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="must_change_password"
              checked={formData.must_change_password}
              onChange={(e) => handleChange('must_change_password', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="must_change_password" className="text-sm text-gray-700">
              {t('users:mustChangePasswordLabel')}
            </label>
          </div>
        )}

        {isAdmin && !isEditMode && companies.length > 0 && (
          <div>
            <Label>{t('users:companyLabel')}</Label>
            <select
              value={formData.company_id}
              onChange={(e) => handleChange('company_id', e.target.value)}
              className={inputBase}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>{t('users:roleLabel')}</Label>
            <select
              value={formData.role_id}
              onChange={(e) => handleChange('role_id', e.target.value)}
              className={inputBase}
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>{t('users:statusLabel')}</Label>
            <select
              value={formData.status_id}
              onChange={(e) => handleChange('status_id', e.target.value)}
              className={inputBase}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </div>

      {/* — SIMBOLO UTENTE — */}
      <div className="bg-gray-50/60 rounded-xl p-4 -mx-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('users:symbolSection')}</p>
          <SymbolPreview
            letter={previewLetter}
            bgColor={formData.symbol_bg_color}
            letterColor={formData.symbol_letter_color}
          />
        </div>
        <div className="grid grid-cols-[80px_1fr_1fr] gap-3">
          <div>
            <Label>{t('users:symbolLetterLabel')}</Label>
            <input
              type="text"
              value={formData.symbol_letter}
              onChange={(e) => handleChange('symbol_letter', e.target.value.toUpperCase().slice(0, 2))}
              placeholder={getDefaultInitials(formData.name, formData.surname)}
              maxLength={2}
              className={`${inputBase} text-center font-semibold tracking-wider`}
            />
          </div>
          <div>
            <Label>{t('users:symbolBgColorLabel')}</Label>
            <div className="flex gap-1.5">
              <input
                type="color"
                value={formData.symbol_bg_color}
                onChange={(e) => handleChange('symbol_bg_color', e.target.value)}
                className="h-[34px] w-10 rounded-lg cursor-pointer border border-gray-200 p-0.5 shrink-0"
              />
              <input
                type="text"
                value={formData.symbol_bg_color}
                onChange={(e) => handleChange('symbol_bg_color', e.target.value)}
                className={monoInput}
              />
            </div>
          </div>
          <div>
            <Label>{t('users:symbolLetterColorLabel')}</Label>
            <div className="flex gap-1.5">
              <input
                type="color"
                value={formData.symbol_letter_color}
                onChange={(e) => handleChange('symbol_letter_color', e.target.value)}
                className="h-[34px] w-10 rounded-lg cursor-pointer border border-gray-200 p-0.5 shrink-0"
              />
              <input
                type="text"
                value={formData.symbol_letter_color}
                onChange={(e) => handleChange('symbol_letter_color', e.target.value)}
                className={monoInput}
              />
            </div>
          </div>
        </div>
      </div>
      </form>
    </BaseModal>
  );
};

export default UserModal;
