import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';
import { CACHE_STRATEGIES } from '../../../api/cacheStrategies';

export const reconciliationEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReconciliationTemplate: builder.query({
      query: () => '/reconciliation/template',
      transformResponse: (response) => response.template,
      providesTags: [{ type: TAG_TYPES.RECONCILIATION, id: 'TEMPLATE' }],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),

    uploadReconciliationStaging: builder.mutation({
      queryFn: async (file, _api, _extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('excelFile', file);
        formData.append('template_name', 'Template Riconciliazione');

        const result = await baseQuery({
          url: '/reconciliation/upload',
          method: 'POST',
          body: formData,
          formData: true,
        });

        return result.error ? { error: result.error } : { data: result.data };
      },
      invalidatesTags: [{ type: TAG_TYPES.RECONCILIATION, id: 'TEMPLATE' }],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          window.dispatchEvent(new Event('reconciliation-template-updated'));
        } catch {}
      },
    }),

    saveReconciliationTemplate: builder.mutation({
      queryFn: async ({ templateName, sqlQuery }, _api, _extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('template_name', templateName);
        formData.append('sql_query', sqlQuery);

        const result = await baseQuery({
          url: '/reconciliation/template',
          method: 'POST',
          body: formData,
          formData: true,
        });

        return result.error ? { error: result.error } : { data: result.data };
      },
      invalidatesTags: [{ type: TAG_TYPES.RECONCILIATION, id: 'TEMPLATE' }],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          window.dispatchEvent(new Event('reconciliation-template-updated'));
        } catch {}
      },
    }),

    deleteReconciliationTemplate: builder.mutation({
      query: () => ({
        url: '/reconciliation/template',
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: TAG_TYPES.RECONCILIATION, id: 'TEMPLATE' }],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          window.dispatchEvent(new Event('reconciliation-template-updated'));
        } catch {}
      },
    }),

    getReconciliationSyncStatus: builder.query({
      query: () => '/reconciliation/sync-status',
      providesTags: [{ type: TAG_TYPES.RECONCILIATION, id: 'SYNC' }],
      keepUnusedDataFor: CACHE_STRATEGIES.SHORT,
    }),

    uploadReconciliationFile: builder.mutation({
      queryFn: async (file, _api, _extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append('excelFile', file);

        const result = await baseQuery({
          url: '/reconciliation/upload',
          method: 'POST',
          body: formData,
          formData: true,
        });

        return result.error ? { error: result.error } : { data: result.data };
      },
      invalidatesTags: [
        { type: TAG_TYPES.RECONCILIATION, id: 'TEMPLATE' },
        { type: TAG_TYPES.RECONCILIATION, id: 'SYNC' },
      ],
    }),

    previewReconciliationQuery: builder.mutation({
      query: (sqlQuery) => ({
        url: '/reconciliation/preview-query',
        method: 'POST',
        body: { query: sqlQuery },
      }),
    }),

    previewReconciliationStaging: builder.query({
      query: () => '/reconciliation/preview-staging',
      keepUnusedDataFor: CACHE_STRATEGIES.TRANSIENT,
    }),

    previewReconciliationUsers: builder.query({
      query: () => '/reconciliation/preview-users',
      keepUnusedDataFor: CACHE_STRATEGIES.TRANSIENT,
    }),
  }),
});

export const {
  useGetReconciliationTemplateQuery,
  useUploadReconciliationStagingMutation,
  useSaveReconciliationTemplateMutation,
  useDeleteReconciliationTemplateMutation,
  useGetReconciliationSyncStatusQuery,
  useUploadReconciliationFileMutation,
  usePreviewReconciliationQueryMutation,
  useLazyPreviewReconciliationStagingQuery,
  useLazyPreviewReconciliationUsersQuery,
} = reconciliationEndpoints;
