import React from 'react';

const MultiGanttHeader = ({
  periodLabels,
  totalIntervals,
  leftMargin,
  intervalWidth,
  topMargin,
  totalHeight,
  bottomMargin,
}) => {
  return (
    <g>
      {periodLabels.map((period, idx) => {
        const startX = leftMargin + period.startInterval * intervalWidth;
        const endX = leftMargin + period.endInterval * intervalWidth;
        const width = endX - startX;
        const centerX = startX + width / 2;

        return (
          <g key={idx}>
            <rect
              x={startX + 2}
              y={topMargin - 60}
              width={width - 4}
              height={50}
              fill="#374151"
              stroke="#1F2937"
              strokeWidth={1}
              rx={4}
            />
            <text
              x={centerX}
              y={topMargin - 30}
              textAnchor="middle"
              fontSize={14}
              fontWeight="700"
              fill="#FFFFFF"
            >
              {period.label}
            </text>
          </g>
        );
      })}

      {/* Grid lines verticali */}
      {Array.from({ length: totalIntervals }, (_, i) => i + 1).map((interval) => (
        <line
          key={interval}
          x1={leftMargin + interval * intervalWidth}
          y1={topMargin}
          x2={leftMargin + interval * intervalWidth}
          y2={totalHeight - bottomMargin}
          stroke="#E5E7EB"
          strokeWidth={1}
          opacity={0.5}
        />
      ))}
    </g>
  );
};

export default React.memo(MultiGanttHeader);
