import { useState, useEffect, useRef } from 'react';

export const useMultipleDropdowns = (dropdownIds) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});

  useEffect(() => {
    dropdownIds.forEach(id => {
      if (!dropdownRefs.current[id]) {
        dropdownRefs.current[id] = null;
      }
    });
  }, [dropdownIds]);

  const toggleDropdown = (dropdownId) => {
    setOpenDropdown(prev => prev === dropdownId ? null : dropdownId);
  };

  const openDropdownById = (dropdownId) => {
    setOpenDropdown(dropdownId);
  };

  const closeAll = () => {
    setOpenDropdown(null);
  };

  const isDropdownOpen = (dropdownId) => {
    return openDropdown === dropdownId;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInside = Object.values(dropdownRefs.current).some(
        ref => ref && ref.contains(event.target)
      );

      if (!clickedInside && openDropdown) {
        closeAll();
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const getDropdownRef = (dropdownId) => {
    return (el) => {
      dropdownRefs.current[dropdownId] = el;
    };
  };

  return {
    openDropdown,
    toggleDropdown,
    openDropdownById,
    closeAll,
    isDropdownOpen,
    getDropdownRef
  };
};
