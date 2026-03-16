import { NotFoundError, ValidationError } from 'shared/errors.js'
import {
  validateAccountCreate,
  validateAccountUpdate,
  CATEGORY_TYPES
} from 'shared/validators/accounts.js'

export default class Accounts {
  constructor(dbClient) {
    this.dbClient = dbClient
  }

  getAll() {
    return this.dbClient
      .prepare(
        `SELECT a.*, p.name AS parent_name
         FROM accounts a
         LEFT JOIN accounts p ON p.id = a.parent_id
         WHERE a.deleted_at IS NULL
         ORDER BY a.category ASC, a.name ASC`
      )
      .all()
  }

  getById(id) {
    const result = this.dbClient
      .prepare(
        `SELECT a.*, p.name AS parent_name
         FROM accounts a
         LEFT JOIN accounts p ON p.id = a.parent_id
         WHERE a.id = ?`
      )
      .get(id)

    if (!result) {
      throw new NotFoundError({
        message: `Account with id (${id}) was not found`,
        cause: { id, entity: 'account' }
      })
    }

    return result
  }

  create(data) {
    validateAccountCreate(data)

    if (data.parent_id != null) {
      const parent = this.dbClient
        .prepare('SELECT id, category, deleted_at FROM accounts WHERE id = ?')
        .get(data.parent_id)

      if (!parent || parent.deleted_at != null) {
        throw new NotFoundError({
          message: `Parent account with id (${data.parent_id}) was not found`,
          cause: { id: data.parent_id, entity: 'account' }
        })
      }

      if (parent.category !== data.category) {
        throw new ValidationError({
          message: 'invalid data was provided',
          cause: [
            `parent account category "${parent.category}" must match account category "${data.category}"`
          ]
        })
      }
    }

    const result = this.dbClient
      .prepare(
        `INSERT INTO accounts (name, code, category, type, currency, notes, parent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.name,
        data.code ?? null,
        data.category,
        data.type,
        data.currency,
        data.notes ?? null,
        data.parent_id ?? null
      )

    return result.lastInsertRowid
  }

  update(id, data) {
    validateAccountUpdate(data)

    const current = this.getById(id)

    if (current.deleted_at != null) {
      throw new NotFoundError({
        message: `Account with id (${id}) was not found`,
        cause: { id, entity: 'account' }
      })
    }

    const merged = { ...current, ...data }

    // Post-merge category/type consistency check
    if (!CATEGORY_TYPES[merged.category]?.includes(merged.type)) {
      throw new ValidationError({
        message: 'invalid data was provided',
        cause: [
          `type "${merged.type}" is not valid for category "${merged.category}"; allowed: ${CATEGORY_TYPES[merged.category]?.join(', ')}`
        ]
      })
    }

    // Validate parent_id if it changed
    if (data.parent_id !== undefined) {
      if (data.parent_id != null) {
        if (data.parent_id === id) {
          throw new ValidationError({
            message: 'invalid data was provided',
            cause: ['an account cannot be its own parent']
          })
        }

        const parent = this.dbClient
          .prepare('SELECT id, category, deleted_at FROM accounts WHERE id = ?')
          .get(data.parent_id)

        if (!parent || parent.deleted_at != null) {
          throw new NotFoundError({
            message: `Parent account with id (${data.parent_id}) was not found`,
            cause: { id: data.parent_id, entity: 'account' }
          })
        }

        if (parent.category !== merged.category) {
          throw new ValidationError({
            message: 'invalid data was provided',
            cause: [
              `parent account category "${parent.category}" must match account category "${merged.category}"`
            ]
          })
        }
      }
    }

    return this.dbClient
      .prepare(
        `UPDATE accounts
         SET name = ?, code = ?, category = ?, type = ?, currency = ?, notes = ?, parent_id = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?
         RETURNING *`
      )
      .get(
        merged.name,
        merged.code ?? null,
        merged.category,
        merged.type,
        merged.currency,
        merged.notes ?? null,
        merged.parent_id ?? null,
        id
      )
  }

  archive(id) {
    this.getById(id)

    return this.dbClient
      .prepare(
        `UPDATE accounts
         SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?
         RETURNING *`
      )
      .get(id)
  }

  unarchive(id) {
    this.getById(id)

    return this.dbClient
      .prepare(
        `UPDATE accounts
         SET archived_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?
         RETURNING *`
      )
      .get(id)
  }

  delete(id) {
    const current = this.getById(id)

    if (current.deleted_at != null) {
      throw new NotFoundError({
        message: `Account with id (${id}) was not found`,
        cause: { id, entity: 'account' }
      })
    }

    const children = this.dbClient
      .prepare('SELECT COUNT(*) AS count FROM accounts WHERE parent_id = ? AND deleted_at IS NULL')
      .get(id)

    if (children.count > 0) {
      throw new ValidationError({
        message: 'cannot delete account with child accounts',
        cause: ['remove or reassign child accounts before deleting this account']
      })
    }

    const inPayables = this.dbClient
      .prepare('SELECT COUNT(*) AS count FROM payables WHERE account_id = ? AND deleted_at IS NULL')
      .get(String(id))

    const inScheduled = this.dbClient
      .prepare(
        'SELECT COUNT(*) AS count FROM scheduled_transactions WHERE account_id = ? AND deleted_at IS NULL'
      )
      .get(id)

    if (inPayables.count > 0 || inScheduled.count > 0) {
      throw new ValidationError({
        message: 'cannot delete account with existing transaction lines',
        cause: ['remove or reassign associated transactions before deleting this account']
      })
    }

    this.dbClient
      .prepare(
        'UPDATE accounts SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
      .run(id)

    return true
  }
}
