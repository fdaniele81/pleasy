import { useState, useEffect, useCallback, useRef } from 'react';

function useDropdownManager() {
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const dropdownRefs = useRef({});
  const buttonRefs = useRef({});

  const getDropdownRef = useCallback((dropdownId) => {
    if (!dropdownRefs.current[dropdownId]) {
      dropdownRefs.current[dropdownId] = { current: null };
    }
    return (el) => {
      dropdownRefs.current[dropdownId].current = el;
    };
  }, []);

  const closeAllDropdowns = useCallback(() => {
    setOpenDropdownId(null);
  }, []);

  const toggleDropdown = useCallback((dropdownId) => {
    setOpenDropdownId((current) => current === dropdownId ? null : dropdownId);
  }, []);

  const isDropdownOpen = useCallback((dropdownId) => {
    return openDropdownId === dropdownId;
  }, [openDropdownId]);

  const openDropdown = useCallback((dropdownId) => {
    setOpenDropdownId(dropdownId);
  }, []);

  const closeDropdown = useCallback((dropdownId) => {
    setOpenDropdownId((current) => current === dropdownId ? null : current);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!openDropdownId) return;

      const dropdownRef = dropdownRefs.current[openDropdownId];
      const dropdownEl = dropdownRef?.current;

      if (dropdownEl && dropdownEl.contains(event.target)) {
        return;
      }

      const clickedButton = event.target.closest('button');
      if (clickedButton) {
        return;
      }

      closeAllDropdowns();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId, closeAllDropdowns]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && openDropdownId) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openDropdownId, closeAllDropdowns]);

  return {
    toggleDropdown,
    isDropdownOpen,
    getDropdownRef,
    closeAllDropdowns,
    closeDropdown,
    openDropdown,
  };
}

export default useDropdownManager;
