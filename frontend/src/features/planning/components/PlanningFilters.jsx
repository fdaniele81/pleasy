import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, X, Eye, EyeOff } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import DateInput from '../../../shared/ui/DateInput';
import {
  SearchInput,
  FilterDropdown,
  SelectionFilter,
  useDropdownManager,
} from '../../../shared/ui/filters';

const statusOptions = ['NEW', 'IN PROGRESS', 'DONE'];

function PlanningFilters({
  searchTerm,
  setSearchTerm,
  filterUserIds,
  setFilterUserIds,
  filterStatuses,
  setFilterStatuses,
  filterClientIds,
  setFilterClientIds,
  filterProjectIds,
  setFilterProjectIds,
  selectionFilters,
  setSelectionFilters,
  etcFilters,
  setEtcFilters,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  dateFilterMode,
  setDateFilterMode,
  hideProjectHeaders,
  setHideProjectHeaders,
  showInDays,
  setShowInDays,
  allUsers,
  allClients,
  allProjects,
}) {
  const { t } = useTranslation(['planning', 'common']);
  const { toggleDropdown, isDropdownOpen, getDropdownRef } = useDropdownManager();

  const statusLabels = {
    'NEW': t('planning:statusNew'),
    'IN PROGRESS': t('planning:statusInProgress'),
    'DONE': t('planning:statusDone')
  };

  const clearAllFilters = useCallback(() => {
    setFilterUserIds([]);
    setFilterStatuses([]);
    setFilterClientIds([]);
    setFilterProjectIds([]);
    setSelectionFilters([]);
    setEtcFilters([]);
    setFilterStartDate('');
    setFilterEndDate('');
    setDateFilterMode('intersect');
  }, [setFilterUserIds, setFilterStatuses, setFilterClientIds, setFilterProjectIds, setSelectionFilters, setEtcFilters, setFilterStartDate, setFilterEndDate, setDateFilterMode]);

  return (
    <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="mb-3">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('planning:searchPlaceholder')}
          size="md"
          accentColor="cyan"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <FilterDropdown
          options={allUsers.map(user => ({
            value: user.id,
            label: user.name,
          }))}
          selectedValues={filterUserIds}
          onChange={setFilterUserIds}
          placeholder={t('planning:allUsers')}
          selectedLabel={(count) => t('planning:usersCount', { count })}
          title={t('planning:selectUsers')}
          emptyMessage={t('planning:noUsersAvailable')}
          size="md"
          minWidth="90px"
          accentColor="cyan"
        />

        <FilterDropdown
          options={statusOptions.map(status => ({
            value: status,
            label: statusLabels[status] || status,
          }))}
          selectedValues={filterStatuses}
          onChange={setFilterStatuses}
          placeholder={t('planning:allStatuses')}
          selectedLabel={(count) => t('planning:statusesCount', { count })}
          title={t('planning:selectStatuses')}
          size="md"
          minWidth="90px"
          accentColor="cyan"
        />

        <FilterDropdown
          options={[
            { value: 'zero', label: t('planning:etcZero') },
            { value: 'nonzero', label: t('planning:etcPositive') },
          ]}
          selectedValues={etcFilters}
          onChange={setEtcFilters}
          placeholder={t('planning:allEtc')}
          selectedLabel={() =>
            etcFilters.includes('zero') && etcFilters.includes('nonzero')
              ? t('planning:allEtc')
              : etcFilters.includes('zero')
              ? t('planning:etcZero')
              : t('planning:etcPositive')
          }
          title={t('planning:filterEtc')}
          size="md"
          minWidth="75px"
          accentColor="cyan"
        />

        <SelectionFilter
          value={selectionFilters}
          onChange={setSelectionFilters}
          variant="dropdown"
          size="md"
          accentColor="cyan"
        />

        <FilterDropdown
          options={allClients.map(client => ({
            value: client.client_id,
            label: `${client.client_key} - ${client.client_name}`,
            color: client.client_color,
          }))}
          selectedValues={filterClientIds}
          onChange={setFilterClientIds}
          placeholder={t('planning:allClients')}
          selectedLabel={(count) => t('planning:clientsCount', { count })}
          title={t('planning:selectClients')}
          emptyMessage={t('planning:noClientsAvailable')}
          size="md"
          minWidth="90px"
          accentColor="cyan"
        />

        {filterProjectIds.length > 0 && (
          <div className="relative">
            <button
              onClick={() => toggleDropdown('projects-dropdown')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-cyan-300 rounded bg-cyan-50 hover:bg-cyan-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 min-w-[90px] lg:min-w-[100px] xl:min-w-[130px] justify-between text-cyan-700"
            >
              <span className="truncate">
                {filterProjectIds.length === 1
                  ? allProjects.find(p => p.project_id === filterProjectIds[0])?.project_key || '1 progetto'
                  : t('planning:projectCount', { count: filterProjectIds.length })}
              </span>
              <X
                size={14}
                className="shrink-0 hover:text-cyan-900"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterProjectIds([]);
                }}
              />
            </button>

            <div
              ref={getDropdownRef('projects-dropdown')}
              className={`${isDropdownOpen('projects-dropdown') ? '' : 'hidden'} absolute top-full left-0 mt-1 w-72 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">{t('planning:projectFiltered')}</span>
                <button
                  onClick={() => setFilterProjectIds([])}
                  className="text-xs text-cyan-600 hover:text-cyan-800 font-medium"
                >
                  {t('planning:removeFilter')}
                </button>
              </div>

              <div className="py-1">
                {allProjects
                  .filter(project => filterProjectIds.includes(project.project_id))
                  .map(project => (
                    <div
                      key={project.project_id}
                      className="flex items-center gap-2 px-3 py-2 bg-cyan-50"
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300 shrink-0"
                        style={{ backgroundColor: project.client_color || '#6B7280' }}
                      />
                      <span className="text-xs text-gray-700 flex-1 truncate">
                        <span className="font-semibold">{project.project_key}</span> - {project.title}
                      </span>
                      <button
                        onClick={() => setFilterProjectIds([])}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => toggleDropdown('dates-dropdown')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 lg:min-w-[85px] xl:min-w-[95px] justify-between"
          >
            <span className="truncate">
              {!filterStartDate && !filterEndDate
                ? t('planning:allDates')
                : filterStartDate && filterEndDate
                ? t('planning:period')
                : filterStartDate
                ? t('planning:fromDate')
                : t('planning:toDate')}
            </span>
            <ChevronDown size={14} className="shrink-0" />
          </button>

          <div
            ref={getDropdownRef('dates-dropdown')}
            className={`${isDropdownOpen('dates-dropdown') ? '' : 'hidden'} absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50`}
            onClick={(e) => e.stopPropagation()}
          >
              <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">{t('planning:filterByDate')}</span>
                {(filterStartDate || filterEndDate) && (
                  <button
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-medium"
                  >
                    {t('common:clearAll')}
                  </button>
                )}
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('planning:startDateLabel')}
                  </label>
                  <DateInput
                    value={filterStartDate}
                    onChange={(val) => setFilterStartDate(val)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('planning:endDateLabel')}
                  </label>
                  <DateInput
                    value={filterEndDate}
                    onChange={(val) => setFilterEndDate(val)}
                    className="w-full"
                  />
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    {t('planning:filterMode')}
                  </label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dateFilterMode"
                        value="intersect"
                        checked={dateFilterMode === 'intersect'}
                        onChange={(e) => setDateFilterMode(e.target.value)}
                        className="w-3.5 h-3.5 text-cyan-600 border-gray-300 focus:ring-cyan-500"
                      />
                      <span className="text-xs text-gray-700">{t('planning:activitiesInPeriod')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dateFilterMode"
                        value="contained"
                        checked={dateFilterMode === 'contained'}
                        onChange={(e) => setDateFilterMode(e.target.value)}
                        className="w-3.5 h-3.5 text-cyan-600 border-gray-300 focus:ring-cyan-500"
                      />
                      <span className="text-xs text-gray-700">{t('planning:startAndEndInPeriod')}</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-tight">
                    {dateFilterMode === 'intersect'
                      ? t('planning:includeOverlapping')
                      : t('planning:includeStrictly')}
                  </p>
                </div>
              </div>
            </div>
          </div>

        <div className="relative">
          <button
            onClick={() => toggleDropdown('unit-dropdown')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 min-w-[65px] justify-between"
          >
            <span className="truncate">{showInDays ? t('planning:unitDays') : t('planning:unitHours')}</span>
            <ChevronDown size={14} className="shrink-0" />
          </button>

          <div
            ref={getDropdownRef('unit-dropdown')}
            className={`${isDropdownOpen('unit-dropdown') ? '' : 'hidden'} absolute top-full left-0 mt-1 w-32 bg-white border border-gray-300 rounded-lg shadow-lg z-50`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              <button
                onClick={() => {
                  setShowInDays(false);
                  toggleDropdown('unit-dropdown');
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                  !showInDays ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-gray-700'
                }`}
              >
                {t('planning:unitHours')}
              </button>
              <button
                onClick={() => {
                  setShowInDays(true);
                  toggleDropdown('unit-dropdown');
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                  showInDays ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-gray-700'
                }`}
              >
                {t('planning:unitDays')}
              </button>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setHideProjectHeaders(!hideProjectHeaders)}
          color={hideProjectHeaders ? "cyan" : "gray"}
          variant={hideProjectHeaders ? "solid" : "outline"}
          size="sm"
          icon={hideProjectHeaders ? EyeOff : Eye}
          iconSize={14}
          title={hideProjectHeaders ? t('planning:showHeadersTitle') : t('planning:hideHeadersTitle')}
          className="text-xs"
        >
          <span className="hidden xl:inline whitespace-nowrap">
            {hideProjectHeaders ? t('planning:headersHidden') : t('planning:hideHeaders')}
          </span>
        </Button>

        {(filterUserIds.length > 0 || filterStatuses.length > 0 || filterClientIds.length > 0 || filterProjectIds.length > 0 ||
          selectionFilters.length > 0 || etcFilters.length > 0 || filterStartDate || filterEndDate) && (
          <Button
            onClick={clearAllFilters}
            variant="outline"
            color="red"
            size="sm"
            icon={X}
            iconSize={14}
            title={t('planning:clearAllFiltersTitle')}
            className="text-xs hover:bg-red-50"
          >
            <span className="hidden xl:inline whitespace-nowrap">{t('common:clearFilters')}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

const MemoizedPlanningFilters = memo(PlanningFilters);
export { MemoizedPlanningFilters as PlanningFilters };
