import React from 'react';
import { AlertCircle, ChevronDown, ChevronRight, CalendarOff, Eye, EyeOff } from 'lucide-react';

const TaskRow = ({ task, user, columnWidth, columnWidths, isExcluded, onToggleExclusion, t }) => (
  <tr className={`hover:bg-blue-50 ${isExcluded ? 'bg-gray-50' : 'bg-white'}`}>
    <td className={`border border-gray-300 px-3 py-1 pl-6 sticky left-0 z-10 w-[215px] min-w-[215px] max-w-[215px] ${isExcluded ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-center gap-1.5 text-xs text-gray-700 overflow-hidden">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExclusion(task.task_id);
          }}
          className={`p-0.5 rounded transition-colors shrink-0 ${
            isExcluded
              ? 'text-gray-400 hover:text-gray-600'
              : 'text-green-600 hover:text-green-700'
          }`}
          title={isExcluded ? t('ganttIncludeInFte') : t('ganttExcludeFromFte')}
        >
          {isExcluded ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <div
          className={`font-medium truncate ${isExcluded ? 'line-through text-gray-400' : ''}`}
          title={`${task.project_key} - ${task.task_title} (${task.client_name})`}
        >
          {task.project_key} - {task.task_title}
        </div>
      </div>
    </td>

    <td className="border border-gray-300 px-1.5 py-1 bg-white w-[110px] min-w-[110px] max-w-[110px]" style={{ left: '215px', position: 'sticky', zIndex: 10 }}>
      {task.allocation_percentage > 0 ? (
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-xs font-semibold whitespace-nowrap text-gray-700">
            {task.allocation_percentage.toFixed(0)}%
          </span>
          <div className="w-14 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                task.allocation_percentage > 100
                  ? "bg-red-500"
                  : task.allocation_percentage >= 70
                  ? "bg-orange-400"
                  : "bg-green-500"
              }`}
              style={{
                width: `${Math.min(task.allocation_percentage, 100)}%`,
              }}
            ></div>
          </div>
        </div>
      ) : (
        <span className="text-xs text-gray-300">-</span>
      )}
    </td>

    {task.periodFTE.map((taskFte, periodIdx) => {
      const taskPlannedHours = task.periodPlannedHours[periodIdx];
      const availableHours = user.periodAvailableHours[periodIdx];
      const isNonWorkingPeriod = availableHours === 0;

      let bgColor = 'bg-white';
      if (isNonWorkingPeriod) {
        bgColor = 'bg-gray-50';
      } else if (taskFte > 0) {
        if (taskFte > 1) {
          bgColor = 'bg-red-50 text-red-700';
        } else if (taskFte >= 0.7) {
          bgColor = 'bg-orange-50 text-orange-700';
        } else {
          bgColor = 'bg-green-50 text-green-700';
        }
      }

      const colWidth = columnWidths[periodIdx] || columnWidth;

      return (
        <td
          key={periodIdx}
          className={`border border-gray-300 px-1 py-1 text-center text-xs ${bgColor}`}
          style={{ width: `${colWidth}px`, minWidth: `${colWidth}px`, maxWidth: `${colWidth}px` }}
          title={!isNonWorkingPeriod && taskPlannedHours > 0 ? `${taskPlannedHours.toFixed(1)} ${t('ganttHoursUnit')}` : ''}
        >
          {isNonWorkingPeriod ? (
            <span className="text-gray-400">-</span>
          ) : taskFte > 0 ? (
            <span className="text-[11px]">{taskFte.toFixed(2)}</span>
          ) : (
            <span className="text-gray-300">-</span>
          )}
        </td>
      );
    })}
  </tr>
);

