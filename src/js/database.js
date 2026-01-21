// ==================================================
// CinMax Store - Database Manager (SQLite)
// ==================================================

const Database = require('better-sqlite3');
const path = require('path');

class CinMaxDatabase {
    constructor(dbPath) {
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
    }

    // ==================== تهيئة الجداول ====================
    initialize() {
        // جدول العمليات
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS operations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                device_type TEXT NOT NULL,
                device_name TEXT,
                content_type TEXT NOT NULL,
                content_category TEXT,
                items_count INTEGER DEFAULT 0,
                size_gb REAL NOT NULL,
                price REAL NOT NULL,
                payment_method TEXT NOT NULL,
                wallet_name TEXT,
                customer_name TEXT,
                notes TEXT,
                source_path TEXT,
                is_download INTEGER DEFAULT 0
            )
        `);

        // جدول الديون
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS debts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                customer_name TEXT NOT NULL,
                phone TEXT,
                amount REAL NOT NULL,
                paid_amount REAL DEFAULT 0,
                content_description TEXT,
                size_info TEXT,
                due_date DATE,
                status TEXT DEFAULT 'pending',
                notes TEXT
            )
        `);

        // جدول الإعدادات
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `);

        // جدول المحافظ الإلكترونية
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                sort_order INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1
            )
        `);

        // إدراج المحافظ الافتراضية
        this.initializeDefaultWallets();
        this.initializeDefaultSettings();
    }

    // ==================== المحافظ الافتراضية ====================
    initializeDefaultWallets() {
        const wallets = [
            'محفظة جيب', 'محفظة كاش', 'محفظة إيزي', 'محفظة الشامل',
            'المتكاملة mPay', 'محفظة سبأ كاش', 'محفظة فلوسك', 
            'محفظة محفظتي', 'محفظة موبايل موني', 'محفظة ون كاش',
            'محفظة جوالي', 'محفظة شامل موني'
        ];

        const insert = this.db.prepare(`
            INSERT OR IGNORE INTO wallets (name, sort_order) VALUES (?, ?)
        `);

        wallets.forEach((wallet, index) => {
            insert.run(wallet, index);
        });
    }

    // ==================== الإعدادات الافتراضية ====================
    initializeDefaultSettings() {
        const defaults = {
            // أسعار الأفلام
            'price_movie_single': '100',           // 1-5 أفلام
            'price_movie_bulk_per_gb': '50',       // 6+ أفلام لكل جيجا
            'price_movie_download': '150',         // تحميل فيلم
            
            // أسعار المسلسلات
            'price_series_per_gb': '50',           // لكل جيجا
            'price_series_download_per_gb': '100', // تحميل لكل جيجا
            
            // إعدادات عامة
            'language': 'ar',
            'currency': 'ريال يمني',
            'auto_start': 'true',
            'auto_eject': 'false',
            'default_payment': 'cash',
            'default_wallet': 'محفظة جيب',
            
            // مسارات المحتوى
            'movies_path': 'D:\\Movies',
            'series_path': 'D:\\Series',
            'programs_path': 'D:\\Programs'
        };

        const insert = this.db.prepare(`
            INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
        `);

        Object.entries(defaults).forEach(([key, value]) => {
            insert.run(key, value);
        });
    }

    // ==================== حفظ عملية نسخ ====================
    saveCopyOperation(operation) {
        const stmt = this.db.prepare(`
            INSERT INTO operations (
                device_type, device_name, content_type, content_category,
                items_count, size_gb, price, payment_method, wallet_name,
                customer_name, notes, source_path, is_download
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            operation.deviceType,
            operation.deviceName,
            operation.contentType,
            operation.contentCategory,
            operation.itemsCount,
            operation.sizeGB,
            operation.price,
            operation.paymentMethod,
            operation.walletName || null,
            operation.customerName || null,
            operation.notes || null,
            operation.sourcePath || null,
            operation.isDownload ? 1 : 0
        );

        return { success: true, id: result.lastInsertRowid };
    }

    // ==================== جلب الإحصائيات ====================
    getStatistics(period = 'daily') {
        let dateFilter;
        const now = new Date();

        switch (period) {
            case 'daily':
                dateFilter = now.toISOString().split('T')[0];
                break;
            case 'weekly':
                const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                dateFilter = weekAgo.toISOString().split('T')[0];
                break;
            case 'monthly':
                const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter = monthAgo.toISOString().split('T')[0];
                break;
            case 'yearly':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                dateFilter = yearStart.toISOString().split('T')[0];
                break;
            default:
                dateFilter = now.toISOString().split('T')[0];
        }

        // الإحصائيات العامة
        const generalStats = this.db.prepare(`
            SELECT 
                COUNT(*) as total_operations,
                COALESCE(SUM(size_gb), 0) as total_size,
                COALESCE(SUM(price), 0) as total_revenue,
                COALESCE(SUM(items_count), 0) as total_items
            FROM operations 
            WHERE DATE(timestamp) >= ?
        `).get(dateFilter);

        // إحصائيات حسب نوع المحتوى
        const contentStats = this.db.prepare(`
            SELECT 
                content_type,
                content_category,
                COUNT(*) as count,
                SUM(size_gb) as size,
                SUM(price) as revenue
            FROM operations 
            WHERE DATE(timestamp) >= ?
            GROUP BY content_type, content_category
            ORDER BY count DESC
        `).all(dateFilter);

        // إحصائيات حسب طريقة الدفع
        const paymentStats = this.db.prepare(`
            SELECT 
                payment_method,
                wallet_name,
                COUNT(*) as count,
                SUM(price) as total
            FROM operations 
            WHERE DATE(timestamp) >= ?
            GROUP BY payment_method, wallet_name
        `).all(dateFilter);

        // إحصائيات حسب نوع الجهاز
        const deviceStats = this.db.prepare(`
            SELECT 
                device_type,
                COUNT(*) as count,
                SUM(size_gb) as size
            FROM operations 
            WHERE DATE(timestamp) >= ?
            GROUP BY device_type
        `).all(dateFilter);

        // أكثر المحتويات طلباً
        const topContent = this.db.prepare(`
            SELECT 
                content_category,
                COUNT(*) as requests,
                SUM(size_gb) as total_size
            FROM operations 
            WHERE DATE(timestamp) >= ?
            GROUP BY content_category
            ORDER BY requests DESC
            LIMIT 10
        `).all(dateFilter);

        return {
            period,
            dateFilter,
            general: generalStats,
            byContent: contentStats,
            byPayment: paymentStats,
            byDevice: deviceStats,
            topContent: topContent
        };
    }

    // ==================== سجل العمليات ====================
    getOperationsLog(filters = {}) {
        let query = `SELECT * FROM operations WHERE 1=1`;
        const params = [];

        if (filters.startDate) {
            query += ` AND DATE(timestamp) >= ?`;
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ` AND DATE(timestamp) <= ?`;
            params.push(filters.endDate);
        }

        if (filters.contentType) {
            query += ` AND content_type = ?`;
            params.push(filters.contentType);
        }

        if (filters.paymentMethod) {
            query += ` AND payment_method = ?`;
            params.push(filters.paymentMethod);
        }

        query += ` ORDER BY timestamp DESC`;

        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(filters.limit);
        }

        return this.db.prepare(query).all(...params);
    }

    // ==================== إدارة الديون ====================
    getDebts(status = null) {
        let query = `SELECT * FROM debts`;
        if (status) {
            query += ` WHERE status = ?`;
            return this.db.prepare(query).all(status);
        }
        return this.db.prepare(query + ` ORDER BY created_at DESC`).all();
    }

    saveDebt(debt) {
        const stmt = this.db.prepare(`
            INSERT INTO debts (
                customer_name, phone, amount, content_description,
                size_info, due_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            debt.customerName,
            debt.phone || null,
            debt.amount,
            debt.contentDescription || null,
            debt.sizeInfo || null,
            debt.dueDate || null,
            debt.notes || null
        );

        return { success: true, id: result.lastInsertRowid };
    }

    updateDebt(debt) {
        const stmt = this.db.prepare(`
            UPDATE debts SET
                paid_amount = ?,
                status = ?,
                notes = ?
            WHERE id = ?
        `);

        const newStatus = debt.paidAmount >= debt.amount ? 'paid' : 
                         debt.paidAmount > 0 ? 'partial' : 'pending';

        stmt.run(debt.paidAmount, newStatus, debt.notes, debt.id);
        return { success: true };
    }

    // ==================== الإعدادات ====================
    getSettings() {
        const rows = this.db.prepare(`SELECT key, value FROM settings`).all();
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }

    saveSettings(settings) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
        `);

        Object.entries(settings).forEach(([key, value]) => {
            stmt.run(key, String(value));
        });

        return { success: true };
    }

    // ==================== المحافظ ====================
    getWallets() {
        return this.db.prepare(`
            SELECT * FROM wallets WHERE is_active = 1 ORDER BY sort_order
        `).all();
    }

    addWallet(name) {
        const maxOrder = this.db.prepare(`
            SELECT MAX(sort_order) as max FROM wallets
        `).get();

        this.db.prepare(`
            INSERT INTO wallets (name, sort_order) VALUES (?, ?)
        `).run(name, (maxOrder.max || 0) + 1);

        return { success: true };
    }
}

module.exports = CinMaxDatabase;