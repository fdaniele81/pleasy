import React from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase } from 'lucide-react';
import { isRequired } from '../../../utils/validation/validationUtils';
import { useFormModal } from '../../../hooks/useFormModal';
import BaseModal from '../../../shared/components/BaseModal';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const SymbolPreview = ({ letter, bgColor, letterColor }) => (
  <div
    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm border border-gray-200"
    style={{ backgroundColor: bgColor || '#6B7280', color: letterColor || '#FFFFFF' }}
  >
    {letter || '?'}
  </div>
);

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
      color: '#6B7280',
      symbol_letter: '',
      symbol_bg_color: '#6B7280',
      symbol_letter_color: '#FFFFFF'
    },
    entity: client,
    isOpen,
    transformForEdit: (client) => ({
      client_key: client.client_key || '',
      client_name: client.client_name || '',
      status_id: client.status_id || 'ACTIVE',
      color: client.color || '#6B7280',
      symbol_letter: client.symbol_letter || '',
      symbol_bg_color: client.symbol_bg_color || client.color || '#6B7280',
      symbol_letter_color: client.symbol_letter_color || '#FFFFFF'
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
        color: data.color,
        symbol_letter: data.symbol_letter || null,
        symbol_bg_color: data.symbol_bg_color,
        symbol_letter_color: data.symbol_letter_color
      };

      onConfirm(clientData);
      onClose();
    }
  });

  const handleColorChange = (newColor) => {
    handleChange('color', newColor);
    handleChange('symbol_bg_color', newColor);
  };

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
      size="xl"
    >
      {/* Riga 1: Codice, Nome, Stato, Colore */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('clients:colorLabel')}
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-10 w-12 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#6B7280"
              className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Riga 2: Simbolo — Lettera, Colore sfondo, Colore lettera + Anteprima */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t('clients:symbolSection')}</h4>
        <div className="flex items-end gap-5">
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('clients:symbolLetterLabel')}
              </label>
              <select
                value={formData.symbol_letter}
                onChange={(e) => handleChange('symbol_letter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">—</option>
                {ALPHABET.map((letter) => (
                  <option key={letter} value={letter}>{letter}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('clients:symbolBgColorLabel')}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.symbol_bg_color}
                  onChange={(e) => handleChange('symbol_bg_color', e.target.value)}
                  className="h-10 w-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.symbol_bg_color}
                  onChange={(e) => handleChange('symbol_bg_color', e.target.value)}
                  className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('clients:symbolLetterColorLabel')}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.symbol_letter_color}
                  onChange={(e) => handleChange('symbol_letter_color', e.target.value)}
                  className="h-10 w-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.symbol_letter_color}
                  onChange={(e) => handleChange('symbol_letter_color', e.target.value)}
                  className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 pb-0.5">
            <span className="text-xs text-gray-500">{t('clients:symbolPreview')}</span>
            <SymbolPreview
              letter={formData.symbol_letter}
              bgColor={formData.symbol_bg_color}
              letterColor={formData.symbol_letter_color}
            />
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default ClientModal;
