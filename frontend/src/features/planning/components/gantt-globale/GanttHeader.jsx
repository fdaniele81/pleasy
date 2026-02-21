import React from 'react';
import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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
  t
}) => {
  return (
    <div className="flex items-center justify-between p-2 px-3 border-b border-cyan-800 bg-cyan-700 text-white rounded-t-lg">
      <div className="flex items-center gap-2">
        <Calendar size={18} />
        <h2 className="text-sm font-bold">{t('ganttGlobal')}</h2>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={timeInterval}
          onChange={(e) => onTimeIntervalChange(parseInt(e.target.value))}
          className="border border-cyan-400 rounded px-2 py-0.5 text-xs font-medium bg-cyan-600 text-white"
        >
          <option value="2">{t('ganttInterval2w')}</option>
          <option value="4">{t('ganttInterval1m')}</option>
          <option value="12">{t('ganttInterval3m')}</option>
          <option value="24">{t('ganttInterval6m')}</option>
          <option value="48">{t('ganttInterval1y')}</option>
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={onPrevious}
            disabled={dateOffset <= minDateOffset}
            className={`p-0.5 rounded transition-colors ${
              dateOffset <= minDateOffset
                ? 'bg-cyan-800 text-cyan-300 cursor-not-allowed opacity-50'
                : 'bg-cyan-600 text-white hover:bg-cyan-500'
            }`}
            title={t('ganttPreviousPeriod')}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onGoToEtcRef}
            disabled={dateOffset === minDateOffset}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              dateOffset === minDateOffset
                ? 'bg-cyan-800 text-cyan-300 cursor-not-allowed opacity-50'
                : 'bg-cyan-600 text-white hover:bg-cyan-500'
            }`}
            title={t('ganttGoToEtcRef')}
          >
            {t('ganttEtcRef')}
          </button>
          <button
            onClick={onNext}
            className="p-0.5 bg-cyan-600 text-white hover:bg-cyan-500 rounded transition-colors"
            title={t('ganttNextPeriod')}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {periodLabel && (
          <span className="text-xs font-medium text-cyan-100 whitespace-nowrap">
            {periodLabel}
          </span>
        )}

        <div className="h-5 w-px bg-cyan-400"></div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-cyan-100 whitespace-nowrap">
            {t('ganttEtcRefLabel')}
          </label>
          <input
            type="date"
            value={etcReferenceDate || ''}
            onChange={(e) => onEtcReferenceDateChange(e.target.value)}
            className="border border-cyan-400 rounded px-1.5 py-0.5 text-xs font-medium bg-cyan-600 text-white scheme-dark"
            title={t('ganttEtcRefTitle')}
          />
        </div>
      </div>

      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 transition-colors p-1"
        title={t('ganttClose')}
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default GanttHeader;
