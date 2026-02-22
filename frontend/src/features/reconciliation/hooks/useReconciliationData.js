import { useEffect, useMemo, useCallback } from 'react';
import {
  useGetReconciliationTemplateQuery,
  useGetReconciliationSyncStatusQuery,
} from '../../templateconfiguration/api/reconciliationEndpoints';

export function useReconciliationData() {
  const {
    data: template,
    isLoading: templateLoading,
    isError: templateError,
    refetch: refetchTemplate,
  } = useGetReconciliationTemplateQuery();

  const hasTemplate = !templateError && template != null;
  const hasValidQuery = hasTemplate && !!template?.sql_query?.trim();

  const {
    data: syncResponse,
    isLoading: syncLoading,
    refetch: refetchSync,
  } = useGetReconciliationSyncStatusQuery(undefined, {
    skip: !hasTemplate,
  });

  const syncData = useMemo(() => syncResponse?.data || [], [syncResponse]);
  const loading = templateLoading || syncLoading;

  const refetch = useCallback(() => {
    refetchTemplate();
    refetchSync();
  }, [refetchTemplate, refetchSync]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) refetch();
    };

    const handleTemplateUpdate = () => refetch();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('reconciliation-template-updated', handleTemplateUpdate);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('reconciliation-template-updated', handleTemplateUpdate);
    };
  }, [refetch]);

  return {
    syncData,
    loading,
    hasTemplate,
    hasValidQuery,
    refetch,
  };
}
