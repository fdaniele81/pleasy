import React, { useMemo } from 'react';
import { isHoliday } from '../../../../utils/date/workingDays';

const dateToLocalString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const GanttUserRow = ({
  hoveredPeriod,
  tooltipPosition,
  fteData,
  allUsersTimeOffs,
  holidays,
  t,
}) => {
  const tooltipContent = useMemo(() => {
    if (!hoveredPeriod) return null;

    const user = fteData.userAllocations.find(u => u.user_id === hoveredPeriod.userId);
    if (!user) return null;

    const periodIdx = hoveredPeriod.periodIdx;
    const availableHours = user.periodAvailableHours[periodIdx];
    const timeOffTypes = user.periodTimeOffTypes[periodIdx];
    const fte = user.periodFTE[periodIdx];
    const plannedHours = user.periodPlannedHours[periodIdx];

    let timeOffHours = 0;
    if (timeOffTypes && timeOffTypes.size > 0) {
      const period = fteData.periods[periodIdx];
      const periodStart = new Date(period.start);
      const periodEnd = new Date(period.end);

      const current = new Date(periodStart);
      while (current <= periodEnd) {
        const dayOfWeek = current.getDay();
        const isHolidayDay = isHoliday(current, holidays);
        const dateKey = dateToLocalString(current);
        const userTimeOffs = allUsersTimeOffs.filter(to => to.user_id === user.user_id);
        const dayTimeOffs = userTimeOffs.filter(to => to.date === dateKey);

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHolidayDay) {
          dayTimeOffs.forEach(timeOff => {
            timeOffHours += timeOff.hours;
          });
        }
        current.setDate(current.getDate() + 1);
      }
    }

    let colorStatus = "green";
    if (fte > 1) {
      colorStatus = "red";
    } else if (fte >= 0.7) {
      colorStatus = "orange";
    }

    return { availableHours, fte, plannedHours, timeOffHours, colorStatus };
  }, [hoveredPeriod, fteData, allUsersTimeOffs, holidays]);

  if (!hoveredPeriod || !tooltipContent) return null;

  const { availableHours, fte, plannedHours, timeOffHours, colorStatus } = tooltipContent;

  return (
    <div
      className={`fixed z-100 px-3 py-2 rounded-lg shadow-lg text-white text-sm font-semibold whitespace-nowrap -translate-y-1/2 ${
        tooltipPosition.isLeft ? '-translate-x-full' : ''
      } ${
        colorStatus === "red"
          ? "bg-red-600"
          : colorStatus === "orange"
          ? "bg-orange-500"
          : "bg-green-600"
      }`}
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span>{t('ganttPlannedHours')}</span>
          <span className="text-base font-bold">
            {plannedHours.toFixed(1)} {t('ganttHoursUnit')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>{t('ganttAvailableHours')}</span>
          <span className="text-base font-bold">
            {availableHours.toFixed(1)} {t('ganttHoursUnit')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>{t('ganttTimeOffHours')}</span>
          <span className="text-base font-bold">
            {timeOffHours.toFixed(1)} {t('ganttHoursUnit')}
          </span>
        </div>

        <div className="border-t border-white/20 pt-2 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap">FTE:</span>
            <span className="text-sm font-bold whitespace-nowrap">
              {fte.toFixed(2)}
            </span>
            <div className="flex-1 h-4 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  fte > 1
                    ? "bg-white"
                    : fte >= 0.8
                    ? "bg-white/90"
                    : "bg-white/80"
                }`}
                style={{
                  width: `${Math.min(fte * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`absolute ${
          tooltipPosition.isLeft ? 'left-full' : 'right-full'
        } top-1/2 -translate-y-1/2 border-8 border-transparent ${
          tooltipPosition.isLeft
            ? colorStatus === "red"
              ? "border-l-red-600"
              : colorStatus === "orange"
              ? "border-l-orange-500"
              : "border-l-green-600"
            : colorStatus === "red"
            ? "border-r-red-600"
            : colorStatus === "orange"
            ? "border-r-orange-500"
            : "border-r-green-600"
        }`}
      ></div>
    </div>
  );
};

export default React.memo(GanttUserRow);
