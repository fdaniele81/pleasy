import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useGetTMPlanningQuery,
  useSaveTMTimesheetMutation,
} from "../api/tmPlanningEndpoints";
import { useGetHolidaysQuery } from "../../holidays/api/holidayEndpoints";
import { useGetPMPlanningQuery } from "../../planning/api/planningEndpoints";
import { generateDateRange, formatDateISO } from "../../../utils/date/dateUtils";
import { useInlineEditCell } from "../../../hooks/useInlineEditCell";
import { useTableDateHelpers } from "../../../shared/ui/table";
import { useLocale } from "../../../hooks/useLocale";
import logger from "../../../utils/logger";

const DAYS_DEFAULT = 14;
const DAYS_LARGE_SCREEN = 21;
const DAYS_XLARGE_SCREEN = 28;
const LARGE_SCREEN_BREAKPOINT = 1280;
const XLARGE_SCREEN_BREAKPOINT = 1536;

export function useTMPlanningState() {
  const locale = useLocale();
  const [searchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get("client_id");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysToShow, setDaysToShow] = useState(() => {
    if (typeof window === "undefined") return DAYS_DEFAULT;
    if (window.innerWidth > XLARGE_SCREEN_BREAKPOINT) return DAYS_XLARGE_SCREEN;
    if (window.innerWidth > LARGE_SCREEN_BREAKPOINT) return DAYS_LARGE_SCREEN;
    return DAYS_DEFAULT;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [groupBy, setGroupBy] = useState(clientIdFromUrl ? "client" : "user");
  const [expandedUsers, setExpandedUsers] = useState({});
  const [expandedClients, setExpandedClients] = useState(() =>
    clientIdFromUrl ? { [clientIdFromUrl]: true } : {}
  );
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedClientIds, setSelectedClientIds] = useState(() =>
    clientIdFromUrl ? [clientIdFromUrl] : []
  );
  const [showGanttModal, setShowGanttModal] = useState(false);
  const [ganttRefreshTrigger, setGanttRefreshTrigger] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsModalData, setDetailsModalData] = useState(null);
  const [detailsModalDate, setDetailsModalDate] = useState(null);
  const [detailsModalTask, setDetailsModalTask] = useState(null);
  const [detailsModalIsSubmitted, setDetailsModalIsSubmitted] = useState(false);

  const [hoveredNoteCell, setHoveredNoteCell] = useState(null);
  const [noteTooltipPosition, setNoteTooltipPosition] = useState({ x: 0, y: 0 });
  const noteTooltipTimeoutRef = useRef(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { data, isLoading, refetch } = useGetTMPlanningQuery(
    { startDate, endDate },
    { skip: !startDate || !endDate }
  );
  const { data: holidays = [] } = useGetHolidaysQuery();
  const { data: projects = [] } = useGetPMPlanningQuery();
  const [saveTMTimesheet] = useSaveTMTimesheetMutation();

  const tmUsers = data?.tmUsers || [];

  const hoursEditCell = useInlineEditCell({
    onSave: useCallback(
      async (taskId, dateStr, hours, _previousValue, { details, externalKey }) => {
        try {
          let finalExternalKey = externalKey;
          if (finalExternalKey === undefined) {
            for (const user of tmUsers) {
              const client = user.clients?.find(c => c.task_id === taskId);
              if (client) {
                const existingTs = client.timesheets?.find(t => t.work_date === dateStr);
                finalExternalKey = existingTs?.external_key || client.project_key || null;
                break;
              }
            }
          }

          await saveTMTimesheet({
            taskId,
            workDate: dateStr,
            hoursWorked: hours,
            details: details || null,
            externalKey: finalExternalKey,
          }).unwrap();
          await refetch();
          setGanttRefreshTrigger((prev) => prev + 1);
        } catch (error) {
          logger.error("Errore salvataggio timesheet:", error);
          refetch();
        }
      },
      [saveTMTimesheet, refetch, tmUsers]
    ),
    getCellKey: (taskId, dateStr) => `${taskId}-${dateStr}`,
    parseValue: (val) => parseFloat(val) || 0,
  });

  useEffect(() => {
    const handleResize = () => {
      let newDays = DAYS_DEFAULT;
      if (window.innerWidth > XLARGE_SCREEN_BREAKPOINT) {
        newDays = DAYS_XLARGE_SCREEN;
      } else if (window.innerWidth > LARGE_SCREEN_BREAKPOINT) {
        newDays = DAYS_LARGE_SCREEN;
      }
      setDaysToShow((prev) => (prev !== newDays ? newDays : prev));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const currentStart = startDate ? new Date(startDate) : today;
    const endDay = new Date(currentStart);
    endDay.setDate(endDay.getDate() + daysToShow - 1);

    if (!startDate) {
      setStartDate(formatDateISO(today));
    }
    setEndDate(formatDateISO(endDay));

    if (!startDate) {
      setExpandedUsers({});
    }
  }, [today, daysToShow, startDate]);

  useEffect(() => {
    return () => {
      if (noteTooltipTimeoutRef.current) {
        clearTimeout(noteTooltipTimeoutRef.current);
      }
    };
  }, []);

  const dateRange = useMemo(() => {
    if (!startDate || !endDate) return [];
    return generateDateRange(startDate, endDate);
  }, [startDate, endDate]);

  const { getDateInfo } = useTableDateHelpers(dateRange, holidays);

  const isAtToday = useMemo(() => {
    if (!startDate) return true;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    return start.getTime() === today.getTime();
  }, [startDate, today]);

  return {
    locale,
    today,
    startDate, setStartDate,
    endDate, setEndDate,
    daysToShow,
    searchTerm, setSearchTerm,
    groupBy, setGroupBy,
    expandedUsers, setExpandedUsers,
    expandedClients, setExpandedClients,
    selectedUserIds, setSelectedUserIds,
    selectedClientIds, setSelectedClientIds,
    showGanttModal, setShowGanttModal,
    ganttRefreshTrigger, setGanttRefreshTrigger,
    showExportModal, setShowExportModal,
    contextMenu, setContextMenu,
    showDetailsModal, setShowDetailsModal,
    detailsModalData, setDetailsModalData,
    detailsModalDate, setDetailsModalDate,
    detailsModalTask, setDetailsModalTask,
    detailsModalIsSubmitted, setDetailsModalIsSubmitted,
    hoveredNoteCell, setHoveredNoteCell,
    noteTooltipPosition, setNoteTooltipPosition,
    noteTooltipTimeoutRef,
    data, isLoading, refetch,
    holidays, projects,
    saveTMTimesheet,
    tmUsers,
    hoursEditCell,
    dateRange,
    getDateInfo,
    isAtToday,
    DAYS_DEFAULT, DAYS_LARGE_SCREEN, DAYS_XLARGE_SCREEN,
  };
}

export default useTMPlanningState;
