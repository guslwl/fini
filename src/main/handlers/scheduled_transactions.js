import ScheduledTransactions from 'models/scheduled_transactions.js'
import {
  generate,
  confirmGeneration,
  getUpcoming
} from 'services/scheduledTransactionService.js'

export default function scheduledTransactionsHandler(ipcMain, dbClient) {
  ipcMain.handle('v1:scheduledTransactions:getAll', () => {
    const model = new ScheduledTransactions(dbClient)
    return model.getAll()
  })

  ipcMain.handle('v1:scheduledTransactions:create', (event, data) => {
    const model = new ScheduledTransactions(dbClient)
    return model.create(data)
  })

  ipcMain.handle('v1:scheduledTransactions:update', (event, id, data) => {
    const model = new ScheduledTransactions(dbClient)
    return model.update(id, data)
  })

  ipcMain.handle('v1:scheduledTransactions:delete', (event, id) => {
    const model = new ScheduledTransactions(dbClient)
    return model.delete(id)
  })

  ipcMain.handle('v1:scheduledTransactions:generate', (event, asOfDate) => {
    return generate({ dbClient, asOfDate })
  })

  ipcMain.handle('v1:scheduledTransactions:confirmGeneration', (event, previewItems) => {
    return confirmGeneration({ dbClient, previewItems })
  })

  ipcMain.handle('v1:scheduledTransactions:getUpcoming', (event, days) => {
    return getUpcoming({ dbClient, days })
  })
}
