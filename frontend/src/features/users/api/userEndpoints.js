import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

export const userEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createUser: builder.mutation({
      query: ({ companyId, userData }) => ({
        url: '/user',
        method: 'POST',
        body: {
          ...userData,
          company_id: companyId,
        },
      }),
      invalidatesTags: [
        { type: TAG_TYPES.USER, id: 'LIST' },
        { type: TAG_TYPES.COMPANY, id: 'LIST' },
      ],
    }),

    updateUser: builder.mutation({
      query: ({ userId, userData }) => ({
        url: `/user/update/${userId}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: (result, error, { userId, companyId }) => [
        { type: TAG_TYPES.USER, id: userId },
        { type: TAG_TYPES.USER, id: 'LIST' },
        ...(companyId ? [{ type: TAG_TYPES.COMPANY, id: companyId }] : []),
        { type: TAG_TYPES.COMPANY, id: 'LIST' },
      ],
    }),

    deleteUser: builder.mutation({
      query: ({ userId }) => ({
        url: `/user/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { userId, companyId }) => [
        { type: TAG_TYPES.USER, id: userId },
        { type: TAG_TYPES.USER, id: 'LIST' },
        ...(companyId ? [{ type: TAG_TYPES.COMPANY, id: companyId }] : []),
        { type: TAG_TYPES.COMPANY, id: 'LIST' },
      ],
    }),

    resetUserPassword: builder.mutation({
      query: ({ userId, newPassword }) => ({
        url: `/user/reset-password/${userId}`,
        method: 'PUT',
        body: { new_password: newPassword },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: TAG_TYPES.USER, id: userId },
      ],
    }),

    changePassword: builder.mutation({
      query: ({ currentPassword, newPassword }) => ({
        url: '/user/change-password',
        method: 'PUT',
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      }),
    }),
  }),
});

export const {
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  useChangePasswordMutation,
} = userEndpoints;
