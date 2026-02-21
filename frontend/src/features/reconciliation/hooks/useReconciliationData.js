import { useEffect, useState, useCallback } from 'react';
import logger from '../../../utils/logger';

export function useReconciliationData() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const [syncData, setSyncData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasTemplate, setHasTemplate] = useState(true);
  const [hasValidQuery, setHasValidQuery] = useState(true);

  const fetchSyncData = useCallback(async () => {
    setLoading(true);
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
        logger.error('[SYNC] Error fetching sync data');
        setSyncData([]);
      }
    } catch (error) {
      logger.error('[SYNC] Fetch sync data exception:', error);
      setHasTemplate(false);
      setHasValidQuery(false);
      setSyncData([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchSyncData();
  }, [fetchSyncData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSyncData();
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
  }, [fetchSyncData]);

  return {
    syncData,
    loading,
    hasTemplate,
    hasValidQuery,
    refetch: fetchSyncData,
  };
}
