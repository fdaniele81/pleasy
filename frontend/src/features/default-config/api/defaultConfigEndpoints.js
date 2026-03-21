import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

export const defaultConfigEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDefaultPhasesConfig: builder.query({
      query: () => '/user/default-phases-config',
      providesTags: [{ type: TAG_TYPES.USER, id: 'DEFAULT_CONFIG' }],
    }),

    updateDefaultPhasesConfig: builder.mutation({
      query: (phasesConfig) => ({
        url: '/user/default-phases-config',
        method: 'PUT',
        body: {
          default_phases_config: phasesConfig,
        },
      }),
      invalidatesTags: [{ type: TAG_TYPES.USER, id: 'DEFAULT_CONFIG' }],
    }),

    getPreferredUnit: builder.query({
      query: () => '/user/preferred-unit',
      providesTags: [{ type: TAG_TYPES.USER, id: 'PREFERRED_UNIT' }],
    }),

    updatePreferredUnit: builder.mutation({
      query: (preferredUnit) => ({
        url: '/user/preferred-unit',
        method: 'PUT',
        body: { preferred_unit: preferredUnit },
      }),
      invalidatesTags: [{ type: TAG_TYPES.USER, id: 'PREFERRED_UNIT' }],
    }),
  }),
});

export const {
  useGetDefaultPhasesConfigQuery,
  useUpdateDefaultPhasesConfigMutation,
  useGetPreferredUnitQuery,
  useUpdatePreferredUnitMutation,
} = defaultConfigEndpoints;
