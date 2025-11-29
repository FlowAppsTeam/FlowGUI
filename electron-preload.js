const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  storage: {
    loadScreens: () => ipcRenderer.invoke('screens:list'),
    saveScreens: (screens) => ipcRenderer.invoke('screens:saveAll', screens),
    getPaths: () => ipcRenderer.invoke('storage:paths'),
    openScreensFolder: () => ipcRenderer.invoke('storage:openScreensDir'),
    openLogsFolder: () => ipcRenderer.invoke('storage:openLogsDir'),
    exportScreen: (screen) => ipcRenderer.invoke('screens:export', screen),
    importScreen: () => ipcRenderer.invoke('screens:import')
  }
});