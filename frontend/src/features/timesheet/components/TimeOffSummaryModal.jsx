import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Download } from "lucide-react";
import BaseModal from "../../../shared/components/BaseModal";
import Button from "../../../shared/ui/Button";
import DateInput from "../../../shared/ui/DateInput";
import { useLazyGetTimeOffsQuery } from "../api/timesheetEndpoints";
import { toISODate } from "../../../utils/date/dateUtils";
import { exportUserTimeOffToExcel } from "../../../utils/export/excel";
import logger from "../../../utils/logger";
import { useLocale } from "../../../hooks/useLocale";

function TimeOffSummaryModal({ isOpen, onClose, timeOffType }) {
  const { t } = useTranslation(["timesheet", "common"]);
  const locale = useLocale();
  const [getTimeOffs, { data: timeOffData, isLoading }] =
    useLazyGetTimeOffsQuery();

  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [expandedNote, setExpandedNote] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 12, 0);
    return { start: toISODate(startDate), end: toISODate(endDate) };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && dateRange.start && dateRange.end) {
      getTimeOffs(
        { startDate: dateRange.start, endDate: dateRange.end },
        { preferCacheValue: false }
      );
      setFilterStart("");
      setFilterEnd("");
      setExpandedNote(null);
    }
  }, [isOpen, dateRange, getTimeOffs]);

  const allTypeEntries = useMemo(() => {
    if (!timeOffData?.timeOffs) return [];
    return timeOffData.timeOffs.filter(
      (to) => to.time_off_type_id === timeOffType
    );
  }, [timeOffData, timeOffType]);

  const filteredEntries = useMemo(() => {
    return allTypeEntries.filter((entry) => {
      if (!entry.hours || entry.hours === 0) return false;
      if (filterStart && entry.date < filterStart) return false;
      if (filterEnd && entry.date > filterEnd) return false;
      return true;
    });
  }, [allTypeEntries, filterStart, filterEnd]);

  const filteredTotal = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + e.hours, 0);
  }, [filteredEntries]);

  const monthlySummary = useMemo(() => {
    const summary = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(
        today.getFullYear(),
        today.getMonth() + i,
        1
      );
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

      const monthHours = filteredEntries
        .filter((e) => e.date.startsWith(monthKey))
        .reduce((sum, e) => sum + e.hours, 0);

      summary.push({
        monthShort: monthDate
          .toLocaleDateString(locale, { month: "short" })
          .replace(".", ""),
        year: monthDate.getFullYear(),
        hours: monthHours,
      });
    }

    return summary;
  }, [filteredEntries, locale]);

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEntries]);

  const handleExport = async () => {
    if (!filteredEntries.length) return;

    setIsExporting(true);
    try {
      await exportUserTimeOffToExcel(
        filteredEntries,
        timeOffType,
        filterStart || dateRange.start,
        filterEnd || dateRange.end
      );
    } catch (error) {
      logger.error("Errore durante l'export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const config = {
    VACATION: {
      title: t("timesheet:vacationSummary"),
      icon: <Calendar className="text-cyan-600" size={24} />,
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    OTHER: {
      title: t("timesheet:otherSummary"),
      icon: <Calendar className="text-cyan-600" size={24} />,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
    },
  };

  const typeConfig = config[timeOffType] || config.VACATION;
  const hasFilter = filterStart || filterEnd;

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={typeConfig.title}
      icon={typeConfig.icon}
      size="2xl"
      showFooter={false}
      noBodyScroll
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">{t("common:loading")}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 min-h-0 flex-1">
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
            {hasFilter && (
              <button
                onClick={() => {
                  setFilterStart("");
                  setFilterEnd("");
                }}
                className="text-xs text-cyan-600 hover:text-cyan-800 underline pb-2"
              >
                {t("timesheet:clearFilters")}
              </button>
            )}
            {hasFilter && (
              <div className="text-xs text-gray-500 pb-2 ml-auto">
                {filteredEntries.length}{" "}
                {t("timesheet:entries").toLowerCase()} &middot;{" "}
                {filteredTotal.toFixed(1)}h
              </div>
            )}
          </div>

          {/* Monthly Summary Table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {t("timesheet:next12months")}
            </h3>
            <div className="rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className={typeConfig.bgColor}>
                    {monthlySummary.map((m, idx) => (
                      <th
                        key={idx}
                        className={`px-1 py-2 text-center text-xs font-semibold ${typeConfig.textColor} capitalize`}
                      >
                        <div>{m.monthShort}</div>
                        <div className="text-[10px] font-normal opacity-70">
                          {m.year}
                        </div>
                      </th>
                    ))}
                    <th
                      className={`px-1 py-2 text-center text-xs font-bold ${typeConfig.textColor} border-l-2 ${typeConfig.borderColor}`}
                    >
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
                          m.hours > 0
                            ? `${typeConfig.bgColor} ${typeConfig.textColor}`
                            : "bg-white text-gray-400"
                        }`}
                      >
                        {m.hours > 0 ? m.hours.toFixed(1) : "-"}
                      </td>
                    ))}
                    <td
                      className={`px-1 py-2 text-center text-sm font-bold ${typeConfig.textColor} ${typeConfig.bgColor} border-l-2 ${typeConfig.borderColor}`}
                    >
                      {filteredTotal.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Entries List */}
          <div className="flex flex-col min-h-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 shrink-0">
              {t("timesheet:timeOffEntries")}
              <span className="ml-2 text-xs text-gray-500 font-normal">
                ({sortedEntries.length})
              </span>
            </h3>
            {sortedEntries.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                {t("timesheet:timeOffNoEntries")}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-auto min-h-0 flex-1">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-32" />
                    <col className="w-14" />
                    <col />
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
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((entry, idx) => (
                      <tr
                        key={idx}
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
                                expandedNote === idx
                                  ? "whitespace-pre-wrap break-words"
                                  : "truncate"
                              }`}
                              onClick={() =>
                                setExpandedNote(
                                  expandedNote === idx ? null : idx
                                )
                              }
                              title={
                                expandedNote === idx ? "" : entry.details
                              }
                            >
                              {entry.details}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

export default TimeOffSummaryModal;
