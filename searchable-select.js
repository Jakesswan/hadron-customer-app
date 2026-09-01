/*
 * Hadron Group — searchable <select> enhancer
 *
 * hgMakeSearchable(elOrId, opts) turns a normal <select> into a type-to-filter
 * combobox WITHOUT changing how the rest of the app uses it: the original
 * <select> stays in the DOM (hidden) and remains the single source of truth for
 * `.value` and the `change` event. Existing code that reads select.value or
 * listens for change keeps working unchanged.
 *
 *  - Options are read LIVE from the <select> every time the panel opens, so a
 *    select whose <option>s are rebuilt (e.g. the Service-Report site list
 *    repopulating on customer change) just works.
 *  - The displayed label re-syncs on the select's `change` event and whenever its
 *    <option>s are replaced (MutationObserver). For a programmatic `select.value = …`
 *    that fires neither, call hgSearchableSync(elOrId) after setting it.
 *  - Idempotent: calling it twice on the same select is a no-op.
 *
 * Both index.html (SR customer/site, add-site modal) and lims.js (sample client)
 * call this. Load order does not matter — callers invoke it at render time.
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function ensureStyle() {
    if (document.getElementById('hg-ss-css')) return;
    const st = document.createElement('style');
    st.id = 'hg-ss-css';
    st.textContent = `
      .hg-ss { position: relative; }
      .hg-ss-input {
        width: 100%; box-sizing: border-box; padding: 8px 30px 8px 10px;
        border: 1px solid var(--border, #ccd3da); border-radius: 8px;
        background: var(--surface, #fff) no-repeat right 9px center;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%237a8794' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
        color: var(--text, #1d262d); font-size: 14px; font-weight: 600; cursor: text;
      }
      .hg-ss-input:focus { outline: 2px solid #3AAEDB; outline-offset: -1px; border-color: #3AAEDB; }
      .hg-ss-panel {
        position: absolute; z-index: 9500; left: 0; right: 0; top: calc(100% + 3px);
        max-height: 240px; overflow-y: auto; background: var(--surface, #fff);
        border: 1px solid var(--border, #ccd3da); border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,.16);
      }
      .hg-ss-opt { padding: 9px 11px; font-size: 14px; color: var(--text, #1d262d); cursor: pointer; }
      .hg-ss-opt:hover, .hg-ss-opt.hg-ss-active { background: rgba(58,174,219,.16); }
      .hg-ss-empty { padding: 10px 11px; font-size: 13px; color: var(--muted, #7a8794); }
    `;
    document.head.appendChild(st);
  }

  window.hgMakeSearchable = function (elOrId, opts) {
    ensureStyle();
    const select = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!select || select.__hgSearchable) return;
    select.__hgSearchable = true;
    opts = opts || {};

    select.style.display = 'none';
    const wrap = document.createElement('div');
    wrap.className = 'hg-ss';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'hg-ss-input';
    input.autocomplete = 'off';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.placeholder = opts.placeholder || 'Type to search…';
    const panel = document.createElement('div');
    panel.className = 'hg-ss-panel';
    panel.style.display = 'none';
    wrap.appendChild(input);
    wrap.appendChild(panel);
    select.parentNode.insertBefore(wrap, select.nextSibling);

    let active = -1;   // highlighted option index within the currently rendered panel

    function selectedLabel() {
      const o = select.options[select.selectedIndex];
      return o ? o.textContent : '';
    }
    function syncInput() { input.value = selectedLabel(); }

    function optionData() {
      return Array.from(select.options).map(o => ({ value: o.value, label: o.textContent, disabled: o.disabled }));
    }
    function renderPanel(filter) {
      const f = (filter || '').trim().toLowerCase();
      const list = optionData().filter(o => !o.disabled && (!f || String(o.label).toLowerCase().includes(f)));
      active = -1;
      panel.innerHTML = list.length
        ? list.map(o => `<div class="hg-ss-opt" data-value="${esc(o.value)}">${esc(o.label)}</div>`).join('')
        : '<div class="hg-ss-empty">No matches</div>';
    }
    function openPanel(filter) { renderPanel(filter || ''); panel.style.display = 'block'; }
    function closePanel() { panel.style.display = 'none'; syncInput(); }
    function choose(value) {
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncInput();
      panel.style.display = 'none';
    }
    function moveActive(delta) {
      const opts = panel.querySelectorAll('.hg-ss-opt');
      if (!opts.length) return;
      active = (active + delta + opts.length) % opts.length;
      opts.forEach((o, i) => o.classList.toggle('hg-ss-active', i === active));
      const el = opts[active];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('focus', () => { openPanel(''); input.select(); });
    input.addEventListener('input', () => openPanel(input.value));
    input.addEventListener('blur', () => setTimeout(closePanel, 130));   // let a panel click land first
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (panel.style.display === 'none') openPanel(input.value); else moveActive(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const opts = panel.querySelectorAll('.hg-ss-opt');
        const pick = active >= 0 ? opts[active] : opts[0];
        if (pick) choose(pick.getAttribute('data-value'));
      } else if (e.key === 'Escape') { panel.style.display = 'none'; syncInput(); input.blur(); }
    });
    panel.addEventListener('mousedown', (e) => {   // mousedown beats the input blur
      const opt = e.target.closest('.hg-ss-opt');
      if (!opt) return;
      e.preventDefault();
      choose(opt.getAttribute('data-value'));
    });

    select.addEventListener('change', syncInput);
    // Re-sync the label when the <option>s are rebuilt externally.
    try { new MutationObserver(syncInput).observe(select, { childList: true }); } catch (_) {}
    syncInput();
  };

  // Re-sync a searchable select's displayed label after a programmatic `.value = …`
  // (which fires no change event). Safe no-op if the select isn't searchable yet.
  window.hgSearchableSync = function (elOrId) {
    const select = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!select || !select.__hgSearchable) return;
    const wrap = select.nextSibling;
    const input = wrap && wrap.querySelector ? wrap.querySelector('.hg-ss-input') : null;
    if (input) { const o = select.options[select.selectedIndex]; input.value = o ? o.textContent : ''; }
  };
})();
