/* ===== Shared Data & Utilities ===== */

/* ===== نسخه برنامه — تغییر این مقدار باعث پاک‌سازی کش می‌شود ===== */
var APP_VERSION = 'v20-20260912';

/* ===== بررسی نسخه و پاک‌سازی کش ===== */
(function(){
    var stored = localStorage.getItem('appVersion');
    if (stored !== APP_VERSION) {
        console.log('[نسخه] نسخه جدید تشخیص داده شد:', APP_VERSION, '(قبلی:', stored, ')');
        localStorage.setItem('appVersion', APP_VERSION);
        // نرمال‌سازی شناسه‌های اسناد — تبدیل همه به رشته
        try {
            var docs = JSON.parse(localStorage.getItem('documents') || '[]');
            var changed = false;
            docs.forEach(function(d){
                if (d && d.id !== undefined && typeof d.id !== 'string') {
                    d.id = String(d.id);
                    changed = true;
                }
            });
            if (changed) {
                localStorage.setItem('documents', JSON.stringify(docs));
                console.log('[نسخه] شناسه‌های اسناد نرمال‌سازی شدند');
            }
        } catch(e) { console.error('[نسخه] خطا در نرمال‌سازی:', e); }
        // بارگذاری مجدد صفحه برای پاک‌سازی کش مرورگر
        // فقط اگر از صفحه دیگری آمده باشد (نه رفرش مداوم)
        if (stored !== null && !sessionStorage.getItem('versionReload')) {
            sessionStorage.setItem('versionReload', '1');
            location.reload(true);
        }
    }
    sessionStorage.removeItem('versionReload');
})();

/* ===== Auth ===== */
function checkLogin() {
    var loggedIn = localStorage.getItem('loggedIn');
    if (!loggedIn && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
}
function doLogin(user, pass) {
    var storedUser = localStorage.getItem('authUser') || 'admin';
    var storedPass = localStorage.getItem('authPass') || 'admin';
    if (user === storedUser && pass === storedPass) {
        localStorage.setItem('loggedIn', 'true');
        return true;
    }
    return false;
}
function doLogout() {
    localStorage.removeItem('loggedIn');
    window.location.href = 'login.html';
}
function isLoggedIn() { return !!localStorage.getItem('loggedIn'); }

/* ===== Document Storage — uses single key 'documents' ===== */
var STORAGE_KEY = 'documents';

function getDocs() {
    try { 
        var d = localStorage.getItem(STORAGE_KEY); 
        var parsed = d ? JSON.parse(d) : []; 
        // اطمینان از اینکه همه شناسه‌ها رشته هستند
        if (Array.isArray(parsed)) {
            parsed.forEach(function(doc){
                if (doc && doc.id !== undefined && typeof doc.id !== 'string') {
                    doc.id = String(doc.id);
                }
            });
        }
        // اصلاح خودکار شناسه‌های تکراری — تخصیص شناسه جدید یکتا
        if (Array.isArray(parsed) && parsed.length > 0) {
            var seenIds = {};
            var duplicateFound = false;
            parsed.forEach(function(doc){
                if (doc && doc.id !== undefined) {
                    var idStr = String(doc.id);
                    if (seenIds[idStr]) {
                        // شناسه تکراری یافت شد — شناسه جدید یکتا تخصیص بده
                        var newId = String(Date.now()) + String(Math.floor(Math.random() * 10000));
                        console.warn('[اصلاح] شناسه تکراری ' + idStr + ' شناسه جدید ' + newId + ' (سند شماره ' + (doc.number || '?') + ')');
                        doc.id = newId;
                        duplicateFound = true;
                    } else {
                        seenIds[idStr] = true;
                    }
                }
            });
            if (duplicateFound) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                console.warn('[اصلاح] شناسه‌های تکراری اصلاح شدند و ذخیره شدند');
            }
        }
        return parsed;
    } catch(e) { return []; }
}

function saveDocs(data) { 
    // اطمینان از اینکه همه شناسه‌ها رشته هستند قبل از ذخیره
    if (Array.isArray(data)) {
        data.forEach(function(d){
            if (d && d.id !== undefined && typeof d.id !== 'string') {
                d.id = String(d.id);
            }
        });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); 
}

