import { useState, useMemo, useCallback, useEffect } from 'react';
import { formatDateLocal, generateDateRange } from '../../../utils/table/tableUtils';
import { useLocale } from '../../../hooks/useLocale';

const MIN_COL_WIDTH = 2;

export function useTimelinePeriod() {
  const locale = useLocale();
  const [timeInterval, setTimeIntervalRaw] = useState(4); // weeks
  const [dateOffset, setDateOffset] = useState(0); // days from today's Monday
  const [availableWidth, setAvailableWidth] = useState(800);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const numDays = useMemo(() => timeInterval * 7, [timeInterval]);

  const { startDate, endDate } = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() + dateOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + numDays - 1);
    return {
      startDate: formatDateLocal(start),
      endDate: formatDateLocal(end),
    };
  }, [today, dateOffset, numDays]);

  const dateRange = useMemo(
    () => generateDateRange(startDate, endDate),
    [startDate, endDate]
  );

  const isAtStart = useMemo(() => dateOffset === 0, [dateOffset]);

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

  const setTimeInterval = useCallback((weeks) => {
    setTimeIntervalRaw(weeks);
    setDateOffset(0);
  }, []);

  const goToPrevious = useCallback(() => {
    setDateOffset(prev => Math.max(0, prev - numDays));
  }, [numDays]);

  const goToNext = useCallback(() => {
    setDateOffset(prev => prev + numDays);
  }, [numDays]);

  const goToToday = useCallback(() => {
    setDateOffset(0);
  }, []);

  const timelineWidth = useMemo(() => numDays * columnWidth, [numDays, columnWidth]);

  const todayLineOffset = useMemo(() => {
    if (!dateRange || dateRange.length === 0) return null;
    const todayISO = today.toISOString().slice(0, 10);
    const rangeStartISO = dateRange[0].toISOString().slice(0, 10);
    if (todayISO < rangeStartISO) return null;
    const daysDiff = Math.round((today - dateRange[0]) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0 || daysDiff >= dateRange.length) return null;
    return daysDiff * columnWidth + columnWidth / 2;
  }, [dateRange, today, columnWidth]);

  return {
    dateRange,
    startDate,
    endDate,
    periodLabel,
    numDays,
    timeInterval,
    setTimeInterval,
    columnWidth,
    timelineWidth,
    todayLineOffset,
    availableWidth,
    setAvailableWidth,
    goToPrevious,
    goToNext,
    goToToday,
    isAtStart,
  };
}
