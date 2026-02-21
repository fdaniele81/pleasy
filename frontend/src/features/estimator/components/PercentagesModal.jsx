import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save, RefreshCw } from 'lucide-react';
import Button from '../../../shared/ui/Button';
import { calculatePercentagesSum } from '../utils/estimateCalculations';

const formatPercentage = (value) => {
  const num = parseFloat(value) || 0;
  return Number.isInteger(num) ? num.toString() : num.toString();
};

const PercentageInput = ({ label, value, onChange, disabled = false }) => (
  <div className="flex items-center justify-between">
    <label className="text-xs font-medium text-gray-700">{label}</label>
    <div className="flex items-center">
      <input
        type="number"
        value={formatPercentage(value)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onWheel={(e) => e.target.blur()}
        disabled={disabled}
        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded text-right focus:ring-1 focus:ring-cyan-500 disabled:bg-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        min="0"
        max="100"
        step="0.1"
      />
      <span className="ml-1 text-xs text-gray-500">%</span>
    </div>
  </div>
);

const PercentagesModal = ({
  isOpen,
  onClose,
  formData,
  savedEstimateId,
  onSaveOnly,
  onSaveAndRecalculate,
  isReadOnly = false,
}) => {
  const { t } = useTranslation(['estimator', 'common']);
  const [tempPercentages, setTempPercentages] = useState({});
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setTempPercentages({
        pct_analysis: formData.pct_analysis,
        pct_development: formData.pct_development,
        pct_internal_test: formData.pct_internal_test,
        pct_uat: formData.pct_uat,
        pct_release: formData.pct_release,
        pct_pm: formData.pct_pm,
        pct_startup: formData.pct_startup,
        pct_documentation: formData.pct_documentation,
        contingency_percentage: formData.contingency_percentage,
      });
    }
  }, [isOpen, formData]);

  const handleModalMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - 245));
      const newY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - 200));
      setModalPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handlePercentageChange = (field, value) => {
    setTempPercentages(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const percentagesSum = calculatePercentagesSum(tempPercentages);
  const isValidSum = Math.abs(percentagesSum - 100) < 0.01;

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-60"
      style={{
        left: `${modalPosition.x}px`,
        top: `${modalPosition.y}px`,
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 from-cyan-600 to-cyan-700 rounded-t-lg cursor-move"
        onMouseDown={handleModalMouseDown}
      >
        <span className="text-white text-sm font-semibold">{t('estimator:percentages')}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <PercentageInput
          label={t('estimator:phaseAnalysis')}
          value={tempPercentages.pct_analysis || 0}
          onChange={(v) => handlePercentageChange('pct_analysis', v)}
          disabled={isReadOnly}
        />
        <PercentageInput
          label={t('estimator:phaseDevelopment')}
          value={tempPercentages.pct_development || 0}
          onChange={(v) => handlePercentageChange('pct_development', v)}
          disabled={isReadOnly}
        />
        <PercentageInput
          label={t('estimator:phaseInternalTestFull')}
          value={tempPercentages.pct_internal_test || 0}
          onChange={(v) => handlePercentageChange('pct_internal_test', v)}
          disabled={isReadOnly}
        />
        <PercentageInput
          label="UAT"
          value={tempPercentages.pct_uat || 0}
          onChange={(v) => handlePercentageChange('pct_uat', v)}
          disabled={isReadOnly}
        />
        <PercentageInput
          label={t('estimator:phaseRelease')}
          value={tempPercentages.pct_release || 0}
          onChange={(v) => handlePercentageChange('pct_release', v)}
          disabled={isReadOnly}
        />
        <PercentageInput
          label="PM"
          value={tempPercentages.pct_pm || 0}
          onChange={(v) => handlePercentageChange('pct_pm', v)}
          disabled={isReadOnly}
        />
        <PercentageInput
          label={t('estimator:phaseStartupFull')}
          value={tempPercentages.pct_startup || 0}
          onChange={(v) => handlePercentageChange('pct_startup', v)}
          disabled={isReadOnly}
        />
        <PercentageInput
          label={t('estimator:phaseDocumentationFull')}
          value={tempPercentages.pct_documentation || 0}
          onChange={(v) => handlePercentageChange('pct_documentation', v)}
          disabled={isReadOnly}
        />

        <div className={`flex items-center justify-between pt-2 border-t ${isValidSum ? 'text-green-600' : 'text-red-600'}`}>
          <span className="text-xs font-medium">{t('common:total')}:</span>
          <span className="text-xs font-bold">{Number.isInteger(percentagesSum) ? percentagesSum : percentagesSum.toFixed(1)}%</span>
        </div>

        <div className="pt-2 border-t">
          <PercentageInput
            label={t('estimator:phaseContingency')}
            value={tempPercentages.contingency_percentage || 0}
            onChange={(v) => handlePercentageChange('contingency_percentage', v)}
            disabled={isReadOnly}
          />
        </div>

        {!isReadOnly && (
          <div className="flex flex-col gap-2 pt-3">
            <Button
              onClick={() => onSaveOnly(tempPercentages)}
              disabled={!isValidSum}
              size="sm"
              color="gray"
              className="w-full justify-center"
              icon={Save}
              iconSize={14}
            >
              {t('estimator:savePercentages')}
            </Button>
            {savedEstimateId && (
              <Button
                onClick={() => onSaveAndRecalculate(tempPercentages)}
                disabled={!isValidSum}
                size="sm"
                color="cyan"
                className="w-full justify-center"
                icon={RefreshCw}
                iconSize={14}
              >
                {t('estimator:saveAndRecalcPercentages')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PercentagesModal;
