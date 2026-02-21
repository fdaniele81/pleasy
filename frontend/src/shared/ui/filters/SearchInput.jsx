import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function SearchInput({
  value = '',
  onChange,
  placeholder,
  showClear = true,
  size = 'md',
  className = '',
  autoFocus = false,
  accentColor = 'cyan',
}) {
  const sizeClasses = {
    sm: 'py-1 pl-8 pr-8 text-xs',
    md: 'py-1.5 pl-9 pr-9 text-sm',
    lg: 'py-2 pl-10 pr-10 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const { t } = useTranslation(['common']);
  const resolvedPlaceholder = placeholder || t('common:searchPlaceholder');

  const focusClasses = {
    cyan: 'focus:ring-2 focus:ring-cyan-500',
    indigo: 'focus:ring-2 focus:ring-indigo-500',
  };

  const handleClear = () => {
    onChange?.({ target: { value: '' } });
  };

  return (
    <div className={`relative ${className}`}>
      <Search
        size={iconSizes[size]}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={resolvedPlaceholder}
        autoFocus={autoFocus}
        className={`
          w-full border border-gray-300 rounded-lg
          focus:outline-none ${focusClasses[accentColor] || focusClasses.cyan} focus:border-transparent
          ${sizeClasses[size]}
        `}
      />
      {showClear && value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
          aria-label={t('common:clearSearch')}
        >
          <X size={iconSizes[size]} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
