import { useState, useRef, useEffect, useCallback } from 'react';
import { addDays, formatDateISO } from '../../../utils/date/dateUtils';

export function useTimelineDrag({ columnWidth, getColumnLeft, onDateChange, taskStartDate, taskEndDate }) {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingDates, setPendingDates] = useState(null);

  const dragRef = useRef({
    mode: null,
    startMouseX: 0,
    anchorDayIdx: 0,
    initialDates: null,
    deltaDays: 0,
    barElement: null,
    initialLeft: 0,
    initialWidth: 0,
  });

  // Binary search: columns are non-uniform (some columnWidth, some columnWidth+1),
  // so a simple dx/columnWidth approximation can be off by many days.
  const computeDeltaDays = useCallback((dx) => {
    if (!getColumnLeft) return Math.round(dx / (columnWidth || 1));

    const anchor = dragRef.current.anchorDayIdx;
    const targetPx = getColumnLeft(anchor) + dx;
    const maxDelta = Math.ceil(Math.abs(dx) / Math.max(columnWidth, 1)) + 2;

    let lo = dx >= 0 ? 0 : Math.max(-maxDelta, -anchor);
    let hi = dx >= 0 ? maxDelta : 0;

    // Find largest delta where getColumnLeft(anchor + delta) <= targetPx
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (getColumnLeft(anchor + mid) <= targetPx) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }

    // lo = floor. Pick whichever of lo, lo+1 is closest.
    const errLo = Math.abs(getColumnLeft(anchor + lo) - targetPx);
    const errHi = Math.abs(getColumnLeft(anchor + lo + 1) - targetPx);
    return errHi < errLo ? lo + 1 : lo;
  }, [columnWidth, getColumnLeft]);

  const handleCellMouseDown = useCallback((e, mode, startDate, endDate, anchorDay, _edgeOffsetX = 0, barEl) => {
    e.stopPropagation();
    e.preventDefault();

    const state = dragRef.current;
    state.mode = mode;
    state.startMouseX = e.clientX;
    state.anchorDayIdx = anchorDay ?? 0;
    state.initialDates = { startDate, endDate };
    state.deltaDays = 0;
    state.barElement = barEl || null;
    state.initialLeft = barEl ? parseFloat(barEl.style.left) || 0 : 0;
    state.initialWidth = barEl ? parseFloat(barEl.style.width) || 0 : 0;

    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const state = dragRef.current;
    if (!state.mode) return;
    e.preventDefault();

    const dx = e.clientX - state.startMouseX;
    const deltaDays = computeDeltaDays(dx);
    state.deltaDays = deltaDays;

    // Direct DOM: move bar smoothly with raw pixels
    if (state.barElement) {
      if (state.mode === 'move') {
        state.barElement.style.left = (state.initialLeft + dx) + 'px';
      } else if (state.mode === 'resize-left') {
        state.barElement.style.left = (state.initialLeft + dx) + 'px';
        state.barElement.style.width = Math.max(state.initialWidth - dx, 4) + 'px';
      } else if (state.mode === 'resize-right') {
        state.barElement.style.width = Math.max(state.initialWidth + dx, 4) + 'px';
      }
    }

    // Direct DOM: update tooltip
    const tooltipEl = document.getElementById('timeline-drag-tooltip');
    if (tooltipEl && state.barElement) {
      const barRect = state.barElement.getBoundingClientRect();
      tooltipEl.style.left = (barRect.left + barRect.width / 2) + 'px';
      tooltipEl.style.top = (barRect.top - 28) + 'px';

      const { startDate, endDate } = state.initialDates;
      let vStart, vEnd;
      if (state.mode === 'move') {
        vStart = formatDateISO(addDays(new Date(startDate), deltaDays));
        vEnd = formatDateISO(addDays(new Date(endDate), deltaDays));
      } else if (state.mode === 'resize-left') {
        vStart = formatDateISO(addDays(new Date(startDate), deltaDays));
        vEnd = endDate;
        if (vStart > vEnd) vStart = vEnd;
      } else if (state.mode === 'resize-right') {
        vStart = startDate;
        vEnd = formatDateISO(addDays(new Date(endDate), deltaDays));
        if (vEnd < vStart) vEnd = vStart;
      }
      tooltipEl.textContent = `${formatShortDate(vStart)} → ${formatShortDate(vEnd)}`;
    }
  }, [computeDeltaDays]);

  const handleMouseUp = useCallback(() => {
    const state = dragRef.current;
    if (!state.mode || !state.initialDates) {
      state.mode = null;
      setIsDragging(false);
      return;
    }

    // Read deltaDays directly from ref (computed during last mousemove)
    const deltaDays = state.deltaDays;
    const mode = state.mode;
    const { startDate, endDate } = state.initialDates;

    // Snap bar to day-aligned position before React re-renders
    if (state.barElement && deltaDays !== 0) {
      if (mode === 'move') {
        const newLeft = getColumnLeft(state.anchorDayIdx + deltaDays);
        state.barElement.style.left = newLeft + 'px';
      } else if (mode === 'resize-left') {
        const newLeft = getColumnLeft(state.anchorDayIdx + deltaDays);
        const newWidth = (state.initialLeft + state.initialWidth) - newLeft;
        state.barElement.style.left = newLeft + 'px';
        state.barElement.style.width = Math.max(newWidth, 4) + 'px';
      } else if (mode === 'resize-right') {
        const newRight = getColumnLeft(state.anchorDayIdx + deltaDays);
        const newWidth = newRight - state.initialLeft;
        state.barElement.style.width = Math.max(newWidth, 4) + 'px';
      }
    }

    // Reset
    state.mode = null;
    state.barElement = null;
    state.deltaDays = 0;
    setIsDragging(false);

    if (deltaDays === 0) return;

    let newStart, newEnd;
    if (mode === 'move') {
      newStart = addDays(new Date(startDate), deltaDays);
      newEnd = addDays(new Date(endDate), deltaDays);
    } else if (mode === 'resize-left') {
      newStart = addDays(new Date(startDate), deltaDays);
      newEnd = new Date(endDate);
      if (newStart > newEnd) newStart = new Date(newEnd);
    } else if (mode === 'resize-right') {
      newStart = new Date(startDate);
      newEnd = addDays(new Date(endDate), deltaDays);
      if (newEnd < newStart) newEnd = new Date(newStart);
    }

    const finalStart = newStart ? formatDateISO(newStart) : null;
    const finalEnd = newEnd ? formatDateISO(newEnd) : null;
    if (finalStart && finalEnd) {
      setPendingDates({ startDate: finalStart, endDate: finalEnd });
      onDateChange(finalStart, finalEnd);
    }
  }, [onDateChange, getColumnLeft]);

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

  useEffect(() => {
    if (pendingDates) {
      setPendingDates(null);
    }
  }, [taskStartDate, taskEndDate]);

  const getVisualDates = useCallback(() => {
    if (pendingDates) return pendingDates;
    return null;
  }, [pendingDates]);

  const clearPendingDates = useCallback(() => setPendingDates(null), []);

  return {
    isDragging,
    handleCellMouseDown,
    getVisualDates,
    clearPendingDates,
  };
}

function formatShortDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}
