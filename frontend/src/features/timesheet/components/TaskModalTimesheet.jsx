import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ListTodo } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';
import RichTextEditor from '../../../shared/components/RichTextEditorLazy';
import logger from '../../../utils/logger';

const TaskModalTimesheet = ({
  isOpen,
  onClose,
  onConfirm,
  task = null,
  projectTitle = '',
  clientName = '',
  clientKey = ''
}) => {
  const { t } = useTranslation(['timesheet', 'common']);
  const [editedTaskDetails, setEditedTaskDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasEditedRef = useRef(false);

  const handleDetailsChange = useCallback((val) => {
    hasEditedRef.current = true;
    setEditedTaskDetails(val);
  }, []);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm({
        task_details: hasEditedRef.current ? editedTaskDetails : task.task_details
      });
      hasEditedRef.current = false;
      setEditedTaskDetails(null);
    } catch (error) {
      logger.error('Errore durante il salvataggio:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    hasEditedRef.current = false;
    setEditedTaskDetails(null);
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleSubmit}
      title={t('timesheet:activityDetails')}
      icon={<ListTodo className="text-cyan-600" size={24} />}
      confirmText={t('timesheet:saveDetails')}
      cancelText={t('common:close')}
      isEditMode={true}
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

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {t('timesheet:activityTitle')}
          </label>
          <div className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50">
            {task.title || task.task_title || '-'}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {t('common:details')}
          </label>
          <RichTextEditor
            value={hasEditedRef.current ? editedTaskDetails : task.task_details}
            onChange={handleDetailsChange}
            docKey={task.task_id || 'task-details'}
            placeholder={t('timesheet:detailsEditorPlaceholder')}
          />
        </div>
      </div>
    </BaseModal>
  );
};

export default TaskModalTimesheet;
