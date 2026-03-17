import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  v1: {
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
    settings: {
      getLanguage: () => ipcRenderer.invoke('v1:settings:getLanguage'),
      setLanguage: (locale) => ipcRenderer.invoke('v1:settings:setLanguage', locale)
    },
    accounts: {
      getAll: () => ipcRenderer.invoke('v1:accounts:getAll'),
      getById: (id) => ipcRenderer.invoke('v1:accounts:getById', id),
      create: (data) => ipcRenderer.invoke('v1:accounts:create', data),
      update: (id, data) => ipcRenderer.invoke('v1:accounts:update', id, data),
      archive: (id) => ipcRenderer.invoke('v1:accounts:archive', id),
      unarchive: (id) => ipcRenderer.invoke('v1:accounts:unarchive', id),
      delete: (id) => ipcRenderer.invoke('v1:accounts:delete', id)
    },
    scheduledTransactions: {
      getAll: () => ipcRenderer.invoke('v1:scheduledTransactions:getAll'),
      create: (data) => ipcRenderer.invoke('v1:scheduledTransactions:create', data),
      update: (id, data) => ipcRenderer.invoke('v1:scheduledTransactions:update', id, data),
      delete: (id) => ipcRenderer.invoke('v1:scheduledTransactions:delete', id),
      generate: (asOfDate) => ipcRenderer.invoke('v1:scheduledTransactions:generate', asOfDate),
      confirmGeneration: (items) =>
        ipcRenderer.invoke('v1:scheduledTransactions:confirmGeneration', items),
      getUpcoming: (days) => ipcRenderer.invoke('v1:scheduledTransactions:getUpcoming', days)
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
