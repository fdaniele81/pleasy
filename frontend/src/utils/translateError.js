import i18next from 'i18next';

/**
 * Translates an error response from the backend using i18n error codes.
 *
 * The backend returns: { error: "ERROR_CODE", message: "Italian fallback" }
 * This function tries to translate the error code via i18next,
 * falling back to the message field, then to the raw code.
 *
 * @param {object|string} errorData - The error response data (e.g., err?.data)
 * @param {string} [fallback] - Optional fallback message
 * @returns {string} The translated error message
 */
export function translateError(errorData, fallback) {
  if (!errorData) {
    return fallback || i18next.t('errors:unknownError');
  }

  const code = typeof errorData === 'string' ? errorData : errorData.error;
  const message = typeof errorData === 'string' ? null : errorData.message;

  if (!code) {
    return message || fallback || i18next.t('errors:unknownError');
  }

  const translationKey = `errors:${code}`;
  if (i18next.exists(translationKey)) {
    return i18next.t(translationKey);
  }

  return message || fallback || code;
}
