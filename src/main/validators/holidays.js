export function validateHoliday(data) {
  const errors = []

  const result = {
    isValid: false,
    errors
  }

  if (!data) {
    errors.push('a holiday must be provided')
    return result
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('description is required and must be a string')
  }

  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('date must be in YYYY-MM-DD format')
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

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateHolidayUpdate(data) {
  const errors = []
  const allowedFields = [
    'description',
    'type',
    'date',
    'is_business_day',
    'should_count_as_business_day'
  ]

  const result = {
    isValid: false,
    errors
  }

  if (!data) {
    errors.push('a holiday must be provided')
    return result
  }

  Object.keys(data).forEach((key) => {
    if (!allowedFields.includes(key)) {
      errors.push(`${key} is not a valid field`)
    }
  })

  if (data.description && typeof data.description !== 'string') {
    errors.push('description must be a string')
  }

  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('date must be in YYYY-MM-DD format')
  }

  if (data.type && typeof data.type !== 'string') {
    errors.push('type must be a string')
  }

  if (typeof data.is_business_day !== 'boolean') {
    errors.push('is_business_day must be a boolean')
  }

  if (typeof data.should_count_as_business_day !== 'boolean') {
    errors.push('should_count_as_business_day must be a boolean')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
