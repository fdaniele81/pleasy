import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const MultiGanttPhaseBar = ({
  estimateId,
  phase,
  barPosition,
  yPos,
  barHeight,
  rowHeight,
  color,
  isActive,
  isReadOnly,
  phaseHours,
  onBarDragStart,
  onResizeStart,
}) => {
  const { t } = useTranslation(['capacityPlan', 'common']);
  const yStart = yPos + (rowHeight - barHeight) / 2;

  const daysInfo = useMemo(() => {
    if (!phaseHours || phaseHours === 0 || !barPosition) return null;
    const days = Math.round((phaseHours / 8) * 10) / 10;
    if (days === 0) return null;
    const text = `${days}gg`;
    const textWidth = text.length * 6 + 6;
    const labelText = t('capacityPlan:' + phase.labelKey);
    const labelWidth = labelText.length * 5.5 + 6;
    const fitsInside = barPosition.width >= (labelWidth + textWidth + 8);
    return { text, textWidth, fitsInside };
  }, [phaseHours, barPosition, t, phase.labelKey]);

  if (!barPosition) return null;

  return (
    <g>
      <rect
        data-phase-bar={`${estimateId}-${phase.key}`}
        x={barPosition.x}
        y={yStart}
        width={barPosition.width}
        height={barHeight}
        fill={color}
        rx={4}
        opacity={isActive ? 0.9 : 0.75}
        style={{ cursor: isReadOnly ? 'default' : 'grab' }}
        onMouseDown={
          isReadOnly
            ? undefined
            : (e) => onBarDragStart(e, estimateId, phase.key)
        }
      >
        <title>{t('capacityPlan:' + phase.labelKey)}</title>
      </rect>

      {/* Label fase dentro la barra */}
      <foreignObject
        data-phase-label={`${estimateId}-${phase.key}`}
        x={barPosition.x + 4}
        y={yStart}
        width={daysInfo?.fitsInside ? barPosition.width - daysInfo.textWidth - 8 : barPosition.width - 8}
        height={barHeight}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t('capacityPlan:' + phase.labelKey)}
        </div>
      </foreignObject>

      {/* Ore stimate dentro la barra (a destra) */}
      {daysInfo?.fitsInside && (
        <foreignObject
          data-no-export="true"
          x={barPosition.x + barPosition.width - daysInfo.textWidth - 4}
          y={yStart}
          width={daysInfo.textWidth}
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
            {daysInfo.text}
          </div>
        </foreignObject>
      )}

      {/* Ore stimate fuori dalla barra (a destra) */}
      {daysInfo && !daysInfo.fitsInside && (
        <foreignObject
          data-no-export="true"
          x={barPosition.x + barPosition.width + 3}
          y={yStart}
          width={daysInfo.textWidth + 6}
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
            {daysInfo.text}
          </div>
        </foreignObject>
      )}

      {!isReadOnly && (
        <>
          <g
            data-handle-left={`${estimateId}-${phase.key}`}
            style={{ cursor: 'ew-resize', opacity: isActive ? 1 : 0 }}
            onMouseDown={(e) =>
              onResizeStart(e, estimateId, phase.key, 'left')
            }
          >
            <rect
              x={barPosition.x - 4}
              y={yStart}
              width={8}
              height={barHeight}
              fill="transparent"
            />
            {[2, 5].map((offset) => (
              <line
                key={offset}
                x1={barPosition.x + offset}
                y1={yStart + 4}
                x2={barPosition.x + offset}
                y2={yStart + barHeight - 4}
                stroke="white"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            ))}
          </g>

          <g
            data-handle-right={`${estimateId}-${phase.key}`}
            style={{ cursor: 'ew-resize', opacity: isActive ? 1 : 0 }}
            onMouseDown={(e) =>
              onResizeStart(e, estimateId, phase.key, 'right')
            }
          >
            <rect
              x={barPosition.x + barPosition.width - 4}
              y={yStart}
              width={8}
              height={barHeight}
              fill="transparent"
            />
            {[-5, -2].map((offset) => (
              <line
                key={offset}
                x1={barPosition.x + barPosition.width + offset}
                y1={yStart + 4}
                x2={barPosition.x + barPosition.width + offset}
                y2={yStart + barHeight - 4}
                stroke="white"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            ))}
          </g>
        </>
      )}
    </g>
  );
};

export default React.memo(MultiGanttPhaseBar);
