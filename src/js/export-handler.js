/**
 * CinMax Export Handler
 * Handles PDF and Excel export functionality
 */

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class ExportHandler {
    constructor() {
        this.outputDir = path.join(require('os').homedir(), 'Documents', 'CinMax Reports');
        this.ensureOutputDir();
    }

    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Export report to PDF
     */
    async exportToPDF(reportData, reportType) {
        return new Promise((resolve, reject) => {
            try {
                const filename = `CinMax_${reportType}_${this.getDateString()}.pdf`;
                const filepath = path.join(this.outputDir, filename);

                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 },
                    info: {
                        Title: `CinMax Report - ${reportType}`,
                        Author: 'CinMax Store',
                        Creator: 'CinMax Store Copy Tracker'
                    }
                });

                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Register Arabic font
                const fontPath = path.join(__dirname, '../assets/fonts/Cairo-Regular.ttf');
                if (fs.existsSync(fontPath)) {
                    doc.registerFont('Arabic', fontPath);
                    doc.font('Arabic');
                }

                // Header
                this.addPDFHeader(doc, reportData);

                // Summary
                this.addPDFSummary(doc, reportData);

                // Details table
                this.addPDFTable(doc, reportData);

                // Footer
                this.addPDFFooter(doc);

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        success: true,
                        filename: filename,
                        filepath: filepath
                    });
                });

                stream.on('error', (err) => {
                    reject(err);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    addPDFHeader(doc, data) {
        // Logo area
        doc.rect(50, 50, 495, 80)
           .fillColor('#1a1a2e')
           .fill();

        doc.fillColor('#e50914')
           .fontSize(28)
           .text('CinMax Store', 50, 70, { align: 'center' });

        doc.fillColor('#ffffff')
           .fontSize(14)
           .text(data.title || 'تقرير', 50, 100, { align: 'center' });

        doc.moveDown(2);
    }

    addPDFSummary(doc, data) {
        doc.fillColor('#333333');
        
        const summary = data.summary || {};
        const summaryY = 160;

        // Summary boxes
        const boxes = [
            { label: 'عدد العمليات', value: summary.operations || 0 },
            { label: 'حجم البيانات', value: this.formatSize(summary.totalSize) },
            { label: 'إجمالي الإيرادات', value: `${summary.totalRevenue || 0} ريال` }
        ];

        const boxWidth = 150;
        const startX = 70;

        boxes.forEach((box, index) => {
            const x = startX + (index * (boxWidth + 20));
            
            doc.rect(x, summaryY, boxWidth, 60)
               .fillColor('#f5f5f5')
               .fill();

            doc.fillColor('#e50914')
               .fontSize(18)
               .text(box.value.toString(), x, summaryY + 10, { 
                   width: boxWidth, 
                   align: 'center' 
               });

            doc.fillColor('#666666')
               .fontSize(10)
               .text(box.label, x, summaryY + 38, { 
                   width: boxWidth, 
                   align: 'center' 
               });
        });

        doc.moveDown(4);
    }

    addPDFTable(doc, data) {
        const transactions = data.transactions || [];
        if (transactions.length === 0) return;

        const tableTop = 250;
        const tableHeaders = ['الوقت', 'النوع', 'الحجم', 'السعر', 'الدفع'];
        const columnWidths = [80, 120, 80, 80, 80];
        let startX = 55;

        // Table header
        doc.rect(50, tableTop, 495, 25)
           .fillColor('#e50914')
           .fill();

        doc.fillColor('#ffffff')
           .fontSize(10);

        tableHeaders.forEach((header, i) => {
            doc.text(header, startX, tableTop + 8, { width: columnWidths[i], align: 'center' });
            startX += columnWidths[i] + 10;
        });

        // Table rows
        let rowY = tableTop + 30;
        doc.fillColor('#333333');

        transactions.slice(0, 15).forEach((t, index) => {
            if (index % 2 === 0) {
                doc.rect(50, rowY - 5, 495, 25)
                   .fillColor('#f9f9f9')
                   .fill();
            }

            doc.fillColor('#333333');
            startX = 55;

            const rowData = [
                t.time || '--',
                t.type || '--',
                `${t.size || 0} GB`,
                `${t.price || 0} ريال`,
                t.payment || '--'
            ];

            rowData.forEach((cell, i) => {
                doc.text(cell, startX, rowY, { width: columnWidths[i], align: 'center' });
                startX += columnWidths[i] + 10;
            });

            rowY += 25;
        });
    }

    addPDFFooter(doc) {
        const pageHeight = doc.page.height;
        
        doc.fillColor('#888888')
           .fontSize(8)
           .text(
               `تم إنشاء هذا التقرير بواسطة CinMax Store Copy Tracker - ${new Date().toLocaleDateString('ar-YE')}`,
               50,
               pageHeight - 50,
               { align: 'center' }
           );
    }

    /**
     * Export report to Excel
     */
    async exportToExcel(reportData, reportType) {
        try {
            const filename = `CinMax_${reportType}_${this.getDateString()}.xlsx`;
            const filepath = path.join(this.outputDir, filename);

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'CinMax Store';
            workbook.created = new Date();

            // Main report sheet
            const sheet = workbook.addWorksheet('التقرير', {
                properties: { tabColor: { argb: 'E50914' } },
                views: [{ rightToLeft: true }]
            });

            // Header styling
            this.addExcelHeader(sheet, reportData);

            // Summary section
            this.addExcelSummary(sheet, reportData);

            // Data table
            this.addExcelTable(sheet, reportData);

            // Auto-fit columns
            sheet.columns.forEach(column => {
                column.width = 15;
            });

            await workbook.xlsx.writeFile(filepath);

            return {
                success: true,
                filename: filename,
                filepath: filepath
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    addExcelHeader(sheet, data) {
        // Merge cells for title
        sheet.mergeCells('A1:E1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'CinMax Store - ' + (data.title || 'تقرير');
        titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE50914' }
        };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 40;

        // Date row
        sheet.mergeCells('A2:E2');
        const dateCell = sheet.getCell('A2');
        dateCell.value = `التاريخ: ${data.date || new Date().toLocaleDateString('ar-YE')}`;
        dateCell.font = { size: 12, color: { argb: 'FF666666' } };
        dateCell.alignment = { horizontal: 'center' };
    }

    addExcelSummary(sheet, data) {
        const summary = data.summary || {};

        sheet.getCell('A4').value = 'ملخص التقرير';
        sheet.getCell('A4').font = { size: 14, bold: true };
        sheet.mergeCells('A4:E4');

        const summaryData = [
            ['عدد العمليات', summary.operations || 0],
            ['حجم البيانات', this.formatSize(summary.totalSize)],
            ['إجمالي الإيرادات', `${summary.totalRevenue || 0} ريال`],
            ['نقداً', `${summary.cash || 0} ريال`],
            ['إلكتروني', `${summary.electronic || 0} ريال`],
            ['آجل', `${summary.credit || 0} ريال`]
        ];

        let row = 5;
        summaryData.forEach(([label, value]) => {
            sheet.getCell(`A${row}`).value = label;
            sheet.getCell(`B${row}`).value = value;
            sheet.getCell(`A${row}`).font = { bold: true };
            row++;
        });
    }

    addExcelTable(sheet, data) {
        const transactions = data.transactions || [];
        if (transactions.length === 0) return;

        const startRow = 13;

        // Table headers
        const headers = ['الوقت', 'النوع', 'الحجم (GB)', 'السعر (ريال)', 'طريقة الدفع'];
        headers.forEach((header, index) => {
            const cell = sheet.getCell(startRow, index + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1a1a2e' }
            };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Table data
        transactions.forEach((t, index) => {
            const rowNum = startRow + index + 1;
            const rowData = [t.time, t.type, t.size, t.price, t.payment];
            
            rowData.forEach((value, colIndex) => {
                const cell = sheet.getCell(rowNum, colIndex + 1);
                cell.value = value;
                cell.alignment = { horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };

                // Alternate row colors
                if (index % 2 === 0) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF5F5F5' }
                    };
                }
            });
        });
    }

    /**
     * Get formatted date string for filename
     */
    getDateString() {
        const now = new Date();
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    }

    /**
     * Format file size
     */
    formatSize(bytes) {
        if (!bytes) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    /**
     * Open export folder
     */
    openExportFolder() {
        const { shell } = require('electron');
        shell.openPath(this.outputDir);
    }
}

module.exports = new ExportHandler();