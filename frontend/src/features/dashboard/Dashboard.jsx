import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { useDashboard } from './hooks/useDashboard';
import PageHeader from '../../shared/ui/PageHeader';

import EstimatesByClientCard from './components/EstimatesByClientCard';
import ProjectsPivotCard from './components/ProjectsPivotCard';
import TMActivitiesCard from './components/TMActivitiesCard';

function Dashboard() {
  const { t } = useTranslation(['dashboard', 'common']);
  const {
    loading,
    isLoading,

    estimatesByClient,
    projectsBudgetByClient,

    handleRefresh,
  } = useDashboard();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={t('dashboard:title')}
        icon={LayoutDashboard}
        actionButton={{
          label: isLoading ? t('common:loading') : t('dashboard:refresh'),
          onClick: handleRefresh,
          icon: RefreshCw,
          disabled: isLoading,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 gap-6">

          <div>
            <ProjectsPivotCard />
          </div>



          <div>
            <EstimatesByClientCard
              data={estimatesByClient}
              loading={loading.estimates}
            />
          </div>

          <div>
            <TMActivitiesCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
