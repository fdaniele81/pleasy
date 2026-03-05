import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  statusFilter: 'ACTIVE',
  groupBy: 'client',
  selectedOwners: [],
  expandedClients: {},
};

const dashboardFiltersSlice = createSlice({
  name: 'dashboardFilters',
  initialState,
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setGroupBy: (state, action) => {
      state.groupBy = action.payload;
    },
    setSelectedOwners: (state, action) => {
      state.selectedOwners = action.payload;
    },
    setExpandedClients: (state, action) => {
      state.expandedClients = action.payload;
    },
    toggleExpandedClient: (state, action) => {
      const clientId = action.payload;
      state.expandedClients[clientId] = !state.expandedClients[clientId];
    },
    resetAllFilters: () => initialState,
  },
});

export const {
  setStatusFilter,
  setGroupBy,
  setSelectedOwners,
  setExpandedClients,
  toggleExpandedClient,
  resetAllFilters,
} = dashboardFiltersSlice.actions;

export default dashboardFiltersSlice.reducer;
