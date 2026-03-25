import { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getRouteIcon } from '../../../../constants/routeIcons';
import { ROUTES } from '../../../../constants/routes';
import { statusOptions, getStatusLabels, getGrandTotals, formatHours, getUnitLabel } from '../../utils/helpers';
import { MobileProjectSection } from './MobileProjectSection';
import { MobileSelectionBar } from './MobileSelectionBar';
import React from 'react';

export const MobilePlanningView = memo(function MobilePlanningView({
  // Data
  filteredProjects,
  projects,
  loading,
  // Selection
  selectedTasks,
  toggleTaskSelection,
  toggleProjectSelection,
  setSelectedTasks,
  // Expansion
  expandedProjects,
  toggleProjectExpansion,
  toggleAllProjects,
  // Filters
  searchTerm,
  setSearchTerm,
  filterUserIds,
  setFilterUserIds,
  filterStatuses,
  setFilterStatuses,
  filterClientIds,
  setFilterClientIds,
  allUsers,
  allClients,
  totalTaskCount,
  filteredTaskCount,
  // Display
  showInDays,
  setShowInDays,
  // Task actions
  handleStartAddingTask,
  handleTaskDetailsClick,
  // Merge/Split/Clone
  onStartMerge,
  onStartSplit,
  onCloneTasks,
  // Delete
  handleDeleteTask,
  confirmFn,
  // Reorder
  reorderingProjectId,
  localTaskOrder,
  onStartReordering,
  onSaveReordering,
  onCancelReordering,
  onDragStart,
  onDragOver,
  onDragEnd,
}) {
  const { t } = useTranslation(['planning', 'common']);
  const statusLabels = getStatusLabels(t);
  const [showFilters, setShowFilters] = useState(false);

  const totals = useMemo(() => getGrandTotals(filteredProjects), [filteredProjects]);
  const unit = getUnitLabel(showInDays);

  const hasActiveFilters = filterUserIds.length > 0 || filterStatuses.length > 0 || filterClientIds.length > 0;

  const clearAllFilters = useCallback(() => {
    setFilterUserIds([]);
    setFilterStatuses([]);
    setFilterClientIds([]);
    setSearchTerm('');
  }, [setFilterUserIds, setFilterStatuses, setFilterClientIds, setSearchTerm]);

  const handleClearSelection = useCallback(() => {
    setSelectedTasks({});
  }, [setSelectedTasks]);

  const hasSelectedTasks = useMemo(() => {
    return Object.keys(selectedTasks).some(k => selectedTasks[k] && !k.startsWith('project_'));
  }, [selectedTasks]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold flex items-center gap-2 text-gray-800">
              {getRouteIcon(ROUTES.PLANNING) && React.createElement(getRouteIcon(ROUTES.PLANNING), { size: 18 })}
              {t('planning:title')}
            </h1>
            <div className="flex items-center gap-2">
              {/* Unit toggle */}
              <button
                onClick={() => setShowInDays(!showInDays)}
                className={`px-2 py-1 rounded text-xs font-medium border ${
                  showInDays ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {showInDays ? t('planning:days') : t('planning:hours')}
              </button>
              {/* Expand/Collapse all */}
              <button
                onClick={toggleAllProjects}
                className="p-1.5 rounded-lg text-gray-400 active:bg-gray-100"
              >
                {filteredProjects.every(p => expandedProjects[p.project_id])
                  ? <ChevronUp size={18} />
                  : <ChevronDown size={18} />}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-1.5">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('planning:searchPlaceholder')}
              className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                hasActiveFilters
                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : 'text-gray-500 active:bg-gray-100'
              }`}
            >
              <Filter size={13} />
              {t('planning:filterLabel')}
              {hasActiveFilters && (
                <span className="bg-cyan-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {filterUserIds.length + filterStatuses.length + filterClientIds.length}
                </span>
              )}
            </button>
            <span className="text-[11px] text-gray-400">
              {filteredTaskCount !== totalTaskCount
                ? `${filteredTaskCount}/${totalTaskCount}`
                : totalTaskCount
              } {t('planning:activities')}
            </span>
          </div>
        </div>

        {/* Expandable filters panel */}
        {showFilters && (
          <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50 space-y-2 pt-2">
            {/* Status filter */}
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1 block">{t('planning:status')}</label>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map(status => {
                  const isActive = filterStatuses.includes(status);
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        if (isActive) {
                          setFilterStatuses(filterStatuses.filter(s => s !== status));
                        } else {
                          setFilterStatuses([...filterStatuses, status]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        isActive
                          ? status === 'NEW' ? 'bg-gray-700 text-white border-gray-700'
                            : status === 'IN PROGRESS' ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-200 active:bg-gray-100'
                      }`}
                    >
                      {statusLabels[status]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User filter */}
            {allUsers.length > 0 && (
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">{t('planning:user')}</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {allUsers.map(user => {
                    const isActive = filterUserIds.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          if (isActive) {
                            setFilterUserIds(filterUserIds.filter(id => id !== user.id));
                          } else {
                            setFilterUserIds([...filterUserIds, user.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isActive
                            ? 'bg-cyan-600 text-white border-cyan-600'
                            : 'bg-white text-gray-600 border-gray-200 active:bg-gray-100'
                        }`}
                      >
                        {user.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Client filter */}
            {allClients.length > 0 && (
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">{t('planning:client')}</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {allClients.map(client => {
                    const isActive = filterClientIds.includes(client.client_id);
                    return (
                      <button
                        key={client.client_id}
                        onClick={() => {
                          if (isActive) {
                            setFilterClientIds(filterClientIds.filter(id => id !== client.client_id));
                          } else {
                            setFilterClientIds([...filterClientIds, client.client_id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isActive
                            ? 'bg-cyan-600 text-white border-cyan-600'
                            : 'bg-white text-gray-600 border-gray-200 active:bg-gray-100'
                        }`}
                      >
                        {client.client_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs text-red-500 font-medium active:opacity-70"
              >
                <X size={12} />
                {t('planning:clearFilters')}
              </button>
            )}
          </div>
        )}

        {/* Summary bar */}
        <div className="px-4 py-2 bg-amber-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span>B: <strong className="text-gray-700">{formatHours(totals.budget, showInDays)}{unit}</strong></span>
            <span>A: <strong className="text-gray-700">{formatHours(totals.actual, showInDays)}{unit}</strong></span>
            <span>ETC: <strong className="text-amber-600">{formatHours(totals.etc, showInDays)}{unit}</strong></span>
          </div>
          <span className={`font-semibold ${
            totals.delta > 0 ? 'text-green-600' : totals.delta < 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            &Delta; {totals.delta > 0 ? '+' : ''}{formatHours(totals.delta, showInDays)}{unit}
          </span>
        </div>
      </div>

      {/* Projects list */}
      <div className="px-3 pt-3">
        {loading && filteredProjects.length === 0 ? (
          <div className="text-center py-8 text-gray-400">{t('planning:loadingPlanning')}</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8 text-gray-400">{t('planning:noResults')}</div>
        ) : (
          filteredProjects.map(project => (
            <MobileProjectSection
              key={project.project_id}
              project={project}
              isExpanded={!!expandedProjects[project.project_id]}
              onToggleExpansion={toggleProjectExpansion}
              selectedTasks={selectedTasks}
              onToggleProjectSelection={toggleProjectSelection}
              onToggleTaskSelection={toggleTaskSelection}
              onOpenTaskDetails={handleTaskDetailsClick}
              onAddTask={handleStartAddingTask}
              showInDays={showInDays}
              onStartMerge={onStartMerge}
              onStartSplit={onStartSplit}
              onCloneTasks={onCloneTasks}
              onStartReordering={onStartReordering}
              onSaveReordering={onSaveReordering}
              onCancelReordering={onCancelReordering}
              isReordering={reorderingProjectId === project.project_id}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              localTaskOrder={reorderingProjectId === project.project_id ? localTaskOrder : null}
            />
          ))
        )}
      </div>

      {/* Floating selection bar */}
      {hasSelectedTasks && (
        <MobileSelectionBar
          selectedTasks={selectedTasks}
          projects={projects}
          onClearSelection={handleClearSelection}
          onStartMerge={onStartMerge}
          onStartSplit={onStartSplit}
          onCloneTasks={onCloneTasks}
          confirmFn={confirmFn}
        />
      )}
    </div>
  );
});
