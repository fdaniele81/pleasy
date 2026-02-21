import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ListTodo, Trash2 } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import Button from '../../../shared/ui/Button';
import ConfirmationModal from '../../../shared/ui/ConfirmationModal';
import { useConfirmation } from '../../../hooks';
import { addToast } from '../../../store/slices/toastSlice';

const MAX_TASKS = 10;

function TaskModal({
  isOpen,
  onClose,
  onSave,
  autoTaskName = '',
  totalBudget = 0,
  selectionType = 'SPARSE',
  cellsCount = 0
}) {
  const { t } = useTranslation(['estimator', 'common']);
  const [taskName, setTaskName] = useState('');

  const [mode, setMode] = useState('single');
  const [tasks, setTasks] = useState([
    { id: Date.now(), name: '', percentage: 50 },
    { id: Date.now() + 1, name: '', percentage: 50 }
  ]);

  const taskNameInputRef = useRef(null);
  const saveButtonRef = useRef(null);
  const dispatch = useDispatch();
  const confirmation = useConfirmation();

  useEffect(() => {
    if (isOpen) {
      setMode('single');
      setTaskName(autoTaskName);
      setTasks([
        { id: Date.now(), name: '', percentage: 50 },
        { id: Date.now() + 1, name: '', percentage: 50 }
      ]);
    }
  }, [isOpen, autoTaskName]);

  useEffect(() => {
    if (isOpen && mode === 'single') {
      setTimeout(() => {
        if (autoTaskName.trim()) {
          saveButtonRef.current?.focus();
        } else {
          taskNameInputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, autoTaskName, mode]);

  const getTotalPercentage = () => {
    return tasks.reduce((sum, t) => sum + parseFloat(t.percentage || 0), 0);
  };

  const addTask = () => {
    if (tasks.length >= MAX_TASKS) {
      dispatch(addToast({ message: t('estimator:maxTasksWarning', { max: MAX_TASKS }), type: 'warning' }));
      return;
    }
    const remainingPercentage = Math.max(0, 100 - getTotalPercentage());
    setTasks([...tasks, {
      id: Date.now(),
      name: '',
      percentage: remainingPercentage
    }]);
  };

  const removeTask = (id) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleModeChange = async (newMode) => {
    if (newMode === 'single' && mode === 'multiple') {
      const hasData = tasks.some(t => t.name.trim());
      if (hasData) {
        const confirmed = await confirmation.confirm({
          title: t('estimator:changeMode'),
          message: t('estimator:switchToSingleWarning'),
          confirmText: t('estimator:continueButton'),
          cancelText: t('common:cancel'),
          variant: 'warning'
        });
        if (!confirmed) return;
      }
      setTaskName('');
    } else if (newMode === 'multiple' && mode === 'single') {
      setTasks([
        { id: Date.now(), name: '', percentage: 50 },
        { id: Date.now() + 1, name: '', percentage: 50 }
      ]);
    }
    setMode(newMode);
  };

  const validateSave = () => {
    const errors = [];

    if (mode === 'single') {
      if (!taskName.trim()) {
        errors.push(t('estimator:enterActivityName'));
      }
    } else {
      if (tasks.length === 0) {
        errors.push(t('estimator:addAtLeastOneTask'));
      }

      const emptyNames = tasks.filter(t => !t.name.trim());
      if (emptyNames.length > 0) {
        errors.push(t('estimator:allTasksMustHaveName'));
      }

      const invalidPercentages = tasks.filter(t => {
        const pct = parseFloat(t.percentage);
        return isNaN(pct) || pct <= 0 || pct > 100;
      });
      if (invalidPercentages.length > 0) {
        errors.push(t('estimator:percentagesRange'));
      }

      const total = getTotalPercentage();
      if (Math.abs(total - 100) >= 0.01) {
        errors.push(t('estimator:percentagesMustBe100', { current: total.toFixed(1) }));
      }
    }

    if (totalBudget <= 0) {
      errors.push(t('estimator:budgetMustBePositive'));
    }

    return errors;
  };

  const handleSave = () => {
    const errors = validateSave();
    if (errors.length > 0) {
      dispatch(addToast({ message: errors.join(' | '), type: 'error' }));
      return;
    }

    if (mode === 'single') {
      onSave({
        mode: 'single',
        tasks: [{
          title: taskName.trim(),
          budget: totalBudget,
          percentage: 100,
          selectionType,
          cellsCount
        }]
      });
    } else {
      onSave({
        mode: 'multiple',
        tasks: tasks.map(t => ({
          title: t.name.trim(),
          budget: totalBudget * (parseFloat(t.percentage) / 100),
          percentage: parseFloat(t.percentage),
          selectionType,
          cellsCount
        }))
      });
    }

    onClose();
  };

  const customFooter = (
    <>
      <Button
        onClick={onClose}
        variant="outline"
        color="gray"
      >
        {t('common:cancel')}
      </Button>
      <Button
        ref={saveButtonRef}
        onClick={handleSave}
        color="cyan"
      >
        {t('estimator:saveActivity')}
      </Button>
    </>
  );

  return (
    <>
    <ConfirmationModal
      isOpen={confirmation.isOpen}
      config={confirmation.config}
      onConfirm={confirmation.handleConfirm}
      onCancel={confirmation.handleCancel}
    />
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('estimator:createActivityFromSelection')}
      icon={<ListTodo className="text-cyan-600" size={24} />}
      size="lg"
      customFooter={customFooter}
      confirmButtonColor="cyan"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-xs font-semibold">
            {cellsCount} {cellsCount === 1 ? t('estimator:cellLabel') : t('estimator:cellsLabel')}
          </div>
          {selectionType && (
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              selectionType === 'ROW' ? 'bg-green-100 text-green-800' :
              selectionType === 'COLUMN' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectionType === 'ROW' ? t('estimator:selectionRow') :
               selectionType === 'COLUMN' ? t('estimator:selectionColumn') :
               t('estimator:selectionSparse')}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'single'}
              onChange={() => handleModeChange('single')}
              className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm font-medium text-gray-700">{t('estimator:singleTask')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'multiple'}
              onChange={() => handleModeChange('multiple')}
              className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
            />
            <span className="text-sm font-medium text-gray-700">{t('estimator:multipleTasks')}</span>
          </label>
        </div>

        {mode === 'single' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('estimator:activityNameLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                ref={taskNameInputRef}
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && taskName.trim()) {
                    handleSave();
                  }
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
                  {totalBudget.toFixed(1)}h
                </span>
                <span className="text-xs text-gray-600 ml-2">
                  {t('estimator:budgetDays', { days: (totalBudget / 8).toFixed(1) })}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tasks.map((task, index) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-700">{t('estimator:taskNumber', { index: index + 1 })}</span>
                    {tasks.length > 1 && (
                      <button
                        onClick={() => removeTask(task.id)}
                        className="ml-auto text-gray-400 hover:text-red-600 transition-colors"
                        title={t('estimator:removeTaskTitle')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">{t('estimator:taskNameLabel')}</label>
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                        placeholder={t('estimator:taskNamePlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        maxLength={255}
                      />
                    </div>

                    <div className="w-28">
                      <label className="block text-xs text-gray-600 mb-1">{t('estimator:budgetPercentage')}</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={task.percentage}
                          onChange={(e) => updateTask(task.id, 'percentage', e.target.value)}
                          min="0.01"
                          max="100"
                          step="0.1"
                          className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    Budget: <span className="font-semibold text-cyan-700">
                      {(totalBudget * (parseFloat(task.percentage || 0) / 100)).toFixed(1)}h
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {tasks.length < MAX_TASKS && (
              <button
                onClick={addTask}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-colors text-sm font-medium text-gray-600 hover:text-cyan-700"
              >
                {t('estimator:addTaskButton')}
              </button>
            )}

            <div className={`p-3 rounded-lg border-2 ${
              Math.abs(getTotalPercentage() - 100) < 0.01
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {t('common:total')}: {getTotalPercentage().toFixed(1)}%
                </span>
                {Math.abs(getTotalPercentage() - 100) < 0.01 ? (
                  <span className="text-green-600 text-xl">✓</span>
                ) : (
                  <span className="text-red-600 text-sm font-medium">
                    {getTotalPercentage() > 100
                      ? `+${(getTotalPercentage() - 100).toFixed(1)}%`
                      : `${(getTotalPercentage() - 100).toFixed(1)}%`}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-2">{t('estimator:budgetSummary')}</div>
              <div className="space-y-1 text-sm">
                {tasks.map((task, index) => (
                  <div key={task.id} className="flex justify-between text-gray-600">
                    <span>{t('estimator:taskNumber', { index: index + 1 })}:</span>
                    <span className="font-medium">
                      {(totalBudget * (parseFloat(task.percentage || 0) / 100)).toFixed(1)}h
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold text-gray-900">
                  <span>{t('common:total')}:</span>
                  <span>{totalBudget.toFixed(1)}h</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </BaseModal>
    </>
  );
}

export default TaskModal;
