import React, { useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useGetSnapshotsQuery,
  useReopenSnapshotMutation
} from './api/snapshotEndpoints';
import { FileText, RefreshCw, Calendar, Clock, User, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import SearchFilter from '../../shared/components/SearchFilter';
import PageHeader from '../../shared/ui/PageHeader';
import { useAuth } from '../../hooks';
import { useLocale } from '../../hooks/useLocale';

const SnapshotDetailsModal = lazy(() => import('./components/SnapshotDetailsModal'));

function TimesheetSnapshots() {
  const { t } = useTranslation(['timesheetsnapshots', 'common']);
  const locale = useLocale();
  const { user, isAdmin, isPM } = useAuth();
  const [confirmReopenId, setConfirmReopenId] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [collapsedUsers, setCollapsedUsers] = useState({});
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [userFilter, setUserFilter] = useState('');

  const { data: snapshots = [], isLoading: loading } = useGetSnapshotsQuery(
    { startDate, endDate }
  );
  const [reopenSnapshot, { isLoading: reopenLoading }] = useReopenSnapshotMutation();

  const canViewAllSnapshots = isAdmin() || isPM();

  const INITIAL_SNAPSHOT_COUNT = 10;

  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: prev[userId] ? prev[userId] + 10 : INITIAL_SNAPSHOT_COUNT + 10
    }));
  };

  const toggleUserCollapse = (userId) => {
    setCollapsedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const groupedByUser = snapshots.reduce((acc, snapshot) => {
    const userId = snapshot.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        user_id: userId,
        user_name: snapshot.user_name,
        email: snapshot.email,
        company_name: snapshot.company_name,
        snapshots: []
      };
    }
    acc[userId].snapshots.push(snapshot);
    return acc;
  }, {});

  const userGroups = Object.values(groupedByUser).filter((userGroup) => {
    if (!userFilter) return true;
    const searchTerm = userFilter.toLowerCase();
    return (
      userGroup.user_name.toLowerCase().includes(searchTerm) ||
      userGroup.email.toLowerCase().includes(searchTerm)
    );
  });

  const handleReopen = async (snapshotId) => {
    try {
      const result = await reopenSnapshot(snapshotId).unwrap();
      setToast({ message: result.message, type: 'success' });
      setConfirmReopenId(null);
    } catch (err) {
      setToast({ message: err?.data?.error || t('timesheetsnapshots:reopenError'), type: 'error' });
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
    <div className="min-h-screen bg-gray-100">
      <Suspense fallback={null}>
        <SnapshotDetailsModal
          isOpen={selectedSnapshotId !== null}
          onClose={() => setSelectedSnapshotId(null)}
          snapshotId={selectedSnapshotId}
        />
      </Suspense>

      <div className="p-4">
        <div className="max-w-full mx-auto">
          <div className="mt-16"></div>

          <PageHeader
            icon={FileText}
            title={t('timesheetsnapshots:title')}
            description={t('timesheetsnapshots:description')}
          />

          <SearchFilter
            searchTerm={userFilter}
            onSearchChange={setUserFilter}
            placeholder={t('timesheetsnapshots:searchPlaceholder')}
          />

          <div className="mb-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">{t('timesheetsnapshots:periodLabel')}</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  >
                    {t('timesheetsnapshots:clearDates')}
                  </button>
                )}
              </div>
            </div>
          </div>

        {userGroups.length === 0 ? (
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
          <div className="space-y-6">
            {userGroups.map((userGroup) => {
              const visibleCount = expandedUsers[userGroup.user_id] || INITIAL_SNAPSHOT_COUNT;
              const visibleSnapshots = userGroup.snapshots.slice(0, visibleCount);
              const hasMore = userGroup.snapshots.length > visibleCount;

              const isCollapsed = collapsedUsers[userGroup.user_id];

              return (
                <div key={userGroup.user_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-linear-to-r from-cyan-50 to-cyan-100 px-4 py-3 border-b border-cyan-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleUserCollapse(userGroup.user_id)}
                          className="text-cyan-600 hover:text-cyan-800 transition-colors"
                          aria-label={isCollapsed ? t('common:expand') : t('common:collapse')}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                        <User className="h-5 w-5 text-cyan-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{userGroup.user_name}</h3>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <span>
                          {t('timesheetsnapshots:snapshotCount', { count: userGroup.snapshots.length })}
                        </span>
                        <span>
                          {t('timesheetsnapshots:timesheetEntriesCount', { count: userGroup.snapshots.reduce((sum, s) => sum + s.timesheet_count, 0) })}
                        </span>
                        <span>
                          {t('timesheetsnapshots:totalHoursLabel', { hours: userGroup.snapshots.reduce((sum, s) => sum + s.total_hours, 0).toFixed(2) })}
                        </span>
                        {isAdmin() && (
                          <span className="bg-white px-3 py-1 rounded-full">
                            {userGroup.company_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 border-b border-gray-200">
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
                                  {confirmReopenId === snapshot.snapshot_id ? (
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => handleReopen(snapshot.snapshot_id)}
                                        disabled={reopenLoading}
                                        className="text-green-600 hover:text-green-900 disabled:opacity-50 text-xs"
                                      >
                                        {t('common:confirm')}
                                      </button>
                                      <button
                                        onClick={() => setConfirmReopenId(null)}
                                        className="text-gray-600 hover:text-gray-900 text-xs"
                                      >
                                        {t('common:cancel')}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        onClick={() => setSelectedSnapshotId(snapshot.snapshot_id)}
                                        className="inline-flex items-center text-cyan-600 hover:text-cyan-900"
                                        title={t('timesheetsnapshots:viewDetailsTitle')}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        <span className="text-xs">{t('common:details')}</span>
                                      </button>
                                      <span className="text-gray-300">|</span>
                                      <button
                                        onClick={() => setConfirmReopenId(snapshot.snapshot_id)}
                                        disabled={reopenLoading}
                                        className="inline-flex items-center text-cyan-600 hover:text-cyan-900 disabled:opacity-50"
                                        title={t('timesheetsnapshots:reopenTitle')}
                                      >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        <span className="text-xs">{t('timesheetsnapshots:reopen')}</span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {hasMore && (
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-center">
                          <button
                            onClick={() => toggleUserExpansion(userGroup.user_id)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {t('timesheetsnapshots:showMoreSnapshots', { remaining: userGroup.snapshots.length - visibleCount })}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default TimesheetSnapshots;
