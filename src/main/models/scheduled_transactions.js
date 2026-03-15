import { NotFoundError } from 'shared/errors.js'
import booleanHelper from 'shared/utils/boolean.js'
import {
  validateScheduledTransactionCreatePayload,
  validateScheduledTransactionUpdatePayload
} from 'shared/validators/scheduled_transactions.js'

function normalize(row) {
  if (!row) return row
  return {
    ...row,
    should_postpone: Boolean(row.should_postpone),
    user_triggered: Boolean(row.user_triggered)
  }
}

export default class ScheduledTransactions {
  constructor(dbClient) {
    this.dbClient = dbClient
  }

  create(data) {
    validateScheduledTransactionCreatePayload(data)

    const {
      description,
      amount,
      currency,
      account_id,
      type,
      frequency,
      next_date,
      end_type,
      end_after_n,
      end_date,
      occurrences_count,
      certainty,
      provision_strategy,
      should_postpone,
      status,
      user_triggered,
      notes
    } = data

    const shouldPostponeDB = booleanHelper.parseToDBValue(
      should_postpone ?? false,
      'should_postpone'
    )
    const userTriggeredDB = booleanHelper.parseToDBValue(user_triggered ?? true, 'user_triggered')

    const result = this.dbClient
      .prepare(
        `INSERT INTO scheduled_transactions
          (description, amount, currency, account_id, type, frequency, next_date,
           end_type, end_after_n, end_date, occurrences_count, certainty, provision_strategy,
           should_postpone, status, user_triggered, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        description,
        amount ?? null,
        currency ?? 'BRL',
        account_id ?? null,
        type,
        frequency,
        next_date,
        end_type ?? 'never',
        end_after_n ?? null,
        end_date ?? null,
        occurrences_count ?? 0,
        certainty ?? 'fixed',
        provision_strategy ?? 'none',
        shouldPostponeDB,
        status ?? 'active',
        userTriggeredDB,
        notes ?? null
      )

    return result.lastInsertRowid
  }

  getAll() {
    return this.dbClient
      .prepare(
        'SELECT * FROM scheduled_transactions WHERE deleted_at IS NULL ORDER BY description ASC'
      )
      .all()
      .map(normalize)
  }

  getActive() {
    return this.dbClient
      .prepare(
        `SELECT * FROM scheduled_transactions
         WHERE status = 'active' AND deleted_at IS NULL
         ORDER BY next_date ASC`
      )
      .all()
      .map(normalize)
  }

  getUpcoming(days) {
    return this.dbClient
      .prepare(
        `SELECT * FROM scheduled_transactions
         WHERE status = 'active'
           AND deleted_at IS NULL
           AND next_date <= date('now', '+' || ? || ' days')
         ORDER BY next_date ASC`
      )
      .all(days)
      .map(normalize)
  }

  getById(id) {
    const result = this.dbClient
      .prepare('SELECT * FROM scheduled_transactions WHERE id = ?')
      .get(id)

    if (!result) {
      throw new NotFoundError({
        message: `Scheduled transaction with id ${id} was not found`,
        cause: { id, entity: 'scheduled_transactions' }
      })
    }

    return normalize(result)
  }

  update(id, data) {
    validateScheduledTransactionUpdatePayload(data)

    const current = this.getById(id)
    const merged = { ...current, ...data }

    merged.should_postpone = booleanHelper.parseToDBValue(merged.should_postpone, 'should_postpone')
    merged.user_triggered = booleanHelper.parseToDBValue(merged.user_triggered, 'user_triggered')

    const updated = this.dbClient
      .prepare(
        `UPDATE scheduled_transactions
         SET description = ?, amount = ?, currency = ?, account_id = ?, type = ?,
             frequency = ?, next_date = ?, end_type = ?, end_after_n = ?, end_date = ?,
             occurrences_count = ?, certainty = ?, provision_strategy = ?, should_postpone = ?,
             status = ?, user_triggered = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?
         RETURNING *`
      )
      .get(
        merged.description,
        merged.amount,
        merged.currency,
        merged.account_id,
        merged.type,
        merged.frequency,
        merged.next_date,
        merged.end_type,
        merged.end_after_n,
        merged.end_date,
        merged.occurrences_count,
        merged.certainty,
        merged.provision_strategy,
        merged.should_postpone,
        merged.status,
        merged.user_triggered,
        merged.notes,
        id
      )

    return normalize(updated)
  }

  delete(id) {
    const result = this.dbClient.prepare('DELETE FROM scheduled_transactions WHERE id = ?').run(id)

    if (result.changes === 0) {
      throw new NotFoundError({
        message: `Scheduled transaction with id ${id} was not found`,
        cause: { id, entity: 'scheduled_transactions' }
      })
    }

    return true
  }
}
