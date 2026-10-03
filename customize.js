/*
 * Hadron Group — Customizable home grid
 *
 * Lets users drag tiles to reorder the home screen. Order persists in
 * localStorage so it sticks across sessions on the same device. Cloud-sync
 * the order later if needed by mirroring to profile.preferences.
 *
 * UX
 *   - Long-press any home tile → enters Edit mode (tiles wiggle).
 *   - Or: Settings → "Customize home" → enters Edit mode.
 *   - Drag tiles to rearrange. Drop = saved automatically.
 *   - Tap the floating "Done" pill to exit Edit mode.
 *   - Settings → "Reset to default" wipes the saved order.
 */

(function () {
  'use strict';

  const tr = (k, en) => { const v = (typeof window.t === 'function') ? window.t(k) : null; return v && v !== k ? v : en; };
  const STORAGE_KEY = 'hg_home_order_v1';
  // SortableJS 1.15.2, served by the app itself and precached (sw.js), so moving tiles works offline too.
  const SORTABLE_SRC = './sortable-1.15.2.min.js';
  const LONG_PRESS_MS = 550;

  let sortables = [];
  let editing = false;
  let donePill = null;

  // ── Style injection ─────────────────────────────────────
  const css = `
    .apps-grid.is-editing .app-icon {
      animation: hgWiggle 0.32s ease-in-out infinite alternate;
      cursor: grab;
    }
    .apps-grid.is-editing .app-icon:active { cursor: grabbing; }
    .apps-grid.is-editing.no-drag .app-icon { animation: none; cursor: default; }
    .apps-grid.is-editing .app-icon .icon { box-shadow: 0 6px 18px rgba(0,0,0,0.18); }
    @keyframes hgWiggle {
      0%   { transform: rotate(-1.2deg); }
      100% { transform: rotate(1.2deg); }
    }
    .app-icon.sortable-ghost { opacity: 0.35; }
    .app-icon.sortable-chosen { transform: scale(1.06); transition: transform .15s; }
    .app-icon.sortable-drag   { transform: rotate(0) !important; opacity: 0.95; }
    .hg-customize-pill {
      position: fixed; left: 0; right: 0; margin: 0 auto; width: max-content; max-width: calc(100vw - 32px);   /* centred without left:50% */
      bottom: 90px; z-index: 8500;
      background: var(--accent-ink, #1B77A0);
      color: var(--on-accent, #fff); padding: 10px 22px; border-radius: 999px;
      font-weight: 700; font-size: 14px; cursor: pointer;
      box-shadow: 0 12px 30px rgba(8,12,40,0.35);
      border: none;
    }
    .hg-customize-pill:focus-visible { outline: 3px solid var(--accent-ink, #1B77A0); outline-offset: 3px; }
    .hg-customize-pill:hover { transform: translateY(-1px); }
    body.hg-home-editing .toast { bottom: 160px; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── Sortable.js loader ──────────────────────────────────
  function loadSortable() {
    if (window.Sortable) return Promise.resolve();
    if (window.__hgSortableLoading) return window.__hgSortableLoading;
    window.__hgSortableLoading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = SORTABLE_SRC;
      s.async = true;
      s.onload = res;
      s.onerror = (e) => { window.__hgSortableLoading = null; s.remove(); rej(e); };   // a later try (back online) loads it again
      document.head.appendChild(s);
    });
    return window.__hgSortableLoading;
  }

  // ── Persistence ─────────────────────────────────────────
  // Cloud-first when signed in (profiles.preferences.home_order), with
  // localStorage as a fallback for offline / local-only mode.
  function loadOrder() {
    // Cloud takes priority if a profile is loaded with a saved order.
    const cloud = window.HG_PROFILE?.preferences?.home_order;
    if (Array.isArray(cloud) && cloud.length) return cloud;
    try { const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(v) ? v : []; }   // never let a bad value stop Portal / Team from being placed and role-gated
    catch { return []; }
  }
  function saveOrder(order) {
    const arr = order || [];
    // Always write local — keeps the device usable offline.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    // Mirror to cloud if we're signed in.
    if (window.HG_AUTH && window.HG_AUTH.configured && typeof window.HG_AUTH.setPreference === 'function') {
      window.HG_AUTH.setPreference('home_order', arr).catch(err => {
        console.warn('[HG_CUSTOMIZE] cloud save failed (local copy preserved)', err);
      });
    }
  }
  // Resolves once the cloud's order is cleared (or the write has failed).
  function clearOrder() {
    localStorage.removeItem(STORAGE_KEY);
    if (window.HG_AUTH && window.HG_AUTH.configured && typeof window.HG_AUTH.setPreference === 'function') {
      return Promise.resolve(window.HG_AUTH.setPreference('home_order', null)).catch(() => null);
    }
    return Promise.resolve(null);
  }

  // The home's section grids (home.js); one grid on an older page.
  function getGrids() {
    const grids = Array.from(document.querySelectorAll('[data-home-grid]'));
    if (grids.length) return grids;
    const g = document.querySelector('.apps-grid');
    return g ? [g] : [];
  }

  // One flat order across the sections (the saved format since v1, so existing layouts carry over).
  function readCurrentOrder() {
    const out = [];
    getGrids().forEach(grid => Array.from(grid.children).forEach(el => { const id = el.getAttribute && el.getAttribute('data-app'); if (id) out.push(id); }));
    return out;
  }

  // ── Apply stored order on load ──────────────────────────
  // Within each section: tiles in the stored order first, then any tile not in it (e.g. newly added
  // tiles) in their current relative DOM order. Tiles never move between sections.
  function applyStoredOrder() {
    const stored = loadOrder();
    if (!stored.length) return;
    const rank = new Map(stored.map((id, i) => [id, i]));
    getGrids().forEach(grid => {
      const tiles = Array.from(grid.children).filter(el => el.getAttribute && el.getAttribute('data-app'));
      const known = tiles.filter(el => rank.has(el.getAttribute('data-app')))
        .sort((a, b) => rank.get(a.getAttribute('data-app')) - rank.get(b.getAttribute('data-app')));
      const rest = tiles.filter(el => !rank.has(el.getAttribute('data-app')));
      // a tile placed first (Portal) stays first until the user moves it
      const front = rest.filter(el => el.hasAttribute('data-home-first'));
      front.concat(known, rest.filter(el => !el.hasAttribute('data-home-first'))).forEach(el => grid.appendChild(el));
    });
  }

  // ── Edit mode ───────────────────────────────────────────
  async function enterEditMode() {
    if (editing) return;
    const grids = getGrids();
    if (!grids.length) return;
    // an open search hides the sections: clear it, the tiles are what's being arranged
    const search = document.getElementById('hgHomeSearch');
    if (search && search.value) { search.value = ''; search.dispatchEvent(new Event('input', { bubbles: true })); }
    // SortableJS only moves tiles; pins work without it. Don't keep a person waiting on a bad connection: after 2.5 s
    // Customize opens without it (a later Customize tries again). A tool opened meanwhile is where they are now.
    const shown = document.querySelector('.window.active');
    try { await Promise.race([loadSortable(), new Promise((res) => setTimeout(res, 2500))]); } catch (_) {}
    if (editing) return;   // a second tap while SortableJS was loading
    const now = document.querySelector('.window.active');
    if (now && now !== shown) return;
    // Without SortableJS (offline before it was ever loaded) tiles can't be moved, but pins still work.
    const canDrag = !!(window.Sortable && typeof window.Sortable.create === 'function');
    editing = true;
    document.body.classList.add('hg-home-editing');   // the toast moves up off the Done pill
    document.dispatchEvent(new CustomEvent('hg:home:edit', { detail: { editing: true } }));   // home.js hides Continue / Recent
    if (typeof window.hgArmBack === 'function') window.hgArmBack();   // Back (Esc) ends Customize, not the app (index.html)
    // One sortable list per section: tiles move within their section only.
    sortables = grids.map(grid => {
      grid.classList.add('is-editing');
      grid.classList.toggle('no-drag', !canDrag);
      // While editing, intercept clicks so users don't open windows by accident
      grid.addEventListener('click', blockClickWhileEditing, true);
      if (!canDrag) return null;
      return window.Sortable.create(grid, {
        animation: 180,
        delay: 0,
        filter: '[data-no-reorder], .hg-pin-toggle',   // tiles with this attr stay put; a pin star is tapped, not dragged
        preventOnFilter: false,
        forceFallback: true,             // consistent UX across desktop+mobile
        fallbackTolerance: 5,
        onEnd: () => saveOrder(readCurrentOrder())
      });
    }).filter(Boolean);

    showDonePill();
    if (!canDrag && typeof window.showToast === 'function') window.showToast(tr('home.noDrag', 'Moving tiles needs a connection. Pins still work.'), 3500);
  }

  function exitEditMode() {
    if (!editing) return;
    editing = false;
    document.body.classList.remove('hg-home-editing');
    document.dispatchEvent(new CustomEvent('hg:home:edit', { detail: { editing: false } }));
    if (typeof window.hgDisarmBack === 'function') window.hgDisarmBack();
    getGrids().forEach(grid => {
      grid.classList.remove('is-editing', 'no-drag');
      grid.removeEventListener('click', blockClickWhileEditing, true);
    });
    sortables.forEach(s => { try { s.destroy(); } catch (_) {} });
    sortables = [];
    hideDonePill();
  }

  function blockClickWhileEditing(e) {
    if (!editing) return;
    e.preventDefault();
    e.stopPropagation();
  }

  function showDonePill() {
    if (donePill) return;
    donePill = document.createElement('button');
    donePill.className = 'hg-customize-pill';
    donePill.type = 'button';
    donePill.textContent = '✓ ' + tr('common.done', 'Done');
    donePill.addEventListener('click', exitEditMode);
    document.body.appendChild(donePill);
  }
  function hideDonePill() {
    if (donePill) { donePill.remove(); donePill = null; }
  }
  // A language changed while customizing (Account menu > Settings): the pill follows, like the tiles and stars.
  document.addEventListener('hg:lang:changed', () => { if (donePill) donePill.textContent = '✓ ' + tr('common.done', 'Done'); });

  // ── Long-press detection on any tile ────────────────────
  let pressTimer = null;
  function attachLongPress() {
    getGrids().forEach(attachLongPressTo);
  }
  function attachLongPressTo(grid) {
    grid.addEventListener('pointerdown', (e) => {
      if (editing) return;
      const tile = e.target.closest('.app-icon');
      if (!tile) return;
      pressTimer = setTimeout(() => {
        pressTimer = null;
        // small haptic on supported devices
        if (navigator.vibrate) navigator.vibrate(15);
        enterEditMode();
      }, LONG_PRESS_MS);
    }, { passive: true });
    const cancel = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
    grid.addEventListener('pointerup',     cancel, { passive: true });
    grid.addEventListener('pointermove',   cancel, { passive: true });
    grid.addEventListener('pointercancel', cancel, { passive: true });
    grid.addEventListener('pointerleave',  cancel, { passive: true });
  }

  // ── Public API ──────────────────────────────────────────
  window.HG_HOME = {
    enterEditMode,
    exitEditMode,
    isEditing: () => editing,
    applyOrder: applyStoredOrder,
    resetOrder: () => {
      // Force a clean reload so the original DOM order takes effect. Not before the cloud's order is cleared: the
      // write reads the profile first (supabase-client setPreference), and the profile loaded after the reload would
      // bring the old order back. Offline (or a write that doesn't answer within 5 s): reloaded anyway.
      const done = clearOrder();
      const go = () => location.reload();
      if (navigator.onLine === false) { go(); return; }
      Promise.race([done, new Promise((res) => setTimeout(res, 5000))]).then(go, go);
    },
    saveCurrentOrder: () => saveOrder(readCurrentOrder())
  };

  // Backwards-compatible aliases (so settings buttons can call short names)
  window.hgCustomizeHome = enterEditMode;
  window.hgResetHomeLayout = window.HG_HOME.resetOrder;

  // ── Boot ────────────────────────────────────────────────
  function boot() {
    applyStoredOrder();
    attachLongPress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Re-apply order if other modules add tiles dynamically (e.g. Portal tile).
  document.addEventListener('hg:profile:loaded', () => {
    if (!editing) applyStoredOrder();
  });
})();
