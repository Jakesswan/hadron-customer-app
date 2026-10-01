#!/usr/bin/env bash
# Bump the app version in lockstep across every place it lives:
#   - sw.js       CACHE_VERSION = 'hadron-vNN'  (forces phones to re-cache on next launch)
#   - index.html  <div class="v">vNN</div>      (the version shown in the app's About panel)
#   - index.html  <script src="name.js?v=NN">   every local script, so a new page can never run with
#   - sw.js       APP_SHELL './name.js?v=NN'    a previous version's cached scripts, and the offline
#                                               precache holds exactly the URLs the page asks for
#
# Keeping these in sync by hand is error-prone, so always bump with this script. It checks
# everything first and only then writes, so a failed run leaves both files untouched.
#
# Usage:
#   ./bump-version.sh        # auto-increment the current version by 1
#   ./bump-version.sh 60     # set an explicit version number
set -euo pipefail
cd "$(dirname "$0")"

current=$(grep -oE "hadron-v[0-9]+" sw.js | grep -oE "[0-9]+" | head -1 || true)
if [ -z "${current:-}" ]; then
  echo "ERROR: could not find 'hadron-vNN' in sw.js" >&2
  exit 1
fi

if [ "$#" -ge 1 ]; then next="$1"; else next=$((10#$current + 1)); fi
if ! [[ "$next" =~ ^[1-9][0-9]*$ ]]; then
  echo "ERROR: the version must be a whole number without leading zeros (got '${next}')" >&2
  exit 1
fi
# Going back (or staying) breaks updates: phones compare versions, a lower one never counts as new.
if [ "$next" -le "$((10#$current))" ] && [ "${FORCE:-}" != "1" ]; then
  echo "ERROR: v${next} is not newer than the current v${current}. Use FORCE=1 to re-run anyway." >&2
  exit 1
fi

# Local scripts loaded by index.html: <script ... src="name.js"> or src="name.js?v=NN" (no path or
# scheme, so CDN scripts are left alone).
scripts=$(grep -oE '<script[^>]* src="[A-Za-z0-9_.-]+\.js(\?v=[0-9]+)?"' index.html \
  | sed -E 's#.* src="([^"?]+)(\?v=[0-9]+)?"#\1#' | sort -u || true)

# 1. Check: every one of them must be in sw.js APP_SHELL (with or without a ?v=).
missing=""
for name in $scripts; do
  grep -qF "'./${name}'" sw.js || grep -qE "'\./$(printf '%s' "$name" | sed 's/[.]/\\./g')\?v=[0-9]+'" sw.js || missing="${missing} ${name}"
done
if [ -n "$missing" ]; then
  echo "ERROR: loaded by index.html but not in sw.js APP_SHELL:${missing}" >&2
  echo "       Add them to APP_SHELL (as './name.js'), then run this again. Nothing was changed." >&2
  exit 1
fi

# 2. Write.
# sw.js — service-worker cache name (the bit that actually busts the cache)
sed -i -E "s/hadron-v[0-9]+/hadron-v${next}/" sw.js
# index.html — the version users see in the About panel
sed -i -E "s#(<div class=\"v\">)v[0-9]+(</div>)#\1v${next}\2#" index.html
# index.html — ?v=NN on every local script tag
sed -i -E "s#(<script[^>]* src=\")([A-Za-z0-9_.-]+\.js)(\?v=[0-9]+)?(\")#\1\2?v=${next}\4#g" index.html
# sw.js — the same files in the precache list (files loaded on demand by plain name, such as
# html5-qrcode.min.js, are not script tags and stay unversioned)
for name in $scripts; do
  re=$(printf '%s' "$name" | sed 's/[.]/\\./g')
  sed -i -E "s#'\./${re}(\?v=[0-9]+)?'#'./${name}?v=${next}'#" sw.js
done

echo "Version bumped: v${current} -> v${next}"
echo "  sw.js       CACHE_VERSION = hadron-v${next}"
echo "  index.html  About panel    = v${next}"
echo "  scripts     ?v=${next} on $(echo "$scripts" | wc -w | tr -d ' ') local script tags and their APP_SHELL entries"
echo
echo "Next: stage the changed files explicitly (never git add -A), commit, push."
