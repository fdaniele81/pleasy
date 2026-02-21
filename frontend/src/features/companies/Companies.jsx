import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useGetCompaniesWithUsersQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation
} from './api/companyEndpoints';
import { Building2, Trash2, Edit2, Plus, Building } from 'lucide-react';
import CompanyModal from './components/CompanyModal';
import SearchFilter from '../../shared/components/SearchFilter';
import { getStatusBadgeColor } from '../../utils/ui/statusUtils';
import PageHeader from '../../shared/ui/PageHeader';
import EmptyState from '../../shared/ui/EmptyState';
import Button from '../../shared/ui/Button';
import { useFilteredList } from '../../hooks/useFilteredList';

function Companies() {
  const { t } = useTranslation(['companies', 'common']);
  const { data: companies = [], isLoading: loading } = useGetCompaniesWithUsersQuery();
  const [createCompany] = useCreateCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();
  const [deleteCompany] = useDeleteCompanyMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCompanies = useFilteredList(
    companies,
    searchTerm,
    ['company_key', 'legal_name', 'vat_number', 'status_id']
  );

  const handleCreateCompany = async (companyData) => {
    try {
      await createCompany(companyData).unwrap();
    } catch (error) {
    }
  };

  const handleUpdateCompany = async (companyData) => {
    if (editingCompany) {
      try {
        await updateCompany({
          id: editingCompany.company_id,
          data: companyData
        }).unwrap();
        setEditingCompany(null);
      } catch (error) {
      }
    }
  };

  const handleDeleteCompany = async (companyId) => {
    try {
      await deleteCompany(companyId).unwrap();
    } catch (error) {
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  if (loading && companies.length === 0) {
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
      <CompanyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={editingCompany ? handleUpdateCompany : handleCreateCompany}
        company={editingCompany}
      />

      <div className="p-4">
        <div className="max-w-full mx-auto">
          <div className="mt-16"></div>

          <PageHeader
            icon={Building2}
            title={t('companies:title')}
            description={t('companies:description')}
            actionButton={{
              label: t('companies:newCompany'),
              onClick: () => setIsModalOpen(true)
            }}
          />

          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={t('companies:searchPlaceholder')}
          />

          {filteredCompanies.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('companies:code')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('companies:businessName')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('companies:vatNumber')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common:status')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common:actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompanies.map((company) => (
                      <tr key={company.company_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building size={16} className="text-cyan-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {company.company_key}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {company.legal_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {company.vat_number}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(company.status_id)}`}>
                            {company.status_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => handleEdit(company)}
                              variant="ghost"
                              color="blue"
                              size="sm"
                              icon={Edit2}
                              iconSize={18}
                              title={t('common:edit')}
                            />
                            <Button
                              confirmAction
                              onConfirm={() => handleDeleteCompany(company.company_id)}
                              itemName={company.legal_name}
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
          )}

          {filteredCompanies.length === 0 && (
            <EmptyState
              icon={Building2}
              title={searchTerm.trim() ? t('common:noResults') : t('companies:noCompanies')}
              message={
                searchTerm.trim()
                  ? `${t('companies:noCompaniesForSearch')} "${searchTerm}"`
                  : t('companies:emptyMessage')
              }
              action={!searchTerm.trim() ? {
                label: t('companies:addCompany'),
                onClick: () => setIsModalOpen(true)
              } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Companies;
