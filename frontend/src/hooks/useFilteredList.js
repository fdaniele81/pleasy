import { useMemo } from 'react';

export const useFilteredList = (items, searchTerm, searchFields) => {
  return useMemo(() => {
    if (!searchTerm?.trim()) {
      return items;
    }

    const term = searchTerm.toLowerCase().trim();

    return items.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];

        if (value == null) return false;

        return String(value).toLowerCase().includes(term);
      });
    });
  }, [items, searchTerm, searchFields]);
};
