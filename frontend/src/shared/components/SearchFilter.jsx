import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

const SearchFilter = memo(function SearchFilter({ searchTerm, onSearchChange, placeholder }) {
  const { t } = useTranslation(['common']);
  const resolvedPlaceholder = placeholder || t('common:searchPlaceholder');
  return (
    <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-2" role="search">
      <div className="relative">
        <input
          type="text"
          placeholder={resolvedPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-1.5 pl-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent bg-white"
          aria-label={resolvedPlaceholder}
        />
        <svg
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={t('common:clearSearch')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

export default SearchFilter;
