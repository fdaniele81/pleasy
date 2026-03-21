import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../../hooks/useLocale';
import SelectionCheckbox from '../../../shared/ui/table/SelectionCheckbox';

const TimeOffPlanSummary = ({
  users,
  monthlyBreakdown,
  selectedMonths = [],
  onMonthToggle,
  onSelectAllMonths,
  selectedUserIds = [],
  onUserToggle,
  onSelectAllUsers,
}) => {
  const { t } = useTranslation(['timeoffplan', 'common']);
  const locale = useLocale();

  const { months, userMonthTotals } = monthlyBreakdown;

  if (users.length === 0) return null;

  const allMonthsSelected = months.length > 0 && selectedMonths.length === months.length;
  const allUsersSelected = users.length > 0 && selectedUserIds.length === users.length;

  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = date.toLocaleDateString(locale, { month: 'short' });
    const yearStr = date.getFullYear();
    return { monthName, yearStr };
  };

  const monthTotalsRow = months.map(month => {
    let total = 0;
    users.forEach(user => {
      const mt = userMonthTotals.get(user.user_id);
      if (mt) total += mt.get(month) || 0;
    });
    return total;
  });

  const grandTotal = monthTotalsRow.reduce((sum, v) => sum + v, 0);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="overflow-auto flex-1 min-h-0">
        <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-gray-200">
              <th
                className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky left-0 z-30 min-w-48 cursor-pointer select-none hover:bg-gray-100 transition-colors border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                onClick={onSelectAllUsers}
                title={allUsersSelected ? t('common:deselectAll') : t('common:selectAll')}
              >
                <div className="flex items-center gap-2">
                  <SelectionCheckbox
                    checked={allUsersSelected}
                    indeterminate={selectedUserIds.length > 0 && !allUsersSelected}
                    onChange={onSelectAllUsers}
                    size="sm"
                    ariaLabel={allUsersSelected ? t('common:deselectAll') : t('common:selectAll')}
                  />
                  <span>{t('timeoffplan:userHeader')}</span>
                </div>
              </th>
              {months.map(month => {
                const { monthName, yearStr } = formatMonthLabel(month);
                const isSelected = selectedMonths.includes(month);
                return (
                  <th
                    key={month}
                    className={`px-2 py-2.5 text-center text-xs font-medium min-w-20 cursor-pointer select-none transition-colors border-r border-gray-100 ${
                      isSelected
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-50 text-gray-500 uppercase tracking-wider hover:bg-gray-100'
                    }`}
                    onClick={() => onMonthToggle(month)}
                  >
                    <div className="flex flex-col items-center leading-tight">
                      <span className="capitalize">{monthName}</span>
                      <span className={`text-[10px] font-normal ${isSelected ? 'text-cyan-100' : 'text-gray-400'}`}>
                        {yearStr}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th
                className={`px-2 py-2.5 text-center text-xs font-bold border-l-2 border-gray-200 min-w-16 cursor-pointer select-none transition-colors ${
                  allMonthsSelected
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
                onClick={onSelectAllMonths}
                title={allMonthsSelected ? t('common:deselectAll') : t('common:selectAll')}
              >
                {t('timeoffplan:totalShort')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => {
              const mt = userMonthTotals.get(user.user_id) || new Map();
              const userTotal = Array.from(mt.values()).reduce((sum, h) => sum + h, 0);
              const isUserSelected = selectedUserIds.includes(user.user_id);

              return (
                <tr
                  key={user.user_id}
                  className={`cursor-pointer select-none transition-colors ${
                    isUserSelected
                      ? 'bg-cyan-50 hover:bg-cyan-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onUserToggle(user.user_id)}
                >
                  <td className={`px-3 py-2 text-sm font-medium sticky left-0 z-10 min-w-48 transition-colors border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] ${
                    isUserSelected
                      ? 'bg-cyan-50 text-cyan-800'
                      : 'bg-white text-gray-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <SelectionCheckbox
                        checked={isUserSelected}
                        onChange={(e) => { e.stopPropagation(); onUserToggle(user.user_id); }}
                        size="sm"
                        className="shrink-0"
                        ariaLabel={user.full_name || user.email}
                      />
                      <span className="truncate">{user.full_name || user.email}</span>
                    </div>
                  </td>
                  {months.map(month => {
                    const hours = mt.get(month) || 0;
                    const isMonthSelected = selectedMonths.includes(month);
                    return (
                      <td
                        key={month}
                        className={`px-2 py-2 text-center text-sm transition-colors border-r border-gray-100 ${
                          isUserSelected && isMonthSelected ? 'bg-cyan-200' :
                          isMonthSelected ? 'bg-cyan-50' :
                          isUserSelected ? 'bg-cyan-50' : ''
                        }`}
                        onClick={(e) => { e.stopPropagation(); onMonthToggle(month); }}
                      >
                        {hours > 0 ? (
                          <span className="font-semibold text-cyan-700">{hours.toFixed(1)}</span>
                        ) : (
                          <span className="text-gray-300">{'\u2013'}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className={`px-2 py-2 text-center text-sm font-bold border-l-2 border-gray-200 ${
                    isUserSelected ? 'bg-cyan-50 text-cyan-800' : 'bg-gray-50/50 text-gray-800'
                  }`}>
                    {userTotal > 0 ? userTotal.toFixed(1) : '\u2013'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {users.length > 1 && (
            <tfoot className="sticky bottom-0 z-10">
              <tr className="bg-gray-50 border-t-2 border-gray-300">
                <td className="px-3 py-2 text-xs font-bold text-gray-600 uppercase sticky left-0 bg-gray-50 z-20 min-w-48 border-r border-gray-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                  {t('timeoffplan:totalShort')}
                </td>
                {monthTotalsRow.map((total, idx) => {
                  const isSelected = selectedMonths.includes(months[idx]);
                  return (
                    <td
                      key={months[idx]}
                      className={`px-2 py-2 text-center text-sm font-bold text-gray-700 cursor-pointer transition-colors border-r border-gray-100 ${
                        isSelected ? 'bg-cyan-50' : 'bg-gray-50'
                      }`}
                      onClick={() => onMonthToggle(months[idx])}
                    >
                      {total > 0 ? total.toFixed(1) : '\u2013'}
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center text-sm font-bold text-cyan-800 border-l-2 border-gray-200 bg-cyan-50">
                  {grandTotal > 0 ? grandTotal.toFixed(1) : '\u2013'}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default TimeOffPlanSummary;
