import { ValidationError } from 'shared/errors.js'

export const VALID_CATEGORIES = ['asset', 'liability', 'income', 'expense', 'equity']

export const VALID_CURRENCIES = ['BRL', 'USD', 'EUR', 'BTC']

export const CATEGORY_TYPES = {
  asset: ['checking', 'savings', 'brokerage', 'asset', 'group'],
  liability: ['credit_card', 'group'],
  income: ['income', 'group'],
  expense: ['expense', 'group'],
  equity: ['equity', 'group']
}

const ALLOWED_FIELDS = ['name', 'code', 'category', 'type', 'currency', 'notes', 'parent_id']

export function validateAccountCreate(data) {
  assertDataObject(data)

  const errors = []

  if (!data.name || typeof data.name !== 'string') {
    errors.push('name is required and must be a string')
  }

  if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`)
  }

  if (!data.type || typeof data.type !== 'string') {
    errors.push('type is required and must be a string')
  } else if (data.category && VALID_CATEGORIES.includes(data.category)) {
    if (!CATEGORY_TYPES[data.category].includes(data.type)) {
      errors.push(
        `type "${data.type}" is not valid for category "${data.category}"; allowed: ${CATEGORY_TYPES[data.category].join(', ')}`
      )
    }
  }

  if (!data.currency || !VALID_CURRENCIES.includes(data.currency)) {
    errors.push(`currency must be one of: ${VALID_CURRENCIES.join(', ')}`)
  }

  if (data.code !== undefined && data.code !== null) {
    if (typeof data.code !== 'string' || data.code.trim() === '') {
      errors.push('code must be a non-empty string')
    }
  }

  if (data.notes !== undefined && data.notes !== null && typeof data.notes !== 'string') {
    errors.push('notes must be a string')
  }

  if (data.parent_id !== undefined && data.parent_id !== null) {
    if (!Number.isInteger(data.parent_id) || data.parent_id <= 0) {
      errors.push('parent_id must be a positive integer')
    }
  }

  if (errors.length > 0) {
    throw new ValidationError({ message: 'invalid data was provided', cause: errors })
  }
}

export function validateAccountUpdate(data) {
  assertDataObject(data)

  const errors = []

  Object.keys(data).forEach((key) => {
    if (!ALLOWED_FIELDS.includes(key)) {
      errors.push(`${key} is not a valid field`)
    }
  })

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
    errors.push('name must be a non-empty string')
  }

  if (data.category !== undefined && !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`)
  }

  if (data.type !== undefined && typeof data.type !== 'string') {
    errors.push('type must be a string')
  }

  // If both category and type are present in this payload, validate the combination now
  if (
    data.category !== undefined &&
    data.type !== undefined &&
    VALID_CATEGORIES.includes(data.category)
  ) {
    if (!CATEGORY_TYPES[data.category].includes(data.type)) {
      errors.push(
        `type "${data.type}" is not valid for category "${data.category}"; allowed: ${CATEGORY_TYPES[data.category].join(', ')}`
      )
    }
  }

  if (data.currency !== undefined && !VALID_CURRENCIES.includes(data.currency)) {
    errors.push(`currency must be one of: ${VALID_CURRENCIES.join(', ')}`)
  }

  if (data.code !== undefined && data.code !== null) {
    if (typeof data.code !== 'string' || data.code.trim() === '') {
      errors.push('code must be a non-empty string')
    }
  }

  if (data.notes !== undefined && data.notes !== null && typeof data.notes !== 'string') {
    errors.push('notes must be a string')
  }

  if (data.parent_id !== undefined && data.parent_id !== null) {
    if (!Number.isInteger(data.parent_id) || data.parent_id <= 0) {
      errors.push('parent_id must be a positive integer')
    }
  }

  if (errors.length > 0) {
    throw new ValidationError({ message: 'invalid data was provided', cause: errors })
  }
}

function assertDataObject(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: ['an account must be provided']
    })
  }
}
