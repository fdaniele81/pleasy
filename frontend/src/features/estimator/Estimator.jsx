import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useGetEstimatesQuery,
  useDeleteEstimateMutation,
  useCloneEstimateMutation
} from './api/estimateEndpoints';
import { useGetClientsQuery } from '../clients/api/clientEndpoints';
import { Calculator, Copy, Edit2, Eye } from 'lucide-react';
import BaseModal from '../../shared/components/BaseModal';
import SearchFilter from '../../shared/components/SearchFilter';
import PageHeader from '../../shared/ui/PageHeader';
import EmptyState from '../../shared/ui/EmptyState';
import Button from '../../shared/ui/Button';
import { useFilteredList } from '../../hooks/useFilteredList';

function Estimator() {
  const { t } = useTranslation(['estimator', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: estimates = [], isLoading: loading } = useGetEstimatesQuery();
  const { data: clients = [] } = useGetClientsQuery();
  const [deleteEstimate] = useDeleteEstimateMutation();
  const [cloneEstimate] = useCloneEstimateMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneTitle, setCloneTitle] = useState('');
  const [cloneProjectKey, setCloneProjectKey] = useState('');
  const [cloneEstimateId, setCloneEstimateId] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const clientIdFromUrl = searchParams.get('client_id');
    if (clientIdFromUrl) {
      setSelectedClientId(clientIdFromUrl);
    }
  }, [searchParams]);

  const filteredEstimates = useFilteredList(
    estimates,
    searchTerm,
    ['title', 'client_name', 'project_key']
  ).filter((estimate) => {
    if (selectedClientId && estimate.client_id !== selectedClientId) {
      return false;
    }
    if (selectedStatus && estimate.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const handleCreateEstimate = () => {
    navigate('/estimator/new/info');
  };

  const handleEditEstimate = (estimate) => {
    navigate(`/estimator/${estimate.estimate_id}/tasks`);
  };

  const handleViewEstimate = (estimate) => {
    navigate(`/estimator/${estimate.estimate_id}/tasks`);
  };

  const handleDeleteEstimate = async (estimate) => {
    try {
      await deleteEstimate(estimate.estimate_id).unwrap();
    } catch (error) {
    }
  };

  const handleOpenCloneModal = (estimate) => {
    setCloneEstimateId(estimate.estimate_id);
    setCloneTitle(`${estimate.title} ${t('estimator:copyLabel')}`);
    setCloneProjectKey(estimate.project_key ? `${estimate.project_key}_CLONE` : '');
    setCloneModalOpen(true);
  };

  const handleCloseCloneModal = () => {
    setCloneModalOpen(false);
    setCloneTitle('');
    setCloneProjectKey('');
    setCloneEstimateId(null);
  };

  const handleConfirmClone = async () => {
    if (!cloneTitle.trim()) return;
    setIsCloning(true);
    try {
      await cloneEstimate({
        estimateId: cloneEstimateId,
        title: cloneTitle.trim(),
        project_key: cloneProjectKey.trim() || null
      }).unwrap();
      handleCloseCloneModal();
    } catch (error) {
    } finally {
      setIsCloning(false);
    }
  };

  const getEstimateStatusBadge = (status) => {
    if (status === 'DRAFT') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (status === 'CONVERTED') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getEstimateStatusLabel = (status) => {
    if (status === 'DRAFT') return t('estimator:draft');
    if (status === 'CONVERTED') return t('estimator:converted');
    return status;
  };

  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '-';
    return `${parseFloat(hours).toFixed(1)}h`;
  };

  if (loading && estimates.length === 0) {
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
      <div className="p-4 xl:px-12">
        <div className="max-w-full mx-auto">
          <div className="mt-16"></div>

          <PageHeader
            icon={Calculator}
            title={t('estimator:title')}
            description={t('estimator:description')}
            actionButton={{
              label: t('estimator:newEstimate'),
              onClick: handleCreateEstimate
            }}
          />

          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={t('estimator:searchPlaceholder')}
          />

          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="client-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('common:client')}
              </label>
              <select
                id="client-filter"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">{t('estimator:allClients')}</option>
                {clients.map((client) => (
                  <option key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('common:status')}
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">{t('estimator:allStatuses')}</option>
                <option value="DRAFT">DRAFT</option>
                <option value="CONVERTED">CONVERTED</option>
              </select>
            </div>
          </div>

          {filteredEstimates.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('estimator:tableTitle')}
                      </th>
                      <th className="px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px] xl:w-[220px]">
                        {t('estimator:tableClient')}
                      </th>
                      <th className="hidden xl:table-cell px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                        {t('estimator:tableCode')}
                      </th>
                      <th className="hidden xl:table-cell px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[50px]">
                        {t('estimator:tableItems')}
                      </th>
                      <th className="px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[65px]">
                        {t('estimator:tableEstimate')}
                      </th>
                      <th className="px-3 xl:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">
                        {t('estimator:tableStatus')}
                      </th>
                      <th className="px-3 xl:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        {t('estimator:tableActions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEstimates.map((estimate) => (
                      <tr key={estimate.estimate_id} className="hover:bg-gray-50">
                        <td className="px-3 xl:px-4 py-2 overflow-hidden">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Calculator size={14} className="text-cyan-600 shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {estimate.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 xl:px-4 py-2 overflow-hidden">
                          <span className="text-sm text-gray-700 truncate block">
                            {estimate.client_name || '-'}
                          </span>
                        </td>
                        <td className="hidden xl:table-cell px-3 xl:px-4 py-2 overflow-hidden">
                          <span className="text-sm font-mono text-gray-900 truncate block">
                            {estimate.project_key || '-'}
                          </span>
                        </td>
                        <td className="hidden xl:table-cell px-3 xl:px-4 py-2 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {estimate.tasks_count || 0}
                          </span>
                        </td>
                        <td className="px-3 xl:px-4 py-2 whitespace-nowrap">
                          <span className="text-sm text-gray-700 font-medium">
                            {formatHours(estimate.total_hours_with_contingency)}
                          </span>
                        </td>
                        <td className="px-3 xl:px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getEstimateStatusBadge(estimate.status)}`}>
                            {getEstimateStatusLabel(estimate.status)}
                          </span>
                        </td>
                        <td className="px-3 xl:px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1">
                            {estimate.status === 'CONVERTED' ? (
                              <Button
                                onClick={() => handleViewEstimate(estimate)}
                                variant="ghost"
                                color="gray"
                                size="sm"
                                icon={Eye}
                                iconSize={16}
                                title={t('estimator:viewTitle')}
                              />
                            ) : (
                              <>
                                <Button
                                  onClick={() => handleEditEstimate(estimate)}
                                  variant="ghost"
                                  color="blue"
                                  size="sm"
                                  icon={Edit2}
                                  iconSize={16}
                                  title={t('estimator:editTitle')}
                                />
                                <Button
                                  onClick={() => handleOpenCloneModal(estimate)}
                                  variant="ghost"
                                  color="blue"
                                  size="sm"
                                  icon={Copy}
                                  iconSize={16}
                                  title={t('estimator:cloneTitle')}
                                />
                                <Button
                                  confirmAction
                                  onConfirm={() => handleDeleteEstimate(estimate)}
                                  itemName={estimate.title}
                                  size="md"
                                />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredEstimates.length === 0 && (
            <EmptyState
              icon={Calculator}
              title={searchTerm.trim() ? t('common:noResults') : t('estimator:noEstimates')}
              message={
                searchTerm.trim()
                  ? t('estimator:noEstimatesForSearch', { search: searchTerm })
                  : t('estimator:emptyMessage')
              }
              action={!searchTerm.trim() ? {
                label: t('estimator:addEstimate'),
                onClick: handleCreateEstimate
              } : undefined}
            />
          )}
        </div>
      </div>

      <BaseModal
        isOpen={cloneModalOpen}
        onClose={handleCloseCloneModal}
        onConfirm={handleConfirmClone}
        title={t('estimator:cloneEstimate')}
        icon={<Copy className="text-cyan-600" size={24} />}
        confirmText={t('estimator:cloneButton')}
        size="sm"
        confirmButtonColor="cyan"
        isSubmitting={isCloning}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="clone-title" className="block text-sm font-medium text-gray-700 mb-1">
              {t('estimator:cloneNewTitle')}
            </label>
            <input
              id="clone-title"
              type="text"
              value={cloneTitle}
              onChange={(e) => setCloneTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="clone-project-key" className="block text-sm font-medium text-gray-700 mb-1">
              {t('estimator:cloneCode')}
            </label>
            <input
              id="clone-project-key"
              type="text"
              value={cloneProjectKey}
              onChange={(e) => setCloneProjectKey(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
              placeholder={t('estimator:cloneCodePlaceholder')}
            />
          </div>
        </div>
      </BaseModal>
    </div>
  );
}

export default Estimator;
