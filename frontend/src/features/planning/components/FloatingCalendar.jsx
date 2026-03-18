import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, ChevronRight, X, GripHorizontal } from 'lucide-react';
import { isHoliday } from '../../../utils/date/workingDays';
import { setCalendarPosition } from '../../../store/slices/ganttModalSlice';
import { selectCalendarPosition } from '../../../store/selectors/ganttModalSelectors';

const DAY_KEYS = [
  'calendarDayMon', 'calendarDayTue', 'calendarDayWed', 'calendarDayThu',
  'calendarDayFri', 'calendarDaySat', 'calendarDaySun'
];

const MONTH_KEYS = [
  'calendarMonthJan', 'calendarMonthFeb', 'calendarMonthMar', 'calendarMonthApr',
  'calendarMonthMay', 'calendarMonthJun', 'calendarMonthJul', 'calendarMonthAug',
  'calendarMonthSep', 'calendarMonthOct', 'calendarMonthNov', 'calendarMonthDec'
];

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let week = new Array(startDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function MonthGrid({ year, month, holidays, t }) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();
  const weeks = useMemo(() => getMonthDays(year, month), [year, month]);

  return (
    <div className="select-none">
      <div className="text-center text-xs font-semibold text-gray-700 mb-0.5">
        {t(`planning:${MONTH_KEYS[month]}`)} {year}
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {DAY_KEYS.map(key => (
              <th key={key} className="text-[10px] font-medium text-gray-400 py-0 w-7 text-center leading-tight">
                {t(`planning:${key}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                if (!day) return <td key={di} className="py-0" />;

                const date = new Date(year, month, day);
                const isWeekend = di >= 5;
                const isToday = isCurrentMonth && day === todayDate;
                const isHol = isHoliday(date, holidays);

                return (
                  <td key={di} className="py-0 text-center">
                    <span
                      className={`
                        inline-flex items-center justify-center w-5 h-5 text-[11px] rounded-full leading-none
                        ${isToday ? 'bg-cyan-600 text-white font-bold' : ''}
                        ${!isToday && isHol ? 'bg-red-100 text-red-500' : ''}
                        ${!isToday && !isHol && isWeekend ? 'text-gray-300' : ''}
                        ${!isToday && !isHol && !isWeekend ? 'text-gray-700' : ''}
                      `}
                    >
                      {day}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FloatingCalendar({ isOpen, onClose, holidays = [] }) {
  const { t } = useTranslation(['planning']);
  const dispatch = useDispatch();
  const position = useSelector(selectCalendarPosition);
  const [centerDate, setCenterDate] = useState(() => new Date());
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef(null);

  const currMonth = useMemo(() => ({
    year: centerDate.getFullYear(),
    month: centerDate.getMonth(),
  }), [centerDate]);

  const nextMonth = useMemo(() => {
    const d = new Date(centerDate.getFullYear(), centerDate.getMonth() + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [centerDate]);

  const goBack = useCallback(() => {
    setCenterDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 2, 1));
  }, []);

  const goForward = useCallback(() => {
    setCenterDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 2, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCenterDate(new Date());
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    if (!e.target.closest('.cal-drag-handle')) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = panelRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (!e.target.closest('.cal-drag-handle')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    const rect = panelRef.current.getBoundingClientRect();
    dragOffset.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      dispatch(setCalendarPosition({
        x: Math.max(0, clientX - dragOffset.current.x),
        y: Math.max(0, clientY - dragOffset.current.y),
      }));
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200"
      style={{ left: position.x, top: position.y, width: 370, userSelect: isDragging ? 'none' : 'auto' }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Header / drag handle */}
      <div className="cal-drag-handle flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-white rounded-t-xl cursor-move">
        <div className="flex items-center gap-2 text-gray-400">
          <GripHorizontal size={14} />
          <span className="text-xs font-medium">{t('planning:calendarTitle')}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={goBack}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            title={t('planning:calendarPrevMonth')}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={goToToday}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium text-cyan-700 hover:bg-cyan-50 transition-colors"
          >
            {t('planning:calendarToday')}
          </button>
          <button
            onClick={goForward}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            title={t('planning:calendarNextMonth')}
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2 months */}
      <div className="flex gap-3 px-3 py-2">
        <MonthGrid year={currMonth.year} month={currMonth.month} holidays={holidays} t={t} />
        <MonthGrid year={nextMonth.year} month={nextMonth.month} holidays={holidays} t={t} />
      </div>
    </div>
  );
}
