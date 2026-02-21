export const filterByIds = (items, ids, field) => {
  if (!ids || ids.length === 0) return items;
  return items.filter(item => ids.includes(item[field]));
};

export const filterExcludeIds = (items, ids, field) => {
  if (!ids || ids.length === 0) return items;
  return items.filter(item => !ids.includes(item[field]));
};

export const filterByDateRange = (items, options) => {
  const {
    startDate,
    endDate,
    startField = 'start_date',
    endField = 'end_date',
    mode = 'intersect'
  } = options;

  if (!startDate && !endDate) return items;

  const rangeStart = startDate ? new Date(startDate) : null;
  const rangeEnd = endDate ? new Date(endDate) : null;

  return items.filter(item => {
    const itemStart = item[startField] ? new Date(item[startField]) : null;
    const itemEnd = item[endField] ? new Date(item[endField]) : null;

    if (!itemStart && !itemEnd) return false;

    if (mode === 'contained') {
      if (rangeStart && itemStart && itemStart < rangeStart) return false;
      if (rangeEnd && itemEnd && itemEnd > rangeEnd) return false;
      return true;
    } else {
      if (rangeStart && itemEnd && itemEnd < rangeStart) return false;
      if (rangeEnd && itemStart && itemStart > rangeEnd) return false;
      return true;
    }
  });
};

export const filterByToggle = (items, selectedFilters, predicates) => {
  if (!selectedFilters || selectedFilters.length === 0) return items;
  if (selectedFilters.length >= Object.keys(predicates).length) return items;

  const activeFilter = selectedFilters[0];
  const predicate = predicates[activeFilter];

  if (!predicate) return items;
  return items.filter(predicate);
};

export const filterByStatus = (items, statuses, field = 'status_id') => {
  return filterByIds(items, statuses, field);
};

export const groupByField = (items, field) => {
  return items.reduce((groups, item) => {
    const key = item[field] ?? 'undefined';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
};

export const matchesSearchTerm = (item, searchTerm, fields) => {
  if (!searchTerm) return true;

  return fields.some(field => {
    const value = item[field];
    if (value == null) return false;
    return String(value).toLowerCase().includes(searchTerm);
  });
};

export const createSelectionPredicates = (selectedItems, idField = 'task_id') => ({
  selected: (item) => selectedItems[item[idField]],
  unselected: (item) => !selectedItems[item[idField]]
});

export const createEtcPredicates = (field = 'etc') => ({
  zero: (item) => !item[field] || item[field] === 0,
  nonzero: (item) => item[field] && item[field] > 0
});
