import React from 'react';
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
  onBarDragStart,
  onResizeStart,
}) => {
  const { t } = useTranslation(['capacityPlan', 'common']);
  const yStart = yPos + (rowHeight - barHeight) / 2;

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
        rx={6}
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
        x={barPosition.x + 6}
        y={yStart}
        width={barPosition.width - 12}
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
            fontSize: '11px',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t('capacityPlan:' + phase.labelKey)}
        </div>
      </foreignObject>

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
              x={barPosition.x - 6}
              y={yStart}
              width={12}
              height={barHeight}
              fill="transparent"
            />
            {[2, 5, 8].map((offset) => (
              <line
                key={offset}
                x1={barPosition.x + offset}
                y1={yStart + 8}
                x2={barPosition.x + offset}
                y2={yStart + barHeight - 8}
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
              x={barPosition.x + barPosition.width - 6}
              y={yStart}
              width={12}
              height={barHeight}
              fill="transparent"
            />
            {[-8, -5, -2].map((offset) => (
              <line
                key={offset}
                x1={barPosition.x + barPosition.width + offset}
                y1={yStart + 8}
                x2={barPosition.x + barPosition.width + offset}
                y2={yStart + barHeight - 8}
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
