export function calculatePhaseHours(inputHours, percentages) {
  const input = parseFloat(inputHours) || 0;
  return {
    hours_analysis: Math.round((input * (percentages.pct_analysis || 0)) / 100),
    hours_development: Math.round((input * (percentages.pct_development || 0)) / 100),
    hours_internal_test: Math.round((input * (percentages.pct_internal_test || 0)) / 100),
    hours_uat: Math.round((input * (percentages.pct_uat || 0)) / 100),
    hours_release: Math.round((input * (percentages.pct_release || 0)) / 100),
    hours_pm: Math.round((input * (percentages.pct_pm || 0)) / 100),
    hours_startup: Math.round((input * (percentages.pct_startup || 0)) / 100),
    hours_documentation: Math.round((input * (percentages.pct_documentation || 0)) / 100),
  };
}

export function calculateTotalHours(phaseHours) {
  return Object.values(phaseHours).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );
}

export function calculateContingencyHours(totalHours, contingencyPercentage) {
  return (totalHours * (contingencyPercentage || 0)) / 100;
}

export function calculateAllFromDev(devHours, percentages) {
  const dev = Math.round(parseFloat(devHours) || 0);

  if (dev === 0 || !percentages.pct_development || percentages.pct_development === 0) {
    return {
      hours_development_input: 0,
      hours_analysis: 0,
      hours_development: 0,
      hours_internal_test: 0,
      hours_uat: 0,
      hours_release: 0,
      hours_pm: 0,
      hours_startup: 0,
      hours_documentation: 0,
    };
  }

  const inputHours = dev / (percentages.pct_development / 100);

  return {
    hours_development_input: Math.round(inputHours),
    ...calculatePhaseHours(inputHours, percentages),
  };
}

export function calculatePercentagesSum(percentages) {
  return (
    (parseFloat(percentages.pct_analysis) || 0) +
    (parseFloat(percentages.pct_development) || 0) +
    (parseFloat(percentages.pct_internal_test) || 0) +
    (parseFloat(percentages.pct_uat) || 0) +
    (parseFloat(percentages.pct_release) || 0) +
    (parseFloat(percentages.pct_pm) || 0) +
    (parseFloat(percentages.pct_startup) || 0) +
    (parseFloat(percentages.pct_documentation) || 0)
  );
}

export function hoursToManDays(hours) {
  return (parseFloat(hours) || 0) / 8;
}

export function formatHours(hours, asInteger = false) {
  const num = parseFloat(hours) || 0;
  return asInteger ? Math.round(num).toString() : num.toFixed(1);
}

export function calculateActivityTotals(activities, contingencyPercentage) {
  let totalInput = 0;
  let totalAnalysis = 0;
  let totalDevelopment = 0;
  let totalInternalTest = 0;
  let totalUat = 0;
  let totalRelease = 0;
  let totalPm = 0;
  let totalStartup = 0;
  let totalDocumentation = 0;
  let contingencyHours = 0;

  activities.forEach((activity) => {
    totalInput += parseFloat(activity.hours_development_input) || 0;
    totalAnalysis += parseFloat(activity.hours_analysis) || 0;
    totalDevelopment += parseFloat(activity.hours_development) || 0;
    totalInternalTest += parseFloat(activity.hours_internal_test) || 0;
    totalUat += parseFloat(activity.hours_uat) || 0;
    totalRelease += parseFloat(activity.hours_release) || 0;
    totalPm += parseFloat(activity.hours_pm) || 0;
    totalStartup += parseFloat(activity.hours_startup) || 0;
    totalDocumentation += parseFloat(activity.hours_documentation) || 0;

    const activityTotal =
      (parseFloat(activity.hours_analysis) || 0) +
      (parseFloat(activity.hours_development) || 0) +
      (parseFloat(activity.hours_internal_test) || 0) +
      (parseFloat(activity.hours_uat) || 0) +
      (parseFloat(activity.hours_release) || 0) +
      (parseFloat(activity.hours_pm) || 0) +
      (parseFloat(activity.hours_startup) || 0) +
      (parseFloat(activity.hours_documentation) || 0);

    contingencyHours += activity.hours_contingency != null
      ? parseFloat(activity.hours_contingency) || 0
      : Math.round(calculateContingencyHours(activityTotal, contingencyPercentage));
  });

  const totalHours =
    totalAnalysis +
    totalDevelopment +
    totalInternalTest +
    totalUat +
    totalRelease +
    totalPm +
    totalStartup +
    totalDocumentation;

  const totalWithContingency = totalHours + contingencyHours;

  return {
    totalInput,
    totalAnalysis,
    totalDevelopment,
    totalInternalTest,
    totalUat,
    totalRelease,
    totalPm,
    totalStartup,
    totalDocumentation,
    totalHours,
    contingencyHours,
    totalWithContingency,
    totalManDays: hoursToManDays(totalHours),
    totalManDaysWithContingency: hoursToManDays(totalWithContingency),
  };
}

export function createEmptyActivity() {
  return {
    activity_name: "",
    activity_detail: "",
    hours_development_input: "",
    hours_development: 0,
    hours_analysis: 0,
    hours_internal_test: 0,
    hours_uat: 0,
    hours_release: 0,
    hours_pm: 0,
    hours_startup: 0,
    hours_documentation: 0,
  };
}

export function createEmptyFormData() {
  return {
    client_id: "",
    title: "",
    description: "",
    pct_analysis: 0,
    pct_development: 0,
    pct_internal_test: 0,
    pct_uat: 0,
    pct_release: 0,
    pct_pm: 0,
    pct_startup: 0,
    pct_documentation: 0,
    contingency_percentage: 0,
  };
}
