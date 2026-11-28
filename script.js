// Header shadow on scroll
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobile menu
const menuBtn = document.querySelector('.menu-btn');
const links = document.querySelector('.nav-links');
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
}

// Company switcher (home page)
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => select(i));
  tab.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length, true); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
  });
});
function select(index, focus) {
  tabs.forEach((t, i) => {
    t.setAttribute('aria-selected', i === index);
    t.tabIndex = i === index ? 0 : -1;
  });
  panels.forEach((p, i) => { p.hidden = i !== index; });
  if (focus) tabs[index].focus();
}
if (tabs.length) select(0);

// Contact form: opens the visitor's email app with the message filled in.
// To send through a service instead (Formspree, Vercel Functions, etc.), replace this handler.
const form = document.querySelector('#contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const subject = encodeURIComponent(`Message for Soliton Management Services from ${d.get("name")}`);
    const body = encodeURIComponent(`${d.get('message')}\n\n${d.get('name')}\n${d.get('email')}`);
    document.querySelector('.form-note').textContent = 'Opening your email app with your message ready to send.';
    window.location.href = `mailto:hello@solitonpower.com?subject=${subject}&body=${body}`;
  });
}

/* =====================================================================
   Dynamic redesign
   ===================================================================== */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll progress bar (all pages)
const progress = document.createElement('div');
progress.className = 'progress';
progress.setAttribute('aria-hidden', 'true');
document.body.appendChild(progress);
const banner = document.querySelector('.banner img');
let ticking = false;
function onScrollFx() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (banner && !reduceMotion && scrollY < innerHeight * 1.5) banner.style.translate = `0 ${scrollY * 0.12}px`;
    lightStatement();
    ticking = false;
  });
}
addEventListener('scroll', onScrollFx, { passive: true });
addEventListener('resize', onScrollFx);

// Reveal sections as they scroll into view (all pages)
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  const targets = document.querySelectorAll(
    'main > section:not(.hero) h2, main > section .eyebrow, main > section .lede:not(.hero-text .lede), .grow-card, .stats > *, .mon-tabs, .mon, .mon-cap, .phone, .blog-head > *, .bl, .tile, .co, .split > *, .values > *, .cta, .notice, .contact-grid > *, .ab-stats > *, .ab-split > *, .ab-founder > *, .ab-how > *, .ab-co, .ab-idea, .svc, .facts > *, .cc, .oc'
  );
  targets.forEach((el) => {
    if (el.closest('.hero-text')) return;
    const sibs = el.parentElement ? [...el.parentElement.children] : [];
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
    el.classList.add('rv');
    io.observe(el);
  });
  // Elements marked .rv directly in the HTML (e.g. the consulting page)
  document.querySelectorAll('.rv:not(.in)').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
}

// Statement lights up word by word while scrolling
const statement = document.querySelector('.statement');
let words = [];
if (statement && !reduceMotion) {
  statement.innerHTML = statement.textContent.trim().split(/\s+/).map((w) => `<span class="w8">${w}</span>`).join(' ');
  words = [...statement.querySelectorAll('.w8')];
}
function lightStatement() {
  if (!words.length) return;
  const r = statement.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (innerHeight * 0.55)));
  const n = Math.round(p * words.length);
  words.forEach((w, i) => w.classList.toggle('on', i < n));
}

