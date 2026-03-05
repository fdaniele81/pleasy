import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Users, Lock, LockOpen, Check, Loader2 } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';
import UserAssignmentPanel from '../../../shared/components/UserAssignmentPanel';
import { useLazyGetAvailableManagersQuery, useLazyGenerateProjectKeyQuery, useLazyValidateProjectKeyQuery } from '../../projects/api/projectEndpoints';
import logger from '../../../utils/logger';

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
  const [generateProjectKey, { isFetching: isGeneratingKey }] = useLazyGenerateProjectKeyQuery();
  const [validateProjectKey, { isFetching: isValidatingKey }] = useLazyValidateProjectKeyQuery();
  const [keyLocked, setKeyLocked] = useState(true);
  const [keyValidated, setKeyValidated] = useState(false);
  const keyValidatedRef = useRef(false);

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
      setKeyLocked(true);
      setKeyValidated(false);
      if (projectKey) {
        keyValidatedRef.current = true;
      }
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

  const handleValidateKey = async () => {
    if (!localProjectKey?.trim()) return;
    try {
      const result = await validateProjectKey({
        projectKey: localProjectKey.trim().toUpperCase(),
      }).unwrap();
      setLocalProjectKey(result.project_key);
      keyValidatedRef.current = true;
      setKeyValidated(true);
      setKeyLocked(true);
    } catch (error) {
      logger.error('Errore validazione codice progetto:', error);
    }
  };

  useEffect(() => {
    if (!isOpen || isReadOnly || !keyLocked || !localFormData.title?.trim()) {
      return;
    }
    if (keyValidatedRef.current) {
      keyValidatedRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      generateProjectKey({ title: localFormData.title.trim() })
        .unwrap()
        .then((key) => setLocalProjectKey(key))
        .catch(() => setLocalProjectKey(''));
    }, 500);
    return () => clearTimeout(timer);
  }, [localFormData.title, keyLocked, isOpen, isReadOnly]);

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
          {isReadOnly ? (
            <input
              type="text"
              value={localProjectKey}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed uppercase"
            />
          ) : (
            <>
              <div className="relative">
                <input
                  type="text"
                  value={isGeneratingKey ? '' : localProjectKey}
                  onChange={(e) => setLocalProjectKey(e.target.value.toUpperCase())}
                  readOnly={keyLocked}
                  className={`w-full px-3 py-2 ${!keyLocked ? 'pr-20' : 'pr-10'} border border-gray-300 rounded-lg uppercase ${
                    keyLocked
                      ? 'bg-gray-50 text-gray-700'
                      : 'bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500'
                  }`}
                  placeholder={isGeneratingKey ? t('estimator:generatingKey') : t('estimator:projectCodePlaceholder')}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {!keyLocked && (
                    <button
                      type="button"
                      onClick={handleValidateKey}
                      disabled={isValidatingKey || !localProjectKey?.trim()}
                      className="text-gray-400 hover:text-green-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t('estimator:validateCode')}
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
                        generateProjectKey({ title: localFormData.title.trim() || '' })
                          .unwrap()
                          .then((key) => setLocalProjectKey(key))
                          .catch(() => setLocalProjectKey(''));
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title={keyLocked ? t('estimator:unlockCode') : t('estimator:lockCode')}
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
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {keyValidated
                  ? t('estimator:projectCodeValidated')
                  : keyLocked
                    ? t('estimator:projectCodeAutoGenerated')
                    : t('estimator:projectCodeCustom')}
              </p>
            </>
          )}
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
