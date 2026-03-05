import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchTerm: '',
  groupBy: 'user',
  selectedUserIds: [],
  selectedClientIds: [],
  expandedUsers: {},
  expandedClients: {},
};

const tmPlanningFiltersSlice = createSlice({
  name: 'tmPlanningFilters',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setGroupBy: (state, action) => {
      state.groupBy = action.payload;
    },
    setSelectedUserIds: (state, action) => {
      state.selectedUserIds = action.payload;
    },
    setSelectedClientIds: (state, action) => {
      state.selectedClientIds = action.payload;
    },
    setExpandedUsers: (state, action) => {
      state.expandedUsers = action.payload;
    },
    toggleExpandedUser: (state, action) => {
      const userId = action.payload;
      state.expandedUsers[userId] = !state.expandedUsers[userId];
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
  setSearchTerm,
  setGroupBy,
  setSelectedUserIds,
  setSelectedClientIds,
  setExpandedUsers,
  toggleExpandedUser,
  setExpandedClients,
  toggleExpandedClient,
  resetAllFilters,
} = tmPlanningFiltersSlice.actions;

export default tmPlanningFiltersSlice.reducer;
