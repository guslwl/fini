import { NotFoundError } from 'shared/errors.js'
import booleanHelper from 'shared/utils/boolean.js'
import {
  validateRecurringCreatePayload,
  validateRecurringUpdatePayload
} from 'shared/validators/recurring.js'

function normalizeRecurring(row) {
  if (!row) return row
  return { ...row, should_postpone: Boolean(row.should_postpone) }
}

export default class Payables {
  constructor(dbClient) {
    this.dbClient = dbClient
  }

  create(payable_recurring) {
    validateRecurringCreatePayload(payable_recurring)

    let { history, due_day, should_postpone, value, notes } = payable_recurring

    should_postpone = booleanHelper.parseToDBValue(should_postpone, 'should_postpone')

    const result = this.dbClient
      .prepare(
        `INSERT INTO payables_recurring (history, due_day, should_postpone, value, notes)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(history, due_day, should_postpone, value, notes)
    return result.lastInsertRowid
  }

  getAll() {
    return this.dbClient
      .prepare('SELECT * FROM payables_recurring ORDER BY history ASC')
      .all()
      .map(normalizeRecurring)
  }

  getById(id) {
    const result = this.dbClient.prepare('SELECT * FROM payables_recurring WHERE id = ?').get(id)
    if (!result) {
      throw new NotFoundError({
        message: `Recurring payable with id ${id} was not found`,
        cause: { id, entity: 'payables_recurring' }
      })
    }
    return normalizeRecurring(result)
  }

  update(id, data) {
    validateRecurringUpdatePayload(data)

    const currentRecurring = this.getById(id)

    const dbClient = this.dbClient

    const recurringWithNewValues = { ...currentRecurring, ...data }

    recurringWithNewValues.should_postpone = booleanHelper.parseToDBValue(
      recurringWithNewValues.should_postpone,
      'should_postpone'
    )

    const updatedRecurring = updateRecurring(recurringWithNewValues)

    return normalizeRecurring(updatedRecurring)

    function updateRecurring(recurring) {
      return dbClient
        .prepare(
          `UPDATE payables_recurring
           SET history = ?, due_day = ?, should_postpone = ?, value = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?
           RETURNING *`
        )
        .get(
          recurring.history,
          recurring.due_day,
          recurring.should_postpone,
          recurring.value,
          recurring.notes,
          recurring.id
        )
    }
  }

  delete(id) {
    const result = this.dbClient.prepare('DELETE FROM payables_recurring WHERE id = ?').run(id)

    if (result.changes === 0) {
      throw new NotFoundError({
        message: `Recurring payable with id ${id} was not found`,
        cause: { id, entity: 'payables_recurring' }
      })
    }

    return true
  }
}
