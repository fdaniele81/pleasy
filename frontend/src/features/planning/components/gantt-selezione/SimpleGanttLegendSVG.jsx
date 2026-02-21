import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LEGEND_HEIGHT, TASK_STATES } from '../../../../shared/components/gantt/utils/ganttCalculations';

const LEGEND_LABEL_KEYS = {
  1: 'legendCompleted',
  2: 'legendInProgress',
  3: 'legendToStart',
};

const SimpleGanttLegendSVG = ({
  totalWidth,
  legendYPosition,
  colorByStatus = true,
  showMilestones = false,
}) => {
  const { t } = useTranslation('planning');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleDragStart = useCallback((event) => {
    event.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
  }, []);

  const handleDrag = useCallback((event) => {
    if (!isDragging) return;
    event.preventDefault();

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;

    setOffset({ x: deltaX, y: deltaY });
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  if (!colorByStatus && !showMilestones) {
    return null;
  }

  let legendWidth;
  if (colorByStatus && showMilestones) {
    legendWidth = 750;
  } else if (colorByStatus) {
    legendWidth = 580;
  } else {
    legendWidth = 200;
  }

  const legendStartX = (totalWidth - legendWidth) / 2 + offset.x;
  const legendStartY = legendYPosition + offset.y;

  return (
    <g id="legend">
      <rect
        x={legendStartX}
        y={legendStartY}
        width={legendWidth}
        height={LEGEND_HEIGHT}
        fill="#FFFFFF"
        rx={8}
      />

      <rect
        x={legendStartX}
        y={legendStartY}
        width={legendWidth}
        height={LEGEND_HEIGHT}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={1.5}
        rx={8}
      />

      <rect
        x={legendStartX}
        y={legendStartY}
        width={legendWidth}
        height={LEGEND_HEIGHT}
        fill="transparent"
        style={{ cursor: isDragging ? 'grabbing' : 'grab', pointerEvents: 'all' }}
        onMouseDown={handleDragStart}
      />

      <text
        x={legendStartX + 20}
        y={legendStartY + LEGEND_HEIGHT / 2 + 5}
        fontSize={12}
        fontWeight="600"
        fill="#374151"
        style={{ pointerEvents: 'none' }}
      >
        {t('legendTitle')}
      </text>

      {colorByStatus && TASK_STATES.map((state, idx) => {
        const xPos = legendStartX + 120 + (idx * 160);
        return (
          <g key={state.id} style={{ pointerEvents: 'none' }}>
            <rect
              x={xPos}
              y={legendStartY + (LEGEND_HEIGHT - 20) / 2}
              width={20}
              height={20}
              fill={state.color}
              rx={3}
            />
            <text
              x={xPos + 28}
              y={legendStartY + LEGEND_HEIGHT / 2 + 5}
              fontSize={12}
              fill="#374151"
              fontWeight="500"
            >
              {t(LEGEND_LABEL_KEYS[state.id]) || state.label}
            </text>
          </g>
        );
      })}

      {showMilestones && (
        <g style={{ pointerEvents: 'none' }}>
          <polygon
            points={`
              ${colorByStatus ? legendStartX + 600 : legendStartX + 100},${legendStartY + LEGEND_HEIGHT / 2 - 8}
              ${colorByStatus ? legendStartX + 608 : legendStartX + 108},${legendStartY + LEGEND_HEIGHT / 2}
              ${colorByStatus ? legendStartX + 600 : legendStartX + 100},${legendStartY + LEGEND_HEIGHT / 2 + 8}
              ${colorByStatus ? legendStartX + 592 : legendStartX + 92},${legendStartY + LEGEND_HEIGHT / 2}
            `}
            fill="#FBBF24"
            stroke="#4B5563"
            strokeWidth={1.5}
          />
          <text
            x={colorByStatus ? legendStartX + 616 : legendStartX + 116}
            y={legendStartY + LEGEND_HEIGHT / 2 + 5}
            fontSize={12}
            fill="#374151"
            fontWeight="500"
          >
            Milestone
          </text>
        </g>
      )}
    </g>
  );
};

export default SimpleGanttLegendSVG;
