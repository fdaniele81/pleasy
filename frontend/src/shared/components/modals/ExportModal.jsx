import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import BaseModal from '../BaseModal';
import DateInput from '../../ui/DateInput';
import { useFormModal } from '../../../hooks/useFormModal';
import { toISODate } from '../../../utils/date/dateUtils';

const getDefaultDates = () => {
  const today = new Date();
  const oneMonthLater = new Date(today);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  return {
    start_date: toISODate(today),
    end_date: toISODate(oneMonthLater)
  };
};

function ExportModal({ isOpen, onClose, onExport, title }) {
  const { t } = useTranslation(['planning', 'validation', 'common']);
  const resolvedTitle = title || t('planning:exportExcel');
  const {
    formData,
    errors,
    handleChange,
    handleSubmit,
    reset
  } = useFormModal({
    initialValues: getDefaultDates(),
    validate: (data) => {
      const newErrors = {};

      if (!data.start_date) {
        newErrors.start_date = t('validation:startDateRequired');
      }
      if (!data.end_date) {
        newErrors.end_date = t('validation:endDateRequired');
      }

      if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
        newErrors.end_date = t('validation:startBeforeEnd');
      }

      return newErrors;
    },
    onSubmit: async (data) => {
      await onExport({ startDate: data.start_date, endDate: data.end_date });
    },
    entity: null,
    isOpen
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={resolvedTitle}
      icon={<Download className="text-cyan-600" size={24} />}
      confirmText={t('common:export')}
      cancelText={t('common:cancel')}
      isEditMode={false}
      error={errors.general}
      size="md"
      confirmButtonColor="green"
    >
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('planning:exportDateStart')}
        </label>
        <DateInput
          value={formData.start_date}
          onChange={(val) => handleChange('start_date', val)}
          className="w-full"
        />
        {errors.start_date && (
          <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('planning:exportDateEnd')}
        </label>
        <DateInput
          value={formData.end_date}
          onChange={(val) => handleChange('end_date', val)}
          className="w-full"
        />
        {errors.end_date && (
          <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
        <p>{t('planning:exportHint')}</p>
      </div>
    </BaseModal>
  );
}

export default ExportModal;
