export const EXCEL_COLORS = {
  cyanHeader: 'FF0891B2',
  cyanLight: 'FFCFFAFE',
  cyanMedium: 'FFA5F3FC',
  cyanDark: 'FF164E63',

  white: 'FFFFFFFF',

  greenLight: 'FFDCFCE7',
  greenDark: 'FF166534',
  greenStrong: 'FF16A34A',

  redLight: 'FFFEE2E2',
  redDark: 'FF991B1B',
  redStrong: 'FFDC2626',

  gray100: 'FFF3F4F6',
  gray300: 'FFD1D5DB',
  gray700: 'FF374151'
};

export const BORDERS = {
  thin: { style: 'thin' },
  thinGray: { style: 'thin', color: { argb: EXCEL_COLORS.gray300 } }
};

export const BORDER_FULL_THIN = {
  top: BORDERS.thin,
  bottom: BORDERS.thin,
  left: BORDERS.thin,
  right: BORDERS.thin
};

export const BORDER_FULL_GRAY = {
  top: BORDERS.thinGray,
  bottom: BORDERS.thinGray,
  left: BORDERS.thinGray,
  right: BORDERS.thinGray
};

export const ALIGNMENTS = {
  centerMiddle: { horizontal: 'center', vertical: 'middle' },
  leftMiddle: { horizontal: 'left', vertical: 'middle' },
  rightMiddle: { horizontal: 'right', vertical: 'middle' },
  centerVertical: { horizontal: 'center', vertical: 'middle', textRotation: 90 }
};

export const NUMBER_FORMATS = {
  percentage: '0"%"',
  oneDecimal: '0.0',
  integer: '0'
};

export const FONTS = {
  headerBold: { bold: true, color: { argb: EXCEL_COLORS.white }, size: 11 },
  headerBoldSmall: { bold: true, color: { argb: EXCEL_COLORS.white }, size: 10 },
  sectionBold: { bold: true, color: { argb: EXCEL_COLORS.cyanDark }, size: 10 },
  bold: { bold: true, size: 10 },
  normal: { size: 10 },
  small: { size: 9 }
};
