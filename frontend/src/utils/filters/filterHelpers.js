export const filterByIds = (items, ids, field) => {
  if (!ids || ids.length === 0) return items;
  return items.filter(item => ids.includes(item[field]));
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

