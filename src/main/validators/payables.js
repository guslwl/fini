export function validatePayableCreate(data) {
  const errors = []

  const result = {
    isValid: false,
    errors
  }

  if (!data) {
    errors.push('a payable must be provided')
    return result
  }

  if (!data.history || typeof data.history !== 'string') {
    errors.push('history is required and must be a string')
  }

  if (!Number.isInteger(data.value)) {
    errors.push('value is required and must be an integer')
  }

  if (data.invoice_id && typeof data.invoice_id !== 'string') {
    errors.push('invoice_id must be a string')
  }

  if (data.account_id && typeof data.account_id !== 'string') {
    errors.push('account_id must be a string')
  }

  if (data.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.due_date)) {
    errors.push('due_date must be in YYYY-MM-DD format')
  }

  if (data.preferred_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.preferred_date)) {
    errors.push('preferred_date must be in YYYY-MM-DD format')
  }

  if (data.parent_id && !Number.isInteger(data.parent_id)) {
    errors.push('parent_id must be an integer')
  }

  if (data.paid_at !== undefined && typeof data.paid_at !== 'string') {
    errors.push('paid_at must be a string')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validatePayableUpdate(data) {
  const errors = []
  const allowedFields = [
    'history',
    'invoice_id',
    'account_id',
    'due_date',
    'preferred_date',
    'value',
    'parent_id',
    'paid_at'
  ]

  const result = {
    isValid: false,
    errors
  }

  if (!data) {
    errors.push('a payable must be provided')
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

  if (data.value !== undefined && !Number.isInteger(data.value)) {
    errors.push('value must be an integer')
  }

  if (data.invoice_id && typeof data.invoice_id !== 'string') {
    errors.push('invoice_id must be a string')
  }

  if (data.account_id && typeof data.account_id !== 'string') {
    errors.push('account_id must be a string')
  }

  if (data.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.due_date)) {
    errors.push('due_date must be in YYYY-MM-DD format')
  }

  if (data.preferred_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.preferred_date)) {
    errors.push('preferred_date must be in YYYY-MM-DD format')
  }

  if (data.parent_id !== undefined && !Number.isInteger(data.parent_id)) {
    errors.push('parent_id must be an integer')
  }

  if (data.paid_at !== undefined && typeof data.paid_at !== 'string') {
    errors.push('paid_at must be a string')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validatePayableBulk(dataArray) {
  const errors = []

  const result = {
    isValid: false,
    errors
  }

  if (!Array.isArray(dataArray)) {
    errors.push('an array of payables must be provided')
    return result
  }

  dataArray.forEach((item, index) => {
    const { isValid, errors: itemErrors } = validatePayableCreate(item)
    if (!isValid) {
      errors.push({ index, errors: itemErrors })
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}
