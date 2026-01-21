/**
 * CinMax Reports Manager
 * Handles report generation and export
 */

class ReportsManager {
    constructor() {
        this.currentReport = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Report type selection
        document.querySelectorAll('.report-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = btn.getAttribute('data-type');
                this.generateReport(type);
            });
        });

        // Date range change
        document.getElementById('dateFrom')?.addEventListener('change', () => this.onDateChange());
        document.getElementById('dateTo')?.addEventListener('change', () => this.onDateChange());

        // Export buttons
        document.getElementById('exportPdfBtn')?.addEventListener('click', () => this.exportToPdf());
        document.getElementById('exportExcelBtn')?.addEventListener('click', () => this.exportToExcel());

        // Print button
        document.getElementById('printReportBtn')?.addEventListener('click', () => this.printReport());
    }

    async load() {
        await this.generateReport('daily');
    }

    onDateChange() {
        if (this.currentReport) {
            this.generateReport(this.currentReport);
        }
    }

    async generateReport(type) {
        this.currentReport = type;
        
        // Update active button
        document.querySelectorAll('.report-type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-type') === type) {
                btn.classList.add('active');
            }
        });

        const dateFrom = document.getElementById('dateFrom')?.value;
        const dateTo = document.getElementById('dateTo')?.value;

        let data;
        switch(type) {
            case 'daily':
                data = await this.getDailyReport();
                break;
            case 'weekly':
                data = await this.getWeeklyReport(dateFrom, dateTo);
                break;
            case 'monthly':
                data = await this.getMonthlyReport();
                break;
            case 'yearly':
                data = await this.getYearlyReport();
                break;
            case 'content':
                data = await this.getContentReport();
                break;
        }

        this.renderReport(data, type);
    }

    async getDailyReport() {
        if (window.electronAPI) {
            return await window.electronAPI.getDailyReport();
        }
        return this.getMockDailyReport();
    }

    async getWeeklyReport(from, to) {
        if (window.electronAPI) {
            return await window.electronAPI.getWeeklyReport(from, to);
        }
        return this.getMockWeeklyReport();
    }

    async getMonthlyReport() {
        if (window.electronAPI) {
            return await window.electronAPI.getMonthlyReport();
        }
        return this.getMockMonthlyReport();
    }

    async getYearlyReport() {
        if (window.electronAPI) {
            return await window.electronAPI.getYearlyReport();
        }
        return this.getMockYearlyReport();
    }

    async getContentReport() {
        if (window.electronAPI) {
            return await window.electronAPI.getContentReport();
        }
        return this.getMockContentReport();
    }

    getMockDailyReport() {
        return {
            title: 'التقرير اليومي',
            date: new Date().toLocaleDateString('ar-YE'),
            summary: {
                operations: 15,
                totalSize: 45.5 * 1024 * 1024 * 1024,
                totalRevenue: 2500,
                cash: 1800,
                electronic: 500,
                credit: 200
            },
            transactions: [
                { time: '09:30', type: 'أفلام أجنبي', size: 4.5, price: 450, payment: 'نقداً' },
                { time: '10:15', type: 'مسلسلات تركي', size: 8.2, price: 410, payment: 'إلكتروني' },
                { time: '11:00', type: 'أفلام عربي', size: 2.1, price: 200, payment: 'نقداً' },
                { time: '12:30', type: 'أنمي', size: 5.5, price: 275, payment: 'آجل' },
                { time: '14:00', type: 'مسلسلات كوري', size: 12.0, price: 600, payment: 'نقداً' }
            ]
        };
    }

    getMockWeeklyReport() {
        return {
            title: 'التقرير الأسبوعي',
            period: 'من 1 إلى 7 يناير 2025',
            summary: {
                operations: 85,
                totalSize: 320 * 1024 * 1024 * 1024,
                totalRevenue: 16500,
                avgDaily: 2357
            },
            dailyBreakdown: [
                { day: 'السبت', operations: 12, revenue: 2200 },
                { day: 'الأحد', operations: 15, revenue: 2800 },
                { day: 'الإثنين', operations: 10, revenue: 1900 },
                { day: 'الثلاثاء', operations: 14, revenue: 2600 },
                { day: 'الأربعاء', operations: 11, revenue: 2100 },
                { day: 'الخميس', operations: 13, revenue: 2400 },
                { day: 'الجمعة', operations: 10, revenue: 2500 }
            ]
        };
    }

    getMockMonthlyReport() {
        return {
            title: 'التقرير الشهري',
            month: 'يناير 2025',
            summary: {
                operations: 340,
                totalSize: 1.2 * 1024 * 1024 * 1024 * 1024,
                totalRevenue: 68000,
                growth: 12.5
            },
            weeklyBreakdown: [
                { week: 'الأسبوع 1', operations: 85, revenue: 16500 },
                { week: 'الأسبوع 2', operations: 90, revenue: 17200 },
                { week: 'الأسبوع 3', operations: 82, revenue: 16800 },
                { week: 'الأسبوع 4', operations: 83, revenue: 17500 }
            ]
        };
    }

    getMockYearlyReport() {
        return {
            title: 'التقرير السنوي',
            year: '2024',
            summary: {
                operations: 4200,
                totalSize: 15.5 * 1024 * 1024 * 1024 * 1024,
                totalRevenue: 850000,
                growth: 25.3
            },
            monthlyBreakdown: [
                { month: 'يناير', revenue: 65000 },
                { month: 'فبراير', revenue: 58000 },
                { month: 'مارس', revenue: 72000 },
                { month: 'أبريل', revenue: 68000 },
                { month: 'مايو', revenue: 75000 },
                { month: 'يونيو', revenue: 82000 },
                { month: 'يوليو', revenue: 78000 },
                { month: 'أغسطس', revenue: 71000 },
                { month: 'سبتمبر', revenue: 69000 },
                { month: 'أكتوبر', revenue: 73000 },
                { month: 'نوفمبر', revenue: 70000 },
                { month: 'ديسمبر', revenue: 69000 }
            ]
        };
    }

    getMockContentReport() {
        return {
            title: 'إحصائية المحتوى',
            period: '2024',
            categories: [
                { name: 'أفلام أجنبي', count: 1250, percentage: 29.8, size: 5.2 * 1024 * 1024 * 1024 * 1024 },
                { name: 'مسلسلات تركي', count: 820, percentage: 19.5, size: 3.8 * 1024 * 1024 * 1024 * 1024 },
                { name: 'مسلسلات كوري', count: 680, percentage: 16.2, size: 2.9 * 1024 * 1024 * 1024 * 1024 },
                { name: 'أفلام عربي', count: 520, percentage: 12.4, size: 1.8 * 1024 * 1024 * 1024 * 1024 },
                { name: 'أنمي ياباني', count: 450, percentage: 10.7, size: 1.2 * 1024 * 1024 * 1024 * 1024 },
                { name: 'أفلام آسيوي', count: 280, percentage: 6.7, size: 0.9 * 1024 * 1024 * 1024 * 1024 },
                { name: 'برامج', count: 200, percentage: 4.8, size: 0.5 * 1024 * 1024 * 1024 * 1024 }
            ],
            insights: [
                'الأفلام الأجنبية هي الأكثر طلباً بنسبة 29.8%',
                'المسلسلات التركية والكورية تمثل 35.7% من إجمالي الطلب',
                'زيادة الطلب على الأنمي بنسبة 15% مقارنة بالعام السابق'
            ]
        };
    }

    renderReport(data, type) {
        const container = document.getElementById('reportContent');
        if (!container) return;

        let html = `
            <div class="report-header">
                <h2>${data.title}</h2>
                <span class="report-date">${data.date || data.period || data.month || data.year}</span>
            </div>
        `;

        // Summary section
        html += `
            <div class="report-summary">
                <div class="summary-card">
                    <i class="fas fa-hashtag"></i>
                    <div class="summary-info">
                        <span class="summary-value">${data.summary.operations}</span>
                        <span class="summary-label">عملية</span>
                    </div>
                </div>
                <div class="summary-card">
                    <i class="fas fa-hdd"></i>
                    <div class="summary-info">
                        <span class="summary-value">${this.formatSize(data.summary.totalSize)}</span>
                        <span class="summary-label">حجم البيانات</span>
                    </div>
                </div>
                <div class="summary-card highlight">
                    <i class="fas fa-coins"></i>
                    <div class="summary-info">
                        <span class="summary-value">${data.summary.totalRevenue.toLocaleString()}</span>
                        <span class="summary-label">ريال يمني</span>
                    </div>
                </div>
            </div>
        `;

        // Type-specific content
        switch(type) {
            case 'daily':
                html += this.renderDailyDetails(data);
                break;
            case 'weekly':
                html += this.renderWeeklyDetails(data);
                break;
            case 'monthly':
                html += this.renderMonthlyDetails(data);
                break;
            case 'yearly':
                html += this.renderYearlyDetails(data);
                break;
            case 'content':
                html += this.renderContentDetails(data);
                break;
        }

        container.innerHTML = html;

        // Initialize charts if needed
        this.initReportCharts(data, type);
    }

    renderDailyDetails(data) {
        let html = `
            <div class="payment-breakdown">
                <h3>توزيع المدفوعات</h3>
                <div class="payment-bars">
                    <div class="payment-bar">
                        <span class="payment-label">نقداً</span>
                        <div class="bar-container">
                            <div class="bar cash" style="width: ${(data.summary.cash / data.summary.totalRevenue) * 100}%"></div>
                        </div>
                        <span class="payment-value">${data.summary.cash} ريال</span>
                    </div>
                    <div class="payment-bar">
                        <span class="payment-label">إلكتروني</span>
                        <div class="bar-container">
                            <div class="bar electronic" style="width: ${(data.summary.electronic / data.summary.totalRevenue) * 100}%"></div>
                        </div>
                        <span class="payment-value">${data.summary.electronic} ريال</span>
                    </div>
                    <div class="payment-bar">
                        <span class="payment-label">آجل</span>
                        <div class="bar-container">
                            <div class="bar credit" style="width: ${(data.summary.credit / data.summary.totalRevenue) * 100}%"></div>
                        </div>
                        <span class="payment-value">${data.summary.credit} ريال</span>
                    </div>
                </div>
            </div>
            
            <div class="transactions-table">
                <h3>تفاصيل العمليات</h3>
                <table>
                    <thead>
                        <tr>
                            <th>الوقت</th>
                            <th>النوع</th>
                            <th>الحجم</th>
                            <th>السعر</th>
                            <th>الدفع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.transactions.map(t => `
                            <tr>
                                <td>${t.time}</td>
                                <td>${t.type}</td>
                                <td>${t.size} GB</td>
                                <td>${t.price} ريال</td>
                                <td><span class="payment-badge ${t.payment === 'نقداً' ? 'cash' : t.payment === 'إلكتروني' ? 'electronic' : 'credit'}">${t.payment}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        return html;
    }

    renderWeeklyDetails(data) {
        return `
            <div class="chart-container">
                <h3>الإيرادات اليومية</h3>
                <canvas id="weeklyChart"></canvas>
            </div>
            <div class="weekly-breakdown">
                <h3>التفاصيل اليومية</h3>
                <div class="breakdown-grid">
                    ${data.dailyBreakdown.map(d => `
                        <div class="breakdown-card">
                            <span class="day-name">${d.day}</span>
                            <span class="day-ops">${d.operations} عملية</span>
                            <span class="day-revenue">${d.revenue} ريال</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderMonthlyDetails(data) {
        return `
            <div class="growth-indicator ${data.summary.growth >= 0 ? 'positive' : 'negative'}">
                <i class="fas fa-${data.summary.growth >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                <span>${Math.abs(data.summary.growth)}% مقارنة بالشهر السابق</span>
            </div>
            <div class="chart-container">
                <h3>الإيرادات الأسبوعية</h3>
                <canvas id="monthlyChart"></canvas>
            </div>
        `;
    }

    renderYearlyDetails(data) {
        return `
            <div class="growth-indicator ${data.summary.growth >= 0 ? 'positive' : 'negative'}">
                <i class="fas fa-${data.summary.growth >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                <span>${Math.abs(data.summary.growth)}% مقارنة بالسنة السابقة</span>
            </div>
            <div class="chart-container full-width">
                <h3>الإيرادات الشهرية</h3>
                <canvas id="yearlyChart"></canvas>
            </div>
        `;
    }

    renderContentDetails(data) {
        return `
            <div class="content-stats">
                <div class="chart-container">
                    <canvas id="contentPieChart"></canvas>
                </div>
                <div class="content-list">
                    ${data.categories.map((c, i) => `
                        <div class="content-item">
                            <span class="content-rank">#${i + 1}</span>
                            <span class="content-name">${c.name}</span>
                            <div class="content-bar">
                                <div class="bar" style="width: ${c.percentage}%; background: ${this.getCategoryColor(i)}"></div>
                            </div>
                            <span class="content-percentage">${c.percentage}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="insights-section">
                <h3>تحليلات وملاحظات</h3>
                <ul class="insights-list">
                    ${data.insights.map(i => `<li><i class="fas fa-lightbulb"></i> ${i}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    getCategoryColor(index) {
        const colors = ['#e50914', '#ff6b35', '#f7931e', '#ffcc00', '#00d4aa', '#00a8e8', '#9b59b6'];
        return colors[index % colors.length];
    }

    initReportCharts(data, type) {
        setTimeout(() => {
            switch(type) {
                case 'weekly':
                    this.createWeeklyChart(data);
                    break;
                case 'monthly':
                    this.createMonthlyChart(data);
                    break;
                case 'yearly':
                    this.createYearlyChart(data);
                    break;
                case 'content':
                    this.createContentChart(data);
                    break;
            }
        }, 100);
    }

    createWeeklyChart(data) {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.dailyBreakdown.map(d => d.day),
                datasets: [{
                    label: 'الإيرادات',
                    data: data.dailyBreakdown.map(d => d.revenue),
                    backgroundColor: '#e50914'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    createMonthlyChart(data) {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.weeklyBreakdown.map(w => w.week),
                datasets: [{
                    label: 'الإيرادات',
                    data: data.weeklyBreakdown.map(w => w.revenue),
                    borderColor: '#e50914',
                    backgroundColor: 'rgba(229, 9, 20, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    createYearlyChart(data) {
        const ctx = document.getElementById('yearlyChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.monthlyBreakdown.map(m => m.month),
                datasets: [{
                    label: 'الإيرادات',
                    data: data.monthlyBreakdown.map(m => m.revenue),
                    backgroundColor: '#e50914'
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    createContentChart(data) {
        const ctx = document.getElementById('contentPieChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.categories.map(c => c.name),
                datasets: [{
                    data: data.categories.map(c => c.percentage),
                    backgroundColor: data.categories.map((_, i) => this.getCategoryColor(i))
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async exportToPdf() {
        if (window.electronAPI) {
            const result = await window.electronAPI.exportReport({
                format: 'pdf',
                reportType: this.currentReport,
                content: document.getElementById('reportContent').innerHTML
            });

            if (result.success) {
                window.CinMaxApp.showNotification(`تم تصدير التقرير: ${result.filename}`, 'success');
            }
        }
    }

    async exportToExcel() {
        if (window.electronAPI) {
            const result = await window.electronAPI.exportReport({
                format: 'excel',
                reportType: this.currentReport
            });

            if (result.success) {
                window.CinMaxApp.showNotification(`تم تصدير التقرير: ${result.filename}`, 'success');
            }
        }
    }

    printReport() {
        window.print();
    }

    formatSize(bytes) {
        if (!bytes) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }
}

// Initialize
window.ReportsManager = new ReportsManager();