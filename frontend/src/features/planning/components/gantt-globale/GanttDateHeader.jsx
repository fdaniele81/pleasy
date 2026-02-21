import React from 'react';

const GanttDateHeader = ({ periods, userAllocations, columnWidth, columnWidths = [], getMonthAbbr, t }) => {
  return (
    <thead>
      <tr className="bg-cyan-700 text-white">
        <th className="border border-gray-300 px-3 py-1 text-left text-base font-semibold sticky left-0 top-0 bg-cyan-700 z-30 w-[215px] min-w-[215px] max-w-[215px]">
          {t('ganttResource')}
        </th>
        <th className="border border-gray-300 px-2 py-1 text-center text-base font-semibold sticky top-0 bg-cyan-700 z-20 w-[110px] min-w-[110px] max-w-[110px]" style={{ left: '215px' }}>
          %
        </th>
        {periods.map((period, idx) => {
          const startMonth = getMonthAbbr(period.start);

          const monthLabel = startMonth;

          const dayLabel = period.label;

          const colWidth = columnWidths[idx] || columnWidth;

          return (
            <th
              key={idx}
              className="border border-gray-300 px-1 py-1 text-center font-semibold sticky top-0 bg-cyan-700 z-20"
              style={{ width: `${colWidth}px`, minWidth: `${colWidth}px`, maxWidth: `${colWidth}px` }}
            >
              <div className="text-[10px] leading-tight">{monthLabel}</div>
              <div className="text-xs mt-0.5">{dayLabel}</div>
            </th>
          );
        })}
      </tr>

      <tr className="bg-cyan-600 text-white font-bold">
        <th className="border border-gray-300 px-3 py-1 text-left text-sm sticky left-0 bg-cyan-600 z-20 w-[215px] min-w-[215px] max-w-[215px]">
          {t('ganttTotFte')}
        </th>
        <th className="border border-gray-300 px-2 py-1 text-center text-sm bg-cyan-600 w-[110px] min-w-[110px] max-w-[110px]" style={{ left: '215px', position: 'sticky' }}>
          -
        </th>
        {periods.map((period, periodIdx) => {
          const isNonWorkingPeriod = userAllocations.every(
            user => (user.periodAvailableHours[periodIdx] || 0) === 0
          );

          const totalFTE = isNonWorkingPeriod
            ? 0
            : userAllocations.reduce(
                (sum, user) => {
                  const userAvailable = user.periodAvailableHours[periodIdx] || 0;
                  return sum + (userAvailable > 0 ? (user.periodFTE[periodIdx] || 0) : 0);
                },
                0
              );

          const colWidth = columnWidths[periodIdx] || columnWidth;

          return (
            <th
              key={periodIdx}
              className={`border border-gray-300 px-1 py-1 text-center text-xs ${isNonWorkingPeriod ? 'bg-cyan-800' : 'bg-cyan-600'}`}
              style={{ width: `${colWidth}px`, minWidth: `${colWidth}px`, maxWidth: `${colWidth}px` }}
            >
              {isNonWorkingPeriod ? '-' : totalFTE > 0 ? totalFTE.toFixed(2) : '-'}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default React.memo(GanttDateHeader);
