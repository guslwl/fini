/**
 * Business day service for adjusting payable due dates
 * Checks holidays and weekends to ensure dates fall on business days
 */

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * @param {Date} date
 * @returns {boolean}
 */
function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Check if a date is in the holidays array
 * @param {Date} date
 * @param {Array} holidays - Array of holiday objects with 'date' field (YYYY-MM-DD)
 * @returns {boolean}
 */
function isHoliday(date, holidays) {
  const dateString = date.toISOString().split('T')[0]
  return holidays.some((h) => h.date === dateString)
}

/**
 * Check if a date is a business day
 * A business day is a date that is not a weekend and not a holiday
 * @param {Date} date
 * @param {Array} holidays
 * @returns {boolean}
 */
function isBusinessDay(date, holidays) {
  return !isWeekend(date) && !isHoliday(date, holidays)
}

/**
 * Find the next business day starting from the given date
 * @param {Date} date
 * @param {Array} holidays
 * @returns {Date}
 */
function findNextBusinessDay(date, holidays) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + 1)

  while (!isBusinessDay(nextDate, holidays)) {
    nextDate.setDate(nextDate.getDate() + 1)
  }

  return nextDate
}

/**
 * Find the previous business day before the given date
 * @param {Date} date
 * @param {Array} holidays
 * @returns {Date}
 */
function findPreviousBusinessDay(date, holidays) {
  const prevDate = new Date(date)
  prevDate.setDate(prevDate.getDate() - 1)

  while (!isBusinessDay(prevDate, holidays)) {
    prevDate.setDate(prevDate.getDate() - 1)
  }

  return prevDate
}

/**
 * Adjust a date for business day logic
 * If the date is a business day, return it unchanged
 * If not a business day:
 *   - If should_postpone is true: find and return the next business day
 *   - If should_postpone is false: find and return the previous business day
 *
 * @param {string} dateString - ISO format date string (YYYY-MM-DD)
 * @param {boolean} shouldPostpone - Whether to postpone or anticipate
 * @param {Array} holidays - Array of holiday objects with 'date' field
 * @returns {string} Adjusted date in ISO format (YYYY-MM-DD)
 */
export function adjustForBusinessDay(dateString, shouldPostpone, holidays = []) {
  // Parse the input date
  const date = new Date(dateString + 'T00:00:00Z')

  // If already a business day, return unchanged
  if (isBusinessDay(date, holidays)) {
    return dateString
  }

  // Adjust based on shouldPostpone flag
  let adjustedDate
  if (shouldPostpone) {
    adjustedDate = findNextBusinessDay(date, holidays)
  } else {
    adjustedDate = findPreviousBusinessDay(date, holidays)
  }

  // Return as ISO string (YYYY-MM-DD)
  return adjustedDate.toISOString().split('T')[0]
}

export default {
  adjustForBusinessDay,
  isBusinessDay,
  isWeekend,
  isHoliday
}
