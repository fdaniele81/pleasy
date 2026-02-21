import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';

function ContextMenu({ x, y, options, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => {
            option.onClick();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-cyan-50 flex items-center gap-2 transition-colors"
        >
          {option.icon && <option.icon size={16} className="text-gray-600" />}
          <span className="text-gray-700">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

ContextMenu.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      icon: PropTypes.elementType,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ContextMenu;
