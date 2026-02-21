import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import { useFormModal } from '../../../hooks/useFormModal';

const InitialActualModal = ({ isOpen, onClose, onConfirm, taskTitle, currentValue = 0 }) => {
  const { t } = useTranslation(['planning', 'common']);
  const inputRef = useRef(null);

  const {
    formData,
    errors,
    handleChange,
    handleSubmit
  } = useFormModal({
    initialValues: {
      initial_actual: currentValue?.toString() || '0'
    },
    validate: (data) => {
      const newErrors = {};
      const value = parseFloat(data.initial_actual);

      if (isNaN(value)) {
        newErrors.initial_actual = t('planning:invalidNumericValue');
      } else if (value < 0) {
        newErrors.initial_actual = t('planning:negativeValueError');
      }

      return Object.keys(newErrors).length > 0 ? newErrors : null;
    },
    onSubmit: async (data) => {
      const value = parseFloat(data.initial_actual);
      onConfirm(value);
    },
    entity: null,
    isOpen
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleChange(name, value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={t('planning:initialActualTitle')}
      icon={<Clock className="text-cyan-600" size={24} />}
      confirmText={t('common:confirm')}
      cancelText={t('common:cancel')}
      isEditMode={false}
      error={errors.general}
      size="md"
      confirmButtonColor="cyan"
    >
      <p className="text-gray-600 mb-4">
        {t('planning:initialActualDescription')} <span className="font-semibold">"{taskTitle}"</span>.
      </p>
      <p className="text-sm text-gray-500 mb-4">
        {t('planning:initialActualExplanation')}
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('planning:initialActualLabel')}
        </label>
        <input
          ref={inputRef}
          type="number"
          step="0.25"
          min="0"
          name="initial_actual"
          value={formData.initial_actual}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onWheel={(e) => e.target.blur()}
          className={`w-full px-3 py-2 border ${
            errors.initial_actual ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          placeholder="0.00"
        />
        {errors.initial_actual && (
          <p className="mt-1 text-sm text-red-600">{errors.initial_actual}</p>
        )}
      </div>
    </BaseModal>
  );
};

export default InitialActualModal;
