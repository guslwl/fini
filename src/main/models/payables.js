import { assertValidCalendarDate } from 'utils/dateHelper.js'
import { NotFoundError, ValidationError } from 'infra/errors.js'

export default class Payables {
  constructor(dbClient) {
    this.dbClient = dbClient
  }

  create(payable) {
    validatePayableCreatePayload(payable)

    const { history, invoice_id, account_id, due_date, preferred_date, value, parent_id, paid_at } =
      payable

    const result = this.dbClient
      .prepare(
        `INSERT INTO payables (history, invoice_id, account_id, due_date, preferred_date, value, parent_id, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(history, invoice_id, account_id, due_date, preferred_date, value, parent_id, paid_at)
    return result.lastInsertRowid
  }

  createBulk(payables) {
    validatePayableBulkPayload(payables)

    const insert = this.dbClient.prepare(
      `INSERT INTO payables (history, invoice_id, account_id, due_date, preferred_date, value, parent_id, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )

    const insertMany = this.dbClient.transaction((items) => {
      const ids = []
      for (const item of items) {
        validatePayableCreatePayload(item)

        const {
          history,
          invoice_id,
          account_id,
          due_date,
          preferred_date,
          value,
          parent_id,
          paid_at
        } = item

        const result = insert.run(
          history,
          invoice_id,
          account_id,
          due_date,
          preferred_date,
          value,
          parent_id,
          paid_at
        )
        ids.push(result.lastInsertRowid)
      }
      return ids
    })

    return insertMany(payables)
  }

  getAll() {
    return this.dbClient.prepare('SELECT * FROM payables ORDER BY history ASC').all()
  }

  getByMonth(year, month) {
    const yearValue = year.toString()
    const monthValue = month.toString().padStart(2, '0')
    return this.dbClient
      .prepare(
        `SELECT * FROM payables
         WHERE strftime('%Y', COALESCE(preferred_date, due_date)) = ?
           AND strftime('%m', COALESCE(preferred_date, due_date)) = ?
         ORDER BY history ASC`
      )
      .all(yearValue, monthValue)
  }

  getById(id) {
    const result = this.dbClient.prepare('SELECT * FROM payables WHERE id = ?').get(id)

    if (!result) {
      throw new NotFoundError({
        message: `Payable with id ${id} was not found`,
        details: { id, entity: 'payable' }
      })
    }

    return result
  }

  update(id, data) {
    validatePayableUpdatePayload(data)

    const currentPayable = this.getById(id)

    const dbClient = this.dbClient

    const payableWithNewValues = { ...currentPayable, ...data }

    validatePayableCreatePayload(payableWithNewValues)

    const updatedPayable = updatePayable(payableWithNewValues)

    return updatedPayable

    function updatePayable(payable) {
      return dbClient
        .prepare(
          `UPDATE payables
           SET history = ?, invoice_id = ?, account_id = ?, due_date = ?, preferred_date = ?, value = ?, parent_id = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?
           RETURNING *`
        )
        .get(
          payable.history,
          payable.invoice_id,
          payable.account_id,
          payable.due_date,
          payable.preferred_date,
          payable.value,
          payable.parent_id,
          payable.paid_at,
          payable.id
        )
    }
  }

  markAsPaid(id) {
    const result = this.dbClient
      .prepare(
        'UPDATE payables SET paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
      )
      .get(id)

    if (!result) {
      throw new NotFoundError({
        message: `Payable with id ${id} was not found`,
        details: { id, entity: 'payable' }
      })
    }

    return result
  }

  markAsUnpaid(id) {
    const result = this.dbClient
      .prepare(
        'UPDATE payables SET paid_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
      )
      .get(id)

    if (!result) {
      throw new NotFoundError({
        message: `Payable with id ${id} was not found`,
        details: { id, entity: 'payable' }
      })
    }

    return result
  }

  existsByHistoryAndDueDate(history, dueDate) {
    const result = this.dbClient
      .prepare('SELECT 1 FROM payables WHERE history = ? AND due_date = ? LIMIT 1')
      .get(history, dueDate)

    return Boolean(result)
  }

  delete(id) {
    const result = this.dbClient.prepare('DELETE FROM payables WHERE id = ?').run(id)

    if (result.changes === 0) {
      throw new NotFoundError({
        message: `Payable with id ${id} was not found`,
        details: { id, entity: 'payable' }
      })
    }

    return true
  }
}

function validatePayableBulkPayload(dataArray) {
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
        errors.push({ index, errors: error.details || [] })
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

function validatePayableCreatePayload(data) {
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

function validatePayableUpdatePayload(data) {
  assertIsObject(data, 'a payable must be provided')

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

function assertIsObject(data, message) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError({
      message: 'invalid data was provided',
      cause: [message]
    })
  }
}
