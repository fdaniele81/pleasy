import { useReducer, useCallback } from 'react';

const initialFiltersState = {
  searchTerm: '',
  filterUserIds: [],
  filterStatuses: [],
  filterClientIds: [],
  filterProjectIds: [],
  etcFilters: [],
  selectionFilters: [],
  filterStartDate: '',
  filterEndDate: '',
  dateFilterMode: 'intersect',
  hideProjectHeaders: false,
  showInDays: false,
};

const ACTIONS = {
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  SET_FILTER_USER_IDS: 'SET_FILTER_USER_IDS',
  SET_FILTER_STATUSES: 'SET_FILTER_STATUSES',
  SET_FILTER_CLIENT_IDS: 'SET_FILTER_CLIENT_IDS',
  SET_FILTER_PROJECT_IDS: 'SET_FILTER_PROJECT_IDS',
  SET_ETC_FILTERS: 'SET_ETC_FILTERS',
  SET_SELECTION_FILTERS: 'SET_SELECTION_FILTERS',
  SET_FILTER_START_DATE: 'SET_FILTER_START_DATE',
  SET_FILTER_END_DATE: 'SET_FILTER_END_DATE',
  SET_DATE_FILTER_MODE: 'SET_DATE_FILTER_MODE',
  SET_HIDE_PROJECT_HEADERS: 'SET_HIDE_PROJECT_HEADERS',
  SET_SHOW_IN_DAYS: 'SET_SHOW_IN_DAYS',
  RESET_ALL_FILTERS: 'RESET_ALL_FILTERS',
  SET_MULTIPLE: 'SET_MULTIPLE',
};

function filtersReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };
    case ACTIONS.SET_FILTER_USER_IDS:
      return { ...state, filterUserIds: action.payload };
    case ACTIONS.SET_FILTER_STATUSES:
      return { ...state, filterStatuses: action.payload };
    case ACTIONS.SET_FILTER_CLIENT_IDS:
      return { ...state, filterClientIds: action.payload };
    case ACTIONS.SET_FILTER_PROJECT_IDS:
      return { ...state, filterProjectIds: action.payload };
    case ACTIONS.SET_ETC_FILTERS:
      return { ...state, etcFilters: action.payload };
    case ACTIONS.SET_SELECTION_FILTERS:
      return { ...state, selectionFilters: action.payload };
    case ACTIONS.SET_FILTER_START_DATE:
      return { ...state, filterStartDate: action.payload };
    case ACTIONS.SET_FILTER_END_DATE:
      return { ...state, filterEndDate: action.payload };
    case ACTIONS.SET_DATE_FILTER_MODE:
      return { ...state, dateFilterMode: action.payload };
    case ACTIONS.SET_HIDE_PROJECT_HEADERS:
      return { ...state, hideProjectHeaders: action.payload };
    case ACTIONS.SET_SHOW_IN_DAYS:
      return { ...state, showInDays: action.payload };
    case ACTIONS.RESET_ALL_FILTERS:
      return { ...initialFiltersState };
    case ACTIONS.SET_MULTIPLE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function useFiltersReducer() {
  const [state, dispatch] = useReducer(filtersReducer, initialFiltersState);

  const setSearchTerm = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_SEARCH_TERM, payload: value });
  }, []);

  const setFilterUserIds = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_FILTER_USER_IDS, payload: value });
  }, []);

  const setFilterStatuses = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_FILTER_STATUSES, payload: value });
  }, []);

  const setFilterClientIds = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_FILTER_CLIENT_IDS, payload: value });
  }, []);

  const setFilterProjectIds = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_FILTER_PROJECT_IDS, payload: value });
  }, []);

  const setEtcFilters = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_ETC_FILTERS, payload: value });
  }, []);

  const setSelectionFilters = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_SELECTION_FILTERS, payload: value });
  }, []);

  const setFilterStartDate = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_FILTER_START_DATE, payload: value });
  }, []);

  const setFilterEndDate = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_FILTER_END_DATE, payload: value });
  }, []);

  const setDateFilterMode = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_DATE_FILTER_MODE, payload: value });
  }, []);

  const setHideProjectHeaders = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_HIDE_PROJECT_HEADERS, payload: value });
  }, []);

  const setShowInDays = useCallback((value) => {
    dispatch({ type: ACTIONS.SET_SHOW_IN_DAYS, payload: value });
  }, []);

  const resetAllFilters = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_ALL_FILTERS });
  }, []);

  const setMultipleFilters = useCallback((updates) => {
    dispatch({ type: ACTIONS.SET_MULTIPLE, payload: updates });
  }, []);

  return {
    ...state,

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

    resetAllFilters,
    setMultipleFilters,
  };
}

export { ACTIONS, initialFiltersState };
