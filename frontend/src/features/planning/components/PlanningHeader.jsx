import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, ChartGantt, Gauge } from 'lucide-react';
import { getRouteIcon } from '../../../constants/routeIcons';
import Button from '../../../shared/ui/Button';
import { ROUTES } from '../../../constants/routes';

export function PlanningHeader({
  onExport,
  onShowGlobalGantt,
  onShowSelectionGantt,
  selectionFilters,
  hasSelectedTasks
}) {
  const { t } = useTranslation(['planning', 'common']);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          {getRouteIcon(ROUTES.PLANNING) && React.createElement(getRouteIcon(ROUTES.PLANNING), { size: 28 })}          
          <span>{t('planning:title')}</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={onExport}
            color="green"
            icon={Download}
            iconSize={18}
            size="md"
            title={
              selectionFilters.includes('selected')
                ? t('planning:exportSelectedOnly')
                : t('planning:exportAll')
            }
          >
            Export
          </Button>
          <Button
            onClick={onShowSelectionGantt}
            disabled={!hasSelectedTasks}
            color="cyan"
            icon={ChartGantt}
            iconSize={18}
            size="md"
            title={
              hasSelectedTasks
                ? t('planning:viewGantt')
                : t('planning:selectTaskForGantt')
            }
          >
            {t('planning:printableGantt')}
          </Button>
          <Button
            onClick={onShowGlobalGantt}
            color="cyan"
            icon={Gauge}
            iconSize={18}
            size="md"
          >
            {t('planning:planning')}
          </Button>
        </div>
      </div>
    </div>
  );
}
