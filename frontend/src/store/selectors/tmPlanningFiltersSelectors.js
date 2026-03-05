import { createSelector } from 'reselect';

const selectTMPlanningFiltersState = (state) => state.tmPlanningFilters;

export const selectSearchTerm = createSelector(
  [selectTMPlanningFiltersState],
  (filters) => filters.searchTerm
);

export const selectGroupBy = createSelector(
  [selectTMPlanningFiltersState],
  (filters) => filters.groupBy
);

export const selectSelectedUserIds = createSelector(
  [selectTMPlanningFiltersState],
  (filters) => filters.selectedUserIds
);

export const selectSelectedClientIds = createSelector(
  [selectTMPlanningFiltersState],
  (filters) => filters.selectedClientIds
);

export const selectExpandedUsers = createSelector(
  [selectTMPlanningFiltersState],
  (filters) => filters.expandedUsers
);

export const selectExpandedClients = createSelector(
  [selectTMPlanningFiltersState],
  (filters) => filters.expandedClients
);
