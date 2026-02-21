import { apiSlice } from '../../../api/apiSlice';
import { TAG_TYPES } from '../../../api/tags';

const BASE_URL = import.meta.env.VITE_API_URL;

export const authEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      queryFn: async ({ email, password }) => {
        try {
          const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
              error: {
                status: response.status,
                data: errorData.error || 'Login fallito',
              },
            };
          }

          const data = await response.json();
          return { data };
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              data: error.message || 'Errore di connessione',
            },
          };
        }
      },
      invalidatesTags: [{ type: TAG_TYPES.AUTH, id: 'SESSION' }],
    }),

    impersonate: builder.mutation({
      queryFn: async ({ adminEmail, adminPassword, targetEmail }) => {
        try {
          const response = await fetch(`${BASE_URL}/api/auth/impersonate`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminEmail, adminPassword, targetEmail }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
              error: {
                status: response.status,
                data: errorData.error || 'Impersonificazione fallita',
              },
            };
          }

          const data = await response.json();
          return { data };
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              data: error.message || 'Errore di connessione',
            },
          };
        }
      },
      invalidatesTags: [{ type: TAG_TYPES.AUTH, id: 'SESSION' }],
    }),

    logout: builder.mutation({
      queryFn: async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
              error: {
                status: response.status,
                data: errorData.error || 'Logout fallito',
              },
            };
          }

          const data = await response.json();
          return { data };
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              data: error.message || 'Errore di connessione',
            },
          };
        }
      },
      invalidatesTags: [{ type: TAG_TYPES.AUTH, id: 'SESSION' }],
    }),
  }),
});

export const {
  useLoginMutation,
  useImpersonateMutation,
  useLogoutMutation,
} = authEndpoints;
