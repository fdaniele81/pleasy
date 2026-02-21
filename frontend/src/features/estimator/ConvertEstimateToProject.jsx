import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, ArrowLeft, Save, FolderKanban, Calculator, AlertTriangle } from 'lucide-react';
import logger from '../../utils/logger';
import { useGetEstimatesQuery, useLazyGetEstimateQuery } from './api/estimateEndpoints';
import { useGetClientsQuery } from '../clients/api/clientEndpoints';
import {
  useLazyGetDraftsByEstimateQuery,
  useCreateOrUpdateDraftMutation,
  useConvertDraftToProjectMutation,
  useLazyCheckProjectKeyQuery
} from './api/projectDraftEndpoints';
import Button from '../../shared/ui/Button';
import SelectableCellsTable from './components/SelectableCellsTable';
import TaskModal from './components/TaskModal';
import TaskPreviewList from './components/TaskPreviewList';
import { PHASES } from './components/SelectableCellsTable';
import PageHeader from '../../shared/ui/PageHeader';
import { useConfirmation } from '../../hooks';
import ConfirmationModal from '../../shared/ui/ConfirmationModal';

const TASK_DRAFT_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F97316', '#6366F1', '#EF4444', '#84CC16',
];

function ConvertEstimateToProject() {
  const { t } = useTranslation(['estimator', 'common']);
  const navigate = useNavigate();
  const { data: estimates = [] } = useGetEstimatesQuery();
  const { data: clients = [] } = useGetClientsQuery();
  const [getEstimate] = useLazyGetEstimateQuery();
  const [getDraftsByEstimate] = useLazyGetDraftsByEstimateQuery();
  const [createOrUpdateDraft] = useCreateOrUpdateDraftMutation();
  const [convertDraftToProject] = useConvertDraftToProjectMutation();
  const [checkProjectKey] = useLazyCheckProjectKeyQuery();
  const currentUser = useSelector(state => state.auth.user);

  const confirmation = useConfirmation();

  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [estimateDetails, setEstimateDetails] = useState(null);
  const [projectKey, setProjectKey] = useState('');
  const [projectDraftId, setProjectDraftId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedCells, setSelectedCells] = useState(new Set());
  const [taskPreviews, setTaskPreviews] = useState([]);
  const [cellToTaskMap, setCellToTaskMap] = useState(new Map());
  const [usedColors, setUsedColors] = useState([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectionType, setSelectionType] = useState(null);
  const [autoTaskName, setAutoTaskName] = useState('');
  const [totalBudget, setTotalBudget] = useState(0);
  const [converting, setConverting] = useState(false);
  const [existingProjectModal, setExistingProjectModal] = useState({ open: false, project: null, resolve: null });

  const [toast, setToast] = useState(null);

  const handleSelectEstimate = async (estimateId) => {
    if (!estimateId) {
      setSelectedEstimate(null);
      setEstimateDetails(null);
      setProjectKey('');
      setProjectDraftId(null);
      setTaskPreviews([]);
      setCellToTaskMap(new Map());
      setSelectedCells(new Set());
      setUsedColors([]);
      return;
    }

    setLoading(true);
    try {
      const estimate = await getEstimate(estimateId).unwrap();
      setSelectedEstimate(estimate);
      setEstimateDetails(estimate);

      const draftResponse = await getDraftsByEstimate(estimateId).unwrap();
      if (draftResponse.drafts && draftResponse.drafts.length > 0) {
        const draft = draftResponse.drafts[0];
        setProjectKey(draft.project_key || '');
        setProjectDraftId(draft.project_draft_id);

        if (draft.tasks && Array.isArray(draft.tasks)) {
          const loadedTasks = draft.tasks.map(task => ({
            id: task.task_details?.id || Date.now() + Math.random(),
            title: task.title,
            budget: task.budget,
            selectionType: task.task_details?.selection_type || 'SPARSE',
            cellsCount: task.task_details?.cells_count || 0,
            selectedCells: task.task_details?.selected_cells || [],
            color: task.task_details?.task_color || '#10B981',
            isMultiTask: task.task_details?.is_multi_task || false,
            subtasks: task.task_details?.subtasks || null
          }));
          setTaskPreviews(loadedTasks);

          const newCellToTaskMap = new Map();
          loadedTasks.forEach(task => {
            if (task.selectedCells && Array.isArray(task.selectedCells)) {
              task.selectedCells.forEach(cellKey => {
                newCellToTaskMap.set(cellKey, {
                  taskId: task.id,
                  color: task.color
                });
              });
            }
          });
          setCellToTaskMap(newCellToTaskMap);

          const colors = loadedTasks.map(task => task.color);
          setUsedColors(colors);
        }
      } else {
        const estimateData = estimates.find(e => e.estimate_id === estimateId);
        if (estimateData?.project_key) {
          setProjectKey(estimateData.project_key);
        }
      }
    } catch (error) {
      logger.error('Error loading estimate:', error);
      setToast({ message: t('estimator:loadingError'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getNextColor = () => {
    const availableColors = TASK_DRAFT_COLORS.filter(color => !usedColors.includes(color));

    if (availableColors.length > 0) {
      return availableColors[0];
    }

    return TASK_DRAFT_COLORS[0];
  };

  useEffect(() => {
    if (!estimateDetails || selectedCells.size === 0) {
      setSelectionType(null);
      setAutoTaskName('');
      setTotalBudget(0);
      return;
    }

    const allCells = Array.from(selectedCells).map(key => {
      const [rowIndex, colIndex] = key.split('-').map(Number);
      return { rowIndex, colIndex, key };
    });

    const assignedCells = allCells.filter(cell => cellToTaskMap.has(cell.key));
    const availableCells = allCells.filter(cell => !cellToTaskMap.has(cell.key));

    if (assignedCells.length > 0) {
      setToast({
        message: t('estimator:cellsExcluded', { count: assignedCells.length }),
        type: 'warning'
      });
    }

    if (availableCells.length === 0) {
      setSelectionType(null);
      setAutoTaskName('');
      setTotalBudget(0);
      return;
    }

    const cells = availableCells;
    const rows = new Set(cells.map(c => c.rowIndex));
    const cols = new Set(cells.map(c => c.colIndex));

    let type = 'SPARSE';
    let name = '';

    if (rows.size === 1) {
      type = 'ROW';
      const rowIndex = Array.from(rows)[0];
      name = estimateDetails.tasks[rowIndex]?.activity_name || '';
    } else if (cols.size === 1) {
      type = 'COLUMN';
      const colIndex = Array.from(cols)[0];
      name = PHASES[colIndex]?.labelKey ? t('estimator:' + PHASES[colIndex].labelKey) : '';
    }

    setSelectionType(type);
    setAutoTaskName(name);

    const budget = cells.reduce((sum, cell) => {
      const task = estimateDetails.tasks[cell.rowIndex];
      const phase = PHASES[cell.colIndex];
      if (!task || !phase) return sum;

      if (cell.colIndex === 8) {
        const totalHours = PHASES.slice(0, 8).reduce((s, p) => {
          return s + (parseFloat(task[p.key]) || 0);
        }, 0);
        return sum + (totalHours * (estimateDetails.contingency_percentage || 0)) / 100;
      }

      const hours = parseFloat(task[phase.key]) || 0;
      return sum + hours;
    }, 0);

    setTotalBudget(budget);
  }, [selectedCells, estimateDetails, cellToTaskMap]);

  const handleClearSelection = () => {
    setSelectedCells(new Set());
  };

  const saveDraftTasks = async (updatedTasks) => {
    if (!projectDraftId || !selectedEstimate) {
      logger.warn('Cannot save tasks: missing projectDraftId or estimate');
      return;
    }

    try {
      const draftData = {
        project_draft_id: projectDraftId,
        estimate_id: selectedEstimate.estimate_id,
        client_id: selectedEstimate.client_id,
        project_key: projectKey.trim().toUpperCase(),
        title: selectedEstimate.title,
        description: t('estimator:projectFromEstimate', { title: selectedEstimate.title }),
        status_id: null,
        project_details: {
          project_managers: [currentUser.user_id],
          source: 'estimate_conversion'
        },
        tasks: updatedTasks.map((task, index) => ({
          task_number: index + 1,
          title: task.title.trim(),
          description: t('estimator:taskDescriptionFromEstimate', { selectionType: task.selectionType }),
          budget: task.budget,
          task_status_id: 'NEW',
          task_details: {
            id: task.id,
            selection_type: task.selectionType,
            cells_count: task.cellsCount,
            selected_cells: task.selectedCells || [],
            task_color: task.color,
            is_multi_task: task.isMultiTask || false,
            subtasks: task.subtasks || null
          }
        }))
      };

      await createOrUpdateDraft(draftData).unwrap();
    } catch (error) {
      logger.error('Error saving draft tasks:', error);
      setToast({
        message: t('estimator:savingActivitiesError'),
        type: 'error'
      });
    }
  };

  const handleCreateTask = async (taskData) => {
    const availableCells = Array.from(selectedCells).filter(key => !cellToTaskMap.has(key));

    if (availableCells.length === 0) {
      setToast({
        message: t('estimator:allCellsAssigned'),
        type: 'error'
      });
      return;
    }

    if (!projectDraftId) {
      try {
        const draftData = {
          estimate_id: selectedEstimate.estimate_id,
          client_id: selectedEstimate.client_id,
          project_key: projectKey.trim().toUpperCase(),
          title: selectedEstimate.title,
          description: t('estimator:projectFromEstimate', { title: selectedEstimate.title }),
          status_id: null,
          project_details: {
            project_managers: [currentUser.user_id],
            source: 'estimate_conversion'
          },
          tasks: []
        };

        const result = await createOrUpdateDraft(draftData).unwrap();
        setProjectDraftId(result.projectDraft.project_draft_id);
      } catch (error) {
        setToast({
          message: t('estimator:draftCreationError'),
          type: 'error'
        });
        return;
      }
    }

    let newTask;

    if (taskData.mode === 'multiple') {
      const totalBudget = taskData.tasks.reduce((sum, t) => sum + t.budget, 0);

      newTask = {
        id: Date.now(),
        title: t('estimator:multiTaskTitle', { count: taskData.tasks.length }),
        budget: totalBudget,
        selectionType: taskData.tasks[0].selectionType,
        cellsCount: taskData.tasks[0].cellsCount,
        selectedCells: availableCells,
        color: getNextColor(),
        isMultiTask: true,
        subtasks: taskData.tasks.map(t => ({
          title: t.title,
          budget: t.budget,
          percentage: t.percentage
        }))
      };
    } else {
      newTask = {
        id: Date.now(),
        title: taskData.tasks[0].title,
        budget: taskData.tasks[0].budget,
        selectionType: taskData.tasks[0].selectionType,
        cellsCount: taskData.tasks[0].cellsCount,
        selectedCells: availableCells,
        color: getNextColor()
      };
    }

    const newCellToTaskMap = new Map(cellToTaskMap);
    availableCells.forEach(cellKey => {
      newCellToTaskMap.set(cellKey, {
        taskId: newTask.id,
        color: newTask.color
      });
    });
    setCellToTaskMap(newCellToTaskMap);

    const updatedTasks = [...taskPreviews, newTask];
    setTaskPreviews(updatedTasks);

    setUsedColors([...usedColors, newTask.color]);

    handleClearSelection();

    await saveDraftTasks(updatedTasks);

    setToast({
      message: taskData.mode === 'multiple'
        ? t('estimator:taskCreatedMulti', { count: taskData.tasks.length, budget: newTask.budget.toFixed(1) })
        : t('estimator:taskCreatedSingle', { title: newTask.title, count: availableCells.length }),
      type: 'success'
    });
  };

  const handleEditTaskName = async (taskId, newName) => {
    const updatedTasks = taskPreviews.map(task =>
      task.id === taskId ? { ...task, title: newName } : task
    );
    setTaskPreviews(updatedTasks);

    await saveDraftTasks(updatedTasks);
  };

  const handleEditTask = (taskId) => {
    const taskToEdit = taskPreviews.find(t => t.id === taskId);

    if (!taskToEdit) return;

    const updatedTasks = taskPreviews.filter(task => task.id !== taskId);
    setTaskPreviews(updatedTasks);

    const newCellToTaskMap = new Map(cellToTaskMap);
    if (taskToEdit.selectedCells && Array.isArray(taskToEdit.selectedCells)) {
      taskToEdit.selectedCells.forEach(cellKey => {
        newCellToTaskMap.delete(cellKey);
      });
    }
    setCellToTaskMap(newCellToTaskMap);

    setUsedColors(usedColors.filter(color => color !== taskToEdit.color));

    const cellsSet = new Set(taskToEdit.selectedCells || []);
    setSelectedCells(cellsSet);

    saveDraftTasks(updatedTasks);

    setToast({
      message: t('estimator:taskEditing', { count: taskToEdit.selectedCells?.length || 0 }),
      type: 'info'
    });
  };

  const handleRemoveTask = async (taskId) => {
    const taskToRemove = taskPreviews.find(t => t.id === taskId);

    if (taskToRemove) {
      const newCellToTaskMap = new Map(cellToTaskMap);
      if (taskToRemove.selectedCells && Array.isArray(taskToRemove.selectedCells)) {
        taskToRemove.selectedCells.forEach(cellKey => {
          newCellToTaskMap.delete(cellKey);
        });
      }
      setCellToTaskMap(newCellToTaskMap);

      setUsedColors(usedColors.filter(color => color !== taskToRemove.color));
    }

    const updatedTasks = taskPreviews.filter(task => task.id !== taskId);
    setTaskPreviews(updatedTasks);

    await saveDraftTasks(updatedTasks);

    setToast({
      message: t('estimator:activityRemoved'),
      type: 'info'
    });
  };

  const calculateTotalEstimateBudget = () => {
    if (!estimateDetails || !estimateDetails.tasks) {
      return 0;
    }

    const total = estimateDetails.tasks.reduce((total, task) => {
      let taskTotal = PHASES.slice(0, 8).reduce((sum, phase) => {
        const value = parseFloat(task[phase.key]) || 0;
        return sum + value;
      }, 0);

      const contingency = (taskTotal * (estimateDetails.contingency_percentage || 0)) / 100;
      taskTotal += contingency;

      return total + taskTotal;
    }, 0);

    return total;
  };

  const handleConvert = async () => {
    if (taskPreviews.length === 0) {
      setToast({
        message: t('estimator:createAtLeastOneActivity'),
        type: 'error'
      });
      return;
    }

    for (const task of taskPreviews) {
      if (!task.title?.trim()) {
        setToast({
          message: t('estimator:allActivitiesMustHaveName'),
          type: 'error'
        });
        return;
      }
      if (task.budget <= 0) {
        setToast({
          message: t('estimator:allActivitiesMustHaveBudget'),
          type: 'error'
        });
        return;
      }
    }

    if (!projectKey.trim()) {
      setToast({
        message: t('estimator:enterProjectCode'),
        type: 'error'
      });
      return;
    }

    let existingProject = null;
    try {
      const keyCheck = await checkProjectKey(projectKey.trim().toUpperCase()).unwrap();
      if (keyCheck.exists && keyCheck.project) {
        existingProject = keyCheck.project;
      }
    } catch (error) {
      logger.error('Error checking project key:', error);
      setToast({ message: t('estimator:projectKeyCheckError'), type: 'error' });
      return;
    }

    if (existingProject) {
      const appendConfirmed = await new Promise((resolve) => {
        setExistingProjectModal({ open: true, project: existingProject, resolve });
      });

      if (!appendConfirmed) {
        return;
      }
    } else {
      const generalConfirmMessage = t('estimator:confirmConvertMessage', {
        client: estimateDetails.client_name,
        title: estimateDetails.title,
        projectKey: projectKey.trim().toUpperCase(),
        taskCount: taskPreviews.length
      });

      const confirmed = await confirmation.confirm({
        title: t('estimator:confirmConvertTitle'),
        message: generalConfirmMessage,
        confirmText: t('estimator:confirmConvertText'),
        cancelText: t('common:cancel'),
        variant: 'default'
      });

      if (!confirmed) {
        return;
      }
    }

    const totalEstimateBudget = calculateTotalEstimateBudget();
    const totalTasksBudget = taskPreviews.reduce((sum, task) => sum + parseFloat(task.budget || 0), 0);
    const difference = Math.abs(totalEstimateBudget - totalTasksBudget);

    if (difference > 0.1) {
      const percentageDiff = ((difference / totalEstimateBudget) * 100).toFixed(1);
      const budgetWarningMessage = t('estimator:budgetMismatchMessage', {
        estimateTotal: totalEstimateBudget.toFixed(1),
        taskTotal: totalTasksBudget.toFixed(1),
        difference: difference.toFixed(1),
        percentage: percentageDiff
      });

      const budgetConfirmed = await confirmation.confirm({
        title: t('estimator:budgetMismatchTitle'),
        message: budgetWarningMessage,
        confirmText: t('estimator:proceedAnyway'),
        cancelText: t('common:cancel'),
        variant: 'warning'
      });

      if (!budgetConfirmed) {
        return;
      }
    }

    try {
      setConverting(true);

      const finalTasks = [];
      let taskNumber = 1;

      for (const task of taskPreviews) {
        if (task.isMultiTask && task.subtasks) {
          for (const subtask of task.subtasks) {
            finalTasks.push({
              task_number: taskNumber++,
              title: subtask.title.trim(),
              description: t('estimator:taskDescriptionFromEstimatePct', { selectionType: task.selectionType, percentage: subtask.percentage.toFixed(1) }),
              budget: subtask.budget,
              task_status_id: 'NEW',
              task_details: {
                id: `${task.id}_${subtask.title}`,
                selection_type: task.selectionType,
                cells_count: task.cellsCount,
                selected_cells: task.selectedCells || [],
                task_color: task.color,
                original_multi_task_id: task.id,
                percentage: subtask.percentage
              }
            });
          }
        } else {
          finalTasks.push({
            task_number: taskNumber++,
            title: task.title.trim(),
            description: t('estimator:taskDescriptionFromEstimate', { selectionType: task.selectionType }),
            budget: task.budget,
            task_status_id: 'NEW',
            task_details: {
              id: task.id,
              selection_type: task.selectionType,
              cells_count: task.cellsCount,
              selected_cells: task.selectedCells || [],
              task_color: task.color
            }
          });
        }
      }

      const draftData = {
        project_draft_id: projectDraftId,
        estimate_id: selectedEstimate.estimate_id,
        client_id: selectedEstimate.client_id,
        project_key: projectKey.trim().toUpperCase(),
        title: selectedEstimate.title,
        description: t('estimator:projectFromEstimate', { title: selectedEstimate.title }),
        status_id: null,
        project_details: {
          project_managers: [currentUser.user_id],
          source: 'estimate_conversion'
        },
        tasks: finalTasks
      };

      await createOrUpdateDraft(draftData).unwrap();
      const draftId = projectDraftId;

      await convertDraftToProject(draftId).unwrap();

      setToast({
        message: existingProject
          ? t('estimator:tasksAppended', { count: finalTasks.length, projectKey: existingProject.project_key })
          : t('estimator:convertSuccess', { count: finalTasks.length }),
        type: 'success'
      });

      setTimeout(() => {
        navigate('/clients');
      }, 2000);

    } catch (error) {
      logger.error('Conversion error:', error);
      setToast({
        message: error.message || t('estimator:conversionError'),
        type: 'error'
      });
    } finally {
      setConverting(false);
    }
  };

  const availableEstimates = estimates.filter(e => e.status === 'DRAFT');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 xl:px-12">
        <div className="max-w-full mx-auto">
          <div className="mt-16"></div>

          <PageHeader
            title={t('estimator:convertEstimate')}
            icon={ArrowRightLeft}
          />
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('estimator:estimateLabel')}
              </label>
              <select
                value={selectedEstimate?.estimate_id || ''}
                onChange={(e) => handleSelectEstimate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">{t('estimator:selectEstimate')}</option>
                {availableEstimates.map(estimate => (
                  <option key={estimate.estimate_id} value={estimate.estimate_id}>
                    {estimate.title} - {estimate.client_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedEstimate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('estimator:projectCodeLabel')}
                </label>
                <input
                  type="text"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 uppercase"
                  placeholder={t('estimator:projectCodePlaceholder')}
                />
              </div>
            )}
          </div>
        </div>

        {selectedEstimate && estimateDetails && (
          <>


            <div className=" from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200 px-4 py-2 mb-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-600">{t('estimator:infoClientLabel')}</span>
                  <span className="text-gray-900">{estimateDetails.client_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-600">{t('estimator:infoTitleLabel')}</span>
                  <span className="text-gray-900">{estimateDetails.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-600">{t('estimator:estimateItemsLabel')}</span>
                  <span className="text-gray-900">{estimateDetails.tasks?.length || 0}</span>
                </div>
              </div>
            </div>

            {estimateDetails.tasks && estimateDetails.tasks.length > 0 && (
              <SelectableCellsTable
                estimateTasks={estimateDetails.tasks}
                contingencyPercentage={estimateDetails.contingency_percentage}
                selectedCells={selectedCells}
                cellToTaskMap={cellToTaskMap}
                onCellClick={setSelectedCells}
              />
            )}

            {selectedCells.size > 0 && (
              <div className="bg-white border-2 border-cyan-500 rounded-lg shadow-md p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {selectedCells.size} {selectedCells.size === 1 ? t('estimator:cellSelected') : t('estimator:cellsSelected')}
                    </div>
                    {selectionType && (
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectionType === 'ROW' ? 'bg-green-100 text-green-800' :
                        selectionType === 'COLUMN' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectionType === 'ROW' ? t('estimator:selectionRow') :
                         selectionType === 'COLUMN' ? t('estimator:selectionColumn') :
                         t('estimator:selectionSparse')}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      {t('estimator:budgetLabel')} <span className="font-bold text-cyan-700">{totalBudget.toFixed(1)}h</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleClearSelection}
                    >
                      {t('common:cancel')}
                    </Button>
                    <Button
                      color="cyan"
                      icon={Save}
                      onClick={() => setIsTaskModalOpen(true)}
                    >
                      {t('estimator:saveActivity')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <TaskPreviewList
              taskPreviews={taskPreviews}
              onEditTaskName={handleEditTaskName}
              onRemoveTask={handleRemoveTask}
              onEditTask={handleEditTask}
            />

            <div className="flex justify-between gap-3 mt-6">
              <Button
                onClick={() => navigate('/estimator')}
                variant="outline"
                icon={ArrowLeft}
                iconSize={18}
              >
                {t('estimator:backToList')}
              </Button>
              {taskPreviews.length > 0 && (
                <Button
                  color="cyan"
                  icon={FolderKanban}
                  onClick={handleConvert}
                  loading={converting}
                  disabled={converting}
                >
                  {converting ? t('estimator:converting') : t('estimator:convertButton')}
                </Button>
              )}
            </div>


            <TaskModal
              isOpen={isTaskModalOpen}
              onClose={() => setIsTaskModalOpen(false)}
              onSave={handleCreateTask}
              autoTaskName={autoTaskName}
              totalBudget={totalBudget}
              selectionType={selectionType}
              cellsCount={selectedCells.size}
            />
          </>
        )}

        {!selectedEstimate && (
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              <div className="mb-4">
                <Calculator size={64} className="mx-auto text-gray-300" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('estimator:selectEstimateMessage')}
              </h2>
              <p className="text-gray-600">
                {t('estimator:selectEstimateDescription')}
              </p>
            </div>
          </div>
        )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        config={confirmation.config}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />

      {existingProjectModal.open && (() => {
        const proj = existingProjectModal.project;
        const tasks = proj?.tasks || [];
        const totalBudget = tasks.reduce((sum, t) => sum + parseFloat(t.budget || 0), 0);

        const handleClose = (result) => {
          existingProjectModal.resolve?.(result);
          setExistingProjectModal({ open: false, project: null, resolve: null });
        };

        return (
          <div className="fixed inset-0 flex items-center justify-center z-50" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={() => handleClose(false)} />
            <div className="relative bg-white rounded-lg shadow-xl mx-4" style={{ minWidth: '540px' }}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('estimator:existingProject')}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: t('estimator:existingProjectMessage', { projectKey: proj?.project_key, taskCount: taskPreviews.length }) }} />

                    <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        {proj?.title} &mdash; {proj?.client_name}
                      </div>
                      {tasks.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                              <th className="pb-1 pr-3 font-medium">#</th>
                              <th className="pb-1 pr-3 font-medium">Task</th>
                              <th className="pb-1 pr-3 font-medium">{t('common:status')}</th>
                              <th className="pb-1 text-right font-medium">{t('common:budget')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tasks.map((t) => (
                              <tr key={t.task_id} className="border-b border-gray-100 last:border-0">
                                <td className="py-1.5 pr-3 text-gray-400 font-mono text-xs">{t.task_number}</td>
                                <td className="py-1.5 pr-3 text-gray-800">{t.title}</td>
                                <td className="py-1.5 pr-3">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-600">
                                    {t.task_status_id}
                                  </span>
                                </td>
                                <td className="py-1.5 text-right text-gray-700 font-mono">{parseFloat(t.budget || 0).toFixed(1)}h</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-gray-300">
                              <td colSpan={3} className="pt-1.5 text-xs font-semibold text-gray-600">{t('common:total')}</td>
                              <td className="pt-1.5 text-right font-mono font-semibold text-gray-800">{totalBudget.toFixed(1)}h</td>
                            </tr>
                          </tfoot>
                        </table>
                      ) : (
                        <p className="text-sm text-gray-400 italic">{t('estimator:noTasksInProject')}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button onClick={() => handleClose(false)} variant="ghost" color="gray">
                    {t('common:cancel')}
                  </Button>
                  <Button onClick={() => handleClose(true)} color="cyan">
                    {t('estimator:appendTasks')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default ConvertEstimateToProject;
