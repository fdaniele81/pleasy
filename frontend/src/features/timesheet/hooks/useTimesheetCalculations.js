import { formatDateLocal } from "../../../utils/table/tableUtils";
import { getTotalHoursForTask, getTotalHoursForTimeOffType } from "../../../utils/budget/budgetUtils";

export function useTimesheetCalculations(
  filteredProjects,
  timeOffs,
  timeOffHistoricalTotals,
  selectionFilters,
  selectedTasks
) {
  const getTotalHoursForDate = (date) => {
    const dateStr = formatDateLocal(date);
    let total = 0;

    filteredProjects.forEach((project) => {
      project.tasks.forEach((task) => {
        const ts = task.timesheets?.find(
          (ts) => ts.work_date.split("T")[0] === dateStr
        );
        if (ts) total += ts.hours_worked;
      });
    });

    const shouldIncludeTimeOff =
      selectionFilters.length === 0 ||
      selectionFilters.length === 2 ||
      (selectionFilters.includes("selected") &&
        (selectedTasks["timeoff-VACATION"] || selectedTasks["timeoff-OTHER"])) ||
      (selectionFilters.includes("unselected") &&
        (!selectedTasks["timeoff-VACATION"] || !selectedTasks["timeoff-OTHER"]));

    if (shouldIncludeTimeOff) {
      timeOffs?.forEach((to) => {
        if (to.date === dateStr) {
          total += to.hours;
        }
      });
    }

    return total;
  };

  const getGrandTotal = () => {
    let total = 0;

    filteredProjects.forEach((project) => {
      project.tasks.forEach((task) => {
        total += getTotalHoursForTask(task);
      });
    });

    const shouldIncludeTimeOff =
      selectionFilters.length === 0 ||
      selectionFilters.length === 2 ||
      (selectionFilters.includes("selected") &&
        (selectedTasks["timeoff-VACATION"] || selectedTasks["timeoff-OTHER"])) ||
      (selectionFilters.includes("unselected") &&
        (!selectedTasks["timeoff-VACATION"] || !selectedTasks["timeoff-OTHER"]));

    if (shouldIncludeTimeOff) {
      total += getTotalHoursForTimeOffType("VACATION", timeOffHistoricalTotals);
      total += getTotalHoursForTimeOffType("OTHER", timeOffHistoricalTotals);
    }

    return total;
  };

  const getClosedTasksHoursForDate = (date) => {
    const dateStr = formatDateLocal(date);

    const closedActivitiesProject = filteredProjects.find(
      (project) => project.project_key === 'CLOSED_ACTIVITIES'
    );

    if (!closedActivitiesProject || !closedActivitiesProject.tasks || closedActivitiesProject.tasks.length === 0) {
      return 0;
    }

    const closedActivitiesTask = closedActivitiesProject.tasks[0];

    const ts = closedActivitiesTask.timesheets?.find(
      (ts) => ts.work_date.split("T")[0] === dateStr
    );

    return ts ? ts.hours_worked : 0;
  };

  const getClosedTasksGrandTotal = () => {
    const closedActivitiesProject = filteredProjects.find(
      (project) => project.project_key === 'CLOSED_ACTIVITIES'
    );

    if (!closedActivitiesProject || !closedActivitiesProject.tasks || closedActivitiesProject.tasks.length === 0) {
      return 0;
    }

    const closedActivitiesTask = closedActivitiesProject.tasks[0];

    return getTotalHoursForTask(closedActivitiesTask);
  };

  return {
    getTotalHoursForDate,
    getGrandTotal,
    getClosedTasksHoursForDate,
    getClosedTasksGrandTotal,
  };
}
