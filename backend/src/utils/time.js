/**
 * Time and date calculation helpers relative to the current timestamp.
 * Used by the database seed and pickup window calculations to ensure market days are always active.
 */

const DAY_MAP = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

/**
 * Returns a new Date offset by days.
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Returns a new Date offset by hours.
 * @param {Date} date
 * @param {number} hours
 * @returns {Date}
 */
export function addHours(date, hours) {
  const result = new Date(date);
  result.setTime(result.getTime() + hours * 60 * 60 * 1000);
  return result;
}

/**
 * Returns a new Date offset by minutes.
 * @param {Date} date
 * @param {number} minutes
 * @returns {Date}
 */
export function addMinutes(date, minutes) {
  const result = new Date(date);
  result.setTime(result.getTime() + minutes * 60 * 1000);
  return result;
}

/**
 * Converts hour (0..23) and minute (0..59) to minutes from midnight.
 * @param {number} hour
 * @param {number} min
 * @returns {number}
 */
export function toMinutesFromMidnight(hour, min = 0) {
  return hour * 60 + min;
}

/**
 * Finds the upcoming occurrence of a given weekday (today or next occurrence).
 * @param {string} dayName - e.g. 'saturday' or 'sat'
 * @param {number} [hour=8]
 * @param {number} [minute=0]
 * @param {Date} [now=new Date()]
 * @returns {Date}
 */
export function getNextWeekday(dayName, hour = 8, minute = 0, now = new Date()) {
  const targetDay = DAY_MAP[dayName.toLowerCase()];
  if (targetDay === undefined) {
    throw new Error(`Unknown weekday: ${dayName}`);
  }

  const result = new Date(now);
  const currentDay = result.getDay();
  let daysUntil = (targetDay - currentDay + 7) % 7;
  if (daysUntil === 0) {
    // If today is targetDay, but desired hour has passed, jump to next week
    if (result.getHours() >= hour) {
      daysUntil = 7;
    }
  }

  result.setDate(result.getDate() + daysUntil);
  result.setHours(hour, minute, 0, 0);
  return result;
}

/**
 * Finds a past occurrence of a given weekday (e.g. 1, 2, or 3 weeks ago).
 * @param {string} dayName
 * @param {number} [weeksAgo=1]
 * @param {number} [hour=8]
 * @param {number} [minute=0]
 * @param {Date} [now=new Date()]
 * @returns {Date}
 */
export function getPastWeekday(dayName, weeksAgo = 1, hour = 8, minute = 0, now = new Date()) {
  const next = getNextWeekday(dayName, hour, minute, now);
  const result = new Date(next);
  result.setDate(result.getDate() - (weeksAgo * 7));
  return result;
}
