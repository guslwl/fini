import { ValidationError } from 'shared/errors.js'
import { assertValidCalendarDate } from 'shared/utils/date.js'

const VALID_TYPES = ['payable', 'receivable']
const VALID_FIXED_FREQUENCIES = [
  'once',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual'
]

const VALID_DAY_ABBREVS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const VALID_END_TYPES = ['never', 'after_n', 'until_date']
const VALID_CERTAINTIES = ['fixed', 'estimated', 'unknown']
const VALID_PROVISION_STRATEGIES = ['none', 'daily', 'monthly', 'sinking']
const VALID_STATUSES = ['active', 'paused', 'completed']

const ALLOWED_CREATE_FIELDS = [
  'description',
  'amount',
  'currency',
  'account_id',
  'type',
  'frequency',
  'next_date',
  'end_type',
  'end_after_n',
  'end_date',
  'occurrences_count',
  'certainty',
  'provision_strategy',
  'should_postpone',
  'status',
  'user_triggered',
  'notes'
]

const ALLOWED_UPDATE_FIELDS = ALLOWED_CREATE_FIELDS

function isValidDayOfWeekPattern(frequency) {
  const parts = frequency.split('-')
  return parts.length >= 2 && parts.every((p) => VALID_DAY_ABBREVS.includes(p))
}

function isValidFrequency(frequency) {
  if (typeof frequency !== 'string') return false
  if (VALID_FIXED_FREQUENCIES.includes(frequency)) return true
  return isValidDayOfWeekPattern(frequency)
}

function assertIsObject(data, message) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: [message]
    })
  }
}

export function validateScheduledTransactionCreatePayload(data) {
  assertIsObject(data, 'a scheduled transaction must be provided')

  const errors = []

  if (!data.description || typeof data.description !== 'string') {
    errors.push('description is required and must be a string')
  }

  if (!data.type || !VALID_TYPES.includes(data.type)) {
    errors.push(`type is required and must be one of: ${VALID_TYPES.join(', ')}`)
  }

  if (!data.frequency || !isValidFrequency(data.frequency)) {
    errors.push(
      `frequency is required and must be one of the fixed values (${VALID_FIXED_FREQUENCIES.join(', ')}) or a day-of-week pattern (e.g. mon-fri)`
    )
  }

  if (!data.next_date) {
    errors.push('next_date is required')
  }

  if (!data.currency || typeof data.currency !== 'string') {
    errors.push('currency is required and must be a string')
  }

  if (data.amount !== undefined && data.amount !== null && !Number.isInteger(data.amount)) {
    errors.push('amount must be an integer when provided')
  }

  if (
    data.end_type !== undefined &&
    data.end_type !== null &&
    !VALID_END_TYPES.includes(data.end_type)
  ) {
    errors.push(`end_type must be one of: ${VALID_END_TYPES.join(', ')}`)
  }

  if (
    data.end_after_n !== undefined &&
    data.end_after_n !== null &&
    !Number.isInteger(data.end_after_n)
  ) {
    errors.push('end_after_n must be an integer')
  }

  if (
    data.certainty !== undefined &&
    data.certainty !== null &&
    !VALID_CERTAINTIES.includes(data.certainty)
  ) {
    errors.push(`certainty must be one of: ${VALID_CERTAINTIES.join(', ')}`)
  }

  if (
    data.provision_strategy !== undefined &&
    data.provision_strategy !== null &&
    !VALID_PROVISION_STRATEGIES.includes(data.provision_strategy)
  ) {
    errors.push(`provision_strategy must be one of: ${VALID_PROVISION_STRATEGIES.join(', ')}`)
  }

  if (data.status !== undefined && data.status !== null && !VALID_STATUSES.includes(data.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`)
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

  // Validate date fields after collecting other errors
  assertValidCalendarDate(data.next_date, 'next_date')

  if (data.end_date !== undefined && data.end_date !== null) {
    assertValidCalendarDate(data.end_date, 'end_date')
  }
}

export function validateScheduledTransactionUpdatePayload(data) {
  assertIsObject(data, 'a scheduled transaction must be provided')

  const errors = []

  Object.keys(data).forEach((key) => {
    if (!ALLOWED_UPDATE_FIELDS.includes(key)) {
      errors.push(`${key} is not a valid field`)
    }
  })

  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push('description must be a string')
  }

  if (data.type !== undefined && !VALID_TYPES.includes(data.type)) {
    errors.push(`type must be one of: ${VALID_TYPES.join(', ')}`)
  }

  if (data.frequency !== undefined && !isValidFrequency(data.frequency)) {
    errors.push(`frequency must be one of the fixed values or a day-of-week pattern (e.g. mon-fri)`)
  }

  if (data.amount !== undefined && data.amount !== null && !Number.isInteger(data.amount)) {
    errors.push('amount must be an integer when provided')
  }

  if (data.end_type !== undefined && !VALID_END_TYPES.includes(data.end_type)) {
    errors.push(`end_type must be one of: ${VALID_END_TYPES.join(', ')}`)
  }

  if (
    data.end_after_n !== undefined &&
    data.end_after_n !== null &&
    !Number.isInteger(data.end_after_n)
  ) {
    errors.push('end_after_n must be an integer')
  }

  if (data.certainty !== undefined && !VALID_CERTAINTIES.includes(data.certainty)) {
    errors.push(`certainty must be one of: ${VALID_CERTAINTIES.join(', ')}`)
  }

  if (
    data.provision_strategy !== undefined &&
    !VALID_PROVISION_STRATEGIES.includes(data.provision_strategy)
  ) {
    errors.push(`provision_strategy must be one of: ${VALID_PROVISION_STRATEGIES.join(', ')}`)
  }

  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`)
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

  if (data.next_date !== undefined) {
    assertValidCalendarDate(data.next_date, 'next_date')
  }

  if (data.end_date !== undefined && data.end_date !== null) {
    assertValidCalendarDate(data.end_date, 'end_date')
  }
}
