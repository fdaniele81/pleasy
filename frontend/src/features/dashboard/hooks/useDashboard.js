import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetDashboardProjectsQuery,
  useGetDashboardEstimatesQuery,
} from '../api/dashboardEndpoints';
import { selectIsAuthenticated } from '../../../store/selectors/authSelectors';

export function useDashboard() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const { data: projectsData = { projects: [], owners: [] }, isLoading: projectsLoading, refetch: refetchProjects } = useGetDashboardProjectsQuery(undefined, { skip: !isAuthenticated });
  const { data: estimates = [], isLoading: estimatesLoading, refetch: refetchEstimates } = useGetDashboardEstimatesQuery(undefined, { skip: !isAuthenticated });

  const projects = projectsData.projects || [];

  const estimatesByClient = useMemo(() => {
    const clientMap = {};

    estimates.forEach(estimate => {
      const clientId = estimate.client_id;
      const clientName = estimate.client_name || 'N/A';
      const hours = parseFloat(estimate.total_input_hours) || 0;
      const status = estimate.status;

      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          client_id: clientId,
          client_name: clientName,
          draft_hours: 0,
          converted_hours: 0,
          total_hours: 0,
          draft_count: 0,
          converted_count: 0,
          total_count: 0
        };
      }

      if (status === 'DRAFT') {
        clientMap[clientId].draft_hours += hours;
        clientMap[clientId].draft_count += 1;
      } else if (status === 'CONVERTED') {
        clientMap[clientId].converted_hours += hours;
        clientMap[clientId].converted_count += 1;
      }

      clientMap[clientId].total_count += 1;
    });

    return Object.values(clientMap)
      .map(c => ({
        ...c,
        total_hours: c.draft_hours + c.converted_hours,
        draft_hours: Math.round(c.draft_hours * 10) / 10,
        converted_hours: Math.round(c.converted_hours * 10) / 10
      }))
      .map(c => ({
        ...c,
        total_hours: Math.round(c.total_hours * 10) / 10
      }))
      .sort((a, b) => b.total_hours - a.total_hours)
      .slice(0, 10);
  }, [estimates]);

  const projectsBudgetByClient = useMemo(() => {
    const clientMap = {};

    projects.forEach(project => {
      if (project.status_id !== 'ACTIVE') return;

      const clientId = project.client_id;
      const clientName = project.client_name || 'N/A';
      const clientColor = project.client_color || '#6b7280';

      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          client_id: clientId,
          client_name: clientName,
          client_color: clientColor,
          project_count: 0,
          budget_totale: 0,
          actual: 0,
          etc: 0,
          eac: 0,
          delta: 0
        };
      }

      const budget = parseFloat(project.budget) || 0;
      const actual = parseFloat(project.actual) || 0;
      const etc = parseFloat(project.etc) || 0;
      const eac = parseFloat(project.eac) || 0;

      clientMap[clientId].budget_totale += budget;
      clientMap[clientId].actual += actual;
      clientMap[clientId].etc += etc;
      clientMap[clientId].eac += eac;
      clientMap[clientId].project_count += 1;
    });

    return Object.values(clientMap)
      .map(c => {
        const budget_totale = Math.round(c.budget_totale * 10) / 10;
        const actual = Math.round(c.actual * 10) / 10;
        const etc = Math.round(c.etc * 10) / 10;
        const eac = Math.round(c.eac * 10) / 10;
        const delta = Math.round((budget_totale - eac) * 10) / 10;
        const utilization_percentage = budget_totale > 0
          ? Math.round((actual / budget_totale) * 100)
          : 0;

        return {
          client_id: c.client_id,
          client_name: c.client_name,
          client_color: c.client_color,
          project_count: c.project_count,
          budget_totale,
          actual,
          etc,
          eac,
          delta,
          utilization_percentage
        };
      })
      .sort((a, b) => b.budget_totale - a.budget_totale);
  }, [projects]);

  const handleRefresh = useCallback(() => {
    refetchProjects();
    refetchEstimates();
  }, [refetchProjects, refetchEstimates]);

  const loading = {
    projects: projectsLoading,
    estimates: estimatesLoading,
  };

  const isLoading = projectsLoading || estimatesLoading;

  return {
    loading,
    isLoading,

    estimatesByClient,
    projectsBudgetByClient,

    handleRefresh,
  };
}
