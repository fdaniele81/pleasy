import { createSlice } from '@reduxjs/toolkit';
import { formatDateISO } from '../../utils/date/dateUtils';

const initialState = {
  expandedUsers: {},
  excludedTasks: {},
  timeInterval: 12,
  dateOffset: 0,
  etcReferenceDate: formatDateISO(new Date()),
  position: { x: 20, y: 100 },
  calendarPosition: { x: 100, y: 120 },
  isGanttOpen: false,
  isCalendarOpen: false,
};

const ganttModalSlice = createSlice({
  name: 'ganttModal',
  initialState,
  reducers: {
    setExpandedUsers: (state, action) => {
      state.expandedUsers = action.payload;
    },
    toggleExpandedUser: (state, action) => {
      const userId = action.payload;
      state.expandedUsers[userId] = !state.expandedUsers[userId];
    },
    setExcludedTasks: (state, action) => {
      state.excludedTasks = action.payload;
    },
    toggleExcludedTask: (state, action) => {
      const taskId = action.payload;
      state.excludedTasks[taskId] = !state.excludedTasks[taskId];
    },
    setTimeInterval: (state, action) => {
      state.timeInterval = action.payload;
      state.dateOffset = 0;
    },
    setDateOffset: (state, action) => {
      state.dateOffset = action.payload;
    },
    setEtcReferenceDate: (state, action) => {
      state.etcReferenceDate = action.payload;
    },
    setPosition: (state, action) => {
      state.position = action.payload;
    },
    setCalendarPosition: (state, action) => {
      state.calendarPosition = action.payload;
    },
    setIsGanttOpen: (state, action) => {
      state.isGanttOpen = action.payload;
    },
    setIsCalendarOpen: (state, action) => {
      state.isCalendarOpen = action.payload;
    },
    toggleIsCalendarOpen: (state) => {
      state.isCalendarOpen = !state.isCalendarOpen;
    },
  },
});

export const {
  setExpandedUsers,
  toggleExpandedUser,
  setExcludedTasks,
  toggleExcludedTask,
  setTimeInterval,
  setDateOffset,
  setEtcReferenceDate,
  setPosition,
  setCalendarPosition,
  setIsGanttOpen,
  setIsCalendarOpen,
  toggleIsCalendarOpen,
} = ganttModalSlice.actions;

export default ganttModalSlice.reducer;
