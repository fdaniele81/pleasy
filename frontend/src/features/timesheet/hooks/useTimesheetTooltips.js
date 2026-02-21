import { useState, useCallback, useRef, useEffect } from 'react';

export function useTimesheetTooltips() {
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipTimeoutRef = useRef(null);

  const [hoveredNoteCell, setHoveredNoteCell] = useState(null);
  const [noteTooltipPosition, setNoteTooltipPosition] = useState({ x: 0, y: 0 });
  const noteTooltipTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      if (noteTooltipTimeoutRef.current) {
        clearTimeout(noteTooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleTooltipHover = useCallback((event, taskId) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    const rect = event.currentTarget.getBoundingClientRect();

    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipPosition({
        x: rect.right + 8,
        y: rect.top + rect.height / 2,
      });
      setHoveredTaskId(taskId);
    }, 1000);
  }, []);

  const handleTooltipLeave = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setHoveredTaskId(null);
  }, []);

  const clearTooltip = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setHoveredTaskId(null);
  }, []);

  const handleNoteTooltipHover = useCallback((event, taskId, date, details, type = 'task') => {
    if (noteTooltipTimeoutRef.current) {
      clearTimeout(noteTooltipTimeoutRef.current);
    }

    const rect = event.currentTarget.getBoundingClientRect();

    noteTooltipTimeoutRef.current = setTimeout(() => {
      setNoteTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
      setHoveredNoteCell({ taskId, date, details, type });
    }, 500);
  }, []);

  const handleNoteTooltipLeave = useCallback(() => {
    if (noteTooltipTimeoutRef.current) {
      clearTimeout(noteTooltipTimeoutRef.current);
      noteTooltipTimeoutRef.current = null;
    }
    setHoveredNoteCell(null);
  }, []);

  return {
    hoveredTaskId,
    tooltipPosition,
    handleTooltipHover,
    handleTooltipLeave,
    clearTooltip,

    hoveredNoteCell,
    noteTooltipPosition,
    handleNoteTooltipHover,
    handleNoteTooltipLeave,
  };
}

export default useTimesheetTooltips;
