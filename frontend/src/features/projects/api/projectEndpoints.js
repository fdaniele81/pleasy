import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

export const projectEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createProject: builder.mutation({
      query: ({ clientId, projectData }) => ({
        url: '/project',
        method: 'POST',
        body: {
          ...projectData,
          client_id: clientId,
        },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: TAG_TYPES.PROJECT, id: 'LIST' },
        { type: TAG_TYPES.CLIENT, id: clientId },
        { type: TAG_TYPES.CLIENT, id: 'LIST' },
        { type: TAG_TYPES.DASHBOARD, id: 'LIST' },
      ],
    }),

    updateProject: builder.mutation({
      query: ({ projectId, projectData }) => ({
        url: `/project/${projectId}`,
        method: 'PUT',
        body: projectData,
      }),
      invalidatesTags: (result, error, { projectId, clientId }) => [
        { type: TAG_TYPES.PROJECT, id: projectId },
        { type: TAG_TYPES.PROJECT, id: 'LIST' },
        ...(clientId ? [{ type: TAG_TYPES.CLIENT, id: clientId }] : []),
        { type: TAG_TYPES.CLIENT, id: 'LIST' },
        { type: TAG_TYPES.DASHBOARD, id: 'LIST' },
      ],
    }),

    deleteProject: builder.mutation({
      query: ({ projectId }) => ({
        url: `/project/${projectId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { projectId, clientId }) => [
        { type: TAG_TYPES.PROJECT, id: projectId },
        { type: TAG_TYPES.PROJECT, id: 'LIST' },
        ...(clientId ? [{ type: TAG_TYPES.CLIENT, id: clientId }] : []),
        { type: TAG_TYPES.CLIENT, id: 'LIST' },
        { type: TAG_TYPES.TASK, id: 'LIST' },
        { type: TAG_TYPES.DASHBOARD, id: 'LIST' },
      ],
    }),

    getAvailableManagers: builder.query({
      query: (clientId) => `/project/${clientId}/available-managers`,
      transformResponse: (response) => response.available_managers || response.managers || response,
    }),

    getProjectManagers: builder.query({
      query: (projectId) => `/project/${projectId}/managers`,
      transformResponse: (response) => response.project_managers || response.managers || response,
      providesTags: (result, error, projectId) => [
        { type: TAG_TYPES.PROJECT, id: projectId },
      ],
    }),

    addProjectManager: builder.mutation({
      query: ({ projectId, userId }) => ({
        url: `/project/${projectId}/managers/${userId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: TAG_TYPES.PROJECT, id: projectId },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),

    removeProjectManager: builder.mutation({
      query: ({ projectId, userId }) => ({
        url: `/project/${projectId}/managers/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: TAG_TYPES.PROJECT, id: projectId },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),

    assignProjectManagers: builder.mutation({
      query: ({ projectId, managerIds }) => ({
        url: `/project/${projectId}/managers`,
        method: 'PUT',
        body: { project_managers: managerIds },
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: TAG_TYPES.PROJECT, id: projectId },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetAvailableManagersQuery,
  useLazyGetAvailableManagersQuery,
  useGetProjectManagersQuery,
  useLazyGetProjectManagersQuery,
  useAddProjectManagerMutation,
  useRemoveProjectManagerMutation,
  useAssignProjectManagersMutation,
} = projectEndpoints;
