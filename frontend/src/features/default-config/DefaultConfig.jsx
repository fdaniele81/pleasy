import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { SlidersHorizontal, Settings, Save, Calendar, Table, Percent } from 'lucide-react';
import { useGetDefaultPhasesConfigQuery, useUpdateDefaultPhasesConfigMutation, useGetPreferredUnitQuery, useUpdatePreferredUnitMutation } from './api/defaultConfigEndpoints';
import PageHeader from '../../shared/ui/PageHeader';
import Button from '../../shared/ui/Button';
import PhaseIntervalsGantt from '../../shared/components/gantt/PhaseIntervalsGantt';
import DistributionTable from '../../shared/components/DistributionTable';
import { extractCategoriesFromConfig } from '../../shared/utils/categoryConfig';
import { addToast } from '../../store/slices/toastSlice';
import { updateCurrentUser } from '../../store/slices/authSlice';

const PHASE_KEYS = [
  { key: 'analysis', labelKey: 'defaultConfig:phaseAnalysis' },
  { key: 'development', labelKey: 'defaultConfig:phaseDevelopment' },
  { key: 'internal_test', labelKey: 'defaultConfig:phaseInternalTest' },
  { key: 'uat', labelKey: 'defaultConfig:phaseUat' },
  { key: 'release', labelKey: 'defaultConfig:phaseRelease' },
  { key: 'documentation', labelKey: 'defaultConfig:phaseDocumentation' },
  { key: 'startup', labelKey: 'defaultConfig:phaseStartup' },
  { key: 'pm', labelKey: 'defaultConfig:phasePm' },
  { key: 'contingency', labelKey: 'defaultConfig:phaseContingency' }
];

