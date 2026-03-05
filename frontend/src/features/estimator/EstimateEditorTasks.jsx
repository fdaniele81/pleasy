import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronDown, Download, Edit2, Info } from "lucide-react";
import Button from "../../shared/ui/Button";
import useDropdownManager from "../../shared/ui/filters/useDropdownManager";
import { useEstimateEditorState } from "./hooks/useEstimateEditorState";
import { useEstimateEditorActions } from "./hooks/useEstimateEditorActions";
import {
  PercentagesModal,
  ActivityTableHeader,
  EstimateInfoModal,
  EstimateInfoBar,
  EstimateActivityRow,
  EstimateNewActivityRow,
  EstimateTotalsRow,
} from "./components";

function EstimateEditorTasks() {
  const { t } = useTranslation(['estimator', 'common']);
  const navigate = useNavigate();

  const state = useEstimateEditorState();
  const {
    clients,
    currentEstimate,
    estimateLoading,
    formData,
    projectKey,
    activities,
    newActivity,
    setNewActivity,
    savedEstimateId,
    editingActivityIndex,
    showPercentagesModal,
    setShowPercentagesModal,
    showInfoModal,
    setShowInfoModal,
    newActivityNameInputRef,
    hoveredCell,
    handleTooltipEnter,
    handleTooltipLeave,
    isReadOnly,
    showInDays,
    setShowInDays,
    totals,
    formatHours,
  } = state;

  const { toggleDropdown, isDropdownOpen, getDropdownRef } = useDropdownManager();

  const actions = useEstimateEditorActions(state);
  const {
    getContingencyHours,
    handleDevInputChange,
    handleCancelNewActivity,
    handleAddActivity,
    handleDeleteActivity,
    handleEditActivity,
    handleSaveActivity,
    handleCancelEdit,
    handleActivityFieldChange,
    handleHoursBlur,
    handleRecalculateActivity,
    handleSaveAndRecalculate,
    handleSavePercentagesOnly,
    handleSaveInfo,
    handleExportEstimate,
  } = actions;

  if (estimateLoading && !currentEstimate) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6 pt-20">
          <div className="text-xl">{t('estimator:loadingEstimate')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-18">
      <div className="max-w-full mx-auto px-6 lg:px-2 xl:px-12 py-6">
        <EstimateInfoBar
          clients={clients}
          formData={formData}
          projectKey={projectKey}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold text-gray-800">
                {t('estimator:estimateItems')}
              </h2>
              <span className="text-xs text-gray-500">
                {showInDays ? t('estimator:valuesInDays') : t('estimator:valuesInHours')}
              </span>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('unit-dropdown')}
                  className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 min-w-[75px] justify-between"
                >
                  <span className="truncate">{showInDays ? t('estimator:unitDays') : t('estimator:unitHours')}</span>
                  <ChevronDown size={14} className="shrink-0" />
                </button>
                <div
                  ref={getDropdownRef('unit-dropdown')}
                  className={`${isDropdownOpen('unit-dropdown') ? '' : 'hidden'} absolute top-full left-0 mt-1 w-32 bg-white border border-gray-300 rounded-lg shadow-lg z-50`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowInDays(false);
                        toggleDropdown('unit-dropdown');
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                        !showInDays ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {t('estimator:unitHours')}
                    </button>
                    <button
                      onClick={() => {
                        setShowInDays(true);
                        toggleDropdown('unit-dropdown');
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                        showInDays ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {t('estimator:unitDays')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activities.length > 0 && (
                <Button
                  onClick={handleExportEstimate}
                  color="green"
                  size="sm"
                  icon={Download}
                  iconSize={14}
                  title={t('estimator:exportToExcel')}
                >
                  {t('common:export')}
                </Button>
              )}
              {currentEstimate?.status !== "CONVERTED" && (
                <Button
                  onClick={() => setShowPercentagesModal(true)}
                  color="cyan"
                  size="sm"
                  icon={Edit2}
                  iconSize={14}
                >
                  {t('estimator:editE2E')}
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto lg:overflow-x-visible">
            <table className="w-full text-sm table-fixed border-collapse">
              <colgroup>
                <col className="w-[18%] lg:w-[17%]" />
                <col className="w-[15%] lg:w-[14%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[6%]" />
                <col className="w-[7%] lg:w-[9%]" />
              </colgroup>
              <ActivityTableHeader formData={formData} showInDays={showInDays} />
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity, index) => (
                  <EstimateActivityRow
                    key={activity.estimate_task_id || activity.tempId || index}
                    activity={activity}
                    index={index}
                    isEditing={editingActivityIndex === index}
                    isConverted={currentEstimate?.status === "CONVERTED"}
                    hoveredCell={hoveredCell}
                    formatHours={formatHours}
                    getContingencyHours={getContingencyHours}
                    onFieldChange={handleActivityFieldChange}
                    onHoursBlur={handleHoursBlur}
                    onSave={handleSaveActivity}
                    onEdit={handleEditActivity}
                    onCancelEdit={handleCancelEdit}
                    onRecalculate={handleRecalculateActivity}
                    onDelete={handleDeleteActivity}
                    onTooltipEnter={handleTooltipEnter}
                    onTooltipLeave={handleTooltipLeave}
                    newActivityNameInputRef={newActivityNameInputRef}
                    showInDays={showInDays}
                  />
                ))}

                {currentEstimate?.status !== "CONVERTED" && (
                  <EstimateNewActivityRow
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
                  <EstimateTotalsRow totals={totals} formatHours={formatHours} />
                )}
              </tbody>
            </table>
          </div>

          {activities.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {t('estimator:noItemsMessage')}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 mt-6">
          <Button
            onClick={() => navigate('/estimator')}
            variant="outline"
            icon={ArrowLeft}
            iconSize={18}
          >
            {t('estimator:backToList')}
          </Button>
          <Button
            onClick={() => setShowInfoModal(true)}
            variant="outline"
            color="cyan"
            icon={Info}
            iconSize={18}
          >
            {isReadOnly ? t('estimator:viewEstimateInfo') : t('estimator:editEstimateInfo')}
          </Button>
        </div>
      </div>

      <PercentagesModal
        isOpen={showPercentagesModal}
        onClose={() => setShowPercentagesModal(false)}
        formData={formData}
        savedEstimateId={savedEstimateId}
        onSaveOnly={handleSavePercentagesOnly}
        onSaveAndRecalculate={handleSaveAndRecalculate}
        isReadOnly={isReadOnly}
      />

      <EstimateInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        formData={formData}
        projectKey={projectKey}
        clients={clients}
        isReadOnly={isReadOnly}
        onSave={handleSaveInfo}
        projectManagers={currentEstimate?.project_managers || []}
        status={currentEstimate?.status}
      />
    </div>
  );
}

export default EstimateEditorTasks;
