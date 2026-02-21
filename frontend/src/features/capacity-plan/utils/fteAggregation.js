/**
 * Aggrega fteResults di multiple stime sommando i valori per ogni intervallo
 * @param {Array} allFteResults - Array di oggetti { estimateId, fteResults }
 * @returns {Object|null} - fteResults aggregato con struttura identica a fteResults singolo
 */
export function aggregateFTEResults(allFteResults) {
  if (!allFteResults || allFteResults.length === 0) {
    return null;
  }

  const validResults = allFteResults.filter(
    (item) => item.fteResults?.intervals && item.fteResults.intervals.length > 0
  );

  if (validResults.length === 0) {
    return null;
  }

  // Raccoglie tutte le chiavi categoria da tutti i risultati
  const allCategories = new Set();
  validResults.forEach(({ fteResults }) => {
    if (fteResults.distribution_categories) {
      fteResults.distribution_categories.forEach((cat) => allCategories.add(cat));
    }
  });
  // Fallback alle 3 categorie legacy se nessuna distribution_categories presente
  if (allCategories.size === 0) {
    ['functional', 'technical', 'governance'].forEach((c) => allCategories.add(c));
  }
  const categoryKeys = [...allCategories];

  // Inizializza con 10 intervalli vuoti
  const aggregated = {
    distribution_categories: categoryKeys,
    intervals: Array(10)
      .fill(null)
      .map(() => {
        const interval = {
          fte_funzionale: 0,
          fte_tecnico: 0,
          fte_governance: 0,
          hours_funzionale: 0,
          hours_tecnico: 0,
          hours_governance: 0,
          fte_categories: {},
          hours_categories: {},
        };
        categoryKeys.forEach((cat) => {
          interval.fte_categories[cat] = 0;
          interval.hours_categories[cat] = 0;
        });
        return interval;
      }),
  };

  // Somma tutti i valori per ogni intervallo
  validResults.forEach(({ fteResults }) => {
    fteResults.intervals.forEach((interval, idx) => {
      if (idx < 10) {
        // Legacy
        aggregated.intervals[idx].fte_funzionale += interval.fte_funzionale || 0;
        aggregated.intervals[idx].fte_tecnico += interval.fte_tecnico || 0;
        aggregated.intervals[idx].fte_governance += interval.fte_governance || 0;
        aggregated.intervals[idx].hours_funzionale += interval.hours_funzionale || 0;
        aggregated.intervals[idx].hours_tecnico += interval.hours_tecnico || 0;
        aggregated.intervals[idx].hours_governance += interval.hours_governance || 0;
        // Dinamico
        categoryKeys.forEach((cat) => {
          aggregated.intervals[idx].fte_categories[cat] += interval.fte_categories?.[cat] || 0;
          aggregated.intervals[idx].hours_categories[cat] += interval.hours_categories?.[cat] || 0;
        });
      }
    });
  });

  return aggregated;
}

/**
 * Calcola il totale FTE per tutte le stime aggregate
 * @param {Object} aggregatedFTE - fteResults aggregato
 * @returns {Object} - Totali per categoria
 */
export function calculateAggregatedTotals(aggregatedFTE) {
  if (!aggregatedFTE?.intervals) {
    return {
      totalFunzionale: 0,
      totalTecnico: 0,
      totalGovernance: 0,
      totalAll: 0,
      totalCategories: {},
    };
  }

  const categoryKeys = aggregatedFTE.distribution_categories || [];
  const totalCategories = {};
  categoryKeys.forEach((cat) => { totalCategories[cat] = 0; });

  const totals = aggregatedFTE.intervals.reduce(
    (acc, interval) => {
      categoryKeys.forEach((cat) => {
        acc.totalCategories[cat] += interval.fte_categories?.[cat] || 0;
      });
      return {
        totalFunzionale: acc.totalFunzionale + (interval.fte_funzionale || 0),
        totalTecnico: acc.totalTecnico + (interval.fte_tecnico || 0),
        totalGovernance: acc.totalGovernance + (interval.fte_governance || 0),
        totalCategories: acc.totalCategories,
      };
    },
    { totalFunzionale: 0, totalTecnico: 0, totalGovernance: 0, totalCategories }
  );

  return {
    ...totals,
    totalAll: Object.values(totals.totalCategories).reduce((s, v) => s + v, 0) ||
      (totals.totalFunzionale + totals.totalTecnico + totals.totalGovernance),
  };
}
