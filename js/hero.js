/*
 * Scroll-scrubbed hero.
 *
 * Frames mode: the hero film ships as a WebP frame sequence (served from the
 * frame CDN) and is painted onto a <canvas> according to scroll position.
 * Frames load coarse-to-fine so the scrub works after a handful of requests.
 *
 * Poster mode (frames.count = 0): until the film exists, a still image is
 * pushed in slowly toward a focal point as the visitor scrolls.
 *
 * Emits `hero:progress` (detail = 0…1) so each page can drive its own
 * progress widget.
 */
(function () {
  'use strict';

  const cfg = window.SITE_CONFIG.hero;
  const hero = document.getElementById('hero');
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const chapters = Array.from(hero.querySelectorAll('[data-in]'));
  const nav = document.getElementById('nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const framesMode = cfg.frames && cfg.frames.count > 0;
  const COUNT = framesMode ? cfg.frames.count : 1;

  // ---------- Preloader ----------
  const preloader = document.getElementById('preloader');
  const pctEl = document.getElementById('preloaderPct');
  const barEl = document.getElementById('preloaderBar');
  let revealed = false;

  function setLoadProgress(p) {
    if (pctEl) pctEl.textContent = Math.round(p * 100);
    if (barEl) barEl.style.transform = `scaleX(${p})`;
  }
  function reveal() {
    if (revealed) return;
    revealed = true;
    setLoadProgress(1);
    document.body.classList.remove('is-loading');
    if (preloader) {
      preloader.classList.add('is-done');
      setTimeout(() => preloader.remove(), 1200);
    }
    requestDraw(true);
  }
  setTimeout(reveal, 9000); // never trap the visitor behind the loader

  // ---------- Sources ----------
  const images = new Array(COUNT);
  let loaded = 0;

  if (framesMode) {
    const f = cfg.frames;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700 || window.innerWidth < 900;
    const set = small ? 'sm' : 'lg';
    const base = (f.baseUrl || './frames').replace(/\/$/, '');
    const url = (i) => `${base}/${set}/${f.prefix}${String(i + 1).padStart(f.pad, '0')}.${f.ext}`;

    // Coarse-to-fine order: first, last, then every 32nd, 16th … frame.
    const order = [0, COUNT - 1];
    const seen = new Uint8Array(COUNT);
    seen[0] = seen[COUNT - 1] = 1;
    for (const stride of [32, 16, 8, 4, 2, 1]) {
      for (let i = 0; i < COUNT; i += stride) if (!seen[i]) { seen[i] = 1; order.push(i); }
    }
    const readyAt = Math.min(order.length, 2 + Math.ceil(COUNT / 16));

    const load = (i) => new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        images[i] = img;
        loaded++;
        setLoadProgress(Math.min(1, loaded / readyAt));
        if (loaded >= readyAt) reveal();
        requestDraw();
        resolve();
        if (img.decode) img.decode().catch(() => {});
      };
      img.onerror = () => { loaded++; resolve(); };
      img.src = url(i);
    });

    let cursor = 0;
    const worker = async () => { while (cursor < order.length) await load(order[cursor++]); };
    Promise.all(Array.from({ length: 6 }, worker));
  } else {
    const img = new Image();
    img.onload = () => { images[0] = img; setLoadProgress(1); reveal(); };
    img.onerror = reveal;
    img.src = cfg.poster.src;
    // Fake-but-honest progress while the single poster downloads.
    let p = 0;
    const tick = setInterval(() => { p = Math.min(0.9, p + 0.08); if (!revealed) setLoadProgress(p); else clearInterval(tick); }, 90);
  }

  // ---------- Canvas ----------
  let cw = 0, ch = 0, dpr = 1;

  function resize() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    // Mobile browsers fire resize when the address bar slides; the stage is
    // svh-sized so nothing changed — skip it rather than clear the canvas.
    if (w === cw && h === ch && d === dpr) return;
    cw = w; ch = h; dpr = d;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    requestDraw(true);
  }

  function coverRect(img, zoom, fx, fy) {
    const sr = img.naturalWidth / img.naturalHeight;
    let dw = cw, dh = cw / sr;
    if (dh < ch) { dh = ch; dw = ch * sr; }
    const dx0 = (cw - dw) / 2, dy0 = (ch - dh) / 2;
    // Keep the focal point pinned while scaling.
    const sx = dx0 + fx * dw, sy = dy0 + fy * dh;
    const zw = dw * zoom, zh = dh * zoom;
    return { x: sx - fx * zw, y: sy - fy * zh, w: zw, h: zh };
  }

  function nearest(i) {
    if (images[i]) return images[i];
    for (let d = 1; d < COUNT; d++) {
      if (i - d >= 0 && images[i - d]) return images[i - d];
      if (i + d < COUNT && images[i + d]) return images[i + d];
    }
    return null;
  }

  // A portrait phone only sees about a third of the 16:9 film, so the crop
  // pans along cfg.mobileFocus — [progress, subject x (0–1)] keys — to keep
  // the subject in shot. Landscape screens show the whole frame untouched.
  const track = (cfg.mobileFocus || []).slice().sort((a, b) => a[0] - b[0]);
  function focusAt(p) {
    if (!track.length) return 0.5;
    if (p <= track[0][0]) return track[0][1];
    for (let i = 1; i < track.length; i++) {
      if (p > track[i][0]) continue;
      const [p0, x0] = track[i - 1], [p1, x1] = track[i];
      const t = (p - p0) / (p1 - p0 || 1);
      return x0 + (x1 - x0) * t * t * (3 - 2 * t);
    }
    return track[track.length - 1][1];
  }

  let lastImg = null, lastZoom = -1, lastPan = -1;
  function draw(p, force) {
    const idx = framesMode ? Math.round(p * (COUNT - 1)) : 0;
    const img = nearest(idx);
    if (!img) return;
    const zoom = framesMode ? 1 : 1 + (cfg.poster.zoom - 1) * p;
    // Portrait screens follow hero.mobileFocus (film or poster) so the subject stays in view.
    const follow = cw / ch < 1.2 && (framesMode || track.length > 0);
    const pan = follow ? focusAt(p) : 0.5;
    if (!force && img === lastImg && Math.abs(zoom - lastZoom) < 0.0005 && Math.abs(pan - lastPan) < 0.0005) return;
    lastImg = img; lastZoom = zoom; lastPan = pan;
    const fx = framesMode ? 0.5 : cfg.poster.focusX;
    const fy = framesMode ? 0.5 : cfg.poster.focusY;
    const r = coverRect(img, zoom, fx, fy);
    if (r.w > cw) r.x = Math.min(0, Math.max(cw - r.w, follow ? cw / 2 - pan * r.w : r.x));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, r.x, r.y, r.w, r.h);
  }

  // ---------- Scroll ----------
  let target = 0, current = 0, rafId = 0, forceNext = false;

  function readScroll() {
    const scrollable = hero.offsetHeight - window.innerHeight;
    target = scrollable > 0 ? Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / scrollable)) : 0;
    if (!Number.isFinite(current)) current = target;
  }

  function requestDraw(force) {
    if (force) forceNext = true;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    rafId = 0;
    readScroll();
    current += (target - current) * (reduceMotion ? 1 : 0.2);
    if (Math.abs(target - current) < 0.0004) current = target;
    draw(current, forceNext);
    forceNext = false;
    overlays(current);
    if (current !== target) rafId = requestAnimationFrame(tick);
  }

  // ---------- Overlays ----------
  const FADE = 0.05;
  function windowOpacity(p, a, b) {
    if (p < a - FADE || p > b + FADE) return 0;
    const inO = a <= 0 ? 1 : Math.min(1, (p - (a - FADE)) / FADE);
    const outO = b >= 1 ? 1 : Math.min(1, (b + FADE - p) / FADE);
    return Math.max(0, Math.min(inO, outO));
  }

  function overlays(p) {
    for (const el of chapters) {
      const a = parseFloat(el.dataset.in), b = parseFloat(el.dataset.out);
      const o = windowOpacity(p, a, b);
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      el.style.transform = `translate3d(0, ${((1 - o) * (p < a ? 28 : -28)).toFixed(1)}px, 0)`;
      el.classList.toggle('is-live', o > 0.6);
    }
    const past = window.scrollY > hero.offsetHeight - window.innerHeight * 1.05;
    document.body.classList.toggle('in-hero', !past);
    if (nav) nav.classList.toggle('nav--solid', past || p > 0.995);
    window.dispatchEvent(new CustomEvent('hero:progress', { detail: p }));
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => requestDraw(), { passive: true });
  window.addEventListener('site:scroll', () => requestDraw());
  resize();
  readScroll();
  current = target;
  overlays(current);
})();
