function TotalsRow({
  children,
  sticky = false,
  stickyTop = 41,
  stickyZIndex = 40,
  variant = 'cyan',
  className = '',
  as: Component = 'tr',
}) {
  const variantClasses = {
    cyan: 'bg-cyan-700 text-white',
    gray: 'bg-gray-100 text-gray-900',
  };

  const baseClasses = [
    variantClasses[variant],
    'font-bold',
    'text-xs',
  ];

  if (sticky) {
    baseClasses.push('sticky');
  }

  if (className) baseClasses.push(className);

  const style = sticky ? { top: `${stickyTop}px`, zIndex: stickyZIndex } : undefined;

  if (Component === 'tfoot') {
    return (
      <tfoot className={baseClasses.join(' ')} style={style}>
        <tr>{children}</tr>
      </tfoot>
    );
  }

  return (
    <tr className={baseClasses.join(' ')} style={style}>
      {children}
    </tr>
  );
}

function TotalsCell({
  children,
  colSpan,
  align = 'center',
  className = '',
  as: Component = 'td',
}) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const baseClasses = [
    'border-t border-b border-r border-white ',
    'px-1 py-2',
    alignClasses[align],
  ];

  if (className) baseClasses.push(className);

  return (
    <Component
      colSpan={colSpan}
      className={baseClasses.join(' ')}
    >
      {children}
    </Component>
  );
}

TotalsRow.Cell = TotalsCell;

export default TotalsRow;
