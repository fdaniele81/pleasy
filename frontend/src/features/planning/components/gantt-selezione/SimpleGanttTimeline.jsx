import React from 'react';
import { TIMELINE_HEIGHT } from '../../../../shared/components/gantt/utils/ganttCalculations';

const SimpleGanttTimeline = ({ timelineSegments }) => {
  if (!timelineSegments || timelineSegments.length === 0) {
    return null;
  }

  return (
    <g id="timeline">
      {timelineSegments.map((segment, idx) => (
        <g key={idx}>
          <rect
            x={segment.x}
            y={0}
            width={segment.width}
            height={TIMELINE_HEIGHT}
            fill="#475569"
            rx={4}
          />

          <text
            x={segment.x + segment.width / 2}
            y={TIMELINE_HEIGHT / 2 + 5}
            textAnchor="middle"
            fontSize={13}
            fontWeight="700"
            fill="#FFFFFF"
            letterSpacing="0.5"
          >
            {segment.label}
          </text>
        </g>
      ))}
    </g>
  );
};

export default SimpleGanttTimeline;
