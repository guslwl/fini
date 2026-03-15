import { ValidationError } from 'shared/errors.js'

export function validateRecurringCreatePayload(data) {
  assertIsObject(data, 'a recurring payable must be provided')

  validateDueDay(data.due_day, { required: true })
  validateShouldPostpone(data.should_postpone, { required: true })

  const errors = []

  if (!data.history || typeof data.history !== 'string') {
    errors.push('history is required and must be a string')
  }

  if (!Number.isInteger(data.value)) {
    errors.push('value is required and must be an integer')
  }

  if (data.notes !== undefined && data.notes !== null && typeof data.notes !== 'string') {
    errors.push('notes must be a string')
  }

  if (errors.length > 0) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: errors
    })
  }
}

export function validateRecurringUpdatePayload(data) {
  assertIsObject(data, 'a recurring payable must be provided')

  const errors = []
  const allowedFields = ['history', 'due_day', 'should_postpone', 'value', 'notes']

  Object.keys(data).forEach((key) => {
    if (!allowedFields.includes(key)) {
      errors.push(`${key} is not a valid field`)
    }
  })

  if (data.history !== undefined && typeof data.history !== 'string') {
    errors.push('history must be a string')
  }

  if (data.value !== undefined && !Number.isInteger(data.value)) {
    errors.push('value must be an integer')
  }

  if (data.notes !== undefined && data.notes !== null && typeof data.notes !== 'string') {
    errors.push('notes must be a string')
  }

  if (errors.length > 0) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: errors
    })
  }

  if (data.due_day !== undefined) {
    validateDueDay(data.due_day, { required: true })
  }

  if (data.should_postpone !== undefined) {
    validateShouldPostpone(data.should_postpone, { required: true })
  }
}

export function validateDueDay(dueDay, { required = false } = {}) {
  if (dueDay === null || dueDay === undefined) {
    if (required) {
      throw new ValidationError({
        message: 'due_day is required',
        code: 'MISSING_DUE_DAY',
        cause: ['due_day is required'],
        action: 'Provide a valid day between 1 and 31'
      })
    }

    return
  }

  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    throw new ValidationError({
      message: 'due_day is not a valid date value',
      code: 'INVALID_DATE_VALUE',
      cause: ['due_day must be an integer between 1 and 31'],
      action: 'Provide a valid day between 1 and 31'
    })
  }
}

export function validateShouldPostpone(shouldPostpone) {
  if (shouldPostpone === null || shouldPostpone === undefined) {
    throw new ValidationError({
      message: 'should_postpone is required',
      code: 'MISSING_SHOULD_POSTPONE',
      cause: ['should_postpone is required'],
      action: 'Provide true or false for should_postpone'
    })
  }

  if (typeof shouldPostpone !== 'boolean') {
    throw new ValidationError({
      message: 'should_postpone has an invalid value',
      code: 'INVALID_BOOLEAN_VALUE',
      cause: ['should_postpone must be a boolean'],
      action: 'Provide true or false for should_postpone'
    })
  }
}

function assertIsObject(data, message) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: [message]
    })
  }
}
