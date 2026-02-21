import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useGetCompanyTimeOffPlanQuery, useLazyGetCompanyTimeOffPlanQuery } from '../timesheet/api/timesheetEndpoints';
import { useGetHolidaysQuery } from '../holidays/api/holidayEndpoints';
import { exportTimeOffPlanToExcel } from '../../utils/export/excel';
import { addToast } from '../../store/slices/toastSlice';
import logger from '../../utils/logger';
import { generateDateRange } from '../../utils/table/tableUtils';
import { getMonday, toISODate, formatDateISO } from '../../utils/date/dateUtils';
import { useLocale } from '../../hooks/useLocale';
import { getColumnCountForWidth, getWeekCountForWidth } from '../../constants/breakpoints';
import { useTimeOffPlanCalculations } from './hooks/useTimeOffPlanCalculations';
import { TimeOffIcon } from '../../utils/ui/timeOffIcons';
import {
  TableContainer,
  SelectionCheckbox,
  useTableDateHelpers,
} from '../../shared/ui/table';
import TimeOffPlanHeader from './components/TimeOffPlanHeader';
import TimeOffPlanTableHeader from './components/TimeOffPlanTableHeader';
import TimeOffPlanUserRow from './components/TimeOffPlanUserRow';

const ExportModal = lazy(() => import('../../shared/components/modals/ExportModal'));

