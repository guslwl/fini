import { ValidationError } from 'shared/errors.js'
import { assertValidCalendarDate } from 'shared/utils/date.js'

export function validateHoliday(data) {
  assertDataObject(data)

  assertValidCalendarDate(data.date, 'date')

  const errors = []

  if (!data.description || typeof data.description !== 'string') {
    errors.push('description is required and must be a string')
  }

  if (typeof data.type !== 'string') {
    errors.push('type must be a string')
  }

  if (typeof data.is_business_day !== 'boolean') {
    errors.push('is_business_day must be a boolean')
  }

  if (typeof data.should_count_as_business_day !== 'boolean') {
    errors.push('should_count_as_business_day must be a boolean')
  }

  if (errors.length > 0) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: errors
    })
  }
}

export function validateHolidayUpdate(data) {
  assertDataObject(data)

  const errors = []
  const allowedFields = [
    'description',
    'type',
    'date',
    'is_business_day',
    'should_count_as_business_day'
  ]

  Object.keys(data).forEach((key) => {
    if (!allowedFields.includes(key)) {
      errors.push(`${key} is not a valid field`)
    }
  })

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('description must be a string')
  }

  if (data.date !== undefined) {
    assertValidCalendarDate(data.date, 'date')
  }

  if (data.type !== undefined && typeof data.type !== 'string') {
    errors.push('type must be a string')
  }

  if (data.is_business_day !== undefined && typeof data.is_business_day !== 'boolean') {
    errors.push('is_business_day must be a boolean')
  }

  if (
    data.should_count_as_business_day !== undefined &&
    typeof data.should_count_as_business_day !== 'boolean'
  ) {
    errors.push('should_count_as_business_day must be a boolean')
  }

  if (errors.length > 0) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: errors
    })
  }
}

function assertDataObject(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: ['a holiday must be provided']
    })
  }
}
