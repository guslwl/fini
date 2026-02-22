import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import database from 'infra/database.js'
import RecurringPayables from 'models/payables_recurring.js'
import { NotFoundError, ValidationError } from 'infra/errors.js'

function createRecurring(overrides = {}) {
  return {
    history: 'Electric bill',
    due_day: 10,
    should_postpone: true,
    value: 15000,
    notes: 'utility',
    ...overrides
  }
}

describe('Recurring payables model', () => {
  let db
  let recurringPayables

  beforeEach(() => {
    db = database.initialize({ dbPath: ':memory:' })
    recurringPayables = new RecurringPayables(db)
  })

  afterEach(() => {
    if (db) {
      db.close()
      db = null
    }
  })

  describe('enforced business rules', () => {
    it('creates a recurring payable and returns id', () => {
      const result = recurringPayables.create(createRecurring({ history: 'Internet', value: 9000 }))

      expect(result).toBeGreaterThan(0)

      const stored = recurringPayables.getById(result)
      expect(stored.history).toBe('Internet')
      expect(stored.value).toBe(9000)
      expect(stored.due_day).toBe(10)
      expect(stored.should_postpone).toBe(1)
      expect(stored.created_at).toBeTruthy()
      expect(stored.updated_at).toBeTruthy()
    })

    it('creates rows with nullable fields', () => {
      const result = recurringPayables.create(
        createRecurring({
          due_day: null,
          notes: null,
          should_postpone: false
        })
      )

      const stored = recurringPayables.getById(result)
      expect(stored.due_day).toBeNull()
      expect(stored.notes).toBeNull()
      expect(stored.should_postpone).toBe(0)
    })

    it('returns all recurring payables sorted by history ascending', () => {
      recurringPayables.create(createRecurring({ history: 'Zeta', due_day: 28 }))
      recurringPayables.create(createRecurring({ history: 'Alpha', due_day: 5 }))

      const rows = recurringPayables.getAll()

      expect(rows.length).toBe(2)
      expect(rows[0].history).toBe('Alpha')
      expect(rows[1].history).toBe('Zeta')
    })

    it('gets recurring payable by id', () => {
      const created = recurringPayables.create(createRecurring({ history: 'Find me' }))

      const existing = recurringPayables.getById(created)

      expect(existing).toBeDefined()
      expect(existing.history).toBe('Find me')
    })

    it('updates a recurring payable with partial fields and keeps other fields', () => {
      const created = recurringPayables.create(
        createRecurring({
          history: 'Old name',
          due_day: 20,
          should_postpone: true,
          value: 20000,
          notes: 'old notes'
        })
      )

      db.prepare('UPDATE payables_recurring SET updated_at = ? WHERE id = ?').run(
        '2000-01-01 00:00:00',
        created
      )

      const updated = recurringPayables.update(created, {
        history: 'New name',
        value: 25000,
        should_postpone: false
      })

      expect(updated.id).toBe(created)
      expect(updated.history).toBe('New name')
      expect(updated.value).toBe(25000)
      expect(updated.should_postpone).toBe(0)
      expect(updated.due_day).toBe(20)
      expect(updated.notes).toBe('old notes')
      expect(updated.updated_at).not.toBe('2000-01-01 00:00:00')
    })

    it('throws not found when getting a missing recurring payable by id', () => {
      expect(() => {
        recurringPayables.getById(999999)
      }).toThrow(NotFoundError)
    })

    it('deletes an existing recurring payable and returns changes count', () => {
      const created = recurringPayables.create(createRecurring({ history: 'To delete' }))

      const result = recurringPayables.delete(created)

      expect(result).toBe(true)
    })

    it('throws not found when deleting a missing recurring payable', () => {
      expect(() => {
        recurringPayables.delete(123456)
      }).toThrow(NotFoundError)
    })

    it('rejects create when due_day is out of range', () => {
      let error

      try {
        recurringPayables.create(createRecurring({ due_day: 32 }))
      } catch (caughtError) {
        error = caughtError
      }

      expect(error).toBeInstanceOf(ValidationError)
      expect(error.code).toBe('INVALID_DATE_VALUE')
    })

    it('rejects create when should_postpone is not boolean', () => {
      let error

      try {
        recurringPayables.create(createRecurring({ should_postpone: 'false' }))
      } catch (caughtError) {
        error = caughtError
      }

      expect(error).toBeInstanceOf(ValidationError)
      expect(error.code).toBe('VALIDATION_ERROR')
    })
  })
})
