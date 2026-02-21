import { useState, useCallback } from 'react';

export function useTimesheetModals() {
  const [showExportModal, setShowExportModal] = useState(false);

  const [showSubmissionPreview, setShowSubmissionPreview] = useState(false);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState(null);
  const [taskDetailsForModal, setTaskDetailsForModal] = useState(null);
  const [loadingTaskDetails, setLoadingTaskDetails] = useState(false);

  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [timeOffModalData, setTimeOffModalData] = useState(null);
  const [timeOffModalDate, setTimeOffModalDate] = useState(null);
  const [timeOffModalType, setTimeOffModalType] = useState(null);

  const [showTimesheetDetailsModal, setShowTimesheetDetailsModal] = useState(false);
  const [timesheetDetailsModalData, setTimesheetDetailsModalData] = useState(null);
  const [timesheetDetailsModalDate, setTimesheetDetailsModalDate] = useState(null);
  const [timesheetDetailsModalTask, setTimesheetDetailsModalTask] = useState(null);
  const [timesheetDetailsModalIsSubmitted, setTimesheetDetailsModalIsSubmitted] = useState(false);

  const openExportModal = useCallback(() => setShowExportModal(true), []);
  const closeExportModal = useCallback(() => setShowExportModal(false), []);

  const openSubmissionPreview = useCallback(() => setShowSubmissionPreview(true), []);
  const closeSubmissionPreview = useCallback(() => setShowSubmissionPreview(false), []);

  const openTaskModal = useCallback((task) => {
    setSelectedTaskForModal(task);
    setShowTaskModal(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setShowTaskModal(false);
    setSelectedTaskForModal(null);
    setTaskDetailsForModal(null);
  }, []);

  const openTimeOffModal = useCallback((data, date, type) => {
    setTimeOffModalData(data);
    setTimeOffModalDate(date);
    setTimeOffModalType(type);
    setShowTimeOffModal(true);
  }, []);

  const closeTimeOffModal = useCallback(() => {
    setShowTimeOffModal(false);
    setTimeOffModalData(null);
    setTimeOffModalDate(null);
    setTimeOffModalType(null);
  }, []);

  const openTimesheetDetailsModal = useCallback((data, date, task, isSubmitted) => {
    setTimesheetDetailsModalData(data);
    setTimesheetDetailsModalDate(date);
    setTimesheetDetailsModalTask(task);
    setTimesheetDetailsModalIsSubmitted(isSubmitted);
    setShowTimesheetDetailsModal(true);
  }, []);

  const closeTimesheetDetailsModal = useCallback(() => {
    setShowTimesheetDetailsModal(false);
    setTimesheetDetailsModalData(null);
    setTimesheetDetailsModalDate(null);
    setTimesheetDetailsModalTask(null);
    setTimesheetDetailsModalIsSubmitted(false);
  }, []);

  const closeAllModals = useCallback(() => {
    setShowExportModal(false);
    setShowSubmissionPreview(false);
    setShowTaskModal(false);
    setShowTimeOffModal(false);
    setShowTimesheetDetailsModal(false);
  }, []);

  return {
    showExportModal,
    openExportModal,
    closeExportModal,

    showSubmissionPreview,
    openSubmissionPreview,
    closeSubmissionPreview,

    showTaskModal,
    selectedTaskForModal,
    taskDetailsForModal,
    setTaskDetailsForModal,
    loadingTaskDetails,
    setLoadingTaskDetails,
    openTaskModal,
    closeTaskModal,

    showTimeOffModal,
    timeOffModalData,
    timeOffModalDate,
    timeOffModalType,
    openTimeOffModal,
    closeTimeOffModal,

    showTimesheetDetailsModal,
    timesheetDetailsModalData,
    timesheetDetailsModalDate,
    timesheetDetailsModalTask,
    timesheetDetailsModalIsSubmitted,
    openTimesheetDetailsModal,
    closeTimesheetDetailsModal,

    closeAllModals,
  };
}

export default useTimesheetModals;
