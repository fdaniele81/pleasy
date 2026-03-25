import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowRightLeft, FolderKanban, Calculator, ChevronDown, ClipboardList } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import logger from '../../utils/logger';
import { useLazyGetEstimateQuery } from '../estimator/api/estimateEndpoints';
import {
  useLazyGetDraftsByEstimateQuery,
  useCreateOrUpdateDraftMutation,
  useConvertDraftToProjectMutation,
} from '../estimator/api/projectDraftEndpoints';
import { useLazyGenerateProjectKeyQuery } from '../projects/api/projectEndpoints';
import {
  resetAllFilters,
  setFilterProjectIds,
  setShowTimeline,
  mergeExpandedProjects,
} from '../../store/slices/planningFiltersSlice';
import { addToast } from '../../store/slices/toastSlice';
import Button from '../../shared/ui/Button';
import PageHeader from '../../shared/ui/PageHeader';
import useDropdownManager from '../../shared/ui/filters/useDropdownManager';

import EstimateSelector from './components/EstimateSelector';
import PhaseTaskList from './components/PhaseTaskList';
import AdvancedModePanel from './components/AdvancedModePanel';
import ConversionDateModal from './components/ConversionDateModal';
import useConversionState from './hooks/useConversionState';
import { useConversionUndo } from './hooks/useConversionUndo';
import { calculatePhaseTotals } from './utils/phaseMapping';

