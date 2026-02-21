import React, { memo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calculator, FileText } from 'lucide-react';
import DashboardCard from './DashboardCard';

const EstimatesByClientBarChart = lazy(() => import('./charts/EstimatesByClientBarChart'));
import { SkeletonLine, SkeletonBlock } from '../../../shared/components/skeletons';

const EstimatesSkeleton = memo(function EstimatesSkeleton() {
  return (
    <div className="animate-pulse">
      <SkeletonLine width="280px" height="0.875rem" className="mb-4" />
      <SkeletonBlock height="200px" className="rounded-lg" />
    </div>
  );
});

const EstimatesByClientCard = ({ data, loading }) => {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();

  const handleBarClick = (data) => {
    if (data && data.client_id) {
      navigate(`/estimator?client_id=${data.client_id}`);
    }
  };

  const handleActionClick = () => {
    navigate('/stime');
  };

  return (
    <DashboardCard
      title={t('dashboard:estimatesByClient')}
      icon={Calculator}
      loading={loading}
      skeleton={<EstimatesSkeleton />}
    >
      {data && data.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-gray-600">
            {t('dashboard:top10Clients')}
          </div>
          <Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg animate-pulse" />}>
            <EstimatesByClientBarChart data={data} onBarClick={handleBarClick} />
          </Suspense>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-400">
          {t('dashboard:noEstimatesAvailable')}
        </div>
      )}
    </DashboardCard>
  );
};

export default EstimatesByClientCard;