// Count-up numbers
const counters = document.querySelectorAll('[data-count]');
if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
  const co = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      co.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, t0 = performance.now();
      const step = (now) => { const k = Math.min(1, (now - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => co.observe(c));
}
onScrollFx();

// Live website monitor: tabbed on the home page, single website on each company page
(() => {
  const mon = document.querySelector('#mon');
  if (!mon) return;
  const tabs = [...document.querySelectorAll('.mon-tab')];
  const items = tabs.length ? tabs.map((t) => t.dataset) : [mon.dataset];
  const view = document.querySelector('#mon-view'), fr = document.querySelector('#mon-frame'), bar = document.querySelector('#mon-bar');
  const $ = (id) => document.getElementById(id);
  const set = (id, fn) => { const e = $(id); if (e) fn(e); };
  const W = 1440;
  let cur = -1, auto = null, timer = null, slow = null, t0 = 0, started = false;
  const fit = () => { const k = view.clientWidth / W; fr.style.width = W + 'px'; fr.style.height = (view.clientHeight / k) + 'px'; fr.style.transform = `scale(${k})`; };
  addEventListener('resize', fit);
  function show(i) {
    if (i === cur) return;
    cur = i;
    const d = items[i], url = d.url, soon = !url;
    tabs.forEach((t, n) => { t.classList.toggle('on', n === i); t.setAttribute('aria-selected', String(n === i)); });
    if (tabs[i]) { const row = tabs[i].parentElement; if (row.scrollWidth > row.clientWidth) row.scrollTo({ left: tabs[i].offsetLeft - row.offsetLeft - 16, behavior: reduceMotion ? 'auto' : 'smooth' }); }
    set('mon-name', (e) => { e.textContent = d.name; });
    set('mon-desc', (e) => { e.textContent = d.desc; });
    set('mon-more', (e) => { e.href = d.more; });
    set('mon-visit', (e) => { e.hidden = soon; });
    set('mon-ext', (e) => { e.hidden = soon; });
    clearTimeout(slow); clearInterval(timer);
    if (soon) {
      $('mon-host').textContent = 'Coming in 2027';
      $('mon-soon-img').src = d.img;
      $('mon-soon-name').textContent = d.name;
      view.classList.remove('ready'); view.classList.add('is-soon');
      bar.style.width = '0';
      fr.onload = null; fr.removeAttribute('src');
      return;
    }
    view.classList.remove('is-soon', 'ready');
    $('mon-host').textContent = url.replace(/^https:\/\/(www\.)?/, '');
    set('mon-ext', (e) => { e.href = url; });
    set('mon-visit', (e) => { e.href = url; });
    $('mon-boot-name').textContent = d.name;
    $('mon-boot-sm').textContent = 'Connecting';
    $('mon-boot-link').hidden = true; $('mon-boot-link').href = url;
    slow = setTimeout(() => { if (!view.classList.contains('ready')) { $('mon-boot-sm').textContent = 'Taking longer than expected'; $('mon-boot-link').hidden = false; } }, 10000);
    let p = 12; bar.style.width = p + '%'; t0 = Date.now();
    timer = setInterval(() => { p = Math.min(p + (90 - p) * 0.08, 90); bar.style.width = p + '%'; }, 250);
    fr.onload = () => {
      clearTimeout(slow);
      setTimeout(() => { clearInterval(timer); bar.style.width = '100%'; view.classList.add('ready'); setTimeout(() => { bar.style.width = '0'; }, 500); }, Math.max(0, 1100 - (Date.now() - t0)));
    };
    fit();
    fr.src = url;
  }
  tabs.forEach((b, i) => b.addEventListener('click', () => { clearInterval(auto); show(i); }));
  const run = () => { if (tabs.length > 1) auto = setInterval(() => { if (!document.hidden) show((cur + 1) % tabs.length); }, 14000); };
  const start = () => { if (started) return; started = true; show(0); if (!reduceMotion) run(); };
  if ('IntersectionObserver' in window) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { start(); o.disconnect(); } }, { rootMargin: '200px' }).observe(mon);
  else start();
  mon.addEventListener('pointerenter', () => clearInterval(auto));
})();

// Runs an animation loop only while its element is on screen and the tab is visible
function whenVisible(el, onShow, onHide) {
  let vis = false;
  const upd = () => { const v = vis && !document.hidden; v ? onShow() : onHide(); };
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { vis = es[0].isIntersecting; upd(); }, { threshold: 0.2 }).observe(el);
  else { vis = true; upd(); }
  document.addEventListener('visibilitychange', upd);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Analysis: spreadsheet that fills itself in, sheet by sheet
