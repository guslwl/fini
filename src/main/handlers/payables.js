import {
  validatePayableCreate,
  validatePayableBulk,
  validatePayableUpdate
} from '../validators/payables.js'
import { ValidationError } from '../infra/errors.js'
import Payables from '../models/payables.js'

export default function payablesHandler(ipcMain, dbClient) {
  ipcMain.handle('payables:getAll', () => {
    const payables = new Payables(dbClient)
    return payables.getAll()
  })

  ipcMain.handle('payables:getByMonth', (event, year, month) => {
    const payables = new Payables(dbClient)
    return payables.getByMonth(year, month)
  })

  ipcMain.handle('payables:create', (event, data) => {
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

  ipcMain.handle('payables:createBulk', (event, dataArray) => {
    const { isValid, errors } = validatePayableBulk(dataArray)
    if (!isValid) {
      throw new ValidationError({
        message: 'invalid data was provided',
        cause: errors
      })
    }
    const payables = new Payables(dbClient)
    return payables.createBulk(dataArray)
  })

  ipcMain.handle('payables:update', (event, id, data) => {
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

  ipcMain.handle('payables:delete', (event, id) => {
    const payables = new Payables(dbClient)
    return payables.delete(id)
  })

  ipcMain.handle('payables:markAsPaid', (event, id) => {
    const payables = new Payables(dbClient)
    return payables.markAsPaid(id)
  })
}
