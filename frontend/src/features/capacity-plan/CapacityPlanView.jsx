import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, Layers, Download } from 'lucide-react';
import { useLazyGetEstimateQuery } from '../estimator/api/estimateEndpoints';
import Button from '../../shared/ui/Button';
import MultiGanttContainer from './components/MultiGanttContainer';
import AggregatedFTEChart from './components/AggregatedFTEChart';
import { useCapacityPlanState } from './hooks/useCapacityPlanState';
import { exportMultiGanttAsPNG, exportFTEChartAsPNG } from '../estimator/utils/chartExport';
import DistributionConfigModal from './components/DistributionConfigModal';
import { addToast } from '../../store/slices/toastSlice';

function CapacityPlanView() {
  const { t } = useTranslation(['capacityPlan', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedIds = [] } = location.state || {};

  const fteChartRef = useRef(null);

  // Query lazy per caricare le stime
  const [getEstimate] = useLazyGetEstimateQuery();

  const {
    estimatesList,
    commonTotalDays,
    setCommonTotalDays,
    isCalculating,
    initializeFromEstimates,
    updateEstimateIntervals,
    calculateAllFTE,
    updateEstimateConfigs,
    saveCommonConfig,
    aggregatedFTE,
  } = useCapacityPlanState(selectedIds);

  const [configEstimateId, setConfigEstimateId] = useState(null);

  // Legge la config comune dalla prima stima selezionata
  const initialChartConfig = useMemo(() => {
    if (estimatesList.length === 0) return null;
    return estimatesList[0]?.estimate?.effective_phase_config?.common || null;
  }, [estimatesList]);

  // Redirect se non ci sono stime selezionate
  useEffect(() => {
    if (!selectedIds || selectedIds.length < 1) {
      navigate('/capacity-plan', { replace: true });
    }
  }, [selectedIds, navigate]);

  // Carica le stime
  useEffect(() => {
    const loadEstimates = async () => {
      if (!selectedIds || selectedIds.length === 0) return;

      try {
        const promises = selectedIds.map((id) => getEstimate(id).unwrap());
        const loadedEstimates = await Promise.all(promises);
        initializeFromEstimates(loadedEstimates);
      } catch (error) {
        console.error('Errore caricamento stime:', error);
      }
    };

    loadEstimates();
  }, [selectedIds, getEstimate, initializeFromEstimates]);

  // Ricalcola FTE quando cambia la durata comune o quando le stime sono caricate
  useEffect(() => {
    if (estimatesList.length > 0) {
      calculateAllFTE();
    }
  }, [commonTotalDays, estimatesList.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTotalDaysChange = useCallback(
    (e) => {
      const newDays = parseInt(e.target.value);
      setCommonTotalDays(newDays);
    },
    [setCommonTotalDays]
  );

  const handleIntervalsChange = useCallback(
    (estimateId, newIntervals) => {
      updateEstimateIntervals(estimateId, newIntervals);
    },
    [updateEstimateIntervals]
  );

  const handleExportGantt = useCallback(() => {
    exportMultiGanttAsPNG(estimatesList, commonTotalDays, 'capacity-plan', {
      onError: (msg) => dispatch(addToast({ message: msg, type: 'error' }))
    });
  }, [estimatesList, commonTotalDays, dispatch]);

  const handleExportFTEChart = useCallback(({ orderedKeys, customColors } = {}) => {
    exportFTEChartAsPNG(aggregatedFTE, 'capacity-plan', commonTotalDays, orderedKeys, customColors, t);
  }, [aggregatedFTE, commonTotalDays, t]);

  const handleDistributionSave = useCallback(
    (updatedConfigs) => {
      updateEstimateConfigs(updatedConfigs);
      setConfigEstimateId(null);
      calculateAllFTE();
    },
    [updateEstimateConfigs, calculateAllFTE]
  );

  if (!selectedIds || selectedIds.length < 1) {
    return null;
  }

  const isLoading = estimatesList.length === 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-18">
        <div className="flex items-center justify-center p-6 pt-20">
          <div className="text-xl">{t('capacityPlan:loadingEstimates')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-18">
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="text-gray-800" size={28} />
            <h1 className="text-2xl font-bold text-gray-800">{t('capacityPlan:title')}</h1>
            <span className="bg-cyan-100 text-cyan-700 text-sm font-medium px-3 py-1 rounded-full">
              {estimatesList.length === 1 ? t('capacityPlan:estimatesCountSingle', { count: estimatesList.length }) : t('capacityPlan:estimatesCount', { count: estimatesList.length })}
            </span>
          </div>
          <p className="text-gray-600">
            {t('capacityPlan:viewEditTimelines')}
          </p>
        </div>

        {/* Barra info e controlli */}
        <div className="from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 px-4 py-3 mb-4">
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600">{t('capacityPlan:selectedEstimates')}</span>
              <span className="text-gray-900">
                {estimatesList.map((e) => e.estimate?.title).join(', ')}
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="font-semibold text-gray-600">{t('capacityPlan:commonDuration')}</span>
              <select
                value={commonTotalDays}
                onChange={handleTotalDaysChange}
                className="w-52 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500"
              >
                <option value="10">{t('capacityPlan:duration2Weeks')}</option>
                <option value="20">{t('capacityPlan:duration1Month')}</option>
                <option value="40">{t('capacityPlan:duration2Months')}</option>
                <option value="60">{t('capacityPlan:duration3Months')}</option>
                <option value="120">{t('capacityPlan:duration6Months')}</option>
                <option value="240">{t('capacityPlan:duration1Year')}</option>
              </select>
              <div className="w-6 flex items-center justify-center">
                {isCalculating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Layout principale */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-4 items-start">
          {/* Gantt Container */}
          <div className="xl:col-span-3 bg-white rounded-lg shadow-md p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="text-cyan-600" size={20} />
                {t('capacityPlan:timelineE2E')}
              </h2>
              <Button
                onClick={handleExportGantt}
                color="cyan"
                size="sm"
                icon={Download}
                iconSize={16}
                title={t('capacityPlan:exportAsPng')}
              >
                {t('capacityPlan:exportPng')}
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              <MultiGanttContainer
                estimatesList={estimatesList}
                totalDays={commonTotalDays}
                onIntervalsChange={handleIntervalsChange}
                onDistributionConfig={setConfigEstimateId}
                isReadOnly={false}
              />
            </div>
          </div>

          {/* FTE Chart Aggregato */}
          <AggregatedFTEChart
            fteResults={aggregatedFTE}
            totalDays={commonTotalDays}
            chartRef={fteChartRef}
            estimatesCount={estimatesList.length}
            onExport={handleExportFTEChart}
            initialChartConfig={initialChartConfig}
            onChartConfigSave={saveCommonConfig}
          />
        </div>

        {/* Pulsanti navigazione */}
        <div className="flex justify-between gap-3 mt-6">
          <Button
            onClick={() => navigate('/capacity-plan')}
            variant="outline"
            icon={ArrowLeft}
            iconSize={18}
          >
            {t('capacityPlan:backToSelection')}
          </Button>
        </div>
      </div>

      <DistributionConfigModal
        isOpen={!!configEstimateId}
        onClose={() => setConfigEstimateId(null)}
        estimateItem={estimatesList.find((e) => e.estimateId === configEstimateId)}
        onSave={handleDistributionSave}
      />
    </div>
  );
}

export default CapacityPlanView;
