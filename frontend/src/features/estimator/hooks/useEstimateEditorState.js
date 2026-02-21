import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { DEFAULT_PERCENTAGES } from "../../../constants/estimator";
import {
  useGetEstimateQuery,
} from "../api/estimateEndpoints";
import { useLazyGetDraftsByEstimateQuery } from "../api/projectDraftEndpoints";
import { useLazyGetClientPhasesConfigQuery, useGetClientsQuery } from "../../clients/api/clientEndpoints";
import {
  calculateActivityTotals,
  formatHours as formatHoursUtil,
} from "../utils/estimateCalculations";
import { useTooltipDelay } from "../../../hooks/useTooltipDelay";
import logger from "../../../utils/logger";

const EMPTY_NEW_ACTIVITY = {
  activity_name: "",
  activity_detail: "",
  hours_development_input: "",
  hours_development: "",
  hours_analysis: "",
  hours_internal_test: "",
  hours_uat: "",
  hours_release: "",
  hours_pm: "",
  hours_startup: "",
  hours_documentation: "",
};

export function useEstimateEditorState() {
  const { estimateId } = useParams();
  const { data: clients = [] } = useGetClientsQuery();
  const { data: currentEstimate, isLoading: estimateLoading, refetch: refetchEstimate } = useGetEstimateQuery(estimateId);
  const [getClientPhasesConfig] = useLazyGetClientPhasesConfigQuery();
  const [getDraftsByEstimate] = useLazyGetDraftsByEstimateQuery();

  const [formData, setFormData] = useState({
    client_id: "",
    title: "",
    description: "",
    ...DEFAULT_PERCENTAGES,
  });

  const [projectKey, setProjectKey] = useState("");
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({ ...EMPTY_NEW_ACTIVITY });
  const [savedEstimateId, setSavedEstimateId] = useState(null);
  const [editingActivityIndex, setEditingActivityIndex] = useState(null);
  const [showPercentagesModal, setShowPercentagesModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const newActivityNameInputRef = useRef(null);

  const { hoveredCell, handleTooltipEnter, handleTooltipLeave, setHoveredCell } = useTooltipDelay(500);

  const isReadOnly = currentEstimate?.status === "CONVERTED";

  useEffect(() => {
    const loadEstimateData = async () => {
      if (currentEstimate && estimateId) {
        let clientDefaultPercentages = null;

        if (currentEstimate.client_id) {
          try {
            const config = await getClientPhasesConfig(currentEstimate.client_id).unwrap();
            if (config.project_phases_config) {
              const beConfig = config.project_phases_config;
              clientDefaultPercentages = {
                pct_analysis: beConfig.analysis?.e2e_percentage || DEFAULT_PERCENTAGES.pct_analysis,
                pct_development: beConfig.development?.e2e_percentage || DEFAULT_PERCENTAGES.pct_development,
                pct_internal_test: beConfig.internal_test?.e2e_percentage || DEFAULT_PERCENTAGES.pct_internal_test,
                pct_uat: beConfig.uat?.e2e_percentage || DEFAULT_PERCENTAGES.pct_uat,
                pct_release: beConfig.release?.e2e_percentage || DEFAULT_PERCENTAGES.pct_release,
                pct_pm: beConfig.pm?.e2e_percentage || DEFAULT_PERCENTAGES.pct_pm,
                pct_startup: beConfig.startup?.e2e_percentage || DEFAULT_PERCENTAGES.pct_startup,
                pct_documentation: beConfig.documentation?.e2e_percentage || DEFAULT_PERCENTAGES.pct_documentation,
                contingency_percentage: beConfig.contingency?.e2e_percentage || DEFAULT_PERCENTAGES.contingency_percentage,
              };
            }
          } catch (error) {
            logger.error('Error loading client default percentages:', error);
          }
        }

        const OLD_LEGACY_DEFAULTS = {
          pct_analysis: 13,
          pct_development: 38,
          pct_internal_test: 5,
          pct_uat: 13,
          pct_release: 0,
          pct_pm: 10,
          pct_startup: 15,
          pct_documentation: 6,
          contingency_percentage: 20,
        };

        const hasOldLegacyDefaults =
          currentEstimate.pct_analysis === OLD_LEGACY_DEFAULTS.pct_analysis &&
          currentEstimate.pct_development === OLD_LEGACY_DEFAULTS.pct_development &&
          currentEstimate.pct_internal_test === OLD_LEGACY_DEFAULTS.pct_internal_test &&
          currentEstimate.pct_uat === OLD_LEGACY_DEFAULTS.pct_uat &&
          currentEstimate.pct_release === OLD_LEGACY_DEFAULTS.pct_release &&
          currentEstimate.pct_pm === OLD_LEGACY_DEFAULTS.pct_pm &&
          currentEstimate.pct_startup === OLD_LEGACY_DEFAULTS.pct_startup &&
          currentEstimate.pct_documentation === OLD_LEGACY_DEFAULTS.pct_documentation &&
          currentEstimate.contingency_percentage === OLD_LEGACY_DEFAULTS.contingency_percentage;

        const useClientDefaults = hasOldLegacyDefaults && clientDefaultPercentages;

        setFormData({
          client_id: currentEstimate.client_id || "",
          title: currentEstimate.title || "",
          description: currentEstimate.description || "",
          pct_analysis: useClientDefaults
            ? clientDefaultPercentages.pct_analysis
            : (currentEstimate.pct_analysis || DEFAULT_PERCENTAGES.pct_analysis),
          pct_development: useClientDefaults
            ? clientDefaultPercentages.pct_development
            : (currentEstimate.pct_development || DEFAULT_PERCENTAGES.pct_development),
          pct_internal_test: useClientDefaults
            ? clientDefaultPercentages.pct_internal_test
            : (currentEstimate.pct_internal_test || DEFAULT_PERCENTAGES.pct_internal_test),
          pct_uat: useClientDefaults
            ? clientDefaultPercentages.pct_uat
            : (currentEstimate.pct_uat || DEFAULT_PERCENTAGES.pct_uat),
          pct_release: useClientDefaults
            ? clientDefaultPercentages.pct_release
            : (currentEstimate.pct_release || DEFAULT_PERCENTAGES.pct_release),
          pct_pm: useClientDefaults
            ? clientDefaultPercentages.pct_pm
            : (currentEstimate.pct_pm || DEFAULT_PERCENTAGES.pct_pm),
          pct_startup: useClientDefaults
            ? clientDefaultPercentages.pct_startup
            : (currentEstimate.pct_startup || DEFAULT_PERCENTAGES.pct_startup),
          pct_documentation: useClientDefaults
            ? clientDefaultPercentages.pct_documentation
            : (currentEstimate.pct_documentation || DEFAULT_PERCENTAGES.pct_documentation),
          contingency_percentage: useClientDefaults
            ? clientDefaultPercentages.contingency_percentage
            : (currentEstimate.contingency_percentage || DEFAULT_PERCENTAGES.contingency_percentage),
        });

        if (currentEstimate.tasks) {
          setActivities(currentEstimate.tasks);
        }
        setSavedEstimateId(currentEstimate.estimate_id);
      }
    };

    loadEstimateData();
  }, [currentEstimate, estimateId]);

  useEffect(() => {
    const loadProjectKey = async () => {
      try {
        if (estimateId) {
          const draftResponse = await getDraftsByEstimate(estimateId).unwrap();
          if (draftResponse.drafts && draftResponse.drafts.length > 0) {
            const draft = draftResponse.drafts[0];
            setProjectKey(draft.project_key || "");
          }
        }
      } catch {
        // Draft lookup may fail if no draft exists yet
      }
    };

    if (estimateId) {
      loadProjectKey();
    }
  }, [estimateId, getDraftsByEstimate]);

  const totals = useMemo(
    () => calculateActivityTotals(activities, formData.contingency_percentage),
    [activities, formData.contingency_percentage]
  );

  const formatHours = (hours) => formatHoursUtil(hours, true);

  return {
    estimateId,
    clients,
    currentEstimate,
    estimateLoading,
    refetchEstimate,
    formData,
    setFormData,
    projectKey,
    setProjectKey,
    activities,
    setActivities,
    newActivity,
    setNewActivity,
    savedEstimateId,
    editingActivityIndex,
    setEditingActivityIndex,
    showPercentagesModal,
    setShowPercentagesModal,
    showInfoModal,
    setShowInfoModal,
    newActivityNameInputRef,
    hoveredCell,
    handleTooltipEnter,
    handleTooltipLeave,
    setHoveredCell,
    isReadOnly,
    totals,
    formatHours,
    EMPTY_NEW_ACTIVITY,
  };
}

export default useEstimateEditorState;
