import { PHASES } from '../../estimator/components/SelectableCellsTable';

/**
 * Maps PHASES keys (hours_analysis, etc.) to E2E config keys (analysis, etc.)
 */
export const PHASE_TO_E2E_KEY = {
  hours_analysis: 'analysis',
  hours_development: 'development',
  hours_internal_test: 'internal_test',
  hours_uat: 'uat',
  hours_release: 'release',
  hours_pm: 'pm',
  hours_startup: 'startup',
  hours_documentation: 'documentation',
  contingency: 'contingency',
};

/**
 * Maps E2E config keys back to PHASES keys
 */
export const E2E_KEY_TO_PHASE = Object.fromEntries(
  Object.entries(PHASE_TO_E2E_KEY).map(([k, v]) => [v, k])
);

/**
 * Standard phase order for display (matches PHASES order)
 */
export const PHASE_ORDER = PHASES.map(p => PHASE_TO_E2E_KEY[p.key]);

/**
 * Calculate total budget per E2E phase from estimate tasks.
 * Returns an array of { e2eKey, phaseKey, labelKey, budget } for phases with budget > 0.
 */
export function calculatePhaseTotals(estimateTasks, contingencyPercentage) {
  if (!estimateTasks || estimateTasks.length === 0) return [];

  const results = [];

  // Standard phases (0-7)
  for (let i = 0; i < 8; i++) {
    const phase = PHASES[i];
    const total = estimateTasks.reduce((sum, task) => {
      return sum + (parseFloat(task[phase.key]) || 0);
    }, 0);

    if (total > 0) {
      results.push({
        e2eKey: PHASE_TO_E2E_KEY[phase.key],
        phaseKey: phase.key,
        labelKey: phase.labelKey,
        budget: Math.round(total * 10) / 10,
      });
    }
  }

  // Contingency
  const totalHours = estimateTasks.reduce((sum, task) => {
    return sum + PHASES.slice(0, 8).reduce((s, p) => s + (parseFloat(task[p.key]) || 0), 0);
  }, 0);

  const contingencyHours = (totalHours * (contingencyPercentage || 0)) / 100;
  if (contingencyHours > 0) {
    results.push({
      e2eKey: 'contingency',
      phaseKey: 'contingency',
      labelKey: 'phaseContingency',
      budget: Math.round(contingencyHours * 10) / 10,
    });
  }

  return results;
}

/**
 * Calculate total estimate budget (all phases + contingency)
 */
export function calculateEstimateTotalBudget(estimateTasks, contingencyPercentage) {
  if (!estimateTasks || estimateTasks.length === 0) return 0;

  const totalHours = estimateTasks.reduce((sum, task) => {
    return sum + PHASES.slice(0, 8).reduce((s, p) => s + (parseFloat(task[p.key]) || 0), 0);
  }, 0);

  const contingency = (totalHours * (contingencyPercentage || 0)) / 100;
  return Math.round((totalHours + contingency) * 10) / 10;
}

/**
 * Given column indices from the cell grid, derive which E2E phase keys they belong to.
 */
export function getPhaseKeysFromColumns(colIndices) {
  const phaseKeys = new Set();
  for (const col of colIndices) {
    if (col >= 0 && col < PHASES.length) {
      const e2eKey = PHASE_TO_E2E_KEY[PHASES[col].key];
      if (e2eKey) phaseKeys.add(e2eKey);
    }
  }
  return Array.from(phaseKeys);
}
