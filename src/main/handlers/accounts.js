import { AppError } from 'shared/errors.js'
import Accounts from 'models/accounts.js'

export default function accountsHandler(ipcMain, dbClient) {
  if (!dbClient) {
    throw new AppError({
      details: 'accountsHandler did not receive a valid dbClient'
    })
  }

  ipcMain.handle('v1:accounts:getAll', () => {
    const accounts = new Accounts(dbClient)
    return accounts.getAll()
  })

  ipcMain.handle('v1:accounts:getById', (event, id) => {
    const accounts = new Accounts(dbClient)
    return accounts.getById(id)
  })

  ipcMain.handle('v1:accounts:create', (event, data) => {
    const accounts = new Accounts(dbClient)
    return accounts.create(data)
  })

  ipcMain.handle('v1:accounts:update', (event, id, data) => {
    const accounts = new Accounts(dbClient)
    return accounts.update(id, data)
  })

  ipcMain.handle('v1:accounts:archive', (event, id) => {
    const accounts = new Accounts(dbClient)
    return accounts.archive(id)
  })

  ipcMain.handle('v1:accounts:unarchive', (event, id) => {
    const accounts = new Accounts(dbClient)
    return accounts.unarchive(id)
  })

  ipcMain.handle('v1:accounts:delete', (event, id) => {
    const accounts = new Accounts(dbClient)
    return accounts.delete(id)
  })
}
