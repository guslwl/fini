import { assertValidCalendarDate } from 'validators/date-validator.js'
import { NotFoundError } from 'infra/errors.js'
import booleanValueService from 'services/booleanValueService.js'

export default class Holidays {
  constructor(dbClient) {
    this.dbClient = dbClient
  }

  create(holiday) {
    let { description, type, date, is_business_day, should_count_as_business_day } = holiday

    assertValidCalendarDate(date, 'date')

    is_business_day = booleanValueService.parseToDBValue(is_business_day)
    should_count_as_business_day = booleanValueService.parseToDBValue(should_count_as_business_day)

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
    const currentHoliday = this.getById(id)

    const dbClient = this.dbClient

    const holidayWithNewValues = { ...currentHoliday, ...data }

    assertValidCalendarDate(holidayWithNewValues.date, 'date')

    holidayWithNewValues.is_business_day = booleanValueService.parseToDBValue(
      holidayWithNewValues.is_business_day,
      'is_business_day'
    )
    holidayWithNewValues.should_count_as_business_day = booleanValueService.parseToDBValue(
      holidayWithNewValues.should_count_as_business_day,
      'should_count_as_bussiness_day'
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
}
