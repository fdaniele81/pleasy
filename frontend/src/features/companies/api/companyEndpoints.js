import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

export const companyEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCompaniesWithUsers: builder.query({
      query: () => '/company/company_users',
      transformResponse: (response) => response.companies,
      providesTags: (result) =>
        result
          ? [
              { type: TAG_TYPES.COMPANY, id: 'LIST' },
              ...result.map(({ company_id }) => ({ type: TAG_TYPES.COMPANY, id: company_id })),
              { type: TAG_TYPES.USER, id: 'LIST' },
              ...result.flatMap(company =>
                company.users?.map(({ user_id }) => ({ type: TAG_TYPES.USER, id: user_id })) || []
              ),
            ]
          : [{ type: TAG_TYPES.COMPANY, id: 'LIST' }, { type: TAG_TYPES.USER, id: 'LIST' }],
    }),

    createCompany: builder.mutation({
      query: (companyData) => ({
        url: '/company',
        method: 'POST',
        body: companyData,
      }),
      invalidatesTags: [{ type: TAG_TYPES.COMPANY, id: 'LIST' }],
    }),

    updateCompany: builder.mutation({
      query: ({ id, data }) => ({
        url: `/company/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: TAG_TYPES.COMPANY, id },
        { type: TAG_TYPES.COMPANY, id: 'LIST' },
      ],
    }),

    deleteCompany: builder.mutation({
      query: (id) => ({
        url: `/company/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: TAG_TYPES.COMPANY, id },
        { type: TAG_TYPES.COMPANY, id: 'LIST' },
        { type: TAG_TYPES.USER, id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetCompaniesWithUsersQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} = companyEndpoints;
