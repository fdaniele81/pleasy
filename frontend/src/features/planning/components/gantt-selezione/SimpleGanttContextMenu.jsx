import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const SimpleGanttContextMenu = ({
  contextMenu,
  setContextMenu,
  milestonesVisibility = {},
  onHideMilestone,
  onHideMilestoneLabel,
  onShowMilestoneLabel,
  onShowMilestone,
}) => {
  const { t } = useTranslation('planning');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setContextMenu({ isOpen: false, taskId: null, x: 0, y: 0 });
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setContextMenu({ isOpen: false, taskId: null, x: 0, y: 0 });
      }
    };

    if (contextMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu.isOpen, setContextMenu]);

  if (!contextMenu.isOpen) {
    return null;
  }

  const closeMenu = () => {
    setContextMenu({ isOpen: false, taskId: null, x: 0, y: 0 });
  };

  const taskVisibility = milestonesVisibility[contextMenu.taskId];

  return (
    <foreignObject
      x={contextMenu.x}
      y={contextMenu.y}
      width={200}
      height={120}
      style={{ overflow: 'visible' }}
    >
      <div
        ref={menuRef}
        className="bg-white rounded-lg shadow-lg border border-gray-200 py-1"
        style={{ width: '200px' }}
      >
        {taskVisibility?.showMarker ? (
          <>
            <button
              onClick={() => {
                onHideMilestone(contextMenu.taskId);
                closeMenu();
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('contextHideMilestone')}
            </button>

            {taskVisibility?.showLabel ? (
              <button
                onClick={() => {
                  onHideMilestoneLabel(contextMenu.taskId);
                  closeMenu();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('contextHideDate')}
              </button>
            ) : (
              <button
                onClick={() => {
                  onShowMilestoneLabel(contextMenu.taskId);
                  closeMenu();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('contextShowDate')}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => {
              onShowMilestone(contextMenu.taskId);
              closeMenu();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('contextShowMilestone')}
          </button>
        )}
      </div>
    </foreignObject>
  );
};

export default SimpleGanttContextMenu;
