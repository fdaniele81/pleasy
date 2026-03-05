import {
  createConfiguredWorkbook,
  addMainHeader,
  addColumnHeaders,
  setColumnWidths,
  hideGridLines,
  downloadWorkbook
} from '../excelBuilder.js';
import { getLocale } from '../../../date/dateUtils';

import {
  formatHeaderCell,
  createSolidFill,
} from '../excelFormatter.js';

import {
  EXCEL_COLORS,
  BORDER_FULL_THIN,
  BORDER_FULL_GRAY,
  ALIGNMENTS,
  NUMBER_FORMATS,
} from '../excelStyles.js';

import i18n from '../../../../i18n/i18n';

export const exportTaskHistoryToExcel = async (entries, taskInfo, startDate, endDate) => {
  const t = (key) => i18n.t(key);

  const isTM = taskInfo?.project_type_id === 'TM';
  const taskLabel = isTM
    ? taskInfo.client_name
    : `${taskInfo.client_key}.${taskInfo.project_key}.${taskInfo.task_number}`;
  const sheetTitle = `${t('timesheet:taskHistory')} - ${taskLabel}`;

  const { workbook, worksheet } = await createConfiguredWorkbook(t('timesheet:taskHistory'));

  addMainHeader(worksheet, sheetTitle, startDate, endDate);

  // Monthly summary
  const summaryHeaderRow = worksheet.addRow([t('timesheet:excelMonthlySummary')]);
  summaryHeaderRow.getCell(1).fill = createSolidFill(EXCEL_COLORS.cyanHeader);
  summaryHeaderRow.getCell(1).font = { bold: true, color: { argb: EXCEL_COLORS.white }, size: 12 };

  const monthlyHeaderRow = addColumnHeaders(worksheet, [t('timesheet:excelMonth'), t('timesheet:excelHours')]);
  monthlyHeaderRow.eachCell((cell) => {
    formatHeaderCell(cell, { fontSize: 10 });
    cell.fill = createSolidFill(EXCEL_COLORS.cyanHeader);
  });

  const monthlyData = {};
  const filteredEntries = entries.filter(e => {
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });

  filteredEntries.forEach(entry => {
    const monthKey = entry.date.substring(0, 7);
    if (!monthlyData[monthKey]) {
      const [year, month] = monthKey.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      monthlyData[monthKey] = {
        label: d.toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' }),
        hours: 0
      };
    }
    monthlyData[monthKey].hours += entry.hours;
  });

  let totalHours = 0;
  Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([, data]) => {
      const row = worksheet.addRow([data.label, data.hours > 0 ? data.hours : '']);
      totalHours += data.hours;

      row.eachCell((cell, colNumber) => {
        cell.border = BORDER_FULL_GRAY;
        if (colNumber === 1) {
          cell.alignment = ALIGNMENTS.leftMiddle;
          cell.font = { size: 10, bold: data.hours > 0 };
          if (data.hours > 0) {
            cell.fill = createSolidFill(EXCEL_COLORS.cyanLight);
          }
        } else {
          cell.alignment = ALIGNMENTS.centerMiddle;
          cell.font = { size: 10, bold: data.hours > 0, color: data.hours > 0 ? { argb: EXCEL_COLORS.cyanDark } : undefined };
          if (data.hours > 0) {
            cell.numFmt = NUMBER_FORMATS.oneDecimal;
            cell.fill = createSolidFill(EXCEL_COLORS.cyanLight);
          }
        }
      });
    });

  const totalRow = worksheet.addRow([t('timesheet:excelTotal'), totalHours]);
  totalRow.eachCell((cell, colNumber) => {
    cell.fill = createSolidFill(EXCEL_COLORS.cyanHeader);
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

  // Detail section
  const detailHeaderRow = worksheet.addRow([t('timesheet:excelDailyDetail')]);
  detailHeaderRow.getCell(1).fill = createSolidFill(EXCEL_COLORS.cyanHeader);
  detailHeaderRow.getCell(1).font = { bold: true, color: { argb: EXCEL_COLORS.white }, size: 12 };

  const detailColHeaderRow = addColumnHeaders(worksheet, [
    t('timesheet:excelDate'),
    t('timesheet:excelHours'),
    t('timesheet:excelNotes'),
    t('timesheet:taskHistoryStatus')
  ]);
  detailColHeaderRow.eachCell((cell) => {
    formatHeaderCell(cell, { fontSize: 10 });
    cell.fill = createSolidFill(EXCEL_COLORS.cyanHeader);
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => a.date.localeCompare(b.date));

  sortedEntries.forEach(entry => {
    const entryDate = new Date(entry.date);
    const formattedDate = entryDate.toLocaleDateString(getLocale(), {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const statusLabel = entry.is_submitted
      ? t('timesheet:taskHistorySubmitted')
      : t('timesheet:taskHistoryNotSubmitted');

    const row = worksheet.addRow([formattedDate, entry.hours, entry.details || '', statusLabel]);
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_FULL_GRAY;
      cell.fill = createSolidFill(EXCEL_COLORS.cyanLight);
      cell.font = { size: 10 };

      if (colNumber === 1) {
        cell.alignment = ALIGNMENTS.leftMiddle;
      } else if (colNumber === 2) {
        cell.alignment = ALIGNMENTS.centerMiddle;
        cell.numFmt = NUMBER_FORMATS.oneDecimal;
        cell.font = { size: 10, bold: true, color: { argb: EXCEL_COLORS.cyanDark } };
      } else if (colNumber === 3) {
        cell.alignment = { ...ALIGNMENTS.leftMiddle, wrapText: true };
      } else {
        cell.alignment = ALIGNMENTS.centerMiddle;
        cell.font = {
          size: 10,
          color: { argb: entry.is_submitted ? EXCEL_COLORS.greenDark : 'FFCA8A04' }
        };
      }
    });
  });

  if (sortedEntries.length === 0) {
    const emptyRow = worksheet.addRow([t('timesheet:excelNoData'), '', '', '']);
    emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF9CA3AF' } };
  }

  setColumnWidths(worksheet, [30, 10, 50, 20]);
  hideGridLines(worksheet);

  const safeLabel = taskLabel.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `task_history_${safeLabel}_${startDate || 'all'}_${endDate || 'all'}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};
