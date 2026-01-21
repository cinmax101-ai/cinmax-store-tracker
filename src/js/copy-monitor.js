/**
 * CinMax Copy Monitor
 * Monitors file copy operations from various sources
 */

const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

class CopyMonitor extends EventEmitter {
    constructor() {
        super();
        this.activeOperations = new Map();
        this.watchedPaths = [];
        this.watchers = [];
    }

    /**
     * Start monitoring copy operations
     */
    start(targetPaths = []) {
        console.log('Starting copy monitor...');

        // Default paths to monitor (removable drives)
        if (targetPaths.length === 0) {
            targetPaths = this.getRemovableDrives();
        }

        targetPaths.forEach(targetPath => {
            this.watchPath(targetPath);
        });

        // Monitor Windows clipboard for copy operations
        this.monitorClipboard();

        // Monitor running processes (Super Copier, 3uTools)
        this.monitorCopyProcesses();
    }

    /**
     * Watch a specific path for file changes
     */
    watchPath(targetPath) {
        if (!fs.existsSync(targetPath)) return;

        const watcher = chokidar.watch(targetPath, {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        watcher.on('add', (filePath) => this.handleFileAdd(filePath));
        watcher.on('change', (filePath) => this.handleFileChange(filePath));
        watcher.on('addDir', (dirPath) => this.handleDirAdd(dirPath));

        this.watchers.push(watcher);
        this.watchedPaths.push(targetPath);
        
        console.log(`Watching: ${targetPath}`);
    }

    /**
     * Handle new file added
     */
    handleFileAdd(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];

        if (!videoExtensions.includes(ext)) return;

        const stats = fs.statSync(filePath);
        const operation = {
            id: this.generateId(),
            filePath: filePath,
            fileName: path.basename(filePath),
            size: stats.size,
            startTime: Date.now(),
            status: 'copying',
            progress: 0
        };

        this.activeOperations.set(operation.id, operation);
        this.emit('copyStart', operation);

        // Monitor file size changes to track progress
        this.trackProgress(operation);
    }

    /**
     * Handle file change (during copy)
     */
    handleFileChange(filePath) {
        // Find the operation for this file
        for (const [id, operation] of this.activeOperations) {
            if (operation.filePath === filePath) {
                const stats = fs.statSync(filePath);
                operation.currentSize = stats.size;
                operation.progress = (stats.size / operation.expectedSize) * 100;
                this.emit('copyProgress', operation);
            }
        }
    }

    /**
     * Handle new directory added
     */
    handleDirAdd(dirPath) {
        // Could be a series folder
        this.emit('folderCopy', {
            path: dirPath,
            name: path.basename(dirPath)
        });
    }

    /**
     * Track copy progress
     */
    trackProgress(operation) {
        let lastSize = 0;
        let stableCount = 0;

        const progressInterval = setInterval(() => {
            try {
                if (!fs.existsSync(operation.filePath)) {
                    clearInterval(progressInterval);
                    return;
                }

                const stats = fs.statSync(operation.filePath);
                const currentSize = stats.size;
                const speed = currentSize - lastSize; // bytes per second

                operation.currentSize = currentSize;
                operation.speed = speed;
                operation.progress = operation.expectedSize 
                    ? (currentSize / operation.expectedSize) * 100 
                    : 0;

                if (speed > 0) {
                    operation.remainingTime = operation.expectedSize 
                        ? (operation.expectedSize - currentSize) / speed 
                        : 0;
                }

                this.emit('copyProgress', {
                    ...operation,
                    speed: speed,
                    remaining: operation.remainingTime
                });

                // Check if copy is complete (file size stable)
                if (currentSize === lastSize) {
                    stableCount++;
                    if (stableCount >= 3) {
                        clearInterval(progressInterval);
                        this.handleCopyComplete(operation);
                    }
                } else {
                    stableCount = 0;
                }

                lastSize = currentSize;

            } catch (error) {
                clearInterval(progressInterval);
            }
        }, 1000);

        operation.progressInterval = progressInterval;
    }

    /**
     * Handle copy operation complete
     */
    handleCopyComplete(operation) {
        operation.status = 'complete';
        operation.endTime = Date.now();
        operation.duration = operation.endTime - operation.startTime;

        // Determine content type from path
        operation.contentType = this.detectContentType(operation.filePath);

        this.emit('copyComplete', operation);
        this.activeOperations.delete(operation.id);
    }

    /**
     * Detect content type from file path
     */
    detectContentType(filePath) {
        const lowerPath = filePath.toLowerCase();

        const contentTypes = {
            'أفلام أجنبي': ['foreign', 'english', 'hollywood', 'اجنبي', 'أجنبي'],
            'أفلام عربي': ['arabic', 'arab', 'عربي', 'مصري', 'egyptian'],
            'أفلام آسيوي': ['asian', 'chinese', 'آسيوي', 'صيني'],
            'أفلام تركي': ['turkish', 'تركي', 'turk'],
            'أنميشن': ['animation', 'animated', 'pixar', 'disney', 'انميشن'],
            'أنمي': ['anime', 'انمي', 'أنمي'],
            'مسلسلات أجنبي': ['series', 'season', 'مسلسل اجنبي'],
            'مسلسلات تركي': ['turkish series', 'مسلسل تركي', 'تركي'],
            'مسلسلات عربي': ['arabic series', 'مسلسل عربي'],
            'مسلسلات كوري': ['korean', 'kdrama', 'كوري', 'كورية'],
            'أنمي ياباني': ['japanese anime', 'انمي ياباني']
        };

        for (const [type, keywords] of Object.entries(contentTypes)) {
            if (keywords.some(kw => lowerPath.includes(kw))) {
                return type;
            }
        }

        // Check if it's a series (has episode pattern)
        const episodePattern = /s\d{1,2}e\d{1,2}|ep?\s*\d{1,3}|حلقة|الحلقة/i;
        if (episodePattern.test(lowerPath)) {
            return 'مسلسلات';
        }

        return 'أفلام';
    }

    /**
     * Monitor clipboard for copy operations
     */
    monitorClipboard() {
        // This is a simplified version
        // Full implementation would use native modules
        setInterval(() => {
            try {
                const { clipboard } = require('electron');
                // Check for file paths in clipboard
            } catch (error) {
                // Clipboard monitoring not available
            }
        }, 1000);
    }

    /**
     * Monitor copy processes
     */
    monitorCopyProcesses() {
        const processNames = [
            'SuperCopier2.exe',
            'SuperCopier.exe',
            '3uTools.exe',
            'explorer.exe'
        ];

        // Check for running copy processes
        setInterval(() => {
            this.checkRunningProcesses(processNames);
        }, 2000);
    }

    /**
     * Check for running processes
     */
    async checkRunningProcesses(processNames) {
        try {
            const exec = require('child_process').exec;
            
            exec('tasklist /FO CSV', (error, stdout) => {
                if (error) return;

                processNames.forEach(processName => {
                    if (stdout.toLowerCase().includes(processName.toLowerCase())) {
                        this.emit('copyToolDetected', { 
                            process: processName,
                            time: new Date()
                        });
                    }
                });
            });
        } catch (error) {
            console.error('Error checking processes:', error);
        }
    }

    /**
     * Get list of removable drives
     */
    getRemovableDrives() {
        const drives = [];
        
        if (process.platform === 'win32') {
            const letters = 'DEFGHIJKLMNOPQRSTUVWXYZ';
            letters.split('').forEach(letter => {
                const drivePath = `${letter}:\\`;
                try {
                    if (fs.existsSync(drivePath)) {
                        drives.push(drivePath);
                    }
                } catch (e) {
                    // Drive not accessible
                }
            });
        }

        return drives;
    }

    /**
     * Generate unique operation ID
     */
    generateId() {
        return `copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get active operations
     */
    getActiveOperations() {
        return Array.from(this.activeOperations.values());
    }

    /**
     * Stop monitoring
     */
    stop() {
        this.watchers.forEach(watcher => watcher.close());
        this.activeOperations.forEach(op => {
            if (op.progressInterval) {
                clearInterval(op.progressInterval);
            }
        });
        this.activeOperations.clear();
        console.log('Copy monitor stopped');
    }
}

module.exports = new CopyMonitor();