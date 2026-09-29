/*
 * The Overdose house bottle, drawn in SVG so every scent shares one flacon and
 * only the juice colour and label change. Replace with product photos when the
 * client sends them (set `img` on a scent and app.js uses the photo instead).
 *
 * bottleSVG({ code, liquid: [light, dark], size: '50 ml', fill: 0–1 })
 */
(function () {
  let n = 0;
  window.bottleSVG = function ({ code = 'OD', liquid = ['#F4B9A3', '#B0342C'], size = '50 ML', fill = 0.86 } = {}) {
    const id = 'b' + (++n);
    const top = 118 + (1 - fill) * 140; // liquid surface
    return `
<svg class="bottle" viewBox="0 0 200 300" role="img" aria-label="${code} bottle">
  <defs>
    <linearGradient id="${id}j" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${liquid[0]}"/><stop offset="1" stop-color="${liquid[1]}"/></linearGradient>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".18" stop-color="#fff" stop-opacity=".08"/><stop offset=".8" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></linearGradient>
    <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2426"/><stop offset=".35" stop-color="#0d0a0b"/><stop offset=".7" stop-color="#1c1718"/><stop offset="1" stop-color="#050404"/></linearGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a6a3c"/><stop offset=".45" stop-color="#f1d9a8"/><stop offset="1" stop-color="#7a5a30"/></linearGradient>
    <clipPath id="${id}k"><rect x="44" y="96" width="112" height="178" rx="16"/></clipPath>
  </defs>
  <ellipse cx="100" cy="286" rx="70" ry="7" fill="#000" opacity=".28"/>
  <rect x="86" y="80" width="28" height="20" rx="3" fill="${liquid[1]}" opacity=".35"/>
  <rect x="38" y="90" width="124" height="190" rx="20" fill="${liquid[0]}" fill-opacity=".18" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/>
  <g clip-path="url(#${id}k)">
    <rect x="44" y="${top.toFixed(1)}" width="112" height="${(280 - top).toFixed(1)}" fill="url(#${id}j)"/>
    <rect x="44" y="${top.toFixed(1)}" width="112" height="3" fill="#fff" opacity=".35"/>
  </g>
  <rect x="38" y="252" width="124" height="28" rx="12" fill="#fff" opacity=".1"/>
  <rect x="38" y="90" width="124" height="190" rx="20" fill="url(#${id}g)"/>
  <rect x="50" y="104" width="7" height="140" rx="3.5" fill="#fff" opacity=".45"/>
  <rect x="56" y="148" width="88" height="66" rx="2" fill="#F4EEE5"/>
  <text x="100" y="170" text-anchor="middle" font-family="Bodoni Moda, Didot, serif" font-size="10" font-weight="700" letter-spacing="2" fill="#16110F">OVERDOSE</text>
  <line x1="74" y1="178" x2="126" y2="178" stroke="#B5102B" stroke-width="1"/>
  <text x="100" y="193" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="600" fill="#B5102B">${code}</text>
  <text x="100" y="205" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="6" letter-spacing=".6" fill="#6E645C">EXTRAIT · ${size}</text>
  <rect x="76" y="14" width="48" height="66" rx="5" fill="url(#${id}c)"/>
  <rect x="80" y="18" width="4" height="56" rx="2" fill="#fff" opacity=".18"/>
  <rect x="74" y="74" width="52" height="8" rx="2" fill="url(#${id}r)"/>
</svg>`;
  };
})();
