import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Download, Edit2, Info } from "lucide-react";
import Button from "../../shared/ui/Button";
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
    totals,
    formatHours,
  } = state;

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
                {t('estimator:valuesInHours')}
              </span>
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
              <ActivityTableHeader formData={formData} />
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
