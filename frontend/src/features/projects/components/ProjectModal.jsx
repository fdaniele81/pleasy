import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderKanban, Users, Lock, LockOpen, Check, Loader2 } from 'lucide-react';
import {
  useLazyGetAvailableManagersQuery,
  useLazyGetProjectManagersQuery,
  useAddProjectManagerMutation,
  useRemoveProjectManagerMutation,
  useLazyGenerateProjectKeyQuery,
  useLazyValidateProjectKeyQuery
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
  const [generateProjectKey, { isFetching: isGeneratingKey }] = useLazyGenerateProjectKeyQuery();
  const [validateProjectKey, { isFetching: isValidatingKey }] = useLazyValidateProjectKeyQuery();
  const [keyLocked, setKeyLocked] = useState(true);
  const [keyValidated, setKeyValidated] = useState(false);
  const keyValidatedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setKeyLocked(true);
      setKeyValidated(false);
    }
  }, [isOpen]);

  const handleValidateKey = async () => {
    if (!formData.project_key?.trim()) return;

    try {
      const result = await validateProjectKey({
        projectKey: formData.project_key.trim().toUpperCase(),
      }).unwrap();

      handleChange('project_key', result.project_key);
      keyValidatedRef.current = true;
      setKeyValidated(true);
      setKeyLocked(true);
    } catch (error) {
      logger.error('Errore validazione codice progetto:', error);
    }
  };

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
      if (!data.client_id) {
        return t('projects:clientRequired');
      }
      if (!isRequired(data.project_key)) {
        return t('projects:projectCodeRequired');
      }
      if (!isRequired(data.title)) {
        return t('projects:projectTitleRequired');
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
    if (!keyLocked || !formData.title?.trim() || !isOpen || isEditMode) {
      if (!isEditMode && isOpen && keyLocked && !formData.title?.trim()) handleChange('project_key', '');
      return;
    }

    if (keyValidatedRef.current) {
      keyValidatedRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      generateProjectKey({ title: formData.title.trim() })
        .unwrap()
        .then((projectKey) => {
          handleChange('project_key', projectKey);
        })
        .catch((error) => {
          logger.error('Errore generazione codice progetto:', error);
          handleChange('project_key', '');
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.title, isOpen, isEditMode, keyLocked]);

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('projects:projectCodeLabel')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={isGeneratingKey ? '' : formData.project_key}
              onChange={(e) => handleChange('project_key', e.target.value.toUpperCase())}
              readOnly={isEditMode || keyLocked}
              placeholder={isGeneratingKey ? t('projects:generatingKey') : t('projects:projectCodePlaceholder')}
              className={`w-full px-3 py-2 ${!isEditMode && !keyLocked ? 'pr-20' : 'pr-10'} border border-gray-300 rounded-lg ${
                isEditMode || keyLocked
                  ? 'bg-gray-50 text-gray-700'
                  : 'bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
              }`}
            />
            {!isEditMode && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {!keyLocked && (
                  <button
                    type="button"
                    onClick={handleValidateKey}
                    disabled={isValidatingKey || !formData.project_key?.trim()}
                    className="text-gray-400 hover:text-green-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={t('projects:validateCode')}
                  >
                    {isValidatingKey ? (
                      <Loader2 size={16} className="animate-spin text-cyan-500" />
                    ) : (
                      <Check size={16} />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const newLocked = !keyLocked;
                    setKeyLocked(newLocked);
                    setKeyValidated(false);
                    if (newLocked) {
                      handleChange('project_key', '');
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title={keyLocked ? t('projects:unlockCode') : t('projects:lockCode')}
                >
                  {isGeneratingKey ? (
                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  ) : keyLocked ? (
                    <Lock size={16} />
                  ) : (
                    <LockOpen size={16} />
                  )}
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isEditMode
              ? t('projects:projectCodeReadonly')
              : keyValidated
                ? t('projects:projectCodeValidated')
                : keyLocked
                  ? t('projects:projectCodeAutoGenerated')
                  : t('projects:projectCodeCustom')}
          </p>
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
