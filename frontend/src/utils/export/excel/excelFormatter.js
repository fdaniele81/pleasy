import {
  EXCEL_COLORS,
  BORDER_FULL_THIN,
  BORDER_FULL_GRAY,
  ALIGNMENTS,
  NUMBER_FORMATS,
  FONTS
} from './excelStyles.js';
import { isHoliday } from './excelDateUtils.js';
import i18n from '../../../i18n/i18n';

export const createSolidFill = (color) => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: color }
});

export const formatHours = (hours) => {
  return Math.round((hours || 0) * 10) / 10;
};

export const getStatusLabel = (statusId) => {
  const labels = {
    'NEW': i18n.t('planning:excelStatusNew'),
    'IN PROGRESS': i18n.t('planning:excelStatusInProgress'),
    'DONE': i18n.t('planning:excelStatusDone')
  };
  return labels[statusId] || statusId;
};

export const formatHeaderCell = (cell, options = {}) => {
  const { alignment, isVertical = false, fontSize = 11 } = options;

  cell.fill = createSolidFill(EXCEL_COLORS.cyanHeader);
  cell.font = { bold: true, color: { argb: EXCEL_COLORS.white }, size: fontSize };
  cell.border = BORDER_FULL_THIN;

  if (isVertical) {
    cell.alignment = ALIGNMENTS.centerVertical;
  } else if (alignment) {
    cell.alignment = alignment;
  } else {
    cell.alignment = ALIGNMENTS.centerMiddle;
  }
};

const applyColumnAlignment = (cell, colNumber) => {
  if (colNumber === 4 || colNumber === 5) {
    cell.alignment = ALIGNMENTS.centerMiddle;
  } else if (colNumber === 6) {
    cell.alignment = ALIGNMENTS.centerMiddle;
    cell.numFmt = NUMBER_FORMATS.percentage;
  } else if (colNumber >= 7 && colNumber <= 11) {
    cell.alignment = ALIGNMENTS.rightMiddle;
    cell.numFmt = NUMBER_FORMATS.oneDecimal;
  } else if (colNumber === 12 || colNumber === 13) {
    cell.alignment = ALIGNMENTS.centerMiddle;
  } else {
    cell.alignment = ALIGNMENTS.leftMiddle;
  }
};

export const formatTotalRow = (row, grandTotals) => {
  row.eachCell((cell, colNumber) => {
    const deltaColor = parseFloat(grandTotals.delta) >= 0
      ? EXCEL_COLORS.greenStrong
      : EXCEL_COLORS.redStrong;

    cell.fill = createSolidFill(
      colNumber === 11 ? deltaColor : EXCEL_COLORS.cyanHeader
    );
    cell.font = FONTS.headerBold;

    applyColumnAlignment(cell, colNumber);

    cell.border = BORDER_FULL_THIN;
  });
};

export const formatProjectRow = (row, projectMetrics) => {
  row.eachCell((cell, colNumber) => {
    const deltaValue = parseFloat(projectMetrics.delta);
    const deltaColor = deltaValue >= 0
      ? EXCEL_COLORS.greenLight
      : EXCEL_COLORS.redLight;
    const deltaTextColor = deltaValue >= 0
      ? EXCEL_COLORS.greenDark
      : EXCEL_COLORS.redDark;

    cell.fill = createSolidFill(
      colNumber === 11 ? deltaColor : EXCEL_COLORS.cyanLight
    );

    cell.font = {
      bold: true,
      color: { argb: colNumber === 11 ? deltaTextColor : EXCEL_COLORS.cyanDark },
      size: 10
    };

    applyColumnAlignment(cell, colNumber);

    cell.border = BORDER_FULL_THIN;
  });
};

export const formatTaskRow = (row, taskDelta) => {
  row.eachCell((cell, colNumber) => {
    const deltaValue = parseFloat(taskDelta);

    cell.font = {
      size: 10,
      bold: colNumber === 11,
      color: colNumber === 11
        ? { argb: deltaValue >= 0 ? EXCEL_COLORS.greenDark : EXCEL_COLORS.redDark }
        : undefined
    };

    applyColumnAlignment(cell, colNumber);

    cell.border = BORDER_FULL_GRAY;
  });
};

export const formatTimesheetHeaderRow = (row, dateRange = []) => {
  row.eachCell((cell, colNumber) => {
    formatHeaderCell(cell, {
      alignment: colNumber <= 3 ? ALIGNMENTS.centerMiddle : undefined,
      isVertical: colNumber > 3,
      fontSize: 10
    });
  });
};

