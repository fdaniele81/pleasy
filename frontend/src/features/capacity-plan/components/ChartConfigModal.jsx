import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, GripVertical } from 'lucide-react';
import BaseModal from '../../../shared/components/BaseModal';

const ChartConfigModal = ({ isOpen, onClose, categoryKeys, colorMap, onApply }) => {
  const { t } = useTranslation(['capacityPlan', 'common']);
  const [orderedKeys, setOrderedKeys] = useState([]);
  const [colors, setColors] = useState({});
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const dragIdxRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setOrderedKeys([...categoryKeys]);
    const initialColors = {};
    categoryKeys.forEach((key) => {
      initialColors[key] = colorMap[key]?.color || '#9CA3AF';
    });
    setColors(initialColors);
    setDragIdx(null);
    setOverIdx(null);
  }, [isOpen, categoryKeys, colorMap]);

  const handleDragStart = useCallback((e, index) => {
    dragIdxRef.current = index;
    setDragIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(index);
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    const fromIndex = dragIdxRef.current;
    if (fromIndex === null || fromIndex === dropIndex) return;

    setOrderedKeys((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(dropIndex, 0, removed);
      return next;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragIdxRef.current = null;
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  const handleColorChange = useCallback((key, newColor) => {
    setColors((prev) => ({ ...prev, [key]: newColor }));
  }, []);

  const handleApply = () => {
    onApply({ orderedKeys, customColors: colors });
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleApply}
      title={t('capacityPlan:configureChart')}
      icon={<Palette className="text-cyan-600" size={22} />}
      size="sm"
      confirmText={t('common:apply')}
    >
      <p className="text-xs text-gray-500 mb-3">
        {t('capacityPlan:configChartDescription')}
      </p>

      <div className="space-y-1">
        {orderedKeys.map((key, idx) => (
          <div
            key={key}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border select-none transition-colors ${
              dragIdx === idx
                ? 'opacity-40 bg-gray-100 border-gray-300'
                : overIdx === idx && dragIdx !== null && dragIdx !== idx
                  ? 'bg-cyan-50 border-cyan-300'
                  : 'bg-gray-50 border-gray-200'
            } cursor-grab active:cursor-grabbing`}
          >
            {/* Grip handle */}
            <GripVertical size={16} className="text-gray-400 shrink-0 pointer-events-none" />

            {/* Color picker */}
            <label className="relative w-6 h-6 rounded cursor-pointer border border-gray-300 overflow-hidden shrink-0">
              <input
                type="color"
                value={colors[key] || '#9CA3AF'}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="w-full h-full rounded"
                style={{ backgroundColor: colors[key] || '#9CA3AF' }}
              />
            </label>

            {/* Label */}
            <span className="text-sm font-medium text-gray-700 flex-1 pointer-events-none">
              {colorMap[key]?.label || key}
            </span>

            {/* Posizione */}
            <span className="text-xs text-gray-400 pointer-events-none">
              {idx + 1}
            </span>
          </div>
        ))}
      </div>
    </BaseModal>
  );
};

export default ChartConfigModal;
