import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';
import TimesheetGridTable from '../../../shared/components/TimesheetGridTable';
import { useLazyGetPreviewSubmissionQuery } from '../api/timesheetEndpoints';
import { useGetHolidaysQuery } from '../../holidays/api/holidayEndpoints';

const SubmissionPreviewModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation(['timesheet', 'common']);
  const [fetchPreview, { data: previewTasks = [], isLoading: previewLoading }] = useLazyGetPreviewSubmissionQuery();
  const { data: holidays = [] } = useGetHolidaysQuery();
  const [selectedTimesheetIds, setSelectedTimesheetIds] = useState(new Set());

  const allTimesheetIds = useMemo(() => {
    const ids = new Set();
    previewTasks.forEach(task => {
      task.timesheets.forEach(ts => {
        ids.add(ts.timesheet_id);
      });
    });
    return ids;
  }, [previewTasks]);

  useEffect(() => {
    if (isOpen) {
      fetchPreview();
      setSelectedTimesheetIds(new Set());
    }
  }, [isOpen, fetchPreview]);

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedTimesheetIds));
  };

  const getSelectedHours = () => {
    let total = 0;
    previewTasks.forEach(task => {
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
    return previewTasks.reduce((sum, task) => sum + task.total_hours, 0);
  };

  const customFooter = (
    <>
      <Button onClick={handleClose} variant="outline" color="gray" size="md">
        {t('common:cancel')}
      </Button>
      <Button
        onClick={handleConfirm}
        disabled={previewTasks.length === 0 || selectedTimesheetIds.size === 0}
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
        <div className="space-y-4">
          <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100">
            <div className="flex items-center gap-6 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-600" />
                <span className="font-medium">{t('timesheet:entriesLabel')}</span>
                <span className="font-semibold">{getSelectedCount()}</span>
                <span className="text-gray-500">/ {allTimesheetIds.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-600" />
                <span className="font-medium">{t('timesheet:hoursLabel')}</span>
                <span className="font-semibold">{getSelectedHours().toFixed(1)}h</span>
                <span className="text-gray-500">/ {getTotalHours().toFixed(1)}h</span>
              </div>
            </div>
            {selectedTimesheetIds.size === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {t('timesheet:selectEntriesToSubmit')}
              </p>
            )}
          </div>

          <TimesheetGridTable
            tasks={previewTasks}
            holidays={holidays}
            selectable={true}
            selectedTimesheetIds={selectedTimesheetIds}
            onSelectionChange={setSelectedTimesheetIds}
          />
        </div>
      )}
    </BaseModal>
  );
};

export default SubmissionPreviewModal;
