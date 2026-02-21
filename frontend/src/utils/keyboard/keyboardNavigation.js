export const KEYS = {
  ENTER: 'Enter',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
};

export const NAVIGATION_DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

const ARROW_KEY_TO_DIRECTION = {
  [KEYS.ARROW_UP]: NAVIGATION_DIRECTIONS.UP,
  [KEYS.ARROW_DOWN]: NAVIGATION_DIRECTIONS.DOWN,
  [KEYS.ARROW_LEFT]: NAVIGATION_DIRECTIONS.LEFT,
  [KEYS.ARROW_RIGHT]: NAVIGATION_DIRECTIONS.RIGHT,
};

export function isArrowKey(key) {
  return [
    KEYS.ARROW_UP,
    KEYS.ARROW_DOWN,
    KEYS.ARROW_LEFT,
    KEYS.ARROW_RIGHT,
  ].includes(key);
}

export function getDirectionFromArrowKey(arrowKey) {
  return ARROW_KEY_TO_DIRECTION[arrowKey];
}

export function getTabDirection(shiftKey) {
  return shiftKey ? NAVIGATION_DIRECTIONS.LEFT : NAVIGATION_DIRECTIONS.RIGHT;
}

export function getKeyboardAction(event) {
  const { key, shiftKey } = event;

  if (key === KEYS.ENTER) {
    return {
      action: 'navigate',
      direction: NAVIGATION_DIRECTIONS.DOWN,
    };
  }

  if (key === KEYS.TAB) {
    return {
      action: 'navigate',
      direction: getTabDirection(shiftKey),
      isTab: true,
    };
  }

  if (isArrowKey(key)) {
    return {
      action: 'navigate',
      direction: getDirectionFromArrowKey(key),
    };
  }

  if (key === KEYS.ESCAPE) {
    return {
      action: 'cancel',
    };
  }

  return {
    action: 'none',
  };
}

export function getNextGridCell({
  currentRow,
  currentCol,
  direction,
  totalRows,
  totalCols,
  isCellNavigable = () => true,
}) {
  let nextRow = currentRow;
  let nextCol = currentCol;

  switch (direction) {
    case NAVIGATION_DIRECTIONS.UP:
      nextRow = currentRow - 1;
      break;
    case NAVIGATION_DIRECTIONS.DOWN:
      nextRow = currentRow + 1;
      break;
    case NAVIGATION_DIRECTIONS.LEFT:
      nextCol = currentCol - 1;
      break;
    case NAVIGATION_DIRECTIONS.RIGHT:
      nextCol = currentCol + 1;
      break;
    default:
      return null;
  }

  if (nextRow < 0 || nextRow >= totalRows || nextCol < 0 || nextCol >= totalCols) {
    return null;
  }

  if (!isCellNavigable(nextRow, nextCol)) {
    return null;
  }

  return { row: nextRow, col: nextCol };
}

export function getNextListIndex({
  currentIndex,
  direction,
  totalItems,
  isItemNavigable = () => true,
}) {
  let nextIndex = currentIndex;

  if (direction === NAVIGATION_DIRECTIONS.UP || direction === NAVIGATION_DIRECTIONS.LEFT) {
    nextIndex = currentIndex - 1;
  } else if (direction === NAVIGATION_DIRECTIONS.DOWN || direction === NAVIGATION_DIRECTIONS.RIGHT) {
    nextIndex = currentIndex + 1;
  } else {
    return null;
  }

  if (nextIndex < 0 || nextIndex >= totalItems) {
    return null;
  }

  if (!isItemNavigable(nextIndex)) {
    return null;
  }

  return nextIndex;
}

export function preventNavigationDefault(event) {
  const { key } = event;

  if (
    key === KEYS.ENTER ||
    key === KEYS.TAB ||
    key === KEYS.ESCAPE ||
    isArrowKey(key)
  ) {
    event.preventDefault();
    return true;
  }

  return false;
}
