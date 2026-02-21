import {
  createConfiguredWorkbook,
  addMainHeader,
  addColumnHeaders,
  setColumnWidths,
  setRowHeight,
  hideGridLines,
  downloadWorkbook
} from '../excelBuilder.js';
import { getLocale } from '../../../date/dateUtils';

import {
  formatHeaderCell,
  createSolidFill,
  formatDateCell
} from '../excelFormatter.js';

import {
  EXCEL_COLORS,
  BORDER_FULL_THIN,
  BORDER_FULL_GRAY,
  ALIGNMENTS,
  NUMBER_FORMATS,
  FONTS
} from '../excelStyles.js';

import { generateDateRange } from '../excelDateUtils.js';
import i18n from '../../../../i18n/i18n';

export const exportUserTimeOffToExcel = async (timeOffs, timeOffType, startDate, endDate) => {
  const t = (key) => i18n.t(key);

  const typeConfig = {
    VACATION: {
      title: t('timesheet:excelVacationTitle'),
      sheetName: t('timesheet:excelVacationSheet'),
      color: EXCEL_COLORS.cyanHeader,
      lightColor: EXCEL_COLORS.cyanLight,
      darkColor: EXCEL_COLORS.cyanDark
    },
    OTHER: {
      title: t('timesheet:excelOtherTitle'),
      sheetName: t('timesheet:excelOtherSheet'),
      color: EXCEL_COLORS.cyanHeader,
      lightColor: EXCEL_COLORS.cyanLight,
      darkColor: EXCEL_COLORS.cyanDark
    }
  };

  const config = typeConfig[timeOffType] || typeConfig.VACATION;

  const { workbook, worksheet } = await createConfiguredWorkbook(config.sheetName);

  addMainHeader(worksheet, config.title, startDate, endDate);

  const dateRange = generateDateRange(startDate, endDate);

  const monthlyData = {};
  const start = new Date(startDate);
  const end = new Date(endDate);

  const currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  while (currentMonth <= end) {
    const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = {
      label: currentMonth.toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' }),
      hours: 0,
      entries: []
    };
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  timeOffs.forEach(to => {
    const monthKey = to.date.substring(0, 7);
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].hours += to.hours;
      monthlyData[monthKey].entries.push({
        date: to.date,
        hours: to.hours,
        details: to.details
      });
    }
  });

  const summaryHeaderRow = worksheet.addRow([t('timesheet:excelMonthlySummary')]);
  summaryHeaderRow.getCell(1).font = { bold: true, size: 12 };
  summaryHeaderRow.getCell(1).fill = createSolidFill(config.color);
  summaryHeaderRow.getCell(1).font = { bold: true, color: { argb: EXCEL_COLORS.white }, size: 12 };

  const monthlyHeaderRow = addColumnHeaders(worksheet, [t('timesheet:excelMonth'), t('timesheet:excelHours')]);
  monthlyHeaderRow.eachCell((cell) => {
    formatHeaderCell(cell, { fontSize: 10 });
    cell.fill = createSolidFill(config.color);
  });

  let totalHours = 0;
  Object.entries(monthlyData).forEach(([, data]) => {
    const row = worksheet.addRow([data.label, data.hours > 0 ? data.hours : '']);
    totalHours += data.hours;

    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_FULL_GRAY;
      if (colNumber === 1) {
        cell.alignment = ALIGNMENTS.leftMiddle;
        cell.font = { size: 10, bold: data.hours > 0 };
        if (data.hours > 0) {
          cell.fill = createSolidFill(config.lightColor);
        }
      } else {
        cell.alignment = ALIGNMENTS.centerMiddle;
        cell.font = { size: 10, bold: data.hours > 0, color: data.hours > 0 ? { argb: config.darkColor } : undefined };
        if (data.hours > 0) {
          cell.numFmt = NUMBER_FORMATS.oneDecimal;
          cell.fill = createSolidFill(config.lightColor);
        }
      }
    });
  });

  const totalRow = worksheet.addRow([t('timesheet:excelTotal'), totalHours]);
  totalRow.eachCell((cell, colNumber) => {
    cell.fill = createSolidFill(config.color);
    cell.font = { bold: true, color: { argb: EXCEL_COLORS.white }, size: 10 };
    cell.border = BORDER_FULL_THIN;
    if (colNumber === 1) {
      cell.alignment = ALIGNMENTS.leftMiddle;
    } else {
      cell.alignment = ALIGNMENTS.centerMiddle;
      cell.numFmt = NUMBER_FORMATS.oneDecimal;
    }
  });

  worksheet.addRow([]);

  const detailHeaderRow = worksheet.addRow([t('timesheet:excelDailyDetail')]);
  detailHeaderRow.getCell(1).fill = createSolidFill(config.color);
  detailHeaderRow.getCell(1).font = { bold: true, color: { argb: EXCEL_COLORS.white }, size: 12 };

  const detailColHeaderRow = addColumnHeaders(worksheet, [t('timesheet:excelDate'), t('timesheet:excelHours'), t('timesheet:excelNotes')]);
  detailColHeaderRow.eachCell((cell) => {
    formatHeaderCell(cell, { fontSize: 10 });
    cell.fill = createSolidFill(config.color);
  });

  const allEntries = timeOffs
    .map(to => ({
      date: to.date,
      hours: to.hours,
      details: to.details || ''
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  allEntries.forEach(entry => {
    const entryDate = new Date(entry.date);
    const formattedDate = entryDate.toLocaleDateString(getLocale(), {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const row = worksheet.addRow([formattedDate, entry.hours, entry.details]);
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_FULL_GRAY;
      cell.fill = createSolidFill(config.lightColor);
      cell.font = { size: 10 };

      if (colNumber === 1) {
        cell.alignment = ALIGNMENTS.leftMiddle;
      } else if (colNumber === 2) {
        cell.alignment = ALIGNMENTS.centerMiddle;
        cell.numFmt = NUMBER_FORMATS.oneDecimal;
        cell.font = { size: 10, bold: true, color: { argb: config.darkColor } };
      } else {
        cell.alignment = { ...ALIGNMENTS.leftMiddle, wrapText: true };
      }
    });
  });

  if (allEntries.length === 0) {
    const emptyRow = worksheet.addRow([t('timesheet:excelNoData'), '', '']);
    emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF9CA3AF' } };
  }

  setColumnWidths(worksheet, [30, 10, 50]);
  hideGridLines(worksheet);

  const typeLabel = timeOffType === 'VACATION' ? 'vacation' : 'other';
  const fileName = `timeoff_${typeLabel}_${startDate}_${endDate}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};
