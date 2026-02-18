import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  database: {
    getCurrentPath: () => ipcRenderer.invoke('database:getCurrentPath'),
    selectExisting: () => ipcRenderer.invoke('database:selectExisting'),
    createNew: () => ipcRenderer.invoke('database:createNew')
  },
  holidays: {
    getAll: () => ipcRenderer.invoke('holidays:getAll'),
    getByYear: (year) => ipcRenderer.invoke('holidays:getByYear', year),
    getByDate: (date) => ipcRenderer.invoke('holidays:getByDate', date),
    create: (data) => ipcRenderer.invoke('holidays:create', data),
    update: (id, data) => ipcRenderer.invoke('holidays:update', id, data),
    delete: (id) => ipcRenderer.invoke('holidays:delete', id)
  },
  payables: {
    getAll: () => ipcRenderer.invoke('payables:getAll'),
    getByMonth: (year, month) => ipcRenderer.invoke('payables:getByMonth', year, month),
    create: (data) => ipcRenderer.invoke('payables:create', data),
    createBulk: (dataArray) => ipcRenderer.invoke('payables:createBulk', dataArray),
    update: (id, data) => ipcRenderer.invoke('payables:update', id, data),
    delete: (id) => ipcRenderer.invoke('payables:delete', id),
    markAsPaid: (id) => ipcRenderer.invoke('payables:markAsPaid', id)
  },
  recurring: {
    getAll: () => ipcRenderer.invoke('recurring:getAll'),
    create: (data) => ipcRenderer.invoke('recurring:create', data),
    update: (id, data) => ipcRenderer.invoke('recurring:update', id, data),
    delete: (id) => ipcRenderer.invoke('recurring:delete', id),
    generateForMonth: (year, month) => ipcRenderer.invoke('recurring:generateForMonth', year, month)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
