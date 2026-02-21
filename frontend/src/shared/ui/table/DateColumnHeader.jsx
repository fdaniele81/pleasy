import { useLocale } from '../../../hooks/useLocale';

function DateColumnHeader({
  date,
  isWeekend = false,
  isHoliday = false,
  isToday = false,
  holidayName = '',
  showMonth = false,
  variant = 'normal',
  className = '',
  onClick,
}) {
  const locale = useLocale();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const weekDay = date.toLocaleDateString(locale, { weekday: 'short' });

  const getBgClass = () => {
    if (isToday) return 'bg-cyan-500 text-white';
    if (isWeekend || isHoliday) return 'bg-gray-500';
    return 'bg-cyan-700';
  };

  const baseClasses = [
    'border-t border-r border-gray-300',
    'px-1 py-3',
    'text-center font-semibold',
    'text-white',
    getBgClass(),
  ];

  if (variant === 'compact') {
    baseClasses.push('min-w-[45px] w-12');
  } else {
    baseClasses.push('min-w-[52px]');
  }

  if (onClick) {
    baseClasses.push('cursor-pointer hover:opacity-90 transition-opacity');
  }

  if (className) baseClasses.push(className);

  return (
    <th
      className={baseClasses.join(' ')}
      title={holidayName || undefined}
      onClick={onClick}
    >
      <div className="text-xs font-semibold">{day}/{month}</div>
      <div className="text-[10px]">{weekDay}</div>
    </th>
  );
}

export default DateColumnHeader;
