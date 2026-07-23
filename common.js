/* ===== Shared Data & Utilities ===== */

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

function getDocs() {
    try { var d = localStorage.getItem('documents'); return d ? JSON.parse(d) : []; } catch(e) { return []; }
}

function saveDocs(data) { localStorage.setItem('documents', JSON.stringify(data)); }

function getNextId() {
    var docs = getDocs();
    return docs.length > 0 ? Math.max.apply(null, docs.map(function(d){ return d.id || 0; })) + 1 : 1;
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

function escapeHtml(s) { return String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

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

function getDocsSorted() { var d = getDocs(); d.sort(function(a,b){ return (b.id||0) - (a.id||0); }); return d; }

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
    docs.sort(function(a,b){ return (b.id||0) - (a.id||0); });
    return docs;
}

function getDocById(id) { return getDocs().find(function(d){ return d.id == id; }); }

function deleteDoc(id) { var d = getDocs().filter(function(x){ return x.id != id; }); saveDocs(d); }

function upsertDoc(doc) {
    var docs = getDocs();
    var idx = docs.findIndex(function(d){ return d.id == doc.id; });
    if (idx >= 0) docs[idx] = doc; else { if (!doc.id) doc.id = getNextId(); docs.push(doc); }
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
        {id:1,number:'1',lunarDate:'1445/01/15',solarDate:'1403/01/10',executionType:'خریداری',office:'ریس اداره',description:'خرید مواد خام برای پروژه ساختمان',totalPrice:1250000,documentType:'فاکتور',documentNumber:'1001'},
        {id:2,number:'2',lunarDate:'1445/02/20',solarDate:'1403/02/15',executionType:'معاینه',office:'معاونت اداری',description:'تحویل‌گیری تجهیزات اداری',totalPrice:850000,documentType:'م-7',documentNumber:'1002'},
        {id:3,number:'3',lunarDate:'1445/03/10',solarDate:'1403/03/05',executionType:'ارزیابی',office:'بخش مالی',description:'ثبت سند رسمی معامله زمین',totalPrice:2500000,documentType:'فاکتور',documentNumber:'1003'},
        {id:4,number:'4',lunarDate:'1445/04/18',solarDate:'1403/04/12',executionType:'خریداری',office:'واحد حقوقی',description:'خرید خدمات حقوقی',totalPrice:500000,documentType:'م-7',documentNumber:'1004'},
        {id:5,number:'5',lunarDate:'1445/05/22',solarDate:'1403/05/18',executionType:'آفرگشایی',office:'معاونت تخنیکی',description:'تحویل‌گیری تجهیزات تخنیکی',totalPrice:1750000,documentType:'فاکتور',documentNumber:'1005'},
        {id:6,number:'6',lunarDate:'1445/06/05',solarDate:'1403/06/01',executionType:'خریداری',office:'موسسه',description:'خرید مواد برای موسسه',totalPrice:3200000,documentType:'م-7',documentNumber:'1006'},
        {id:7,number:'7',lunarDate:'1445/07/14',solarDate:'1403/07/10',executionType:'ارزیابی',office:'سایر',description:'ثبت سند رسمی',totalPrice:900000,documentType:'فاکتور',documentNumber:'1007'},
        {id:8,number:'8',lunarDate:'1445/08/08',solarDate:'1403/08/03',executionType:'خریداری',office:'ریس اداره',description:'خرید تجهیزات',totalPrice:2100000,documentType:'م-7',documentNumber:'1008'},
        {id:9,number:'9',lunarDate:'1445/09/25',solarDate:'1403/09/20',executionType:'معاینه',office:'بخش مالی',description:'تحویل‌گیری اسناد مالی',totalPrice:450000,documentType:'فاکتور',documentNumber:'1009'},
        {id:10,number:'10',lunarDate:'1445/10/12',solarDate:'1403/10/08',executionType:'خریداری',office:'معاونت اداری',description:'خرید مبلمان اداری',totalPrice:6800000,documentType:'م-7',documentNumber:'1010'},
    ];
    saveDocs(data);
}
