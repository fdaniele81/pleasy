import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Download, Palette } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import {
  calculatePeriodLabels,
  calculateLabelPositions,
  calculateMaxFTE,
  calculateTotalFTE,
} from '../../estimator/utils/periodCalculations';
import { getCategoryColorMap } from '../utils/categoryConfig';
import ChartConfigModal from './ChartConfigModal';

const AggregatedFTEChart = ({
  fteResults,
  totalDays,
  onExport,
  chartRef,
  estimatesCount = 0,
  showExportButton = true,
  initialChartConfig,
  onChartConfigSave,
}) => {
  const { t } = useTranslation(['capacityPlan', 'common']);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customOrder, setCustomOrder] = useState(null);
  const [customColors, setCustomColors] = useState({});
  const initializedRef = useRef(false);

  const rawCategoryKeys = fteResults?.distribution_categories || ['functional', 'technical', 'governance'];
  const baseColorMap = getCategoryColorMap(rawCategoryKeys, t);

  // Initialize from persisted config (once, when data arrives)
  useEffect(() => {
    if (initializedRef.current) return;
    if (!initialChartConfig) return;
    const { category_order, category_colors } = initialChartConfig;
    if (category_order?.length > 0) {
      setCustomOrder(category_order);
    }
    if (category_colors && Object.keys(category_colors).length > 0) {
      setCustomColors(category_colors);
    }
    initializedRef.current = true;
  }, [initialChartConfig]);

  // Effective keys: custom order or default
  const effectiveKeys = useMemo(() => {
    if (!customOrder) return rawCategoryKeys;
    const ordered = customOrder.filter((k) => rawCategoryKeys.includes(k));
    const newKeys = rawCategoryKeys.filter((k) => !customOrder.includes(k));
    return [...ordered, ...newKeys];
  }, [customOrder, rawCategoryKeys]);

  // Effective color map: base colors overridden by custom
  const colorMap = useMemo(() => {
    const map = { ...baseColorMap };
    Object.entries(customColors).forEach(([key, color]) => {
      if (map[key]) {
        map[key] = { ...map[key], color };
      }
    });
    return map;
  }, [baseColorMap, customColors]);

  const handleConfigApply = useCallback(({ orderedKeys, customColors: newColors }) => {
    setCustomOrder(orderedKeys);
    setCustomColors(newColors);
    if (onChartConfigSave) {
      onChartConfigSave({
        category_order: orderedKeys,
        category_colors: newColors,
      });
    }
  }, [onChartConfigSave]);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport({ orderedKeys: effectiveKeys, customColors });
    }
  }, [onExport, effectiveKeys, customColors]);

  if (!fteResults || !fteResults.intervals) {
    return (
      <div className="xl:col-span-1 bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center min-h-[300px]">
        <BarChart3 className="text-gray-300 mb-2" size={48} />
        <p className="text-gray-500 text-sm">{t('capacityPlan:noFTEData')}</p>
      </div>
    );
  }

  const maxFTE = calculateMaxFTE(fteResults.intervals);
  const periodLabels = calculatePeriodLabels(totalDays, t);
  const labelPositions = calculateLabelPositions(periodLabels);

  return (
    <div ref={chartRef} data-export-fte="aggregated-fte" className="xl:col-span-1 bg-white rounded-lg shadow-md p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-cyan-600" size={20} />
            {t('capacityPlan:aggregatedFTE')}
          </h3>
          {estimatesCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {estimatesCount === 1 ? t('capacityPlan:sumOfEstimateSingle', { count: estimatesCount }) : t('capacityPlan:sumOfEstimates', { count: estimatesCount })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-gray-100 rounded transition-colors"
            title={t('capacityPlan:configOrderColors')}
          >
            <Palette size={18} />
          </button>
          {showExportButton && onExport && (
            <Button
              onClick={handleExport}
              color="cyan"
              size="sm"
              icon={Download}
              iconSize={16}
              title={t('capacityPlan:exportAsPngHorizontal')}
            >
              PNG
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex min-h-0">
          {/* Labels periodo verticali */}
          <div className="relative w-6">
            {labelPositions.map((period, idx) => {
              const gap = 1.5; // % gap between labels
              return (
              <div
                key={idx}
                className="absolute left-0 w-5 flex items-center justify-center"
                style={{
                  top: `${period.topPercent + gap / 2}%`,
                  height: `${period.heightPercent - gap}%`,
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  backgroundColor: '#374151',
                  border: '1px solid #1F2937',
                  borderRadius: '4px',
                }}
              >
                <span
                  className="font-bold whitespace-nowrap"
                  style={{ color: '#FFFFFF', fontSize: '14px' }}
                >
                  {period.label}
                </span>
              </div>
              );
            })}
          </div>

          {/* Grafico */}
          <div className="flex-1 relative">
            {/* Grid verticale */}
            <div className="absolute inset-0 flex">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-gray-200 last:border-r-0"
                />
              ))}
            </div>

            {/* Barre FTE */}
            <div className="relative h-full flex flex-col justify-between gap-2 py-1">
              {fteResults.intervals.map((interval, idx) => {
                const totalFTE = calculateTotalFTE(interval);
                const widthPercent = maxFTE > 0 ? (totalFTE / maxFTE) * 100 : 0;

                return (
                  <div key={idx} className="flex items-center flex-1">
                    <div className="w-full relative group h-full flex items-center">
                      <div
                        className="flex h-8 relative"
                        style={{
                          width: `${widthPercent}%`,
                          minWidth: totalFTE > 0 ? '8px' : '2px',
                        }}
                      >
                        {effectiveKeys.map((catKey) => {
                          const fteValue = interval.fte_categories?.[catKey] || 0;
                          if (fteValue <= 0) return null;
                          return (
                            <div
                              key={catKey}
                              className="h-full transition-all duration-300"
                              style={{
                                width: `${(fteValue / totalFTE) * 100}%`,
                                backgroundColor: colorMap[catKey]?.color,
                              }}
                              title={`${colorMap[catKey]?.label}: ${fteValue.toFixed(2)}`}
                            />
                          );
                        })}

                        {totalFTE > 0 && (
                          <span
                            className="absolute text-xs font-bold text-gray-900"
                            style={{
                              left: '100%',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              marginLeft: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {totalFTE.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {/* Tooltip */}
                      <div className="absolute left-0 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="bg-white p-2 border border-gray-300 rounded shadow-lg text-xs whitespace-nowrap">
                          {effectiveKeys.map((catKey) => {
                            const fteValue = interval.fte_categories?.[catKey] || 0;
                            const hoursValue = interval.hours_categories?.[catKey] || 0;
                            return (
                              <p key={catKey} style={{ color: colorMap[catKey]?.color }}>
                                {colorMap[catKey]?.label}: {fteValue.toFixed(2)} ({hoursValue.toFixed(1)}h)
                              </p>
                            );
                          })}
                          <p className="text-gray-600 mt-1 pt-1 border-t">
                            {t('common:total')}: {totalFTE.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scala valori */}
        <div className="flex pt-2" style={{ paddingLeft: '24px', paddingRight: '16px' }}>
          <div className="flex-1 relative" style={{ height: '30px' }}>
            {[...Array(6)].map((_, i) => {
              const value = (maxFTE / 5) * i;
              const leftPercent = (i / 5) * 100;
              return (
                <div
                  key={i}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${leftPercent}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="w-px h-2 bg-gray-400" />
                  <span className="text-xs text-gray-500 font-medium mt-1">
                    {value.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex justify-center gap-4 pt-3 mt-3 border-t border-gray-200 flex-wrap">
          {effectiveKeys
            .filter((catKey) =>
              fteResults.intervals.some((interval) => (interval.fte_categories?.[catKey] || 0) > 0)
            )
            .map((catKey) => (
              <div key={catKey} className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorMap[catKey]?.color }} />
                <span className="text-xs text-gray-700">{colorMap[catKey]?.label}</span>
              </div>
            ))}
        </div>
      </div>

      <ChartConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        categoryKeys={effectiveKeys}
        colorMap={colorMap}
        onApply={handleConfigApply}
      />
    </div>
  );
};

export default AggregatedFTEChart;
