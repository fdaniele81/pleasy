import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { getCategoryColorMap } from '../utils/categoryConfig';

const toSnakeCase = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s-]+/g, '_');

const DistributionTable = ({
  phases,
  distribution,
  onDistributionChange,
  categoryKeys,
  onCategoryKeysChange,
  onError,
  step = '1',
}) => {
  const { t } = useTranslation(['clients', 'common']);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = useCallback(() => {
    const key = toSnakeCase(newCategoryName);
    if (!key) return;
    if (categoryKeys.includes(key)) {
      onError?.(t('clients:categoryExists', { key }));
      return;
    }

    onCategoryKeysChange((prev) => [...prev, key]);
    onDistributionChange((prev) => {
      const updated = { ...prev };
      phases.forEach((phase) => {
        updated[phase.key] = { ...updated[phase.key], [key]: 0 };
      });
      return updated;
    });
    setNewCategoryName('');
    onError?.(null);
  }, [newCategoryName, categoryKeys, phases, onCategoryKeysChange, onDistributionChange, onError]);

  const handleRemoveCategory = useCallback(
    (catKey) => {
      if (categoryKeys.length <= 1) {
        onError?.(t('clients:mustKeepOneCategory'));
        return;
      }

      onCategoryKeysChange((prev) => prev.filter((k) => k !== catKey));
      onDistributionChange((prev) => {
        const updated = { ...prev };
        phases.forEach((phase) => {
          const { [catKey]: _, ...rest } = updated[phase.key];
          updated[phase.key] = rest;
        });
        return updated;
      });
      onError?.(null);
    },
    [categoryKeys, phases, onCategoryKeysChange, onDistributionChange, onError]
  );

  const handleCellChange = useCallback((phaseKey, catKey, value) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    onDistributionChange((prev) => ({
      ...prev,
      [phaseKey]: { ...prev[phaseKey], [catKey]: numValue },
    }));
    onError?.(null);
  }, [onDistributionChange, onError]);

  const getRowSum = (phaseKey) => {
    if (!distribution[phaseKey]) return 0;
    return Object.values(distribution[phaseKey]).reduce((sum, v) => sum + (v || 0), 0);
  };

  const colorMap = getCategoryColorMap(categoryKeys, t);

  return (
    <>
      {/* Aggiunta nuova categoria */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          placeholder={t('clients:newCategoryPlaceholder')}
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        />
        <Button
          onClick={handleAddCategory}
          color="cyan"
          size="sm"
          icon={Plus}
          iconSize={16}
          disabled={!newCategoryName.trim()}
        >
          {t('clients:addCategory')}
        </Button>
      </div>

      {/* Tabella distribuzione */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border border-gray-200 w-36">
                {t('common:phase')}
              </th>
              {categoryKeys.map((catKey) => (
                <th
                  key={catKey}
                  className="px-2 py-2 text-center font-semibold text-gray-700 border border-gray-200 min-w-[100px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="truncate">{colorMap[catKey]?.label || catKey}</span>
                    <button
                      onClick={() => handleRemoveCategory(catKey)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-1 flex-shrink-0"
                      title={t('clients:removeCategory')}
                      type="button"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-2 py-2 text-center font-semibold text-gray-700 border border-gray-200 w-20">
                {t('common:total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {phases.map((phase) => {
              const rowSum = getRowSum(phase.key);
              const isValid = Math.abs(rowSum - 100) < 0.01;

              return (
                <tr key={phase.key} className="hover:bg-gray-50">
                  <td className="px-3 py-1.5 font-medium text-gray-700 border border-gray-200">
                    {phase.label}
                  </td>
                  {categoryKeys.map((catKey) => (
                    <td key={catKey} className="px-1 py-1 border border-gray-200">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step={step}
                        value={distribution[phase.key]?.[catKey] ?? 0}
                        onChange={(e) => handleCellChange(phase.key, catKey, e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        className="w-full px-2 py-1 text-center border border-gray-200 rounded text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                  ))}
                  <td
                    className={`px-2 py-1.5 text-center font-bold border border-gray-200 ${
                      isValid ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                    }`}
                  >
                    {rowSum}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        {t('clients:rowSumError')}
      </p>
    </>
  );
};

export default DistributionTable;
