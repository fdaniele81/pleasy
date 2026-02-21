import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Save, X } from "lucide-react";
import Button from "../../../shared/ui/Button";

const DISABLED_PHASE_FIELDS = [
  { key: "hours_internal_test" },
  { key: "hours_uat" },
  { key: "hours_release" },
  { key: "hours_pm" },
  { key: "hours_startup" },
  { key: "hours_documentation" },
];

const EstimateNewActivityRow = memo(function EstimateNewActivityRow({
  newActivity,
  setNewActivity,
  formData,
  formatHours,
  onDevInputChange,
  onAdd,
  onCancel,
  nameInputRef,
}) {
  const { t } = useTranslation(['estimator', 'common']);

  const handleTabToNext = (e) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      const currentTd = e.currentTarget.closest("td");
      let td = currentTd?.nextElementSibling;
      while (td) {
        const el = td.querySelector("input, textarea");
        if (el && !el.disabled) { el.focus(); break; }
        td = td.nextElementSibling;
      }
    }
  };

  const computeNewActivityTotals = () => {
    if (!newActivity.hours_development_input) return { contingency: "-", total: "-" };

    const total =
      parseFloat(newActivity.hours_analysis || 0) +
      parseFloat(newActivity.hours_development || 0) +
      parseFloat(newActivity.hours_internal_test || 0) +
      parseFloat(newActivity.hours_uat || 0) +
      parseFloat(newActivity.hours_release || 0) +
      parseFloat(newActivity.hours_pm || 0) +
      parseFloat(newActivity.hours_startup || 0) +
      parseFloat(newActivity.hours_documentation || 0);
    const contingency = total * (formData.contingency_percentage / 100);
    return {
      contingency: formatHours(contingency),
      total: formatHours(total + contingency),
    };
  };

  const totals = computeNewActivityTotals();

  return (
    <tr className="bg-cyan-50">
      <td className="px-0.5 lg:px-3 py-1.5 overflow-visible">
        <div className="relative h-8">
          <textarea
            ref={nameInputRef}
            value={newActivity.activity_name}
            onChange={(e) => setNewActivity({ ...newActivity, activity_name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                const nextField = e.currentTarget.closest("td")?.nextElementSibling?.querySelector("input, textarea");
                if (nextField) nextField.focus();
              }
            }}
            rows={1}
            className="absolute left-0 top-0 w-full h-8 px-1 lg:px-2 py-1 border border-gray-300 rounded text-xs lg:text-sm resize-none overflow-hidden focus:w-[400px] focus:h-20 focus:z-50 focus:shadow-2xl focus:border-cyan-400 focus:bg-white focus:overflow-auto transition-all duration-200"
            placeholder={t('estimator:itemNamePlaceholder')}
          />
        </div>
      </td>
      <td className="px-0.5 lg:px-3 py-1.5 overflow-visible">
        <div className="relative h-8">
          <textarea
            value={newActivity.activity_detail}
            onChange={(e) => setNewActivity({ ...newActivity, activity_detail: e.target.value })}
            onKeyDown={handleTabToNext}
            rows={1}
            className="absolute left-0 top-0 w-full h-8 px-1 lg:px-2 py-1 border border-gray-300 rounded text-xs lg:text-sm resize-none overflow-hidden focus:w-[400px] focus:h-20 focus:z-50 focus:shadow-2xl focus:border-cyan-400 focus:bg-white focus:overflow-auto transition-all duration-200"
            placeholder={t('estimator:itemDetailPlaceholder')}
          />
        </div>
      </td>

      {/* Analysis - disabled */}
      <td className="px-0 lg:px-1 py-1.5">
        <input
          type="number"
          step="0.1"
          value={newActivity.hours_analysis ? formatHours(newActivity.hours_analysis) : ""}
          disabled
          className="w-full px-1 py-1 border border-gray-200 rounded text-right text-xs lg:text-sm bg-gray-100 text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0"
        />
      </td>

      {/* Development - editable */}
      <td className="px-0 lg:px-1 py-1.5">
        <input
          type="number"
          step="0.1"
          value={newActivity.hours_development || ""}
          onChange={(e) => setNewActivity({ ...newActivity, hours_development: e.target.value })}
          onBlur={(e) => onDevInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onDevInputChange(e.target.value); }}
          onWheel={(e) => e.target.blur()}
          className="w-full px-1 py-1 border border-cyan-400 rounded text-right text-xs lg:text-sm bg-cyan-50 focus:ring-2 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0"
        />
      </td>

      {/* Other phase fields - disabled */}
      {DISABLED_PHASE_FIELDS.map(({ key }) => (
        <td key={key} className="px-0 lg:px-1 py-1.5">
          <input
            type="number"
            step="0.1"
            value={newActivity[key] ? formatHours(newActivity[key]) : ""}
            disabled
            className="w-full px-1 py-1 border border-gray-200 rounded text-right text-xs lg:text-sm bg-gray-100 text-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="0"
          />
        </td>
      ))}

      {/* Contingency */}
      <td className="px-0 lg:px-1 py-1.5 text-right text-xs lg:text-sm text-gray-600">
        {totals.contingency}
      </td>

      {/* Total with contingency */}
      <td className="px-0 lg:px-1 py-1.5 text-right text-xs lg:text-sm font-medium text-cyan-600">
        {totals.total}
      </td>

      {/* Actions */}
      <td className="pl-4 pr-2 lg:pl-6 lg:pr-2 py-1.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <Button
            onClick={onAdd}
            disabled={!newActivity.activity_name.trim() || !newActivity.hours_development}
            variant="ghost"
            color="green"
            size="sm"
            icon={Save}
            iconSize={16}
            title={t('common:save')}
          />
          <Button
            onClick={onCancel}
            variant="ghost"
            color="gray"
            size="sm"
            icon={X}
            iconSize={16}
            title={t('common:cancel')}
          />
        </div>
      </td>
    </tr>
  );
});

export default EstimateNewActivityRow;
