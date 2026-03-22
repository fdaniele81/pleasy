import { useState, useEffect, useCallback } from 'react';
import { BREAKPOINTS, getCurrentBreakpoint, isMobile as checkIsMobile } from '../constants/breakpoints';

export function useBreakpoint() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    let rafId;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setWidth(window.innerWidth);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const breakpoint = getCurrentBreakpoint(width);
  const mobile = checkIsMobile(width);

  const isAbove = useCallback((bp) => width >= (BREAKPOINTS[bp] ?? bp), [width]);
  const isBelow = useCallback((bp) => width < (BREAKPOINTS[bp] ?? bp), [width]);

  return {
    width,
    breakpoint,
    isMobile: mobile,
    isTablet: width >= BREAKPOINTS.SM && width < BREAKPOINTS.LG,
    isDesktop: width >= BREAKPOINTS.LG,
    isAbove,
    isBelow,
  };
}
