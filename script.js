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
    'main > section:not(.hero) h2, main > section .eyebrow, main > section .lede:not(.hero-text .lede), .grow-card, .stats > *, .mon-tabs, .mon, .mon-cap, .phone, .blog-head > *, .bl, .tile, .co, .split > *, .values > *, .cta, .notice, .contact-grid > *'
  );
  targets.forEach((el) => {
    if (el.closest('.hero-text')) return;
    const sibs = el.parentElement ? [...el.parentElement.children] : [];
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
    el.classList.add('rv');
    io.observe(el);
  });
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

// Live company monitor (home page)
(() => {
  const mon = document.querySelector('#mon');
  if (!mon) return;
  const tabs = [...document.querySelectorAll('.mon-tab')];
  const view = document.querySelector('#mon-view'), fr = document.querySelector('#mon-frame'), bar = document.querySelector('#mon-bar');
  const $ = (id) => document.getElementById(id);
  const W = 1440;
  let cur = -1, auto = null, timer = null, slow = null, t0 = 0, started = false;
  const fit = () => { const k = view.clientWidth / W; fr.style.width = W + 'px'; fr.style.height = (view.clientHeight / k) + 'px'; fr.style.transform = `scale(${k})`; };
  addEventListener('resize', fit);
  function show(i) {
    if (i === cur) return;
    cur = i;
    const b = tabs[i], url = b.dataset.url, soon = !url;
    tabs.forEach((t, n) => { t.classList.toggle('on', n === i); t.setAttribute('aria-selected', String(n === i)); });
    const row = b.parentElement; if (row.scrollWidth > row.clientWidth) row.scrollTo({ left: b.offsetLeft - row.offsetLeft - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
    $('mon-name').textContent = b.dataset.name;
    $('mon-desc').textContent = b.dataset.desc;
    $('mon-more').href = b.dataset.more;
    $('mon-visit').hidden = soon; $('mon-ext').hidden = soon;
    clearTimeout(slow); clearInterval(timer);
    if (soon) {
      $('mon-host').textContent = 'Coming in 2027';
      $('mon-soon-img').src = b.dataset.img;
      $('mon-soon-name').textContent = b.dataset.name;
      view.classList.remove('ready'); view.classList.add('is-soon');
      bar.style.width = '0';
      fr.onload = null; fr.removeAttribute('src');
      return;
    }
    view.classList.remove('is-soon', 'ready');
    $('mon-host').textContent = url.replace(/^https:\/\/(www\.)?/, '');
    $('mon-ext').href = url; $('mon-visit').href = url;
    $('mon-boot-name').textContent = b.dataset.name;
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
  const run = () => { auto = setInterval(() => { if (!document.hidden) show((cur + 1) % tabs.length); }, 14000); };
  const start = () => { if (started) return; started = true; show(0); if (!reduceMotion) run(); };
  if ('IntersectionObserver' in window) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { start(); o.disconnect(); } }, { rootMargin: '200px' }).observe(mon);
  else start();
  mon.addEventListener('pointerenter', () => clearInterval(auto));
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
