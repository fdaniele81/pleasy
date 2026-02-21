import { useRef, useEffect } from 'react';

function EditableCell({
  value,
  isEditing = false,
  editValue = '',
  onEditValueChange,
  onClick,
  onBlur,
  onKeyDown,
  inputType = 'number',
  step = 0.5,
  min = 0,
  max = 24,
  isLocked = false,
  lockedClassName = 'text-blue-600',
  displayClassName = '',
  inputClassName = '',
  emptyDisplay = '-',
  formatValue,
  className = '',
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const displayValue = () => {
    if (value === null || value === undefined || value === '' || value === 0) {
      return emptyDisplay;
    }
    if (formatValue) {
      return formatValue(value);
    }
    if (typeof value === 'number') {
      return value.toFixed(1);
    }
    return value;
  };

  const isEmpty = value === null || value === undefined || value === '' || value === 0;

  if (isEditing) {
    const inputBaseClasses = [
      'w-full h-full',
      'px-0.5 py-0.5',
      'text-center text-xs',
      'border border-cyan-500 rounded',
      'focus:outline-none focus:ring-1 focus:ring-cyan-500',
      '[appearance:textfield]',
      '[&::-webkit-outer-spin-button]:appearance-none',
      '[&::-webkit-inner-spin-button]:appearance-none',
    ];
    if (inputClassName) inputBaseClasses.push(inputClassName);

    return (
      <input
        ref={inputRef}
        type={inputType}
        step={inputType === 'number' ? step : undefined}
        min={inputType === 'number' ? min : undefined}
        max={inputType === 'number' ? max : undefined}
        value={editValue}
        onChange={(e) => onEditValueChange?.(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onWheel={(e) => e.target.blur()}
        className={inputBaseClasses.join(' ')}
      />
    );
  }

  const displayBaseClasses = [
    'text-xs',
    isEmpty ? 'text-gray-400' : 'font-semibold',
    isLocked ? lockedClassName : '',
  ];
  if (displayClassName) displayBaseClasses.push(displayClassName);

  const containerClasses = [
    'flex items-center justify-center',
    className,
  ];

  return (
    <div
      className={containerClasses.join(' ')}
      onClick={!isLocked ? onClick : undefined}
    >
      <span className={displayBaseClasses.join(' ')}>
        {displayValue()}
      </span>
    </div>
  );
}

export default EditableCell;
