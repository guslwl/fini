import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import database from 'infra/database.js'
import ScheduledTransactions from 'models/scheduled_transactions.js'
import Payables from 'models/payables.js'
import {
  generate,
  confirmGeneration,
  advanceNextDate
} from 'services/scheduledTransactionService.js'

function createTransaction(overrides = {}) {
  return {
    description: 'Internet bill',
    type: 'payable',
    frequency: 'monthly',
    next_date: '2024-05-10',
    currency: 'BRL',
    amount: 9000,
    certainty: 'fixed',
    should_postpone: false,
    user_triggered: false,
    status: 'active',
    ...overrides
  }
}

describe('scheduledTransactionService', () => {
  let db
  let scheduledModel
  let payablesModel

  beforeEach(() => {
    db = database.initialize({ dbPath: ':memory:' })
    scheduledModel = new ScheduledTransactions(db)
    payablesModel = new Payables(db)
  })

  afterEach(() => {
    if (db) {
      db.close()
      db = null
    }
  })

  describe('generate', () => {
    it('returns preview items for transactions due today or overdue', () => {
      const today = new Date().toISOString().slice(0, 10)
      scheduledModel.create(createTransaction({ next_date: today }))

      const items = generate({ dbClient: db, asOfDate: today })

      expect(items.length).toBe(1)
      expect(items[0].skipped).toBe(false)
      expect(items[0].needs_input).toBe(false)
      expect(items[0].description).toBe('Internet bill')
    })

    it('returns preview items for transactions due tomorrow', () => {
      const today = new Date().toISOString().slice(0, 10)
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      scheduledModel.create(createTransaction({ next_date: tomorrow }))

      const items = generate({ dbClient: db, asOfDate: today })

      expect(items.length).toBe(1)
      expect(items[0].skipped).toBe(false)
    })

    it('does not include transactions with next_date after tomorrow', () => {
      const today = new Date().toISOString().slice(0, 10)
      const dayAfterTomorrow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
      scheduledModel.create(createTransaction({ next_date: dayAfterTomorrow }))

      const items = generate({ dbClient: db, asOfDate: today })

      expect(items.length).toBe(0)
    })

    it('marks already-generated transactions as skipped with already_exists reason', () => {
      const id = scheduledModel.create(createTransaction({ next_date: '2024-05-10' }))
      payablesModel.create({
        history: 'Internet bill',
        invoice_id: null,
        account_id: null,
        currency: 'BRL',
        due_date: '2024-05-10',
        preferred_date: null,
        value: 9000,
        parent_id: id,
        paid_at: null
      })

      const items = generate({ dbClient: db, asOfDate: '2024-05-10' })

      expect(items.length).toBe(1)
      expect(items[0].skipped).toBe(true)
      expect(items[0].skip_reason).toBe('already_exists')
    })

    it('marks unknown certainty items as needs_input', () => {
      scheduledModel.create(
        createTransaction({ next_date: '2024-05-10', certainty: 'unknown', amount: null })
      )

      const items = generate({ dbClient: db, asOfDate: '2024-05-10' })

      expect(items[0].needs_input).toBe(true)
    })

    it('marks null amount items as needs_input', () => {
      scheduledModel.create(createTransaction({ next_date: '2024-05-10', amount: null }))

      const items = generate({ dbClient: db, asOfDate: '2024-05-10' })

      expect(items[0].needs_input).toBe(true)
    })

    it('does not include paused transactions', () => {
      scheduledModel.create(createTransaction({ next_date: '2024-05-10', status: 'paused' }))

      const items = generate({ dbClient: db, asOfDate: '2024-05-10' })

      expect(items.length).toBe(0)
    })
  })

  describe('confirmGeneration', () => {
    it('creates payables and returns counts', () => {
      const txId = scheduledModel.create(createTransaction({ next_date: '2024-05-10' }))

      const previewItems = [
        {
          scheduled_transaction_id: txId,
          description: 'Internet bill',
          amount: 9000,
          currency: 'BRL',
          type: 'payable',
          due_date: '2024-05-10',
          certainty: 'fixed',
          user_triggered: false,
          needs_input: false,
          skipped: false,
          skip_reason: null
        }
      ]

      const result = confirmGeneration({ dbClient: db, previewItems })

      expect(result.created).toBe(1)
      expect(result.skipped).toBe(0)

      const rows = payablesModel.getAll()
      expect(rows.length).toBe(1)
      expect(rows[0].history).toBe('Internet bill')
      expect(rows[0].parent_id).toBe(txId)
    })

    it('skips already-skipped preview items', () => {
      const txId = scheduledModel.create(createTransaction({ next_date: '2024-05-10' }))

      const previewItems = [
        {
          scheduled_transaction_id: txId,
          description: 'Internet bill',
          amount: 9000,
          currency: 'BRL',
          type: 'payable',
          due_date: '2024-05-10',
          certainty: 'fixed',
          user_triggered: false,
          needs_input: false,
          skipped: true,
          skip_reason: 'already_exists'
        }
      ]

      const result = confirmGeneration({ dbClient: db, previewItems })

      expect(result.created).toBe(0)
      expect(result.skipped).toBe(1)
      expect(payablesModel.getAll()).toHaveLength(0)
    })

    it('rolls back all inserts when one fails mid-generation', () => {
      const txId1 = scheduledModel.create(
        createTransaction({ description: 'Rent', next_date: '2024-05-10' })
      )
      const txId2 = scheduledModel.create(
        createTransaction({ description: 'Internet', next_date: '2024-05-10' })
      )

      const previewItems = [
        {
          scheduled_transaction_id: txId1,
          description: 'Rent',
          amount: 9000,
          currency: 'BRL',
          type: 'payable',
          due_date: '2024-05-10',
          certainty: 'fixed',
          user_triggered: false,
          needs_input: false,
          skipped: false,
          skip_reason: null
        },
        {
          scheduled_transaction_id: txId2,
          description: 'Internet',
          amount: 9000,
          currency: 'BRL',
          type: 'payable',
          due_date: '2024-05-10',
          certainty: 'fixed',
          user_triggered: false,
          needs_input: false,
          skipped: false,
          skip_reason: null
        }
      ]

      let callCount = 0
      const originalCreate = Payables.prototype.create
      const spy = vi.spyOn(Payables.prototype, 'create').mockImplementation(function (...args) {
        callCount++
        if (callCount === 2) throw new Error('simulated insert failure')
        return originalCreate.apply(this, args)
      })

      expect(() => confirmGeneration({ dbClient: db, previewItems })).toThrow(
        'simulated insert failure'
      )
      expect(payablesModel.getAll()).toHaveLength(0)

      spy.mockRestore()
    })
  })

  describe('advanceNextDate', () => {
    it('advances monthly frequency by one month', () => {
      const id = scheduledModel.create(
        createTransaction({ next_date: '2024-05-10', frequency: 'monthly' })
      )

      advanceNextDate({ dbClient: db, scheduledTransactionId: id })

      const updated = scheduledModel.getById(id)
      expect(updated.next_date).toBe('2024-06-10')
      expect(updated.occurrences_count).toBe(1)
    })

    it('advances weekly frequency by 7 days', () => {
      const id = scheduledModel.create(
        createTransaction({ next_date: '2024-05-10', frequency: 'weekly' })
      )

      advanceNextDate({ dbClient: db, scheduledTransactionId: id })

      const updated = scheduledModel.getById(id)
      expect(updated.next_date).toBe('2024-05-17')
    })

    it('advances daily frequency by 1 day', () => {
      const id = scheduledModel.create(
        createTransaction({ next_date: '2024-05-10', frequency: 'daily' })
      )

      advanceNextDate({ dbClient: db, scheduledTransactionId: id })

      const updated = scheduledModel.getById(id)
      expect(updated.next_date).toBe('2024-05-11')
    })

    it('advances biweekly frequency by 14 days', () => {
      const id = scheduledModel.create(
        createTransaction({ next_date: '2024-05-10', frequency: 'biweekly' })
      )

      advanceNextDate({ dbClient: db, scheduledTransactionId: id })

      const updated = scheduledModel.getById(id)
      expect(updated.next_date).toBe('2024-05-24')
    })

    it('advances quarterly frequency by 3 months', () => {
      const id = scheduledModel.create(
        createTransaction({ next_date: '2024-01-15', frequency: 'quarterly' })
      )

      advanceNextDate({ dbClient: db, scheduledTransactionId: id })

      const updated = scheduledModel.getById(id)
      expect(updated.next_date).toBe('2024-04-15')
    })

    it('advances annual frequency by 1 year', () => {
      const id = scheduledModel.create(
        createTransaction({ next_date: '2024-05-10', frequency: 'annual' })
      )

      advanceNextDate({ dbClient: db, scheduledTransactionId: id })

      const updated = scheduledModel.getById(id)
      expect(updated.next_date).toBe('2025-05-10')
    })

    it('clamps monthly advance to last day of month', () => {
      const id = scheduledModel.create(
        createTransaction({ next_date: '2024-01-31', frequency: 'monthly' })
      )

      advanceNextDate({ dbClient: db, scheduledTransactionId: id })

      const updated = scheduledModel.getById(id)
      expect(updated.next_date).toBe('2024-02-29') // 2024 is leap year
    })

    it('marks as completed when frequency is once', () => {
      const id = scheduledModel.create(
        createTransaction({ next_date: '2024-05-10', frequency: 'once' })
      )

      advanceNextDate({ dbClient: db, scheduledTransactionId: id })

      const updated = scheduledModel.getById(id)
      expect(updated.status).toBe('completed')
    })

    it('marks as completed when after_n end condition is met', () => {
      const id = scheduledModel.create(
        createTransaction({
          next_date: '2024-05-10',
          frequency: 'monthly',
          end_type: 'after_n',
          end_after_n: 1
        })
      )

      advanceNextDate({ dbClient: db, scheduledTransactionId: id })

      const updated = scheduledModel.getById(id)
      expect(updated.status).toBe('completed')
      expect(updated.occurrences_count).toBe(1)
    })

    it('marks as completed when until_date end condition is passed', () => {
      const id = scheduledModel.create(
        createTransaction({
          next_date: '2024-05-10',
          frequency: 'monthly',
          end_type: 'until_date',
          end_date: '2024-05-15'
        })
      )

      advanceNextDate({ dbClient: db, scheduledTransactionId: id })

      const updated = scheduledModel.getById(id)
      expect(updated.status).toBe('completed')
    })

    it('advances day-of-week pattern to next matching weekday', () => {
      // 2024-05-10 is a Friday; next mon-fri day after Friday is Monday 2024-05-13
      const id = scheduledModel.create(
        createTransaction({ next_date: '2024-05-10', frequency: 'mon-fri' })
      )

      advanceNextDate({ dbClient: db, scheduledTransactionId: id })

      const updated = scheduledModel.getById(id)
      expect(updated.next_date).toBe('2024-05-13')
    })
  })
})
