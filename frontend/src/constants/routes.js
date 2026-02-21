export const ROUTES = {

  LOGIN: '/login',
  HOME: '/',

  COMPANIES: '/companies',

  USERS: '/users',
  HOLIDAYS: '/holidays',

  DASHBOARD: '/dashboard',
  CLIENTS: '/clients',
  PROJECTS: '/projects',
  PLANNING: '/planning',
  TEMPLATE_CONFIGURATION: '/template-configuration',
  ESTIMATOR: '/estimator',
  ESTIMATE_EDITOR_INFO: '/estimator/:estimateId/info',
  ESTIMATE_EDITOR_TASKS: '/estimator/:estimateId/tasks',
  ESTIMATE_CONVERTER: '/estimator/:estimateId/convert',
  ESTIMATE_CONVERTER_PROJECT: '/estimator/:estimateId/convert/project',
  ESTIMATE_CONVERTER_TASKS: '/estimator/:estimateId/convert/tasks',
  CONVERT_ESTIMATE_TO_PROJECT: '/convert-estimate-to-project',

  CAPACITY_PLAN: '/capacity-plan',
  CAPACITY_PLAN_VIEW: '/capacity-plan/view',

  TIMESHEET: '/timesheet',

  TIMEOFF_PLAN: '/timeoff-plan',
  TIMESHEET_SNAPSHOTS: '/timesheet-snapshots',
  RECONCILIATION: '/reconciliation',
  TM_PLANNING: '/tm-planning',
};


export const CONFIG_MENU_ROUTES = [
  ROUTES.HOLIDAYS,
  ROUTES.COMPANIES,
  ROUTES.USERS,
  ROUTES.CLIENTS,
  ROUTES.PROJECTS,
  ROUTES.TEMPLATE_CONFIGURATION,
];


export const PM_FEATURES_MENU_ROUTES = [
  ROUTES.ESTIMATOR,
  ROUTES.CAPACITY_PLAN,
  ROUTES.CONVERT_ESTIMATE_TO_PROJECT,
  ROUTES.PLANNING,
  ROUTES.TM_PLANNING,
];

export const REPORT_MENU_ROUTES = [
  ROUTES.TIMEOFF_PLAN,
  ROUTES.TIMESHEET_SNAPSHOTS,
  ROUTES.RECONCILIATION,
];


export const getDefaultRouteForRole = (roleId) => {
  switch (roleId) {
    case 'ADMIN':
      return ROUTES.COMPANIES;
    case 'PM':
      return ROUTES.DASHBOARD;
    case 'USER':
      return ROUTES.TIMESHEET;
    default:
      return ROUTES.LOGIN;
  }
};
