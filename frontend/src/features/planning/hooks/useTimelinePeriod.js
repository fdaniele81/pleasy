import { useState, useMemo, useCallback, useEffect } from 'react';
import { formatDateLocal, generateDateRange } from '../../../utils/table/tableUtils';
import { useLocale } from '../../../hooks/useLocale';

const MIN_COL_WIDTH = 2;

export function useTimelinePeriod({ timeInterval: externalTimeInterval, setTimeInterval: externalSetTimeInterval } = {}) {
  const locale = useLocale();
  const [localTimeInterval, setLocalTimeInterval] = useState(4); // weeks
  const timeInterval = externalTimeInterval ?? localTimeInterval;
  const [dateOffset, setDateOffset] = useState(0); // days from today's Monday
  const [availableWidth, setAvailableWidth] = useState(800);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // For calendar grid mode (<=4 weeks), compute the Monday-aligned base once
  const baseStart = useMemo(() => {
    const d = new Date(today);
    if (timeInterval <= 4) {
      const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      d.setDate(d.getDate() + daysToMonday);
    }
    return d;
  }, [today, timeInterval]);

  const numDays = useMemo(() => timeInterval * 7, [timeInterval]);

  const { startDate, endDate } = useMemo(() => {
    const start = new Date(baseStart);
    start.setDate(start.getDate() + dateOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + numDays - 1);
    return {
      startDate: formatDateLocal(start),
      endDate: formatDateLocal(end),
    };
  }, [baseStart, dateOffset, numDays]);

  const dateRange = useMemo(
    () => generateDateRange(startDate, endDate),
    [startDate, endDate]
  );

  const isAtToday = useMemo(() => dateOffset === 0, [dateOffset]);

  const stepDays = useMemo(() => Math.max(7, Math.ceil(numDays / 4)), [numDays]);

  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const formatOptions = { day: 'numeric', month: 'short' };
    const startStr = start.toLocaleDateString(locale, formatOptions);
    const endStr = end.toLocaleDateString(locale, { ...formatOptions, year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }, [startDate, endDate, locale]);

  const columnWidth = useMemo(() => {
    return Math.max(MIN_COL_WIDTH, Math.floor(availableWidth / numDays));
  }, [availableWidth, numDays]);

  const columnWidths = useMemo(() => {
    const base = Math.max(MIN_COL_WIDTH, Math.floor(availableWidth / numDays));
    const remainder = availableWidth - base * numDays;
    return Array.from({ length: numDays }, (_, i) => (i < remainder ? base + 1 : base));
  }, [availableWidth, numDays]);

  const getColumnLeft = useCallback((dayIndex) => {
    if (dayIndex <= 0) return 0;
    const remainder = availableWidth - columnWidth * numDays;
    return dayIndex * columnWidth + Math.min(dayIndex, remainder);
  }, [columnWidth, availableWidth, numDays]);

  const setTimeInterval = useCallback((weeks) => {
    if (externalSetTimeInterval) {
      externalSetTimeInterval(weeks);
    } else {
      setLocalTimeInterval(weeks);
    }
    setDateOffset(0);
  }, [externalSetTimeInterval]);

  const goToPrevious = useCallback(() => {
    setDateOffset(prev => prev - stepDays);
  }, [stepDays]);

  const goToNext = useCallback(() => {
    setDateOffset(prev => prev + stepDays);
  }, [stepDays]);

  const goToPreviousDay = useCallback(() => {
    setDateOffset(prev => prev - 1);
  }, []);

  const goToNextDay = useCallback(() => {
    setDateOffset(prev => prev + 1);
  }, []);

  const goToToday = useCallback(() => {
    setDateOffset(0);
  }, []);

  const timelineWidth = useMemo(() => columnWidths.reduce((s, w) => s + w, 0), [columnWidths]);

  const todayLineOffset = useMemo(() => {
    if (!dateRange || dateRange.length === 0) return null;
    const todayISO = today.toISOString().slice(0, 10);
    const rangeStartISO = dateRange[0].toISOString().slice(0, 10);
    if (todayISO < rangeStartISO) return null;
    const daysDiff = Math.round((today - dateRange[0]) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0 || daysDiff >= dateRange.length) return null;
    return getColumnLeft(daysDiff) + (columnWidths[daysDiff] || columnWidth) / 2;
  }, [dateRange, today, columnWidths, columnWidth, getColumnLeft]);

  return {
    dateRange,
    startDate,
    endDate,
    periodLabel,
    numDays,
    timeInterval,
    setTimeInterval,
    columnWidth,
    columnWidths,
    getColumnLeft,
    timelineWidth,
    todayLineOffset,
    availableWidth,
    setAvailableWidth,
    goToPrevious,
    goToNext,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    isAtToday,
  };
}
