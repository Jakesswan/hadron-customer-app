/*
 * Hadron Group — Cross-platform emoji rendering via Twemoji
 *
 * Replaces emoji characters with inline <img class="emoji"> tags pointing
 * to the maintained jdecked/twemoji SVG set. This makes the same emoji
 * render identically on Windows, macOS, iOS, Android, and any browser —
 * instead of each OS using its own bundled emoji font.
 *
 * Usage
 *   The library auto-parses on DOMContentLoaded. To re-parse after dynamic
 *   content is rendered, call window.hgParseEmoji(rootElement?). It debounces
 *   internally so callers don't have to.
 */

(function () {
  'use strict';

  // Emoji → Hadron Tristroke icon. Twemoji (below) normalises every emoji to an
  // <img class="emoji" alt="…">; we then swap the ones we have a FAITHFUL icon
  // for. Conservative on purpose: ambiguous, coloured-status (colour = meaning),
  // media-control, and no-equivalent emoji are intentionally left as Twemoji.
  // See docs/EMOJI_ICON_MAP.md for what's deliberately not mapped + why.
  const EMOJI_TO_ICON = {
    '💾':'save','📄':'document','➕':'add','✏':'edit','🗑':'delete','⚠':'hazard',
    '📋':'clipboard','🔗':'link','🖨':'print','⚙':'settings','📦':'product','✅':'approve',
    '💊':'dosage','📊':'reports','🔒':'lock','🔓':'unlock','🏭':'manufacturing','📈':'trend_up',
    '🏊':'pool','🎓':'academy','👤':'profile','💬':'chat','📁':'folder','🛒':'purchasing',
    '📍':'location','📷':'camera','📅':'calendar','⬇':'download','⬆':'upload','🔔':'notifications',
    '📞':'phone','📱':'phone','📧':'email','✉':'email','📬':'email','👁':'view','⏳':'hourglass',
    '📒':'document','📝':'document','🔬':'lims','🧬':'lims','🧪':'lims','🧫':'jar_test','⚗':'coa',
    '🔁':'refresh','🎧':'help','🚨':'hazard','🛑':'reject','❌':'reject','🛠':'work_order',
    '🧰':'work_order','🏷':'barcode','👥':'customers','🦺':'shield_check','🛡':'shield_check','📚':'sops'
  };

  // Replace mapped emoji (already Twemoji <img class="emoji">) with the inline
  // Tristroke SVG. Idempotent: re-renders reset to raw emoji → re-parsed → re-swapped.
  function swapToHadronIcons(root) {
    if (!root || !root.querySelectorAll || !window.hadronIcon || !window.HADRON_ICONS) return;
    const imgs = root.querySelectorAll('img.emoji');
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      const raw = img.getAttribute('alt') || '';
      const base = raw ? String.fromCodePoint(raw.codePointAt(0)) : ''; // base char (drops VS16/modifiers)
      const name = EMOJI_TO_ICON[base];
      if (!name || !window.HADRON_ICONS[name]) continue;
      const span = document.createElement('span');
      span.className = 'hg-emoji-ico';
      span.setAttribute('aria-hidden', 'true');
      span.innerHTML = window.hadronIcon(name);
      img.replaceWith(span);
    }
  }

  let pending = null;
  let scheduled = null;

  function ensureScript() {
    if (window.twemoji && typeof window.twemoji.parse === 'function') return Promise.resolve();
    if (window.__twemojiLoading) return window.__twemojiLoading;
    window.__twemojiLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js';
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = resolve;
      s.onerror = () => {
        console.warn('[HG_EMOJI] Twemoji CDN failed to load — falling back to native emoji.');
        reject(new Error('twemoji-load-failed'));
      };
      document.head.appendChild(s);
    });
    return window.__twemojiLoading;
  }

  function doParse(root) {
    if (!window.twemoji) return;
    try {
      window.twemoji.parse(root || document.body, {
        folder: 'svg',
        ext: '.svg',
        base: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/',
        className: 'emoji'
      });
    } catch (e) {
      console.warn('[HG_EMOJI] parse failed', e);
    }
    swapToHadronIcons(root || document.body);
  }

  // Debounced parser — coalesces rapid consecutive calls (e.g. multiple
  // rerender events firing in the same tick) into one parse pass.
  window.hgParseEmoji = function (root) {
    pending = root || document.body;
    if (scheduled) return;
    scheduled = setTimeout(async () => {
      scheduled = null;
      const target = pending;
      pending = null;
      try { await ensureScript(); } catch { return; }
      doParse(target);
    }, 80);
  };

  // Initial parse on DOM ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.hgParseEmoji());
  } else {
    window.hgParseEmoji();
  }

  // Re-parse on key app lifecycle events that re-render chunks of the UI.
  document.addEventListener('hg:profile:loaded', () => window.hgParseEmoji());
  document.addEventListener('hg:lims:synced', () => window.hgParseEmoji());
  document.addEventListener('hg:lang:changed', () => window.hgParseEmoji());

  // Re-parse when any window opens (lazy: scoped to that window only).
  const _origOpen = window.openWindow;
  if (typeof _origOpen === 'function') {
    window.openWindow = function (id) {
      const result = _origOpen.apply(this, arguments);
      const win = document.getElementById('window-' + id);
      if (win) window.hgParseEmoji(win);
      return result;
    };
  }
})();
