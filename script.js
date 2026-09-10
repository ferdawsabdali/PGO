window.editDocumentRow = function(id) {
    console.log('editDocumentRow called, id:', id, 'docManager:', !!window.docManager);
    if (window.docManager) { window.docManager.editDocument(id); }
    else { alert('docManager آماده نیست!'); }
};
window.deleteDocumentRow = function(id) {
    console.log('deleteDocumentRow called, id:', id, 'docManager:', !!window.docManager);
    if (window.docManager) { window.docManager.showDeleteModal(id); }
    else { alert('docManager آماده نیست!'); }
};

class DocumentManager {
    constructor() {
        this.documents = this.loadDocuments();
        this.ensureDocumentIds();
        this.filteredDocuments = [...this.documents];
        this.currentEditId = null;
        this.pendingDeleteId = null;
        this.charts = {};
        this.init();
    }

    loadDocuments() {
        try {
            const data = localStorage.getItem('documents');
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('خطا در خواندن LocalStorage:', e);
            return [];
        }
    }

    ensureDocumentIds() {
        if (!Array.isArray(this.documents)) {
            this.documents = [];
            return;
        }
        this.documents = this.documents.filter(function(doc) { return doc !== null && typeof doc === 'object'; });
        this.documents.forEach(function(doc) {
            if (!doc.id) {
                doc.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            } else {
                doc.id = String(doc.id);
            }
        });
    }

