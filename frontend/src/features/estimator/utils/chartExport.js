import { calculatePeriodLabels } from './periodCalculations';
import { getCategoryColorMap } from '../../capacity-plan/utils/categoryConfig';

/**
 * Export del Gantt multi-stima come PNG.
 * Approccio: serializzazione diretta dell'SVG → Canvas → PNG download.
 * L'SVG usa attributi espliciti (fill, stroke, etc.), quindi non serve
 * inlineare computed styles.
 */
export const exportMultiGanttAsPNG = (estimatesList, totalDays, filenamePrefix = 'gantt', { onError } = {}) => {
  const svgElement = document.querySelector('svg[data-export-gantt="multi-gantt"]');
  if (!svgElement) {
    onError?.('Errore: elemento Gantt non trovato');
    return;
  }

  const filename = `${filenamePrefix}-gantt-${totalDays}gg-${Date.now()}.png`;
  const svgWidth = svgElement.width.baseVal.value || svgElement.getBoundingClientRect().width;
  const svgHeight = svgElement.height.baseVal.value || svgElement.getBoundingClientRect().height;

  // Clona l'SVG e rimuovi attributi class (riferimenti a CSS esterni di Tailwind
  // causano "tainted canvas" quando l'SVG viene caricato come immagine)
  const clone = svgElement.cloneNode(true);
  const stripClasses = (el) => {
    el.removeAttribute('class');
    Array.from(el.children).forEach(stripClasses);
  };
  stripClasses(clone);

  // Assicura xmlns per il rendering standalone
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  // Usa data URL (same-origin) invece di blob URL per evitare taint
  const svgData = new XMLSerializer().serializeToString(clone);
  const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = svgWidth * scale;
    canvas.height = svgHeight * scale;

    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, svgWidth, svgHeight);
    ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

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
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // Sfondo bianco
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', 'white');
  svg.appendChild(bgRect);

  // Titolo
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
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

    const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gridLine.setAttribute('x1', margin.left);
    gridLine.setAttribute('y1', yPos);
    gridLine.setAttribute('x2', margin.left + chartWidth);
    gridLine.setAttribute('y2', yPos);
    gridLine.setAttribute('stroke', '#E5E7EB');
    gridLine.setAttribute('stroke-width', '1');
    gridLine.setAttribute('stroke-dasharray', i === 0 ? '0' : '4,4');
    svg.appendChild(gridLine);

    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
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
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
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
      const totalLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
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

    const band = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    band.setAttribute('x', startX + 2);
    band.setAttribute('y', bandY);
    band.setAttribute('width', bandWidth - 4);
    band.setAttribute('height', bandHeight);
    band.setAttribute('fill', '#374151');
    band.setAttribute('stroke', '#1F2937');
    band.setAttribute('stroke-width', '1');
    band.setAttribute('rx', '4');
    svg.appendChild(band);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
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
  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', margin.left);
  yAxis.setAttribute('y1', margin.top);
  yAxis.setAttribute('x2', margin.left);
  yAxis.setAttribute('y2', margin.top + chartHeight);
  yAxis.setAttribute('stroke', '#9CA3AF');
  yAxis.setAttribute('stroke-width', '2');
  svg.appendChild(yAxis);

  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
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

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', legendX);
    rect.setAttribute('y', legendY);
    rect.setAttribute('width', '16');
    rect.setAttribute('height', '16');
    rect.setAttribute('fill', item.color);
    rect.setAttribute('rx', '2');
    svg.appendChild(rect);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
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
