import { useMemo, useCallback } from 'react';

export function useSelectionFilter(items, selectedItems, selectionFilters, idField = 'task_id') {
  return useMemo(() => {
    if (!selectionFilters || selectionFilters.length === 0 || selectionFilters.length >= 2) {
      return items;
    }

    if (selectionFilters.includes('selected')) {
      return items.filter(item => selectedItems[item[idField]]);
    }

    if (selectionFilters.includes('unselected')) {
      return items.filter(item => !selectedItems[item[idField]]);
    }

    return items;
  }, [items, selectedItems, selectionFilters, idField]);
}

export function useIdFilter(items, filterIds, idField) {
  return useMemo(() => {
    if (!filterIds || filterIds.length === 0) {
      return items;
    }
    return items.filter(item => filterIds.includes(item[idField]));
  }, [items, filterIds, idField]);
}

export function useSearchFilter(items, searchTerm, searchFields) {
  return useMemo(() => {
    if (!searchTerm?.trim()) {
      return items;
    }

    const term = searchTerm.toLowerCase().trim();

    return items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(term);
      });
    });
  }, [items, searchTerm, searchFields]);
}

export function applySelectionFilter(items, selectedItems, selectionFilters, idField = 'task_id') {
  if (!selectionFilters || selectionFilters.length === 0 || selectionFilters.length >= 2) {
    return items;
  }

  if (selectionFilters.includes('selected')) {
    return items.filter(item => selectedItems[item[idField]]);
  }

  if (selectionFilters.includes('unselected')) {
    return items.filter(item => !selectedItems[item[idField]]);
  }

  return items;
}

export function applyIdFilter(items, filterIds, idField) {
  if (!filterIds || filterIds.length === 0) {
    return items;
  }
  return items.filter(item => filterIds.includes(item[idField]));
}

export function applySearchFilter(items, searchTerm, searchFields) {
  if (!searchTerm?.trim()) {
    return items;
  }

  const term = searchTerm.toLowerCase().trim();

  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (value == null) return false;
      return String(value).toLowerCase().includes(term);
    });
  });
}

export function useComposedFilters(items, filters) {
  return useMemo(() => {
    if (!items || items.length === 0) return [];

    let result = [...items];

    if (filters.searchTerm && filters.searchFields?.length > 0) {
      result = applySearchFilter(result, filters.searchTerm, filters.searchFields);
    }

    if (filters.clientIds?.length > 0) {
      result = applyIdFilter(result, filters.clientIds, 'client_id');
    }

    if (filters.projectIds?.length > 0) {
      result = applyIdFilter(result, filters.projectIds, 'project_id');
    }

    if (filters.userIds?.length > 0) {
      result = applyIdFilter(result, filters.userIds, 'owner_id');
    }

    if (filters.selectedItems && filters.selectionFilters?.length > 0) {
      result = applySelectionFilter(
        result,
        filters.selectedItems,
        filters.selectionFilters,
        filters.selectionIdField || 'task_id'
      );
    }

    return result;
  }, [items, filters]);
}

export function useClearFilters(setters) {
  return useCallback(() => {
    Object.entries(setters).forEach(([key, setter]) => {
      if (typeof setter === 'function') {
        if (key.includes('Ids') || key.includes('Filters') || key.includes('Statuses')) {
          setter([]);
        } else if (key.includes('Date')) {
          setter('');
        } else if (key.includes('Term')) {
          setter('');
        } else if (key.includes('Mode')) {
          setter('intersect');
        } else {
          setter('');
        }
      }
    });
  }, [setters]);
}
