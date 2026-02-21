export const DEFAULT_PROJECT_PHASES_CONFIG = {
  analysis: {
    values: [1, 2],
    e2e_percentage: 10.0,
    distribution: {
      functional: 100.0,
      technical: 0.0,
      governance: 0.0
    }
  },
  development: {
    values: [3, 4, 5, 6],
    e2e_percentage: 47.0,
    distribution: {
      functional: 0.0,
      technical: 100.0,
      governance: 0.0
    }
  },
  internal_test: {
    values: [6, 7],
    e2e_percentage: 12.0,
    distribution: {
      functional: 0.0,
      technical: 100.0,
      governance: 0.0
    }
  },
  uat: {
    values: [7, 8],
    e2e_percentage: 8.0,
    distribution: {
      functional: 30.0,
      technical: 70.0,
      governance: 0.0
    }
  },
  release: {
    values: [9],
    e2e_percentage: 5.0,
    distribution: {
      functional: 0.0,
      technical: 100.0,
      governance: 0.0
    }
  },
  pm: {
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    e2e_percentage: 10.0,
    distribution: {
      functional: 0.0,
      technical: 0.0,
      governance: 100.0
    }
  },
  startup: {
    values: [10],
    e2e_percentage: 3.0,
    distribution: {
      functional: 50.0,
      technical: 50.0,
      governance: 0.0
    }
  },
  documentation: {
    values: [9],
    e2e_percentage: 5.0,
    distribution: {
      functional: 100.0,
      technical: 0.0,
      governance: 0.0
    }
  },
  contingency: {
    values: [],
    e2e_percentage: 20.0,
    distribution: {
      functional: 0.0,
      technical: 0.0,
      governance: 0.0
    }
  }
};

export const isValidConfig = (config) => {
  return config && typeof config === 'object' && Object.keys(config).length > 0;
};
