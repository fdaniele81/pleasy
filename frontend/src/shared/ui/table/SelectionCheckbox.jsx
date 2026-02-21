function SelectionCheckbox({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
  ariaLabel,
}) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  const baseClasses = [
    sizeClasses[size],
    'cursor-pointer',
    'accent-cyan-600',
  ];

  if (disabled) {
    baseClasses.push('cursor-not-allowed opacity-50');
  }

  if (className) baseClasses.push(className);

  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) {
          el.indeterminate = indeterminate;
        }
      }}
      onChange={onChange}
      disabled={disabled}
      className={baseClasses.join(' ')}
      aria-label={ariaLabel}
    />
  );
}

export default SelectionCheckbox;
