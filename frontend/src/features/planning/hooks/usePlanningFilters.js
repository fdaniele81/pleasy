import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSearchTerm as setSearchTermAction,
  setFilterUserIds as setFilterUserIdsAction,
  setFilterStatuses as setFilterStatusesAction,
  setFilterClientIds as setFilterClientIdsAction,
  setFilterProjectIds as setFilterProjectIdsAction,
  setEtcFilters as setEtcFiltersAction,
  setSelectionFilters as setSelectionFiltersAction,
  setFilterStartDate as setFilterStartDateAction,
  setFilterEndDate as setFilterEndDateAction,
  setDateFilterMode as setDateFilterModeAction,
  setHideProjectHeaders as setHideProjectHeadersAction,
  setShowInDays as setShowInDaysAction,
  setShowTimeline as setShowTimelineAction,
  setExpandedProjects as setExpandedProjectsAction,
  toggleExpandedProject as toggleExpandedProjectAction,
  mergeExpandedProjects as mergeExpandedProjectsAction,
} from '../../../store/slices/planningFiltersSlice';
import {
  selectSearchTerm,
  selectFilterUserIds,
  selectFilterStatuses,
  selectFilterClientIds,
  selectFilterProjectIds,
  selectEtcFilters,
  selectSelectionFilters,
  selectFilterStartDate,
  selectFilterEndDate,
  selectDateFilterMode,
  selectHideProjectHeaders,
  selectShowInDays,
  selectShowTimeline,
  selectExpandedProjects,
} from '../../../store/selectors/planningFiltersSelectors';

export function usePlanningFilters() {
  const dispatch = useDispatch();

  const searchTerm = useSelector(selectSearchTerm);
  const filterUserIds = useSelector(selectFilterUserIds);
  const filterStatuses = useSelector(selectFilterStatuses);
  const filterClientIds = useSelector(selectFilterClientIds);
  const filterProjectIds = useSelector(selectFilterProjectIds);
  const etcFilters = useSelector(selectEtcFilters);
  const selectionFilters = useSelector(selectSelectionFilters);
  const filterStartDate = useSelector(selectFilterStartDate);
  const filterEndDate = useSelector(selectFilterEndDate);
  const dateFilterMode = useSelector(selectDateFilterMode);
  const hideProjectHeaders = useSelector(selectHideProjectHeaders);
  const showInDays = useSelector(selectShowInDays);
  const showTimeline = useSelector(selectShowTimeline);
  const expandedProjects = useSelector(selectExpandedProjects);

  const setSearchTerm = useCallback((value) => dispatch(setSearchTermAction(value)), [dispatch]);
  const setFilterUserIds = useCallback((value) => dispatch(setFilterUserIdsAction(value)), [dispatch]);
  const setFilterStatuses = useCallback((value) => dispatch(setFilterStatusesAction(value)), [dispatch]);
  const setFilterClientIds = useCallback((value) => dispatch(setFilterClientIdsAction(value)), [dispatch]);
  const setFilterProjectIds = useCallback((value) => dispatch(setFilterProjectIdsAction(value)), [dispatch]);
  const setEtcFilters = useCallback((value) => dispatch(setEtcFiltersAction(value)), [dispatch]);
  const setSelectionFilters = useCallback((value) => dispatch(setSelectionFiltersAction(value)), [dispatch]);
  const setFilterStartDate = useCallback((value) => dispatch(setFilterStartDateAction(value)), [dispatch]);
  const setFilterEndDate = useCallback((value) => dispatch(setFilterEndDateAction(value)), [dispatch]);
  const setDateFilterMode = useCallback((value) => dispatch(setDateFilterModeAction(value)), [dispatch]);
  const setHideProjectHeaders = useCallback((value) => dispatch(setHideProjectHeadersAction(value)), [dispatch]);
  const setShowInDays = useCallback((value) => dispatch(setShowInDaysAction(value)), [dispatch]);
  const setShowTimeline = useCallback((value) => dispatch(setShowTimelineAction(value)), [dispatch]);
  const setExpandedProjects = useCallback((value) => dispatch(setExpandedProjectsAction(value)), [dispatch]);
  const toggleExpandedProject = useCallback((projectId) => dispatch(toggleExpandedProjectAction(projectId)), [dispatch]);
  const mergeExpandedProjects = useCallback((value) => dispatch(mergeExpandedProjectsAction(value)), [dispatch]);

  return {
    searchTerm,
    filterUserIds,
    filterStatuses,
    filterClientIds,
    filterProjectIds,
    etcFilters,
    selectionFilters,
    filterStartDate,
    filterEndDate,
    dateFilterMode,
    hideProjectHeaders,
    showInDays,
    showTimeline,
    expandedProjects,

    setSearchTerm,
    setFilterUserIds,
    setFilterStatuses,
    setFilterClientIds,
    setFilterProjectIds,
    setEtcFilters,
    setSelectionFilters,
    setFilterStartDate,
    setFilterEndDate,
    setDateFilterMode,
    setHideProjectHeaders,
    setShowInDays,
    setShowTimeline,
    setExpandedProjects,
    toggleExpandedProject,
    mergeExpandedProjects,
  };
}
