import {
  createConfiguredWorkbook,
  addMainHeader,
  addColumnHeaders,
  setColumnWidths,
  setRowHeight,
  hideGridLines,
  downloadWorkbook,
  calculateProjectTimesheetTotals,
  calculateGrandTimesheetTotals
} from '../excelBuilder.js';

import { getLocale } from '../../../date/dateUtils';
import i18n from '../../../../i18n/i18n';
import {
  formatTimesheetHeaderRow,
  formatTimesheetTotalRow,
  formatTimesheetProjectRow,
  formatTimesheetTaskRow
} from '../excelFormatter.js';

import { generateDateRange } from '../excelDateUtils.js';

export const exportTimesheetToExcel = async (projects, startDate, endDate, holidays = []) => {
  const t = (key) => i18n.t(key);
  const sheetName = t('timesheet:excelSheetName');
  const { workbook, worksheet } = await createConfiguredWorkbook(sheetName);

  addMainHeader(worksheet, sheetName, startDate, endDate);

  const dateRange = generateDateRange(startDate, endDate);

  const headerRow = addColumnHeaders(worksheet, [
    t('timesheet:excelProject'),
    t('timesheet:excelActivity'),
    t('timesheet:excelPeriodTotal'),
    ...dateRange.map(d => d.toLocaleDateString(getLocale()))
  ]);

  formatTimesheetHeaderRow(headerRow, dateRange);

  const grandTotals = calculateGrandTimesheetTotals(projects, dateRange);
  const totalRowData = [
    t('timesheet:excelGrandTotal'),
    '',
    grandTotals.periodTotal
  ];
  dateRange.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    const hours = grandTotals.dateHours[dateStr] || 0;
    totalRowData.push(hours > 0 ? hours : '');
  });

  const totalRow = worksheet.addRow(totalRowData);
  formatTimesheetTotalRow(totalRow);

  projects.forEach(project => {
    const projectName = `${project.project_key || 'N/A'} - ${project.project_title || t('timesheet:excelNoProjectName')}`;
    const projectTotals = calculateProjectTimesheetTotals(project, dateRange);

    const projectRowData = [
      projectName,
      t('timesheet:excelProjectTotal'),
      projectTotals.periodTotal
    ];
    dateRange.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const hours = projectTotals.dateHours[dateStr] || 0;
      projectRowData.push(hours > 0 ? hours : '');
    });

    const projectRow = worksheet.addRow(projectRowData);
    formatTimesheetProjectRow(projectRow);

    project.tasks.forEach(task => {
      let periodTotal = 0;

      const taskRowData = [
        projectName,
        task.task_title || t('timesheet:excelNoActivityName'),
        ''
      ];

      dateRange.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const ts = task.timesheets?.find(t => t.work_date.split('T')[0] === dateStr);
        const hours = ts ? ts.hours_worked : 0;
        periodTotal += hours;
        taskRowData.push(hours > 0 ? hours : '');
      });

      taskRowData[2] = periodTotal;
      const taskRow = worksheet.addRow(taskRowData);
      formatTimesheetTaskRow(taskRow, dateRange, holidays);
    });
  });

  setColumnWidths(worksheet, [
    35,
    40,
    14,
    ...dateRange.map(() => 5)
  ]);

  setRowHeight(worksheet, 4, 80);

  hideGridLines(worksheet);

  const fileName = `timesheets_${startDate}_${endDate}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};
