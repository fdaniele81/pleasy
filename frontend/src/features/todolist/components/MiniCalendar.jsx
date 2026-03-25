import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LOCALE_MAP } from '../../../utils/date/dateUtils';

const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const todayISO = toISO(new Date());

function MiniCalendar({ datesWithItems = {}, onDateClick }) {
  const { i18n } = useTranslation();
  const locale = LOCALE_MAP[i18n.language] || 'it-IT';

  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(2024, 0, 1 + i); // Mon=0
      days.push(d.toLocaleDateString(locale, { weekday: 'short' }).charAt(0).toUpperCase());
    }
    return days;
  }, [locale]);

  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth, locale]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ date: new Date(viewYear, viewMonth, -i), isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(viewYear, viewMonth, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(viewYear, viewMonth + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }, [viewMonth]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={handlePrevMonth} className="p-1 rounded hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={14} />
        </button>
        <button type="button" onClick={goToToday} className="text-xs font-semibold text-gray-700 capitalize hover:text-cyan-600 transition-colors">
          {monthLabel}
        </button>
        <button type="button" onClick={handleNextMonth} className="p-1 rounded hover:bg-gray-100 text-gray-500">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, i) => {
          const iso = toISO(day.date);
          const isToday = iso === todayISO;
          const info = datesWithItems[iso];
          const hasItems = info?.count > 0;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onDateClick?.(iso)}
              className={`
                relative w-8 h-8 text-[11px] rounded-full flex items-center justify-center transition-colors
                ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-600'}
                ${isToday ? 'bg-cyan-50 font-bold text-cyan-700 ring-1 ring-cyan-300' : ''}
                ${day.isCurrentMonth && !isToday ? 'hover:bg-gray-100' : ''}
              `}
            >
              {day.date.getDate()}
              {day.isCurrentMonth && hasItems && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                  <span className="w-1 h-1 rounded-full bg-cyan-400 block" />
                </span>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}

export default MiniCalendar;
