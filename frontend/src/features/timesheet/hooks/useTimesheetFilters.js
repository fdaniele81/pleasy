import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSearchTerm as setSearchTermAction,
  setSelectionFilters as setSelectionFiltersAction,
  setShowTimeOff as setShowTimeOffAction,
  setFilterClientIds as setFilterClientIdsAction,
  setFilterProjectIds as setFilterProjectIdsAction,
  setFilterProjectType as setFilterProjectTypeAction,
} from '../../../store/slices/timesheetFiltersSlice';
import {
  selectSearchTerm,
  selectSelectionFilters,
  selectShowTimeOff,
  selectFilterClientIds,
  selectFilterProjectIds,
  selectFilterProjectType,
} from '../../../store/selectors/timesheetFiltersSelectors';

export function useTimesheetFilters() {
  const dispatch = useDispatch();

  const searchTerm = useSelector(selectSearchTerm);
  const selectionFilters = useSelector(selectSelectionFilters);
  const showTimeOff = useSelector(selectShowTimeOff);
  const filterClientIds = useSelector(selectFilterClientIds);
  const filterProjectIds = useSelector(selectFilterProjectIds);
  const filterProjectType = useSelector(selectFilterProjectType);

  const setSearchTerm = useCallback((value) => dispatch(setSearchTermAction(value)), [dispatch]);
  const setSelectionFilters = useCallback((value) => dispatch(setSelectionFiltersAction(value)), [dispatch]);
  const setShowTimeOff = useCallback((value) => dispatch(setShowTimeOffAction(value)), [dispatch]);
  const setFilterClientIds = useCallback((value) => dispatch(setFilterClientIdsAction(value)), [dispatch]);
  const setFilterProjectIds = useCallback((value) => dispatch(setFilterProjectIdsAction(value)), [dispatch]);
  const setFilterProjectType = useCallback((value) => dispatch(setFilterProjectTypeAction(value)), [dispatch]);

  return {
    searchTerm,
    selectionFilters,
    showTimeOff,
    filterClientIds,
    filterProjectIds,
    filterProjectType,

    setSearchTerm,
    setSelectionFilters,
    setShowTimeOff,
    setFilterClientIds,
    setFilterProjectIds,
    setFilterProjectType,
  };
}

export default useTimesheetFilters;
