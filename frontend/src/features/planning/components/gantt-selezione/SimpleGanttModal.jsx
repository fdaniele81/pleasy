import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Download, AlertCircle, Eye, EyeOff } from 'lucide-react';
import BaseModal from '../../../../shared/components/BaseModal';
import SimpleGanttChart from './SimpleGanttChart';
import { exportSvgToPng } from '../../../../utils/export/svgToPngExport';
import logger from '../../../../utils/logger';

const SimpleGanttModal = ({ isOpen, onClose, selectedTasks, projects }) => {
  const { t } = useTranslation('planning');
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1400);
  const [showProjectHeaders, setShowProjectHeaders] = useState(true);
  const [colorByStatus, setColorByStatus] = useState(true);
  const [showMilestones, setShowMilestones] = useState(true);
  const [showGridLines, setShowGridLines] = useState(true);
  const [showTodayLine, setShowTodayLine] = useState(true);
  const [todayOffset, setTodayOffset] = useState(0);
  const [milestonesVisibility, setMilestonesVisibility] = useState({});
  const [anonymizeMode, setAnonymizeMode] = useState(false);
  const [showSuspendedArea, setShowSuspendedArea] = useState(false);
  const [suspendedArea, setSuspendedArea] = useState(null);
  const [suspendedAreaLabel, setSuspendedAreaLabel] = useState('');

  const { groupedTasks, dateRange, warnings } = useMemo(
    () => prepareGanttData(selectedTasks, projects),
    [selectedTasks, projects]
  );

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const width = containerRef.current.clientWidth;
      setContainerWidth(width);
    }
  }, [isOpen, groupedTasks]);

  useEffect(() => {
    if (groupedTasks.length > 0) {
      const initialVisibility = {};
      groupedTasks.forEach(project => {
        project.tasks.forEach(task => {
          initialVisibility[task.task_id] = {
            showMarker: true,
            showLabel: true
          };
        });
      });
      setMilestonesVisibility(initialVisibility);
    }
  }, [groupedTasks]);

  const hideMilestone = (taskId) => {
    setMilestonesVisibility(prev => ({
      ...prev,
      [taskId]: { showMarker: false, showLabel: false }
    }));
  };

  const hideMilestoneLabel = (taskId) => {
    setMilestonesVisibility(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], showLabel: false }
    }));
  };

  const showMilestoneLabel = (taskId) => {
    setMilestonesVisibility(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], showLabel: true }
    }));
  };

  const showMilestone = (taskId) => {
    setMilestonesVisibility(prev => ({
      ...prev,
      [taskId]: { showMarker: true, showLabel: true }
    }));
  };

  const handleExportPng = async () => {
    if (!svgRef.current) {
      logger.error('SVG ref non disponibile');
      return;
    }

    setIsExporting(true);
    try {
      const filename = `gantt-selezione-${Date.now()}.png`;
      await exportSvgToPng(svgRef.current, filename);
    } catch (error) {
      logger.error('Errore durante export PNG:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleSuspendedArea = () => {
    const newShowState = !showSuspendedArea;
    setShowSuspendedArea(newShowState);

    if (newShowState) {
      setSuspendedAreaLabel(t('printGanttSuspendedLabel'));

      if (!suspendedArea && dateRange) {
        const minDate = new Date(dateRange.minDate);
        const maxDate = new Date(dateRange.maxDate);

        const totalDuration = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24));
        const centerDays = Math.floor(totalDuration / 2);

        const centerDate = new Date(minDate);
        centerDate.setDate(centerDate.getDate() + centerDays);

        const startDate = new Date(centerDate);
        startDate.setDate(startDate.getDate() - 3);

        const endDate = new Date(centerDate);
        endDate.setDate(endDate.getDate() + 3);

        setSuspendedArea({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });
      }
    }
  };

  if (!isOpen) return null;

  if (groupedTasks.length === 0) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('printGanttTitle')}
        icon={<BarChart3 className="text-cyan-600" size={24} />}
        size="md"
        showFooter={false}
      >
        <div className="text-center py-12 px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 from-amber-100 to-orange-100 rounded-full mb-6">
            <AlertCircle size={40} className="text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('printGanttNoTaskSelected')}
          </h3>
          <p className="text-gray-600 mb-1">
            {t('printGanttNoTaskMsg1')}
          </p>
          <p className="text-sm text-gray-500 mb-8">
            {t('printGanttNoTaskMsg2')}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-white from-cyan-700 to-cyan-800 rounded-lg hover:from-cyan-800 hover:to-cyan-900 shadow-md hover:shadow-lg transition-all duration-200"
          >
            {t('ganttClose')}
          </button>
        </div>
      </BaseModal>
    );
  }

  const totalTasks = groupedTasks.reduce((sum, p) => sum + p.tasks.length, 0);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span>{t('printGanttTitle')}</span>
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-cyan-800 bg-cyan-100 rounded-full">
            {totalTasks} {totalTasks === 1 ? t('printGanttTask') : t('printGanttTasks')}
          </span>
        </div>
      }
      icon={<BarChart3 className="text-cyan-600" size={24} />}
      size="3xl"
      customFooter={
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {warnings.map((w, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={16} className="text-amber-600" />
                  <span className="text-sm text-amber-800 font-medium">{t('printGanttExcludedTasks', { count: w.count })}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 ml-4">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
              >
                {t('ganttClose')}
              </button>
              <button
                onClick={handleExportPng}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-cyan-700 rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Download size={18} />
                {isExporting ? t('printGanttExporting') : t('printGanttExportPng')}
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4 py-3 from-gray-50 to-gray-100 rounded-lg border border-gray-200 flex-wrap">
          <button
            onClick={() => setShowProjectHeaders(!showProjectHeaders)}
            className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors border justify-center ${
              !showProjectHeaders
                ? 'bg-cyan-700 text-white border-cyan-700 hover:bg-cyan-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title={!showProjectHeaders ? t('printGanttShowProjectHeaders') : t('printGanttHideProjectHeaders')}
          >
            {!showProjectHeaders ? (
              <EyeOff size={14} className="shrink-0" />
            ) : (
              <Eye size={14} className="shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {t('printGanttProjectClient')}
            </span>
          </button>

          <button
            onClick={() => setColorByStatus(!colorByStatus)}
            className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors border justify-center ${
              !colorByStatus
                ? 'bg-cyan-700 text-white border-cyan-700 hover:bg-cyan-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title={!colorByStatus ? t('printGanttShowStatusColors') : t('printGanttHideStatusColors')}
          >
            {!colorByStatus ? (
              <EyeOff size={14} className="shrink-0" />
            ) : (
              <Eye size={14} className="shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {t('printGanttStatusColors')}
            </span>
          </button>

          {!anonymizeMode && (
            <button
              onClick={() => setShowMilestones(!showMilestones)}
              className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors border justify-center ${
                !showMilestones
                  ? 'bg-cyan-700 text-white border-cyan-700 hover:bg-cyan-800'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title={!showMilestones ? t('printGanttShowMilestones') : t('printGanttHideMilestones')}
            >
              {!showMilestones ? (
                <EyeOff size={14} className="shrink-0" />
              ) : (
                <Eye size={14} className="shrink-0" />
              )}
              <span className="whitespace-nowrap">
                Milestone
              </span>
            </button>
          )}

          <button
            onClick={() => setShowGridLines(!showGridLines)}
            className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors border justify-center ${
              !showGridLines
                ? 'bg-cyan-700 text-white border-cyan-700 hover:bg-cyan-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title={!showGridLines ? t('printGanttShowGridLines') : t('printGanttHideGridLines')}
          >
            {!showGridLines ? (
              <EyeOff size={14} className="shrink-0" />
            ) : (
              <Eye size={14} className="shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {t('printGanttGridLines')}
            </span>
          </button>

          {!anonymizeMode && (
            <button
              onClick={() => setShowTodayLine(!showTodayLine)}
              className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors border justify-center ${
                !showTodayLine
                  ? 'bg-cyan-700 text-white border-cyan-700 hover:bg-cyan-800'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title={!showTodayLine ? t('printGanttShowTodayLine') : t('printGanttHideTodayLine')}
            >
              {!showTodayLine ? (
                <EyeOff size={14} className="shrink-0" />
              ) : (
                <Eye size={14} className="shrink-0" />
              )}
              <span className="whitespace-nowrap">
                {t('printGanttTodayLine')}
              </span>
            </button>
          )}

          <button
            onClick={() => setAnonymizeMode(!anonymizeMode)}
            className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors border justify-center ${
              anonymizeMode
                ? 'bg-cyan-700 text-white border-cyan-700 hover:bg-cyan-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title={anonymizeMode ? t('printGanttShowRealDates') : t('printGanttAnonymizePeriods')}
          >
            {anonymizeMode ? (
              <EyeOff size={14} className="shrink-0" />
            ) : (
              <Eye size={14} className="shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {anonymizeMode ? t('printGanttDatesHidden') : t('printGanttHideDates')}
            </span>
          </button>

          <button
            onClick={handleToggleSuspendedArea}
            className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded transition-colors border justify-center ${
              showSuspendedArea
                ? 'bg-cyan-700 text-white border-cyan-700 hover:bg-cyan-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title={showSuspendedArea ? t('printGanttHideSuspendedArea') : t('printGanttShowSuspendedArea')}
          >
            {showSuspendedArea ? (
              <Eye size={14} className="shrink-0" />
            ) : (
              <EyeOff size={14} className="shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {t('printGanttSuspendedArea')}
            </span>
          </button>
        </div>

        <div
          ref={containerRef}
          className="overflow-y-auto max-h-[70vh] border-2 border-gray-300 rounded-xl shadow-inner bg-white"
        >
          <SimpleGanttChart
            groupedTasks={groupedTasks}
            dateRange={dateRange}
            svgRef={svgRef}
            containerWidth={containerWidth}
            showProjectHeaders={showProjectHeaders}
            colorByStatus={colorByStatus}
            showMilestones={!anonymizeMode && showMilestones}
            showGridLines={showGridLines}
            showTodayLine={!anonymizeMode && showTodayLine}
            todayOffset={todayOffset}
            onTodayOffsetChange={setTodayOffset}
            milestonesVisibility={milestonesVisibility}
            onHideMilestone={hideMilestone}
            onHideMilestoneLabel={hideMilestoneLabel}
            onShowMilestoneLabel={showMilestoneLabel}
            onShowMilestone={showMilestone}
            anonymizeMode={anonymizeMode}
            showSuspendedArea={showSuspendedArea}
            suspendedArea={suspendedArea}
            onSuspendedAreaChange={setSuspendedArea}
            suspendedAreaLabel={suspendedAreaLabel}
            onSuspendedAreaLabelChange={setSuspendedAreaLabel}
          />
        </div>
      </div>
    </BaseModal>
  );
};

function prepareGanttData(selectedTasks, projects) {
  const selectedTaskIds = Object.keys(selectedTasks || {})
    .filter(key => selectedTasks[key] && !key.startsWith('project_'));

  if (selectedTaskIds.length === 0) {
    return { groupedTasks: [], dateRange: null, warnings: [] };
  }

  const taskMap = new Map();
  projects.forEach(project => {
    project.tasks.forEach(task => {
      if (selectedTaskIds.some(id => id == task.task_id)) {
        taskMap.set(task.task_id, { ...task, project });
      }
    });
  });

  const validTasks = [];
  const invalidTasks = [];

  taskMap.forEach(taskWithProject => {
    const { start_date, end_date } = taskWithProject;

    if (start_date && end_date && isValidDate(start_date) && isValidDate(end_date)) {
      const startD = new Date(start_date);
      const endD = new Date(end_date);

      if (endD >= startD) {
        validTasks.push(taskWithProject);
      } else {
        invalidTasks.push(taskWithProject);
      }
    } else {
      invalidTasks.push(taskWithProject);
    }
  });

  const projectsMap = new Map();

  validTasks.forEach(taskWithProject => {
    const { project, ...task } = taskWithProject;
    const key = project.project_id;

    if (!projectsMap.has(key)) {
      projectsMap.set(key, {
        project_id: project.project_id,
        project_key: project.project_key,
        project_title: project.title,
        client_name: project.client_name,
        client_key: project.client_key,
        client_color: project.client_color,
        tasks: []
      });
    }

    projectsMap.get(key).tasks.push(task);
  });

  const groupedTasks = Array.from(projectsMap.values()).sort((a, b) => {
    const clientCompare = (a.client_name || '').localeCompare(b.client_name || '');
    if (clientCompare !== 0) return clientCompare;
    return (a.project_key || '').localeCompare(b.project_key || '');
  });

  groupedTasks.forEach(project => {
    project.tasks.sort((a, b) => {
      const startA = new Date(a.start_date);
      const startB = new Date(b.start_date);

      if (startA.getTime() !== startB.getTime()) {
        return startA - startB;
      }

      const endA = new Date(a.end_date);
      const endB = new Date(b.end_date);
      if (endA.getTime() !== endB.getTime()) {
        return endA - endB;
      }

      return a.task_id - b.task_id;
    });
  });

  let dateRange = null;
  if (validTasks.length > 0) {
    const allDates = validTasks.flatMap(t => [
      new Date(t.start_date),
      new Date(t.end_date)
    ]);

    dateRange = {
      minDate: new Date(Math.min(...allDates)),
      maxDate: new Date(Math.max(...allDates))
    };
  }

  const warnings = [];
  if (invalidTasks.length > 0) {
    warnings.push({
      type: 'warning',
      count: invalidTasks.length
    });
  }

  return { groupedTasks, dateRange, warnings };
}

function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export default SimpleGanttModal;
