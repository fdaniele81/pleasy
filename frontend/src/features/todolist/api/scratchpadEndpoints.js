import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';
import { CACHE_STRATEGIES } from '../../../api/cacheStrategies';

export const scratchpadEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getScratchpad: builder.query({
      query: () => '/scratchpad',
      transformResponse: (response) => response.content ?? '',
      providesTags: [{ type: TAG_TYPES.TODO_ITEM, id: 'SCRATCHPAD' }],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),

    saveScratchpad: builder.mutation({
      query: (content) => ({
        url: '/scratchpad',
        method: 'PUT',
        body: { content },
      }),
      async onQueryStarted(content, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          apiSlice.util.updateQueryData('getScratchpad', undefined, () => content)
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

export const {
  useGetScratchpadQuery,
  useSaveScratchpadMutation,
} = scratchpadEndpoints;
