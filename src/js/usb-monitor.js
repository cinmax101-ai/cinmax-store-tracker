// ==================================================
// CinMax Store - USB Device Monitor
// ==================================================

const EventEmitter = require('events');
const drivelist = require('drivelist');
const { exec } = require('child_process');
const path = require('path');
const chokidar = require('chokidar');

class USBMonitor extends EventEmitter {
    constructor() {
        super();
        this.connectedDevices = new Map();
        this.watchers = new Map();
        this.pollingInterval = null;
        this.copyOperations = new Map();
    }

    // ==================== بدء المراقبة ====================
    async start() {
        console.log('🔌 بدء مراقبة أجهزة USB...');
        
        // فحص أولي
        await this.scanDevices();
        
        // فحص دوري كل 2 ثانية
        this.pollingInterval = setInterval(() => {
            this.scanDevices();
        }, 2000);
    }

    // ==================== إيقاف المراقبة ====================
    stop() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // إيقاف جميع مراقبي الملفات
        this.watchers.forEach(watcher => watcher.close());
        this.watchers.clear();
    }

    // ==================== فحص الأجهزة ====================
    async scanDevices() {
        try {
            const drives = await drivelist.list();
            const currentDevices = new Map();

            for (const drive of drives) {
                // تجاهل الأقراص الداخلية
                if (drive.isSystem || !drive.isUSB) continue;

                const deviceId = drive.device;
                const deviceInfo = this.parseDeviceInfo(drive);
                
                currentDevices.set(deviceId, deviceInfo);

                // جهاز جديد؟
                if (!this.connectedDevices.has(deviceId)) {
                    this.emit('device-connected', deviceInfo);
                    this.startWatchingDevice(deviceInfo);
                }
            }

            // التحقق من الأجهزة المفصولة
            this.connectedDevices.forEach((device, id) => {
                if (!currentDevices.has(id)) {
                    this.emit('device-disconnected', device);
                    this.stopWatchingDevice(id);
                }
            });

            this.connectedDevices = currentDevices;

        } catch (error) {
            console.error('خطأ في فحص الأجهزة:', error);
        }
    }

    // ==================== تحليل معلومات الجهاز ====================
    parseDeviceInfo(drive) {
        let deviceType = 'unknown';
        
        // تحديد نوع الجهاز
        if (drive.description) {
            const desc = drive.description.toLowerCase();
            if (desc.includes('phone') || desc.includes('android') || desc.includes('iphone')) {
                deviceType = 'phone';
            } else if (desc.includes('sd') || desc.includes('card')) {
                deviceType = 'sd_card';
            } else if (desc.includes('hdd') || desc.includes('hard')) {
                deviceType = 'hdd';
            } else if (desc.includes('ssd')) {
                deviceType = 'ssd';
            } else {
                deviceType = 'flash';
            }
        }

        return {
            id: drive.device,
            name: drive.description || 'جهاز غير معروف',
            type: deviceType,
            typeArabic: this.getDeviceTypeArabic(deviceType),
            mountpoints: drive.mountpoints || [],
            size: drive.size,
            sizeFormatted: this.formatBytes(drive.size),
            isReadOnly: drive.isReadOnly,
            icon: this.getDeviceIcon(deviceType)
        };
    }

    // ==================== ترجمة نوع الجهاز ====================
    getDeviceTypeArabic(type) {
        const types = {
            'flash': 'فلاش USB',
            'phone': 'هاتف',
            'sd_card': 'بطاقة SD',
            'hdd': 'قرص صلب خارجي',
            'ssd': 'قرص SSD خارجي',
            'unknown': 'جهاز تخزين'
        };
        return types[type] || types['unknown'];
    }

    // ==================== أيقونة الجهاز ====================
    getDeviceIcon(type) {
        const icons = {
            'flash': '💾',
            'phone': '📱',
            'sd_card': '💳',
            'hdd': '🗄️',
            'ssd': '⚡',
            'unknown': '📀'
        };
        return icons[type] || '📀';
    }

    // ==================== تنسيق الحجم ====================
    formatBytes(bytes) {
        if (!bytes) return 'غير معروف';
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    // ==================== مراقبة عمليات النسخ ====================
    startWatchingDevice(device) {
        if (!device.mountpoints || device.mountpoints.length === 0) return;

        const mountPath = device.mountpoints[0].path;
        
        const watcher = chokidar.watch(mountPath, {
            persistent: true,
            ignoreInitial: true,
            depth: 3,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        watcher.on('add', (filePath) => {
            this.handleFileCopied(device, filePath);
        });

        watcher.on('addDir', (dirPath) => {
            this.handleFolderCopied(device, dirPath);
        });

        this.watchers.set(device.id, watcher);
    }

    stopWatchingDevice(deviceId) {
        const watcher = this.watchers.get(deviceId);
        if (watcher) {
            watcher.close();
            this.watchers.delete(deviceId);
        }
    }

    // ==================== معالجة الملفات المنسوخة ====================
    handleFileCopied(device, filePath) {
        const fs = require('fs');
        const stats = fs.statSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        
        // تحديد نوع المحتوى من الامتداد
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];
        
        if (videoExtensions.includes(ext)) {
            this.emit('copy-detected', {
                device: device,
                file: {
                    path: filePath,
                    name: path.basename(filePath),
                    size: stats.size,
                    sizeGB: stats.size / (1024 * 1024 * 1024),
                    type: 'video'
                }
            });
        }
    }

    handleFolderCopied(device, dirPath) {
        // يمكن تحليل المجلد لتحديد إذا كان مسلسل
        const folderName = path.basename(dirPath);
        
        this.emit('folder-copy-detected', {
            device: device,
            folder: {
                path: dirPath,
                name: folderName
            }
        });
    }

    // ==================== إزالة الجهاز بأمان ====================
    async ejectDevice(deviceId) {
        return new Promise((resolve, reject) => {
            const device = this.connectedDevices.get(deviceId);
            if (!device || !device.mountpoints || device.mountpoints.length === 0) {
                reject(new Error('الجهاز غير موجود'));
                return;
            }

            const driveLetter = device.mountpoints[0].path.replace('\\', '');
            
            // أمر إزالة القرص في Windows
            const command = `powershell -Command "$vol = Get-WmiObject -Class Win32_Volume | Where-Object { $_.DriveLetter -eq '${driveLetter}' }; $vol.DismountVolume($false, $false)"`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('خطأ في إزالة الجهاز:', error);
                    // محاولة بديلة
                    exec(`rundll32.exe shell32.dll,Control_RunDLL hotplug.dll`, () => {
                        resolve({ success: true, message: 'يرجى إزالة الجهاز يدوياً' });
                    });
                } else {
                    resolve({ success: true, message: 'تم إزالة الجهاز بأمان' });
                }
            });
        });
    }
}

module.exports = USBMonitor;