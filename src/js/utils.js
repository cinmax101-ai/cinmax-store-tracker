/**
 * CinMax Utility Functions
 */

const Utils = {
    // Format file size
    formatSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    },

    // Format speed
    formatSpeed(bytesPerSecond) {
        return `${this.formatSize(bytesPerSecond)}/ث`;
    },

    // Format time remaining
    formatTime(seconds) {
        if (!seconds || seconds <= 0) return '--:--';
        
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // Format date
    formatDate(date, locale = 'ar-YE') {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Format datetime
    formatDateTime(date, locale = 'ar-YE') {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format currency
    formatCurrency(amount, currency = 'YER') {
        return new Intl.NumberFormat('ar-YE', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount) + ' ريال';
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Check if object is empty
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    // Get date range
    getDateRange(type) {
        const now = new Date();
        let start, end;

        switch(type) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'week':
                start = new Date(now);
                start.setDate(now.getDate() - now.getDay());
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
        }

        return { start, end };
    },

    // Parse path to get content type
    parseContentType(filePath) {
        const path = filePath.toLowerCase();
        
        const contentTypes = {
            movies: {
                foreign: ['أفلام أجنبي', 'foreign movies', 'english movies'],
                arabic: ['أفلام عربي', 'arabic movies'],
                asian: ['أفلام آسيوي', 'asian movies', 'chinese movies', 'korean movies'],
                turkish: ['أفلام تركي', 'turkish movies'],
                animation: ['أنميشن', 'animation', 'animated'],
                anime: ['أنمي', 'anime']
            },
            series: {
                foreign: ['مسلسلات أجنبي', 'foreign series', 'english series'],
                turkish: ['مسلسلات تركي', 'turkish series'],
                arabic: ['مسلسلات عربي', 'arabic series'],
                korean: ['مسلسلات كوري', 'korean drama', 'kdrama'],
                anime: ['أنمي ياباني', 'japanese anime']
            },
            software: ['برامج', 'software', 'programs', 'apps']
        };

        for (const [category, types] of Object.entries(contentTypes)) {
            if (typeof types === 'object' && !Array.isArray(types)) {
                for (const [subType, keywords] of Object.entries(types)) {
                    if (keywords.some(kw => path.includes(kw))) {
                        return { category, subType };
                    }
                }
            } else if (types.some(kw => path.includes(kw))) {
                return { category, subType: null };
            }
        }

        return { category: 'unknown', subType: null };
    },

    // Count files in directory (simulation)
    countFiles(files) {
        let movieCount = 0;
        let seriesCount = 0;
        let totalSize = 0;

        files.forEach(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            const videoExtensions = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'];
            
            if (videoExtensions.includes(ext)) {
                if (file.path.includes('مسلسل') || file.path.includes('series')) {
                    seriesCount++;
                } else {
                    movieCount++;
                }
                totalSize += file.size;
            }
        });

        return { movieCount, seriesCount, totalSize };
    },

    // Validate phone number (Yemen)
    validatePhone(phone) {
        const yemenPhoneRegex = /^(71|73|77|70|78)\d{7}$/;
        return yemenPhoneRegex.test(phone.replace(/\s/g, ''));
    },

    // Show loading overlay
    showLoading(message = 'جاري التحميل...') {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <span class="loading-text">${message}</span>
            `;
            document.body.appendChild(overlay);
        }
        overlay.querySelector('.loading-text').textContent = message;
        overlay.classList.add('active');
    },

    // Hide loading overlay
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    // Confirm dialog
    async confirm(message, title = 'تأكيد') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <div class="confirm-content">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="confirm-buttons">
                        <button class="btn-confirm">نعم</button>
                        <button class="btn-cancel">إلغاء</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.btn-confirm').onclick = () => {
                modal.remove();
                resolve(true);
            };

            modal.querySelector('.btn-cancel').onclick = () => {
                modal.remove();
                resolve(false);
            };
        });
    },

    // Storage helpers
    storage: {
        get(key, defaultValue = null) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : defaultValue;
            } catch {
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch {
                return false;
            }
        },

        remove(key) {
            localStorage.removeItem(key);
        },

        clear() {
            localStorage.clear();
        }
    },

    // Animation helpers
    animate: {
        fadeIn(element, duration = 300) {
            element.style.opacity = 0;
            element.style.display = 'block';
            
            let start = null;
            const step = (timestamp) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                element.style.opacity = Math.min(progress / duration, 1);
                if (progress < duration) {
                    requestAnimationFrame(step);
                }
            };
            requestAnimationFrame(step);
        },

        fadeOut(element, duration = 300) {
            let start = null;
            const step = (timestamp) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                element.style.opacity = 1 - Math.min(progress / duration, 1);
                if (progress < duration) {
                    requestAnimationFrame(step);
                } else {
                    element.style.display = 'none';
                }
            };
            requestAnimationFrame(step);
        },

        slideDown(element, duration = 300) {
            element.style.height = 'auto';
            const height = element.offsetHeight;
            element.style.height = 0;
            element.style.overflow = 'hidden';
            element.style.display = 'block';
            
            let start = null;
            const step = (timestamp) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                element.style.height = `${Math.min(progress / duration, 1) * height}px`;
                if (progress < duration) {
                    requestAnimationFrame(step);
                } else {
                    element.style.height = 'auto';
                    element.style.overflow = '';
                }
            };
            requestAnimationFrame(step);
        }
    }
};

// Export for use
window.Utils = Utils;