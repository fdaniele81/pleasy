import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInDays } from '../../../../utils/date/dateUtils';

import {
  ROW_HEIGHT,
  PROJECT_ROW_HEIGHT,
  TIMELINE_HEIGHT,
  TIMELINE_BOTTOM_MARGIN,
  LEGEND_HEIGHT,
  LEGEND_TOP_MARGIN,
  LEGEND_BOTTOM_MARGIN,
  RIGHT_MARGIN,
  MIN_PIXELS_PER_DAY,
  MAX_PIXELS_PER_DAY,
  calculateOptimalLeftMargin,
  calculateBarPosition,
  determineTimelineGranularity,
} from '../../../../shared/components/gantt/utils/ganttCalculations';

import { generateAdaptiveTimeline } from '../../../../shared/components/gantt/utils/timelineGenerators';

import SimpleGanttTimeline from './SimpleGanttTimeline';
import SimpleGanttGridLines from './SimpleGanttGridLines';
import SimpleGanttTodayLine from './SimpleGanttTodayLine';
import SimpleGanttTaskBar from './SimpleGanttTaskBar';
import SimpleGanttSuspendedArea from './SimpleGanttSuspendedArea';
import SimpleGanttLegendSVG from './SimpleGanttLegendSVG';
import SimpleGanttContextMenu from './SimpleGanttContextMenu';

