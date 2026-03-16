import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, Calendar, AlertCircle } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';
import DateInput from '../../../shared/ui/DateInput';
import TimesheetGridTable from '../../../shared/components/TimesheetGridTable';
import { formatDateLocal } from '../../../utils/table/tableUtils';
import { useLazyGetPreviewSubmissionQuery } from '../api/timesheetEndpoints';
import { useGetHolidaysQuery } from '../../holidays/api/holidayEndpoints';

const SubmissionPreviewModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation(['timesheet', 'common']);
  const [fetchPreview, { data: previewTasks = [], isLoading: previewLoading }] = useLazyGetPreviewSubmissionQuery();
  const { data: holidays = [] } = useGetHolidaysQuery();
  const [selectedTimesheetIds, setSelectedTimesheetIds] = useState(new Set());
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const filteredPreviewTasks = useMemo(() => {
    if (!filterStartDate && !filterEndDate) return previewTasks;

    return previewTasks
      .map(task => {
        const filteredTimesheets = task.timesheets.filter(ts => {
          if (filterStartDate && ts.timesheet_date < filterStartDate) return false;
          if (filterEndDate && ts.timesheet_date > filterEndDate) return false;
          return true;
        });
        if (filteredTimesheets.length === 0) return null;
        return {
          ...task,
          timesheets: filteredTimesheets,
          total_hours: filteredTimesheets.reduce((sum, ts) => sum + ts.hours, 0),
        };
      })
      .filter(Boolean);
  }, [previewTasks, filterStartDate, filterEndDate]);

  const filteredTimesheetIds = useMemo(() => {
    const ids = new Set();
    filteredPreviewTasks.forEach(task => {
      task.timesheets.forEach(ts => {
        ids.add(ts.timesheet_id);
      });
    });
    return ids;
  }, [filteredPreviewTasks]);

  useEffect(() => {
    if (isOpen) {
      fetchPreview();
      setSelectedTimesheetIds(new Set());
      setFilterStartDate('');
      setFilterEndDate(formatDateLocal(new Date()));
    }
  }, [isOpen, fetchPreview]);

  useEffect(() => {
    setSelectedTimesheetIds(prev => {
      const next = new Set();
      prev.forEach(id => {
        if (filteredTimesheetIds.has(id)) next.add(id);
      });
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [filteredTimesheetIds]);

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedTimesheetIds));
  };

  const getSelectedHours = () => {
    let total = 0;
    filteredPreviewTasks.forEach(task => {
      task.timesheets.forEach(ts => {
        if (selectedTimesheetIds.has(ts.timesheet_id)) {
          total += ts.hours;
        }
      });
    });
    return total;
  };

  const getSelectedCount = () => {
    return selectedTimesheetIds.size;
  };

  const getTotalHours = () => {
    return filteredPreviewTasks.reduce((sum, task) => sum + task.total_hours, 0);
  };

  const clearDateFilters = useCallback(() => {
    setFilterStartDate('');
    setFilterEndDate('');
  }, []);


  const customFooter = (
    <>
      <Button onClick={handleClose} variant="outline" color="gray" size="md">
        {t('common:cancel')}
      </Button>
      <Button
        onClick={handleConfirm}
        disabled={filteredPreviewTasks.length === 0 || selectedTimesheetIds.size === 0}
        color="cyan"
        size="md"
      >
        {t('timesheet:confirmSubmission')}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('timesheet:submissionPreviewTitle')}
      icon={<AlertCircle className="text-cyan-600" size={28} />}
      size="3xl"
      customFooter={customFooter}
      showFooter={true}
    >
      {previewLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-xl text-gray-600">{t('common:loading')}</div>
        </div>
      )}

      {!previewLoading && previewTasks.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{t('timesheet:noTimesheetToSubmit')}</span>
        </div>
      )}

      {!previewLoading && previewTasks.length > 0 && (
        <div className="flex flex-col gap-3 h-full min-h-0">
          <div className="bg-cyan-50 rounded-lg px-4 py-3 border border-cyan-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-600 shrink-0" />
              <div className="min-w-[130px]">
                <DateInput
                  value={filterStartDate}
                  onChange={setFilterStartDate}
                  className="w-full"
                />
              </div>
              <span className="text-gray-400 text-xs">—</span>
              <div className="min-w-[130px]">
                <DateInput
                  value={filterEndDate}
                  onChange={setFilterEndDate}
                  className="w-full"
                />
              </div>
              {(filterStartDate || filterEndDate) && (
                <button
                  onClick={clearDateFilters}
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-medium ml-1"
                >
                  {t('common:clearAll')}
                </button>
              )}
            </div>

            <div className="flex items-center gap-5 text-sm text-gray-700">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-cyan-600" />
                <span className="font-medium">{t('timesheet:entriesLabel')}</span>
                <span className="font-semibold">{getSelectedCount()}</span>
                <span className="text-gray-500">/ {filteredTimesheetIds.size}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-cyan-600" />
                <span className="font-medium">{t('timesheet:hoursLabel')}</span>
                <span className="font-semibold">{getSelectedHours().toFixed(1)}h</span>
                <span className="text-gray-500">/ {getTotalHours().toFixed(1)}h</span>
              </div>
            </div>
          </div>

          {selectedTimesheetIds.size === 0 && (
            <p className="text-xs text-gray-500 text-center -mt-1">
              {t('timesheet:selectEntriesToSubmit')}
            </p>
          )}

          {filteredPreviewTasks.length > 0 ? (
            <TimesheetGridTable
              tasks={previewTasks}
              holidays={holidays}
              selectable={true}
              selectedTimesheetIds={selectedTimesheetIds}
              onSelectionChange={setSelectedTimesheetIds}
              filterStartDate={filterStartDate}
              filterEndDate={filterEndDate}
              fill
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{t('timesheet:noTimesheetInRange')}</span>
            </div>
          )}
        </div>
      )}
    </BaseModal>
  );
};

export default SubmissionPreviewModal;