const DefaultConfig = () => {
  const { t } = useTranslation(['defaultConfig', 'common', 'errors']);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const PHASES = useMemo(() =>
    PHASE_KEYS.map(p => ({ key: p.key, label: t(p.labelKey) })),
    [t]
  );
  const PHASES_NO_CONTINGENCY = useMemo(() =>
    PHASES.filter(p => p.key !== 'contingency'),
    [PHASES]
  );

  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [mainTab, setMainTab] = useState('general');
  const [draggedPhase, setDraggedPhase] = useState(null);
  const [categoryKeys, setCategoryKeys] = useState(['functional', 'technical', 'governance']);
  const [preferredUnit, setPreferredUnit] = useState('HOURS');

  const [isMobileElapsed, setIsMobileElapsed] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 799px)');
    setIsMobileElapsed(mql.matches);
    const handler = (e) => setIsMobileElapsed(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const { data: configData, isLoading: loading } = useGetDefaultPhasesConfigQuery();
  const [updateDefaultPhasesConfig, { isLoading: saving }] = useUpdateDefaultPhasesConfigMutation();
  const { data: unitData, isLoading: loadingUnit } = useGetPreferredUnitQuery();
  const [updatePreferredUnit, { isLoading: savingUnit }] = useUpdatePreferredUnitMutation();

  useEffect(() => {
    if (configData?.default_phases_config) {
      setConfig(configData.default_phases_config);
      const cats = extractCategoriesFromConfig(configData.default_phases_config);
      setCategoryKeys(cats.length > 0 ? cats : ['functional', 'technical', 'governance']);
    }
  }, [configData]);

  useEffect(() => {
    if (unitData?.preferred_unit) {
      setPreferredUnit(unitData.preferred_unit);
    }
  }, [unitData]);

  if (user?.role_id !== 'PM') {
    return (
      <div className="min-h-screen bg-gray-100 pt-16 sm:pt-20">
        <div className="flex items-center justify-center p-6">
          <div className="text-gray-500">{t('common:accessRestricted')}</div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!config) return;

    for (const phase of PHASES) {
      const phaseConfig = config[phase.key];
      if (phaseConfig?.distribution && phase.key !== 'contingency') {
        const sum = Object.values(phaseConfig.distribution)
          .reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
        if (Math.abs(sum - 100) > 0.01) {
          setError(t('defaultConfig:distributionSumError', { phase: phase.label }));
          return;
        }
      }
    }

    const e2eSum = PHASES
      .filter(phase => phase.key !== 'contingency')
      .reduce((sum, phase) => {
        const phaseConfig = config[phase.key];
        return sum + (parseFloat(phaseConfig?.e2e_percentage) || 0);
      }, 0);

    if (Math.abs(e2eSum - 100) > 0.01) {
      setError(t('defaultConfig:e2eSumError', { current: e2eSum.toFixed(1) }));
      return;
    }

    setError(null);

    try {
      const errors = [];

      try {
        await updateDefaultPhasesConfig(config).unwrap();
      } catch (err) {
        errors.push(err.message || err.data?.message || 'Error saving phases config');
      }

      try {
        await updatePreferredUnit(preferredUnit).unwrap();
        dispatch(updateCurrentUser({ preferred_unit: preferredUnit }));
      } catch (err) {
        errors.push(err.message || err.data?.message || 'Error saving preferred unit');
      }

      if (errors.length > 0) {
        setError(errors.join('\n'));
      } else {
        dispatch(addToast({ message: t('defaultConfig:saveSuccess'), type: 'success' }));
      }
    } catch (err) {
      setError(`${t('errors:savingError')}: ${err.message || err.data?.message || 'Unknown error'}`);
    }
  };

  const handlePercentageChange = (phaseKey, value) => {
    setConfig(prev => ({
      ...prev,
      [phaseKey]: {
        ...prev[phaseKey],
        e2e_percentage: parseFloat(value) || 0
      }
    }));
  };

  const handleElapsedDaysChange = (value) => {
    setConfig(prev => ({
      ...prev,
      elapsed_days: parseInt(value) || 10
    }));
  };

  const getE2ESum = () => {
    if (!config) return 0;
    return PHASES
      .filter(phase => phase.key !== 'contingency')
      .reduce((sum, phase) => {
        const phaseConfig = config[phase.key];
        return sum + (parseFloat(phaseConfig?.e2e_percentage) || 0);
      }, 0);
  };

  const getDistributionFromConfig = useCallback(() => {
    if (!config) return {};
    const dist = {};
    PHASES_NO_CONTINGENCY.forEach(phase => {
      dist[phase.key] = config[phase.key]?.distribution || {};
    });
    return dist;
  }, [config, PHASES_NO_CONTINGENCY]);

  const handleDistributionTableChange = useCallback((updater) => {
    setConfig(prev => {
      const currentDist = {};
      PHASES_NO_CONTINGENCY.forEach(phase => {
        currentDist[phase.key] = prev[phase.key]?.distribution || {};
      });

      const newDist = typeof updater === 'function' ? updater(currentDist) : updater;

      const newConfig = { ...prev };
      Object.keys(newDist).forEach(phaseKey => {
        newConfig[phaseKey] = {
          ...newConfig[phaseKey],
          distribution: { ...newDist[phaseKey] },
        };
      });
      return newConfig;
    });
  }, [PHASES_NO_CONTINGENCY]);

  const handleCategoryKeysChange = useCallback((updater) => {
    setCategoryKeys(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  const configToGanttIntervals = () => {
    if (!config) return {};
    const ganttIntervals = {};
    PHASES.forEach(phase => {
      if (phase.key !== 'contingency') {
        ganttIntervals[`intervals_${phase.key}`] = config[phase.key]?.values || [];
      }
    });
    return ganttIntervals;
  };

  const ganttIntervalsToConfig = (ganttIntervals) => {
    const newConfig = { ...config };
    Object.keys(ganttIntervals).forEach(key => {
      const phaseKey = key.replace('intervals_', '');
      if (newConfig[phaseKey]) {
        newConfig[phaseKey] = {
          ...newConfig[phaseKey],
          values: ganttIntervals[key]
        };
      }
    });
    return newConfig;
  };

  const handleGanttIntervalsChange = (newIntervals) => {
    const newConfig = ganttIntervalsToConfig(newIntervals);
    setConfig(newConfig);
  };

  const getPhaseStartEnd = (phaseKey) => {
    const values = config?.[phaseKey]?.values || [];
    if (values.length === 0) return { start: 1, end: 1 };
    const sorted = [...values].sort((a, b) => a - b);
    return { start: sorted[0], end: sorted[sorted.length - 1] };
  };

  const handleMobileIntervalChange = (phaseKey, field, value) => {
    const current = getPhaseStartEnd(phaseKey);
    let newStart = field === 'start' ? parseInt(value) : current.start;
    let newEnd = field === 'end' ? parseInt(value) : current.end;
    if (newStart > newEnd) {
      if (field === 'start') newEnd = newStart;
      else newStart = newEnd;
    }
    const newValues = [];
    for (let i = newStart; i <= newEnd; i++) newValues.push(i);
    const ganttKey = `intervals_${phaseKey}`;
    handleGanttIntervalsChange({ ...configToGanttIntervals(), [ganttKey]: newValues });
  };

  const ganttPhases = PHASES
    .filter(p => p.key !== 'contingency')
    .map(p => ({
      key: `intervals_${p.key}`,
      label: p.label,
      color: '#870c7f'
    }));

  const TABS = [
    { key: 'general', label: t('defaultConfig:generalPreferences'), icon: Settings },
    { key: 'elapsed', label: t('defaultConfig:elapsedTimeline'), icon: Calendar },
    { key: 'e2e', label: t('defaultConfig:e2eDistribution'), icon: Table },
    { key: 'percentuali', label: t('defaultConfig:percentageDistribution'), icon: Percent },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto px-4 pt-2 pb-8 sm:px-6 sm:py-6">
        <PageHeader
          icon={SlidersHorizontal}
          title={t('defaultConfig:title')}
          description={t('defaultConfig:description')}
          iconColor="text-cyan-600"
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          {(loading || loadingUnit) && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
          )}

          {!loading && !loadingUnit && config && (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-around sm:justify-start sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setMainTab(tab.key)}
                    className={`flex-1 sm:flex-none px-2 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 whitespace-nowrap ${
                      mainTab === tab.key
                        ? 'border-cyan-600 text-cyan-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon size={18} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {mainTab === 'general' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      {t('defaultConfig:generalPreferences')}
                    </h3>
                    <p className="text-xs text-gray-600 mb-4">
                      {t('defaultConfig:generalPreferencesDescription')}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('defaultConfig:preferredUnitLabel')}
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      {t('defaultConfig:preferredUnitDescription')}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPreferredUnit('HOURS')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          preferredUnit === 'HOURS'
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t('defaultConfig:unitHours')}
                      </button>
                      <button
                        onClick={() => setPreferredUnit('DAYS')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          preferredUnit === 'DAYS'
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t('defaultConfig:unitDays')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {mainTab === 'elapsed' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">
                        {t('defaultConfig:projectTimeline')}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3">
                        {t('defaultConfig:timelineDescription')}
                      </p>
                      <div>
                        <span className="block text-sm font-medium text-gray-600 mb-1">{t('defaultConfig:projectDuration')}</span>
                        <select
                          value={config?.elapsed_days ?? 10}
                          onChange={(e) => handleElapsedDaysChange(e.target.value)}
                          className="w-full sm:w-52 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="10">{t('defaultConfig:twoWeeks')}</option>
                          <option value="20">{t('defaultConfig:oneMonth')}</option>
                          <option value="40">{t('defaultConfig:twoMonths')}</option>
                          <option value="60">{t('defaultConfig:threeMonths')}</option>
                          <option value="120">{t('defaultConfig:sixMonths')}</option>
                          <option value="240">{t('defaultConfig:oneYear')}</option>
                        </select>
                      </div>
                    </div>

                    {isMobileElapsed ? (
                      <table className="w-full border-collapse table-fixed">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="px-2 py-1.5 text-left text-sm font-semibold text-gray-700">{t('common:phase')}</th>
                            <th className="px-1 py-1.5 text-center text-sm font-semibold text-gray-700 w-16">{t('defaultConfig:start')}</th>
                            <th className="px-1 py-1.5 text-center text-sm font-semibold text-gray-700 w-16">{t('defaultConfig:end')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {PHASES_NO_CONTINGENCY.map((phase, idx) => {
                            const { start, end } = getPhaseStartEnd(phase.key);
                            return (
                              <tr key={phase.key} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <td className="px-2 py-1.5 text-sm font-medium text-gray-900 truncate">{phase.label}</td>
                                <td className="px-1 py-1.5 text-center">
                                  <select
                                    value={start}
                                    onChange={(e) => handleMobileIntervalChange(phase.key, 'start', e.target.value)}
                                    className="w-14 px-0.5 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-cyan-500"
                                  >
                                    {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-1 py-1.5 text-center">
                                  <select
                                    value={end}
                                    onChange={(e) => handleMobileIntervalChange(phase.key, 'end', e.target.value)}
                                    className="w-14 px-0.5 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-cyan-500"
                                  >
                                    {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="overflow-x-auto">
                        <PhaseIntervalsGantt
                          phaseIntervals={configToGanttIntervals()}
                          onIntervalsChange={handleGanttIntervalsChange}
                          draggedPhase={draggedPhase}
                          setDraggedPhase={setDraggedPhase}
                          totalDays={config?.elapsed_days ?? 10}
                          isReadOnly={false}
                          phases={ganttPhases}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mainTab === 'e2e' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      {t('defaultConfig:e2eByPhase')}
                    </h3>
                    <p className="text-xs text-gray-600 mb-4">
                      {t('defaultConfig:e2eByPhaseDescription')}
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                          <th className="px-4 py-1.5 text-left text-sm font-semibold text-gray-700">
                            {t('common:phase')}
                          </th>
                          <th className="px-4 py-1.5 text-center text-sm font-semibold text-gray-700">
                            {t('defaultConfig:e2ePercentage')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {PHASES_NO_CONTINGENCY.map((phase, idx) => {
                          const phaseConfig = config[phase.key] || { e2e_percentage: 0 };
                          return (
                            <tr key={phase.key} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-4 py-1.5 text-sm font-medium text-gray-900">
                                {phase.label}
                              </td>
                              <td className="px-4 py-1.5 text-center">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={parseFloat(phaseConfig.e2e_percentage) || 0}
                                  onChange={(e) => handlePercentageChange(phase.key, e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  onWheel={(e) => e.target.blur()}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                            </tr>
                          );
                        })}

                        <tr className="border-t-2 border-gray-300 bg-gray-50">
                          <td className="px-4 py-1.5 text-sm font-medium text-gray-900">
                            {t('defaultConfig:contingency')}
                          </td>
                          <td className="px-4 py-1.5 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={parseFloat(config?.contingency?.e2e_percentage || 0)}
                              onChange={(e) => handlePercentageChange('contingency', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              onWheel={(e) => e.target.blur()}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 bg-white rounded-lg border-2 border-gray-300 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        {t('defaultConfig:totalE2e')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${Math.abs(getE2ESum() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                          {getE2ESum().toFixed(1)}%
                        </span>
                        {Math.abs(getE2ESum() - 100) < 0.01 ? (
                          <span className="text-green-600 font-bold">{t('defaultConfig:ok')}</span>
                        ) : (
                          <span className="text-red-600 font-bold">X</span>
                        )}
                      </div>
                    </div>
                    {Math.abs(getE2ESum() - 100) > 0.01 && (
                      <p className="text-xs text-red-600 mt-2">
                        {t('defaultConfig:sumMustBe100')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {mainTab === 'percentuali' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      {t('defaultConfig:skillDistribution')}
                    </h3>
                    <p className="text-xs text-gray-600 mb-4">
                      {t('defaultConfig:skillDistributionDescription')}
                    </p>
                  </div>

                  <DistributionTable
                    phases={PHASES_NO_CONTINGENCY}
                    distribution={getDistributionFromConfig()}
                    onDistributionChange={handleDistributionTableChange}
                    categoryKeys={categoryKeys}
                    onCategoryKeysChange={handleCategoryKeysChange}
                    onError={setError}
                  />
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleSave}
                  loading={saving || savingUnit}
                  disabled={saving || savingUnit || loading || loadingUnit}
                  color="cyan"
                  icon={Save}
                  iconSize={18}
                >
                  {t('defaultConfig:saveConfiguration')}
                </Button>
              </div>
            </>
          )}

          {!loading && !loadingUnit && !config && (
            <div className="p-6 text-center">
              <p className="text-gray-600">{t('defaultConfig:noConfigLoaded')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultConfig;
