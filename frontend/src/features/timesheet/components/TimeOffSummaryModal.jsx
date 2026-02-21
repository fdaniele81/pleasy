import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['timesheet', 'common']);
  const locale = useLocale();
  const [getTimeOffs, { data: timeOffData, isLoading }] = useLazyGetTimeOffsQuery();

  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);

    const endDate = new Date(today.getFullYear(), today.getMonth() + 12, 0);

    return {
      start: toISODate(startDate),
      end: toISODate(endDate)
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && dateRange.start && dateRange.end) {
      getTimeOffs({ startDate: dateRange.start, endDate: dateRange.end }, { preferCacheValue: false });

      const today = new Date();
      const threeMonthsLater = new Date(today);
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

      setExportStartDate(toISODate(today));
      setExportEndDate(toISODate(threeMonthsLater));
    }
  }, [isOpen, dateRange, getTimeOffs]);

  const filteredTimeOffs = useMemo(() => {
    if (!timeOffData?.timeOffs) return [];
    return timeOffData.timeOffs.filter(to => to.time_off_type_id === timeOffType);
  }, [timeOffData, timeOffType]);

  const monthlySummary = useMemo(() => {
    const summary = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

      const monthHours = filteredTimeOffs
        .filter(to => to.date.startsWith(monthKey))
        .reduce((sum, to) => sum + to.hours, 0);

      const monthDetails = filteredTimeOffs
        .filter(to => to.date.startsWith(monthKey))
        .map(to => ({
          date: to.date,
          hours: to.hours,
          details: to.details
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      summary.push({
        monthShort: monthDate.toLocaleDateString(locale, { month: 'short' }).replace('.', ''),
        year: monthDate.getFullYear(),
        hours: monthHours,
        details: monthDetails
      });
    }

    return summary;
  }, [filteredTimeOffs]);

  const totalHours = useMemo(() => {
    return monthlySummary.reduce((sum, month) => sum + month.hours, 0);
  }, [monthlySummary]);

  const handleExport = async () => {
    if (!exportStartDate || !exportEndDate) return;

    setIsExporting(true);
    try {
      const result = await getTimeOffs({
        startDate: exportStartDate,
        endDate: exportEndDate
      }).unwrap();

      const timeOffsToExport = result.timeOffs?.filter(
        to => to.time_off_type_id === timeOffType
      ) || [];

      await exportUserTimeOffToExcel(
        timeOffsToExport,
        timeOffType,
        exportStartDate,
        exportEndDate
      );
    } catch (error) {
      logger.error('Errore durante l\'export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const config = {
    VACATION: {
      title: t('timesheet:vacationSummary'),
      icon: <Calendar className="text-cyan-600" size={24} />,
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200"
    },
    OTHER: {
      title: t('timesheet:otherSummary'),
      icon: <Calendar className="text-cyan-600" size={24} />,
      color: "yellow",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200"
    }
  };

  const typeConfig = config[timeOffType] || config.VACATION;

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={typeConfig.title}
      icon={typeConfig.icon}
      size="xl"
      showFooter={false}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">{t('common:loading')}</div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {t('timesheet:next12months')}
            </h3>
            <div className="rounded-lg border border-gray-200">
              <table className="w-full table-fixed">
                <thead>
                  <tr className={`${typeConfig.bgColor}`}>
                    {monthlySummary.map((month, idx) => (
                      <th key={idx} className={`px-1 py-2 text-center text-xs font-semibold ${typeConfig.textColor} capitalize`}>
                        <div>{month.monthShort}</div>
                        <div className="text-[10px] font-normal opacity-70">{month.year}</div>
                      </th>
                    ))}
                    <th className={`px-1 py-2 text-center text-xs font-bold ${typeConfig.textColor} border-l-2 ${typeConfig.borderColor}`}>
                      Tot
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {monthlySummary.map((month, idx) => (
                      <td
                        key={idx}
                        className={`px-1 py-3 text-center text-sm font-medium ${
                          month.hours > 0 ? `${typeConfig.bgColor} ${typeConfig.textColor}` : "bg-white text-gray-400"
                        }`}
                      >
                        {month.hours > 0 ? month.hours.toFixed(1) : "-"}
                      </td>
                    ))}
                    <td className={`px-1 py-3 text-center text-sm font-bold ${typeConfig.textColor} ${typeConfig.bgColor} border-l-2 ${typeConfig.borderColor}`}>
                      {totalHours.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${typeConfig.bgColor} ${typeConfig.borderColor} border`}>
            <h3 className={`text-sm font-semibold ${typeConfig.textColor} mb-3`}>
              {t('timesheet:exportExcel')}
            </h3>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('common:start')}
                </label>
                <DateInput
                  value={exportStartDate}
                  onChange={(val) => setExportStartDate(val)}
                  className="w-full"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('common:end')}
                </label>
                <DateInput
                  value={exportEndDate}
                  onChange={(val) => setExportEndDate(val)}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleExport}
                loading={isExporting}
                disabled={!exportStartDate || !exportEndDate || exportStartDate > exportEndDate}
                color="green"
                size="md"
                icon={Download}
              >
                {t('common:export')}
              </Button>
            </div>
            {exportStartDate && exportEndDate && exportStartDate > exportEndDate && (
              <p className="mt-2 text-xs text-red-600">
                {t('common:startBeforeEnd')}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="outline"
              color="gray"
              size="md"
            >
              {t('common:close')}
            </Button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}

export default TimeOffSummaryModal;
