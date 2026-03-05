import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer, { localLogout } from './slices/authSlice';
import toastReducer from './slices/toastSlice';
import planningFiltersReducer from './slices/planningFiltersSlice';
import timesheetFiltersReducer from './slices/timesheetFiltersSlice';
import tmPlanningFiltersReducer from './slices/tmPlanningFiltersSlice';
import dashboardFiltersReducer from './slices/dashboardFiltersSlice';
import { toastMiddleware } from './middleware/toastMiddleware';
import { apiSlice } from '../api/apiSlice';
import { authEndpoints } from '../features/login/api/authEndpoints';

import '../features/holidays/api/holidayEndpoints';
import '../features/clients/api/clientEndpoints';
import '../features/projects/api/projectEndpoints';
import '../features/companies/api/companyEndpoints';
import '../features/planning/api/taskEndpoints';
import '../features/planning/api/planningEndpoints';
import '../features/estimator/api/estimateEndpoints';
import '../features/timesheetsnapshots/api/snapshotEndpoints';
import '../features/dashboard/api/dashboardEndpoints';
import '../features/timesheet/api/timesheetEndpoints';
import '../features/users/api/userEndpoints';
import '../features/estimator/api/projectDraftEndpoints';
import '../features/login/api/authEndpoints';

const isLogoutAction = (action) =>
  action.type === localLogout.type ||
  authEndpoints.endpoints.logout.matchFulfilled(action) ||
  authEndpoints.endpoints.logout.matchRejected(action);

const appReducer = combineReducers({
  auth: authReducer,
  toast: toastReducer,
  planningFilters: planningFiltersReducer,
  timesheetFilters: timesheetFiltersReducer,
  tmPlanningFilters: tmPlanningFiltersReducer,
  dashboardFilters: dashboardFiltersReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

const rootReducer = (state, action) => {
  if (isLogoutAction(action)) {
    // Reset filter slices to initial state on logout
    state = {
      ...state,
      planningFilters: undefined,
      timesheetFilters: undefined,
      tmPlanningFilters: undefined,
      dashboardFilters: undefined,
    };
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(toastMiddleware),
});

export default store;
