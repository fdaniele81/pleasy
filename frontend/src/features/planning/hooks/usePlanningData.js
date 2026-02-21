import { useEffect, useState, useRef, useCallback } from 'react';
import { useGetPMPlanningQuery } from '../api/planningEndpoints';
import { useGetHolidaysQuery } from '../../holidays/api/holidayEndpoints';
import { useLazyGetAvailableUsersQuery } from '../api/taskEndpoints';
import logger from '../../../utils/logger';

export function usePlanningData() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const {
    data: projects = [],
    isLoading: loading,
    refetch: refetchPlanning,
  } = useGetPMPlanningQuery();

  const { data: holidays = [] } = useGetHolidaysQuery();

  const [triggerFetchAvailableUsers] = useLazyGetAvailableUsersQuery();

  const [availableUsersCache, setAvailableUsersCache] = useState({});

  const [syncData, setSyncData] = useState([]);
  const [loadingSyncData, setLoadingSyncData] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showGlobalSyncModal, setShowGlobalSyncModal] = useState(false);
  const [selectedExternalKey, setSelectedExternalKey] = useState(null);
  const [hasTemplate, setHasTemplate] = useState(true);
  const [hasValidQuery, setHasValidQuery] = useState(true);

  const [showGanttModal, setShowGanttModal] = useState(false);
  const [showInitialActualModal, setShowInitialActualModal] = useState(false);
  const [selectedTaskForInitialActual, setSelectedTaskForInitialActual] = useState(null);

  const [addingTaskForProject, setAddingTaskForProject] = useState(null);

  const lastRefreshRef = useRef(0);
  const REFRESH_DEBOUNCE_MS = 5000;

  const fetchSyncData = async () => {
    setLoadingSyncData(true);
    try {
      const templateResponse = await fetch(`${API_BASE_URL}/api/reconciliation/template`, {
        credentials: 'include',
      });

      if (!templateResponse.ok) {
        setHasTemplate(false);
        setSyncData([]);
        return;
      }

      const templateData = await templateResponse.json();

      if (!templateData.template) {
        setHasTemplate(false);
        setHasValidQuery(false);
        setSyncData([]);
        return;
      }

      const queryEmpty = !templateData.template.sql_query || templateData.template.sql_query.trim() === '';

      setHasTemplate(true);
      setHasValidQuery(!queryEmpty);

      const response = await fetch(`${API_BASE_URL}/api/reconciliation/sync-status`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSyncData(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Risposta non JSON' }));
        logger.error('[SYNC] Error fetching sync data:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        setSyncData([]);
      }
    } catch (error) {
      logger.error('[SYNC] Fetch sync data exception:', error);
      setHasTemplate(false);
      setHasValidQuery(false);
      setSyncData([]);
    } finally {
      setLoadingSyncData(false);
    }
  };

  const getSyncDataForKey = (externalKey) => {
    if (!externalKey) return [];
    return syncData.filter(row => row.external_key === externalKey);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      lastRefreshRef.current = Date.now();
      fetchSyncData();
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  const refreshData = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_DEBOUNCE_MS) {
      return;
    }
    lastRefreshRef.current = now;
    fetchSyncData();
    refetchPlanning();
  }, [refetchPlanning]);

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
  }, [refreshData]);

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
