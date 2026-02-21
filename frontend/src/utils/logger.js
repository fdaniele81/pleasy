const isDev = import.meta.env.DEV;

const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },

  warn: (...args) => {
    if (isDev) console.warn(...args);
  },

  error: (...args) => {
    if (isDev) console.error(...args);
  },

  debug: (...args) => {
    if (isDev) console.debug(...args);
  },

  critical: (...args) => {
    console.error(...args);
  }
};

export default logger;
