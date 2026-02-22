/**
 * Business day service for adjusting payable due dates
 * Checks holidays and weekends to ensure dates fall on business days
 */

import { addDays, format, isWeekend as dateFnsIsWeekend, parseISO, subDays } from 'date-fns'

function toDateString(date) {
  return format(date, 'yyyy-MM-dd')
}

function isTruthyFlag(value) {
  return value === true || value === 1 || value === '1'
}

function countsAsBusinessDay(holiday) {
  return (
    isTruthyFlag(holiday?.is_business_day) || isTruthyFlag(holiday?.should_count_as_business_day)
  )
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * @param {Date} date
 * @returns {boolean}
 */
function isWeekend(date) {
  return dateFnsIsWeekend(date)
}

/**
 * Check if a date is in the holidays array
 * @param {Date} date
 * @param {Array} holidays - Array of holiday objects with 'date' field (YYYY-MM-DD)
 * @returns {boolean}
 */
function isHoliday(date, holidays) {
  const dateString = toDateString(date)
  return holidays.some((holiday) => {
    return holiday.date === dateString && !countsAsBusinessDay(holiday)
  })
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
  let nextDate = addDays(date, 1)

  while (!isBusinessDay(nextDate, holidays)) {
    nextDate = addDays(nextDate, 1)
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
  let prevDate = subDays(date, 1)

  while (!isBusinessDay(prevDate, holidays)) {
    prevDate = subDays(prevDate, 1)
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
  const date = parseISO(dateString)

  // If already a business day, return unchanged
  if (isBusinessDay(date, holidays)) {
    return toDateString(date)
  }

  // Adjust based on shouldPostpone flag
  let adjustedDate
  if (shouldPostpone) {
    adjustedDate = findNextBusinessDay(date, holidays)
  } else {
    adjustedDate = findPreviousBusinessDay(date, holidays)
  }

  // Return as ISO string (YYYY-MM-DD)
  return toDateString(adjustedDate)
}

export default {
  adjustForBusinessDay,
  isBusinessDay,
  isWeekend,
  isHoliday
}
