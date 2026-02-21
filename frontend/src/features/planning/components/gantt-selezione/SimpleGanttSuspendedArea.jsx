import React, { useState, useEffect, useCallback } from 'react';
import { addDays } from '../../../../utils/date/dateUtils';
import { TIMELINE_HEIGHT } from '../../../../shared/components/gantt/utils/ganttCalculations';

const SimpleGanttSuspendedArea = ({
  suspendedAreaData,
  legendYPosition,
  pixelsPerDay,
  suspendedAreaLabel = 'SOSPESO',
  onSuspendedAreaChange,
  onSuspendedAreaLabelChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialArea, setInitialArea] = useState(null);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState(suspendedAreaLabel);

  const handleDragStart = useCallback((event) => {
    event.stopPropagation();
    setIsDragging(true);
    setDragStartX(event.clientX);
    setInitialArea({ ...suspendedAreaData });
  }, [suspendedAreaData]);

  const handleResizeStart = useCallback((event, edge) => {
    event.stopPropagation();
    setIsResizing(true);
    setResizeEdge(edge);
    setDragStartX(event.clientX);
    setInitialArea({ ...suspendedAreaData });
  }, [suspendedAreaData]);

  const handleDrag = useCallback((event) => {
    if (!isDragging && !isResizing) return;
    event.preventDefault();

    const deltaX = event.clientX - dragStartX;
    const deltaDays = Math.round(deltaX / (pixelsPerDay || 10));

    if (isDragging && initialArea) {
      const newStartDate = addDays(new Date(initialArea.startDate), deltaDays);
      const newEndDate = addDays(new Date(initialArea.endDate), deltaDays);

      onSuspendedAreaChange({
        startDate: newStartDate.toISOString().split('T')[0],
        endDate: newEndDate.toISOString().split('T')[0]
      });
    } else if (isResizing && initialArea) {
      if (resizeEdge === 'left') {
        const newStartDate = addDays(new Date(initialArea.startDate), deltaDays);
        const endDate = new Date(initialArea.endDate);

        if (newStartDate < endDate) {
          onSuspendedAreaChange({
            startDate: newStartDate.toISOString().split('T')[0],
            endDate: initialArea.endDate
          });
        }
      } else if (resizeEdge === 'right') {
        const newEndDate = addDays(new Date(initialArea.endDate), deltaDays);
        const startDate = new Date(initialArea.startDate);

        if (newEndDate > startDate) {
          onSuspendedAreaChange({
            startDate: initialArea.startDate,
            endDate: newEndDate.toISOString().split('T')[0]
          });
        }
      }
    }
  }, [isDragging, isResizing, dragStartX, initialArea, resizeEdge, pixelsPerDay, onSuspendedAreaChange]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeEdge(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, isResizing, handleDrag, handleDragEnd]);

  if (!suspendedAreaData) {
    return null;
  }

  const { x, width } = suspendedAreaData;
  const areaHeight = legendYPosition - 32 - (TIMELINE_HEIGHT + 5);

  return (
    <g id="suspended-area">
      <rect
        x={x}
        y={TIMELINE_HEIGHT + 5}
        width={width}
        height={areaHeight}
        fill="#E5E7EB"
        opacity="0.5"
        rx={8}
      />

      <rect
        x={x}
        y={TIMELINE_HEIGHT + 5}
        width={width}
        height={areaHeight}
        fill="transparent"
        rx={8}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          pointerEvents: 'all'
        }}
        onMouseDown={handleDragStart}
      />

      <line
        x1={x}
        y1={TIMELINE_HEIGHT + 5}
        x2={x}
        y2={legendYPosition - 32}
        stroke="#6B7280"
        strokeWidth="3"
        opacity="0.6"
      />
      <line
        x1={x + width}
        y1={TIMELINE_HEIGHT + 5}
        x2={x + width}
        y2={legendYPosition - 32}
        stroke="#6B7280"
        strokeWidth="3"
        opacity="0.6"
      />

      {!isEditingLabel ? (
        <g
          onDoubleClick={() => {
            setIsEditingLabel(true);
            setTempLabel(suspendedAreaLabel);
          }}
          style={{ cursor: 'text' }}
        >
          {suspendedAreaLabel.trim() && (
            <rect
              x={x + width / 2 - Math.max(45, suspendedAreaLabel.length * 5)}
              y={TIMELINE_HEIGHT + 8}
              width={Math.max(90, suspendedAreaLabel.length * 10)}
              height="24"
              fill="#6B7280"
              rx="12"
              opacity="0.9"
            />
          )}
          <text
            x={x + width / 2}
            y={TIMELINE_HEIGHT + 22}
            textAnchor="middle"
            fontSize={11}
            fontWeight="700"
            fill="#FFFFFF"
            letterSpacing="1"
          >
            {suspendedAreaLabel}
          </text>
        </g>
      ) : (
        <foreignObject
          x={x + width / 2 - 60}
          y={TIMELINE_HEIGHT + 8}
          width="120"
          height="24"
        >
          <input
            type="text"
            value={tempLabel}
            onChange={(e) => setTempLabel(e.target.value)}
            onBlur={() => {
              onSuspendedAreaLabelChange(tempLabel);
              setIsEditingLabel(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSuspendedAreaLabelChange(tempLabel);
                setIsEditingLabel(false);
              } else if (e.key === 'Escape') {
                setIsEditingLabel(false);
              }
            }}
            autoFocus
            className="w-full h-full px-2 text-center text-xs font-bold text-white bg-gray-500 rounded-xl border-none outline-none"
            style={{ letterSpacing: '1px' }}
          />
        </foreignObject>
      )}

      <rect
        x={x - 8}
        y={TIMELINE_HEIGHT + 5}
        width={16}
        height={areaHeight}
        fill="transparent"
        style={{ cursor: 'ew-resize', pointerEvents: 'all' }}
        onMouseDown={(e) => handleResizeStart(e, 'left')}
      />

      <rect
        x={x + width - 8}
        y={TIMELINE_HEIGHT + 5}
        width={16}
        height={areaHeight}
        fill="transparent"
        style={{ cursor: 'ew-resize', pointerEvents: 'all' }}
        onMouseDown={(e) => handleResizeStart(e, 'right')}
      />
    </g>
  );
};

export default SimpleGanttSuspendedArea;
