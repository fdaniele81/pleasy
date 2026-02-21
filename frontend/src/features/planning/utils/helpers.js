import { formatDateISO, getLocale } from '../../../utils/date/dateUtils';
import logger from '../../../utils/logger';

const HOURS_PER_DAY = 8;

export const formatHours = (hours, showInDays) => {
  if (showInDays) {
    const days = hours / HOURS_PER_DAY;
    return Math.round(days * 10) / 10;
  }
  return Math.round(hours * 10) / 10;
};

export const getUnitLabel = (showInDays) => showInDays ? 'd' : 'h';

export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const safeFormatDate = (dateString) => {
  if (!dateString) return '-';
  if (!isValidDate(dateString)) {
    logger.error('Data invalida rilevata:', dateString);
    return '⚠️ Data invalida';
  }
  try {
    return new Date(dateString).toLocaleDateString(getLocale());
  } catch (error) {
    logger.error('Errore formattazione data:', dateString, error);
    return '⚠️ Errore';
  }
};

export { formatDateISO as formatDateForInput };

export const getProjectDateRange = (project) => {
  if (!project.tasks || project.tasks.length === 0) {
    return { minDate: null, maxDate: null };
  }

  const validStartDates = project.tasks
    .filter(task => task.start_date && isValidDate(task.start_date))
    .map(task => task.start_date);

  const validEndDates = project.tasks
    .filter(task => task.end_date && isValidDate(task.end_date))
    .map(task => task.end_date);

  const minDate = validStartDates.length > 0
    ? validStartDates.sort()[0]
    : null;

  const maxDate = validEndDates.length > 0
    ? validEndDates.sort().reverse()[0]
    : null;

  return { minDate, maxDate };
};

export const getFilteredMetrics = (project) => {
  const filteredTasks = project.tasks;
  const totalBudget = filteredTasks.reduce((sum, task) => sum + (task.budget || 0), 0);
  const totalActual = filteredTasks.reduce((sum, task) => sum + (task.actual || 0), 0);
  const totalEtc = filteredTasks.reduce((sum, task) => sum + (task.etc || 0), 0);
  const totalEac = filteredTasks.reduce((sum, task) => sum + (task.eac || 0), 0);
  const variance = totalBudget - totalEac;

  const avgProgress = totalEac > 0 ? Math.round((totalActual / totalEac) * 100) : 0;

  return {
    budget: totalBudget,
    actual: totalActual,
    etc: totalEtc,
    eac: totalEac,
    delta: variance,
    progress: avgProgress
  };
};

export const getGrandTotals = (filteredProjects) => {
  const allTasks = filteredProjects.flatMap(p => p.tasks);
  const totalBudget = allTasks.reduce((sum, task) => sum + (task.budget || 0), 0);
  const totalActual = allTasks.reduce((sum, task) => sum + (task.actual || 0), 0);
  const totalEtc = allTasks.reduce((sum, task) => sum + (task.etc || 0), 0);
  const totalEac = allTasks.reduce((sum, task) => sum + (task.eac || 0), 0);
  const variance = totalBudget - totalEac;

  const avgProgress = totalEac > 0 ? Math.round((totalActual / totalEac) * 100) : 0;

  return {
    budget: totalBudget,
    actual: totalActual,
    etc: totalEtc,
    eac: totalEac,
    delta: variance,
    progress: avgProgress
  };
};

export const statusColors = {
  NEW: 'bg-gray-100 text-gray-700',
  'IN PROGRESS': 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700'
};

export const statusOptions = ['NEW', 'IN PROGRESS', 'DONE'];

export const statusLabels = {
  'NEW': 'Nuovo',
  'IN PROGRESS': 'In corso',
  'DONE': 'Fatto'
};
