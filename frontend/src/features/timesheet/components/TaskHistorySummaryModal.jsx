import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Download } from "lucide-react";
import BaseModal from "../../../shared/components/BaseModal";
import Button from "../../../shared/ui/Button";
import DateInput from "../../../shared/ui/DateInput";
import { useLazyGetTaskHistoryQuery } from "../api/timesheetEndpoints";
import { exportTaskHistoryToExcel } from "../../../utils/export/excel";
import logger from "../../../utils/logger";
import { useLocale } from "../../../hooks/useLocale";

function TaskHistorySummaryModal({ isOpen, onClose, task }) {
  const { t } = useTranslation(["timesheet", "common"]);
  const locale = useLocale();
  const [getTaskHistory, { data: historyData, isLoading }] =
    useLazyGetTaskHistoryQuery();

  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedNote, setExpandedNote] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen && task?.task_id) {
      getTaskHistory(task.task_id, { preferCacheValue: false });
      setFilterStart("");
      setFilterEnd("");
      setFilterStatus("all");
      setExpandedNote(null);
    }
  }, [isOpen, task?.task_id, getTaskHistory]);

  const filteredEntries = useMemo(() => {
    if (!historyData?.entries?.length) return [];
    return historyData.entries.filter((entry) => {
      if (!entry.hours || entry.hours === 0) return false;
      if (filterStart && entry.date < filterStart) return false;
      if (filterEnd && entry.date > filterEnd) return false;
      if (filterStatus === "submitted" && !entry.is_submitted) return false;
      if (filterStatus === "not_submitted" && entry.is_submitted) return false;
      return true;
    });
  }, [historyData, filterStart, filterEnd, filterStatus]);

  const filteredTotal = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + e.hours, 0);
  }, [filteredEntries]);

  const monthlySummary = useMemo(() => {
    const summary = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

      const monthHours = filteredEntries
        .filter((e) => e.date.startsWith(monthKey))
        .reduce((sum, e) => sum + e.hours, 0);

      const monthCount = filteredEntries
        .filter((e) => e.date.startsWith(monthKey))
        .length;

      summary.push({
        monthShort: monthDate.toLocaleDateString(locale, { month: "short" }).replace(".", ""),
        year: monthDate.getFullYear(),
        hours: monthHours,
        count: monthCount,
      });
    }

    return summary;
  }, [filteredEntries, locale]);

  const handleExport = async () => {
    if (!filteredEntries.length) return;
    setIsExporting(true);
    try {
      const taskMeta = historyData?.task || task;
      await exportTaskHistoryToExcel(
        filteredEntries,
        taskMeta,
        filterStart || null,
        filterEnd || null
      );
    } catch (error) {
      logger.error("Errore durante l'export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const taskInfo = historyData?.task || task;
  const isTM = taskInfo?.project_type_id === "TM";
  const headerLabel = isTM
    ? taskInfo?.client_name
    : `${taskInfo?.client_key}.${taskInfo?.project_key}.${taskInfo?.task_number}`;
  const headerTitle = isTM ? "" : taskInfo?.task_title;
  const hasFilter = filterStart || filterEnd || filterStatus !== "all";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("timesheet:taskHistory")}
      icon={<ExternalLink className="text-cyan-600" size={24} />}
      size="2xl"
      showFooter={false}
      noBodyScroll
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">{t("common:loading")}</div>
        </div>
      ) : !historyData?.entries?.length ? (
        <div className="text-center py-8 text-gray-500">
          {t("timesheet:taskHistoryNoEntries")}
        </div>
      ) : (
        <div className="flex flex-col gap-4 min-h-0 flex-1">
          {/* Task Info Header */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div
              className="w-1.5 h-10 rounded-sm shrink-0"
              style={{ backgroundColor: taskInfo?.symbol_bg_color || taskInfo?.client_color || "#6366F1" }}
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">
                {headerLabel}
              </div>
              {headerTitle && (
                <div className="text-xs text-gray-600 truncate">{headerTitle}</div>
              )}
              <div className="text-xs text-gray-500 truncate">
                {taskInfo?.client_name} - {taskInfo?.project_title}
              </div>
            </div>
            <div className="ml-auto text-right shrink-0">
              <div className="text-lg font-bold text-cyan-700">
                {historyData.totalHours.toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500">
                {t("timesheet:taskHistoryTotal")}
              </div>
              {!isTM && taskInfo?.budget > 0 && (
                <div className="text-xs text-gray-500">
                  {t("timesheet:taskHistoryBudget")}: {taskInfo.budget.toFixed(1)}h
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("common:start")}
              </label>
              <DateInput
                value={filterStart}
                onChange={(val) => setFilterStart(val)}
                className="w-full"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("common:end")}
              </label>
              <DateInput
                value={filterEnd}
                onChange={(val) => setFilterEnd(val)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t("timesheet:taskHistoryStatus")}
              </label>
              <div className="flex rounded-md border border-gray-300 overflow-hidden">
                {[
                  { key: "all", label: t("timesheet:taskHistoryFilterAll") },
                  { key: "submitted", label: t("timesheet:taskHistoryFilterSubmitted") },
                  { key: "not_submitted", label: t("timesheet:taskHistoryFilterNotSubmitted") },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setFilterStatus(opt.key)}
                    className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      filterStatus === opt.key
                        ? "bg-cyan-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {hasFilter && (
              <button
                onClick={() => { setFilterStart(""); setFilterEnd(""); setFilterStatus("all"); }}
                className="text-xs text-cyan-600 hover:text-cyan-800 underline pb-2"
              >
                {t("timesheet:clearFilters")}
              </button>
            )}
            {hasFilter && (
              <div className="text-xs text-gray-500 pb-2 ml-auto">
                {filteredEntries.length} {t("timesheet:entries").toLowerCase()} &middot; {filteredTotal.toFixed(1)}h
              </div>
            )}
          </div>

          {/* Monthly Summary Table (horizontal, like TimeOffSummaryModal) */}
          {historyData?.entries?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                {t("timesheet:taskHistoryMonthly")}
              </h3>
              <div className="rounded-lg border border-gray-200 overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-cyan-50">
                      {monthlySummary.map((m, idx) => (
                        <th key={idx} className="px-1 py-2 text-center text-xs font-semibold text-cyan-700 capitalize">
                          <div>{m.monthShort}</div>
                          <div className="text-[10px] font-normal opacity-70">{m.year}</div>
                        </th>
                      ))}
                      <th className="px-1 py-2 text-center text-xs font-bold text-cyan-700 border-l-2 border-cyan-200">
                        Tot
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {monthlySummary.map((m, idx) => (
                        <td
                          key={idx}
                          className={`px-1 py-2 text-center text-sm font-medium ${
                            m.hours > 0 ? "bg-cyan-50 text-cyan-700" : "bg-white text-gray-400"
                          }`}
                        >
                          {m.hours > 0 ? m.hours.toFixed(1) : "-"}
                        </td>
                      ))}
                      <td className="px-1 py-2 text-center text-sm font-bold text-cyan-700 bg-cyan-50 border-l-2 border-cyan-200">
                        {filteredTotal.toFixed(1)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Entries List */}
          <div className="flex flex-col min-h-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 shrink-0">
              {t("timesheet:taskHistoryEntries")}
              <span className="ml-2 text-xs text-gray-500 font-normal">
                ({filteredEntries.length})
              </span>
            </h3>
            <div className="rounded-lg border border-gray-200 overflow-auto min-h-0 flex-1">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-32" />
                  <col className="w-14" />
                  <col />
                  <col className="w-36" />
                </colgroup>
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-600">
                      {t("timesheet:taskHistoryDate")}
                    </th>
                    <th className="px-3 py-1.5 text-center text-xs font-semibold text-gray-600">
                      {t("timesheet:taskHistoryHours")}
                    </th>
                    <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-600">
                      {t("timesheet:taskHistoryDetails")}
                    </th>
                    <th className="px-3 py-1.5 text-center text-xs font-semibold text-gray-600">
                      {t("timesheet:taskHistoryStatus")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, idx) => (
                    <tr
                      key={entry.timesheet_id || idx}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-3 py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString(locale, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-1.5 text-center text-xs font-semibold text-cyan-700">
                        {entry.hours.toFixed(1)}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-gray-600">
                        {entry.details ? (
                          <div
                            className={`cursor-pointer hover:text-gray-800 ${
                              expandedNote === (entry.timesheet_id || idx)
                                ? "whitespace-pre-wrap break-words"
                                : "truncate"
                            }`}
                            onClick={() =>
                              setExpandedNote(
                                expandedNote === (entry.timesheet_id || idx)
                                  ? null
                                  : (entry.timesheet_id || idx)
                              )
                            }
                            title={expandedNote === (entry.timesheet_id || idx) ? "" : entry.details}
                          >
                            {entry.details}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-center whitespace-nowrap">
                        {entry.is_submitted ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {t("timesheet:taskHistorySubmitted")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                            {t("timesheet:taskHistoryNotSubmitted")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 shrink-0">
            <Button
              onClick={handleExport}
              loading={isExporting}
              disabled={!filteredEntries.length}
              color="green"
              size="md"
              icon={Download}
            >
              {t("common:export")}
            </Button>
            <Button onClick={onClose} variant="outline" color="gray" size="md">
              {t("common:close")}
            </Button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}

export default TaskHistorySummaryModal;
