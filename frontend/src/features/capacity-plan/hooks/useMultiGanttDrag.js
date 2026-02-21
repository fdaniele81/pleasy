import { useRef, useCallback, useEffect, useState } from 'react';

const phases = [
  { key: 'intervals_analysis', labelKey: 'phaseAnalysis' },
  { key: 'intervals_development', labelKey: 'phaseDevelopment' },
  { key: 'intervals_internal_test', labelKey: 'phaseInternalTest' },
  { key: 'intervals_uat', labelKey: 'phaseUAT' },
  { key: 'intervals_release', labelKey: 'phaseRelease' },
  { key: 'intervals_documentation', labelKey: 'phaseDocumentation' },
  { key: 'intervals_startup', labelKey: 'phaseStartup' },
  { key: 'intervals_pm', labelKey: 'phasePM' },
];

// Aggiorna posizione di un handle (sinistro o destro) nel DOM
function updateHandle(handleElement, x, y, offsets) {
  if (!handleElement) return;
  const hitRect = handleElement.querySelector('rect');
  if (hitRect) hitRect.setAttribute('x', x - 6);
  const lines = handleElement.querySelectorAll('line');
  lines.forEach((line, idx) => {
    line.setAttribute('x1', x + offsets[idx]);
    line.setAttribute('x2', x + offsets[idx]);
  });
}

const LEFT_OFFSETS = [2, 5, 8];
const RIGHT_OFFSETS = [-8, -5, -2];

const INITIAL_DRAG_STATE = {
  isDragging: false,
  isResizing: false,
  isBlockDragging: false,
  estimateId: null,
  phaseKey: null,
  resizeEdge: null,
  initialStart: null,
  initialEnd: null,
  duration: null,
  baseX: null,
  baseWidth: null,
  startMouseX: null,
  barElement: null,
  handleLeftElement: null,
  handleRightElement: null,
  phaseLabelElement: null,
  summaryBarElement: null,
  summaryGroupElement: null,
  summaryTextElement: null,
  initialPhaseIntervals: null,
};

/**
 * Hook per gestire la logica drag-and-drop del MultiGanttContainer.
 * Gestisce drag singola fase, resize e block drag della barra riassuntiva.
 */
