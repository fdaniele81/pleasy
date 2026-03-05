import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setStatusFilter as setStatusFilterAction,
  setGroupBy as setGroupByAction,
  setSelectedOwners as setSelectedOwnersAction,
  setExpandedClients as setExpandedClientsAction,
  toggleExpandedClient as toggleExpandedClientAction,
} from '../../../store/slices/dashboardFiltersSlice';
import {
  selectStatusFilter,
  selectGroupBy,
  selectSelectedOwners,
  selectExpandedClients,
} from '../../../store/selectors/dashboardFiltersSelectors';

export function useDashboardFilters() {
  const dispatch = useDispatch();

  const statusFilter = useSelector(selectStatusFilter);
  const groupBy = useSelector(selectGroupBy);
  const selectedOwners = useSelector(selectSelectedOwners);
  const expandedClients = useSelector(selectExpandedClients);

  const setStatusFilter = useCallback((value) => dispatch(setStatusFilterAction(value)), [dispatch]);
  const setGroupBy = useCallback((value) => dispatch(setGroupByAction(value)), [dispatch]);
  const setSelectedOwners = useCallback((value) => dispatch(setSelectedOwnersAction(value)), [dispatch]);
  const setExpandedClients = useCallback((value) => dispatch(setExpandedClientsAction(value)), [dispatch]);
  const toggleExpandedClient = useCallback((clientId) => dispatch(toggleExpandedClientAction(clientId)), [dispatch]);

  return {
    statusFilter,
    groupBy,
    selectedOwners,
    expandedClients,

    setStatusFilter,
    setGroupBy,
    setSelectedOwners,
    setExpandedClients,
    toggleExpandedClient,
  };
}
