import {
  createConfiguredWorkbook,
  addMainHeader,
  addColumnHeaders,
  setColumnWidths,
  setRowHeight,
  hideGridLines,
  downloadWorkbook
} from '../excelBuilder.js';

import {
  formatHeaderCell,
  formatTimeOffSectionHeader,
  formatTimeOffUserRow
} from '../excelFormatter.js';
import { getLocale } from '../../../date/dateUtils';
import i18n from '../../../../i18n/i18n';

import { generateDateRange } from '../excelDateUtils.js';
import { formatDateISO } from '../../../date/dateUtils.js';

const addSectionToSheet = (worksheet, users, dateRange, timeOffTypeId, sectionTitle, holidays = []) => {
  const sectionTotalsData = [sectionTitle];
  const sectionGrandTotal = users.reduce((sum, user) => {
    return sum + (user.timeOffs
      ?.filter(to => to.time_off_type_id === timeOffTypeId)
      .reduce((s, to) => s + to.hours, 0) || 0);
  }, 0);
  sectionTotalsData.push(sectionGrandTotal.toFixed(1));

  dateRange.forEach(date => {
    const dateStr = formatDateISO(date);
    const dayTotal = users.reduce((sum, user) => {
      const to = user.timeOffs?.find(
        to => to.time_off_type_id === timeOffTypeId && to.date === dateStr
      );
      return sum + (to ? to.hours : 0);
    }, 0);
    sectionTotalsData.push(dayTotal > 0 ? dayTotal.toFixed(1) : '-');
  });

  const sectionHeaderRow = worksheet.addRow(sectionTotalsData);
  formatTimeOffSectionHeader(sectionHeaderRow);

  users.forEach(user => {
    const rowData = [user.full_name];

    const total = user.timeOffs
      ?.filter(to => to.time_off_type_id === timeOffTypeId)
      .reduce((sum, to) => sum + to.hours, 0) || 0;

    rowData.push(total);

    dateRange.forEach(date => {
      const dateStr = formatDateISO(date);
      const timeOff = user.timeOffs?.find(
        to => to.time_off_type_id === timeOffTypeId && to.date === dateStr
      );
      rowData.push(timeOff ? timeOff.hours : '');
    });

    const userRow = worksheet.addRow(rowData);
    formatTimeOffUserRow(userRow, dateRange, holidays);
  });
};

export const exportTimeOffPlanToExcel = async (vacationUsers, otherUsers, startDate, endDate, holidays = []) => {
  const t = (key) => i18n.t(key);
  const sheetName = t('timeoffplan:excelSheetName');
  const { workbook, worksheet } = await createConfiguredWorkbook(sheetName);

  addMainHeader(worksheet, sheetName, startDate, endDate);

  const dateRange = generateDateRange(startDate, endDate);

  const mainHeaderRow = addColumnHeaders(worksheet, [
    t('timeoffplan:excelUser'),
    t('timeoffplan:excelTotal'),
    ...dateRange.map(d => d.toLocaleDateString(getLocale()))
  ]);

  mainHeaderRow.eachCell((cell, colNumber) => {
    formatHeaderCell(cell, {
      alignment: colNumber <= 2 ? undefined : null,
      isVertical: colNumber > 2,
      fontSize: 10
    });
  });

  addSectionToSheet(worksheet, vacationUsers, dateRange, 'VACATION', t('timeoffplan:excelVacation'), holidays);

  worksheet.addRow([]);

  addSectionToSheet(worksheet, otherUsers, dateRange, 'OTHER', t('timeoffplan:excelOther'), holidays);

  setColumnWidths(worksheet, [
    30,
    10,
    ...dateRange.map(() => 5)
  ]);

  setRowHeight(worksheet, 4, 80);

  hideGridLines(worksheet);

  const fileName = `timeoff_plan_${startDate}_${endDate}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};
