/*
 * Hadron Group — emoji → Hadron Tristroke icons
 *
 * Emoji the app has a faithful icon for are swapped for the inline Tristroke SVG (theme-aware, no
 * download). Every other emoji stays as the phone's own emoji. (Until v155 every emoji was first
 * replaced by a Twemoji image from a CDN: an external script, many image downloads, nothing offline.)
 *
 * Usage
 *   Runs on DOMContentLoaded. To re-run after dynamic content is rendered, call
 *   window.hgParseEmoji(rootElement?). It debounces internally so callers don't have to.
 */

(function () {
  'use strict';

  // Emoji → Hadron Tristroke icon. Conservative on purpose: ambiguous, coloured-status (colour =
  // meaning), media-control and no-equivalent emoji are intentionally left as the phone's emoji.
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
  // One pattern for all mapped emoji, each optionally followed by the emoji presentation selector (VS16).
  const keys = Object.keys(EMOJI_TO_ICON).sort(function (a, b) { return b.length - a.length; });
  const PATTERN = new RegExp('(' + keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\uFE0F?', 'g');
  // Text that must stay text: form controls, code, SVG (an HTML span inside SVG text isn't drawn), and
  // anything editable, also when the emoji sits deeper inside one of them.
  const SKIP = 'script,style,textarea,option,select,code,pre,noscript,title,svg';

  function iconSpan(name) {
    const span = document.createElement('span');
    span.className = 'hg-emoji-ico';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = window.hadronIcon(name);
    return span;
  }

  // Replace mapped emoji inside the text under root with the inline Tristroke SVG. Idempotent: a
  // swapped emoji is no longer text, and re-rendered content (raw emoji again) is swapped again.
  function swapToHadronIcons(root) {
    if (!root || !window.hadronIcon || !window.HADRON_ICONS) return;
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        PATTERN.lastIndex = 0;
        if (!PATTERN.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        if (!p || p.closest(SKIP) || p.isContentEditable) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    nodes.forEach(function (node) {
      const text = node.nodeValue;
      const frag = document.createDocumentFragment();
      let last = 0;
      PATTERN.lastIndex = 0;
      let m;
      while ((m = PATTERN.exec(text))) {
        const name = EMOJI_TO_ICON[m[1]];
        if (!name || !window.HADRON_ICONS[name]) continue;
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        frag.appendChild(iconSpan(name));
        last = m.index + m[0].length;
      }
      if (last === 0) return;
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  let pending = null;
  let scheduled = null;

  // Debounced — coalesces rapid consecutive calls (e.g. several re-render events in one tick) into
  // one pass. A call for the whole page wins over a call for one window.
  window.hgParseEmoji = function (root) {
    const target = root || document.body;
    pending = (pending && (pending === document.body || pending.contains(target))) ? pending
            : (pending && target.contains(pending)) ? target
            : (pending ? document.body : target);
    if (scheduled) return;
    scheduled = setTimeout(function () {
      scheduled = null;
      const t = pending;
      pending = null;
      try { swapToHadronIcons(t); } catch (e) { console.warn('[HG_EMOJI] swap failed', e); }
    }, 80);
  };

  // Initial pass on DOM ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.hgParseEmoji(); });
  } else {
    window.hgParseEmoji();
  }

  // Again on key app lifecycle events that re-render chunks of the UI.
  document.addEventListener('hg:profile:loaded', function () { window.hgParseEmoji(); });
  document.addEventListener('hg:lims:synced', function () { window.hgParseEmoji(); });
  document.addEventListener('hg:lang:changed', function () { window.hgParseEmoji(); });

  // And whenever content with a mapped emoji is added later: a view re-rendered inside an open window, a
  // button label put back after "Saving…", a sheet. Swapped right away, not in a later pass, so the
  // phone's own emoji never shows for a frame (live results while typing, a ticking timer). The swap's
  // own changes add no mapped emoji, so they don't trigger another swap.
  function hasEmoji(s) { PATTERN.lastIndex = 0; return !!s && PATTERN.test(s); }
  function observe() {
    if (!window.MutationObserver || !document.body) return;
    new MutationObserver(function (list) {
      for (let i = 0; i < list.length; i++) {
        const m = list[i];
        for (let j = 0; j < m.addedNodes.length; j++) {
          const n = m.addedNodes[j];
          if ((n.nodeType === 3 || n.nodeType === 1) && hasEmoji(n.textContent)) { const r = n.nodeType === 1 ? n : n.parentNode; if (r && r.isConnected) { try { swapToHadronIcons(r); } catch (e) { console.warn('[HG_EMOJI] swap failed', e); } } }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) observe(); else document.addEventListener('DOMContentLoaded', observe);

  // And when any window opens (scoped to that window).
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
