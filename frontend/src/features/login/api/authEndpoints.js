import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

export const authEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: '/auth/login',
        method: 'POST',
        body: { email, password },
      }),
      invalidatesTags: [{ type: TAG_TYPES.AUTH, id: 'SESSION' }],
    }),

    impersonate: builder.mutation({
      query: ({ adminEmail, adminPassword, targetEmail }) => ({
        url: '/auth/impersonate',
        method: 'POST',
        body: { adminEmail, adminPassword, targetEmail },
      }),
      invalidatesTags: [{ type: TAG_TYPES.AUTH, id: 'SESSION' }],
    }),

    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: [{ type: TAG_TYPES.AUTH, id: 'SESSION' }],
    }),
  }),
});

export const {
  useLoginMutation,
  useImpersonateMutation,
  useLogoutMutation,
} = authEndpoints;
