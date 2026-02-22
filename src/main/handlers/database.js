import { BrowserWindow } from 'electron'
import * as settings from '../infra/settings.js'
import { testDatabaseConnection } from '../infra/db-validator.js'
import { selectExistingDatabase, createNewDatabase } from './database-select.js'

/**
 * Register IPC handlers for database operations
 * @param {Object} ipc - IPC handler wrapper with error handling
 */
export default function databaseHandler(ipc) {
  /**
   * Get the current database path
   */
  ipc.handle('v1:database:getCurrentPath', async () => {
    return settings.getLastDatabasePath()
  })

  /**
   * Select an existing database file
   */
  ipc.handle('v1:database:selectExisting', async (event) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    const path = await selectExistingDatabase(mainWindow)

    if (!path) {
      return { success: false, error: 'Selection cancelled' }
    }

    // Test connection before returning
    const testResult = await testDatabaseConnection(path)
    if (!testResult.success) {
      return { success: false, error: testResult.error }
    }

    return { success: true, path }
  })

  /**
   * Create a new database file
   */
  ipc.handle('v1:database:createNew', async (event) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    const path = await createNewDatabase(mainWindow)

    if (!path) {
      return { success: false, error: 'Creation cancelled' }
    }

    // Save path and return it
    settings.setDatabasePath(path)
    return { success: true, path }
  })

  /**
   * Switch to a different database
   * Note: Renderer should reload after this call
   */
  ipc.handle('v1:database:switch', async (event, dbPath) => {
    if (!dbPath) {
      return { success: false, error: 'Database path is required' }
    }

    // Test connection
    const testResult = await testDatabaseConnection(dbPath)
    if (!testResult.success) {
      return { success: false, error: testResult.error }
    }

    // Save new path
    settings.setDatabasePath(dbPath)
    return { success: true, path: dbPath }
  })
}
