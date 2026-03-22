import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetSnapshotsQuery } from '../timesheetsnapshots/api/snapshotEndpoints';
import { useSubmitTimesheetsMutation } from '../timesheet/api/timesheetEndpoints';
import { FileText, Calendar, Clock, Eye, Send, ArrowLeft } from 'lucide-react';
import PageHeader from '../../shared/ui/PageHeader';
import DateInput from '../../shared/ui/DateInput';
import { useAuth } from '../../hooks';
import { useLocale } from '../../hooks/useLocale';

const SnapshotDetailsModal = lazy(() => import('../timesheetsnapshots/components/SnapshotDetailsModal'));
const SubmissionPreviewModal = lazy(() => import('../timesheet/components/SubmissionPreviewModal'));

function MySubmissions() {
  const { t } = useTranslation(['mysubmissions', 'timesheetsnapshots', 'timesheet', 'common']);
  const navigate = useNavigate();
  const locale = useLocale();
  const { user } = useAuth();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(null);
  const [showSubmissionPreview, setShowSubmissionPreview] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const { data: allSnapshots = [], isLoading: loading } = useGetSnapshotsQuery(
    { startDate, endDate }
  );
  const [submitTimesheets] = useSubmitTimesheetsMutation();

  // For PM users, the API returns all company snapshots — filter to own only
  const snapshots = allSnapshots.filter(s => s.user_id === user?.user_id);

  const visibleSnapshots = snapshots.slice(0, visibleCount);
  const hasMore = snapshots.length > visibleCount;

  const totalEntries = snapshots.reduce((sum, s) => sum + s.timesheet_count, 0);
  const totalHours = snapshots.reduce((sum, s) => sum + s.total_hours, 0);

  const handleConfirmSubmission = async (timesheetIds) => {
    setShowSubmissionPreview(false);
    try {
      await submitTimesheets({ timesheetIds }).unwrap();
    } catch (error) {
      // handled by RTK Query
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  if (loading && snapshots.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6 pt-20">
          <div className="text-xl">{t('common:loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100 pt-20">
      <Suspense fallback={null}>
        <SnapshotDetailsModal
          isOpen={selectedSnapshotId !== null}
          onClose={() => setSelectedSnapshotId(null)}
          snapshotId={selectedSnapshotId}
        />
      </Suspense>
      <Suspense fallback={null}>
        <SubmissionPreviewModal
          isOpen={showSubmissionPreview}
          onClose={() => setShowSubmissionPreview(false)}
          onConfirm={handleConfirmSubmission}
        />
      </Suspense>

      <div className="shrink-0 p-4 pb-0">
        <div className="max-w-full mx-auto">
          <button
            onClick={() => navigate('/timesheet')}
            className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-800 font-medium mb-2"
          >
            <ArrowLeft size={16} />
            {t('mysubmissions:backToTimesheet')}
          </button>

          <PageHeader
            icon={Send}
            title={t('mysubmissions:title')}
            description={t('mysubmissions:description')}
            actionButton={{
              label: t('mysubmissions:submitNew'),
              onClick: () => setShowSubmissionPreview(true),
              icon: Send,
            }}
          />

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">{t('timesheetsnapshots:periodLabel')}</label>
            <Calendar className="h-4 w-4 text-gray-500 shrink-0 hidden sm:block" />
            <div className="min-w-[130px] flex-1 sm:flex-none">
              <DateInput
                value={startDate}
                onChange={setStartDate}
                className="w-full"
              />
            </div>
            <span className="text-gray-400 text-xs">&mdash;</span>
            <div className="min-w-[130px] flex-1 sm:flex-none">
              <DateInput
                value={endDate}
                onChange={setEndDate}
                className="w-full"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium ml-1"
              >
                {t('timesheetsnapshots:clearDates')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-4">
        <div className="max-w-full mx-auto h-full">
          {snapshots.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                {(startDate && endDate)
                  ? t('timesheetsnapshots:noSnapshotsInPeriod')
                  : t('timesheetsnapshots:noSnapshots')
                }
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden">
              <div className="shrink-0 bg-linear-to-r from-cyan-50 to-cyan-100 px-4 py-3 border-b border-cyan-200">
                <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span>
                    {t('timesheetsnapshots:snapshotCount', { count: snapshots.length })}
                  </span>
                  <span>
                    {t('timesheetsnapshots:timesheetEntriesCount', { count: totalEntries })}
                  </span>
                  <span>
                    {t('timesheetsnapshots:totalHoursLabel', { hours: totalHours.toFixed(2) })}
                  </span>
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block flex-1 overflow-y-auto min-h-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('timesheetsnapshots:submissionDateHeader')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('timesheetsnapshots:periodHeader')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('timesheetsnapshots:entriesCountHeader')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('timesheetsnapshots:totalHoursHeader')}
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common:actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visibleSnapshots.map((snapshot) => (
                      <tr key={snapshot.snapshot_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-xs">{formatDateTime(snapshot.submitted_at)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-xs">
                                {formatDate(snapshot.min_date)} - {formatDate(snapshot.max_date)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {snapshot.timesheet_count}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                          {snapshot.total_hours.toFixed(2)}h
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium">
                          <button
                            onClick={() => setSelectedSnapshotId(snapshot.snapshot_id)}
                            className="inline-flex items-center text-cyan-600 hover:text-cyan-900"
                            title={t('timesheetsnapshots:viewDetailsTitle')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="text-xs">{t('common:details')}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="lg:hidden flex-1 overflow-y-auto min-h-0 divide-y divide-gray-200">
                {visibleSnapshots.map((snapshot) => (
                  <div key={snapshot.snapshot_id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-900">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>{formatDateTime(snapshot.submitted_at)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{snapshot.total_hours.toFixed(2)}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{formatDate(snapshot.min_date)} - {formatDate(snapshot.max_date)}</span>
                      </div>
                      <button
                        onClick={() => setSelectedSnapshotId(snapshot.snapshot_id)}
                        className="inline-flex items-center text-cyan-600 hover:text-cyan-900 text-xs min-h-11 px-2"
                        title={t('timesheetsnapshots:viewDetailsTitle')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t('common:details')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="shrink-0 bg-gray-50 px-4 py-3 border-t border-gray-200 text-center">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 10)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t('timesheetsnapshots:showMoreSnapshots', { remaining: snapshots.length - visibleCount })}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MySubmissions;
