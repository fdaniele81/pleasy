import { useState, useEffect, useCallback, useRef } from 'react';

export function useTooltipDelay(delay = 500) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleTooltipEnter = useCallback((cellId, element) => {
    if (element && element.scrollWidth <= element.clientWidth) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setHoveredCell(cellId);
    }, delay);
  }, [delay]);

  const handleTooltipLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setHoveredCell(null);
  }, []);

  return {
    hoveredCell,
    handleTooltipEnter,
    handleTooltipLeave,
    setHoveredCell,
  };
}

export default useTooltipDelay;
