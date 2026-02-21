import { useMemo, useCallback } from "react";
import { formatDateISO } from "../../../utils/date/dateUtils";

export function useTMPlanningData({
  tmUsers,
  searchTerm,
  selectedUserIds,
  selectedClientIds,
  expandedUsers,
  setExpandedUsers,
  expandedClients,
  setExpandedClients,
  locale,
  startDate,
  endDate,
  daysToShow,
}) {
  const userOptions = useMemo(() => {
    return tmUsers.map((user) => ({
      value: user.user_id,
      label: user.full_name,
    }));
  }, [tmUsers]);

  const clientOptions = useMemo(() => {
    const clientsMap = new Map();
    tmUsers.forEach((user) => {
      user.clients?.forEach((client) => {
        if (!clientsMap.has(client.client_id)) {
          clientsMap.set(client.client_id, {
            value: client.client_id,
            label: client.client_name,
            color: client.client_color,
          });
        }
      });
    });
    return Array.from(clientsMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [tmUsers]);

  const filteredUsers = useMemo(() => {
    let result = tmUsers;

    if (selectedUserIds.length > 0) {
      result = result.filter((user) => selectedUserIds.includes(user.user_id));
    }

    if (selectedClientIds.length > 0) {
      result = result
        .filter((user) =>
          user.clients?.some((client) => selectedClientIds.includes(client.client_id))
        )
        .map((user) => ({
          ...user,
          clients: user.clients.filter((client) =>
            selectedClientIds.includes(client.client_id)
          ),
        }));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(term) ||
          user.clients?.some(
            (client) =>
              client.client_name?.toLowerCase().includes(term) ||
              client.external_key?.toLowerCase().includes(term)
          )
      );
    }

    return result;
  }, [tmUsers, searchTerm, selectedUserIds, selectedClientIds]);

  const filteredClients = useMemo(() => {
    const clientsMap = new Map();

    tmUsers.forEach((user) => {
      if (selectedUserIds.length > 0 && !selectedUserIds.includes(user.user_id)) return;

      user.clients?.forEach((client) => {
        if (selectedClientIds.length > 0 && !selectedClientIds.includes(client.client_id)) return;

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchesUser = user.full_name?.toLowerCase().includes(term);
          const matchesClient =
            client.client_name?.toLowerCase().includes(term) ||
            client.external_key?.toLowerCase().includes(term);
          if (!matchesUser && !matchesClient) return;
        }

        if (!clientsMap.has(client.client_id)) {
          clientsMap.set(client.client_id, {
            client_id: client.client_id,
            client_name: client.client_name,
            client_color: client.client_color,
            users: [],
            total_hours_all: 0,
          });
        }

        const clientData = clientsMap.get(client.client_id);
        clientData.users.push({
          user_id: user.user_id,
          full_name: user.full_name,
          task_id: client.task_id,
          project_id: client.project_id,
          timesheets: client.timesheets,
          total_hours_all: client.total_hours_all || 0,
        });
        clientData.total_hours_all += client.total_hours_all || 0;
      });
    });

    return Array.from(clientsMap.values()).sort((a, b) =>
      a.client_name.localeCompare(b.client_name)
    );
  }, [tmUsers, searchTerm, selectedUserIds, selectedClientIds]);

  const allClients = useMemo(() => {
    return filteredUsers.flatMap((user) =>
      user.clients.map((client) => ({
        ...client,
        user_id: user.user_id,
        user_name: user.full_name,
      }))
    );
  }, [filteredUsers]);

  const toggleUserExpanded = useCallback((userId) => {
    setExpandedUsers((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }, [setExpandedUsers]);

  const isAllUsersExpanded = useMemo(() => {
    return (
      filteredUsers.length > 0 &&
      filteredUsers.every((user) => expandedUsers[user.user_id] === true)
    );
  }, [filteredUsers, expandedUsers]);

  const toggleAllUsers = useCallback(() => {
    if (isAllUsersExpanded) {
      setExpandedUsers({});
    } else {
      const expanded = {};
      filteredUsers.forEach((user) => { expanded[user.user_id] = true; });
      setExpandedUsers(expanded);
    }
  }, [isAllUsersExpanded, filteredUsers, setExpandedUsers]);

  const toggleClientExpanded = useCallback((clientId) => {
    setExpandedClients((prev) => ({ ...prev, [clientId]: !prev[clientId] }));
  }, [setExpandedClients]);

  const isAllClientsExpanded = useMemo(() => {
    return (
      filteredClients.length > 0 &&
      filteredClients.every((client) => expandedClients[client.client_id] === true)
    );
  }, [filteredClients, expandedClients]);

  const toggleAllClients = useCallback(() => {
    if (isAllClientsExpanded) {
      setExpandedClients({});
    } else {
      const expanded = {};
      filteredClients.forEach((client) => { expanded[client.client_id] = true; });
      setExpandedClients(expanded);
    }
  }, [isAllClientsExpanded, filteredClients, setExpandedClients]);

  const getHoursForDate = useCallback((timesheets, date) => {
    const dateStr = formatDateISO(date);
    const ts = timesheets.find((t) => t.work_date === dateStr);
    return ts ? ts.hours_worked : null;
  }, []);

  const getTimesheetForDate = useCallback((timesheets, date) => {
    const dateStr = formatDateISO(date);
    return timesheets.find((t) => t.work_date === dateStr);
  }, []);

  const getClientTotal = useCallback((client) => client.total_hours_all || 0, []);

  const getClientDayTotal = useCallback((client, date) => {
    let dayTotal = 0;
    client.users.forEach((user) => {
      const hours = getHoursForDate(user.timesheets, date);
      if (hours) dayTotal += hours;
    });
    return dayTotal;
  }, [getHoursForDate]);

  const getUserTotal = useCallback((user) => {
    return user.total_hours_all_clients_all || user.clients.reduce(
      (sum, client) => sum + (client.total_hours_all || 0), 0
    );
  }, []);

  const getUserDayTotal = useCallback((user, date) => {
    let dayTotal = 0;
    user.clients.forEach((client) => {
      const hours = getHoursForDate(client.timesheets, date);
      if (hours) dayTotal += hours;
    });
    return dayTotal;
  }, [getHoursForDate]);

  const hasActiveFilters = searchTerm.trim() || selectedUserIds.length > 0 || selectedClientIds.length > 0;

  const getPeriodLabel = useCallback(() => {
    if (!startDate || !endDate) return "";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const formatOptions = { day: "numeric", month: "short" };
    const startStr = start.toLocaleDateString(locale, formatOptions);
    const endStr = end.toLocaleDateString(locale, { ...formatOptions, year: "numeric" });
    return `${startStr} - ${endStr}`;
  }, [startDate, endDate, locale]);

  const formatDateHeader = useCallback((date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const weekday = date.toLocaleDateString(locale, { weekday: "short" });
    return { dayMonth: `${day}/${month}`, weekday };
  }, [locale]);

  return {
    userOptions,
    clientOptions,
    filteredUsers,
    filteredClients,
    allClients,
    toggleUserExpanded,
    isAllUsersExpanded,
    toggleAllUsers,
    toggleClientExpanded,
    isAllClientsExpanded,
    toggleAllClients,
    getHoursForDate,
    getTimesheetForDate,
    getClientTotal,
    getClientDayTotal,
    getUserTotal,
    getUserDayTotal,
    hasActiveFilters,
    getPeriodLabel,
    formatDateHeader,
  };
}

export default useTMPlanningData;
