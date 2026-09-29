# Hero video: Veo 3 prompt (Overdose)

**Settings:** Veo 3 (Quality, not Fast) · 16:9 · 1080p · 8 s · make 4 variations and keep the one where the glass doesn't bend or morph.

The concept is a slow sideways track along a black marble counter in a dark, oxblood-red perfume studio. It passes an amber bottle and settles on the crimson hero bottle. The subject stays clear of each text panel:
- **Start (0–12 %):** the amber bottle is on the right. The headline sits bottom-left.
- **22–38 %:** the amber bottle glides toward the centre-right. Card 01 is on the left.
- **46–62 %:** the amber bottle is on the left, with mist and petals drifting. Card 02 is on the right.
- **70–82 %:** the crimson bottle enters from the right. Card 03 is on the left.
- **End (88–100 %):** the crimson bottle holds in the upper-middle, with dark glossy counter below it for "Find your dose."

## Prompt

> A single continuous cinematic shot, no cuts, 8 seconds. A dark luxury perfume studio: a long polished black marble counter, a deep oxblood-red haze in the background and one soft warm spotlight from above. On the right of the frame stands a heavy square glass perfume bottle filled with amber liquid, with a tall black cap, a thin gold collar and no label. Fine perfume mist and thin curls of smoke drift slowly through the beam of light, and a few dark red rose petals and saffron threads float down in slow motion. The camera tracks slowly and smoothly to the right along the counter at bottle height, so the amber bottle glides to the left side of the frame, its thick glass refracting the light. A second, taller square glass bottle filled with deep crimson-red liquid, with a black cap, a gold collar and no label, enters from the right. The camera eases to a stop with it in the upper-middle of the frame, above a dark, empty, glossy marble counter that reflects it. Moody high-contrast lighting in deep red, black and warm champagne highlights, photorealistic luxury fragrance commercial, anamorphic lens, shallow depth of field, smooth steady camera. The final second holds almost still. No people, no hands, no text, no labels, no logos, no watermark.

**Negative prompt** (Flow / Vertex): `cuts, scene change, people, faces, hands, text, labels, logos, brand names, watermark, shaky camera, fast motion, morphing, bending glass, melting bottle, liquid changing colour, extra caps`

## Backup prompt (if the main one keeps morphing)

> A single continuous cinematic shot, no cuts, 8 seconds. A heavy square glass perfume bottle filled with deep crimson-red liquid, with a black cap, a thin gold collar and no label, stands on a polished black marble counter in a dark studio with a deep oxblood-red haze behind it. The camera starts wide with the bottle on the right third of the frame and slowly cranes down and pushes in until the bottle sits in the upper-middle of the frame, with dark empty glossy marble below it. Thin smoke curls and fine perfume mist drift through a warm spotlight, and a few rose petals fall in slow motion. Photorealistic luxury fragrance commercial, anamorphic lens, shallow depth of field, smooth steady camera. The final second holds almost still. No people, no hands, no text, no labels, no logos, no watermark.

## Tips
- Reject takes where the bottles change shape, the caps multiply or the liquid changes colour mid-shot.
- Veo sometimes invents a label or brand text on the glass. Reject those takes, because a fake logo on the hero would look like a real designer bottle.
- For a longer scroll, **Extend** once in Flow (16 s), then run `scripts/make-frames.sh video/hero.mp4 15`.
- For tight control, generate the final still first (Imagen or Nano Banana): the crimson bottle upper-middle on black marble. Then use Veo **Frames to video** with that still as the last frame.

## After you download the MP4
Save it as `video/hero.mp4`, then:
```bash
scripts/make-frames.sh video/hero.mp4
scripts/deploy-frames-pages.sh overdose-frames
git add -A && git commit -m "Add hero film" && git push
```
Then retime the chapter windows in `index.html` and write `hero.mobileFocus` in `js/config.js` from the frame sheet.
