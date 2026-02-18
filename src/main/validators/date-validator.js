import { ValidationError } from '../infra/errors.js'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function assertDateFormat(date, fieldName = 'date') {
  if (typeof date !== 'string' || !ISO_DATE_REGEX.test(date)) {
    throw new ValidationError({
      message: `${fieldName} has an invalid format`,
      code: 'INVALID_DATE_FORMAT',
      cause: [`${fieldName} must use YYYY-MM-DD format`],
      action: 'Provide a date in YYYY-MM-DD format'
    })
  }
}

export function assertValidCalendarDate(date, fieldName = 'date') {
  assertDateFormat(date, fieldName)

  const [year, month, day] = date.split('-').map(Number)
  const parsedDate = new Date(Date.UTC(year, month - 1, day))

  const isValidDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day

  if (!isValidDate) {
    throw new ValidationError({
      message: `${fieldName} is not a valid calendar date`,
      code: 'INVALID_DATE_VALUE',
      cause: [`${fieldName} must be a real calendar date`],
      action: 'Provide a valid calendar date'
    })
  }
}
