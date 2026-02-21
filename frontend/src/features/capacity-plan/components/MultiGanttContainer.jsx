import React, { useRef, useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMultiGanttDrag } from '../hooks/useMultiGanttDrag';
import MultiGanttHeader from './MultiGanttHeader';
import MultiGanttEstimateSection from './MultiGanttEstimateSection';

const ESTIMATE_COLORS = [
  '#870c7f', // viola originale
  '#0891b2', // cyan
  '#059669', // green
  '#d97706', // amber
  '#dc2626', // red
  '#7c3aed', // purple
  '#2563eb', // blue
  '#be185d', // pink
];

const phases = [
  { key: 'intervals_analysis', labelKey: 'phaseAnalysis' },
  { key: 'intervals_development', labelKey: 'phaseDevelopment' },
  { key: 'intervals_internal_test', labelKey: 'phaseInternalTest' },
  { key: 'intervals_uat', labelKey: 'phaseUAT' },
  { key: 'intervals_release', labelKey: 'phaseRelease' },
  { key: 'intervals_documentation', labelKey: 'phaseDocumentation' },
  { key: 'intervals_startup', labelKey: 'phaseStartup' },
  { key: 'intervals_pm', labelKey: 'phasePM' },
];

const MultiGanttContainer = ({
  estimatesList,
  totalDays,
  onIntervalsChange,
  onDistributionConfig,
  isReadOnly = false,
}) => {
  const { t } = useTranslation(['capacityPlan', 'common']);
  const totalIntervals = 10;
  const svgRef = useRef(null);

  // Stato per gestire quali stime sono espanse (default: tutte collassate)
  const [expandedEstimates, setExpandedEstimates] = useState(new Set());

  const toggleExpand = useCallback((estimateId) => {
    setExpandedEstimates(prev => {
      const next = new Set(prev);
      if (next.has(estimateId)) {
        next.delete(estimateId);
      } else {
        next.add(estimateId);
      }
      return next;
    });
  }, []);

  // Dimensioni
  const barHeight = 32;
  const rowHeight = 48;
  const summaryRowHeight = 48; // Altezza della barra riassuntiva (sempre visibile)
  const leftMargin = 8;
  const topMargin = 70;
  const gearSpace = 32; // 4px gap + 24px icon + 4px padding
  const bottomMargin = 40;

  const availableWidth = 920;
  const intervalWidth = availableWidth / totalIntervals;
  const totalWidth = leftMargin + availableWidth + gearSpace;

  // Calcola altezza totale SVG dinamicamente in base allo stato espanso/collassato
  const phasesPerEstimate = phases.length;
  const expandedBlockHeight = summaryRowHeight + phasesPerEstimate * rowHeight;
  const collapsedBlockHeight = summaryRowHeight;

  const totalHeight = useMemo(() => {
    let height = topMargin + bottomMargin;
    estimatesList.forEach((item) => {
      const isExpanded = expandedEstimates.has(item.estimateId);
      height += isExpanded ? expandedBlockHeight : collapsedBlockHeight;
    });
    return height;
  }, [estimatesList, expandedEstimates, expandedBlockHeight, collapsedBlockHeight]);

  // Hook per drag-and-drop
  const {
    draggedPhase,
    dragStateRef,
    getEstimateRange,
    getBasePosition,
    handleBlockDragStart,
    handleBarDragStart,
    handleResizeStart,
  } = useMultiGanttDrag({
    svgRef,
    totalIntervals,
    intervalWidth,
    leftMargin,
    estimatesList,
    onIntervalsChange,
  });

  const getPeriodLabels = useCallback(() => {
    const labels = [];

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
      distributeIntervals(2, t('capacityPlan:periodWeek'));
    } else if (totalDays === 20) {
      distributeIntervals(4, t('capacityPlan:periodWeek'));
    } else if (totalDays === 40) {
      distributeIntervals(2, t('capacityPlan:periodMonth'));
    } else if (totalDays === 60) {
      distributeIntervals(3, t('capacityPlan:periodMonth'));
    } else if (totalDays === 120) {
      distributeIntervals(6, t('capacityPlan:periodMonth'));
    } else if (totalDays === 240) {
      distributeIntervals(4, t('capacityPlan:periodQuarter'));
    }

    return labels;
  }, [totalDays, t]);

  const periodLabels = getPeriodLabels();

  // Calcola Y start cumulativo per ogni stima
  const getEstimateYStart = useCallback(
    (estimateIndex) => {
      let yStart = topMargin;
      for (let i = 0; i < estimateIndex; i++) {
        const prevExpanded = expandedEstimates.has(estimatesList[i].estimateId);
        yStart += prevExpanded ? expandedBlockHeight : collapsedBlockHeight;
      }
      return yStart;
    },
    [expandedEstimates, estimatesList, expandedBlockHeight, collapsedBlockHeight]
  );

  return (
    <svg
      ref={svgRef}
      data-export-gantt="multi-gantt"
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="rounded-lg bg-white w-full"
      style={{
        cursor: draggedPhase ? 'grabbing' : 'default',
        maxWidth: '100%',
        userSelect: 'none',
      }}
    >
      <rect width="100%" height="100%" fill="#FAFAFA" />

      {/* Header con period labels */}
      <MultiGanttHeader
        periodLabels={periodLabels}
        totalIntervals={totalIntervals}
        leftMargin={leftMargin}
        intervalWidth={intervalWidth}
        topMargin={topMargin}
        totalHeight={totalHeight}
        bottomMargin={bottomMargin}
      />

      {/* Righe per ogni stima */}
      {estimatesList.map((estimateItem, estimateIndex) => {
        const { estimateId, phaseIntervals } = estimateItem;
        const color = ESTIMATE_COLORS[estimateIndex % ESTIMATE_COLORS.length];
        const isExpanded = expandedEstimates.has(estimateId);
        const range = getEstimateRange(phaseIntervals);
        const isBlockActive = draggedPhase === `block-${estimateId}`;
        const estimateYStart = getEstimateYStart(estimateIndex);

        return (
          <MultiGanttEstimateSection
            key={estimateId}
            estimateItem={estimateItem}
            estimateIndex={estimateIndex}
            estimateYStart={estimateYStart}
            color={color}
            isExpanded={isExpanded}
            isBlockActive={isBlockActive}
            draggedPhase={draggedPhase}
            dragStateRef={dragStateRef}
            range={range}
            totalWidth={totalWidth}
            leftMargin={leftMargin}
            intervalWidth={intervalWidth}
            barHeight={barHeight}
            rowHeight={rowHeight}
            summaryRowHeight={summaryRowHeight}
            isReadOnly={isReadOnly}
            onToggleExpand={toggleExpand}
            onBlockDragStart={handleBlockDragStart}
            onBarDragStart={handleBarDragStart}
            onResizeStart={handleResizeStart}
            onDistributionConfig={onDistributionConfig}
            getBasePosition={getBasePosition}
          />
        );
      })}

      {/* Bordo esterno */}
      <rect
        x={0}
        y={0}
        width={totalWidth}
        height={totalHeight}
        fill="none"
        stroke="#D1D5DB"
        strokeWidth={1}
        rx={8}
      />
    </svg>
  );
};

export default MultiGanttContainer;
