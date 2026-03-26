import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Search,
  User,
  Building2,
  X,
} from "lucide-react";
import { formatDateISO } from "../../../utils/date/dateUtils";
import { isHoliday as checkIsHoliday } from "../../../utils/date/workingDays";
import { getRouteIcon } from "../../../constants/routeIcons";
import { ROUTES } from "../../../constants/routes";

function TMPlanningMobile({
  dateRange,
  tmUsers,
  filteredUsers,
  filteredClients,
  groupBy,
  setGroupBy,
  getDateInfo,
  getUserDayTotal,
  getClientDayTotal,
  getTimesheetForDate,
  onPreviousPeriod,
  onNextPeriod,
  onToday,
  isAtToday,
  periodLabel,
  hoursEditCell,
  onCellClick,
  onCellBlur,
  onCellNoteClick,
  onDetailsModalConfirm,
  holidays,
  locale,
  saveTMTimesheet,
  refetch,
  userOptions,
  clientOptions,
  selectedUserIds,
  setSelectedUserIds,
  selectedClientIds,
  setSelectedClientIds,
}) {
  const { t } = useTranslation(["tmplanning", "common"]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [detailTask, setDetailTask] = useState(null);
  const [sheetHours, setSheetHours] = useState("");
  const [sheetDetails, setSheetDetails] = useState("");

  // Find today's index in dateRange
  const todayIdx = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const idx = dateRange.findIndex((d) => {
      const norm = new Date(d);
      norm.setHours(0, 0, 0, 0);
      return norm.getTime() === today.getTime();
    });
    return idx >= 0 ? idx : 0;
  }, [dateRange]);

  const [selectedDayIdx, setSelectedDayIdx] = useState(todayIdx);

  useEffect(() => {
    setSelectedDayIdx(todayIdx);
  }, [todayIdx]);

  const selectedDate = dateRange[selectedDayIdx] || dateRange[0];

  const getDayInitial = useCallback(
    (date) => date.toLocaleDateString(locale, { weekday: "short" }).charAt(0).toUpperCase(),
    [locale]
  );

  const getFullDayLabel = useCallback(
    (date) =>
      date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" }),
    [locale]
  );

  // Build flat list of cards for the selected day
  const cardsForDay = useMemo(() => {
    if (!selectedDate) return [];
    const term = searchTerm.trim().toLowerCase();
    const dateStr = formatDateISO(selectedDate);
    const cards = [];

    if (groupBy === "user") {
      for (const user of filteredUsers) {
        for (const client of user.clients || []) {
          const ts = client.timesheets?.find((t) => t.work_date === dateStr);
          const hours = ts?.hours_worked || 0;
          const details = ts?.details || "";
          const isSubmitted = ts?.is_submitted || false;

          if (term) {
            const match =
              user.full_name?.toLowerCase().includes(term) ||
              client.client_name?.toLowerCase().includes(term);
            if (!match) continue;
          }

          cards.push({
            key: `${user.user_id}-${client.task_id}`,
            taskId: client.task_id,
            userName: user.full_name,
            clientName: client.client_name,
            symbolLetter: client.symbol_letter || (client.client_name || "?")[0].toUpperCase(),
            symbolBgColor: client.symbol_bg_color || client.client_color || "#6366F1",
            symbolLetterColor: client.symbol_letter_color || "#FFFFFF",
            projectKey: client.project_key,
            hours,
            details,
            isSubmitted,
            timesheets: client.timesheets,
          });
        }
      }
    } else {
      for (const client of filteredClients) {
        for (const user of client.users || []) {
          const ts = user.timesheets?.find((t) => t.work_date === dateStr);
          const hours = ts?.hours_worked || 0;
          const details = ts?.details || "";
          const isSubmitted = ts?.is_submitted || false;

          if (term) {
            const match =
              user.full_name?.toLowerCase().includes(term) ||
              client.client_name?.toLowerCase().includes(term);
            if (!match) continue;
          }

          cards.push({
            key: `${client.client_id}-${user.user_id}`,
            taskId: user.task_id,
            userName: user.full_name,
            clientName: client.client_name,
            symbolLetter: client.symbol_letter || (client.client_name || "?")[0].toUpperCase(),
            symbolBgColor: client.symbol_bg_color || client.client_color || "#6366F1",
            symbolLetterColor: client.symbol_letter_color || "#FFFFFF",
            projectKey: user.project_key,
            hours,
            details,
            isSubmitted,
            timesheets: user.timesheets,
          });
        }
      }
    }

    // Sort: tasks with hours first, then alphabetical
    cards.sort((a, b) => {
      if (a.hours > 0 && b.hours === 0) return -1;
      if (a.hours === 0 && b.hours > 0) return 1;
      if (groupBy === "user") {
        const nameCompare = (a.userName || "").localeCompare(b.userName || "");
        if (nameCompare !== 0) return nameCompare;
        return (a.clientName || "").localeCompare(b.clientName || "");
      }
      const clientCompare = (a.clientName || "").localeCompare(b.clientName || "");
      if (clientCompare !== 0) return clientCompare;
      return (a.userName || "").localeCompare(b.userName || "");
    });

    return cards;
  }, [filteredUsers, filteredClients, selectedDate, searchTerm, groupBy]);

  // Day totals for the week selector
  const dayTotals = useMemo(() => {
    return dateRange.map((date) => {
      let total = 0;
      for (const user of tmUsers) {
        for (const client of user.clients || []) {
          const ts = client.timesheets?.find((t) => t.work_date === formatDateISO(date));
          total += ts?.hours_worked || 0;
        }
      }
      return total;
    });
  }, [dateRange, tmUsers]);

  const selectedDayTotal = dayTotals[selectedDayIdx] || 0;

  const hasActiveFilters = selectedUserIds.length > 0 || selectedClientIds.length > 0;

  const clearAllFilters = useCallback(() => {
    setSelectedUserIds([]);
    setSelectedClientIds([]);
    setSearchTerm("");
  }, [setSelectedUserIds, setSelectedClientIds]);

  // Open bottom sheet
  const openDetailSheet = useCallback((card) => {
    setDetailTask(card);
    setSheetHours(card.hours > 0 ? String(card.hours) : "");
    setSheetDetails(card.details || "");
  }, []);

  // Save from bottom sheet
  const handleSheetSave = useCallback(async () => {
    if (!detailTask || !selectedDate) return;
    const hours = parseFloat(sheetHours) || 0;
    const details = sheetDetails.trim();
    const dateStr = formatDateISO(selectedDate);

    try {
      await saveTMTimesheet({
        taskId: detailTask.taskId,
        workDate: dateStr,
        hoursWorked: hours,
        details: details || null,
        externalKey: detailTask.projectKey || null,
      }).unwrap();
      await refetch();
    } catch {
      // Error handled silently, refetch to restore
      refetch();
    }

    setDetailTask(null);
  }, [detailTask, selectedDate, sheetHours, sheetDetails, saveTMTimesheet, refetch]);

  const renderTaskCard = useCallback(
    (card) => {
      const hasHours = card.hours > 0;

      const hoursColorClass = hasHours
        ? card.isSubmitted
          ? "text-blue-600 bg-blue-50"
          : "text-gray-800 bg-gray-100"
        : "text-gray-300 bg-gray-50";

      return (
        <button
          key={card.key}
          onClick={() => openDetailSheet(card)}
          className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl shadow-sm w-full text-left active:bg-gray-50 transition-colors ${
            card.isSubmitted && hasHours ? "border-l-[3px] border-l-blue-400" : ""
          }`}
        >
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: card.symbolBgColor,
              color: card.symbolLetterColor,
            }}
          >
            {card.symbolLetter}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-gray-400 truncate">
              {groupBy === "user" ? card.userName : card.clientName}
            </div>
            <div className={`text-sm font-medium truncate ${hasHours ? "text-gray-800" : "text-gray-500"}`}>
              {groupBy === "user" ? card.clientName : card.userName}
            </div>
          </div>

          {card.details && (
            <FileText size={14} className="text-blue-500 shrink-0" />
          )}

          <div className={`min-w-[52px] text-center py-1.5 px-2 rounded-lg text-lg font-bold ${hoursColorClass}`}>
            {hasHours ? card.hours.toFixed(1) : "-"}
          </div>
        </button>
      );
    },
    [openDetailSheet, groupBy]
  );

  const RouteIcon = getRouteIcon(ROUTES.TM_PLANNING);

  return (
    <div className="pb-6">
      {/* Bottom Sheet */}
      {detailTask && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setDetailTask(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white rounded-t-2xl shadow-xl max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="px-5 pb-6">
              {/* Task header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: detailTask.symbolBgColor,
                    color: detailTask.symbolLetterColor,
                  }}
                >
                  {detailTask.symbolLetter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400">
                    {detailTask.userName}
                  </div>
                  <div className="text-base font-semibold text-gray-800 truncate">
                    {detailTask.clientName}
                  </div>
                </div>
                <button
                  onClick={() => setDetailTask(null)}
                  className="p-2 -mr-2 rounded-full text-gray-400 active:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Task info box */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {detailTask.userName} — {detailTask.clientName}
                </p>
                {selectedDate && (
                  <p className="text-xs text-blue-700 mt-1 capitalize">
                    {getFullDayLabel(selectedDate)}
                  </p>
                )}
              </div>

              {/* Hours input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("common:hours")}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  max="24"
                  value={sheetHours}
                  onChange={(e) => setSheetHours(e.target.value)}
                  placeholder="0"
                  disabled={detailTask.isSubmitted}
                  className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-base ${
                    detailTask.isSubmitted ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Notes textarea */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("common:notes")}
                </label>
                <textarea
                  value={sheetDetails}
                  onChange={(e) => setSheetDetails(e.target.value)}
                  placeholder={t("tmplanning:insertNotes")}
                  rows={3}
                  disabled={detailTask.isSubmitted}
                  className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm ${
                    detailTask.isSubmitted ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Save button */}
              {!detailTask.isSubmitted && (
                <button
                  onClick={handleSheetSave}
                  className="w-full py-3 bg-cyan-600 text-white font-semibold rounded-xl active:bg-cyan-700 transition-colors text-sm"
                >
                  {t("common:save")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-16 z-30">
        {/* Page title */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
          <h1 className="text-base font-bold text-gray-800 flex items-center gap-2">
            {RouteIcon && <RouteIcon size={18} />}
            <span>{t("tmplanning:title")}</span>
          </h1>
        </div>

        {/* Period navigation */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-cyan-700 text-white">
          <button onClick={onPreviousPeriod} className="p-2 -ml-2 rounded-full active:bg-cyan-600 transition-colors">
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide">{periodLabel}</span>
            {!isAtToday && (
              <button
                onClick={onToday}
                className="px-2 py-0.5 text-xs font-medium bg-white/20 rounded-md active:bg-white/30 transition-colors"
              >
                {t("common:today")}
              </button>
            )}
          </div>
          <button onClick={onNextPeriod} className="p-2 -mr-2 rounded-full active:bg-cyan-600 transition-colors">
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Week day selector */}
        <div className="flex justify-between px-1.5 py-1.5 bg-cyan-700 border-t border-cyan-600">
          {dateRange.map((date, idx) => {
            const isSelected = idx === selectedDayIdx;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHolidayDay = checkIsHoliday(date, holidays);
            const isToday = (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const norm = new Date(date);
              norm.setHours(0, 0, 0, 0);
              return norm.getTime() === today.getTime();
            })();
            const total = dayTotals[idx];
            const hasHours = total > 0;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIdx(idx)}
                className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all flex-1 mx-0.5 ${
                  isSelected
                    ? "bg-white text-cyan-700 shadow-md"
                    : isToday
                      ? "bg-cyan-600/70 text-white"
                      : "text-cyan-100 active:bg-cyan-600/50"
                }`}
              >
                <span
                  className={`text-[10px] font-semibold uppercase ${
                    (isWeekend || isHolidayDay) && !isSelected ? "text-cyan-300/60" : ""
                  }`}
                >
                  {getDayInitial(date)}
                </span>
                <span
                  className={`text-[11px] font-bold leading-none ${
                    isSelected
                      ? hasHours ? "text-cyan-700" : "text-gray-400"
                      : hasHours ? "text-white" : "text-cyan-400/50"
                  }`}
                >
                  {hasHours ? total.toFixed(1) : "·"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Day Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
          <span className="text-sm font-medium text-gray-600 capitalize">
            {selectedDate && getFullDayLabel(selectedDate)}
          </span>
          <div className="flex items-center gap-3">
            <div
              className={`text-lg font-extrabold ${
                selectedDayTotal > 0 ? "text-cyan-700" : "text-gray-300"
              }`}
            >
              {selectedDayTotal > 0 ? `${selectedDayTotal.toFixed(1)}h` : "-"}
            </div>
          </div>
        </div>

        {/* Filter toggle */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
              hasActiveFilters
                ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                : "text-gray-500 active:bg-gray-100"
            }`}
          >
            <Filter size={13} />
            {t("common:filter")}
            {hasActiveFilters && (
              <span className="bg-cyan-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {selectedUserIds.length + selectedClientIds.length}
              </span>
            )}
          </button>
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setGroupBy("user")}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors ${
                groupBy === "user" ? "bg-cyan-600 text-white" : "bg-white text-gray-600 active:bg-gray-100"
              }`}
            >
              <User size={12} />
              {t("common:user")}
            </button>
            <button
              onClick={() => setGroupBy("client")}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors border-l border-gray-300 ${
                groupBy === "client" ? "bg-cyan-600 text-white" : "bg-white text-gray-600 active:bg-gray-100"
              }`}
            >
              <Building2 size={12} />
              {t("common:client")}
            </button>
          </div>
        </div>

        {/* Expandable filters panel */}
        {showFilters && (
          <div className="px-4 pb-3 border-b border-gray-200 bg-gray-50 space-y-2 pt-2 shadow-sm">
            {/* User filter */}
            {userOptions.length > 0 && (
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">{t("common:user")}</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {userOptions.map((user) => {
                    const isActive = selectedUserIds.includes(user.value);
                    return (
                      <button
                        key={user.value}
                        onClick={() => {
                          if (isActive) {
                            setSelectedUserIds(selectedUserIds.filter((id) => id !== user.value));
                          } else {
                            setSelectedUserIds([...selectedUserIds, user.value]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isActive
                            ? "bg-cyan-600 text-white border-cyan-600"
                            : "bg-white text-gray-600 border-gray-200 active:bg-gray-100"
                        }`}
                      >
                        {user.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Client filter */}
            {clientOptions.length > 0 && (
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">{t("common:client")}</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {clientOptions.map((client) => {
                    const isActive = selectedClientIds.includes(client.value);
                    return (
                      <button
                        key={client.value}
                        onClick={() => {
                          if (isActive) {
                            setSelectedClientIds(selectedClientIds.filter((id) => id !== client.value));
                          } else {
                            setSelectedClientIds([...selectedClientIds, client.value]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isActive
                            ? "bg-cyan-600 text-white border-cyan-600"
                            : "bg-white text-gray-600 border-gray-200 active:bg-gray-100"
                        }`}
                      >
                        {client.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs text-red-500 font-medium active:opacity-70"
              >
                <X size={12} />
                {t("common:clearFilters")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-1">
        <div className="relative px-0.5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("tmplanning:searchPlaceholder")}
            className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Task Cards */}
      <div className="px-3 pt-2 space-y-1.5">
        {cardsForDay.map((card) => renderTaskCard(card))}

        {cardsForDay.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            {searchTerm ? t("tmplanning:noUserFound") : t("tmplanning:noTMUser")}
          </div>
        )}
      </div>
    </div>
  );
}

export default TMPlanningMobile;
