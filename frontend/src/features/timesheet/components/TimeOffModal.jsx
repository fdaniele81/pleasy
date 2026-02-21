import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { useFormModal } from '../../../hooks/useFormModal';
import BaseModal from '../../../shared/components/BaseModal';
import { formatDateLocal } from '../../../utils/table/tableUtils';

const TimeOffModal = ({
  isOpen,
  onClose,
  onConfirm,
  timeOffData = null,
  date
}) => {
  const { t } = useTranslation(['timesheet', 'common']);

  const { formData, errors, isEditMode, isSubmitting, handleChange, handleSubmit } = useFormModal({
    initialValues: {
      hours: 0,
      details: ''
    },
    entity: timeOffData,
    isOpen,
    transformForEdit: (data) => ({
      hours: data.hours || 0,
      details: data.details || ''
    }),
    validate: (data) => {
      if (data.hours === undefined || data.hours === null || data.hours < 0) {
        return t('timesheet:hoursValidation');
      }
      return null;
    },
    onSubmit: async (data) => {
      onConfirm({
        hours: parseFloat(data.hours) || 0,
        details: data.details?.trim() || ''
      });
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
      title={`Time Off - ${date ? formatDateLocal(date) : ''}`}
      icon={<FileText className="text-cyan-600" size={24} />}
      isEditMode={isEditMode}
      error={errors.general}
      isSubmitting={isSubmitting}
      confirmButtonColor="cyan"
      size="md"
    >
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('timesheet:hoursRequired')}
        </label>
        <input
          type="number"
          step="0.5"
          min="0"
          value={formData.hours}
          onChange={(e) => handleChange('hours', e.target.value)}
          placeholder="8"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('timesheet:detailsOptional')}
        </label>
        <textarea
          value={formData.details}
          onChange={(e) => handleChange('details', e.target.value)}
          placeholder={t('timesheet:detailsPlaceholder')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
        />
      </div>

      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>{t('timesheet:zeroHoursNote')}</strong> {t('timesheet:zeroHoursHint')}
        </p>
      </div>
    </BaseModal>
  );
};

export default TimeOffModal;
