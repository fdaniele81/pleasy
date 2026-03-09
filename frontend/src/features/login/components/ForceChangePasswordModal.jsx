import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useChangePasswordMutation } from '../../users/api/userEndpoints';
import { useAuth } from '../../../hooks';
import logger from '../../../utils/logger';

const ForceChangePasswordModal = ({ isOpen, onPasswordChanged }) => {
  const { t } = useTranslation(['users', 'common']);
  const { user } = useAuth();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.new_password || !formData.confirm_password) {
      setError(t('users:newPasswordRequiredChange'));
      return;
    }

    if (formData.new_password.length < 8 || !/[A-Z]/.test(formData.new_password) || !/[a-z]/.test(formData.new_password) || !/[0-9]/.test(formData.new_password)) {
      setError(t('users:passwordMinLengthHint'));
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError(t('users:passwordsMustMatch'));
      return;
    }

    if (formData.current_password === formData.new_password) {
      setError(t('users:newPasswordMustDiffer'));
      return;
    }

    try {
      await changePassword({
        currentPassword: formData.current_password,
        newPassword: formData.new_password,
      }).unwrap();

      setSuccess(true);
      setTimeout(() => {
        onPasswordChanged();
      }, 2000);
    } catch (err) {
      logger.error('Force change password failed:', err);
      const { translateError } = await import('../../../utils/translateError');
      setError(translateError(err.data, err.message || 'Errore durante il cambio password'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {t('users:changePasswordTitle')}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {t('users:forceChangePasswordMessage', 'Devi cambiare la password prima di continuare.')}
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
            {t('users:passwordChanged', 'Password aggiornata. Verrai riportato al login...')}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">{t('users:userLabel')}</p>
            <p className="text-base font-medium text-gray-800 mt-1">
              {user?.full_name || user?.email}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users:currentPasswordLabel')}
            </label>
            <input
              type="password"
              value={formData.current_password}
              onChange={(e) => handleChange('current_password', e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder={t('users:currentPasswordPlaceholder')}
              disabled={isLoading || success}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users:newPassword')}
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={formData.new_password}
                onChange={(e) => handleChange('new_password', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder={t('users:newPasswordPlaceholderChange')}
                disabled={isLoading || success}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('users:confirmNewPasswordLabel')}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={(e) => handleChange('confirm_password', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder={t('users:confirmNewPasswordPlaceholder')}
                disabled={isLoading || success}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">{t('users:passwordMinLengthHint')}</p>
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isLoading || success
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? t('common:saving', 'Salvataggio...') : t('common:confirm')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePasswordModal;
