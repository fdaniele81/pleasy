import { useTranslation } from 'react-i18next';

function NoteIndicator({
  note,
  onMouseEnter,
  onMouseLeave,
  position = 'topRight',
  color = 'blue',
  className = '',
}) {
  if (!note) return null;

  const colorClasses = {
    blue: 'border-t-blue-500 border-r-blue-500',
    cyan: 'border-t-cyan-500 border-r-cyan-500',
    orange: 'border-t-orange-500 border-r-orange-500',
  };

  const positionClasses = {
    topRight: 'top-0 right-0',
    topLeft: 'top-0 left-0',
    bottomRight: 'bottom-0 right-0',
    bottomLeft: 'bottom-0 left-0',
  };

  const triangleStyle = {
    borderWidth: '6px',
    borderStyle: 'solid',
    borderColor: 'transparent',
  };

  if (position === 'topRight') {
    triangleStyle.borderTopColor = color === 'blue' ? '#3b82f6' : color === 'cyan' ? '#06b6d4' : '#f97316';
    triangleStyle.borderRightColor = color === 'blue' ? '#3b82f6' : color === 'cyan' ? '#06b6d4' : '#f97316';
  }

  const baseClasses = [
    'absolute',
    positionClasses[position],
    'cursor-pointer',
    'z-10',
  ];

  if (className) baseClasses.push(className);

  return (
    <div
      className={baseClasses.join(' ')}
      style={triangleStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={note.length > 50 ? note.substring(0, 50) + '...' : note}
    />
  );
}

function NoteTooltip({
  note,
  position = { x: 0, y: 0 },
  visible = false,
  className = '',
}) {
  const { t } = useTranslation(['common']);
  if (!visible || !note) return null;

  const baseClasses = [
    'fixed',
    'px-3 py-2',
    'rounded-lg shadow-2xl',
    'bg-gray-800 text-white',
    'text-xs whitespace-pre-wrap',
    'max-w-md',
    'border border-gray-700',
    'z-[9999]',
  ];

  if (className) baseClasses.push(className);

  return (
    <div
      className={baseClasses.join(' ')}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, calc(-100% - 8px))',
      }}
    >
      <div className="font-semibold mb-1">{t('common:notes')}</div>
      <div>{note}</div>
      <div
        className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-gray-800"
      />
    </div>
  );
}

NoteIndicator.Tooltip = NoteTooltip;

export default NoteIndicator;
