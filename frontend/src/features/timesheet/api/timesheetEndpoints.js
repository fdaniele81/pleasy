import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';
import { CACHE_STRATEGIES } from '../../../api/cacheStrategies';

export const timesheetEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTimesheets: builder.query({
      query: ({ startDate, endDate }) => ({
        url: '/timesheet',
        params: { start_date: startDate, end_date: endDate },
      }),
      transformResponse: (response) => response.projects,
      providesTags: (result, error, { startDate, endDate }) => [
        { type: TAG_TYPES.TIMESHEET, id: 'LIST' },
        { type: TAG_TYPES.TIMESHEET, id: `${startDate}:${endDate}` },
      ],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),

    saveTimesheet: builder.mutation({
      query: ({ taskId, workDate, hoursWorked, notes, details, externalKey }) => ({
        url: '/timesheet',
        method: 'POST',
        body: {
          task_id: taskId,
          work_date: workDate,
          hours_worked: hoursWorked,
          notes,
          details,
          external_key: externalKey,
        },
      }),
      async onQueryStarted({ taskId, workDate }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
        }
      },
      invalidatesTags: (result, error, { workDate, taskId }) => [
        { type: TAG_TYPES.TIMESHEET, id: 'LIST' },
        { type: TAG_TYPES.TASK, id: taskId },
        { type: TAG_TYPES.DASHBOARD, id: 'LIST' },
      ],
    }),

    deleteTimesheet: builder.mutation({
      query: (timesheetId) => ({
        url: `/timesheet/${timesheetId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: TAG_TYPES.TIMESHEET, id: 'LIST' },
        { type: TAG_TYPES.DASHBOARD, id: 'LIST' },
      ],
    }),

    submitTimesheets: builder.mutation({
      query: ({ timesheetIds }) => ({
        url: '/timesheet/submit',
        method: 'PUT',
        body: {
          timesheet_ids: timesheetIds,
        },
      }),
      invalidatesTags: [
        { type: TAG_TYPES.TIMESHEET, id: 'LIST' },
        { type: TAG_TYPES.DASHBOARD, id: 'LIST' },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),

    getMaxSubmittedDate: builder.query({
      query: () => '/timesheet/max-submitted-date',
      providesTags: [{ type: TAG_TYPES.TIMESHEET, id: 'max-submitted' }],
      keepUnusedDataFor: CACHE_STRATEGIES.SHORT,
    }),

    getDatesWithTimesheets: builder.query({
      query: ({ startDate, endDate }) => ({
        url: '/timesheet/dates-with-timesheets',
        params: { start_date: startDate, end_date: endDate },
      }),
      transformResponse: (response) => response.dates || [],
      providesTags: (result, error, { startDate, endDate }) => [
        { type: TAG_TYPES.TIMESHEET, id: `dates-${startDate}:${endDate}` },
      ],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),

    getPreviewSubmission: builder.query({
      query: () => '/timesheet/preview-submission',
      transformResponse: (response) => response.tasks || [],
      providesTags: [{ type: TAG_TYPES.TIMESHEET, id: 'preview' }],
      keepUnusedDataFor: CACHE_STRATEGIES.SHORT,
    }),

    getTimeOffs: builder.query({
      query: ({ startDate, endDate }) => ({
        url: '/timeoff',
        params: { start_date: startDate, end_date: endDate },
      }),
      transformResponse: (response) => ({
        timeOffs: response.timeOffs || [],
        historicalTotals: response.historicalTotals || [],
      }),
      providesTags: (result, error, { startDate, endDate }) => [
        { type: TAG_TYPES.TIME_OFF, id: 'LIST' },
        { type: TAG_TYPES.TIME_OFF, id: `${startDate}:${endDate}` },
      ],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),

    saveTimeOff: builder.mutation({
      query: ({ timeOffTypeId, date, hours, details }) => ({
        url: '/timeoff',
        method: 'POST',
        body: {
          time_off_type_id: timeOffTypeId,
          date,
          hours,
          details,
        },
      }),
      invalidatesTags: [
        { type: TAG_TYPES.TIME_OFF, id: 'LIST' },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),

    getTimeOffTypes: builder.query({
      query: () => '/timeoff/types',
      transformResponse: (response) => response.time_off_types,
      providesTags: [{ type: TAG_TYPES.TIME_OFF_TYPE, id: 'LIST' }],
    }),

    getGanttDailyTimeOffs: builder.query({
      query: ({ startDate, endDate }) => ({
        url: '/timeoff/gantt-daily',
        params: { start_date: startDate, end_date: endDate },
      }),
      transformResponse: (response) => response.timeOffs || [],
      keepUnusedDataFor: CACHE_STRATEGIES.SHORT,
    }),

    getCompanyTimeOffPlan: builder.query({
      query: ({ startDate, endDate }) => ({
        url: '/timeoff/company-plan',
        params: { start_date: startDate, end_date: endDate },
      }),
      transformResponse: (response) => response.users,
      providesTags: (result, error, { startDate, endDate }) => [
        { type: TAG_TYPES.TIME_OFF, id: `company-plan-${startDate}:${endDate}` },
      ],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),
  }),
});

export const {
  useGetTimesheetsQuery,
  useLazyGetTimesheetsQuery,
  useSaveTimesheetMutation,
  useDeleteTimesheetMutation,
  useSubmitTimesheetsMutation,
  useGetMaxSubmittedDateQuery,
  useGetDatesWithTimesheetsQuery,
  useGetPreviewSubmissionQuery,
  useLazyGetPreviewSubmissionQuery,
  useGetTimeOffsQuery,
  useLazyGetTimeOffsQuery,
  useSaveTimeOffMutation,
  useGetTimeOffTypesQuery,
  useGetGanttDailyTimeOffsQuery,
  useGetCompanyTimeOffPlanQuery,
  useLazyGetCompanyTimeOffPlanQuery,
} = timesheetEndpoints;
