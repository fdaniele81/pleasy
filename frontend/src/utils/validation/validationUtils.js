import i18next from 'i18next';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
};

export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

export const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

export const isNonNegativeNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
};

export const isValidNumber = (value) => {
  return !isNaN(Number(value));
};

export const hasMinLength = (value, minLength) => {
  if (!value) return false;
  return value.trim().length >= minLength;
};

export const hasMaxLength = (value, maxLength) => {
  if (!value) return true;
  return value.trim().length <= maxLength;
};

export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecialChar = false
  } = options;

  const errors = [];

  if (!password || password.length < minLength) {
    errors.push(i18next.t('validation:passwordMinLength', { minLength }));
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push(i18next.t('validation:passwordUppercase'));
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push(i18next.t('validation:passwordLowercase'));
  }

  if (requireNumber && !/\d/.test(password)) {
    errors.push(i18next.t('validation:passwordNumber'));
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push(i18next.t('validation:passwordSpecialChar'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

export const isDateInFuture = (date) => {
  if (!isValidDate(date)) return false;
  return new Date(date) > new Date();
};

export const isDateInPast = (date) => {
  if (!isValidDate(date)) return false;
  return new Date(date) < new Date();
};

export class FormValidator {
  constructor(rules) {
    this.rules = rules;
  }

  validate(data) {
    const errors = {};
    let isValid = true;

    for (const [field, fieldRules] of Object.entries(this.rules)) {
      const value = data[field];

      for (const { rule, message } of fieldRules) {
        if (!rule(value)) {
          errors[field] = message;
          isValid = false;
          break;
        }
      }
    }

    return { isValid, errors };
  }

  validateField(field, value) {
    const fieldRules = this.rules[field];
    if (!fieldRules) return null;

    for (const { rule, message } of fieldRules) {
      if (!rule(value)) {
        return message;
      }
    }

    return null;
  }
}

export const errorMessages = {
  required: (fieldName) => i18next.t('validation:required', { field: fieldName }),
  invalidEmail: () => i18next.t('validation:invalidEmail'),
  invalidUrl: () => i18next.t('validation:invalidUrl'),
  invalidDate: () => i18next.t('validation:invalidDate'),
  minLength: (fieldName, min) => i18next.t('validation:minLength', { field: fieldName, min }),
  maxLength: (fieldName, max) => i18next.t('validation:maxLength', { field: fieldName, max }),
  positiveNumber: (fieldName) => i18next.t('validation:positiveNumber', { field: fieldName }),
  nonNegativeNumber: (fieldName) => i18next.t('validation:nonNegativeNumber', { field: fieldName }),
  passwordMismatch: () => i18next.t('validation:passwordMismatch'),
  custom: (message) => message
};
