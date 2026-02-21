import {
  createConfiguredWorkbook,
  addMainHeader,
  addColumnHeaders,
  setColumnWidths,
  hideGridLines,
  downloadWorkbook,
} from '../excelBuilder.js';

import {
  formatHeaderCell,
  createSolidFill,
  formatHours
} from '../excelFormatter.js';

import {
  EXCEL_COLORS,
  BORDER_FULL_THIN,
  BORDER_FULL_GRAY,
  ALIGNMENTS,
  NUMBER_FORMATS,
  FONTS
} from '../excelStyles.js';

export const exportEstimateToExcel = async (estimate, clientName, projectKey) => {
  const { workbook, worksheet } = await createConfiguredWorkbook('Voci di Stima');

  worksheet.addRow([`Stima: ${estimate.title || 'Senza titolo'}`]);
  worksheet.addRow([`Cliente: ${clientName || 'N/A'} | Progetto: ${projectKey || 'N/A'}`]);
  if (estimate.description) {
    worksheet.addRow([`Descrizione: ${estimate.description}`]);
  }
  worksheet.addRow([]);

  const headers = [
    'Voce di Stima',
    'Dettaglio',
    `Analisi\n${parseFloat(estimate.pct_analysis || 0).toFixed(1)}%`,
    `Sviluppo\n${parseFloat(estimate.pct_development || 0).toFixed(1)}%`,
    `Test Tecnico\n${parseFloat(estimate.pct_internal_test || 0).toFixed(1)}%`,
    `UAT\n${parseFloat(estimate.pct_uat || 0).toFixed(1)}%`,
    `Rilascio\n${parseFloat(estimate.pct_release || 0).toFixed(1)}%`,
    `PM\n${parseFloat(estimate.pct_pm || 0).toFixed(1)}%`,
    `Post Avvio\n${parseFloat(estimate.pct_startup || 0).toFixed(1)}%`,
    `Documentaz.\n${parseFloat(estimate.pct_documentation || 0).toFixed(1)}%`,
    `Contingency\n${parseFloat(estimate.contingency_percentage || 0).toFixed(1)}%`,
    'Totale'
  ];

  const headerRow = worksheet.addRow(headers);

  headerRow.eachCell((cell, colNumber) => {
    formatHeaderCell(cell, {
      alignment: colNumber <= 2 ? ALIGNMENTS.centerMiddle : ALIGNMENTS.centerMiddle,
      fontSize: 10
    });
    cell.alignment = {
      ...cell.alignment,
      wrapText: true
    };
  });

  const tasks = estimate.tasks || [];

  tasks.forEach((task) => {
    const phaseHours = {
      hours_analysis: parseFloat(task.hours_analysis) || 0,
      hours_development: parseFloat(task.hours_development) || 0,
      hours_internal_test: parseFloat(task.hours_internal_test) || 0,
      hours_uat: parseFloat(task.hours_uat) || 0,
      hours_release: parseFloat(task.hours_release) || 0,
      hours_pm: parseFloat(task.hours_pm) || 0,
      hours_startup: parseFloat(task.hours_startup) || 0,
      hours_documentation: parseFloat(task.hours_documentation) || 0,
    };

    const total = Object.values(phaseHours).reduce((sum, val) => sum + val, 0);
    const contingency = task.hours_contingency !== undefined
      ? parseFloat(task.hours_contingency) || 0
      : Math.round((total * (estimate.contingency_percentage || 0)) / 100);
    const totalWithContingency = total + contingency;

    const rowData = [
      task.activity_name || '',
      task.activity_detail || '',
      Math.round(phaseHours.hours_analysis),
      Math.round(phaseHours.hours_development),
      Math.round(phaseHours.hours_internal_test),
      Math.round(phaseHours.hours_uat),
      Math.round(phaseHours.hours_release),
      Math.round(phaseHours.hours_pm),
      Math.round(phaseHours.hours_startup),
      Math.round(phaseHours.hours_documentation),
      Math.round(contingency),
      Math.round(totalWithContingency)
    ];

    const row = worksheet.addRow(rowData);

    row.eachCell((cell, colNumber) => {
      cell.font = FONTS.normal;
      cell.border = BORDER_FULL_GRAY;

      if (colNumber === 1 || colNumber === 2) {
        cell.alignment = {
          ...ALIGNMENTS.leftMiddle,
          wrapText: true
        };
      } else if (colNumber === 12) {
        cell.alignment = ALIGNMENTS.rightMiddle;
        cell.font = { ...FONTS.bold, color: { argb: EXCEL_COLORS.cyanDark } };
        cell.numFmt = NUMBER_FORMATS.integer;
      } else {
        cell.alignment = ALIGNMENTS.rightMiddle;
        cell.numFmt = NUMBER_FORMATS.integer;
      }
    });
  });

  if (tasks.length > 0) {
    let totalAnalysis = 0;
    let totalDevelopment = 0;
    let totalInternalTest = 0;
    let totalUat = 0;
    let totalRelease = 0;
    let totalPm = 0;
    let totalStartup = 0;
    let totalDocumentation = 0;
    let totalContingency = 0;

    tasks.forEach((task) => {
      totalAnalysis += parseFloat(task.hours_analysis) || 0;
      totalDevelopment += parseFloat(task.hours_development) || 0;
      totalInternalTest += parseFloat(task.hours_internal_test) || 0;
      totalUat += parseFloat(task.hours_uat) || 0;
      totalRelease += parseFloat(task.hours_release) || 0;
      totalPm += parseFloat(task.hours_pm) || 0;
      totalStartup += parseFloat(task.hours_startup) || 0;
      totalDocumentation += parseFloat(task.hours_documentation) || 0;

      const phaseTotal =
        (parseFloat(task.hours_analysis) || 0) +
        (parseFloat(task.hours_development) || 0) +
        (parseFloat(task.hours_internal_test) || 0) +
        (parseFloat(task.hours_uat) || 0) +
        (parseFloat(task.hours_release) || 0) +
        (parseFloat(task.hours_pm) || 0) +
        (parseFloat(task.hours_startup) || 0) +
        (parseFloat(task.hours_documentation) || 0);

      const contingency = task.hours_contingency !== undefined
        ? parseFloat(task.hours_contingency) || 0
        : Math.round((phaseTotal * (estimate.contingency_percentage || 0)) / 100);

      totalContingency += contingency;
    });

    const grandTotal =
      totalAnalysis +
      totalDevelopment +
      totalInternalTest +
      totalUat +
      totalRelease +
      totalPm +
      totalStartup +
      totalDocumentation +
      totalContingency;

    const totalRowData = [
      'TOTALE',
      '',
      Math.round(totalAnalysis),
      Math.round(totalDevelopment),
      Math.round(totalInternalTest),
      Math.round(totalUat),
      Math.round(totalRelease),
      Math.round(totalPm),
      Math.round(totalStartup),
      Math.round(totalDocumentation),
      Math.round(totalContingency),
      Math.round(grandTotal)
    ];

    const totalRow = worksheet.addRow(totalRowData);

    totalRow.eachCell((cell) => {
      cell.fill = createSolidFill(EXCEL_COLORS.cyanHeader);
      cell.font = FONTS.headerBold;
      cell.border = BORDER_FULL_THIN;

      if (cell.col === 1 || cell.col === 2) {
        cell.alignment = ALIGNMENTS.leftMiddle;
      } else {
        cell.alignment = ALIGNMENTS.rightMiddle;
        cell.numFmt = NUMBER_FORMATS.integer;
      }
    });

    const manDays = grandTotal / 8;
    const manDaysRow = worksheet.addRow([
      'TOTALE GIORNI UOMO',
      '',
      '', '', '', '', '', '', '', '', '',
      manDays.toFixed(1)
    ]);

    manDaysRow.eachCell((cell) => {
      cell.fill = createSolidFill(EXCEL_COLORS.cyanLight);
      cell.font = { ...FONTS.sectionBold, color: { argb: EXCEL_COLORS.cyanDark } };
      cell.border = BORDER_FULL_THIN;

      if (cell.col === 1 || cell.col === 2) {
        cell.alignment = ALIGNMENTS.leftMiddle;
      } else if (cell.col === 12) {
        cell.alignment = ALIGNMENTS.rightMiddle;
        cell.numFmt = NUMBER_FORMATS.oneDecimal;
      }
    });
  }

  setColumnWidths(worksheet, [
    50,
    50,
    10,
    10,
    11,
    8,
    10,
    8,
    10,
    12,
    12,
    10
  ]);

  const headerRowNumber = estimate.description ? 5 : 4;
  worksheet.getRow(headerRowNumber).height = 45;

  hideGridLines(worksheet);

  const fileName = `estimate_${projectKey || estimate.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};
