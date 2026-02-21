import {
  createConfiguredWorkbook,
  addMainHeader,
  addColumnHeaders,
  setColumnWidths,
  hideGridLines,
  downloadWorkbook,
  calculateProjectMetrics,
  calculateGrandTotals
} from '../excelBuilder.js';

import { getLocale } from '../../../date/dateUtils';
import i18n from '../../../../i18n/i18n';
import {
  formatHeaderCell,
  formatTotalRow,
  formatProjectRow,
  formatTaskRow,
  formatHours,
  getStatusLabel
} from '../excelFormatter.js';

export const exportPianificazioneToExcel = async (projects, startDate = null, endDate = null) => {
  const t = (key) => i18n.t(key);
  const sheetName = t('planning:excelSheetName');
  const { workbook, worksheet } = await createConfiguredWorkbook(sheetName);

  addMainHeader(worksheet, sheetName, startDate, endDate);

  const headerRow = addColumnHeaders(worksheet, [
    t('planning:excelProject'),
    t('planning:excelActivity'),
    t('planning:excelExternalKey'),
    t('planning:excelStatus'),
    t('planning:excelUser'),
    t('planning:excelProgress'),
    'Budget (h)',
    'Actual (h)',
    'ETC (h)',
    'EAC (h)',
    'Delta (h)',
    t('planning:excelStartDate'),
    t('planning:excelEndDate')
  ]);

  headerRow.eachCell((cell) => {
    formatHeaderCell(cell);
  });

  const grandTotals = calculateGrandTotals(projects);
  const totalRow = worksheet.addRow([
    t('planning:excelGrandTotal'),
    '',
    '',
    '',
    '',
    grandTotals.progress,
    grandTotals.budget,
    grandTotals.actual,
    grandTotals.etc,
    grandTotals.eac,
    grandTotals.delta,
    '',
    ''
  ]);
  formatTotalRow(totalRow, grandTotals);

  projects.forEach(project => {
    const projectName = `${project.project_key} - ${project.title}`;

    let filteredTasks = project.tasks;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      filteredTasks = project.tasks.filter(task => {
        if (!task.start_date && !task.end_date) return true;

        const taskStart = task.start_date ? new Date(task.start_date) : null;
        const taskEnd = task.end_date ? new Date(task.end_date) : null;

        if (taskStart && taskEnd) {
          return taskStart <= end && taskEnd >= start;
        } else if (taskStart) {
          return taskStart <= end;
        } else if (taskEnd) {
          return taskEnd >= start;
        }
        return true;
      });
    }

    const projectMetrics = calculateProjectMetrics({ ...project, tasks: filteredTasks });
    const projectRow = worksheet.addRow([
      projectName,
      t('planning:excelProjectTotal'),
      '',
      '',
      '',
      projectMetrics.progress,
      projectMetrics.budget,
      projectMetrics.actual,
      projectMetrics.etc,
      projectMetrics.eac,
      projectMetrics.delta,
      '',
      ''
    ]);
    formatProjectRow(projectRow, projectMetrics);

    filteredTasks.forEach(task => {
      const taskDelta = formatHours(task.budget - task.eac);
      const taskRow = worksheet.addRow([
        projectName,
        task.title,
        task.external_key || '',
        getStatusLabel(task.task_status_id),
        task.owner_name || t('planning:excelNotAssigned'),
        Math.round(task.progress),
        formatHours(task.budget),
        formatHours(task.actual),
        formatHours(task.etc),
        formatHours(task.eac),
        taskDelta,
        task.start_date ? new Date(task.start_date).toLocaleDateString(getLocale()) : '',
        task.end_date ? new Date(task.end_date).toLocaleDateString(getLocale()) : ''
      ]);
      formatTaskRow(taskRow, taskDelta);
    });
  });

  setColumnWidths(worksheet, [
    35,
    40,
    20,
    12,
    20,
    12,
    12,
    12,
    12,
    12,
    12,
    13,
    13
  ]);
  hideGridLines(worksheet);

  const fileName = startDate && endDate
    ? `work_plan_${startDate}_${endDate}.xlsx`
    : `work_plan_${new Date().toISOString().split('T')[0]}.xlsx`;

  await downloadWorkbook(workbook, fileName);
};
