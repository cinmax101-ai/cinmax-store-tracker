// ==================================================
// CinMax Store Copy Tracker - Main Process
// ==================================================

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Database = require('./src/js/database');
const USBMonitor = require('./src/js/usb-monitor');

// ==================== المتغيرات العامة ====================
let mainWindow;
let tray;
let db;
let usbMonitor;

// ==================== إنشاء النافذة الرئيسية ====================
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        icon: path.join(__dirname, 'src/assets/logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        frame: false, // إطار مخصص
        titleBarStyle: 'hidden',
        backgroundColor: '#1a1a2e'
    });

    mainWindow.loadFile('src/pages/index.html');

    // التشغيل في الخلفية
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

// ==================== إنشاء أيقونة شريط المهام ====================
function createTray() {
    const icon = nativeImage.createFromPath(path.join(__dirname, 'src/assets/logo.png'));
    tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        { 
            label: '📊 فتح لوحة التحكم', 
            click: () => mainWindow.show() 
        },
        { type: 'separator' },
        { 
            label: '📈 التقارير السريعة',
            submenu: [
                { label: '📅 تقرير اليوم', click: () => sendToRenderer('quick-report', 'daily') },
                { label: '📆 تقرير الأسبوع', click: () => sendToRenderer('quick-report', 'weekly') },
                { label: '🗓️ تقرير الشهر', click: () => sendToRenderer('quick-report', 'monthly') }
            ]
        },
        { type: 'separator' },
        { 
            label: '⚙️ الإعدادات', 
            click: () => {
                mainWindow.show();
                sendToRenderer('navigate', 'settings');
            }
        },
        { type: 'separator' },
        { 
            label: '❌ إغلاق البرنامج', 
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('CinMax Store Tracker');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => mainWindow.show());
}

// ==================== تهيئة قاعدة البيانات ====================
function initializeDatabase() {
    db = new Database(path.join(app.getPath('userData'), 'cinmax.db'));
    db.initialize();
}

// ==================== بدء مراقبة USB ====================
function startUSBMonitoring() {
    usbMonitor = new USBMonitor();
    
    usbMonitor.on('device-connected', (device) => {
        sendToRenderer('usb-connected', device);
        showNotification('جهاز جديد', `تم توصيل: ${device.name}`);
    });

    usbMonitor.on('device-disconnected', (device) => {
        sendToRenderer('usb-disconnected', device);
    });

    usbMonitor.start();
}

// ==================== إرسال رسائل للواجهة ====================
function sendToRenderer(channel, data) {
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send(channel, data);
    }
}

// ==================== الإشعارات ====================
function showNotification(title, body) {
    const { Notification } = require('electron');
    new Notification({ title, body, icon: path.join(__dirname, 'src/assets/logo.png') }).show();
}

// ==================== التشغيل التلقائي مع الويندوز ====================
function setupAutoLaunch() {
    app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe'),
        args: ['--hidden']
    });
}

// ==================== معالجة أحداث IPC ====================

// جلب الإحصائيات
ipcMain.handle('get-statistics', async (event, period) => {
    return db.getStatistics(period);
});

// حفظ عملية نسخ جديدة
ipcMain.handle('save-copy-operation', async (event, operation) => {
    return db.saveCopyOperation(operation);
});

// جلب سجل العمليات
ipcMain.handle('get-operations-log', async (event, filters) => {
    return db.getOperationsLog(filters);
});

// تصدير التقرير
ipcMain.handle('export-report', async (event, { type, format, dateRange }) => {
    const ReportGenerator = require('./src/js/reports');
    const generator = new ReportGenerator(db);
    return generator.export(type, format, dateRange);
});

// إدارة الديون
ipcMain.handle('get-debts', async () => {
    return db.getDebts();
});

ipcMain.handle('save-debt', async (event, debt) => {
    return db.saveDebt(debt);
});

ipcMain.handle('update-debt', async (event, debt) => {
    return db.updateDebt(debt);
});

// الإعدادات
ipcMain.handle('get-settings', async () => {
    return db.getSettings();
});

ipcMain.handle('save-settings', async (event, settings) => {
    return db.saveSettings(settings);
});

// إزالة USB بأمان
ipcMain.handle('eject-usb', async (event, deviceId) => {
    return usbMonitor.ejectDevice(deviceId);
});

// التحكم بالنافذة
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.hide());

// ==================== تهيئة التطبيق ====================
app.whenReady().then(() => {
    initializeDatabase();
    createWindow();
    createTray();
    startUSBMonitoring();
    
    // التشغيل مخفياً إذا تم تمرير الوسيط
    if (process.argv.includes('--hidden')) {
        mainWindow.hide();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // لا نغلق التطبيق، يبقى في شريط المهام
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});