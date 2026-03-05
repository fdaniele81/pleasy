import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, LockOpen, AlertTriangle, XCircle } from 'lucide-react';
import { useGetEstimatesQuery } from '../../estimator/api/estimateEndpoints';
import { useGetClientsQuery } from '../../clients/api/clientEndpoints';
import { useLazyCheckProjectKeyQuery } from '../../estimator/api/projectDraftEndpoints';
import { useLazyValidateProjectKeyQuery } from '../../projects/api/projectEndpoints';

function EstimateSelector({
  selectedEstimateId,
  onSelectEstimate,
  projectKey,
  onProjectKeyChange,
  keyLocked,
  onKeyLockedChange,
  onKeyBlocked,
  onExistingProjectChange,
}) {
  const { t } = useTranslation(['estimator', 'estimateConversion', 'common']);
  const { data: estimates = [] } = useGetEstimatesQuery();
  const { data: clients = [] } = useGetClientsQuery();
  const [checkProjectKey] = useLazyCheckProjectKeyQuery();
  const [validateProjectKey] = useLazyValidateProjectKeyQuery();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [existingProject, setExistingProject] = useState(null);
  const [suggestedKey, setSuggestedKey] = useState(null);

  // Debounced check for duplicate project key (runs even when locked)
  useEffect(() => {
    if (!projectKey?.trim()) {
      setExistingProject(null);
      setSuggestedKey(null);
      onKeyBlocked?.(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await checkProjectKey(projectKey.trim().toUpperCase()).unwrap();
        if (result.exists) {
          setExistingProject(result.project);
          if (result.project?.status_id === 'DELETED') {
            onKeyBlocked?.(true);
            // Fetch a suggested alternative key
            try {
              const validation = await validateProjectKey({ projectKey: projectKey.trim().toUpperCase() }).unwrap();
              setSuggestedKey(validation.project_key);
            } catch {
              setSuggestedKey(null);
            }
          } else {
            onKeyBlocked?.(false);
            setSuggestedKey(null);
          }
        } else {
          setExistingProject(null);
          setSuggestedKey(null);
          onKeyBlocked?.(false);
        }
      } catch {
        setExistingProject(null);
        setSuggestedKey(null);
        onKeyBlocked?.(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [projectKey, keyLocked, checkProjectKey, validateProjectKey, onKeyBlocked]);

  // Notify parent when existingProject changes (for duplicate key warning in modal)
  useEffect(() => {
    onExistingProjectChange?.(existingProject);
  }, [existingProject, onExistingProjectChange]);

  const handleToggleLock = () => {
    const newLocked = !keyLocked;
    onKeyLockedChange(newLocked);
  };

  const availableEstimates = estimates.filter(e =>
    e.status === 'DRAFT' && (!selectedClientId || e.client_id === selectedClientId)
  );

  const clientsWithEstimates = clients.filter(c =>
    estimates.some(e => e.status === 'DRAFT' && e.client_id === c.client_id)
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Client filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('estimator:tableClient')}
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              onSelectEstimate('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">{t('estimator:allClients')}</option>
            {clientsWithEstimates.map(client => (
              <option key={client.client_id} value={client.client_id}>
                {client.client_name}
              </option>
            ))}
          </select>
        </div>

        {/* Estimate selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('estimator:estimateLabel')}
          </label>
          <select
            value={selectedEstimateId || ''}
            onChange={(e) => onSelectEstimate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">{t('estimator:selectEstimate')}</option>
            {availableEstimates.map(estimate => (
              <option key={estimate.estimate_id} value={estimate.estimate_id}>
                {estimate.title}{!selectedClientId ? ` - ${estimate.client_name}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Project key — visible only after client + estimate are selected */}
        {selectedClientId && selectedEstimateId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('estimator:projectCodeLabel')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={projectKey}
                onChange={(e) => onProjectKeyChange(e.target.value.toUpperCase())}
                readOnly={keyLocked}
                className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg uppercase ${
                  keyLocked
                    ? 'bg-gray-50 text-gray-700'
                    : 'bg-white focus:ring-2 focus:ring-cyan-500'
                }`}
                placeholder={t('estimator:projectCodePlaceholder')}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleLock}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title={keyLocked ? t('estimator:unlockCode') : t('estimator:lockCode')}
                >
                  {keyLocked ? (
                    <Lock size={16} />
                  ) : (
                    <LockOpen size={16} />
                  )}
                </button>
              </div>
            </div>
            {existingProject && existingProject.status_id === 'DELETED' && (
              <div className="mt-1.5 text-xs text-red-700 bg-red-50 border border-red-300 rounded px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <XCircle size={14} className="shrink-0" />
                  <span>{t('estimateConversion:deletedKeyError', { projectKey: existingProject.project_key })}</span>
                </div>
                {suggestedKey && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span>{t('estimateConversion:suggestedKey', { suggestedKey })}</span>
                    <button
                      type="button"
                      onClick={() => {
                        onProjectKeyChange(suggestedKey);
                        setSuggestedKey(null);
                        setExistingProject(null);
                        onKeyBlocked?.(false);
                      }}
                      className="px-2 py-0.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
                    >
                      {t('estimateConversion:applySuggestedKey', { suggestedKey })}
                    </button>
                  </div>
                )}
              </div>
            )}
            {existingProject && existingProject.status_id !== 'DELETED' && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{t('estimateConversion:duplicateKeyWarning', { projectKey: existingProject.project_key })}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EstimateSelector;
