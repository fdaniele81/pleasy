import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { ExpandCollapseButton } from "../../../shared/ui/table";
import TMPlanningCell from "./TMPlanningCell";

const TMPlanningClientGroupRows = memo(function TMPlanningClientGroupRows({
  filteredClients,
  expandedClients,
  dateRange,
  searchTerm,
  getDateInfo,
  getClientTotal,
  getClientDayTotal,
  toggleClientExpanded,
  hoursEditCell,
  onCellClick,
  onCellBlur,
  onKeyDown,
  onCellContextMenu,
  onCellNoteClick,
  onNoteTooltipHover,
  onNoteTooltipLeave,
  onTaskHistoryClick,
}) {
  const { t } = useTranslation(['tmplanning', 'timesheet']);

  if (filteredClients.length === 0) {
    return (
      <tr>
        <td colSpan={dateRange.length + 3} className="px-4 py-8 text-center text-gray-500">
          {searchTerm ? t('tmplanning:noClientFound') : t('tmplanning:noTMClient')}
        </td>
      </tr>
    );
  }

  return filteredClients.map((client) => {
    const isExpanded = expandedClients[client.client_id] === true;
    const clientTotal = getClientTotal(client);

    return (
      <React.Fragment key={client.client_id}>
        <tr className="bg-gray-100 group">
          <td
            className="sticky left-0 z-10 px-1 py-2 border-b border-gray-200 cursor-pointer bg-gray-100 group-hover:bg-gray-200"
            onClick={() => toggleClientExpanded(client.client_id)}
          >
            <ExpandCollapseButton isExpanded={isExpanded} color="gray" size="sm" />
          </td>
          <td
            className="sticky z-10 px-2 py-2 border-b border-gray-200 bg-gray-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)] cursor-pointer group-hover:bg-gray-200"
            onClick={() => toggleClientExpanded(client.client_id)}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-5 h-5 min-w-5 min-h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold leading-none"
                style={{
                  backgroundColor: client.symbol_bg_color || client.client_color || '#6366F1',
                  color: client.symbol_letter_color || '#FFFFFF',
                }}
                title={client.client_name}
              >
                {client.symbol_letter || (client.client_name || '?')[0].toUpperCase()}
              </div>
              <span className="font-semibold text-gray-800 text-sm truncate">
                {client.client_name}
              </span>
            </div>
          </td>
          <td className="px-1 py-1 text-center border-b border-r border-gray-200 bg-cyan-50">
            <span className="text-sm font-bold text-cyan-700">
              {clientTotal > 0 ? clientTotal.toFixed(1) : "-"}
            </span>
          </td>
          {dateRange.map((date, idx) => {
            const dayTotal = getClientDayTotal(client, date);
            const dateInfo = getDateInfo(date);
            return (
              <td
                key={idx}
                className={`border-b border-r border-gray-200 px-0 py-1 text-center ${
                  dateInfo.isNonWorking
                    ? "bg-gray-300"
                    : dateInfo.isToday
                    ? "bg-violet-100"
                    : "bg-gray-100"
                }`}
              >
                {dayTotal > 0 ? (
                  <span className="text-xs font-semibold text-gray-700">{dayTotal.toFixed(1)}</span>
                ) : (
                  <span className="text-xs text-gray-300">-</span>
                )}
              </td>
            );
          })}
        </tr>

        {isExpanded &&
          client.users.map((user) => (
            <tr key={`${client.client_id}-${user.user_id}`} className="hover:bg-gray-50">
              <td className="sticky left-0 z-10 px-1 py-1.5 border-b border-gray-200 bg-white" />
              <td className="sticky z-10 px-2 py-1.5 border-b border-gray-200 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)] pl-4">
                <span className="text-sm font-medium text-gray-700 truncate block">
                  {user.full_name}
                </span>
              </td>
              <td className="px-1 py-1 text-center border-b border-r border-gray-200 bg-cyan-50">
                {(() => {
                  const totalWithInitial = (user.initial_actual || 0) + (user.total_hours_all || 0);
                  return (
                    <div className="relative flex items-center justify-center">
                      <span className={`text-[10px] font-medium ${user.initial_actual > 0 ? 'text-amber-700' : 'text-cyan-700'}`} title={user.initial_actual > 0 ? t('tmplanning:includesInitialActual', { hours: user.initial_actual.toFixed(1) }) : undefined}>
                        {totalWithInitial > 0 ? totalWithInitial.toFixed(1) : "-"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskHistoryClick && onTaskHistoryClick({
                            ...user,
                            client_name: client.client_name,
                            client_color: client.client_color,
                          });
                        }}
                        className="absolute right-0 p-0.5 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-cyan-600"
                        title={t('timesheet:taskHistory')}
                      >
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  );
                })()}
              </td>
              {dateRange.map((date, idx) => (
                <TMPlanningCell
                  key={idx}
                  taskId={user.task_id}
                  date={date}
                  dateIdx={idx}
                  timesheets={user.timesheets}
                  dateInfo={getDateInfo(date)}
                  hoursEditCell={hoursEditCell}
                  onCellClick={onCellClick}
                  onCellBlur={onCellBlur}
                  onKeyDown={onKeyDown}
                  onCellContextMenu={onCellContextMenu}
                  onCellNoteClick={onCellNoteClick}
                  onNoteTooltipHover={onNoteTooltipHover}
                  onNoteTooltipLeave={onNoteTooltipLeave}
                  contextClient={{
                    ...user,
                    client_name: client.client_name,
                    client_color: client.client_color,
                  }}
                />
              ))}
            </tr>
          ))}
      </React.Fragment>
    );
  });
});

export default TMPlanningClientGroupRows;
