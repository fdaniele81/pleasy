import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

const GanttModal = lazy(() => import('./components/gantt-globale/GanttModal'));
const TaskModal = lazy(() => import('../../shared/components/modals/TaskModal'));

import InitialActualModal from './components/InitialActualModal';

import SimpleGanttModal from './components/gantt-selezione/SimpleGanttModal';

import { usePlanningData } from './hooks/usePlanningData';
import { useTaskEdit } from './hooks/useTaskEdit';
import { useFiltersReducer } from './hooks/useFiltersReducer';
import { useConfirmation } from '../../hooks';
import ConfirmationModal from '../../shared/ui/ConfirmationModal';

import { exportPianificazioneToExcel } from '../../utils/export/excel';

import { PlanningHeader } from './components/PlanningHeader';
import { PlanningFilters } from './components/PlanningFilters';
import { PlanningTable } from './components/PlanningTable';

function Pianificazione() {
  const { t } = useTranslation(['planning', 'common']);
  const [searchParams] = useSearchParams();
  const confirmation = useConfirmation();

  const planningData = usePlanningData();
  const {
    projects,
    loading,
    availableUsers,
    showGanttModal,
    setShowGanttModal,
    showInitialActualModal,
    setShowInitialActualModal,
    selectedTaskForInitialActual,
    setSelectedTaskForInitialActual,
    fetchSyncData,
    refetchPlanning,
  } = planningData;

  const [selectedTasks, setSelectedTasks] = useState({});

  const {
    searchTerm,
    filterUserIds,
    filterStatuses,
    filterClientIds,
    filterProjectIds,
    etcFilters,
    selectionFilters,
    filterStartDate,
    filterEndDate,
    dateFilterMode,
    hideProjectHeaders,
    showInDays,
    setSearchTerm,
    setFilterUserIds,
    setFilterStatuses,
    setFilterClientIds,
    setFilterProjectIds,
    setEtcFilters,
    setSelectionFilters,
    setFilterStartDate,
    setFilterEndDate,
    setDateFilterMode,
    setHideProjectHeaders,
    setShowInDays,
  } = useFiltersReducer();

  const [ganttRefreshTrigger, setGanttRefreshTrigger] = useState(0);

  const [showSelectionGanttModal, setShowSelectionGanttModal] = useState(false);

  const [expandedProjects, setExpandedProjects] = useState({});

  useEffect(() => {
    if (projects.length > 0) {
      setGanttRefreshTrigger(prev => prev + 1);
    }
  }, [projects]);

  useEffect(() => {
    if (projects.length > 0) {
      const allExpanded = {};
      projects.forEach(project => {
        if (expandedProjects[project.project_id] === undefined) {
          allExpanded[project.project_id] = false;
        }
      });
      if (Object.keys(allExpanded).length > 0) {
        setExpandedProjects(prev => ({ ...prev, ...allExpanded }));
      }
    }
  }, [projects]);

  useEffect(() => {
    const clientIdFromUrl = searchParams.get('client_id');
    if (clientIdFromUrl && projects.length > 0) {
      const clientExists = projects.some(p => p.client_id === clientIdFromUrl);
      if (clientExists && !filterClientIds.includes(clientIdFromUrl)) {
        setFilterClientIds([clientIdFromUrl]);
      }
    }
  }, [searchParams, projects]);

  useEffect(() => {
    const projectIdFromUrl = searchParams.get('project_id');
    if (projectIdFromUrl && projects.length > 0) {
      const projectExists = projects.some(p => p.project_id === projectIdFromUrl);
      if (projectExists && !filterProjectIds.includes(projectIdFromUrl)) {
        setFilterProjectIds([projectIdFromUrl]);
        setExpandedProjects(prev => ({ ...prev, [projectIdFromUrl]: true }));
      }
    }
  }, [searchParams, projects]);

  const baseFilteredProjects = useMemo(() => {
    return projects
      .map(project => {
        let tasks = project.tasks;

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const projectMatches =
            project.project_key?.toLowerCase().includes(term) ||
            project.title?.toLowerCase().includes(term);

          if (!projectMatches) {
            tasks = tasks.filter(task =>
              task.title?.toLowerCase().includes(term) ||
              task.description?.toLowerCase().includes(term)
            );
          }
        }

        if (filterUserIds.length > 0) {
          tasks = tasks.filter(task => filterUserIds.includes(task.owner_id));
        }

        if (filterStatuses.length > 0) {
          tasks = tasks.filter(task => filterStatuses.includes(task.task_status_id));
        }

        if (etcFilters.length > 0 && etcFilters.length < 2) {
          if (etcFilters.includes('zero')) {
            tasks = tasks.filter(task => !task.etc || task.etc === 0);
          } else if (etcFilters.includes('nonzero')) {
            tasks = tasks.filter(task => task.etc && task.etc > 0);
          }
        }

        if (filterStartDate || filterEndDate) {
          tasks = tasks.filter(task => {
            const taskStart = task.start_date ? new Date(task.start_date) : null;
            const taskEnd = task.end_date ? new Date(task.end_date) : null;
            const rangeStart = filterStartDate ? new Date(filterStartDate) : null;
            const rangeEnd = filterEndDate ? new Date(filterEndDate) : null;

            if (!taskStart && !taskEnd) return false;

            if (dateFilterMode === 'contained') {
              if (rangeStart && taskStart && taskStart < rangeStart) return false;
              if (rangeEnd && taskEnd && taskEnd > rangeEnd) return false;
              return true;
            } else {
              if (rangeStart && taskEnd && taskEnd < rangeStart) return false;
              if (rangeEnd && taskStart && taskStart > rangeEnd) return false;
              return true;
            }
          });
        }

        return { ...project, tasks };
      })
      .filter(project => {
        if (project.project_type_id === 'TM') {
          return false;
        }

        if (filterProjectIds.length > 0 && !filterProjectIds.includes(project.project_id)) {
          return false;
        }

        if (filterClientIds.length > 0 && !filterClientIds.includes(project.client_id)) {
          return false;
        }

        const hasActiveTaskFilters = searchTerm.trim() || filterUserIds.length > 0 || filterStatuses.length > 0 ||
                                      etcFilters.length > 0 || filterStartDate || filterEndDate;

        if (project.tasks.length === 0) {
          return !hasActiveTaskFilters;
        }

        return true;
      })
      .sort((a, b) => {
        const clientCompare = (a.client_name || "").localeCompare(b.client_name || "");
        if (clientCompare !== 0) return clientCompare;
        return (a.project_key || "").localeCompare(b.project_key || "");
      });
  }, [projects, searchTerm, filterUserIds, filterStatuses, filterClientIds, filterProjectIds, etcFilters, filterStartDate, filterEndDate, dateFilterMode]);

  const filteredProjects = useMemo(() => {
    if (selectionFilters.length === 0 || selectionFilters.length === 2) {
      return baseFilteredProjects;
    }

    return baseFilteredProjects
      .map(project => {
        let tasks = project.tasks;

        if (selectionFilters.includes('selected')) {
          tasks = tasks.filter(task => selectedTasks[task.task_id]);
        } else if (selectionFilters.includes('unselected')) {
          tasks = tasks.filter(task => !selectedTasks[task.task_id]);
        }

        return { ...project, tasks };
      })
      .filter(project => {
        if (project.tasks.length === 0) {
          if (selectionFilters.includes('selected') && selectionFilters.length === 1) {
            const projectKey = `project_${project.project_id}`;
            return selectedTasks[projectKey];
          }
          return false;
        }
        return true;
      });
  }, [baseFilteredProjects, selectionFilters, selectedTasks]);

  const taskEdit = useTaskEdit({
    projects,
    filteredProjects,
    expandedProjects,
    fetchSyncData,
    refetchPlanning,
    setShowInitialActualModal,
    setSelectedTaskForInitialActual,
    fetchAvailableUsers: planningData.fetchAvailableUsers,
    availableUsers,
    confirmFn: confirmation.confirm
  });

  const {
    editingCell,
    editValue,
    setEditValue,
    showTaskModal,
    taskModalProjectId,
    showTaskDetailsModal,
    selectedTask,
    selectedTaskProject,
    handleCellClick,
    handleCellBlur,
    handleKeyDown,
    handleStartAddingTask,
    handleCloseTaskModal,
    handleSaveNewTask,
    handleDeleteTask,
    handleInitialActualClick,
    handleInitialActualConfirm,
    handleTaskDetailsClick,
    handleCloseTaskDetailsModal,
    handleSaveEditTask,
  } = taskEdit;

  const allUsers = useMemo(() => {
    const usersMap = new Map();
    projects
      .filter(project => project.project_type_id !== 'TM')
      .forEach(project => {
        project.tasks.forEach(task => {
          if (task.owner_id && task.owner_name) {
            usersMap.set(task.owner_id, task.owner_name);
          }
        });
      });
    return Array.from(usersMap.entries()).map(([id, name]) => ({ id, name }));
  }, [projects]);

  const allClients = useMemo(() => {
    const clientsMap = new Map();
    projects
      .filter(project => project.project_type_id !== 'TM')
      .forEach(project => {
        if (project.client_id && project.client_name) {
          clientsMap.set(project.client_id, {
            client_id: project.client_id,
            client_key: project.client_key,
            client_name: project.client_name,
            client_color: project.client_color,
          });
        }
      });
    return Array.from(clientsMap.values()).sort((a, b) =>
      a.client_name.localeCompare(b.client_name)
    );
  }, [projects]);

  const allProjects = useMemo(() => {
    return projects
      .filter(project => project.project_type_id !== 'TM')
      .map(project => ({
        project_id: project.project_id,
        project_key: project.project_key,
        title: project.title,
        client_color: project.client_color,
      })).sort((a, b) => (a.project_key || "").localeCompare(b.project_key || ""));
  }, [projects]);

  const hasSelectedTasks = useMemo(() => {
    return Object.keys(selectedTasks).some(key =>
      selectedTasks[key] && !key.startsWith('project_')
    );
  }, [selectedTasks]);

  const handleShowGlobalGantt = useCallback(() => {
    setShowGanttModal(true);
  }, []);

  const handleShowSelectionGantt = useCallback(() => {
    setShowSelectionGanttModal(true);
  }, []);

  const handleExport = useCallback(() => {
    const selectedTaskIds = Object.keys(selectedTasks).filter(key => selectedTasks[key] && !key.startsWith('project_'));

    if (selectedTaskIds.length === 0) {
      exportPianificazioneToExcel(filteredProjects);
    } else {
      const projectsWithSelectedTasks = filteredProjects.map(project => ({
        ...project,
        tasks: project.tasks.filter(task => selectedTasks[task.task_id])
      })).filter(project => project.tasks.length > 0);

      exportPianificazioneToExcel(projectsWithSelectedTasks);
    }
  }, [selectedTasks, filteredProjects]);

  const toggleTaskSelection = useCallback((taskId) => {
    setSelectedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  }, []);

  const toggleProjectExpansion = useCallback((projectId) => {
    setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  }, []);

  const toggleAllProjects = useCallback(() => {
    const allExpanded = filteredProjects.every(p => expandedProjects[p.project_id]);
    const newState = {};
    filteredProjects.forEach(project => {
      newState[project.project_id] = !allExpanded;
    });
    setExpandedProjects(prev => ({ ...prev, ...newState }));
  }, [filteredProjects, expandedProjects]);

  const toggleProjectSelection = useCallback((project) => {
    const projectTaskIds = project.tasks.map(t => t.task_id);

    if (projectTaskIds.length === 0) {
      const projectKey = `project_${project.project_id}`;
      setSelectedTasks(prev => ({
        ...prev,
        [projectKey]: !prev[projectKey]
      }));
      return;
    }

    const allSelected = projectTaskIds.every(id => selectedTasks[id]);

    setSelectedTasks(prev => {
      const newSelected = { ...prev };
      projectTaskIds.forEach(id => {
        newSelected[id] = !allSelected;
      });
      return newSelected;
    });
  }, [selectedTasks]);

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6">
          <div className="text-xl">{t('planning:loadingPlanning')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden overscroll-y-none">
      <Suspense fallback={null}>
        <GanttModal
          isOpen={showGanttModal}
          onClose={() => setShowGanttModal(false)}
          projects={filteredProjects}
          filterUserIds={filterUserIds}
          refreshTrigger={ganttRefreshTrigger}
        />
      </Suspense>

      <SimpleGanttModal
        isOpen={showSelectionGanttModal}
        onClose={() => setShowSelectionGanttModal(false)}
        selectedTasks={selectedTasks}
        projects={projects}
      />

      <InitialActualModal
        isOpen={showInitialActualModal}
        onClose={() => {
          setShowInitialActualModal(false);
          setSelectedTaskForInitialActual(null);
        }}
        onConfirm={(initialActual) => handleInitialActualConfirm(initialActual, selectedTaskForInitialActual?.task_id)}
        taskTitle={selectedTaskForInitialActual?.title || ''}
        currentValue={selectedTaskForInitialActual?.initial_actual || 0}
      />

      <Suspense fallback={null}>
        {(() => {
          const selectedProject = projects.find(p => p.project_id === taskModalProjectId);
          return (
            <TaskModal
              isOpen={showTaskModal}
              onClose={handleCloseTaskModal}
              onConfirm={handleSaveNewTask}
              projectTitle={selectedProject?.title || ''}
              projectId={taskModalProjectId}
              clientName={selectedProject?.client_name || ''}
              clientKey={selectedProject?.client_key || ''}
              availableUsers={availableUsers[taskModalProjectId]?.users || []}
            />
          );
        })()}
      </Suspense>

      <Suspense fallback={null}>
        <TaskModal
          key={selectedTask?.task_id || 'task-details-modal'}
          isOpen={showTaskDetailsModal}
          onClose={handleCloseTaskDetailsModal}
          onConfirm={handleSaveEditTask}
          projectTitle={selectedTaskProject?.title || ''}
          projectId={selectedTaskProject?.project_id}
          clientName={selectedTaskProject?.client_name || ''}
          clientKey={selectedTaskProject?.client_key || ''}
          availableUsers={availableUsers[selectedTaskProject?.project_id]?.users || []}
          task={selectedTask}
        />
      </Suspense>

      <div className="py-4">
        <div className="w-full px-2">
          <div className="mt-16"></div>

          <PlanningHeader
            onExport={handleExport}
            onShowGlobalGantt={handleShowGlobalGantt}
            onShowSelectionGantt={handleShowSelectionGantt}
            selectionFilters={selectionFilters}
            hasSelectedTasks={hasSelectedTasks}
          />

          <PlanningFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterUserIds={filterUserIds}
            setFilterUserIds={setFilterUserIds}
            filterStatuses={filterStatuses}
            setFilterStatuses={setFilterStatuses}
            filterClientIds={filterClientIds}
            setFilterClientIds={setFilterClientIds}
            filterProjectIds={filterProjectIds}
            setFilterProjectIds={setFilterProjectIds}
            selectionFilters={selectionFilters}
            setSelectionFilters={setSelectionFilters}
            etcFilters={etcFilters}
            setEtcFilters={setEtcFilters}
            filterStartDate={filterStartDate}
            setFilterStartDate={setFilterStartDate}
            filterEndDate={filterEndDate}
            setFilterEndDate={setFilterEndDate}
            dateFilterMode={dateFilterMode}
            setDateFilterMode={setDateFilterMode}
            hideProjectHeaders={hideProjectHeaders}
            setHideProjectHeaders={setHideProjectHeaders}
            showInDays={showInDays}
            setShowInDays={setShowInDays}
            allUsers={allUsers}
            allClients={allClients}
            allProjects={allProjects}
          />

          <PlanningTable
            filteredProjects={filteredProjects}
            projects={projects}
            selectedTasks={selectedTasks}
            setSelectedTasks={setSelectedTasks}
            toggleTaskSelection={toggleTaskSelection}
            toggleProjectSelection={toggleProjectSelection}
            expandedProjects={expandedProjects}
            toggleProjectExpansion={toggleProjectExpansion}
            toggleAllProjects={toggleAllProjects}
            editingCell={editingCell}
            editValue={editValue}
            setEditValue={setEditValue}
            handleCellClick={handleCellClick}
            handleCellBlur={handleCellBlur}
            handleKeyDown={handleKeyDown}
            availableUsers={availableUsers}
            handleStartAddingTask={handleStartAddingTask}
            handleDeleteTask={handleDeleteTask}
            handleInitialActualClick={handleInitialActualClick}
            handleTaskDetailsClick={handleTaskDetailsClick}
            hideProjectHeaders={hideProjectHeaders}
            showInDays={showInDays}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        config={confirmation.config}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
}

export default Pianificazione;
