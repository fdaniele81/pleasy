import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderKanban, Users } from 'lucide-react';
import {
  useLazyGetAvailableManagersQuery,
  useLazyGetProjectManagersQuery,
  useAddProjectManagerMutation,
  useRemoveProjectManagerMutation
} from '../api/projectEndpoints';
import { isRequired } from '../../../utils/validation/validationUtils';
import { useFormModal } from '../../../hooks/useFormModal';
import BaseModal from '../../../shared/components/BaseModal';
import UserAssignmentPanel from '../../../shared/components/UserAssignmentPanel';
import logger from '../../../utils/logger';

const ProjectModal = ({ isOpen, onClose, onConfirm, project = null, clients = [] }) => {
  const { t } = useTranslation(['projects', 'common']);
  const [fetchAvailableManagers, { data: availableManagers = [] }] = useLazyGetAvailableManagersQuery();
  const [fetchProjectManagers, { data: currentProjectManagers = [] }] = useLazyGetProjectManagersQuery();
  const [addProjectManager, { isLoading: isAddingPM }] = useAddProjectManagerMutation();
  const [removeProjectManager, { isLoading: isRemovingPM }] = useRemoveProjectManagerMutation();

  const {
    formData,
    errors,
    isEditMode,
    isSubmitting,
    handleChange,
    handleSubmit,
    setError
  } = useFormModal({
    initialValues: {
      project_key: '',
      title: '',
      client_id: '',
      status_id: 'ACTIVE'
    },
    entity: project,
    isOpen,
    transformForEdit: (project) => ({
      project_key: project.project_key || '',
      title: project.title || '',
      client_id: project.client_id || '',
      status_id: project.status_id || 'ACTIVE'
    }),
    validate: (data) => {
      if (!isRequired(data.project_key)) {
        return t('projects:projectCodeRequired');
      }
      if (!isRequired(data.title)) {
        return t('projects:projectTitleRequired');
      }
      if (!data.client_id) {
        return t('projects:clientRequired');
      }
      if (!data.status_id) {
        return t('projects:statusRequired');
      }
      return null;
    },
    onSubmit: async (data) => {
      const projectData = {
        project_key: data.project_key.trim().toUpperCase(),
        title: data.title.trim(),
        status_id: data.status_id
      };

      onConfirm(projectData, data.client_id);
      onClose();
    }
  });

  useEffect(() => {
    if (formData.client_id && isOpen) {
      fetchAvailableManagers(formData.client_id);
    }
  }, [formData.client_id, isOpen, fetchAvailableManagers]);

  useEffect(() => {
    const projectId = project?.project_id;

    if (isOpen && isEditMode && projectId) {
      fetchProjectManagers(projectId);
    }
  }, [isOpen, isEditMode, project?.project_id, fetchProjectManagers]);

  const handleAddPM = async (userId) => {
    if (!project?.project_id) return;

    try {
      await addProjectManager({
        projectId: project.project_id,
        userId
      }).unwrap();

      fetchProjectManagers(project.project_id);
    } catch (error) {
      logger.error('Errore aggiunta PM:', error);
    }
  };

  const handleRemovePM = async (userId) => {
    if (!project?.project_id) return;

    try {
      await removeProjectManager({
        projectId: project.project_id,
        userId
      }).unwrap();

      fetchProjectManagers(project.project_id);
    } catch (error) {
      logger.error('Errore rimozione PM:', error);
    }
  };

  const handleConfirmClick = async () => {
    await handleSubmit();
  };

  const activeClients = clients.filter(c => c.status_id === 'ACTIVE');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirmClick}
      entityName={t('projects:entity')}
      icon={<FolderKanban className="text-cyan-600" size={24} />}
      isEditMode={isEditMode}
      error={errors.general}
      isSubmitting={isSubmitting}
      confirmButtonColor="cyan"
      size="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('projects:clientLabel')}
          </label>
          <select
            value={formData.client_id}
            onChange={(e) => handleChange('client_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isEditMode}
          >
            <option value="">{t('projects:selectClient')}</option>
            {activeClients.map((client) => (
              <option key={client.client_id} value={client.client_id}>
                {client.client_name} ({client.client_key})
              </option>
            ))}
          </select>
          {isEditMode && (
            <p className="text-xs text-gray-500 mt-1">
              {t('projects:clientReadonly')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('projects:projectCodeLabel')}
          </label>
          <input
            type="text"
            value={formData.project_key}
            onChange={(e) => handleChange('project_key', e.target.value.toUpperCase())}
            placeholder={t('projects:projectCodePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isEditMode}
          />
          {isEditMode && (
            <p className="text-xs text-gray-500 mt-1">
              {t('projects:projectCodeReadonly')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('projects:projectTitleLabel')}
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder={t('projects:projectTitlePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('projects:statusLabel')}
          </label>
          <select
            value={formData.status_id}
            onChange={(e) => handleChange('status_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {isEditMode ? (
        <div className="mb-4">
          <UserAssignmentPanel
            assignedUsers={currentProjectManagers}
            availableUsers={availableManagers}
            onAddUser={handleAddPM}
            onRemoveUser={handleRemovePM}
            isLoadingAvailable={!formData.client_id}
            isLoadingAssigned={false}
            isAdding={isAddingPM}
            isRemoving={isRemovingPM}
            title={t('projects:projectManager')}
            icon={<Users size={16} className="text-cyan-600" />}
            searchPlaceholder={t('projects:searchPm')}
            showRoleInAvailable={true}
            emptyAssignedMessage={t('projects:noPmAssigned')}
            emptyAvailableMessage={
              !formData.client_id
                ? t('projects:selectClientForPm')
                : t('projects:noPmAvailable')
            }
          />
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users size={16} className="inline mr-1" />
            {t('projects:projectManager')}
          </label>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {t('projects:pmAssignAfterCreate')}
            </p>
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default ProjectModal;
