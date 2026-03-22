export const BREAKPOINTS = {
  XS: 0,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1600,
  XXXL: 1920
};

export const COLUMN_COUNTS = {
  [BREAKPOINTS.LG]: 14,
  [BREAKPOINTS.XL]: 16,
  [BREAKPOINTS.XXL]: 22,
  [BREAKPOINTS.XXXL]: 28
};

export const getColumnCountForWidth = (width = window.innerWidth) => {
  if (width >= BREAKPOINTS.XXXL) return COLUMN_COUNTS[BREAKPOINTS.XXXL];
  if (width >= BREAKPOINTS.XXL) return COLUMN_COUNTS[BREAKPOINTS.XXL];
  if (width >= BREAKPOINTS.XL) return COLUMN_COUNTS[BREAKPOINTS.XL];
  if (width >= BREAKPOINTS.LG) return COLUMN_COUNTS[BREAKPOINTS.LG];
  return 7;
};

export const isAboveBreakpoint = (width, breakpoint) => {
  return width >= breakpoint;
};

export const isMobile = (width = window.innerWidth) => {
  return width < BREAKPOINTS.LG;
};

export const getCurrentBreakpoint = (width = window.innerWidth) => {
  if (width >= BREAKPOINTS.XXXL) return 'XXXL';
  if (width >= BREAKPOINTS.XXL) return 'XXL';
  if (width >= BREAKPOINTS.XL) return 'XL';
  if (width >= BREAKPOINTS.LG) return 'LG';
  if (width >= BREAKPOINTS.MD) return 'MD';
  if (width >= BREAKPOINTS.SM) return 'SM';
  return 'XS';
};

export const WEEK_COUNTS = {
  [BREAKPOINTS.LG]: 12,
  [BREAKPOINTS.XL]: 16,
  [BREAKPOINTS.XXL]: 20,
  [BREAKPOINTS.XXXL]: 24
};

export const getWeekCountForWidth = (width = window.innerWidth) => {
  if (width >= BREAKPOINTS.XXXL) return WEEK_COUNTS[BREAKPOINTS.XXXL];
  if (width >= BREAKPOINTS.XXL) return WEEK_COUNTS[BREAKPOINTS.XXL];
  if (width >= BREAKPOINTS.XL) return WEEK_COUNTS[BREAKPOINTS.XL];
  if (width >= BREAKPOINTS.LG) return WEEK_COUNTS[BREAKPOINTS.LG];
  return 4;
};
