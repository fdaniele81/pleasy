import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSearchTerm as setSearchTermAction,
  setGroupBy as setGroupByAction,
  setSelectedUserIds as setSelectedUserIdsAction,
  setSelectedClientIds as setSelectedClientIdsAction,
  setExpandedUsers as setExpandedUsersAction,
  toggleExpandedUser as toggleExpandedUserAction,
  setExpandedClients as setExpandedClientsAction,
  toggleExpandedClient as toggleExpandedClientAction,
} from '../../../store/slices/tmPlanningFiltersSlice';
import {
  selectSearchTerm,
  selectGroupBy,
  selectSelectedUserIds,
  selectSelectedClientIds,
  selectExpandedUsers,
  selectExpandedClients,
} from '../../../store/selectors/tmPlanningFiltersSelectors';

export function useTMPlanningFilters() {
  const dispatch = useDispatch();

  const searchTerm = useSelector(selectSearchTerm);
  const groupBy = useSelector(selectGroupBy);
  const selectedUserIds = useSelector(selectSelectedUserIds);
  const selectedClientIds = useSelector(selectSelectedClientIds);
  const expandedUsers = useSelector(selectExpandedUsers);
  const expandedClients = useSelector(selectExpandedClients);

  const setSearchTerm = useCallback((value) => dispatch(setSearchTermAction(value)), [dispatch]);
  const setGroupBy = useCallback((value) => dispatch(setGroupByAction(value)), [dispatch]);
  const setSelectedUserIds = useCallback((value) => dispatch(setSelectedUserIdsAction(value)), [dispatch]);
  const setSelectedClientIds = useCallback((value) => dispatch(setSelectedClientIdsAction(value)), [dispatch]);
  const setExpandedUsers = useCallback((value) => dispatch(setExpandedUsersAction(value)), [dispatch]);
  const toggleExpandedUser = useCallback((userId) => dispatch(toggleExpandedUserAction(userId)), [dispatch]);
  const setExpandedClients = useCallback((value) => dispatch(setExpandedClientsAction(value)), [dispatch]);
  const toggleExpandedClient = useCallback((clientId) => dispatch(toggleExpandedClientAction(clientId)), [dispatch]);

  return {
    searchTerm,
    groupBy,
    selectedUserIds,
    selectedClientIds,
    expandedUsers,
    expandedClients,

    setSearchTerm,
    setGroupBy,
    setSelectedUserIds,
    setSelectedClientIds,
    setExpandedUsers,
    toggleExpandedUser,
    setExpandedClients,
    toggleExpandedClient,
  };
}
