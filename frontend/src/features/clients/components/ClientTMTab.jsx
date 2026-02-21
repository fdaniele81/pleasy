import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Briefcase, Loader2, ClipboardCheck } from 'lucide-react';
import {
  useGetClientTMDetailsQuery,
  useAssignUserToClientMutation,
  useUnassignUserFromClientMutation,
  useAssignPMToClientMutation,
  useUnassignPMFromClientMutation,
  useUpdateTMReconciliationMutation
} from '../api/clientEndpoints';
import { useGetAvailableManagersQuery } from '../../projects/api/projectEndpoints';
import { useGetAvailableUsersQuery } from '../../planning/api/taskEndpoints';
import UserAssignmentPanel from '../../../shared/components/UserAssignmentPanel';

const ClientTMTab = forwardRef(({ client, onHasChanges }, ref) => {
  const { t } = useTranslation(['clients', 'common', 'errors']);

  const {
    data: tmDetails,
    isLoading: loadingTMDetails,
  } = useGetClientTMDetailsQuery(client?.client_id, {
    skip: !client?.client_id,
  });

  const projectId = tmDetails?.project_id;

  const { data: availableManagers = [], isLoading: loadingManagers } = useGetAvailableManagersQuery(
    client?.client_id,
    { skip: !client?.client_id }
  );

  const { data: availableUsersData, isLoading: loadingUsers } = useGetAvailableUsersQuery(
    projectId,
    { skip: !projectId }
  );

  const availableUsers = availableUsersData?.users || [];

  const [assignPMToClient] = useAssignPMToClientMutation();
  const [unassignPMFromClient] = useUnassignPMFromClientMutation();
  const [assignUserToClient] = useAssignUserToClientMutation();
  const [unassignUserFromClient] = useUnassignUserFromClientMutation();
  const [updateTMReconciliation] = useUpdateTMReconciliationMutation();

  const [localPMs, setLocalPMs] = useState([]);
  const [localUsers, setLocalUsers] = useState([]);
  const [localReconciliation, setLocalReconciliation] = useState(true);
  const [originalReconciliation, setOriginalReconciliation] = useState(true);

  const [pendingPMAdds, setPendingPMAdds] = useState([]);
  const [pendingPMRemoves, setPendingPMRemoves] = useState([]);
  const [pendingUserAdds, setPendingUserAdds] = useState([]);
  const [pendingUserRemoves, setPendingUserRemoves] = useState([]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tmDetails) {
      setLocalPMs(tmDetails.project_managers || []);
      setLocalUsers(tmDetails.tm_users || []);
      const reconValue = tmDetails.reconciliation_required ?? true;
      setLocalReconciliation(reconValue);
      setOriginalReconciliation(reconValue);
      setPendingPMAdds([]);
      setPendingPMRemoves([]);
      setPendingUserAdds([]);
      setPendingUserRemoves([]);
    }
  }, [tmDetails]);

  useEffect(() => {
    const hasChanges = pendingPMAdds.length > 0 || pendingPMRemoves.length > 0 ||
                       pendingUserAdds.length > 0 || pendingUserRemoves.length > 0 ||
                       localReconciliation !== originalReconciliation;
    onHasChanges?.(hasChanges);
  }, [pendingPMAdds, pendingPMRemoves, pendingUserAdds, pendingUserRemoves, localReconciliation, originalReconciliation, onHasChanges]);

  useImperativeHandle(ref, () => ({
    async saveChanges() {
      if (!client?.client_id) return { success: false, error: 'No client ID' };

      setIsSaving(true);
      const errors = [];

      try {
        for (const userId of pendingPMAdds) {
          try {
            await assignPMToClient({ clientId: client.client_id, userId }).unwrap();
          } catch (err) {
            errors.push(`${t('errors:addPmError')}: ${err.data?.message || err.message}`);
          }
        }

        for (const userId of pendingPMRemoves) {
          try {
            await unassignPMFromClient({ clientId: client.client_id, userId }).unwrap();
          } catch (err) {
            errors.push(`${t('errors:removePmError')}: ${err.data?.message || err.message}`);
          }
        }

        for (const userId of pendingUserAdds) {
          try {
            await assignUserToClient({ clientId: client.client_id, userId }).unwrap();
          } catch (err) {
            errors.push(`${t('errors:addUserError')}: ${err.data?.message || err.message}`);
          }
        }

        for (const userId of pendingUserRemoves) {
          try {
            await unassignUserFromClient({ clientId: client.client_id, userId }).unwrap();
          } catch (err) {
            errors.push(`${t('errors:removeUserError')}: ${err.data?.message || err.message}`);
          }
        }

        if (localReconciliation !== originalReconciliation) {
          try {
            await updateTMReconciliation({
              clientId: client.client_id,
              reconciliationRequired: localReconciliation
            }).unwrap();
            setOriginalReconciliation(localReconciliation);
          } catch (err) {
            errors.push(`${t('errors:updateReconciliationError')}: ${err.data?.message || err.message}`);
          }
        }

        setPendingPMAdds([]);
        setPendingPMRemoves([]);
        setPendingUserAdds([]);
        setPendingUserRemoves([]);

        return {
          success: errors.length === 0,
          errors: errors.length > 0 ? errors : null
        };
      } finally {
        setIsSaving(false);
      }
    },

    hasChanges() {
      return pendingPMAdds.length > 0 || pendingPMRemoves.length > 0 ||
             pendingUserAdds.length > 0 || pendingUserRemoves.length > 0 ||
             localReconciliation !== originalReconciliation;
    }
  }));

  const handleAddPM = (userId) => {
    const userInfo = availableManagers.find(u => u.user_id === userId);
    if (!userInfo) return;

    if (pendingPMRemoves.includes(userId)) {
      setPendingPMRemoves(prev => prev.filter(id => id !== userId));
    } else {
      setPendingPMAdds(prev => [...prev, userId]);
    }

    setLocalPMs(prev => [...prev, userInfo]);
  };

  const handleRemovePM = (userId) => {
    if (pendingPMAdds.includes(userId)) {
      setPendingPMAdds(prev => prev.filter(id => id !== userId));
    } else {
      setPendingPMRemoves(prev => [...prev, userId]);
    }

    setLocalPMs(prev => prev.filter(pm => pm.user_id !== userId));
  };

  const handleAddUser = (userId) => {
    const userInfo = availableUsers.find(u => u.user_id === userId);
    if (!userInfo) return;

    if (pendingUserRemoves.includes(userId)) {
      setPendingUserRemoves(prev => prev.filter(id => id !== userId));
    } else {
      setPendingUserAdds(prev => [...prev, userId]);
    }

    setLocalUsers(prev => [...prev, userInfo]);
  };

  const handleRemoveUser = (userId) => {
    if (pendingUserAdds.includes(userId)) {
      setPendingUserAdds(prev => prev.filter(id => id !== userId));
    } else {
      setPendingUserRemoves(prev => [...prev, userId]);
    }

    setLocalUsers(prev => prev.filter(u => u.user_id !== userId));
  };

  if (loadingTMDetails) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-cyan-600" />
      </div>
    );
  }

  const hasUnsavedChanges = pendingPMAdds.length > 0 || pendingPMRemoves.length > 0 ||
                            pendingUserAdds.length > 0 || pendingUserRemoves.length > 0;

  return (
    <div className="space-y-6">
      {isSaving && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-sm text-cyan-700 flex items-center gap-2">
          <Loader2 className="animate-spin h-4 w-4" />
          {t('common:saving')}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="text-cyan-600" size={20} />
            <div>
              <span className="text-sm font-semibold text-gray-700">{t('clients:reconciliationRequired')}</span>
              <p className="text-xs text-gray-500">{t('clients:reconciliationDescription')}</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={localReconciliation}
            onClick={() => setLocalReconciliation(prev => !prev)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
              localReconciliation ? 'bg-cyan-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localReconciliation ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <UserAssignmentPanel
        assignedUsers={localPMs}
        availableUsers={availableManagers}
        onAddUser={handleAddPM}
        onRemoveUser={handleRemovePM}
        isLoadingAvailable={loadingManagers}
        isLoadingAssigned={false}
        isAdding={false}
        isRemoving={false}
        title={t('clients:tmProjectManagers')}
        icon={<Briefcase className="text-cyan-600" size={20} />}
        searchPlaceholder={t('clients:searchPm')}
        showRoleInAvailable={false}
        emptyAssignedMessage={t('clients:noPmAssigned')}
        emptyAvailableMessage={t('clients:noPmAvailable')}
      />

      <UserAssignmentPanel
        assignedUsers={localUsers}
        availableUsers={availableUsers}
        onAddUser={handleAddUser}
        onRemoveUser={handleRemoveUser}
        isLoadingAvailable={loadingUsers}
        isLoadingAssigned={false}
        isAdding={false}
        isRemoving={false}
        title={t('clients:tmUsers')}
        icon={<Users className="text-cyan-600" size={20} />}
        searchPlaceholder={t('common:searchUser')}
        showRoleInAvailable={false}
        emptyAssignedMessage={t('common:noUserAssigned')}
        emptyAvailableMessage={t('common:noUserAvailable')}
      />
    </div>
  );
});

ClientTMTab.displayName = 'ClientTMTab';

export default ClientTMTab;
