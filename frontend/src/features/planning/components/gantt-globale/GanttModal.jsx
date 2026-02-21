import React, { useRef } from 'react';
import { getMonthAbbr } from '../../../../utils/date/dateUtils';
import GanttHeader from './GanttHeader';
import GanttDateHeader from './GanttDateHeader';
import GanttChart from './GanttChart';
import GanttUserRow from './GanttUserRow';
import { useGanttModalData } from './hooks/useGanttModalData';

const GanttModal = ({ isOpen, onClose, projects, filterUserIds = [], refreshTrigger = 0 }) => {
  const panelRef = useRef(null);
  const contentRef = useRef(null);

  const {
    // Translation
    t,

    // Data
    holidays,
    allUsersTimeOffs,
    fteData,

    // UI state
    expandedUsers,
    excludedTasks,
    timeInterval,
    setTimeInterval,
    dateOffset,
    etcReferenceDate,
    setEtcReferenceDate,

    // Tooltip state
    hoveredPeriod,
    tooltipPosition,

    // Panel state
    position,
    isDragging,
    width,
    height,

    // Column layout
    columnWidth,
    columnWidths,
    tableWidth,

    // Navigation
    periodLabel,
    minDateOffset,
    handlePrevious,
    handleNext,
    handleGoToEtcRef,

    // Toggle handlers
    handleToggleUser,
    handleToggleTaskExclusion,

    // Tooltip handlers
    handleTooltipHover,
    handleTooltipLeave,

    // Drag handlers
    handleMouseDown,
    handleTouchStart,
  } = useGanttModalData({ isOpen, projects, filterUserIds, refreshTrigger });

  if (!isOpen || !projects || projects.length === 0) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bg-white rounded-lg shadow-2xl border-2 border-gray-300 flex flex-col z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        ...(height !== null
          ? { height: `${height}px` }
          : { maxHeight: '90vh' }
        ),
        userSelect: isDragging ? 'none' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="gantt-drag-handle cursor-move">
        <GanttHeader
          onClose={onClose}
          timeInterval={timeInterval}
          onTimeIntervalChange={setTimeInterval}
          dateOffset={dateOffset}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onGoToEtcRef={handleGoToEtcRef}
          minDateOffset={minDateOffset}
          periodLabel={periodLabel}
          etcReferenceDate={etcReferenceDate}
          onEtcReferenceDateChange={setEtcReferenceDate}
          t={t}
        />
      </div>

      <div ref={contentRef} className="flex-1 p-3 pr-4 overflow-y-auto overflow-x-hidden min-h-0">
          {fteData.userAllocations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {t('ganttNoTasksWithDates')}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-hidden">
              <table className="border-collapse" style={{ tableLayout: 'fixed', width: `${tableWidth}px` }}>
                <GanttDateHeader
                  periods={fteData.periods}
                  userAllocations={fteData.userAllocations}
                  columnWidth={columnWidth}
                  columnWidths={columnWidths}
                  getMonthAbbr={getMonthAbbr}
                  t={t}
                />

                <GanttChart
                  userAllocations={fteData.userAllocations}
                  columnWidth={columnWidth}
                  columnWidths={columnWidths}
                  expandedUsers={expandedUsers}
                  onToggleUser={handleToggleUser}
                  onTooltipHover={handleTooltipHover}
                  onTooltipLeave={handleTooltipLeave}
                  excludedTasks={excludedTasks}
                  onToggleTaskExclusion={handleToggleTaskExclusion}
                  t={t}
                />
              </table>
            </div>
          )}

          <GanttUserRow
            hoveredPeriod={hoveredPeriod}
            tooltipPosition={tooltipPosition}
            fteData={fteData}
            allUsersTimeOffs={allUsersTimeOffs}
            holidays={holidays}
            t={t}
          />
        </div>

    </div>
  );
};

export default GanttModal;
