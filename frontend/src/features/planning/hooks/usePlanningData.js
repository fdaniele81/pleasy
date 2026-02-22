import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useGetPMPlanningQuery } from '../api/planningEndpoints';
import { useGetHolidaysQuery } from '../../holidays/api/holidayEndpoints';
import { useLazyGetAvailableUsersQuery } from '../api/taskEndpoints';
import {
  useGetReconciliationTemplateQuery,
  useGetReconciliationSyncStatusQuery,
} from '../../templateconfiguration/api/reconciliationEndpoints';
import logger from '../../../utils/logger';

export function usePlanningData() {
  const {
    data: projects = [],
    isLoading: loading,
    refetch: refetchPlanning,
  } = useGetPMPlanningQuery();

  const { data: holidays = [] } = useGetHolidaysQuery();

  const [triggerFetchAvailableUsers] = useLazyGetAvailableUsersQuery();

  const [availableUsersCache, setAvailableUsersCache] = useState({});

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showGlobalSyncModal, setShowGlobalSyncModal] = useState(false);
  const [selectedExternalKey, setSelectedExternalKey] = useState(null);

  const [showGanttModal, setShowGanttModal] = useState(false);
  const [showInitialActualModal, setShowInitialActualModal] = useState(false);
  const [selectedTaskForInitialActual, setSelectedTaskForInitialActual] = useState(null);

  const [addingTaskForProject, setAddingTaskForProject] = useState(null);

  const lastRefreshRef = useRef(0);
  const REFRESH_DEBOUNCE_MS = 5000;

  const {
    data: template,
    isError: templateError,
    refetch: refetchTemplate,
  } = useGetReconciliationTemplateQuery();

  const hasTemplate = !templateError && template != null;
  const hasValidQuery = hasTemplate && !!template?.sql_query?.trim();

  const {
    data: syncResponse,
    isLoading: loadingSyncData,
    refetch: refetchSync,
  } = useGetReconciliationSyncStatusQuery(undefined, {
    skip: !hasTemplate,
  });

  const syncData = useMemo(() => syncResponse?.data || [], [syncResponse]);

  const fetchSyncData = useCallback(() => {
    refetchTemplate();
    refetchSync();
  }, [refetchTemplate, refetchSync]);

  const getSyncDataForKey = useCallback((externalKey) => {
    if (!externalKey) return [];
    return syncData.filter(row => row.external_key === externalKey);
  }, [syncData]);

  const refreshData = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_DEBOUNCE_MS) {
      return;
    }
    lastRefreshRef.current = now;
    fetchSyncData();
    refetchPlanning();
  }, [refetchPlanning, fetchSyncData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData();
      }
    };

    const handleTemplateUpdate = () => {
      fetchSyncData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('reconciliation-template-updated', handleTemplateUpdate);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('reconciliation-template-updated', handleTemplateUpdate);
    };
  }, [refreshData, fetchSyncData]);

  return {
    projects,
    loading,
    toast: null,
    availableUsers: availableUsersCache,
    addingTaskForProject,

    syncData,
    loadingSyncData,
    hasTemplate,
    hasValidQuery,

    showGanttModal,
    setShowGanttModal,
    showInitialActualModal,
    setShowInitialActualModal,
    selectedTaskForInitialActual,
    setSelectedTaskForInitialActual,
    showSyncModal,
    setShowSyncModal,
    showGlobalSyncModal,
    setShowGlobalSyncModal,
    selectedExternalKey,
    setSelectedExternalKey,

    fetchSyncData,
    getSyncDataForKey,
    hideToast: () => {},
    fetchAvailableUsers: async (projectId) => {
      if (availableUsersCache[projectId]) return;
      try {
        const result = await triggerFetchAvailableUsers(projectId).unwrap();
        setAvailableUsersCache(prev => ({
          ...prev,
          [projectId]: result
        }));
      } catch (error) {
        logger.error('Errore caricamento utenti disponibili:', error);
      }
    },
    refetchPlanning,
    setAddingTaskForProject,
  };
}
