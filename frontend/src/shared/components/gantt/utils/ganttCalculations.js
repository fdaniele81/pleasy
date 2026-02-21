import { differenceInDays } from '../../../../utils/date/dateUtils';

export const ROW_HEIGHT = 36;
export const PROJECT_ROW_HEIGHT = 44;
export const TIMELINE_HEIGHT = 60;
export const TIMELINE_BOTTOM_MARGIN = 16;
export const LEGEND_HEIGHT = 50;
export const LEGEND_TOP_MARGIN = 48;
export const LEGEND_BOTTOM_MARGIN = 20;
export const DEFAULT_LEFT_MARGIN = 200;
export const MIN_LEFT_MARGIN = 120;
export const MAX_LEFT_MARGIN = 400;
export const LEFT_PADDING = 16;
export const RIGHT_MARGIN = 40;
export const MIN_BAR_WIDTH = 6;
export const MIN_PIXELS_PER_DAY = 1.5;
export const MAX_PIXELS_PER_DAY = 40;
export const MIN_COLUMN_WIDTH = 170;
export const COLUMN_GAP = 4;
export const AVG_CHAR_WIDTH = 7.5;

export const TASK_STATES = [
  { id: 1, label: 'Completato', color: '#10B981' },
  { id: 2, label: 'In Corso', color: '#F59E0B' },
  { id: 3, label: 'Da Iniziare', color: '#94A3B8' }
];

export const TASK_COLORS = {
  1: '#10B981',
  2: '#F59E0B',
  3: '#94A3B8',
  default: '#94A3B8'
};

export const NEUTRAL_COLOR = '#6366F1';

export function estimateTextWidth(text, fontWeight = 500) {
  if (!text) return 0;
  const charWidth = fontWeight >= 600 ? AVG_CHAR_WIDTH * 1.1 : AVG_CHAR_WIDTH;
  return text.length * charWidth;
}

export function calculateOptimalLeftMargin(groupedTasks) {
  if (!groupedTasks || groupedTasks.length === 0) {
    return DEFAULT_LEFT_MARGIN;
  }

  let maxTextWidth = 0;
  groupedTasks.forEach(project => {
    project.tasks.forEach(task => {
      const textWidth = estimateTextWidth(task.title);
      if (textWidth > maxTextWidth) {
        maxTextWidth = textWidth;
      }
    });
  });

  const calculatedMargin = maxTextWidth + LEFT_PADDING;
  return Math.max(MIN_LEFT_MARGIN, Math.min(MAX_LEFT_MARGIN, calculatedMargin));
}

export function calculateBarPosition(task, paddedMinDate, pixelsPerDay, leftMargin) {
  if (!task.start_date || !task.end_date) {
    return null;
  }

  const startDate = new Date(task.start_date);
  const endDate = new Date(task.end_date);

  const daysFromStart = differenceInDays(startDate, paddedMinDate);
  const x = leftMargin + (daysFromStart * pixelsPerDay);

  const taskDuration = Math.max(1, differenceInDays(endDate, startDate) + 1);
  const width = Math.max(MIN_BAR_WIDTH, taskDuration * pixelsPerDay);

  return { x, width };
}

export function getStatusId(task) {
  const statusValue = task.task_status_id || task.status_id || task.status || task.state;

  if (typeof statusValue === 'number') {
    return statusValue;
  }

  if (typeof statusValue === 'string') {
    const upperValue = statusValue.toUpperCase();
    if (upperValue.includes('DONE') || upperValue.includes('COMPLET')) return 1;
    if (upperValue.includes('PROGRESS') || upperValue.includes('CORSO')) return 2;
    if (upperValue.includes('NEW') || upperValue.includes('PIANIFIC')) return 3;
  }

  return null;
}

export function getStatusLabel(task) {
  const statusId = getStatusId(task);
  const state = TASK_STATES.find(s => s.id === statusId);
  return state ? state.label : (task.task_status_id || 'N/A');
}

export function getTaskColor(statusId, colorByStatus) {
  if (!colorByStatus) {
    return NEUTRAL_COLOR;
  }
  return TASK_COLORS[statusId] || TASK_COLORS.default;
}

export function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function determineTimelineGranularity(totalDays) {
  if (totalDays <= 14) {
    return 'days';
  } else if (totalDays <= 60) {
    return 'weeks';
  } else if (totalDays <= 365) {
    return 'months';
  } else if (totalDays <= 1095) {
    return 'quarters';
  } else {
    return 'years';
  }
}
