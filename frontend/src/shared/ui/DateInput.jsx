import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { LOCALE_MAP } from '../../utils/date/dateUtils';

const DateInput = ({ value, onChange, className = '', placeholder }) => {
  const { t, i18n } = useTranslation('common');
  const locale = LOCALE_MAP[i18n.language] || 'it-IT';

  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return d.getMonth();
  });
  const [dropdownStyle, setDropdownStyle] = useState({});

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Calculate position when opening
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const dropdownHeight = 340; // approximate height
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: 288, // w-72
      zIndex: 9999,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const weekDays = useMemo(() => {
    const days = [];
    // Monday = 1, so we start from a known Monday (2024-01-01 was a Monday)
    for (let i = 0; i < 7; i++) {
      const d = new Date(2024, 0, 1 + i);
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

    // getDay() returns 0=Sun, we want 0=Mon
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days = [];

    // Previous month filler days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(viewYear, viewMonth, i), isCurrentMonth: true });
    }

    // Next month filler to complete grid (6 rows max)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(viewYear, viewMonth + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  const toISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayISO = toISO(new Date());

  const displayValue = useMemo(() => {
    if (!value) return '';
    const d = new Date(value + 'T00:00:00');
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [value, locale]);

  const handleDayClick = (day) => {
    onChange(toISO(day.date));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange(todayISO);
    setIsOpen(false);
  };

  const calendar = isOpen && createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-lg shadow-lg p-3"
    >
      {/* Header: month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded hover:bg-gray-100 text-gray-600"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-gray-800 capitalize">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded hover:bg-gray-100 text-gray-600"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0">
        {calendarDays.map((day, i) => {
          const iso = toISO(day.date);
          const isSelected = iso === value;
          const isToday = iso === todayISO;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`
                w-9 h-9 text-sm rounded-full flex items-center justify-center transition-colors
                ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                ${isSelected ? 'bg-cyan-600 text-white hover:bg-cyan-700' : ''}
                ${isToday && !isSelected ? 'border border-cyan-400 font-semibold' : ''}
                ${!isSelected && day.isCurrentMonth ? 'hover:bg-gray-100' : ''}
                ${!isSelected && !day.isCurrentMonth ? 'hover:bg-gray-50' : ''}
              `}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-center">
        <button
          type="button"
          onClick={handleToday}
          className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
        >
          {t('today')}
        </button>
      </div>
    </div>,
    document.body
  );

  return (
    <div className={className}>
      <div
        ref={inputRef}
        className="w-full flex items-center border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder || t('selectDate')}
          className="w-full px-3 py-2 bg-transparent rounded-lg cursor-pointer focus:outline-none text-sm"
        />
        <Calendar size={16} className="mr-3 text-gray-400 shrink-0" />
      </div>
      {calendar}
    </div>
  );
};

export default DateInput;
