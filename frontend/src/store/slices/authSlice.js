import { createSlice } from "@reduxjs/toolkit";
import { authEndpoints } from "../../features/login/api/authEndpoints";
import logger from "../../utils/logger";

const USER_KEY = 'auth_user';

const isValidUserSchema = (user) => {
  return (
    user &&
    typeof user === 'object' &&
    typeof user.user_id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.role_id === 'string'
  );
};

export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    const user = JSON.parse(userStr);

    if (!isValidUserSchema(user)) {
      logger.warn('Invalid user data in localStorage, clearing...');
      localStorage.removeItem(USER_KEY);
      return null;
    }

    return user;
  } catch (error) {
    logger.warn('Failed to parse user from localStorage:', error.message);
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const setStoredUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));
const clearStoredUser = () => localStorage.removeItem(USER_KEY);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: getStoredUser(),
    isAuthenticated: !!getStoredUser(),
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    localLogout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      clearStoredUser();
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        authEndpoints.endpoints.login.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        authEndpoints.endpoints.login.matchFulfilled,
        (state, action) => {
          state.loading = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.error = null;
          setStoredUser(action.payload.user);
        }
      )
      .addMatcher(
        authEndpoints.endpoints.login.matchRejected,
        (state, action) => {
          state.loading = false;
          state.isAuthenticated = false;
          state.user = null;
          state.error = action.payload?.data || 'Login fallito';
        }
      )
      .addMatcher(
        authEndpoints.endpoints.impersonate.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        authEndpoints.endpoints.impersonate.matchFulfilled,
        (state, action) => {
          state.loading = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.error = null;
          setStoredUser(action.payload.user);
        }
      )
      .addMatcher(
        authEndpoints.endpoints.impersonate.matchRejected,
        (state, action) => {
          state.loading = false;
          state.isAuthenticated = false;
          state.user = null;
          state.error = action.payload?.data || 'Impersonificazione fallita';
        }
      )
      .addMatcher(
        authEndpoints.endpoints.logout.matchPending,
        (state) => {
          state.loading = true;
        }
      )
      .addMatcher(
        authEndpoints.endpoints.logout.matchFulfilled,
        (state) => {
          state.loading = false;
          state.isAuthenticated = false;
          state.user = null;
          state.error = null;
          clearStoredUser();
        }
      )
      .addMatcher(
        authEndpoints.endpoints.logout.matchRejected,
        (state) => {
          state.loading = false;
          state.isAuthenticated = false;
          state.user = null;
          state.error = null;
          clearStoredUser();
        }
      );
  },
});

export const { clearError, localLogout } = authSlice.actions;

export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectCurrentUser = (state) => state.auth.user;

export default authSlice.reducer;
