import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import {
  SearchInput,
  SelectionFilter,
  PeriodNavigator,
} from '../../../shared/ui/filters';
import { getRouteIcon } from '../../../constants/routeIcons';

const TimeOffPlanHeader = ({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  selectionFilters,
  onSelectionFiltersChange,
  onExportClick,
  onPrevious,
  onNext,
  onToday,
  isTodayDisabled,
  periodLabel,
}) => {
  const { t } = useTranslation(['timeoffplan', 'common']);
  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            {getRouteIcon('/timeoff-plan') && React.createElement(getRouteIcon('/timeoff-plan'), { size: 28 })}
            <span>{t('timeoffplan:title')}</span>
          </h1>
          <Button
            onClick={onExportClick}
            color="green"
            icon={Download}
            iconSize={18}
            size="md"
          >
            {t('common:export')}
          </Button>
        </div>
      </div>

      <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="mb-3">
          <SearchInput
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('timeoffplan:searchPlaceholder')}
            size="md"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => onViewModeChange('daily')}
              className={`flex items-center gap-1 px-2.5 py-1 text-sm font-medium transition-colors ${
                viewMode === 'daily'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('timeoffplan:daily')}
            </button>
            <button
              onClick={() => onViewModeChange('weekly')}
              className={`flex items-center gap-1 px-2.5 py-1 text-sm font-medium transition-colors border-l border-gray-300 ${
                viewMode === 'weekly'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('timeoffplan:weekly')}
            </button>
          </div>

          <SelectionFilter
            value={selectionFilters}
            onChange={onSelectionFiltersChange}
            variant="dropdown"
            size="md"
            accentColor="cyan"
          />

          <div className="flex-1" />

          <PeriodNavigator
            onPrevious={onPrevious}
            onNext={onNext}
            onToday={onToday}
            isTodayDisabled={isTodayDisabled}
            label={periodLabel}
            size="sm"
          />
        </div>
      </div>
    </>
  );
};

export default TimeOffPlanHeader;
