class DocumentManager {
    constructor() {
        this.documents = this.loadDocuments();
        this.filteredDocuments = [...this.documents]; // برای جستجو و فیلتر
        this.currentEditId = null;
        this.init();
    }

    // بارگذاری از Local Storage
    loadDocuments() {
        const data = localStorage.getItem('financialDocuments');
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('خطا در خواندن LocalStorage:', e);
            return [];
        }
    }

    // ذخیره در Local Storage
    saveDocuments() {
        localStorage.setItem('financialDocuments', JSON.stringify(this.documents));
    }

    // مقداردهی اولیه
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderTable();
        this.numberInput.value = this.getNextNumber();
    }

    // کش کردن المان‌های DOM
    cacheDOM() {
        this.form = document.getElementById('documentForm');
        this.tableBody = document.getElementById('tableBody');
        this.emptyState = document.getElementById('emptyState');
        this.submitBtn = document.getElementById('submitBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.editIdInput = document.getElementById('editId');
        this.numberInput = document.getElementById('number');
        this.lunarDateInput = document.getElementById('lunarDate');
        this.solarDateInput = document.getElementById('solarDate');
        this.executionTypeInput = document.getElementById('executionType');
        this.officeInput = document.getElementById('office');
        this.descriptionInput = document.getElementById('description');
        this.totalPriceInput = document.getElementById('totalPrice');
        this.documentTypeInput = document.getElementById('documentType');
        this.documentNumberInput = document.getElementById('documentNumber');

        this.totalCountElement = document.getElementById('totalCount');
        this.totalPriceSummaryElement = document.getElementById('totalPriceSummary');

        // المان‌های جدید برای جستجو، فیلتر و خروجی
        this.searchInput = document.getElementById('searchInput');
        this.filterTypeInput = document.getElementById('filterType');
        this.filterDateFrom = document.getElementById('filterDateFrom');
        this.filterDateTo = document.getElementById('filterDateTo');
        this.btnSearch = document.getElementById('btnSearch');
        this.btnResetFilter = document.getElementById('btnResetFilter');
        this.btnPrint = document.getElementById('btnPrint');
        this.btnExcel = document.getElementById('btnExcel');
        this.btnPDF = document.getElementById('btnPDF');
    }

    // گرفتن شماره خودکار بعدی
    getNextNumber() {
        if (this.documents.length === 0) return 1;
        const maxNumber = Math.max(...this.documents.map(doc => parseInt(doc.number) || 0));
        return maxNumber + 1;
    }

    // اتصال رویدادها
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.cancelBtn.addEventListener('click', () => this.resetForm());

        if (this.btnSearch) this.btnSearch.addEventListener('click', () => this.applySearchAndFilter());
        if (this.searchInput) this.searchInput.addEventListener('input', () => this.applySearchAndFilter());
        if (this.filterTypeInput) this.filterTypeInput.addEventListener('change', () => this.applySearchAndFilter());
        if (this.filterDateFrom) this.filterDateFrom.addEventListener('change', () => this.applySearchAndFilter());
        if (this.filterDateTo) this.filterDateTo.addEventListener('change', () => this.applySearchAndFilter());
        if (this.btnResetFilter) this.btnResetFilter.addEventListener('click', () => this.clearFilters());

        if (this.btnPrint) this.btnPrint.addEventListener('click', () => this.printTable());
        if (this.btnExcel) this.btnExcel.addEventListener('click', () => this.exportExcel());
        if (this.btnPDF) this.btnPDF.addEventListener('click', () => this.exportPDF());
    }

    // دریافت داده‌های فرم
    getFormData() {
        // ⚠️ تبدیل totalPrice به عدد صحیح برای ذخیره و جمع‌زدن
        const rawPrice = this.totalPriceInput.value;
        const cleanPrice = rawPrice ? parseInt(rawPrice.toString().replace(/[^0-9]/g, ''), 10) : 0;

        return {
            number: parseInt(this.numberInput.value) || this.getNextNumber(),
            lunarDate: this.lunarDateInput.value.trim() || '-',
            solarDate: this.solarDateInput.value.trim() || '-',
            executionType: this.executionTypeInput.value.trim() || '-',
            office: this.officeInput.value.trim() || '-',
            description: this.descriptionInput.value.trim() || '-',
            totalPrice: cleanPrice || 0,  // ✅ ذخیره عدد خالص (بدون واحد)
            documentType: this.documentTypeInput.value.trim() || '-',
            documentNumber: this.documentNumberInput.value.trim() || '-'
        };
    }

    // اعتبارسنجی فرم
    validateForm(data) {
        if (!data.number || data.number <= 0) {
            this.showAlert('لطفاً شماره معتبر وارد کنید.', 'error');
            return false;
        }
        return true;
    }

    // مدیریت ثبت و ویرایش
    handleSubmit(e) {
        e.preventDefault();
        const formData = this.getFormData();
        if (!this.validateForm(formData)) return;

        if (this.currentEditId) {
            this.updateDocument(this.currentEditId, formData);
        } else {
            this.addDocument(formData);
        }

        this.saveDocuments();
        this.applySearchAndFilter(); // ✅ رerender با در نظر گرفتن فیلتر جاری
        this.resetForm();
    }

    // افزودن سند جدید
    addDocument(data) {
        this.documents.push({
            ...data,
            id: Date.now().toString(),
            createdAt: new Date().toLocaleDateString('fa-IR')
        });
        this.showAlert('سند با موفقیت ثبت شد!', 'success');
    }

    // به‌روزرسانی سند
    updateDocument(id, data) {
        const index = this.documents.findIndex(doc => doc.id === id);
        if (index !== -1) {
            this.documents[index] = { ...this.documents[index], ...data };
            this.showAlert('سند با موفقیت ویرایش شد!', 'success');
        }
    }

    // حذف سند
    deleteDocument(id) {
        if (!confirm('آیا از حذف این سند مطمئن هستید؟')) return;
        this.documents = this.documents.filter(doc => doc.id !== id);
        this.saveDocuments();
        this.applySearchAndFilter();
        this.showAlert('سند با موفقیت حذف شد!', 'success');
    }

    // ویرایش سند
    editDocument(id) {
        const doc = this.documents.find(d => d.id === id);
        if (!doc) return;

        this.currentEditId = id;
        this.numberInput.value = doc.number;
        this.lunarDateInput.value = doc.lunarDate !== '-' ? doc.lunarDate : '';
        this.solarDateInput.value = doc.solarDate !== '-' ? doc.solarDate : '';
        this.executionTypeInput.value = doc.executionType !== '-' ? doc.executionType : '';
        this.officeInput.value = doc.office !== '-' ? doc.office : '';
        this.descriptionInput.value = doc.description !== '-' ? doc.description : '';
        this.totalPriceInput.value = doc.totalPrice !== undefined ? doc.totalPrice : '';
        this.documentTypeInput.value = doc.documentType !== '-' ? doc.documentType : '';
        this.documentNumberInput.value = doc.documentNumber !== '-' ? doc.documentNumber : '';

        this.submitBtn.textContent = 'ویرایش سند';
        this.cancelBtn.style.display = 'inline-flex';
        this.editIdInput.value = id;

        this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // جستجو و فیلتر
    applySearchAndFilter() {
        const search = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
        const type = this.filterTypeInput ? this.filterTypeInput.value.trim() : '';
        const dateFrom = this.filterDateFrom ? this.filterDateFrom.value : '';
        const dateTo = this.filterDateTo ? this.filterDateTo.value : '';

        this.filteredDocuments = this.documents.filter(doc => {
            let matches = true;

            // جستجوی متنی در شماره، تاریخ‌ها، نوع، دفتر، شرح، نوع سند و شماره سند
            if (search) {
                const text = [
                    doc.number,
                    doc.lunarDate,
                    doc.solarDate,
                    doc.executionType,
                    doc.office,
                    doc.description,
                    doc.documentType,
                    doc.documentNumber
                ].join(' ').toLowerCase();
                matches = matches && text.includes(search);
            }

            // فیلتر بر اساس نوع سند
            if (type && type !== 'all') {
                matches = matches && (doc.documentType === type || doc.executionType === type);
            }

            // فیلتر تاریخ شمسی (بازه)
            if (dateFrom || dateTo) {
                const docDate = this.parsePersianDate(doc.solarDate);
                if (dateFrom && docDate) matches = matches && docDate >= this.parsePersianDate(dateFrom);
                if (dateTo && docDate) matches = matches && docDate <= this.parsePersianDate(dateTo);
            }

            return matches;
        });

        this.renderTable();
    }

    // تبدیل تاریخ شمسی به عدد قابل مقایسه (YYYY*10000 + MM*100 + DD)
    parsePersianDate(str) {
        if (!str || str === '-') return null;
        const parts = str.replace(/\//g, '-').split('-');
        if (parts.length < 3) return null;
        const y = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const d = parseInt(parts[2], 10) || 0;
        return y * 10000 + m * 100 + d;
    }

    // پاک کردن فیلترها
    clearFilters() {
        if (this.searchInput) this.searchInput.value = '';
        if (this.filterTypeInput) this.filterTypeInput.value = 'all';
        if (this.filterDateFrom) this.filterDateFrom.value = '';
        if (this.filterDateTo) this.filterDateTo.value = '';
        this.filteredDocuments = [...this.documents];
        this.renderTable();
    }

    // escape HTML برای جلوگیری از XSS
    escapeHTML(str) {
        if (str === null || str === undefined) return '-';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // رندر جدول
    renderTable() {
        const data = this.filteredDocuments || this.documents;

        if (data.length === 0) {
            this.tableBody.innerHTML = '';
            this.emptyState.style.display = 'block';
            this.updateSummary(data);
            return;
        }

        this.emptyState.style.display = 'none';

        this.tableBody.innerHTML = data.map(doc => `
            <tr>
                <td>${this.escapeHTML(doc.number)}</td>
                <td>${this.escapeHTML(doc.lunarDate)}</td>
                <td>${this.escapeHTML(doc.solarDate)}</td>
                <td>${this.escapeHTML(doc.executionType)}</td>
                <td>${this.escapeHTML(doc.office)}</td>
                <td>${this.escapeHTML(doc.description)}</td>
                <td>${this.formatPrice(doc.totalPrice)}</td>
                <td>${this.escapeHTML(doc.documentType)}</td>
                <td>${this.escapeHTML(doc.documentNumber)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-outline" onclick="documentManager.editDocument('${doc.id}')" title="ویرایش">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="documentManager.deleteDocument('${doc.id}')" title="حذف">Delete</button>
                </td>
            </tr>
        `).join('');

        this.updateSummary(data);
    }

    // به‌روزرسانی summary — جمع کل مبالغ و تعداد رکوردها
    updateSummary(data) {
        const list = data || this.documents;
        if (this.totalCountElement) {
            this.totalCountElement.textContent = list.length;
        }
        if (this.totalPriceSummaryElement) {
            // ✅ جمع مبالغ فقط روی لیست نمایش داده شده (یا کل)
            const total = list.reduce((sum, doc) => sum + (parseInt(doc.totalPrice) || 0), 0);
            this.totalPriceSummaryElement.textContent = this.formatPrice(total);
        }
    }

    // فرمت کردن قیمت — اضافه کردن واحد "افغانی" در نمایش (نه در ذخیره)
    formatPrice(price) {
        const value = parseInt(price) || 0;
        return new Intl.NumberFormat('fa-IR').format(value) + ' افغانی';
    }

    // ریست کردن فرم
    resetForm() {
        this.form.reset();
        this.currentEditId = null;
        this.editIdInput.value = '';
        this.submitBtn.textContent = 'ثبت سند';
        this.cancelBtn.style.display = 'none';
        this.numberInput.value = this.getNextNumber();
    }

    // پرینت جدول
    printTable() {
        const data = this.filteredDocuments || this.documents;
        if (!data.length) {
            this.showAlert('داده‌ای برای پرینت وجود ندارد.', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        const rows = data.map(doc => `
            <tr>
                <td>${this.escapeHTML(doc.number)}</td>
                <td>${this.escapeHTML(doc.lunarDate)}</td>
                <td>${this.escapeHTML(doc.solarDate)}</td>
                <td>${this.escapeHTML(doc.executionType)}</td>
                <td>${this.escapeHTML(doc.office)}</td>
                <td>${this.escapeHTML(doc.description)}</td>
                <td>${this.formatPrice(doc.totalPrice)}</td>
                <td>${this.escapeHTML(doc.documentType)}</td>
                <td>${this.escapeHTML(doc.documentNumber)}</td>
            </tr>
        `).join('');

        const total = data.reduce((sum, doc) => sum + (parseInt(doc.totalPrice) || 0), 0);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>پرینت اسناد مالی</title>
                <style>
                    body { font-family: Tahoma, Arial; direction: rtl; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #333; padding: 8px; text-align: center; }
                    th { background: #f0f0f0; }
                    .summary { margin-top: 10px; font-weight: bold; }
                </style>
            </head>
            <body>
                <h2>فهرست اسناد مالی</h2>
                <table>
                    <thead>
                        <tr>
                            <th>شماره</th>
                            <th>تاریخ قمری</th>
                            <th>تاریخ شمسی</th>
                            <th>نوع اجرا</th>
                            <th>دفتر</th>
                            <th>شرح</th>
                            <th>مبلغ کل</th>
                            <th>نوع سند</th>
                            <th>شماره سند</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="summary">
                    تعداد: ${data.length} | جمع کل: ${this.formatPrice(total)}
                </div>
                <script>window.onload = () => { setTimeout(() => { window.print(); }, 300); };</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    // خروجی اکسل (HTML Table با mime type Excel)
    exportExcel() {
        const data = this.filteredDocuments || this.documents;
        if (!data.length) {
            this.showAlert('داده‌ای برای خروجی اکسل وجود ندارد.', 'error');
            return;
        }

        const rows = data.map(doc => `
            <tr>
                <td>${this.escapeHTML(doc.number)}</td>
                <td>${this.escapeHTML(doc.lunarDate)}</td>
                <td>${this.escapeHTML(doc.solarDate)}</td>
                <td>${this.escapeHTML(doc.executionType)}</td>
                <td>${this.escapeHTML(doc.office)}</td>
                <td>${this.escapeHTML(doc.description)}</td>
                <td>${parseInt(doc.totalPrice) || 0}</td>
                <td>${this.escapeHTML(doc.documentType)}</td>
                <td>${this.escapeHTML(doc.documentNumber)}</td>
            </tr>
        `).join('');

        const total = data.reduce((sum, doc) => sum + (parseInt(doc.totalPrice) || 0), 0);

        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <meta charset="UTF-8">
                <style>table { border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 6px; text-align: center; } th { background: #e0e0e0; }</style>
            </head>
            <body>
                <table>
                    <thead>
                        <tr>
                            <th>شماره</th>
                            <th>تاریخ قمری</th>
                            <th>تاریخ شمسی</th>
                            <th>نوع اجرا</th>
                            <th>دفتر</th>
                            <th>شرح</th>
                            <th>مبلغ کل (افغانی)</th>
                            <th>نوع سند</th>
                            <th>شماره سند</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                        <tr>
                            <td colspan="6" style="font-weight:bold;">جمع کل</td>
                            <td style="font-weight:bold;">${total}</td>
                            <td colspan="2"></td>
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'FinancialDocuments_' + new Date().toISOString().slice(0, 10) + '.xls';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showAlert('خروجی اکسل با موفقیت دانلود شد!', 'success');
    }

    // خروجی PDF
    exportPDF() {
        const data = this.filteredDocuments || this.documents;
        if (!data.length) {
            this.showAlert('داده‌ای برای خروجی PDF وجود ندارد.', 'error');
            return;
        }

        // استفاده از jsPDF از CDN (در صورت موجود نبودن، به پرینت تبدیل می‌شود)
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
                .then(() => this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js'))
                .then(() => this.generatePDF(data))
                .catch(() => {
                    this.showAlert('کتابخانه PDF بارگذاری نشد؛ از پرینت استفاده کنید.', 'error');
                });
        } else {
            this.generatePDF(data);
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    generatePDF(data) {
        const { jsPDF } = window.jspdf || window.jsPDF;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        const total = data.reduce((sum, d) => sum + (parseInt(d.totalPrice) || 0), 0);

        doc.setFont('helvetica');
        doc.text('Financial Documents', 14, 15);

        const body = data.map(d => [
            d.number,
            d.lunarDate,
            d.solarDate,
            d.executionType,
            d.office,
            d.description,
            (parseInt(d.totalPrice) || 0).toString(),
            d.documentType,
            d.documentNumber
        ]);

        body.push(['Total', '', '', '', '', '', total.toString(), '', '']);

        if (doc.autoTable) {
            doc.autoTable({
                head: [['Number', 'Lunar Date', 'Solar Date', 'Execution Type', 'Office', 'Description', 'Total Price (AFN)', 'Doc Type', 'Doc Number']],
                body: body,
                startY: 20,
                styles: { fontSize: 9, halign: 'center' },
                headStyles: { fillColor: [44, 62, 80] }
            });
        } else {
            // Fallback اگر autoTable موجود نبود
            let y = 20;
            data.forEach((d, i) => {
                doc.text(`${i + 1}. ${d.number} | ${d.solarDate} | ${d.totalPrice} AFN`, 14, y);
                y += 7;
            });
            doc.text(`Total: ${total} AFN`, 14, y + 5);
        }

        doc.save('FinancialDocuments_' + new Date().toISOString().slice(0, 10) + '.pdf');
        this.showAlert('خروجی PDF با موفقیت دانلود شد!', 'success');
    }

    // نمایش هشدار
    showAlert(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 9999;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
    }
}

// مقداردهی اولیه پس از بارگذاری صفحه
let documentManager;
document.addEventListener('DOMContentLoaded', () => {
    documentManager = new DocumentManager();
});
