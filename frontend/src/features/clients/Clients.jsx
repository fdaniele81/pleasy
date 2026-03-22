import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "./api/clientEndpoints";
import { Trash2, Edit2, Plus, Settings, Users } from "lucide-react";
import ClientModal from "./components/ClientModal";
import ClientPhasesConfigModal from "./components/ClientPhasesConfigModal";
import SearchFilter from "../../shared/components/SearchFilter";
import { getStatusBadgeColor } from '../../utils/ui/statusUtils';
import PageHeader from '../../shared/ui/PageHeader';
import EmptyState from '../../shared/ui/EmptyState';
import Button from '../../shared/ui/Button';
import { useFilteredList } from '../../hooks/useFilteredList';
import logger from '../../utils/logger';

const getDefaultInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

function ClientsSimple() {
  const { t } = useTranslation(['clients', 'common']);
  const { data: clients = [], isLoading: loading } = useGetClientsQuery();
  const [createClient] = useCreateClientMutation();
  const [updateClient] = useUpdateClientMutation();
  const [deleteClient] = useDeleteClientMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPhasesConfigModalOpen, setIsPhasesConfigModalOpen] = useState(false);
  const [configuringClient, setConfiguringClient] = useState(null);

  const filteredClients = useFilteredList(
    clients,
    searchTerm,
    ['client_key', 'client_name', 'status_id']
  );

  const handleCreateClient = async (clientData) => {
    try {
      await createClient(clientData).unwrap();
    } catch (error) {
      logger.error('Create client failed:', error);
    }
  };

  const handleUpdateClient = async (clientData) => {
    if (editingClient) {
      try {
        await updateClient({
          id: editingClient.client_id,
          data: clientData,
        }).unwrap();
        setEditingClient(null);
      } catch (error) {
        logger.error('Update client failed:', error);
      }
    }
  };

  const handleDeleteClient = async (id) => {
    try {
      await deleteClient(id).unwrap();
    } catch (error) {
      logger.error('Delete client failed:', error);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleConfigurePhases = (client) => {
    setConfiguringClient(client);
    setIsPhasesConfigModalOpen(true);
  };

  const handleClosePhasesConfigModal = () => {
    setIsPhasesConfigModalOpen(false);
    setConfiguringClient(null);
  };

  if (loading && clients.length === 0) {
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
      <ClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={editingClient ? handleUpdateClient : handleCreateClient}
        client={editingClient}
      />

      <ClientPhasesConfigModal
        isOpen={isPhasesConfigModalOpen}
        onClose={handleClosePhasesConfigModal}
        client={configuringClient}
      />

      <div className="p-4">
        <div className="max-w-full mx-auto">
          <div className="mt-16"></div>

          <PageHeader
            icon={Users}
            title={t('clients:title')}
            description={t('clients:description')}
            actionButton={{
              label: t('clients:newClient'),
              onClick: () => setIsModalOpen(true),
              icon: Plus
            }}
          />

          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={t('clients:searchPlaceholder')}
          />

          {filteredClients.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full" aria-label="Lista clienti">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('clients:name')}
                        </th>
                        <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('clients:key')}
                        </th>
                        <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common:status')}
                        </th>
                        <th scope="col" className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common:actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredClients.map((client) => (
                        <tr key={client.client_id} className="hover:bg-gray-50">
                          <td className="px-6 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold tracking-tight shrink-0 select-none"
                                style={{
                                  backgroundColor: client.symbol_bg_color || client.color || '#6B7280',
                                  color: client.symbol_letter_color || '#FFFFFF',
                                }}
                              >
                                {client.symbol_letter || getDefaultInitials(client.client_name)}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {client.client_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700">
                            {client.client_key}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(client.status_id)}`}>
                              {client.status_id}
                            </span>
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleConfigurePhases(client)}
                                variant="ghost"
                                color="purple"
                                size="sm"
                                icon={Settings}
                                iconSize={18}
                                title={t('clients:configurePhases')}
                              />
                              <Button
                                onClick={() => handleEdit(client)}
                                variant="ghost"
                                color="blue"
                                size="sm"
                                icon={Edit2}
                                iconSize={18}
                                title={t('common:edit')}
                              />
                              <Button
                                confirmAction
                                onConfirm={() => handleDeleteClient(client.client_id)}
                                itemName={client.client_name}
                                size="md"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile card list */}
              <div className="lg:hidden space-y-3">
                {filteredClients.map((client) => (
                  <div key={client.client_id} className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold tracking-tight shrink-0 select-none"
                          style={{
                            backgroundColor: client.symbol_bg_color || client.color || '#6B7280',
                            color: client.symbol_letter_color || '#FFFFFF',
                          }}
                        >
                          {client.symbol_letter || getDefaultInitials(client.client_name)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{client.client_name}</p>
                          <p className="text-xs text-gray-500">{client.client_key}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full max-[500px]:hidden ${getStatusBadgeColor(client.status_id)}`}>
                          {client.status_id}
                        </span>
                        <Button
                          onClick={() => handleConfigurePhases(client)}
                          variant="ghost"
                          color="purple"
                          size="sm"
                          icon={Settings}
                          iconSize={18}
                          title={t('clients:configurePhases')}
                        />
                        <Button
                          onClick={() => handleEdit(client)}
                          variant="ghost"
                          color="blue"
                          size="sm"
                          icon={Edit2}
                          iconSize={18}
                          title={t('common:edit')}
                        />
                        <Button
                          confirmAction
                          onConfirm={() => handleDeleteClient(client.client_id)}
                          itemName={client.client_name}
                          size="md"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {filteredClients.length === 0 && (
            <EmptyState
              icon={Users}
              title={searchTerm.trim() ? t('common:noResults') : t('clients:noClients')}
              message={
                searchTerm.trim()
                  ? `${t('clients:noClientsForSearch')} "${searchTerm}"`
                  : t('clients:emptyMessage')
              }
              action={!searchTerm.trim() ? {
                label: t('clients:addClient'),
                onClick: () => setIsModalOpen(true),
                icon: Plus
              } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientsSimple;
