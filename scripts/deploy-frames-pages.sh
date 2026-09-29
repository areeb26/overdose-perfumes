#!/usr/bin/env bash
# Host the hero frames on Cloudflare Pages (free, no card, unlimited bandwidth).
# Frames end up at https://<project>.pages.dev/lg/f001.webp
#
# Usage:  scripts/deploy-frames-pages.sh [project-name]
# Needs:  `npx --yes wrangler@4 login` once first.
set -euo pipefail

PROJECT="${1:?usage: scripts/deploy-frames-pages.sh <cloudflare-pages-project>   e.g. overdose-perfumes-frames}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WRANGLER="npx --yes wrangler@4"
cd "$ROOT"

[ -d frames/lg ] || { echo "✗ No frames yet — run scripts/make-frames.sh first" >&2; exit 1; }
cat > frames/_headers <<'H'
/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
H

# --force keeps the project on classic Pages (newer wrangler otherwise redirects to Workers and fails)
$WRANGLER pages project create "$PROJECT" --production-branch main --force >/dev/null 2>&1 || true
$WRANGLER pages deploy frames --project-name "$PROJECT" --branch main --commit-dirty=true

sed -i -E "s#^const FRAMES_CDN = '[^']*';#const FRAMES_CDN = 'https://${PROJECT}.pages.dev';#" js/config.js
echo "✓ Frames live at https://${PROJECT}.pages.dev — js/config.js updated. Commit & push to go live."
