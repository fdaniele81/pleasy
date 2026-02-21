import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import MultiGanttPhaseBar from './MultiGanttPhaseBar';

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

const MultiGanttEstimateSection = ({
  estimateItem,
  estimateIndex,
  estimateYStart,
  color,
  isExpanded,
  isBlockActive,
  draggedPhase,
  dragStateRef,
  range,
  totalWidth,
  leftMargin,
  intervalWidth,
  barHeight,
  rowHeight,
  summaryRowHeight,
  isReadOnly,
  onToggleExpand,
  onBlockDragStart,
  onBarDragStart,
  onResizeStart,
  onDistributionConfig,
  getBasePosition,
}) => {
  const { t } = useTranslation(['capacityPlan', 'common']);
  const { estimateId, estimate, phaseIntervals } = estimateItem;

  const summaryBarY = estimateYStart + (summaryRowHeight - barHeight) / 2;
  const summaryLabel = `${estimate?.client_name || t('capacityPlan:clientLabel')} - ${estimate?.title || t('capacityPlan:projectLabel')}`;

  const handleBarDragStartWrapped = useCallback(
    (e, eid, phaseKey) => {
      onBarDragStart(e, eid, phaseKey, phaseIntervals);
    },
    [onBarDragStart, phaseIntervals]
  );

  const handleResizeStartWrapped = useCallback(
    (e, eid, phaseKey, edge) => {
      onResizeStart(e, eid, phaseKey, edge, phaseIntervals);
    },
    [onResizeStart, phaseIntervals]
  );

  return (
    <g>
      {/* Background riga summary */}
      <rect
        x={0}
        y={estimateYStart}
        width={totalWidth}
        height={summaryRowHeight}
        fill={estimateIndex % 2 === 0 ? '#FFFFFF' : '#F9FAFB'}
      />

      {/* Barra riassuntiva draggabile con freccia integrata */}
      {range && (() => {
        const barX = leftMargin + (range.start - 1) * intervalWidth;
        const barWidth = (range.end - range.start + 1) * intervalWidth;
        const textAvailableWidth = barWidth - 28; // 24px per freccia + 4px padding destra

        return (
            <g
              data-summary-group={estimateId}
              transform={`translate(0, 0)`}
            >
              <rect
                data-summary-bar={estimateId}
                x={barX}
                y={summaryBarY}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={6}
                opacity={isBlockActive ? 0.9 : 0.75}
                style={{ cursor: isReadOnly ? 'default' : 'pointer' }}
                onClick={() => {
                  // Solo se non è un drag
                  if (!dragStateRef.current.hasMoved) {
                    onToggleExpand(estimateId);
                  }
                }}
                onMouseDown={
                  isReadOnly
                    ? undefined
                    : (e) => {
                        dragStateRef.current.hasMoved = false;
                        onBlockDragStart(e, estimateId, phaseIntervals);
                      }
                }
              >
                <title>{summaryLabel}</title>
              </rect>

              {/* Freccia expand/collapse dentro la barra */}
              <foreignObject
                x={barX + 6}
                y={summaryBarY + (barHeight - 16) / 2}
                width={16}
                height={16}
                style={{ pointerEvents: 'none' }}
              >
                {isExpanded ? (
                  <ChevronDown size={16} color="white" />
                ) : (
                  <ChevronRight size={16} color="white" />
                )}
              </foreignObject>

              {/* Testo nella barra con ellipsis - allineato a sinistra dopo la freccia */}
              <foreignObject
                x={barX + 22}
                y={summaryBarY}
                width={textAvailableWidth}
                height={barHeight}
                style={{ pointerEvents: 'none' }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={summaryLabel}
                >
                  {summaryLabel}
                </div>
              </foreignObject>

              {/* Icona ingranaggio per configurazione distribuzione */}
              {onDistributionConfig && (
                <foreignObject
                  x={barX + barWidth + 4}
                  y={summaryBarY + (barHeight - 24) / 2}
                  width={24}
                  height={24}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#F3F4F6',
                      border: '1px solid #D1D5DB',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                    title={t('capacityPlan:configureFTE')}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDistributionConfig(estimateId);
                    }}
                  >
                    <Settings size={14} color="#6B7280" />
                  </div>
                </foreignObject>
              )}
            </g>
          );
      })()}

      {/* Vista espansa: righe delle fasi */}
      {isExpanded && phases.map((phase, phaseIndex) => {
        const yPos = estimateYStart + summaryRowHeight + phaseIndex * rowHeight;
        const barPosition = getBasePosition(phaseIntervals[phase.key]);
        const isActive = draggedPhase === `${estimateId}-${phase.key}`;

        return (
          <g key={`${estimateId}-${phase.key}`}>
            {/* Background riga */}
            <rect
              x={0}
              y={yPos}
              width={totalWidth}
              height={rowHeight}
              fill={phaseIndex % 2 === 0 ? '#F9FAFB' : '#FFFFFF'}
            />

            {/* Barra fase con label integrato */}
            {phaseIntervals && (
              <MultiGanttPhaseBar
                estimateId={estimateId}
                phase={phase}
                barPosition={barPosition}
                yPos={yPos}
                barHeight={barHeight}
                rowHeight={rowHeight}
                color={color}
                isActive={isActive}
                isReadOnly={isReadOnly}
                onBarDragStart={handleBarDragStartWrapped}
                onResizeStart={handleResizeStartWrapped}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

export default React.memo(MultiGanttEstimateSection);
