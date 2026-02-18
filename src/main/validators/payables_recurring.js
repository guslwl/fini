export function validatePayableCreate(data) {
  const errors = []

  const result = {
    isValid: false,
    errors
  }

  if (!data) {
    errors.push('a recurring payable must be provided')
    return result
  }

  if (!data.history || typeof data.history !== 'string') {
    errors.push('history is required and must be a string')
  }

  if (data.due_day !== undefined) {
    if (!Number.isInteger(data.due_day)) {
      errors.push('due_day must be an integer')
    } else if (data.due_day < 1 || data.due_day > 31) {
      errors.push('due_day must be between 1 and 31')
    }
  }

  if (data.should_postpone !== undefined && typeof data.should_postpone !== 'boolean') {
    errors.push('should_postpone must be a boolean')
  }

  if (!Number.isInteger(data.value)) {
    errors.push('value is required and must be an integer')
  }

  if (data.notes !== undefined && typeof data.notes !== 'string') {
    errors.push('notes must be a string')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validatePayableUpdate(data) {
  const errors = []
  const allowedFields = ['history', 'due_day', 'should_postpone', 'value', 'notes']

  const result = {
    isValid: false,
    errors
  }

  if (!data) {
    errors.push('a recurring payable must be provided')
    return result
  }

  Object.keys(data).forEach((key) => {
    if (!allowedFields.includes(key)) {
      errors.push(`${key} is not a valid field`)
    }
  })

  if (data.history !== undefined && typeof data.history !== 'string') {
    errors.push('history must be a string')
  }

  if (data.due_day !== undefined) {
    if (!Number.isInteger(data.due_day)) {
      errors.push('due_day must be an integer')
    } else if (data.due_day < 1 || data.due_day > 31) {
      errors.push('due_day must be between 1 and 31')
    }
  }

  if (data.should_postpone !== undefined && typeof data.should_postpone !== 'boolean') {
    errors.push('should_postpone must be a boolean')
  }

  if (data.value !== undefined && !Number.isInteger(data.value)) {
    errors.push('value must be an integer')
  }

  if (data.notes !== undefined && typeof data.notes !== 'string') {
    errors.push('notes must be a string')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
