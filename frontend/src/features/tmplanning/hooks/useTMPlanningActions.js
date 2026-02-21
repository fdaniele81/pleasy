import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { formatDateISO } from "../../../utils/date/dateUtils";
import { exportTMPlanningToExcel } from "../../../utils/export/excel";
import logger from "../../../utils/logger";

export function useTMPlanningActions({
  today,
  startDate,
  setStartDate,
  setEndDate,
  daysToShow,
  hoursEditCell,
  setContextMenu,
  contextMenu,
  setShowDetailsModal,
  setDetailsModalData,
  setDetailsModalDate,
  setDetailsModalTask,
  setDetailsModalIsSubmitted,
  setShowExportModal,
  setGanttRefreshTrigger,
  hoveredNoteCell,
  setHoveredNoteCell,
  noteTooltipPosition,
  setNoteTooltipPosition,
  noteTooltipTimeoutRef,
  detailsModalDate,
  detailsModalTask,
  saveTMTimesheet,
  refetch,
  filteredUsers,
  tmUsers,
  holidays,
  groupBy,
  allClients,
  dateRange,
  getTimesheetForDate,
  setSearchTerm,
  setSelectedUserIds,
  setSelectedClientIds,
}) {
  const { t } = useTranslation(['tmplanning', 'common']);

  const goToPreviousPeriod = useCallback(() => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - 7);
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + daysToShow - 1);
    setStartDate(formatDateISO(newStart));
    setEndDate(formatDateISO(newEnd));
  }, [startDate, daysToShow, setStartDate, setEndDate]);

  const goToNextPeriod = useCallback(() => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + 7);
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + daysToShow - 1);
    setStartDate(formatDateISO(newStart));
    setEndDate(formatDateISO(newEnd));
  }, [startDate, daysToShow, setStartDate, setEndDate]);

  const goToToday = useCallback(() => {
    const endDay = new Date(today);
    endDay.setDate(endDay.getDate() + daysToShow - 1);
    setStartDate(formatDateISO(today));
    setEndDate(formatDateISO(endDay));
  }, [today, daysToShow, setStartDate, setEndDate]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedUserIds([]);
    setSelectedClientIds([]);
  }, [setSearchTerm, setSelectedUserIds, setSelectedClientIds]);

  const handleCellClick = useCallback(
    (taskId, date, currentHours, isSubmitted, details) => {
      const dateStr = formatDateISO(date);
      hoursEditCell.handleCellClick(taskId, dateStr, currentHours || "", {
        isLocked: false,
        details,
      });
    },
    [hoursEditCell]
  );

  const handleCellContextMenu = useCallback(
    (e, taskId, date, currentHours, isSubmitted, client) => {
      e.preventDefault();
      if (!currentHours || currentHours === 0) return;
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        data: { taskId, date, currentHours, isSubmitted, client },
      });
    },
    [setContextMenu]
  );

  const handleContextMenuInsertNotes = useCallback(() => {
    if (!contextMenu) return;

    const { taskId, date, client, isSubmitted } = contextMenu.data;
    const timesheet = getTimesheetForDate(client.timesheets, date);

    setDetailsModalData({
      hours: timesheet?.hours_worked || 0,
      details: timesheet?.details || "",
      external_key: timesheet?.external_key || client.project_key || "",
    });
    setDetailsModalDate(date);
    setDetailsModalTask({
      task_id: taskId,
      client_name: client.client_name,
      project_key: client.project_key,
    });
    setDetailsModalIsSubmitted(isSubmitted);
    setShowDetailsModal(true);
    setContextMenu(null);
  }, [contextMenu, getTimesheetForDate, setDetailsModalData, setDetailsModalDate, setDetailsModalTask, setDetailsModalIsSubmitted, setShowDetailsModal, setContextMenu]);

  const handleCellBlur = useCallback(
    (taskId, date, previousValue, timesheetDetails) => {
      const dateStr = formatDateISO(date);
      hoursEditCell.handleCellBlur(taskId, dateStr, previousValue, {
        details: timesheetDetails,
      });
    },
    [hoursEditCell]
  );

  const handleKeyDown = useCallback(
    (e, taskId, date, dateIdx, previousValue, timesheetDetails) => {
      const dateStr = formatDateISO(date);

      const navigationConfig = {
        getNextCell: (direction) => {
          const clientIdx = allClients.findIndex((c) => c.task_id === taskId);
          if (clientIdx === -1) return null;

          let nextClientIdx = clientIdx;
          let nextDateIdx = dateIdx;
          const maxAttempts = allClients.length * dateRange.length;
          let attempts = 0;

          while (attempts < maxAttempts) {
            attempts++;
            switch (direction) {
              case "right":
                nextDateIdx += 1;
                if (nextDateIdx >= dateRange.length) { nextDateIdx = 0; nextClientIdx += 1; }
                break;
              case "left":
                nextDateIdx -= 1;
                if (nextDateIdx < 0) { nextDateIdx = dateRange.length - 1; nextClientIdx -= 1; }
                break;
              case "down":
                nextClientIdx += 1;
                break;
              case "up":
                nextClientIdx -= 1;
                break;
              default:
                return null;
            }

            if (nextClientIdx < 0 || nextClientIdx >= allClients.length) return null;
            if (nextDateIdx < 0 || nextDateIdx >= dateRange.length) return null;

            const nextClient = allClients[nextClientIdx];
            const nextDate = dateRange[nextDateIdx];
            const nextDateStr = formatDateISO(nextDate);
            const nextTimesheet = getTimesheetForDate(nextClient.timesheets, nextDate);
            const isNextCellLocked = nextTimesheet?.is_submitted && nextTimesheet?.hours_worked > 0;

            if (!isNextCellLocked) {
              return {
                rowId: nextClient.task_id,
                columnKey: nextDateStr,
                currentValue: nextTimesheet?.hours_worked || "",
              };
            }
          }
          return null;
        },
      };

      hoursEditCell.handleKeyDown(e, taskId, dateStr, previousValue, navigationConfig, {
        details: timesheetDetails,
      });
    },
    [hoursEditCell, allClients, dateRange, getTimesheetForDate]
  );

  const handleNoteTooltipHover = useCallback((event, taskId, date, details) => {
    if (noteTooltipTimeoutRef.current) clearTimeout(noteTooltipTimeoutRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    noteTooltipTimeoutRef.current = setTimeout(() => {
      setNoteTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 8 });
      setHoveredNoteCell({ taskId, date, details });
    }, 500);
  }, [noteTooltipTimeoutRef, setNoteTooltipPosition, setHoveredNoteCell]);

  const handleNoteTooltipLeave = useCallback(() => {
    if (noteTooltipTimeoutRef.current) {
      clearTimeout(noteTooltipTimeoutRef.current);
      noteTooltipTimeoutRef.current = null;
    }
    setHoveredNoteCell(null);
  }, [noteTooltipTimeoutRef, setHoveredNoteCell]);

  const handleDetailsModalConfirm = useCallback(
    async (data) => {
      if (!detailsModalDate || !detailsModalTask) return;
      const dateStr = formatDateISO(detailsModalDate);
      const externalKey = data.external_key !== undefined
        ? data.external_key
        : detailsModalTask.project_key || null;

      try {
        await saveTMTimesheet({
          taskId: detailsModalTask.task_id,
          workDate: dateStr,
          hoursWorked: data.hours,
          details: data.details?.trim() || null,
          externalKey,
        }).unwrap();
        await refetch();
        setGanttRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        logger.error("Errore salvataggio timesheet:", error);
      }

      setShowDetailsModal(false);
      setDetailsModalData(null);
      setDetailsModalDate(null);
      setDetailsModalTask(null);
      setDetailsModalIsSubmitted(false);
    },
    [saveTMTimesheet, refetch, detailsModalDate, detailsModalTask, setGanttRefreshTrigger, setShowDetailsModal, setDetailsModalData, setDetailsModalDate, setDetailsModalTask, setDetailsModalIsSubmitted]
  );

  const handleDetailsModalClose = useCallback(() => {
    setShowDetailsModal(false);
    setDetailsModalData(null);
    setDetailsModalDate(null);
    setDetailsModalTask(null);
    setDetailsModalIsSubmitted(false);
  }, [setShowDetailsModal, setDetailsModalData, setDetailsModalDate, setDetailsModalTask, setDetailsModalIsSubmitted]);

  const handleExport = useCallback(
    async ({ startDate: exportStartDate, endDate: exportEndDate }) => {
      try {
        const dataToExport = filteredUsers.length > 0 ? filteredUsers : tmUsers;
        await exportTMPlanningToExcel(dataToExport, exportStartDate, exportEndDate, holidays, groupBy);
        setShowExportModal(false);
      } catch (error) {
        logger.error("Errore durante l'export:", error);
      }
    },
    [filteredUsers, tmUsers, holidays, groupBy, setShowExportModal]
  );

  return {
    goToPreviousPeriod,
    goToNextPeriod,
    goToToday,
    clearAllFilters,
    handleCellClick,
    handleCellContextMenu,
    handleContextMenuInsertNotes,
    handleCellBlur,
    handleKeyDown,
    handleNoteTooltipHover,
    handleNoteTooltipLeave,
    handleDetailsModalConfirm,
    handleDetailsModalClose,
    handleExport,
  };
}

export default useTMPlanningActions;
