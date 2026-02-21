export const CACHE_STRATEGIES = {
  TRANSIENT: 15,

  SHORT: 30,

  DEFAULT: 60,

  MEDIUM: 300,

  LONG: 900,

  STATIC: 1800,
};

export const REFETCH_STRATEGIES = {
  ALWAYS: true,

  FREQUENT: 30,

  DEFAULT: 60,

  MODERATE: 300,

  NEVER: false,
};

export function getCacheConfig(strategy = 'DEFAULT') {
  return {
    keepUnusedDataFor: CACHE_STRATEGIES[strategy] || CACHE_STRATEGIES.DEFAULT,
  };
}

export const ENDPOINT_STRATEGIES = {
  'tasks': 'SHORT',
  'timesheets': 'MEDIUM',
  'planning': 'SHORT',
  'tmPlanning': 'SHORT',

  'projects': 'DEFAULT',
  'estimates': 'DEFAULT',
  'reconciliation': 'MEDIUM',
  'dashboard': 'MEDIUM',

  'clients': 'LONG',
  'users': 'LONG',
  'holidays': 'LONG',
  'templates': 'STATIC',
};
