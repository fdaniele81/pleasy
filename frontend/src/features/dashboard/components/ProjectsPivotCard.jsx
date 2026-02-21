import React, { useState, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, ChevronsUpDown, LayoutGrid } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { useProjectsPivot } from "../hooks/useProjectsPivot";
import { FilterDropdown } from "../../../shared/ui/filters";
import { SkeletonLine } from "../../../shared/components/skeletons";

const ProjectsPivotSkeleton = memo(function ProjectsPivotSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 flex gap-4 items-center">
        <SkeletonLine width="100px" height="2rem" className="rounded-lg" />
        <SkeletonLine width="140px" height="2rem" className="rounded-lg" />
        <div className="flex-1" />
        <SkeletonLine width="120px" height="1.5rem" />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Cliente / Progetto', 'Budget', 'Actual', 'ETC', 'EAC', 'Delta', '% Utilizzo'].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <SkeletonLine width={i === 0 ? '120px' : '50px'} height="0.75rem" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded-full" />
                    <SkeletonLine width={idx % 2 === 0 ? '150px' : '120px'} height="0.875rem" />
                  </div>
                </td>
                {Array.from({ length: 6 }).map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 text-right">
                    <SkeletonLine width="40px" height="0.75rem" className="ml-auto" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const ProjectsPivotCard = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const {
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
  } = useProjectsPivot();

  const [expandedClients, setExpandedClients] = useState({});

  const ownerOptions = useMemo(() => {
    return owners.map((owner) => ({
      value: owner.user_id,
      label: owner.full_name || t('dashboard:noName'),
    }));
  }, [owners]);

  const toggleClientExpand = (clientId) => {
    setExpandedClients((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  const allExpanded = clientPivotData.length > 0 &&
    clientPivotData.every((client) => expandedClients[client.client_id]);

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedClients({});
    } else {
      const allExpanded = {};
      clientPivotData.forEach((client) => {
        allExpanded[client.client_id] = true;
      });
      setExpandedClients(allExpanded);
    }
  };

  const handleProjectClick = (project) => {
    navigate(`/planning?project_id=${project.project_id}`);
  };

  const formatDays = (hours) => (hours / 8).toFixed(1);

  const getDeltaClass = (delta) =>
    delta >= 0 ? "text-green-600" : "text-red-600";

  const getUtilizationColor = (pct) => {
    if (pct < 80) return "bg-green-500";
    if (pct <= 100) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <DashboardCard
      title={t('dashboard:plannedActivitySummary')}
      icon={LayoutGrid}
      loading={isLoading}
      skeleton={<ProjectsPivotSkeleton />}
    >
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-2.5 py-1 text-sm font-medium transition-colors ${
              statusFilter === "ACTIVE"
                ? "bg-cyan-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t('dashboard:activeOnly')}
          </button>
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-2.5 py-1 text-sm font-medium transition-colors border-l border-gray-300 ${
              statusFilter === "ALL"
                ? "bg-cyan-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t('dashboard:allFilter')}
          </button>
        </div>

        {ownerOptions.length > 0 && (
          <FilterDropdown
            options={ownerOptions}
            selectedValues={selectedOwners}
            onChange={setSelectedOwners}
            placeholder={t('dashboard:allUsers')}
            selectedLabel={(count) => t('dashboard:usersCount', { count })}
            title={t('dashboard:selectUsers')}
            size="sm"
            minWidth="90px"
          />
        )}

        <div className="flex-1" />

        <span className="text-sm text-gray-500">
          {t('dashboard:clientsAndProjects', { clients: grandTotals.clientCount, projects: grandTotals.projectCount })}
        </span>
        <button
          onClick={toggleExpandAll}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title={allExpanded ? t('dashboard:collapseAllTitle') : t('dashboard:expandAllTitle')}
        >
          <ChevronsUpDown size={16} />
          <span>{allExpanded ? t('dashboard:collapseAll') : t('dashboard:expandAll')}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {groupBy === "client" ? t('dashboard:clientProject') : t('dashboard:projectLabel')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('dashboard:budgetDays')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('dashboard:actualDays')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('dashboard:etcDays')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('dashboard:eacDays')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('dashboard:deltaDays')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('dashboard:utilizationPct')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <>
              {clientPivotData.map((client) => (
                <React.Fragment key={client.client_id}>
                  <tr
                    className="bg-gray-50 hover:bg-gray-100 cursor-pointer font-medium"
                    onClick={() => toggleClientExpand(client.client_id)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleClientExpand(client.client_id);
                          }}
                          className="mr-2 text-gray-500 hover:text-gray-700"
                        >
                          {expandedClients[client.client_id] ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: client.client_color }}
                        />
                        <span className="text-sm font-semibold text-gray-900">
                          {client.client_name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({t('dashboard:projectsCount', { count: client.projects.length })})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      {formatDays(client.totals.budget)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      {formatDays(client.totals.actual)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      {formatDays(client.totals.etc)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      {formatDays(client.totals.eac)}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-right text-sm font-semibold ${getDeltaClass(
                        client.totals.delta
                      )}`}
                    >
                      {client.totals.delta >= 0 ? "+" : ""}
                      {formatDays(client.totals.delta)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end">
                        <span className="text-sm font-semibold text-gray-900 mr-2">
                          {client.totals.utilization}%
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getUtilizationColor(
                              client.totals.utilization
                            )}`}
                            style={{
                              width: `${Math.min(
                                client.totals.utilization,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>

                  {expandedClients[client.client_id] &&
                    client.projects.map((project) => (
                      <tr
                        key={project.project_id}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => handleProjectClick(project)}
                      >
                        <td className="px-4 py-2 pl-12 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-700">
                              {project.project_key} - {project.project_title}
                            </span>
                            {project.status_id !== "ACTIVE" && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gray-200 text-gray-600">
                                {project.status_id}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-600">
                          {formatDays(project.budget)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-600">
                          {formatDays(project.actual)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-600">
                          {formatDays(project.etc)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-600">
                          {formatDays(project.eac)}
                        </td>
                        <td
                          className={`px-4 py-2 whitespace-nowrap text-right text-sm ${getDeltaClass(
                            project.delta
                          )}`}
                        >
                          {project.delta >= 0 ? "+" : ""}
                          {formatDays(project.delta)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end">
                            <span className="text-sm text-gray-600 mr-2">
                              {project.utilization}%
                            </span>
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${getUtilizationColor(
                                  project.utilization
                                )}`}
                                style={{
                                  width: `${Math.min(
                                    project.utilization,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </>

            <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-900">
                {t('dashboard:grandTotal')}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-blue-900">
                {formatDays(grandTotals.budget)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-blue-900">
                {formatDays(grandTotals.actual)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-blue-900">
                {formatDays(grandTotals.etc)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-blue-900">
                {formatDays(grandTotals.eac)}
              </td>
              <td
                className={`px-4 py-3 whitespace-nowrap text-right text-sm font-bold ${getDeltaClass(
                  grandTotals.delta
                )}`}
              >
                {grandTotals.delta >= 0 ? "+" : ""}
                {formatDays(grandTotals.delta)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <div className="flex items-center justify-end">
                  <span className="text-sm font-bold text-blue-900 mr-2">
                    {grandTotals.utilization}%
                  </span>
                  <div className="w-20 bg-blue-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getUtilizationColor(
                        grandTotals.utilization
                      )}`}
                      style={{
                        width: `${Math.min(grandTotals.utilization, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {clientPivotData.length === 0 && projectPivotData.length === 0 && (
        <div className="flex items-center justify-center h-32 text-gray-400">
          {t('dashboard:noProjectsAvailable')}
        </div>
      )}
    </DashboardCard>
  );
};

export default ProjectsPivotCard;
