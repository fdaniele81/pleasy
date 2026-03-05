import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, Plus, Trash2, Check } from 'lucide-react';
import {
  useGetSavedFiltersQuery,
  useSaveFilterMutation,
  useDeleteSavedFilterMutation,
} from '../../../api/savedFiltersEndpoints';

function filtersMatch(current, saved) {
  const keys = new Set([...Object.keys(current), ...Object.keys(saved)]);
  for (const key of keys) {
    const a = current[key];
    const b = saved[key];
    if (a === b) continue;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length || a.some((v, i) => v !== b[i])) return false;
    } else {
      if (a === undefined && b === false) continue;
      if (b === undefined && a === false) continue;
      if (a === undefined && Array.isArray(b) && b.length === 0) continue;
      if (b === undefined && Array.isArray(a) && a.length === 0) continue;
      if (a === undefined && b === '') continue;
      if (b === undefined && a === '') continue;
      return false;
    }
  }
  return true;
}

function SavedFiltersDropdown({
  section,
  currentFilters,
  onApplyFilter,
  accentColor = 'cyan',
  size = 'md',
}) {
  const { t } = useTranslation(['common']);
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [filterName, setFilterName] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const { data: savedFilters } = useGetSavedFiltersQuery();
  const [saveFilter] = useSaveFilterMutation();
  const [deleteFilter] = useDeleteSavedFilterMutation();

  const sectionFilters = savedFilters?.[section] || [];

  const activeFilterId = useMemo(() => {
    for (const filter of sectionFilters) {
      if (filtersMatch(currentFilters, filter.filters)) return filter.id;
    }
    return null;
  }, [currentFilters, sectionFilters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsAdding(false);
        setFilterName('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSave = useCallback(async () => {
    if (!filterName.trim()) return;
    await saveFilter({ section, name: filterName.trim(), filters: currentFilters });
    setFilterName('');
    setIsAdding(false);
  }, [filterName, section, currentFilters, saveFilter]);

  const handleDelete = useCallback(async (e, filterId) => {
    e.stopPropagation();
    await deleteFilter({ filterId, section });
  }, [deleteFilter, section]);

  const handleApply = useCallback((filters) => {
    onApplyFilter(filters);
    setIsOpen(false);
  }, [onApplyFilter]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setFilterName('');
    }
  }, [handleSave]);

  const hasActiveFilters = Object.entries(currentFilters).some(
    ([k, v]) =>
      (Array.isArray(v) && v.length > 0) ||
      (typeof v === 'string' && v !== '' && v !== 'intersect') ||
      (typeof v === 'boolean' && v === true && k !== 'showInDays')
  );

  const accentClasses = {
    cyan: {
      active: 'bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100',
      item: 'hover:bg-cyan-50',
      itemActive: 'bg-cyan-50',
      icon: 'text-cyan-600',
      save: 'bg-cyan-600 hover:bg-cyan-700 text-white',
      badge: 'bg-cyan-600 text-white',
    },
    blue: {
      active: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100',
      item: 'hover:bg-blue-50',
      itemActive: 'bg-blue-50',
      icon: 'text-blue-600',
      save: 'bg-blue-600 hover:bg-blue-700 text-white',
      badge: 'bg-blue-600 text-white',
    },
  };

  const colors = accentClasses[accentColor] || accentClasses.cyan;

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs gap-1' : 'px-3 py-1.5 text-xs gap-1.5';

  const isActive = activeFilterId !== null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between rounded-lg border-2 transition-colors font-medium focus:outline-none focus:ring-1 focus:ring-${accentColor}-500 ${
          isActive
            ? colors.active
            : 'bg-white border-gray-400 text-gray-700 hover:bg-gray-50'
        } ${sizeClasses}`}
        title={t('common:savedFilters')}
      >
        <Bookmark size={14} />
        <span className="hidden xl:inline whitespace-nowrap">
          {isActive
            ? sectionFilters.find((f) => f.id === activeFilterId)?.name
            : t('common:savedFilters')}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-700">{t('common:savedFilters')}</span>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {sectionFilters.length === 0 && !isAdding && (
              <div className="px-3 py-4 text-xs text-gray-400 text-center">
                {t('common:noSavedFilters')}
              </div>
            )}

            {sectionFilters.map((filter) => {
              const isItemActive = filter.id === activeFilterId;
              return (
                <div
                  key={filter.id}
                  onClick={() => handleApply(filter.filters)}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer group ${
                    isItemActive ? colors.itemActive : colors.item
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Bookmark size={12} className={`shrink-0 ${isItemActive ? colors.icon : 'text-gray-400'}`} />
                    <span className={`text-xs truncate ${isItemActive ? 'font-medium' : 'text-gray-700'}`}>{filter.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, filter.id)}
                    className="shrink-0 p-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t('common:delete')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 px-3 py-2">
            {isAdding ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('common:filterNamePlaceholder')}
                  className={`flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
                  maxLength={50}
                />
                <button
                  onClick={handleSave}
                  disabled={!filterName.trim()}
                  className={`p-1 rounded ${colors.save} disabled:opacity-40 disabled:cursor-not-allowed`}
                  title={t('common:save')}
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                disabled={!hasActiveFilters}
                className={`flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-medium rounded ${
                  hasActiveFilters
                    ? `${colors.icon} hover:bg-gray-50`
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <Plus size={14} />
                <span>{t('common:saveCurrentFilters')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SavedFiltersDropdown;
