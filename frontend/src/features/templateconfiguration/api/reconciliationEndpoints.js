import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';
import { CACHE_STRATEGIES } from '../../../api/cacheStrategies';

const BASE_URL = import.meta.env.VITE_API_URL;

export const reconciliationEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReconciliationTemplate: builder.query({
      query: () => '/reconciliation/template',
      transformResponse: (response) => response.template,
      providesTags: [{ type: TAG_TYPES.RECONCILIATION, id: 'TEMPLATE' }],
      keepUnusedDataFor: CACHE_STRATEGIES.MEDIUM,
    }),

    uploadReconciliationStaging: builder.mutation({
      queryFn: async (file) => {
        try {
          const formData = new FormData();
          formData.append('excelFile', file);
          formData.append('template_name', 'Template Riconciliazione');

          const response = await fetch(`${BASE_URL}/api/reconciliation/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          const data = await response.json();
          if (!response.ok) {
            return { error: { status: response.status, data } };
          }
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
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
      queryFn: async ({ templateName, sqlQuery }) => {
        try {
          const formData = new FormData();
          formData.append('template_name', templateName);
          formData.append('sql_query', sqlQuery);

          const response = await fetch(`${BASE_URL}/api/reconciliation/template`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          const data = await response.json();
          if (!response.ok) {
            return { error: { status: response.status, data } };
          }
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
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
  usePreviewReconciliationQueryMutation,
  useLazyPreviewReconciliationStagingQuery,
  useLazyPreviewReconciliationUsersQuery,
} = reconciliationEndpoints;
