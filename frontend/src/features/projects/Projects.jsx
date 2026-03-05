import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetClientsWithProjectsQuery } from '../clients/api/clientEndpoints';
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation
} from './api/projectEndpoints';
import { FolderKanban, Edit2, Users, ChevronRight, ChevronDown, ChevronsUpDown } from 'lucide-react';
import ProjectModal from './components/ProjectModal';
import FilterDropdown from '../../shared/ui/filters/FilterDropdown';
import { getStatusBadgeColor } from '../../utils/ui/statusUtils';
import { getInitials, getColorFromName } from '../../utils/ui/avatarUtils';
import PageHeader from '../../shared/ui/PageHeader';
import EmptyState from '../../shared/ui/EmptyState';
import Button from '../../shared/ui/Button';
import { useFilteredList } from '../../hooks/useFilteredList';

function ProjectsSimple() {
  const { t } = useTranslation(['projects', 'common', 'errors']);
  const { data: clients = [], isLoading: loading } = useGetClientsWithProjectsQuery();
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClientIds, setFilterClientIds] = useState([]);
  const [expandedClients, setExpandedClients] = useState({});

  const allProjects = clients.flatMap(client =>
    (client.projects || []).map(project => ({
      ...project,
      client_name: client.client_name,
      client_key: client.client_key,
      client_id: client.client_id,
      client_color: client.color
    }))
  ).filter(project => project.project_type_id !== 'TM');

  const uniqueClients = useMemo(() => {
    const map = new Map();
    allProjects.forEach(p => {
      if (p.client_id && !map.has(p.client_id)) {
        map.set(p.client_id, {
          client_id: p.client_id,
          client_key: p.client_key,
          client_name: p.client_name,
          client_color: p.client_color
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.client_key || '').localeCompare(b.client_key || '')
    );
  }, [allProjects]);

  const clientFiltered = useMemo(() => {
    if (filterClientIds.length === 0) return allProjects;
    return allProjects.filter(p => filterClientIds.includes(p.client_id));
  }, [allProjects, filterClientIds]);

  const filteredProjects = useFilteredList(
    clientFiltered,
    searchTerm,
    ['project_key', 'title', 'client_name', 'client_key']
  );

  const groupedByClient = useMemo(() => {
    const groups = new Map();
    filteredProjects.forEach(p => {
      if (!groups.has(p.client_id)) {
        groups.set(p.client_id, {
          client_id: p.client_id,
          client_key: p.client_key,
          client_name: p.client_name,
          client_color: p.client_color,
          projects: []
        });
      }
      groups.get(p.client_id).projects.push(p);
    });
    return Array.from(groups.values()).sort((a, b) =>
      (a.client_key || '').localeCompare(b.client_key || '')
    );
  }, [filteredProjects]);

  const allExpanded = groupedByClient.length > 0 && groupedByClient.every(g => expandedClients[g.client_id]);

  const toggleClient = (clientId) => {
    setExpandedClients(prev => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedClients({});
    } else {
      const all = {};
      groupedByClient.forEach(g => { all[g.client_id] = true; });
      setExpandedClients(all);
    }
  };

  const handleCreateProject = async (projectData, clientId) => {
    try {
      await createProject({ clientId, projectData }).unwrap();
    } catch (error) {
    }
  };

  const handleUpdateProject = async (projectData) => {
    if (editingProject) {
      try {
        await updateProject({
          projectId: editingProject.project_id,
          projectData
        }).unwrap();

        setEditingProject(null);
      } catch (error) {
      }
    }
  };

  const handleDeleteProject = async (project) => {
    try {
      await deleteProject({
        projectId: project.project_id
      }).unwrap();
    } catch (error) {
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  if (loading && allProjects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6 pt-20">
          <div className="text-xl">{t('common:loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={editingProject ? handleUpdateProject : handleCreateProject}
        project={editingProject}
        clients={clients}
      />

      <div className="p-4">
        <div className="max-w-full mx-auto">
          <div className="mt-16"></div>

          <PageHeader
            icon={FolderKanban}
            title={t('projects:title')}
            description={t('projects:description')}
            actionButton={{
              label: t('projects:newProject'),
              onClick: () => setIsModalOpen(true)
            }}
          />

          {/* Filter bar: client dropdown + search inline */}
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex items-center gap-3">
            <FilterDropdown
              options={uniqueClients.map(c => ({
                value: c.client_id,
                label: `${c.client_key} - ${c.client_name}`,
                color: c.client_color,
              }))}
              selectedValues={filterClientIds}
              onChange={setFilterClientIds}
              placeholder={t('projects:allClients')}
              selectedLabel={(count) => t('projects:clientsCount', { count })}
              title={t('projects:selectClients')}
              size="md"
              minWidth="140px"
            />
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={t('projects:searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 pl-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent bg-white"
                aria-label={t('projects:searchPlaceholder')}
              />
              <svg
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={t('common:clearSearch')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {groupedByClient.length > 0 && (
            <>
              {/* Expand/Collapse all */}
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ChevronsUpDown size={14} />
                  {allExpanded ? t('projects:collapseAll') : t('projects:expandAll')}
                </button>
              </div>

              <div className="space-y-2">
                {groupedByClient.map((group) => {
                  const isExpanded = !!expandedClients[group.client_id];
                  return (
                    <div key={group.client_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      {/* Client group header */}
                      <button
                        type="button"
                        onClick={() => toggleClient(group.client_id)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b border-gray-200"
                      >
                        {isExpanded
                          ? <ChevronDown size={18} className="text-gray-500 shrink-0" />
                          : <ChevronRight size={18} className="text-gray-500 shrink-0" />
                        }
                        <span
                          className="px-2.5 py-0.5 text-xs font-semibold rounded-full text-black shrink-0"
                          style={{ backgroundColor: group.client_color }}
                        >
                          {group.client_key}
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {group.client_name}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0 ml-auto">
                          {t('projects:projectsCount', { count: group.projects.length })}
                        </span>
                      </button>

                      {/* Projects table */}
                      {isExpanded && (
                        <table className="w-full table-fixed" aria-label={`${group.client_name} projects`}>
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th scope="col" className="w-[13%] xl:w-[10%] px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('projects:code')}
                              </th>
                              <th scope="col" className="px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('projects:projectTitle')}
                              </th>
                              <th scope="col" className="hidden xl:table-cell w-[14%] px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('projects:pm')}
                              </th>
                              <th scope="col" className="w-[10%] xl:w-[8%] px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('common:status')}
                              </th>
                              <th scope="col" className="w-[12%] xl:w-[10%] px-3 xl:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('common:actions')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {group.projects.map((project) => {
                              const managers = [...(project.project_managers || [])].sort((a, b) =>
                                a.full_name.localeCompare(b.full_name)
                              );
                              const maxVisible = 3;
                              const visibleManagers = managers.slice(0, maxVisible);
                              const remainingCount = managers.length - maxVisible;

                              return (
                                <tr key={project.project_id} className="hover:bg-gray-50">
                                  <td className="px-3 xl:px-4 py-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <FolderKanban size={16} className="text-cyan-600 shrink-0" />
                                      <span className="text-sm font-medium text-gray-900 truncate">
                                        {project.project_key}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 xl:px-4 py-2 overflow-hidden">
                                    <span className="text-sm text-gray-900 font-medium truncate block" title={project.title}>
                                      {project.title}
                                    </span>
                                  </td>
                                  <td className="hidden xl:table-cell px-3 xl:px-4 py-2">
                                    <div className="flex items-center gap-1">
                                      {managers.length === 0 ? (
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                          <Users size={12} />
                                          {t('projects:noPm')}
                                        </span>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          {visibleManagers.map((manager, index) => (
                                            <div
                                              key={manager.user_id || index}
                                              className={`w-7 h-7 rounded-full ${getColorFromName(manager.full_name)} text-white flex items-center justify-center text-xs font-semibold shadow-sm shrink-0`}
                                              title={manager.full_name}
                                            >
                                              {getInitials(manager.full_name)}
                                            </div>
                                          ))}
                                          {remainingCount > 0 && (
                                            <div
                                              className="w-7 h-7 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-semibold shadow-sm shrink-0"
                                              title={t('projects:otherPms', { count: remainingCount })}
                                            >
                                              +{remainingCount}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 xl:px-4 py-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(project.status_id)}`}>
                                      {project.status_id}
                                    </span>
                                  </td>
                                  <td className="px-3 xl:px-4 py-2 text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        onClick={() => handleEdit(project)}
                                        variant="ghost"
                                        color="blue"
                                        size="sm"
                                        icon={Edit2}
                                        iconSize={18}
                                        title={t('common:edit')}
                                      />
                                      <Button
                                        confirmAction
                                        onConfirm={() => handleDeleteProject(project)}
                                        itemName={project.title}
                                        size="md"
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {filteredProjects.length === 0 && (
            <EmptyState
              icon={FolderKanban}
              title={searchTerm.trim() ? t('common:noResults') : t('projects:noProjects')}
              message={
                searchTerm.trim()
                  ? `${t('projects:noProjectsForSearch')} "${searchTerm}"`
                  : t('projects:emptyMessage')
              }
              action={!searchTerm.trim() ? {
                label: t('projects:addProject'),
                onClick: () => setIsModalOpen(true)
              } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectsSimple;
