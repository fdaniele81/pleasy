/**
 * Add N working days to a date (skips weekends: Saturday=6, Sunday=0).
 * Returns a new Date.
 */
export function addWorkingDays(startDate, days) {
  const result = new Date(startDate);
  let remaining = Math.round(days);

  if (remaining <= 0) return result;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      remaining--;
    }
  }

  return result;
}

/**
 * Format a Date as YYYY-MM-DD string.
 */
export function formatDateISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date for display (DD/MM/YYYY).
 */
export function formatDateDisplay(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Assign start_date and end_date to each task row.
 * All tasks span the full project duration (start → start + elapsed).
 *
 * @param {Array} taskRows - Array of task row objects
 * @param {Date|string} startDate - Project start date
 * @param {number} elapsedDays - Total project duration in working days
 * @returns {Array} taskRows with start_date and end_date added
 */
export function calculateTaskDates(taskRows, startDate, elapsedDays) {
  const start = new Date(startDate);
  const endDate = formatDateISO(addWorkingDays(start, elapsedDays - 1));
  const startISO = formatDateISO(start);

  return taskRows.map(task => ({
    ...task,
    start_date: startISO,
    end_date: endDate,
  }));
}
