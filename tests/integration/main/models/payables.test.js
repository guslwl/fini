import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import database from 'infra/database.js'
import Payables from 'models/payables.js'
import { NotFoundError, ValidationError } from 'infra/errors.js'

function createPayable(overrides = {}) {
  return {
    history: 'Invoice A',
    invoice_id: 'INV-001',
    account_id: 'ACC-001',
    due_date: '2024-01-10',
    preferred_date: null,
    value: 1500,
    parent_id: null,
    paid_at: null,
    ...overrides
  }
}

describe('Payables model', () => {
  let db
  let payables

  beforeEach(() => {
    db = database.initialize({ dbPath: ':memory:' })
    payables = new Payables(db)
  })

  afterEach(() => {
    if (db) {
      db.close()
      db = null
    }
  })

  it('creates a payable and returns id', () => {
    const data = createPayable({ history: 'Invoice B', value: 2200 })
    const result = payables.create(data)

    expect(result).toBeGreaterThan(0)

    const stored = payables.getById(result)
    expect(stored.history).toBe('Invoice B')
    expect(stored.value).toBe(2200)
    expect(stored.invoice_id).toBe('INV-001')
  })

  it('returns all payables sorted by history', () => {
    payables.create(createPayable({ history: 'Z Payable', due_date: '2024-02-01' }))
    payables.create(createPayable({ history: 'A Payable', due_date: '2024-01-15' }))

    const rows = payables.getAll()
    expect(rows.length).toBe(2)
    expect(rows[0].history).toBe('A Payable')
    expect(rows[1].history).toBe('Z Payable')
  })

  it('gets payables by id', () => {
    const created = payables.create(createPayable({ history: 'Find Me' }))

    const row = payables.getById(created)
    expect(row).toBeDefined()
    expect(row.history).toBe('Find Me')
  })

  it('gets payables by month using due_date when preferred_date is null', () => {
    payables.create(createPayable({ history: 'Jan', due_date: '2024-01-05' }))
    payables.create(createPayable({ history: 'Feb', due_date: '2024-02-10' }))

    const rows = payables.getByMonth(2024, 1)
    expect(rows.length).toBe(1)
    expect(rows[0].history).toBe('Jan')
  })

  it('gets payables by month using preferred_date when present', () => {
    payables.create(
      createPayable({
        history: 'Pref Date',
        due_date: '2024-01-10',
        preferred_date: '2024-03-02'
      })
    )

    const rows = payables.getByMonth(2024, 3)
    expect(rows.length).toBe(1)
    expect(rows[0].history).toBe('Pref Date')
  })

  it('checks if payable exists by history and due_date', () => {
    payables.create(createPayable({ history: 'Rent', due_date: '2024-03-15' }))

    const exists = payables.existsByHistoryAndDueDate('Rent', '2024-03-15')
    const missing = payables.existsByHistoryAndDueDate('Rent', '2024-03-16')

    expect(exists).toBe(true)
    expect(missing).toBe(false)
  })

  it('updates a payable and returns updated row', () => {
    const created = payables.create(createPayable({ history: 'Old', value: 1000 }))

    const updated = payables.update(created, {
      history: 'New',
      value: 2000
    })

    expect(updated.id).toBe(created)
    expect(updated.history).toBe('New')
    expect(updated.value).toBe(2000)
  })

  it('marks a payable as paid', () => {
    const created = payables.create(createPayable({ history: 'To Pay' }))

    const result = payables.markAsPaid(created)
    expect(result.paid_at).toBeTruthy()

    const stored = payables.getById(created)
    expect(stored.paid_at).toBeTruthy()
  })

  it('marks a payable as unpaid', () => {
    const created = payables.create(createPayable({ history: 'To Unpay' }))
    payables.markAsPaid(created)

    const result = payables.markAsUnpaid(created)
    expect(result.paid_at).toBeNull()

    const stored = payables.getById(created)
    expect(stored.paid_at).toBeNull()
  })

  it('deletes a payable and returns changes count', () => {
    const created = payables.create(createPayable({ history: 'To Delete' }))

    const result = payables.delete(created)
    expect(result).toBe(true)
  })

  it('throws not found when getting a missing payable by id', () => {
    expect(() => {
      payables.getById(999999)
    }).toThrow(NotFoundError)
  })

  it('throws not found when marking a missing payable as paid', () => {
    expect(() => {
      payables.markAsPaid(999999)
    }).toThrow(NotFoundError)
  })

  it('throws not found when marking a missing payable as unpaid', () => {
    expect(() => {
      payables.markAsUnpaid(999999)
    }).toThrow(NotFoundError)
  })

  it('throws not found when deleting a missing payable', () => {
    expect(() => {
      payables.delete(999999)
    }).toThrow(NotFoundError)
  })

  it('throws validation error with format code when due_date has invalid format', () => {
    let error

    try {
      payables.create(createPayable({ due_date: '2024/01/10' }))
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.code).toBe('INVALID_DATE_FORMAT')
  })

  it('throws validation error with value code when due_date is not a real date', () => {
    let error

    try {
      payables.create(createPayable({ due_date: '2024-02-30' }))
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.code).toBe('INVALID_DATE_VALUE')
  })

  it('creates payables in bulk and returns ids', () => {
    const data = [
      createPayable({ history: 'Bulk A', invoice_id: 'INV-A' }),
      createPayable({ history: 'Bulk B', invoice_id: 'INV-B' })
    ]

    const result = payables.createBulk(data)
    expect(result.length).toBe(2)

    const rows = payables.getAll()
    expect(rows.length).toBe(2)
  })
})
