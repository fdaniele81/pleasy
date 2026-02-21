import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Users } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';
import UserAssignmentPanel from '../../../shared/components/UserAssignmentPanel';
import { useLazyGetAvailableManagersQuery } from '../../projects/api/projectEndpoints';

function EstimateInfoModal({
  isOpen,
  onClose,
  formData,
  projectKey,
  clients,
  isReadOnly,
  onSave,
  projectManagers = [],
  status
}) {
  const { t } = useTranslation(['estimator', 'common']);
  const [localFormData, setLocalFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    status: 'DRAFT'
  });
  const [localProjectKey, setLocalProjectKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [assignedManagers, setAssignedManagers] = useState([]);
  const [fetchAvailableManagers, { data: availableManagers = [] }] = useLazyGetAvailableManagersQuery();

  const activeClients = clients.filter(client => client.status_id === 'ACTIVE');

  useEffect(() => {
    if (isOpen) {
      setLocalFormData({
        client_id: formData.client_id || '',
        title: formData.title || '',
        description: formData.description || '',
        status: status || 'DRAFT'
      });
      setLocalProjectKey(projectKey || '');
    }
  }, [isOpen, formData, projectKey]);

  useEffect(() => {
    if (isOpen && localFormData.client_id) {
      fetchAvailableManagers(localFormData.client_id);
    }
  }, [isOpen, localFormData.client_id, fetchAvailableManagers]);

  useEffect(() => {
    if (isOpen && projectManagers.length > 0 && availableManagers.length > 0) {
      const resolved = projectManagers
        .map(uid => availableManagers.find(u => u.user_id === uid))
        .filter(Boolean);
      setAssignedManagers(resolved);
    } else if (isOpen && projectManagers.length === 0) {
      setAssignedManagers([]);
    }
  }, [isOpen, projectManagers, availableManagers]);

  const handleAddPM = (userId) => {
    const user = availableManagers.find(u => u.user_id === userId);
    if (user) {
      setAssignedManagers(prev => [...prev, user]);
    }
  };

  const handleRemovePM = (userId) => {
    setAssignedManagers(prev => prev.filter(u => u.user_id !== userId));
  };

  const handleSave = async () => {
    if (!localFormData.client_id || !localFormData.title.trim() || !localProjectKey.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const pmIds = assignedManagers.map(u => u.user_id);
      await onSave(localFormData, localProjectKey, pmIds);
      onClose();
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  const customFooter = (
    <>
      <Button
        onClick={onClose}
        variant="outline"
        color="gray"
      >
        {t('common:cancel')}
      </Button>
      <Button
        onClick={handleSave}
        loading={isSaving}
        color="cyan"
        disabled={!localFormData.client_id || !localFormData.title.trim() || !localProjectKey.trim()}
      >
        {isSaving ? t('common:saving') : t('common:save')}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('estimator:estimateInfoTitle')}
      icon={<FileText className="text-cyan-600" size={24} />}
      size="xl"
      customFooter={customFooter}
      confirmButtonColor="cyan"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('estimator:clientLabel')}
          </label>
          <select
            value={localFormData.client_id}
            onChange={(e) => setLocalFormData({ ...localFormData, client_id: e.target.value })}
            disabled={isReadOnly}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">{t('estimator:selectClient')}</option>
            {activeClients.map(client => (
              <option key={client.client_id} value={client.client_id}>
                {client.client_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('estimator:projectCodeLabel')}
          </label>
          <input
            type="text"
            value={localProjectKey}
            onChange={(e) => setLocalProjectKey(e.target.value.toUpperCase())}
            disabled={isReadOnly}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 uppercase ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder={t('estimator:projectCodePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('estimator:estimateTitleLabel')}
          </label>
          <input
            type="text"
            value={localFormData.title}
            onChange={(e) => setLocalFormData({ ...localFormData, title: e.target.value })}
            disabled={isReadOnly}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder={t('estimator:estimateTitlePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('estimator:descriptionLabel')}
          </label>
          <textarea
            value={localFormData.description}
            onChange={(e) => setLocalFormData({ ...localFormData, description: e.target.value })}
            disabled={isReadOnly}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            rows="2"
            placeholder={t('estimator:descriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('estimator:statusLabel')}
          </label>
          <select
            value={localFormData.status}
            onChange={(e) => setLocalFormData({ ...localFormData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
          >
            <option value="DRAFT">{t('estimator:draft')}</option>
            <option value="CONVERTED">{t('estimator:converted')}</option>
          </select>
        </div>

        {!isReadOnly && (
          <div className="md:col-span-2">
            <UserAssignmentPanel
              assignedUsers={assignedManagers}
              availableUsers={availableManagers}
              onAddUser={handleAddPM}
              onRemoveUser={handleRemovePM}
              isLoadingAvailable={!localFormData.client_id}
              title="Project Manager"
              icon={<Users size={16} className="text-cyan-600" />}
              searchPlaceholder={t('estimator:searchPM')}
              showRoleInAvailable={true}
              emptyAssignedMessage={t('estimator:noPMAssigned')}
              emptyAvailableMessage={
                !localFormData.client_id
                  ? t('estimator:selectClientForPM')
                  : t('estimator:noPMAvailable')
              }
            />
          </div>
        )}
      </div>
    </BaseModal>
  );
}

export default EstimateInfoModal;