/* مهاجرت: افزودن createdAt به اسناد قدیمی */
function migrateDocs() {
    var docs = getDocs();
    var changed = false;
    docs.forEach(function(d) {
        if (!d.createdAt) {
            var ts = parseInt(d.id);
            if (ts > 1000000000000) {
                d.createdAt = new Date(ts).toISOString();
            } else {
                var num = parseInt(d.number) || parseInt(d.id) || 1;
                var base = new Date('2024-01-01T08:00:00Z').getTime();
                d.createdAt = new Date(base + (num - 1) * 30 * 86400000).toISOString();
            }
            changed = true;
        }
    });
    if (changed) saveDocs(docs);
}

function getNextId() {
    var docs = getDocs();
    if (!docs.length) return 1;
    var max = 0;
    docs.forEach(function(d){
        var n = parseInt(d.id);
        if (!isNaN(n) && n > max) max = n;
    });
    return max + 1;
}

function getLogo1() { return localStorage.getItem('logo1') || localStorage.getItem('logo') || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0Ij48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMCIgZmlsbD0iIzFlM2M3MiIvPjx0ZXh0IHg9IjMyIiB5PSIzOSIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1mYW1pbHk9IkNhbGlicmkiPuKcpjwvdGV4dD48L3N2Zz4='; }
function getLogo2() { return localStorage.getItem('logo2') || ''; }

function getHeaderLine(n) {
    var defs = ['سیستم مدیریت اسناد مالی', 'گزارش رسمی فهرست اسناد مالی و اجراآات', '', '', '', ''];
    var v = localStorage.getItem('headerLine' + n);
    return (v !== null && v !== '') ? v : defs[n-1];
}

function getHeaderFont() { return 'Calibri'; }

function getHeaderLines() {
    var lines = [];
    for (var i = 1; i <= 6; i++) { var l = getHeaderLine(i); if (l) lines.push(l); }
    return lines;
}

function escapeHtml(s) { return String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

function fmtNumber(n) { return (parseInt(n)||0).toLocaleString('fa-IR'); }

function fmtDate(d) { return d || '-'; }

function showAlert(msg, type) {
    var a = document.createElement('div');
    a.textContent = msg;
    a.className = 'alert alert-' + (type||'success');
    document.body.appendChild(a);
    setTimeout(function(){ a.remove(); }, 3000);
}

function normalizeSolarDate(d) { return (!d || d === '-') ? '' : d.replace(/[^0-9]/g,''); }

function filterByDateRange(data, from, to) {
    if (!from && !to) return data;
    var fn = normalizeSolarDate(from), tn = normalizeSolarDate(to);
    return data.filter(function(doc){
        var d = normalizeSolarDate(doc.solarDate);
        if (!d) return false;
        if (fn && d < fn) return false;
        if (tn && d > tn) return false;
        return true;
    });
}

function renderHeader() {
    var h = document.getElementById('headerBar');
    if (!h) return;
    var logo1 = getLogo1();
    var logo2 = getLogo2();
    var lines = getHeaderLines();
    var logo1Html = '<img src="'+logo1+'" class="header-logo" alt="Logo" onerror="this.style.display=\'none\'">';
    var logo2Html = logo2 ? '<img src="'+logo2+'" class="header-logo" alt="Logo2" onerror="this.style.display=\'none\'">' : '';
    var logoutBtn = isLoggedIn() ? '<button class="btn btn-sm btn-primary" onclick="doLogout()" style="margin-right:10px">🔓 خروج</button>' : '';
    h.innerHTML = '<div style="display:flex;align-items:center;gap:10px">' + logo1Html + logo2Html + '</div>' +
        '<div class="header-title">' + (lines[0]||'سیستم مدیریت اسناد مالی') + (lines[1]?'<span>'+lines[1]+'</span>':'') + '</div>' +
        '<div style="display:flex;align-items:center;flex-shrink:0">' + logoutBtn + '</div>';
}

function renderNav(current) {
    var n = document.getElementById('mainNav');
    if (!n) return;
    var items = [
        {id:'dashboard', url:'index.html', icon:'📊', label:'داشبورد'},
        {id:'documents', url:'documents.html', icon:'📋', label:'اسناد'},
        {id:'reports', url:'reports.html', icon:'📈', label:'گزارشات'},
        {id:'settings', url:'settings.html', icon:'⚙️', label:'تنظیمات'}
    ];
    n.innerHTML = items.map(function(it){
        var cls = it.id === current ? 'active' : '';
        return '<a href="'+it.url+'" class="'+cls+'">'+it.icon+' '+it.label+'</a>';
    }).join('');
}

function redirectIfNotLogged() {
    if (!isLoggedIn() && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

function totalValue() { return getDocs().reduce(function(s,d){ return s + (parseInt(d.totalPrice)||0); }, 0); }

function countBy(key) {
    var counts = {}, docs = getDocs();
    docs.forEach(function(d){ var v = d[key]||'-'; counts[v] = (counts[v]||0) + 1; });
    return counts;
}

function getDocsSorted() {
    var d = getDocs();
    d.sort(function(a,b){
        var ta = a.createdAt || '';
        var tb = b.createdAt || '';
        if (ta && tb) return tb.localeCompare(ta);
        var na = parseInt(a.id) || 0;
        var nb = parseInt(b.id) || 0;
        return nb - na;
    });
    return d;
}

function getExecutionTypes() { return ['معاینه', 'خریداری', 'ارزیابی', 'آفرگشایی']; }
function getDocumentTypes() { return ['فاکتور', 'م-7', 'هیچ کدام']; }
function getNextDocNumber() {
    var docs = getDocs();
    if (!docs.length) return 1;
    var maxNum = 0;
    docs.forEach(function(d){
        var n = parseInt(d.number);
        if (!isNaN(n) && n > maxNum) maxNum = n;
    });
    return maxNum + 1;
}
function getOffices() {
    var offices = {};
    getDocs().forEach(function(d){ if (d.office) offices[d.office] = true; });
    return Object.keys(offices);
}

function getFilteredDocs(type, exec, keyword) {
    var docs = getDocs();
    if (type && type !== 'all') docs = docs.filter(function(d){ return d.documentType === type; });
    if (exec && exec !== 'all') docs = docs.filter(function(d){ return d.executionType === exec; });
    if (keyword) {
        var k = keyword.toLowerCase().trim();
        docs = docs.filter(function(d){
            return (d.number||'').toLowerCase().includes(k) ||
                   (d.lunarDate||'').toLowerCase().includes(k) ||
                   (d.solarDate||'').toLowerCase().includes(k) ||
                   (d.executionType||'').toLowerCase().includes(k) ||
                   (d.office||'').toLowerCase().includes(k) ||
                   (d.description||'').toLowerCase().includes(k) ||
                   (d.totalPrice||'').toString().includes(k) ||
                   (d.documentType||'').toLowerCase().includes(k) ||
                   (d.documentNumber||'').toLowerCase().includes(k);
        });
    }
    docs.sort(function(a,b){
        var ta = a.createdAt || '';
        var tb = b.createdAt || '';
        if (ta && tb) return tb.localeCompare(ta);
        return (parseInt(b.id)||0) - (parseInt(a.id)||0);
    });
    return docs;
}

function getDocById(id) {
    var idStr = String(id);
    var docs = getDocs();
    for (var i = 0; i < docs.length; i++) {
        if (String(docs[i].id) === idStr) return docs[i];
    }
    return null;
}

/* جستجوی سند با شماره — number همیشه یکتا و قابل مشاهده است */
function getDocByNumber(num) {
    var numStr = String(num);
    var docs = getDocs();
    for (var i = 0; i < docs.length; i++) {
        if (String(docs[i].number) === numStr) return docs[i];
    }
    return null;
}

function deleteDoc(id) { 
    var idStr = String(id);
    var d = getDocs().filter(function(x){ return String(x.id) !== idStr; }); 
    saveDocs(d); 
}

function upsertDoc(doc) {
    // اطمینان از شناسه رشته‌ای
    doc.id = String(doc.id);
    var docs = getDocs();
    var idx = -1;
    for (var i = 0; i < docs.length; i++) {
        if (String(docs[i].id) === doc.id) { idx = i; break; }
    }
    if (idx >= 0) {
        if (!doc.createdAt) doc.createdAt = docs[idx].createdAt;
        docs[idx] = doc;
    } else {
        if (!doc.id) doc.id = String(getNextId());
        if (!doc.createdAt) doc.createdAt = new Date().toISOString();
        docs.push(doc);
    }
    saveDocs(docs);
}

function loadChartLib(cb) {
    if (window.Chart) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = cb;
    document.head.appendChild(s);
}

function generateSampleData() {
    var data = [
        {id:'1',number:'1',lunarDate:'1445/01/15',solarDate:'1403/01/10',executionType:'خریداری',office:'ریس اداره',description:'خرید مواد خام برای پروژه ساختمان',totalPrice:1250000,documentType:'فاکتور',documentNumber:'1001',createdAt:'2024-03-10T08:00:00.000Z'},
        {id:'2',number:'2',lunarDate:'1445/02/20',solarDate:'1403/02/15',executionType:'معاینه',office:'معاونت اداری',description:'تحویل‌گیری تجهیزات اداری',totalPrice:850000,documentType:'م-7',documentNumber:'1002',createdAt:'2024-04-15T09:00:00.000Z'},
        {id:'3',number:'3',lunarDate:'1445/03/10',solarDate:'1403/03/05',executionType:'ارزیابی',office:'بخش مالی',description:'ثبت سند رسمی معامله زمین',totalPrice:2500000,documentType:'فاکتور',documentNumber:'1003',createdAt:'2024-05-05T10:00:00.000Z'},
        {id:'4',number:'4',lunarDate:'1445/04/18',solarDate:'1403/04/12',executionType:'خریداری',office:'واحد حقوقی',description:'خرید خدمات حقوقی',totalPrice:500000,documentType:'م-7',documentNumber:'1004',createdAt:'2024-06-12T11:00:00.000Z'},
        {id:'5',number:'5',lunarDate:'1445/05/22',solarDate:'1403/05/18',executionType:'آفرگشایی',office:'معاونت تخنیکی',description:'تحویل‌گیری تجهیزات تخنیکی',totalPrice:1750000,documentType:'فاکتور',documentNumber:'1005',createdAt:'2024-07-18T12:00:00.000Z'},
        {id:'6',number:'6',lunarDate:'1445/06/05',solarDate:'1403/06/01',executionType:'خریداری',office:'موسسه',description:'خرید مواد برای موسسه',totalPrice:3200000,documentType:'م-7',documentNumber:'1006',createdAt:'2024-08-01T13:00:00.000Z'},
        {id:'7',number:'7',lunarDate:'1445/07/14',solarDate:'1403/07/10',executionType:'ارزیابی',office:'سایر',description:'ثبت سند رسمی',totalPrice:900000,documentType:'فاکتور',documentNumber:'1007',createdAt:'2024-09-10T14:00:00.000Z'},
        {id:'8',number:'8',lunarDate:'1445/08/08',solarDate:'1403/08/03',executionType:'خریداری',office:'ریس اداره',description:'خرید تجهیزات',totalPrice:2100000,documentType:'م-7',documentNumber:'1008',createdAt:'2024-10-03T15:00:00.000Z'},
        {id:'9',number:'9',lunarDate:'1445/09/25',solarDate:'1403/09/20',executionType:'معاینه',office:'بخش مالی',description:'تحویل‌گیری اسناد مالی',totalPrice:450000,documentType:'فاکتور',documentNumber:'1009',createdAt:'2024-11-20T16:00:00.000Z'},
        {id:'10',number:'10',lunarDate:'1445/10/12',solarDate:'1403/10/08',executionType:'خریداری',office:'معاونت اداری',description:'خرید مبلمان اداری',totalPrice:6800000,documentType:'م-7',documentNumber:'1010',createdAt:'2024-12-08T17:00:00.000Z'},
    ];
    saveDocs(data);
}

/* اجرای مهاجرت هنگام لود common.js */
migrateDocs();
