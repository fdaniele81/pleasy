import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { isRequired } from '../../../utils/validation/validationUtils';
import { useFormModal } from '../../../hooks/useFormModal';
import BaseModal from '../../../shared/components/BaseModal';

const CompanyModal = ({ isOpen, onClose, onConfirm, company = null }) => {
  const { t } = useTranslation(['companies', 'common']);

  const {
    formData,
    errors,
    isEditMode,
    isSubmitting,
    handleChange,
    handleSubmit
  } = useFormModal({
    initialValues: {
      company_key: '',
      legal_name: '',
      vat_number: '',
      status_id: 'ACTIVE'
    },
    entity: company,
    isOpen,
    transformForEdit: (company) => ({
      company_key: company.company_key || '',
      legal_name: company.legal_name || '',
      vat_number: company.vat_number || '',
      status_id: company.status_id || 'ACTIVE'
    }),
    validate: (data) => {
      if (!isRequired(data.company_key)) {
        return t('companies:companyCodeRequired');
      }
      if (!isRequired(data.legal_name)) {
        return t('companies:businessNameRequired');
      }
      if (!isRequired(data.vat_number)) {
        return t('companies:vatRequired');
      }
      if (!isRequired(data.status_id)) {
        return t('companies:statusRequired');
      }
      return null;
    },
    onSubmit: async (data) => {
      const companyData = {
        company_key: data.company_key.trim(),
        legal_name: data.legal_name.trim(),
        vat_number: data.vat_number.trim(),
        status_id: data.status_id
      };

      onConfirm(companyData);
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
      entityName={t('companies:entity')}
      icon={<Building2 className="text-cyan-600" size={24} />}
      isEditMode={isEditMode}
      error={errors.general}
      isSubmitting={isSubmitting}
      confirmButtonColor="cyan"
    >
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('companies:companyCodeLabel')}
        </label>
        <input
          type="text"
          value={formData.company_key}
          onChange={(e) => handleChange('company_key', e.target.value)}
          placeholder={t('companies:companyCodePlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={isEditMode}
        />
        {isEditMode && (
          <p className="text-xs text-gray-500 mt-1">
            {t('companies:companyCodeReadonly')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('companies:businessNameLabel')}
          </label>
          <input
            type="text"
            value={formData.legal_name}
            onChange={(e) => handleChange('legal_name', e.target.value)}
            placeholder={t('companies:businessNamePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('companies:vatLabel')}
          </label>
          <input
            type="text"
            value={formData.vat_number}
            onChange={(e) => handleChange('vat_number', e.target.value)}
            placeholder={t('companies:vatPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('companies:statusLabel')}
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
    </BaseModal>
  );
};

export default CompanyModal;
