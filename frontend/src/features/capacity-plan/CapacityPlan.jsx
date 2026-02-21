import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layers, Eye } from 'lucide-react';
import { useGetEstimatesQuery } from '../estimator/api/estimateEndpoints';
import { useGetClientsQuery } from '../clients/api/clientEndpoints';
import SearchFilter from '../../shared/components/SearchFilter';
import PageHeader from '../../shared/ui/PageHeader';
import EmptyState from '../../shared/ui/EmptyState';
import Button from '../../shared/ui/Button';
import { useFilteredList } from '../../hooks/useFilteredList';
import EstimateSelectionTable from './components/EstimateSelectionTable';

function CapacityPlan() {
  const { t } = useTranslation(['capacityPlan', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: estimates = [], isLoading: loading } = useGetEstimatesQuery();
  const { data: clients = [] } = useGetClientsQuery();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

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

  const handleToggleSelect = (estimateId) => {
    setSelectedIds((prev) =>
      prev.includes(estimateId)
        ? prev.filter((id) => id !== estimateId)
        : [...prev, estimateId]
    );
  };

  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      setSelectedIds(filteredEstimates.map((e) => e.estimate_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleViewCapacityPlan = () => {
    if (selectedIds.length < 1) return;

    navigate('/capacity-plan/view', {
      state: { selectedIds },
    });
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
            icon={Layers}
            title={t('capacityPlan:title')}
            description={t('capacityPlan:description')}
          />

          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={t('capacityPlan:searchPlaceholder')}
          />

          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="client-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('common:client')}
              </label>
              <select
                id="client-filter"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">{t('capacityPlan:allClients')}</option>
                {clients.map((client) => (
                  <option key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('common:status')}
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">{t('capacityPlan:allStatuses')}</option>
                <option value="DRAFT">DRAFT</option>
                <option value="CONVERTED">CONVERTED</option>
              </select>
            </div>
          </div>

          {/* Barra selezione e azione */}
          <div className="mb-4 flex items-center justify-between bg-white rounded-lg shadow-sm px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedIds.length === 0 ? (
                  t('capacityPlan:selectAtLeast')
                ) : (
                  <>
                    <span className="font-semibold text-cyan-600">
                      {selectedIds.length}
                    </span>{' '}
                    {selectedIds.length === 1 ? t('capacityPlan:estimateSelected') : t('capacityPlan:estimatesSelected')}
                  </>
                )}
              </span>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  {t('capacityPlan:deselectAll')}
                </button>
              )}
            </div>
            <Button
              onClick={handleViewCapacityPlan}
              disabled={selectedIds.length < 1}
              color="cyan"
              icon={Eye}
              iconSize={18}
            >
              {t('capacityPlan:viewCapacityPlan')}
            </Button>
          </div>

          {filteredEstimates.length > 0 && (
            <EstimateSelectionTable
              estimates={filteredEstimates}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
            />
          )}

          {filteredEstimates.length === 0 && (
            <EmptyState
              icon={Layers}
              title={searchTerm.trim() ? t('common:noResults') : t('capacityPlan:noEstimates')}
              message={
                searchTerm.trim()
                  ? t('capacityPlan:noEstimatesForSearch', { search: searchTerm })
                  : t('capacityPlan:emptyMessage')
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default CapacityPlan;
