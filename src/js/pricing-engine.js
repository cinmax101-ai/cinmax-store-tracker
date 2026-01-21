// ==================================================
// CinMax Store - Pricing Engine
// ==================================================

class PricingEngine {
    constructor(settings = {}) {
        this.settings = {
            // أسعار الأفلام
            movieSinglePrice: parseInt(settings.price_movie_single) || 100,
            movieBulkThreshold: 5, // أكثر من 5 أفلام
            movieBulkPricePerGB: parseInt(settings.price_movie_bulk_per_gb) || 50,
            movieDownloadPrice: parseInt(settings.price_movie_download) || 150,
            
            // أسعار المسلسلات
            seriesPricePerGB: parseInt(settings.price_series_per_gb) || 50,
            seriesDownloadPricePerGB: parseInt(settings.price_series_download_per_gb) || 100,
            
            ...settings
        };
    }

    // ==================== حساب السعر الرئيسي ====================
    calculatePrice(data) {
        const {
            contentType,    // 'movies' | 'series' | 'mixed' | 'programs'
            itemsCount,     // عدد العناصر (أفلام أو حلقات)
            sizeGB,         // الحجم بالجيجابايت
            isDownload      // هل تحميل حسب الطلب؟
        } = data;

        let price = 0;
        let breakdown = [];

        // ========== تحميل حسب الطلب ==========
        if (isDownload) {
            return this.calculateDownloadPrice(contentType, itemsCount, sizeGB);
        }

        // ========== أفلام فقط ==========
        if (contentType === 'movies') {
            if (itemsCount <= this.settings.movieBulkThreshold) {
                // 1-5 أفلام: سعر ثابت لكل فيلم
                price = itemsCount * this.settings.movieSinglePrice;
                breakdown.push({
                    description: `${itemsCount} أفلام × ${this.settings.movieSinglePrice} ريال`,
                    amount: price
                });
            } else {
                // 6+ أفلام: حسب الحجم
                price = sizeGB * this.settings.movieBulkPricePerGB;
                breakdown.push({
                    description: `${sizeGB.toFixed(2)} جيجا × ${this.settings.movieBulkPricePerGB} ريال`,
                    amount: price
                });
            }
        }
        
        // ========== مسلسلات فقط ==========
        else if (contentType === 'series') {
            price = sizeGB * this.settings.seriesPricePerGB;
            breakdown.push({
                description: `${sizeGB.toFixed(2)} جيجا × ${this.settings.seriesPricePerGB} ريال`,
                amount: price
            });
        }
        
        // ========== أفلام + مسلسلات ==========
        else if (contentType === 'mixed') {
            price = sizeGB * this.settings.movieBulkPricePerGB;
            breakdown.push({
                description: `محتوى مختلط: ${sizeGB.toFixed(2)} جيجا × ${this.settings.movieBulkPricePerGB} ريال`,
                amount: price
            });
        }
        
        // ========== برامج ==========
        else if (contentType === 'programs') {
            price = sizeGB * this.settings.movieBulkPricePerGB;
            breakdown.push({
                description: `برامج: ${sizeGB.toFixed(2)} جيجا × ${this.settings.movieBulkPricePerGB} ريال`,
                amount: price
            });
        }

        return {
            price: Math.round(price),
            breakdown,
            method: this.getPricingMethod(contentType, itemsCount, isDownload)
        };
    }

    // ==================== حساب سعر التحميل ====================
    calculateDownloadPrice(contentType, itemsCount, sizeGB) {
        let price = 0;
        let breakdown = [];

        if (contentType === 'movies') {
            price = itemsCount * this.settings.movieDownloadPrice;
            breakdown.push({
                description: `تحميل ${itemsCount} فيلم × ${this.settings.movieDownloadPrice} ريال`,
                amount: price
            });
        } else {
            price = sizeGB * this.settings.seriesDownloadPricePerGB;
            breakdown.push({
                description: `تحميل ${sizeGB.toFixed(2)} جيجا × ${this.settings.seriesDownloadPricePerGB} ريال`,
                amount: price
            });
        }

        return {
            price: Math.round(price),
            breakdown,
            method: 'download'
        };
    }

    // ==================== طريقة التسعير ====================
    getPricingMethod(contentType, itemsCount, isDownload) {
        if (isDownload) return 'download';
        if (contentType === 'movies' && itemsCount <= 5) return 'per_item';
        return 'per_gb';
    }

    // ==================== تحديث الإعدادات ====================
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    // ==================== حساب سريع ====================
    quickCalculate(type, value) {
        switch (type) {
            case 'movies_count':
                return value <= 5 
                    ? value * this.settings.movieSinglePrice
                    : value * 2 * this.settings.movieBulkPricePerGB; // تقدير تقريبي
            
            case 'size_gb':
                return value * this.settings.movieBulkPricePerGB;
            
            case 'download_movies':
                return value * this.settings.movieDownloadPrice;
            
            case 'download_series_gb':
                return value * this.settings.seriesDownloadPricePerGB;
            
            default:
                return 0;
        }
    }
}

module.exports = PricingEngine;