(() => {
  const xl = document.querySelector('#xl');
  if (!xl) return;
  const grid = xl.querySelector('#xl-grid'), tabsEl = xl.querySelector('#xl-tabs'), chart = xl.querySelector('#xl-chart'), bars = xl.querySelector('#xl-bars');
  const ref = xl.querySelector('#xl-ref'), fx = xl.querySelector('#xl-formula'), file = xl.querySelector('#xl-file'), chartT = xl.querySelector('#xl-chart-t');
  const L = ['A', 'B', 'C', 'D', 'E', 'F'];
  const S = [
    { tab: 'Cash flow', file: 'Cash flow forecast.xlsx', cols: ['Q1', 'Q2', 'Q3', 'Q4', 'Total'], chart: 'Net cash by quarter', chartRow: 5,
      rows: [['Revenue', 182400, 196800, 214500, 238900], ['Cost of sales', -71100, -76400, -82900, -91300], ['Payroll', -58000, -58000, -61500, -61500], ['Rent and overheads', -14200, -14200, -14600, -14600], ['Marketing', -9500, -11000, -12500, -14000]], total: 'Net cash', sumCol: true, fmt: 'n' },
    { tab: 'Sales by region', file: 'Sales analysis.xlsx', cols: ['2024', '2025', '2026', 'Growth', 'Share'], chart: '2026 sales by region', chartCol: 3,
      rows: [['Vancouver', 412000, 455000, 498000], ['Whistler', 188000, 221000, 263000], ['Squamish', 96000, 118000, 141000], ['Online', 74000, 112000, 166000]], total: 'Total', growth: true, fmt: 'n' },
    { tab: 'Cost review', file: 'Cost review.xlsx', cols: ['Budget', 'Actual', 'Variance', 'Var %', 'Status'], chart: 'Variance by cost line', chartCol: 3,
      rows: [['Staffing', 240000, 262500], ['Inventory', 155000, 149200], ['Software', 18000, 27400], ['Travel', 22000, 16800], ['Utilities', 14500, 15100]], total: 'Total', variance: true, fmt: 'n' },
    { tab: 'Valuation', file: 'Valuation model.xlsx', cols: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'], chart: 'Present value by year', chartRow: 5,
      rows: [['Revenue', 1.42, 1.61, 1.83, 2.05, 2.27], ['EBITDA', 0.26, 0.31, 0.37, 0.43, 0.49], ['Free cash flow', 0.18, 0.22, 0.27, 0.32, 0.37], ['Discount factor', 0.91, 0.83, 0.75, 0.68, 0.62], ['Present value', 0.16, 0.18, 0.2, 0.22, 0.23]], total: 'Enterprise value ($M)', valuation: true, fmt: 'm' },
  ];
  const fmtN = (v) => (v < 0 ? `(${Math.abs(Math.round(v)).toLocaleString('en-CA')})` : Math.round(v).toLocaleString('en-CA'));
  // derive totals and computed columns so every number on screen adds up
  S.forEach((s) => {
    s.data = s.rows.map((r) => r.slice());
    if (s.sumCol) { s.data.forEach((r) => r.push(r.slice(1, 5).reduce((a, b) => a + b, 0))); const t = [s.total]; for (let c = 1; c <= 5; c++) t.push(s.data.reduce((a, r) => a + r[c], 0)); s.data.push(t); s.form = (row, c) => row === s.data.length - 1 ? `=SUM(${L[c]}2:${L[c]}${s.data.length})` : c === 5 ? `=SUM(B${row + 2}:E${row + 2})` : null; }
    if (s.growth) { const tot = [s.total, 0, 0, 0]; s.data.forEach((r) => { for (let c = 1; c <= 3; c++) tot[c] += r[c]; }); s.data.push(tot); s.data.forEach((r) => { r[4] = ((r[3] / r[2] - 1) * 100).toFixed(1) + '%'; r[5] = ((r[3] / tot[3]) * 100).toFixed(1) + '%'; }); s.form = (row, c) => c === 4 ? `=D${row + 2}/C${row + 2}-1` : c === 5 ? `=D${row + 2}/D$${s.data.length + 1}` : row === s.data.length - 1 ? `=SUM(${L[c]}2:${L[c]}${s.data.length})` : null; }
    if (s.variance) { const tot = [s.total, 0, 0]; s.data.forEach((r) => { tot[1] += r[1]; tot[2] += r[2]; }); s.data.push(tot); s.data.forEach((r) => { r[3] = r[1] - r[2]; r[4] = ((r[3] / r[1]) * 100).toFixed(1) + '%'; r[5] = r[3] < 0 ? 'Over budget' : 'On track'; }); s.form = (row, c) => c === 3 ? `=B${row + 2}-C${row + 2}` : c === 4 ? `=D${row + 2}/B${row + 2}` : c === 5 ? `=IF(D${row + 2}<0,"Over budget","On track")` : row === s.data.length - 1 ? `=SUM(${L[c]}2:${L[c]}${s.data.length})` : null; }
    if (s.valuation) { const ev = s.data[4].slice(1).reduce((a, b) => a + b, 0); s.data.push([s.total, '', '', '', '', ev]); s.form = (row, c) => row === 4 ? `=${L[c]}4*${L[c]}5` : row === 5 ? '=SUM(B6:F6)' : null; }
  });
  const cellText = (s, v, label) => (v === '' || v === undefined ? '' : typeof v === 'string' ? v : s.fmt === 'm' ? (label === 'Discount factor' ? v.toFixed(2) : `$${v.toFixed(2)}M`) : fmtN(v));
  tabsEl.innerHTML = S.map((s) => `<span>${s.tab}</span>`).join('') + '<span>+</span>';
  const tabEls = [...tabsEl.children];
  let cells = [];
  function build(s) {
    const rowsN = s.data.length + 1;
    let h = '<div class="h"></div>' + L.map((l) => `<div class="h">${l}</div>`).join('');
    for (let r = 0; r < Math.max(rowsN + 2, 14); r++) {
      h += `<div class="h">${r + 1}</div>`;
      for (let c = 0; c < 6; c++) {
        let cls = c ? 'num' : 'lab';
        if (r === 0) cls += ' hd';
        if (r === rowsN - 1) cls += ' tot';
        h += `<div class="${cls}" data-r="${r}" data-c="${c}"></div>`;
      }
    }
    grid.innerHTML = h;
    cells = [...grid.querySelectorAll('[data-r]')];
    file.textContent = s.file;
    chartT.textContent = s.chart;
    chart.classList.remove('on');
    bars.innerHTML = '';
  }
  const cell = (r, c) => cells[r * 6 + c];
  let token = 0, running = false;
  async function play() {
    const my = ++token;
    for (let si = 0; ; si = (si + 1) % S.length) {
      const s = S[si];
      tabEls.forEach((t, i) => t.classList.toggle('on', i === si));
      build(s);
      // header row
      s.cols.forEach((t, i) => { cell(0, i + 1).textContent = t; });
      cell(0, 0).textContent = s.tab;
      for (let r = 0; r < s.data.length; r++) {
        for (let c = 0; c < 6; c++) {
          if (my !== token) return;
          const v = s.data[r][c];
          if (v === undefined) continue;
          const el = cell(r + 1, c);
          const txt = c ? cellText(s, v, s.data[r][0]) : v;
          if (!txt) continue;
          cells.forEach((x) => x.classList.remove('sel'));
          el.classList.add('sel', 'flash');
          el.textContent = txt;
          if (typeof v === 'number' && v < 0) el.classList.add('neg');
          if (typeof v === 'string' && v === 'Over budget') el.classList.add('neg');
          if (typeof v === 'string' && v.startsWith('-')) el.classList.add('neg');
          ref.textContent = L[c] + (r + 2);
          const f = s.form && c ? s.form(r, c) : null;
          fx.textContent = f || (typeof v === 'number' ? String(v) : v);
          setTimeout(() => el.classList.remove('flash'), 350);
          await wait(f ? 150 : 70);
        }
      }
      // chart
      const vals = s.chartRow !== undefined ? s.data[s.chartRow].slice(1, 6).filter((x) => typeof x === 'number').slice(0, s.sumCol ? 4 : 5) : s.data.slice(0, -1).map((r) => r[s.chartCol]);
      const max = Math.max(...vals.map(Math.abs));
      bars.innerHTML = vals.map((v) => `<i class="${v < 0 ? 'neg' : ''}"></i>`).join('');
      chart.classList.add('on');
      await wait(60);
      [...bars.children].forEach((b, i) => { b.style.height = (Math.abs(vals[i]) / max) * 100 + '%'; });
      cells.forEach((x) => x.classList.remove('sel'));
      await wait(3800);
      if (my !== token) return;
    }
  }
  function staticView() {
    const s = S[0];
    tabEls.forEach((t, i) => t.classList.toggle('on', i === 0));
    build(s);
    s.cols.forEach((t, i) => { cell(0, i + 1).textContent = t; });
    cell(0, 0).textContent = s.tab;
    s.data.forEach((row, r) => row.forEach((v, c) => { const el = cell(r + 1, c); el.textContent = c ? cellText(s, v, row[0]) : v; if (typeof v === 'number' && v < 0) el.classList.add('neg'); }));
  }
  if (reduceMotion) { staticView(); return; }
  staticView();
  whenVisible(xl, () => { if (!running) { running = true; play(); } }, () => { if (running) { running = false; token++; } });
})();

