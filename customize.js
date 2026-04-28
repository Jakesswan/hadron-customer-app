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

  const STORAGE_KEY = 'hg_home_order_v1';
  const SORTABLE_CDN = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js';
  const LONG_PRESS_MS = 550;

  let sortable = null;
  let editing = false;
  let donePill = null;

  // ── Style injection ─────────────────────────────────────
  const css = `
    .apps-grid.is-editing .app-icon {
      animation: hgWiggle 0.32s ease-in-out infinite alternate;
      cursor: grab;
    }
    .apps-grid.is-editing .app-icon:active { cursor: grabbing; }
    .apps-grid.is-editing .app-icon .icon { box-shadow: 0 6px 18px rgba(0,0,0,0.18); }
    @keyframes hgWiggle {
      0%   { transform: rotate(-1.2deg); }
      100% { transform: rotate(1.2deg); }
    }
    .app-icon.sortable-ghost { opacity: 0.35; }
    .app-icon.sortable-chosen { transform: scale(1.06); transition: transform .15s; }
    .app-icon.sortable-drag   { transform: rotate(0) !important; opacity: 0.95; }
    .hg-customize-pill {
      position: fixed; left: 50%; transform: translateX(-50%);
      bottom: 90px; z-index: 8500;
      background: linear-gradient(135deg, #00b1ca, #1a3d9e);
      color: #fff; padding: 10px 22px; border-radius: 999px;
      font-weight: 700; font-size: 14px; cursor: pointer;
      box-shadow: 0 12px 30px rgba(8,12,40,0.35);
      border: none; outline: none;
    }
    .hg-customize-pill:hover { transform: translateX(-50%) translateY(-1px); }
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
      s.src = SORTABLE_CDN;
      s.async = true;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
    return window.__hgSortableLoading;
  }

  // ── Persistence ─────────────────────────────────────────
  function loadOrder() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function saveOrder(order) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order || []));
  }
  function clearOrder() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function getGrid() {
    return document.querySelector('.apps-grid');
  }

  function readCurrentOrder() {
    const grid = getGrid();
    if (!grid) return [];
    return Array.from(grid.children)
      .map(el => el.getAttribute('data-app'))
      .filter(Boolean);
  }

  // ── Apply stored order on load ──────────────────────────
  // Tiles in stored order go first (in order), then any tile not in the
  // stored order (e.g. newly added tiles) is appended in its current
  // DOM position relative to other unsaved tiles.
  function applyStoredOrder() {
    const grid = getGrid();
    if (!grid) return;
    const stored = loadOrder();
    if (!stored.length) return;

    const present = new Map();
    Array.from(grid.children).forEach(el => {
      const id = el.getAttribute('data-app');
      if (id) present.set(id, el);
    });

    // First, tiles in stored order (that still exist in the DOM).
    stored.forEach(id => {
      const el = present.get(id);
      if (el) {
        grid.appendChild(el);
        present.delete(id);
      }
    });
    // Then any leftover (new) tiles, kept in their original relative DOM order.
    present.forEach(el => grid.appendChild(el));
  }

  // ── Edit mode ───────────────────────────────────────────
  async function enterEditMode() {
    if (editing) return;
    const grid = getGrid();
    if (!grid) return;
    await loadSortable();
    if (!window.Sortable) {
      console.warn('[HG_CUSTOMIZE] Sortable.js failed to load');
      return;
    }
    editing = true;
    grid.classList.add('is-editing');

    sortable = window.Sortable.create(grid, {
      animation: 180,
      delay: 0,
      filter: '[data-no-reorder]',     // tiles with this attr stay put
      forceFallback: true,             // consistent UX across desktop+mobile
      fallbackTolerance: 5,
      onEnd: () => saveOrder(readCurrentOrder())
    });

    // While editing, intercept clicks so users don't open windows by accident
    grid.addEventListener('click', blockClickWhileEditing, true);

    showDonePill();
  }

  function exitEditMode() {
    if (!editing) return;
    editing = false;
    const grid = getGrid();
    if (grid) {
      grid.classList.remove('is-editing');
      grid.removeEventListener('click', blockClickWhileEditing, true);
    }
    if (sortable) { sortable.destroy(); sortable = null; }
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
    donePill.textContent = '✓ Done customizing';
    donePill.addEventListener('click', exitEditMode);
    document.body.appendChild(donePill);
  }
  function hideDonePill() {
    if (donePill) { donePill.remove(); donePill = null; }
  }

  // ── Long-press detection on any tile ────────────────────
  let pressTimer = null;
  function attachLongPress() {
    const grid = getGrid();
    if (!grid) return;
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
    resetOrder: () => {
      clearOrder();
      // Force a clean reload so the original DOM order takes effect.
      location.reload();
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