function TimeOffPlan() {
  const { t } = useTranslation(['timeoffplan', 'common']);
  const locale = useLocale();
  const dispatch = useDispatch();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('daily');
  const [showExportModal, setShowExportModal] = useState(false);

  const getQueryDateRange = () => {
    if (!startDate || !endDate) return { startDate: '', endDate: '' };

    if (viewMode === 'weekly') {
      const maxWeeks = getWeekCountForWidth();
      const firstWeekStart = getMonday(new Date(startDate));
      const lastWeekStart = new Date(firstWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() + ((maxWeeks - 1) * 7));
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

      return {
        startDate: formatDateISO(firstWeekStart),
        endDate: formatDateISO(lastWeekEnd)
      };
    }

    return { startDate, endDate };
  };

  const queryDateRange = getQueryDateRange();

  const { data: users = [], isLoading: loading } = useGetCompanyTimeOffPlanQuery(
    queryDateRange,
    { skip: !queryDateRange.startDate || !queryDateRange.endDate }
  );

  const { data: holidays = [] } = useGetHolidaysQuery();
  const [getCompanyTimeOffPlanForExport] = useLazyGetCompanyTimeOffPlanQuery();

  const [selectedUsers, setSelectedUsers] = useState({ VACATION: {}, OTHER: {} });
  const [selectionFilters, setSelectionFilters] = useState([]);

  const calculations = useTimeOffPlanCalculations(startDate, endDate, viewMode, users);
  const {
    weekRanges,
    getExtendedDateRange,
    getWeekForDate,
    formatWeekHeader,
    getTimeOffForDate,
    getTotalHoursForUserAndType,
    getTotalHoursForUser,
    getTotalHoursForDate,
    getTimeOffForWeek,
    getTotalHoursForWeek,
    getGrandTotal
  } = calculations;

  const goToPreviousPeriod = () => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - 7);
    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() - 7);
    setStartDate(formatDateISO(newStart));
    setEndDate(formatDateISO(newEnd));
  };

  const goToNextPeriod = () => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + 7);
    const newEnd = new Date(endDate);
    newEnd.setDate(newEnd.getDate() + 7);
    setStartDate(formatDateISO(newStart));
    setEndDate(formatDateISO(newEnd));
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const numDays = getColumnCountForWidth();
    const endDay = new Date(today);
    endDay.setDate(endDay.getDate() + numDays);
    setStartDate(formatDateISO(today));
    setEndDate(formatDateISO(endDay));
  };

  const isAtToday = useMemo(() => {
    if (!startDate) return true;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return start.getTime() === today.getTime();
  }, [startDate]);

  const getPeriodLabel = () => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const formatOptions = { day: 'numeric', month: 'short' };
    const startStr = start.toLocaleDateString(locale, formatOptions);
    const endStr = end.toLocaleDateString(locale, { ...formatOptions, year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const toggleUserSelection = (userId, timeOffTypeId) => {
    setSelectedUsers((prev) => ({
      ...prev,
      [timeOffTypeId]: {
        ...prev[timeOffTypeId],
        [userId]: !prev[timeOffTypeId]?.[userId]
      }
    }));
  };

  const closeAllDropdowns = () => {
    const dropdownIds = ['view-dropdown'];
    dropdownIds.forEach(id => {
      const dropdown = document.getElementById(id);
      if (dropdown && !dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden');
      }
    });
  };

  const toggleDropdown = (dropdownId) => {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const wasHidden = dropdown.classList.contains('hidden');
    closeAllDropdowns();

    if (wasHidden) {
      dropdown.classList.remove('hidden');
    }
  };

  const handleExport = async ({ startDate: exportStartDate, endDate: exportEndDate }) => {
    try {
      const usersWithTimeOffs = await getCompanyTimeOffPlanForExport({ startDate: exportStartDate, endDate: exportEndDate }).unwrap();

      const hasVacationSelection = Object.keys(selectedUsers.VACATION).some(userId => selectedUsers.VACATION[userId]);
      const hasOtherSelection = Object.keys(selectedUsers.OTHER).some(userId => selectedUsers.OTHER[userId]);
      const hasAnySelection = hasVacationSelection || hasOtherSelection;

      const vacationUsers = hasAnySelection
        ? usersWithTimeOffs.filter(u => selectedUsers.VACATION[u.user_id])
        : usersWithTimeOffs;

      const otherUsers = hasAnySelection
        ? usersWithTimeOffs.filter(u => selectedUsers.OTHER[u.user_id])
        : usersWithTimeOffs;

      await exportTimeOffPlanToExcel(vacationUsers, otherUsers, exportStartDate, exportEndDate, holidays);

      setShowExportModal(false);
    } catch (error) {
      logger.error('Errore durante export:', error);
      dispatch(addToast({ message: t('timeoffplan:exportError', { message: error.message }), type: 'error' }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownIds = ['view-dropdown'];
      const dropdowns = dropdownIds.map(id => document.getElementById(id));

      const clickedOutside = !dropdowns.some(dropdown =>
        dropdown && dropdown.contains(event.target)
      );

      const clickedButton = event.target.closest('button');
      const isDropdownButton = clickedButton && dropdownIds.some(id =>
        clickedButton.getAttribute('onclick')?.includes(id) ||
        clickedButton.parentElement?.querySelector(`#${id}`)
      );

      if (clickedOutside && !isDropdownButton) {
        dropdowns.forEach(dropdown => {
          if (dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
          }
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const numDays = getColumnCountForWidth();

    const endDay = new Date(today);
    endDay.setDate(endDay.getDate() + numDays);

    setStartDate(formatDateISO(today));
    setEndDate(formatDateISO(endDay));
  }, []);

  const dateRange = generateDateRange(startDate, endDate);

  const { getDateInfo } = useTableDateHelpers(dateRange, holidays);

  const getFilteredUsersForSection = (timeOffTypeId) => {
    return users.filter(user => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (
          user.full_name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term)
        );
        if (!matchesSearch) return false;
      }

      if (selectionFilters.length > 0 && selectionFilters.length < 2) {
        const isSelectedInThisSection = selectedUsers[timeOffTypeId]?.[user.user_id];

        if (selectionFilters.includes('selected')) {
          return isSelectedInThisSection;
        } else if (selectionFilters.includes('unselected')) {
          return !isSelectedInThisSection;
        }
      }

      return true;
    });
  };

  const filteredUsersVacation = getFilteredUsersForSection('VACATION');
  const filteredUsersOther = getFilteredUsersForSection('OTHER');

  const allFilteredUserIds = new Set([
    ...filteredUsersVacation.map(u => u.user_id),
    ...filteredUsersOther.map(u => u.user_id)
  ]);
  const filteredUsers = users.filter(u => allFilteredUserIds.has(u.user_id));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6">
          <div className="text-xl">{t('common:loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Suspense fallback={null}>
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          title={t('timeoffplan:exportTitle')}
        />
      </Suspense>

      <div className="p-4">
        <div className="max-w-full mx-auto">
          <div className="mt-16"></div>

          <TimeOffPlanHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectionFilters={selectionFilters}
            onSelectionFiltersChange={setSelectionFilters}
            onExportClick={() => setShowExportModal(true)}
            onPrevious={goToPreviousPeriod}
            onNext={goToNextPeriod}
            onToday={goToToday}
            isTodayDisabled={isAtToday}
            periodLabel={getPeriodLabel()}
          />

          <TableContainer maxHeight="calc(100vh - 300px)">
            <table className="w-full border-collapse">
              <TimeOffPlanTableHeader
                viewMode={viewMode}
                dateRange={dateRange}
                weekRanges={weekRanges}
                holidays={holidays}
                formatWeekHeader={formatWeekHeader}
                filteredUsers={filteredUsers}
                selectedUsers={selectedUsers}
                onSelectAll={setSelectedUsers}
              />

              <tbody>
                <tr className="bg-cyan-700 font-bold">
                  <th className="border border-gray-300 px-1 py-1 text-center sticky left-0 bg-cyan-700 z-20 w-8 min-w-8 max-w-8">
                    <SelectionCheckbox
                      checked={
                        filteredUsersVacation.length > 0 &&
                        filteredUsersVacation.every((u) => selectedUsers.VACATION?.[u.user_id])
                      }
                      onChange={(e) => {
                        const allUserIds = filteredUsersVacation.map((u) => u.user_id);
                        setSelectedUsers((prev) => {
                          const newVacation = { ...prev.VACATION };
                          if (e.target.checked) {
                            allUserIds.forEach((id) => (newVacation[id] = true));
                          } else {
                            allUserIds.forEach((id) => delete newVacation[id]);
                          }
                          return { ...prev, VACATION: newVacation };
                        });
                      }}
                    />
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left sticky left-8 bg-cyan-700 z-20 w-64 min-w-64 max-w-64 shadow-[2px_0_0_0_rgb(79,70,229)] text-white">
                    <div className="flex items-center gap-2">
                      <TimeOffIcon.VACATION size={18} className="text-white" />
                      <span>{t('timeoffplan:vacationLeave')}</span>
                    </div>
                  </th>
                  <th className="border border-gray-300 px-1 py-1 text-center bg-cyan-700 sticky left-72 z-20 w-20 min-w-20 max-w-20 shadow-[4px_0_0_0_rgb(79,70,229)] text-white text-xs font-bold">
                    {getGrandTotal('VACATION', filteredUsersVacation).toFixed(1)}
                  </th>

                  {viewMode === 'daily' ? (
                    dateRange.map((date, idx) => {
                      const dateInfo = getDateInfo(date);
                      const total = getTotalHoursForDate(date, 'VACATION', filteredUsersVacation);

                      return (
                        <th
                          key={idx}
                          className={`border border-gray-300 px-1 py-1 text-center text-xs ${
                            dateInfo.isToday
                              ? 'bg-cyan-600 text-white'
                              : dateInfo.isNonWorking
                              ? 'bg-gray-600 text-white'
                              : 'bg-cyan-700 text-white'
                          }`}
                        >
                          {total > 0 ? total.toFixed(1) : '-'}
                        </th>
                      );
                    })
                  ) : (
                    weekRanges.map((week, idx) => {
                      const total = getTotalHoursForWeek(week.dates, 'VACATION', filteredUsersVacation);

                      return (
                        <th
                          key={idx}
                          className="border border-gray-300 px-1 py-1 text-center bg-cyan-700 text-white text-xs"
                        >
                          {total > 0 ? total.toFixed(1) : '-'}
                        </th>
                      );
                    })
                  )}
                </tr>

                {filteredUsersVacation.map((user) => (
                  <TimeOffPlanUserRow
                    key={`${user.user_id}-VACATION`}
                    user={user}
                    timeOffTypeId="VACATION"
                    isSelected={!!selectedUsers.VACATION?.[user.user_id]}
                    onToggleSelection={toggleUserSelection}
                    viewMode={viewMode}
                    dateRange={dateRange}
                    weekRanges={weekRanges}
                    holidays={holidays}
                    getTimeOffForDate={getTimeOffForDate}
                    getTimeOffForWeek={getTimeOffForWeek}
                    getTotalHoursForUserAndType={getTotalHoursForUserAndType}
                    bgColor="bg-cyan-50"
                  />
                ))}

                <tr className="h-4">
                  <td colSpan={(viewMode === 'daily' ? dateRange.length : weekRanges.length) + 3} className="bg-gray-200"></td>
                </tr>

                <tr className="bg-cyan-700 font-bold">
                  <th className="border border-gray-300 px-1 py-1 text-center sticky left-0 bg-cyan-700 z-20 w-8 min-w-8 max-w-8">
                    <SelectionCheckbox
                      checked={
                        filteredUsersOther.length > 0 &&
                        filteredUsersOther.every((u) => selectedUsers.OTHER?.[u.user_id])
                      }
                      onChange={(e) => {
                        const allUserIds = filteredUsersOther.map((u) => u.user_id);
                        setSelectedUsers((prev) => {
                          const newOther = { ...prev.OTHER };
                          if (e.target.checked) {
                            allUserIds.forEach((id) => (newOther[id] = true));
                          } else {
                            allUserIds.forEach((id) => delete newOther[id]);
                          }
                          return { ...prev, OTHER: newOther };
                        });
                      }}
                    />
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left sticky left-8 bg-cyan-700 z-20 w-64 min-w-64 max-w-64 shadow-[2px_0_0_0_rgb(79,70,229)] text-white">
                    <div className="flex items-center gap-2">
                      <TimeOffIcon.OTHER size={18} className="text-white" />
                      <span>{t('timeoffplan:other')}</span>
                    </div>
                  </th>
                  <th className="border border-gray-300 px-1 py-1 text-center bg-cyan-700 sticky left-72 z-20 w-20 min-w-20 max-w-20 shadow-[4px_0_0_0_rgb(79,70,229)] text-white text-xs font-bold">
                    {getGrandTotal('OTHER', filteredUsersOther).toFixed(1)}
                  </th>

                  {viewMode === 'daily' ? (
                    dateRange.map((date, idx) => {
                      const dateInfo = getDateInfo(date);
                      const total = getTotalHoursForDate(date, 'OTHER', filteredUsersOther);

                      return (
                        <th
                          key={idx}
                          className={`border border-gray-300 px-1 py-1 text-center text-xs ${
                            dateInfo.isToday
                              ? 'bg-cyan-600 text-white'
                              : dateInfo.isNonWorking
                              ? 'bg-gray-600 text-white'
                              : 'bg-cyan-700 text-white'
                          }`}
                        >
                          {total > 0 ? total.toFixed(1) : '-'}
                        </th>
                      );
                    })
                  ) : (
                    weekRanges.map((week, idx) => {
                      const total = getTotalHoursForWeek(week.dates, 'OTHER', filteredUsersOther);

                      return (
                        <th
                          key={idx}
                          className="border border-gray-300 px-1 py-1 text-center bg-cyan-700 text-white text-xs"
                        >
                          {total > 0 ? total.toFixed(1) : '-'}
                        </th>
                      );
                    })
                  )}
                </tr>

                {filteredUsersOther.map((user) => (
                  <TimeOffPlanUserRow
                    key={`${user.user_id}-OTHER`}
                    user={user}
                    timeOffTypeId="OTHER"
                    isSelected={!!selectedUsers.OTHER?.[user.user_id]}
                    onToggleSelection={toggleUserSelection}
                    viewMode={viewMode}
                    dateRange={dateRange}
                    weekRanges={weekRanges}
                    holidays={holidays}
                    getTimeOffForDate={getTimeOffForDate}
                    getTimeOffForWeek={getTimeOffForWeek}
                    getTotalHoursForUserAndType={getTotalHoursForUserAndType}
                    bgColor="bg-cyan-50"
                  />
                ))}
              </tbody>
            </table>
          </TableContainer>
        </div>
      </div>
    </div>
  );
}

export default TimeOffPlan;
