function DateCell({
  children,
  isWeekend = false,
  isHoliday = false,
  isToday = false,
  isLocked = false,
  isSelected = false,
  isEditing = false,
  className = '',
  onClick,
  onContextMenu,
  as: Component = 'td',
}) {
  const getBgClass = () => {
    if (isSelected) return 'bg-cyan-200';
    if (isLocked) return 'bg-cyan-50';
    if (isToday) return 'bg-yellow-50';
    if (isWeekend || isHoliday) return 'bg-gray-100';
    return '';
  };

  const baseClasses = [
    'border-b border-r border-gray-300',
    'px-0.5 py-0.5',
    'text-center',
    getBgClass(),
  ];

  if (isLocked) {
    baseClasses.push('cursor-not-allowed');
  } else if (onClick) {
    baseClasses.push('cursor-pointer hover:bg-cyan-50');
  }

  if (className) baseClasses.push(className);

  return (
    <Component
      className={baseClasses.join(' ')}
      onClick={!isLocked ? onClick : undefined}
      onContextMenu={onContextMenu}
    >
      {children}
    </Component>
  );
}

export default DateCell;
