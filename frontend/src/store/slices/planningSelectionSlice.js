import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedTasks: {},
};

const planningSelectionSlice = createSlice({
  name: 'planningSelection',
  initialState,
  reducers: {
    toggleTask(state, action) {
      const taskId = action.payload;
      state.selectedTasks[taskId] = !state.selectedTasks[taskId];
    },
    setSelectedTasks(state, action) {
      state.selectedTasks = action.payload;
    },
    mergeSelectedTasks(state, action) {
      Object.assign(state.selectedTasks, action.payload);
    },
    clearSelectedTasks(state) {
      state.selectedTasks = {};
    },
  },
});

export const { toggleTask, setSelectedTasks, mergeSelectedTasks, clearSelectedTasks } = planningSelectionSlice.actions;
export default planningSelectionSlice.reducer;
