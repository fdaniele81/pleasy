import { useState, useMemo, useCallback, useEffect } from 'react';
import { formatDateLocal, generateDateRange } from '../../../utils/table/tableUtils';
import { getColumnCountForWidth } from '../../../constants/breakpoints';
import { useLocale } from '../../../hooks/useLocale';

export function useTimesheetPeriod() {
  const locale = useLocale();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const mondayOfCurrentWeek = useMemo(() => {
    const d = new Date(today);
    const dayOfWeek = d.getDay();
    const daysToSubtract = (dayOfWeek + 6) % 7;
    d.setDate(d.getDate() - daysToSubtract);
    return d;
  }, [today]);

  const numDays = useMemo(() => getColumnCountForWidth(), []);

  useEffect(() => {
    const startDay = new Date(mondayOfCurrentWeek);

    const endDay = new Date(startDay);
    endDay.setDate(endDay.getDate() + numDays - 1);

    setStartDate(formatDateLocal(startDay));
    setEndDate(formatDateLocal(endDay));
  }, [mondayOfCurrentWeek, numDays]);

  const isAtStart = useMemo(() => {
    if (!startDate) return true;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    return start.getTime() === mondayOfCurrentWeek.getTime();
  }, [startDate, mondayOfCurrentWeek]);

  const dateRange = useMemo(() =>
    generateDateRange(startDate, endDate),
    [startDate, endDate]
  );

  const goToPreviousPeriod = useCallback(() => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - 7);

    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + numDays - 1);

    setStartDate(formatDateLocal(newStart));
    setEndDate(formatDateLocal(newEnd));
  }, [startDate, numDays]);

  const goToNextPeriod = useCallback(() => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + 7);

    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + numDays - 1);

    setStartDate(formatDateLocal(newStart));
    setEndDate(formatDateLocal(newEnd));
  }, [startDate, numDays]);

  const goToToday = useCallback(() => {
    const startDay = new Date(mondayOfCurrentWeek);

    const endDay = new Date(startDay);
    endDay.setDate(endDay.getDate() + numDays - 1);

    setStartDate(formatDateLocal(startDay));
    setEndDate(formatDateLocal(endDay));
  }, [mondayOfCurrentWeek, numDays]);

  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) return '';

    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatOptions = { day: 'numeric', month: 'short' };
    const startStr = start.toLocaleDateString(locale, formatOptions);
    const endStr = end.toLocaleDateString(locale, { ...formatOptions, year: 'numeric' });

    return `${startStr} - ${endStr}`;
  }, [startDate, endDate]);

  return {
    startDate,
    endDate,
    dateRange,
    today,
    numDays,

    isAtStart,
    periodLabel,

    goToPreviousPeriod,
    goToNextPeriod,
    goToToday,
  };
}

export default useTimesheetPeriod;
