import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListTodo } from 'lucide-react';
import BaseModal from '../BaseModal';
import RichTextEditor from '../RichTextEditorLazy';
import { useFormModal } from '../../../hooks/useFormModal';
import { statusOptions, statusLabels } from '../../../features/planning/utils/helpers';
import { formatDateISO } from '../../../utils/date/dateUtils';

const TaskModal = ({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
  projectId,
  clientName,
  clientKey,
  availableUsers = [],
  task = null,
  readOnlyView = false
}) => {
  const { t } = useTranslation(['planning', 'validation', 'common']);
  const isEditMode = !!task;

  const {
    formData,
    errors,
    handleChange,
    handleChangeMultiple,
    handleSubmit,
    isSubmitting
  } = useFormModal({
    initialValues: {
      title: '',
      description: '',
      task_details: null,
      external_key: '',
      task_status_id: 'NEW',
      owner_id: '',
      budget: '0',
      initial_actual: '0',
      etc: '0',
      start_date: '',
      end_date: ''
    },
    transformForEdit: (task) => ({
      title: task.title || task.task_title || '',
      description: task.description || '',
      task_details: task.task_details || null,
      external_key: task.external_key || '',
      task_status_id: task.task_status_id || 'NEW',
      owner_id: task.owner_id || '',
      budget: task.budget?.toString() || '0',
      initial_actual: task.initial_actual?.toString() || '0',
      etc: task.etc?.toString() || '0',
      start_date: formatDateISO(task.start_date),
      end_date: formatDateISO(task.end_date)
    }),
    validate: (data) => {
      const newErrors = {};

      if (!data.title.trim()) {
        newErrors.title = t('validation:activityTitleRequired');
      }

      if (!data.task_status_id) {
        newErrors.task_status_id = t('validation:activityStatusRequired');
      }

      if (data.task_status_id === 'IN PROGRESS') {
        const missingFields = [];
        if (!data.owner_id) missingFields.push(t('validation:fieldUser'));
        if (!data.start_date) missingFields.push(t('validation:fieldStartDate'));
        if (!data.end_date) missingFields.push(t('validation:fieldEndDate'));

        if (missingFields.length > 0) {
          newErrors.general = t('validation:inProgressRequiresFields', { missingFields: missingFields.join(', ') });
        }
      }

      const budgetValue = parseFloat(data.budget);
      if (isNaN(budgetValue) || budgetValue < 0) {
        newErrors.budget = t('validation:budgetPositive');
      }

      return Object.keys(newErrors).length > 0 ? newErrors : null;
    },
    onSubmit: async (data) => {
      if (isEditMode) {
        await onConfirm({ ...data, task_id: task.task_id });
      } else {
        await onConfirm(data);
      }
      onClose();
    },
    entity: task,
    isOpen
  });

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={readOnlyView ? t('planning:taskDetails') : (isEditMode ? t('planning:editTask') : t('planning:newTask'))}
      icon={<ListTodo className="text-cyan-600" size={24} />}
      confirmText={isEditMode ? t('common:saveChanges') : t('planning:createTask')}
      cancelText={t('common:cancel')}
      isEditMode={isEditMode}
      error={errors.general}
      size="2xl"
      confirmButtonColor="cyan"
      isSubmitting={isSubmitting}
    >
      {(clientName || projectTitle) && (
        <div className="mb-2 pb-2 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {clientName && <span className="font-semibold text-gray-800">{clientKey || clientName}</span>}
            {clientName && projectTitle && <span className="mx-1">›</span>}
            {projectTitle && <span className="font-semibold text-cyan-600">{projectTitle}</span>}
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {readOnlyView ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('planning:taskTitle')}
              </label>
              <div className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50">
                {formData.title || '-'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('common:details')}
              </label>
              <RichTextEditor
                value={formData.task_details}
                onChange={(value) => handleChange('task_details', value)}
                docKey={task?.task_id || 'new'}
                placeholder={t('planning:detailsPlaceholder')}
                error={errors.task_details}
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('planning:taskTitleLabel')}
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-sm border ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                  placeholder={t('planning:taskTitlePlaceholder')}
                  autoFocus
                />
                {errors.title && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.title}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('planning:externalKey')}
                </label>
                <input
                  type="text"
                  name="external_key"
                  value={formData.external_key}
                  onChange={(e) => handleChange('external_key', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="JIRA-123"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('planning:statusLabel')}
                </label>
                <select
                  name="task_status_id"
                  value={formData.task_status_id}
                  onChange={(e) => handleChange('task_status_id', e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-sm border ${
                    errors.task_status_id ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status] || status}
                    </option>
                  ))}
                </select>
                {errors.task_status_id && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.task_status_id}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('planning:assignTo')}
                </label>
                <select
                  name="owner_id"
                  value={formData.owner_id}
                  onChange={(e) => handleChange('owner_id', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">{t('planning:notAssigned')}</option>
                  {availableUsers?.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('planning:budgetHours')}
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={(e) => {
                    const newBudget = e.target.value;
                    handleChange('budget', newBudget);
                    if (formData.etc === formData.budget) {
                      handleChange('etc', newBudget);
                    }
                  }}
                  onWheel={(e) => e.target.blur()}
                  step="0.1"
                  min="0"
                  className={`w-full px-2.5 py-1.5 text-sm border ${
                    errors.budget ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  placeholder="0"
                />
                {errors.budget && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.budget}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('planning:initActualHours')}
                </label>
                <input
                  type="number"
                  name="initial_actual"
                  value={formData.initial_actual}
                  onChange={(e) => handleChange('initial_actual', e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  step="0.1"
                  min="0"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('planning:etcHours')}
                </label>
                <input
                  type="number"
                  name="etc"
                  value={formData.etc}
                  onChange={(e) => handleChange('etc', e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  step="0.1"
                  min="0"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('planning:startDate')}
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t('planning:endDate')}
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-sm border ${
                    errors.end_date ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                />
                {errors.end_date && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.end_date}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('common:details')}
              </label>
              <RichTextEditor
                value={formData.task_details}
                onChange={(value) => handleChange('task_details', value)}
                docKey={task?.task_id || 'new'}
                placeholder={t('planning:detailsPlaceholder')}
                error={errors.task_details}
              />
              {errors.task_details && (
                <p className="mt-0.5 text-xs text-red-600">{errors.task_details}</p>
              )}
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
};

export default TaskModal;
