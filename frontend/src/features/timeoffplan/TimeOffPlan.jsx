import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Download, ArrowLeft, ArrowRight, X, CheckSquare, EyeOff } from 'lucide-react';
import { useGetCompanyTimeOffPlanQuery, useLazyGetCompanyTimeOffPlanQuery } from '../timesheet/api/timesheetEndpoints';
import { useGetHolidaysQuery } from '../holidays/api/holidayEndpoints';
import { exportTimeOffPlanToExcel } from '../../utils/export/excel';
import { addToast } from '../../store/slices/toastSlice';
import logger from '../../utils/logger';
import { generateDateRange } from '../../utils/table/tableUtils';
import { formatDateISO } from '../../utils/date/dateUtils';
import { useTimeOffPlanCalculations } from './hooks/useTimeOffPlanCalculations';
import { useLocale } from '../../hooks/useLocale';
import PageHeader from '../../shared/ui/PageHeader';
import Button from '../../shared/ui/Button';
import { getRouteIcon } from '../../constants/routeIcons';
import TimeOffPlanSummary from './components/TimeOffPlanSummary';
import TimeOffPlanTransposedTable from './components/TimeOffPlanTransposedTable';

function TimeOffPlan() {
  const { t } = useTranslation(['timeoffplan', 'common']);
  const dispatch = useDispatch();
  const locale = useLocale();
  const [page, setPage] = useState('selection'); // 'selection' | 'detail'
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [hideEmptyDates, setHideEmptyDates] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 12, 0);
    setStartDate(formatDateISO(firstDay));
    setEndDate(formatDateISO(lastDay));
  }, []);

  const handleMonthToggle = (monthKey) => {
    setSelectedMonths(prev => {
      const next = prev.includes(monthKey)
        ? prev.filter(m => m !== monthKey)
        : [...prev, monthKey].sort();
      return next;
    });
  };

  const handleUserToggle = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === allUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(allUsers.map(u => u.user_id));
    }
  };

  const handleSelectAllMonths = () => {
    const { months } = getMonthlyBreakdown;
    if (selectedMonths.length === months.length) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths([...months]);
    }
  };

  const handleClearFilters = () => {
    setSelectedMonths([]);
    setSelectedUserIds([]);
  };

  const handleSelectAll = () => {
    const { months } = getMonthlyBreakdown;
    const allSelected = selectedMonths.length === months.length && selectedUserIds.length === allUsers.length;
    if (allSelected) {
      setSelectedMonths([]);
      setSelectedUserIds([]);
    } else {
      setSelectedMonths([...months]);
      setSelectedUserIds(allUsers.map(u => u.user_id));
    }
  };

  const effectiveDateRange = useMemo(() => {
    if (selectedMonths.length === 0) return null;
    const sorted = [...selectedMonths].sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const [fy, fm] = first.split('-').map(Number);
    const [ly, lm] = last.split('-').map(Number);
    return {
      startDate: formatDateISO(new Date(fy, fm - 1, 1)),
      endDate: formatDateISO(new Date(ly, lm, 0)),
    };
  }, [selectedMonths]);

  const { data: users = [], isLoading: loading } = useGetCompanyTimeOffPlanQuery(
    { startDate, endDate },
    { skip: !startDate || !endDate }
  );

  const { data: holidays = [] } = useGetHolidaysQuery();
  const [getCompanyTimeOffPlanForExport] = useLazyGetCompanyTimeOffPlanQuery();

  const calculations = useTimeOffPlanCalculations(users);
  const {
    getTimeOffForDate,
    getTotalHoursForUserAndType,
    getGrandTotal,
    getMonthlyBreakdown,
  } = calculations;

  const allUsers = useMemo(() =>
    [...users].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '')),
    [users]
  );

  const filteredUsers = useMemo(() => {
    if (selectedUserIds.length === 0) return allUsers;
    return allUsers.filter(u => selectedUserIds.includes(u.user_id));
  }, [allUsers, selectedUserIds]);

  const tableStartDate = effectiveDateRange?.startDate || startDate;
  const tableEndDate = effectiveDateRange?.endDate || endDate;

  const dateRange = useMemo(() =>
    generateDateRange(tableStartDate, tableEndDate),
    [tableStartDate, tableEndDate]
  );

  const visibleDateRange = useMemo(() => {
    if (!hideEmptyDates) return dateRange;
    return dateRange.filter(date =>
      filteredUsers.some(user => getTimeOffForDate(user, 'VACATION', date) > 0)
    );
  }, [dateRange, hideEmptyDates, filteredUsers, getTimeOffForDate]);

  const canProceed = selectedMonths.length > 0 && selectedUserIds.length > 0;

  const formatDateDisplay = (isoDate) => {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleExport = async () => {
    try {
      const usersWithTimeOffs = await getCompanyTimeOffPlanForExport({ startDate: tableStartDate, endDate: tableEndDate }).unwrap();
      const exportUsers = selectedUserIds.length > 0
        ? usersWithTimeOffs.filter(u => selectedUserIds.includes(u.user_id))
        : usersWithTimeOffs;
      await exportTimeOffPlanToExcel(exportUsers, [], tableStartDate, tableEndDate, holidays);
    } catch (error) {
      logger.error('Errore durante export:', error);
      dispatch(addToast({ message: t('timeoffplan:exportError', { message: error.message }), type: 'error' }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6 pt-20">
          <div className="text-xl">{t('common:loading')}</div>
        </div>
      </div>
    );
  }

  const hasFilters = selectedMonths.length > 0 || selectedUserIds.length > 0;
  const isAllSelected = getMonthlyBreakdown.months.length > 0
    && selectedMonths.length === getMonthlyBreakdown.months.length
    && allUsers.length > 0
    && selectedUserIds.length === allUsers.length;

  // === PAGINA 1: Selezione ===
  if (page === 'selection') {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gray-100 pt-20">
        <div className="shrink-0 p-4 pb-0">
          <div className="max-w-full mx-auto">
            <PageHeader
              icon={getRouteIcon('/timeoff-plan')}
              title={t('timeoffplan:title')}
              description={t('timeoffplan:next12Months')}
              actionButton={{
                label: t('timeoffplan:viewDetail'),
                onClick: () => setPage('detail'),
                icon: ArrowRight,
                disabled: !canProceed,
              }}
            />

            <div className="flex items-center gap-2 mb-3">
              <Button
                onClick={handleSelectAll}
                variant="ghost"
                color="cyan"
                size="sm"
                icon={CheckSquare}
                iconSize={14}
              >
                {isAllSelected ? t('timeoffplan:deselectAll') : t('timeoffplan:selectAll')}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 px-4 pb-4">
          <div className="max-w-full mx-auto h-full flex flex-col">
            <TimeOffPlanSummary
              users={allUsers}
              monthlyBreakdown={getMonthlyBreakdown}
              selectedMonths={selectedMonths}
              onMonthToggle={handleMonthToggle}
              onSelectAllMonths={handleSelectAllMonths}
              selectedUserIds={selectedUserIds}
              onUserToggle={handleUserToggle}
              onSelectAllUsers={handleSelectAllUsers}
            />
          </div>
        </div>
      </div>
    );
  }

  // === PAGINA 2: Dettaglio ===
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100 pt-20">
      <div className="shrink-0 p-4 pb-0">
        <div className="max-w-full mx-auto">
          <div className="mb-2">
            <button
              onClick={() => setPage('selection')}
              className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-800 font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              {t('timeoffplan:backToSelection')}
            </button>
          </div>

          <PageHeader
            icon={getRouteIcon('/timeoff-plan')}
            title={t('timeoffplan:detailTitle')}
            description={`${t('timeoffplan:usersSelected', { count: filteredUsers.length })}  ·  ${formatDateDisplay(tableStartDate)} — ${formatDateDisplay(tableEndDate)}`}
            actionButton={{
              label: t('common:export'),
              onClick: handleExport,
              icon: Download,
              color: 'green',
            }}
          />

          <div className="flex items-center gap-3 mb-3">
            <Button
              onClick={() => setHideEmptyDates(prev => !prev)}
              variant={hideEmptyDates ? 'solid' : 'ghost'}
              color={hideEmptyDates ? 'cyan' : 'gray'}
              size="sm"
              icon={EyeOff}
              iconSize={14}
            >
              {t('timeoffplan:hideEmptyDates')}
            </Button>
            {hideEmptyDates && visibleDateRange.length < dateRange.length && (
              <span className="text-xs text-gray-500">
                {t('timeoffplan:datesVisible', { count: visibleDateRange.length })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-4">
        <div className="max-w-full mx-auto h-full flex flex-col">
          <TimeOffPlanTransposedTable
            users={filteredUsers}
            dateRange={visibleDateRange}
            holidays={holidays}
            getTimeOffForDate={getTimeOffForDate}
            getTotalHoursForUserAndType={getTotalHoursForUserAndType}
            getGrandTotal={getGrandTotal}
          />
        </div>
      </div>
    </div>
  );
}

export default TimeOffPlan;