export function useMultiGanttDrag({
  svgRef,
  totalIntervals,
  intervalWidth,
  leftMargin,
  estimatesList,
  onIntervalsChange,
}) {
  const svgPointRef = useRef(null);
  const [draggedPhase, setDraggedPhase] = useState(null);
  const dragStateRef = useRef({ ...INITIAL_DRAG_STATE });

  // --- Utility functions ---

  const clientToSVG = useCallback((clientX, clientY) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    if (!svgPointRef.current) {
      svgPointRef.current = svgRef.current.createSVGPoint();
    }

    const point = svgPointRef.current;
    point.x = clientX;
    point.y = clientY;

    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };

    const svgPoint = point.matrixTransform(ctm.inverse());
    return { x: svgPoint.x, y: svgPoint.y };
  }, [svgRef]);

  const getEstimateRange = useCallback((phaseIntervals) => {
    let minStart = totalIntervals;
    let maxEnd = 1;
    let hasIntervals = false;

    phases.forEach((phase) => {
      const intervals = phaseIntervals[phase.key];
      if (intervals && intervals.length > 0) {
        hasIntervals = true;
        const sorted = [...intervals].sort((a, b) => a - b);
        minStart = Math.min(minStart, sorted[0]);
        maxEnd = Math.max(maxEnd, sorted[sorted.length - 1]);
      }
    });

    return hasIntervals ? { start: minStart, end: maxEnd } : null;
  }, [totalIntervals]);

  const getBasePosition = useCallback(
    (intervals) => {
      if (!intervals || intervals.length === 0) return null;

      const sortedIntervals = [...intervals].sort((a, b) => a - b);
      const start = sortedIntervals[0];
      const end = sortedIntervals[sortedIntervals.length - 1];
      return {
        x: leftMargin + (start - 1) * intervalWidth,
        width: (end - start + 1) * intervalWidth,
        start,
        end,
      };
    },
    [leftMargin, intervalWidth]
  );

  const shiftAllPhasesByDelta = useCallback(
    (_estimateId, initialPhaseIntervals, deltaIntervals) => {
      const newPhaseIntervals = {};
      phases.forEach((phase) => {
        const intervals = initialPhaseIntervals[phase.key];
        if (intervals && intervals.length > 0) {
          newPhaseIntervals[phase.key] = intervals.map((i) =>
            Math.max(1, Math.min(totalIntervals, i + deltaIntervals))
          );
        } else {
          newPhaseIntervals[phase.key] = intervals;
        }
      });
      return newPhaseIntervals;
    },
    [totalIntervals]
  );

  // --- Reset helper ---

  const resetDragState = useCallback(() => {
    const hadMoved = dragStateRef.current.hasMoved;
    dragStateRef.current = {
      ...INITIAL_DRAG_STATE,
      hasMoved: hadMoved,
    };

    // Reset hasMoved dopo un breve delay per permettere al click handler di leggerlo
    setTimeout(() => {
      dragStateRef.current.hasMoved = false;
    }, 10);

    setDraggedPhase(null);
  }, []);

  // --- Start handlers ---

  const handleBlockDragStart = useCallback(
    (e, estimateId, phaseIntervals) => {
      e.stopPropagation();

      const svgCoords = clientToSVG(e.clientX, e.clientY);
      const range = getEstimateRange(phaseIntervals);
      if (!range) return;

      const summaryGroupElement = svgRef.current.querySelector(
        `[data-summary-group="${estimateId}"]`
      );
      const summaryBarElement = svgRef.current.querySelector(
        `[data-summary-bar="${estimateId}"]`
      );

      if (!summaryGroupElement || !summaryBarElement) return;

      dragStateRef.current = {
        isDragging: false,
        isResizing: false,
        isBlockDragging: true,
        estimateId,
        phaseKey: null,
        resizeEdge: null,
        initialStart: range.start,
        initialEnd: range.end,
        duration: range.end - range.start + 1,
        baseX: leftMargin + (range.start - 1) * intervalWidth,
        baseWidth: (range.end - range.start + 1) * intervalWidth,
        startMouseX: svgCoords.x,
        barElement: null,
        handleLeftElement: null,
        handleRightElement: null,
        summaryBarElement,
        summaryGroupElement,
        summaryTextElement: null,
        initialPhaseIntervals: { ...phaseIntervals },
      };

      setDraggedPhase(`block-${estimateId}`);
    },
    [clientToSVG, getEstimateRange, leftMargin, intervalWidth, svgRef]
  );

  const handleBarDragStart = useCallback(
    (e, estimateId, phaseKey, phaseIntervals) => {
      e.stopPropagation();

      const svgCoords = clientToSVG(e.clientX, e.clientY);
      const intervals = phaseIntervals[phaseKey];
      if (!intervals || intervals.length === 0) return;

      const sortedIntervals = [...intervals].sort((a, b) => a - b);
      const start = sortedIntervals[0];
      const end = sortedIntervals[sortedIntervals.length - 1];
      const duration = end - start + 1;

      const baseX = leftMargin + (start - 1) * intervalWidth;
      const baseWidth = duration * intervalWidth;

      const barElement = svgRef.current.querySelector(
        `[data-phase-bar="${estimateId}-${phaseKey}"]`
      );
      const handleLeftElement = svgRef.current.querySelector(
        `[data-handle-left="${estimateId}-${phaseKey}"]`
      );
      const handleRightElement = svgRef.current.querySelector(
        `[data-handle-right="${estimateId}-${phaseKey}"]`
      );
      const phaseLabelElement = svgRef.current.querySelector(
        `[data-phase-label="${estimateId}-${phaseKey}"]`
      );

      if (!barElement) return;

      dragStateRef.current = {
        isDragging: true,
        isResizing: false,
        estimateId,
        phaseKey,
        resizeEdge: null,
        initialStart: start,
        initialEnd: end,
        duration,
        baseX,
        baseWidth,
        startMouseX: svgCoords.x,
        barElement,
        handleLeftElement,
        handleRightElement,
        phaseLabelElement,
      };

      setDraggedPhase(`${estimateId}-${phaseKey}`);
    },
    [clientToSVG, leftMargin, intervalWidth, svgRef]
  );

  const handleResizeStart = useCallback(
    (e, estimateId, phaseKey, edge, phaseIntervals) => {
      e.stopPropagation();

      const svgCoords = clientToSVG(e.clientX, e.clientY);
      const intervals = phaseIntervals[phaseKey];
      if (!intervals || intervals.length === 0) return;

      const sortedIntervals = [...intervals].sort((a, b) => a - b);
      const start = sortedIntervals[0];
      const end = sortedIntervals[sortedIntervals.length - 1];
      const duration = end - start + 1;

      const baseX = leftMargin + (start - 1) * intervalWidth;
      const baseWidth = duration * intervalWidth;

      const barElement = svgRef.current.querySelector(
        `[data-phase-bar="${estimateId}-${phaseKey}"]`
      );
      const handleLeftElement = svgRef.current.querySelector(
        `[data-handle-left="${estimateId}-${phaseKey}"]`
      );
      const handleRightElement = svgRef.current.querySelector(
        `[data-handle-right="${estimateId}-${phaseKey}"]`
      );
      const phaseLabelElement = svgRef.current.querySelector(
        `[data-phase-label="${estimateId}-${phaseKey}"]`
      );

      if (!barElement) return;

      dragStateRef.current = {
        isDragging: false,
        isResizing: true,
        estimateId,
        phaseKey,
        resizeEdge: edge,
        initialStart: start,
        initialEnd: end,
        duration,
        baseX,
        baseWidth,
        startMouseX: svgCoords.x,
        barElement,
        handleLeftElement,
        handleRightElement,
        phaseLabelElement,
      };

      setDraggedPhase(`${estimateId}-${phaseKey}`);
    },
    [clientToSVG, leftMargin, intervalWidth, svgRef]
  );

  // --- Move handler ---

  const handleMouseMove = useCallback(
    (e) => {
      const state = dragStateRef.current;

      if (!state.isDragging && !state.isResizing && !state.isBlockDragging) return;

      const svgCoords = clientToSVG(e.clientX, e.clientY);
      const deltaX = svgCoords.x - state.startMouseX;

      // Traccia se c'è stato movimento per distinguere click da drag
      if (Math.abs(deltaX) > 3) {
        dragStateRef.current.hasMoved = true;
      }

      // Block dragging - sposta l'intero gruppo (barra, freccia, testo)
      if (state.isBlockDragging && state.summaryGroupElement) {
        let newStart = state.initialStart + deltaX / intervalWidth;
        newStart = Math.max(1, Math.min(totalIntervals - state.duration + 1, newStart));

        const translateX = (newStart - state.initialStart) * intervalWidth;
        state.summaryGroupElement.setAttribute('transform', `translate(${translateX}, 0)`);
        return;
      }

      if (!state.barElement) return;

      if (state.isDragging) {
        let newStart = state.initialStart + deltaX / intervalWidth;
        newStart = Math.max(1, Math.min(totalIntervals - state.duration + 1, newStart));

        const newX = leftMargin + (newStart - 1) * intervalWidth;

        state.barElement.setAttribute('x', newX);

        // Sposta anche il label
        if (state.phaseLabelElement) {
          state.phaseLabelElement.setAttribute('x', newX + 6);
        }

        updateHandle(state.handleLeftElement, newX, null, LEFT_OFFSETS);
        updateHandle(state.handleRightElement, newX + state.baseWidth, null, RIGHT_OFFSETS);
      } else if (state.isResizing) {
        const deltaIntervals = deltaX / intervalWidth;

        if (state.resizeEdge === 'left') {
          let newStart = state.initialStart + Math.round(deltaIntervals);
          newStart = Math.max(1, Math.min(state.initialEnd, newStart));

          const newX = leftMargin + (newStart - 1) * intervalWidth;
          const newWidth = (state.initialEnd - newStart + 1) * intervalWidth;

          state.barElement.setAttribute('x', newX);
          state.barElement.setAttribute('width', newWidth);

          // Aggiorna posizione e larghezza del label
          if (state.phaseLabelElement) {
            state.phaseLabelElement.setAttribute('x', newX + 6);
            state.phaseLabelElement.setAttribute('width', newWidth - 12);
          }

          updateHandle(state.handleLeftElement, newX, null, LEFT_OFFSETS);
          updateHandle(state.handleRightElement, newX + newWidth, null, RIGHT_OFFSETS);
        } else if (state.resizeEdge === 'right') {
          let newEnd = state.initialEnd + Math.round(deltaIntervals);
          newEnd = Math.max(state.initialStart, Math.min(totalIntervals, newEnd));

          const newWidth = (newEnd - state.initialStart + 1) * intervalWidth;

          state.barElement.setAttribute('width', newWidth);

          // Aggiorna larghezza del label
          if (state.phaseLabelElement) {
            state.phaseLabelElement.setAttribute('width', newWidth - 12);
          }

          updateHandle(state.handleRightElement, state.baseX + newWidth, null, RIGHT_OFFSETS);
        }
      }
    },
    [clientToSVG, intervalWidth, totalIntervals, leftMargin]
  );

  // --- Mouse up handler ---

  const handleMouseUp = useCallback(() => {
    const state = dragStateRef.current;

    if (!state.isDragging && !state.isResizing && !state.isBlockDragging) return;

    // Block dragging - calcola lo spostamento e aggiorna tutte le fasi
    if (state.isBlockDragging && state.summaryGroupElement && state.initialPhaseIntervals) {
      // Estrai il translateX dal transform del gruppo
      const transform = state.summaryGroupElement.getAttribute('transform') || 'translate(0, 0)';
      const match = transform.match(/translate\(([-\d.]+)/);
      const translateX = match ? parseFloat(match[1]) : 0;

      const deltaIntervals = Math.round(translateX / intervalWidth);
      const roundedNewStart = Math.max(1, Math.min(totalIntervals - state.duration + 1, state.initialStart + deltaIntervals));
      const actualDelta = roundedNewStart - state.initialStart;

      if (actualDelta !== 0) {
        const newPhaseIntervals = shiftAllPhasesByDelta(
          state.estimateId,
          state.initialPhaseIntervals,
          actualDelta
        );
        onIntervalsChange(state.estimateId, newPhaseIntervals);
      }

      // Reset transform del gruppo (le nuove posizioni verranno calcolate dal re-render)
      state.summaryGroupElement.setAttribute('transform', 'translate(0, 0)');

      resetDragState();
      return;
    }

    if (!state.estimateId || !state.phaseKey || !state.barElement) return;

    const currentX = parseFloat(state.barElement.getAttribute('x'));
    const currentWidth = parseFloat(state.barElement.getAttribute('width'));

    const newStart = (currentX - leftMargin) / intervalWidth + 1;
    const newEnd = newStart + currentWidth / intervalWidth - 1;

    const roundedStart = Math.max(1, Math.min(totalIntervals, Math.round(newStart)));
    const roundedEnd = Math.max(1, Math.min(totalIntervals, Math.round(newEnd)));

    const newIntervals = [];
    for (let i = roundedStart; i <= roundedEnd; i++) {
      newIntervals.push(i);
    }

    const snappedX = leftMargin + (roundedStart - 1) * intervalWidth;
    const snappedWidth = (roundedEnd - roundedStart + 1) * intervalWidth;

    state.barElement.setAttribute('x', snappedX);
    state.barElement.setAttribute('width', snappedWidth);

    // Snap del label
    if (state.phaseLabelElement) {
      state.phaseLabelElement.setAttribute('x', snappedX + 6);
      state.phaseLabelElement.setAttribute('width', snappedWidth - 12);
    }

    updateHandle(state.handleLeftElement, snappedX, null, LEFT_OFFSETS);
    updateHandle(state.handleRightElement, snappedX + snappedWidth, null, RIGHT_OFFSETS);

    // Trova la stima e aggiorna i suoi intervalli
    const estimateItem = estimatesList.find((e) => e.estimateId === state.estimateId);
    if (estimateItem) {
      const updatedIntervals = {
        ...estimateItem.phaseIntervals,
        [state.phaseKey]: newIntervals,
      };
      onIntervalsChange(state.estimateId, updatedIntervals);
    }

    resetDragState();
  }, [leftMargin, intervalWidth, totalIntervals, estimatesList, onIntervalsChange, shiftAllPhasesByDelta, resetDragState]);

  // --- Global event listeners ---

  useEffect(() => {
    const state = dragStateRef.current;

    if (state.isDragging || state.isResizing || state.isBlockDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedPhase, handleMouseMove, handleMouseUp]);

  return {
    draggedPhase,
    dragStateRef,
    getEstimateRange,
    getBasePosition,
    handleBlockDragStart,
    handleBarDragStart,
    handleResizeStart,
  };
}
