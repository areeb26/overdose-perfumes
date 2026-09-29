/*
 * Site configuration — Overdose.
 *
 * hero.frames.count — frames in the hero film. 0 = poster mode until the Veo
 *   video is processed (scripts/make-frames.sh sets it).
 * FRAMES_CDN — Cloudflare Pages URL of the frames (scripts/deploy-frames-pages.sh
 *   sets it). Empty = ./frames.
 * hero.poster — still used until the film exists: pushes in from 1 to `zoom`
 *   toward the focal point (focusX/focusY, 0–1) as the visitor scrolls.
 * hero.mobileFocus — [scroll progress, subject x 0–1] keys the crop follows on
 *   portrait phones (they only see a third of the 16:9 film). The keys follow
 *   the amber bottle as it sweeps left, swing across the empty counter, then
 *   follow the crimson bottle in from the right until it settles in the centre.
 * business.whatsapp — number orders go to (international format, no +).
 * business.dispatch — same-day dispatch cut-off (Pakistan time), Mon–Sat.
 */
const FRAMES_CDN = 'https://overdose-frames.pages.dev';

window.SITE_CONFIG = {
  hero: {
    frames: { count: 240, baseUrl: FRAMES_CDN || './frames', prefix: 'f', pad: 3, ext: 'webp' },
    poster: { src: 'assets/img/poster.webp', focusX: 0.66, focusY: 0.5, zoom: 1.15 },
    mobileFocus: [[0, 0.77], [0.15, 0.77], [0.2, 0.53], [0.25, 0.47], [0.3, 0.33], [0.36, 0.2], [0.42, 0.62], [0.47, 0.86], [0.55, 0.82], [0.6, 0.62], [0.65, 0.58], [0.75, 0.57], [0.8, 0.48], [1, 0.48]],
  },
  business: {
    name: 'Overdose',
    whatsapp: '923472075627',
    phoneDisplay: '0347-2075627',
    city: 'Karachi',
    currency: 'Rs',
    timezone: 'Asia/Karachi',
    dispatch: { cutoff: 17, days: [1, 2, 3, 4, 5, 6] }, // 5 PM, Monday–Saturday
    freeDeliveryFrom: 4000,
    giftWrap: 250,
    zones: [
      { id: 'khi', name: 'Karachi', fee: 200, eta: '1–2 days' },
      { id: 'big', name: 'Lahore · Islamabad · Rawalpindi', fee: 250, eta: '2–3 days' },
      { id: 'pk', name: 'Rest of Pakistan', fee: 300, eta: '3–5 days' },
    ],
  },
};
