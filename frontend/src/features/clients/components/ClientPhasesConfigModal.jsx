import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Save } from 'lucide-react';
import { useGetClientPhasesConfigQuery, useUpdateClientPhasesConfigMutation } from '../api/clientEndpoints';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';
import PhaseIntervalsGantt from '../../../shared/components/gantt/PhaseIntervalsGantt';
import DistributionTable from '../../../shared/components/DistributionTable';
import ClientTMTab from './ClientTMTab';
import { extractCategoriesFromConfig } from '../../../shared/utils/categoryConfig';
import { Calendar, Table, Users, Percent } from 'lucide-react';

const PHASE_KEYS = [
  { key: 'analysis', labelKey: 'clients:phaseAnalysis' },
  { key: 'development', labelKey: 'clients:phaseDevelopment' },
  { key: 'internal_test', labelKey: 'clients:phaseInternalTest' },
  { key: 'uat', labelKey: 'clients:phaseUat' },
  { key: 'release', labelKey: 'clients:phaseRelease' },
  { key: 'documentation', labelKey: 'clients:phaseDocumentation' },
  { key: 'startup', labelKey: 'clients:phaseStartup' },
  { key: 'pm', labelKey: 'clients:phasePm' },
  { key: 'contingency', labelKey: 'clients:phaseContingency' }
];

