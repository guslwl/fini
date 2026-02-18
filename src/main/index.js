import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import * as settings from './infra/settings.js'

import database from './infra/database.js'
import { testDatabaseConnection } from './infra/db-validator.js'
import { promptDatabaseSelection } from './handlers/database-select.js'
import { createApplicationMenu, updateDatabaseMenuLabel } from './menu.js'

import databaseHandler from './handlers/database.js'
import holidaysHandler from './handlers/holidays.js'
import payablesRecurringHandler from './handlers/payables_recurring.js'
import payablesHandler from './handlers/payables.js'

import * as errorHandler from './infra/error-handler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

errorHandler.registerGlobalErrorHandlers()

const createIpcMain = (baseIpcMain) => ({
  handle: (channel, handler) => {
    baseIpcMain.handle(channel, async (event, ...args) => {
      try {
        return await handler(event, ...args)
      } catch (error) {
        const normalizedError = errorHandler.normalizeError(error)
        errorHandler.logError(`ipc:${channel}`, normalizedError)
        throw new errorHandler.toIpcError(normalizedError)
      }
    })
  }
})

/**
 * Get or prompt for database path at startup
 * @param {BrowserWindow} mainWindow - Main application window
 * @returns {Promise<string>} Absolute path to database file
 */
const getDatabasePathAtStartup = async (mainWindow) => {
  // Check if we have a stored database path
  let dbPath = settings.getLastDatabasePath()

  // If we have a stored path, test if it's still valid
  if (dbPath) {
    const testResult = await testDatabaseConnection(dbPath)
    if (testResult.success) {
      console.log(`Loading database from: ${dbPath}`)
      return dbPath
    }
    console.warn(`Stored database path is invalid: ${testResult.error}`)
  }

  // No valid stored path, prompt user to select or create
  const selection = await promptDatabaseSelection(mainWindow)

  if (!selection) {
    // User cancelled - exit app
    app.quit()
    throw new Error('Database selection cancelled by user')
  }

  dbPath = selection.path

  // Save the selected path for next time
  settings.setDatabasePath(dbPath)
  console.log(`New database path saved: ${dbPath}`)

  return dbPath
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js')
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))
  }

  return win
}

app.whenReady().then(async () => {
  const mainWindow = createWindow()

  // Create application menu
  createApplicationMenu(mainWindow)

  // Get database path - prompt user if needed
  const dbPath = await getDatabasePathAtStartup(mainWindow)

  // Initialize database with selected path
  const db = database.initialize({
    dbPath
  })
  console.log('Database version: ', database.getVersion(db))

  // Update menu with current database
  updateDatabaseMenuLabel()

  // Set up IPC handlers
  const ipc = createIpcMain(ipcMain)
  databaseHandler(ipc)
  holidaysHandler(ipc, db)
  payablesHandler(ipc, db)
  payablesRecurringHandler(ipc, db)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
