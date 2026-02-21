import taskRepository from "../repositories/taskRepository.js";

function buildHolidaysSet(holidaysData) {
  const holidays = new Set();
  holidaysData.forEach((h) => {
    if (h.is_recurring) {
      holidays.add(`recurring-${h.date.getMonth()}-${h.date.getDate()}`);
    } else {
      const d = h.date;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      holidays.add(dateKey);
    }
  });
  return holidays;
}

function buildTimeOffsMap(timeOffsData) {
  const timeOffsByUser = new Map();
  timeOffsData.forEach((to) => {
    if (!timeOffsByUser.has(to.user_id)) {
      timeOffsByUser.set(to.user_id, new Map());
    }
    const d = to.date;
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    timeOffsByUser.get(to.user_id).set(dateKey, parseFloat(to.hours));
  });
  return timeOffsByUser;
}

function buildTMDailyHoursMap(tmDailyHours) {
  const tmDailyHoursMap = new Map();
  tmDailyHours.forEach((row) => {
    if (!tmDailyHoursMap.has(row.task_id)) {
      tmDailyHoursMap.set(row.task_id, new Map());
    }
    const d = row.timesheet_date;
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const existingHours = tmDailyHoursMap.get(row.task_id).get(dateKey) || 0;
    tmDailyHoursMap.get(row.task_id).set(dateKey, existingHours + parseFloat(row.total_hours));
  });
  return tmDailyHoursMap;
}

function createIntervals(startDate, numIntervals, daysPerInterval) {
  const intervals = [];
  for (let i = 0; i < numIntervals; i++) {
    const intervalStart = new Date(startDate);
    intervalStart.setDate(intervalStart.getDate() + i * daysPerInterval);
    intervalStart.setHours(0, 0, 0, 0);

    const intervalEnd = new Date(startDate);
    intervalEnd.setDate(intervalEnd.getDate() + (i + 1) * daysPerInterval - 1);
    intervalEnd.setHours(23, 59, 59, 999);

    intervals.push({
      interval_number: i + 1,
      start_date: new Date(intervalStart),
      end_date: new Date(intervalEnd),
    });
  }
  return intervals;
}

function buildDailyHoursCache(startDate, endDate, holidays) {
  const HOURS_PER_DAY = 8;
  const dailyBaseHours = new Map();
  const allDays = [];

  const rangeStart = new Date(startDate);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(endDate);
  rangeEnd.setHours(23, 59, 59, 999);

  const current = new Date(rangeStart);
  while (current <= rangeEnd) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;
    const dayOfWeek = current.getDay();
    const recurringKey = `recurring-${current.getMonth()}-${current.getDate()}`;

    let baseHours = 0;
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const isHoliday = holidays.has(dateKey) || holidays.has(recurringKey);
      if (!isHoliday) {
        baseHours = HOURS_PER_DAY;
      }
    }

    dailyBaseHours.set(dateKey, baseHours);
    allDays.push({ dateKey, timestamp: current.getTime() });
    current.setDate(current.getDate() + 1);
  }

  const timestampToIndex = new Map();
  allDays.forEach((day, idx) => {
    timestampToIndex.set(day.timestamp, idx);
  });

  return { dailyBaseHours, allDays, timestampToIndex };
}

function buildOwnerCumulative(allDays, dailyBaseHours, userTimeOffs) {
  const cumulative = [0];
  let sum = 0;

  for (const { dateKey } of allDays) {
    const baseHours = dailyBaseHours.get(dateKey);
    const timeOffHours = userTimeOffs.get(dateKey) || 0;
    sum += Math.max(0, baseHours - timeOffHours);
    cumulative.push(sum);
  }

  return cumulative;
}

function calculateAvailableHoursFallback(start, end, holidays, userTimeOffs) {
  const HOURS_PER_DAY = 8;
  let totalHours = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;
    const recurringKey = `recurring-${current.getMonth()}-${current.getDate()}`;

    let dayHours = 0;
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const isHoliday = holidays.has(dateKey) || holidays.has(recurringKey);
      if (!isHoliday) {
        dayHours = HOURS_PER_DAY;
        const timeOffHours = userTimeOffs.get(dateKey) || 0;
        dayHours = Math.max(0, dayHours - timeOffHours);
      }
    }

    totalHours += dayHours;
    current.setDate(current.getDate() + 1);
  }

  return totalHours;
}

function getOverlap(start1, end1, start2, end2) {
  const maxStart = start1 > start2 ? start1 : start2;
  const minEnd = end1 < end2 ? end1 : end2;

  if (maxStart > minEnd) {
    return null;
  }

  return { start: maxStart, end: minEnd };
}

function calculateTMHoursForRange(taskDailyHours, start, end) {
  if (!taskDailyHours) return 0;

  let totalHours = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;

    const hours = taskDailyHours.get(dateKey);
    if (hours) {
      totalHours += hours;
    }
    current.setDate(current.getDate() + 1);
  }

  return totalHours;
}

