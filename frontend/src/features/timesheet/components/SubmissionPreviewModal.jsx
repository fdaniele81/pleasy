import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, AlertCircle, X } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';
import DateInput from '../../../shared/ui/DateInput';
import { FilterDropdown, FilterBar } from '../../../shared/ui/filters';
import TransposedTimesheetGrid from '../../../shared/components/TransposedTimesheetGrid';
import { formatDateLocal } from '../../../utils/table/tableUtils';
import { useLazyGetPreviewSubmissionQuery } from '../api/timesheetEndpoints';
import { useGetHolidaysQuery } from '../../holidays/api/holidayEndpoints';

const SubmissionPreviewModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation(['timesheet', 'common']);
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
              <span className="text-xs text-gray-400">
                {t('timesheet:selectEntriesToSubmit')}
              </span>
            )}
          </div>

          {filteredPreviewTasks.length > 0 ? (
            <TransposedTimesheetGrid
              tasks={filteredPreviewTasks}
              holidays={holidays}
              selectable
              selectedTimesheetIds={selectedTimesheetIds}
              onSelectionChange={setSelectedTimesheetIds}
              filterStartDate={filterStartDate}
              filterEndDate={filterEndDate}
            />
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
