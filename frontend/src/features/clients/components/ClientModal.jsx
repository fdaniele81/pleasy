import React from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase } from 'lucide-react';
import { isRequired } from '../../../utils/validation/validationUtils';
import { useFormModal } from '../../../hooks/useFormModal';
import BaseModal from '../../../shared/components/BaseModal';

const ClientModal = ({ isOpen, onClose, onConfirm, client = null }) => {
  const { t } = useTranslation(['clients', 'common']);

  const {
    formData,
    errors,
    isEditMode,
    isSubmitting,
    handleChange,
    handleSubmit
  } = useFormModal({
    initialValues: {
      client_key: '',
      client_name: '',
      status_id: 'ACTIVE',
      color: '#6B7280'
    },
    entity: client,
    isOpen,
    transformForEdit: (client) => ({
      client_key: client.client_key || '',
      client_name: client.client_name || '',
      status_id: client.status_id || 'ACTIVE',
      color: client.color || '#6B7280'
    }),
    validate: (data) => {
      if (!isRequired(data.client_key)) {
        return t('clients:clientCodeRequired');
      }
      if (!isRequired(data.client_name)) {
        return t('clients:clientNameRequired');
      }
      if (!isRequired(data.status_id)) {
        return t('clients:statusRequired');
      }
      return null;
    },
    onSubmit: async (data) => {
      const clientData = {
        client_key: data.client_key.trim().toUpperCase(),
        client_name: data.client_name.trim(),
        status_id: data.status_id,
        color: data.color
      };

      onConfirm(clientData);
      onClose();
    }
  });

  const handleConfirmClick = async () => {
    await handleSubmit();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirmClick}
      entityName={t('clients:entity')}
      icon={<Briefcase className="text-cyan-600" size={24} />}
      isEditMode={isEditMode}
      error={errors.general}
      isSubmitting={isSubmitting}
      confirmButtonColor="cyan"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('clients:clientCodeLabel')}
          </label>
          <input
            type="text"
            value={formData.client_key}
            onChange={(e) => handleChange('client_key', e.target.value.toUpperCase())}
            placeholder={t('clients:clientCodePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isEditMode}
          />
          {isEditMode && (
            <p className="text-xs text-gray-500 mt-1">
              {t('clients:clientCodeReadonly')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('clients:clientNameLabel')}
          </label>
          <input
            type="text"
            value={formData.client_name}
            onChange={(e) => handleChange('client_name', e.target.value)}
            placeholder={t('clients:clientNamePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('clients:statusLabel')}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('clients:colorLabel')}
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
              className="h-10 w-16 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
              placeholder="#6B7280"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
            />
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default ClientModal;
