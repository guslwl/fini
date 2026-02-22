import { validateHoliday, validateHolidayUpdate } from 'validators/holidays.js'
import { AppError, ValidationError } from 'infra/errors.js'
import Holidays from 'models/holidays.js'
export default function holidaysHandler(ipcMain, dbClient) {
  if (!dbClient) {
    throw new AppError({
      details: 'holidaysHandler did not receive a valid dbClient'
    })
  }

  ipcMain.handle('v1:holidays:getAll', () => {
    const holidays = new Holidays(dbClient)
    return holidays.getAll()
  })

  ipcMain.handle('v1:holidays:getByYear', (event, year) => {
    const holidays = new Holidays(dbClient)
    return holidays.getByYear(year)
  })

  ipcMain.handle('v1:holidays:getByDate', (event, date) => {
    const holidays = new Holidays(dbClient)
    return holidays.getByDate(date)
  })

  ipcMain.handle('v1:holidays:create', (event, data) => {
    const { isValid, errors } = validateHoliday(data)
    if (!isValid) {
      throw new ValidationError({
        message: 'invalid data was provided',
        cause: errors
      })
    }
    const holidays = new Holidays(dbClient)
    return holidays.create(data)
  })

  ipcMain.handle('v1:holidays:update', (event, id, data) => {
    const { isValid, errors } = validateHolidayUpdate(data)
    if (!isValid) {
      throw new ValidationError({
        message: 'invalid data was provided',
        cause: errors
      })
    }
    const holidays = new Holidays(dbClient)
    return holidays.update(id, data)
  })

  ipcMain.handle('v1:holidays:delete', (event, id) => {
    const holidays = new Holidays(dbClient)
    return holidays.delete(id)
  })
}
