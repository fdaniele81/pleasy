import { useState, useRef, useEffect, useCallback } from 'react';
import { addDays, formatDateISO } from '../../../utils/date/dateUtils';

export function useTimelineDrag({ columnWidth, getColumnLeft, onDateChange, taskStartDate, taskEndDate }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'move' | 'resize-left' | 'resize-right'
  const [dragDeltaDays, setDragDeltaDays] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pendingDates, setPendingDates] = useState(null);
  const dragStartX = useRef(0);
  const anchorDayIdx = useRef(0);
  const initialDates = useRef(null);

  const handleCellMouseDown = useCallback((e, mode, startDate, endDate, anchorDay) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    setDragMode(mode);
    setDragDeltaDays(0);
    dragStartX.current = e.clientX;
    anchorDayIdx.current = anchorDay ?? 0;
    initialDates.current = { startDate, endDate };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStartX.current;

    let deltaDays;
    if (getColumnLeft) {
      // Use getColumnLeft for accurate pixel-to-day conversion
      const anchorPx = getColumnLeft(anchorDayIdx.current);
      const targetPx = anchorPx + dx;
      const approx = Math.round(dx / (columnWidth || 1));
      let best = approx;
      let bestErr = Math.abs(getColumnLeft(anchorDayIdx.current + approx) - targetPx);
      for (const candidate of [approx - 1, approx + 1]) {
        const err = Math.abs(getColumnLeft(anchorDayIdx.current + candidate) - targetPx);
        if (err < bestErr) {
          best = candidate;
          bestErr = err;
        }
      }
      deltaDays = best;
    } else {
      deltaDays = Math.round(dx / columnWidth);
    }

    setDragDeltaDays(deltaDays);
    setMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, columnWidth, getColumnLeft]);

  const handleMouseUp = useCallback(() => {
    if (!initialDates.current || dragDeltaDays === 0) {
      setIsDragging(false);
      setDragMode(null);
      setDragDeltaDays(0);
      initialDates.current = null;
      return;
    }

    const { startDate, endDate } = initialDates.current;
    let newStart, newEnd;

    if (dragMode === 'move') {
      newStart = addDays(new Date(startDate), dragDeltaDays);
      newEnd = addDays(new Date(endDate), dragDeltaDays);
    } else if (dragMode === 'resize-left') {
      newStart = addDays(new Date(startDate), dragDeltaDays);
      newEnd = new Date(endDate);
      if (newStart > newEnd) {
        newStart = new Date(newEnd);
      }
    } else if (dragMode === 'resize-right') {
      newStart = new Date(startDate);
      newEnd = addDays(new Date(endDate), dragDeltaDays);
      if (newEnd < newStart) {
        newEnd = new Date(newStart);
      }
    }

    // Keep visual dates while API call is in flight to avoid snap-back
    const finalStart = newStart ? formatDateISO(newStart) : null;
    const finalEnd = newEnd ? formatDateISO(newEnd) : null;
    if (finalStart && finalEnd) {
      setPendingDates({ startDate: finalStart, endDate: finalEnd });
    }

    setIsDragging(false);
    setDragMode(null);
    setDragDeltaDays(0);
    initialDates.current = null;

    if (finalStart && finalEnd) {
      onDateChange(finalStart, finalEnd);
    }
  }, [isDragging, dragMode, dragDeltaDays, onDateChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Clear pendingDates when the actual task dates change (server data arrived)
  useEffect(() => {
    if (pendingDates) {
      setPendingDates(null);
    }
  }, [taskStartDate, taskEndDate]);

  // Compute visual dates (with drag delta applied) for rendering
  const getVisualDates = useCallback(() => {
    if (initialDates.current && dragDeltaDays !== 0) {
      const { startDate, endDate } = initialDates.current;
      let vStart, vEnd;

      if (dragMode === 'move') {
        vStart = formatDateISO(addDays(new Date(startDate), dragDeltaDays));
        vEnd = formatDateISO(addDays(new Date(endDate), dragDeltaDays));
      } else if (dragMode === 'resize-left') {
        vStart = formatDateISO(addDays(new Date(startDate), dragDeltaDays));
        vEnd = endDate;
        if (vStart > vEnd) vStart = vEnd;
      } else if (dragMode === 'resize-right') {
        vStart = startDate;
        vEnd = formatDateISO(addDays(new Date(endDate), dragDeltaDays));
        if (vEnd < vStart) vEnd = vStart;
      }

      return { startDate: vStart, endDate: vEnd };
    }

    // Return pending dates while API call is in flight
    if (pendingDates) return pendingDates;

    return null;
  }, [dragMode, dragDeltaDays, pendingDates]);

  const clearPendingDates = useCallback(() => setPendingDates(null), []);

  return {
    isDragging,
    dragMode,
    dragDeltaDays,
    mousePos,
    handleCellMouseDown,
    getVisualDates,
    clearPendingDates,
  };
}
