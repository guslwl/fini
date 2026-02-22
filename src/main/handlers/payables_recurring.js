import { validatePayableCreate, validatePayableUpdate } from '../validators/payables_recurring.js'
import { ValidationError } from '../infra/errors.js'
import Payables from '../models/payables_recurring.js'
import PayablesModel from '../models/payables.js'
import Holidays from '../models/holidays.js'
import { adjustForBusinessDay } from '../services/businessDayService.js'

export default function payablesRecurringHandler(ipcMain, dbClient) {
  ipcMain.handle('v1:recurring:getAll', () => {
    const payables = new Payables(dbClient)
    return payables.getAll()
  })

  ipcMain.handle('v1:recurring:create', (event, data) => {
    const { isValid, errors } = validatePayableCreate(data)
    if (!isValid) {
      throw new ValidationError({
        message: 'invalid data was provided',
        cause: errors
      })
    }
    const payables = new Payables(dbClient)
    return payables.create(data)
  })

  ipcMain.handle('v1:recurring:update', (event, id, data) => {
    const { isValid, errors } = validatePayableUpdate(data)
    if (!isValid) {
      throw new ValidationError({
        message: 'invalid data was provided',
        cause: errors
      })
    }
    const payables = new Payables(dbClient)
    return payables.update(id, data)
  })

  ipcMain.handle('v1:recurring:delete', (event, id) => {
    const payables = new Payables(dbClient)
    return payables.delete(id)
  })

  ipcMain.handle('v1:recurring:generateForMonth', (event, year, month) => {
    // Validate input
    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      throw new ValidationError({
        message: 'Year and month must be integers',
        cause: ['year is not an integer', 'month is not an integer']
      })
    }
    if (month < 1 || month > 12) {
      throw new ValidationError({
        message: 'Month must be between 1 and 12',
        cause: ['month is out of range']
      })
    }

    const recurringPayables = new Payables(dbClient)
    const payablesModel = new PayablesModel(dbClient)
    const holidaysModel = new Holidays(dbClient)

    // Get all recurring payables
    const allRecurring = recurringPayables.getAll()

    // Get all holidays for the year
    const allHolidays = holidaysModel.getByYear(year)

    // Generate payables for each recurring item
    let generatedCount = 0
    for (const recurring of allRecurring) {
      // Calculate the nominal due date for this month
      const dueDay = recurring.due_day
      // Ensure due_day is valid for this month
      const lastDayOfMonth = new Date(year, month, 0).getDate()
      const actualDueDay = Math.min(dueDay, lastDayOfMonth)

      const nominalDate = new Date(year, month - 1, actualDueDay)
      const nominalDateString = nominalDate.toISOString().split('T')[0]

      // Apply business day adjustment
      const adjustedDateString = adjustForBusinessDay(
        nominalDateString,
        recurring.should_postpone ? true : false,
        allHolidays
      )

      // Create the payable
      const payableData = {
        history: recurring.history,
        invoice_id: null,
        account_id: null,
        due_date: adjustedDateString,
        preferred_date: null,
        value: recurring.value,
        parent_id: recurring.id,
        paid_at: null
      }

      payablesModel.create(payableData)
      generatedCount++
    }

    return {
      generated: generatedCount,
      year,
      month
    }
  })
}
