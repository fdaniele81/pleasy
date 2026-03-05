function TableContainer({
  children,
  maxHeight = 'calc(100vh - 300px)',
  className = '',
  rounded = true,
  shadow = true,
  overflowX = 'auto',
}) {
  const baseClasses = [
    'bg-white',
    `overflow-x-${overflowX}`,
    'overflow-y-auto',
    'overscroll-y-contain',
  ];

  if (rounded) baseClasses.push('rounded-lg');
  if (shadow) baseClasses.push('shadow');
  if (className) baseClasses.push(className);

  return (
    <div
      className={baseClasses.join(' ')}
      style={{ maxHeight }}
    >
      {children}
    </div>
  );
}

export default TableContainer;
