/*
 * Overdose admin — email/password against /api/login, content in Neon via /api/content.
 * Publish writes the full store (scents, prices, sets, quiz, filters, reviews, FAQ,
 * business, site copy) so the live Vercel storefront picks it up immediately.
 */
(function () {
  'use strict';

  const TITLES = {
    dash: ['Dashboard', 'Overview'],
    copy: ['Marketing', 'Site copy'],
    scents: ['Catalogue', 'Scents'],
    prices: ['Pricing', 'Size tiers'],
    sets: ['Bundles', 'Sets'],
    quiz: ['Finder', 'Scent finder'],
    filters: ['Shop', 'Filters'],
    reviews: ['Social proof', 'Reviews'],
    faq: ['Support', 'FAQ'],
    business: ['Shop', 'Business'],
  };
  const WHO = ['him', 'her', 'unisex'];
  const FAMILIES = ['fresh', 'aquatic', 'sweet', 'woody', 'oud', 'floral'];
  const SEASONS = ['all', 'summer', 'winter'];
  const MOMENTS = ['day', 'office', 'night', 'wedding', 'summer'];
  const TAGS = ['bestseller', 'new'];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const slug = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'scent';
  const csv = (arr) => (arr || []).join(', ');
  const parseCsv = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
  const rs = (n) => `Rs ${Math.round(+n || 0).toLocaleString('en-PK')}`;

  let state = null;
  let view = 'dash';
  let editingId = null;
  let dirty = false;
  let updatedAt = null;

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
    return data;
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('is-on'), 2400);
  }

  function markDirty() {
    dirty = true;
    $('#dirtyPill').hidden = false;
  }

  function payload() {
    return {
      SCENTS: state.SCENTS,
      SIZES: state.SIZES,
      SETS: state.SETS,
      QUIZ: state.QUIZ,
      FILTERS: state.FILTERS,
      REVIEWS: state.REVIEWS,
      FAQ: state.FAQ,
      business: state.business,
      copy: state.copy,
    };
  }

  async function publish() {
    const btn = $('#publishBtn');
    btn.disabled = true;
    try {
      const res = await api('/api/content', { method: 'PUT', body: JSON.stringify(payload()) });
      dirty = false;
      updatedAt = res.updatedAt;
      $('#dirtyPill').hidden = true;
      toast('Published — live on the storefront');
      if (view === 'dash') render();
    } catch (err) {
      toast(err.message || 'Publish failed');
    } finally {
      btn.disabled = false;
    }
  }

  function showApp() {
    $('#login').hidden = true;
    $('#app').hidden = false;
  }

  function showLogin() {
    $('#login').hidden = false;
    $('#app').hidden = true;
  }

  async function boot() {
    showLogin();
    try {
      await api('/api/me');
      await loadContent();
      showApp();
      render();
    } catch {
      showLogin();
    }
  }

  async function loadContent() {
    const d = await api('/api/content');
    updatedAt = d.updatedAt || null;
    state = {
      SCENTS: d.SCENTS || [],
      SIZES: d.SIZES || { labels: [], std: [], prem: [] },
      SETS: d.SETS || [],
      QUIZ: d.QUIZ || [],
      FILTERS: d.FILTERS || [],
      REVIEWS: d.REVIEWS || [],
      FAQ: d.FAQ || [],
      business: d.business || {},
      copy: d.copy || {},
    };
    dirty = false;
  }

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#loginErr').hidden = true;
    const btn = e.target.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;
    const fd = new FormData(e.target);
    try {
      await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
      });
      await loadContent();
      showApp();
      render();
    } catch (err) {
      $('#loginErr').hidden = false;
      $('#loginErr').textContent = err.message || 'Wrong email or password.';
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  $('#logout').addEventListener('click', async () => {
    try { await api('/api/logout', { method: 'POST', body: '{}' }); } catch {}
    state = null;
    showLogin();
  });

  $('#publishBtn').addEventListener('click', publish);

  $('#nav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    view = btn.dataset.view;
    editingId = null;
    render();
  });

  function render() {
    if (!state) return;
    $$('#nav [data-view]').forEach((b) => b.classList.toggle('is-on', b.dataset.view === view));
    $$('.view').forEach((v) => { v.hidden = v.id !== `view-${view}`; });
    const [eye, title] = TITLES[view];
    $('#topEyebrow').textContent = eye;
    $('#topTitle').textContent = title;
    $('#dirtyPill').hidden = !dirty;

    const map = {
      dash: renderDash,
      copy: renderCopy,
      scents: renderScents,
      prices: renderPrices,
      sets: renderSets,
      quiz: renderQuiz,
      filters: renderFilters,
      reviews: renderReviews,
      faq: renderFaq,
      business: renderBusiness,
    };
    map[view]($(`#view-${view}`));
  }

  function renderDash(el) {
    const from = Math.min(...(state.SIZES.std || [0]), ...(state.SIZES.prem || [0]));
    el.innerHTML = `
      <div class="stats">
        <div class="stat"><b>${state.SCENTS.length}</b><span>Scents</span></div>
        <div class="stat"><b>${state.SETS.length}</b><span>Sets</span></div>
        <div class="stat"><b>${state.REVIEWS.length}</b><span>Reviews</span></div>
        <div class="stat"><b>${rs(from)}</b><span>From price</span></div>
      </div>
      <div class="panel">
        <div class="panel__head"><h2>Live on Vercel</h2></div>
        <p class="hint">Edit any section, then hit <b>Publish live</b>. The storefront loads this content from Neon on every visit.</p>
        <p class="hint" style="margin-top:10px">Last published: <b>${updatedAt ? new Date(updatedAt).toLocaleString() : '—'}</b>
          · WhatsApp <b>+${esc(state.business.whatsapp || '')}</b></p>
      </div>`;
  }

  function renderCopy(el) {
    const c = state.copy || {};
    const fields = [
      ['metaTitle', 'Browser title'],
      ['metaDescription', 'Meta description'],
      ['heroEyebrow', 'Hero eyebrow'],
      ['heroTitle', 'Hero title'],
      ['heroTitleEm', 'Hero title (italic)'],
      ['heroLede', 'Hero lede'],
      ['heroCta1', 'Hero CTA 1'],
      ['heroCta2', 'Hero CTA 2'],
      ['shopEyebrow', 'Shop eyebrow'],
      ['shopTitle', 'Shop title'],
      ['shopTitleEm', 'Shop title (italic)'],
      ['shopLede', 'Shop lede'],
      ['finderEyebrow', 'Finder eyebrow'],
      ['finderTitle', 'Finder title'],
      ['finderTitleEm', 'Finder title (italic)'],
      ['finderLede', 'Finder lede'],
      ['setsEyebrow', 'Sets eyebrow'],
      ['setsTitle', 'Sets title'],
      ['setsTitleEm', 'Sets title (italic)'],
      ['setsLede', 'Sets lede'],
      ['reviewsEyebrow', 'Reviews eyebrow'],
      ['reviewsTitle', 'Reviews title'],
      ['reviewsTitleEm', 'Reviews title (italic)'],
      ['ordersClaim', 'Orders claim (e.g. 2,800+)'],
      ['faqEyebrow', 'FAQ eyebrow'],
      ['faqTitle', 'FAQ title'],
      ['faqTitleEm', 'FAQ title (italic)'],
    ];
    el.innerHTML = `
      <div class="panel">
        <div class="panel__head"><h2>Page copy</h2></div>
        <form class="editor" id="copyForm"></form>
      </div>`;
    const form = $('#copyForm', el);
    form.innerHTML = fields.map(([k, label]) => {
      if (/Lede|Description/.test(k)) {
        return `<label class="field"><span>${label}</span><textarea name="${k}" rows="2">${esc(c[k] || '')}</textarea></label>`;
      }
      return `<label class="field"><span>${label}</span><input name="${k}" value="${esc(c[k] || '')}" /></label>`;
    }).join('') + `<button type="submit" class="btn btn--dark">Update copy</button>`;

    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const next = { ...c };
      fields.forEach(([k]) => { next[k] = String(fd.get(k) || '').trim(); });
      state.copy = next;
      markDirty();
      toast('Copy updated — publish to go live');
    };
  }

  function blankScent() {
    const n = state.SCENTS.length + 1;
    return {
      id: `scent-${n}`, code: `OD ${String(n).padStart(2, '0')}`, name: 'New scent', inspired: '',
      who: 'unisex', family: 'fresh', desc: '',
      notes: { top: [], heart: [], base: [] },
      wear: 4, trail: 3, seasons: ['all'], moments: ['day'], tier: 'std',
      liquid: ['#F4B9A3', '#B0342C'], tags: [], rating: 4.8, count: 0,
    };
  }

  function renderScents(el) {
    if (editingId !== null) {
      const s = editingId === '__new' ? blankScent() : state.SCENTS.find((x) => x.id === editingId);
      if (!s) { editingId = null; return renderScents(el); }
      el.innerHTML = scentEditor(s, editingId === '__new');
      wireScentEditor(el, s, editingId === '__new');
      return;
    }

    el.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2>${state.SCENTS.length} scents</h2>
          <button type="button" class="btn btn--dark btn--sm" id="addScent">Add scent</button>
        </div>
        <div style="overflow-x:auto">
          <table class="table">
            <thead><tr><th>Code</th><th>Name</th><th>Inspired</th><th>Who</th><th>Tier</th><th>Juice</th><th></th></tr></thead>
            <tbody>
              ${state.SCENTS.map((s) => `
                <tr>
                  <td><code>${esc(s.code)}</code></td>
                  <td><b>${esc(s.name)}</b> ${(s.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join(' ')}</td>
                  <td>${esc(s.inspired)}</td>
                  <td>${esc(s.who)}</td>
                  <td>${esc(s.tier)}</td>
                  <td><span class="swatch" style="background:${esc(s.liquid[0])}"></span>
                      <span class="swatch" style="background:${esc(s.liquid[1])}"></span></td>
                  <td class="row-actions">
                    <button type="button" class="btn btn--ghost btn--sm" data-edit="${esc(s.id)}">Edit</button>
                    <button type="button" class="btn btn--danger btn--sm" data-del="${esc(s.id)}">Delete</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    $('#addScent', el).onclick = () => { editingId = '__new'; render(); };
    el.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => { editingId = b.dataset.edit; render(); }; });
    el.querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = () => {
        if (!confirm('Delete this scent?')) return;
        state.SCENTS = state.SCENTS.filter((s) => s.id !== b.dataset.del);
        markDirty();
        render();
      };
    });
  }

  function scentEditor(s, isNew) {
    const seasonChecks = SEASONS.map((v) =>
      `<label><input type="checkbox" name="seasons" value="${v}" ${(s.seasons || []).includes(v) ? 'checked' : ''}/> ${v}</label>`).join('');
    const momentChecks = MOMENTS.map((v) =>
      `<label><input type="checkbox" name="moments" value="${v}" ${(s.moments || []).includes(v) ? 'checked' : ''}/> ${v}</label>`).join('');
    const tagChecks = TAGS.map((v) =>
      `<label><input type="checkbox" name="tags" value="${v}" ${(s.tags || []).includes(v) ? 'checked' : ''}/> ${v}</label>`).join('');

    return `
      <div class="panel">
        <div class="panel__head">
          <h2>${isNew ? 'New scent' : esc(s.name)}</h2>
          <button type="button" class="btn btn--ghost btn--sm" id="backScents">← Back</button>
        </div>
        <form class="editor" id="scentForm">
          <div class="field-row">
            <label class="field"><span>ID (slug)</span><input name="id" value="${esc(s.id)}" ${isNew ? '' : 'readonly'} required /></label>
            <label class="field"><span>Code</span><input name="code" value="${esc(s.code)}" required /></label>
          </div>
          <div class="field-row">
            <label class="field"><span>Name</span><input name="name" value="${esc(s.name)}" required /></label>
            <label class="field"><span>Inspired by</span><input name="inspired" value="${esc(s.inspired)}" /></label>
          </div>
          <div class="field-row field-row--3">
            <label class="field"><span>Who</span>
              <select name="who">${WHO.map((w) => `<option ${s.who === w ? 'selected' : ''}>${w}</option>`).join('')}</select>
            </label>
            <label class="field"><span>Family</span>
              <select name="family">${FAMILIES.map((f) => `<option ${s.family === f ? 'selected' : ''}>${f}</option>`).join('')}</select>
            </label>
            <label class="field"><span>Price tier</span>
              <select name="tier">
                <option value="std" ${s.tier === 'std' ? 'selected' : ''}>std</option>
                <option value="prem" ${s.tier === 'prem' ? 'selected' : ''}>prem</option>
              </select>
            </label>
          </div>
          <label class="field"><span>Description</span><textarea name="desc" rows="3">${esc(s.desc)}</textarea></label>
          <div class="field-row field-row--3">
            <label class="field"><span>Top notes</span><input name="top" value="${esc(csv(s.notes.top))}" /></label>
            <label class="field"><span>Heart notes</span><input name="heart" value="${esc(csv(s.notes.heart))}" /></label>
            <label class="field"><span>Base notes</span><input name="base" value="${esc(csv(s.notes.base))}" /></label>
          </div>
          <div class="field-row field-row--4">
            <label class="field"><span>Wear 1–5</span><input name="wear" type="number" min="1" max="5" value="${s.wear}" /></label>
            <label class="field"><span>Trail 1–5</span><input name="trail" type="number" min="1" max="5" value="${s.trail}" /></label>
            <label class="field"><span>Rating</span><input name="rating" type="number" min="0" max="5" step="0.1" value="${s.rating}" /></label>
            <label class="field"><span>Review count</span><input name="count" type="number" min="0" value="${s.count}" /></label>
          </div>
          <div class="field-row">
            <div class="field"><span>Seasons</span><div class="chips">${seasonChecks}</div></div>
            <div class="field"><span>Moments</span><div class="chips">${momentChecks}</div></div>
          </div>
          <div class="field-row">
            <div class="field"><span>Tags</span><div class="chips">${tagChecks}</div></div>
            <label class="field"><span>Photo path (optional)</span><input name="img" value="${esc(s.img || '')}" placeholder="assets/img/blue-rx.webp" /></label>
          </div>
          <div class="field">
            <span>Juice colours</span>
            <div class="color-pair">
              <input type="color" name="liquid0" value="${esc(s.liquid[0])}" />
              <input type="color" name="liquid1" value="${esc(s.liquid[1])}" />
            </div>
          </div>
          <div class="row-actions">
            <button type="submit" class="btn btn--dark">${isNew ? 'Create scent' : 'Update scent'}</button>
            <button type="button" class="btn btn--ghost" id="cancelScent">Cancel</button>
          </div>
        </form>
      </div>`;
  }

  function wireScentEditor(el, original, isNew) {
    $('#backScents', el).onclick = $('#cancelScent', el).onclick = () => { editingId = null; render(); };
    const nameInput = el.querySelector('[name="name"]');
    const idInput = el.querySelector('[name="id"]');
    if (isNew) nameInput.addEventListener('input', () => { idInput.value = slug(nameInput.value); });

    $('#scentForm', el).onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const next = {
        id: String(fd.get('id')).trim(),
        code: String(fd.get('code')).trim(),
        name: String(fd.get('name')).trim(),
        inspired: String(fd.get('inspired')).trim(),
        who: String(fd.get('who')),
        family: String(fd.get('family')),
        desc: String(fd.get('desc')).trim(),
        notes: { top: parseCsv(fd.get('top')), heart: parseCsv(fd.get('heart')), base: parseCsv(fd.get('base')) },
        wear: +fd.get('wear') || 4,
        trail: +fd.get('trail') || 3,
        seasons: $$('[name="seasons"]:checked', el).map((i) => i.value),
        moments: $$('[name="moments"]:checked', el).map((i) => i.value),
        tier: String(fd.get('tier')),
        liquid: [String(fd.get('liquid0')), String(fd.get('liquid1'))],
        tags: $$('[name="tags"]:checked', el).map((i) => i.value),
        rating: +fd.get('rating') || 0,
        count: +fd.get('count') || 0,
      };
      const img = String(fd.get('img') || '').trim();
      if (img) next.img = img;
      if (!next.seasons.length) next.seasons = ['all'];
      if (!next.moments.length) next.moments = ['day'];

      if (isNew) {
        if (state.SCENTS.some((x) => x.id === next.id)) { toast('That ID already exists'); return; }
        state.SCENTS.push(next);
      } else {
        state.SCENTS[state.SCENTS.findIndex((x) => x.id === original.id)] = next;
      }
      markDirty();
      editingId = null;
      toast(isNew ? 'Scent added' : 'Scent updated');
      render();
    };
  }

  function renderPrices(el) {
    const z = state.SIZES;
    el.innerHTML = `
      <div class="panel">
        <div class="panel__head"><h2>Size labels & tiers</h2></div>
        <form class="editor" id="priceForm">
          <div class="field-row field-row--3">
            ${[0, 1, 2].map((i) => `<label class="field"><span>Label ${i + 1}</span><input name="label${i}" value="${esc(z.labels[i] || '')}" required /></label>`).join('')}
          </div>
          <h3 style="margin-top:8px">Standard tier (Rs)</h3>
          <div class="field-row field-row--3">
            ${[0, 1, 2].map((i) => `<label class="field"><span>${esc(z.labels[i] || `Size ${i + 1}`)}</span><input name="std${i}" type="number" min="0" step="10" value="${z.std[i] || 0}" required /></label>`).join('')}
          </div>
          <h3 style="margin-top:8px">Premium tier (Rs)</h3>
          <div class="field-row field-row--3">
            ${[0, 1, 2].map((i) => `<label class="field"><span>${esc(z.labels[i] || `Size ${i + 1}`)}</span><input name="prem${i}" type="number" min="0" step="10" value="${z.prem[i] || 0}" required /></label>`).join('')}
          </div>
          <button type="submit" class="btn btn--dark">Update prices</button>
        </form>
      </div>`;

    $('#priceForm', el).onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      state.SIZES = {
        labels: [0, 1, 2].map((i) => String(fd.get(`label${i}`)).trim()),
        std: [0, 1, 2].map((i) => +fd.get(`std${i}`)),
        prem: [0, 1, 2].map((i) => +fd.get(`prem${i}`)),
      };
      markDirty();
      toast('Prices updated');
      render();
    };
  }

  function renderSets(el) {
    el.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2>${state.SETS.length} sets</h2>
          <button type="button" class="btn btn--dark btn--sm" id="addSet">Add set</button>
        </div>
        <div class="list-stack" id="setList">
          ${state.SETS.map((set, i) => setCard(set, i)).join('')}
        </div>
      </div>`;

    $('#addSet', el).onclick = () => {
      state.SETS.push({ id: `set-${state.SETS.length + 1}`, name: 'New set', price: 0, was: 0, blurb: '', items: [] });
      markDirty();
      render();
    };

    el.querySelectorAll('[data-save-set]').forEach((btn) => {
      btn.onclick = () => {
        const i = +btn.dataset.saveSet;
        const fd = new FormData(btn.closest('.card-edit').querySelector('form'));
        const kind = fd.get('kind');
        const next = {
          id: String(fd.get('id')).trim(),
          name: String(fd.get('name')).trim(),
          price: +fd.get('price') || 0,
          was: +fd.get('was') || 0,
          blurb: String(fd.get('blurb')).trim(),
        };
        const tag = String(fd.get('tag') || '').trim();
        if (tag) next.tag = tag;
        if (kind === 'build') { next.kind = 'build'; next.pick = +fd.get('pick') || 5; }
        else next.items = parseCsv(fd.get('items'));
        state.SETS[i] = next;
        markDirty();
        toast('Set saved');
        render();
      };
    });
    el.querySelectorAll('[data-del-set]').forEach((btn) => {
      btn.onclick = () => {
        if (!confirm('Delete this set?')) return;
        state.SETS.splice(+btn.dataset.delSet, 1);
        markDirty();
        render();
      };
    });
  }

  function setCard(set, i) {
    const isBuild = set.kind === 'build';
    return `
      <div class="card-edit">
        <div class="card-edit__top">
          <strong>${esc(set.name)}</strong>
          <button type="button" class="btn btn--danger btn--sm" data-del-set="${i}">Delete</button>
        </div>
        <form>
          <div class="field-row">
            <label class="field"><span>ID</span><input name="id" value="${esc(set.id)}" required /></label>
            <label class="field"><span>Name</span><input name="name" value="${esc(set.name)}" required /></label>
          </div>
          <div class="field-row field-row--3">
            <label class="field"><span>Type</span>
              <select name="kind">
                <option value="fixed" ${!isBuild ? 'selected' : ''}>Fixed bundle</option>
                <option value="build" ${isBuild ? 'selected' : ''}>Discovery (pick N)</option>
              </select>
            </label>
            <label class="field"><span>Price (Rs)</span><input name="price" type="number" min="0" value="${set.price}" /></label>
            <label class="field"><span>Was (Rs)</span><input name="was" type="number" min="0" value="${set.was || 0}" /></label>
          </div>
          <div class="field-row">
            <label class="field"><span>Pick count</span><input name="pick" type="number" min="1" value="${set.pick || 5}" /></label>
            <label class="field"><span>Scent IDs</span><input name="items" value="${esc(csv(set.items))}" /></label>
          </div>
          <label class="field"><span>Tag</span><input name="tag" value="${esc(set.tag || '')}" /></label>
          <label class="field"><span>Blurb</span><textarea name="blurb" rows="2">${esc(set.blurb)}</textarea></label>
          <button type="button" class="btn btn--dark btn--sm" data-save-set="${i}">Save set</button>
        </form>
      </div>`;
  }

  function renderQuiz(el) {
    el.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2>${state.QUIZ.length} questions</h2>
          <button type="button" class="btn btn--dark btn--sm" id="addQuiz">Add question</button>
        </div>
        <p class="hint" style="margin-bottom:14px">Options JSON: array of { label, value, hint? }. Value is him/her/any, family id, moment, or trail number.</p>
        <div class="list-stack">
          ${state.QUIZ.map((q, i) => `
            <div class="card-edit">
              <div class="card-edit__top">
                <strong>Q${i + 1}</strong>
                <button type="button" class="btn btn--danger btn--sm" data-del-quiz="${i}">Delete</button>
              </div>
              <form>
                <div class="field-row">
                  <label class="field"><span>Question</span><input name="q" value="${esc(q.q)}" /></label>
                  <label class="field"><span>Key</span><input name="key" value="${esc(q.key)}" /></label>
                </div>
                <label class="field"><span>Options (JSON)</span><textarea name="options" rows="5">${esc(JSON.stringify(q.options, null, 2))}</textarea></label>
                <button type="button" class="btn btn--dark btn--sm" data-save-quiz="${i}">Save question</button>
              </form>
            </div>`).join('')}
        </div>
      </div>`;

    $('#addQuiz', el).onclick = () => {
      state.QUIZ.push({ q: 'New question?', key: 'custom', options: [{ label: 'Option A', value: 'a' }] });
      markDirty();
      render();
    };
    el.querySelectorAll('[data-save-quiz]').forEach((btn) => {
      btn.onclick = () => {
        const i = +btn.dataset.saveQuiz;
        const fd = new FormData(btn.closest('.card-edit').querySelector('form'));
        let options;
        try { options = JSON.parse(String(fd.get('options'))); }
        catch { toast('Options must be valid JSON'); return; }
        state.QUIZ[i] = { q: String(fd.get('q')).trim(), key: String(fd.get('key')).trim(), options };
        markDirty();
        toast('Question saved');
        render();
      };
    });
    el.querySelectorAll('[data-del-quiz]').forEach((btn) => {
      btn.onclick = () => {
        if (!confirm('Delete this question?')) return;
        state.QUIZ.splice(+btn.dataset.delQuiz, 1);
        markDirty();
        render();
      };
    });
  }

  function renderFilters(el) {
    el.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2>${state.FILTERS.length} filters</h2>
          <button type="button" class="btn btn--dark btn--sm" id="addFilter">Add filter</button>
        </div>
        <div class="list-stack">
          ${state.FILTERS.map((f, i) => `
            <div class="card-edit">
              <div class="card-edit__top">
                <strong>${esc(f.label)}</strong>
                <button type="button" class="btn btn--danger btn--sm" data-del-filter="${i}">Delete</button>
              </div>
              <form>
                <div class="field-row">
                  <label class="field"><span>ID</span><input name="id" value="${esc(f.id)}" /></label>
                  <label class="field"><span>Label</span><input name="label" value="${esc(f.label)}" /></label>
                </div>
                <button type="button" class="btn btn--dark btn--sm" data-save-filter="${i}">Save filter</button>
              </form>
            </div>`).join('')}
        </div>
      </div>`;

    $('#addFilter', el).onclick = () => {
      state.FILTERS.push({ id: 'new', label: 'New filter' });
      markDirty();
      render();
    };
    el.querySelectorAll('[data-save-filter]').forEach((btn) => {
      btn.onclick = () => {
        const i = +btn.dataset.saveFilter;
        const fd = new FormData(btn.closest('.card-edit').querySelector('form'));
        state.FILTERS[i] = { id: String(fd.get('id')).trim(), label: String(fd.get('label')).trim() };
        markDirty();
        toast('Filter saved');
        render();
      };
    });
    el.querySelectorAll('[data-del-filter]').forEach((btn) => {
      btn.onclick = () => {
        if (!confirm('Delete this filter?')) return;
        state.FILTERS.splice(+btn.dataset.delFilter, 1);
        markDirty();
        render();
      };
    });
  }

  function renderReviews(el) {
    el.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2>${state.REVIEWS.length} reviews</h2>
          <button type="button" class="btn btn--dark btn--sm" id="addReview">Add review</button>
        </div>
        <div class="list-stack">
          ${state.REVIEWS.map((r, i) => `
            <div class="card-edit">
              <div class="card-edit__top">
                <strong>${esc(r.name)} · ${esc(r.city)}</strong>
                <button type="button" class="btn btn--danger btn--sm" data-del-rev="${i}">Delete</button>
              </div>
              <form>
                <div class="field-row field-row--3">
                  <label class="field"><span>Name</span><input name="name" value="${esc(r.name)}" /></label>
                  <label class="field"><span>City</span><input name="city" value="${esc(r.city)}" /></label>
                  <label class="field"><span>Stars</span><input name="stars" type="number" min="1" max="5" value="${r.stars}" /></label>
                </div>
                <label class="field"><span>Scent / product</span><input name="scent" value="${esc(r.scent)}" /></label>
                <label class="field"><span>Review</span><textarea name="text" rows="2">${esc(r.text)}</textarea></label>
                <button type="button" class="btn btn--dark btn--sm" data-save-rev="${i}">Save review</button>
              </form>
            </div>`).join('')}
        </div>
      </div>`;

    $('#addReview', el).onclick = () => {
      state.REVIEWS.push({ name: 'New customer', city: 'Karachi', scent: '', stars: 5, text: '' });
      markDirty();
      render();
    };
    el.querySelectorAll('[data-save-rev]').forEach((btn) => {
      btn.onclick = () => {
        const i = +btn.dataset.saveRev;
        const fd = new FormData(btn.closest('.card-edit').querySelector('form'));
        state.REVIEWS[i] = {
          name: String(fd.get('name')).trim(),
          city: String(fd.get('city')).trim(),
          scent: String(fd.get('scent')).trim(),
          stars: +fd.get('stars') || 5,
          text: String(fd.get('text')).trim(),
        };
        markDirty();
        toast('Review saved');
        render();
      };
    });
    el.querySelectorAll('[data-del-rev]').forEach((btn) => {
      btn.onclick = () => {
        if (!confirm('Delete this review?')) return;
        state.REVIEWS.splice(+btn.dataset.delRev, 1);
        markDirty();
        render();
      };
    });
  }

  function renderFaq(el) {
    el.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2>${state.FAQ.length} questions</h2>
          <button type="button" class="btn btn--dark btn--sm" id="addFaq">Add FAQ</button>
        </div>
        <div class="list-stack">
          ${state.FAQ.map((f, i) => `
            <div class="card-edit">
              <div class="card-edit__top">
                <strong>Q${i + 1}</strong>
                <button type="button" class="btn btn--danger btn--sm" data-del-faq="${i}">Delete</button>
              </div>
              <form>
                <label class="field"><span>Question</span><input name="q" value="${esc(f.q)}" /></label>
                <label class="field"><span>Answer</span><textarea name="a" rows="3">${esc(f.a)}</textarea></label>
                <button type="button" class="btn btn--dark btn--sm" data-save-faq="${i}">Save FAQ</button>
              </form>
            </div>`).join('')}
        </div>
      </div>`;

    $('#addFaq', el).onclick = () => {
      state.FAQ.push({ q: 'New question?', a: '' });
      markDirty();
      render();
    };
    el.querySelectorAll('[data-save-faq]').forEach((btn) => {
      btn.onclick = () => {
        const i = +btn.dataset.saveFaq;
        const fd = new FormData(btn.closest('.card-edit').querySelector('form'));
        state.FAQ[i] = { q: String(fd.get('q')).trim(), a: String(fd.get('a')).trim() };
        markDirty();
        toast('FAQ saved');
        render();
      };
    });
    el.querySelectorAll('[data-del-faq]').forEach((btn) => {
      btn.onclick = () => {
        if (!confirm('Delete this FAQ?')) return;
        state.FAQ.splice(+btn.dataset.delFaq, 1);
        markDirty();
        render();
      };
    });
  }

  function renderBusiness(el) {
    const b = state.business;
    el.innerHTML = `
      <div class="panel">
        <div class="panel__head"><h2>Shop details</h2></div>
        <form class="editor" id="bizForm">
          <div class="field-row">
            <label class="field"><span>Business name</span><input name="name" value="${esc(b.name || '')}" /></label>
            <label class="field"><span>City</span><input name="city" value="${esc(b.city || '')}" /></label>
          </div>
          <div class="field-row">
            <label class="field"><span>WhatsApp (no +)</span><input name="whatsapp" value="${esc(b.whatsapp || '')}" /></label>
            <label class="field"><span>Phone display</span><input name="phoneDisplay" value="${esc(b.phoneDisplay || '')}" /></label>
          </div>
          <div class="field-row field-row--3">
            <label class="field"><span>Currency</span><input name="currency" value="${esc(b.currency || 'Rs')}" /></label>
            <label class="field"><span>Free delivery from</span><input name="freeDeliveryFrom" type="number" value="${b.freeDeliveryFrom || 0}" /></label>
            <label class="field"><span>Gift wrap (Rs)</span><input name="giftWrap" type="number" value="${b.giftWrap || 0}" /></label>
          </div>
          <div class="field-row">
            <label class="field"><span>Dispatch cutoff hour</span><input name="cutoff" type="number" min="0" max="23" value="${(b.dispatch && b.dispatch.cutoff) || 17}" /></label>
            <label class="field"><span>Timezone</span><input name="timezone" value="${esc(b.timezone || 'Asia/Karachi')}" /></label>
          </div>
          <h3 style="margin-top:8px">Delivery zones</h3>
          ${(b.zones || []).map((z, i) => `
            <div class="field-row field-row--4">
              <label class="field"><span>ID</span><input name="zid${i}" value="${esc(z.id)}" /></label>
              <label class="field"><span>Name</span><input name="zname${i}" value="${esc(z.name)}" /></label>
              <label class="field"><span>Fee</span><input name="zfee${i}" type="number" value="${z.fee}" /></label>
              <label class="field"><span>ETA</span><input name="zeta${i}" value="${esc(z.eta)}" /></label>
            </div>`).join('')}
          <button type="submit" class="btn btn--dark">Update business</button>
        </form>
      </div>`;

    $('#bizForm', el).onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const zones = (b.zones || []).map((_, i) => ({
        id: String(fd.get(`zid${i}`)).trim(),
        name: String(fd.get(`zname${i}`)).trim(),
        fee: +fd.get(`zfee${i}`) || 0,
        eta: String(fd.get(`zeta${i}`)).trim(),
      }));
      state.business = {
        ...b,
        name: String(fd.get('name')).trim(),
        city: String(fd.get('city')).trim(),
        whatsapp: String(fd.get('whatsapp')).trim().replace(/^\+/, ''),
        phoneDisplay: String(fd.get('phoneDisplay')).trim(),
        currency: String(fd.get('currency')).trim() || 'Rs',
        timezone: String(fd.get('timezone')).trim() || 'Asia/Karachi',
        freeDeliveryFrom: +fd.get('freeDeliveryFrom') || 0,
        giftWrap: +fd.get('giftWrap') || 0,
        dispatch: { cutoff: +fd.get('cutoff') || 17, days: (b.dispatch && b.dispatch.days) || [1, 2, 3, 4, 5, 6] },
        zones,
      };
      markDirty();
      toast('Business updated');
      render();
    };
  }

  boot();
})();
