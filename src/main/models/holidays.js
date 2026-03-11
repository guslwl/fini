import { assertValidCalendarDate } from 'utils/dateHelper.js'
import { NotFoundError, ValidationError } from 'infra/errors.js'
import booleanHelper from 'utils/booleanHelper.js'

export default class Holidays {
  constructor(dbClient) {
    this.dbClient = dbClient
  }

  create(holiday) {
    this._validateHoliday(holiday)

    let { description, type, date, is_business_day, should_count_as_business_day } = holiday

    is_business_day = booleanHelper.parseToDBValue(is_business_day)
    should_count_as_business_day = booleanHelper.parseToDBValue(should_count_as_business_day)

    const result = this.dbClient
      .prepare(
        `INSERT INTO holidays (description, type, date, is_business_day, should_count_as_business_day)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(description, type, date, is_business_day, should_count_as_business_day)
    return result.lastInsertRowid
  }

  getAll() {
    return this.dbClient.prepare('SELECT * FROM holidays ORDER BY description ASC').all()
  }

  getById(id) {
    const result = this.dbClient.prepare('SELECT * FROM holidays WHERE id = ?').get(id)

    if (!result) {
      throw new NotFoundError({
        message: `Holiday with id (${id}) was not found`,
        details: { id, entity: 'holiday' }
      })
    }

    return result
  }

  getByDate(date) {
    return this.dbClient
      .prepare('SELECT * FROM holidays WHERE date = ? ORDER BY description ASC')
      .all(date)
  }

  getByYear(year) {
    return this.dbClient
      .prepare("SELECT * FROM holidays WHERE strftime('%Y', date) = ? ORDER BY description ASC")
      .all(year.toString())
  }

  update(id, data) {
    this._validateHolidayUpdate(data)

    const currentHoliday = this.getById(id)

    const dbClient = this.dbClient

    const holidayWithNewValues = { ...currentHoliday, ...data }

    assertValidCalendarDate(holidayWithNewValues.date, 'date')

    holidayWithNewValues.is_business_day = booleanHelper.parseToDBValue(
      holidayWithNewValues.is_business_day,
      'is_business_day'
    )
    holidayWithNewValues.should_count_as_business_day = booleanHelper.parseToDBValue(
      holidayWithNewValues.should_count_as_business_day,
      'should_count_as_business_day'
    )

    const updatedHoliday = updateHoliday(holidayWithNewValues)

    return updatedHoliday

    function updateHoliday(holiday) {
      return dbClient
        .prepare(
          `UPDATE holidays
           SET description = ?, type = ?, date = ?, is_business_day = ?, should_count_as_business_day = ?
           WHERE id = ?
           RETURNING *`
        )
        .get(
          holiday.description,
          holiday.type,
          holiday.date,
          holiday.is_business_day,
          holiday.should_count_as_business_day,
          holiday.id
        )
    }
  }

  delete(id) {
    const result = this.dbClient.prepare('DELETE FROM holidays WHERE id = ?').run(id)

    if (result.changes === 0) {
      throw new NotFoundError({
        message: `Holiday with id ${id} was not found`,
        details: { id, entity: 'holiday' }
      })
    }

    return true
  }

  _validateHoliday(data) {
    this._assertDataObject(data)

    assertValidCalendarDate(data.date, 'date')

    const errors = []

    if (!data.description || typeof data.description !== 'string') {
      errors.push('description is required and must be a string')
    }

    if (typeof data.type !== 'string') {
      errors.push('type must be a string')
    }

    if (typeof data.is_business_day !== 'boolean') {
      errors.push('is_business_day must be a boolean')
    }

    if (typeof data.should_count_as_business_day !== 'boolean') {
      errors.push('should_count_as_business_day must be a boolean')
    }

    if (errors.length > 0) {
      throw new ValidationError({
        message: 'invalid data was provided',
        cause: errors
      })
    }
  }

  _validateHolidayUpdate(data) {
    this._assertDataObject(data)

    const errors = []
    const allowedFields = [
      'description',
      'type',
      'date',
      'is_business_day',
      'should_count_as_business_day'
    ]

    Object.keys(data).forEach((key) => {
      if (!allowedFields.includes(key)) {
        errors.push(`${key} is not a valid field`)
      }
    })

    if (data.description !== undefined && typeof data.description !== 'string') {
      errors.push('description must be a string')
    }

    if (data.date !== undefined) {
      assertValidCalendarDate(data.date, 'date')
    }

    if (data.type !== undefined && typeof data.type !== 'string') {
      errors.push('type must be a string')
    }

    if (data.is_business_day !== undefined && typeof data.is_business_day !== 'boolean') {
      errors.push('is_business_day must be a boolean')
    }

    if (
      data.should_count_as_business_day !== undefined &&
      typeof data.should_count_as_business_day !== 'boolean'
    ) {
      errors.push('should_count_as_business_day must be a boolean')
    }

    if (errors.length > 0) {
      throw new ValidationError({
        message: 'invalid data was provided',
        cause: errors
      })
    }
  }

  _assertDataObject(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new ValidationError({
        message: 'invalid data was provided',
        cause: ['a holiday must be provided']
      })
    }
  }
}
