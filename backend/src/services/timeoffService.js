import timeoffRepository from "../repositories/timeoffRepository.js";
import { serviceError } from "../utils/errorHandler.js";

function isWeekend(dateStr) {
  const dateObj = new Date(dateStr);
  const dayOfWeek = dateObj.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

async function getByDateRange(startDate, endDate, user) {
  if (!startDate || !endDate) {
    throw serviceError("start_date e end_date sono obbligatori", 400);
  }

  const timeOffs = await timeoffRepository.getByUserAndDateRange(
    user.user_id, user.company_id, startDate, endDate
  );

  const historicalTotals = await timeoffRepository.getHistoricalTotals(
    user.user_id, user.company_id
  );

  return {
    timeOffs: timeOffs.map(row => ({
      time_off_id: row.time_off_id,
      time_off_type_id: row.time_off_type_id,
      time_off_type_description: row.time_off_type_description,
      date: row.date,
      hours: parseFloat(row.hours),
      details: row.details,
    })),
    historicalTotals: historicalTotals.map(row => ({
      time_off_type_id: row.time_off_type_id,
      time_off_type_description: row.time_off_type_description,
      total_hours: parseFloat(row.total_hours),
    })),
  };
}

async function save(data, user) {
  const { time_off_type_id, date, hours, details } = data;

  if (!time_off_type_id || !date || hours === undefined) {
    throw serviceError("time_off_type_id, date e hours sono obbligatori", 400);
  }

  if (isWeekend(date)) {
    throw serviceError("Non è possibile inserire ferie/permessi nei weekend", 400);
  }

  const isHoliday = await timeoffRepository.isHoliday(user.company_id, date);
  if (isHoliday) {
    throw serviceError("Non è possibile inserire ferie/permessi nei giorni festivi", 400);
  }

  const typeExists = await timeoffRepository.timeOffTypeExists(time_off_type_id);
  if (!typeExists) {
    throw serviceError("Tipo di time off non trovato", 404);
  }

  if (hours === 0) {
    await timeoffRepository.deleteByUserTypeAndDate(
      user.user_id, user.company_id, time_off_type_id, date
    );
    return null;
  }

  const existing = await timeoffRepository.getExisting(
    user.user_id, user.company_id, time_off_type_id, date
  );

  let result;
  if (existing) {
    result = await timeoffRepository.update(
      user.user_id, user.company_id, time_off_type_id, date, hours, details
    );
  } else {
    result = await timeoffRepository.create(
      user.user_id, user.company_id, time_off_type_id, date, hours, details
    );
  }

  return {
    time_off_id: result.time_off_id,
    time_off_type_id: result.time_off_type_id,
    date: result.date,
    hours: parseFloat(result.hours),
    details: result.details,
  };
}

async function remove(timeOffId, user) {
  const result = await timeoffRepository.deleteByIdAndUser(timeOffId, user.user_id);

  if (!result) {
    throw serviceError("Time off non trovato o non autorizzato", 404);
  }

  return result.time_off_id;
}

async function getTypes() {
  return await timeoffRepository.getAllTypes();
}

async function getTotals(startDate, endDate, user) {
  if (!startDate || !endDate) {
    throw serviceError("start_date e end_date sono obbligatori", 400);
  }

  const totals = await timeoffRepository.getTotalsByType(
    user.user_id, user.company_id, startDate, endDate
  );

  return totals.map(row => ({
    time_off_type_id: row.time_off_type_id,
    time_off_type_description: row.time_off_type_description,
    total_hours: parseFloat(row.total_hours),
  }));
}

async function getForCapacityPlanning(startDate, endDate, user) {
  const rows = await timeoffRepository.getForCapacityPlanning(
    user.user_id, user.company_id, startDate, endDate
  );

  const userTimeOffsMap = new Map();

  rows.forEach(row => {
    if (!userTimeOffsMap.has(row.user_id)) {
      userTimeOffsMap.set(row.user_id, {
        user_id: row.user_id,
        full_name: row.full_name,
        time_offs: [],
      });
    }

    userTimeOffsMap.get(row.user_id).time_offs.push({
      time_off_type_id: row.time_off_type_id,
      time_off_type_description: row.time_off_type_description,
      total_hours: parseFloat(row.total_hours),
    });
  });

  return Array.from(userTimeOffsMap.values());
}

async function getGanttDaily(startDate, endDate, user) {
  if (!startDate || !endDate) {
    throw serviceError("start_date e end_date sono obbligatori", 400);
  }

  const rows = await timeoffRepository.getGanttDaily(
    user.user_id, user.company_id, startDate, endDate
  );

  return rows.map(row => ({
    user_id: row.user_id,
    user_name: row.full_name,
    time_off_type_id: row.time_off_type_id,
    date: row.date,
    hours: parseFloat(row.hours),
    details: row.details,
  }));
}

async function getCompanyPlan(startDate, endDate, user) {
  if (!startDate || !endDate) {
    throw serviceError("start_date e end_date sono obbligatori", 400);
  }

  const users = await timeoffRepository.getCompanyUsers(user.company_id);
  const timeOffs = await timeoffRepository.getCompanyTimeOffs(
    user.company_id, startDate, endDate
  );

  const timeOffsByUser = new Map();
  timeOffs.forEach(to => {
    if (!timeOffsByUser.has(to.user_id)) {
      timeOffsByUser.set(to.user_id, []);
    }
    timeOffsByUser.get(to.user_id).push({
      time_off_id: to.time_off_id,
      time_off_type_id: to.time_off_type_id,
      time_off_type_description: to.time_off_type_description,
      date: to.date,
      hours: parseFloat(to.hours),
      details: to.details,
    });
  });

  return users.map(user => ({
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    timeOffs: timeOffsByUser.get(user.user_id) || [],
  }));
}

export {
  getByDateRange,
  save,
  remove,
  getTypes,
  getTotals,
  getForCapacityPlanning,
  getGanttDaily,
  getCompanyPlan,
};

export default {
  getByDateRange,
  save,
  remove,
  getTypes,
  getTotals,
  getForCapacityPlanning,
  getGanttDaily,
  getCompanyPlan,
};
