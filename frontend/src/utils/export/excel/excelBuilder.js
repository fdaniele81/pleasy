import { formatHours } from './excelFormatter.js';
import { getLocale } from '../../date/dateUtils';
import i18n from '../../../i18n/i18n';

let ExcelJSModule = null;

const getExcelJS = async () => {
  if (!ExcelJSModule) {
    ExcelJSModule = (await import('exceljs')).default;
  }
  return ExcelJSModule;
};

export const createConfiguredWorkbook = async (sheetName) => {
  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  return { workbook, worksheet };
};

export const addMainHeader = (worksheet, title, startDate = null, endDate = null) => {
  worksheet.addRow([title]);

  if (startDate && endDate) {
    worksheet.addRow([
      `${i18n.t('common:excelPeriod')} ${new Date(startDate).toLocaleDateString(getLocale())} - ${new Date(endDate).toLocaleDateString(getLocale())}`
    ]);
  } else {
    worksheet.addRow([`${i18n.t('common:excelExportDate')} ${new Date().toLocaleDateString(getLocale())}`]);
  }

  worksheet.addRow([]);
};

export const addColumnHeaders = (worksheet, headers) => {
  return worksheet.addRow(headers);
};

export const setColumnWidths = (worksheet, widths) => {
  worksheet.columns = widths.map(width => ({ width }));
};

export const hideGridLines = (worksheet) => {
  worksheet.views = [{ showGridLines: false }];
};

export const setRowHeight = (worksheet, rowNumber, height) => {
  worksheet.getRow(rowNumber).height = height;
};

export const downloadWorkbook = async (workbook, fileName) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const calculateProjectMetrics = (project) => {
  const totalBudget = project.tasks.reduce((sum, task) => sum + (task.budget || 0), 0);
  const totalActual = project.tasks.reduce((sum, task) => sum + (task.actual || 0), 0);
  const totalEtc = project.tasks.reduce((sum, task) => sum + (task.etc || 0), 0);
  const totalEac = project.tasks.reduce((sum, task) => sum + (task.eac || 0), 0);
  const variance = totalBudget - totalEac;

  const avgProgress = totalEac > 0 ? Math.round((totalActual / totalEac) * 100) : 0;

  return {
    budget: formatHours(totalBudget),
    actual: formatHours(totalActual),
    etc: formatHours(totalEtc),
    eac: formatHours(totalEac),
    delta: formatHours(variance),
    progress: avgProgress
  };
};

export const calculateGrandTotals = (projects) => {
  const allTasks = projects.flatMap(p => p.tasks);
  const totalBudget = allTasks.reduce((sum, task) => sum + (task.budget || 0), 0);
  const totalActual = allTasks.reduce((sum, task) => sum + (task.actual || 0), 0);
  const totalEtc = allTasks.reduce((sum, task) => sum + (task.etc || 0), 0);
  const totalEac = allTasks.reduce((sum, task) => sum + (task.eac || 0), 0);
  const variance = totalBudget - totalEac;

  const avgProgress = totalEac > 0 ? Math.round((totalActual / totalEac) * 100) : 0;

  return {
    budget: formatHours(totalBudget),
    actual: formatHours(totalActual),
    etc: formatHours(totalEtc),
    eac: formatHours(totalEac),
    delta: formatHours(variance),
    progress: avgProgress
  };
};

export const calculateProjectTimesheetTotals = (project, dateRange) => {
  const budget = project.tasks.reduce((sum, t) => sum + (t.budget || 0), 0);
  const actual = project.tasks.reduce((sum, t) =>
    sum + ((t.total_hours_worked || 0) + (t.initial_actual || 0)), 0);
  const etc = project.tasks.reduce((sum, t) => sum + (t.etc || 0), 0);
  const eac = actual + etc;
  const delta = budget - eac;

  const dateHours = {};
  let periodTotal = 0;

  dateRange.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    let dayTotal = 0;
    project.tasks.forEach(task => {
      const ts = task.timesheets?.find(t => t.work_date.split('T')[0] === dateStr);
      if (ts) dayTotal += ts.hours_worked;
    });
    dateHours[dateStr] = dayTotal;
    periodTotal += dayTotal;
  });

  return {
    budget: formatHours(budget),
    actual: formatHours(actual),
    etc: formatHours(etc),
    eac: formatHours(eac),
    delta: formatHours(delta),
    periodTotal: periodTotal.toFixed(1),
    dateHours
  };
};

export const calculateGrandTimesheetTotals = (projects, dateRange) => {
  const allTasks = projects.flatMap(p => p.tasks);
  const budget = allTasks.reduce((sum, t) => sum + (t.budget || 0), 0);
  const actual = allTasks.reduce((sum, t) =>
    sum + ((t.total_hours_worked || 0) + (t.initial_actual || 0)), 0);
  const etc = allTasks.reduce((sum, t) => sum + (t.etc || 0), 0);
  const eac = actual + etc;
  const delta = budget - eac;

  const dateHours = {};
  let periodTotal = 0;

  dateRange.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    let dayTotal = 0;
    allTasks.forEach(task => {
      const ts = task.timesheets?.find(t => t.work_date.split('T')[0] === dateStr);
      if (ts) dayTotal += ts.hours_worked;
    });
    dateHours[dateStr] = dayTotal;
    periodTotal += dayTotal;
  });

  return {
    budget: formatHours(budget),
    actual: formatHours(actual),
    etc: formatHours(etc),
    eac: formatHours(eac),
    delta: formatHours(delta),
    periodTotal: periodTotal.toFixed(1),
    dateHours
  };
};
