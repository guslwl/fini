import { validatePayableCreate, validatePayableUpdate } from 'validators/payables_recurring.js'
import { ValidationError } from 'infra/errors.js'
import Payables from 'models/payables_recurring.js'
import { generateRecurringForMonth } from 'services/recurringGenerationService.js'

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
    return generateRecurringForMonth({
      dbClient,
      year,
      month
    })
  })
}