const GanttChart = ({ userAllocations, columnWidth, columnWidths = [], expandedUsers, onToggleUser, onTooltipHover, onTooltipLeave, excludedTasks = {}, onToggleTaskExclusion, t }) => {
  return (
    <tbody>
      {userAllocations.map((user) => {
        const isExpanded = expandedUsers[user.user_id] || false;
        const visibleTasks = user.tasks && user.tasks.length > 0
          ? user.tasks.filter(task => task.periodFTE.some(fte => fte > 0))
          : [];
        const hasTasks = visibleTasks.length > 0;

        const planningTasks = visibleTasks.filter(task => task.project_type_id !== 'TM');
        const tmTasks = visibleTasks.filter(task => task.project_type_id === 'TM');
        const hasBothTypes = planningTasks.length > 0 && tmTasks.length > 0;

        return (
          <React.Fragment key={user.user_id}>
            <tr className="hover:bg-gray-50 bg-gray-100">
              <td className="border border-gray-300 px-3 py-1 sticky left-0 bg-gray-100 z-10 w-[215px] min-w-[215px] max-w-[215px]">
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  {hasTasks && (
                    <button
                      onClick={() => onToggleUser(user.user_id)}
                      className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                      title={isExpanded ? t('ganttCollapse') : t('ganttExpand')}
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-gray-600" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-600" />
                      )}
                    </button>
                  )}
                  {!hasTasks && <div className="w-5" />}
                  <div className="font-medium text-sm truncate flex-1 min-w-0">
                    {user.user_name}
                  </div>
                </div>
              </td>

              <td className="border border-gray-300 px-1.5 py-1 bg-gray-100 w-[110px] min-w-[110px] max-w-[110px]" style={{ left: '215px', position: 'sticky', zIndex: 10 }}>
                {user.allocation_percentage > 0 ? (
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-bold whitespace-nowrap">
                      {user.allocation_percentage.toFixed(0)}%
                    </span>
                    <div className="w-14 h-3 bg-gray-300 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          user.allocation_percentage > 100
                            ? "bg-red-600"
                            : user.allocation_percentage >= 70
                            ? "bg-orange-500"
                            : "bg-green-600"
                        }`}
                        style={{
                          width: `${Math.min(user.allocation_percentage, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs">-</span>
                )}
              </td>

              {user.periodFTE.map((fte, periodIdx) => {
                const plannedHours = user.periodPlannedHours[periodIdx];
                const availableHours = user.periodAvailableHours[periodIdx];
                const timeOffTypes = user.periodTimeOffTypes[periodIdx];
                const unspreadETC = user.periodUnspreadETC?.[periodIdx] || 0;
                const hasTimeOff = timeOffTypes && timeOffTypes.size > 0;

                const isNonWorkingPeriod = availableHours === 0;

                let bgColor = 'bg-gray-100';

                if (isNonWorkingPeriod) {
                  bgColor = 'bg-gray-200';
                } else if (unspreadETC > 0) {
                  bgColor = 'bg-red-100 text-red-700 font-bold';
                } else if (fte > 0) {
                  if (fte > 1) {
                    bgColor = 'bg-red-100 text-red-700 font-bold';
                  }
                  else if (fte >= 0.7) {
                    bgColor = 'bg-orange-100 text-orange-700';
                  }
                  else {
                    bgColor = 'bg-green-100 text-green-700';
                  }
                }
                else if (hasTimeOff) {
                  bgColor = 'bg-gray-100';
                }

                const colWidth = columnWidths[periodIdx] || columnWidth;

                return (
                  <td
                    key={periodIdx}
                    className={`border border-gray-300 px-1 py-1 text-center text-xs ${bgColor} ${!isNonWorkingPeriod ? 'cursor-pointer' : ''}`}
                    style={{ width: `${colWidth}px`, minWidth: `${colWidth}px`, maxWidth: `${colWidth}px` }}
                    onMouseEnter={!isNonWorkingPeriod ? (e) => onTooltipHover(e, user.user_id, periodIdx) : undefined}
                    onMouseLeave={!isNonWorkingPeriod ? onTooltipLeave : undefined}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {isNonWorkingPeriod ? (
                        hasTimeOff ? (
                          <CalendarOff size={16} className="text-gray-600" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )
                      ) : fte > 0 ? (
                        <>
                          <span className="font-semibold">{fte.toFixed(2)}</span>
                          {hasTimeOff && <CalendarOff size={16} className="shrink-0" />}
                        </>
                      ) : unspreadETC > 0 ? (
                        <AlertCircle size={16} className="text-red-600" />
                      ) : hasTimeOff ? (
                        <CalendarOff size={16} className="text-gray-600" />
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {isExpanded && hasBothTypes && (
              <tr className="">
                <td
                  colSpan={2 + user.periodFTE.length}
                  className="border border-gray-300 py-1 px-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t-2 border-dashed border-violet-400"></div>
                    <span className="text-xs font-semibold text-violet-600 px-2">{t('ganttPlannedActivities')}</span>
                    <div className="flex-1 border-t-2 border-dashed border-violet-400"></div>
                  </div>
                </td>
              </tr>
            )}

            {isExpanded && planningTasks.length > 0 && planningTasks.map((task) => (
              <TaskRow key={task.task_id} task={task} user={user} columnWidth={columnWidth} columnWidths={columnWidths} isExcluded={excludedTasks[task.task_id]} onToggleExclusion={onToggleTaskExclusion} t={t} />
            ))}

            {isExpanded && hasBothTypes && (
              <tr className="">
                <td
                  colSpan={2 + user.periodFTE.length}
                  className="border border-gray-300 py-1 px-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t-2 border-dashed border-violet-400"></div>
                    <span className="text-xs font-semibold text-violet-500 px-2">{t('ganttCalendarActivities')}</span>
                    <div className="flex-1 border-t-2 border-dashed border-violet-400"></div>
                  </div>
                </td>
              </tr>
            )}

            {isExpanded && hasTasks && tmTasks.map((task) => (
              <TaskRow key={task.task_id} task={task} user={user} columnWidth={columnWidth} columnWidths={columnWidths} isExcluded={excludedTasks[task.task_id]} onToggleExclusion={onToggleTaskExclusion} t={t} />
            ))}
          </React.Fragment>
        );
      })}
    </tbody>
  );
};

export default GanttChart;
