import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';
import { CACHE_STRATEGIES } from '../../../api/cacheStrategies';

export const dashboardEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardProjects: builder.query({
      query: () => '/dashboard/projects',
      transformResponse: (response) => ({
        projects: response.projects,
        owners: response.owners,
      }),
      providesTags: [{ type: TAG_TYPES.DASHBOARD, id: 'projects' }],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),

    getDashboardEstimates: builder.query({
      query: () => '/dashboard/estimates',
      transformResponse: (response) => response.estimates,
      providesTags: [{ type: TAG_TYPES.DASHBOARD, id: 'estimates' }],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),

    getDashboardTimesheets: builder.query({
      query: ({ startDate, endDate }) => ({
        url: '/dashboard/timesheets',
        params: { start_date: startDate, end_date: endDate },
      }),
      transformResponse: (response) => response.timesheets,
      providesTags: (result, error, { startDate, endDate }) => [
        { type: TAG_TYPES.DASHBOARD, id: `timesheets-${startDate}:${endDate}` },
      ],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),

    getDashboardSnapshots: builder.query({
      query: ({ startDate, endDate }) => ({
        url: '/dashboard/snapshots',
        params: { start_date: startDate, end_date: endDate },
      }),
      transformResponse: (response) => response.snapshots,
      providesTags: (result, error, { startDate, endDate }) => [
        { type: TAG_TYPES.DASHBOARD, id: `snapshots-${startDate}:${endDate}` },
      ],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),

    getDashboardClients: builder.query({
      query: () => '/dashboard/clients',
      transformResponse: (response) => response.clients,
      providesTags: [{ type: TAG_TYPES.DASHBOARD, id: 'clients' }],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),

    getDashboardTMActivities: builder.query({
      query: () => '/dashboard/tm-activities',
      transformResponse: (response) => ({
        tmActivities: response.tmActivities,
        totals: response.totals,
      }),
      providesTags: [{ type: TAG_TYPES.DASHBOARD, id: 'tm-activities' }],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),
  }),
});

export const {
  useGetDashboardProjectsQuery,
  useGetDashboardEstimatesQuery,
  useGetDashboardTimesheetsQuery,
  useGetDashboardSnapshotsQuery,
  useGetDashboardClientsQuery,
  useGetDashboardTMActivitiesQuery,
} = dashboardEndpoints;
