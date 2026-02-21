export const BREAKPOINTS = {
  SM: 1024,
  MD: 1280,
  LG: 1600,
  XL: 1920
};

export const COLUMN_COUNTS = {
  [BREAKPOINTS.SM]: 12,
  [BREAKPOINTS.MD]: 12,
  [BREAKPOINTS.LG]: 18,
  [BREAKPOINTS.XL]: 24
};

export const getColumnCountForWidth = (width = window.innerWidth) => {
  if (width >= BREAKPOINTS.XL) return COLUMN_COUNTS[BREAKPOINTS.XL];
  if (width >= BREAKPOINTS.LG) return COLUMN_COUNTS[BREAKPOINTS.LG];
  if (width >= BREAKPOINTS.MD) return COLUMN_COUNTS[BREAKPOINTS.MD];
  return COLUMN_COUNTS[BREAKPOINTS.SM];
};

export const isAboveBreakpoint = (width, breakpoint) => {
  return width >= breakpoint;
};

export const getCurrentBreakpoint = (width = window.innerWidth) => {
  if (width >= BREAKPOINTS.XL) return 'XL';
  if (width >= BREAKPOINTS.LG) return 'LG';
  if (width >= BREAKPOINTS.MD) return 'MD';
  return 'SM';
};

export const WEEK_COUNTS = {
  [BREAKPOINTS.SM]: 12,
  [BREAKPOINTS.MD]: 16,
  [BREAKPOINTS.LG]: 20,
  [BREAKPOINTS.XL]: 24
};

export const getWeekCountForWidth = (width = window.innerWidth) => {
  if (width >= BREAKPOINTS.XL) return WEEK_COUNTS[BREAKPOINTS.XL];
  if (width >= BREAKPOINTS.LG) return WEEK_COUNTS[BREAKPOINTS.LG];
  if (width >= BREAKPOINTS.MD) return WEEK_COUNTS[BREAKPOINTS.MD];
  return WEEK_COUNTS[BREAKPOINTS.SM];
};
