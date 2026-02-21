import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

export const tmPlanningEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTMPlanning: builder.query({
      query: ({ startDate, endDate }) => ({
        url: '/timesheet/tm-planning',
        params: { start_date: startDate, end_date: endDate },
      }),
      transformResponse: (response) => ({
        tmUsers: response.tm_users || [],
        periodTotalsByDate: response.period_totals_by_date || {},
      }),
      providesTags: () => [
        { type: TAG_TYPES.TIMESHEET, id: 'TM_PLANNING' },
      ],
      keepUnusedDataFor: 60,
    }),

    saveTMTimesheet: builder.mutation({
      query: ({ taskId, workDate, hoursWorked, details, externalKey }) => ({
        url: '/timesheet/tm-planning',
        method: 'POST',
        body: {
          task_id: taskId,
          work_date: workDate,
          hours_worked: hoursWorked,
          details,
          external_key: externalKey,
        },
      }),
      invalidatesTags: () => [
        { type: TAG_TYPES.TIMESHEET, id: 'TM_PLANNING' },
        { type: TAG_TYPES.TIMESHEET, id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTMPlanningQuery,
  useLazyGetTMPlanningQuery,
  useSaveTMTimesheetMutation,
} = tmPlanningEndpoints;
