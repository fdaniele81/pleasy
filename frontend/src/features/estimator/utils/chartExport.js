import { calculatePeriodLabels } from './periodCalculations';
import { getCategoryColorMap } from '../../capacity-plan/utils/categoryConfig';

const NS = 'http://www.w3.org/2000/svg';

// --- Helpers SVG ---

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  return el;
}

function svgText(x, y, text, attrs = {}) {
  const el = svgEl('text', { x, y, ...attrs });
  el.textContent = text;
  return el;
}

function svgRect(x, y, w, h, attrs = {}) {
  return svgEl('rect', { x, y, width: w, height: h, ...attrs });
}

function svgLine(x1, y1, x2, y2, attrs = {}) {
  return svgEl('line', { x1, y1, x2, y2, ...attrs });
}

/** Tronca il testo per adattarlo a maxWidth (approx 6.5px per char a 11px) */
function truncateLabel(text, maxWidthPx, charWidth = 6.5) {
  const maxChars = Math.floor(maxWidthPx / charWidth);
  if (maxChars < 3) return '';
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + '\u2026';
}

// --- Colori stime (stessi del componente React) ---

const ESTIMATE_COLORS = [
  '#870c7f', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#7c3aed', '#2563eb', '#be185d',
];

const PHASES = [
  { key: 'intervals_analysis', label: 'Analisi' },
  { key: 'intervals_development', label: 'Sviluppo' },
  { key: 'intervals_internal_test', label: 'Test Interno' },
  { key: 'intervals_uat', label: 'UAT' },
  { key: 'intervals_release', label: 'Release' },
  { key: 'intervals_documentation', label: 'Documentazione' },
  { key: 'intervals_startup', label: 'Startup' },
  { key: 'intervals_pm', label: 'PM' },
];

// --- Calcolo range intervalli ---

function getEstimateRange(phaseIntervals, totalIntervals = 10) {
  let minStart = totalIntervals;
  let maxEnd = 1;
  let hasIntervals = false;

  PHASES.forEach((phase) => {
    const intervals = phaseIntervals[phase.key];
    if (intervals && intervals.length > 0) {
      hasIntervals = true;
      const sorted = [...intervals].sort((a, b) => a - b);
      minStart = Math.min(minStart, sorted[0]);
      maxEnd = Math.max(maxEnd, sorted[sorted.length - 1]);
    }
  });

  return hasIntervals ? { start: minStart, end: maxEnd } : null;
}

function getPhaseRange(intervals) {
  if (!intervals || intervals.length === 0) return null;
  const sorted = [...intervals].sort((a, b) => a - b);
  return { start: sorted[0], end: sorted[sorted.length - 1] };
}

// --- Export Gantt SVG programmatico → PNG ---

/**
 * Costruisce un SVG Gantt programmaticamente dai dati e lo esporta come PNG.
 * Non dipende dal DOM, produce output ad alta risoluzione.
 */