const SimpleGanttChart = ({
  groupedTasks,
  dateRange,
  svgRef,
  containerWidth = 1400,
  showProjectHeaders = true,
  colorByStatus = true,
  showMilestones = false,
  showGridLines = true,
  showTodayLine = true,
  todayOffset = 0,
  onTodayOffsetChange = () => {},
  milestonesVisibility = {},
  onHideMilestone = () => {},
  onHideMilestoneLabel = () => {},
  onShowMilestoneLabel = () => {},
  onShowMilestone = () => {},
  anonymizeMode = false,
  showSuspendedArea = false,
  suspendedArea = null,
  onSuspendedAreaChange = () => {},
  suspendedAreaLabel = 'SOSPESO',
  onSuspendedAreaLabelChange = () => {}
}) => {
  const { t } = useTranslation('planning');
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    taskId: null,
    x: 0,
    y: 0
  });

  const handleMilestoneClick = (taskId, event) => {
    event.stopPropagation();
    const svgRect = event.currentTarget.ownerSVGElement.getBoundingClientRect();
    let x = event.clientX - svgRect.left;
    let y = event.clientY - svgRect.top;

    if (x + 200 > svgRect.width) x = x - 200;
    if (y + 120 > svgRect.height) y = y - 120;

    setContextMenu({ isOpen: true, taskId, x, y });
  };

  const chartData = useMemo(() => {
    if (!dateRange || !groupedTasks || groupedTasks.length === 0) {
      return null;
    }

    const LEFT_MARGIN = calculateOptimalLeftMargin(groupedTasks);

    const originalMinDate = new Date(dateRange.minDate);
    const originalMaxDate = new Date(dateRange.maxDate);
    const originalDuration = differenceInDays(originalMaxDate, originalMinDate) + 1;

    const paddingDays = Math.max(3, Math.min(30, Math.ceil(originalDuration * 0.05)));

    const minDate = new Date(originalMinDate);
    minDate.setDate(minDate.getDate() - paddingDays);

    const maxDate = new Date(originalMaxDate);
    maxDate.setDate(maxDate.getDate() + paddingDays);

    const totalDays = differenceInDays(maxDate, minDate) + 1;

    const availableWidth = containerWidth - LEFT_MARGIN - RIGHT_MARGIN;
    let pixelsPerDay = availableWidth / totalDays;

    pixelsPerDay = Math.max(MIN_PIXELS_PER_DAY, Math.min(MAX_PIXELS_PER_DAY, pixelsPerDay));

    const timelineGranularity = determineTimelineGranularity(totalDays);

    const anonLabels = { week: t('anonWeek'), month: t('anonMonth'), months: t('anonMonths') };
    let timelineSegments = generateAdaptiveTimeline(
      minDate,
      maxDate,
      pixelsPerDay,
      timelineGranularity,
      LEFT_MARGIN,
      anonymizeMode,
      anonLabels
    );

    const lastSegment = timelineSegments[timelineSegments.length - 1];
    const theoreticalWidth = lastSegment ? lastSegment.x + lastSegment.width + RIGHT_MARGIN : 0;

    if (theoreticalWidth > containerWidth) {
      const availableTimelineWidth = containerWidth - LEFT_MARGIN - RIGHT_MARGIN;
      const currentTimelineWidth = theoreticalWidth - LEFT_MARGIN - RIGHT_MARGIN;
      const scaleFactor = availableTimelineWidth / currentTimelineWidth;

      timelineSegments = timelineSegments.map(segment => ({
        ...segment,
        x: LEFT_MARGIN + (segment.x - LEFT_MARGIN) * scaleFactor,
        width: segment.width * scaleFactor
      }));

      pixelsPerDay = pixelsPerDay * scaleFactor;
    }

    const chartWidth = containerWidth;

    let currentY = TIMELINE_HEIGHT + TIMELINE_BOTTOM_MARGIN;
    const projectsWithPositions = groupedTasks.map(project => {
      const projectY = currentY;
      if (showProjectHeaders) {
        currentY += PROJECT_ROW_HEIGHT;
      }

      const tasksWithPositions = project.tasks.map(task => {
        const taskY = currentY;
        currentY += ROW_HEIGHT;

        const barPosition = calculateBarPosition(
          task,
          minDate,
          pixelsPerDay,
          LEFT_MARGIN
        );

        return {
          ...task,
          yPosition: taskY,
          barPosition
        };
      });

      return {
        ...project,
        yPosition: projectY,
        tasks: tasksWithPositions
      };
    });

    const showLegend = colorByStatus || showMilestones;
    const legendYPosition = currentY + LEGEND_TOP_MARGIN;
    const totalHeight = legendYPosition + (showLegend ? LEGEND_HEIGHT + LEGEND_BOTTOM_MARGIN : 0);

    return {
      minDate,
      maxDate,
      totalDays,
      pixelsPerDay,
      timelineSegments,
      timelineGranularity,
      projectsWithPositions,
      totalWidth: chartWidth,
      totalHeight,
      legendYPosition,
      leftMargin: LEFT_MARGIN
    };

  }, [groupedTasks, dateRange, containerWidth, showProjectHeaders, colorByStatus, anonymizeMode, t]);

  if (!chartData) {
    return null;
  }

  const {
    minDate,
    pixelsPerDay,
    timelineSegments,
    projectsWithPositions,
    totalWidth,
    totalHeight,
    legendYPosition,
    leftMargin
  } = chartData;

  const todayLineData = useMemo(() => {
    if (!showTodayLine || !minDate || !pixelsPerDay) {
      return null;
    }

    const today = new Date();
    today.setDate(today.getDate() + todayOffset);

    const daysFromStart = differenceInDays(today, minDate);
    const todayX = leftMargin + (daysFromStart * pixelsPerDay);

    return { x: todayX, date: today };
  }, [showTodayLine, todayOffset, minDate, pixelsPerDay, leftMargin]);

  const suspendedAreaData = useMemo(() => {
    if (!showSuspendedArea || !suspendedArea || !minDate || !pixelsPerDay) {
      return null;
    }

    const startDate = new Date(suspendedArea.startDate);
    const endDate = new Date(suspendedArea.endDate);

    const daysFromStart = differenceInDays(startDate, minDate);
    const x = leftMargin + (daysFromStart * pixelsPerDay);

    const duration = differenceInDays(endDate, startDate) + 1;
    const width = duration * pixelsPerDay;

    return { x, width, startDate, endDate };
  }, [showSuspendedArea, suspendedArea, minDate, pixelsPerDay, leftMargin]);

  return (
    <svg
      ref={svgRef}
      width={totalWidth}
      height={totalHeight}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100%" height="100%" fill="#FFFFFF" />

      <SimpleGanttTimeline timelineSegments={timelineSegments} />

      <g id="task-backgrounds">
        {projectsWithPositions.map((project) => (
          <g key={`bg-${project.project_id}`}>
            {project.tasks.map(task => (
              task.barPosition && (
                <rect
                  key={`bg-${task.task_id}`}
                  x={0}
                  y={task.yPosition}
                  width={totalWidth}
                  height={ROW_HEIGHT}
                  fill={task.yPosition % 2 === 0 ? "#FFFFFF" : "#F9FAFB"}
                />
              )
            ))}
          </g>
        ))}
      </g>

      <SimpleGanttGridLines
        timelineSegments={timelineSegments}
        legendYPosition={legendYPosition}
        showGridLines={showGridLines}
      />

      {todayLineData && (
        <SimpleGanttTodayLine
          todayX={todayLineData.x}
          todayOffset={todayOffset}
          onTodayOffsetChange={onTodayOffsetChange}
          legendYPosition={legendYPosition}
          pixelsPerDay={pixelsPerDay}
        />
      )}

      {projectsWithPositions.map((project) => (
        <g key={project.project_id}>
          {showProjectHeaders && (
            <>
              <defs>
                <linearGradient id={`projectGradient-${project.project_id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: project.client_color || '#DBEAFE', stopOpacity: 0.9 }} />
                  <stop offset="100%" style={{ stopColor: project.client_color || '#DBEAFE', stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>

              <rect
                x={0}
                y={project.yPosition}
                width={totalWidth}
                height={PROJECT_ROW_HEIGHT}
                fill={`url(#projectGradient-${project.project_id})`}
              />

              <rect
                x={0}
                y={project.yPosition}
                width={4}
                height={PROJECT_ROW_HEIGHT}
                fill={project.client_color || '#6366F1'}
                opacity={0.8}
              />

              <text
                x={12}
                y={project.yPosition + PROJECT_ROW_HEIGHT / 2 + 6}
                fontSize={14}
                fontWeight="600"
                fill="#111827"
                style={{ letterSpacing: '0.3px' }}
              >
                {project.client_name} - {project.project_key} {project.project_title}
              </text>
            </>
          )}

          {project.tasks.map(task => (
            <SimpleGanttTaskBar
              key={task.task_id}
              task={task}
              colorByStatus={colorByStatus}
              showMilestones={showMilestones}
              milestonesVisibility={milestonesVisibility}
              onMilestoneClick={handleMilestoneClick}
            />
          ))}
        </g>
      ))}

      {suspendedAreaData && (
        <SimpleGanttSuspendedArea
          suspendedAreaData={suspendedAreaData}
          legendYPosition={legendYPosition}
          pixelsPerDay={pixelsPerDay}
          suspendedAreaLabel={suspendedAreaLabel}
          onSuspendedAreaChange={onSuspendedAreaChange}
          onSuspendedAreaLabelChange={onSuspendedAreaLabelChange}
        />
      )}

      <SimpleGanttLegendSVG
        totalWidth={totalWidth}
        legendYPosition={legendYPosition}
        colorByStatus={colorByStatus}
        showMilestones={showMilestones}
      />

      <SimpleGanttContextMenu
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        milestonesVisibility={milestonesVisibility}
        onHideMilestone={onHideMilestone}
        onHideMilestoneLabel={onHideMilestoneLabel}
        onShowMilestoneLabel={onShowMilestoneLabel}
        onShowMilestone={onShowMilestone}
      />
    </svg>
  );
};

export default SimpleGanttChart;
