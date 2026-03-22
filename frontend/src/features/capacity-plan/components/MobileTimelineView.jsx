import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Clock, Users, Settings } from 'lucide-react';

const phases = [
  { key: 'intervals_analysis', labelKey: 'phaseAnalysis', totalsKey: 'total_hours_analysis' },
  { key: 'intervals_development', labelKey: 'phaseDevelopment', totalsKey: 'total_hours_development' },
  { key: 'intervals_internal_test', labelKey: 'phaseInternalTest', totalsKey: 'total_hours_internal_test' },
  { key: 'intervals_uat', labelKey: 'phaseUAT', totalsKey: 'total_hours_uat' },
  { key: 'intervals_release', labelKey: 'phaseRelease', totalsKey: 'total_hours_release' },
  { key: 'intervals_documentation', labelKey: 'phaseDocumentation', totalsKey: 'total_hours_documentation' },
  { key: 'intervals_startup', labelKey: 'phaseStartup', totalsKey: 'total_hours_startup' },
  { key: 'intervals_pm', labelKey: 'phasePM', totalsKey: 'total_hours_pm' },
];

const TOTAL_INTERVALS = 10;

const MobileTimelineView = ({
  estimatesList,
  totalDays,
  colorMap,
  onDistributionConfig,
}) => {
  const { t } = useTranslation(['capacityPlan', 'common']);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Calcola range globale per la scala della timeline
  const globalRange = useMemo(() => {
    let min = TOTAL_INTERVALS;
    let max = 1;
    estimatesList.forEach(({ phaseIntervals }) => {
      if (!phaseIntervals) return;
      Object.values(phaseIntervals).forEach((intervals) => {
        if (!intervals?.length) return;
        intervals.forEach((v) => {
          if (v < min) min = v;
          if (v > max) max = v;
        });
      });
    });
    return { min, max };
  }, [estimatesList]);

  const getPhaseRange = (intervals) => {
    if (!intervals?.length) return null;
    const start = Math.min(...intervals);
    const end = Math.max(...intervals);
    return { start, end };
  };

  const getEstimateRange = (phaseIntervals) => {
    if (!phaseIntervals) return null;
    let min = TOTAL_INTERVALS + 1;
    let max = 0;
    Object.values(phaseIntervals).forEach((intervals) => {
      if (!intervals?.length) return;
      intervals.forEach((v) => {
        if (v < min) min = v;
        if (v > max) max = v;
      });
    });
    if (min > max) return null;
    return { start: min, end: max };
  };

  const formatDays = (hours) => {
    if (!hours || hours === 0) return null;
    return Math.round((hours / 8) * 10) / 10;
  };

  const daysPerInterval = totalDays / TOTAL_INTERVALS;

  return (
    <div className="space-y-3">
      {/* Scala temporale */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2">
        <div className="flex justify-between text-[10px] text-gray-500 font-medium">
          {Array.from({ length: 6 }, (_, i) => {
            const day = Math.round((totalDays / 5) * i);
            return (
              <span key={i}>
                {t('capacityPlan:mobileDay', { day })}
              </span>
            );
          })}
        </div>
        <div className="flex mt-1 h-1 rounded-full overflow-hidden bg-gray-100">
          {Array.from({ length: TOTAL_INTERVALS }, (_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-gray-200 last:border-r-0"
            />
          ))}
        </div>
      </div>

      {/* Card per ogni stima */}
      {estimatesList.map((estimateItem) => {
        const { estimateId, estimate, phaseIntervals } = estimateItem;
        const color = colorMap?.[estimateId] || '#0891b2';
        const isExpanded = expandedIds.has(estimateId);
        const range = getEstimateRange(phaseIntervals);
        const totalHours = estimate?.totals?.total_hours_with_contingency;
        const totalEstDays = formatDays(totalHours);

        // Calcola quante fasi sono attive
        const activePhases = phases.filter((p) => {
          const phaseRange = getPhaseRange(phaseIntervals?.[p.key]);
          return phaseRange !== null;
        });

        return (
          <div
            key={estimateId}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Header card - sempre visibile */}
            <div
              className="px-3 py-3 cursor-pointer active:bg-gray-50"
              onClick={() => toggleExpand(estimateId)}
            >
              {/* Riga titolo */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                )}
                <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
                  {estimate?.title}
                </h3>
                {onDistributionConfig && (
                  <button
                    className="p-1 text-gray-400 hover:text-cyan-600 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDistributionConfig(estimateId);
                    }}
                    title={t('capacityPlan:configureFTE')}
                  >
                    <Settings size={14} />
                  </button>
                )}
              </div>

              {/* Info riga */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2.5">
                <span className="truncate">{estimate?.client_name}</span>
                {totalEstDays && (
                  <span className="flex items-center gap-1 shrink-0 font-medium text-gray-700">
                    <Clock size={11} />
                    {totalEstDays}gg
                  </span>
                )}
                <span className="flex items-center gap-1 shrink-0">
                  <Users size={11} />
                  {activePhases.length} {t('capacityPlan:mobilePhases')}
                </span>
              </div>

              {/* Mini timeline - barra riassuntiva */}
              {range && (
                <div className="relative h-5 bg-gray-50 rounded overflow-hidden">
                  {/* Grid di sfondo */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: TOTAL_INTERVALS }, (_, i) => (
                      <div
                        key={i}
                        className="flex-1 border-r border-gray-100 last:border-r-0"
                      />
                    ))}
                  </div>

                  {/* Barra riassuntiva dell'intera stima */}
                  <div
                    className="absolute top-0 h-full rounded opacity-20"
                    style={{
                      left: `${((range.start - 1) / TOTAL_INTERVALS) * 100}%`,
                      width: `${((range.end - range.start + 1) / TOTAL_INTERVALS) * 100}%`,
                      backgroundColor: color,
                    }}
                  />

                  {/* Barre fasi sovrapposte */}
                  {phases.map((phase) => {
                    const phaseRange = getPhaseRange(phaseIntervals?.[phase.key]);
                    if (!phaseRange) return null;
                    return (
                      <div
                        key={phase.key}
                        className="absolute top-1 h-3 rounded-sm"
                        style={{
                          left: `${((phaseRange.start - 1) / TOTAL_INTERVALS) * 100}%`,
                          width: `${((phaseRange.end - phaseRange.start + 1) / TOTAL_INTERVALS) * 100}%`,
                          backgroundColor: color,
                          opacity: 0.7,
                        }}
                        title={t('capacityPlan:' + phase.labelKey)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Vista espansa - dettaglio fasi */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
                <div className="space-y-1.5">
                  {phases.map((phase) => {
                    const phaseRange = getPhaseRange(phaseIntervals?.[phase.key]);
                    const phaseHours = estimate?.totals?.[phase.totalsKey];
                    const phaseDays = formatDays(phaseHours);

                    if (!phaseRange && !phaseDays) return null;

                    const startDay = phaseRange
                      ? Math.round((phaseRange.start - 1) * daysPerInterval)
                      : null;
                    const endDay = phaseRange
                      ? Math.round(phaseRange.end * daysPerInterval)
                      : null;

                    return (
                      <div key={phase.key} className="flex items-center gap-2">
                        {/* Label fase */}
                        <div className="w-20 shrink-0">
                          <span className="text-[11px] font-medium text-gray-600 truncate block">
                            {t('capacityPlan:' + phase.labelKey)}
                          </span>
                        </div>

                        {/* Mini barra fase */}
                        <div className="flex-1 relative h-4 bg-gray-100 rounded-sm overflow-hidden">
                          {phaseRange && (
                            <div
                              className="absolute top-0 h-full rounded-sm"
                              style={{
                                left: `${((phaseRange.start - 1) / TOTAL_INTERVALS) * 100}%`,
                                width: `${((phaseRange.end - phaseRange.start + 1) / TOTAL_INTERVALS) * 100}%`,
                                backgroundColor: color,
                                opacity: 0.75,
                              }}
                            />
                          )}
                        </div>

                        {/* Info durata */}
                        <div className="w-16 shrink-0 text-right">
                          {phaseDays ? (
                            <span className="text-[11px] font-medium text-gray-700">
                              {phaseDays}gg
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Riepilogo tempi nella vista espansa */}
                {range && (
                  <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">
                      {t('capacityPlan:mobileTimespan', {
                        start: Math.round((range.start - 1) * daysPerInterval),
                        end: Math.round(range.end * daysPerInterval),
                      })}
                    </span>
                    {totalEstDays && (
                      <span className="font-semibold text-gray-700">
                        {t('common:total')}: {totalEstDays}gg
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MobileTimelineView;
