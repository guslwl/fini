import Payables from 'models/payables.js'

export default function payablesHandler(ipcMain, dbClient) {
  ipcMain.handle('v1:payables:getAll', () => {
    const payables = new Payables(dbClient)
    return payables.getAll()
  })

  ipcMain.handle('v1:payables:getByMonth', (event, year, month) => {
    const payables = new Payables(dbClient)
    return payables.getByMonth(year, month)
  })

  ipcMain.handle('v1:payables:create', (event, data) => {
    const payables = new Payables(dbClient)
    return payables.create(data)
  })

  ipcMain.handle('v1:payables:createBulk', (event, dataArray) => {
    const payables = new Payables(dbClient)
    return payables.createBulk(dataArray)
  })

  ipcMain.handle('v1:payables:update', (event, id, data) => {
    const payables = new Payables(dbClient)
    return payables.update(id, data)
  })

  ipcMain.handle('v1:payables:delete', (event, id) => {
    const payables = new Payables(dbClient)
    return payables.delete(id)
  })

  ipcMain.handle('v1:payables:markAsPaid', (event, id) => {
    const payables = new Payables(dbClient)
    return payables.markAsPaid(id)
  })

  ipcMain.handle('v1:payables:markAsUnpaid', (event, id) => {
    const payables = new Payables(dbClient)
    return payables.markAsUnpaid(id)
  })
}
