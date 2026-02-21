import { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useGetDashboardProjectsQuery } from '../api/dashboardEndpoints';
import { selectIsAuthenticated } from '../../../store/selectors/authSelectors';

export function useProjectsPivot() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [groupBy, setGroupBy] = useState('client');
  const [selectedOwners, setSelectedOwners] = useState([]);

  const {
    data: dashboardData = { projects: [], owners: [] },
    isLoading,
    refetch,
  } = useGetDashboardProjectsQuery(undefined, { skip: !isAuthenticated });

  const { projects = [], owners = [] } = dashboardData;

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.status_id === 'ACTIVE');
    }

    if (selectedOwners.length > 0) {
      filtered = filtered
        .map((project) => {
          const filteredTasks = (project.tasks || []).filter((task) =>
            selectedOwners.includes(task.owner_id)
          );

          if (filteredTasks.length === 0) {
            return null;
          }

          const budget = filteredTasks.reduce((sum, t) => sum + (t.budget || 0), 0);
          const actual = filteredTasks.reduce((sum, t) => sum + (t.actual || 0), 0);
          const etc = filteredTasks.reduce((sum, t) => sum + (t.etc_hours || 0), 0);
          const eac = actual + etc;
          const delta = budget - eac;

          return {
            ...project,
            budget: Math.round(budget * 10) / 10,
            actual: Math.round(actual * 10) / 10,
            etc: Math.round(etc * 10) / 10,
            eac: Math.round(eac * 10) / 10,
            delta: Math.round(delta * 10) / 10,
            tasks: filteredTasks,
          };
        })
        .filter(Boolean);
    }

    return filtered;
  }, [projects, statusFilter, selectedOwners]);

  const clientPivotData = useMemo(() => {
    const clientMap = {};

    filteredProjects.forEach((project) => {
      const clientId = project.client_id;

      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          client_id: clientId,
          client_name: project.client_name || 'N/A',
          client_color: project.client_color || '#6b7280',
          client_status_id: project.client_status_id,
          projects: [],
          totals: {
            budget: 0,
            actual: 0,
            etc: 0,
            eac: 0,
            delta: 0,
          },
        };
      }

      const budget = parseFloat(project.budget) || 0;
      const actual = parseFloat(project.actual) || 0;
      const etc = parseFloat(project.etc) || 0;
      const eac = parseFloat(project.eac) || 0;
      const delta = parseFloat(project.delta) || 0;

      clientMap[clientId].projects.push({
        ...project,
        budget,
        actual,
        etc,
        eac,
        delta,
        utilization: budget > 0 ? Math.round((actual / budget) * 100) : 0,
      });

      clientMap[clientId].totals.budget += budget;
      clientMap[clientId].totals.actual += actual;
      clientMap[clientId].totals.etc += etc;
      clientMap[clientId].totals.eac += eac;
      clientMap[clientId].totals.delta += delta;
    });

    return Object.values(clientMap)
      .map((c) => ({
        ...c,
        totals: {
          ...c.totals,
          budget: Math.round(c.totals.budget * 10) / 10,
          actual: Math.round(c.totals.actual * 10) / 10,
          etc: Math.round(c.totals.etc * 10) / 10,
          eac: Math.round(c.totals.eac * 10) / 10,
          delta: Math.round(c.totals.delta * 10) / 10,
          utilization:
            c.totals.budget > 0
              ? Math.round((c.totals.actual / c.totals.budget) * 100)
              : 0,
        },
      }))
      .sort((a, b) => b.totals.budget - a.totals.budget);
  }, [filteredProjects]);

  const projectPivotData = useMemo(() => {
    return filteredProjects
      .map((project) => {
        const budget = parseFloat(project.budget) || 0;
        const actual = parseFloat(project.actual) || 0;
        const etc = parseFloat(project.etc) || 0;
        const eac = parseFloat(project.eac) || 0;
        const delta = parseFloat(project.delta) || 0;

        return {
          ...project,
          budget,
          actual,
          etc,
          eac,
          delta,
          utilization: budget > 0 ? Math.round((actual / budget) * 100) : 0,
        };
      })
      .sort((a, b) => b.budget - a.budget);
  }, [filteredProjects]);

  const grandTotals = useMemo(() => {
    const totals = filteredProjects.reduce(
      (acc, project) => {
        acc.budget += parseFloat(project.budget) || 0;
        acc.actual += parseFloat(project.actual) || 0;
        acc.etc += parseFloat(project.etc) || 0;
        acc.eac += parseFloat(project.eac) || 0;
        acc.delta += parseFloat(project.delta) || 0;
        return acc;
      },
      { budget: 0, actual: 0, etc: 0, eac: 0, delta: 0 }
    );

    return {
      budget: Math.round(totals.budget * 10) / 10,
      actual: Math.round(totals.actual * 10) / 10,
      etc: Math.round(totals.etc * 10) / 10,
      eac: Math.round(totals.eac * 10) / 10,
      delta: Math.round(totals.delta * 10) / 10,
      utilization:
        totals.budget > 0
          ? Math.round((totals.actual / totals.budget) * 100)
          : 0,
      projectCount: filteredProjects.length,
      clientCount: clientPivotData.length,
    };
  }, [filteredProjects, clientPivotData]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    statusFilter,
    setStatusFilter,
    groupBy,
    setGroupBy,
    selectedOwners,
    setSelectedOwners,
    isLoading,

    clientPivotData,
    projectPivotData,
    grandTotals,
    owners,

    handleRefresh,
  };
}
