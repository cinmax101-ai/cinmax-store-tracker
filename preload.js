// ==================================================
// CinMax Store - Preload Script (Security Bridge)
// ==================================================

const { contextBridge, ipcRenderer } = require('electron');

// ==================== API المكشوف للواجهة ====================
contextBridge.exposeInMainWorld('CinMaxAPI', {
    
    // ========== الإحصائيات ==========
    getStatistics: (period) => ipcRenderer.invoke('get-statistics', period),
    
    // ========== عمليات النسخ ==========
    saveCopyOperation: (operation) => ipcRenderer.invoke('save-copy-operation', operation),
    getOperationsLog: (filters) => ipcRenderer.invoke('get-operations-log', filters),
    
    // ========== التقارير ==========
    exportReport: (options) => ipcRenderer.invoke('export-report', options),
    
    // ========== الديون ==========
    getDebts: () => ipcRenderer.invoke('get-debts'),
    saveDebt: (debt) => ipcRenderer.invoke('save-debt', debt),
    updateDebt: (debt) => ipcRenderer.invoke('update-debt', debt),
    
    // ========== الإعدادات ==========
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    
    // ========== USB ==========
    ejectUSB: (deviceId) => ipcRenderer.invoke('eject-usb', deviceId),
    
    // ========== الاستماع للأحداث ==========
    onUSBConnected: (callback) => {
        ipcRenderer.on('usb-connected', (event, device) => callback(device));
    },
    onUSBDisconnected: (callback) => {
        ipcRenderer.on('usb-disconnected', (event, device) => callback(device));
    },
    onCopyProgress: (callback) => {
        ipcRenderer.on('copy-progress', (event, progress) => callback(progress));
    },
    onQuickReport: (callback) => {
        ipcRenderer.on('quick-report', (event, type) => callback(type));
    },
    onNavigate: (callback) => {
        ipcRenderer.on('navigate', (event, page) => callback(page));
    },
    
    // ========== التحكم بالنافذة ==========
    windowMinimize: () => ipcRenderer.send('window-minimize'),
    windowMaximize: () => ipcRenderer.send('window-maximize'),
    windowClose: () => ipcRenderer.send('window-close')
});