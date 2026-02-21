import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';

const ResetPasswordModal = ({ isOpen, onClose, onConfirm, userName }) => {
  const { t } = useTranslation(['users', 'common']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError('');

    if (!newPassword) {
      setError(t('users:newPasswordRequired'));
      return;
    }

    if (newPassword.length < 4) {
      setError(t('users:passwordMinLength4'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('users:passwordsMustMatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(newPassword);
    } catch (err) {
      setError(err.message || t('errors:passwordResetError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={t('users:resetPasswordTitle')}
      icon={<KeyRound className="text-cyan-600" size={24} />}
      confirmText={t('users:resetPassword')}
      cancelText={t('common:cancel')}
      error={error}
      isSubmitting={isSubmitting}
      confirmButtonColor="cyan"
    >
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {t('users:resetPasswordMessage')}
          </p>
          <p className="text-base font-medium text-gray-800 mt-1">
            {userName}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('users:newPasswordLabel')}
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-10"
              placeholder={t('users:newPasswordPlaceholder')}
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('users:confirmPasswordLabel')}
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-10"
              placeholder={t('users:confirmPasswordPlaceholder')}
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
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            {t('users:passwordMinLengthHint')}
          </p>
        </div>
      </div>
    </BaseModal>
  );
};

export default ResetPasswordModal;
