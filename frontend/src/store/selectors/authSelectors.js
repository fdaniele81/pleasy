import { createSelector } from 'reselect';

const selectAuthState = (state) => state.auth;

export const selectCurrentUser = createSelector(
  [selectAuthState],
  (auth) => auth.user
);

export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) => auth.isAuthenticated
);

export const selectAuthToken = createSelector(
  [selectAuthState],
  (auth) => auth.token
);

export const selectAuthLoading = createSelector(
  [selectAuthState],
  (auth) => auth.loading
);

export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth.error
);

export const selectUserRole = createSelector(
  [selectCurrentUser],
  (user) => user?.role_id
);

export const selectUserId = createSelector(
  [selectCurrentUser],
  (user) => user?.user_id
);

export const selectUserCompanyId = createSelector(
  [selectCurrentUser],
  (user) => user?.company_id
);

export const selectUserFullName = createSelector(
  [selectCurrentUser],
  (user) => user ? `${user.first_name} ${user.last_name}` : ''
);

export const selectUserEmail = createSelector(
  [selectCurrentUser],
  (user) => user?.email
);
