import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, Eye, ChevronLeft, ChevronRight, Calendar, FolderKanban, ListTodo } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';
import TransposedTimesheetGrid from '../../../shared/components/TransposedTimesheetGrid';
import { useGetSnapshotDetailsQuery } from '../api/snapshotEndpoints';
import { useGetHolidaysQuery } from '../../holidays/api/holidayEndpoints';
import { useLocale } from '../../../hooks/useLocale';
import { translateError } from '../../../utils/translateError';
import { isWeekend, isHoliday } from '../../../utils/date/workingDays';

const SnapshotDetailsModal = ({ isOpen, onClose, snapshotId }) => {
  const { t } = useTranslation(['timesheetsnapshots', 'common']);
  const locale = useLocale();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  const { data: snapshotDetails, isLoading: detailsLoading, error: detailsError } = useGetSnapshotDetailsQuery(
    snapshotId,
    {
      skip: !isOpen || !snapshotId,
      refetchOnMountOrArgChange: true
    }
  );
  const { data: holidays = [] } = useGetHolidaysQuery();

  const handleClose = () => {
    setCurrentTaskIndex(0);
    onClose();
  };

  const tasks = snapshotDetails?.tasks || [];

  const getTotalTimesheets = () => {
    return tasks.reduce((sum, task) => sum + task.timesheets.length, 0);
  };

  const getTotalHours = () => {
    return tasks.reduce((sum, task) => sum + task.total_hours, 0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  }, [locale]);

  const isNonWorkingDay = useCallback((dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return isWeekend(date) || isHoliday(date, holidays);
  }, [holidays]);

  const goToPrev = () => {
    setCurrentTaskIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentTaskIndex(prev => Math.min(tasks.length - 1, prev + 1));
  };

  const currentTask = tasks[currentTaskIndex];

  const sortedTimesheets = useMemo(() => {
    if (!currentTask?.timesheets) return [];
    return [...currentTask.timesheets].sort((a, b) => a.timesheet_date.localeCompare(b.timesheet_date));
  }, [currentTask]);

  const taskCount = tasks.length;
  const modalSize = taskCount <= 3 ? 'xl' : taskCount <= 6 ? '2xl' : '3xl';

  const customFooter = (
    <Button onClick={handleClose} variant="outline" color="gray" size="md">
      {t('common:close')}
    </Button>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('timesheetsnapshots:submittedTimesheetDetails')}
      icon={<Eye className="text-cyan-600" size={28} />}
      size={modalSize}
      customFooter={customFooter}
      showFooter={true}
    >
      {detailsLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-xl text-gray-600">{t('common:loading')}</div>
        </div>
      )}

      {detailsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-3">
          <span>{detailsError?.data ? translateError(detailsError.data, t('timesheetsnapshots:loadError')) : t('timesheetsnapshots:loadError')}</span>
        </div>
      )}

      {!detailsLoading && !detailsError && snapshotDetails && tasks.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center gap-3">
          <FileText size={20} />
          <span>{t('timesheetsnapshots:noEntriesInSnapshot')}</span>
        </div>
      )}

      {!detailsLoading && !detailsError && snapshotDetails && tasks.length > 0 && (
        <div className="flex flex-col gap-4 h-full min-h-0">
          {/* Summary bar */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="hidden sm:inline">{t('timesheetsnapshots:submittedAt')}</span>
              <span className="font-semibold text-gray-800">{formatDateTime(snapshotDetails.snapshot?.submitted_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="hidden sm:inline">{t('timesheetsnapshots:entries')}</span>
              <span className="font-semibold text-gray-800">{getTotalTimesheets()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="hidden sm:inline">{t('timesheetsnapshots:totalHours')}</span>
              <span className="font-semibold text-gray-800">{getTotalHours().toFixed(1)}h</span>
            </div>
          </div>

          {/* Desktop: TransposedTimesheetGrid */}
          <div className="hidden lg:flex flex-col flex-1 min-h-0">
            <TransposedTimesheetGrid
              tasks={tasks}
              holidays={holidays}
            />
          </div>

          {/* Mobile: Task-by-task navigation with arrows */}
          <div className="lg:hidden flex flex-col flex-1 min-h-0">
            {/* Navigation header */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-3">
              <button
                onClick={goToPrev}
                disabled={currentTaskIndex === 0}
                className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-cyan-600 hover:bg-cyan-50 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
                aria-label={t('timesheetsnapshots:previousTask')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1 px-2">
                {currentTask && (
                  <>
                    <div className="flex items-center gap-1.5 max-w-full">
                      <div
                        className="w-5 h-5 min-w-5 min-h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold leading-none"
                        style={{
                          backgroundColor: currentTask.symbol_bg_color || currentTask.client_color || '#6366F1',
                          color: currentTask.symbol_letter_color || '#FFFFFF',
                        }}
                      >
                        {currentTask.symbol_letter || (currentTask.client_name || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-gray-800 truncate">
                        {currentTask.project_title || currentTask.project_key}
                      </span>
                    </div>
                    {currentTask.project_type_id !== 'TM' && currentTask.task_title && (
                      <span className="text-[11px] text-gray-500 truncate max-w-full">
                        {currentTask.task_title}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {currentTaskIndex + 1} / {tasks.length}
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={goToNext}
                disabled={currentTaskIndex === tasks.length - 1}
                className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-cyan-600 hover:bg-cyan-50 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
                aria-label={t('timesheetsnapshots:nextTask')}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Dot indicators */}
            {tasks.length > 1 && tasks.length <= 15 && (
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {tasks.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTaskIndex(idx)}
                    className={`rounded-full transition-all ${
                      idx === currentTaskIndex
                        ? 'w-2.5 h-2.5 bg-cyan-600'
                        : 'w-1.5 h-1.5 bg-gray-300'
                    }`}
                    aria-label={`${t('timesheetsnapshots:goToTask')} ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Task hours summary */}
            {currentTask && (
              <div className="flex items-center justify-between px-3 py-2 bg-cyan-50 rounded-lg mb-3">
                <span className="text-xs text-gray-600">
                  {t('timesheetsnapshots:entries')} <span className="font-semibold text-gray-800">{currentTask.timesheets.length}</span>
                </span>
                <span className="text-sm font-bold text-cyan-700">
                  {currentTask.total_hours.toFixed(1)}h
                </span>
              </div>
            )}

            {/* Timesheet entries list */}
            <div className="flex-1 overflow-y-auto min-h-0 -mx-1">
              {sortedTimesheets.map((ts) => {
                const nonWorking = isNonWorkingDay(ts.timesheet_date);
                return (
                  <div
                    key={ts.timesheet_id}
                    className={`flex items-center justify-between px-3 py-2.5 border-b border-gray-100 ${
                      nonWorking ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className={`h-3.5 w-3.5 shrink-0 ${nonWorking ? 'text-gray-400' : 'text-cyan-500'}`} />
                      <span className={`text-sm ${nonWorking ? 'text-gray-500' : 'text-gray-700'}`}>
                        {formatDate(ts.timesheet_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ts.details && (
                        <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" title={ts.details} />
                      )}
                      <span className={`text-sm font-semibold tabular-nums ${nonWorking ? 'text-gray-600' : 'text-gray-800'}`}>
                        {ts.hours.toFixed(ts.hours % 1 === 0 ? 0 : 1)}h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default SnapshotDetailsModal;