async function getFTEReport(startDate, endDate, diffDays, user, etcReferenceDate = null) {
  const companyId = user.company_id;
  const numIntervals = 14;
  const daysPerInterval = diffDays / numIntervals;

  const intervals = createIntervals(startDate, numIntervals, daysPerInterval);

  const [tasks, holidaysData, timeOffsData] = await Promise.all([
    taskRepository.getFTEReportTasks(companyId, startDate, endDate),
    taskRepository.getHolidays(companyId),
    taskRepository.getTimeOffs(companyId),
  ]);

  const tmTaskIds = tasks.filter((t) => t.project_type_id === "TM").map((t) => t.task_id);

  let tmDailyHoursMap = new Map();
  if (tmTaskIds.length > 0) {
    const tmDailyHours = await taskRepository.getTMTaskDailyHours(tmTaskIds, startDate, endDate);
    tmDailyHoursMap = buildTMDailyHoursMap(tmDailyHours);
  }

  const holidays = buildHolidaysSet(holidaysData);
  const timeOffsByUser = buildTimeOffsMap(timeOffsData);
  const { dailyBaseHours, allDays, timestampToIndex } = buildDailyHoursCache(startDate, endDate, holidays);

  const ownerCumulativeHours = new Map();
  const getOwnerCumulative = (ownerId) => {
    if (ownerCumulativeHours.has(ownerId)) {
      return ownerCumulativeHours.get(ownerId);
    }

    const userTimeOffs = timeOffsByUser.get(ownerId) || new Map();
    const cumulative = buildOwnerCumulative(allDays, dailyBaseHours, userTimeOffs);
    ownerCumulativeHours.set(ownerId, cumulative);
    return cumulative;
  };

  const calculateAvailableHours = (start, end, ownerId) => {
    const startTime = new Date(start);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(end);
    endTime.setHours(0, 0, 0, 0);

    const startIdx = timestampToIndex.get(startTime.getTime());
    const endIdx = timestampToIndex.get(endTime.getTime());

    if (startIdx === undefined || endIdx === undefined) {
      const userTimeOffs = timeOffsByUser.get(ownerId) || new Map();
      return calculateAvailableHoursFallback(start, end, holidays, userTimeOffs);
    }

    const cumulative = getOwnerCumulative(ownerId);
    return cumulative[endIdx + 1] - cumulative[startIdx];
  };

  const today = etcReferenceDate ? new Date(etcReferenceDate) : new Date();
  today.setHours(0, 0, 0, 0);

  const fteReport = [];

  tasks.forEach((task) => {
    const etc = parseFloat(task.etc_hours) || 0;
    const isTMTask = task.project_type_id === "TM";

    const taskStartDate = new Date(task.start_date);
    taskStartDate.setHours(0, 0, 0, 0);
    const taskEndDate = new Date(task.end_date);
    taskEndDate.setHours(23, 59, 59, 999);

    const effectiveStartDate = taskStartDate < today ? today : taskStartDate;

    let taskFTE = 0;
    if (isTMTask) {
      taskFTE = null;
    } else {
      const totalTaskAvailableHours = calculateAvailableHours(effectiveStartDate, taskEndDate, task.owner_id);
      taskFTE = totalTaskAvailableHours > 0 ? etc / totalTaskAvailableHours : 0;
    }

    const intervalData = intervals.map((interval) => {
      const overlap = getOverlap(effectiveStartDate, taskEndDate, interval.start_date, interval.end_date);
      const intervalAvailableHours = calculateAvailableHours(interval.start_date, interval.end_date, task.owner_id);

      if (!overlap) {
        return {
          interval_number: interval.interval_number,
          interval_start_date: interval.start_date,
          interval_end_date: interval.end_date,
          planned_hours: 0,
          available_hours: Math.round(intervalAvailableHours * 100) / 100,
          fte: 0,
        };
      }

      let plannedHours;
      let fte;

      if (isTMTask) {
        const taskDailyHours = tmDailyHoursMap.get(task.task_id);
        plannedHours = calculateTMHoursForRange(taskDailyHours, interval.start_date, interval.end_date);
        fte = intervalAvailableHours > 0 ? plannedHours / intervalAvailableHours : 0;
      } else {
        const overlapAvailableHours = calculateAvailableHours(overlap.start, overlap.end, task.owner_id);
        plannedHours = taskFTE * overlapAvailableHours;
        fte = intervalAvailableHours > 0 ? plannedHours / intervalAvailableHours : 0;
      }

      return {
        interval_number: interval.interval_number,
        interval_start_date: interval.start_date,
        interval_end_date: interval.end_date,
        planned_hours: Math.round(plannedHours * 100) / 100,
        available_hours: Math.round(intervalAvailableHours * 100) / 100,
        fte: Math.round(fte * 1000) / 1000,
      };
    });

    let totalWeightedFte = 0;
    let totalAvailableHours = 0;

    intervalData.forEach((interval) => {
      if (interval.interval_start_date >= today) {
        totalWeightedFte += interval.fte * interval.available_hours;
        totalAvailableHours += interval.available_hours;
      }
    });

    const allocationPercentage = totalAvailableHours > 0 ? (totalWeightedFte / totalAvailableHours) * 100 : 0;

    fteReport.push({
      task_id: task.task_id,
      task_number: task.task_number,
      task_title: task.task_title,
      project_key: task.project_key,
      project_title: task.project_title,
      project_type_id: task.project_type_id,
      client_name: task.client_name,
      owner_id: task.owner_id,
      owner_name: task.owner_name,
      owner_email: task.owner_email,
      task_start_date: task.start_date,
      task_end_date: task.end_date,
      etc_hours: etc,
      allocation_percentage: Math.round(allocationPercentage * 100) / 100,
      intervals: intervalData,
    });
  });

  return {
    period: {
      start_date: startDate,
      end_date: endDate,
      total_days: diffDays,
      num_intervals: numIntervals,
      days_per_interval: daysPerInterval,
      etc_reference_date: today,
    },
    intervals: intervals.map((i) => ({
      interval_number: i.interval_number,
      start_date: i.start_date,
      end_date: i.end_date,
    })),
    tasks: fteReport,
    total_tasks: fteReport.length,
  };
}

export {
  getFTEReport,
};

export default {
  getFTEReport,
};
