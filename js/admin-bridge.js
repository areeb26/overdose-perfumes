/*
 * Loads live content from /api/content (Neon via Vercel) and overlays
 * window.SCENTS / SETS / … before app.js boots. Falls back to shipped data.js.
 */
(function () {
  'use strict';

  function apply(d) {
    if (!d) return;
    if (d.SCENTS) window.SCENTS = d.SCENTS;
    if (d.SIZES) window.SIZES = d.SIZES;
    if (d.SETS) window.SETS = d.SETS;
    if (d.QUIZ) window.QUIZ = d.QUIZ;
    if (d.FILTERS) window.FILTERS = d.FILTERS;
    if (d.REVIEWS) window.REVIEWS = d.REVIEWS;
    if (d.FAQ) window.FAQ = d.FAQ;
    if (d.business && window.SITE_CONFIG) window.SITE_CONFIG.business = d.business;
    if (d.copy) applyCopy(d.copy);
  }

  function setText(sel, value) {
    if (value == null || value === '') return;
    document.querySelectorAll(sel).forEach((el) => { el.textContent = value; });
  }

  function setHtml(sel, html) {
    if (html == null || html === '') return;
    document.querySelectorAll(sel).forEach((el) => { el.innerHTML = html; });
  }

  function applyCopy(c) {
    if (c.metaTitle) document.title = c.metaTitle;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && c.metaDescription) desc.setAttribute('content', c.metaDescription);

    setText('[data-copy="heroEyebrow"]', c.heroEyebrow);
    setHtml('[data-copy="heroTitle"]', c.heroTitleEm
      ? `${escapeHtml(c.heroTitle)}<br /><em>${escapeHtml(c.heroTitleEm)}</em>`
      : escapeHtml(c.heroTitle || ''));
    setText('[data-copy="heroLede"]', c.heroLede);
    setText('[data-copy="heroCta1"]', c.heroCta1);
    setText('[data-copy="heroCta2"]', c.heroCta2);

    setText('[data-copy="shopEyebrow"]', c.shopEyebrow);
    setHtml('[data-copy="shopTitle"]', titleEm(c.shopTitle, c.shopTitleEm));
    setText('[data-copy="shopLede"]', c.shopLede);

    setText('[data-copy="finderEyebrow"]', c.finderEyebrow);
    setHtml('[data-copy="finderTitle"]', titleEm(c.finderTitle, c.finderTitleEm));
    setText('[data-copy="finderLede"]', c.finderLede);

    setText('[data-copy="setsEyebrow"]', c.setsEyebrow);
    setHtml('[data-copy="setsTitle"]', titleEm(c.setsTitle, c.setsTitleEm));
    setText('[data-copy="setsLede"]', c.setsLede);

    setText('[data-copy="reviewsEyebrow"]', c.reviewsEyebrow);
    setHtml('[data-copy="reviewsTitle"]', titleEm(c.reviewsTitle, c.reviewsTitleEm));
    setText('[data-copy="ordersClaim"]', c.ordersClaim);

    setText('[data-copy="faqEyebrow"]', c.faqEyebrow);
    setHtml('[data-copy="faqTitle"]', titleEm(c.faqTitle, c.faqTitleEm));
  }

  function titleEm(a, b) {
    if (!a) return '';
    return b ? `${escapeHtml(a)}<br /><em>${escapeHtml(b)}</em>` : escapeHtml(a);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function loadApp() {
    const s = document.createElement('script');
    s.src = 'js/app.js';
    s.defer = true;
    document.body.appendChild(s);
  }

  fetch('/api/content', { credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => { apply(d); })
    .catch(() => {})
    .finally(loadApp);
})();
