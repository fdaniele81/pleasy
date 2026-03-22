import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isWeekend, isHoliday } from '../../../utils/date/workingDays';
import { useLocale } from '../../../hooks/useLocale';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

const TimeOffPlanTransposedTable = ({
  users,
  dateRange,
  holidays,
  getTimeOffForDate,
  getTotalHoursForUserAndType,
  getGrandTotal,
}) => {
  const { t } = useTranslation(['timeoffplan']);
  const locale = useLocale();

  const isNonWorkingDay = useCallback((date) => {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    return isWeekend(d) || isHoliday(d, holidays);
  }, [holidays]);

  const getHolidayName = useCallback((date) => {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const holiday = holidays.find(h => {
      const hd = new Date(h.date + 'T00:00:00');
      if (h.is_recurring) return d.getMonth() === hd.getMonth() && d.getDate() === hd.getDate();
      const fmt = (dt) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      return fmt(d) === fmt(hd);
    });
    return holiday?.name || null;
  }, [holidays]);

  const isToday = useCallback((date) => {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }, []);

  const formatDayHeader = (date) => {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const weekday = d.toLocaleDateString(locale, { weekday: 'short' });
    return { dayMonth: `${day}/${month}`, weekday };
  };

  const fmtNum = (v) => v > 0 ? v.toFixed(v % 1 === 0 ? 0 : 1) : '';

  const columnTotals = useMemo(() =>
    users.map(user => getTotalHoursForUserAndType(user, 'VACATION')),
    [users, getTotalHoursForUserAndType]
  );

  const grandTotal = useMemo(() =>
    getGrandTotal('VACATION', users),
    [users, getGrandTotal]
  );

  const { isMobile } = useBreakpoint();

  const containerRef = useRef(null);
  const [useVerticalNames, setUseVerticalNames] = useState(false);

  useEffect(() => {
    if (!containerRef.current || users.length === 0) return;
    const checkWidth = () => {
      const containerWidth = containerRef.current?.clientWidth || 0;
      const fixedColumnsWidth = 96 + 64; // date col (w-24) + total col (w-16)
      const availablePerUser = (containerWidth - fixedColumnsWidth) / users.length;
      setUseVerticalNames(availablePerUser < 120);
    };
    checkWidth();
    const observer = new ResizeObserver(checkWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [users.length]);

  const [mobileUserIdx, setMobileUserIdx] = useState(0);

  if (dateRange.length === 0 || users.length === 0) return null;

  // ── Mobile View: navigate between users, dates listed vertically ──
  if (isMobile) {
    const safeIdx = Math.min(mobileUserIdx, users.length - 1);
    const currentUser = users[safeIdx];
    const userTotal = getTotalHoursForUserAndType(currentUser, 'VACATION');

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* User Navigator */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={() => setMobileUserIdx(i => Math.max(0, i - 1))}
            disabled={safeIdx === 0}
            className="p-2 rounded-full transition-colors disabled:opacity-25 active:bg-gray-200"
          >
            <ChevronLeft size={22} className="text-gray-600" />
          </button>
          <div className="flex flex-col items-center min-w-0 px-2">
            <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
              {currentUser.full_name || currentUser.email}
            </span>
            <span className="text-[11px] text-gray-400">
              {safeIdx + 1} / {users.length}
            </span>
          </div>
          <button
            onClick={() => setMobileUserIdx(i => Math.min(users.length - 1, i + 1))}
            disabled={safeIdx === users.length - 1}
            className="p-2 rounded-full transition-colors disabled:opacity-25 active:bg-gray-200"
          >
            <ChevronRight size={22} className="text-gray-600" />
          </button>
        </div>

        {/* Dots (only if reasonable number of users) */}
        {users.length > 1 && users.length <= 20 && (
          <div className="flex justify-center gap-1.5 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0">
            {users.map((u, i) => (
              <button
                key={u.user_id}
                onClick={() => setMobileUserIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === safeIdx ? 'bg-cyan-600 scale-125' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Dates List */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {dateRange.map(date => {
            const nonWorking = isNonWorkingDay(date);
            const holidayName = getHolidayName(date);
            const today = isToday(date);
            const { dayMonth, weekday } = formatDayHeader(date);
            const hours = getTimeOffForDate(currentUser, 'VACATION', date);

            return (
              <div
                key={date}
                className={`flex items-center justify-between px-4 py-2.5 border-b border-gray-100 ${
                  today
                    ? 'bg-cyan-50 border-l-[3px] border-l-cyan-500'
                    : nonWorking
                      ? 'bg-gray-50'
                      : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm font-semibold tabular-nums ${today ? 'text-cyan-700' : 'text-gray-800'}`}>
                    {dayMonth}
                  </span>
                  <span className={`text-xs capitalize ${nonWorking ? 'text-gray-400' : today ? 'text-cyan-500' : 'text-gray-400'}`}>
                    {weekday}
                  </span>
                  {holidayName && (
                    <span className="text-[10px] text-amber-600 font-medium truncate max-w-[120px]">
                      {holidayName}
                    </span>
                  )}
                </div>
                <span className={`text-sm tabular-nums shrink-0 ml-2 ${
                  hours > 0 ? 'font-semibold text-cyan-700' : 'text-gray-300'
                }`}>
                  {hours > 0 ? `${fmtNum(hours)}h` : '\u2013'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Total */}
        <div className="flex items-center justify-between px-4 py-3 border-t-2 border-gray-300 bg-gray-50 shrink-0">
          <span className="text-xs font-bold text-gray-600 uppercase">{t('timeoffplan:totalShort')}</span>
          <span className="text-sm font-bold text-cyan-800 tabular-nums">
            {userTotal > 0 ? `${fmtNum(userTotal)}h` : '\u2013'}
          </span>
        </div>
      </div>
    );
  }

  // ── Desktop View ──
  return (
    <div ref={containerRef} className="overflow-auto flex-1 min-h-0 bg-white rounded-lg shadow-md border border-gray-200">
      <table className="w-full text-sm" style={{ borderSpacing: 0, borderCollapse: 'separate' }}>
        <colgroup>
          <col className="w-24" />
          {users.map(user => (
            <col key={user.user_id} />
          ))}
          <col className="w-16" />
        </colgroup>

        <thead className="sticky top-0 z-20">
          <tr>
            <th className="sticky left-0 z-30 bg-gray-50 px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
              {t('timeoffplan:dateHeader')}
            </th>
            {users.map(user => (
              <th
                key={user.user_id}
                className={`bg-gray-50 border-b border-r border-gray-200 ${useVerticalNames ? 'px-1' : 'px-3 py-2.5'}`}
                title={user.full_name || user.email}
              >
                {useVerticalNames ? (
                  <div className="flex items-center justify-center h-28">
                    <span
                      className="text-[11px] font-medium text-gray-600 whitespace-nowrap"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      {user.full_name || user.email}
                    </span>
                  </div>
                ) : (
                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
                    {user.full_name || user.email}
                  </span>
                )}
              </th>
            ))}
            <th className="bg-gray-50 px-2 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-l-2 border-gray-200">
              {t('timeoffplan:totalShort')}
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-100">
          {dateRange.map((date) => {
            const nonWorking = isNonWorkingDay(date);
            const holidayName = getHolidayName(date);
            const today = isToday(date);
            const { dayMonth, weekday } = formatDayHeader(date);

            let rowTotal = 0;
            users.forEach(user => {
              rowTotal += getTimeOffForDate(user, 'VACATION', date);
            });

            return (
              <tr key={dayMonth} className={nonWorking ? 'bg-gray-50' : 'hover:bg-gray-50/50'}>
                <td
                  className={`sticky left-0 z-10 px-3 py-1 border-r border-gray-200 select-none shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]
                    ${today ? 'bg-cyan-50 border-l-[3px] border-l-cyan-500' : nonWorking ? 'bg-gray-100' : 'bg-white'}`}
                  title={holidayName || (today ? t('timeoffplan:today') : undefined)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold tabular-nums ${today ? 'text-cyan-700' : 'text-gray-800'}`}>{dayMonth}</span>
                    <span className={`text-[10px] capitalize ${nonWorking ? 'text-gray-400' : today ? 'text-cyan-500' : 'text-gray-400'}`}>{weekday}</span>
                  </div>
                </td>

                {users.map(user => {
                  const hours = getTimeOffForDate(user, 'VACATION', date);
                  return (
                    <td
                      key={user.user_id}
                      className={`px-2 py-1 text-center border-r border-gray-100 ${
                        hours > 0 ? 'bg-cyan-50' : ''
                      }`}
                    >
                      {hours > 0 && (
                        <span className="text-xs font-semibold text-cyan-700">
                          {fmtNum(hours)}
                        </span>
                      )}
                    </td>
                  );
                })}

                <td className={`px-2 py-1 text-center border-l-2 border-gray-200 ${rowTotal > 0 ? 'bg-cyan-50/50' : ''}`}>
                  {rowTotal > 0 && (
                    <span className="text-xs font-bold text-cyan-700">{fmtNum(rowTotal)}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot className="sticky bottom-0 z-10">
          <tr className="bg-gray-50 border-t-2 border-gray-300">
            <td className="sticky left-0 z-20 px-3 py-2 text-xs font-bold text-gray-600 uppercase border-r border-gray-200 bg-gray-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
              {t('timeoffplan:totalShort')}
            </td>
            {columnTotals.map((total, idx) => (
              <td key={users[idx].user_id} className="py-2 text-center border-r border-gray-100 bg-gray-50">
                <span className="text-xs font-bold text-gray-700">{fmtNum(total)}</span>
              </td>
            ))}
            <td className="py-2 text-center border-l-2 border-gray-200 bg-cyan-50">
              <span className="text-sm font-bold text-cyan-800">{fmtNum(grandTotal)}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TimeOffPlanTransposedTable;
