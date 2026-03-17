import { useState, useCallback, useRef } from 'react';
import { useUpdateTaskOrderMutation } from '../api/planningEndpoints';

export function useTaskReorder({ refetchPlanning }) {
  const [reorderingProjectId, setReorderingProjectId] = useState(null);
  const [localTaskOrder, setLocalTaskOrder] = useState([]);
  const [updateTaskOrder] = useUpdateTaskOrderMutation();
  const dragItemRef = useRef(null);
  const dragOverItemRef = useRef(null);

  const startReordering = useCallback((projectId, tasks) => {
    setReorderingProjectId(projectId);
    setLocalTaskOrder(tasks.map(t => t.task_id));
  }, []);

  const cancelReordering = useCallback(() => {
    setReorderingProjectId(null);
    setLocalTaskOrder([]);
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  }, []);

  const handleDragStart = useCallback((taskId) => {
    dragItemRef.current = taskId;
  }, []);

  const handleDragOver = useCallback((e, taskId) => {
    e.preventDefault();
    if (dragOverItemRef.current === taskId) return;
    dragOverItemRef.current = taskId;

    setLocalTaskOrder(prev => {
      const dragIdx = prev.indexOf(dragItemRef.current);
      const overIdx = prev.indexOf(taskId);
      if (dragIdx === -1 || overIdx === -1 || dragIdx === overIdx) return prev;

      const next = [...prev];
      next.splice(dragIdx, 1);
      next.splice(overIdx, 0, dragItemRef.current);
      return next;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  }, []);

  const saveReordering = useCallback(async () => {
    if (!reorderingProjectId || localTaskOrder.length === 0) return;

    try {
      await updateTaskOrder({
        projectId: reorderingProjectId,
        taskOrder: localTaskOrder,
      }).unwrap();
      refetchPlanning();
    } catch (err) {
      console.error('Failed to save task order:', err);
    }

    setReorderingProjectId(null);
    setLocalTaskOrder([]);
  }, [reorderingProjectId, localTaskOrder, updateTaskOrder, refetchPlanning]);

  return {
    reorderingProjectId,
    localTaskOrder,
    startReordering,
    cancelReordering,
    saveReordering,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
