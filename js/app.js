/*
 * Overdose: shop grid (filters, search, sort), product sheet with the notes
 * pyramid, scent finder quiz, discovery-set builder and gift sets, bag and
 * WhatsApp checkout, dispatch countdown (Pakistan time), reviews and FAQ.
 * The bag lives in localStorage; checkout writes the order up as a WhatsApp
 * message to the shop.
 */
(function () {
  'use strict';

  const BIZ = window.SITE_CONFIG.business;
  const SCENTS = window.SCENTS, SIZES = window.SIZES, SETS = window.SETS, QUIZ = window.QUIZ;
  const STORE = 'overdose.bag.v1';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rs = (n) => `${BIZ.currency} ${Math.round(n).toLocaleString('en-PK')}`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byId = Object.fromEntries(SCENTS.map((s) => [s.id, s]));
  const setById = Object.fromEntries(SETS.map((s) => [s.id, s]));
  const priceOf = (s, size) => SIZES[s.tier][size];
  const waBase = `https://wa.me/${BIZ.whatsapp}`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const art = (s, size = '50 ML', fill) => (s.img ? `<img src="${s.img}" alt="${esc(s.name)}" loading="lazy" />` : window.bottleSVG({ code: s.code, liquid: s.liquid, size, fill }));
  const dots = (n) => `<span class="dots" style="--v:${n}" aria-label="${n} of 5"></span>`;
  const WHO = { him: 'For him', her: 'For her', unisex: 'Unisex' };
  const TAGS = { bestseller: 'Bestseller', new: 'New' };

  // ---------- Smooth scroll ----------
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', () => window.dispatchEvent(new Event('site:scroll')));
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const navH = () => $('#nav').offsetHeight;
  function scrollToEl(el, extra = 0) {
    if (!el) return;
    const offset = -navH() + 1 - extra;
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.3 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduced ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#') return;
    e.preventDefault();
    if (id === '#top') { lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    scrollToEl($(id));
  });
  let locks = 0;
  const lock = () => { if (locks++ === 0) { if (lenis) lenis.stop(); document.documentElement.style.overflow = 'hidden'; } };
  const unlock = () => { if (locks && --locks === 0) { if (lenis) lenis.start(); document.documentElement.style.overflow = ''; } };

  // ---------- Contact details from config ----------
  $$('[data-wa]').forEach((a) => { a.href = waBase; });
  $$('[data-phone]').forEach((el) => { el.textContent = BIZ.phoneDisplay; });
  $$('[data-city]').forEach((el) => { el.textContent = BIZ.city; });
  $$('[data-free]').forEach((el) => { el.textContent = rs(BIZ.freeDeliveryFrom); });
  $$('[data-gift-price]').forEach((el) => { el.textContent = `+ ${rs(BIZ.giftWrap)}`; });

  // ---------- Hero: dosing gauge + hint ----------
  const gFill = $('#gaugeFill'), gVal = $('#gaugeVal'), hint = $('#heroHint');
  window.addEventListener('hero:progress', (e) => {
    const p = e.detail;
    gFill.style.transform = `scaleY(${p})`;
    gVal.textContent = Math.round(p * 100);
    hint.style.opacity = Math.max(0, 1 - p / 0.04);
  });

  // ---------- Dispatch countdown (Pakistan time) ----------
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone: BIZ.timezone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function dispatchState() {
    const p = clock.formatToParts(new Date());
    const day = DAYS.indexOf(p.find((x) => x.type === 'weekday').value);
    const mins = +p.find((x) => x.type === 'hour').value * 60 + +p.find((x) => x.type === 'minute').value;
    const cut = BIZ.dispatch.cutoff * 60;
    if (BIZ.dispatch.days.includes(day) && mins < cut) return { today: true, left: cut - mins };
    let d = (day + 1) % 7, k = 1;
    while (!BIZ.dispatch.days.includes(d)) { d = (d + 1) % 7; k++; }
    return { today: false, when: k === 1 ? 'tomorrow' : DAY_NAMES[d] };
  }
  const fmtLeft = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`);
  function updateDispatch() {
    const D = dispatchState();
    $$('[data-dispatch-short]').forEach((el) => { el.textContent = D.today ? fmtLeft(D.left) : `Ships ${D.when}`; });
    $$('[data-dispatch]').forEach((el) => { el.textContent = D.today ? 'left to order for same-day dispatch' : 'orders placed now ship first thing'; });
    $$('[data-dispatch-long]').forEach((el) => {
      el.innerHTML = D.today ? `Order in the next <b>${fmtLeft(D.left)}</b> and it ships <b>today</b>.` : `Order now and it ships <b>${D.when}</b> morning.`;
    });
  }

  // ---------- Bag state ----------
  let state = { lines: [], zone: '', gift: false };
  try { Object.assign(state, JSON.parse(localStorage.getItem(STORE)) || {}); } catch (e) { /* private mode */ }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  function unitPrice(l) {
    if (l.kind === 'scent') return priceOf(byId[l.id], l.size);
    return setById[l.id].price;
  }
  // Drop lines whose scent, size or set no longer exists; prices are always recomputed from data.
  state.lines = (state.lines || []).filter((l) => {
    if (l.kind === 'scent') return !!byId[l.id] && SIZES.labels[l.size] !== undefined;
    if (l.kind === 'set') return !!setById[l.id] && !setById[l.id].kind;
    if (l.kind === 'build') return !!setById[l.id] && (l.picks || []).length === setById[l.id].pick && l.picks.every((p) => byId[p]);
    return false;
  });

  const keyOf = (l) => [l.kind, l.id, l.size ?? '', (l.picks || []).slice().sort().join(',')].join('|');
  function addLine(l, qty = 1) {
    const hit = state.lines.find((x) => keyOf(x) === keyOf(l));
    if (hit) hit.qty = Math.min(20, hit.qty + qty); else state.lines.push({ ...l, qty });
    save(); renderCart(); bump();
  }
  const qtyOf = (id) => state.lines.filter((l) => l.kind === 'scent' && l.id === id).reduce((s, l) => s + l.qty, 0);
  const nameOf = (l) => (l.kind === 'scent' ? `${byId[l.id].name} (${byId[l.id].code})` : setById[l.id].name);
  function describe(l) {
    if (l.kind === 'scent') return `${SIZES.labels[l.size]} · inspired by ${byId[l.id].inspired}`;
    if (l.kind === 'build') return l.picks.map((p) => byId[p].name).join(' · ');
    return setById[l.id].items.map((p) => `${byId[p].name} 50 ml`).join(' · ');
  }

  function totals() {
    const items = state.lines.reduce((s, l) => s + l.qty, 0);
    const sub = state.lines.reduce((s, l) => s + unitPrice(l) * l.qty, 0);
    const zone = BIZ.zones.find((z) => z.id === state.zone);
    const fee = sub >= BIZ.freeDeliveryFrom ? 0 : zone ? zone.fee : null;
    const gift = state.gift && items ? BIZ.giftWrap : 0;
    return { items, sub, fee, zone, gift, total: sub + (fee || 0) + gift };
  }

  // ---------- Shop ----------
  let filter = 'all';
  $('#chips').innerHTML = window.FILTERS.map((f) => `<button type="button" class="chip" data-f="${f.id}" aria-pressed="${f.id === 'all'}">${esc(f.label)}</button>`).join('');
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    filter = b.dataset.f;
    $$('#chips .chip').forEach((c) => c.setAttribute('aria-pressed', c === b));
    renderProducts();
  });
  const FAMILY_OF = { fresh: ['fresh', 'aquatic'], sweet: ['sweet'], woody: ['woody'], oud: ['oud'], floral: ['floral'] };
  function matches(s) {
    if (filter === 'him' || filter === 'her') { if (s.who !== filter && s.who !== 'unisex') return false; }
    else if (filter === 'unisex') { if (s.who !== 'unisex') return false; }
    else if (FAMILY_OF[filter] && !FAMILY_OF[filter].includes(s.family)) return false;
    const q = $('#search').value.trim().toLowerCase();
    if (!q) return true;
    const hay = [s.name, s.code, s.inspired, s.desc, s.family, WHO[s.who], ...s.notes.top, ...s.notes.heart, ...s.notes.base].join(' ').toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }
  const SORTS = {
    pop: (a, b) => b.count - a.count,
    low: (a, b) => priceOf(a, 1) - priceOf(b, 1) || b.count - a.count,
    high: (a, b) => priceOf(b, 1) - priceOf(a, 1) || b.count - a.count,
    wear: (a, b) => b.wear - a.wear || b.trail - a.trail,
  };

  function productHTML(s) {
    const q = qtyOf(s.id);
    const notes = [s.notes.top[0], s.notes.heart[0], s.notes.base[0]].join(' · ');
    return `
    <article class="product ${q ? 'is-in' : ''}" data-scent="${s.id}" style="--l1:${s.liquid[0]};--l2:${s.liquid[1]}">
      <div class="product__media">
        ${art(s)}
        <div class="product__badges">${s.tags.map((t) => `<span class="badge badge--${t}">${TAGS[t]}</span>`).join('')}</div>
        ${q ? `<span class="product__in">${q} in bag</span>` : ''}
      </div>
      <div class="product__body">
        <p class="product__code">${esc(s.code)} · ${WHO[s.who]}</p>
        <h3>${esc(s.name)}</h3>
        <p class="product__insp">Inspired by <b>${esc(s.inspired)}</b></p>
        <p class="product__notes">${esc(notes)}</p>
        <div class="product__meters"><span>Wear ${dots(s.wear)}</span><span>Trail ${dots(s.trail)}</span></div>
        <div class="product__foot">
          <p class="product__price"><small>from</small> ${rs(priceOf(s, 0))}</p>
          <span class="product__rating">★ ${s.rating.toFixed(1)} <small>(${s.count})</small></span>
        </div>
        <button type="button" class="btn btn--dark btn--sm btn--block product__btn" aria-label="Choose a size of ${esc(s.name)}">Choose size</button>
      </div>
    </article>`;
  }
  function renderProducts() {
    const list = SCENTS.filter(matches).sort(SORTS[$('#sort').value]);
    $('#products').innerHTML = list.map(productHTML).join('');
    $('#empty').hidden = list.length > 0;
  }
  let searchT = 0;
  $('#search').addEventListener('input', () => { clearTimeout(searchT); searchT = setTimeout(renderProducts, 120); });
  $('#sort').addEventListener('change', renderProducts);
  $('#products').addEventListener('click', (e) => {
    const card = e.target.closest('[data-scent]');
    if (card) openSheet(byId[card.dataset.scent]);
  });

  // ---------- Product sheet ----------
  const sheet = $('#sheet'), sheetForm = $('#sheetForm');
  let cur = null, sheetQty = 1;
  const SEASON = { all: 'All year', summer: 'Summer', winter: 'Winter' };
  const MOMENT = { day: 'Daytime', office: 'Office', night: 'Nights out', wedding: 'Weddings' };

  function openSheet(s, size = 1) {
    cur = s; sheetQty = 1;
    sheet.style.setProperty('--l1', s.liquid[0]); sheet.style.setProperty('--l2', s.liquid[1]);
    $('#sheetMedia').innerHTML = art(s, SIZES.labels[size].replace(' tester', '').toUpperCase());
    $('#sheetCode').textContent = `${s.code} · ${WHO[s.who]} · ★ ${s.rating.toFixed(1)} (${s.count} reviews)`;
    $('#sheetTitle').textContent = s.name;
    $('#sheetInspired').innerHTML = `Inspired by <b>${esc(s.inspired)}</b>`;
    $('#sheetDesc').textContent = s.desc;
    $('#sheetNotes').innerHTML = [['Top', s.notes.top, 'The first 15 minutes'], ['Heart', s.notes.heart, 'Hours 1–4'], ['Base', s.notes.base, 'What lingers']]
      .map(([k, v, t]) => `<div class="pyramid__row"><dt>${k}<small>${t}</small></dt><dd>${v.map(esc).join(' · ')}</dd></div>`).join('');
    $('#sheetMeters').innerHTML = `
      <div><span>Wear</span>${dots(s.wear)}<small>${['', '2–3 h', '4–5 h', '6–8 h', '8–10 h', '10–12 h+'][s.wear]}</small></div>
      <div><span>Trail</span>${dots(s.trail)}<small>${['', 'Skin', 'Close', 'Arm’s length', 'Room', 'Room-filling'][s.trail]}</small></div>`;
    $('#sheetChips').innerHTML = [...s.seasons.map((x) => SEASON[x]), ...s.moments.map((x) => MOMENT[x])].filter((v, i, a) => a.indexOf(v) === i)
      .map((x) => `<span>${x}</span>`).join('');
    $('#sheetSizes').innerHTML = SIZES.labels.map((l, i) => `
      <label class="size"><input type="radio" name="size" value="${i}" ${i === size ? 'checked' : ''} />
        <span class="size__label">${esc(l)}</span><span class="size__price">${rs(priceOf(s, i))}</span>
        ${i === 2 ? `<span class="size__save">${rs(priceOf(s, 1) * 2 - priceOf(s, 2))} less than 2 × 50 ml</span>` : i === 0 ? '<span class="size__save">Try it first</span>' : '<span class="size__save">Most popular</span>'}
      </label>`).join('');
    sheetPrice();
    sheet.showModal();
    sheet.querySelector('.sheet__scroll').scrollTop = 0;
    lock();
  }
  const sheetSize = () => +sheetForm.querySelector('[name="size"]:checked').value;
  function sheetPrice() {
    $('#sheetQty').textContent = sheetQty;
    $('#sheetPrice').textContent = rs(priceOf(cur, sheetSize()) * sheetQty);
  }
  sheetForm.addEventListener('change', () => {
    sheetPrice();
    $('#sheetMedia').innerHTML = art(cur, SIZES.labels[sheetSize()].replace(' tester', '').toUpperCase(), [0.7, 0.86, 0.9][sheetSize()]);
  });
  sheetForm.addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (b) { sheetQty = Math.max(1, Math.min(20, sheetQty + +b.dataset.q)); sheetPrice(); }
  });
  sheetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const size = sheetSize();
    addLine({ kind: 'scent', id: cur.id, size }, sheetQty);
    toast(`${sheetQty > 1 ? sheetQty + '× ' : ''}${cur.name} ${SIZES.labels[size]} added`);
    sheet.close();
  });

  // Shared dialog behaviour: close buttons, backdrop click, scroll lock.
  $$('dialog.sheet').forEach((d) => {
    d.addEventListener('close', unlock);
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
  });

  // ---------- Sets ----------
  const DISC = SETS.find((s) => s.kind === 'build');
  function setHTML(s, i) {
    const save = `<span class="set__save">Save ${rs(s.was - s.price)}</span>`;
    if (s.kind === 'build') {
      const fan = SCENTS.slice(0, 5).map((x, k) => `<div class="fan__b" style="--k:${k - 2}">${window.bottleSVG({ code: x.code, liquid: x.liquid, size: '10 ML', fill: 0.75 })}</div>`).join('');
      return `
      <article class="set set--build reveal" style="--d:${i * 80}ms">
        <div class="set__media fan">${fan}${save}${s.tag ? `<span class="set__tag">${esc(s.tag)}</span>` : ''}</div>
        <div class="set__body">
          <p class="set__meta">${s.pick} × 10 ml testers · your choice</p>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.blurb)}</p>
          <div class="set__foot"><p class="price">${rs(s.price)}<s>${rs(s.was)}</s></p>
          <button type="button" class="btn btn--dark btn--sm" data-build>Build your set</button></div>
        </div>
      </article>`;
    }
    const bottles = s.items.map((id, k) => `<div class="row__b" style="--k:${k}">${art(byId[id])}</div>`).join('');
    return `
      <article class="set reveal" style="--d:${i * 80}ms">
        <div class="set__media row">${bottles}${save}${s.tag ? `<span class="set__tag">${esc(s.tag)}</span>` : ''}</div>
        <div class="set__body">
          <p class="set__meta">${s.items.length} × 50 ml</p>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.blurb)}</p>
          <ul class="set__items">${s.items.map((id) => `<li><b>${esc(byId[id].name)}</b> · inspired by ${esc(byId[id].inspired)}</li>`).join('')}</ul>
          <div class="set__foot"><p class="price">${rs(s.price)}<s>${rs(s.was)}</s></p>
          <button type="button" class="btn btn--dark btn--sm" data-set="${s.id}">Add set</button></div>
        </div>
      </article>`;
  }
  $('#setsGrid').innerHTML = SETS.map(setHTML).join('');
  $('#setsGrid').addEventListener('click', (e) => {
    if (e.target.closest('[data-build]')) return openBuild();
    const b = e.target.closest('[data-set]');
    if (b) { addLine({ kind: 'set', id: b.dataset.set }); toast(`${setById[b.dataset.set].name} added`); }
  });

  // ---------- Discovery set builder ----------
  const build = $('#build'), buildForm = $('#buildForm');
  let picks = [];
  function openBuild() {
    picks = [];
    $('#buildList').innerHTML = SCENTS.map((s) => `
      <label class="pick" style="--l1:${s.liquid[0]};--l2:${s.liquid[1]}">
        <input type="checkbox" value="${s.id}" />
        <span class="pick__swatch"></span>
        <span class="pick__name"><b>${esc(s.name)}</b><small>${esc(s.inspired)}</small></span>
        <span class="pick__tick" aria-hidden="true"></span>
      </label>`).join('');
    $('#buildPrice').textContent = rs(DISC.price);
    $('#buildWas').textContent = rs(DISC.was);
    updateBuild();
    build.showModal();
    build.querySelector('.sheet__scroll').scrollTop = 0;
    lock();
  }
  function updateBuild() {
    const full = picks.length >= DISC.pick;
    $$('#buildList input').forEach((i) => { i.disabled = full && !i.checked; });
    $('#buildPicked').textContent = `${picks.length} of ${DISC.pick} picked`;
    const btn = $('#buildAdd');
    btn.disabled = !full;
    btn.textContent = full ? `Add set · ${rs(DISC.price)}` : `Pick ${DISC.pick - picks.length} more`;
  }
  buildForm.addEventListener('change', (e) => {
    const i = e.target;
    if (i.checked) picks.push(i.value); else picks = picks.filter((p) => p !== i.value);
    updateBuild();
  });
  buildForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (picks.length !== DISC.pick) return;
    addLine({ kind: 'build', id: DISC.id, picks: picks.slice().sort() });
    toast('Discovery Set added');
    build.close();
  });

  // ---------- Scent finder ----------
  let step = 0, answers = {};
  const RELATED = { fresh: ['aquatic'], aquatic: ['fresh'], woody: ['oud'], oud: ['woody'], sweet: ['floral'], floral: ['sweet'] };
  function score(s) {
    let n = s.rating * 0.4;
    const who = answers.who;
    if (who && who !== 'any') n += s.who === who ? 3 : s.who === 'unisex' ? 2 : -6;
    if (answers.family) n += s.family === answers.family ? 4 : (RELATED[answers.family] || []).includes(s.family) ? 2.5 : 0;
    if (answers.moment === 'summer') n += s.seasons.includes('summer') ? 3 : s.seasons.includes('all') ? 1 : -2;
    else if (answers.moment) n += s.moments.includes(answers.moment) ? 2.5 : 0;
    if (answers.trail) n -= Math.abs(s.trail - answers.trail) * 1.1;
    return n;
  }
  function renderQuiz() {
    const done = step >= QUIZ.length;
    $('#quizStep').textContent = done ? 'Your matches' : `Question ${step + 1} of ${QUIZ.length}`;
    $('#quizBar').style.transform = `scaleX(${done ? 1 : step / QUIZ.length})`;
    $('#quizBack').hidden = step === 0 || done;
    $('#quizReset').hidden = !done;
    if (!done) {
      const q = QUIZ[step];
      $('#quizBody').innerHTML = `
        <h3 class="quiz__q">${esc(q.q)}</h3>
        <div class="quiz__opts ${q.options.length > 3 ? 'quiz__opts--many' : ''}">
          ${q.options.map((o, i) => `<button type="button" class="qopt ${answers[q.key] === o.value ? 'is-on' : ''}" data-o="${i}"><b>${esc(o.label)}</b>${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join('')}
        </div>`;
      return;
    }
    const ranked = SCENTS.map((s) => ({ s, n: score(s) })).sort((a, b) => b.n - a.n).slice(0, 3);
    const top = ranked[0].n;
    $('#quizBody').innerHTML = `
      <h3 class="quiz__q">Your three best matches.</h3>
      <div class="matches">${ranked.map(({ s, n }, i) => `
        <button type="button" class="match" data-open="${s.id}" style="--l1:${s.liquid[0]};--l2:${s.liquid[1]}">
          <span class="match__art">${art(s)}</span>
          <span class="match__pct">${Math.max(62, Math.min(98, Math.round(97 - (top - n) * 4 - i)))}% match</span>
          <b>${esc(s.name)}</b><small>Inspired by ${esc(s.inspired)}</small>
          <span class="match__cta">From ${rs(priceOf(s, 0))} →</span>
        </button>`).join('')}</div>
      <p class="quiz__tip">Torn between them? Put all three in a <button type="button" class="link-btn" data-disc>Discovery Set</button>.</p>`;
  }
  $('#quizBody').addEventListener('click', (e) => {
    const o = e.target.closest('[data-o]');
    if (o) { const q = QUIZ[step]; answers[q.key] = q.options[+o.dataset.o].value; step++; renderQuiz(); return; }
    const m = e.target.closest('[data-open]');
    if (m) return openSheet(byId[m.dataset.open]);
    if (e.target.closest('[data-disc]')) openBuild();
  });
  $('#quizBack').addEventListener('click', () => { step = Math.max(0, step - 1); renderQuiz(); });
  $('#quizReset').addEventListener('click', () => { step = 0; answers = {}; renderQuiz(); });

  // ---------- Bag drawer ----------
  const drawer = $('#drawer'), scrim = $('#scrim'), form = $('#checkout');
  let opener = null;
  $('#zoneSelect').innerHTML += BIZ.zones.map((z) => `<option value="${z.id}">${esc(z.name)} · ${rs(z.fee)} · ${z.eta}</option>`).join('');
  $('#zoneSelect').value = state.zone || '';
  $('#giftCheck').checked = !!state.gift;
  $('#giftNote').hidden = !state.gift;

  function renderCart() {
    const t = totals(), empty = !state.lines.length;
    const count = $('#cartCount');
    count.textContent = t.items;
    count.classList.toggle('is-on', t.items > 0);
    $('#barCount').textContent = t.items;
    $('#barTotal').textContent = rs(t.total);
    $('#orderBar').hidden = empty || drawer.classList.contains('is-open');
    document.body.classList.toggle('has-cart', !empty);

    $('#cartEmpty').hidden = !empty;
    form.hidden = empty;
    $('#lines').innerHTML = state.lines.map((l, i) => {
      const s = l.kind === 'scent' ? byId[l.id] : null;
      const thumb = s ? art(s, SIZES.labels[l.size].replace(' tester', '').toUpperCase()) : window.bottleSVG({ code: 'SET', liquid: ['#F1D9A8', '#8A6A3C'], size: 'BOX' });
      return `
      <li class="line">
        <div class="line__art" ${s ? `style="--l1:${s.liquid[0]};--l2:${s.liquid[1]}"` : ''}>${thumb}</div>
        <div class="line__main">
          <div class="line__name">${esc(l.kind === 'scent' ? s.name : setById[l.id].name)}</div>
          <div class="line__opts">${esc(describe(l))}</div>
          <div class="line__ctrl">
            <div class="qty qty--sm" role="group" aria-label="Quantity of ${esc(nameOf(l))}">
              <button type="button" data-line="${i}" data-d="-1" aria-label="One less">−</button><output>${l.qty}</output><button type="button" data-line="${i}" data-d="1" aria-label="One more">+</button>
            </div>
            <button type="button" class="line__remove" data-remove="${i}">Remove</button>
          </div>
        </div>
        <div class="line__price">${rs(unitPrice(l) * l.qty)}</div>
      </li>`;
    }).join('');

    const free = $('#freeBar');
    free.hidden = empty;
    if (!empty) {
      const need = BIZ.freeDeliveryFrom - t.sub;
      $('#freeText').innerHTML = need > 0 ? `Add <b>${rs(need)}</b> more for free delivery` : '<b>Free delivery unlocked.</b>';
      $('#freeFill').style.transform = `scaleX(${Math.min(1, t.sub / BIZ.freeDeliveryFrom)})`;
    }
    $('#tSub').textContent = rs(t.sub);
    $('#tFee').textContent = t.fee === null ? 'Choose zone' : t.fee === 0 ? 'Free' : rs(t.fee);
    $('#tGiftRow').hidden = !t.gift;
    $('#tGift').textContent = rs(t.gift);
    $('#tTotal').textContent = rs(t.total);
    const btn = $('#checkoutBtn');
    btn.disabled = empty;
    btn.textContent = empty ? 'Your bag is empty' : `Send order on WhatsApp · ${rs(t.total)}`;

    // Reflect bag counts on the product cards.
    $$('#products [data-scent]').forEach((card) => {
      const q = qtyOf(card.dataset.scent), badge = card.querySelector('.product__in');
      if ((badge ? badge.textContent : '') !== (q ? `${q} in bag` : '')) card.outerHTML = productHTML(byId[card.dataset.scent]);
    });
  }

  $('#lines').addEventListener('click', (e) => {
    const b = e.target.closest('[data-d]'), r = e.target.closest('[data-remove]');
    if (b) {
      const l = state.lines[+b.dataset.line];
      l.qty = Math.min(20, l.qty + +b.dataset.d);
      if (l.qty <= 0) state.lines.splice(+b.dataset.line, 1);
    } else if (r) state.lines.splice(+r.dataset.remove, 1);
    else return;
    save(); renderCart();
  });
  $('#zoneSelect').addEventListener('change', (e) => { state.zone = e.target.value; save(); renderCart(); });
  $('#giftCheck').addEventListener('change', (e) => { state.gift = e.target.checked; $('#giftNote').hidden = !state.gift; save(); renderCart(); });

  function openCart() {
    opener = document.activeElement;
    drawer.classList.add('is-open');
    drawer.inert = false; drawer.setAttribute('aria-hidden', 'false');
    scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('is-on'));
    $('#orderBar').hidden = true;
    lock();
    setTimeout(() => $('#closeCart').focus(), 80);
  }
  function closeCart() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.inert = true; drawer.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('is-on'); setTimeout(() => { scrim.hidden = true; }, 400);
    unlock();
    renderCart();
    if (opener && opener.focus) opener.focus();
  }
  $('#openCart').addEventListener('click', openCart);
  $('#orderBar').addEventListener('click', openCart);
  $('#closeCart').addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open') && !$('dialog[open]')) closeCart(); });
  $('#browse').addEventListener('click', () => { closeCart(); scrollToEl($('#shop')); });

  // ---------- Checkout ----------
  form.addEventListener('input', (e) => { const f = e.target.closest('.field'); if (f) f.classList.remove('is-error'); });
  form.addEventListener('submit', (e) => { e.preventDefault(); placeOrder(); });
  $('#checkoutBtn').addEventListener('click', placeOrder);

  function placeOrder() {
    const t = totals();
    if (!state.lines.length) return;
    const checks = {
      name: (v) => v.trim().length > 1,
      phone: (v) => v.replace(/\D/g, '').length >= 10,
      zone: (v) => !!v,
      city: (v) => v.trim().length > 1,
      address: (v) => v.trim().length > 5,
    };
    let first = null;
    for (const [name, ok] of Object.entries(checks)) {
      const el = form.elements[name], good = ok(el.value);
      el.closest('.field').classList.toggle('is-error', !good);
      if (!good && !first) first = el;
    }
    if (first) {
      toast('Add your name, phone and full delivery address');
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => first.focus({ preventScroll: true }), 350);
      return;
    }

    const d = Object.fromEntries(new FormData(form).entries());
    const ref = 'OD-' + Date.now().toString(36).slice(-5).toUpperCase();
    const msg = [
      `Hi ${BIZ.name}! New order ${ref}`,
      `*Delivery* to ${d.city.trim()} (${t.zone.name})`,
      '',
      ...state.lines.map((l) => `• ${l.qty}× ${nameOf(l)}: ${describe(l)} = ${rs(unitPrice(l) * l.qty)}`),
      '',
      `Subtotal: ${rs(t.sub)}`,
      `Delivery: ${t.fee ? rs(t.fee) : 'Free'}`,
      t.gift ? `Gift wrap: ${rs(t.gift)}` : null,
      `*Total: ${rs(t.total)}*`,
      `Payment: ${d.pay}`,
      t.gift && (d.giftmsg || '').trim() ? `Card message: "${d.giftmsg.trim()}"` : null,
      '',
      `Name: ${d.name.trim()}`,
      `Phone: ${d.phone.trim()}`,
      `Address: ${d.address.trim()}, ${d.city.trim()}`,
      d.note.trim() ? `Note: ${d.note.trim()}` : null,
    ].filter((x) => x !== null).join('\n');

    const url = `${waBase}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener');
    $('#doneName').textContent = d.name.trim().split(' ')[0];
    $('#doneRef').textContent = ref;
    $('#doneLink').href = url;
    $('#orderView').hidden = true; $('#doneView').hidden = false; $('#drawerFoot').hidden = true;
    state.lines = []; state.gift = false; save(); renderCart();
    $('#giftCheck').checked = false; $('#giftNote').hidden = true;
    form.elements.note.value = ''; form.elements.giftmsg.value = '';
  }
  $('#newOrder').addEventListener('click', () => {
    $('#orderView').hidden = false; $('#doneView').hidden = true; $('#drawerFoot').hidden = false;
    closeCart(); scrollToEl($('#shop'));
  });

  // ---------- Reviews ----------
  $('#bars').innerHTML = [[5, 86], [4, 10], [3, 3], [2, 1], [1, 0]]
    .map(([s, p]) => `<li><span>${s} ★</span><i><b style="--w:${p / 100}"></b></i><span>${p}%</span></li>`).join('');
  $('#reviewsList').innerHTML = window.REVIEWS.map((r, i) => `
    <figure class="review reveal" style="--d:${(i % 3) * 80}ms">
      <span class="stars" style="--v:${r.stars}" aria-label="${r.stars} out of 5"></span>
      <blockquote>“${esc(r.text)}”</blockquote>
      <figcaption><b>${esc(r.name)}</b><span>${esc(r.city)} · ${esc(r.scent)}</span></figcaption>
    </figure>`).join('');

  // ---------- Delivery zones + FAQ ----------
  $('#zones').innerHTML = `
    <h3>Delivery</h3>
    ${BIZ.zones.map((z) => `<dl class="zone"><dt>${esc(z.name)}</dt><dd><b>${rs(z.fee)}</b><span>${z.eta}</span></dd></dl>`).join('')}
    <p class="zones__note">Free delivery on orders over <b>${rs(BIZ.freeDeliveryFrom)}</b>. Orders before ${BIZ.dispatch.cutoff - 12} PM (Mon–Sat) ship the same day. <span data-dispatch-long></span></p>
    <a class="btn btn--ghost-dark btn--sm" href="${waBase}" target="_blank" rel="noopener">Ask us on WhatsApp</a>`;
  $('#qa').innerHTML = window.FAQ.map((f, i) => `
    <details class="qa__item" ${i === 0 ? 'open' : ''}><summary>${esc(f.q)}<i aria-hidden="true"></i></summary><p>${esc(f.a)}</p></details>`).join('');

  // ---------- Toast ----------
  const toastEl = $('#toast'); let tt = 0;
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('is-on'), 2200); }
  function bump() { const c = $('#cartCount'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }

  // ---------- Reveal + counters ----------
  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in-view');
    en.target.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(en.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  function countUp(el) {
    const end = +el.dataset.count, div = +(el.dataset.div || 1), t0 = performance.now();
    const stepFn = (t) => {
      const k = Math.min(1, (t - t0) / 1500), v = (end * (1 - Math.pow(1 - k, 4))) / div;
      el.textContent = div > 1 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US');
      if (k < 1) requestAnimationFrame(stepFn);
    };
    requestAnimationFrame(stepFn);
  }

  // ---------- Boot ----------
  renderProducts();
  renderQuiz();
  renderCart();
  updateDispatch();
  setInterval(updateDispatch, 30000);
  $$('.reveal, .score').forEach((el) => io.observe(el));
})();
