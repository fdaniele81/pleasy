import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { SelectionCheckbox } from '../../../shared/ui/table';
import { isRequired } from '../../../utils/validation/validationUtils';
import { useFormModal } from '../../../hooks/useFormModal';
import BaseModal from '../../../shared/components/BaseModal';
import DateInput from '../../../shared/ui/DateInput';

const HolidayModal = ({ isOpen, onClose, onConfirm, holiday = null }) => {
  const { t } = useTranslation(['holidays', 'common']);

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
      date: '',
      is_recurring: false
    },
    entity: holiday,
    isOpen,
    transformForEdit: (holiday) => ({
      name: holiday.name || '',
      date: holiday.date ? new Date(holiday.date).toLocaleDateString('en-CA') : '',
      is_recurring: holiday.is_recurring || false
    }),
    validate: (data) => {
      if (!isRequired(data.name)) {
        return t('holidays:holidayNameRequired');
      }
      if (!isRequired(data.date)) {
        return t('holidays:dateRequired');
      }
      return null;
    },
    onSubmit: async (data) => {
      const holidayData = {
        name: data.name.trim(),
        date: data.date,
        is_recurring: data.is_recurring
      };

      onConfirm(holidayData);
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
      entityName={t('holidays:entity')}
      icon={<Calendar className="text-cyan-600" size={24} />}
      isEditMode={isEditMode}
      error={errors.general}
      isSubmitting={isSubmitting}
      confirmButtonColor="cyan"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('holidays:holidayNameLabel')}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('holidays:holidayNamePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('holidays:dateLabel')}
          </label>
          <DateInput
            value={formData.date}
            onChange={(val) => handleChange('date', val)}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <SelectionCheckbox
            checked={formData.is_recurring}
            onChange={(e) => handleChange('is_recurring', e.target.checked)}
          />
          <span className="text-sm font-medium text-gray-700">
            {t('holidays:recurringLabel')}
          </span>
        </label>
      </div>
    </BaseModal>
  );
};

export default HolidayModal;
