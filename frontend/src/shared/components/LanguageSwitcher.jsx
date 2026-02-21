import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = memo(function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === 'it' ? 'en' : 'it';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
      title={currentLang === 'it' ? 'Switch to English' : 'Passa a Italiano'}
    >
      <span className={currentLang === 'it' ? 'font-bold text-gray-900' : 'text-gray-400'}>IT</span>
      <span className="text-gray-300">|</span>
      <span className={currentLang === 'en' ? 'font-bold text-gray-900' : 'text-gray-400'}>EN</span>
    </button>
  );
});

export default LanguageSwitcher;
