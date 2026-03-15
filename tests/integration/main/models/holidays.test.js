import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import database from 'infra/database.js'
import Holidays from 'models/holidays.js'
import { NotFoundError, ValidationError } from 'shared/errors.js'

function createHoliday(overrides = {}) {
  return {
    description: 'Bank Holiday',
    type: 'National',
    date: '2024-01-01',
    is_business_day: false,
    should_count_as_business_day: false,
    ...overrides
  }
}

describe('Holidays model', () => {
  let db
  let holidays

  beforeEach(() => {
    db = database.initialize({ dbPath: ':memory:' })
    holidays = new Holidays(db)
  })

  afterEach(() => {
    if (db) {
      db.close()
      db = null
    }
  })

  it('creates a holiday and returns id', () => {
    const data = createHoliday({ description: 'New Year', is_business_day: true })
    const result = holidays.create(data)
    expect(result).toBeGreaterThan(0)

    const stored = holidays.getById(result)

    expect(stored.description).toBe('New Year')
    expect(stored.type).toBe('National')
    expect(stored.date).toBe('2024-01-01')
    expect(stored.is_business_day).toBe(true)
    expect(stored.should_count_as_business_day).toBe(false)
  })

  it('returns all holidays sorted by description', () => {
    holidays.create(createHoliday({ description: 'Z Holiday', date: '2024-02-01' }))
    holidays.create(createHoliday({ description: 'A Holiday', date: '2024-01-15' }))

    const rows = holidays.getAll()
    expect(rows.length).toBe(2)
    expect(rows[0].description).toBe('A Holiday')
    expect(rows[1].description).toBe('Z Holiday')
  })

  it('gets holidays by date', () => {
    holidays.create(createHoliday({ description: 'Match', date: '2024-03-10' }))
    holidays.create(createHoliday({ description: 'Other', date: '2024-03-11' }))

    const rows = holidays.getByDate('2024-03-10')
    expect(rows.length).toBe(1)
    expect(rows[0].description).toBe('Match')
  })

  it('gets holidays by year', () => {
    holidays.create(createHoliday({ description: '2024 Holiday', date: '2024-05-01' }))
    holidays.create(createHoliday({ description: '2025 Holiday', date: '2025-06-01' }))

    const rows = holidays.getByYear(2024)
    expect(rows.length).toBe(1)
    expect(rows[0].description).toBe('2024 Holiday')
  })

  it('updates a holiday and returns updated row', () => {
    const created = holidays.create(createHoliday({ description: 'Old' }))

    const updated = holidays.update(created, {
      description: 'New',
      should_count_as_business_day: true
    })

    expect(updated.id).toBe(created)
    expect(updated.description).toBe('New')
    expect(updated.should_count_as_business_day).toBe(true)
  })

  it('deletes a holiday and returns true', () => {
    const created = holidays.create(createHoliday({ description: 'To Delete' }))

    const result = holidays.delete(created)
    expect(result).toBe(true)
  })

  it('throws not found when getting a missing holiday by id', () => {
    expect(() => {
      holidays.getById(999999)
    }).toThrow(NotFoundError)
  })

  it('throws not found when deleting a missing holiday', () => {
    expect(() => {
      holidays.delete(999999)
    }).toThrow(NotFoundError)
  })

  it('throws validation error with format code for invalid date format', () => {
    let error

    try {
      holidays.create(createHoliday({ date: '2024/01/01' }))
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.code).toBe('INVALID_DATE_FORMAT')
  })

  it('throws validation error with value code for invalid calendar date', () => {
    let error

    try {
      holidays.create(createHoliday({ date: '2024-02-30' }))
    } catch (caughtError) {
      error = caughtError
    }

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.code).toBe('INVALID_DATE_VALUE')
  })
})
