import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ListTodo } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';

/**
 * Simple popup for naming a task (replaces the complex TaskModal).
 * Shows: name input (pre-filled), budget display, save/cancel.
 */
function TaskNamePopup({
  isOpen,
  onClose,
  onSave,
  autoTaskName = '',
  totalBudget = 0,
  showInDays = false,
}) {
  const { t } = useTranslation(['estimateConversion', 'estimator', 'common']);
  const [taskName, setTaskName] = useState('');
  const inputRef = useRef(null);
  const saveRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTaskName(autoTaskName);
      setTimeout(() => {
        if (autoTaskName.trim()) {
          saveRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, autoTaskName]);

  const formatValue = (hours) => {
    const num = parseFloat(hours) || 0;
    if (showInDays) {
      return (Math.round((num / 8) * 10) / 10).toString();
    }
    return (Math.round(num * 10) / 10).toString();
  };

  const unitLabel = showInDays ? 'gg' : 'h';

  const handleSave = () => {
    if (!taskName.trim()) return;
    onSave(taskName.trim());
    onClose();
  };

  const customFooter = (
    <>
      <Button onClick={onClose} variant="outline" color="gray">
        {t('common:cancel')}
      </Button>
      <Button
        ref={saveRef}
        onClick={handleSave}
        color="cyan"
        disabled={!taskName.trim()}
      >
        {t('estimateConversion:createTask')}
      </Button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('estimateConversion:nameTask')}
      icon={<ListTodo className="text-cyan-600" size={24} />}
      size="md"
      customFooter={customFooter}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('estimator:activityNameLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && taskName.trim()) handleSave();
            }}
            placeholder={t('estimator:activityNamePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            maxLength={255}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('common:budget')}
          </label>
          <div className="px-3 py-2 bg-cyan-50 border border-cyan-300 rounded-md">
            <span className="text-lg font-bold text-cyan-800">
              {formatValue(totalBudget)}{unitLabel}
            </span>
            <span className="text-xs text-gray-600 ml-2">
              {showInDays
                ? t('estimator:budgetHoursAlt', { hours: (Math.round(totalBudget * 10) / 10).toString() })
                : t('estimator:budgetDays', { days: (totalBudget / 8).toFixed(1) })}
            </span>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default TaskNamePopup;
