import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Calendar } from 'lucide-react';
import DateInput from '../DateInput';

function DateFilterDropdown({
  startDate,
  onStartDateChange,
  onClear,
  isDefault,
  size = 'md',
  className = '',
}) {
  const { t } = useTranslation(['timesheet', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleClear = (e) => {
    e.stopPropagation();
    onClear();
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center justify-between rounded border transition-colors font-medium
          focus:outline-none focus:ring-1 focus:ring-cyan-500
          ${!isDefault
            ? 'bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }
          ${sizeClasses[size]}
        `}
      >
        <Calendar size={14} className="shrink-0" />
        <span className="truncate">{t('timesheet:goToDate')}</span>
        <ChevronDown size={14} className="shrink-0 ml-1" />
      </button>

      <div
        ref={dropdownRef}
        className={`
          ${isOpen ? '' : 'hidden'}
          absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-gray-300 overflow-visible
          w-72
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">
            {t('timesheet:goToDate')}
          </span>
          {!isDefault && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-cyan-600 hover:text-cyan-800 font-medium"
            >
              {t('common:clearAll')}
            </button>
          )}
        </div>

        <div className="p-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {t('timesheet:startDate')}
          </label>
          <DateInput
            value={startDate}
            onChange={(date) => {
              onStartDateChange(date);
              setIsOpen(false);
            }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default DateFilterDropdown;
