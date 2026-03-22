import React, { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Edit2, RefreshCw, Save, X, Plus } from "lucide-react";
import Button from "../../../shared/ui/Button";
import { calculateTotalHours } from "../utils/estimateCalculations";

const PHASE_FIELDS = [
  { key: "hours_analysis", label: "phaseAnalysis" },
  { key: "hours_development", label: "phaseDevelopment" },
  { key: "hours_internal_test", label: "phaseInternalTest" },
  { key: "hours_uat", label: "phaseUAT" },
  { key: "hours_release", label: "phaseRelease" },
  { key: "hours_pm", label: "phasePM" },
  { key: "hours_startup", label: "phaseStartup" },
  { key: "hours_documentation", label: "phaseDocumentation" },
];

/* ─── Single activity card ─── */
const MobileActivityCard = memo(function MobileActivityCard({
  activity,
  index,
  isEditing,
  isConverted,
  formatHours,
  getContingencyHours,
  onFieldChange,
  onHoursBlur,
  onSave,
  onEdit,
  onCancelEdit,
  onRecalculate,
  onDelete,
  showInDays,
}) {
  const { t } = useTranslation(["estimator", "common"]);
  const [expanded, setExpanded] = useState(false);

  const phaseHours = {};
  PHASE_FIELDS.forEach(({ key }) => {
    phaseHours[key] = parseFloat(activity[key]) || 0;
  });
  const total = calculateTotalHours(phaseHours);
  const contingency = getContingencyHours(total);
  const actualContingency =
    activity.hours_contingency != null
      ? parseFloat(activity.hours_contingency) || 0
      : contingency;
  const totalWithCont = total + actualContingency;

  const renderPhaseInput = (field) => {
    const value = parseFloat(activity[field] || 0);
    const displayValue = showInDays
      ? Math.round((value / 8) * 10) / 10
      : Math.round(value * 10) / 10;
    return (
      <input
        type="number"
        step={showInDays ? "0.5" : "0.1"}
        value={displayValue}
        onChange={(e) => {
          const val = parseFloat(e.target.value) || 0;
          onFieldChange(index, field, showInDays ? val * 8 : val);
        }}
        onBlur={(e) => {
          const val = parseFloat(e.target.value) || 0;
          onHoursBlur(index, field, showInDays ? val * 8 : val);
        }}
        onWheel={(e) => e.target.blur()}
        className="w-20 px-2 py-1 border border-cyan-300 rounded text-right text-sm bg-cyan-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    );
  };

  return (
    <div
      className={`rounded-lg border shadow-sm mb-3 ${
        isEditing ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-white"
      }`}
    >
      {/* Card header - always visible */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <textarea
                value={activity.activity_name}
                onChange={(e) => onFieldChange(index, "activity_name", e.target.value)}
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                placeholder={t("estimator:itemNamePlaceholder")}
              />
            ) : (
              <h3 className="font-medium text-gray-900 text-sm leading-tight">
                {activity.activity_name || "-"}
              </h3>
            )}
            {isEditing ? (
              <textarea
                value={activity.activity_detail || ""}
                onChange={(e) => onFieldChange(index, "activity_detail", e.target.value)}
                rows={2}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs resize-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                placeholder={t("estimator:itemDetailPlaceholder")}
              />
            ) : (
              activity.activity_detail && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {activity.activity_detail}
                </p>
              )
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-cyan-700">
              {formatHours(totalWithCont)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">
              {t("common:total")}
            </div>
          </div>
        </div>

        {/* Quick summary row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>
              Dev: <span className="font-medium text-gray-700">{formatHours(phaseHours.hours_development)}</span>
            </span>
            <span>
              Cont: <span className="font-medium text-gray-700">{formatHours(actualContingency)}</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button onClick={() => onSave(index, false)} variant="ghost" color="green" size="sm" icon={Save} iconSize={16} title={t("estimator:saveWithoutRecalc")} />
                <Button onClick={() => onSave(index, true)} variant="ghost" color="cyan" size="sm" icon={RefreshCw} iconSize={16} title={t("estimator:saveAndRecalc")} />
                <Button onClick={() => onCancelEdit(index)} variant="ghost" color="gray" size="sm" icon={X} iconSize={16} title={t("common:cancel")} />
              </>
            ) : (
              <>
                {!isConverted && (
                  <>
                    <Button onClick={() => onEdit(index)} variant="ghost" color="cyan" size="sm" icon={Edit2} iconSize={16} title={t("estimator:editTitle")} />
                    <Button onClick={() => onRecalculate(index)} variant="ghost" color="blue" size="sm" icon={RefreshCw} iconSize={16} title={t("estimator:recalcE2EFromDev")} />
                    <Button confirmAction onConfirm={() => onDelete(index, activity)} itemName={activity.activity_name} size="sm" />
                  </>
                )}
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                >
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded phase breakdown */}
      {(expanded || isEditing) && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2">
            {PHASE_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{t(`estimator:${label}`)}</span>
                {isEditing ? (
                  renderPhaseInput(key)
                ) : (
                  <span className="text-xs font-medium text-gray-700">
                    {formatHours(phaseHours[key])}
                  </span>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{t("estimator:phaseContingency")}</span>
              {isEditing ? (
                <input
                  type="number"
                  step={showInDays ? "0.5" : "0.1"}
                  value={
                    showInDays
                      ? Math.round((actualContingency / 8) * 10) / 10
                      : Math.round(actualContingency * 10) / 10
                  }
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onFieldChange(index, "hours_contingency", showInDays ? val * 8 : val);
                  }}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onHoursBlur(index, "hours_contingency", showInDays ? val * 8 : val);
                  }}
                  onWheel={(e) => e.target.blur()}
                  className="w-20 px-2 py-1 border border-cyan-300 rounded text-right text-sm bg-cyan-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              ) : (
                <span className="text-xs font-medium text-gray-700">
                  {formatHours(actualContingency)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between col-span-2 pt-1 border-t border-gray-200">
              <span className="text-xs font-semibold text-gray-700">{t("common:total")}</span>
              <span className="text-sm font-bold text-cyan-700">{formatHours(totalWithCont)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

/* ─── New activity card (mobile) ─── */
const MobileNewActivityCard = memo(function MobileNewActivityCard({
  newActivity,
  setNewActivity,
  formData,
  formatHours,
  onDevInputChange,
  onAdd,
  onCancel,
  nameInputRef,
  showInDays,
}) {
  const { t } = useTranslation(["estimator", "common"]);

  const computeTotals = () => {
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
    return { contingency: formatHours(contingency), total: formatHours(total + contingency) };
  };

  const totals = computeTotals();

  return (
    <div className="rounded-lg border-2 border-dashed border-cyan-300 bg-cyan-50 p-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Plus size={14} className="text-cyan-600" />
        <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">
          {t("estimator:itemNamePlaceholder")}
        </span>
      </div>

      <textarea
        ref={nameInputRef}
        value={newActivity.activity_name}
        onChange={(e) => setNewActivity({ ...newActivity, activity_name: e.target.value })}
        rows={2}
        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm resize-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 bg-white mb-2"
        placeholder={t("estimator:itemNamePlaceholder")}
      />
      <textarea
        value={newActivity.activity_detail}
        onChange={(e) => setNewActivity({ ...newActivity, activity_detail: e.target.value })}
        rows={2}
        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs resize-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 bg-white mb-3"
        placeholder={t("estimator:itemDetailPlaceholder")}
      />

      <div className="flex items-center gap-3 mb-3">
        <label className="text-xs font-medium text-gray-600">
          {t("estimator:phaseDevelopment")}
        </label>
        <input
          type="number"
          step={showInDays ? "0.5" : "0.1"}
          value={
            showInDays && newActivity.hours_development
              ? parseFloat(newActivity.hours_development) / 8
              : newActivity.hours_development || ""
          }
          onChange={(e) => {
            const raw = e.target.value;
            setNewActivity({
              ...newActivity,
              hours_development: showInDays && raw !== "" ? parseFloat(raw) * 8 : raw,
            });
          }}
          onBlur={(e) => {
            const raw = e.target.value;
            onDevInputChange(showInDays && raw !== "" ? parseFloat(raw) * 8 : raw);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const raw = e.target.value;
              onDevInputChange(showInDays && raw !== "" ? parseFloat(raw) * 8 : raw);
            }
          }}
          onWheel={(e) => e.target.blur()}
          className="w-24 px-2 py-1.5 border border-cyan-400 rounded text-right text-sm bg-white focus:ring-2 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0"
        />
        <span className="text-xs text-gray-400">
          {showInDays ? t("estimator:unitDays") : t("estimator:unitHours")}
        </span>
      </div>

      {newActivity.hours_development_input && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3 text-xs">
          {PHASE_FIELDS.filter((f) => f.key !== "hours_development").map(({ key, label }) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-500">{t(`estimator:${label}`)}</span>
              <span className="text-gray-700">{newActivity[key] ? formatHours(newActivity[key]) : "-"}</span>
            </div>
          ))}
          <div className="flex justify-between">
            <span className="text-gray-500">{t("estimator:phaseContingency")}</span>
            <span className="text-gray-700">{totals.contingency}</span>
          </div>
          <div className="flex justify-between col-span-2 pt-1 border-t border-cyan-200 font-semibold">
            <span className="text-gray-700">{t("common:total")}</span>
            <span className="text-cyan-700">{totals.total}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button onClick={onCancel} variant="outline" color="gray" size="sm" icon={X} iconSize={14}>
          {t("common:cancel")}
        </Button>
        <Button
          onClick={onAdd}
          disabled={!newActivity.activity_name.trim() || !newActivity.hours_development}
          color="green"
          size="sm"
          icon={Save}
          iconSize={14}
        >
          {t("common:save")}
        </Button>
      </div>
    </div>
  );
});

/* ─── Totals summary card (mobile) ─── */
const MobileTotalsCard = memo(function MobileTotalsCard({ totals, formatHours }) {
  const { t } = useTranslation(["estimator", "common"]);
  const [expanded, setExpanded] = useState(false);

  const phaseItems = [
    { label: "phaseAnalysis", value: totals.totalAnalysis },
    { label: "phaseDevelopment", value: totals.totalDevelopment },
    { label: "phaseInternalTest", value: totals.totalInternalTest },
    { label: "phaseUAT", value: totals.totalUat },
    { label: "phaseRelease", value: totals.totalRelease },
    { label: "phasePM", value: totals.totalPm },
    { label: "phaseStartup", value: totals.totalStartup },
    { label: "phaseDocumentation", value: totals.totalDocumentation },
    { label: "phaseContingency", value: totals.contingencyHours },
  ];

  return (
    <div className="rounded-lg border-2 border-cyan-200 bg-gradient-to-r from-cyan-50 to-white shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between"
      >
        <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          {t("common:total")}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-cyan-700">
            {formatHours(totals.totalWithContingency)}
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-cyan-100">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2">
            {phaseItems.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{t(`estimator:${label}`)}</span>
                <span className="text-xs font-medium text-gray-700">{formatHours(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

/* ─── Main mobile view wrapper ─── */
const EstimateMobileView = memo(function EstimateMobileView({
  activities,
  editingActivityIndex,
  currentEstimate,
  formatHours,
  getContingencyHours,
  onFieldChange: handleActivityFieldChange,
  onHoursBlur: handleHoursBlur,
  onSave: handleSaveActivity,
  onEdit: handleEditActivity,
  onCancelEdit: handleCancelEdit,
  onRecalculate: handleRecalculateActivity,
  onDelete: handleDeleteActivity,
  showInDays,
  totals,
  newActivity,
  setNewActivity,
  formData,
  onDevInputChange: handleDevInputChange,
  onAdd: handleAddActivity,
  onCancel: handleCancelNewActivity,
  newActivityNameInputRef,
}) {
  return (
    <div>
      {activities.map((activity, index) => (
        <MobileActivityCard
          key={activity.estimate_task_id || activity.tempId || index}
          activity={activity}
          index={index}
          isEditing={editingActivityIndex === index}
          isConverted={currentEstimate?.status === "CONVERTED"}
          formatHours={formatHours}
          getContingencyHours={getContingencyHours}
          onFieldChange={handleActivityFieldChange}
          onHoursBlur={handleHoursBlur}
          onSave={handleSaveActivity}
          onEdit={handleEditActivity}
          onCancelEdit={handleCancelEdit}
          onRecalculate={handleRecalculateActivity}
          onDelete={handleDeleteActivity}
          showInDays={showInDays}
        />
      ))}

      {currentEstimate?.status !== "CONVERTED" && (
        <MobileNewActivityCard
          newActivity={newActivity}
          setNewActivity={setNewActivity}
          formData={formData}
          formatHours={formatHours}
          onDevInputChange={handleDevInputChange}
          onAdd={handleAddActivity}
          onCancel={handleCancelNewActivity}
          nameInputRef={newActivityNameInputRef}
          showInDays={showInDays}
        />
      )}

      {activities.length > 0 && (
        <MobileTotalsCard totals={totals} formatHours={formatHours} />
      )}
    </div>
  );
});

export default EstimateMobileView;
