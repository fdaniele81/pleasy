import { useTranslation } from 'react-i18next';
import { LOCALE_MAP } from '../utils/date/dateUtils';

export function useLocale() {
  const { i18n } = useTranslation();
  return LOCALE_MAP[i18n.language] || 'it-IT';
}
