import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Edit2, RefreshCw, Save, X } from "lucide-react";
import Button from "../../../shared/ui/Button";
import { calculateTotalHours } from "../utils/estimateCalculations";

const PHASE_FIELDS = [
  "hours_analysis",
  "hours_development",
  "hours_internal_test",
  "hours_uat",
  "hours_release",
  "hours_pm",
  "hours_startup",
  "hours_documentation",
];

const EstimateActivityRow = memo(function EstimateActivityRow({
  activity,
  index,
  isEditing,
  isConverted,
  hoveredCell,
  formatHours,
  getContingencyHours,
  onFieldChange,
  onHoursBlur,
  onSave,
  onEdit,
  onCancelEdit,
  onRecalculate,
  onDelete,
  onTooltipEnter,
  onTooltipLeave,
  newActivityNameInputRef,
}) {
  const { t } = useTranslation(['estimator', 'common']);

  const phaseHours = {
    hours_analysis: parseFloat(activity.hours_analysis) || 0,
    hours_development: parseFloat(activity.hours_development) || 0,
    hours_internal_test: parseFloat(activity.hours_internal_test) || 0,
    hours_uat: parseFloat(activity.hours_uat) || 0,
    hours_release: parseFloat(activity.hours_release) || 0,
    hours_pm: parseFloat(activity.hours_pm) || 0,
    hours_startup: parseFloat(activity.hours_startup) || 0,
    hours_documentation: parseFloat(activity.hours_documentation) || 0,
  };
  const total = calculateTotalHours(phaseHours);
  const contingency = getContingencyHours(total);
  const actualContingency =
    activity.hours_contingency != null
      ? parseFloat(activity.hours_contingency) || 0
      : contingency;
  const totalWithCont = total + actualContingency;

  const renderTextareaCell = (field, _placeholder) => {
    const value = field === "activity_name" ? activity.activity_name : (activity.activity_detail || "");
    const tooltipKey = field === "activity_name" ? `name-view-${index}` : `detail-view-${index}`;

    if (isEditing) {
      return (
        <div className="relative h-8">
          <textarea
            value={value}
            onChange={(e) => onFieldChange(index, field, e.target.value)}
            onKeyDown={(e) => {
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
            }}
            rows={1}
            className="absolute left-0 top-0 w-full h-8 px-1 lg:px-2 py-1 border border-gray-300 rounded text-xs lg:text-sm resize-none overflow-hidden focus:w-[400px] focus:h-20 focus:z-50 focus:shadow-2xl focus:border-cyan-400 focus:bg-white focus:overflow-auto transition-all duration-200"
          />
        </div>
      );
    }

    return (
      <div className="relative h-8">
        <div
          onMouseEnter={(e) => onTooltipEnter(tooltipKey, e.currentTarget)}
          onMouseLeave={onTooltipLeave}
          className={`absolute left-0 top-0 px-1 lg:px-2 py-1 border rounded text-xs lg:text-sm cursor-default ${
            hoveredCell === tooltipKey
              ? "shadow-2xl border-blue-400 bg-blue-50 z-50 w-[400px] min-h-20 whitespace-normal"
              : "w-full h-8 border-transparent overflow-hidden whitespace-nowrap truncate"
          }`}
        >
          {value || "-"}
        </div>
      </div>
    );
  };

  const renderPhaseCell = (field) => {
    const value = parseFloat(activity[field] || 0);

    if (isEditing) {
      return (
        <input
          type="number"
          step="1"
          value={Math.round(value)}
          onChange={(e) => onFieldChange(index, field, parseFloat(e.target.value) || 0)}
          onBlur={(e) => onHoursBlur(index, field, e.target.value)}
          onWheel={(e) => e.target.blur()}
          className="w-full px-1 py-1 border border-cyan-300 rounded text-right text-xs lg:text-sm bg-cyan-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      );
    }

    return <span className="text-xs lg:text-sm">{formatHours(value)}</span>;
  };

  const renderContingencyCell = () => {
    if (isEditing) {
      return (
        <input
          type="number"
          step="1"
          value={Math.round(parseFloat(actualContingency || 0))}
          onChange={(e) => onFieldChange(index, "hours_contingency", parseFloat(e.target.value) || 0)}
          onBlur={(e) => onHoursBlur(index, "hours_contingency", e.target.value)}
          onWheel={(e) => e.target.blur()}
          className="w-full px-1 py-1 border border-cyan-300 rounded text-right text-xs lg:text-sm bg-cyan-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      );
    }

    return <span className="text-xs lg:text-sm">{formatHours(actualContingency)}</span>;
  };

  return (
    <tr
      key={activity.estimate_task_id || activity.tempId || index}
      className={`relative ${isEditing ? "bg-yellow-50" : "hover:bg-gray-50"}`}
    >
      <td className="px-0.5 lg:px-3 py-1.5 overflow-visible">
        {renderTextareaCell("activity_name")}
      </td>
      <td className="px-0.5 lg:px-3 py-1.5 text-gray-600 overflow-visible">
        {renderTextareaCell("activity_detail")}
      </td>

      {PHASE_FIELDS.map((field) => (
        <td key={field} className="px-0 lg:px-1 py-1.5 text-right text-gray-600">
          {renderPhaseCell(field)}
        </td>
      ))}

      <td className="px-0 lg:px-1 py-1.5 text-right text-gray-600">
        {renderContingencyCell()}
      </td>
      <td className="px-0 lg:px-1 py-1.5 text-right font-medium text-cyan-600">
        <span className="text-xs lg:text-sm">{formatHours(totalWithCont)}</span>
      </td>
      <td className="pl-4 pr-2 lg:pl-6 lg:pr-2 py-1.5 text-center">
        <div className="flex items-center justify-center gap-1">
          {isEditing ? (
            <>
              <Button
                onClick={() => onSave(index, false)}
                onKeyDown={(e) => {
                  if (e.key === "Tab" && !e.shiftKey) {
                    e.preventDefault();
                    if (newActivityNameInputRef?.current) {
                      newActivityNameInputRef.current.focus();
                    }
                  }
                }}
                variant="ghost"
                color="green"
                size="sm"
                icon={Save}
                iconSize={16}
                title={t('estimator:saveWithoutRecalc')}
              />
              <Button
                onClick={() => onSave(index, true)}
                variant="ghost"
                color="cyan"
                size="sm"
                icon={RefreshCw}
                iconSize={16}
                title={t('estimator:saveAndRecalc')}
              />
              <Button
                onClick={() => onCancelEdit(index)}
                variant="ghost"
                color="gray"
                size="sm"
                icon={X}
                iconSize={16}
                title={t('common:cancel')}
              />
            </>
          ) : (
            <>
              {!isConverted && (
                <>
                  <Button
                    onClick={() => onEdit(index)}
                    variant="ghost"
                    color="cyan"
                    size="sm"
                    icon={Edit2}
                    iconSize={16}
                    title={t('estimator:editTitle')}
                  />
                  <Button
                    onClick={() => onRecalculate(index)}
                    variant="ghost"
                    color="blue"
                    size="sm"
                    icon={RefreshCw}
                    iconSize={16}
                    title={t('estimator:recalcE2EFromDev')}
                  />
                  <Button
                    confirmAction
                    onConfirm={() => onDelete(index, activity)}
                    itemName={activity.activity_name}
                    size="sm"
                  />
                </>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

export default EstimateActivityRow;