function ConvertEstimateToProject() {
  const { t } = useTranslation(['estimateConversion', 'estimator', 'common', 'navigation']);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isMobile } = useBreakpoint();
  const currentUser = useSelector(state => state.auth.user);
  const { toggleDropdown, isDropdownOpen, getDropdownRef } = useDropdownManager();

  // API hooks
  const [getEstimate] = useLazyGetEstimateQuery();
  const [getDraftsByEstimate] = useLazyGetDraftsByEstimateQuery();
  const [createOrUpdateDraft] = useCreateOrUpdateDraftMutation();
  const [convertDraftToProject] = useConvertDraftToProjectMutation();
  const [generateProjectKey] = useLazyGenerateProjectKeyQuery();

  // Conversion state
  const conversion = useConversionState();

  // Undo/redo
  const saveDraftRef = useRef(null);
  const { pushSnapshot, clearStacks } = useConversionUndo({
    restoreState: conversion,
    saveDraftFn: saveDraftRef,
  });

  // Debounce timer for draft saves
  const saveDraftTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(saveDraftTimerRef.current), []);

  // Page state
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [estimateDetails, setEstimateDetails] = useState(null);
  const [projectKey, setProjectKey] = useState('');
  const [projectDraftId, setProjectDraftId] = useState(null);
  const [keyLocked, setKeyLocked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showInDays, setShowInDays] = useState(currentUser?.preferred_unit === 'DAYS');
  const [keyBlocked, setKeyBlocked] = useState(false);
  const [existingProject, setExistingProject] = useState(null);

  /**
   * Handle estimate selection: load details, check for existing drafts.
   */
  const handleSelectEstimate = useCallback(async (estimateId) => {
    clearStacks();

    if (!estimateId) {
      setSelectedEstimate(null);
      setEstimateDetails(null);
      setProjectKey('');
      setProjectDraftId(null);
      setKeyLocked(true);
      return;
    }

    setLoading(true);
    try {
      const estimate = await getEstimate(estimateId).unwrap();
      setSelectedEstimate(estimate);
      setEstimateDetails(estimate);

      // Check for existing draft
      const draftResponse = await getDraftsByEstimate(estimateId).unwrap();
      if (draftResponse.drafts && draftResponse.drafts.length > 0) {
        const draft = draftResponse.drafts[0];
        setProjectKey(draft.project_key || '');
        setProjectDraftId(draft.project_draft_id);

        // Load existing tasks from draft
        if (draft.tasks && Array.isArray(draft.tasks) && draft.tasks.length > 0) {
          // Use sum of rounded phase budgets (consistent with initFromEstimate)
          const phaseTotals = calculatePhaseTotals(estimate.tasks, estimate.contingency_percentage);
          const totalBudget = Math.round(phaseTotals.reduce((sum, p) => sum + p.budget, 0) * 10) / 10;
          conversion.initFromDraft(draft.tasks, totalBudget);
        } else {
          conversion.initFromEstimate(estimate);
        }
      } else {
        // New conversion: auto-generate phase rows and save draft immediately
        const rows = conversion.initFromEstimate(estimate);
        setKeyLocked(true);

        let generatedKey = '';
        if (estimate?.client_id) {
          try {
            generatedKey = await generateProjectKey({
              title: estimate.title || '',
            }).unwrap();
            setProjectKey(generatedKey);
          } catch (error) {
            logger.error('Error generating project key:', error);
          }
        }

        // Auto-save draft to DB
        try {
          const draftData = {
            estimate_id: estimate.estimate_id,
            client_id: estimate.client_id,
            project_key: generatedKey,
            title: estimate.title,
            description: t('estimator:projectFromEstimate', { title: estimate.title }),
            status_id: null,
            project_details: {
              project_managers: [currentUser.user_id],
              source: 'estimate_conversion',
            },
            tasks: rows.map((row, index) => ({
              task_number: index + 1,
              title: row.title || t('estimator:' + (row.titleKey || 'phaseAnalysis')),
              description: t('estimateConversion:taskFromConversion'),
              budget: row.budget,
              task_status_id: 'NEW',
              task_details: {
                id: row.id,
                phase_keys: row.phaseKeys,
                selected_cells: row.selectedCells || [],
                task_color: row.color,
                source: row.source,
              },
            })),
          };
          const result = await createOrUpdateDraft(draftData).unwrap();
          if (result.projectDraft) {
            setProjectDraftId(result.projectDraft.project_draft_id);
          }
        } catch (error) {
          logger.error('Error auto-saving draft:', error);
        }
      }
    } catch (error) {
      logger.error('Error loading estimate:', error);
      dispatch(addToast({ message: t('estimator:loadingError'), type: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [getEstimate, getDraftsByEstimate, generateProjectKey, createOrUpdateDraft, conversion, currentUser, dispatch, t, clearStacks]);

  /**
   * Save current task rows to draft (auto-save, debounced 500ms).
   */
  const saveDraft = useCallback((rows) => {
    clearTimeout(saveDraftTimerRef.current);
    saveDraftTimerRef.current = setTimeout(async () => {
      if (!selectedEstimate) return;

      const draftData = {
        ...(projectDraftId ? { project_draft_id: projectDraftId } : {}),
        estimate_id: selectedEstimate.estimate_id,
        client_id: selectedEstimate.client_id,
        project_key: projectKey.trim().toUpperCase(),
        title: selectedEstimate.title,
        description: t('estimator:projectFromEstimate', { title: selectedEstimate.title }),
        status_id: null,
        project_details: {
          project_managers: [currentUser.user_id],
          source: 'estimate_conversion',
        },
        tasks: rows.map((row, index) => ({
          task_number: index + 1,
          title: row.title || t('estimator:' + (row.titleKey || 'phaseAnalysis')),
          description: t('estimateConversion:taskFromConversion'),
          budget: row.budget,
          task_status_id: 'NEW',
          task_details: {
            id: row.id,
            phase_keys: row.phaseKeys,
            selected_cells: row.selectedCells || [],
            task_color: row.color,
            source: row.source,
          },
        })),
      };

      try {
        const result = await createOrUpdateDraft(draftData).unwrap();
        if (!projectDraftId && result.projectDraft) {
          setProjectDraftId(result.projectDraft.project_draft_id);
        }
      } catch (error) {
        logger.error('Error saving draft:', error);
      }
    }, 500);
  }, [selectedEstimate, projectDraftId, projectKey, currentUser, createOrUpdateDraft, t]);

  saveDraftRef.current = saveDraft;

  /**
   * Merge handler: merge selected rows then save.
   */
  const handleMerge = useCallback((title) => {
    pushSnapshot(conversion.captureSnapshot());
    const newRows = conversion.mergeRows(title);
    if (newRows) saveDraft(newRows);
  }, [conversion, saveDraft, pushSnapshot]);

  /**
   * Split handler: split selected row into N parts then save.
   */
  const handleSplit = useCallback((splitCount, budgets) => {
    pushSnapshot(conversion.captureSnapshot());
    const newRows = conversion.splitRow(splitCount, budgets);
    if (newRows) saveDraft(newRows);
  }, [conversion, saveDraft, pushSnapshot]);

  /**
   * Title change handler — save to DB.
   */
  const handleTitleChange = useCallback((rowId, newTitle) => {
    pushSnapshot(conversion.captureSnapshot());
    const newRows = conversion.updateRowTitle(rowId, newTitle);
    if (newRows) saveDraft(newRows);
  }, [conversion, saveDraft, pushSnapshot]);

  /**
   * Remove row handler.
   */
  const handleRemoveRow = useCallback((rowId) => {
    pushSnapshot(conversion.captureSnapshot());
    const newRows = conversion.removeRow(rowId);
    if (newRows) saveDraft(newRows);
  }, [conversion, saveDraft, pushSnapshot]);

  /**
   * Create task from advanced mode cell selection.
   */
  const handleCreateTaskFromCells = useCallback((title, cells, budget) => {
    pushSnapshot(conversion.captureSnapshot());
    const newRows = conversion.createTaskFromCells(title, cells, budget);
    if (newRows) saveDraft(newRows);
  }, [conversion, saveDraft, pushSnapshot]);

  /**
   * Reset: re-create initial phase rows from the estimate.
   */
  const handleReset = useCallback(() => {
    if (!estimateDetails) return;
    pushSnapshot(conversion.captureSnapshot());
    const rows = conversion.initFromEstimate(estimateDetails, { keepMode: true });
    saveDraft(rows);
  }, [conversion, estimateDetails, saveDraft, pushSnapshot]);

  /**
   * Open conversion date modal (validates first).
   */
  const handleStartConvert = useCallback(async () => {
    if (conversion.taskRows.length === 0) {
      dispatch(addToast({ message: t('estimator:createAtLeastOneActivity'), type: 'error' }));
      return;
    }

    // Check all tasks have titles
    for (const row of conversion.taskRows) {
      if (!row.title?.trim() && !row.titleKey) {
        dispatch(addToast({ message: t('estimator:allActivitiesMustHaveName'), type: 'error' }));
        return;
      }
    }

    if (!projectKey.trim()) {
      dispatch(addToast({ message: t('estimator:enterProjectCode'), type: 'error' }));
      return;
    }

    if (keyBlocked) {
      dispatch(addToast({ message: t('estimateConversion:deletedKeyError', { projectKey: projectKey.trim().toUpperCase() }), type: 'error' }));
      return;
    }

    setShowDateModal(true);
  }, [conversion.taskRows, projectKey, keyBlocked, dispatch, t]);

  /**
   * Final conversion: save draft with dates, then convert.
   */
  const handleFinalConvert = useCallback(async (startDate, elapsedDays, tasksWithDates) => {
    setConverting(true);

    try {
      // Save draft with dates
      const draftData = {
        ...(projectDraftId ? { project_draft_id: projectDraftId } : {}),
        estimate_id: selectedEstimate.estimate_id,
        client_id: selectedEstimate.client_id,
        project_key: projectKey.trim().toUpperCase(),
        title: selectedEstimate.title,
        description: t('estimator:projectFromEstimate', { title: selectedEstimate.title }),
        status_id: null,
        project_details: {
          project_managers: [currentUser.user_id],
          source: 'estimate_conversion',
        },
        tasks: tasksWithDates.map((row, index) => ({
          task_number: index + 1,
          title: (row.title || t('estimator:' + (row.titleKey || 'phaseAnalysis'))).trim(),
          description: t('estimateConversion:taskFromConversion'),
          budget: row.budget,
          task_status_id: 'NEW',
          start_date: row.start_date || null,
          end_date: row.end_date || null,
          task_details: {
            id: row.id,
            phase_keys: row.phaseKeys,
            selected_cells: row.selectedCells || [],
            task_color: row.color,
            source: row.source,
          },
        })),
      };

      const draftResult = await createOrUpdateDraft(draftData).unwrap();
      const draftId = projectDraftId || draftResult.projectDraft?.project_draft_id;

      // Convert
      const convertResult = await convertDraftToProject(draftId).unwrap();
      const projectId = convertResult.project?.project_id;

      dispatch(addToast({
        message: t('estimator:convertSuccess', { count: tasksWithDates.length }),
        type: 'success',
      }));

      setShowDateModal(false);

      // Navigate to Planning filtered by this project in timeline mode
      if (projectId) {
        dispatch(resetAllFilters());
        dispatch(setFilterProjectIds([projectId]));
        dispatch(setShowTimeline(true));
        dispatch(mergeExpandedProjects({ [projectId]: true }));
        navigate('/planning');
      } else {
        navigate('/planning');
      }
    } catch (error) {
      logger.error('Conversion error:', error);
      dispatch(addToast({
        message: error.message || t('estimator:conversionError'),
        type: 'error',
      }));
    } finally {
      setConverting(false);
    }
  }, [
    projectKey, projectDraftId, selectedEstimate, currentUser,
    createOrUpdateDraft, convertDraftToProject,
    dispatch, navigate, t,
  ]);

  return (
    <div className="min-h-screen bg-gray-100 pt-16 sm:pt-20">
      <div className="px-4 pt-2 pb-3 sm:p-3 lg:p-4 xl:px-12">
        <div className="max-w-full mx-auto">
          <PageHeader
            title={t('estimator:convertEstimate')}
            icon={ArrowRightLeft}
            actionButton={{
              label: t('navigation:mySubmissions'),
              onClick: () => navigate('/my-submissions'),
              icon: ClipboardList,
            }}
          />

          {/* Estimate selection */}
          <EstimateSelector
            selectedEstimateId={selectedEstimate?.estimate_id}
            onSelectEstimate={handleSelectEstimate}
            projectKey={projectKey}
            onProjectKeyChange={setProjectKey}
            keyLocked={keyLocked}
            onKeyLockedChange={setKeyLocked}
            onKeyBlocked={setKeyBlocked}
            onExistingProjectChange={setExistingProject}
          />

          {/* Loaded estimate content */}
          {selectedEstimate && estimateDetails && (
            <>
              {/* Info bar */}
              <div className="rounded-lg shadow-sm border border-gray-200 bg-white px-3 lg:px-4 py-2 mb-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  {/* Client & title */}
                  <div className="flex items-center gap-3 lg:gap-5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-gray-500 text-xs lg:text-sm shrink-0">{t('estimator:infoClientLabel')}</span>
                      <span className="text-gray-900 text-xs lg:text-sm truncate">{estimateDetails.client_name}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-gray-500 text-xs lg:text-sm shrink-0">{t('estimator:infoTitleLabel')}</span>
                      <span className="text-gray-900 text-xs lg:text-sm truncate">{estimateDetails.title}</span>
                    </div>
                    {!isMobile && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-500 text-sm">{t('estimator:estimateItemsLabel')}</span>
                        <span className="text-gray-900 text-sm">{estimateDetails.tasks?.length || 0}</span>
                      </div>
                    )}
                  </div>

                  {/* Unit selector */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => toggleDropdown('unit-dropdown')}
                      className="inline-flex items-center gap-1.5 px-2 lg:px-3 py-1 text-xs font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 min-w-[60px] lg:min-w-[75px] justify-between"
                    >
                      <span className="truncate">{showInDays ? t('estimator:unitDays') : t('estimator:unitHours')}</span>
                      <ChevronDown size={14} className="shrink-0" />
                    </button>
                    <div
                      ref={getDropdownRef('unit-dropdown')}
                      className={`${isDropdownOpen('unit-dropdown') ? '' : 'hidden'} absolute top-full right-0 mt-1 w-32 bg-white border border-gray-300 rounded-lg shadow-lg z-50`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="py-1">
                        <button
                          onClick={() => { setShowInDays(false); toggleDropdown('unit-dropdown'); }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${!showInDays ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-gray-700'}`}
                        >
                          {t('estimator:unitHours')}
                        </button>
                        <button
                          onClick={() => { setShowInDays(true); toggleDropdown('unit-dropdown'); }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${showInDays ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-gray-700'}`}
                        >
                          {t('estimator:unitDays')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content: Simple only on mobile, Simple or Advanced on desktop */}
              {(isMobile || conversion.mode === 'simple') ? (
                <PhaseTaskList
                  taskRows={conversion.taskRows}
                  selectedRowIds={conversion.selectedRowIds}
                  onToggleRow={conversion.toggleRowSelection}
                  onMerge={handleMerge}
                  onSplit={handleSplit}
                  onTitleChange={handleTitleChange}
                  onRemoveRow={handleRemoveRow}
                  onReset={handleReset}
                  onSwitchToAdvanced={() => conversion.setMode('advanced')}
                  originalTotal={conversion.originalTotalBudget}
                  currentTotal={conversion.currentTotalBudget}
                  budgetDifference={conversion.budgetDifference}
                  showInDays={showInDays}
                />
              ) : (
                <AdvancedModePanel
                  estimateDetails={estimateDetails}
                  selectedCells={conversion.selectedCells}
                  onSelectedCellsChange={conversion.setSelectedCells}
                  cellToTaskMap={conversion.cellToTaskMap}
                  taskRows={conversion.taskRows}
                  selectedRowIds={conversion.selectedRowIds}
                  onToggleRow={conversion.toggleRowSelection}
                  onCreateTask={handleCreateTaskFromCells}
                  onMerge={handleMerge}
                  onSplit={handleSplit}
                  onTitleChange={handleTitleChange}
                  onRemoveRow={handleRemoveRow}
                  onReset={handleReset}
                  onBack={() => conversion.setMode('simple')}
                  originalTotal={conversion.originalTotalBudget}
                  currentTotal={conversion.currentTotalBudget}
                  budgetDifference={conversion.budgetDifference}
                  showInDays={showInDays}
                />
              )}

              {/* Action buttons — sticky on mobile */}
              {conversion.taskRows.length > 0 && (
                <div className={`mt-4 lg:mt-6 ${isMobile ? 'sticky bottom-0 z-30 -mx-3 px-3 py-3 bg-gray-100/95 backdrop-blur-sm border-t border-gray-200' : 'flex justify-end'}`}>
                  <Button
                    color="cyan"
                    icon={FolderKanban}
                    onClick={handleStartConvert}
                    loading={converting}
                    disabled={converting}
                    fullWidth={isMobile}
                  >
                    {converting ? t('estimator:converting') : t('estimator:convertButton')}
                  </Button>
                </div>
              )}

              {/* Date modal */}
              <ConversionDateModal
                isOpen={showDateModal}
                onClose={() => setShowDateModal(false)}
                onConfirm={handleFinalConvert}
                taskRows={conversion.taskRows}
                originalTotal={conversion.originalTotalBudget}
                currentTotal={conversion.currentTotalBudget}
                budgetDifference={conversion.budgetDifference}
                showInDays={showInDays}
                converting={converting}
                existingProject={existingProject}
              />
            </>
          )}

          {/* Empty state */}
          {!selectedEstimate && (
            <div className="bg-white rounded-lg shadow-md p-8 lg:p-12">
              <div className="text-center">
                <div className="mb-4">
                  <Calculator size={isMobile ? 48 : 64} className="mx-auto text-gray-300" />
                </div>
                <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4">
                  {t('estimator:selectEstimateMessage')}
                </h2>
                <p className="text-sm lg:text-base text-gray-600">
                  {t('estimator:selectEstimateDescription')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default ConvertEstimateToProject;
