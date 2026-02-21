import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import { useFormModal } from '../../../hooks/useFormModal';
import { useChangePasswordMutation } from '../api/userEndpoints';
import { useAuth } from '../../../hooks';
import logger from '../../../utils/logger';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation(['users', 'common']);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState('');

  const { user } = useAuth();
  const [changePassword] = useChangePasswordMutation();

  const {
    formData,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting
  } = useFormModal({
    initialValues: {
      current_password: '',
      new_password: '',
      confirm_password: ''
    },
    validate: (data) => {
      const newErrors = {};

      if (!data.current_password) {
        newErrors.current_password = t('users:currentPasswordRequired');
      }
      if (!data.new_password) {
        newErrors.new_password = t('users:newPasswordRequiredChange');
      }
      if (!data.confirm_password) {
        newErrors.confirm_password = t('users:confirmPasswordRequired');
      }

      if (data.new_password && data.new_password.length < 4) {
        newErrors.new_password = t('users:newPasswordMinLength');
      }

      if (data.new_password && data.confirm_password && data.new_password !== data.confirm_password) {
        newErrors.confirm_password = t('users:passwordsMustMatch');
      }

      if (data.current_password && data.new_password && data.current_password === data.new_password) {
        newErrors.new_password = t('users:newPasswordMustDiffer');
      }

      return newErrors;
    },
    onSubmit: async (data) => {
      try {
        const response = await changePassword({
          currentPassword: data.current_password,
          newPassword: data.new_password
        }).unwrap();
        setSuccess(response.message || 'Password aggiornata correttamente');

        setTimeout(() => {
          handleClose();
        }, 2000);
      } catch (err) {
        logger.error('Errore cambio password:', err);
        throw new Error(err.data?.error || err.message || 'Errore durante il cambio password');
      }
    },
    entity: null,
    isOpen
  });

  const handleClose = () => {
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleSubmit}
      title={t('users:changePasswordTitle')}
      icon={<Lock className="text-cyan-600" size={24} />}
      confirmText={t('common:confirm')}
      cancelText={t('common:cancel')}
      isEditMode={false}
      error={errors.general}
      isSubmitting={isSubmitting}
      size="md"
      confirmButtonColor="blue"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-600">
          {t('users:userLabel')}
        </p>
        <p className="text-base font-medium text-gray-800 mt-1">
          {user?.full_name || user?.email}
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('users:currentPasswordLabel')}
        </label>
        <div className="relative">
          <input
            type={showCurrentPassword ? 'text' : 'password'}
            name="current_password"
            value={formData.current_password}
            onChange={(e) => handleChange('current_password', e.target.value)}
            className={`w-full px-3 py-2 border-2 ${
              errors.current_password ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:border-blue-500`}
            placeholder={t('users:currentPasswordPlaceholder')}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.current_password && (
          <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('users:newPassword')}
        </label>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            name="new_password"
            value={formData.new_password}
            onChange={(e) => handleChange('new_password', e.target.value)}
            className={`w-full px-3 py-2 border-2 ${
              errors.new_password ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:border-blue-500`}
            placeholder={t('users:newPasswordPlaceholderChange')}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.new_password && (
          <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('users:confirmNewPasswordLabel')}
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirm_password"
            value={formData.confirm_password}
            onChange={(e) => handleChange('confirm_password', e.target.value)}
            className={`w-full px-3 py-2 border-2 ${
              errors.confirm_password ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:border-blue-500`}
            placeholder={t('users:confirmNewPasswordPlaceholder')}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.confirm_password && (
          <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          {t('users:passwordMinLengthHint')}
        </p>
      </div>
      </form>
    </BaseModal>
  );
};

export default ChangePasswordModal;
