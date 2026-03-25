import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  X,
  AlertTriangle,
  Clock,
  Hourglass,
  ClipboardList,
  Send,
  History,
} from "lucide-react";
import { getRouteIcon } from "../../../constants/routeIcons";
import { formatDateLocal, getTimesheetForDate, getTimeOffForDate } from "../../../utils/table/tableUtils";
import { isHoliday as checkIsHoliday } from "../../../utils/date/workingDays";
import { useLocale } from "../../../hooks/useLocale";
import { TimesheetTimeOffConfig } from "../../../utils/ui/timeOffIcons";
import {
  getTotalHoursForTask,
  getBudgetRemaining,
  getBudgetColorStatus,
  formatHours,
} from "../../../utils/budget/budgetUtils";

function TimesheetMobile({
  dateRange,
  allTasksFlat,
  timeOffs,
  holidays,
  editingCell,
  editValue,
  onTimeOffCellClick,
  onTimeOffCellBlur,
  onTimeOffCellNoteClick,
  onEditValueChange,
  onPreviousPeriod,
  onNextPeriod,
  periodLabel,
  onSubmitTimesheets,
  onViewHistory,
  onSaveTimesheetDetails,
}) {
  const { t } = useTranslation(["timesheet", "common"]);
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [detailTask, setDetailTask] = useState(null);
  const [sheetHours, setSheetHours] = useState("");
  const [sheetDetails, setSheetDetails] = useState("");

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
  const selectedDateStr = selectedDate ? formatDateLocal(selectedDate) : "";

  // Day totals for week selector
  const dayTotals = useMemo(() => {
    return dateRange.map((date) => {
      let total = 0;
      for (const task of allTasksFlat) {
        const { hours } = getTimesheetForDate(task, date);
        total += hours;
      }
      for (const type of ["VACATION", "OTHER"]) {
        total += getTimeOffForDate(type, date, timeOffs);
      }
      return total;
    });
  }, [dateRange, allTasksFlat, timeOffs]);

  const selectedDayTotal = dayTotals[selectedDayIdx] || 0;

  // All tasks enriched with day data
  const tasksForDay = useMemo(() => {
    if (!selectedDate) return [];
    const term = searchTerm.trim().toLowerCase();

    return [...allTasksFlat]
      .map((task) => {
        const { hours, isSubmitted, timesheetId, details } = getTimesheetForDate(task, selectedDate);
        return { ...task, dayHours: hours, isSubmitted, timesheetId, details };
      })
      .filter((task) => {
        if (!term) return true;
        return (
          task.client_key?.toLowerCase().includes(term) ||
          task.client_name?.toLowerCase().includes(term) ||
          task.project_key?.toLowerCase().includes(term) ||
          task.project_title?.toLowerCase().includes(term) ||
          task.task_title?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (a.dayHours > 0 && b.dayHours === 0) return -1;
        if (a.dayHours === 0 && b.dayHours > 0) return 1;
        const clientCompare = (a.client_name || "").localeCompare(b.client_name || "");
        if (clientCompare !== 0) return clientCompare;
        const projectCompare = (a.project_key || "").localeCompare(b.project_key || "");
        if (projectCompare !== 0) return projectCompare;
        return (a._taskOrderIndex || 0) - (b._taskOrderIndex || 0);
      });
  }, [allTasksFlat, selectedDate, searchTerm]);

  const isNonWorking = useMemo(() => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDay() === 0 ||
      selectedDate.getDay() === 6 ||
      checkIsHoliday(selectedDate, holidays)
    );
  }, [selectedDate, holidays]);

  const getDayInitial = useCallback(
    (date) => date.toLocaleDateString(locale, { weekday: "short" }).charAt(0).toUpperCase(),
    [locale]
  );

  const getFullDayLabel = useCallback(
    (date) =>
      date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" }),
    [locale]
  );

  // Open bottom sheet with task data
  const openDetailSheet = useCallback(
    (task) => {
      setDetailTask(task);
      setSheetHours(task.dayHours > 0 ? String(task.dayHours) : "");
      setSheetDetails(task.details || "");
    },
    []
  );

  // Save from bottom sheet
  const handleSheetSave = useCallback(() => {
    if (!detailTask || !selectedDate) return;
    const hours = parseFloat(sheetHours) || 0;
    const details = sheetDetails.trim();

    onSaveTimesheetDetails({ hours, details }, detailTask, selectedDate, detailTask.isSubmitted);
    setDetailTask(null);
  }, [detailTask, selectedDate, sheetHours, sheetDetails, onSaveTimesheetDetails]);

  // Budget info for bottom sheet
  const detailData = useMemo(() => {
    if (!detailTask) return null;
    const isTM = detailTask.project_type_id === "TM";

    if (isTM) {
      const tmBefore = detailTask.tm_hours_before_today || 0;
      const tmFrom = detailTask.tm_hours_from_today || 0;
      return { isTM: true, tmHoursBefore: tmBefore, tmHoursFrom: tmFrom, totalHours: tmBefore + tmFrom };
    }

    const actual = getTotalHoursForTask(detailTask);
    const budget = detailTask.budget || 0;
    const remaining = getBudgetRemaining(detailTask);
    const percentage = budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0;
    const colorStatus = getBudgetColorStatus(detailTask);

    let deadline = null;
    if (detailTask.end_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(detailTask.end_date);
      endDate.setHours(0, 0, 0, 0);
      const tenDays = new Date(today);
      tenDays.setDate(tenDays.getDate() + 10);
      if (endDate < today) deadline = { type: "expired", date: endDate };
      else if (endDate <= tenDays) deadline = { type: "upcoming", date: endDate };
      else deadline = { type: "normal", date: endDate };
    }

    return { isTM: false, actual, budget, remaining, percentage, colorStatus, deadline };
  }, [detailTask]);

  const renderTaskCard = useCallback(
    (task) => {
      const isTM = task.project_type_id === "TM";
      const hasHours = task.dayHours > 0;
      const colorStatus = !isTM ? getBudgetColorStatus(task) : "green";

      const hoursColorClass = hasHours
        ? task.isSubmitted
          ? "text-blue-600 bg-blue-50"
          : colorStatus === "red"
            ? "text-red-600 bg-red-50"
            : colorStatus === "orange"
              ? "text-orange-600 bg-orange-50"
              : "text-gray-800 bg-gray-100"
        : "text-gray-300 bg-gray-50";

      return (
        <button
          key={task.task_id}
          onClick={() => openDetailSheet(task)}
          className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl shadow-sm w-full text-left active:bg-gray-50 transition-colors ${
            task.isSubmitted && hasHours ? "border-l-[3px] border-l-blue-400" : ""
          }`}
        >
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: task.symbol_bg_color || task.client_color || "#6366F1",
              color: task.symbol_letter_color || "#FFFFFF",
            }}
          >
            {task.symbol_letter || (task.client_name || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {isTM ? (
              <div className={`text-sm truncate ${hasHours ? "text-gray-700" : "text-gray-400"}`}>
                {task.client_name}
              </div>
            ) : (
              <>
                <div className="text-[11px] text-gray-400 truncate">
                  {task.client_key} · {task.project_title}
                </div>
                <div className={`text-sm font-medium truncate ${hasHours ? "text-gray-800" : "text-gray-500"}`}>
                  {task.task_title}
                </div>
              </>
            )}
          </div>

          {/* Note indicator */}
          {task.details && (
            <FileText size={14} className="text-blue-500 shrink-0" />
          )}

          {/* Hours (read-only) */}
          <div
            className={`min-w-[52px] text-center py-1.5 px-2 rounded-lg text-lg font-bold ${hoursColorClass}`}
          >
            {hasHours ? task.dayHours.toFixed(1) : "-"}
          </div>
        </button>
      );
    },
    [openDetailSheet]
  );

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
                    backgroundColor: detailTask.symbol_bg_color || detailTask.client_color || "#6366F1",
                    color: detailTask.symbol_letter_color || "#FFFFFF",
                  }}
                >
                  {detailTask.symbol_letter || (detailTask.client_name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400">
                    {detailTask.client_key} · {detailTask.project_title}
                  </div>
                  <div className="text-base font-semibold text-gray-800 truncate">
                    {detailTask.project_type_id === "TM" ? detailTask.client_name : detailTask.task_title}
                  </div>
                </div>
                <button
                  onClick={() => setDetailTask(null)}
                  className="p-2 -mr-2 rounded-full text-gray-400 active:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Task name box - same as TimesheetDetailsModal */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {detailTask.project_type_id === "TM"
                    ? detailTask.client_name
                    : `${detailTask.project_title} — ${detailTask.task_title}`}
                </p>
              </div>

              {/* Hours input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("timesheet:hoursRequired")}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
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
                  {t("timesheet:notesOptional")}
                </label>
                <textarea
                  value={sheetDetails}
                  onChange={(e) => setSheetDetails(e.target.value)}
                  placeholder={t("timesheet:notesPlaceholder")}
                  rows={3}
                  disabled={detailTask.isSubmitted}
                  className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm ${
                    detailTask.isSubmitted ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Zero hours note */}
              {!detailTask.isSubmitted && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>{t("timesheet:zeroHoursNote")}</strong> {t("timesheet:zeroHoursHint")}
                  </p>
                </div>
              )}

              {/* Budget info */}
              {detailData && !detailData.isTM && (detailData.budget > 0 || detailData.deadline) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  {detailData.budget > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{t("timesheet:initialEstimate")}</span>
                        <span className="text-xs font-bold text-gray-700">{formatHours(detailData.budget)}h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{t("timesheet:reported")}</span>
                        <span className="text-xs font-bold text-gray-700">{formatHours(detailData.actual)}h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          {detailData.percentage >= 80 && <AlertTriangle size={12} className="text-orange-500" />}
                          {t("timesheet:remainingHours")}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            detailData.colorStatus === "red"
                              ? "text-red-600"
                              : detailData.colorStatus === "orange"
                                ? "text-orange-600"
                                : "text-gray-700"
                          }`}
                        >
                          {formatHours(detailData.remaining)}h
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-400">{t("timesheet:consumption")}</span>
                          <span
                            className={`text-[10px] font-bold ${
                              detailData.colorStatus === "red"
                                ? "text-red-600"
                                : detailData.colorStatus === "orange"
                                  ? "text-orange-600"
                                  : "text-gray-500"
                            }`}
                          >
                            {detailData.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              detailData.colorStatus === "red"
                                ? "bg-red-500"
                                : detailData.colorStatus === "orange"
                                  ? "bg-orange-400"
                                  : "bg-cyan-500"
                            }`}
                            style={{ width: `${Math.min(detailData.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {detailData.deadline && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {detailData.deadline.type === "expired" ? (
                          <AlertTriangle size={12} className="text-red-500" />
                        ) : detailData.deadline.type === "upcoming" ? (
                          <Hourglass size={12} className="text-orange-500" />
                        ) : (
                          <Clock size={12} className="text-gray-400" />
                        )}
                        {detailData.deadline.type === "expired"
                          ? t("timesheet:expired")
                          : detailData.deadline.type === "upcoming"
                            ? t("timesheet:upcoming")
                            : t("timesheet:deadline")}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          detailData.deadline.type === "expired"
                            ? "text-red-600"
                            : detailData.deadline.type === "upcoming"
                              ? "text-orange-600"
                              : "text-gray-700"
                        }`}
                      >
                        {detailData.deadline.date.toLocaleDateString(locale)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TM info */}
              {detailData && detailData.isTM && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{t("timesheet:hoursDelivered")}</span>
                    <span className="text-xs font-bold text-gray-700">{formatHours(detailData.tmHoursBefore)}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{t("timesheet:hoursPlanned")}</span>
                    <span className="text-xs font-bold text-gray-700">{formatHours(detailData.tmHoursFrom)}h</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                    <span className="text-xs font-semibold text-gray-600">{t("timesheet:totalLabel")}</span>
                    <span className="text-sm font-extrabold text-gray-800">{formatHours(detailData.totalHours)}h</span>
                  </div>
                </div>
              )}

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
        {/* Page Title */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
          <h1 className="text-base font-bold text-gray-800 flex items-center gap-2">
            {getRouteIcon("/timesheet") &&
              React.createElement(getRouteIcon("/timesheet"), { size: 18 })}
            <span>{t("timesheet:title")}</span>
          </h1>
          <div className="flex items-center gap-1">
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="p-1.5 rounded-lg text-cyan-600 active:bg-cyan-50 transition-colors"
                title={t("timesheet:viewHistory")}
              >
                <History size={20} />
              </button>
            )}
            {onSubmitTimesheets && (
              <button
                onClick={onSubmitTimesheets}
                className="p-1.5 rounded-lg text-cyan-600 active:bg-cyan-50 transition-colors"
                title={t("timesheet:submitTimesheets")}
              >
                <Send size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Period Navigator */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-cyan-700 text-white">
          <button onClick={onPreviousPeriod} className="p-2 -ml-2 rounded-full active:bg-cyan-600 transition-colors">
            <ChevronLeft size={22} />
          </button>
          <span className="text-sm font-semibold tracking-wide">{periodLabel}</span>
          <button onClick={onNextPeriod} className="p-2 -mr-2 rounded-full active:bg-cyan-600 transition-colors">
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Day Selector */}
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
            const isFullDay = total >= 8;
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
                      ? isFullDay ? "text-green-600" : hasHours ? "text-cyan-700" : "text-gray-400"
                      : isFullDay ? "text-green-300" : hasHours ? "text-white" : "text-cyan-400/50"
                  }`}
                >
                  {hasHours ? total.toFixed(1) : "·"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Day Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
          <span className="text-sm font-medium text-gray-600 capitalize">
            {selectedDate && getFullDayLabel(selectedDate)}
          </span>
          <div
            className={`text-lg font-extrabold ${
              selectedDayTotal > 8
                ? "text-red-500"
                : selectedDayTotal >= 8
                  ? "text-green-600"
                  : selectedDayTotal > 0
                    ? "text-cyan-700"
                    : "text-gray-300"
            }`}
          >
            {selectedDayTotal > 0 ? `${selectedDayTotal.toFixed(1)}h` : "-"}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-1">
        <div className="relative px-0.5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("timesheet:searchPlaceholder")}
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

      {/* Task List */}
      <div className="px-3 pt-2 space-y-1.5">
        {tasksForDay.map((task) => renderTaskCard(task))}

        {/* Time Off */}
        {!isNonWorking &&
          ["VACATION", "OTHER"].map((type) => {
            const config = TimesheetTimeOffConfig[type];
            const Icon = config.icon;
            const hours = getTimeOffForDate(type, selectedDate, timeOffs);
            const editing = editingCell === `timeoff-${type}-${selectedDateStr}`;

            return (
              <div
                key={type}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${config.bgColor} ${
                  editing ? "ring-2 ring-blue-400 shadow-md" : "shadow-sm"
                }`}
              >
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-white/50">
                  <Icon size={18} className={config.textColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
                </div>

                {editing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      min="0"
                      value={editValue}
                      onChange={(e) => onEditValueChange(e.target.value)}
                      onBlur={() => onTimeOffCellBlur(type, selectedDate, hours)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.target.blur();
                      }}
                      onWheel={(e) => e.target.blur()}
                      className={`w-16 text-center text-lg font-bold border-2 ${config.inputBorderColor} rounded-lg py-1 bg-white/80 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onTimeOffCellNoteClick(type, selectedDate, editValue)}
                      className={`shrink-0 p-1.5 rounded-lg ${config.textColor} bg-white/60 active:bg-white/80 transition-colors`}
                    >
                      <FileText size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onTimeOffCellClick(type, selectedDate, hours)}
                    className={`min-w-[52px] text-center py-1.5 px-2 rounded-lg text-lg font-bold ${config.textColor} bg-white/40 active:bg-white/60 transition-colors`}
                  >
                    {hours > 0 ? hours.toFixed(1) : "-"}
                  </button>
                )}
              </div>
            );
          })}

        {tasksForDay.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            {t("timesheet:noTimesheetData")}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimesheetMobile;
