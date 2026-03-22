import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, AlertCircle, X, ChevronLeft, ChevronRight, Calendar, Check } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';
import DateInput from '../../../shared/ui/DateInput';
import { FilterDropdown, FilterBar } from '../../../shared/ui/filters';
import TransposedTimesheetGrid from '../../../shared/components/TransposedTimesheetGrid';
import { formatDateLocal } from '../../../utils/table/tableUtils';
import { useLazyGetPreviewSubmissionQuery } from '../api/timesheetEndpoints';
import { useGetHolidaysQuery } from '../../holidays/api/holidayEndpoints';
import { useLocale } from '../../../hooks/useLocale';
import { isWeekend, isHoliday } from '../../../utils/date/workingDays';

const SubmissionPreviewModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation(['timesheet', 'common']);
  const locale = useLocale();
  const [fetchPreview, { data: previewTasks = [], isLoading: previewLoading }] = useLazyGetPreviewSubmissionQuery();
  const { data: holidays = [] } = useGetHolidaysQuery();
  const [selectedTimesheetIds, setSelectedTimesheetIds] = useState(new Set());
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterClientIds, setFilterClientIds] = useState([]);
  const [filterProjectIds, setFilterProjectIds] = useState([]);
  // Pending state for dropdowns — applied only when dropdown closes
  const [pendingClientIds, setPendingClientIds] = useState([]);
  const [pendingProjectIds, setPendingProjectIds] = useState([]);
  // Mobile carousel state
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  const applyClientFilter = useCallback(() => {
    setFilterClientIds(pendingClientIds);
  }, [pendingClientIds]);

  const applyProjectFilter = useCallback(() => {
    setFilterProjectIds(pendingProjectIds);
  }, [pendingProjectIds]);

  const uniqueClients = useMemo(() => {
    const map = new Map();
    previewTasks.forEach(task => {
      if (!map.has(task.client_id)) {
        map.set(task.client_id, {
          client_id: task.client_id,
          client_key: task.client_key,
          client_name: task.client_name,
          client_color: task.client_color,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.client_name || '').localeCompare(b.client_name || ''));
  }, [previewTasks]);

  const uniqueProjects = useMemo(() => {
    const map = new Map();
    previewTasks
      .filter(task => pendingClientIds.length === 0 || pendingClientIds.includes(task.client_id))
      .forEach(task => {
        if (!map.has(task.project_id)) {
          map.set(task.project_id, {
            project_id: task.project_id,
            project_key: task.project_key,
            project_title: task.project_title,
            client_key: task.client_key,
            client_color: task.client_color,
          });
        }
      });
    return Array.from(map.values()).sort((a, b) => `${a.client_key}-${a.project_key}`.localeCompare(`${b.client_key}-${b.project_key}`));
  }, [previewTasks, pendingClientIds]);

  const filteredPreviewTasks = useMemo(() => {
    return previewTasks
      .filter(task => {
        if (filterClientIds.length > 0 && !filterClientIds.includes(task.client_id)) return false;
        if (filterProjectIds.length > 0 && !filterProjectIds.includes(task.project_id)) return false;
        return true;
      })
      .map(task => {
        if (!filterStartDate && !filterEndDate) return task;
        const filteredTimesheets = task.timesheets.filter(ts => {
          if (filterStartDate && ts.timesheet_date < filterStartDate) return false;
          if (filterEndDate && ts.timesheet_date > filterEndDate) return false;
          return true;
        });
        if (filteredTimesheets.length === 0) return null;
        return {
          ...task,
          timesheets: filteredTimesheets,
          total_hours: filteredTimesheets.reduce((sum, ts) => sum + ts.hours, 0),
        };
      })
      .filter(Boolean);
  }, [previewTasks, filterStartDate, filterEndDate, filterClientIds, filterProjectIds]);

  const filteredTimesheetIds = useMemo(() => {
    const ids = new Set();
    filteredPreviewTasks.forEach(task => {
      task.timesheets.forEach(ts => {
        ids.add(ts.timesheet_id);
      });
    });
    return ids;
  }, [filteredPreviewTasks]);

  useEffect(() => {
    if (isOpen) {
      fetchPreview();
      setSelectedTimesheetIds(new Set());
      setFilterStartDate('');
      setFilterEndDate(formatDateLocal(new Date()));
      setFilterClientIds([]);
      setFilterProjectIds([]);
      setPendingClientIds([]);
      setPendingProjectIds([]);
      setCurrentTaskIndex(0);
    }
  }, [isOpen, fetchPreview]);

  useEffect(() => {
    setSelectedTimesheetIds(prev => {
      const next = new Set();
      prev.forEach(id => {
        if (filteredTimesheetIds.has(id)) next.add(id);
      });
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [filteredTimesheetIds]);

  // Reset carousel index when filtered tasks change
  useEffect(() => {
    setCurrentTaskIndex(0);
  }, [filteredPreviewTasks.length]);

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedTimesheetIds));
  };

  const getSelectedHours = () => {
    let total = 0;
    filteredPreviewTasks.forEach(task => {
      task.timesheets.forEach(ts => {
        if (selectedTimesheetIds.has(ts.timesheet_id)) {
          total += ts.hours;
        }
      });
    });
    return total;
  };

  const getSelectedCount = () => {
    return selectedTimesheetIds.size;
  };

  const getTotalHours = () => {
    return filteredPreviewTasks.reduce((sum, task) => sum + task.total_hours, 0);
  };

  const clearDateFilters = useCallback(() => {
    setFilterStartDate('');
    setFilterEndDate('');
  }, []);

  // Mobile carousel helpers
  const currentTask = filteredPreviewTasks[currentTaskIndex];

  const sortedTimesheets = useMemo(() => {
    if (!currentTask?.timesheets) return [];
    return [...currentTask.timesheets].sort((a, b) => a.timesheet_date.localeCompare(b.timesheet_date));
  }, [currentTask]);

  const goToPrev = () => {
    setCurrentTaskIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentTaskIndex(prev => Math.min(filteredPreviewTasks.length - 1, prev + 1));
  };

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  }, [locale]);

  const isNonWorkingDay = useCallback((dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return isWeekend(date) || isHoliday(date, holidays);
  }, [holidays]);

  const toggleTimesheetSelection = useCallback((timesheetId) => {
    setSelectedTimesheetIds(prev => {
      const next = new Set(prev);
      if (next.has(timesheetId)) next.delete(timesheetId);
      else next.add(timesheetId);
      return next;
    });
  }, []);

  const toggleTaskSelection = useCallback((task) => {
    if (!task) return;
    const taskTsIds = task.timesheets.map(ts => ts.timesheet_id);
    setSelectedTimesheetIds(prev => {
      const next = new Set(prev);
      const allSelected = taskTsIds.every(id => next.has(id));
      if (allSelected) {
        taskTsIds.forEach(id => next.delete(id));
      } else {
        taskTsIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, []);

  const isTaskFullySelected = useCallback((task) => {
    if (!task || task.timesheets.length === 0) return false;
    return task.timesheets.every(ts => selectedTimesheetIds.has(ts.timesheet_id));
  }, [selectedTimesheetIds]);

  const isTaskPartiallySelected = useCallback((task) => {
    if (!task || task.timesheets.length === 0) return false;
    return task.timesheets.some(ts => selectedTimesheetIds.has(ts.timesheet_id)) && !isTaskFullySelected(task);
  }, [selectedTimesheetIds, isTaskFullySelected]);


  // Modal size based on filtered tasks — changes only when filters are applied (on dropdown close)
  const modalSize = useMemo(() => {
    const taskCount = filteredPreviewTasks.length;
    if (taskCount <= 1) return 'lg';
    if (taskCount <= 3) return 'xl';
    if (taskCount <= 6) return '2xl';
    return '3xl';
  }, [filteredPreviewTasks.length]);

  const customFooter = (
    <>
      <Button onClick={handleClose} variant="outline" color="gray" size="md">
        {t('common:cancel')}
      </Button>
      <Button
        onClick={handleConfirm}
        disabled={filteredPreviewTasks.length === 0 || selectedTimesheetIds.size === 0}
        color="cyan"
        size="md"
      >
        {t('timesheet:confirmSubmission')}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('timesheet:submissionPreviewTitle')}
      icon={<AlertCircle className="text-cyan-600" size={28} />}
      size={modalSize}
      customFooter={customFooter}
      showFooter={true}
    >
      {previewLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-xl text-gray-600">{t('common:loading')}</div>
        </div>
      )}

      {!previewLoading && previewTasks.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{t('timesheet:noTimesheetToSubmit')}</span>
        </div>
      )}

      {!previewLoading && previewTasks.length > 0 && (
        <div className="flex flex-col gap-3 h-full min-h-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <FilterBar layout="wrap" gap="sm" withBackground={false} withPadding={false}>
              <DateInput
                value={filterStartDate}
                onChange={setFilterStartDate}
                inputClassName="w-full px-2 py-1 bg-transparent rounded-lg cursor-pointer focus:outline-none text-xs"
              />
              <span className="text-gray-400 text-xs">—</span>
              <DateInput
                value={filterEndDate}
                onChange={setFilterEndDate}
                inputClassName="w-full px-2 py-1 bg-transparent rounded-lg cursor-pointer focus:outline-none text-xs"
              />

              <FilterDropdown
                options={uniqueClients.map(c => ({
                  value: c.client_id,
                  label: `${c.client_key} - ${c.client_name}`,
                  color: c.client_color,
                }))}
                selectedValues={pendingClientIds}
                onChange={setPendingClientIds}
                onClose={applyClientFilter}
                placeholder={t('timesheet:allClients')}
                selectedLabel={(count) => t('timesheet:clientsCount', { count })}
                title={t('timesheet:selectClients')}
                size="sm"
              />

              <FilterDropdown
                options={uniqueProjects.map(p => ({
                  value: p.project_id,
                  label: `${p.client_key}-${p.project_key} - ${p.project_title}`,
                  color: p.client_color,
                }))}
                selectedValues={pendingProjectIds}
                onChange={setPendingProjectIds}
                onClose={applyProjectFilter}
                placeholder={t('timesheet:allProjects')}
                selectedLabel={(count) => t('timesheet:projectsCount', { count })}
                title={t('timesheet:selectProjects')}
                size="sm"
              />

              {(filterStartDate || filterEndDate || filterClientIds.length > 0 || filterProjectIds.length > 0) && (
                <Button
                  onClick={() => { clearDateFilters(); setFilterClientIds([]); setFilterProjectIds([]); setPendingClientIds([]); setPendingProjectIds([]); }}
                  variant="outline"
                  color="red"
                  size="sm"
                  icon={X}
                  iconSize={14}
                  className="py-1.5! px-3! text-xs hover:bg-red-50"
                >
                  {t('timesheet:clearFilters')}
                </Button>
              )}
            </FilterBar>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-gray-400" />
                <span>{t('timesheet:entriesLabel')}</span>
                <span className="font-semibold text-gray-800">{getSelectedCount()}</span>
                <span className="text-gray-400">/ {filteredTimesheetIds.size}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{t('timesheet:hoursLabel')}</span>
                <span className="font-semibold text-gray-800">{getSelectedHours().toFixed(1)}h</span>
                <span className="text-gray-400">/ {getTotalHours().toFixed(1)}h</span>
              </div>
            </div>
            {selectedTimesheetIds.size === 0 && (
              <span className="text-xs text-gray-400 hidden sm:inline">
                {t('timesheet:selectEntriesToSubmit')}
              </span>
            )}
          </div>

          {filteredPreviewTasks.length > 0 ? (
            <>
              {/* Desktop: TransposedTimesheetGrid */}
              <div className="hidden lg:flex flex-col flex-1 min-h-0">
                <TransposedTimesheetGrid
                  tasks={filteredPreviewTasks}
                  holidays={holidays}
                  selectable
                  selectedTimesheetIds={selectedTimesheetIds}
                  onSelectionChange={setSelectedTimesheetIds}
                  filterStartDate={filterStartDate}
                  filterEndDate={filterEndDate}
                />
              </div>

              {/* Mobile: Task-by-task carousel with selection */}
              <div className="lg:hidden flex flex-col flex-1 min-h-0">
                {/* Navigation header */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-3">
                  <button
                    onClick={goToPrev}
                    disabled={currentTaskIndex === 0}
                    className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-cyan-600 hover:bg-cyan-50 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
                    aria-label={t('timesheet:previousTask')}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1 px-2">
                    {currentTask && (
                      <>
                        <div className="flex items-center gap-1.5 max-w-full">
                          <div
                            className="w-5 h-5 min-w-5 min-h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold leading-none"
                            style={{
                              backgroundColor: currentTask.symbol_bg_color || currentTask.client_color || '#6366F1',
                              color: currentTask.symbol_letter_color || '#FFFFFF',
                            }}
                          >
                            {currentTask.symbol_letter || (currentTask.client_name || '?')[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            {currentTask.project_title || currentTask.project_key}
                          </span>
                        </div>
                        {currentTask.project_type_id !== 'TM' && currentTask.task_title && (
                          <span className="text-[11px] text-gray-500 truncate max-w-full">
                            {currentTask.task_title}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {currentTaskIndex + 1} / {filteredPreviewTasks.length}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={goToNext}
                    disabled={currentTaskIndex === filteredPreviewTasks.length - 1}
                    className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-cyan-600 hover:bg-cyan-50 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
                    aria-label={t('timesheet:nextTask')}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Dot indicators */}
                {filteredPreviewTasks.length > 1 && filteredPreviewTasks.length <= 15 && (
                  <div className="flex items-center justify-center gap-1.5 mb-3">
                    {filteredPreviewTasks.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentTaskIndex(idx)}
                        className={`rounded-full transition-all ${
                          idx === currentTaskIndex
                            ? 'w-2.5 h-2.5 bg-cyan-600'
                            : 'w-1.5 h-1.5 bg-gray-300'
                        }`}
                        aria-label={`${t('timesheet:goToTask')} ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Task hours summary + select all for task */}
                {currentTask && (
                  <div className="flex items-center justify-between px-3 py-2 bg-cyan-50 rounded-lg mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">
                        {t('timesheet:entries')} <span className="font-semibold text-gray-800">{currentTask.timesheets.length}</span>
                      </span>
                      <span className="text-sm font-bold text-cyan-700">
                        {currentTask.total_hours.toFixed(1)}h
                      </span>
                    </div>
                    <button
                      onClick={() => toggleTaskSelection(currentTask)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                        isTaskFullySelected(currentTask)
                          ? 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-700'
                          : isTaskPartiallySelected(currentTask)
                            ? 'bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {isTaskFullySelected(currentTask) ? t('common:deselectAll') : t('common:selectAll')}
                    </button>
                  </div>
                )}

                {/* Timesheet entries list with selection */}
                <div className="flex-1 overflow-y-auto min-h-0 -mx-1">
                  {sortedTimesheets.map((ts) => {
                    const nonWorking = isNonWorkingDay(ts.timesheet_date);
                    const isSelected = selectedTimesheetIds.has(ts.timesheet_id);
                    return (
                      <button
                        key={ts.timesheet_id}
                        type="button"
                        onClick={() => toggleTimesheetSelection(ts.timesheet_id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 border-b border-gray-100 transition-colors text-left ${
                          isSelected
                            ? 'bg-cyan-100'
                            : nonWorking
                              ? 'bg-gray-50 hover:bg-gray-100'
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-5 h-5 min-w-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-cyan-600 border-cyan-600'
                              : 'bg-white border-gray-300'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <Calendar className={`h-3.5 w-3.5 shrink-0 ${nonWorking ? 'text-gray-400' : 'text-cyan-500'}`} />
                          <span className={`text-sm ${nonWorking ? 'text-gray-500' : 'text-gray-700'}`}>
                            {formatDate(ts.timesheet_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {ts.details && (
                            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" title={ts.details} />
                          )}
                          <span className={`text-sm font-semibold tabular-nums ${
                            isSelected ? 'text-cyan-700' : nonWorking ? 'text-gray-600' : 'text-gray-800'
                          }`}>
                            {ts.hours.toFixed(ts.hours % 1 === 0 ? 0 : 1)}h
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{t('timesheet:noTimesheetInRange')}</span>
            </div>
          )}
        </div>
      )}
    </BaseModal>
  );
};

export default SubmissionPreviewModal;
