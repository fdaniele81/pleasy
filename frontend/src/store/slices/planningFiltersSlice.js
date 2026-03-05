import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchTerm: '',
  filterUserIds: [],
  filterStatuses: [],
  filterClientIds: [],
  filterProjectIds: [],
  etcFilters: [],
  selectionFilters: [],
  filterStartDate: '',
  filterEndDate: '',
  dateFilterMode: 'intersect',
  hideProjectHeaders: false,
  showInDays: false,
  showTimeline: false,
  expandedProjects: {},
};

const planningFiltersSlice = createSlice({
  name: 'planningFilters',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setFilterUserIds: (state, action) => {
      state.filterUserIds = action.payload;
    },
    setFilterStatuses: (state, action) => {
      state.filterStatuses = action.payload;
    },
    setFilterClientIds: (state, action) => {
      state.filterClientIds = action.payload;
    },
    setFilterProjectIds: (state, action) => {
      state.filterProjectIds = action.payload;
    },
    setEtcFilters: (state, action) => {
      state.etcFilters = action.payload;
    },
    setSelectionFilters: (state, action) => {
      state.selectionFilters = action.payload;
    },
    setFilterStartDate: (state, action) => {
      state.filterStartDate = action.payload;
    },
    setFilterEndDate: (state, action) => {
      state.filterEndDate = action.payload;
    },
    setDateFilterMode: (state, action) => {
      state.dateFilterMode = action.payload;
    },
    setHideProjectHeaders: (state, action) => {
      state.hideProjectHeaders = action.payload;
    },
    setShowInDays: (state, action) => {
      state.showInDays = action.payload;
    },
    setShowTimeline: (state, action) => {
      state.showTimeline = action.payload;
    },
    setExpandedProjects: (state, action) => {
      state.expandedProjects = action.payload;
    },
    toggleExpandedProject: (state, action) => {
      const projectId = action.payload;
      state.expandedProjects[projectId] = !state.expandedProjects[projectId];
    },
    mergeExpandedProjects: (state, action) => {
      Object.assign(state.expandedProjects, action.payload);
    },
    resetAllFilters: () => initialState,
  },
});

export const {
  setSearchTerm,
  setFilterUserIds,
  setFilterStatuses,
  setFilterClientIds,
  setFilterProjectIds,
  setEtcFilters,
  setSelectionFilters,
  setFilterStartDate,
  setFilterEndDate,
  setDateFilterMode,
  setHideProjectHeaders,
  setShowInDays,
  setShowTimeline,
  setExpandedProjects,
  toggleExpandedProject,
  mergeExpandedProjects,
  resetAllFilters,
} = planningFiltersSlice.actions;

export default planningFiltersSlice.reducer;
