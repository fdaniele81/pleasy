import { createSelector } from 'reselect';

const selectTimesheetFiltersState = (state) => state.timesheetFilters;

export const selectSearchTerm = createSelector(
  [selectTimesheetFiltersState],
  (filters) => filters.searchTerm
);

export const selectSelectionFilters = createSelector(
  [selectTimesheetFiltersState],
  (filters) => filters.selectionFilters
);

export const selectShowTimeOff = createSelector(
  [selectTimesheetFiltersState],
  (filters) => filters.showTimeOff
);

export const selectFilterClientIds = createSelector(
  [selectTimesheetFiltersState],
  (filters) => filters.filterClientIds
);

export const selectFilterProjectIds = createSelector(
  [selectTimesheetFiltersState],
  (filters) => filters.filterProjectIds
);

export const selectFilterProjectType = createSelector(
  [selectTimesheetFiltersState],
  (filters) => filters.filterProjectType
);
