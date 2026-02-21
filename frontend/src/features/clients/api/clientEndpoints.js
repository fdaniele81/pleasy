import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES, invalidatesItemAndList } from '../../../api/tags';
import { CACHE_STRATEGIES } from '../../../api/cacheStrategies';

export const clientEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getClients: builder.query({
      query: () => '/client',
      transformResponse: (response) => response.clients,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ client_id }) => ({ type: TAG_TYPES.CLIENT, id: client_id })),
              { type: TAG_TYPES.CLIENT, id: 'LIST' },
            ]
          : [{ type: TAG_TYPES.CLIENT, id: 'LIST' }],
      keepUnusedDataFor: CACHE_STRATEGIES.LONG,
    }),

    getClientsWithProjects: builder.query({
      query: () => '/client/client_projects',
      transformResponse: (response) => response.clients,
      providesTags: (result) =>
        result
          ? [
              { type: TAG_TYPES.CLIENT, id: 'LIST' },
              ...result.map(({ client_id }) => ({ type: TAG_TYPES.CLIENT, id: client_id })),
              { type: TAG_TYPES.PROJECT, id: 'LIST' },
              ...result.flatMap(client =>
                client.projects?.map(({ project_id }) => ({ type: TAG_TYPES.PROJECT, id: project_id })) || []
              ),
            ]
          : [{ type: TAG_TYPES.CLIENT, id: 'LIST' }, { type: TAG_TYPES.PROJECT, id: 'LIST' }],
      keepUnusedDataFor: CACHE_STRATEGIES.LONG,
    }),

    createClient: builder.mutation({
      query: (clientData) => {
        const storedUser = localStorage.getItem('auth_user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        const company_id = currentUser?.company_id || clientData.company_id;

        return {
          url: '/client',
          method: 'POST',
          body: {
            ...clientData,
            company_id,
          },
        };
      },
      invalidatesTags: [
        { type: TAG_TYPES.CLIENT, id: 'LIST' },
        { type: TAG_TYPES.DASHBOARD, id: 'LIST' },
      ],
    }),

    updateClient: builder.mutation({
      query: ({ id, data }) => ({
        url: `/client/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: TAG_TYPES.CLIENT, id },
        { type: TAG_TYPES.CLIENT, id: 'LIST' },
        { type: TAG_TYPES.DASHBOARD, id: 'LIST' },
      ],
    }),

    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/client/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: TAG_TYPES.CLIENT, id },
        { type: TAG_TYPES.CLIENT, id: 'LIST' },
        { type: TAG_TYPES.PROJECT, id: 'LIST' },
        { type: TAG_TYPES.DASHBOARD, id: 'LIST' },
      ],
    }),

    getClientPhasesConfig: builder.query({
      query: (clientId) => `/client/${clientId}/phases-config`,
      providesTags: (result, error, clientId) => [
        { type: TAG_TYPES.CLIENT, id: clientId },
      ],
    }),

    updateClientPhasesConfig: builder.mutation({
      query: ({ clientId, phasesConfig }) => ({
        url: `/client/${clientId}/phases-config`,
        method: 'PUT',
        body: {
          project_phases_config: phasesConfig,
        },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: TAG_TYPES.CLIENT, id: clientId },
      ],
    }),

    getClientTMDetails: builder.query({
      query: (clientId) => `/client/${clientId}/tm-details`,
      providesTags: (result, error, clientId) => [
        { type: TAG_TYPES.CLIENT, id: clientId },
        { type: TAG_TYPES.CLIENT, id: `TM_${clientId}` },
      ],
    }),

    assignUserToClient: builder.mutation({
      query: ({ clientId, userId }) => ({
        url: `/client/${clientId}/assign-user`,
        method: 'POST',
        body: { user_id: userId },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: TAG_TYPES.CLIENT, id: clientId },
        { type: TAG_TYPES.CLIENT, id: `TM_${clientId}` },
        { type: TAG_TYPES.TASK, id: 'LIST' },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),

    unassignUserFromClient: builder.mutation({
      query: ({ clientId, userId }) => ({
        url: `/client/${clientId}/unassign-user/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: TAG_TYPES.CLIENT, id: clientId },
        { type: TAG_TYPES.CLIENT, id: `TM_${clientId}` },
        { type: TAG_TYPES.TASK, id: 'LIST' },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),

    assignPMToClient: builder.mutation({
      query: ({ clientId, userId }) => ({
        url: `/client/${clientId}/assign-pm/${userId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: TAG_TYPES.CLIENT, id: clientId },
        { type: TAG_TYPES.CLIENT, id: `TM_${clientId}` },
      ],
    }),

    unassignPMFromClient: builder.mutation({
      query: ({ clientId, userId }) => ({
        url: `/client/${clientId}/unassign-pm/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: TAG_TYPES.CLIENT, id: clientId },
        { type: TAG_TYPES.CLIENT, id: `TM_${clientId}` },
      ],
    }),

    updateTMReconciliation: builder.mutation({
      query: ({ clientId, reconciliationRequired }) => ({
        url: `/client/${clientId}/tm-reconciliation`,
        method: 'PUT',
        body: { reconciliation_required: reconciliationRequired },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: TAG_TYPES.CLIENT, id: clientId },
        { type: TAG_TYPES.CLIENT, id: `TM_${clientId}` },
      ],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientsWithProjectsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useGetClientPhasesConfigQuery,
  useLazyGetClientPhasesConfigQuery,
  useUpdateClientPhasesConfigMutation,
  useGetClientTMDetailsQuery,
  useAssignUserToClientMutation,
  useUnassignUserFromClientMutation,
  useAssignPMToClientMutation,
  useUnassignPMFromClientMutation,
  useUpdateTMReconciliationMutation,
} = clientEndpoints;