export const exportMultiGanttAsPNG = (estimatesList, totalDays, filenamePrefix = 'gantt', { onError } = {}) => {
  if (!estimatesList || estimatesList.length === 0) {
    onError?.('Nessuna stima da esportare');
    return;
  }

  const filename = `${filenamePrefix}-gantt-${totalDays}gg-${Date.now()}.png`;

  // Dimensioni
  const totalIntervals = 10;
  const labelColumnWidth = 28; // colonna sinistra con nome stima verticale
  const ganttLeftPad = 6;
  const ganttLeft = labelColumnWidth + ganttLeftPad;
  const availableWidth = 1100;
  const intervalWidth = availableWidth / totalIntervals;
  const rightMargin = 12;
  const totalWidth = ganttLeft + availableWidth + rightMargin;

  const barHeight = 18;
  const phaseRowHeight = 22;
  const topMargin = 48;
  const bottomMargin = 8;
  const estimateGap = 6; // spazio tra blocchi stime

  // Altezza per blocco stima (solo fasi, niente summary)
  const estimateBlockHeight = PHASES.length * phaseRowHeight;

  // Calcola altezza totale
  let totalHeight = topMargin + bottomMargin;
  totalHeight += estimatesList.length * estimateBlockHeight;
  totalHeight += Math.max(0, estimatesList.length - 1) * estimateGap;

  // Crea SVG root
  const svg = svgEl('svg', {
    xmlns: NS,
    width: totalWidth,
    height: totalHeight,
    viewBox: `0 0 ${totalWidth} ${totalHeight}`,
  });

  // Sfondo
  svg.appendChild(svgRect(0, 0, totalWidth, totalHeight, { fill: '#FAFAFA', rx: 8 }));

  // Period labels (header) - spostati a destra per la colonna label
  const periodLabels = calculatePeriodLabels(totalDays);
  periodLabels.forEach((period) => {
    const startX = ganttLeft + period.startInterval * intervalWidth;
    const endX = ganttLeft + period.endInterval * intervalWidth;
    const w = endX - startX;

    svg.appendChild(svgRect(startX + 2, topMargin - 40, w - 4, 32, {
      fill: '#374151', stroke: '#1F2937', 'stroke-width': 1, rx: 4,
    }));
    svg.appendChild(svgText(startX + w / 2, topMargin - 19, period.label, {
      'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#FFFFFF',
      'font-family': 'system-ui, -apple-system, sans-serif',
    }));
  });

  // Grid lines verticali
  for (let i = 1; i <= totalIntervals; i++) {
    const x = ganttLeft + i * intervalWidth;
    svg.appendChild(svgLine(x, topMargin, x, totalHeight - bottomMargin, {
      stroke: '#E5E7EB', 'stroke-width': 1, opacity: 0.5,
    }));
  }

  // Righe per ogni stima
  let currentY = topMargin;

  estimatesList.forEach((estimateItem, estimateIndex) => {
    const { estimate, phaseIntervals } = estimateItem;
    const color = ESTIMATE_COLORS[estimateIndex % ESTIMATE_COLORS.length];
    const blockStartY = currentY;

    // --- Righe fasi ---
    PHASES.forEach((phase, phaseIndex) => {
      const phaseBg = phaseIndex % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
      svg.appendChild(svgRect(labelColumnWidth, currentY, totalWidth - labelColumnWidth, phaseRowHeight, { fill: phaseBg }));

      const intervals = phaseIntervals[phase.key];
      const phaseRange = getPhaseRange(intervals);

      if (phaseRange) {
        const barX = ganttLeft + (phaseRange.start - 1) * intervalWidth;
        const barW = (phaseRange.end - phaseRange.start + 1) * intervalWidth;
        const barY = currentY + (phaseRowHeight - barHeight) / 2;

        // Barra fase
        svg.appendChild(svgRect(barX, barY, barW, barHeight, {
          fill: color, rx: 4, opacity: 0.75,
        }));

        // Label fase (troncata)
        const maxLabelW = barW - 8;
        const truncatedPhase = truncateLabel(phase.label, maxLabelW, 5.5);
        if (truncatedPhase) {
          svg.appendChild(svgText(barX + 5, barY + barHeight / 2 + 3.5, truncatedPhase, {
            'font-size': 10, 'font-weight': 500, fill: '#FFFFFF',
            'font-family': 'system-ui, -apple-system, sans-serif',
          }));
        }
      }

      currentY += phaseRowHeight;
    });

    // --- Colonna sinistra: rettangolo colorato con testo verticale ---
    const blockH = currentY - blockStartY;
    svg.appendChild(svgRect(0, blockStartY, labelColumnWidth, blockH, {
      fill: color, opacity: 0.85,
    }));

    // Testo verticale (ruotato -90°, dal basso verso l'alto)
    const labelText = `${estimate?.client_name || ''} - ${estimate?.title || ''}`;
    const maxVerticalChars = Math.floor(blockH / 6);
    const truncatedVertical = labelText.length > maxVerticalChars
      ? labelText.slice(0, maxVerticalChars - 1) + '\u2026'
      : labelText;

    const textCenterX = labelColumnWidth / 2;
    const textCenterY = blockStartY + blockH / 2;

    svg.appendChild(svgText(textCenterX, textCenterY, truncatedVertical, {
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': 10,
      'font-weight': 600,
      fill: '#FFFFFF',
      'font-family': 'system-ui, -apple-system, sans-serif',
      transform: `rotate(-90, ${textCenterX}, ${textCenterY})`,
    }));

    // Linea separatrice tra stime (centrata nel gap)
    if (estimateIndex < estimatesList.length - 1) {
      const lineY = currentY + estimateGap / 2;
      svg.appendChild(svgLine(0, lineY, totalWidth, lineY, {
        stroke: '#D1D5DB', 'stroke-width': 1,
      }));
      currentY += estimateGap;
    }
  });

  // Bordo esterno
  svg.appendChild(svgRect(0, 0, totalWidth, totalHeight, {
    fill: 'none', stroke: '#D1D5DB', 'stroke-width': 1, rx: 8,
  }));

  // --- SVG → Canvas → PNG ---
  const scale = 2;
  const svgData = new XMLSerializer().serializeToString(svg);
  const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    ctx.drawImage(img, 0, 0, totalWidth, totalHeight);

    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  };

  img.src = dataUrl;
};

