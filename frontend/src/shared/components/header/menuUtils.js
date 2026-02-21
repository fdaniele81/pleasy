const BASE_CLASSES = 'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center gap-2';
const ACTIVE_CLASSES = 'bg-blue-100 text-blue-700';
const INACTIVE_CLASSES = 'text-gray-700 hover:text-gray-900 hover:bg-gray-100';

export const getMenuLinkClasses = (isActive) => {
  return `${BASE_CLASSES} ${isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES}`;
};

export const DROPDOWN_ITEM_CLASSES = 'flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors';

export const DROPDOWN_CONTAINER_CLASSES = 'absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50';
