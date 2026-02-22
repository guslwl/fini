import { NotFoundError, ValidationError } from '../infra/errors.js'
import booleanValueService from '../services/booleanValueService.js'

export default class Payables {
  constructor(dbClient) {
    this.dbClient = dbClient
  }

  create(payable_recurring) {
    let { history, due_day, should_postpone, value, notes } = payable_recurring

    validateDueDay(due_day)
    validateShouldPostpone(should_postpone)

    should_postpone = booleanValueService.parseToDBValue(should_postpone)

    const result = this.dbClient
      .prepare(
        `INSERT INTO payables_recurring (history, due_day, should_postpone, value, notes)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(history, due_day, should_postpone, value, notes)
    return result.lastInsertRowid
  }

  getAll() {
    return this.dbClient.prepare('SELECT * FROM payables_recurring ORDER BY history ASC').all()
  }

  getById(id) {
    const result = this.dbClient.prepare('SELECT * FROM payables_recurring WHERE id = ?').get(id)
    if (!result) {
      throw new NotFoundError({
        message: `Recurring payable with id ${id} was not found`,
        details: { id, entity: 'payables_recurring' }
      })
    }
    return result
  }

  update(id, data) {
    const currentRecurring = this.getById(id)

    const dbClient = this.dbClient

    const recurringWithNewValues = { ...currentRecurring, ...data }

    validateDueDay(recurringWithNewValues.due_day)
    validateShouldPostpone(recurringWithNewValues.should_postpone)

    recurringWithNewValues.should_postpone = booleanValueService.parseToDBValue(
      recurringWithNewValues.should_postpone,
      'should_postpone'
    )

    const updatedRecurring = updateRecurring(recurringWithNewValues)

    return updatedRecurring

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
        details: { id, entity: 'payables_recurring' }
      })
    }

    return true
  }
}

function validateDueDay(dueDay) {
  if (dueDay === null || dueDay === undefined) {
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

function validateShouldPostpone(shouldPostpone) {
  if (typeof shouldPostpone !== 'boolean') {
    throw new ValidationError({
      message: 'should_postpone has an invalid value',
      code: 'VALIDATION_ERROR',
      cause: ['should_postpone must be a boolean'],
      action: 'Provide true or false for should_postpone'
    })
  }
}
