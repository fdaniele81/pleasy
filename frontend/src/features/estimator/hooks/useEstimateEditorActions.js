import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { addToast } from "../../../store/slices/toastSlice";
import {
  useUpdateEstimateMutation,
  useCreateEstimateTaskMutation,
  useUpdateEstimateTaskMutation,
  useDeleteEstimateTaskMutation,
} from "../api/estimateEndpoints";
import {
  useCreateOrUpdateDraftMutation,
} from "../api/projectDraftEndpoints";
import {
  calculatePhaseHours,
  calculateContingencyHours,
  calculateAllFromDev,
} from "../utils/estimateCalculations";

export function useEstimateEditorActions({
  formData,
  setFormData,
  activities,
  setActivities,
  newActivity,
  setNewActivity,
  savedEstimateId,
  setEditingActivityIndex,
  setShowPercentagesModal,
  setHoveredCell,
  newActivityNameInputRef,
  currentEstimate,
  refetchEstimate,
  clients,
  projectKey,
  setProjectKey,
  EMPTY_NEW_ACTIVITY,
  pushUndo,
}) {
  const { t } = useTranslation(['estimator', 'common']);
  const dispatch = useDispatch();
  const [updateEstimate] = useUpdateEstimateMutation();
  const [createEstimateTask] = useCreateEstimateTaskMutation();
  const [updateEstimateTask] = useUpdateEstimateTaskMutation();
  const [deleteEstimateTask] = useDeleteEstimateTaskMutation();
  const [createOrUpdateDraft] = useCreateOrUpdateDraftMutation();

  const getPhaseHours = (inputHours) => calculatePhaseHours(inputHours, formData);

  const roundTo1 = (v) => Math.round(v * 10) / 10;

  const getContingencyHours = (totalHours) =>
    roundTo1(calculateContingencyHours(totalHours, formData.contingency_percentage));

  const focusNewActivityInput = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (newActivityNameInputRef.current) {
          newActivityNameInputRef.current.focus();
        }
      });
    });
  };

  const handleDevInputChange = (devHours) => {
    const dev = parseFloat(devHours) || 0;

    if (dev === 0 || formData.pct_development === 0) {
      setNewActivity({ ...newActivity, ...EMPTY_NEW_ACTIVITY, activity_name: newActivity.activity_name, activity_detail: newActivity.activity_detail });
      return;
    }

    const calculated = calculateAllFromDev(dev, formData);
    setNewActivity({
      ...newActivity,
      hours_development: dev,
      ...calculated,
    });
  };

  const handleCancelNewActivity = () => {
    setNewActivity({ ...EMPTY_NEW_ACTIVITY });
  };

  const handleAddActivity = async () => {
    if (!newActivity.activity_name.trim() || !newActivity.hours_development_input) {
      dispatch(addToast({ message: t('estimator:enterNameAndHours'), type: "error" }));
      return;
    }

    const phaseHours = getPhaseHours(newActivity.hours_development_input);
    const activityWithCalculations = {
      ...newActivity,
      ...phaseHours,
      hours_development_input: parseFloat(newActivity.hours_development_input),
    };

    if (savedEstimateId) {
      try {
        const task = await createEstimateTask({
          estimateId: savedEstimateId,
          taskData: {
            activity_name: newActivity.activity_name,
            activity_detail: newActivity.activity_detail,
            hours_development_input: parseFloat(newActivity.hours_development_input),
          }
        }).unwrap();
        setActivities([...activities, task]);
        dispatch(addToast({ message: t('estimator:estimateItemAdded'), type: "success" }));
      } catch (error) {
        dispatch(addToast({ message: t('estimator:errorPrefix', { message: error.message }), type: "error" }));
        return;
      }
    } else {
      setActivities([...activities, { ...activityWithCalculations, tempId: Date.now() }]);
    }

    setNewActivity({ ...EMPTY_NEW_ACTIVITY });
    setHoveredCell(null);
    focusNewActivityInput();
  };

  const handleDeleteActivity = async (index, task) => {
    if (task.estimate_task_id && savedEstimateId) {
      try {
        await deleteEstimateTask({
          estimateId: savedEstimateId,
          taskId: task.estimate_task_id
        }).unwrap();

        pushUndo({
          type: 'delete',
          estimateId: savedEstimateId,
          taskId: task.estimate_task_id,
          taskData: extractTaskFields(task),
          index,
        });

        setActivities(activities.filter((_, i) => i !== index));
        dispatch(addToast({ message: t('estimator:estimateItemDeleted'), type: "success" }));
      } catch (error) {
        dispatch(addToast({ message: t('estimator:errorPrefix', { message: error.message }), type: "error" }));
      }
    } else {
      setActivities(activities.filter((_, i) => i !== index));
    }
  };

  const handleEditActivity = (index) => {
    setEditingActivityIndex(index);
  };

  const extractTaskFields = (task) => ({
    activity_name: task.activity_name,
    activity_detail: task.activity_detail,
    hours_development_input: task.hours_development_input,
    hours_analysis: task.hours_analysis,
    hours_development: task.hours_development,
    hours_internal_test: task.hours_internal_test,
    hours_uat: task.hours_uat,
    hours_release: task.hours_release,
    hours_pm: task.hours_pm,
    hours_startup: task.hours_startup,
    hours_documentation: task.hours_documentation,
    hours_contingency: task.hours_contingency,
  });

  const handleRecalculateActivity = async (index) => {
    const activity = activities[index];
    const hoursDev = parseFloat(activity.hours_development) || 0;

    if (hoursDev === 0 || formData.pct_development === 0) {
      dispatch(addToast({ message: t('estimator:hoursGreaterThanZero'), type: "error" }));
      return;
    }

    const previousFields = extractTaskFields(activity);

    const newInputHours = hoursDev / (formData.pct_development / 100);
    const hours_analysis = roundTo1((newInputHours * formData.pct_analysis) / 100);
    const hours_development = roundTo1((newInputHours * formData.pct_development) / 100);
    const hours_internal_test = roundTo1((newInputHours * formData.pct_internal_test) / 100);
    const hours_uat = roundTo1((newInputHours * formData.pct_uat) / 100);
    const hours_release = roundTo1((newInputHours * formData.pct_release) / 100);
    const hours_pm = roundTo1((newInputHours * formData.pct_pm) / 100);
    const hours_startup = roundTo1((newInputHours * formData.pct_startup) / 100);
    const hours_documentation = roundTo1((newInputHours * formData.pct_documentation) / 100);

    const totalPhaseHours = hours_analysis + hours_development + hours_internal_test +
      hours_uat + hours_release + hours_pm + hours_startup + hours_documentation;
    const hours_contingency = roundTo1((totalPhaseHours * formData.contingency_percentage) / 100);

    const recalculatedActivity = {
      ...activity,
      hours_development_input: roundTo1(newInputHours),
      hours_analysis, hours_development, hours_internal_test,
      hours_uat, hours_release, hours_pm, hours_startup,
      hours_documentation, hours_contingency,
    };

    const newFields = extractTaskFields(recalculatedActivity);

    if (activity.estimate_task_id && savedEstimateId) {
      try {
        const updated = await updateEstimateTask({
          estimateId: savedEstimateId,
          taskId: activity.estimate_task_id,
          taskData: {
            hours_development_input: recalculatedActivity.hours_development_input,
            hours_analysis: recalculatedActivity.hours_analysis,
            hours_development: recalculatedActivity.hours_development,
            hours_internal_test: recalculatedActivity.hours_internal_test,
            hours_uat: recalculatedActivity.hours_uat,
            hours_release: recalculatedActivity.hours_release,
            hours_pm: recalculatedActivity.hours_pm,
            hours_startup: recalculatedActivity.hours_startup,
            hours_documentation: recalculatedActivity.hours_documentation,
            hours_contingency: recalculatedActivity.hours_contingency,
          }
        }).unwrap();

        const updatedActivities = [...activities];
        updatedActivities[index] = updated;
        setActivities(updatedActivities);

        if (pushUndo) {
          pushUndo({
            type: 'UPDATE_ESTIMATE_TASK',
            estimateId: savedEstimateId,
            taskId: activity.estimate_task_id,
            activityIndex: index,
            previousFields,
            newFields,
          });
        }

        dispatch(addToast({ message: t('estimator:estimateItemRecalculated'), type: "success" }));
      } catch (error) {
        dispatch(addToast({ message: t('estimator:errorPrefix', { message: error.message }), type: "error" }));
      }
    } else {
      const updatedActivities = [...activities];
      updatedActivities[index] = recalculatedActivity;
      setActivities(updatedActivities);
      dispatch(addToast({ message: t('estimator:estimateItemRecalculatedLocal'), type: "success" }));
    }
  };

  const handleSaveActivity = async (index, shouldRecalculate = false) => {
    const activity = activities[index];

    if (activity.estimate_task_id && savedEstimateId) {
      const originalTask = currentEstimate?.tasks?.find(
        (t) => t.estimate_task_id === activity.estimate_task_id
      );
      const previousFields = originalTask ? extractTaskFields(originalTask) : extractTaskFields(activity);
      const newFields = extractTaskFields(activity);

      try {
        const updated = await updateEstimateTask({
          estimateId: savedEstimateId,
          taskId: activity.estimate_task_id,
          taskData: {
            activity_name: activity.activity_name,
            activity_detail: activity.activity_detail,
            hours_development_input: activity.hours_development_input,
            hours_analysis: activity.hours_analysis,
            hours_development: activity.hours_development,
            hours_internal_test: activity.hours_internal_test,
            hours_uat: activity.hours_uat,
            hours_release: activity.hours_release,
            hours_pm: activity.hours_pm,
            hours_startup: activity.hours_startup,
            hours_documentation: activity.hours_documentation,
            hours_contingency: activity.hours_contingency,
          }
        }).unwrap();

        const updatedActivities = [...activities];
        updatedActivities[index] = updated;
        setActivities(updatedActivities);

        if (pushUndo) {
          pushUndo({
            type: 'UPDATE_ESTIMATE_TASK',
            estimateId: savedEstimateId,
            taskId: activity.estimate_task_id,
            activityIndex: index,
            previousFields,
            newFields,
          });
        }

        dispatch(addToast({ message: t('estimator:estimateItemUpdated'), type: "success" }));
      } catch (error) {
        dispatch(addToast({ message: t('estimator:errorPrefix', { message: error.message }), type: "error" }));
        return;
      }
    }

    setEditingActivityIndex(null);

    if (shouldRecalculate) {
      await handleRecalculateActivity(index);
    }

    setHoveredCell(null);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (newActivityNameInputRef.current) {
          newActivityNameInputRef.current.focus();
          newActivityNameInputRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    });
  };

  const handleCancelEdit = (index) => {
    if (savedEstimateId && currentEstimate?.tasks && currentEstimate.tasks[index]) {
      const originalTask = currentEstimate.tasks[index];
      const updatedActivities = [...activities];
      updatedActivities[index] = originalTask;
      setActivities(updatedActivities);
    }
    setEditingActivityIndex(null);
  };

  const handleActivityFieldChange = (index, field, value) => {
    const updatedActivities = [...activities];
    updatedActivities[index] = { ...updatedActivities[index], [field]: value };
    setActivities(updatedActivities);
  };

  const handleHoursBlur = (index, field, value) => {
    const parsed = parseFloat(value) || 0;
    handleActivityFieldChange(index, field, parsed);
  };

  const handleSaveAndRecalculate = async (percentages) => {
    if (!savedEstimateId) {
      dispatch(addToast({ message: t('estimator:saveBeforeRecalculate'), type: "error" }));
      return;
    }

    try {
      await updateEstimate({ id: savedEstimateId, data: percentages }).unwrap();

      const recalculatedActivities = activities.map((activity) => {
        const hoursDev = parseFloat(activity.hours_development) || 0;
        const calculated = calculateAllFromDev(hoursDev, percentages);
        const totalPhaseHours =
          (calculated.hours_analysis || 0) + (calculated.hours_development || 0) +
          (calculated.hours_internal_test || 0) + (calculated.hours_uat || 0) +
          (calculated.hours_release || 0) + (calculated.hours_pm || 0) +
          (calculated.hours_startup || 0) + (calculated.hours_documentation || 0);
        const hours_contingency = roundTo1(
          (totalPhaseHours * (percentages.contingency_percentage || formData.contingency_percentage)) / 100
        );
        return { ...activity, ...calculated, hours_contingency };
      });

      for (const activity of recalculatedActivities) {
        if (activity.estimate_task_id) {
          await updateEstimateTask({
            estimateId: savedEstimateId,
            taskId: activity.estimate_task_id,
            taskData: {
              hours_development_input: activity.hours_development_input,
              hours_analysis: activity.hours_analysis,
              hours_development: activity.hours_development,
              hours_internal_test: activity.hours_internal_test,
              hours_uat: activity.hours_uat,
              hours_release: activity.hours_release,
              hours_pm: activity.hours_pm,
              hours_startup: activity.hours_startup,
              hours_documentation: activity.hours_documentation,
              hours_contingency: activity.hours_contingency,
            }
          }).unwrap();
        }
      }

      setFormData({ ...formData, ...percentages });
      setActivities(recalculatedActivities);
      dispatch(addToast({ message: t('estimator:percentagesUpdated'), type: "success" }));
      setShowPercentagesModal(false);
      refetchEstimate();
    } catch (error) {
      dispatch(addToast({ message: `Errore: ${error.message}`, type: "error" }));
    }
  };

  const handleSavePercentagesOnly = async (percentages) => {
    if (!savedEstimateId) {
      dispatch(addToast({ message: t('estimator:saveBeforeExport'), type: "error" }));
      return;
    }

    try {
      await updateEstimate({ id: savedEstimateId, data: percentages }).unwrap();
      setFormData({ ...formData, ...percentages });
      dispatch(addToast({ message: t('estimator:percentagesUpdatedSuccess'), type: "success" }));
      setShowPercentagesModal(false);
      refetchEstimate();
    } catch (error) {
      dispatch(addToast({ message: `Errore: ${error.message}`, type: "error" }));
    }
  };

  const handleSaveInfo = async (newFormData, newProjectKey, pmIds) => {
    if (!savedEstimateId) {
      dispatch(addToast({ message: t('estimator:estimateIdNotFound'), type: "error" }));
      return;
    }

    try {
      const updateData = {
        client_id: newFormData.client_id,
        title: newFormData.title,
        description: newFormData.description,
        status: newFormData.status,
      };
      if (pmIds) {
        updateData.project_managers = pmIds;
      }

      await updateEstimate({ id: savedEstimateId, data: updateData }).unwrap();

      await createOrUpdateDraft({
        estimate_id: savedEstimateId,
        project_key: newProjectKey,
        project_name: newFormData.title,
        client_id: newFormData.client_id,
      }).unwrap();

      setFormData({ ...formData, ...newFormData });
      setProjectKey(newProjectKey);
      dispatch(addToast({ message: t('estimator:estimateInfoUpdated'), type: "success" }));
      refetchEstimate();
    } catch (error) {
      dispatch(addToast({ message: `Errore: ${error.message}`, type: "error" }));
      throw error;
    }
  };

  const handleExportEstimate = useCallback(async () => {
    if (!currentEstimate || activities.length === 0) {
      dispatch(addToast({ message: t('estimator:noItemsToExport'), type: "error" }));
      return;
    }

    try {
      const clientName =
        clients.find((c) => c.client_id === formData.client_id)?.client_name || "N/A";

      const { exportEstimateToExcel } = await import("../../../utils/export/excel");

      await exportEstimateToExcel(
        {
          ...currentEstimate,
          tasks: activities,
          pct_analysis: formData.pct_analysis,
          pct_development: formData.pct_development,
          pct_internal_test: formData.pct_internal_test,
          pct_uat: formData.pct_uat,
          pct_release: formData.pct_release,
          pct_pm: formData.pct_pm,
          pct_startup: formData.pct_startup,
          pct_documentation: formData.pct_documentation,
          contingency_percentage: formData.contingency_percentage,
        },
        clientName,
        projectKey
      );

      dispatch(addToast({ message: t('estimator:estimateExported'), type: "success" }));
    } catch (error) {
      dispatch(addToast({ message: t('estimator:exportError', { message: error.message }), type: "error" }));
    }
  }, [currentEstimate, activities, clients, formData, projectKey]);

  return {
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
  };
}

export default useEstimateEditorActions;
