import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TIMELINE_HEIGHT } from '../../../../shared/components/gantt/utils/ganttCalculations';

const SimpleGanttTodayLine = ({
  todayX,
  todayOffset = 0,
  onTodayOffsetChange,
  legendYPosition,
  pixelsPerDay,
}) => {
  const { t } = useTranslation('planning');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialOffset, setInitialOffset] = useState(0);

  const handleDragStart = useCallback((event) => {
    event.stopPropagation();
    setIsDragging(true);
    setDragStartX(event.clientX);
    setInitialOffset(todayOffset);
  }, [todayOffset]);

  const handleDrag = useCallback((event) => {
    if (!isDragging) return;
    event.preventDefault();

    const deltaX = event.clientX - dragStartX;
    const deltaDays = Math.round(deltaX / (pixelsPerDay || 10));
    onTodayOffsetChange(initialOffset + deltaDays);
  }, [isDragging, dragStartX, initialOffset, pixelsPerDay, onTodayOffsetChange]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

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

  if (todayX === null || todayX === undefined) {
    return null;
  }

  return (
    <g id="today-line">
      <line
        x1={todayX}
        y1={TIMELINE_HEIGHT + 5}
        x2={todayX}
        y2={legendYPosition - 32}
        stroke="#EF4444"
        strokeWidth={2.5}
        opacity={0.9}
      />

      <g
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleDragStart}
      >
        <rect
          x={isDragging && todayOffset !== 0 ? todayX - 45 : todayX - 30}
          y={TIMELINE_HEIGHT - 12}
          width={isDragging && todayOffset !== 0 ? 90 : 60}
          height={18}
          fill="#EF4444"
          rx={3}
        />

        <text
          x={todayX}
          y={TIMELINE_HEIGHT + 1}
          textAnchor="middle"
          fontSize={12}
          fontWeight="700"
          fill="#FFFFFF"
          letterSpacing="0.5"
        >
          {isDragging && todayOffset !== 0
            ? `${t('printGanttTodayLabel')} ${todayOffset > 0 ? '+' : ''}${todayOffset}`
            : t('printGanttTodayLabel')}
        </text>
      </g>
    </g>
  );
};

export default SimpleGanttTodayLine;
