import {
  createConfiguredWorkbook,
  addMainHeader,
  addColumnHeaders,
  setColumnWidths,
  setRowHeight,
  hideGridLines,
  downloadWorkbook,
} from '../excelBuilder.js';

import { getLocale } from '../../../date/dateUtils';
import {
  formatTimesheetHeaderRow,
  formatTimesheetTotalRow,
  formatTimesheetProjectRow,
  formatTimesheetTaskRow,
} from '../excelFormatter.js';

import { generateDateRange } from '../excelDateUtils.js';
import i18n from '../../../../i18n/i18n';

const calculateGrandTotals = (tmUsers, dateRange) => {
  const dateHours = {};
  let periodTotal = 0;

  dateRange.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    let dayTotal = 0;

    tmUsers.forEach(user => {
      user.clients?.forEach(client => {
        const ts = client.timesheets?.find(t => t.work_date?.split('T')[0] === dateStr);
        if (ts) dayTotal += ts.hours_worked || 0;
      });
    });

    dateHours[dateStr] = dayTotal;
    periodTotal += dayTotal;
  });

  return { periodTotal: periodTotal.toFixed(1), dateHours };
};

const calculateUserTotals = (user, dateRange) => {
  const dateHours = {};
  let periodTotal = 0;

  dateRange.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    let dayTotal = 0;

    user.clients?.forEach(client => {
      const ts = client.timesheets?.find(t => t.work_date?.split('T')[0] === dateStr);
      if (ts) dayTotal += ts.hours_worked || 0;
    });

    dateHours[dateStr] = dayTotal;
    periodTotal += dayTotal;
  });

  return { periodTotal: periodTotal.toFixed(1), dateHours };
};

const calculateClientTotals = (client, dateRange) => {
  const dateHours = {};
  let periodTotal = 0;

  dateRange.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    let dayTotal = 0;

    client.users?.forEach(user => {
      const ts = user.timesheets?.find(t => t.work_date?.split('T')[0] === dateStr);
      if (ts) dayTotal += ts.hours_worked || 0;
    });

    dateHours[dateStr] = dayTotal;
    periodTotal += dayTotal;
  });

  return { periodTotal: periodTotal.toFixed(1), dateHours };
};

export const exportTMPlanningToExcel = async (tmUsers, startDate, endDate, holidays = [], groupBy = 'user') => {
  const t = (key) => i18n.t(key);
  const sheetName = t('tmplanning:excelSheetName');
  const { workbook, worksheet } = await createConfiguredWorkbook(sheetName);

  addMainHeader(worksheet, sheetName, startDate, endDate);

  const dateRange = generateDateRange(startDate, endDate);

  const headerRow = addColumnHeaders(worksheet, [
    groupBy === 'user' ? t('tmplanning:excelUser') : t('tmplanning:excelClient'),
    groupBy === 'user' ? t('tmplanning:excelClient') : t('tmplanning:excelUser'),
    t('tmplanning:excelTotal'),
    ...dateRange.map(d => d.toLocaleDateString(getLocale()))
  ]);

  formatTimesheetHeaderRow(headerRow, dateRange);

  const grandTotals = calculateGrandTotals(tmUsers, dateRange);
  const totalRowData = [
    t('tmplanning:excelGrandTotal'),
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

  if (groupBy === 'user') {
    tmUsers.forEach(user => {
      const userTotals = calculateUserTotals(user, dateRange);

      const userRowData = [
        user.full_name || t('tmplanning:excelNoUserName'),
        t('tmplanning:excelUserTotal'),
        userTotals.periodTotal
      ];
      dateRange.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const hours = userTotals.dateHours[dateStr] || 0;
        userRowData.push(hours > 0 ? hours : '');
      });

      const userRow = worksheet.addRow(userRowData);
      formatTimesheetProjectRow(userRow);

      user.clients?.forEach(client => {
        let periodTotal = 0;

        const clientRowData = [
          user.full_name,
          client.client_name || t('tmplanning:excelNoClientName'),
          ''
        ];

        dateRange.forEach(date => {
          const dateStr = date.toISOString().split('T')[0];
          const ts = client.timesheets?.find(t => t.work_date?.split('T')[0] === dateStr);
          const hours = ts ? ts.hours_worked : 0;
          periodTotal += hours;
          clientRowData.push(hours > 0 ? hours : '');
        });

        clientRowData[2] = periodTotal;
        const clientRow = worksheet.addRow(clientRowData);
        formatTimesheetTaskRow(clientRow, dateRange, holidays);
      });
    });
  } else {
    const clientsMap = new Map();

    tmUsers.forEach(user => {
      user.clients?.forEach(client => {
        if (!clientsMap.has(client.client_id)) {
          clientsMap.set(client.client_id, {
            client_id: client.client_id,
            client_name: client.client_name,
            users: []
          });
        }

        clientsMap.get(client.client_id).users.push({
          user_id: user.user_id,
          full_name: user.full_name,
          timesheets: client.timesheets
        });
      });
    });

    const clients = Array.from(clientsMap.values()).sort((a, b) =>
      a.client_name.localeCompare(b.client_name)
    );

    clients.forEach(client => {
      const clientTotals = calculateClientTotals(client, dateRange);

      const clientRowData = [
        client.client_name || t('tmplanning:excelNoClientName'),
        t('tmplanning:excelClientTotal'),
        clientTotals.periodTotal
      ];
      dateRange.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const hours = clientTotals.dateHours[dateStr] || 0;
        clientRowData.push(hours > 0 ? hours : '');
      });

      const clientRow = worksheet.addRow(clientRowData);
      formatTimesheetProjectRow(clientRow);

      client.users.forEach(user => {
        let periodTotal = 0;

        const userRowData = [
          client.client_name,
          user.full_name || t('tmplanning:excelNoUserName'),
          ''
        ];

        dateRange.forEach(date => {
          const dateStr = date.toISOString().split('T')[0];
          const ts = user.timesheets?.find(t => t.work_date?.split('T')[0] === dateStr);
          const hours = ts ? ts.hours_worked : 0;
          periodTotal += hours;
          userRowData.push(hours > 0 ? hours : '');
        });

        userRowData[2] = periodTotal;
        const userRow = worksheet.addRow(userRowData);
        formatTimesheetTaskRow(userRow, dateRange, holidays);
      });
    });
  }

  setColumnWidths(worksheet, [
    30,
    30,
    12,
    ...dateRange.map(() => 5)
  ]);

  setRowHeight(worksheet, 4, 80);

  hideGridLines(worksheet);

  const fileName = `tm_planning_${startDate}_${endDate}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};
