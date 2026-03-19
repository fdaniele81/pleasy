import React from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase } from 'lucide-react';
import { isRequired } from '../../../utils/validation/validationUtils';
import { useFormModal } from '../../../hooks/useFormModal';
import BaseModal from '../../../shared/components/BaseModal';

// ricompila
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
    transformForEdit: (c) => ({
      client_key: c.client_key || '',
      client_name: c.client_name || '',
      status_id: c.status_id || 'ACTIVE',
      color: c.color || '#6B7280',
      symbol_letter: c.symbol_letter || '',
      symbol_bg_color: c.symbol_bg_color || c.color || '#6B7280',
      symbol_letter_color: c.symbol_letter_color || '#FFFFFF'
    }),
    validate: (data) => {
      if (!isRequired(data.client_key)) return t('clients:clientCodeRequired');
      if (!isRequired(data.client_name)) return t('clients:clientNameRequired');
      if (!isRequired(data.status_id)) return t('clients:statusRequired');
      return null;
    },
    onSubmit: async (data) => {
      onConfirm({
        client_key: data.client_key.trim().toUpperCase(),
        client_name: data.client_name.trim(),
        status_id: data.status_id,
        color: data.color,
        symbol_letter: data.symbol_letter || null,
        symbol_bg_color: data.symbol_bg_color,
        symbol_letter_color: data.symbol_letter_color
      });
      onClose();
    }
  });

  const handleColorChange = (newColor) => {
    handleChange('color', newColor);
    if (formData.symbol_bg_color === formData.color) {
      handleChange('symbol_bg_color', newColor);
    }
  };

  const getDefaultInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const previewLetter = formData.symbol_letter || getDefaultInitials(formData.client_name);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => handleSubmit()}
      entityName={t('clients:entity')}
      icon={<Briefcase className="text-cyan-600" size={24} />}
      isEditMode={isEditMode}
      error={errors.general}
      isSubmitting={isSubmitting}
      confirmButtonColor="cyan"
      size="xl"
    >
      {/* — DETTAGLI CLIENTE — */}
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('clients:detailsSection')}</p>
      <div className="grid grid-cols-[minmax(70px,1fr)_3fr_auto_auto] gap-3 items-start mb-4">
        <div>
          <Label>{t('clients:clientCodeLabel')}</Label>
          <input
            type="text"
            value={formData.client_key}
            onChange={(e) => handleChange('client_key', e.target.value.toUpperCase())}
            placeholder={t('clients:clientCodePlaceholder')}
            className={`${inputBase} ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isEditMode}
          />
          {isEditMode && (
            <p className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">{t('clients:clientCodeReadonly')}</p>
          )}
        </div>
        <div>
          <Label>{t('clients:clientNameLabel')}</Label>
          <input
            type="text"
            value={formData.client_name}
            onChange={(e) => handleChange('client_name', e.target.value)}
            placeholder={t('clients:clientNamePlaceholder')}
            className={inputBase}
          />
        </div>
        <div className="w-28">
          <Label>{t('clients:statusLabel')}</Label>
          <select
            value={formData.status_id}
            onChange={(e) => handleChange('status_id', e.target.value)}
            className={inputBase}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
        <div>
          <Label>{t('clients:colorLabel')}</Label>
          <div className="flex gap-1.5">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-[34px] w-10 rounded-lg cursor-pointer border border-gray-200 p-0.5 shrink-0"
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className={monoInput}
            />
          </div>
        </div>
      </div>

      {/* — SIMBOLO CLIENTE — */}
      <div className="bg-gray-50/60 rounded-xl p-4 -mx-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('clients:symbolSection')}</p>
          <SymbolPreview
            letter={previewLetter}
            bgColor={formData.symbol_bg_color}
            letterColor={formData.symbol_letter_color}
          />
        </div>
        <div className="grid grid-cols-[80px_1fr_1fr] gap-3">
          <div>
            <Label>{t('clients:symbolLetterLabel')}</Label>
            <input
              type="text"
              value={formData.symbol_letter}
              onChange={(e) => handleChange('symbol_letter', e.target.value.toUpperCase().slice(0, 2))}
              placeholder={getDefaultInitials(formData.client_name)}
              maxLength={2}
              className={`${inputBase} text-center font-semibold tracking-wider`}
            />
          </div>
          <div>
            <Label>{t('clients:symbolBgColorLabel')}</Label>
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
            <Label>{t('clients:symbolLetterColorLabel')}</Label>
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
    </BaseModal>
  );
};

export default ClientModal;
