import React, { memo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { useTMActivities } from '../hooks/useTMActivities';

const TMActivitiesBarChart = lazy(() => import('./charts/TMActivitiesBarChart'));
import { SkeletonLine, SkeletonBlock } from '../../../shared/components/skeletons';

const TMActivitiesSkeleton = memo(function TMActivitiesSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 grid grid-cols-3 gap-4">
        {['bg-emerald-50', 'bg-amber-50', 'bg-gray-50'].map((bg, idx) => (
          <div key={idx} className={`${bg} rounded-lg p-3`}>
            <SkeletonLine width="70px" height="0.75rem" className="mb-2" />
            <SkeletonLine width="50px" height="1.5rem" />
          </div>
        ))}
      </div>

      <SkeletonLine width="200px" height="0.875rem" className="mb-2" />

      <SkeletonBlock height="200px" className="rounded-lg" />
    </div>
  );
});

const TMActivitiesCard = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const { tmActivities, totals, isLoading } = useTMActivities();

  const handleBarClick = (data) => {
    if (data && data.client_id) {
      navigate(`/tm-planning?client_id=${data.client_id}`);
    }
  };

  return (
    <DashboardCard
      title={t('dashboard:calendarActivitiesByClient')}
      icon={Calendar}
      loading={isLoading}
      skeleton={<TMActivitiesSkeleton />}
    >
      {tmActivities && tmActivities.length > 0 ? (
        <>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-xs text-emerald-600 font-medium">{t('dashboard:hoursDelivered')}</p>
              <p className="text-xl font-bold text-emerald-700">{totals.actual_hours || 0}h</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-600 font-medium">{t('dashboard:hoursRemaining')}</p>
              <p className="text-xl font-bold text-amber-700">{totals.etc_hours || 0}h</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-medium">{t('common:total')}</p>
              <p className="text-xl font-bold text-gray-700">{totals.total_hours || 0}h</p>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            {t('dashboard:clientsWithTM', { count: totals.client_count || 0 })}
          </div>

          <Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg animate-pulse" />}>
            <TMActivitiesBarChart data={tmActivities} onBarClick={handleBarClick} />
          </Suspense>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-400">
          {t('dashboard:noTMActivities')}
        </div>
      )}
    </DashboardCard>
  );
};

export default TMActivitiesCard;
