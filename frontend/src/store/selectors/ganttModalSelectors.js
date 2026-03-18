import { createSelector } from 'reselect';

const selectGanttModalState = (state) => state.ganttModal;

export const selectExpandedUsers = createSelector(
  [selectGanttModalState],
  (gantt) => gantt.expandedUsers
);

export const selectExcludedTasks = createSelector(
  [selectGanttModalState],
  (gantt) => gantt.excludedTasks
);

export const selectTimeInterval = createSelector(
  [selectGanttModalState],
  (gantt) => gantt.timeInterval
);

export const selectDateOffset = createSelector(
  [selectGanttModalState],
  (gantt) => gantt.dateOffset
);

export const selectEtcReferenceDate = createSelector(
  [selectGanttModalState],
  (gantt) => gantt.etcReferenceDate
);

export const selectPosition = createSelector(
  [selectGanttModalState],
  (gantt) => gantt.position
);

export const selectCalendarPosition = createSelector(
  [selectGanttModalState],
  (gantt) => gantt.calendarPosition
);

export const selectIsGanttOpen = createSelector(
  [selectGanttModalState],
  (gantt) => gantt.isGanttOpen
);

export const selectIsCalendarOpen = createSelector(
  [selectGanttModalState],
  (gantt) => gantt.isCalendarOpen
);
