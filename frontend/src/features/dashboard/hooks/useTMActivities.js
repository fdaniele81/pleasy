import { useSelector } from 'react-redux';
import { useGetDashboardTMActivitiesQuery } from '../api/dashboardEndpoints';
import { selectIsAuthenticated } from '../../../store/selectors/authSelectors';

export function useTMActivities() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const {
    data = { tmActivities: [], totals: {} },
    isLoading,
    refetch,
  } = useGetDashboardTMActivitiesQuery(undefined, { skip: !isAuthenticated });

  const { tmActivities = [], totals = {} } = data;

  return {
    tmActivities,
    totals,
    isLoading,
    refetch,
  };
}
