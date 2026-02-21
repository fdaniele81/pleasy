import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Calculator, ArrowLeft, ChevronRight, Users } from 'lucide-react';
import { useGetClientsQuery } from '../clients/api/clientEndpoints';
import { useGetAvailableManagersQuery } from '../projects/api/projectEndpoints';
import {
  useGetEstimateQuery,
  useCreateEstimateMutation,
  useUpdateEstimateMutation
} from './api/estimateEndpoints';
import {
  useLazyGetDraftsByEstimateQuery,
  useCreateOrUpdateDraftMutation
} from './api/projectDraftEndpoints';
import Button from '../../shared/ui/Button';
import UserAssignmentPanel from '../../shared/components/UserAssignmentPanel';

function EstimateEditorInfo() {
  const { t } = useTranslation(['estimator', 'common']);
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const isNew = estimateId === 'new';

  const { data: clients = [], isLoading: clientsLoading } = useGetClientsQuery();
  const { data: currentEstimate, isLoading: estimateLoading } = useGetEstimateQuery(
    estimateId,
    { skip: isNew }
  );
  const [createEstimate] = useCreateEstimateMutation();
  const [updateEstimate] = useUpdateEstimateMutation();
  const [getDraftsByEstimate] = useLazyGetDraftsByEstimateQuery();
  const [createOrUpdateDraft] = useCreateOrUpdateDraftMutation();

  const currentUser = useSelector(state => state.auth.user);

  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: ''
  });

  const { data: availableManagers = [], isFetching: managersLoading } = useGetAvailableManagersQuery(
    formData.client_id,
    { skip: !formData.client_id }
  );

  const activeClients = clients.filter(client => client.status_id === 'ACTIVE');

  const [projectKey, setProjectKey] = useState('');
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedEstimateId, setSavedEstimateId] = useState(null);
  const [assignedManagers, setAssignedManagers] = useState([]);
  const autoAssignedRef = useRef(false);

  const isReadOnly = currentEstimate?.status === 'CONVERTED';

  useEffect(() => {
    if (isNew && !autoAssignedRef.current && availableManagers.length > 0) {
      const currentUserObj = availableManagers.find(u => u.user_id === currentUser?.user_id);
      if (currentUserObj) {
        setAssignedManagers([currentUserObj]);
        autoAssignedRef.current = true;
      }
    }
  }, [isNew, availableManagers, currentUser?.user_id]);

  useEffect(() => {
    if (currentEstimate && !isNew) {
      setFormData({
        client_id: currentEstimate.client_id || '',
        title: currentEstimate.title || '',
        description: currentEstimate.description || ''
      });
      if (currentEstimate.estimate_id) {
        loadProjectKey();
      }

      setSavedEstimateId(currentEstimate.estimate_id);
    }
  }, [currentEstimate, isNew]);

  useEffect(() => {
    if (currentEstimate?.project_managers && availableManagers.length > 0) {
      const resolved = currentEstimate.project_managers
        .map(uid => availableManagers.find(u => u.user_id === uid))
        .filter(Boolean);
      setAssignedManagers(resolved);
    }
  }, [currentEstimate?.project_managers, availableManagers]);

  const loadProjectKey = async () => {
    try {
      const estId = savedEstimateId || estimateId;
      const draftResponse = await getDraftsByEstimate(estId).unwrap();
      if (draftResponse.drafts && draftResponse.drafts.length > 0) {
        const draft = draftResponse.drafts[0];
        setProjectKey(draft.project_key || '');
      }
    } catch (error) {
    }
  };

  const handleAddPM = (userId) => {
    const user = availableManagers.find(u => u.user_id === userId);
    if (user) {
      setAssignedManagers(prev => [...prev, user]);
    }
  };

  const handleRemovePM = (userId) => {
    if (isNew && userId === currentUser?.user_id) return;
    setAssignedManagers(prev => prev.filter(u => u.user_id !== userId));
  };

  const handleSaveBaseInfo = async () => {
    if (!formData.client_id || !formData.title.trim() || !projectKey.trim()) {
      setToast({ message: t('estimator:selectClientAndFill'), type: 'error' });
      return;
    }

    setIsSaving(true);

    const pmIds = assignedManagers.map(u => u.user_id);

    try {
      const existingEstimateId = !isNew ? estimateId : savedEstimateId;
      let finalEstimateId = existingEstimateId;

      if (!existingEstimateId) {
        const result = await createEstimate({
          client_id: formData.client_id,
          title: formData.title,
          description: formData.description,
          project_managers: pmIds
        }).unwrap();
        finalEstimateId = result.estimate_id;
        setSavedEstimateId(finalEstimateId);
      } else {
        await updateEstimate({
          id: existingEstimateId,
          data: {
            client_id: formData.client_id,
            title: formData.title,
            description: formData.description,
            project_managers: pmIds
          }
        }).unwrap();
        finalEstimateId = existingEstimateId;
      }

      const draftData = {
        estimate_id: finalEstimateId,
        project_key: projectKey,
        project_name: formData.title,
        client_id: formData.client_id,
        project_details: {
          project_managers: [currentUser.user_id],
          source: 'estimate_conversion'
        }
      };

      await createOrUpdateDraft(draftData).unwrap();

      navigate(`/estimator/${finalEstimateId}/tasks`);

    } catch (error) {
      const errorMessage = error?.message || error?.error || error || t('estimator:unknownError');
      setToast({ message: t('estimator:errorPrefix', { message: errorMessage }), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (estimateLoading && !currentEstimate) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6 pt-20">
          <div className="text-xl">{t('common:loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-cyan-600">
              {t('estimator:step1Label')}
            </span>
            <span className="text-sm font-medium text-gray-500">
              {t('estimator:step2Label')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-cyan-600 h-2 rounded-full transition-all" style={{
              width: '50%'
            }}></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">{t('estimator:baseInfo')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('estimator:clientLabel')}
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
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
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 uppercase ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder={t('estimator:projectCodePlaceholder')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('estimator:estimateTitleLabel')}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder={t('estimator:estimateTitlePlaceholder')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('estimator:descriptionLabel')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                rows="3"
                placeholder={t('estimator:descriptionPlaceholder')}
              />
            </div>

            {!isReadOnly && (
              <div className="md:col-span-2">
                <UserAssignmentPanel
                  assignedUsers={assignedManagers}
                  availableUsers={availableManagers}
                  onAddUser={handleAddPM}
                  onRemoveUser={handleRemovePM}
                  isLoadingAvailable={managersLoading}
                  title="Project Manager"
                  icon={<Users size={16} className="text-cyan-600" />}
                  searchPlaceholder={t('estimator:searchPM')}
                  showRoleInAvailable={true}
                  emptyAssignedMessage={t('estimator:noPMAssigned')}
                  emptyAvailableMessage={
                    !formData.client_id
                      ? t('estimator:selectClientForPM')
                      : t('estimator:noPMAvailable')
                  }
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={() => navigate('/estimator')}
              variant="outline"
              color="gray"
            >
              {isReadOnly ? t('estimator:back') : t('common:cancel')}
            </Button>
            {isReadOnly ? (
              <Button
                onClick={() => navigate(`/estimator/${estimateId}/tasks`)}
                color="cyan"
                size="lg"
                icon={ChevronRight}
                iconPosition="right"
              >
                {t('estimator:viewEstimateItems')}
              </Button>
            ) : (
              <Button
                onClick={handleSaveBaseInfo}
                loading={isSaving}
                color="cyan"
                size="md"
                icon={ChevronRight}
                iconPosition="right"
              >
                {isSaving ? t('common:saving') : t('estimator:next')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EstimateEditorInfo;
