import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, X } from 'lucide-react';
import SelectionCheckbox from '../table/SelectionCheckbox';

function FilterDropdown({
  options,
  selectedValues,
  placeholder,
  selectedLabel,
  title,
  emptyMessage,
  minWidth,
  accentColor = 'cyan',
  id,
  label,
  allLabel,
  items,
  selectedIds,
  toggleDropdown: externalToggle,
  onChange,
  showCount = true,
  showClear = true,
  size = 'md',
  className = '',
  icon,
  singleSelect = false,
}) {
  const { t } = useTranslation(['common']);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const resolvedEmptyMessage = emptyMessage || t('common:noItemsAvailable');

  const normalizedOptions = options || (items?.map(item => ({
    value: item.id,
    label: item.name,
    color: item.color,
  })) || []);
  const normalizedSelectedValues = selectedValues || selectedIds || [];
  const normalizedPlaceholder = placeholder || allLabel || 'Tutti';
  const normalizedTitle = title || label || 'Filtro';

  const selectedCount = normalizedSelectedValues.length;
  const hasSelection = selectedCount > 0;

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

  const accentClasses = {
    cyan: {
      active: 'bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100',
      checkbox: 'text-cyan-600 focus:ring-cyan-500',
      selected: 'bg-cyan-50',
      selectedText: 'font-medium text-cyan-700',
      clearBtn: 'text-cyan-600 hover:text-cyan-800',
    },
    indigo: {
      active: 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100',
      checkbox: 'text-indigo-600 focus:ring-indigo-500',
      selected: 'bg-indigo-50',
      selectedText: 'font-medium text-indigo-700',
      clearBtn: 'text-indigo-600 hover:text-indigo-800',
    },
  };

  const colors = accentClasses[accentColor] || accentClasses.cyan;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
  };

  const dropdownSizeClasses = {
    sm: 'w-48 max-h-48',
    md: 'w-64 max-h-64',
  };

  const handleItemToggle = (itemValue) => {
    if (singleSelect) {
      const newSelection = normalizedSelectedValues.includes(itemValue) ? [] : [itemValue];
      onChange?.(newSelection);
    } else {
      const newSelection = normalizedSelectedValues.includes(itemValue)
        ? normalizedSelectedValues.filter((v) => v !== itemValue)
        : [...normalizedSelectedValues, itemValue];
      onChange?.(newSelection);
    }
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange?.([]);
  };

  const handleToggle = () => {
    if (externalToggle && id) {
      externalToggle(id);
    } else {
      setIsOpen(!isOpen);
    }
  };

  let displayText;
  if (!hasSelection) {
    displayText = normalizedPlaceholder;
  } else if (typeof selectedLabel === 'function') {
    displayText = selectedLabel(selectedCount);
  } else if (selectedLabel) {
    displayText = selectedLabel;
  } else if (showCount) {
    displayText = `${normalizedTitle}: ${selectedCount}`;
  } else {
    displayText = normalizedOptions.find((o) => o.value === normalizedSelectedValues[0])?.label || normalizedTitle;
  }

  const showDropdown = externalToggle ? undefined : isOpen;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        style={minWidth ? { minWidth } : undefined}
        className={`
          inline-flex items-center justify-between rounded border transition-colors font-medium
          focus:outline-none focus:ring-1 focus:ring-${accentColor}-500
          ${hasSelection ? colors.active : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}
          ${sizeClasses[size]}
        `}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{displayText}</span>
        <ChevronDown size={14} className="shrink-0 ml-1" />
      </button>

      <div
        ref={dropdownRef}
        id={id}
        className={`
          ${showDropdown === undefined ? 'hidden' : showDropdown ? '' : 'hidden'}
          absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-gray-300 overflow-hidden
          ${dropdownSizeClasses[size]}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">
            {normalizedTitle}
          </span>
          {showClear && hasSelection && (
            <button
              type="button"
              onClick={handleClearAll}
              className={`text-xs ${colors.clearBtn} font-medium`}
            >
              {t('common:clearAll')}
            </button>
          )}
        </div>

        <div className="overflow-y-auto py-1" style={{ maxHeight: size === 'sm' ? '140px' : '200px' }}>
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 text-center">
              {resolvedEmptyMessage}
            </div>
          ) : (
            normalizedOptions.map((option) => {
              const isSelected = normalizedSelectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`
                    flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                    ${isSelected ? colors.selected : 'hover:bg-gray-50'}
                  `}
                >
                  {singleSelect ? (
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => handleItemToggle(option.value)}
                      className={`w-4 h-4 border-gray-300 ${colors.checkbox}`}
                    />
                  ) : (
                    <SelectionCheckbox
                      checked={isSelected}
                      onChange={() => handleItemToggle(option.value)}
                    />
                  )}
                  {option.color && (
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300 shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className={`text-xs truncate flex-1 ${isSelected ? colors.selectedText : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default FilterDropdown;
