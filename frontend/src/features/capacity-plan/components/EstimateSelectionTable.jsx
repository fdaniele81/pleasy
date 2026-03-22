import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator } from 'lucide-react';
import SelectionCheckbox from '../../../shared/ui/table/SelectionCheckbox';

const EstimateSelectionTable = ({
  estimates,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  showInDays = false,
}) => {
  const { t } = useTranslation(['capacityPlan', 'common']);
  const allSelected = estimates.length > 0 && estimates.every((e) => selectedIds.includes(e.estimate_id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const getEstimateStatusBadge = (status) => {
    if (status === 'DRAFT') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (status === 'CONVERTED') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getEstimateStatusLabel = (status) => {
    if (status === 'DRAFT') return t('capacityPlan:statusDraft');
    if (status === 'CONVERTED') return t('capacityPlan:statusConverted');
    return status;
  };

  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '-';
    if (showInDays) {
      const days = parseFloat(hours) / 8;
      return `${(Math.round(days * 10) / 10).toFixed(1)}gg`;
    }
    return `${parseFloat(hours).toFixed(1)}h`;
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[4%]" />
            <col className="w-[50%] xl:w-[32%]" />
            <col className="w-[28%] xl:w-[20%]" />
            <col className="w-0 xl:w-[15%]" />
            <col className="w-0 xl:w-[6%]" />
            <col className="w-0 xl:w-[12%]" />
            <col className="w-[18%] xl:w-[11%]" />
          </colgroup>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-1 py-3 text-center">
                <SelectionCheckbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={() => onSelectAll(!allSelected)}
                  ariaLabel={t('capacityPlan:selectAllEstimates')}
                />
              </th>
              <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('capacityPlan:tableTitle')}
              </th>
              <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('capacityPlan:tableClient')}
              </th>
              <th className="hidden xl:table-cell px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('capacityPlan:tableCode')}
              </th>
              <th className="hidden xl:table-cell px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('capacityPlan:tableItems')}
              </th>
              <th className="hidden xl:table-cell px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('capacityPlan:tableEstimate')}
              </th>
              <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('capacityPlan:tableStatus')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {estimates.map((estimate) => {
              const isSelected = selectedIds.includes(estimate.estimate_id);

              return (
                <tr
                  key={estimate.estimate_id}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyan-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onToggleSelect(estimate.estimate_id)}
                >
                  <td className="px-1 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <SelectionCheckbox
                      checked={isSelected}
                      onChange={() => onToggleSelect(estimate.estimate_id)}
                      ariaLabel={t('capacityPlan:selectEstimate', { title: estimate.title })}
                    />
                  </td>
                  <td className="px-4 xl:px-6 py-3 overflow-hidden" title={estimate.title}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Calculator size={16} className="text-cyan-600 shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {estimate.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 xl:px-6 py-3 overflow-hidden" title={estimate.client_name || ''}>
                    <span className="text-sm text-gray-700 truncate block">
                      {estimate.client_name || '-'}
                    </span>
                  </td>
                  <td className="hidden xl:table-cell px-4 xl:px-6 py-3 overflow-hidden">
                    {estimate.project_key ? (
                      <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded truncate block">
                        {estimate.project_key}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="hidden xl:table-cell px-4 xl:px-6 py-3">
                    <span className="text-sm text-gray-700">
                      {estimate.tasks_count || 0}
                    </span>
                  </td>
                  <td className="hidden xl:table-cell px-4 xl:px-6 py-3">
                    <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
                      {formatHours(estimate.total_hours_with_contingency)}
                    </span>
                  </td>
                  <td className="px-4 xl:px-6 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getEstimateStatusBadge(
                        estimate.status
                      )}`}
                    >
                      {getEstimateStatusLabel(estimate.status)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-center gap-2 px-1 mb-1">
          <SelectionCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={() => onSelectAll(!allSelected)}
            ariaLabel={t('capacityPlan:selectAllEstimates')}
          />
          <span className="text-xs text-gray-500">{t('capacityPlan:selectAllEstimates')}</span>
        </div>
        {estimates.map((estimate) => {
          const isSelected = selectedIds.includes(estimate.estimate_id);

          return (
            <div
              key={estimate.estimate_id}
              className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                isSelected ? 'bg-cyan-50 border-cyan-300' : 'bg-white border-gray-200'
              }`}
              onClick={() => onToggleSelect(estimate.estimate_id)}
            >
              <div className="flex items-start gap-2">
                <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                  <SelectionCheckbox
                    checked={isSelected}
                    onChange={() => onToggleSelect(estimate.estimate_id)}
                    ariaLabel={t('capacityPlan:selectEstimate', { title: estimate.title })}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{estimate.title}</p>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ml-2 ${getEstimateStatusBadge(estimate.status)}`}
                    >
                      {getEstimateStatusLabel(estimate.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{estimate.client_name || '-'}</span>
                    <span className="font-medium text-gray-700">{formatHours(estimate.total_hours_with_contingency)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default EstimateSelectionTable;
