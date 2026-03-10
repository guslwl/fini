import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  v1: {
    database: {
      getCurrentPath: () => ipcRenderer.invoke('v1:database:getCurrentPath'),
      selectExisting: () => ipcRenderer.invoke('v1:database:selectExisting'),
      createNew: () => ipcRenderer.invoke('v1:database:createNew'),
      switch: (dbPath) => ipcRenderer.invoke('v1:database:switch', dbPath)
    },
    holidays: {
      getAll: () => ipcRenderer.invoke('v1:holidays:getAll'),
      getByYear: (year) => ipcRenderer.invoke('v1:holidays:getByYear', year),
      getByDate: (date) => ipcRenderer.invoke('v1:holidays:getByDate', date),
      create: (data) => ipcRenderer.invoke('v1:holidays:create', data),
      update: (id, data) => ipcRenderer.invoke('v1:holidays:update', id, data),
      delete: (id) => ipcRenderer.invoke('v1:holidays:delete', id)
    },
    payables: {
      getAll: () => ipcRenderer.invoke('v1:payables:getAll'),
      getByMonth: (year, month) => ipcRenderer.invoke('v1:payables:getByMonth', year, month),
      create: (data) => ipcRenderer.invoke('v1:payables:create', data),
      createBulk: (dataArray) => ipcRenderer.invoke('v1:payables:createBulk', dataArray),
      update: (id, data) => ipcRenderer.invoke('v1:payables:update', id, data),
      delete: (id) => ipcRenderer.invoke('v1:payables:delete', id),
      markAsPaid: (id) => ipcRenderer.invoke('v1:payables:markAsPaid', id),
      markAsUnpaid: (id) => ipcRenderer.invoke('v1:payables:markAsUnpaid', id)
    },
    recurring: {
      getAll: () => ipcRenderer.invoke('v1:recurring:getAll'),
      create: (data) => ipcRenderer.invoke('v1:recurring:create', data),
      update: (id, data) => ipcRenderer.invoke('v1:recurring:update', id, data),
      delete: (id) => ipcRenderer.invoke('v1:recurring:delete', id),
      generateForMonth: (year, month) =>
        ipcRenderer.invoke('v1:recurring:generateForMonth', year, month)
    }
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
