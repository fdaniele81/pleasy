import { useState, useMemo, useCallback } from 'react';

const INITIAL_STATE = {
  searchTerm: '',
  filterClientIds: [],
  filterProjectIds: [],
  filterProjectType: [],
  selectionFilters: [],
  selectedTasks: {},
  showTimeOff: true,
};

export function useTimesheetFilters(projects = []) {
  const [searchTerm, setSearchTerm] = useState(INITIAL_STATE.searchTerm);
  const [filterClientIds, setFilterClientIds] = useState(INITIAL_STATE.filterClientIds);
  const [filterProjectIds, setFilterProjectIds] = useState(INITIAL_STATE.filterProjectIds);
  const [filterProjectType, setFilterProjectType] = useState(INITIAL_STATE.filterProjectType);
  const [selectionFilters, setSelectionFilters] = useState(INITIAL_STATE.selectionFilters);

  const [selectedTasks, setSelectedTasks] = useState(INITIAL_STATE.selectedTasks);
  const [showTimeOff, setShowTimeOff] = useState(INITIAL_STATE.showTimeOff);

  const allTasksFlat = useMemo(() =>
    projects
      .filter((project) => project.project_key !== 'CLOSED_ACTIVITIES')
      .flatMap((project) =>
        project.tasks.map((task) => ({
          ...task,
          project_id: project.project_id,
          project_key: project.project_key,
          project_title: project.project_title,
          project_type_id: project.project_type_id,
          client_id: project.client_id,
          client_key: project.client_key,
          client_name: project.client_name,
          client_color: project.client_color,
        }))
      ),
    [projects]
  );

  const filteredTasks = useMemo(() => {
    return allTasksFlat
      .filter((task) => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matches =
            task.client_key?.toLowerCase().includes(term) ||
            task.client_name?.toLowerCase().includes(term) ||
            task.project_key?.toLowerCase().includes(term) ||
            task.project_title?.toLowerCase().includes(term) ||
            task.task_title?.toLowerCase().includes(term) ||
            task.task_description?.toLowerCase().includes(term);

          if (!matches) return false;
        }

        if (filterClientIds.length > 0 && !filterClientIds.includes(task.client_id)) {
          return false;
        }

        if (filterProjectIds.length > 0 && !filterProjectIds.includes(task.project_id)) {
          return false;
        }

        if (filterProjectType.length > 0) {
          const taskProjectType = task.project_type_id || 'PROJECT';
          if (!filterProjectType.includes(taskProjectType)) {
            return false;
          }
        }

        if (selectionFilters.length > 0 && selectionFilters.length < 2) {
          if (selectionFilters.includes("selected") && !selectedTasks[task.task_id]) {
            return false;
          }
          if (selectionFilters.includes("unselected") && selectedTasks[task.task_id]) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const clientCompare = (a.client_name || "").localeCompare(b.client_name || "");
        if (clientCompare !== 0) return clientCompare;

        const projectCompare = (a.project_key || "").localeCompare(b.project_key || "");
        if (projectCompare !== 0) return projectCompare;

        return (a.task_number || 0) - (b.task_number || 0);
      });
  }, [allTasksFlat, searchTerm, filterClientIds, filterProjectIds, filterProjectType, selectionFilters, selectedTasks]);

  const filteredProjects = useMemo(() => {
    return projects
      .map((project) => {
        if (project.project_key === 'CLOSED_ACTIVITIES') {
          return project;
        }

        const projectTaskIds = new Set(
          filteredTasks
            .filter(t => t.project_id === project.project_id)
            .map(t => t.task_id)
        );

        const tasks = project.tasks.filter(t => projectTaskIds.has(t.task_id));

        if (tasks.length === 0) return null;
        return { ...project, tasks };
      })
      .filter(Boolean);
  }, [projects, filteredTasks]);

  const uniqueClients = useMemo(() =>
    Array.from(
      new Map(
        projects
          .filter((p) => p.client_id && p.client_name && p.project_key !== 'CLOSED_ACTIVITIES')
          .map((p) => [
            p.client_id,
            {
              client_id: p.client_id,
              client_key: p.client_key,
              client_name: p.client_name,
              client_color: p.client_color,
            },
          ])
      ).values()
    ).sort((a, b) => (a.client_key || "").localeCompare(b.client_key || "")),
    [projects]
  );

  const uniqueProjects = useMemo(() =>
    Array.from(
      new Map(
        projects
          .filter(p => p.project_key !== 'CLOSED_ACTIVITIES' && (filterClientIds.length === 0 || filterClientIds.includes(p.client_id)))
          .map((p) => [
            p.project_id,
            {
              project_id: p.project_id,
              project_key: p.project_key,
              project_title: p.project_title,
              client_id: p.client_id,
              client_key: p.client_key,
              client_color: p.client_color,
            },
          ])
      ).values()
    ).sort((a, b) => {
      const aKey = `${a.client_key || ""}-${a.project_key || ""}`;
      const bKey = `${b.client_key || ""}-${b.project_key || ""}`;
      return aKey.localeCompare(bKey);
    }),
    [projects, filterClientIds]
  );

  const toggleTaskSelection = useCallback((taskId) => {
    setSelectedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  }, []);

  const setAllTasksSelected = useCallback((newSelected) => {
    setSelectedTasks(newSelected);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm(INITIAL_STATE.searchTerm);
    setFilterClientIds(INITIAL_STATE.filterClientIds);
    setFilterProjectIds(INITIAL_STATE.filterProjectIds);
    setFilterProjectType(INITIAL_STATE.filterProjectType);
    setSelectionFilters(INITIAL_STATE.selectionFilters);
  }, []);

  const hasActiveFilters = useMemo(() =>
    searchTerm.trim() ||
    filterClientIds.length > 0 ||
    filterProjectIds.length > 0 ||
    filterProjectType.length > 0 ||
    selectionFilters.length > 0,
    [searchTerm, filterClientIds, filterProjectIds, filterProjectType, selectionFilters]
  );

  return {
    searchTerm,
    filterClientIds,
    filterProjectIds,
    filterProjectType,
    selectionFilters,
    selectedTasks,
    showTimeOff,

    setSearchTerm,
    setFilterClientIds,
    setFilterProjectIds,
    setFilterProjectType,
    setSelectionFilters,
    setShowTimeOff,

    allTasksFlat,
    filteredTasks,
    filteredProjects,
    uniqueClients,
    uniqueProjects,
    hasActiveFilters,

    toggleTaskSelection,
    setAllTasksSelected,
    clearAllFilters,
  };
}

export default useTimesheetFilters;
