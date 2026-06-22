#!/usr/bin/env bash
# Bump the app version in lockstep across the two places it lives:
#   - sw.js       CACHE_VERSION = 'hadron-vNN'  (forces phones to re-cache on next launch)
#   - index.html  <div class="v">vNN</div>      (the version shown in the app's About panel)
#
# Keeping these two in sync by hand is error-prone, so always bump with this script.
#
# Usage:
#   ./bump-version.sh        # auto-increment the current version by 1
#   ./bump-version.sh 60     # set an explicit version number
set -euo pipefail
cd "$(dirname "$0")"

current=$(grep -oE "hadron-v[0-9]+" sw.js | grep -oE "[0-9]+" | head -1)
if [ -z "${current:-}" ]; then
  echo "ERROR: could not find 'hadron-vNN' in sw.js" >&2
  exit 1
fi

if [ "$#" -ge 1 ]; then next="$1"; else next=$((current + 1)); fi

# sw.js — service-worker cache name (the bit that actually busts the cache)
sed -i -E "s/hadron-v[0-9]+/hadron-v${next}/" sw.js
# index.html — the version users see in the About panel
sed -i -E "s#(<div class=\"v\">)v[0-9]+(</div>)#\1v${next}\2#" index.html

echo "Version bumped: v${current} -> v${next}"
echo "  sw.js       CACHE_VERSION = hadron-v${next}"
echo "  index.html  About panel    = v${next}"
echo
echo "Next:  git add -A && git commit -m \"v${next}\" && git push"
