import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

export const projectDraftEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrUpdateDraft: builder.mutation({
      query: (draftData) => ({
        url: '/project-draft',
        method: 'POST',
        body: draftData,
      }),
      invalidatesTags: (result, error, draftData) => [
        { type: TAG_TYPES.PROJECT_DRAFT, id: 'LIST' },
        ...(draftData.project_draft_id
          ? [{ type: TAG_TYPES.PROJECT_DRAFT, id: draftData.project_draft_id }]
          : []),
        ...(draftData.estimate_id
          ? [{ type: TAG_TYPES.ESTIMATE, id: draftData.estimate_id }]
          : []),
      ],
    }),

    getDraft: builder.query({
      query: (projectDraftId) => `/project-draft/${projectDraftId}`,
      providesTags: (result, error, projectDraftId) => [
        { type: TAG_TYPES.PROJECT_DRAFT, id: projectDraftId },
      ],
    }),

    getDraftsByEstimate: builder.query({
      query: (estimateId) => `/project-draft/estimate/${estimateId}`,
      providesTags: (result, error, estimateId) =>
        result?.drafts
          ? [
              { type: TAG_TYPES.PROJECT_DRAFT, id: 'LIST' },
              ...result.drafts.map(({ project_draft_id }) => ({
                type: TAG_TYPES.PROJECT_DRAFT,
                id: project_draft_id,
              })),
              { type: TAG_TYPES.ESTIMATE, id: estimateId },
            ]
          : [
              { type: TAG_TYPES.PROJECT_DRAFT, id: 'LIST' },
              { type: TAG_TYPES.ESTIMATE, id: estimateId },
            ],
    }),

    deleteDraft: builder.mutation({
      query: (projectDraftId) => ({
        url: `/project-draft/${projectDraftId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, projectDraftId) => [
        { type: TAG_TYPES.PROJECT_DRAFT, id: projectDraftId },
        { type: TAG_TYPES.PROJECT_DRAFT, id: 'LIST' },
      ],
    }),

    checkProjectKey: builder.query({
      query: (projectKey) => `/project-draft/check-key/${encodeURIComponent(projectKey)}`,
    }),

    convertDraftToProject: builder.mutation({
      query: (projectDraftId) => ({
        url: `/project-draft/${projectDraftId}/convert`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, projectDraftId) => [
        { type: TAG_TYPES.PROJECT_DRAFT, id: projectDraftId },
        { type: TAG_TYPES.PROJECT_DRAFT, id: 'LIST' },
        { type: TAG_TYPES.PROJECT, id: 'LIST' },
        { type: TAG_TYPES.TASK, id: 'LIST' },
        { type: TAG_TYPES.ESTIMATE, id: 'LIST' },
        { type: TAG_TYPES.DASHBOARD, id: 'LIST' },
        { type: TAG_TYPES.PLANNING, id: 'LIST' },
        { type: TAG_TYPES.TIMESHEET, id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useCreateOrUpdateDraftMutation,
  useGetDraftQuery,
  useGetDraftsByEstimateQuery,
  useLazyGetDraftsByEstimateQuery,
  useDeleteDraftMutation,
  useLazyCheckProjectKeyQuery,
  useConvertDraftToProjectMutation,
} = projectDraftEndpoints;
