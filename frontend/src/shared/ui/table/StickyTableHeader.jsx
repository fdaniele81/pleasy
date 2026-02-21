function StickyTableHeader({
  children,
  className = '',
  zIndex = 40,
}) {
  const baseClasses = [
    'bg-cyan-700',
    'text-white',
    'text-xs',
    'sticky top-0',
    'shadow-[0_2px_8px_0_rgba(0,0,0,0.3)]',
  ];

  if (className) baseClasses.push(className);

  return (
    <thead
      className={baseClasses.join(' ')}
      style={{ zIndex }}
    >
      {children}
    </thead>
  );
}

export default StickyTableHeader;
