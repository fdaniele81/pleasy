import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

export const taskEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProjectsWithTasks: builder.query({
      query: () => '/task/project_tasks',
      transformResponse: (response) => response.projects,
      providesTags: (result) =>
        result
          ? [
              { type: TAG_TYPES.PROJECT, id: 'LIST' },
              { type: TAG_TYPES.TASK, id: 'LIST' },
              ...result.map(({ project_id }) => ({ type: TAG_TYPES.PROJECT, id: project_id })),
              ...result.flatMap(project =>
                project.tasks?.map(({ task_id }) => ({ type: TAG_TYPES.TASK, id: task_id })) || []
              ),
            ]
          : [{ type: TAG_TYPES.PROJECT, id: 'LIST' }, { type: TAG_TYPES.TASK, id: 'LIST' }],
    }),

    createTask: builder.mutation({
      query: ({ projectId, taskData }) => ({
        url: '/task',
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: TAG_TYPES.TASK, id: 'LIST' },
        { type: TAG_TYPES.PROJECT, id: projectId },
        { type: TAG_TYPES.PROJECT, id: 'LIST' },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
        { type: TAG_TYPES.DASHBOARD, id: 'LIST' },
      ],
    }),

    updateTask: builder.mutation({
      query: ({ taskId, taskData }) => ({
        url: `/task/${taskId}`,
        method: 'PUT',
        body: taskData,
      }),
      invalidatesTags: (result, error, { taskId, projectId }) => [
        { type: TAG_TYPES.TASK, id: taskId },
        { type: TAG_TYPES.TASK, id: 'LIST' },
        ...(projectId ? [{ type: TAG_TYPES.PROJECT, id: projectId }] : []),
        { type: TAG_TYPES.PROJECT, id: 'LIST' },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),

    deleteTask: builder.mutation({
      query: ({ taskId }) => ({
        url: `/task/${taskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { taskId, projectId }) => [
        { type: TAG_TYPES.TASK, id: taskId },
        { type: TAG_TYPES.TASK, id: 'LIST' },
        ...(projectId ? [{ type: TAG_TYPES.PROJECT, id: projectId }] : []),
        { type: TAG_TYPES.PROJECT, id: 'LIST' },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
      async onQueryStarted({ taskId, projectId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          taskEndpoints.util.updateQueryData('getProjectsWithTasks', undefined, (draft) => {
            const project = draft.find(p => p.project_id === projectId);
            if (project) {
              project.tasks = project.tasks.filter(t => t.task_id !== taskId);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    updateInitialActual: builder.mutation({
      query: ({ taskId, initialActual }) => ({
        url: `/task/${taskId}/initial-actual`,
        method: 'PUT',
        body: { initial_actual: initialActual },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: TAG_TYPES.TASK, id: taskId },
        { type: TAG_TYPES.TASK, id: 'LIST' },
      ],
    }),

    getAvailableUsers: builder.query({
      query: (projectId) => `/task/${projectId}/available-users`,
    }),

    updateTaskETC: builder.mutation({
      query: ({ taskId, etc }) => ({
        url: `/task/${taskId}/etc`,
        method: 'PUT',
        body: { etc },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: TAG_TYPES.TASK, id: taskId },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
      async onQueryStarted({ taskId, etc, projectId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          taskEndpoints.util.updateQueryData('getProjectsWithTasks', undefined, (draft) => {
            for (const project of draft) {
              const task = project.tasks?.find(t => t.task_id === taskId);
              if (task) {
                task.etc = etc;
                break;
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    getTaskDetailsForUser: builder.query({
      query: (taskId) => `/task/${taskId}/task-details`,
      transformResponse: (response) => response.task,
      providesTags: (result, error, taskId) => [
        { type: TAG_TYPES.TASK, id: taskId },
      ],
    }),

    updateTaskDetailsForUser: builder.mutation({
      query: ({ taskId, taskDetails }) => ({
        url: `/task/${taskId}/task-details`,
        method: 'PUT',
        body: { task_details: taskDetails },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: TAG_TYPES.TASK, id: taskId },
      ],
    }),

    getTaskDetails: builder.query({
      query: (taskId) => `/task/${taskId}/details`,
      transformResponse: (response) => response.task,
      providesTags: (result, error, taskId) => [
        { type: TAG_TYPES.TASK, id: taskId },
      ],
    }),
  }),
});

export const {
  useGetProjectsWithTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateInitialActualMutation,
  useGetAvailableUsersQuery,
  useLazyGetAvailableUsersQuery,
  useUpdateTaskETCMutation,
  useGetTaskDetailsForUserQuery,
  useLazyGetTaskDetailsForUserQuery,
  useUpdateTaskDetailsForUserMutation,
  useGetTaskDetailsQuery,
  useLazyGetTaskDetailsQuery,
} = taskEndpoints;
