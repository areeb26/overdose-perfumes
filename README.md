# Overdose: perfume store

A static site (HTML/CSS/JS, no build step) for an online store that sells extrait-strength perfumes inspired by designer scents. Orders go out as a WhatsApp message, with cash on delivery across Pakistan.

- **Hero:** a scroll-scrubbed Veo film (10 s, 240 frames) that tracks along a marble counter from an amber bottle to the crimson hero bottle. It has four text chapters and a dosing gauge that fills as you scroll. The source video is `video/hero.mp4`, and the frames will be hosted on Cloudflare Pages (`overdose-frames`).
- **Shop:**
  - 12 scents with filters (him, her, unisex, and scent family), search across names, notes and designers, and four sort orders;
  - every card shows the scent it's inspired by, its key notes, and wear and trail meters.
- **Product sheet:**
  - the notes pyramid (top, heart, base), wear and trail, seasons and occasions;
  - three sizes (10 ml tester, 50 ml, 100 ml) and quantity.
- **Scent finder:** four questions (who it's for, vibe, when it's worn, how loud) that return the three best matches with a match score.
- **Sets:**
  - a Discovery Set where the customer picks any five 10 ml testers;
  - three fixed 50 ml bundles with "Save Rs X".
- **Bag and checkout:**
  - three delivery zones with fees and ETAs, and free delivery over Rs 4,000;
  - optional gift wrap with a card message, and cash on delivery, JazzCash/Easypaisa or bank transfer;
  - the order goes out as a pre-written WhatsApp message, and the bag is saved in the browser.
- **Dispatch countdown:** shown in Pakistan time, with a 5 PM same-day cutoff from Monday to Saturday.
- **Also:** reviews, delivery zones, an FAQ, and a footer disclaimer on trademarks.

Run locally: `python3 -m http.server 5184`

Scents, sizes and prices, sets, quiz questions, reviews and FAQ are in `js/data.js`. The name, WhatsApp number, city, dispatch cutoff, delivery zones, the free-delivery threshold and the gift-wrap price are in `js/config.js`.

**Product art:** the bottles are drawn in SVG by `js/bottle.js`. It's one house flacon, and each scent changes only the juice colour and code. When the client has real product photos, add `img: 'assets/img/<id>.webp'` to a scent and the cards use the photo instead.

**Placeholders to confirm with the client:**
- Brand details: logo, city, WhatsApp number.
- The scent line-up and each scent's "inspired by" pairing.
- Prices, set contents, delivery zones and fees, and the dispatch cutoff.
- The 30% oil concentration and the 8–12 hour wear claim.
- Ratings, review counts, "2,800+ orders" and all six reviews, which are samples. For a real client, replace them with real reviews or remove them.
- The rendered bottle art, which stands in for product photos.

**Trademarks:** designer names only describe what each scent is modelled on. Keep the "Inspired by" wording and the footer disclaimer, and never use designer logos or bottle photos of the originals.

## Hero film
1. Generate the film from `VEO_PROMPT.md` and save it as `video/hero.mp4`.
2. Run `scripts/make-frames.sh video/hero.mp4`. This writes the frames, sets the frame count in config and makes the last frame the poster.
3. Run `scripts/deploy-frames-pages.sh overdose-frames`. This hosts the frames on Cloudflare Pages and points `FRAMES_CDN` at them.
4. Retime the chapter windows and `hero.mobileFocus`, then commit, push and run `vercel deploy --prod --yes`.
