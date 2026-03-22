import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, Users } from 'lucide-react';
import BaseModal from '../BaseModal';
import Button from '../../ui/Button';

function StagingPreviewModal({ isOpen, onClose, stagingData, usersData, loadingStaging, loadingUsers, onLoadUsers }) {
  const { t } = useTranslation(['templateconfig', 'common']);
  const [activeTab, setActiveTab] = useState('staging');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('staging');
    }
  }, [isOpen]);

  const currentData = activeTab === 'staging' ? stagingData : usersData;
  const isLoading = activeTab === 'staging' ? loadingStaging : loadingUsers;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'users' && !usersData && onLoadUsers) {
      onLoadUsers();
    }
  };

  const customFooter = (
    <Button
      onClick={onClose}
      color="cyan"
      size="md"
    >
      {t('common:close')}
    </Button>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('templateconfig:modalTitle')}
      icon={<Database className="text-cyan-600" size={24} />}
      size="2xl"
      customFooter={customFooter}
      showFooter={true}
    >
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 -mt-2">
        {[
          { key: 'staging', label: t('templateconfig:stagingTab'), icon: Database },
          { key: 'users', label: t('templateconfig:usersTab'), icon: Users },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 ${
              activeTab === tab.key
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
            {tab.label}
          </button>
        ))}
      </div>

      {currentData && (
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <div className="text-xs font-semibold text-blue-900 mb-1">{t('templateconfig:queryExecuted')}</div>
          <div className="text-xs font-mono text-blue-700 bg-white p-2 rounded border border-blue-200 overflow-x-auto">
            {activeTab === 'staging'
              ? `SELECT * FROM ${currentData.tableName || 'staging'} LIMIT 100`
              : `SELECT user_id, email, full_name, role_id, company_id FROM ${currentData.info || 'pm_users_view'} LIMIT 100`
            }
          </div>
        </div>
      )}

      <div className="-mx-1 flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 sm:h-64">
            <div className="text-gray-500">{t('common:loading')}</div>
          </div>
        ) : currentData && currentData.rows && currentData.rows.length > 0 ? (
          <div className="bg-white rounded border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="overflow-auto flex-1 min-h-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    {currentData.columns.map((col, idx) => (
                      <th
                        key={idx}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-gray-50">
                      {currentData.columns.map((col, colIdx) => (
                        <td
                          key={colIdx}
                          className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 whitespace-nowrap"
                        >
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 border-t border-gray-200 shrink-0">
              <p className="text-[10px] sm:text-xs text-gray-600">
                {t('templateconfig:totalRowsDisplayed', { count: currentData.rows.length })}
                {currentData.totalRows && currentData.totalRows > currentData.rows.length && (
                  <span className="ml-1 sm:ml-2 text-yellow-600">
                    {t('templateconfig:showingFirstOfTotal', { shown: currentData.rows.length, total: currentData.totalRows })}
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 sm:h-64">
            <div className="text-center text-gray-500">
              <Database className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 text-gray-400" />
              <p className="text-sm sm:text-base">{t('templateconfig:noDataAvailable')}</p>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

export default StagingPreviewModal;
