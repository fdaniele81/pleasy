import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { EyeOff, Eye, Briefcase, FolderKanban, ListTodo } from 'lucide-react';
import { isWeekend, isHoliday } from '../../utils/date/workingDays';
import { useLocale } from '../../hooks/useLocale';

const SmallNoteTriangle = ({ note }) => {
  if (!note) return null;
  return (
    <div
      className="absolute top-0 right-0 z-10"
      style={{
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: '4px',
        borderColor: '#3b82f6 #3b82f6 transparent transparent',
      }}
    />
  );
};


const TransposedTimesheetGrid = ({
  tasks = [],
  holidays = [],
  selectable = false,
  selectedTimesheetIds = new Set(),
  onSelectionChange,
  filterStartDate,
  filterEndDate,
}) => {
  const { t } = useTranslation(['timesheet', 'common']);
  const locale = useLocale();
  const [hideEmptyDays, setHideEmptyDays] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const tooltipTimeout = useRef(null);
  const gridContainerRef = useRef(null);

  const showTooltip = useCallback((e, content, forceAbove = false) => {
    clearTimeout(tooltipTimeout.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const above = forceAbove || rect.bottom + 60 > window.innerHeight;
    tooltipTimeout.current = setTimeout(() => {
      setTooltip({
        content,
        x: rect.left + rect.width / 2,
        y: above ? rect.top : rect.bottom,
        above,
      });
    }, 350);
  }, []);

  const hideTooltip = useCallback(() => {
    clearTimeout(tooltipTimeout.current);
    setTooltip(null);
  }, []);

  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;
    const onScroll = () => setTooltip(null);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const { columns } = useMemo(() => {
    const clientMap = new Map();

    tasks.forEach(task => {
      const ck = task.client_id;
      if (!clientMap.has(ck)) {
        clientMap.set(ck, {
          client_id: ck,
          client_name: task.client_name,
          client_key: task.client_key,
          client_color: task.client_color,
          projects: new Map(),
        });
      }
      const client = clientMap.get(ck);
      const pk = task.project_id;
      if (!client.projects.has(pk)) {
        client.projects.set(pk, {
          project_id: pk,
          project_key: task.project_key,
          project_title: task.project_title,
          tasks: [],
        });
      }
      client.projects.get(pk).tasks.push(task);
    });

    const cols = [];
    clientMap.forEach(client => {
      client.projects.forEach(project => {
        project.tasks.forEach(task => {
          cols.push({
            task_id: task.task_id,
            task_number: task.task_number,
            task_title: task.task_title,
            client_name: client.client_name,
            client_color: client.client_color,
            symbol_letter: task.symbol_letter,
            symbol_bg_color: task.symbol_bg_color,
            symbol_letter_color: task.symbol_letter_color,
            project_key: project.project_key,
            project_title: project.project_title,
            project_type_id: task.project_type_id,
            client_id: client.client_id,
            project_id: project.project_id,
          });
        });
      });
    });

    cols.sort((a, b) => {
      // PROJECT first, then TM
      const typeOrder = (t) => t.project_type_id === 'TM' ? 1 : 0;
      const typeCompare = typeOrder(a) - typeOrder(b);
      if (typeCompare !== 0) return typeCompare;
      const clientCompare = (a.client_name || '').localeCompare(b.client_name || '');
      if (clientCompare !== 0) return clientCompare;
      const projectCompare = (a.project_key || '').localeCompare(b.project_key || '');
      if (projectCompare !== 0) return projectCompare;
      return (a.task_number || 0) - (b.task_number || 0);
    });

    return { columns: cols };
  }, [tasks]);

  const allDates = useMemo(() => {
    if (tasks.length === 0) return [];
    let minStr = null;
    let maxStr = null;
    tasks.forEach(task => {
      task.timesheets.forEach(ts => {
        const d = ts.timesheet_date;
        if (filterStartDate && d < filterStartDate) return;
        if (filterEndDate && d > filterEndDate) return;
        if (!minStr || d < minStr) minStr = d;
        if (!maxStr || d > maxStr) maxStr = d;
      });
    });
    if (!minStr || !maxStr) return [];
    const result = [];
    const current = new Date(minStr + 'T00:00:00');
    const end = new Date(maxStr + 'T00:00:00');
    while (current <= end) {
      result.push(formatDateKey(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [tasks, filterStartDate, filterEndDate]);

  const timesheetLookup = useMemo(() => {
    const map = new Map();
    tasks.forEach(task => {
      task.timesheets.forEach(ts => {
        map.set(`${task.task_id}_${ts.timesheet_date}`, ts);
      });
    });
    return map;
  }, [tasks]);

  const datesWithEntries = useMemo(() => {
    const set = new Set();
    allDates.forEach(date => {
      columns.forEach(col => {
        if (timesheetLookup.has(`${col.task_id}_${date}`)) set.add(date);
      });
    });
    return set;
  }, [allDates, columns, timesheetLookup]);

  const dates = useMemo(() => {
    if (!hideEmptyDays) return allDates;
    return allDates.filter(d => datesWithEntries.has(d));
  }, [allDates, hideEmptyDays, datesWithEntries]);

  const emptyDaysCount = allDates.length - datesWithEntries.size;

  const allVisibleIds = useMemo(() => {
    const ids = new Set();
    dates.forEach(date => {
      columns.forEach(col => {
        const ts = timesheetLookup.get(`${col.task_id}_${date}`);
        if (ts) ids.add(ts.timesheet_id);
      });
    });
    return ids;
  }, [dates, columns, timesheetLookup]);

  const isNonWorkingDay = useCallback((dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return isWeekend(date) || isHoliday(date, holidays);
  }, [holidays]);

  const getHolidayName = useCallback((dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const holiday = holidays.find(h => {
      const hd = new Date(h.date + 'T00:00:00');
      if (h.is_recurring) return date.getMonth() === hd.getMonth() && date.getDate() === hd.getDate();
      return formatDateKey(date) === formatDateKey(hd);
    });
    return holiday?.name || null;
  }, [holidays]);

  const toggleCell = useCallback((timesheetId) => {
    if (!selectable) return;
    onSelectionChange(prev => {
      const next = new Set(prev);
      if (next.has(timesheetId)) next.delete(timesheetId);
      else next.add(timesheetId);
      return next;
    });
  }, [selectable, onSelectionChange]);

  const toggleRow = useCallback((dateStr) => {
    if (!selectable) return;
    const rowIds = [];
    columns.forEach(col => {
      const ts = timesheetLookup.get(`${col.task_id}_${dateStr}`);
      if (ts) rowIds.push(ts.timesheet_id);
    });
    if (rowIds.length === 0) return;
    onSelectionChange(prev => {
      const next = new Set(prev);
      const allSel = rowIds.every(id => next.has(id));
      if (allSel) rowIds.forEach(id => next.delete(id));
      else rowIds.forEach(id => next.add(id));
      return next;
    });
  }, [selectable, columns, timesheetLookup, onSelectionChange]);

  const toggleColumn = useCallback((taskId) => {
    if (!selectable) return;
    const colIds = [];
    dates.forEach(date => {
      const ts = timesheetLookup.get(`${taskId}_${date}`);
      if (ts) colIds.push(ts.timesheet_id);
    });
    if (colIds.length === 0) return;
    onSelectionChange(prev => {
      const next = new Set(prev);
      const allSel = colIds.every(id => next.has(id));
      if (allSel) colIds.forEach(id => next.delete(id));
      else colIds.forEach(id => next.add(id));
      return next;
    });
  }, [selectable, dates, timesheetLookup, onSelectionChange]);

  const toggleAll = useCallback(() => {
    if (!selectable) return;
    onSelectionChange(prev => {
      const allSel = allVisibleIds.size > 0 && [...allVisibleIds].every(id => prev.has(id));
      if (allSel) return new Set();
      return new Set(allVisibleIds);
    });
  }, [selectable, allVisibleIds, onSelectionChange]);

  const columnTotals = useMemo(() => {
    return columns.map(col => {
      let total = 0;
      dates.forEach(date => {
        const ts = timesheetLookup.get(`${col.task_id}_${date}`);
        if (ts) total += ts.hours;
      });
      return total;
    });
  }, [columns, dates, timesheetLookup]);

  const grandTotal = columnTotals.reduce((s, v) => s + v, 0);

  const columnSelectionState = useMemo(() => {
    if (!selectable) return columns.map(() => 'none');
    return columns.map(col => {
      const colIds = [];
      dates.forEach(date => {
        const ts = timesheetLookup.get(`${col.task_id}_${date}`);
        if (ts) colIds.push(ts.timesheet_id);
      });
      if (colIds.length === 0) return 'none';
      if (colIds.every(id => selectedTimesheetIds.has(id))) return 'all';
      if (colIds.some(id => selectedTimesheetIds.has(id))) return 'some';
      return 'none';
    });
  }, [selectable, columns, dates, timesheetLookup, selectedTimesheetIds]);

  const allSelected = selectable && allVisibleIds.size > 0 && [...allVisibleIds].every(id => selectedTimesheetIds.has(id));
  const someSelected = selectable && allVisibleIds.size > 0 && [...allVisibleIds].some(id => selectedTimesheetIds.has(id));

  const formatDayHeader = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
    return { dayMonth: `${day}/${month}`, weekday };
  };

  const fmtNum = (v) => v > 0 ? v.toFixed(v % 1 === 0 ? 0 : 1) : '';

  const useVerticalHeaders = columns.length > 12;

  if (allDates.length === 0 || columns.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      {/* Toolbar — only when selectable or has empty days */}
      {(selectable || emptyDaysCount > 0) && (
        <div className="flex items-center justify-between shrink-0">
          {selectable ? (
            <button
              onClick={toggleAll}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                allSelected
                  ? 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700'
                  : someSelected
                    ? 'bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {allSelected ? t('common:deselectAll') : t('common:selectAll')}
            </button>
          ) : <div />}

          {emptyDaysCount > 0 && (
            <button
              onClick={() => setHideEmptyDays(prev => !prev)}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                hideEmptyDays
                  ? 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {hideEmptyDays ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {hideEmptyDays ? t('timesheet:showEmptyDays') : t('timesheet:hideEmptyDays')}
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      <div ref={gridContainerRef} className="overflow-auto flex-1 min-h-0 bg-white rounded-lg shadow border border-gray-200">
        <table className="w-full text-sm" style={{ borderSpacing: 0, borderCollapse: 'separate', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 140 }} />
            {columns.map(col => (
              <col key={col.task_id} />
            ))}
            <col style={{ width: 64 }} />
          </colgroup>

          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 bg-cyan-700 px-3 py-2 text-center text-xs font-semibold text-white uppercase border-b border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
                {t('timesheet:excelDate')}
              </th>
              {columns.map(col => {
                const colAllSelected = columnSelectionState[columns.indexOf(col)] === 'all';
                const colSomeSelected = columnSelectionState[columns.indexOf(col)] === 'some';
                const isTM = col.project_type_id === 'TM';

                return (
                  <th
                    key={col.task_id}
                    className={`p-0 transition-colors border-b border-r border-gray-200 ${
                      selectable ? 'cursor-pointer' : ''
                    } ${
                      colAllSelected
                        ? 'bg-cyan-100'
                        : colSomeSelected
                          ? 'bg-cyan-50'
                          : selectable ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-50'
                    }`}
                    style={{
                      height: useVerticalHeaders ? 120 : 'auto',
                    }}
                    onClick={selectable ? () => toggleColumn(col.task_id) : undefined}
                    onMouseEnter={(e) => showTooltip(e, { client: col.client_name, project: col.project_title, task: isTM ? null : col.task_title, color: col.client_color }, true)}
                    onMouseLeave={hideTooltip}
                  >
                    {useVerticalHeaders ? (
                      <div className="flex flex-col items-center justify-end h-full px-0.5 pb-1.5 overflow-hidden gap-1">
                        <div className="flex items-end gap-0.5">
                          <span
                            className="text-[10px] font-semibold text-gray-700 whitespace-nowrap leading-tight"
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {col.project_title}
                          </span>
                          {!isTM && (
                            <span
                              className="text-[10px] text-gray-500 whitespace-nowrap leading-tight"
                              style={{
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                                maxHeight: 80,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {col.task_title}
                            </span>
                          )}
                        </div>
                        <div
                          className="w-5 h-5 min-w-5 min-h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold leading-none"
                          style={{
                            backgroundColor: col.symbol_bg_color || col.client_color || '#6366F1',
                            color: col.symbol_letter_color || '#FFFFFF',
                          }}
                        >
                          {col.symbol_letter || (col.client_name || '?')[0].toUpperCase()}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5 overflow-hidden px-1 py-1.5">
                        <div
                          className="w-5 h-5 min-w-5 min-h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold leading-none"
                          style={{
                            backgroundColor: col.symbol_bg_color || col.client_color || '#6366F1',
                            color: col.symbol_letter_color || '#FFFFFF',
                          }}
                        >
                          {col.symbol_letter || (col.client_name || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1 truncate w-full justify-center">
                          <FolderKanban className="h-3 w-3 text-gray-400 shrink-0" />
                          <span className="text-[10px] font-semibold text-gray-700 truncate">
                            {col.project_title}
                          </span>
                        </div>
                        {!isTM && (
                          <div className="flex items-center gap-1 truncate w-full justify-center">
                            <ListTodo className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="text-[10px] text-gray-500 truncate leading-tight">
                              {col.task_title}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
              <th className="bg-gray-50 px-1 py-2 text-center text-[10px] font-bold text-gray-500 uppercase border-b border-l border-gray-200">
                TOT
              </th>
            </tr>
          </thead>

          <tbody>
            {dates.map(dateStr => {
              const nonWorking = isNonWorkingDay(dateStr);
              const holidayName = getHolidayName(dateStr);
              const { dayMonth, weekday } = formatDayHeader(dateStr);

              let rowTotal = 0;
              const rowIds = [];
              columns.forEach(col => {
                const ts = timesheetLookup.get(`${col.task_id}_${dateStr}`);
                if (ts) {
                  rowTotal += ts.hours;
                  rowIds.push(ts.timesheet_id);
                }
              });

              const rowAllSelected = selectable && rowIds.length > 0 && rowIds.every(id => selectedTimesheetIds.has(id));
              const hasEntries = rowIds.length > 0;

              return (
                <tr key={dateStr} className={nonWorking ? 'bg-gray-100' : ''}>
                  <td
                    className={`sticky left-0 z-10 px-3 py-1.5 border-b border-r border-gray-200 select-none shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]
                      ${selectable && hasEntries ? 'cursor-pointer' : ''}
                      ${nonWorking
                        ? (rowAllSelected ? 'bg-gray-700' : 'bg-gray-600' + (selectable ? ' hover:bg-gray-700' : ''))
                        : (rowAllSelected ? 'bg-cyan-800' : 'bg-cyan-700' + (selectable ? ' hover:bg-cyan-800' : ''))
                      }
                      transition-colors`}
                    onClick={selectable && hasEntries ? () => toggleRow(dateStr) : undefined}
                    title={holidayName || undefined}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold tabular-nums text-white">
                        {dayMonth}
                      </span>
                      <span className={`text-[11px] ${nonWorking ? 'text-gray-200' : 'text-cyan-100'}`}>
                        {weekday}
                      </span>
                    </div>
                  </td>

                  {columns.map(col => {
                    const ts = timesheetLookup.get(`${col.task_id}_${dateStr}`);
                    if (!ts) {
                      return (
                        <td
                          key={col.task_id}
                          className={`border-b border-r border-gray-200 px-0 py-1 ${nonWorking ? 'bg-gray-100' : ''}`}
                        />
                      );
                    }

                    const isSelected = selectable && selectedTimesheetIds.has(ts.timesheet_id);

                    return (
                      <td
                        key={col.task_id}
                        className={`relative border-b border-r border-gray-200 px-0 py-1 text-center transition-colors select-none
                          ${selectable ? 'cursor-pointer' : ''}
                          ${isSelected
                            ? 'bg-cyan-200'
                            : nonWorking
                              ? 'bg-gray-100' + (selectable ? ' hover:bg-gray-200' : '')
                              : (selectable ? 'hover:bg-gray-200' : '')
                          }`}
                        onClick={selectable ? () => toggleCell(ts.timesheet_id) : undefined}
                        onMouseEnter={ts.details ? (e) => showTooltip(e, { note: ts.details }) : undefined}
                        onMouseLeave={ts.details ? hideTooltip : undefined}
                      >
                        <SmallNoteTriangle note={ts.details} />
                        <div className="flex items-center justify-center py-0.5">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-cyan-700' : 'text-gray-700'}`}>
                            {fmtNum(ts.hours)}
                          </span>
                        </div>
                      </td>
                    );
                  })}

                  <td className={`border-b border-l border-gray-200 px-1 py-1 text-center ${
                    nonWorking ? 'bg-gray-100' : 'bg-cyan-50'
                  }`}>
                    <span className="text-xs font-bold text-cyan-700">
                      {fmtNum(rowTotal)}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* Column totals */}
            <tr className="sticky bottom-0 z-10">
              <td className={`sticky left-0 z-20 px-3 py-2 text-xs font-bold uppercase border-t-2 border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] ${
                allSelected ? 'bg-cyan-200 text-cyan-800' : someSelected ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-50 text-gray-600'
              }`}>
                {t('timesheet:totalColumn')}
              </td>
              {columnTotals.map((total, idx) => {
                const selState = columnSelectionState[idx];
                return (
                  <td
                    key={columns[idx].task_id}
                    className={`py-2 text-center border-t-2 border-r border-gray-200 ${
                      selState === 'all' ? 'bg-cyan-200' : selState === 'some' ? 'bg-cyan-100' : 'bg-gray-50'
                    }`}
                  >
                    <span className={`text-xs font-bold ${
                      selState === 'all' ? 'text-cyan-800' : selState === 'some' ? 'text-cyan-700' : 'text-gray-700'
                    }`}>
                      {fmtNum(total)}
                    </span>
                  </td>
                );
              })}
              <td className={`py-2 text-center border-t-2 border-l border-gray-200 ${
                allSelected ? 'bg-cyan-200' : someSelected ? 'bg-cyan-100' : 'bg-cyan-50'
              }`}>
                <span className="text-xs font-bold text-cyan-800">
                  {fmtNum(grandTotal)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {tooltip && createPortal(
        <div
          className="fixed z-[9999] px-3 py-2.5 rounded-lg shadow-xl bg-gray-900 text-white text-xs min-w-48 max-w-sm border border-gray-600 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.above ? tooltip.y : tooltip.y + 4,
            transform: tooltip.above
              ? 'translate(-50%, calc(-100% - 4px))'
              : 'translate(-50%, 0)',
          }}
        >
          {tooltip.content.client ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tooltip.content.color || '#0891B2' }} />
                <Briefcase className="h-3 w-3 text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-100">{tooltip.content.client}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300 pl-4">
                <FolderKanban className="h-3 w-3 text-gray-400 shrink-0" />
                {tooltip.content.project}
              </div>
              {tooltip.content.task && (
                <div className="flex items-center gap-1.5 pl-4 text-gray-200 text-xs">
                  <ListTodo className="h-3 w-3 text-gray-400 shrink-0" />
                  {tooltip.content.task}
                </div>
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{tooltip.content.note}</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default TransposedTimesheetGrid;
