import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, Eye } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';
import TransposedTimesheetGrid from '../../../shared/components/TransposedTimesheetGrid';
import { useGetSnapshotDetailsQuery } from '../api/snapshotEndpoints';
import { useGetHolidaysQuery } from '../../holidays/api/holidayEndpoints';
import { useLocale } from '../../../hooks/useLocale';
import { translateError } from '../../../utils/translateError';

const SnapshotDetailsModal = ({ isOpen, onClose, snapshotId }) => {
  const { t } = useTranslation(['timesheetsnapshots', 'common']);
  const locale = useLocale();
  const { data: snapshotDetails, isLoading: detailsLoading, error: detailsError } = useGetSnapshotDetailsQuery(
    snapshotId,
    {
      skip: !isOpen || !snapshotId,
      refetchOnMountOrArgChange: true
    }
  );
  const { data: holidays = [] } = useGetHolidaysQuery();

  const handleClose = () => {
    onClose();
  };

  const getTotalTimesheets = () => {
    if (!snapshotDetails?.tasks) return 0;
    return snapshotDetails.tasks.reduce((sum, task) => sum + task.timesheets.length, 0);
  };

  const getTotalHours = () => {
    if (!snapshotDetails?.tasks) return 0;
    return snapshotDetails.tasks.reduce((sum, task) => sum + task.total_hours, 0);
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

  const taskCount = snapshotDetails?.tasks?.length || 0;
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

      {!detailsLoading && !detailsError && snapshotDetails && snapshotDetails.tasks?.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center gap-3">
          <FileText size={20} />
          <span>{t('timesheetsnapshots:noEntriesInSnapshot')}</span>
        </div>
      )}

      {!detailsLoading && !detailsError && snapshotDetails && snapshotDetails.tasks?.length > 0 && (
        <div className="flex flex-col gap-4 h-full min-h-0">
          <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{t('timesheetsnapshots:submittedAt')}</span>
              <span className="font-semibold text-gray-800">{formatDateTime(snapshotDetails.snapshot?.submitted_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-gray-400" />
              <span>{t('timesheetsnapshots:entries')}</span>
              <span className="font-semibold text-gray-800">{getTotalTimesheets()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{t('timesheetsnapshots:totalHours')}</span>
              <span className="font-semibold text-gray-800">{getTotalHours().toFixed(1)}h</span>
            </div>
          </div>

          <TransposedTimesheetGrid
            tasks={snapshotDetails.tasks}
            holidays={holidays}
          />
        </div>
      )}
    </BaseModal>
  );
};

export default SnapshotDetailsModal;
