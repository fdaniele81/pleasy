import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateISO, formatDateDDMON } from '../../../../utils/date/dateUtils';
import {
  ROW_HEIGHT,
  estimateTextWidth,
  truncateText,
  getStatusId,
  getTaskColor,
} from '../../../../shared/components/gantt/utils/ganttCalculations';

const STATUS_LABEL_KEYS = {
  1: 'legendCompleted',
  2: 'legendInProgress',
  3: 'legendToStart',
};

const SimpleGanttTaskBar = ({
  task,
  colorByStatus = true,
  showMilestones = false,
  milestonesVisibility = {},
  onMilestoneClick,
}) => {
  const { t } = useTranslation('planning');

  if (!task.barPosition) {
    return null;
  }

  const statusId = getStatusId(task);
  const statusLabel = t(STATUS_LABEL_KEYS[statusId]) || (task.task_status_id || 'N/A');
  const taskColor = getTaskColor(statusId, colorByStatus);

  const handleMilestoneClick = (e) => {
    if (onMilestoneClick) {
      onMilestoneClick(task.task_id, e);
    }
  };

  return (
    <g>
      <rect
        x={task.barPosition.x - 8 - estimateTextWidth(truncateText(task.title, 45))}
        y={task.yPosition + ROW_HEIGHT / 2 - 10}
        width={estimateTextWidth(truncateText(task.title, 45)) + 4}
        height={18}
        fill="white"
        opacity={0.9}
      />

      <text
        x={task.barPosition.x - 8}
        y={task.yPosition + ROW_HEIGHT / 2 + 5}
        fontSize={13}
        fill="#374151"
        fontWeight="500"
        textAnchor="end"
      >
        {truncateText(task.title, 45)}
      </text>

      <rect
        x={task.barPosition.x}
        y={task.yPosition + 8}
        width={task.barPosition.width}
        height={ROW_HEIGHT - 16}
        fill={taskColor}
        rx={6}
      />

      {showMilestones && (
        <g className="milestone-group">
          <rect
            x={task.barPosition.x + task.barPosition.width - 10}
            y={task.yPosition + ROW_HEIGHT / 2 - 10}
            width={20}
            height={20}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={handleMilestoneClick}
          />

          {milestonesVisibility[task.task_id]?.showMarker && (
            <>
              <polygon
                points={`
                  ${task.barPosition.x + task.barPosition.width},${task.yPosition + ROW_HEIGHT / 2 - 8}
                  ${task.barPosition.x + task.barPosition.width + 8},${task.yPosition + ROW_HEIGHT / 2}
                  ${task.barPosition.x + task.barPosition.width},${task.yPosition + ROW_HEIGHT / 2 + 8}
                  ${task.barPosition.x + task.barPosition.width - 8},${task.yPosition + ROW_HEIGHT / 2}
                `}
                fill="#FBBF24"
                stroke="#4B5563"
                strokeWidth={1.5}
                style={{ pointerEvents: 'none' }}
              />

              {milestonesVisibility[task.task_id]?.showLabel && (
                <>
                  <rect
                    x={task.barPosition.x + task.barPosition.width + 10}
                    y={task.yPosition + ROW_HEIGHT / 2 - 13}
                    width={estimateTextWidth(formatDateDDMON(task.end_date), 600) * (11/13)}
                    height={16}
                    fill="white"
                    opacity={0.9}
                    style={{ pointerEvents: 'none' }}
                  />

                  <text
                    x={task.barPosition.x + task.barPosition.width + 10}
                    y={task.yPosition + ROW_HEIGHT / 2 - 5}
                    textAnchor="start"
                    fontSize={11}
                    fontWeight="600"
                    fill="#374151"
                    style={{ pointerEvents: 'none' }}
                  >
                    {formatDateDDMON(task.end_date)}
                  </text>
                </>
              )}
            </>
          )}
        </g>
      )}

      <title>
        {task.title}
        {'\n'}
        {t('tooltipStatus')} {statusLabel}
        {'\n'}
        {formatDateISO(new Date(task.start_date))} → {formatDateISO(new Date(task.end_date))}
      </title>
    </g>
  );
};

export default SimpleGanttTaskBar;
