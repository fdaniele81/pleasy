import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import toastReducer from './slices/toastSlice';
import { toastMiddleware } from './middleware/toastMiddleware';
import { apiSlice } from '../api/apiSlice';

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

export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer,

    [apiSlice.reducerPath]: apiSlice.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(toastMiddleware),
});

export default store;
