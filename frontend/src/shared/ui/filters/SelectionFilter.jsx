import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Square, ChevronDown } from 'lucide-react';
import SelectionCheckbox from '../table/SelectionCheckbox';

function SelectionFilter({
  value = [],
  onChange,
  variant = 'buttons',
  size = 'md',
  className = '',
  selectedLabel,
  unselectedLabel,
  accentColor = 'cyan',
}) {
  const { t } = useTranslation(['common']);
  const resolvedSelectedLabel = selectedLabel || t('common:selected');
  const resolvedUnselectedLabel = unselectedLabel || t('common:notSelected');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const isSelectedActive = value.includes('selected');
  const isUnselectedActive = value.includes('unselected');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = (filterType) => {
    const newValue = value.includes(filterType)
      ? value.filter((v) => v !== filterType)
      : [...value, filterType];
    onChange?.(newValue);
  };

  const accentClasses = {
    cyan: {
      active: 'bg-cyan-50 border-cyan-300 text-cyan-700',
      checkbox: 'text-cyan-600 focus:ring-cyan-500',
      clearBtn: 'text-cyan-600 hover:text-cyan-800',
    },
    indigo: {
      active: 'bg-indigo-50 border-indigo-300 text-indigo-700',
      checkbox: 'text-indigo-600 focus:ring-indigo-500',
      clearBtn: 'text-indigo-600 hover:text-indigo-800',
    },
  };

  const colors = accentClasses[accentColor] || accentClasses.cyan;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
  };

  const getDropdownText = () => {
    if (value.length === 0) return t('common:allActivities');
    if (isSelectedActive && isUnselectedActive) return t('common:allActivities');
    if (isSelectedActive) return resolvedSelectedLabel;
    return resolvedUnselectedLabel;
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            inline-flex items-center justify-between rounded border transition-colors font-medium
            focus:outline-none focus:ring-1 focus:ring-${accentColor}-500
            min-w-[110px] lg:min-w-[130px] xl:min-w-[150px]
            bg-white border-gray-300 text-gray-700 hover:bg-gray-50
            ${sizeClasses[size]}
          `}
        >
          <span className="truncate">{getDropdownText()}</span>
          <ChevronDown size={14} className="shrink-0 ml-1" />
        </button>

        <div
          ref={dropdownRef}
          className={`
            ${isOpen ? '' : 'hidden'}
            absolute z-50 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-300 overflow-hidden
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">
              {t('common:filterActivities')}
            </span>
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => onChange?.([])}
                className={`text-xs ${colors.clearBtn} font-medium`}
              >
                {t('common:clearAll')}
              </button>
            )}
          </div>
          <div className="py-1">
            <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <SelectionCheckbox
                checked={isSelectedActive}
                onChange={() => handleToggle('selected')}
              />
              <span className="text-xs text-gray-700">{resolvedSelectedLabel}</span>
            </label>
            <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <SelectionCheckbox
                checked={isUnselectedActive}
                onChange={() => handleToggle('unselected')}
              />
              <span className="text-xs text-gray-700">{resolvedUnselectedLabel}</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'checkboxes') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <label className="flex items-center gap-2 cursor-pointer">
          <SelectionCheckbox
            checked={isSelectedActive}
            onChange={() => handleToggle('selected')}
          />
          <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-700`}>
            {resolvedSelectedLabel}
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <SelectionCheckbox
            checked={isUnselectedActive}
            onChange={() => handleToggle('unselected')}
          />
          <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-700`}>
            {resolvedUnselectedLabel}
          </span>
        </label>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => handleToggle('selected')}
        className={`
          flex items-center rounded-lg border transition-colors
          ${isSelectedActive
            ? colors.active
            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
          }
          ${sizeClasses[size]}
        `}
        title={resolvedSelectedLabel}
      >
        <CheckSquare size={size === 'sm' ? 14 : 16} />
        <span className="hidden sm:inline">{resolvedSelectedLabel}</span>
      </button>
      <button
        type="button"
        onClick={() => handleToggle('unselected')}
        className={`
          flex items-center rounded-lg border transition-colors
          ${isUnselectedActive
            ? colors.active
            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
          }
          ${sizeClasses[size]}
        `}
        title={resolvedUnselectedLabel}
      >
        <Square size={size === 'sm' ? 14 : 16} />
        <span className="hidden sm:inline">{resolvedUnselectedLabel}</span>
      </button>
    </div>
  );
}

export default SelectionFilter;
