import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import database from 'infra/database.js'
import RecurringPayables from 'models/payables_recurring.js'
import Payables from 'models/payables.js'
import { ValidationError } from 'infra/errors.js'
import { generateRecurringForMonth } from 'services/recurringGenerationService.js'

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

function createPayable(overrides = {}) {
  return {
    history: 'Electric bill',
    invoice_id: null,
    account_id: null,
    due_date: '2024-05-10',
    preferred_date: null,
    value: 15000,
    parent_id: null,
    paid_at: null,
    ...overrides
  }
}

describe('recurringGenerationService', () => {
  let db
  let recurringPayables
  let payables

  beforeEach(() => {
    db = database.initialize({ dbPath: ':memory:' })
    recurringPayables = new RecurringPayables(db)
    payables = new Payables(db)
  })

  afterEach(() => {
    if (db) {
      db.close()
      db = null
    }
  })

  it('generates payables and returns summary counters', () => {
    const recurringId = recurringPayables.create(createRecurring({ history: 'Internet' }))

    const result = generateRecurringForMonth({ dbClient: db, year: 2024, month: 5 })

    expect(result.generated).toBe(1)
    expect(result.skipped).toBe(0)
    expect(result.year).toBe(2024)
    expect(result.month).toBe(5)
    expect(result.skippedDetails).toEqual([])

    const rows = payables.getAll()
    expect(rows.length).toBe(1)
    expect(rows[0].history).toBe('Internet')
    expect(rows[0].due_date).toBe('2024-05-10')
    expect(rows[0].parent_id).toBe(recurringId)
  })

  it('skips duplicates by history and due_date and returns skip details', () => {
    const recurringId = recurringPayables.create(createRecurring({ history: 'Rent', due_day: 15 }))
    payables.create(createPayable({ history: 'Rent', due_date: '2024-05-15' }))

    const result = generateRecurringForMonth({ dbClient: db, year: 2024, month: 5 })

    expect(result.generated).toBe(0)
    expect(result.skipped).toBe(1)
    expect(result.skippedDetails).toEqual([
      {
        recurring_id: recurringId,
        history: 'Rent',
        reason: 'already_exists',
        due_date: '2024-05-15'
      }
    ])
  })

  it('skips rows with invalid due_day and returns row details', () => {
    const insertLegacy = db.prepare(
      `INSERT INTO payables_recurring (history, due_day, should_postpone, value, notes)
       VALUES (?, ?, ?, ?, ?)`
    )
    const legacy = insertLegacy.run('No due day', null, 1, 15000, 'legacy')
    const recurringId = legacy.lastInsertRowid

    const result = generateRecurringForMonth({ dbClient: db, year: 2024, month: 5 })

    expect(result.generated).toBe(0)
    expect(result.skipped).toBe(1)
    expect(result.skippedDetails).toEqual([
      {
        recurring_id: recurringId,
        history: 'No due day',
        reason: 'invalid_due_day',
        due_day: null
      }
    ])

    const rows = payables.getAll()
    expect(rows.length).toBe(0)
  })

  it('allows cross-month adjusted due dates', () => {
    recurringPayables.create(
      createRecurring({
        history: 'Payroll',
        due_day: 1,
        should_postpone: false
      })
    )

    const result = generateRecurringForMonth({ dbClient: db, year: 2024, month: 6 })

    expect(result.generated).toBe(1)
    expect(result.skipped).toBe(0)

    const rows = payables.getAll()
    expect(rows.length).toBe(1)
    expect(rows[0].due_date).toBe('2024-05-31')
  })

  it('throws validation error when input values are invalid', () => {
    expect(() => {
      generateRecurringForMonth({ dbClient: db, year: 2024, month: 13 })
    }).toThrow(ValidationError)

    expect(() => {
      generateRecurringForMonth({ dbClient: db, year: '2024', month: 5 })
    }).toThrow(ValidationError)
  })
})
