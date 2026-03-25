import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronDown, Download, Edit2, FileText, Info } from "lucide-react";
import Button from "../../shared/ui/Button";
import useDropdownManager from "../../shared/ui/filters/useDropdownManager";
import { useEstimateEditorState } from "./hooks/useEstimateEditorState";
import { useEstimateEditorActions } from "./hooks/useEstimateEditorActions";
import { useEstimateEditorUndo } from "./hooks/useEstimateEditorUndo";
import {
  PercentagesModal,
  ActivityTableHeader,
  EstimateInfoModal,
  EstimateInfoBar,
  EstimateActivityRow,
  EstimateNewActivityRow,
  EstimateTotalsRow,
  EstimateMobileView,
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

  const isEditingRef = useRef(false);
  const cancelEditingRef = useRef(null);
  const activateCellRef = useRef(null);
  const { pushUndo } = useEstimateEditorUndo({ isEditingRef, cancelEditingRef, activateCellRef });

  isEditingRef.current = editingActivityIndex !== null;
  activateCellRef.current = (command, updatedTask) => {
    if (command.type === 'restore' && updatedTask) {
      // Undo delete: re-insert the task at its original position
      const updatedActivities = [...activities];
      const insertAt = Math.min(command.index ?? activities.length, activities.length);
      updatedActivities.splice(insertAt, 0, updatedTask);
      state.setActivities(updatedActivities);
    } else if (command.type === 'remove') {
      // Redo delete: remove the task again
      state.setActivities(activities.filter(
        (a) => a.estimate_task_id !== command.taskId
      ));
    } else if (updatedTask) {
      const idx = activities.findIndex(
        (a) => a.estimate_task_id === command.taskId
      );
      if (idx !== -1) {
        const updatedActivities = [...activities];
        updatedActivities[idx] = updatedTask;
        state.setActivities(updatedActivities);
      }
    }
  };

  const actions = useEstimateEditorActions({ ...state, pushUndo });
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

  cancelEditingRef.current = () => {
    if (editingActivityIndex !== null) {
      handleCancelEdit(editingActivityIndex);
    }
  };

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
    <div className="min-h-screen bg-gray-50 pt-16 sm:pt-20">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-2 xl:px-12 pt-2 pb-4 sm:py-6">
        <EstimateInfoBar
          clients={clients}
          formData={formData}
          projectKey={projectKey}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-lg font-semibold text-gray-800">
                {t('estimator:estimateItems')}
              </h2>
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
              {currentEstimate?.status !== "CONVERTED" && activities.length === 0 && (
                <Button
                  onClick={() => setNewActivity((prev) => ({
                    ...prev,
                    activity_name: formData.title || '',
                    activity_detail: formData.description || '',
                  }))}
                  color="gray"
                  size="sm"
                  icon={FileText}
                  iconSize={14}
                >
                  {t('estimator:singleItemEstimate')}
                </Button>
              )}
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

          {/* Desktop table view (lg+) */}
          <div className="hidden lg:block overflow-x-visible">
            <table className="w-full text-sm table-fixed border-collapse">
              <colgroup>
                <col className="w-[17%]" />
                <col className="w-[14%]" />
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
                <col className="w-[9%]" />
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

          {/* Mobile card view (< lg) */}
          <div className="lg:hidden p-1.5 sm:p-3">
            <EstimateMobileView
              activities={activities}
              editingActivityIndex={editingActivityIndex}
              currentEstimate={currentEstimate}
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
              totals={totals}
              newActivity={newActivity}
              setNewActivity={setNewActivity}
              formData={formData}
              onDevInputChange={handleDevInputChange}
              onAdd={handleAddActivity}
              onCancel={handleCancelNewActivity}
              newActivityNameInputRef={newActivityNameInputRef}
            />
          </div>

          {activities.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {t('estimator:noItemsMessage')}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
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
