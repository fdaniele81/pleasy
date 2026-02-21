import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

export const snapshotEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSnapshots: builder.query({
      query: ({ startDate, endDate } = {}) => {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        return {
          url: '/timesheet/snapshots',
          params,
        };
      },
      transformResponse: (response) => response.snapshots,
      providesTags: (result) =>
        result
          ? [
              { type: TAG_TYPES.SNAPSHOT, id: 'LIST' },
              ...result.map(({ snapshot_id }) => ({ type: TAG_TYPES.SNAPSHOT, id: snapshot_id })),
            ]
          : [{ type: TAG_TYPES.SNAPSHOT, id: 'LIST' }],
    }),

    reopenSnapshot: builder.mutation({
      query: (snapshotId) => ({
        url: `/timesheet/snapshots/${snapshotId}/reopen`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, snapshotId) => [
        { type: TAG_TYPES.SNAPSHOT, id: snapshotId },
        { type: TAG_TYPES.SNAPSHOT, id: 'LIST' },
      ],
    }),

    getSnapshotDetails: builder.query({
      query: (snapshotId) => `/timesheet/snapshots/${snapshotId}/details`,
      providesTags: (result, error, snapshotId) => [
        { type: TAG_TYPES.SNAPSHOT, id: snapshotId },
      ],
    }),
  }),
});

export const {
  useGetSnapshotsQuery,
  useReopenSnapshotMutation,
  useGetSnapshotDetailsQuery,
} = snapshotEndpoints;