/**
 * Export del grafico FTE come PNG.
 * Approccio: genera un SVG programmaticamente dai dati FTE, poi lo
 * converte in PNG via Canvas. Non dipende dal DOM né da html2canvas.
 */
export const exportFTEChartAsPNG = (fteResults, filenamePrefix = 'fte', totalDays, orderedKeys, customColors, t) => {
  if (!fteResults || !fteResults.intervals) return;

  const width = 1200;
  const height = 600;
  const margin = { top: 60, right: 40, bottom: 80, left: 100 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const rawKeys = fteResults.distribution_categories || ['functional', 'technical', 'governance'];
  const categoryKeys = orderedKeys || rawKeys;
  const baseColorMap = getCategoryColorMap(rawKeys, t);
  const colorMap = { ...baseColorMap };
  if (customColors) {
    Object.entries(customColors).forEach(([key, color]) => {
      if (colorMap[key]) {
        colorMap[key] = { ...colorMap[key], color };
      }
    });
  }

  const maxFTE = Math.max(
    ...fteResults.intervals.map((interval) => {
      if (interval.fte_categories) {
        return Object.values(interval.fte_categories).reduce((sum, v) => sum + (v || 0), 0);
      }
      return (interval.fte_funzionale || 0) + (interval.fte_tecnico || 0) + (interval.fte_governance || 0);
    })
  );

  const barWidth = chartWidth / 10;
  const periodLabels = calculatePeriodLabels(totalDays, t);

  // Costruzione SVG programmatica
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('xmlns', NS);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // Sfondo bianco
  const bgRect = document.createElementNS(NS, 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', 'white');
  svg.appendChild(bgRect);

  // Titolo
  const title = document.createElementNS(NS, 'text');
  title.setAttribute('x', width / 2);
  title.setAttribute('y', 30);
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '20');
  title.setAttribute('font-weight', 'bold');
  title.setAttribute('fill', '#374151');
  title.textContent = t ? t('capacityPlan:ftePerPeriod') : 'FTE per Periodo';
  svg.appendChild(title);

  // Griglia Y
  const yAxisSteps = 5;
  for (let i = 0; i <= yAxisSteps; i++) {
    const yValue = (maxFTE / yAxisSteps) * i;
    const yPos = margin.top + chartHeight - (chartHeight / yAxisSteps) * i;

    const gridLine = document.createElementNS(NS, 'line');
    gridLine.setAttribute('x1', margin.left);
    gridLine.setAttribute('y1', yPos);
    gridLine.setAttribute('x2', margin.left + chartWidth);
    gridLine.setAttribute('y2', yPos);
    gridLine.setAttribute('stroke', '#E5E7EB');
    gridLine.setAttribute('stroke-width', '1');
    gridLine.setAttribute('stroke-dasharray', i === 0 ? '0' : '4,4');
    svg.appendChild(gridLine);

    const yLabel = document.createElementNS(NS, 'text');
    yLabel.setAttribute('x', margin.left - 10);
    yLabel.setAttribute('y', yPos + 4);
    yLabel.setAttribute('text-anchor', 'end');
    yLabel.setAttribute('font-size', '10');
    yLabel.setAttribute('fill', '#6B7280');
    yLabel.textContent = yValue.toFixed(1);
    svg.appendChild(yLabel);
  }

  // Barre FTE per intervallo
  fteResults.intervals.forEach((interval, idx) => {
    let totalFTE = 0;
    const categoryValues = categoryKeys.map((catKey) => {
      const val = interval.fte_categories?.[catKey] || 0;
      totalFTE += val;
      return { key: catKey, value: val };
    });

    const barHeight = maxFTE > 0 ? (totalFTE / maxFTE) * chartHeight : 0;
    const x = margin.left + idx * barWidth;
    const y = margin.top + chartHeight - barHeight;

    let currentY = y;

    // Disegna le barre in ordine inverso (prima in alto, ultimo in basso)
    [...categoryValues].reverse().forEach(({ key, value }) => {
      if (value > 0) {
        const segmentHeight = maxFTE > 0 ? (value / maxFTE) * chartHeight : 0;
        const rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('x', x + 5);
        rect.setAttribute('y', currentY);
        rect.setAttribute('width', barWidth - 10);
        rect.setAttribute('height', segmentHeight);
        rect.setAttribute('fill', colorMap[key]?.color || '#9CA3AF');
        svg.appendChild(rect);
        currentY += segmentHeight;
      }
    });

    if (totalFTE > 0) {
      const totalLabel = document.createElementNS(NS, 'text');
      totalLabel.setAttribute('x', x + barWidth / 2);
      totalLabel.setAttribute('y', y - 8);
      totalLabel.setAttribute('text-anchor', 'middle');
      totalLabel.setAttribute('font-size', '12');
      totalLabel.setAttribute('font-weight', 'bold');
      totalLabel.setAttribute('fill', '#374151');
      totalLabel.textContent = totalFTE.toFixed(1);
      svg.appendChild(totalLabel);
    }
  });

  // Etichette periodo (usa formato nuovo: startInterval/endInterval, 0-based)
  periodLabels.forEach((period) => {
    const startX = margin.left + period.startInterval * barWidth;
    const endX = margin.left + period.endInterval * barWidth;
    const bandWidth = endX - startX;
    const bandY = margin.top + chartHeight + 5;
    const bandHeight = 22;

    const band = document.createElementNS(NS, 'rect');
    band.setAttribute('x', startX + 2);
    band.setAttribute('y', bandY);
    band.setAttribute('width', bandWidth - 4);
    band.setAttribute('height', bandHeight);
    band.setAttribute('fill', '#374151');
    band.setAttribute('stroke', '#1F2937');
    band.setAttribute('stroke-width', '1');
    band.setAttribute('rx', '4');
    svg.appendChild(band);

    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', startX + bandWidth / 2);
    label.setAttribute('y', bandY + bandHeight / 2 + 5);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '14');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('fill', '#FFFFFF');
    label.textContent = period.label;
    svg.appendChild(label);
  });

  // Assi
  const yAxis = document.createElementNS(NS, 'line');
  yAxis.setAttribute('x1', margin.left);
  yAxis.setAttribute('y1', margin.top);
  yAxis.setAttribute('x2', margin.left);
  yAxis.setAttribute('y2', margin.top + chartHeight);
  yAxis.setAttribute('stroke', '#9CA3AF');
  yAxis.setAttribute('stroke-width', '2');
  svg.appendChild(yAxis);

  const xAxis = document.createElementNS(NS, 'line');
  xAxis.setAttribute('x1', margin.left);
  xAxis.setAttribute('y1', margin.top + chartHeight);
  xAxis.setAttribute('x2', margin.left + chartWidth);
  xAxis.setAttribute('y2', margin.top + chartHeight);
  xAxis.setAttribute('stroke', '#9CA3AF');
  xAxis.setAttribute('stroke-width', '2');
  svg.appendChild(xAxis);

  // Legenda
  const legendY = height - 40;
  const legendData = categoryKeys
    .filter((catKey) =>
      fteResults.intervals.some((interval) => (interval.fte_categories?.[catKey] || 0) > 0)
    )
    .map((catKey) => ({
      label: colorMap[catKey]?.label || catKey,
      color: colorMap[catKey]?.color || '#9CA3AF',
    }));

  const legendSpacing = Math.min(150, (width - 100) / legendData.length);
  const legendStartX = width / 2 - (legendData.length * legendSpacing) / 2;

  legendData.forEach((item, idx) => {
    const legendX = legendStartX + idx * legendSpacing;

    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', legendX);
    rect.setAttribute('y', legendY);
    rect.setAttribute('width', '16');
    rect.setAttribute('height', '16');
    rect.setAttribute('fill', item.color);
    rect.setAttribute('rx', '2');
    svg.appendChild(rect);

    const text = document.createElementNS(NS, 'text');
    text.setAttribute('x', legendX + 22);
    text.setAttribute('y', legendY + 12);
    text.setAttribute('font-size', '12');
    text.setAttribute('fill', '#374151');
    text.textContent = item.label;
    svg.appendChild(text);
  });

  // SVG → Canvas → PNG download
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filenamePrefix}-fte-${totalDays}gg-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  };

  img.src = url;
};
