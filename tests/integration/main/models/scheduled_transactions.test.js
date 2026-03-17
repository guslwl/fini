import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import database from 'infra/database.js'
import ScheduledTransactions from 'models/scheduled_transactions.js'
import { NotFoundError, ValidationError } from 'shared/errors.js'

function createTransaction(overrides = {}) {
  return {
    description: 'Internet bill',
    type: 'payable',
    frequency: 'monthly',
    next_date: '2024-06-10',
    currency: 'BRL',
    amount: 9000,
    certainty: 'fixed',
    should_postpone: false,
    user_triggered: false,
    status: 'active',
    ...overrides
  }
}

describe('ScheduledTransactions model', () => {
  let db
  let model

  beforeEach(() => {
    db = database.initialize({ dbPath: ':memory:' })
    model = new ScheduledTransactions(db)
  })

  afterEach(() => {
    if (db) {
      db.close()
      db = null
    }
  })

  describe('enforced business rules', () => {
    it('creates a scheduled transaction and returns id', () => {
      const result = model.create(createTransaction({ description: 'Rent' }))

      expect(result).toBeGreaterThan(0)

      const stored = model.getById(result)
      expect(stored.description).toBe('Rent')
      expect(stored.type).toBe('payable')
      expect(stored.frequency).toBe('monthly')
      expect(stored.next_date).toBe('2024-06-10')
      expect(stored.currency).toBe('BRL')
      expect(stored.status).toBe('active')
      expect(stored.created_at).toBeTruthy()
      expect(stored.updated_at).toBeTruthy()
    })

    it('normalizes boolean fields', () => {
      const id = model.create(createTransaction({ should_postpone: false, user_triggered: true }))

      const stored = model.getById(id)
      expect(stored.should_postpone).toBe(false)
      expect(stored.user_triggered).toBe(true)
    })

    it('allows nullable amount', () => {
      const id = model.create(createTransaction({ amount: null }))
      const stored = model.getById(id)
      expect(stored.amount).toBeNull()
    })

    it('returns all transactions sorted by description ascending', () => {
      model.create(createTransaction({ description: 'Zeta' }))
      model.create(createTransaction({ description: 'Alpha' }))

      const rows = model.getAll()
      expect(rows.length).toBe(2)
      expect(rows[0].description).toBe('Alpha')
      expect(rows[1].description).toBe('Zeta')
    })

    it('getActive returns only active transactions', () => {
      model.create(createTransaction({ description: 'Active one', status: 'active' }))
      model.create(createTransaction({ description: 'Paused one', status: 'paused' }))
      model.create(createTransaction({ description: 'Completed one', status: 'completed' }))

      const rows = model.getActive()
      expect(rows.length).toBe(1)
      expect(rows[0].description).toBe('Active one')
    })

    it('getUpcoming returns transactions due within N days', () => {
      const today = new Date().toISOString().slice(0, 10)
      const future = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
      const farFuture = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

      model.create(createTransaction({ description: 'Due soon', next_date: today }))
      model.create(createTransaction({ description: 'Due in 2d', next_date: future }))
      model.create(createTransaction({ description: 'Due in 30d', next_date: farFuture }))

      const rows = model.getUpcoming(3)
      expect(rows.length).toBe(2)
      expect(rows.map((r) => r.description)).toContain('Due soon')
      expect(rows.map((r) => r.description)).toContain('Due in 2d')
    })

    it('updates a transaction with partial fields and keeps other fields', () => {
      const id = model.create(
        createTransaction({ description: 'Old name', amount: 5000, status: 'active' })
      )

      const updated = model.update(id, { description: 'New name', amount: 7500 })

      expect(updated.description).toBe('New name')
      expect(updated.amount).toBe(7500)
      expect(updated.status).toBe('active')
      expect(updated.frequency).toBe('monthly')
    })

    it('deletes a transaction and returns true', () => {
      const id = model.create(createTransaction({ description: 'To delete' }))
      const result = model.delete(id)
      expect(result).toBe(true)
    })

    it('throws NotFoundError when getting a missing transaction', () => {
      expect(() => model.getById(999999)).toThrow(NotFoundError)
    })

    it('throws NotFoundError when deleting a missing transaction', () => {
      expect(() => model.delete(999999)).toThrow(NotFoundError)
    })

    it('rejects create when description is missing', () => {
      expect(() => model.create(createTransaction({ description: undefined }))).toThrow(
        ValidationError
      )
    })

    it('rejects create when direction is invalid', () => {
      expect(() => model.create(createTransaction({ type: 'invalid' }))).toThrow(ValidationError)
    })

    it('rejects create when frequency is invalid', () => {
      expect(() => model.create(createTransaction({ frequency: 'hourly' }))).toThrow(
        ValidationError
      )
    })

    it('accepts day-of-week pattern frequencies', () => {
      const id = model.create(createTransaction({ frequency: 'mon-fri' }))
      const stored = model.getById(id)
      expect(stored.frequency).toBe('mon-fri')
    })

    it('rejects update when an unknown field is provided', () => {
      const id = model.create(createTransaction())
      expect(() => model.update(id, { unknown_field: 'value' })).toThrow(ValidationError)
    })
  })
})