export const formatTimesheetTotalRow = (row) => {
  row.eachCell((cell, colNumber) => {
    cell.fill = createSolidFill(EXCEL_COLORS.cyanHeader);
    cell.font = FONTS.headerBold;

    if (colNumber === 1 || colNumber === 2) {
      cell.alignment = ALIGNMENTS.leftMiddle;
    } else if (colNumber === 3) {
      cell.alignment = ALIGNMENTS.rightMiddle;
      cell.numFmt = NUMBER_FORMATS.oneDecimal;
    } else {
      cell.alignment = ALIGNMENTS.centerMiddle;
      if (cell.value && cell.value > 0) {
        cell.numFmt = NUMBER_FORMATS.oneDecimal;
      }
    }

    cell.border = BORDER_FULL_THIN;
  });
};

export const formatTimesheetProjectRow = (row) => {
  row.eachCell((cell, colNumber) => {
    cell.fill = createSolidFill(EXCEL_COLORS.cyanLight);
    cell.font = FONTS.sectionBold;

    if (colNumber === 1 || colNumber === 2) {
      cell.alignment = ALIGNMENTS.leftMiddle;
    } else if (colNumber === 3) {
      cell.alignment = ALIGNMENTS.rightMiddle;
      cell.numFmt = NUMBER_FORMATS.oneDecimal;
    } else {
      cell.alignment = ALIGNMENTS.centerMiddle;
      if (cell.value && cell.value > 0) {
        cell.numFmt = NUMBER_FORMATS.oneDecimal;
      }
    }

    cell.border = BORDER_FULL_THIN;
  });
};

export const formatDateCell = (cell, date, holidays, value) => {
  const isWeekend = date && (date.getDay() === 0 || date.getDay() === 6);
  const isHolidayDay = date && isHoliday(date, holidays);

  cell.alignment = ALIGNMENTS.centerMiddle;

  if (isWeekend || isHolidayDay) {
    cell.fill = createSolidFill(EXCEL_COLORS.gray100);
  } else if (value && value > 0) {
    cell.fill = createSolidFill(EXCEL_COLORS.cyanLight);
    cell.font = { bold: true, color: { argb: EXCEL_COLORS.cyanDark }, size: 9 };
  }

  if (value && value > 0) {
    cell.numFmt = NUMBER_FORMATS.oneDecimal;
  }
};

export const formatTimesheetTaskRow = (row, dateRange, holidays) => {
  row.eachCell((cell, colNumber) => {
    cell.font = FONTS.normal;

    if (colNumber === 1 || colNumber === 2) {
      cell.alignment = ALIGNMENTS.leftMiddle;
    } else if (colNumber === 3) {
      cell.alignment = ALIGNMENTS.rightMiddle;
      if (cell.value) {
        cell.numFmt = NUMBER_FORMATS.oneDecimal;
      }
    } else {
      const dateIndex = colNumber - 4;
      const date = dateRange[dateIndex];
      formatDateCell(cell, date, holidays, cell.value);
    }

    cell.border = BORDER_FULL_GRAY;
  });
};

export const formatTimeOffSectionHeader = (row) => {
  row.eachCell((cell, colNumber) => {
    cell.fill = createSolidFill(
      colNumber === 2 ? EXCEL_COLORS.cyanMedium : EXCEL_COLORS.cyanLight
    );
    cell.font = FONTS.sectionBold;
    cell.border = BORDER_FULL_THIN;

    if (colNumber === 1) {
      cell.alignment = ALIGNMENTS.leftMiddle;
    } else {
      cell.alignment = ALIGNMENTS.centerMiddle;
      if (cell.value && colNumber > 1 && cell.value !== '-') {
        cell.numFmt = NUMBER_FORMATS.oneDecimal;
      }
    }
  });
};

export const formatTimeOffUserRow = (row, dateRange, holidays) => {
  row.eachCell((cell, colNumber) => {
    cell.border = BORDER_FULL_GRAY;

    if (colNumber === 1) {
      cell.alignment = ALIGNMENTS.leftMiddle;
      cell.font = FONTS.normal;
    } else if (colNumber === 2) {
      cell.alignment = ALIGNMENTS.centerMiddle;
      cell.font = FONTS.bold;
      cell.fill = createSolidFill(EXCEL_COLORS.gray100);
      cell.numFmt = NUMBER_FORMATS.oneDecimal;
    } else {
      const dateIndex = colNumber - 3;
      const date = dateRange[dateIndex];
      formatDateCell(cell, date, holidays, cell.value);
      cell.font = FONTS.small;
    }
  });
};
