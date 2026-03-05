import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import MultiGanttPhaseBar from './MultiGanttPhaseBar';

const phases = [
  { key: 'intervals_analysis', labelKey: 'phaseAnalysis', totalsKey: 'total_hours_analysis' },
  { key: 'intervals_development', labelKey: 'phaseDevelopment', totalsKey: 'total_hours_development' },
  { key: 'intervals_internal_test', labelKey: 'phaseInternalTest', totalsKey: 'total_hours_internal_test' },
  { key: 'intervals_uat', labelKey: 'phaseUAT', totalsKey: 'total_hours_uat' },
  { key: 'intervals_release', labelKey: 'phaseRelease', totalsKey: 'total_hours_release' },
  { key: 'intervals_documentation', labelKey: 'phaseDocumentation', totalsKey: 'total_hours_documentation' },
  { key: 'intervals_startup', labelKey: 'phaseStartup', totalsKey: 'total_hours_startup' },
  { key: 'intervals_pm', labelKey: 'phasePM', totalsKey: 'total_hours_pm' },
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

  const totalDays = useMemo(() => {
    const h = estimate?.totals?.total_hours_with_contingency;
    if (!h || h === 0) return null;
    return Math.round((h / 8) * 10) / 10;
  }, [estimate]);

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
        const textAvailableWidth = barWidth - 20;

        // Giorni stimati: calcola se il testo entra nella barra
        const daysText = totalDays ? `${totalDays}gg` : null;
        const daysTextWidth = daysText ? daysText.length * 6 + 8 : 0;
        const labelMinWidth = 60;
        const daysFitInside = daysText && barWidth >= (labelMinWidth + daysTextWidth + 24);

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
                rx={4}
                opacity={isBlockActive ? 0.9 : 0.75}
                style={{ cursor: isReadOnly ? 'default' : 'pointer' }}
                onClick={() => {
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
                x={barX + 4}
                y={summaryBarY + (barHeight - 12) / 2}
                width={12}
                height={12}
                style={{ pointerEvents: 'none' }}
              >
                {isExpanded ? (
                  <ChevronDown size={12} color="white" />
                ) : (
                  <ChevronRight size={12} color="white" />
                )}
              </foreignObject>

              {/* Testo nella barra con ellipsis */}
              <foreignObject
                x={barX + 18}
                y={summaryBarY}
                width={daysFitInside ? textAvailableWidth - daysTextWidth : textAvailableWidth}
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
                    fontSize: '10px',
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

              {/* Giorni stimati - dentro la barra (a destra) */}
              {daysFitInside && (
                <foreignObject
                  data-no-export="true"
                  x={barX + barWidth - daysTextWidth - 4}
                  y={summaryBarY}
                  width={daysTextWidth}
                  height={barHeight}
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {daysText}
                  </div>
                </foreignObject>
              )}

              {/* Giorni stimati - fuori dalla barra (a destra, dopo icona gear) */}
              {daysText && !daysFitInside && (
                <foreignObject
                  data-no-export="true"
                  x={barX + barWidth + (onDistributionConfig ? 28 : 4)}
                  y={summaryBarY}
                  width={daysTextWidth + 10}
                  height={barHeight}
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#6B7280',
                      fontSize: '10px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {daysText}
                  </div>
                </foreignObject>
              )}

              {/* Icona ingranaggio per configurazione distribuzione */}
              {onDistributionConfig && (
                <foreignObject
                  x={barX + barWidth + 4}
                  y={summaryBarY + (barHeight - 20) / 2}
                  width={20}
                  height={20}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#F3F4F6',
                      border: '1px solid #D1D5DB',
                      borderRadius: 3,
                      cursor: 'pointer',
                    }}
                    title={t('capacityPlan:configureFTE')}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDistributionConfig(estimateId);
                    }}
                  >
                    <Settings size={12} color="#6B7280" />
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
        const phaseHours = estimate?.totals?.[phase.totalsKey];

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
                phaseHours={phaseHours}
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
