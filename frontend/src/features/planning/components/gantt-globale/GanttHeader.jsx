import React from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, RefreshCw, GripHorizontal } from 'lucide-react';

const GanttHeader = ({
  onClose,
  timeInterval,
  onTimeIntervalChange,
  dateOffset,
  onPrevious,
  onNext,
  onGoToEtcRef,
  minDateOffset = 0,
  periodLabel = '',
  etcReferenceDate,
  onEtcReferenceDateChange,
  onRefresh,
  t
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-white rounded-t-xl">
      <div className="flex items-center gap-2 text-gray-400">
        <GripHorizontal size={14} />
        <span className="text-xs font-medium">{t('ganttGlobal')}</span>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={timeInterval}
          onChange={(e) => onTimeIntervalChange(parseInt(e.target.value))}
          className="border border-gray-200 rounded-md px-2 py-0.5 text-xs font-medium text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="2">{t('ganttInterval2w')}</option>
          <option value="3">{t('ganttInterval3w')}</option>
          <option value="4">{t('ganttInterval4w')}</option>
          <option value="12">{t('ganttInterval3m')}</option>
          <option value="24">{t('ganttInterval6m')}</option>
          <option value="48">{t('ganttInterval1y')}</option>
        </select>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onPrevious}
            disabled={dateOffset <= minDateOffset}
            className={`p-1 rounded-md transition-colors ${
              dateOffset <= minDateOffset
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={t('ganttPreviousPeriod')}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={onGoToEtcRef}
            disabled={dateOffset === minDateOffset}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
              dateOffset === minDateOffset
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-cyan-700 hover:bg-cyan-50'
            }`}
            title={t('ganttGoToEtcRef')}
          >
            {t('ganttEtcRef')}
          </button>
          <button
            onClick={onNext}
            className="p-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            title={t('ganttNextPeriod')}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {periodLabel && (
          <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
            {periodLabel}
          </span>
        )}

        <div className="h-4 w-px bg-gray-200"></div>

        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
            {t('ganttEtcRefLabel')}
          </label>
          <input
            type="date"
            value={etcReferenceDate || ''}
            onChange={(e) => onEtcReferenceDateChange(e.target.value)}
            className="border border-gray-200 rounded-md px-1.5 py-0.5 text-xs font-medium text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            title={t('ganttEtcRefTitle')}
          />
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={onRefresh}
          className="p-1 text-gray-400 hover:text-cyan-600 rounded-md hover:bg-gray-100 transition-colors"
          title={t('ganttRefresh')}
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          title={t('ganttClose')}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default GanttHeader;