// Software: Tectostack logo, then code being written, built and deployed
(() => {
  const ide = document.querySelector('#ide');
  if (!ide) return;
  const codeEl = ide.querySelector('#ide-code'), term = ide.querySelector('#ide-term'), pv = ide.querySelector('#ide-pv');
  // ⟦k:...⟧ keyword, ⟦s:...⟧ string, ⟦f:...⟧ function, ⟦c:...⟧ comment, ⟦t:...⟧ type/component
  const src = `⟦c:// Orders dashboard for your team⟧
⟦k:import⟧ { getOrders } ⟦k:from⟧ ⟦s:"@/api/orders"⟧;
⟦k:import⟧ { Chart, Kpi } ⟦k:from⟧ ⟦s:"@/components"⟧;

⟦k:export default async function⟧ ⟦f:Dashboard⟧() {
  ⟦k:const⟧ orders = ⟦k:await⟧ ⟦f:getOrders⟧({ range: ⟦s:"90d"⟧ });
  ⟦k:const⟧ revenue = orders.⟦f:reduce⟧((sum, o) => sum + o.total, 0);

  ⟦k:return⟧ (
    <⟦t:main⟧ className=⟦s:"dashboard"⟧>
      <⟦t:Kpi⟧ label=⟦s:"Orders"⟧ value={orders.length} />
      <⟦t:Kpi⟧ label=⟦s:"Revenue"⟧ value={revenue} />
      <⟦t:Chart⟧ data={orders} by=⟦s:"week"⟧ />
    </⟦t:main⟧>
  );
}`;
  const toks = [];
  src.replace(/⟦(\w):([^⟧]*)⟧|([^⟦]+)/g, (m, cls, txt, plain) => { toks.push(plain !== undefined ? ['', plain] : [cls, txt]); return m; });
  const total = toks.reduce((a, t) => a + t[1].length, 0);
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function render(n) {
    let h = '', left = n;
    for (const [cls, txt] of toks) {
      if (left <= 0) break;
      const part = txt.slice(0, left); left -= part.length;
      h += cls ? `<span class="${cls}">${esc(part)}</span>` : esc(part);
    }
    codeEl.innerHTML = h + '<span class="cur"></span>';
  }
  const termLines = [['p', '$ npm run build'], ['ok', '✓ Compiled 42 modules in 3.8s'], ['p', '$ pytest api/'], ['ok', '✓ 48 tests passed'], ['p', '$ deploy --production'], ['ok', '✓ Live and serving traffic']];
  let token = 0, running = false;
  async function play() {
    const my = ++token;
    while (my === token) {
      ide.classList.remove('coding'); pv.className = 'pv'; codeEl.innerHTML = ''; term.innerHTML = '';
      await wait(2600); if (my !== token) return;
      ide.classList.add('coding');
      for (let n = 0; n <= total; n += 3) {
        if (my !== token) return;
        render(n);
        const p = n / total;
        pv.className = 'pv' + (p > 0.15 ? ' s1' : '') + (p > 0.4 ? ' s2' : '') + (p > 0.75 ? ' s3' : '') + (p > 0.92 ? ' s4' : '');
        await wait(16);
      }
      render(total);
      pv.className = 'pv s1 s2 s3 s4';
      for (const [cls, line] of termLines) {
        if (my !== token) return;
        term.innerHTML += `<span class="${cls}">${line}</span>\n`;
        await wait(cls === 'p' ? 500 : 750);
      }
      await wait(3500);
    }
  }
  if (reduceMotion) { ide.classList.add('coding'); render(total); pv.className = 'pv s1 s2 s3 s4'; term.innerHTML = termLines.map(([c, l]) => `<span class="${c}">${l}</span>`).join('\n'); return; }
  whenVisible(ide, () => { if (!running) { running = true; play(); } }, () => { if (running) { running = false; token++; } });
})();

