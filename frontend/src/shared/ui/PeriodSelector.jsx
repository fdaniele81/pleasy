import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { addToast } from '../../store/slices/toastSlice';
import {
  PERIOD_PRESETS,
  navigatePeriod,
  formatDateISO,
  savePeriodToStorage,
  loadPeriodFromStorage,
  addDays,
  differenceInDays,
  parseISOLocal
} from '../../utils/date/dateUtils';

function PeriodSelector({
  startDate,
  endDate,
  onRangeChange,
  showNavigation = true,
  defaultPreset = 'week_workdays',
  pageId = 'default',
  enablePersistence = true,
  lockPreset = false,
  stepDays = 1
}) {
  const [selectedPreset, setSelectedPreset] = useState(defaultPreset);
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [jumpToDate, setJumpToDate] = useState('');
  const { t } = useTranslation(['common']);
  const dispatch = useDispatch();

  useEffect(() => {
    if (enablePersistence) {
      const saved = loadPeriodFromStorage(pageId);
      if (saved && saved.preset) {
        setSelectedPreset(saved.preset);

        if (saved.preset === 'custom') {
          setShowCustomInputs(true);
          setCustomStart(formatDateISO(saved.start));
          setCustomEnd(formatDateISO(saved.end));
        }
      }
    }
  }, [pageId, enablePersistence]);

  const handlePresetChange = (presetKey) => {
    setSelectedPreset(presetKey);

    if (presetKey === 'custom') {
      setShowCustomInputs(true);
      setCustomStart(startDate);
      setCustomEnd(endDate);
    } else {
      setShowCustomInputs(false);
      const preset = PERIOD_PRESETS[presetKey];
      if (preset && preset.calculate) {
        const { start, end } = preset.calculate(new Date());
        const newStart = formatDateISO(start);
        const newEnd = formatDateISO(end);

        onRangeChange({ start: newStart, end: newEnd });

        if (enablePersistence) {
          savePeriodToStorage(pageId, start, end, presetKey);
        }
      }
    }
  };

  const handleNavigate = (direction) => {
    const currentStart = parseISOLocal(startDate);
    const currentEnd = parseISOLocal(endDate);

    const offset = direction === 'prev' ? -stepDays : stepDays;
    const start = addDays(currentStart, offset);
    const end = addDays(currentEnd, offset);

    const newStart = formatDateISO(start);
    const newEnd = formatDateISO(end);

    onRangeChange({ start: newStart, end: newEnd });

    if (enablePersistence) {
      savePeriodToStorage(pageId, start, end, selectedPreset);
    }
  };

  const handleResetToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentStart = parseISOLocal(startDate);
    const currentEnd = parseISOLocal(endDate);
    const duration = differenceInDays(currentEnd, currentStart);

    const start = today;
    const end = addDays(today, duration);

    const newStart = formatDateISO(start);
    const newEnd = formatDateISO(end);

    onRangeChange({ start: newStart, end: newEnd });

    if (selectedPreset === 'custom') {
      setSelectedPreset('two_weeks');
      setShowCustomInputs(false);
    }

    if (enablePersistence) {
      savePeriodToStorage(pageId, start, end, selectedPreset === 'custom' ? 'two_weeks' : selectedPreset);
    }
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) {
      dispatch(addToast({ message: t('common:selectBothDates'), type: 'warning' }));
      return;
    }

    const startDate = parseISOLocal(customStart);
    const endDate = parseISOLocal(customEnd);

    if (startDate > endDate) {
      dispatch(addToast({ message: t('common:startBeforeEnd'), type: 'warning' }));
      return;
    }

    onRangeChange({ start: customStart, end: customEnd });

    if (enablePersistence) {
      savePeriodToStorage(pageId, startDate, endDate, 'custom');
    }
  };

  const handleJumpToDate = () => {
    if (!jumpToDate) {
      dispatch(addToast({ message: t('common:selectDate'), type: 'warning' }));
      return;
    }

    const currentStart = parseISOLocal(startDate);
    const currentEnd = parseISOLocal(endDate);

    const duration = differenceInDays(currentEnd, currentStart);

    const start = parseISOLocal(jumpToDate);

    const end = addDays(start, duration);

    const newStart = formatDateISO(start);
    const newEnd = formatDateISO(end);

    onRangeChange({ start: newStart, end: newEnd });

    if (enablePersistence) {
      savePeriodToStorage(pageId, start, end, selectedPreset);
    }

    setJumpToDate('');
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {!lockPreset && (
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm font-medium min-w-[200px] bg-white"
        >
          {Object.values(PERIOD_PRESETS).map((preset) => (
            <option key={preset.key} value={preset.key}>
              {preset.label}
            </option>
          ))}
        </select>
      )}

      {showNavigation && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavigate('prev')}
            className="p-1.5 bg-cyan-100 text-cyan-600 hover:bg-cyan-200 rounded-lg transition-colors"
            title={t('common:previousWeek')}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => handleNavigate('next')}
            className="p-1.5 bg-cyan-100 text-cyan-600 hover:bg-cyan-200 rounded-lg transition-colors"
            title={t('common:nextWeek')}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <button
        onClick={handleResetToToday}
        className="px-3 py-1.5 bg-cyan-100 hover:bg-cyan-200 text-cyan-700 rounded transition-colors flex items-center gap-1"
        title={t('common:goToToday')}
      >
        <Calendar size={14} />
        <span className="text-xs font-medium">{t('common:today')}</span>
      </button>

      {lockPreset && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700">{t('common:goToDate')}</label>
          <input
            type="date"
            value={jumpToDate}
            onChange={(e) => setJumpToDate(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleJumpToDate();
              }
            }}
            className="border border-gray-300 rounded px-3 py-1.5 text-xs"
          />
          <button
            onClick={handleJumpToDate}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors text-xs font-medium"
          >
            {t('common:go')}
          </button>
        </div>
      )}

      {showCustomInputs && (
        <>
          <div className="flex items-center gap-2 ml-4">
            <label className="text-sm font-medium text-gray-700">{t('common:from')}</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCustom();
                }
              }}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">{t('common:to')}</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCustom();
                }
              }}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={handleApplyCustom}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm font-medium"
          >
            {t('common:apply')}
          </button>
        </>
      )}
    </div>
  );
}

PeriodSelector.propTypes = {
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
  onRangeChange: PropTypes.func.isRequired,
  showNavigation: PropTypes.bool,
  defaultPreset: PropTypes.string,
  pageId: PropTypes.string,
  enablePersistence: PropTypes.bool,
  lockPreset: PropTypes.bool,
  stepDays: PropTypes.number,
};

export default PeriodSelector;
