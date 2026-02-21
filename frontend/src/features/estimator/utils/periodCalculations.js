export const calculatePeriodLabels = (totalDays, t) => {
  const labels = [];
  const totalIntervals = 10;

  const weekLabel = t ? t('common:week') : 'Settimana';
  const monthLabel = t ? t('common:month') : 'Mese';
  const quarterLabel = t ? t('common:quarter') : 'Trimestre';

  const distributeIntervals = (numPeriods, labelPrefix) => {
    const periodSize = totalIntervals / numPeriods;

    for (let i = 0; i < numPeriods; i++) {
      labels.push({
        label: `${labelPrefix} ${i + 1}`,
        startInterval: i * periodSize,
        endInterval: (i + 1) * periodSize,
      });
    }
  };

  if (totalDays === 10) {
    distributeIntervals(2, weekLabel);
  } else if (totalDays === 20) {
    distributeIntervals(4, weekLabel);
  } else if (totalDays === 40) {
    distributeIntervals(2, monthLabel);
  } else if (totalDays === 60) {
    distributeIntervals(3, monthLabel);
  } else if (totalDays === 120) {
    distributeIntervals(6, monthLabel);
  } else if (totalDays === 240) {
    distributeIntervals(4, quarterLabel);
  }

  return labels;
};

export const calculateLabelPositions = (periodLabels) => {
  const numLabels = periodLabels.length;
  const heightPercent = 100 / numLabels;

  return periodLabels.map((period, index) => ({
    ...period,
    topPercent: (index / numLabels) * 100,
    heightPercent: heightPercent,
  }));
};

export const calculateMaxFTE = (intervals) => {
  return Math.max(
    ...intervals.map((interval) => {
      if (interval.fte_categories) {
        return Object.values(interval.fte_categories).reduce((sum, v) => sum + (v || 0), 0);
      }
      return (interval.fte_funzionale || 0) + (interval.fte_tecnico || 0) + (interval.fte_governance || 0);
    })
  );
};

export const calculateTotalFTE = (interval) => {
  if (interval.fte_categories) {
    return Object.values(interval.fte_categories).reduce((sum, v) => sum + (v || 0), 0);
  }
  return (interval.fte_funzionale || 0) + (interval.fte_tecnico || 0) + (interval.fte_governance || 0);
};
