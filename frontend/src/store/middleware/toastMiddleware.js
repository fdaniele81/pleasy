import { isRejectedWithValue } from '@reduxjs/toolkit';
import { addToast } from '../slices/toastSlice';
import i18next from 'i18next';

function getErrorMessage(payload, error) {
  if (!payload) {
    return error?.message || i18next.t('errors:unknownError');
  }

  const status = payload.status;

  if (typeof status === 'string') {
    if (status === 'FETCH_ERROR') {
      return i18next.t('errors:connectionError');
    }
    if (status === 'PARSING_ERROR') {
      return i18next.t('errors:serverResponseError');
    }
    if (status === 'TIMEOUT_ERROR') {
      return i18next.t('errors:timeoutError');
    }
    if (status === 'CUSTOM_ERROR') {
      return payload.error || i18next.t('errors:customError');
    }
  }

  if (typeof status === 'number') {
    if (status === 400 || status === 422) {
      if (payload.data?.errors && Array.isArray(payload.data.errors)) {
        return payload.data.errors[0]?.message || i18next.t('errors:invalidData');
      }
      if (payload.data?.error) {
        return payload.data.error;
      }
      return i18next.t('errors:invalidDataSubmitted');
    }

    if (status === 403) {
      return i18next.t('errors:noPermission');
    }

    if (status === 404) {
      return i18next.t('errors:notFound');
    }

    if (status === 409) {
      return payload.data?.error || i18next.t('errors:conflict');
    }

    if (status >= 500) {
      return i18next.t('errors:serverError');
    }
  }

  return (
    payload.data?.error ||
    payload.data?.message ||
    payload.error ||
    error?.message ||
    i18next.t('errors:operationFailed')
  );
}

function getToastType(status) {
  if (status === 400 || status === 422) {
    return 'warning';
  }
  return 'error';
}

export const toastMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  if (action.type.endsWith('/showToast')) {
    const { message, type } = action.payload;
    store.dispatch(addToast({ message, type }));
  }

  if (isRejectedWithValue(action)) {
    const status = action.payload?.status;

    if (status !== 401) {
      const errorMessage = getErrorMessage(action.payload, action.error);
      const toastType = getToastType(status);

      store.dispatch(addToast({
        message: errorMessage,
        type: toastType
      }));
    }
  }

  if (action.type.includes('/fulfilled') &&
      action.meta?.arg?.type === 'mutation' &&
      action.meta?.arg?.showSuccessToast) {
    const successMessage = action.meta.arg.successMessage || i18next.t('errors:operationSuccess');
    store.dispatch(addToast({
      message: successMessage,
      type: 'success'
    }));
  }

  return result;
};
