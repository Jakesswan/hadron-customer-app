/*
 * Hadron UI primitives — shared, token-driven components that work in light and dark.
 *
 *   window.hgSheet.open(opts) → ctx
 *     A bottom sheet on phones, a centred dialog on wide screens. Replaces the browser's
 *     alert/confirm/prompt, which can't be styled, translated or made accessible.
 *
 *   opts = {
 *     title:       string (set as text, never HTML),
 *     body:        HTML string (the CALLER escapes any user data) or a DOM Node,
 *     actions:     [{ label, kind: 'primary'|'danger'|'secondary'|'plain', onClick(ctx), keepOpen, focus }],
 *                  the first action is the main one (setBusy relabels it); focus:true marks the
 *                  action that gets focus first (use it to put focus on the SAFE choice when the
 *                  main action is consequential), otherwise the first action does,
 *     dismissible: true  (Esc, a backdrop tap and a 'plain' Cancel close it; not while busy),
 *     role:        'alertdialog' for a message the user didn't ask for (read out in full, not just the title),
 *     focusSheet:  true = focus goes to the sheet, not a button (a key meant for a field can't dismiss it),
 *     onClose()
 *   }
 *   ctx = { el, body, close(), setBody(html|Node), setActions(actions), setBusy(on, label) }
 *
 *   window.hgSheet.closeTop() → 'closed' | 'blocked' | false
 *     Closes the newest open sheet (for the Back button). 'blocked' = it is busy or not dismissible.
 *   Opening / closing a sheet dispatches 'hg:sheet' on document ({ open, count }).
 *
 * Sheets can stack; only the newest one handles keys. Accessibility: role="dialog" + aria-modal,
 * labelled by its title, focus moves in and is trapped while open, and returns to the opener on
 * close. Respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  const CSS = [
    '.hg-sheet-root{position:fixed;inset:0;z-index:9600;display:flex;align-items:flex-end;justify-content:center}',
    '.hg-sheet-backdrop{position:absolute;inset:0;background:rgba(2,6,23,.55)}',
    '.hg-sheet{position:relative;width:100%;max-width:520px;max-height:88vh;overflow:auto;box-sizing:border-box;',
      'background:var(--surface,#1A222F);color:var(--text,#F1F5F9);border:1px solid var(--border,#2D3B4F);border-bottom:0;',
      'border-radius:20px 20px 0 0;padding:10px 20px calc(18px + env(safe-area-inset-bottom,0px));',
      'box-shadow:0 -12px 40px rgba(0,0,0,.35);font-size:15px;line-height:1.5;animation:hgSheetIn .18s ease-out}',
    '@media (min-width:640px){.hg-sheet-root{align-items:center}.hg-sheet{border-radius:18px;border-bottom:1px solid var(--border,#2D3B4F);padding-bottom:20px;margin:16px}.hg-sheet-grab{display:none}}',
    '.hg-sheet-grab{width:40px;height:4px;border-radius:4px;background:var(--border,#2D3B4F);margin:0 auto 12px}',
    '.hg-sheet-title{font-size:19px;font-weight:800;margin:0 0 10px;line-height:1.3;color:var(--text,#F1F5F9)}',
    '.hg-sheet-body{display:grid;gap:12px}',
    '.hg-sheet-body p{margin:0;color:var(--muted,#CBD5E1)}',
    '.hg-sheet [hidden]{display:none!important}',
    '.hg-sheet-actions{display:grid;gap:10px;margin-top:18px}',
    '.hg-sheet-btn{min-height:48px;border-radius:12px;font:inherit;font-weight:800;font-size:15px;cursor:pointer;border:1px solid transparent;padding:0 16px;touch-action:manipulation}',
    '.hg-sheet-btn.primary{background:var(--accent-ink,#1B77A0);color:var(--on-accent,#FFFFFF)}',
    '.hg-sheet-btn.danger{background:var(--danger,#C0392B);color:var(--on-danger,#FFFFFF)}',
    '.hg-sheet-btn.secondary{background:transparent;border-color:var(--border,#2D3B4F);color:var(--text,#F1F5F9)}',
    '.hg-sheet-btn.plain{background:transparent;color:var(--accent-ink,#1B77A0)}',
    '.hg-sheet-btn:disabled{opacity:.6;cursor:progress}',
    '.hg-sheet:focus{outline:none}',
    '.hg-sheet-btn:focus-visible,.hg-sheet-check input:focus-visible{outline:3px solid var(--accent-ink,#1B77A0);outline-offset:2px}',
    '.hg-sheet-note{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:12px;font-weight:700;font-size:14px;line-height:1.45}',
    '.hg-sheet-note.warn{background:rgba(245,166,35,.14);color:var(--warn-ink,#9A6400)}',
    '.hg-sheet-note.ok{background:rgba(52,211,153,.12);color:var(--ok-ink,#157B3A)}',
    '.hg-sheet-note.danger{background:rgba(192,57,43,.10);color:var(--danger-ink,#C0392B)}',
    '.hg-sheet-check{display:flex;gap:12px;align-items:flex-start;padding:4px 0;cursor:pointer;font-size:15px;color:var(--text,#F1F5F9)}',
    '.hg-sheet-check input{width:22px;height:22px;flex:none;margin:1px 0 0;accent-color:var(--danger,#C0392B)}',
    '.hg-sheet-check small{display:block;color:var(--muted,#CBD5E1);font-size:14px}',
    '.hg-sheet-field{display:grid;gap:6px;font-size:14px;font-weight:700;color:var(--text,#F1F5F9)}',
    '.hg-sheet-field input{min-height:48px;box-sizing:border-box;width:100%;padding:0 14px;border-radius:12px;border:1px solid var(--border,#2D3B4F);background:var(--bg,#0F172A);color:var(--text,#F1F5F9);font:inherit;font-weight:500;font-size:16px}',
    '.hg-sheet-field input:focus-visible{outline:3px solid var(--accent-ink,#1B77A0);outline-offset:1px}',
    '.hg-sheet-field input[aria-invalid="true"]{border-color:var(--danger-ink,#C0392B)}',
    '.hg-sheet-hint{margin:0;font-size:13px;color:var(--muted,#CBD5E1)}',
    '@keyframes hgSheetIn{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}',
    '@media (prefers-reduced-motion:reduce){.hg-sheet{animation:none}}'
  ].join('');

  function injectCss() {
    if (document.getElementById('hg-ui-css')) return;
    const s = document.createElement('style');
    s.id = 'hg-ui-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  let seq = 0;
  const stack = [];   // open sheets, newest last

  function open(opts) {
    injectCss();
    const o = Object.assign({ dismissible: true, actions: [] }, opts || {});
    const opener = document.activeElement;
    const titleId = 'hgSheetTitle' + (++seq);
    const me = {};

    const root = document.createElement('div');
    root.className = 'hg-sheet-root';
    root.innerHTML =
      '<div class="hg-sheet-backdrop"></div>' +
      '<div class="hg-sheet" role="dialog" aria-modal="true" aria-labelledby="' + titleId + '">' +
        '<div class="hg-sheet-grab" aria-hidden="true"></div>' +
        '<h2 class="hg-sheet-title" id="' + titleId + '"></h2>' +
        '<div class="hg-sheet-body"></div>' +
        '<div class="hg-sheet-actions"></div>' +
      '</div>';
    root.querySelector('.hg-sheet-title').textContent = o.title || '';
    const panel = root.querySelector('.hg-sheet');
    const bodyEl = root.querySelector('.hg-sheet-body');
    const actEl = root.querySelector('.hg-sheet-actions');
    if (o.role === 'alertdialog') {
      panel.setAttribute('role', 'alertdialog');
      bodyEl.id = titleId + 'b';
      panel.setAttribute('aria-describedby', bodyEl.id);
    }
    let busy = false, closed = false, mainLabel = '', focusBtn = null;

    const ctx = {
      el: root,
      body: bodyEl,
      close: function () {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', onKey, true);
        const i = stack.indexOf(me); if (i >= 0) stack.splice(i, 1);
        root.remove();
        announce(false);
        try { if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus(); } catch (_) {}
        try { if (typeof o.onClose === 'function') o.onClose(); } catch (_) {}
      },
      setBody: function (b) {
        bodyEl.innerHTML = '';
        if (typeof b === 'string') bodyEl.innerHTML = b;
        else if (b) bodyEl.appendChild(b);
      },
      setActions: function (acts) { renderActions(acts); focusFirst(); },
      setBusy: function (on, label) {
        busy = !!on;
        panel.setAttribute('aria-busy', busy ? 'true' : 'false');
        const btns = actEl.querySelectorAll('button');
        btns.forEach(function (b) { b.disabled = busy; });
        // Fields too, so nothing changes mid-action. Only re-enable the ones this call disabled.
        bodyEl.querySelectorAll('input,select,textarea').forEach(function (f) {
          if (busy) { if (!f.disabled) { f.disabled = true; f.setAttribute('data-hg-busy', ''); } }
          else if (f.hasAttribute('data-hg-busy')) { f.disabled = false; f.removeAttribute('data-hg-busy'); }
        });
        const main = actEl.querySelector('button');
        if (main) main.textContent = busy && label ? label : (mainLabel || main.textContent);
      }
    };

    function renderActions(acts) {
      actEl.innerHTML = '';
      focusBtn = null;
      (acts || []).forEach(function (a, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hg-sheet-btn ' + (a.kind || 'secondary');
        b.textContent = a.label;
        if (a.id) b.id = a.id;
        if (i === 0) mainLabel = a.label;
        if (a.focus && !focusBtn) focusBtn = b;
        b.addEventListener('click', async function () {
          if (busy) return;
          try {
            const r = a.onClick ? a.onClick(ctx) : null;
            if (r && typeof r.then === 'function') await r;
          } catch (e) { console.error('[hgSheet] action failed', e); }
          if (!a.keepOpen) ctx.close();
        });
        actEl.appendChild(b);
      });
    }

    function focusables() { return Array.prototype.slice.call(panel.querySelectorAll(FOCUSABLE)); }
    function focusFirst() {
      const f = focusables();
      const target = o.focusSheet ? panel : ((focusBtn && !focusBtn.disabled && focusBtn) || actEl.querySelector('button:not([disabled])') || f[0] || panel);
      if (target === panel) panel.setAttribute('tabindex', '-1');
      try { target.focus(); } catch (_) {}
    }
    function onKey(e) {
      if (closed || stack[stack.length - 1] !== me) return;   // only the newest sheet handles keys
      if (e.key === 'Escape' && o.dismissible && !busy) { e.preventDefault(); ctx.close(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }   // from the sheet itself too (focusSheet)
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }

    me.ctx = ctx;
    me.canDismiss = function () { return o.dismissible && !busy; };
    ctx.setBody(o.body || '');
    renderActions(o.actions);
    root.querySelector('.hg-sheet-backdrop').addEventListener('click', function () { if (o.dismissible && !busy) ctx.close(); });
    document.addEventListener('keydown', onKey, true);
    stack.push(me);
    document.body.appendChild(root);
    focusFirst();
    announce(true);
    return ctx;
  }

  // Lets the app keep the Back button in step (index.html arms a history entry while one is open).
  function announce(opened) {
    try { document.dispatchEvent(new CustomEvent('hg:sheet', { detail: { open: opened, count: stack.length } })); } catch (_) {}
  }

  function closeTop() {
    const top = stack[stack.length - 1];
    if (!top) return false;
    if (!top.canDismiss()) return 'blocked';
    top.ctx.close();
    return 'closed';
  }

  window.hgSheet = { open: open, closeTop: closeTop, count: function () { return stack.length; } };
})();
