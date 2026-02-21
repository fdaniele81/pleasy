import { useState, useEffect, useCallback } from 'react';

export const useFormModal = ({
  initialValues = {},
  onSubmit,
  validate,
  entity = null,
  isOpen = false,
  transformForEdit = null
}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!entity;

  useEffect(() => {
    if (entity && isOpen) {
      if (transformForEdit) {
        setFormData(transformForEdit(entity));
      } else {
        setFormData({ ...initialValues, ...entity });
      }
    } else if (isOpen) {
      setFormData(initialValues);
    } else {
      setFormData(initialValues);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [entity, isOpen]);

  const handleChange = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  const handleChangeMultiple = useCallback((updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));

    const updatedFields = Object.keys(updates);
    if (updatedFields.some(field => errors[field])) {
      setErrors(prev => {
        const newErrors = { ...prev };
        updatedFields.forEach(field => delete newErrors[field]);
        return newErrors;
      });
    }
  }, [errors]);

  const setError = useCallback((errorMessage) => {
    setErrors({ general: errorMessage });
  }, []);

  const setFieldErrors = useCallback((fieldErrors) => {
    setErrors(fieldErrors);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setErrors({});

    if (validate) {
      const validationError = validate(formData);

      if (typeof validationError === 'string') {
        setErrors({ general: validationError });
        setIsSubmitting(false);
        return false;
      }

      if (validationError && typeof validationError === 'object' && Object.keys(validationError).length > 0) {
        setErrors(validationError);
        setIsSubmitting(false);
        return false;
      }
    }

    try {
      await onSubmit(formData, isEditMode);
      setIsSubmitting(false);
      return true;
    } catch (error) {
      setErrors({ general: error.message || 'Errore durante il salvataggio' });
      setIsSubmitting(false);
      return false;
    }
  }, [formData, validate, onSubmit, isEditMode]);

  const reset = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    formData,
    errors,
    isEditMode,
    isSubmitting,
    handleChange,
    handleChangeMultiple,
    handleSubmit,
    reset,
    setError,
    setFieldErrors
  };
};

export default useFormModal;
