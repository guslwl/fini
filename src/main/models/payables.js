import { assertValidCalendarDate } from '../validators/date-validator.js'
import { NotFoundError } from '../infra/errors.js'

export default class Payables {
  constructor(dbClient) {
    this.dbClient = dbClient
  }

  create(payable) {
    const { history, invoice_id, account_id, due_date, preferred_date, value, parent_id, paid_at } =
      payable

    assertValidCalendarDate(due_date, 'due_date')

    if (preferred_date !== null && preferred_date !== undefined) {
      assertValidCalendarDate(preferred_date, 'preferred_date')
    }

    const result = this.dbClient
      .prepare(
        `INSERT INTO payables (history, invoice_id, account_id, due_date, preferred_date, value, parent_id, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(history, invoice_id, account_id, due_date, preferred_date, value, parent_id, paid_at)
    return { id: result.lastInsertRowid }
  }

  createBulk(payables) {
    const insert = this.dbClient.prepare(
      `INSERT INTO payables (history, invoice_id, account_id, due_date, preferred_date, value, parent_id, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )

    const insertMany = this.dbClient.transaction((items) => {
      const ids = []
      for (const item of items) {
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

        assertValidCalendarDate(due_date, 'due_date')
        if (preferred_date !== null && preferred_date !== undefined) {
          assertValidCalendarDate(preferred_date, 'preferred_date')
        }

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

    return { ids: insertMany(payables) }
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
    const currentPayable = this.getById(id)

    const dbClient = this.dbClient

    const payableWithNewValues = { ...currentPayable, ...data }

    assertValidCalendarDate(payableWithNewValues.due_date, 'due_date')
    if (
      payableWithNewValues.preferred_date !== null &&
      payableWithNewValues.preferred_date !== undefined
    ) {
      assertValidCalendarDate(payableWithNewValues.preferred_date, 'preferred_date')
    }

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
        'UPDATE payables SET paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
      .run(id)

    if (result.changes === 0) {
      throw new NotFoundError({
        message: `Payable with id ${id} was not found`,
        details: { id, entity: 'payable' }
      })
    }

    return { changes: result.changes }
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
