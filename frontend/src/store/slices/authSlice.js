import { createSlice } from "@reduxjs/toolkit";
import { authEndpoints } from "../../features/login/api/authEndpoints";
import logger from "../../utils/logger";

const USER_KEY = 'auth_user';
const MUST_CHANGE_PWD_KEY = 'auth_must_change_password';

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
const clearStoredUser = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(MUST_CHANGE_PWD_KEY);
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: getStoredUser(),
    isAuthenticated: !!getStoredUser(),
    mustChangePassword: localStorage.getItem(MUST_CHANGE_PWD_KEY) === 'true',
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
      state.mustChangePassword = false;
      clearStoredUser();
    },
    clearMustChangePassword: (state) => {
      state.mustChangePassword = false;
      localStorage.removeItem(MUST_CHANGE_PWD_KEY);
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
          state.mustChangePassword = !!action.payload.must_change_password;
          state.error = null;
          setStoredUser(action.payload.user);
          if (action.payload.must_change_password) {
            localStorage.setItem(MUST_CHANGE_PWD_KEY, 'true');
          } else {
            localStorage.removeItem(MUST_CHANGE_PWD_KEY);
          }
        }
      )
      .addMatcher(
        authEndpoints.endpoints.login.matchRejected,
        (state, action) => {
          state.loading = false;
          state.isAuthenticated = false;
          state.user = null;
          state.error = action.payload?.data || { error: 'AUTH_LOGIN_FAILED', message: 'Login fallito' };
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
          state.error = action.payload?.data || { error: 'AUTH_IMPERSONATE_FAILED', message: 'Impersonificazione fallita' };
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
          state.mustChangePassword = false;
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
          state.mustChangePassword = false;
          state.error = null;
          clearStoredUser();
        }
      );
  },
});

export const { clearError, localLogout, clearMustChangePassword } = authSlice.actions;

export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectCurrentUser = (state) => state.auth.user;
export const selectMustChangePassword = (state) => state.auth.mustChangePassword;

export default authSlice.reducer;
