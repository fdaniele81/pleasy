import React from 'react';
import { TIMELINE_HEIGHT } from '../../../../shared/components/gantt/utils/ganttCalculations';

const SimpleGanttGridLines = ({ timelineSegments, legendYPosition, showGridLines = true }) => {
  if (!showGridLines || !timelineSegments || timelineSegments.length === 0) {
    return null;
  }

  return (
    <g id="grid">
      {timelineSegments.map((segment, idx) => {
        if (idx === timelineSegments.length - 1) return null;

        const lineX = segment.x + segment.width;

        return (
          <line
            key={`grid-${idx}`}
            x1={lineX}
            y1={TIMELINE_HEIGHT + 5}
            x2={lineX}
            y2={legendYPosition - 32}
            stroke="#D1D5DB"
            strokeWidth={1.5}
            opacity={0.6}
          />
        );
      })}
    </g>
  );
};

export default SimpleGanttGridLines;
