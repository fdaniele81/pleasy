import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInDays, formatDateDDMON } from '../../../../utils/date/dateUtils';

import {
  ROW_HEIGHT as _ROW_HEIGHT,
  PROJECT_ROW_HEIGHT as _PROJECT_ROW_HEIGHT,
  TIMELINE_HEIGHT,
  TIMELINE_BOTTOM_MARGIN as _TIMELINE_BOTTOM_MARGIN,
  LEGEND_HEIGHT,
  LEGEND_TOP_MARGIN as _LEGEND_TOP_MARGIN,
  LEGEND_BOTTOM_MARGIN,
  RIGHT_MARGIN,
  MIN_PIXELS_PER_DAY,
  MAX_PIXELS_PER_DAY,
  calculateOptimalLeftMargin,
  calculateBarPosition,
  determineTimelineGranularity,
  estimateTextWidth,
  truncateText,
  getStatusId,
  getTaskColor,
  NEUTRAL_COLOR,
} from '../../../../shared/components/gantt/utils/ganttCalculations';

// Compact overrides for the printable Gantt
const ROW_HEIGHT = 30;
const PROJECT_ROW_HEIGHT = 28;
const TIMELINE_BOTTOM_MARGIN = 8;
const LEGEND_TOP_MARGIN = 36;

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
  projectHeaderMode = 'expanded',
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

    const originalMinDate = new Date(dateRange.minDate);
    const originalMaxDate = new Date(dateRange.maxDate);
    const originalDuration = differenceInDays(originalMaxDate, originalMinDate) + 1;

    const paddingDays = Math.max(3, Math.min(30, Math.ceil(originalDuration * 0.05)));

    const minDate = new Date(originalMinDate);
    minDate.setDate(minDate.getDate() - paddingDays);

    const maxDate = new Date(originalMaxDate);
    maxDate.setDate(maxDate.getDate() + paddingDays);

    const totalDays = differenceInDays(maxDate, minDate) + 1;

    const showProjectBar = projectHeaderMode === 'expanded' || projectHeaderMode === 'collapsed';
    const showTasks = projectHeaderMode !== 'collapsed';

    // --- Compute LEFT_MARGIN dynamically ---
    // For task labels: use the standard calculation.
    // For project labels: iterate to find the margin where all labels fit.
    // Project label is placed at barX - 8 with textAnchor="end", so it needs
    // barX >= labelWidth + 8, i.e. LEFT_MARGIN + daysFromStart*ppd >= labelWidth + 8

    let LEFT_MARGIN;
    if (showTasks && !showProjectBar) {
      // 'none' mode: only task labels matter
      LEFT_MARGIN = calculateOptimalLeftMargin(groupedTasks);
    } else if (showTasks && showProjectBar) {
      // 'expanded' mode: need space for both task labels AND project labels
      // Start with task-based margin, then ensure project labels also fit
      LEFT_MARGIN = calculateOptimalLeftMargin(groupedTasks);
      const ppd = Math.max(MIN_PIXELS_PER_DAY,
        Math.min(MAX_PIXELS_PER_DAY, (containerWidth - LEFT_MARGIN - RIGHT_MARGIN) / totalDays));
      groupedTasks.forEach(project => {
        if (project.tasks.length === 0) return;
        const projStart = new Date(Math.min(...project.tasks.map(t => new Date(t.start_date))));
        const daysFromMin = differenceInDays(projStart, minDate);
        const barX = LEFT_MARGIN + daysFromMin * ppd;
        const availPx = barX - 8;
        const minLabel = project.project_title;
        const labelW = estimateTextWidth(minLabel, 600);
        if (labelW > availPx) {
          const needed = LEFT_MARGIN + (labelW - availPx) + 8;
          if (needed > LEFT_MARGIN) LEFT_MARGIN = Math.min(needed, containerWidth * 0.4);
        }
      });
    } else {
      // Collapsed mode: iterative approach (converges in 2 passes)
      LEFT_MARGIN = 40;
      for (let pass = 0; pass < 3; pass++) {
        const ppd = Math.max(MIN_PIXELS_PER_DAY,
          Math.min(MAX_PIXELS_PER_DAY, (containerWidth - LEFT_MARGIN - RIGHT_MARGIN) / totalDays));
        let neededMargin = 40;
        groupedTasks.forEach(project => {
          if (project.tasks.length === 0) return;
          const projStart = new Date(Math.min(...project.tasks.map(t => new Date(t.start_date))));
          const daysFromMin = differenceInDays(projStart, minDate);
          const barX = LEFT_MARGIN + daysFromMin * ppd;
          const availPx = barX - 8;
          // Pick shortest label variant that fits, get its width
          const labels = [
            `${project.client_name} - ${project.project_key} ${project.project_title}`,
            `${project.client_name} - ${project.project_title}`,
            project.project_title,
          ];
          const chosenLabel = labels.find(l => estimateTextWidth(l, 600) <= availPx) || labels[labels.length - 1];
          const labelW = estimateTextWidth(chosenLabel, 600);
          // If label doesn't fit, how much more margin do we need?
          if (labelW > availPx) {
            const deficit = labelW - availPx + 8;
            const needed = LEFT_MARGIN + deficit;
            if (needed > neededMargin) neededMargin = needed;
          }
        });
        if (neededMargin <= LEFT_MARGIN) break; // converged
        LEFT_MARGIN = Math.min(neededMargin, containerWidth * 0.4); // cap at 40% of width
      }
    }

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

    const PROJECT_GAP = 18;

    // Extra space below timeline when suspended area is active, so its label doesn't overlap first bar
    const suspendedAreaTopPadding = showSuspendedArea ? 28 : 0;
    let currentY = TIMELINE_HEIGHT + TIMELINE_BOTTOM_MARGIN + suspendedAreaTopPadding;
    const projectsWithPositions = groupedTasks.map((project, projectIndex) => {
      // Add gap between projects (not before the first one)
      if (projectIndex > 0) {
        currentY += PROJECT_GAP;
      }

      const projectY = currentY;
      if (showProjectBar) {
        currentY += PROJECT_ROW_HEIGHT;
      }

      const tasksWithPositions = showTasks ? project.tasks.map(task => {
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
      }) : [];

      // Calculate project summary bar position from earliest task start to latest task end
      let projectBarPosition = null;
      let projectMilestone = null;
      if (showProjectBar && project.tasks.length > 0) {
        const projectMinDate = new Date(Math.min(...project.tasks.map(t => new Date(t.start_date))));
        const projectMaxDate = new Date(Math.max(...project.tasks.map(t => new Date(t.end_date))));
        projectBarPosition = calculateBarPosition(
          { start_date: projectMinDate, end_date: projectMaxDate },
          minDate,
          pixelsPerDay,
          LEFT_MARGIN
        );

        // Single milestone at the end of the project bar (latest end_date)
        if (!showTasks) {
          const daysFromStart = differenceInDays(projectMaxDate, minDate);
          const x = LEFT_MARGIN + (daysFromStart * pixelsPerDay);
          projectMilestone = { x, end_date: projectMaxDate };
        }
      }

      // Compute aggregate project status: in_progress(2) if any task is in progress,
      // completed(1) if all completed, otherwise to_start(3)
      let projectStatusId = 3;
      if (project.tasks.length > 0) {
        const statuses = project.tasks.map(t => getStatusId(t));
        if (statuses.some(s => s === 2)) {
          projectStatusId = 2;
        } else if (statuses.every(s => s === 1)) {
          projectStatusId = 1;
        }
      }

      return {
        ...project,
        yPosition: projectY,
        projectBarPosition,
        projectMilestone,
        projectStatusId,
        tasks: tasksWithPositions
      };
    });

    const CHART_BOTTOM_PADDING = 16;
    const showLegend = colorByStatus || showMilestones;
    const legendYPosition = currentY + LEGEND_TOP_MARGIN;
    const totalHeight = legendYPosition + (showLegend ? LEGEND_HEIGHT + LEGEND_BOTTOM_MARGIN : 0) + CHART_BOTTOM_PADDING;

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

  }, [groupedTasks, dateRange, containerWidth, projectHeaderMode, colorByStatus, anonymizeMode, showSuspendedArea, t]);

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

      {todayLineData && (
        <SimpleGanttTodayLine
          todayX={todayLineData.x}
          todayOffset={todayOffset}
          onTodayOffsetChange={onTodayOffsetChange}
          legendYPosition={legendYPosition}
          pixelsPerDay={pixelsPerDay}
        />
      )}

      {projectsWithPositions.map((project) => {
        const showProjectBar = projectHeaderMode === 'expanded' || projectHeaderMode === 'collapsed';
        const isCollapsed = projectHeaderMode === 'collapsed';
        const centerY = project.yPosition + PROJECT_ROW_HEIGHT / 2;

        const bp = project.projectBarPosition;

        // Build label that fits the available pixels to the left of the bar
        const availablePx = bp ? bp.x - 16 : 0;
        const fullLabel = `${project.client_name} - ${project.project_key} ${project.project_title}`;
        const shortLabel = `${project.client_name} - ${project.project_title}`;
        const minLabel = project.project_title;

        // Pick the longest label variant that fits, then truncate to pixel width
        let projectLabel = fullLabel;
        if (estimateTextWidth(fullLabel, 600) > availablePx) {
          projectLabel = shortLabel;
        }
        if (estimateTextWidth(shortLabel, 600) > availablePx) {
          projectLabel = minLabel;
        }
        // Pixel-based truncation: shorten until it fits
        if (estimateTextWidth(projectLabel, 600) > availablePx) {
          let len = projectLabel.length;
          while (len > 3 && estimateTextWidth(projectLabel.substring(0, len) + '...', 600) > availablePx) {
            len--;
          }
          projectLabel = len < projectLabel.length ? projectLabel.substring(0, len) + '...' : projectLabel;
        }
        const labelWidth = estimateTextWidth(projectLabel, 600);

        return (
          <g key={project.project_id}>
            {showProjectBar && bp && (
              <>
                {/* Project label to the left of the bar */}
                <rect
                  x={bp.x - 8 - labelWidth}
                  y={centerY - 9}
                  width={labelWidth + 4}
                  height={16}
                  fill="white"
                  opacity={0.9}
                />
                <text
                  x={bp.x - 8}
                  y={centerY + 4}
                  fontSize={12}
                  fontWeight="600"
                  fill="#374151"
                  textAnchor="end"
                >
                  {projectLabel}
                </text>

                {isCollapsed ? (
                  /* COLLAPSED: full colored bar with status color */
                  <>
                    <rect
                      x={bp.x}
                      y={centerY - (ROW_HEIGHT - 16) / 2}
                      width={bp.width}
                      height={ROW_HEIGHT - 16}
                      fill={getTaskColor(project.projectStatusId, colorByStatus)}
                      rx={4}
                    />

                    {/* Single milestone at end of project bar */}
                    {showMilestones && project.projectMilestone && (() => {
                      const ms = project.projectMilestone;
                      return (
                        <g>
                          <polygon
                            points={`
                              ${ms.x},${centerY - 6}
                              ${ms.x + 6},${centerY}
                              ${ms.x},${centerY + 6}
                              ${ms.x - 6},${centerY}
                            `}
                            fill="#FBBF24"
                            stroke="#4B5563"
                            strokeWidth={1.2}
                          />
                          <rect
                            x={ms.x + 8}
                            y={centerY - 12}
                            width={estimateTextWidth(formatDateDDMON(ms.end_date), 600) * (10/13)}
                            height={14}
                            fill="white"
                            opacity={0.9}
                          />
                          <text
                            x={ms.x + 8}
                            y={centerY - 2}
                            fontSize={10}
                            fontWeight="600"
                            fill="#374151"
                          >
                            {formatDateDDMON(ms.end_date)}
                          </text>
                        </g>
                      );
                    })()}
                  </>
                ) : (
                  /* EXPANDED: classic bracket-style summary bar */
                  <>
                    {/* Thin horizontal line */}
                    <rect
                      x={bp.x}
                      y={centerY - 2}
                      width={bp.width}
                      height={4}
                      fill="#374151"
                      rx={1}
                    />
                    {/* Left downward triangle */}
                    <polygon
                      points={`
                        ${bp.x},${centerY - 5}
                        ${bp.x + 8},${centerY - 5}
                        ${bp.x},${centerY + 7}
                      `}
                      fill="#374151"
                    />
                    {/* Right downward triangle */}
                    <polygon
                      points={`
                        ${bp.x + bp.width},${centerY - 5}
                        ${bp.x + bp.width - 8},${centerY - 5}
                        ${bp.x + bp.width},${centerY + 7}
                      `}
                      fill="#374151"
                    />
                  </>
                )}
              </>
            )}

            {/* Fallback: label on the left if no bar position */}
            {showProjectBar && !bp && (
              <text
                x={12}
                y={centerY + 4}
                fontSize={12}
                fontWeight="600"
                fill="#374151"
              >
                {truncateText(fullLabel, 50)}
              </text>
            )}

            {project.tasks.map(task => (
              <SimpleGanttTaskBar
                key={task.task_id}
                task={task}
                colorByStatus={colorByStatus}
                showMilestones={showMilestones}
                milestonesVisibility={milestonesVisibility}
                onMilestoneClick={handleMilestoneClick}
                rowHeight={ROW_HEIGHT}
              />
            ))}
          </g>
        );
      })}

      {/* Suspended area label rendered on top of bars */}
      {suspendedAreaData && (
        <SimpleGanttSuspendedArea
          suspendedAreaData={suspendedAreaData}
          legendYPosition={legendYPosition}
          pixelsPerDay={pixelsPerDay}
          suspendedAreaLabel={suspendedAreaLabel}
          onSuspendedAreaChange={onSuspendedAreaChange}
          onSuspendedAreaLabelChange={onSuspendedAreaLabelChange}
          labelOnly
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
