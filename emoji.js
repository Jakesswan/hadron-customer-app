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
