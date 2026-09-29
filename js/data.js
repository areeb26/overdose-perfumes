/*
 * Content for Overdose: the scents, sizes, sets, scent-finder questions and
 * reviews. Everything the client might change lives here, so edits never
 * touch app.js. Prices, stats and reviews are samples until the client
 * confirms them (see README → "Placeholders to confirm").
 *
 * Each scent:
 *   code, name, inspired (the designer scent it's modelled on), who: him|her|unisex,
 *   family: fresh|aquatic|sweet|woody|oud|floral, notes {top, heart, base},
 *   wear / trail (1–5: longevity and sillage), seasons, moments, tier (price
 *   row in SIZES), liquid [light, dark] for the bottle art, tags.
 */
(function () {
  // Price rows per tier: 10 ml tester · 50 ml · 100 ml.
  window.SIZES = {
    labels: ['10 ml tester', '50 ml', '100 ml'],
    std: [690, 2290, 3790],
    prem: [790, 2690, 4490],
  };

  window.SCENTS = [
    { id: 'blue-rx', code: 'OD 01', name: 'Blue Rx', inspired: 'Dior Sauvage', who: 'him', family: 'fresh',
      desc: 'Peppery bergamot over a big ambroxan trail. The one people stop you in the lift to ask about.',
      notes: { top: ['Calabrian bergamot', 'Pink pepper'], heart: ['Lavender', 'Geranium', 'Sichuan pepper'], base: ['Ambroxan', 'Cedar', 'Labdanum'] },
      wear: 4, trail: 5, seasons: ['all'], moments: ['day', 'office', 'night'], tier: 'std', liquid: ['#9EC5E8', '#2D5C8C'], tags: ['bestseller'], rating: 4.8, count: 412 },
    { id: 'crown', code: 'OD 02', name: 'Crown', inspired: 'Creed Aventus', who: 'him', family: 'woody',
      desc: 'Smoky pineapple and birch on a mossy, musky base. Boardroom by day, shaadi by night.',
      notes: { top: ['Pineapple', 'Blackcurrant', 'Bergamot'], heart: ['Birch', 'Jasmine', 'Patchouli'], base: ['Oakmoss', 'Musk', 'Ambergris'] },
      wear: 5, trail: 4, seasons: ['all'], moments: ['office', 'night', 'wedding'], tier: 'prem', liquid: ['#D9E6D2', '#5E7A56'], tags: ['bestseller'], rating: 4.9, count: 367 },
    { id: 'nuit-bleue', code: 'OD 03', name: 'Nuit Bleue', inspired: 'Bleu de Chanel', who: 'him', family: 'woody',
      desc: 'Grapefruit and incense over creamy sandalwood. Clean, grown-up, never loud.',
      notes: { top: ['Grapefruit', 'Lemon', 'Mint'], heart: ['Ginger', 'Jasmine', 'Nutmeg'], base: ['Incense', 'Sandalwood', 'Cedar'] },
      wear: 4, trail: 3, seasons: ['all'], moments: ['office', 'day'], tier: 'std', liquid: ['#8FA3C9', '#1F2E57'], tags: [], rating: 4.7, count: 198 },
    { id: 'voltage', code: 'OD 04', name: 'Voltage', inspired: 'YSL Y EDP', who: 'him', family: 'fresh',
      desc: 'Crisp apple and ginger, then sage and a warm amberwood dry-down. Young, sharp, easy.',
      notes: { top: ['Green apple', 'Ginger', 'Bergamot'], heart: ['Sage', 'Juniper', 'Geranium'], base: ['Amberwood', 'Tonka', 'Cedar'] },
      wear: 4, trail: 4, seasons: ['all'], moments: ['day', 'night'], tier: 'std', liquid: ['#B9D7F2', '#3E6FA8'], tags: ['new'], rating: 4.7, count: 121 },
    { id: 'aqua-dose', code: 'OD 05', name: 'Aqua Dose', inspired: 'Acqua di Giò Profumo', who: 'him', family: 'aquatic',
      desc: 'Sea air, bergamot and a smoky incense edge. Built for a Karachi June.',
      notes: { top: ['Marine notes', 'Bergamot'], heart: ['Geranium', 'Sage', 'Rosemary'], base: ['Patchouli', 'Incense', 'Amber'] },
      wear: 3, trail: 3, seasons: ['summer'], moments: ['day', 'office'], tier: 'std', liquid: ['#BFE8EA', '#2F8C94'], tags: [], rating: 4.6, count: 143 },
    { id: 'crystal-rouge', code: 'OD 06', name: 'Crystal Rouge', inspired: 'Baccarat Rouge 540', who: 'unisex', family: 'sweet',
      desc: 'Saffron, jasmine and glowing amberwood. Airy candy-floss warmth that lingers on scarves for days.',
      notes: { top: ['Saffron', 'Jasmine'], heart: ['Amberwood', 'Ambergris'], base: ['Fir resin', 'Cedar'] },
      wear: 5, trail: 5, seasons: ['all'], moments: ['night', 'wedding'], tier: 'prem', liquid: ['#F4B9A3', '#B0342C'], tags: ['bestseller'], rating: 4.9, count: 501 },
    { id: 'liberte', code: 'OD 07', name: 'Liberté', inspired: 'YSL Libre', who: 'her', family: 'floral',
      desc: 'Lavender and orange blossom on a warm vanilla musk. Bold, feminine, a little rebellious.',
      notes: { top: ['Lavender', 'Mandarin', 'Blackcurrant'], heart: ['Orange blossom', 'Jasmine'], base: ['Madagascar vanilla', 'Musk', 'Cedar'] },
      wear: 4, trail: 4, seasons: ['all'], moments: ['day', 'night', 'office'], tier: 'std', liquid: ['#F6DDB4', '#C9892F'], tags: ['bestseller'], rating: 4.8, count: 276 },
    { id: 'belle-vie', code: 'OD 08', name: 'Belle Vie', inspired: 'Lancôme La Vie Est Belle', who: 'her', family: 'sweet',
      desc: 'Pear and blackcurrant into iris, praline and vanilla. Sweet, soft and very compliment-friendly.',
      notes: { top: ['Blackcurrant', 'Pear'], heart: ['Iris', 'Jasmine', 'Orange blossom'], base: ['Praline', 'Vanilla', 'Patchouli'] },
      wear: 4, trail: 4, seasons: ['winter'], moments: ['night', 'wedding'], tier: 'std', liquid: ['#F7C6D3', '#B8577A'], tags: [], rating: 4.7, count: 188 },
    { id: 'mademoiselle', code: 'OD 09', name: 'Mademoiselle', inspired: 'Chanel Coco Mademoiselle', who: 'her', family: 'floral',
      desc: 'Bright orange and rose over clean patchouli. Polished enough for the office, pretty enough for dinner.',
      notes: { top: ['Orange', 'Bergamot'], heart: ['Turkish rose', 'Jasmine', 'Lychee'], base: ['Patchouli', 'Vanilla', 'White musk'] },
      wear: 4, trail: 3, seasons: ['all'], moments: ['office', 'day'], tier: 'std', liquid: ['#F3D2C4', '#C06A56'], tags: [], rating: 4.6, count: 132 },
    { id: 'oud-wood', code: 'OD 10', name: 'Oud Wood', inspired: 'Tom Ford Oud Wood', who: 'unisex', family: 'oud',
      desc: 'Smooth, dry oud with cardamom and sandalwood. Oud for people who think they don’t like oud.',
      notes: { top: ['Rosewood', 'Cardamom', 'Pepper'], heart: ['Oud', 'Sandalwood', 'Vetiver'], base: ['Tonka', 'Amber', 'Vanilla'] },
      wear: 5, trail: 3, seasons: ['winter', 'all'], moments: ['office', 'night', 'wedding'], tier: 'prem', liquid: ['#D8B48A', '#5C3A1E'], tags: [], rating: 4.8, count: 224 },
    { id: 'tobacco-honey', code: 'OD 11', name: 'Tobacco Honey', inspired: 'Tom Ford Tobacco Vanille', who: 'unisex', family: 'sweet',
      desc: 'Pipe tobacco, honeyed vanilla and cocoa. A winter shawl in a bottle.',
      notes: { top: ['Tobacco leaf', 'Spices'], heart: ['Vanilla', 'Cacao', 'Tonka'], base: ['Dried fruits', 'Woody notes'] },
      wear: 5, trail: 4, seasons: ['winter'], moments: ['night', 'wedding'], tier: 'prem', liquid: ['#E6B877', '#7A3F12'], tags: ['new'], rating: 4.8, count: 97 },
    { id: 'leather-dose', code: 'OD 12', name: 'Leather Dose', inspired: 'Tom Ford Ombré Leather', who: 'him', family: 'oud',
      desc: 'Soft black leather, cardamom and jasmine over amber and moss. Heavy in the best way.',
      notes: { top: ['Cardamom'], heart: ['Leather', 'Jasmine sambac'], base: ['Amber', 'Moss', 'Patchouli'] },
      wear: 5, trail: 4, seasons: ['winter'], moments: ['night'], tier: 'std', liquid: ['#C9A391', '#3B2420'], tags: [], rating: 4.7, count: 156 },
  ];

  window.FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'him', label: 'For him' },
    { id: 'her', label: 'For her' },
    { id: 'unisex', label: 'Unisex' },
    { id: 'fresh', label: 'Fresh & aquatic' },
    { id: 'sweet', label: 'Sweet & warm' },
    { id: 'woody', label: 'Woody' },
    { id: 'oud', label: 'Oud & leather' },
    { id: 'floral', label: 'Floral' },
  ];

  // Sets: 'build' lets the customer pick `pick` testers; the rest are fixed 50 ml bundles.
  window.SETS = [
    { id: 'discovery', kind: 'build', name: 'Discovery Set', pick: 5, price: 2490, was: 3450,
      blurb: 'Pick any five scents as 10 ml testers. Wear each for a day, then buy the full bottle of the one you love.',
      tag: 'Start here' },
    { id: 'his-hers', name: 'His & Hers Duo', items: ['blue-rx', 'liberte'], price: 4190, was: 4580,
      blurb: 'Blue Rx and Liberté, 50 ml each, in one black box. The easiest anniversary gift there is.' },
    { id: 'wedding-box', name: 'Shaadi Gift Box', items: ['crystal-rouge', 'oud-wood', 'belle-vie'], price: 6990, was: 7670,
      blurb: 'Three 50 ml showstoppers in a magnetic gift box with a handwritten card.', tag: 'Gift-ready' },
    { id: 'office-trio', name: 'Office Trio', items: ['nuit-bleue', 'aqua-dose', 'voltage'], price: 6190, was: 6870,
      blurb: 'Three clean, office-safe 50 ml scents so you never wear the same one two days running.' },
  ];

  // Scent finder: every answer nudges scores; the top three scents are shown.
  window.QUIZ = [
    { q: 'Who is it for?', key: 'who', options: [
      { label: 'Him', value: 'him' }, { label: 'Her', value: 'her' }, { label: 'Anyone', value: 'any' } ] },
    { q: 'Pick a vibe.', key: 'family', options: [
      { label: 'Fresh & clean', value: 'fresh', hint: 'citrus, sea air' },
      { label: 'Sweet & warm', value: 'sweet', hint: 'vanilla, amber' },
      { label: 'Woody & smoky', value: 'woody', hint: 'cedar, incense' },
      { label: 'Oud & rich', value: 'oud', hint: 'oud, leather' },
      { label: 'Floral', value: 'floral', hint: 'rose, jasmine' } ] },
    { q: 'When will you wear it most?', key: 'moment', options: [
      { label: 'Everyday & office', value: 'office' }, { label: 'Nights out', value: 'night' },
      { label: 'Weddings & events', value: 'wedding' }, { label: 'Summer heat', value: 'summer' } ] },
    { q: 'How loud should it be?', key: 'trail', options: [
      { label: 'Close to the skin', value: 2, hint: 'only people you hug' },
      { label: 'Noticeable', value: 3.5, hint: 'an arm’s length' },
      { label: 'Fills the room', value: 5, hint: 'they’ll know you arrived' } ] },
  ];

  window.REVIEWS = [
    { name: 'Hamza R.', city: 'Lahore', scent: 'Blue Rx · 100 ml', stars: 5, text: 'Wore it to office and two people asked if it was Sauvage. Still on my shirt the next morning.' },
    { name: 'Ayesha K.', city: 'Karachi', scent: 'Crystal Rouge · 50 ml', stars: 5, text: 'Honestly can’t tell it apart on a scarf. Arrived in two days, parcel opened in front of the rider before paying.' },
    { name: 'Bilal S.', city: 'Islamabad', scent: 'Discovery Set', stars: 5, text: 'Best way to try them. Ended up buying Crown and Oud Wood full size.' },
    { name: 'Mahnoor A.', city: 'Faisalabad', scent: 'Liberté · 50 ml', stars: 4, text: 'Lovely and lasts a full uni day. Took off one star because the 50 ml goes too fast!' },
    { name: 'Usman T.', city: 'Multan', scent: 'Tobacco Honey · 100 ml', stars: 5, text: 'Wore it to my brother’s mehndi, got compliments all night. Perfect for winter weddings.' },
    { name: 'Sana M.', city: 'Rawalpindi', scent: 'Shaadi Gift Box', stars: 5, text: 'Gave it as a wedding gift. The box looks far more expensive than it was, and the card was handwritten.' },
  ];

  window.FAQ = [
    { q: 'Are these original designer perfumes?', a: 'No. Overdose makes its own extrait-strength fragrances inspired by famous designer scents. We name the scent each one is modelled on so you know what to expect. We are not affiliated with those brands.' },
    { q: 'How long do they last?', a: 'Every bottle is extrait strength (about 30% perfume oil), so most scents last 8–12 hours on skin and longer on clothes. Each scent shows its wear and trail on the product page.' },
    { q: 'Can I check the parcel before paying?', a: 'Yes. With cash on delivery you can open the parcel in front of the rider, check the bottle and then pay. If anything is broken or leaking, send the rider back and we will re-ship free.' },
    { q: 'How fast is delivery?', a: 'Orders placed before 5 PM (Mon–Sat) ship the same day. Karachi takes 1–2 days, Lahore, Islamabad and Rawalpindi 2–3 days, and the rest of Pakistan 3–5 days.' },
    { q: 'Not sure which one to pick?', a: 'Take the scent finder, or start with the Discovery Set: five 10 ml testers of your choice. You can also message us on WhatsApp for a recommendation.' },
  ];
})();
