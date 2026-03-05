import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, FolderKanban, AlertTriangle, Check } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';
import { calculateTaskDates, formatDateDisplay } from '../utils/workingDays';

/**
 * Modal asking for start date + elapsed before final conversion.
 * Shows a preview of calculated dates for each task.
 * Shows budget coverage warning if tasks don't cover 100% of the estimate.
 * Requires a second confirmation click before proceeding.
 */
function ConversionDateModal({
  isOpen,
  onClose,
  onConfirm,
  taskRows,
  originalTotal = 0,
  currentTotal = 0,
  budgetDifference = 0,
  showInDays = false,
  converting = false,
  existingProject = null,
}) {
  const { t } = useTranslation(['estimateConversion', 'estimator', 'common']);

  const [startDate, setStartDate] = useState('');
  const [elapsedDays, setElapsedDays] = useState(60);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const budgetOk = Math.abs(budgetDifference) < 0.1;
  const coveragePercent = originalTotal > 0
    ? Math.round((currentTotal / originalTotal) * 100)
    : 0;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setStartDate(`${yyyy}-${mm}-${dd}`);

      // Suggest elapsed based on total budget hours / 8 hours per day
      const totalHours = taskRows.reduce((sum, r) => sum + r.budget, 0);
      const suggestedDays = Math.max(10, Math.ceil(totalHours / 8));
      // Round to nearest 10
      setElapsedDays(Math.ceil(suggestedDays / 10) * 10);
      setShowFinalConfirm(false);
    }
  }, [isOpen, taskRows]);

  const formatValue = (hours) => {
    const num = parseFloat(hours) || 0;
    if (showInDays) {
      return (Math.round((num / 8) * 10) / 10).toString();
    }
    return (Math.round(num * 10) / 10).toString();
  };

  const unitLabel = showInDays ? 'gg' : 'h';

  // Preview calculated dates
  const previewRows = useMemo(() => {
    if (!startDate || !elapsedDays || elapsedDays <= 0) return [];
    return calculateTaskDates(taskRows, startDate, elapsedDays);
  }, [taskRows, startDate, elapsedDays]);

  const handleRequestConfirm = () => {
    if (!startDate || elapsedDays <= 0) return;
    setShowFinalConfirm(true);
  };

  const handleFinalConfirm = () => {
    if (!startDate || elapsedDays <= 0) return;
    onConfirm(startDate, elapsedDays, previewRows);
  };

  const customFooter = (
    <>
      <Button onClick={onClose} variant="outline" color="gray" disabled={converting}>
        {t('common:cancel')}
      </Button>
      <Button
        onClick={handleRequestConfirm}
        color="cyan"
        icon={FolderKanban}
        disabled={!startDate || elapsedDays <= 0 || converting}
        loading={converting}
      >
        {converting ? t('estimator:converting') : t('estimateConversion:confirmConvert')}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('estimateConversion:schedulingTitle')}
      icon={<Calendar className="text-cyan-600" size={24} />}
      size="xl"
      customFooter={customFooter}
    >
      <div className="space-y-5">
        {/* Input fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('estimateConversion:startDate')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('estimateConversion:elapsedDays')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={elapsedDays}
              onChange={(e) => setElapsedDays(parseInt(e.target.value) || 0)}
              min={1}
              max={365}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('estimateConversion:elapsedHint')}
            </p>
          </div>
        </div>

        {/* Budget coverage warning */}
        <div className={`rounded-lg border-2 px-4 py-2 flex items-center gap-2 ${
          budgetOk ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'
        }`}>
          {budgetOk ? (
            <>
              <Check size={16} className="text-green-600 shrink-0" />
              <span className="text-sm text-green-700">
                {t('estimateConversion:budgetCoverageOk', {
                  total: formatValue(originalTotal),
                  unit: unitLabel,
                })}
              </span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span className="text-sm text-amber-700">
                {t('estimateConversion:budgetCoverageWarning', {
                  coverage: coveragePercent,
                  expected: formatValue(originalTotal),
                  actual: formatValue(currentTotal),
                  unit: unitLabel,
                })}
              </span>
            </>
          )}
        </div>

        {/* Duplicate key warning */}
        {existingProject && existingProject.status_id !== 'DELETED' && (
          <div className="rounded-lg border-2 bg-amber-50 border-amber-300 px-4 py-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span className="text-sm text-amber-700">
              {t('estimateConversion:duplicateKeyWarning', { projectKey: existingProject.project_key })}
            </span>
          </div>
        )}

        {/* Preview table */}
        {previewRows.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              {t('estimateConversion:datePreview')}
            </h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">#</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                      {t('estimateConversion:taskName')}
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">
                      {t('common:budget')}
                    </th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">
                      {t('estimateConversion:startDateCol')}
                    </th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">
                      {t('estimateConversion:endDateCol')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={row.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-1.5 text-gray-400 font-mono text-xs">{index + 1}</td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: row.color }}
                          />
                          <span className="text-gray-800">
                            {row.title || (row.titleKey ? t('estimator:' + row.titleKey) : t('estimateConversion:untitledTask'))}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-gray-700">
                        {formatValue(row.budget)}{unitLabel}
                      </td>
                      <td className="px-3 py-1.5 text-center text-gray-700">
                        {row.start_date ? formatDateDisplay(row.start_date) : '-'}
                      </td>
                      <td className="px-3 py-1.5 text-center text-gray-700">
                        {row.end_date ? formatDateDisplay(row.end_date) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Final confirmation popup */}
      <BaseModal
        isOpen={showFinalConfirm}
        onClose={() => setShowFinalConfirm(false)}
        title={t('estimateConversion:finalConfirmTitle')}
        icon={<FolderKanban className="text-cyan-600" size={24} />}
        size="md"
        customFooter={
          <>
            <Button onClick={() => setShowFinalConfirm(false)} variant="outline" color="gray" disabled={converting}>
              {t('common:cancel')}
            </Button>
            <Button
              onClick={handleFinalConfirm}
              color="cyan"
              icon={FolderKanban}
              disabled={converting}
              loading={converting}
            >
              {converting ? t('estimator:converting') : t('estimateConversion:confirmConvertFinal')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            {t('estimateConversion:finalConfirmMessage', { taskCount: taskRows.length })}
          </p>

          {!budgetOk && (
            <div className="rounded-lg border-2 bg-amber-50 border-amber-300 px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span className="text-sm text-amber-700">
                {t('estimateConversion:finalConfirmBudgetWarning', {
                  coverage: coveragePercent,
                })}
              </span>
            </div>
          )}

          {existingProject && existingProject.status_id !== 'DELETED' && (
            <div className="rounded-lg border-2 bg-amber-50 border-amber-300 px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span className="text-sm text-amber-700">
                {t('estimateConversion:duplicateKeyWarning', { projectKey: existingProject.project_key })}
              </span>
            </div>
          )}

          <p className="text-xs text-gray-500">
            {t('estimateConversion:finalConfirmIrreversible')}
          </p>
        </div>
      </BaseModal>
    </BaseModal>
  );
}

export default ConversionDateModal;
