import { apiSlice } from './apiSlice';
import { TAG_TYPES } from './tags';
import { CACHE_STRATEGIES } from './cacheStrategies';

export const savedFiltersEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSavedFilters: builder.query({
      query: () => '/saved-filters',
      transformResponse: (response) => response.saved_filters,
      providesTags: [{ type: TAG_TYPES.SAVED_FILTER, id: 'LIST' }],
      keepUnusedDataFor: CACHE_STRATEGIES.LONG,
    }),

    saveFilter: builder.mutation({
      query: ({ section, name, filters }) => ({
        url: '/saved-filters',
        method: 'POST',
        body: { section, name, filters },
      }),
      invalidatesTags: [{ type: TAG_TYPES.SAVED_FILTER, id: 'LIST' }],
    }),

    updateSavedFilter: builder.mutation({
      query: ({ filterId, section, name, filters }) => ({
        url: `/saved-filters/${filterId}`,
        method: 'PUT',
        body: { section, name, filters },
      }),
      invalidatesTags: [{ type: TAG_TYPES.SAVED_FILTER, id: 'LIST' }],
    }),

    deleteSavedFilter: builder.mutation({
      query: ({ filterId, section }) => ({
        url: `/saved-filters/${filterId}`,
        method: 'DELETE',
        body: { section },
      }),
      invalidatesTags: [{ type: TAG_TYPES.SAVED_FILTER, id: 'LIST' }],
    }),
  }),
});

export const {
  useGetSavedFiltersQuery,
  useSaveFilterMutation,
  useUpdateSavedFilterMutation,
  useDeleteSavedFilterMutation,
} = savedFiltersEndpoints;
