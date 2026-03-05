import { createSelector } from 'reselect';

const selectDashboardFiltersState = (state) => state.dashboardFilters;

export const selectStatusFilter = createSelector(
  [selectDashboardFiltersState],
  (filters) => filters.statusFilter
);

export const selectGroupBy = createSelector(
  [selectDashboardFiltersState],
  (filters) => filters.groupBy
);

export const selectSelectedOwners = createSelector(
  [selectDashboardFiltersState],
  (filters) => filters.selectedOwners
);

export const selectExpandedClients = createSelector(
  [selectDashboardFiltersState],
  (filters) => filters.expandedClients
);
