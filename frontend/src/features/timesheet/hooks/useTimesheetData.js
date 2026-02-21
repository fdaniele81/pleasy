import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  useGetTimesheetsQuery,
  useGetTimeOffsQuery,
  useGetTimeOffTypesQuery,
} from "../api/timesheetEndpoints";
import { useGetHolidaysQuery } from "../../holidays/api/holidayEndpoints";

export function useTimesheetData(startDate, endDate) {
  const location = useLocation();
  const prevLocationRef = useRef(null);

  const {
    data: projects = [],
    isLoading: loadingTimesheets,
    refetch: refetchTimesheets,
  } = useGetTimesheetsQuery(
    { startDate, endDate },
    { skip: !startDate || !endDate }
  );

  const {
    data: timeOffsData = { timeOffs: [], historicalTotals: [] },
    isLoading: loadingTimeOffs,
    refetch: refetchTimeOffs,
  } = useGetTimeOffsQuery(
    { startDate, endDate },
    { skip: !startDate || !endDate }
  );

  const { data: timeOffTypes = [] } = useGetTimeOffTypesQuery();
  const { data: holidays = [] } = useGetHolidaysQuery();

  const loading = loadingTimesheets || loadingTimeOffs;

  const timeOffs = timeOffsData.timeOffs || [];
  const timeOffHistoricalTotals = timeOffsData.historicalTotals || [];

  useEffect(() => {
    if (
      prevLocationRef.current &&
      prevLocationRef.current !== location.pathname &&
      startDate &&
      endDate
    ) {
      refetchTimesheets();
      refetchTimeOffs();
    }
    prevLocationRef.current = location.pathname;
  }, [location, startDate, endDate, refetchTimesheets, refetchTimeOffs]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && startDate && endDate) {
        refetchTimesheets();
        refetchTimeOffs();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startDate, endDate, refetchTimesheets, refetchTimeOffs]);

  return {
    projects,
    loading,
    toast: null,
    timeOffs,
    timeOffHistoricalTotals,
    timeOffTypes,
    holidays,
  };
}
