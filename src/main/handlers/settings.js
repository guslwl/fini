import { app } from 'electron'

import { getLanguage, setLanguage } from 'infra/settings.js'

export default function settingsHandler(ipcMain) {
  ipcMain.handle('v1:settings:getLanguage', () => getLanguage())
  ipcMain.handle('v1:settings:setLanguage', (event, locale) => {
    setLanguage(locale)
    setImmediate(() => {
      app.relaunch()
      app.exit(0)
    })
  })
}