    saveDocuments() {
        try {
            localStorage.setItem('documents', JSON.stringify(this.documents));
        } catch (e) {
            console.error('خطا در ذخیره LocalStorage:', e);
        }
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderTable();
        if (this.numberInput) {
            this.numberInput.value = this.getNextNumber();
        }
    }

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
        this.searchInput = document.getElementById('searchInput');
        this.filterTypeInput = document.getElementById('filterType');
        this.filterExecutionInput = document.getElementById('filterExecution');
        this.statsSection = document.getElementById('statsSection');
        this.deleteModal = document.getElementById('deleteModal');
    }

    getNextNumber() {
        if (!Array.isArray(this.documents) || this.documents.length === 0) return 1;
        const maxNumber = Math.max.apply(null, this.documents.map(function(doc) { return parseInt(doc.number) || 0; }));
        return maxNumber + 1;
    }

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', function(e) { this.handleSubmit(e); }.bind(this));
        }
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', function() { this.resetForm(); }.bind(this));
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('input', function() { this.applySearchAndFilter(); }.bind(this));
        }
        if (this.filterTypeInput) {
            this.filterTypeInput.addEventListener('change', function() { this.applySearchAndFilter(); }.bind(this));
        }
        if (this.filterExecutionInput) {
            this.filterExecutionInput.addEventListener('change', function() { this.applySearchAndFilter(); }.bind(this));
        }
    }

    getFormData() {
        const rawPrice = this.totalPriceInput ? this.totalPriceInput.value : '';
        const cleanPrice = rawPrice ? parseInt(rawPrice.toString().replace(/[^0-9]/g, ''), 10) : 0;
        return {
            number: this.numberInput ? (parseInt(this.numberInput.value) || this.getNextNumber()) : this.getNextNumber(),
            lunarDate: this.lunarDateInput ? (this.lunarDateInput.value.trim() || '-') : '-',
            solarDate: this.solarDateInput ? (this.solarDateInput.value.trim() || '-') : '-',
            executionType: this.executionTypeInput ? (this.executionTypeInput.value.trim() || '-') : '-',
            office: this.officeInput ? (this.officeInput.value.trim() || '-') : '-',
            description: this.descriptionInput ? (this.descriptionInput.value.trim() || '-') : '-',
            totalPrice: cleanPrice || 0,
            documentType: this.documentTypeInput ? (this.documentTypeInput.value.trim() || '-') : '-',
            documentNumber: this.documentNumberInput ? (this.documentNumberInput.value.trim() || '-') : '-'
        };
    }

    validateForm(data) {
        if (!data.number || data.number <= 0) {
            this.showAlert('لطفاً شماره معتبر وارد کنید.', 'error');
            return false;
        }
        return true;
    }

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
        this.applySearchAndFilter();
        this.resetForm();
        this.updateStatsIfVisible();
    }

    addDocument(data) {
        var newDoc = {
            number: data.number,
            lunarDate: data.lunarDate,
            solarDate: data.solarDate,
            executionType: data.executionType,
            office: data.office,
            description: data.description,
            totalPrice: data.totalPrice,
            documentType: data.documentType,
            documentNumber: data.documentNumber,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toLocaleDateString('fa-IR')
        };
        this.documents.push(newDoc);
        this.showAlert('سند با موفقیت ثبت شد!', 'success');
    }

    updateDocument(id, data) {
        var index = -1;
        for (var i = 0; i < this.documents.length; i++) {
            if (String(this.documents[i].id) === String(id)) { index = i; break; }
        }
        if (index !== -1) {
            this.documents[index].number = data.number;
            this.documents[index].lunarDate = data.lunarDate;
            this.documents[index].solarDate = data.solarDate;
            this.documents[index].executionType = data.executionType;
            this.documents[index].office = data.office;
            this.documents[index].description = data.description;
            this.documents[index].totalPrice = data.totalPrice;
            this.documents[index].documentType = data.documentType;
            this.documents[index].documentNumber = data.documentNumber;
            this.showAlert('سند با موفقیت ویرایش شد!', 'success');
        }
    }

    showDeleteModal(id) {
        this.pendingDeleteId = String(id);
        if (this.deleteModal) {
            this.deleteModal.style.display = 'flex';
        } else {
            // Fallback برای مرورگرهای قدیمی
            if (confirm('آیا از حذف این سند مطمئن هستید؟')) {
                this.deleteDocument(id);
            }
        }
    }

    cancelDelete() {
        this.pendingDeleteId = null;
        if (this.deleteModal) {
            this.deleteModal.style.display = 'none';
        }
    }

    confirmDelete() {
        if (this.pendingDeleteId) {
            this.deleteDocument(this.pendingDeleteId);
            this.pendingDeleteId = null;
        }
        if (this.deleteModal) {
            this.deleteModal.style.display = 'none';
        }
    }

    deleteDocument(id) {
        var idStr = String(id);
        this.documents = this.documents.filter(function(doc) { return String(doc.id) !== idStr; });
        this.saveDocuments();
        this.applySearchAndFilter();
        this.showAlert('سند با موفقیت حذف شد!', 'success');
        this.updateStatsIfVisible();
    }

    editDocument(id) {
        var idStr = String(id);
        var doc = null;
        for (var i = 0; i < this.documents.length; i++) {
            if (String(this.documents[i].id) === idStr) { doc = this.documents[i]; break; }
        }
        if (!doc) {
            console.error('سند با شناسه ' + id + ' یافت نشد!');
            alert('سند یافت نشد!');
            return;
        }
        this.currentEditId = doc.id;
        if (this.numberInput) this.numberInput.value = doc.number || '';
        if (this.lunarDateInput) this.lunarDateInput.value = (doc.lunarDate && doc.lunarDate !== '-') ? doc.lunarDate : '';
        if (this.solarDateInput) this.solarDateInput.value = (doc.solarDate && doc.solarDate !== '-') ? doc.solarDate : '';
        if (this.executionTypeInput) this.executionTypeInput.value = (doc.executionType && doc.executionType !== '-') ? doc.executionType : '';
        if (this.officeInput) this.officeInput.value = (doc.office && doc.office !== '-') ? doc.office : '';
        if (this.descriptionInput) this.descriptionInput.value = (doc.description && doc.description !== '-') ? doc.description : '';
        if (this.totalPriceInput) this.totalPriceInput.value = (doc.totalPrice !== undefined && doc.totalPrice !== null) ? doc.totalPrice : '';
        if (this.documentTypeInput) this.documentTypeInput.value = (doc.documentType && doc.documentType !== '-') ? doc.documentType : '';
        if (this.documentNumberInput) this.documentNumberInput.value = (doc.documentNumber && doc.documentNumber !== '-') ? doc.documentNumber : '';
        if (this.submitBtn) this.submitBtn.textContent = '✏️ ویرایش سند';
        if (this.cancelBtn) this.cancelBtn.style.display = 'inline-flex';
        if (this.editIdInput) this.editIdInput.value = doc.id;
        if (this.form) {
            this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    clearFilters() {
        if (this.searchInput) this.searchInput.value = '';
        if (this.filterTypeInput) this.filterTypeInput.value = 'all';
        if (this.filterExecutionInput) this.filterExecutionInput.value = 'all';
        this.filteredDocuments = [...this.documents];
        this.renderTable();
        this.updateStatsIfVisible();
        this.showAlert('فیلترها پاک شدند.', 'success');
    }

    applySearchAndFilter() {
        var search = this.searchInput ? (this.searchInput.value || '').trim().toLowerCase() : '';
        var type = this.filterTypeInput ? (this.filterTypeInput.value || '').trim() : 'all';
        var execution = this.filterExecutionInput ? (this.filterExecutionInput.value || '').trim() : 'all';
        var self = this;
        this.filteredDocuments = this.documents.filter(function(doc) {
            var matches = true;
            if (search) {
                var text = [
                    doc.number, doc.lunarDate, doc.solarDate,
                    doc.executionType, doc.office, doc.description,
                    doc.documentType, doc.documentNumber
                ].join(' ').toLowerCase();
                matches = matches && text.indexOf(search) !== -1;
            }
            if (type && type !== 'all') {
                matches = matches && doc.documentType === type;
            }
            if (execution && execution !== 'all') {
                matches = matches && doc.executionType === execution;
            }
            return matches;
        });
        this.renderTable();
        this.updateStatsIfVisible();
    }

    formatPrice(price) {
        var value = parseInt(price) || 0;
        return new Intl.NumberFormat('fa-IR').format(value) + ' افغانی';
    }

    createCell(text) {
        var td = document.createElement('td');
        td.textContent = (text === null || text === undefined || text === '') ? '-' : String(text);
        return td;
    }

    renderTable() {
        var data = this.filteredDocuments || this.documents;

        if (!this.tableBody) {
            console.error('tableBody element not found!');
            return;
        }

        if (!Array.isArray(data) || data.length === 0) {
            this.tableBody.innerHTML = '';
            if (this.emptyState) this.emptyState.style.display = 'block';
            this.updateSummary(data);
            return;
        }

        if (this.emptyState) this.emptyState.style.display = 'none';

        this.tableBody.innerHTML = '';

        for (var i = 0; i < data.length; i++) {
            var doc = data[i];
            var tr = document.createElement('tr');

            tr.appendChild(this.createCell(doc.number));
            tr.appendChild(this.createCell(doc.lunarDate));
            tr.appendChild(this.createCell(doc.solarDate));
            tr.appendChild(this.createCell(doc.executionType));
            tr.appendChild(this.createCell(doc.office));
            tr.appendChild(this.createCell(doc.description));

            var priceTd = document.createElement('td');
            priceTd.textContent = this.formatPrice(doc.totalPrice);
            tr.appendChild(priceTd);

            tr.appendChild(this.createCell(doc.documentType));
            tr.appendChild(this.createCell(doc.documentNumber));

            var actionTd = document.createElement('td');
            actionTd.className = 'actions';

            var editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline';
            editBtn.textContent = '✏️';
            editBtn.title = 'ویرایش';
            editBtn.style.cursor = 'pointer';
            editBtn.style.userSelect = 'none';
            editBtn.setAttribute('onclick', 'editDocumentRow(' + JSON.stringify(String(doc.id)) + ')');

            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'حذف';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.userSelect = 'none';
            deleteBtn.setAttribute('onclick', 'deleteDocumentRow(' + JSON.stringify(String(doc.id)) + ')');

            actionTd.appendChild(editBtn);
            actionTd.appendChild(deleteBtn);
            tr.appendChild(actionTd);

            this.tableBody.appendChild(tr);
        }

        this.updateSummary(data);
    }

    updateSummary(data) {
        var list = data || this.documents;
        if (this.totalCountElement) {
            this.totalCountElement.textContent = new Intl.NumberFormat('fa-IR').format(list.length);
        }
        if (this.totalPriceSummaryElement) {
            var total = 0;
            for (var i = 0; i < list.length; i++) {
                total += parseInt(list[i].totalPrice) || 0;
            }
            this.totalPriceSummaryElement.textContent = this.formatPrice(total);
        }
    }

    resetForm() {
        if (this.form) this.form.reset();
        this.currentEditId = null;
        if (this.editIdInput) this.editIdInput.value = '';
        if (this.submitBtn) this.submitBtn.textContent = '➕ ثبت سند';
        if (this.cancelBtn) this.cancelBtn.style.display = 'none';
        if (this.numberInput) this.numberInput.value = this.getNextNumber();
    }

    toggleStats() {
        if (!this.statsSection) return;
        var isHidden = this.statsSection.style.display === 'none';
        this.statsSection.style.display = isHidden ? 'block' : 'none';
        var btn = document.getElementById('btnToggleStats');
        if (btn) btn.textContent = isHidden ? '📊 پنهان کردن نمودار' : '📊 نمودار';
        if (isHidden) this.updateStats();
    }

    updateStatsIfVisible() {
        if (this.statsSection && this.statsSection.style.display !== 'none') {
            this.updateStats();
        }
    }

    updateStats() {
        var data = this.filteredDocuments || this.documents;
        if (!data.length) return;
        var prices = data.map(function(d) { return parseInt(d.totalPrice) || 0; });
        var total = 0;
        for (var i = 0; i < prices.length; i++) total += prices[i];
        var avg = Math.round(total / prices.length);
        var max = Math.max.apply(null, prices);
        var statTotalCount = document.getElementById('statTotalCount');
        var statTotalPrice = document.getElementById('statTotalPrice');
        var statAvgPrice = document.getElementById('statAvgPrice');
        var statMaxPrice = document.getElementById('statMaxPrice');
        if (statTotalCount) statTotalCount.textContent = new Intl.NumberFormat('fa-IR').format(data.length);
        if (statTotalPrice) statTotalPrice.textContent = this.formatPrice(total);
        if (statAvgPrice) statAvgPrice.textContent = this.formatPrice(avg);
        if (statMaxPrice) statMaxPrice.textContent = this.formatPrice(max);
        this.renderCharts(data);
    }

    renderCharts(data) {
        this.renderChartByExecution(data);
        this.renderChartByType(data);
        this.renderChartTimeline(data);
    }

    destroyChart(key) {
        if (this.charts[key]) {
            this.charts[key].destroy();
            this.charts[key] = null;
        }
    }

    renderChartByExecution(data) {
        this.destroyChart('execution');
        var canvas = document.getElementById('chartByExecution');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var grouped = {};
        data.forEach(function(d) {
            var key = d.executionType || 'نامشخص';
            grouped[key] = (grouped[key] || 0) + (parseInt(d.totalPrice) || 0);
        });
        var labels = Object.keys(grouped);
        var values = Object.values(grouped);
        var colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140'];
        this.charts.execution = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: [{ label: 'مبلغ (افغانی)', data: values, backgroundColor: colors.slice(0, labels.length), borderRadius: 6, borderWidth: 0 }] },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { return new Intl.NumberFormat('fa-IR').format(ctx.raw) + ' افغانی'; } } } },
                scales: { y: { beginAtZero: true, ticks: { callback: function(val) { return new Intl.NumberFormat('fa-IR').format(val); } } } }
            }
        });
    }

    renderChartByType(data) {
        this.destroyChart('type');
        var canvas = document.getElementById('chartByType');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var grouped = {};
        data.forEach(function(d) { grouped[d.documentType || 'نامشخص'] = (grouped[d.documentType || 'نامشخص'] || 0) + 1; });
        var labels = Object.keys(grouped);
        var values = Object.values(grouped);
        var colors = ['#667eea', '#f5576c', '#00f2fe', '#38f9d7', '#fee140', '#fa709a'];
        this.charts.type = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: labels, datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 2, borderColor: '#fff' }] },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 } } },
                    tooltip: { callbacks: { label: function(ctx) { var total = ctx.dataset.data.reduce(function(a, b) { return a + b; }, 0); var pct = ((ctx.raw / total) * 100).toFixed(1); return ctx.label + ': ' + ctx.raw + ' (' + pct + '%)'; } } }
                }
            }
        });
    }

    renderChartTimeline(data) {
        this.destroyChart('timeline');
        var canvas = document.getElementById('chartTimeline');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var sorted = data.slice().sort(function(a, b) {
            return this.parseDate(a.solarDate) - this.parseDate(b.solarDate);
        }.bind(this));
        var labels = sorted.map(function(d) { return d.solarDate || '-'; });
        var values = sorted.map(function(d) { return parseInt(d.totalPrice) || 0; });
        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'مبلغ سند (افغانی)', data: values, borderColor: '#2a5298', backgroundColor: 'rgba(42, 82, 152, 0.1)', fill: true, tension: 0.3, pointBackgroundColor: '#2a5298', pointRadius: 4, pointHoverRadius: 6 }] },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { return new Intl.NumberFormat('fa-IR').format(ctx.raw) + ' افغانی'; } } } },
                scales: { y: { beginAtZero: true, ticks: { callback: function(val) { return new Intl.NumberFormat('fa-IR').format(val); } } } }
            }
        });
    }

    parseDate(str) {
        if (!str || str === '-') return 0;
        var parts = str.replace(/\//g, '-').split('-');
        if (parts.length < 3) return 0;
        var y = parseInt(parts[0], 10) || 0;
        var m = parseInt(parts[1], 10) || 0;
        var d = parseInt(parts[2], 10) || 0;
        return y * 10000 + m * 100 + d;
    }

    printOfficial() {
        var data = this.filteredDocuments || this.documents;
        if (!data.length) { this.showAlert('داده‌ای برای چاپ رسمی وجود ندارد.', 'error'); return; }
        var total = 0;
        for (var i = 0; i < data.length; i++) total += parseInt(data[i].totalPrice) || 0;
        var today = new Date().toLocaleDateString('fa-IR');
        var rows = data.map(function(doc, idx) {
            return '<tr>' +
                '<td>' + (idx + 1) + '</td>' +
                '<td>' + String(doc.number || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.solarDate || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.executionType || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.office || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.description || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + new Intl.NumberFormat('fa-IR').format(parseInt(doc.totalPrice) || 0) + '</td>' +
                '<td>' + String(doc.documentType || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.documentNumber || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
            '</tr>';
        }).join('');

        var printWindow = window.open('', '_blank');
        if (!printWindow) { this.showAlert('پنجره چاپ مسدود شد.', 'error'); return; }

        var fontFamily = this.getHeaderFont();
        var headerLines = this.getHeaderLinesHtml();
        var headerHtml = '';
        for (var hi = 0; hi < headerLines.length; hi++) {
            if (hi === 0) {
                headerHtml += '<h1>' + headerLines[hi] + '</h1>';
            } else {
                headerHtml += '<p class="subtitle">' + headerLines[hi] + '</p>';
            }
        }
        var headerTitle = this.getHeaderLine(1) || 'گزارش رسمی';
        var htmlContent = '<!DOCTYPE html>' +
        '<html lang="fa" dir="rtl">' +
        '<head>' +
        '<meta charset="UTF-8">' +
        '<title>' + headerTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</title>' +
        '<style>' +
        '@page { size: A4; margin: 15mm; }' +
        'body{font-family:' + fontFamily + ',"Segoe UI",Tahoma,"B Nazanin",Arial,sans-serif;direction:rtl;margin:0;padding:0;background:#fff;color:#1a1a1a;font-size:13px;line-height:1.8;}' +
        '.official-print-wrapper{padding:0;position:relative;}' +
        '.official-header{text-align:center;border-bottom:3px double #1e3c72;padding-bottom:15px;margin-bottom:20px;position:relative;min-height:110px;}' +
        '.official-header .logo-left{position:absolute;top:0;right:20px;}' +
        '.official-header .logo-right{position:absolute;top:0;left:20px;}' +
        '.official-header .govt-logo{width:70px;height:70px;border:2px solid #1e3c72;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:1.8rem;margin-bottom:8px;background:#f8f9fa;}' +
        '.official-header h1{font-size:1.4rem;color:#1e3c72;margin:6px 0 4px;font-weight:bold;letter-spacing:0.5px;}' +
        '.official-header .subtitle{font-size:1rem;color:#555;margin:0;}' +
        '.official-header .header-line{width:80%;height:2px;background:linear-gradient(90deg,transparent,#1e3c72,transparent);margin:10px auto 0;}' +
        '.official-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding:0 10px;font-size:0.9rem;color:#333;}' +
        '.official-meta .meta-left{text-align:left;direction:ltr;}' +
        '.official-table{width:100%;border-collapse:collapse;margin:15px 0;font-size:0.85rem;border:1px solid #333;}' +
        '.official-table thead th{background:#e8edf5;color:#1e3c72;border:1px solid #333;padding:10px 8px;font-weight:bold;text-align:center;font-size:0.85rem;}' +
        '.official-table tbody td{border:1px solid #555;padding:8px;text-align:center;vertical-align:middle;}' +
        '.official-table tbody tr:nth-child(even){background:#f8fafc;}' +
        '.official-summary{margin-top:15px;padding:12px 15px;border:1px solid #333;background:#f8f9fa;font-weight:bold;font-size:0.95rem;display:flex;justify-content:space-between;}' +
        '.official-footer{margin-top:30px;border-top:2px solid #1e3c72;padding-top:15px;display:flex;justify-content:space-between;align-items:flex-start;font-size:0.85rem;}' +
        '.official-footer .signatures{display:flex;gap:60px;}' +
        '.official-footer .sign-box{text-align:center;}' +
        '.official-footer .sign-line{width:160px;height:1px;background:#333;margin:8px auto 4px;}' +
        '.official-footer .page-info{text-align:left;direction:ltr;color:#666;font-size:0.8rem;}' +
        '@media print{.official-table{page-break-inside:auto;}.official-table tr{page-break-inside:avoid;page-break-after:auto;}.official-footer{page-break-inside:avoid;}}' +
        '</style>' +
        '</head>' +
        '<body>' +
        '<div class="official-print-wrapper">' +
        '<div class="official-header">' +
            '<div class="logo-left">' + this.getLogoHtml() + '</div>' +
            '<div class="logo-right">' + this.getLogoHtml() + '</div>' +
            headerHtml +
            '<div class="header-line"></div>' +
        '</div>' +
        '<div class="official-meta">' +
            '<div class="meta-right">' +
                '<strong>تاریخ گزارش:</strong> ' + today + ' | ' +
                '<strong>تعداد اسناد:</strong> ' + data.length + ' | ' +
                '<strong>جمع کل:</strong> ' + new Intl.NumberFormat('fa-IR').format(total) + ' افغانی' +
            '</div>' +
        '</div>' +
        '<table class="official-table">' +
        '<thead>' +
        '<tr>' +
            '<th>ردیف</th>' +
            '<th>شماره</th>' +
            '<th>تاریخ شمسی</th>' +
            '<th>نوع اجراآات</th>' +
            '<th>اداره</th>' +
            '<th>تشریحات</th>' +
            '<th>مبلغ (افغانی)</th>' +
            '<th>نوع سند</th>' +
            '<th>شماره سند</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '<div class="official-summary">' +
            '<span>جمع کل مبالغ: ' + new Intl.NumberFormat('fa-IR').format(total) + ' افغانی</span>' +
            '<span>تعداد کل اسناد: ' + data.length + '</span>' +
        '</div>' +
        '<div class="official-footer">' +
            '<div class="signatures">' +
                '<div class="sign-box">' +
                    '<div>تهیه‌کننده گزارش</div>' +
                    '<div class="sign-line"></div>' +
                    '<div>نام و امضا</div>' +
                '</div>' +
                '<div class="sign-box">' +
                    '<div>تأیید کننده</div>' +
                    '<div class="sign-line"></div>' +
                    '<div>نام و امضا</div>' +
                '</div>' +
            '</div>' +
            '<div class="page-info">' +
                'System: Financial Documents Manager v1.0' +
            '</div>' +
        '</div>' +
        '</div>' +
        '<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>' +
        '</body></html>';

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        this.showAlert('پنجره چاپ رسمی باز شد.', 'success');
    }

    printTable() {
        var data = this.filteredDocuments || this.documents;
        if (!data.length) { this.showAlert('داده‌ای برای پرینت وجود ندارد.', 'error'); return; }
        var rows = data.map(function(doc) {
            return '<tr>' +
                '<td>' + String(doc.number || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.lunarDate || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.solarDate || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.executionType || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.office || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.description || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + this.formatPrice(doc.totalPrice) + '</td>' +
                '<td>' + String(doc.documentType || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.documentNumber || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
            '</tr>';
        }.bind(this)).join('');
        var total = 0;
        for (var i = 0; i < data.length; i++) total += parseInt(data[i].totalPrice) || 0;
        var printWindow = window.open('', '_blank');
        if (!printWindow) { this.showAlert('پنجره پرینت مسدود شد.', 'error'); return; }
        var headerLinesTable = this.getHeaderLinesHtml();
        var headerHtmlTable = '';
        for (var ti = 0; ti < headerLinesTable.length; ti++) {
            if (ti === 0) {
                headerHtmlTable += '<h2>' + headerLinesTable[ti] + '</h2>';
            } else {
                headerHtmlTable += '<p style="text-align:center;font-size:0.85rem;color:#555;margin-bottom:4px;">' + headerLinesTable[ti] + '</p>';
            }
        }
        printWindow.document.write(
            '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>پرینت اسناد مالی</title>' +
            '<style>body{font-family:Calibri,Segoe UI,Tahoma,Arial;direction:rtl;padding:20px;}h2{text-align:center;margin-bottom:15px;font-family:Calibri,Segoe UI,Tahoma,Arial;}table{width:100%;border-collapse:collapse;margin-top:10px;}th,td{border:1px solid #333;padding:8px;text-align:center;font-size:0.9rem;}th{background:#1e3c72;color:#fff;}.summary{margin-top:12px;font-weight:bold;text-align:left;}</style>' +
            '</head><body>' + headerHtmlTable + '<table><thead><tr><th>شماره</th><th>تاریخ قمری</th><th>تاریخ شمسی</th><th>نوع اجراآت</th><th>اداره</th><th>تشریحات</th><th>قیمت کل</th><th>نوع سند</th><th>شماره سند</th></tr></thead><tbody>' + rows + '</tbody></table>' +
            '<div class="summary">تعداد: ' + data.length + ' | جمع کل: ' + this.formatPrice(total) + '</div>' +
            '<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script></body></html>'
        );
        printWindow.document.close();
    }

    exportToExcel() {
        var data = this.filteredDocuments || this.documents;
        if (!data.length) { this.showAlert('داده‌ای برای خروجی اکسل وجود ندارد.', 'error'); return; }
        var rows = data.map(function(doc) {
            return '<tr>' +
                '<td>' + String(doc.number || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.lunarDate || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.solarDate || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.executionType || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.office || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.description || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + (parseInt(doc.totalPrice) || 0) + '</td>' +
                '<td>' + String(doc.documentType || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
                '<td>' + String(doc.documentNumber || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>' +
            '</tr>';
        }).join('');
        var total = 0;
        for (var i = 0; i < data.length; i++) total += parseInt(data[i].totalPrice) || 0;
        var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="UTF-8"><style>table{border-collapse:collapse;}th,td{border:1px solid #ccc;padding:6px;text-align:center;}th{background:#e0e0e0;}</style></head><body><table><thead><tr><th>شماره</th><th>تاریخ قمری</th><th>تاریخ شمسی</th><th>نوع اجراآت</th><th>اداره</th><th>تشریحات</th><th>مبلغ کل (افغانی)</th><th>نوع سند</th><th>شماره سند</th></tr></thead><tbody>' + rows + '<tr><td colspan="6" style="font-weight:bold;">جمع کل</td><td style="font-weight:bold;">' + total + '</td><td colspan="2"></td></tr></tbody></table></body></html>';
        var blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'FinancialDocuments_' + new Date().toISOString().slice(0, 10) + '.xls';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        this.showAlert('خروجی اکسل با موفقیت دانلود شد!', 'success');
    }

    exportToPDF() {
        var data = this.filteredDocuments || this.documents;
        if (!data.length) { this.showAlert('داده‌ای برای خروجی PDF وجود ندارد.', 'error'); return; }
        var jsPDFLib = window.jspdf || window.jsPDF;
        if (!jsPDFLib || !jsPDFLib.jsPDF) { this.showAlert('کتابخانه PDF هنوز بارگذاری نشده است.', 'error'); return; }
        var jsPDF = jsPDFLib.jsPDF;
        var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        var total = 0;
        for (var i = 0; i < data.length; i++) total += parseInt(data[i].totalPrice) || 0;
        doc.setFont('helvetica'); doc.setFontSize(16);
        doc.text(this.getHeaderLine1(), 14, 15);
        var body = data.map(function(d) {
            return [d.number ? d.number.toString() : '', d.lunarDate || '', d.solarDate || '', d.executionType || '', d.office || '', d.description || '', (parseInt(d.totalPrice) || 0).toString(), d.documentType || '', d.documentNumber || ''];
        });
        body.push(['Total', '', '', '', '', '', total.toString(), '', '']);
        if (doc.autoTable) {
            doc.autoTable({ head: [['Number', 'Lunar Date', 'Solar Date', 'Execution', 'Office', 'Description', 'Total Price (AFN)', 'Doc Type', 'Doc Number']], body: body, startY: 22, styles: { fontSize: 9, halign: 'center', font: 'helvetica' }, headStyles: { fillColor: [30, 60, 114], textColor: 255 }, alternateRowStyles: { fillColor: [245, 247, 250] } });
        } else {
            var y = 25; doc.setFontSize(10);
            data.forEach(function(d, i) { doc.text((i + 1) + '. ' + d.number + ' | ' + d.solarDate + ' | ' + (d.totalPrice || 0) + ' AFN', 14, y); y += 7; });
            doc.text('Total: ' + total + ' AFN', 14, y + 5);
        }
        doc.save('FinancialDocuments_' + new Date().toISOString().slice(0, 10) + '.pdf');
        this.showAlert('خروجی PDF با موفقیت دانلود شد!', 'success');
    }

    // پشتیبان‌گیری از داده‌ها
    backupData() {
        var data = {
            documents: this.documents,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'FinancialDocuments_Backup_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showAlert('فایل پشتیبان با موفقیت دانلود شد!', 'success');
    }

    // بازگردانی داده‌ها از فایل JSON
    restoreData(input) {
        var self = this;
        var file = input.files ? input.files[0] : null;
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (!data || !Array.isArray(data.documents)) {
                    self.showAlert('فایل نامعتبر است.', 'error');
                    return;
                }
                // اعتبارسنجی ساده
                var validDocs = data.documents.filter(function(doc) {
                    return doc && typeof doc === 'object' && doc.id !== undefined;
                });
                if (!validDocs.length) {
                    self.showAlert('هیچ سند معتبری در فایل یافت نشد.', 'error');
                    return;
                }
                self.documents = validDocs;
                self.ensureDocumentIds();
                self.saveDocuments();
                self.filteredDocuments = [...self.documents];
                self.renderTable();
                self.updateStatsIfVisible();
                self.showAlert(validDocs.length + ' سند با موفقیت بازگردانی شد!', 'success');
            } catch (err) {
                console.error(err);
                self.showAlert('خطا در خواندن فایل.', 'error');
            }
        };
        reader.onerror = function() {
            self.showAlert('خطا در خواندن فایل.', 'error');
        };
        reader.readAsText(file);
        // پاک کردن input برای امکان انتخاب مجدد همان فایل
        input.value = '';
    }

    // حذف همه داده‌ها
    clearAllData() {
        if (!confirm('آیا مطمئن هستید که می‌خواهید همه اسناد را حذف کنید؟ این عملیات قابل بازگشت نیست!')) return;
        this.documents = [];
        this.filteredDocuments = [];
        this.saveDocuments();
        this.renderTable();
        this.updateStatsIfVisible();
        this.showAlert('همه داده‌ها حذف شدند.', 'success');
    }

    closeSettingsModal() {
        var modal = document.getElementById('logoSettingsModal');
        if (modal) modal.style.display = 'none';
    }

    toggleSettings() {
        var modal = document.getElementById('logoSettingsModal');
        if (!modal) return;
        var isHidden = modal.style.display === 'none';
        modal.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
            this.loadLogoPreview();
            this.loadHeaderSettings();
        }
    }

    closeSettingsModal() {
        var modal = document.getElementById('logoSettingsModal');
        if (modal) modal.style.display = 'none';
    }

    handleLogoUpload(input) {
        var self = this;
        var file = input.files ? input.files[0] : null;
        if (!file) return;
        if (!file.type.match('image.*')) {
            this.showAlert('لطفاً یک فایل تصویر انتخاب کنید.', 'error');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            this.showAlert('حجم تصویر باید کمتر از ۲ مگابایت باشد.', 'error');
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                localStorage.setItem('officialLogo', e.target.result);
                self.showAlert('لوگو با موفقیت ذخیره شد!', 'success');
                self.loadLogoPreview();
            } catch (err) {
                self.showAlert('خطا در ذخیره لوگو. حجم ممکن است زیاد باشد.', 'error');
            }
        };
        reader.onerror = function() {
            self.showAlert('خطا در خواندن فایل تصویر.', 'error');
        };
        reader.readAsDataURL(file);
        input.value = '';
    }

    loadLogoPreview() {
        var logoData = localStorage.getItem('officialLogo');
        var previewBox = document.getElementById('logoPreviewBox');
        var previewImg = document.getElementById('logoPreviewImg');
        if (!previewBox || !previewImg) return;
        if (logoData) {
            previewImg.src = logoData;
            previewBox.style.display = 'block';
        } else {
            previewBox.style.display = 'none';
            previewImg.src = '';
        }
    }

    removeLogo() {
        localStorage.removeItem('officialLogo');
        this.loadLogoPreview();
        this.showAlert('لوگو حذف شد.', 'success');
    }

    getLogoHtml() {
        var logoData = localStorage.getItem('officialLogo');
        if (logoData) {
            return '<img src="' + logoData + '" alt="Logo" style="width:70px;height:70px;border-radius:50%;border:2px solid #1e3c72;object-fit:contain;background:#fff;display:inline-block;">';
        }
        return '<div class="govt-logo">📋</div>';
    }

    // ─── Header 6-Line Settings ───
    saveHeaderLines() {
        for (var i = 1; i <= 6; i++) {
            var input = document.getElementById('headerLine' + i);
            if (input) localStorage.setItem('headerLine' + i, input.value.trim());
        }
        this.showAlert('تنظیمات سربرگ ذخیره شد.', 'success');
    }

    loadHeaderSettings() {
        for (var i = 1; i <= 6; i++) {
            var input = document.getElementById('headerLine' + i);
            var saved = localStorage.getItem('headerLine' + i);
            if (input && saved !== null) input.value = saved;
        }
        this.loadExtraFields();
    }

    saveExtraFields() {
        for (var i = 1; i <= 6; i++) {
            var input = document.getElementById('extraField' + i);
            if (input) localStorage.setItem('extraField' + i, input.value.trim());
        }
        this.showAlert('فیلدهای سفارشی ذخیره شد.', 'success');
    }

    loadExtraFields() {
        for (var i = 1; i <= 6; i++) {
            var input = document.getElementById('extraField' + i);
            var saved = localStorage.getItem('extraField' + i);
            if (input && saved !== null) input.value = saved;
        }
    }

    getExtraField(n) {
        var val = localStorage.getItem('extraField' + n);
        return val || '';
    }

    resetHeaderSettings() {
        for (var i = 1; i <= 6; i++) {
            localStorage.removeItem('headerLine' + i);
            var input = document.getElementById('headerLine' + i);
            if (input) input.value = '';
            localStorage.removeItem('extraField' + i);
            var extraInput = document.getElementById('extraField' + i);
            if (extraInput) extraInput.value = '';
        }
        localStorage.removeItem('officialLogo');
        this.loadLogoPreview();
        this.showAlert('تنظیمات به پیش‌فرض بازنشانی شد.', 'success');
    }

    updateHeaderDisplay() {
        var titleEl = document.querySelector('header h1');
        var subtitleEl = document.querySelector('header .subtitle');
        if (titleEl) titleEl.textContent = '📋 ' + this.getHeaderLine(1);
        if (subtitleEl) subtitleEl.textContent = this.getHeaderLine(2);
    }

    getHeaderLine(n) {
        var defaults = [
            'سیستم مدیریت اسناد مالی',
            'گزارش رسمی فهرست اسناد مالی و اجراآات',
            '', '', '', ''
        ];
        var val = localStorage.getItem('headerLine' + n);
        return (val !== null && val !== '') ? val : defaults[n - 1];
    }

    getHeaderFont() {
        return 'Calibri';
    }

    getHeaderLinesHtml() {
        var lines = [];
        for (var i = 1; i <= 6; i++) {
            var line = this.getHeaderLine(i);
            if (line) lines.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        }
        return lines;
    }

    // ─── Report Builder ───
    openReportModal() {
        var modal = document.getElementById('reportModal');
        if (modal) modal.style.display = 'flex';
    }

    closeReportModal() {
        var modal = document.getElementById('reportModal');
        if (modal) modal.style.display = 'none';
    }

    resetReportFilters() {
        document.getElementById('reportFromDate').value = '';
        document.getElementById('reportToDate').value = '';
        document.getElementById('reportFilterType').value = 'all';
        document.getElementById('reportFilterExecution').value = 'all';
        var checkboxes = ['chkNumber', 'chkLunarDate', 'chkSolarDate', 'chkExecutionType', 'chkOffice', 'chkDescription', 'chkTotalPrice', 'chkDocumentType', 'chkDocumentNumber'];
        checkboxes.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.checked = true;
        });
        document.querySelector('input[name="reportOutputType"][value="print"]').checked = true;
    }

    normalizeSolarDate(dateStr) {
        if (!dateStr || dateStr === '-') return '';
        return dateStr.replace(/[^0-9]/g, '');
    }

    filterByDateRange(data, from, to) {
        if (!from && !to) return data;
        var self = this;
        var fromNorm = this.normalizeSolarDate(from);
        var toNorm = this.normalizeSolarDate(to);
        return data.filter(function(doc) {
            var docDate = self.normalizeSolarDate(doc.solarDate);
            if (!docDate) return false;
            if (fromNorm && docDate < fromNorm) return false;
            if (toNorm && docDate > toNorm) return false;
            return true;
        });
    }

    getSelectedReportFields() {
        var fields = [];
        if (document.getElementById('chkNumber').checked) fields.push({ key: 'number', label: 'شماره' });
        if (document.getElementById('chkLunarDate').checked) fields.push({ key: 'lunarDate', label: 'تاریخ قمری' });
        if (document.getElementById('chkSolarDate').checked) fields.push({ key: 'solarDate', label: 'تاریخ شمسی' });
        if (document.getElementById('chkExecutionType').checked) fields.push({ key: 'executionType', label: 'نوع اجراآات' });
        if (document.getElementById('chkOffice').checked) fields.push({ key: 'office', label: 'اداره' });
        if (document.getElementById('chkDescription').checked) fields.push({ key: 'description', label: 'تشریحات' });
        if (document.getElementById('chkTotalPrice').checked) fields.push({ key: 'totalPrice', label: 'قیمت کل (افغانی)' });
        if (document.getElementById('chkDocumentType').checked) fields.push({ key: 'documentType', label: 'نوع سند' });
        if (document.getElementById('chkDocumentNumber').checked) fields.push({ key: 'documentNumber', label: 'شماره سند' });
        return fields;
    }

    generateReport() {
        var from = document.getElementById('reportFromDate').value.trim();
        var to = document.getElementById('reportToDate').value.trim();
        var typeFilter = document.getElementById('reportFilterType').value;
        var execFilter = document.getElementById('reportFilterExecution').value;
        var fields = this.getSelectedReportFields();

        if (fields.length === 0) {
            this.showAlert('حداقل یک فیلد را انتخاب کنید.', 'error');
            return;
        }

        var data = [...this.documents];
        if (typeFilter !== 'all') {
            data = data.filter(function(d) { return d.documentType === typeFilter; });
        }
        if (execFilter !== 'all') {
            data = data.filter(function(d) { return d.executionType === execFilter; });
        }
        data = this.filterByDateRange(data, from, to);

        if (!data.length) {
            this.showAlert('داده‌ای برای گزارش یافت نشد.', 'error');
            return;
        }

        var outputType = document.querySelector('input[name="reportOutputType"]:checked').value;
        if (outputType === 'excel') {
            this.createReportExcel(data, fields);
        } else if (outputType === 'pdf') {
            this.createReportPdf(data, fields);
        } else {
            this.createReportHtml(data, fields, from, to);
        }
        this.closeReportModal();
    }

    createReportHtml(data, fields, from, to) {
        var headerLines = this.getHeaderLinesHtml();
        var logoHtml = this.getLogoHtml();
        var ths = fields.map(function(f) { return '<th>' + f.label + '</th>'; }).join('');
        var rows = data.map(function(doc) {
            var tds = fields.map(function(f) {
                var val = doc[f.key];
                if (f.key === 'totalPrice') {
                    val = (parseInt(val) || 0).toLocaleString('fa-IR') + ' افغانی';
                } else {
                    val = (val === null || val === undefined || val === '' || val === '-') ? '-' : String(val);
                }
                return '<td>' + val + '</td>';
            }).join('');
            return '<tr>' + tds + '</tr>';
        }).join('');

        var totalPrice = 0;
        for (var i = 0; i < data.length; i++) totalPrice += parseInt(data[i].totalPrice) || 0;

        var titleText = 'گزارش اسناد مالی';
        if (from || to) {
            titleText += ' (';
            if (from) titleText += 'از ' + from;
            if (from && to) titleText += ' ';
            if (to) titleText += 'تا ' + to;
            titleText += ')';
        }

        var totalRow = '';
        var totalPriceIdx = -1;
        for (var j = 0; j < fields.length; j++) {
            if (fields[j].key === 'totalPrice') { totalPriceIdx = j; break; }
        }
        if (totalPriceIdx !== -1) {
            totalRow = '<tr style="font-weight:bold;background:#f5f7fa;"><td colspan="' + totalPriceIdx + '" style="text-align:left;">جمع کل:</td><td>' + totalPrice.toLocaleString('fa-IR') + ' افغانی</td></tr>';
        }

        var html = '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>گزارش اسناد مالی</title><style>body{font-family:Calibri,Segoe UI,Tahoma,sans-serif;margin:20px;background:#fff;color:#222;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #333;padding:8px;text-align:center;}th{background:#1e3c72;color:#fff;font-size:0.95rem;}td{font-size:0.9rem;}tr:nth-child(even){background:#f5f7fa;}.header{text-align:center;margin-bottom:18px;}.header h1{font-size:1.1rem;margin:4px 0;}.header h2{font-size:1rem;color:#555;margin:2px 0;}.logo{max-width:70px;max-height:70px;border-radius:50%;border:2px solid #1e3c72;}.meta{text-align:center;font-size:0.85rem;color:#444;margin-bottom:10px;}.summary{text-align:center;font-size:1rem;font-weight:bold;color:#1e3c72;margin:10px 0;}.page-info{font-size:0.75rem;color:#555;text-align:center;margin-top:4px;}</style></head><body>' +
            '<div class="header">' + logoHtml + '<div>' + headerLines.map(function(l) { return '<h1>' + l + '</h1>'; }).join('') + '</div></div>' +
            '<div class="meta">تاریخ گزارش: ' + new Date().toLocaleDateString('fa-IR') + '</div>' +
            '<div class="summary">' + titleText + ' | تعداد: ' + data.length.toLocaleString('fa-IR') + ' سند</div>' +
            '<table><thead><tr>' + ths + '</tr></thead><tbody>' + rows + totalRow + '</tbody></table>' +
            '<div class="page-info">گزارش توسط سیستم مدیریت اسناد مالی تولید شده است.</div>' +
            '</body></html>';

        var win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
        } else {
            this.showAlert('پنجره گزارش بلاک شد. لطفاً popup را مجاز کنید.', 'error');
        }
    }

    createReportExcel(data, fields) {
        var ths = fields.map(function(f) { return '<th>' + f.label + '</th>'; }).join('');
        var rows = data.map(function(doc) {
            var tds = fields.map(function(f) {
                var val = doc[f.key];
                if (f.key === 'totalPrice') val = (parseInt(val) || 0).toString();
                else val = (val === null || val === undefined || val === '' || val === '-') ? '-' : String(val);
                return '<td>' + val.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>';
            }).join('');
            return '<tr>' + tds + '</tr>';
        }).join('');
        var totalPrice = 0;
        for (var i = 0; i < data.length; i++) totalPrice += parseInt(data[i].totalPrice) || 0;
        var totalRow = '<tr><td colspan="' + (fields.length - 1) + '" style="font-weight:bold;">جمع کل</td><td>' + totalPrice + '</td></tr>';

        var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="UTF-8"><style>table{border-collapse:collapse;}th,td{border:1px solid #ccc;padding:6px;text-align:center;}th{background:#e0e0e0;}</style></head><body><table><thead><tr>' + ths + '</tr></thead><tbody>' + rows + totalRow + '</tbody></table></body></html>';
        var blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Report_' + new Date().toISOString().slice(0, 10) + '.xls';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        this.showAlert('گزارش اکسل با موفقیت دانلود شد!', 'success');
    }

    createReportPdf(data, fields) {
        var jsPDFLib = window.jspdf || window.jsPDF;
        if (!jsPDFLib || !jsPDFLib.jsPDF) { this.showAlert('کتابخانه PDF هنوز بارگذاری نشده است.', 'error'); return; }
        var jsPDF = jsPDFLib.jsPDF;
        var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.setFont('helvetica'); doc.setFontSize(14);
        doc.text('Report', 14, 15);
        var head = [fields.map(function(f) { return f.label; })];
        var body = data.map(function(d) {
            return fields.map(function(f) {
                if (f.key === 'totalPrice') return (parseInt(d[f.key]) || 0).toString();
                return (d[f.key] === null || d[f.key] === undefined || d[f.key] === '' || d[f.key] === '-') ? '-' : String(d[f.key]);
            });
        });
        var totalPrice = 0;
        for (var i = 0; i < data.length; i++) totalPrice += parseInt(data[i].totalPrice) || 0;
        body.push(['Total', '', '', '', '', '', totalPrice.toString(), '', '']);
        if (doc.autoTable) {
            doc.autoTable({ head: head, body: body, startY: 22, styles: { fontSize: 9, halign: 'center', font: 'helvetica' }, headStyles: { fillColor: [30, 60, 114], textColor: 255 }, alternateRowStyles: { fillColor: [245, 247, 250] } });
        } else {
            var y = 25; doc.setFontSize(10);
            data.forEach(function(d, i) { doc.text((i + 1) + '. ' + d.number + ' | ' + d.solarDate + ' | ' + (d.totalPrice || 0) + ' AFN', 14, y); y += 7; });
            doc.text('Total: ' + totalPrice + ' AFN', 14, y + 5);
        }
        doc.save('Report_' + new Date().toISOString().slice(0, 10) + '.pdf');
        this.showAlert('گزارش PDF با موفقیت دانلود شد!', 'success');
    }

    showAlert(message, type) {
        var alertDiv = document.createElement('div');
        alertDiv.textContent = message;
        alertDiv.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:14px 32px;border-radius:8px;color:white;font-weight:bold;z-index:9999;background:' + (type === 'success' ? '#27ae60' : '#e74c3c') + ';box-shadow:0 4px 15px rgba(0,0,0,0.2);font-size:0.95rem;';
        document.body.appendChild(alertDiv);
        setTimeout(function() { alertDiv.remove(); }, 3000);
    }
}

window.docManager = null;
document.addEventListener('DOMContentLoaded', function() {
    window.docManager = new DocumentManager();
    console.log('DocumentManager initialized. docManager =', window.docManager);
});