import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetClientsWithProjectsQuery } from '../clients/api/clientEndpoints';
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation
} from './api/projectEndpoints';
import { FolderKanban, Edit2, Users } from 'lucide-react';
import ProjectModal from './components/ProjectModal';
import SearchFilter from '../../shared/components/SearchFilter';
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

  const allProjects = clients.flatMap(client =>
    (client.projects || []).map(project => ({
      ...project,
      client_name: client.client_name,
      client_key: client.client_key,
      client_id: client.client_id,
      client_color: client.color
    }))
  ).filter(project => project.project_type_id !== 'TM');

  const filteredProjects = useFilteredList(
    allProjects,
    searchTerm,
    ['project_key', 'title', 'client_name', 'client_key']
  );

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

          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={t('projects:searchPlaceholder')}
          />

          {filteredProjects.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full table-fixed" aria-label="Lista progetti">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="w-[13%] xl:w-[10%] px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('projects:code')}
                    </th>
                    <th scope="col" className="px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('projects:projectTitle')}
                    </th>
                    <th scope="col" className="w-[20%] xl:w-[18%] px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('projects:client')}
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
                  {filteredProjects.map((project) => {
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
                        <td className="px-3 xl:px-4 py-2 overflow-hidden">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="px-2 py-0.5 text-xs font-semibold rounded-full text-black whitespace-nowrap shrink-0"
                              style={{ backgroundColor: project.client_color }}
                            >
                              {project.client_key}
                            </span>
                            <span className="text-sm text-gray-700 truncate hidden xl:inline">
                              {project.client_name}
                            </span>
                          </div>
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
            </div>
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
