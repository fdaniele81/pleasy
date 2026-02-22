import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { TAG_TYPES } from './tags';
import { CACHE_STRATEGIES, REFETCH_STRATEGIES } from './cacheStrategies';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: `${BASE_URL}/api`,
  credentials: 'include',
  prepareHeaders: (headers, { getState, arg }) => {
    // Don't override Content-Type for FormData (browser sets multipart boundary)
    if (!headers.has('Content-Type') && !(arg?.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  },
});

async function tryRefreshToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQueryWithAuth(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const url = typeof args === 'string' ? args : args.url;
    const isAuthEndpoint = url?.includes('/auth/refresh') || url?.includes('/auth/login');

    if (!isAuthEndpoint) {
      const refreshed = await tryRefreshToken();

      if (refreshed) {
        result = await baseQueryWithAuth(args, api, extraOptions);
      }
    }

    if (result.error && result.error.status === 401) {
      localStorage.removeItem('auth_user');

      window.dispatchEvent(new CustomEvent('unauthorized'));
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,

  tagTypes: Object.values(TAG_TYPES),

  endpoints: (builder) => ({}),

  keepUnusedDataFor: CACHE_STRATEGIES.DEFAULT,

  refetchOnMountOrArgChange: REFETCH_STRATEGIES.DEFAULT,
});

export const {} = apiSlice;
