export const ROLES = {
  ADMIN: 'ADMIN',
  PM: 'PM',
  USER: 'USER',
};

export const ALL_ROLES = Object.values(ROLES);

export const isValidRole = (role) => {
  return ALL_ROLES.includes(role);
};

export const ROLE_GROUPS = {
  ADMIN_ONLY: [ROLES.ADMIN],
  ADMIN_AND_PM: [ROLES.ADMIN, ROLES.PM],
  PM_ONLY: [ROLES.PM],
  USER_ONLY: [ROLES.USER],
  PM_AND_USER: [ROLES.PM, ROLES.USER],
  ALL: ALL_ROLES,
};
