import React, { useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

const PhaseIntervalsGantt = ({
  phaseIntervals,
  onIntervalsChange,
  draggedPhase,
  setDraggedPhase,
  totalDays = 10,
  isReadOnly = false,
  phases,
}) => {
  const { t } = useTranslation(['common', 'clients']);
  const totalIntervals = 10;

  const defaultPhases = [
    { key: "intervals_analysis", label: t('clients:phaseAnalysis'), color: "#870c7f" },
    { key: "intervals_development", label: t('clients:phaseDevelopment'), color: "#870c7f" },
    { key: "intervals_internal_test", label: t('clients:phaseInternalTest'), color: "#870c7f" },
    { key: "intervals_uat", label: t('clients:phaseUat'), color: "#870c7f" },
    { key: "intervals_release", label: t('clients:phaseRelease'), color: "#870c7f" },
    { key: "intervals_documentation", label: t('clients:phaseDocumentation'), color: "#870c7f" },
    { key: "intervals_startup", label: t('clients:phaseStartup'), color: "#870c7f" },
    { key: "intervals_pm", label: t('clients:phasePm'), color: "#870c7f" },
  ];

  const resolvedPhases = phases || defaultPhases;

  const getPeriodLabels = () => {
    const labels = [];

    const distributeIntervals = (numPeriods, labelPrefix) => {
      const periodSize = totalIntervals / numPeriods;

      for (let i = 0; i < numPeriods; i++) {
        labels.push({
          label: `${labelPrefix} ${i + 1}`,
          startInterval: i * periodSize,
          endInterval: (i + 1) * periodSize,
        });
      }
    };

    if (totalDays === 10) {
      distributeIntervals(2, t('common:week'));
    } else if (totalDays === 20) {
      distributeIntervals(4, t('common:week'));
    } else if (totalDays === 40) {
      distributeIntervals(2, t('common:month'));
    } else if (totalDays === 60) {
      distributeIntervals(3, t('common:month'));
    } else if (totalDays === 120) {
      distributeIntervals(6, t('common:month'));
    } else if (totalDays === 240) {
      distributeIntervals(4, t('common:quarter'));
    }

    return labels;
  };

  const periodLabels = getPeriodLabels();
  const svgRef = useRef(null);

  const dragStateRef = useRef({
    isDragging: false,
    isResizing: false,
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
  });

  const svgPointRef = useRef(null);

  const barHeight = 32;
  const rowHeight = 48;
  const leftMargin = 150;
  const topMargin = 70;
  const rightMargin = 20;
  const bottomMargin = 40;

  const availableWidth = 900;
  const intervalWidth = availableWidth / totalIntervals;
  const totalWidth = leftMargin + availableWidth + rightMargin;
  const totalHeight = topMargin + resolvedPhases.length * rowHeight + bottomMargin;

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
  }, []);

  const getBasePosition = useCallback(
    (phaseKey) => {
      const intervals = phaseIntervals[phaseKey];
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
    [phaseIntervals, leftMargin, intervalWidth]
  );

  const handleBarDragStart = useCallback(
    (e, phaseKey) => {
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
        `[data-phase-bar="${phaseKey}"]`
      );
      const handleLeftElement = svgRef.current.querySelector(
        `[data-handle-left="${phaseKey}"]`
      );
      const handleRightElement = svgRef.current.querySelector(
        `[data-handle-right="${phaseKey}"]`
      );

      if (!barElement || !handleLeftElement || !handleRightElement) {
        return;
      }

      dragStateRef.current = {
        isDragging: true,
        isResizing: false,
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
      };

      setDraggedPhase(phaseKey);
    },
    [phaseIntervals, clientToSVG, leftMargin, intervalWidth, setDraggedPhase]
  );

  const handleResizeStart = useCallback(
    (e, phaseKey, edge) => {
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
        `[data-phase-bar="${phaseKey}"]`
      );
      const handleLeftElement = svgRef.current.querySelector(
        `[data-handle-left="${phaseKey}"]`
      );
      const handleRightElement = svgRef.current.querySelector(
        `[data-handle-right="${phaseKey}"]`
      );

      if (!barElement || !handleLeftElement || !handleRightElement) {
        return;
      }

      dragStateRef.current = {
        isDragging: false,
        isResizing: true,
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
      };

      setDraggedPhase(phaseKey);
    },
    [phaseIntervals, clientToSVG, leftMargin, intervalWidth, setDraggedPhase]
  );

  const updateGripLines = useCallback(
    (handleElement, newX, yStart, barHeight) => {
      const lines = handleElement.querySelectorAll("line");
      if (lines.length === 3) {
        lines[0].setAttribute("x1", newX + 2);
        lines[0].setAttribute("x2", newX + 2);
        lines[0].setAttribute("y1", yStart + 8);
        lines[0].setAttribute("y2", yStart + barHeight - 8);

        lines[1].setAttribute("x1", newX + 5);
        lines[1].setAttribute("x2", newX + 5);
        lines[1].setAttribute("y1", yStart + 8);
        lines[1].setAttribute("y2", yStart + barHeight - 8);

        lines[2].setAttribute("x1", newX + 8);
        lines[2].setAttribute("x2", newX + 8);
        lines[2].setAttribute("y1", yStart + 8);
        lines[2].setAttribute("y2", yStart + barHeight - 8);
      }
    },
    []
  );

  const updateGripLinesRight = useCallback(
    (handleElement, newX, yStart, barHeight) => {
      const lines = handleElement.querySelectorAll("line");
      if (lines.length === 3) {
        lines[0].setAttribute("x1", newX - 8);
        lines[0].setAttribute("x2", newX - 8);
        lines[0].setAttribute("y1", yStart + 8);
        lines[0].setAttribute("y2", yStart + barHeight - 8);

        lines[1].setAttribute("x1", newX - 5);
        lines[1].setAttribute("x2", newX - 5);
        lines[1].setAttribute("y1", yStart + 8);
        lines[1].setAttribute("y2", yStart + barHeight - 8);

        lines[2].setAttribute("x1", newX - 2);
        lines[2].setAttribute("x2", newX - 2);
        lines[2].setAttribute("y1", yStart + 8);
        lines[2].setAttribute("y2", yStart + barHeight - 8);
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e) => {
      const state = dragStateRef.current;

      if (!state.isDragging && !state.isResizing) return;
      if (!state.barElement) return;

      const svgCoords = clientToSVG(e.clientX, e.clientY);
      const deltaX = svgCoords.x - state.startMouseX;

      const phaseIndex = resolvedPhases.findIndex((p) => p.key === state.phaseKey);
      const yPos = topMargin + phaseIndex * rowHeight;
      const yStart = yPos + (rowHeight - barHeight) / 2;

      if (state.isDragging) {
        let newStart = state.initialStart + deltaX / intervalWidth;
        newStart = Math.max(
          1,
          Math.min(totalIntervals - state.duration + 1, newStart)
        );

        const newX = leftMargin + (newStart - 1) * intervalWidth;

        state.barElement.setAttribute("x", newX);

        if (state.handleLeftElement) {
          const hitRect = state.handleLeftElement.querySelector("rect");
          if (hitRect) hitRect.setAttribute("x", newX - 6);
          updateGripLines(state.handleLeftElement, newX, yStart, barHeight);
        }

        if (state.handleRightElement) {
          const hitRect = state.handleRightElement.querySelector("rect");
          if (hitRect) hitRect.setAttribute("x", newX + state.baseWidth - 6);
          updateGripLinesRight(
            state.handleRightElement,
            newX + state.baseWidth,
            yStart,
            barHeight
          );
        }
      }

      else if (state.isResizing) {
        const deltaIntervals = deltaX / intervalWidth;

        if (state.resizeEdge === "left") {
          let newStart = state.initialStart + Math.round(deltaIntervals);
          newStart = Math.max(1, Math.min(state.initialEnd, newStart));

          const newX = leftMargin + (newStart - 1) * intervalWidth;
          const newWidth = (state.initialEnd - newStart + 1) * intervalWidth;

          state.barElement.setAttribute("x", newX);
          state.barElement.setAttribute("width", newWidth);

          if (state.handleLeftElement) {
            const hitRect = state.handleLeftElement.querySelector("rect");
            if (hitRect) hitRect.setAttribute("x", newX - 6);
            updateGripLines(state.handleLeftElement, newX, yStart, barHeight);
          }

          if (state.handleRightElement) {
            const hitRect = state.handleRightElement.querySelector("rect");
            if (hitRect) hitRect.setAttribute("x", newX + newWidth - 6);
            updateGripLinesRight(
              state.handleRightElement,
              newX + newWidth,
              yStart,
              barHeight
            );
          }
        } else if (state.resizeEdge === "right") {
          let newEnd = state.initialEnd + Math.round(deltaIntervals);
          newEnd = Math.max(
            state.initialStart,
            Math.min(totalIntervals, newEnd)
          );

          const newWidth = (newEnd - state.initialStart + 1) * intervalWidth;

          state.barElement.setAttribute("width", newWidth);

          if (state.handleRightElement) {
            const hitRect = state.handleRightElement.querySelector("rect");
            if (hitRect) hitRect.setAttribute("x", state.baseX + newWidth - 6);
            updateGripLinesRight(
              state.handleRightElement,
              state.baseX + newWidth,
              yStart,
              barHeight
            );
          }
        }
      }
    },
    [
      clientToSVG,
      intervalWidth,
      totalIntervals,
      leftMargin,
      updateGripLines,
      updateGripLinesRight,
      resolvedPhases,
      topMargin,
      rowHeight,
      barHeight,
    ]
  );

  const handleMouseUp = useCallback(() => {
    const state = dragStateRef.current;

    if (!state.isDragging && !state.isResizing) return;
    if (!state.phaseKey || !state.barElement) return;

    const currentX = parseFloat(state.barElement.getAttribute("x"));
    const currentWidth = parseFloat(state.barElement.getAttribute("width"));

    const newStart = (currentX - leftMargin) / intervalWidth + 1;
    const newEnd = newStart + currentWidth / intervalWidth - 1;

    const roundedStart = Math.max(
      1,
      Math.min(totalIntervals, Math.round(newStart))
    );
    const roundedEnd = Math.max(
      1,
      Math.min(totalIntervals, Math.round(newEnd))
    );

    const newIntervals = [];
    for (let i = roundedStart; i <= roundedEnd; i++) {
      newIntervals.push(i);
    }

    const snappedX = leftMargin + (roundedStart - 1) * intervalWidth;
    const snappedWidth = (roundedEnd - roundedStart + 1) * intervalWidth;

    const phaseIndex = resolvedPhases.findIndex((p) => p.key === state.phaseKey);
    const yPos = topMargin + phaseIndex * rowHeight;
    const yStart = yPos + (rowHeight - barHeight) / 2;

    state.barElement.setAttribute("x", snappedX);
    state.barElement.setAttribute("width", snappedWidth);

    if (state.handleLeftElement) {
      const hitRect = state.handleLeftElement.querySelector("rect");
      if (hitRect) hitRect.setAttribute("x", snappedX - 6);
      updateGripLines(state.handleLeftElement, snappedX, yStart, barHeight);
    }

    if (state.handleRightElement) {
      const hitRect = state.handleRightElement.querySelector("rect");
      if (hitRect) hitRect.setAttribute("x", snappedX + snappedWidth - 6);
      updateGripLinesRight(
        state.handleRightElement,
        snappedX + snappedWidth,
        yStart,
        barHeight
      );
    }

    onIntervalsChange({
      ...phaseIntervals,
      [state.phaseKey]: newIntervals,
    });

    dragStateRef.current = {
      isDragging: false,
      isResizing: false,
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
    };

    setDraggedPhase(null);
  }, [
    phaseIntervals,
    onIntervalsChange,
    leftMargin,
    intervalWidth,
    totalIntervals,
    setDraggedPhase,
    updateGripLines,
    updateGripLinesRight,
    resolvedPhases,
    topMargin,
    rowHeight,
    barHeight,
  ]);

  useEffect(() => {
    const state = dragStateRef.current;

    if (state.isDragging || state.isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedPhase, handleMouseMove, handleMouseUp]);

  return (
    <svg
      ref={svgRef}
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="rounded-lg bg-white w-full"
      style={{
        cursor: draggedPhase ? "grabbing" : "default",
        maxWidth: "100%",
        userSelect: "none",
      }}
    >
      <rect width="100%" height="100%" fill="#FAFAFA" />

      <g>
        {periodLabels.map((period, idx) => {
          const startX = leftMargin + period.startInterval * intervalWidth;
          const endX = leftMargin + period.endInterval * intervalWidth;
          const width = endX - startX;
          const centerX = startX + width / 2;

          return (
            <g key={idx}>
              <rect
                x={startX + 2}
                y={topMargin - 60}
                width={width - 4}
                height={50}
                fill="#374151"
                stroke="#1F2937"
                strokeWidth={1}
                rx={4}
              />
              <text
                x={centerX}
                y={topMargin - 30}
                textAnchor="middle"
                fontSize={14}
                fontWeight="700"
                fill="#FFFFFF"
              >
                {period.label}
              </text>
            </g>
          );
        })}
        {Array.from({ length: totalIntervals }, (_, i) => i + 1).map(
          (interval) => (
            <line
              key={interval}
              x1={leftMargin + interval * intervalWidth}
              y1={topMargin}
              x2={leftMargin + interval * intervalWidth}
              y2={topMargin + resolvedPhases.length * rowHeight}
              stroke="#E5E7EB"
              strokeWidth={1}
              opacity={0.5}
            />
          )
        )}
      </g>

      {resolvedPhases.map((phase, phaseIndex) => {
        const yPos = topMargin + phaseIndex * rowHeight;
        const barPosition = getBasePosition(phase.key);
        const isActive = draggedPhase === phase.key;

        return (
          <g key={phase.key}>
            <rect
              x={0}
              y={yPos}
              width={totalWidth}
              height={rowHeight}
              fill={phaseIndex % 2 === 0 ? "#FFFFFF" : "#F9FAFB"}
            />

            <text
              x={8}
              y={yPos + rowHeight / 2 + 5}
              fontSize={14}
              fontWeight="600"
              fill="#374151"
            >
              {phase.label}
            </text>

            {barPosition && (
              <>
                <rect
                  data-phase-bar={phase.key}
                  x={barPosition.x}
                  y={yPos + (rowHeight - barHeight) / 2}
                  width={barPosition.width}
                  height={barHeight}
                  fill={phase.color}
                  rx={6}
                  opacity={isActive ? 0.9 : 0.75}
                  style={{ cursor: isReadOnly ? "default" : "grab" }}
                  onMouseDown={
                    isReadOnly
                      ? undefined
                      : (e) => handleBarDragStart(e, phase.key)
                  }
                  className={`phase-bar-${phase.key}`}
                />

                {!isReadOnly && (
                  <g
                    data-handle-left={phase.key}
                    className={`resize-handle-left resize-handle-${phase.key}`}
                    style={{ cursor: "ew-resize", opacity: isActive ? 1 : 0 }}
                    onMouseDown={(e) => handleResizeStart(e, phase.key, "left")}
                  >
                    <rect
                      x={barPosition.x - 6}
                      y={yPos + (rowHeight - barHeight) / 2}
                      width={12}
                      height={barHeight}
                      fill="transparent"
                    />
                    <line
                      x1={barPosition.x + 2}
                      y1={yPos + (rowHeight - barHeight) / 2 + 8}
                      x2={barPosition.x + 2}
                      y2={yPos + (rowHeight - barHeight) / 2 + barHeight - 8}
                      stroke="white"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                    <line
                      x1={barPosition.x + 5}
                      y1={yPos + (rowHeight - barHeight) / 2 + 8}
                      x2={barPosition.x + 5}
                      y2={yPos + (rowHeight - barHeight) / 2 + barHeight - 8}
                      stroke="white"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                    <line
                      x1={barPosition.x + 8}
                      y1={yPos + (rowHeight - barHeight) / 2 + 8}
                      x2={barPosition.x + 8}
                      y2={yPos + (rowHeight - barHeight) / 2 + barHeight - 8}
                      stroke="white"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {!isReadOnly && (
                  <g
                    data-handle-right={phase.key}
                    className={`resize-handle-right resize-handle-${phase.key}`}
                    style={{ cursor: "ew-resize", opacity: isActive ? 1 : 0 }}
                    onMouseDown={(e) =>
                      handleResizeStart(e, phase.key, "right")
                    }
                  >
                    <rect
                      x={barPosition.x + barPosition.width - 6}
                      y={yPos + (rowHeight - barHeight) / 2}
                      width={12}
                      height={barHeight}
                      fill="transparent"
                    />
                    <line
                      x1={barPosition.x + barPosition.width - 8}
                      y1={yPos + (rowHeight - barHeight) / 2 + 8}
                      x2={barPosition.x + barPosition.width - 8}
                      y2={yPos + (rowHeight - barHeight) / 2 + barHeight - 8}
                      stroke="white"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                    <line
                      x1={barPosition.x + barPosition.width - 5}
                      y1={yPos + (rowHeight - barHeight) / 2 + 8}
                      x2={barPosition.x + barPosition.width - 5}
                      y2={yPos + (rowHeight - barHeight) / 2 + barHeight - 8}
                      stroke="white"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                    <line
                      x1={barPosition.x + barPosition.width - 2}
                      y1={yPos + (rowHeight - barHeight) / 2 + 8}
                      x2={barPosition.x + barPosition.width - 2}
                      y2={yPos + (rowHeight - barHeight) / 2 + barHeight - 8}
                      stroke="white"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  </g>
                )}

                <style>{`
                  .phase-bar-${phase.key}:hover ~ .resize-handle-${phase.key} {
                    opacity: 0.8 !important;
                    transition: opacity 0.2s ease;
                  }
                  .resize-handle-${phase.key}:hover {
                    opacity: 1 !important;
                  }
                `}</style>
              </>
            )}
          </g>
        );
      })}

      <rect
        x={0}
        y={0}
        width={totalWidth}
        height={totalHeight}
        fill="none"
        stroke="#D1D5DB"
        strokeWidth={1}
        rx={8}
      />
    </svg>
  );
};

export default PhaseIntervalsGantt;
