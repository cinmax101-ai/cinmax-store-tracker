/**
 * CinMax Store Copy Tracker
 * Main Application Controller
 */

class CinMaxApp {
    constructor() {
        this.currentLanguage = 'ar';
        this.currentPage = 'dashboard';
        this.translations = {};
        this.init();
    }

    async init() {
        await this.loadTranslations();
        this.setupEventListeners();
        this.initializeComponents();
        this.startMonitoring();
        this.loadDashboardData();
        console.log('CinMax App initialized successfully');
    }

    async loadTranslations() {
        try {
            const arResponse = await fetch('./locales/ar.json');
            const enResponse = await fetch('./locales/en.json');
            this.translations = {
                ar: await arResponse.json(),
                en: await enResponse.json()
            };
            this.applyTranslations();
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    applyTranslations() {
        const t = this.translations[this.currentLanguage];
        if (!t) return;

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (t[key]) {
                element.textContent = t[key];
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (t[key]) {
                element.placeholder = t[key];
            }
        });

        document.body.dir = this.currentLanguage === 'ar' ? 'rtl' : 'ltr';
        document.body.classList.toggle('rtl', this.currentLanguage === 'ar');
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'ar' ? 'en' : 'ar';
        localStorage.setItem('cinmax_language', this.currentLanguage);
        this.applyTranslations();
        this.showNotification(
            this.currentLanguage === 'ar' ? 'تم تغيير اللغة للعربية' : 'Language changed to English',
            'success'
        );
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigateTo(page);
            });
        });

        // Language toggle
        const langBtn = document.getElementById('langToggle');
        if (langBtn) {
            langBtn.addEventListener('click', () => this.toggleLanguage());
        }

        // Payment buttons
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const method = btn.getAttribute('data-method');
                this.handlePayment(method);
            });
        });

        // Export buttons
        document.getElementById('exportPdf')?.addEventListener('click', () => this.exportReport('pdf'));
        document.getElementById('exportExcel')?.addEventListener('click', () => this.exportReport('excel'));

        // New transaction
        document.getElementById('newTransaction')?.addEventListener('click', () => this.openNewTransaction());

        // Safe eject
        document.getElementById('safeEject')?.addEventListener('click', () => this.safeEjectDevice());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey) {
            switch(e.key) {
                case 'n':
                    e.preventDefault();
                    this.openNewTransaction();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportReport('excel');
                    break;
                case 'p':
                    e.preventDefault();
                    this.exportReport('pdf');
                    break;
                case 'd':
                    e.preventDefault();
                    this.navigateTo('dashboard');
                    break;
            }
        }
    }

    navigateTo(page) {
        this.currentPage = page;
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });

        // Update content
        document.querySelectorAll('.page-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const pageContent = document.getElementById(`page-${page}`);
        if (pageContent) {
            pageContent.classList.add('active');
        }

        // Load page specific data
        switch(page) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'reports':
                this.loadReportsData();
                break;
            case 'debts':
                this.loadDebtsData();
                break;
            case 'settings':
                this.loadSettingsData();
                break;
        }
    }

    initializeComponents() {
        // Initialize charts
        this.initCharts();
        
        // Initialize date pickers
        this.initDatePickers();
        
        // Load saved language
        const savedLang = localStorage.getItem('cinmax_language');
        if (savedLang) {
            this.currentLanguage = savedLang;
            this.applyTranslations();
        }
    }

    initCharts() {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx) {
            this.revenueChart = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'الإيرادات',
                        data: [],
                        borderColor: '#e50914',
                        backgroundColor: 'rgba(229, 9, 20, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: { color: '#fff' }
                        }
                    },
                    scales: {
                        x: { ticks: { color: '#888' } },
                        y: { ticks: { color: '#888' } }
                    }
                }
            });
        }

        // Content Chart
        const contentCtx = document.getElementById('contentChart');
        if (contentCtx) {
            this.contentChart = new Chart(contentCtx, {
                type: 'doughnut',
                data: {
                    labels: ['أفلام أجنبي', 'أفلام عربي', 'مسلسلات تركي', 'مسلسلات كوري', 'أنمي'],
                    datasets: [{
                        data: [35, 20, 18, 15, 12],
                        backgroundColor: [
                            '#e50914',
                            '#ff6b35',
                            '#f7931e',
                            '#ffcc00',
                            '#00d4aa'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#fff' }
                        }
                    }
                }
            });
        }
    }

    initDatePickers() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            input.valueAsDate = new Date();
        });
    }

    async startMonitoring() {
        if (window.electronAPI) {
            window.electronAPI.onDeviceConnected((device) => {
                this.handleDeviceConnected(device);
            });

            window.electronAPI.onDeviceDisconnected((device) => {
                this.handleDeviceDisconnected(device);
            });

            window.electronAPI.onCopyProgress((progress) => {
                this.updateCopyProgress(progress);
            });

            window.electronAPI.onCopyComplete((data) => {
                this.handleCopyComplete(data);
            });
        }
    }

    handleDeviceConnected(device) {
        this.showNotification(`تم توصيل: ${device.name}`, 'success');
        this.addDeviceToList(device);
        this.updateDeviceCount();
    }

    handleDeviceDisconnected(device) {
        this.showNotification(`تم فصل: ${device.name}`, 'info');
        this.removeDeviceFromList(device);
        this.updateDeviceCount();
    }

    addDeviceToList(device) {
        const container = document.getElementById('connectedDevices');
        if (!container) return;

        const deviceElement = document.createElement('div');
        deviceElement.className = 'device-card';
        deviceElement.id = `device-${device.id}`;
        deviceElement.innerHTML = `
            <div class="device-icon">
                <i class="fas ${this.getDeviceIcon(device.type)}"></i>
            </div>
            <div class="device-info">
                <span class="device-name">${device.name}</span>
                <span class="device-size">${this.formatSize(device.size)}</span>
            </div>
            <button class="eject-btn" data-device="${device.id}">
                <i class="fas fa-eject"></i>
            </button>
        `;

        container.appendChild(deviceElement);

        // Add eject listener
        deviceElement.querySelector('.eject-btn').addEventListener('click', () => {
            this.ejectDevice(device.id);
        });
    }

    removeDeviceFromList(device) {
        const element = document.getElementById(`device-${device.id}`);
        if (element) {
            element.classList.add('removing');
            setTimeout(() => element.remove(), 300);
        }
    }

    getDeviceIcon(type) {
        const icons = {
            'usb': 'fa-usb',
            'phone': 'fa-mobile-alt',
            'android': 'fa-android',
            'iphone': 'fa-apple',
            'sd': 'fa-sd-card',
            'hdd': 'fa-hdd',
            'ssd': 'fa-hdd'
        };
        return icons[type] || 'fa-database';
    }

    updateDeviceCount() {
        const container = document.getElementById('connectedDevices');
        const count = container ? container.children.length : 0;
        const countElement = document.getElementById('deviceCount');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    updateCopyProgress(progress) {
        const progressBar = document.getElementById('copyProgress');
        const progressText = document.getElementById('progressText');
        const speedText = document.getElementById('copySpeed');
        const remainingText = document.getElementById('timeRemaining');

        if (progressBar) progressBar.style.width = `${progress.percent}%`;
        if (progressText) progressText.textContent = `${progress.percent.toFixed(1)}%`;
        if (speedText) speedText.textContent = `${this.formatSpeed(progress.speed)}`;
        if (remainingText) remainingText.textContent = this.formatTime(progress.remaining);
    }

    async handleCopyComplete(data) {
        this.showNotification('اكتملت عملية النسخ!', 'success');
        
        // Calculate price
        const price = await this.calculatePrice(data);
        
        // Show payment modal
        this.showPaymentModal({
            ...data,
            price: price
        });

        // Update statistics
        this.loadDashboardData();
    }

    async calculatePrice(data) {
        if (window.electronAPI) {
            return await window.electronAPI.calculatePrice(data);
        }
        return 0;
    }

    showPaymentModal(data) {
        const modal = document.getElementById('paymentModal');
        if (!modal) return;

        document.getElementById('modalContentType').textContent = data.contentType;
        document.getElementById('modalSize').textContent = this.formatSize(data.size);
        document.getElementById('modalPrice').textContent = `${data.price} ريال`;

        modal.classList.add('active');

        // Setup payment handlers
        document.querySelectorAll('.modal-payment-btn').forEach(btn => {
            btn.onclick = () => {
                const method = btn.getAttribute('data-method');
                this.processPayment(method, data);
            };
        });
    }

    async processPayment(method, data) {
        if (method === 'credit') {
            this.showCreditModal(data);
            return;
        }

        const transaction = {
            ...data,
            paymentMethod: method,
            timestamp: new Date().toISOString()
        };

        if (window.electronAPI) {
            await window.electronAPI.saveTransaction(transaction);
        }

        this.closeModal('paymentModal');
        this.showNotification('تم تسجيل العملية بنجاح', 'success');
        this.loadDashboardData();
    }

    showCreditModal(data) {
        const modal = document.getElementById('creditModal');
        if (!modal) return;

        this.closeModal('paymentModal');
        modal.classList.add('active');

        document.getElementById('creditForm').onsubmit = async (e) => {
            e.preventDefault();
            
            const creditData = {
                ...data,
                paymentMethod: 'credit',
                customerName: document.getElementById('customerName').value,
                customerPhone: document.getElementById('customerPhone').value,
                notes: document.getElementById('creditNotes').value,
                timestamp: new Date().toISOString(),
                isPaid: false
            };

            if (window.electronAPI) {
                await window.electronAPI.saveDebt(creditData);
            }

            this.closeModal('creditModal');
            this.showNotification('تم تسجيل الدين بنجاح', 'success');
            this.loadDashboardData();
        };
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    openNewTransaction() {
        const modal = document.getElementById('newTransactionModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    async loadDashboardData() {
        if (!window.electronAPI) return;

        try {
            const stats = await window.electronAPI.getStats();
            
            // Update stats cards
            document.getElementById('todayRevenue').textContent = `${stats.today.revenue} ريال`;
            document.getElementById('todayOperations').textContent = stats.today.operations;
            document.getElementById('todaySize').textContent = this.formatSize(stats.today.size);
            
            document.getElementById('weekRevenue').textContent = `${stats.week.revenue} ريال`;
            document.getElementById('monthRevenue').textContent = `${stats.month.revenue} ريال`;
            document.getElementById('totalDebts').textContent = `${stats.debts.total} ريال`;

            // Update charts
            this.updateCharts(stats);

            // Load recent transactions
            this.loadRecentTransactions();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateCharts(stats) {
        if (this.revenueChart && stats.chartData) {
            this.revenueChart.data.labels = stats.chartData.labels;
            this.revenueChart.data.datasets[0].data = stats.chartData.revenue;
            this.revenueChart.update();
        }

        if (this.contentChart && stats.contentStats) {
            this.contentChart.data.labels = stats.contentStats.labels;
            this.contentChart.data.datasets[0].data = stats.contentStats.values;
            this.contentChart.update();
        }
    }

    async loadRecentTransactions() {
        if (!window.electronAPI) return;

        const transactions = await window.electronAPI.getRecentTransactions(10);
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        container.innerHTML = transactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-icon">
                    <i class="fas fa-${t.contentType === 'movie' ? 'film' : 'tv'}"></i>
                </div>
                <div class="transaction-info">
                    <span class="transaction-type">${t.contentCategory}</span>
                    <span class="transaction-time">${this.formatDateTime(t.timestamp)}</span>
                </div>
                <div class="transaction-details">
                    <span class="transaction-size">${this.formatSize(t.size)}</span>
                    <span class="transaction-price">${t.price} ريال</span>
                </div>
                <div class="transaction-status ${t.paymentMethod}">
                    ${this.getPaymentIcon(t.paymentMethod)}
                </div>
            </div>
        `).join('');
    }

    getPaymentIcon(method) {
        const icons = {
            'cash': '<i class="fas fa-money-bill-wave"></i>',
            'credit': '<i class="fas fa-clock"></i>',
            'electronic': '<i class="fas fa-mobile-alt"></i>'
        };
        return icons[method] || '';
    }

    async loadReportsData() {
        // Implementation in reports.js
        if (window.ReportsManager) {
            window.ReportsManager.load();
        }
    }

    async loadDebtsData() {
        if (!window.electronAPI) return;

        const debts = await window.electronAPI.getDebts();
        const container = document.getElementById('debtsList');
        if (!container) return;

        container.innerHTML = debts.map(d => `
            <div class="debt-card ${d.isPaid ? 'paid' : ''}">
                <div class="debt-header">
                    <span class="customer-name">${d.customerName}</span>
                    <span class="debt-amount">${d.price} ريال</span>
                </div>
                <div class="debt-details">
                    <span><i class="fas fa-phone"></i> ${d.customerPhone || 'غير محدد'}</span>
                    <span><i class="fas fa-calendar"></i> ${this.formatDate(d.timestamp)}</span>
                    <span><i class="fas fa-hdd"></i> ${this.formatSize(d.size)}</span>
                </div>
                <div class="debt-actions">
                    ${!d.isPaid ? `
                        <button class="btn-pay" data-id="${d.id}">تسديد</button>
                        <button class="btn-remind" data-id="${d.id}">تذكير</button>
                    ` : '<span class="paid-badge">مسدد</span>'}
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.btn-pay').forEach(btn => {
            btn.addEventListener('click', () => this.markDebtAsPaid(btn.dataset.id));
        });
    }

    async markDebtAsPaid(debtId) {
        if (window.electronAPI) {
            await window.electronAPI.markDebtPaid(debtId);
            this.showNotification('تم تسديد الدين', 'success');
            this.loadDebtsData();
            this.loadDashboardData();
        }
    }

    loadSettingsData() {
        // Load current settings
        const settings = JSON.parse(localStorage.getItem('cinmax_settings') || '{}');
        
        // Populate form
        if (settings.pricing) {
            document.getElementById('moviePrice').value = settings.pricing.movie || 100;
            document.getElementById('seriesPrice').value = settings.pricing.series || 50;
            document.getElementById('downloadMovie').value = settings.pricing.downloadMovie || 150;
            document.getElementById('downloadSeries').value = settings.pricing.downloadSeries || 100;
        }

        if (settings.autoStart !== undefined) {
            document.getElementById('autoStart').checked = settings.autoStart;
        }

        if (settings.autoEject !== undefined) {
            document.getElementById('autoEject').checked = settings.autoEject;
        }
    }

    async saveSettings(settings) {
        localStorage.setItem('cinmax_settings', JSON.stringify(settings));
        
        if (window.electronAPI) {
            await window.electronAPI.saveSettings(settings);
        }
        
        this.showNotification('تم حفظ الإعدادات', 'success');
    }

    async exportReport(format) {
        if (!window.electronAPI) return;

        const dateFrom = document.getElementById('dateFrom')?.value;
        const dateTo = document.getElementById('dateTo')?.value;

        try {
            const result = await window.electronAPI.exportReport({
                format: format,
                dateFrom: dateFrom,
                dateTo: dateTo
            });

            if (result.success) {
                this.showNotification(`تم تصدير التقرير: ${result.filename}`, 'success');
            }
        } catch (error) {
            this.showNotification('خطأ في تصدير التقرير', 'error');
        }
    }

    async ejectDevice(deviceId) {
        if (window.electronAPI) {
            const result = await window.electronAPI.ejectDevice(deviceId);
            if (result.success) {
                this.showNotification('تم إزالة الجهاز بأمان', 'success');
            } else {
                this.showNotification('فشل في إزالة الجهاز', 'error');
            }
        }
    }

    safeEjectDevice() {
        const devices = document.querySelectorAll('.device-card');
        if (devices.length > 0) {
            const lastDevice = devices[devices.length - 1];
            const deviceId = lastDevice.id.replace('device-', '');
            this.ejectDevice(deviceId);
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications') || this.createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notifications';
        container.className = 'notifications-container';
        document.body.appendChild(container);
        return container;
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Utility methods
    formatSize(bytes) {
        if (!bytes) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    formatSpeed(bytesPerSecond) {
        return `${this.formatSize(bytesPerSecond)}/s`;
    }

    formatTime(seconds) {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-YE');
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ar-YE');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.CinMaxApp = new CinMaxApp();
});