// Phones: load the Vimeo players only when the section comes near the screen
(() => {
  const phones = document.querySelector('#phones');
  if (!phones) return;
  const load = () => phones.querySelectorAll('iframe[data-src]').forEach((f) => { f.src = f.dataset.src; f.removeAttribute('data-src'); });
  if ('IntersectionObserver' in window) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { load(); o.disconnect(); } }, { rootMargin: '300px' }).observe(phones);
  else load();
})();

// Technical writing carousel
(() => {
  const bl = document.querySelector('#bl');
  if (!bl) return;
  const cards = [...bl.querySelectorAll('.bl-card')], dots = [...bl.querySelectorAll('.bl-dot')], n = cards.length, ms = 6500;
  let cur = 0, t = null, hover = false, seen = false;
  bl.style.setProperty('--bl-ms', ms + 'ms');
  function show(i) {
    cur = (i + n) % n;
    cards.forEach((c, k) => {
      let d = (k - cur + n) % n; if (d > n / 2) d -= n;
      c.dataset.p = d === 0 ? '0' : d === 1 ? '1' : d === -1 ? '2' : d > 0 ? 'r' : 'l';
      c.setAttribute('aria-hidden', d ? 'true' : 'false'); c.tabIndex = d ? -1 : 0;
    });
    dots.forEach((d, k) => { d.classList.toggle('on', k === cur); d.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
    bl.classList.remove('run'); void bl.offsetWidth; if (!reduceMotion && seen) bl.classList.add('run');
    clearTimeout(t);
    if (!reduceMotion && !hover && seen) t = setTimeout(() => show(cur + 1), ms);
  }
  cards.forEach((c, k) => c.addEventListener('click', (e) => { if (c.dataset.p !== '0') { e.preventDefault(); show(k); } }));
  dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
  bl.querySelectorAll('.bl-arr').forEach((a) => a.addEventListener('click', () => show(cur + +a.dataset.d)));
  bl.addEventListener('mouseenter', () => { hover = true; bl.classList.add('paused'); clearTimeout(t); });
  bl.addEventListener('mouseleave', () => { hover = false; bl.classList.remove('paused'); show(cur); });
  bl.addEventListener('focusin', () => { hover = true; clearTimeout(t); });
  bl.addEventListener('focusout', () => { hover = false; show(cur); });
  bl.tabIndex = 0;
  bl.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
  let sx = null;
  bl.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  bl.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); sx = null; }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[0].isIntersecting; if (seen) show(cur); else { clearTimeout(t); bl.classList.remove('run'); } }, { threshold: 0.3 }).observe(bl);
  show(0);
})();

// Companies dropdown: tap/click toggle (hover and keyboard focus open it on desktop via CSS)
document.querySelectorAll('.nav-dd').forEach((dd) => {
  const btn = dd.querySelector('.dd-btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dd.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  dd.addEventListener('keydown', (e) => { if (e.key === 'Escape') { dd.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
  document.addEventListener('click', (e) => { if (!dd.contains(e.target)) { dd.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
});
