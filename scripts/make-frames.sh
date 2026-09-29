#!/usr/bin/env bash
# Turn the hero video (e.g. your Veo 3 MP4) into the WebP frame sequence the
# site scrubs through, and switch js/config.js from poster mode to frames mode.
#
# Usage:  scripts/make-frames.sh path/to/hero.mp4 [fps]
#   fps defaults to 24 (Veo 3 native). Lower (e.g. 18) = fewer, lighter frames.
set -euo pipefail

VIDEO="${1:?usage: scripts/make-frames.sh video.mp4 [fps]}"
FPS="${2:-24}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

rm -rf frames/lg frames/sm
mkdir -p frames/lg frames/sm

echo "→ Extracting 1920×1080 frames at ${FPS} fps"
ffmpeg -v error -y -i "$VIDEO" -vf "fps=${FPS},scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080" \
  -c:v libwebp -quality 72 -compression_level 6 -start_number 1 frames/lg/f%03d.webp
echo "→ Extracting 1280×720 frames for phones"
ffmpeg -v error -y -i "$VIDEO" -vf "fps=${FPS},scale=1280:720:force_original_aspect_ratio=increase:flags=lanczos,crop=1280:720" \
  -c:v libwebp -quality 70 -compression_level 6 -start_number 1 frames/sm/f%03d.webp

COUNT=$(ls frames/lg | wc -l | tr -d ' ')
[ "$COUNT" -gt 999 ] && { echo "✗ $COUNT frames — too many, pass a lower fps" >&2; exit 1; }

# Last frame doubles as the poster / social preview.
cp "frames/lg/$(printf 'f%03d.webp' "$COUNT")" assets/img/poster.webp

sed -i -E "s/frames: \{ count: [0-9]+,/frames: { count: ${COUNT},/" js/config.js
echo "✓ ${COUNT} frames ($(du -sh frames/lg | cut -f1) desktop, $(du -sh frames/sm | cut -f1) mobile). js/config.js now uses frames mode."
echo "  Next: scripts/deploy-frames-pages.sh <project-name>"
