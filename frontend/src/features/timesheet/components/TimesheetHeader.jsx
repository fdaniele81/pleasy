import React from "react";
import { useTranslation } from 'react-i18next';
import { Download, X } from "lucide-react";
import { getRouteIcon } from "../../../constants/routeIcons";
import Button from "../../../shared/ui/Button";
import {
  SearchInput,
  SelectionFilter,
  FilterDropdown,
  FilterBar,
  PeriodNavigator,
} from "../../../shared/ui/filters";

function TimesheetHeader({
  searchTerm,
  onSearchChange,
  selectionFilters,
  onSelectionFiltersChange,
  filterClientIds,
  onFilterClientIdsChange,
  filterProjectIds,
  onFilterProjectIdsChange,
  filterProjectType,
  onFilterProjectTypeChange,
  uniqueClients,
  uniqueProjects,
  onClearAllFilters,
  onExport,
  onSubmit,
  loading,
  onPreviousPeriod,
  onNextPeriod,
  onToday,
  isPreviousDisabled,
  isTodayDisabled,
  periodLabel,
}) {
  const { t } = useTranslation(['timesheet', 'common']);
  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            {getRouteIcon("/timesheet") &&
              React.createElement(getRouteIcon("/timesheet"), { size: 28 })}
            <span>{t('timesheet:title')}</span>
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              title={t('timesheet:exportExcel')}
            >
              <Download size={18} />
              <span>Export</span>
            </button>
            <Button
              onClick={onSubmit}
              disabled={loading}
              color="cyan"
              variant="solid"
              size="md"
            >
              {t('timesheet:submitTimesheets')}
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="mb-3">
          <SearchInput
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('timesheet:searchPlaceholder')}
            size="md"
          />
        </div>

        <FilterBar layout="wrap" gap="md" withBackground={false} withPadding={false}>
          <SelectionFilter
            value={selectionFilters}
            onChange={onSelectionFiltersChange}
            variant="dropdown"
            size="md"
          />

          <FilterDropdown
            options={[
              { value: 'PROJECT', label: t('timesheet:plannedActivities') },
              { value: 'TM', label: t('timesheet:calendarClients') },
            ]}
            selectedValues={filterProjectType}
            onChange={onFilterProjectTypeChange}
            placeholder={t('timesheet:allTypes')}
            selectedLabel={(count) => count === 1 ? (filterProjectType[0] === 'PROJECT' ? t('timesheet:planned') : t('timesheet:calendar')) : t('timesheet:typesCount', { count })}
            title={t('timesheet:activityType')}
            size="md"
            minWidth="120px"
          />

          <FilterDropdown
            options={uniqueClients.map(client => ({
              value: client.client_id,
              label: `${client.client_key} - ${client.client_name}`,
              color: client.client_color,
            }))}
            selectedValues={filterClientIds}
            onChange={onFilterClientIdsChange}
            placeholder={t('timesheet:allClients')}
            selectedLabel={(count) => t('timesheet:clientsCount', { count })}
            title={t('timesheet:selectClients')}
            size="md"
            minWidth="120px"
          />

          <FilterDropdown
            options={uniqueProjects.map(project => ({
              value: project.project_id,
              label: `${project.client_key}-${project.project_key} - ${project.project_title}`,
              color: project.client_color,
            }))}
            selectedValues={filterProjectIds}
            onChange={onFilterProjectIdsChange}
            placeholder={t('timesheet:allProjects')}
            selectedLabel={(count) => t('timesheet:projectsCount', { count })}
            title={t('timesheet:selectProjects')}
            size="md"
            minWidth="120px"
          />

          {(filterClientIds.length > 0 ||
            filterProjectIds.length > 0 ||
            filterProjectType.length > 0 ||
            selectionFilters.length > 0) && (
            <Button
              onClick={onClearAllFilters}
              variant="outline"
              color="red"
              size="sm"
              icon={X}
              iconSize={14}
              title={t('timesheet:clearAllFilters')}
              className="text-xs hover:bg-red-50"
            >
              <span className="hidden xl:inline whitespace-nowrap">{t('timesheet:clearFilters')}</span>
            </Button>
          )}

          <div className="grow" />

          <PeriodNavigator
            onPrevious={onPreviousPeriod}
            onNext={onNextPeriod}
            onToday={onToday}
            isPreviousDisabled={isPreviousDisabled}
            isTodayDisabled={isTodayDisabled}
            label={periodLabel}
            size="sm"
          />
        </FilterBar>
      </div>
    </>
  );
}

export default TimesheetHeader;