const ClientPhasesConfigModal = ({ isOpen, onClose, client }) => {
  const { t } = useTranslation(['clients', 'common']);

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
  const [mainTab, setMainTab] = useState('elapsed');
  const [draggedPhase, setDraggedPhase] = useState(null);
  const [hasTeamChanges, setHasTeamChanges] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [categoryKeys, setCategoryKeys] = useState(['functional', 'technical', 'governance']);

  const [isMobileElapsed, setIsMobileElapsed] = useState(false);
  const teamTabRef = useRef(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 799px)');
    setIsMobileElapsed(mql.matches);
    const handler = (e) => setIsMobileElapsed(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const { data: configData, isLoading: loading } = useGetClientPhasesConfigQuery(
    client?.client_id,
    { skip: !isOpen || !client?.client_id }
  );
  const [updateClientPhasesConfig, { isLoading: saving }] = useUpdateClientPhasesConfigMutation();

  useEffect(() => {
    if (isOpen && configData?.project_phases_config) {
      setConfig(configData.project_phases_config);
      const cats = extractCategoriesFromConfig(configData.project_phases_config);
      setCategoryKeys(cats.length > 0 ? cats : ['functional', 'technical', 'governance']);
    }
  }, [configData, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setHasTeamChanges(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!client?.client_id) return;

    if (config) {
      for (const phase of PHASES) {
        const phaseConfig = config[phase.key];
        if (phaseConfig?.distribution && phase.key !== 'contingency') {
          const sum = Object.values(phaseConfig.distribution)
            .reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
          if (Math.abs(sum - 100) > 0.01) {
            setError(t('clients:distributionSumError', { phase: phase.label }));
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
        setError(t('clients:e2eSumError', { current: e2eSum.toFixed(1) }));
        return;
      }
    }

    setError(null);
    setSavingAll(true);

    try {
      const errors = [];

      if (config) {
        try {
          await updateClientPhasesConfig({
            clientId: client.client_id,
            phasesConfig: config
          }).unwrap();
        } catch (err) {
          errors.push(`${t('errors:savingError')}: ${err.message}`);
        }
      }

      if (teamTabRef.current?.hasChanges?.()) {
        const teamResult = await teamTabRef.current.saveChanges();
        if (!teamResult.success && teamResult.errors) {
          errors.push(...teamResult.errors);
        }
      }

      if (errors.length > 0) {
        setError(errors.join('\n'));
      } else {
        onClose();
      }
    } catch (err) {
      setError(`${t('errors:savingError')}: ${err.message}`);
    } finally {
      setSavingAll(false);
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
  }, [config]);

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
  }, []);

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
    { key: 'elapsed', label: t('clients:elapsedTimeline'), icon: Calendar },
    { key: 'e2e', label: t('clients:e2eDistribution'), icon: Table },
    { key: 'percentuali', label: t('clients:percentageDistribution'), icon: Percent },
    { key: 'team', label: t('clients:calendarActivities'), icon: Users },
  ];

  const customFooter = (
    <>
      <Button
        onClick={onClose}
        variant="outline"
        color="gray"
      >
        {t('common:cancel')}
      </Button>
      <Button
        onClick={handleSave}
        loading={savingAll || saving}
        disabled={savingAll || saving || loading}
        color="cyan"
        icon={Save}
        iconSize={18}
      >
        {t('clients:saveConfiguration')}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          {t('clients:phasesConfigTitle')}
          <p className="text-sm text-gray-600 mt-1 font-normal">
            {client?.client_name} ({client?.client_key})
          </p>
        </>
      }
      icon={<Settings className="text-cyan-600" size={24} />}
      size="2xl"
      error={error}
      customFooter={customFooter}
      confirmButtonColor="cyan"
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
        </div>
      )}

      {!loading && config && (
        <>
          <div className="flex justify-around sm:justify-start sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 sticky top-0 z-10 bg-white -mt-0.5 pt-0.5">
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

          {mainTab === 'elapsed' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    {t('clients:projectTimeline')}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    {t('clients:timelineDescription')}
                  </p>
                  <div>
                    <span className="block text-sm font-medium text-gray-600 mb-1">{t('clients:projectDuration')}</span>
                    <select
                      value={config?.elapsed_days ?? 10}
                      onChange={(e) => handleElapsedDaysChange(e.target.value)}
                      className="w-full sm:w-52 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="10">{t('clients:twoWeeks')}</option>
                      <option value="20">{t('clients:oneMonth')}</option>
                      <option value="40">{t('clients:twoMonths')}</option>
                      <option value="60">{t('clients:threeMonths')}</option>
                      <option value="120">{t('clients:sixMonths')}</option>
                      <option value="240">{t('clients:oneYear')}</option>
                    </select>
                  </div>
                </div>

                {isMobileElapsed ? (
                  <table className="w-full border-collapse table-fixed">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="px-2 py-1.5 text-left text-sm font-semibold text-gray-700">{t('common:phase')}</th>
                        <th className="px-1 py-1.5 text-center text-sm font-semibold text-gray-700 w-16">{t('clients:start')}</th>
                        <th className="px-1 py-1.5 text-center text-sm font-semibold text-gray-700 w-16">{t('clients:end')}</th>
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
                  {t('clients:e2eByPhase')}
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  {t('clients:e2eByPhaseDescription')}
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
                        {t('clients:e2ePercentage')}
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
                              className="w-full sm:w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                        </tr>
                      );
                    })}

                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td className="px-4 py-1.5 text-sm font-medium text-gray-900">
                        {t('clients:contingency')}
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
                          className="w-full sm:w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4 bg-white rounded-lg border-2 border-gray-300 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    {t('clients:totalE2e')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${Math.abs(getE2ESum() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      {getE2ESum().toFixed(1)}%
                    </span>
                    {Math.abs(getE2ESum() - 100) < 0.01 ? (
                      <span className="text-green-600 font-bold">{t('clients:ok')}</span>
                    ) : (
                      <span className="text-red-600 font-bold">X</span>
                    )}
                  </div>
                </div>
                {Math.abs(getE2ESum() - 100) > 0.01 && (
                  <p className="text-xs text-red-600 mt-2">
                    {t('clients:sumMustBe100')}
                  </p>
                )}
              </div>
            </div>
          )}

          {mainTab === 'percentuali' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {t('clients:skillDistribution')}
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  {t('clients:skillDistributionDescription')}
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

          {mainTab === 'team' && (
            <ClientTMTab
              ref={teamTabRef}
              client={client}
              onHasChanges={setHasTeamChanges}
            />
          )}
        </>
      )}

      {!loading && !config && (
        <div className="p-6 text-center">
          <p className="text-gray-600 mb-2">{t('clients:noConfigLoaded')}</p>
          <p className="text-sm text-gray-500">
            Debug: config = {JSON.stringify(config)}
          </p>
          <p className="text-sm text-gray-500">
            client_id = {client?.client_id}
          </p>
        </div>
      )}
    </BaseModal>
  );
};

export default ClientPhasesConfigModal;
