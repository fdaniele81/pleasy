import React, { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../shared/ui/Button";
import ContextMenu from "../../shared/ui/ContextMenu";
import {
  ExpandCollapseButton,
  NoteIndicator,
} from "../../shared/ui/table";
import {
  SearchInput,
  PeriodNavigator,
  FilterDropdown,
} from "../../shared/ui/filters";
import { getRouteIcon } from "../../constants/routeIcons";
import { ROUTES } from "../../constants/routes";
import { Gauge, FileText, X, User, Building2, Download } from "lucide-react";
import { useTMPlanningState } from "./hooks/useTMPlanningState";
import { useTMPlanningData } from "./hooks/useTMPlanningData";
import { useTMPlanningActions } from "./hooks/useTMPlanningActions";
import TMPlanningUserGroupRows from "./components/TMPlanningUserGroupRows";
import TMPlanningClientGroupRows from "./components/TMPlanningClientGroupRows";

const GanttModal = lazy(() =>
  import("../planning/components/gantt-globale/GanttModal")
);
const TimesheetDetailsModal = lazy(() =>
  import("../timesheet/components/TimesheetDetailsModal")
);
const ExportModal = lazy(() =>
  import("../../shared/components/modals/ExportModal")
);

function TMPlanning() {
  const { t } = useTranslation(['tmplanning', 'common']);

  const state = useTMPlanningState();
  const {
    isLoading,
    searchTerm, setSearchTerm,
    groupBy, setGroupBy,
    expandedUsers, setExpandedUsers,
    expandedClients, setExpandedClients,
    selectedUserIds, setSelectedUserIds,
    selectedClientIds, setSelectedClientIds,
    showGanttModal, setShowGanttModal,
    ganttRefreshTrigger,
    showExportModal, setShowExportModal,
    contextMenu, setContextMenu,
    showDetailsModal,
    detailsModalData,
    detailsModalDate,
    detailsModalTask,
    detailsModalIsSubmitted,
    hoveredNoteCell,
    noteTooltipPosition,
    tmUsers,
    hoursEditCell,
    dateRange,
    getDateInfo,
    isAtToday,
    projects,
    daysToShow,
    DAYS_LARGE_SCREEN, DAYS_XLARGE_SCREEN,
    locale,
  } = state;

  const dataHelpers = useTMPlanningData({
    tmUsers,
    searchTerm,
    selectedUserIds,
    selectedClientIds,
    expandedUsers, setExpandedUsers,
    expandedClients, setExpandedClients,
    locale,
    startDate: state.startDate,
    endDate: state.endDate,
    daysToShow,
  });

  const {
    userOptions, clientOptions,
    filteredUsers, filteredClients,
    toggleUserExpanded, isAllUsersExpanded, toggleAllUsers,
    toggleClientExpanded, isAllClientsExpanded, toggleAllClients,
    getUserTotal, getUserDayTotal,
    getClientTotal, getClientDayTotal,
    getTimesheetForDate,
    hasActiveFilters,
    getPeriodLabel,
    formatDateHeader,
    allClients,
  } = dataHelpers;

  const actions = useTMPlanningActions({
    ...state,
    filteredUsers, tmUsers, allClients, dateRange, getTimesheetForDate,
    groupBy,
  });

  const {
    goToPreviousPeriod, goToNextPeriod, goToToday,
    clearAllFilters,
    handleCellClick, handleCellContextMenu,
    handleContextMenuInsertNotes,
    handleCellBlur, handleKeyDown,
    handleNoteTooltipHover, handleNoteTooltipLeave,
    handleDetailsModalConfirm, handleDetailsModalClose,
    handleExport,
  } = actions;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center p-6">
          <div className="text-xl">{t('common:loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden overscroll-y-none">
      <div className="py-4">
        <div className="w-full px-2">
          <div className="mt-16"></div>

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold flex items-center gap-3">
                {getRouteIcon(ROUTES.HOLIDAYS) &&
                  React.createElement(getRouteIcon(ROUTES.HOLIDAYS), { size: 28 })}
                <span>{t('tmplanning:title')}</span>
              </h1>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowExportModal(true)} color="green" icon={Download} iconSize={18} size="md">
                  {t('common:export')}
                </Button>
                <Button onClick={() => setShowGanttModal(true)} color="cyan" icon={Gauge} iconSize={18} size="md">
                  {t('tmplanning:planning')}
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="mb-3">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('tmplanning:searchPlaceholder')}
                size="md"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setGroupBy("user")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-sm font-medium transition-colors ${
                    groupBy === "user" ? "bg-cyan-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                  title={t('tmplanning:groupByUserTitle')}
                >
                  <User size={14} />
                  <span className="hidden sm:inline">{t('common:user')}</span>
                </button>
                <button
                  onClick={() => setGroupBy("client")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-sm font-medium transition-colors border-l border-gray-300 ${
                    groupBy === "client" ? "bg-cyan-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                  title={t('tmplanning:groupByClientTitle')}
                >
                  <Building2 size={14} />
                  <span className="hidden sm:inline">{t('common:client')}</span>
                </button>
              </div>

              <FilterDropdown options={userOptions} selectedValues={selectedUserIds} onChange={setSelectedUserIds} placeholder={t('tmplanning:allUsers')} selectedLabel={(count) => t('tmplanning:usersCount', { count })} title={t('tmplanning:selectUsers')} size="sm" minWidth="90px" />
              <FilterDropdown options={clientOptions} selectedValues={selectedClientIds} onChange={setSelectedClientIds} placeholder={t('tmplanning:allClients')} selectedLabel={(count) => t('tmplanning:clientsCount', { count })} title={t('tmplanning:selectClients')} size="sm" minWidth="90px" />

              {hasActiveFilters && (
                <Button onClick={clearAllFilters} variant="outline" color="red" size="sm" icon={X} iconSize={14} title={t('tmplanning:clearAllFiltersTitle')}>
                  <span className="hidden xl:inline whitespace-nowrap">{t('common:clearFilters')}</span>
                </Button>
              )}
              <div className="flex-1" />

              <PeriodNavigator
                onPrevious={goToPreviousPeriod}
                onNext={goToNextPeriod}
                onToday={goToToday}
                isPreviousDisabled={false}
                isTodayDisabled={isAtToday}
                label={getPeriodLabel()}
                subLabel={
                  daysToShow === DAYS_XLARGE_SCREEN
                    ? t('tmplanning:weeksLabel4')
                    : daysToShow === DAYS_LARGE_SCREEN
                    ? t('tmplanning:weeksLabel3')
                    : t('tmplanning:weeksLabel2')
                }
                size="sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-300px)]">
            <table className="border-collapse text-sm w-full table-fixed">
              <colgroup>
                <col className="w-8" />
                <col className="w-[200px] xl:w-72" />
                <col className="w-16" />
                {dateRange.map((_, idx) => (<col key={idx} />))}
              </colgroup>
              <thead className="sticky top-0 z-20 bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-30 px-1 py-2 border-b border-gray-200 bg-cyan-700">
                    <ExpandCollapseButton
                      onClick={groupBy === "user" ? toggleAllUsers : toggleAllClients}
                      isExpanded={groupBy === "user" ? isAllUsersExpanded : isAllClientsExpanded}
                      expandedTitle={t('common:collapseAll')}
                      collapsedTitle={t('common:expandAll')}
                      color="white"
                      size="sm"
                    />
                  </th>
                  <th className="sticky z-30 px-2 py-2 text-left text-base font-semibold text-white border-b border-gray-200 bg-cyan-700 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
                    {groupBy === "user" ? t('tmplanning:userClient') : t('tmplanning:clientUser')}
                  </th>
                  <th className="px-1 py-2 text-center text-sm font-semibold text-white border-b border-r border-gray-200 bg-cyan-800">
                    {t('common:total')}
                  </th>
                  {dateRange.map((date, idx) => {
                    const dateInfo = getDateInfo(date);
                    const { dayMonth, weekday } = formatDateHeader(date);
                    return (
                      <th
                        key={idx}
                        className={`px-0 py-2 text-center border-b border-r border-gray-200 ${
                          dateInfo.isNonWorking ? "bg-gray-600" : dateInfo.isToday ? "bg-violet-600" : "bg-cyan-700"
                        } text-white`}
                        title={dateInfo.holidayName || undefined}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-semibold text-white">{dayMonth}</span>
                          <span className={`text-[10px] ${dateInfo.isNonWorking ? "text-gray-200" : "text-cyan-100"}`}>
                            {weekday}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {groupBy === "user" && (
                  <TMPlanningUserGroupRows
                    filteredUsers={filteredUsers}
                    expandedUsers={expandedUsers}
                    dateRange={dateRange}
                    searchTerm={searchTerm}
                    getDateInfo={getDateInfo}
                    getUserTotal={getUserTotal}
                    getUserDayTotal={getUserDayTotal}
                    toggleUserExpanded={toggleUserExpanded}
                    hoursEditCell={hoursEditCell}
                    onCellClick={handleCellClick}
                    onCellBlur={handleCellBlur}
                    onKeyDown={handleKeyDown}
                    onCellContextMenu={handleCellContextMenu}
                    onNoteTooltipHover={handleNoteTooltipHover}
                    onNoteTooltipLeave={handleNoteTooltipLeave}
                  />
                )}
                {groupBy === "client" && (
                  <TMPlanningClientGroupRows
                    filteredClients={filteredClients}
                    expandedClients={expandedClients}
                    dateRange={dateRange}
                    searchTerm={searchTerm}
                    getDateInfo={getDateInfo}
                    getClientTotal={getClientTotal}
                    getClientDayTotal={getClientDayTotal}
                    toggleClientExpanded={toggleClientExpanded}
                    hoursEditCell={hoursEditCell}
                    onCellClick={handleCellClick}
                    onCellBlur={handleCellBlur}
                    onKeyDown={handleKeyDown}
                    onCellContextMenu={handleCellContextMenu}
                    onNoteTooltipHover={handleNoteTooltipHover}
                    onNoteTooltipLeave={handleNoteTooltipLeave}
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={[{ label: t('tmplanning:insertNotes'), icon: FileText, onClick: handleContextMenuInsertNotes }]}
          onClose={() => setContextMenu(null)}
        />
      )}

      <NoteIndicator.Tooltip
        note={hoveredNoteCell?.details}
        position={noteTooltipPosition}
        visible={!!hoveredNoteCell?.details}
      />

      <Suspense fallback={null}>
        <TimesheetDetailsModal
          isOpen={showDetailsModal}
          onClose={handleDetailsModalClose}
          onConfirm={handleDetailsModalConfirm}
          timesheetData={detailsModalData}
          date={detailsModalDate}
          taskTitle={detailsModalTask?.client_name}
          isSubmitted={detailsModalIsSubmitted}
          showExternalKey={true}
          defaultExternalKey={detailsModalTask?.project_key}
        />
      </Suspense>

      <Suspense fallback={null}>
        <GanttModal
          isOpen={showGanttModal}
          onClose={() => setShowGanttModal(false)}
          projects={projects}
          filterUserIds={selectedUserIds}
          refreshTrigger={ganttRefreshTrigger}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          title={t('tmplanning:exportTitle')}
        />
      </Suspense>
    </div>
  );
}

export default TMPlanning;
