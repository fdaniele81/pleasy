import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

export const estimateEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEstimates: builder.query({
      query: (filters) => ({
        url: '/estimate',
        params: filters,
      }),
      transformResponse: (response) => response.estimates,
      providesTags: (result) =>
        result
          ? [
              { type: TAG_TYPES.ESTIMATE, id: 'LIST' },
              ...result.map(({ estimate_id }) => ({ type: TAG_TYPES.ESTIMATE, id: estimate_id })),
            ]
          : [{ type: TAG_TYPES.ESTIMATE, id: 'LIST' }],
    }),

    getEstimate: builder.query({
      query: (estimateId) => `/estimate/${estimateId}`,
      transformResponse: (response) => response.estimate,
      providesTags: (result, error, estimateId) => [
        { type: TAG_TYPES.ESTIMATE, id: estimateId },
      ],
    }),

    createEstimate: builder.mutation({
      query: (estimateData) => ({
        url: '/estimate',
        method: 'POST',
        body: estimateData,
      }),
      transformResponse: (response) => response.estimate,
      invalidatesTags: [{ type: TAG_TYPES.ESTIMATE, id: 'LIST' }],
    }),

    updateEstimate: builder.mutation({
      query: ({ id, data }) => ({
        url: `/estimate/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: TAG_TYPES.ESTIMATE, id },
        { type: TAG_TYPES.ESTIMATE, id: 'LIST' },
      ],
    }),

    deleteEstimate: builder.mutation({
      query: (id) => ({
        url: `/estimate/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: TAG_TYPES.ESTIMATE, id },
        { type: TAG_TYPES.ESTIMATE, id: 'LIST' },
      ],
    }),

    convertEstimate: builder.mutation({
      query: ({ estimateId, projectData }) => ({
        url: `/estimate/${estimateId}/convert`,
        method: 'POST',
        body: projectData,
      }),
      invalidatesTags: (result, error, { estimateId }) => [
        { type: TAG_TYPES.ESTIMATE, id: estimateId },
        { type: TAG_TYPES.ESTIMATE, id: 'LIST' },
        { type: TAG_TYPES.PROJECT, id: 'LIST' },
      ],
    }),

    createEstimateTask: builder.mutation({
      query: ({ estimateId, taskData }) => ({
        url: `/estimate/${estimateId}/tasks`,
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: (result, error, { estimateId }) => [
        { type: TAG_TYPES.ESTIMATE, id: estimateId },
      ],
    }),

    updateEstimateTask: builder.mutation({
      query: ({ estimateId, taskId, taskData }) => ({
        url: `/estimate/${estimateId}/tasks/${taskId}`,
        method: 'PUT',
        body: taskData,
      }),
      invalidatesTags: (result, error, { estimateId }) => [
        { type: TAG_TYPES.ESTIMATE, id: estimateId },
      ],
    }),

    deleteEstimateTask: builder.mutation({
      query: ({ estimateId, taskId }) => ({
        url: `/estimate/${estimateId}/tasks/${taskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { estimateId }) => [
        { type: TAG_TYPES.ESTIMATE, id: estimateId },
      ],
    }),

    cloneEstimate: builder.mutation({
      query: ({ estimateId, title, project_key }) => ({
        url: `/estimate/${estimateId}/clone`,
        method: 'POST',
        body: { title, project_key },
      }),
      invalidatesTags: [{ type: TAG_TYPES.ESTIMATE, id: 'LIST' }],
    }),

    calculateFTE: builder.mutation({
      query: ({ estimateId, data }) => ({
        url: `/estimate/${estimateId}/calculate-fte`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetEstimatesQuery,
  useGetEstimateQuery,
  useLazyGetEstimateQuery,
  useCreateEstimateMutation,
  useUpdateEstimateMutation,
  useDeleteEstimateMutation,
  useConvertEstimateMutation,
  useCreateEstimateTaskMutation,
  useUpdateEstimateTaskMutation,
  useDeleteEstimateTaskMutation,
  useCloneEstimateMutation,
  useCalculateFTEMutation,
} = estimateEndpoints;
