import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchTerm: '',
  selectionFilters: [],
  showTimeOff: true,
  filterClientIds: [],
  filterProjectIds: [],
  filterProjectType: [],
};

const timesheetFiltersSlice = createSlice({
  name: 'timesheetFilters',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setSelectionFilters: (state, action) => {
      state.selectionFilters = action.payload;
    },
    setShowTimeOff: (state, action) => {
      state.showTimeOff = action.payload;
    },
    setFilterClientIds: (state, action) => {
      state.filterClientIds = action.payload;
    },
    setFilterProjectIds: (state, action) => {
      state.filterProjectIds = action.payload;
    },
    setFilterProjectType: (state, action) => {
      state.filterProjectType = action.payload;
    },
    resetAllFilters: () => initialState,
  },
});

export const {
  setSearchTerm,
  setSelectionFilters,
  setShowTimeOff,
  setFilterClientIds,
  setFilterProjectIds,
  setFilterProjectType,
  resetAllFilters,
} = timesheetFiltersSlice.actions;

export default timesheetFiltersSlice.reducer;
