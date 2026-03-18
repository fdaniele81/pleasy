import { createSelector } from 'reselect';

const selectPlanningFiltersState = (state) => state.planningFilters;

export const selectSearchTerm = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.searchTerm
);

export const selectFilterUserIds = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.filterUserIds
);

export const selectFilterStatuses = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.filterStatuses
);

export const selectFilterClientIds = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.filterClientIds
);

export const selectFilterProjectIds = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.filterProjectIds
);

export const selectEtcFilters = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.etcFilters
);

export const selectSelectionFilters = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.selectionFilters
);

export const selectFilterStartDate = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.filterStartDate
);

export const selectFilterEndDate = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.filterEndDate
);

export const selectDateFilterMode = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.dateFilterMode
);

export const selectHideProjectHeaders = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.hideProjectHeaders
);

export const selectShowInDays = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.showInDays
);

export const selectShowTimeline = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.showTimeline
);

export const selectTimeInterval = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.timeInterval
);

export const selectExpandedProjects = createSelector(
  [selectPlanningFiltersState],
  (filters) => filters.expandedProjects
);
