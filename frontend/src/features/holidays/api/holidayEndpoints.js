import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES, providesListByKey, invalidatesItemAndList } from '../../../api/tags';

export const holidayEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHolidays: builder.query({
      query: () => '/holidays',
      transformResponse: (response) => response.holidays,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ holiday_id }) => ({ type: TAG_TYPES.HOLIDAY, id: holiday_id })),
              { type: TAG_TYPES.HOLIDAY, id: 'LIST' },
            ]
          : [{ type: TAG_TYPES.HOLIDAY, id: 'LIST' }],
    }),

    createHoliday: builder.mutation({
      query: (holidayData) => ({
        url: '/holidays',
        method: 'POST',
        body: holidayData,
      }),
      invalidatesTags: [{ type: TAG_TYPES.HOLIDAY, id: 'LIST' }],
    }),

    updateHoliday: builder.mutation({
      query: ({ id, data }) => ({
        url: `/holidays/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: TAG_TYPES.HOLIDAY, id },
        { type: TAG_TYPES.HOLIDAY, id: 'LIST' },
      ],
    }),

    deleteHoliday: builder.mutation({
      query: (id) => ({
        url: `/holidays/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: TAG_TYPES.HOLIDAY, id },
        { type: TAG_TYPES.HOLIDAY, id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
} = holidayEndpoints;
