import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  useCalculateFTEMutation,
  useUpdateEstimateMutation,
} from '../../estimator/api/estimateEndpoints';
import { aggregateFTEResults } from '../utils/fteAggregation';

/**
 * Custom hook per gestire lo stato della vista Capacity Plan
 * @param {Array} selectedIds - Array di estimate_id selezionati
 * @returns {Object} - Stato e funzioni per gestire il capacity plan
 */
export function useCapacityPlanState(selectedIds) {
  // Stato per ogni stima: { [estimateId]: { estimate, phaseIntervals, fteResults } }
  const [estimatesState, setEstimatesState] = useState({});

  // Ref per avere sempre lo stato aggiornato nei callback
  const estimatesStateRef = useRef(estimatesState);
  useEffect(() => {
    estimatesStateRef.current = estimatesState;
  }, [estimatesState]);

  // Durata comune selezionata (default 60 giorni = 3 mesi)
  const [commonTotalDays, setCommonTotalDays] = useState(60);

  // Flag per indicare calcolo FTE in corso
  const [isCalculating, setIsCalculating] = useState(false);

  const [calculateFTEMutation] = useCalculateFTEMutation();
  const [updateEstimateMutation] = useUpdateEstimateMutation();

  /**
   * Inizializza lo stato da un array di stime caricate
   * Imposta commonTotalDays al massimo tra le durate delle stime
   */
  const initializeFromEstimates = useCallback((estimates) => {
    const initialState = {};
    let maxDays = 10; // valore minimo di default

    estimates.forEach((estimate) => {
      const config = estimate.effective_phase_config || {};
      const elapsedDays = config.elapsed_days || 10;

      // Trova il massimo tra le durate
      if (elapsedDays > maxDays) {
        maxDays = elapsedDays;
      }

      initialState[estimate.estimate_id] = {
        estimate: estimate,
        phaseIntervals: {
          intervals_analysis: config.analysis?.values || [],
          intervals_development: config.development?.values || [],
          intervals_internal_test: config.internal_test?.values || [],
          intervals_uat: config.uat?.values || [],
          intervals_release: config.release?.values || [],
          intervals_pm: config.pm?.values || [],
          intervals_startup: config.startup?.values || [],
          intervals_documentation: config.documentation?.values || [],
        },
        fteResults: null,
        originalTotalDays: elapsedDays,
      };
    });

    setEstimatesState(initialState);
    setCommonTotalDays(maxDays);
  }, []);

  /**
   * Aggiorna gli intervalli di una singola stima e salva al backend
   */
  const updateEstimateIntervals = useCallback(
    async (estimateId, newIntervals) => {
      // Aggiorna stato locale immediatamente
      setEstimatesState((prev) => ({
        ...prev,
        [estimateId]: {
          ...prev[estimateId],
          phaseIntervals: newIntervals,
        },
      }));

      // Usa il ref per avere lo stato aggiornato
      const state = estimatesStateRef.current[estimateId];
      if (state?.estimate) {
        const currentConfig = state.estimate.effective_phase_config || {};
        const updatedConfig = {
          ...currentConfig,
          analysis: { ...currentConfig.analysis, values: newIntervals.intervals_analysis },
          development: { ...currentConfig.development, values: newIntervals.intervals_development },
          internal_test: { ...currentConfig.internal_test, values: newIntervals.intervals_internal_test },
          uat: { ...currentConfig.uat, values: newIntervals.intervals_uat },
          release: { ...currentConfig.release, values: newIntervals.intervals_release },
          pm: { ...currentConfig.pm, values: newIntervals.intervals_pm },
          startup: { ...currentConfig.startup, values: newIntervals.intervals_startup },
          documentation: { ...currentConfig.documentation, values: newIntervals.intervals_documentation },
          elapsed_days: commonTotalDays,
        };

        try {
          await updateEstimateMutation({
            id: estimateId,
            data: { estimate_phase_config: updatedConfig },
          }).unwrap();
        } catch (error) {
          console.error('Errore salvataggio configurazione stima', estimateId, error);
        }
      }

      // Ricalcola FTE per questa stima
      try {
        const result = await calculateFTEMutation({
          estimateId,
          data: {
            total_days: commonTotalDays,
            ...newIntervals,
          },
        }).unwrap();

        setEstimatesState((prev) => ({
          ...prev,
          [estimateId]: {
            ...prev[estimateId],
            fteResults: result,
          },
        }));
      } catch (error) {
        console.error('Errore calcolo FTE per stima', estimateId, error);
      }
    },
    [calculateFTEMutation, commonTotalDays, updateEstimateMutation]
  );

  /**
   * Salva la configurazione delle fasi di una stima nel backend
   */
  const saveEstimatePhaseConfig = useCallback(
    async (estimateId, newIntervals, elapsedDays) => {
      const state = estimatesStateRef.current[estimateId];
      if (!state?.estimate) return;

      const currentConfig = state.estimate.effective_phase_config || {};

      const updatedConfig = {
        ...currentConfig,
        analysis: { ...currentConfig.analysis, values: newIntervals.intervals_analysis },
        development: { ...currentConfig.development, values: newIntervals.intervals_development },
        internal_test: { ...currentConfig.internal_test, values: newIntervals.intervals_internal_test },
        uat: { ...currentConfig.uat, values: newIntervals.intervals_uat },
        release: { ...currentConfig.release, values: newIntervals.intervals_release },
        pm: { ...currentConfig.pm, values: newIntervals.intervals_pm },
        startup: { ...currentConfig.startup, values: newIntervals.intervals_startup },
        documentation: { ...currentConfig.documentation, values: newIntervals.intervals_documentation },
        elapsed_days: elapsedDays ?? currentConfig.elapsed_days ?? 10,
      };

      try {
        await updateEstimateMutation({
          id: estimateId,
          data: { estimate_phase_config: updatedConfig },
        }).unwrap();
      } catch (error) {
        console.error('Errore salvataggio configurazione stima', estimateId, error);
      }
    },
    [updateEstimateMutation]
  );

  /**
   * Calcola FTE per tutte le stime
   */
  const calculateAllFTE = useCallback(async () => {
    const currentEstimatesState = estimatesStateRef.current;
    const estimateIds = Object.keys(currentEstimatesState);
    if (estimateIds.length === 0) return;

    setIsCalculating(true);

    const promises = estimateIds.map(async (estimateId) => {
      const state = currentEstimatesState[estimateId];
      if (!state?.phaseIntervals) return { estimateId, fteResults: null };

      // Verifica che ci siano intervalli validi
      const hasValidIntervals = Object.values(state.phaseIntervals).some(
        (intervals) => Array.isArray(intervals) && intervals.length > 0
      );

      if (!hasValidIntervals) {
        return { estimateId, fteResults: null };
      }

      try {
        const result = await calculateFTEMutation({
          estimateId,
          data: {
            total_days: commonTotalDays,
            ...state.phaseIntervals,
          },
        }).unwrap();

        return { estimateId, fteResults: result };
      } catch (error) {
        console.error('Errore calcolo FTE per stima', estimateId, error);
        return { estimateId, fteResults: null };
      }
    });

    const results = await Promise.all(promises);

    setEstimatesState((prev) => {
      const updated = { ...prev };
      results.forEach(({ estimateId, fteResults }) => {
        if (estimateId && updated[estimateId]) {
          updated[estimateId] = {
            ...updated[estimateId],
            fteResults,
          };
        }
      });
      return updated;
    });

    setIsCalculating(false);
  }, [calculateFTEMutation, commonTotalDays]);

  /**
   * Cambia la durata comune, salva al backend per tutte le stime e ricalcola tutti gli FTE
   */
  const handleCommonTotalDaysChange = useCallback(
    async (newDays) => {
      setCommonTotalDays(newDays);

      // Usa il ref per avere lo stato aggiornato
      const currentEstimatesState = estimatesStateRef.current;

      // Salva la nuova durata per tutte le stime al backend
      const estimateIds = Object.keys(currentEstimatesState);
      const savePromises = estimateIds.map(async (estimateId) => {
        const state = currentEstimatesState[estimateId];
        if (!state?.estimate) return;

        const currentConfig = state.estimate.effective_phase_config || {};
        const updatedConfig = {
          ...currentConfig,
          analysis: { ...currentConfig.analysis, values: state.phaseIntervals.intervals_analysis },
          development: { ...currentConfig.development, values: state.phaseIntervals.intervals_development },
          internal_test: { ...currentConfig.internal_test, values: state.phaseIntervals.intervals_internal_test },
          uat: { ...currentConfig.uat, values: state.phaseIntervals.intervals_uat },
          release: { ...currentConfig.release, values: state.phaseIntervals.intervals_release },
          pm: { ...currentConfig.pm, values: state.phaseIntervals.intervals_pm },
          startup: { ...currentConfig.startup, values: state.phaseIntervals.intervals_startup },
          documentation: { ...currentConfig.documentation, values: state.phaseIntervals.intervals_documentation },
          elapsed_days: newDays,
        };

        try {
          await updateEstimateMutation({
            id: estimateId,
            data: { estimate_phase_config: updatedConfig },
          }).unwrap();
        } catch (error) {
          console.error('Errore salvataggio durata per stima', estimateId, error);
        }
      });

      await Promise.all(savePromises);
      // Il ricalcolo FTE avverrà tramite useEffect nel componente chiamante
    },
    [updateEstimateMutation]
  );

  /**
   * Salva la configurazione comune del grafico (ordine categorie + colori) su tutte le stime
   */
  const saveCommonConfig = useCallback(
    async (commonConfig) => {
      const currentEstimatesState = estimatesStateRef.current;
      const estimateIds = Object.keys(currentEstimatesState);

      // Aggiorna stato locale per tutte le stime
      setEstimatesState((prev) => {
        const updated = { ...prev };
        estimateIds.forEach((id) => {
          if (updated[id]) {
            updated[id] = {
              ...updated[id],
              estimate: {
                ...updated[id].estimate,
                effective_phase_config: {
                  ...updated[id].estimate?.effective_phase_config,
                  common: commonConfig,
                },
              },
            };
          }
        });
        return updated;
      });

      // Salva al backend per tutte le stime
      const savePromises = estimateIds.map(async (estimateId) => {
        const state = currentEstimatesState[estimateId];
        if (!state?.estimate) return;

        const currentConfig = state.estimate.effective_phase_config || {};
        const updatedConfig = {
          ...currentConfig,
          common: commonConfig,
        };

        try {
          await updateEstimateMutation({
            id: estimateId,
            data: { estimate_phase_config: updatedConfig },
          }).unwrap();
        } catch (error) {
          console.error('Errore salvataggio config comune per stima', estimateId, error);
        }
      });

      await Promise.all(savePromises);
    },
    [updateEstimateMutation]
  );

  /**
   * Aggiorna i config locali delle stime dopo salvataggio distribuzione
   */
  const updateEstimateConfigs = useCallback((updatedConfigs) => {
    setEstimatesState((prev) => {
      const updated = { ...prev };
      Object.entries(updatedConfigs).forEach(([id, newConfig]) => {
        if (updated[id]) {
          updated[id] = {
            ...updated[id],
            estimate: {
              ...updated[id].estimate,
              effective_phase_config: newConfig,
            },
          };
        }
      });
      return updated;
    });
  }, []);

  /**
   * FTE aggregato (somma di tutte le stime)
   */
  const aggregatedFTE = useMemo(() => {
    const allFteResults = Object.entries(estimatesState)
      .filter(([_, state]) => state.fteResults)
      .map(([estimateId, state]) => ({
        estimateId,
        fteResults: state.fteResults,
      }));

    return aggregateFTEResults(allFteResults);
  }, [estimatesState]);

  /**
   * Lista ordinata delle stime con i loro stati
   */
  const estimatesList = useMemo(() => {
    return selectedIds
      .map((id) => ({
        estimateId: id,
        ...estimatesState[id],
      }))
      .filter((item) => item.estimate);
  }, [selectedIds, estimatesState]);

  return {
    estimatesState,
    estimatesList,
    commonTotalDays,
    setCommonTotalDays: handleCommonTotalDaysChange,
    isCalculating,
    initializeFromEstimates,
    updateEstimateIntervals,
    saveEstimatePhaseConfig,
    calculateAllFTE,
    updateEstimateConfigs,
    saveCommonConfig,
    aggregatedFTE,
  };
}
