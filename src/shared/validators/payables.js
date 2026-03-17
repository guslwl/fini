import { ValidationError } from 'shared/errors.js'
import { assertValidCalendarDate } from 'shared/utils/date.js'

export function validatePayableCreatePayload(data) {
  assertIsObject(data, 'a payable must be provided')

  assertValidCalendarDate(data.due_date, 'due_date')

  if (data.preferred_date !== null && data.preferred_date !== undefined) {
    assertValidCalendarDate(data.preferred_date, 'preferred_date')
  }

  const errors = []

  if (!data.history || typeof data.history !== 'string') {
    errors.push('history is required and must be a string')
  }

  if (!Number.isInteger(data.value)) {
    errors.push('value is required and must be an integer')
  }

  if (
    data.invoice_id !== undefined &&
    data.invoice_id !== null &&
    typeof data.invoice_id !== 'string'
  ) {
    errors.push('invoice_id must be a string')
  }

  if (
    data.account_id !== undefined &&
    data.account_id !== null &&
    typeof data.account_id !== 'string'
  ) {
    errors.push('account_id must be a string')
  }

  if (data.currency !== undefined && data.currency !== null && typeof data.currency !== 'string') {
    errors.push('currency must be a string')
  }

  if (
    data.parent_id !== undefined &&
    data.parent_id !== null &&
    !Number.isInteger(data.parent_id)
  ) {
    errors.push('parent_id must be an integer')
  }

  if (data.paid_at !== undefined && data.paid_at !== null && typeof data.paid_at !== 'string') {
    errors.push('paid_at must be a string')
  }

  if (errors.length > 0) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: errors
    })
  }
}

export function validatePayableUpdatePayload(data) {
  assertIsObject(data, 'a payable must be provided')

  const errors = []
  const allowedFields = [
    'history',
    'invoice_id',
    'account_id',
    'currency',
    'due_date',
    'preferred_date',
    'value',
    'parent_id',
    'paid_at'
  ]

  Object.keys(data).forEach((key) => {
    if (!allowedFields.includes(key)) {
      errors.push(`${key} is not a valid field`)
    }
  })

  if (data.due_date !== undefined) {
    assertValidCalendarDate(data.due_date, 'due_date')
  }

  if (data.preferred_date !== undefined && data.preferred_date !== null) {
    assertValidCalendarDate(data.preferred_date, 'preferred_date')
  }

  if (data.history !== undefined && typeof data.history !== 'string') {
    errors.push('history must be a string')
  }

  if (data.value !== undefined && !Number.isInteger(data.value)) {
    errors.push('value must be an integer')
  }

  if (
    data.invoice_id !== undefined &&
    data.invoice_id !== null &&
    typeof data.invoice_id !== 'string'
  ) {
    errors.push('invoice_id must be a string')
  }

  if (
    data.account_id !== undefined &&
    data.account_id !== null &&
    typeof data.account_id !== 'string'
  ) {
    errors.push('account_id must be a string')
  }

  if (data.currency !== undefined && data.currency !== null && typeof data.currency !== 'string') {
    errors.push('currency must be a string')
  }

  if (
    data.parent_id !== undefined &&
    data.parent_id !== null &&
    !Number.isInteger(data.parent_id)
  ) {
    errors.push('parent_id must be an integer')
  }

  if (data.paid_at !== undefined && data.paid_at !== null && typeof data.paid_at !== 'string') {
    errors.push('paid_at must be a string')
  }

  if (errors.length > 0) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: errors
    })
  }
}

export function validatePayableBulkPayload(dataArray) {
  if (!Array.isArray(dataArray)) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: ['an array of payables must be provided']
    })
  }

  const errors = []

  dataArray.forEach((item, index) => {
    try {
      validatePayableCreatePayload(item)
    } catch (error) {
      if (error instanceof ValidationError && error.code === 'VALIDATION_ERROR') {
        errors.push({ index, errors: error.cause || [] })
        return
      }

      throw error
    }
  })

  if (errors.length > 0) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: errors
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
