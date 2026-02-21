import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

export const planningEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPMPlanning: builder.query({
      query: () => '/task/pm-planning',
      transformResponse: (response) => response.projects,
      providesTags: (result) =>
        result
          ? [
              { type: TAG_TYPES.PLANNING, id: 'LIST' },
              ...result.map(({ project_id }) => ({ type: TAG_TYPES.PROJECT, id: project_id })),
              ...result.flatMap(project =>
                project.tasks?.map(({ task_id }) => ({ type: TAG_TYPES.TASK, id: task_id })) || []
              ),
            ]
          : [{ type: TAG_TYPES.PLANNING, id: 'LIST' }],
    }),

    updateTaskDates: builder.mutation({
      query: ({ taskId, start_date, end_date }) => ({
        url: `/task/${taskId}`,
        method: 'PUT',
        body: { start_date, end_date },
      }),
      async onQueryStarted({ projectId, taskId, start_date, end_date }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getPMPlanning', undefined, (draft) => {
            const project = draft.find(p => p.project_id === projectId);
            if (project) {
              const task = project.tasks?.find(t => t.task_id === taskId);
              if (task) {
                task.start_date = start_date;
                task.end_date = end_date;
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
      invalidatesTags: (result, error, { taskId, projectId }) => [
        { type: TAG_TYPES.TASK, id: taskId },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
        ...(projectId ? [{ type: TAG_TYPES.PROJECT, id: projectId }] : []),
      ],
    }),

    updateTaskStatus: builder.mutation({
      query: ({ taskId, status }) => ({
        url: `/task/${taskId}`,
        method: 'PUT',
        body: { status },
      }),
      async onQueryStarted({ projectId, taskId, status }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getPMPlanning', undefined, (draft) => {
            const project = draft.find(p => p.project_id === projectId);
            if (project) {
              const task = project.tasks?.find(t => t.task_id === taskId);
              if (task) {
                task.status = status;
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
      invalidatesTags: (result, error, { taskId }) => [
        { type: TAG_TYPES.TASK, id: taskId },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),

    createTaskPlan: builder.mutation({
      query: (taskData) => ({
        url: '/task',
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: [
        { type: TAG_TYPES.TASK, id: 'LIST' },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),

    updateTaskPlan: builder.mutation({
      query: ({ taskId, data }) => ({
        url: `/task/${taskId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: TAG_TYPES.TASK, id: taskId },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),

    deleteTaskPlan: builder.mutation({
      query: (taskId) => ({
        url: `/task/${taskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, taskId) => [
        { type: TAG_TYPES.TASK, id: taskId },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetPMPlanningQuery,
  useUpdateTaskDatesMutation,
  useUpdateTaskStatusMutation,
  useCreateTaskPlanMutation,
  useUpdateTaskPlanMutation,
  useDeleteTaskPlanMutation,
} = planningEndpoints;
