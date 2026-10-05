/*
 * Hadron Group — Auth UI
 *
 * Renders the login / signup gate and the session-aware profile card.
 * Activates once supabase-client.js fires hg:supa:ready. Without a configured cloud (a development
 * build) the app runs on this device only; if the sign-in library failed to load, it says so.
 */

(function () {
  'use strict';

  const t = (k, fallback) => (window.t ? window.t(k) : (fallback || k));

  // ── Inject styles ────────────────────────────────────────
  const css = `
    .hg-auth-overlay {
      position: fixed; inset: 0; z-index: 9000;
      background: linear-gradient(135deg, rgba(0,177,202,0.08), rgba(26,61,158,0.12));
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px; overflow-y: auto;
    }
    [data-theme="dark"] .hg-auth-overlay {
      background: linear-gradient(135deg, rgba(8,12,32,0.85), rgba(0,18,48,0.92));
    }
    .hg-auth-card {
      width: 100%; max-width: 400px;
      background: var(--bg-secondary, #ffffff);
      color: var(--text);
      border-radius: 20px;
      box-shadow: 0 30px 80px rgba(8,12,40,0.25);
      padding: 28px 24px;
      border: 1px solid var(--border, rgba(0,0,0,0.08));
    }
    [data-theme="dark"] .hg-auth-card {
      background: rgba(15,22,52,0.92);
      border-color: rgba(255,255,255,0.08);
    }
    .hg-auth-logo {
      display: block;
      height: 56px;
      width: auto;
      max-width: 240px;
      margin: 0 auto 18px;
      object-fit: contain;
    }
    /* Swap to the light-on-dark logo when dark theme is active */
    .hg-auth-logo.dark { display: none; }
    [data-theme="dark"] .hg-auth-logo.light { display: none; }
    [data-theme="dark"] .hg-auth-logo.dark  { display: block; }
    .hg-auth-title { text-align: center; font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .hg-auth-sub   { text-align: center; font-size: 13px; opacity: 0.7; margin: 0 0 22px; }
    .hg-auth-row   { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .hg-auth-row label { font-size: 12px; font-weight: 600; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.04em; }
    .hg-auth-row input {
      padding: 11px 14px; border-radius: 10px;
      border: 1px solid var(--border, rgba(0,0,0,0.12));
      background: var(--surface); color: var(--text);
      font-size: 15px;
    }
    .hg-auth-row input:focus { outline: 2px solid #3AAEDB; outline-offset: 1px; }
    .hg-auth-btn {
      width: 100%; padding: 13px; border-radius: 12px; border: none;
      font-size: 15px; font-weight: 700; cursor: pointer;
      background: var(--accent-ink, #1B77A0); color: var(--on-accent, #fff);
      transition: transform 0.1s ease;
    }
    .hg-auth-btn:hover { transform: translateY(-1px); }
    .hg-auth-btn:disabled { opacity: 0.6; cursor: wait; }
    .hg-auth-btn.ghost {
      background: transparent; color: var(--text);
      border: 1px solid var(--border, rgba(0,0,0,0.15));
    }
    .hg-auth-btn.google {
      background: #fff; color: #1f1f1f;
      border: 1px solid rgba(0,0,0,0.12);
      display: flex; align-items: center; justify-content: center; gap: 10px;
      font-weight: 600;
    }
    .hg-auth-divider {
      display: flex; align-items: center; gap: 12px;
      margin: 18px 0; opacity: 0.6; font-size: 12px; text-transform: uppercase;
    }
    .hg-auth-divider::before, .hg-auth-divider::after {
      content: ""; flex: 1; height: 1px; background: var(--border, rgba(0,0,0,0.12));
    }
    .hg-auth-switch { text-align: center; margin-top: 16px; font-size: 13px; }
    .hg-auth-switch a { color: var(--accent-ink, #1B77A0); cursor: pointer; font-weight: 600; }
    .hg-auth-error {
      margin-top: 12px; padding: 10px 12px; border-radius: 10px;
      background: rgba(220, 53, 69, 0.10); color: var(--danger);
      font-size: 13px; line-height: 1.4;
    }
    .hg-auth-info {
      margin-top: 12px; padding: 10px 12px; border-radius: 10px;
      background: rgba(0,177,202,0.12); color: var(--text);
      font-size: 13px; line-height: 1.4;
    }
    .hg-auth-footer {
      text-align: center; margin-top: 18px; font-size: 11px; opacity: 0.55;
    }
    .hg-sync-pill {
      position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
      z-index: 8000; background: var(--accent-ink, #1B77A0); color: var(--on-accent, #fff);
      padding: 8px 14px; border-radius: 999px; font-size: 12px;
      box-shadow: 0 8px 22px rgba(0,177,202,0.35);
      display: none;
    }
    .hg-sync-pill.show { display: block; }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── State ────────────────────────────────────────────────
  let mode = 'signin';   // 'signin' | 'signup' | 'reset'
  let busy = false;
  let lastError = '';
  let lastInfo  = '';
  let overlay   = null;
  // An e-mail link that had expired or was already used (often opened first by a mail scanner):
  // supabase-js leaves #error=…&error_code=… in the URL and signs nobody in. Shown once (boot).
  let pendingLinkError = null;

  function setError(msg) { lastError = msg || ''; lastInfo = ''; render(); }
  function setInfo(msg)  { lastInfo  = msg || ''; lastError = ''; render(); }
  function clear()       { lastError = ''; lastInfo  = ''; }

  // ── Render ───────────────────────────────────────────────
  function render() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'hg-auth-overlay';
      overlay.setAttribute('id', 'hgAuthOverlay');
      document.body.appendChild(overlay);
    }
    const card = document.createElement('div');
    card.className = 'hg-auth-card';

    const titles = {
      signin: { h1: 'Sign in', sub: 'Welcome back to Hadron Group',     primary: 'Sign in' },
      signup: { h1: 'Create account', sub: 'Join the Hadron Group platform', primary: 'Create account' },
      reset:  { h1: 'Reset password', sub: 'We’ll email you a link',     primary: 'Send reset link' }
    };
    const cfg = titles[mode];

    card.innerHTML = `
      <img class="hg-auth-logo light" src="Hadron_Logo_dark.png" alt="Hadron Group" />
      <img class="hg-auth-logo dark"  src="Hadron_Logo.png" alt="Hadron Group" />
      <h1 class="hg-auth-title">${cfg.h1}</h1>
      <div class="hg-auth-sub">${cfg.sub}</div>

      ${mode === 'signup' ? `
        <div class="hg-auth-row">
          <label>Full name</label>
          <input id="hgAuthName" type="text" autocomplete="name" placeholder="Jane Doe" />
        </div>` : ''}

      <div class="hg-auth-row">
        <label>Email</label>
        <input id="hgAuthEmail" type="email" autocomplete="email" placeholder="you@company.com" />
      </div>

      ${mode !== 'reset' ? `
        <div class="hg-auth-row">
          <label>Password</label>
          <input id="hgAuthPassword" type="password" autocomplete="${mode==='signup'?'new-password':'current-password'}" placeholder="••••••••" />
        </div>` : ''}

      <button class="hg-auth-btn" id="hgAuthSubmit" ${busy?'disabled':''}>
        ${busy ? 'Working…' : cfg.primary}
      </button>

      ${mode !== 'reset' ? `
        <div class="hg-auth-divider">or</div>
        <button class="hg-auth-btn google" id="hgAuthGoogle" ${busy?'disabled':''}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.5 33.4 30 36.5 24 36.5c-7 0-12.5-5.6-12.5-12.5S17 11.5 24 11.5c3.1 0 6 1.1 8.2 3.1l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.2-2.7-.5-4z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15.4 16 19.4 13.5 24 13.5c3.1 0 6 1.1 8.2 3.1l6-6C34.6 7.1 29.6 5 24 5c-7.4 0-13.7 4.2-17.7 9.7z"/>
            <path fill="#FBBC05" d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.7 35.6 27 36.5 24 36.5c-5.9 0-10.9-3.8-12.7-9l-7 5.4C8.3 40.4 15.6 45 24 45z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-.6 2.7-2.2 5-4.4 6.5l6.6 5.4C42.9 35.7 45 30.4 45 24c0-1.4-.2-2.7-.5-4z"/>
          </svg>
          Continue with Google
        </button>
      ` : ''}

      ${lastError ? `<div class="hg-auth-error">${escH(lastError)}</div>` : ''}
      ${lastInfo  ? `<div class="hg-auth-info">${escH(lastInfo)}</div>`   : ''}

      <div class="hg-auth-switch">
        ${mode === 'signin' ? `
          <a id="hgAuthGoSignup">Need an account? Sign up</a>
          &nbsp;·&nbsp;
          <a id="hgAuthGoReset">Forgot password?</a>
        ` : mode === 'signup' ? `
          <a id="hgAuthGoSignin">Already have an account? Sign in</a>
        ` : `
          <a id="hgAuthGoSignin">Back to sign in</a>
        `}
      </div>

      <div class="hg-auth-footer">
        Hadron Group · Customer Interface ·
        <a href="privacy.html" style="color: inherit;">Privacy</a>
      </div>
    `;

    overlay.innerHTML = '';
    overlay.appendChild(card);
    wireEvents();
  }

  function wireEvents() {
    const submit = document.getElementById('hgAuthSubmit');
    const googleBtn = document.getElementById('hgAuthGoogle');

    if (submit) submit.addEventListener('click', onSubmit);
    if (googleBtn) googleBtn.addEventListener('click', onGoogle);

    const goSignup = document.getElementById('hgAuthGoSignup');
    const goReset  = document.getElementById('hgAuthGoReset');
    const goSignin = document.getElementById('hgAuthGoSignin');
    if (goSignup) goSignup.addEventListener('click', () => { mode = 'signup'; clear(); render(); });
    if (goReset)  goReset .addEventListener('click', () => { mode = 'reset';  clear(); render(); });
    if (goSignin) goSignin.addEventListener('click', () => { mode = 'signin'; clear(); render(); });

    ['hgAuthEmail','hgAuthPassword','hgAuthName'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSubmit(); });
    });
  }

  // ── Actions ──────────────────────────────────────────────
  async function onSubmit() {
    if (busy) return;
    const emailEl = document.getElementById('hgAuthEmail');
    const pwEl    = document.getElementById('hgAuthPassword');
    const nameEl  = document.getElementById('hgAuthName');
    const email = (emailEl?.value || '').trim();
    const pw    = (pwEl?.value || '').trim();
    const name  = (nameEl?.value || '').trim();

    if (!email)                              return setError('Email is required.');
    if (mode !== 'reset' && pw.length < 6)   return setError('Password must be at least 6 characters.');

    busy = true; render();
    try {
      if (mode === 'signin') {
        await window.HG_AUTH.signInEmail(email, pw);
        teardown();
      } else if (mode === 'signup') {
        await window.HG_AUTH.signUpEmail(email, pw, name);
        setInfo('Account created. Check your email to confirm, then sign in.');
        mode = 'signin';
      } else if (mode === 'reset') {
        await window.HG_AUTH.sendPasswordReset(email);
        setInfo('Reset link sent. Check your inbox.');
      }
    } catch (err) {
      setError(accountErrorText(err, String(err)));   // e.g. offline: "Couldn't reach the server…"
    } finally {
      busy = false; render();
    }
  }

  async function onGoogle() {
    if (busy) return;
    busy = true; render();
    try {
      await window.HG_AUTH.signInGoogle();
      // Redirect happens; on return we'll hit the auth state listener.
    } catch (err) {
      setError(accountErrorText(err, String(err)));
      busy = false; render();
    }
  }

  function teardown() {
    if (overlay) { overlay.remove(); overlay = null; }
  }

  // ── Public API ──────────────────────────────────────────
  window.HG_AUTH_UI = {
    show()  {
      if (overlay) return;   // already showing: keep what it says (e.g. the expired-link message)
      mode = 'signin'; clear();
      if (pendingLinkError) { lastError = pendingLinkError; pendingLinkError = null; }
      render();
    },
    hide()  { teardown(); },
    isOpen() { return !!overlay; }
  };

  // ── Sync pill ───────────────────────────────────────────
  let pillTimer = null;
  function showSyncPill(text, ms) {
    let pill = document.getElementById('hgSyncPill');
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'hgSyncPill';
      pill.className = 'hg-sync-pill';
      document.body.appendChild(pill);
    }
    pill.textContent = text;
    pill.classList.add('show');
    clearTimeout(pillTimer);   // a newer note gets its full time
    pillTimer = setTimeout(() => pill.classList.remove('show'), ms || 2400);
  }

  document.addEventListener('hg:sync:flushed', (e) => {
    const deadNew = e.detail?.deadNew ?? 0;
    // The top-bar chip shows what is still waiting; a change the server refused gets its own warning.
    if (deadNew) showRejected(deadNew, e.detail?.deadItems || []);
  });

  // Changes the server refused for good (not allowed for this account, or invalid), or that couldn't be
  // sent after several tries: say so plainly and keep it on screen until it's read. The chip's "Synced"
  // only means nothing is waiting to be sent.
  const RECORD_WORDS = {
    service_reports: 'Service report', incidents: 'Incident', sites: 'Site', customers: 'Customer',
    samples: 'Lab sample', sample_results: 'Lab result', jobs: 'Job', equipment: 'Equipment',
    academy_progress: 'Academy progress', push_subscriptions: 'Notification settings', org_invites: 'Team invite'
  };
  const isDenied = function (it) { return it.code === '42501' || /row-level security|permission denied/i.test(it.reason || ''); };
  const isUnreached = function (it) { const s = Number(it.status || 0); return !s || s >= 500 || s === 408 || s === 429; };
  // Until v154 the LIMS sync sent every lab record again on every start, and an operator's or viewer's
  // copies came back refused. Those still queued from before v154 are set aside without a word (the queue
  // marks what it takes in from v154 on); anything queued since is reported.
  const isOldLimsResend = function (it) { return !!it.old && /^(customers|samples|sample_results|lims_\w+)$/.test(it.table || '') && isDenied(it); };
  // A submitted service report's own refusals (migration 0020) come with the server's reason, written for the user (no
  // account may change a submitted report, so "your account isn't allowed" would mislead): it can't be changed (an
  // amendment corrects it), a removed one stays removed, only an owner removes one, it is kept on record.
  const SR_KEPT = /^(A submitted service report|A removed service report|Only the account owner can remove a submitted service report)/;
  const isSrKept = function (it) { return it.table === 'service_reports' && it.code === '42501' && SR_KEPT.test(String(it.reason || '')); };
  function rejectedContent(n, items) {
    const one = n === 1;
    const kinds = [];
    items.forEach(function (it) {
      const w = RECORD_WORDS[it.table] || (/^lims_/.test(it.table || '') ? 'LIMS record' : 'Record');
      if (kinds.indexOf(w) < 0) kinds.push(w);
    });
    const kept = items.filter(isSrKept), rest = items.filter(function (it) { return !isSrKept(it); });
    const all = function (f) { return items.length > 0 && items.every(f); };
    const allRest = function (f) { return rest.length > 0 && rest.every(f); };
    const unreached = all(isUnreached), denied = allRest(isDenied), deletes = allRest(function (it) { return it.kind === 'delete'; });
    const msg = unreached
      ? (one ? 'One change from this phone' : n + ' changes from this phone') + ' couldn’t be sent after several tries, so ' + (one ? 'it wasn’t' : 'they weren’t') + ' saved.'
      : (one ? 'One change from this phone was' : n + ' changes from this phone were') + ' refused by the server, so ' + (one ? 'it wasn’t' : 'they weren’t') + ' saved.';
    const oneRest = rest.length ? rest.length === 1 : one;   // said of the rest only
    const why = denied && deletes
      ? 'Your account isn’t allowed to delete ' + (oneRest ? 'it, so it stays' : 'them, so they stay') + ' on the server. Ask your company’s admin if you need to.'
      : denied
      ? 'Your account isn’t allowed to make ' + (oneRest ? 'this change' : 'these changes') + '. Ask your company’s admin if you need to.'
      : 'Open the item, check it, and make the change again. If it keeps happening, contact Hadron support.';
    // the server's reasons, each once; for a refused change, how a submitted report is corrected
    const said = [];
    kept.forEach(function (it) { const r = String(it.reason).trim(); if (said.indexOf(r) < 0) said.push(r); });
    const keptWhy = said.join(' ') + (kept.some(function (it) { return /^A submitted service report can/.test(String(it.reason)); })
      ? ' To correct a submitted report, open it and tap “✎ Amend this report”.' : '');
    return {
      title: one ? 'A change wasn’t saved' : n + ' changes weren’t saved',
      body: '<div class="hg-sheet-note danger"><span aria-hidden="true">⚠</span><span>' + escH(msg) + '</span></div>' +
            (kinds.length ? '<p>' + escH(kinds.join(', ')) + '</p>' : '') +
            (kept.length ? '<p>' + escH(keptWhy) + '</p>' : '') +
            (rest.length || !kept.length ? '<p>' + escH(why) + '</p>' : '')
    };
  }
  // One pop-up: while it's open, new refusals are added to it; while another sheet is open (account menu,
  // a form…) it waits and opens when that one closes. Only while the page is being cleared (or sheets
  // aren't available) a 6-second note instead.
  let rejectedCtx = null, rejectedN = 0, rejectedItems = [];
  function showRejected(n, items) {
    if (items.length) { items = items.filter(function (it) { return !isOldLimsResend(it); }); n = items.length; }
    if (!n) return;
    if (!window.hgSheet || window.__hgTenantFrozen) {
      showSyncPill('⚠ ' + (n === 1 ? 'A change wasn’t saved' : n + ' changes weren’t saved'), 6000);
      return;
    }
    rejectedN += n; rejectedItems = rejectedItems.concat(items);
    if (rejectedCtx) { paintRejected(); return; }
    if (typeof window.hgSheet.count === 'function' && window.hgSheet.count() > 0) return;   // opens when that sheet closes (below)
    openRejected();
  }
  function openRejected() {
    const c = rejectedContent(rejectedN, rejectedItems);
    rejectedCtx = window.hgSheet.open({
      title: c.title, body: c.body, role: 'alertdialog', focusSheet: true,
      actions: [{ label: 'OK', kind: 'primary' }],
      onClose: function () { rejectedCtx = null; rejectedN = 0; rejectedItems = []; }
    });
  }
  function paintRejected() {
    const c = rejectedContent(rejectedN, rejectedItems);
    rejectedCtx.el.querySelector('.hg-sheet-title').textContent = c.title;
    rejectedCtx.setBody(c.body);
  }
  document.addEventListener('hg:sheet', function (e) {
    if (!rejectedN || rejectedCtx || !e.detail || e.detail.open || e.detail.count !== 0) return;
    setTimeout(function () {   // a sheet that opens the next one (account menu → sign-out) goes first
      if (!rejectedN || rejectedCtx || window.__hgTenantFrozen || (window.hgSheet && window.hgSheet.count() > 0)) return;
      openRejected();
    }, 350);
  });

  // ── Top bar: company and sync status ────────────────────
  // The chip says whether this phone's changes have reached the server: Synced, "3 to sync", Offline
  // (no connection) or Connecting… (a connection, but the server hasn't confirmed the user yet).
  function word(key, en) {
    if (typeof window.t !== 'function') return en;
    const v = window.t(key);
    return (v && v !== key) ? v : en;
  }
  function refreshSyncChip() {
    const chip = document.getElementById('hgSyncChip'), text = document.getElementById('hgSyncText');
    if (!chip || !text) return;
    const signedIn = !!(window.HG_AUTH && window.HG_AUTH.configured) && !!(window.HG_PROFILE || window.__hgOfflineSession);
    if (!signedIn) { chip.hidden = true; return; }
    let n = 0;
    try { n = (window.HG_DB && typeof window.HG_DB._queueLen === 'function') ? window.HG_DB._queueLen() : 0; } catch (_) {}
    const toSync = word('sync.pending', '{n} to sync').replace('{n}', String(n));
    let state, words, more = '';
    // With changes waiting the count comes first, then the state word ("2 to sync · Offline").
    if (navigator.onLine === false) { state = 'offline'; if (n) { words = toSync; more = ' · ' + word('sync.offline', 'Offline'); } else words = word('sync.offline', 'Offline'); }
    else if (!window.HG_PROFILE) { state = 'offline'; if (n) { words = toSync; more = ' · ' + word('sync.connecting', 'Connecting…'); } else words = word('sync.connecting', 'Connecting…'); }
    else if (n) { state = 'pending'; words = toSync; }
    else { state = 'synced'; words = word('sync.synced', 'Synced'); }
    chip.dataset.state = state;
    if (text.textContent !== words + more) {
      text.textContent = words;
      if (more) { const s = document.createElement('span'); s.className = 'hg-sync-more'; s.textContent = more; text.appendChild(s); }
    }
    chip.hidden = false;
    // On a small phone, when the whole text doesn't fit, the state word is left to the dot (a ring = offline) and
    // to screen readers, instead of being cut off ("2 to sync · Off…").
    chip.classList.remove('hg-sync-compact');
    if (more && text.clientWidth && text.scrollWidth > text.clientWidth + 1) chip.classList.add('hg-sync-compact');
  }
  let chipTimer = 0;
  function refreshSyncChipSoon() {
    if (chipTimer) return;
    chipTimer = setTimeout(function () { chipTimer = 0; refreshSyncChip(); }, 300);
  }
  window.hgRefreshSyncChip = refreshSyncChip;
  ['hg:sync:flushed', 'hg:sync:queued', 'hg:profile:loaded', 'hg:auth:changed', 'hg:lang:changed'].forEach(function (ev) { document.addEventListener(ev, refreshSyncChipSoon); });
  window.addEventListener('resize', refreshSyncChipSoon);   // turned, or a window resized: does the whole text fit now?
  try { if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', refreshSyncChipSoon); } catch (_) {}   // measured again in the app's own font
  window.addEventListener('online', refreshSyncChipSoon);
  window.addEventListener('offline', refreshSyncChipSoon);
  window.addEventListener('storage', function (e) { if (e.key === 'hg_sync_queue_v1' || e.key === null) refreshSyncChipSoon(); });   // another tab

  // The company name in the top bar. Kept on this phone with hg-last-org (and cleared with it), so it
  // also shows when signed in without the server.
  function paintTopOrg(name) {
    const el = document.getElementById('hgTopOrg');
    if (el && el.textContent !== (name || '')) el.textContent = name || '';
  }
  // Signed in without the server: the account button shows the stored session's user instead of "User".
  function paintAccountFromSession() {
    try {
      const s = JSON.parse(localStorage.getItem('hg-auth-v1') || 'null');
      const u = (s && (s.user || (s.currentSession && s.currentSession.user))) || null;
      if (!u) return;
      const full = (u.user_metadata && typeof u.user_metadata.full_name === 'string') ? u.user_metadata.full_name.trim() : '';
      const email = typeof u.email === 'string' ? u.email : '';
      const nameEl = document.getElementById('userName'), avatarEl = document.getElementById('userAvatar');
      if (nameEl) nameEl.textContent = full || (email ? email.split('@')[0] : 'User');
      if (avatarEl) avatarEl.textContent = ((full || email || 'U').trim().charAt(0) || 'U').toUpperCase();
    } catch (_) {}
  }

  // ── Boot logic ──────────────────────────────────────────
  function paintLocalProfile() {
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    const selfService = document.getElementById('profileSelfService');   // account changes need the cloud
    if (selfService) selfService.style.display = 'none';
    set('profileName', 'Local user');
    set('profileEmail', 'local@hadrongrp.com');
    set('profileCompany', 'Hadron Group (local mode)');
    set('profileRole', 'Local — cloud not configured');
    set('profileMemberSince', '—');
  }

  // Until the signed-in user is known, nothing behind the sign-in screen can be seen or tapped: the
  // desktop and any window opened early (a deep link) stay hidden (CSS on .visible / .hg-app-ready).
  function showDesktop(visible) {
    const desktop = document.getElementById('desktop');
    if (desktop) desktop.classList[visible ? 'add' : 'remove']('visible');
    document.body.classList[visible ? 'add' : 'remove']('hg-app-ready');
    if (visible) refreshSyncChipSoon();   // the chip can only be measured once it is on screen
  }

  // The sign-in library is served by the app itself (and precached), so failing to load it means a
  // broken install or cache. Say so, with a way out; never fall back to the app without an account.
  function showStartupError() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'hg-auth-overlay';
      overlay.id = 'hgAuthOverlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML =
      '<div class="hg-auth-card" role="alert">' +
        '<img class="hg-auth-logo light" src="Hadron_Logo_dark.png" alt="Hadron Group" />' +
        '<img class="hg-auth-logo dark" src="Hadron_Logo.png" alt="Hadron Group" />' +
        '<h1 class="hg-auth-title">The app couldn’t start</h1>' +
        '<div class="hg-auth-sub">Part of the app didn’t load. Check your connection, then reload. If it keeps happening, contact Hadron support.</div>' +
        '<button type="button" class="hg-auth-btn" id="hgStartupReload">Reload</button>' +
      '</div>';
    const reload = overlay.querySelector('#hgStartupReload');
    reload.addEventListener('click', function () { location.reload(); });
    try { reload.focus(); } catch (_) {}
  }

  // The user of the session supabase-js keeps in localStorage (hg-auth-v1), even when its token has
  // expired and can't be refreshed right now (offline): that person never signed out.
  function storedSessionUid() {
    try {
      const raw = localStorage.getItem('hg-auth-v1');
      if (!raw) return null;
      const s = JSON.parse(raw);
      const u = (s && (s.user || (s.currentSession && s.currentSession.user))) || null;
      return (u && typeof u.id === 'string' && u.id) || null;
    } catch (_) { return null; }
  }

  function boot(e) {
    if (!window.HG_AUTH || !window.HG_AUTH.configured) {
      if (e && e.detail && e.detail.sdk === false) { showStartupError(); return; }
      // Cloud not configured at all (a development build): run on this device only, no sign-in.
      console.info('[HG_AUTH_UI] Cloud not configured; running locally.');
      paintLocalProfile();
      showDesktop(true);
      return;
    }

    // A sign-in that came back with an error (an expired / already-used e-mail link, often opened
    // first by a mail scanner, or a cancelled Google sign-in): supabase-js leaves error=… in the URL
    // and signs nobody in. Remember a message for it and take the error out of the URL.
    (function () {
      const h = new URLSearchParams((location.hash || '').replace(/^#/, ''));
      const q = new URLSearchParams(location.search || '');
      const has = function (p) { return p.has('error') || p.has('error_code') || p.has('error_description'); };
      if (!has(h) && !has(q)) return;
      const code = (h.get('error_code') || q.get('error_code') || '') + ' ' + (h.get('error_description') || q.get('error_description') || '');
      pendingLinkError = /otp_expired|email link is invalid or has expired/i.test(code)
        ? 'That link has expired or was already used. Sign in, or use “Forgot password?” to get a new link.'
        : 'Sign-in didn’t finish. Please try again.';
      ['error', 'error_code', 'error_description'].forEach(function (k) { q.delete(k); });
      const rest = q.toString();
      try { history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '')); } catch (_) {}
    })();

    // The user whose data this page holds in memory (open forms, caches, autosave timers).
    let pageUid = null;
    function reloadFrozen() {
      if (window.__hgTenantFrozen) return;   // a sign-out / switch is already reloading this page
      window.__hgTenantFrozen = true;
      window.__hgSuppressQueuePersist = true;
      try { location.reload(); } catch (_) {}
    }

    // Signed in on this phone but not (yet) confirmed by the server: say so once. Offline at once; when
    // the phone has a connection, a profile that is merely slow gets a few more seconds first.
    let offlineNoted = false;
    function noteUnconfirmed() {
      if (offlineNoted || window.HG_PROFILE || !pageUid || window.__hgTenantFrozen) return;
      offlineNoted = true;
      const note = navigator.onLine === false
        ? 'You’re offline. Keep working: your changes are saved on this phone and sync when you’re back online.'
        : 'Can’t reach the server right now. Keep working: your changes are saved on this phone and sync once the connection is back.';
      if (typeof window.showToast === 'function') window.showToast(note, 6000);
    }
    // ...and keep trying while the app is in view: a connection can come back without an 'online'
    // event (weak signal, a Wi-Fi login page, the server down), and a still-valid token isn't
    // refreshed (with the event that would retry) for up to an hour.
    let confirmTimer = 0;
    function retryConfirmLater() {
      if (confirmTimer) return;
      confirmTimer = setTimeout(function () {
        confirmTimer = 0;
        if (window.HG_PROFILE || !pageUid || window.__hgTenantFrozen) return;
        if (document.visibilityState === 'hidden') { retryConfirmLater(); return; }
        reconcile().catch(function () {}).then(function () { if (!window.HG_PROFILE) retryConfirmLater(); });
      }, 30000);
    }

    async function reconcile() {
      // Offline with an expired token (or a refresh that failed on a bad connection), getSession()
      // answers null, but the session is still stored: that person never signed out. Keep them
      // signed in on this phone with its data; the session refreshes once the connection is back
      // (the 'online' listener below, or supabase-js's own refresh, which reports back through
      // hg:auth:changed). A session the server rejected is removed by supabase-js, so it can't be
      // used this way. getSession() itself can spend ~25 s retrying that refresh on a dead
      // connection, so with a stored session: offline, don't wait for it; online, wait 4 s at most.
      const stored = storedSessionUid();
      const sessionP = window.HG_AUTH.getSession();
      let session = null;
      if (stored && navigator.onLine === false) sessionP.catch(function () {});
      else session = await (stored ? Promise.race([sessionP, new Promise(function (res) { setTimeout(res, 4000, null); })]) : sessionP);
      let uid = (session && session.user && session.user.id) || null;
      let offline = false;
      // Read again: while getSession() ran, supabase-js may have removed a session the server rejected.
      if (!uid) { const still = storedSessionUid(); if (still) { uid = still; offline = true; } }
      // Signed out or switched user in ANOTHER tab: this page still holds the previous user's data
      // in memory, so reload instead of carrying it into the next session.
      if (pageUid && uid !== pageUid) {
        reloadFrozen();
        if (!uid) showDesktop(false);
        return;
      }
      if (uid) {
        teardown();
        // Make sure THIS user's data is what's live before anything is shown. Keyed on the session's
        // user id, so it holds even when the profile fetch fails (offline). True = reloading.
        if (await hgEnsureUser(uid)) return;
        pageUid = uid;
        // The organisation this phone's data belongs to, until the profile confirms it: another tab
        // that finds the account in a different organisation then reloads this one too.
        if (!pageOrg) pageOrg = lastOrg();
        // Resolve the profile (role) BEFORE revealing the desktop, so role-gated UI (data-roles
        // tiles like the admin-only Data Manager, plus owner-only controls) is correct on first
        // paint instead of flashing for a beat while the profile loads. Bounded by a timeout so a
        // slow/stalled profile fetch can NEVER block the reveal — on timeout the desktop shows and
        // refreshProfileCard applies role visibility the moment it lands. On a token-refresh
        // reconcile the desktop is already visible, so showDesktop(true) below just re-asserts it.
        if (!offline) { try { await Promise.race([refreshProfileCard(), new Promise(res => setTimeout(res, 2000))]); } catch (_) {} }
        if (!window.HG_PROFILE) {
          // Not confirmed by the server (offline, or the profile didn't load in time): show what the last
          // confirmed role may see (none known → what everyone sees), and queue every change under this
          // phone's organisation instead of trying the network first (__hgOfflineSession: supabase-client,
          // lims-sync, index.html). refreshProfileCard clears it once the server confirms the user.
          window.__hgOfflineSession = true;
          let role = '', orgName = '';
          try { role = localStorage.getItem('hg-last-role') || ''; orgName = localStorage.getItem('hg-last-org-name') || ''; } catch (_) {}
          applyRole(role);
          paintTopOrg(orgName);
          paintAccountFromSession();
        }
        showDesktop(true);
        refreshSyncChip();
        if (!window.HG_PROFILE) {
          if (offline) noteUnconfirmed(); else setTimeout(noteUnconfirmed, 4000);
          retryConfirmLater();
        }
        // Unsynced changes are sent from refreshProfileCard, once the profile has confirmed the user
        // and organisation they belong to (a session alone isn't enough: see mayFlushAs).
      } else {
        // Signed out: hide the desktop; the sign-in screen covers everything.
        showDesktop(false);
        window.HG_AUTH_UI.show();
      }
    }

    document.addEventListener('hg:auth:changed', () => reconcile());
    // Another tab signed out, switched user (hg-last-uid) or found the account in another organisation
    // (hg-last-org): this page's in-memory state belongs to the old one, so don't keep it.
    window.addEventListener('storage', function (e) {
      if (e.key !== null && e.key !== 'hg-last-uid' && e.key !== 'hg-last-org') return;
      if ((pageUid && lastUid() !== pageUid) || (pageOrg && lastOrg() !== pageOrg)) reloadFrozen();
    });
    // Signed in but offline (or the profile couldn't load): try again when the connection returns, so
    // the session refreshes, the organisation is confirmed and unsynced changes can be sent.
    window.addEventListener('online', function () { if (pageUid && !window.HG_PROFILE) reconcile(); });
    reconcile();
  }

  // The organisation of the data this page holds in memory: this phone's record of it (hg-last-org)
  // from sign-in, then whatever the profile confirms.
  let pageOrg = null;

  // What this role may see: body[data-role] (role-gated screens read it) and the home tiles tagged
  // data-roles="admin,…" (shown only for those roles; untagged tiles show for everyone).
  function applyRole(role) {
    document.body.setAttribute('data-role', role || '');
    document.querySelectorAll('[data-roles]').forEach(function (el) {
      const allowed = (el.getAttribute('data-roles') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      el.style.display = allowed.includes(role) ? '' : 'none';
    });
  }

  // ── Profile card binding ────────────────────────────────
  async function refreshProfileCard() {
    const profile = await window.HG_AUTH.getProfile();
    if (!profile) return;
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value || '—'; };
    set('profileName', profile.full_name || profile.email);
    const emailEl = document.getElementById('profileEmail');
    if (emailEl) emailEl.textContent = profile.email;
    set('profileCompany', profile.organisations?.name || 'Unassigned');
    set('profilePhone', profile.phone);
    set('profileRole',
      profile.role === 'admin' ? 'Hadron staff (admin)' :
      profile.role === 'customer_admin' ? 'Customer admin' :
      profile.role === 'operator' ? 'Operator' :
      profile.role === 'viewer' ? 'Viewer' : '—'
    );
    set('profileMemberSince',
      profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month:'long', year:'numeric' }) : '');

    // Stash on window so other modules can use it without a round trip.
    window.HG_PROFILE = profile;
    // The user switch itself ran in reconcile (hgEnsureUser). Here, with the organisation known:
    // make sure the data on this phone belongs to it, then finish a pending restore of this user's
    // own device data.
    if (await hgEnsureOrg(profile)) return;        // reloading without the other organisation's data
    pageOrg = lastOrg();                           // the organisation this page's data belongs to
    if (await hgRestorePending(profile)) return;   // reloading with the restored data
    // Only for this phone's current user, and not while the page is being cleared: a late reply in a tab
    // that another tab has switched to someone else must not write this phone's markers (role, company).
    { const lu = lastUid(); if ((lu && profile.id !== lu) || window.__hgTenantFrozen) return; }
    window.__hgOfflineSession = false;             // the server has confirmed who this is
    // The role, also kept on this phone (with hg-last-org) so the right screens show when signed in offline.
    try { if (profile.role) localStorage.setItem('hg-last-role', profile.role); else localStorage.removeItem('hg-last-role'); } catch (_) {}
    applyRole(profile.role || '');
    const orgName = (profile.organisations && profile.organisations.name) || '';
    paintTopOrg(orgName);
    try { if (orgName) localStorage.setItem('hg-last-org-name', orgName); else localStorage.removeItem('hg-last-org-name'); } catch (_) {}
    document.body.setAttribute('data-org-type', profile.organisations?.type || '');

    // Top-right user chip on the desktop
    const displayName = profile.full_name || (profile.email ? profile.email.split('@')[0] : 'User');
    const initial = (profile.full_name || profile.email || 'U').trim().charAt(0).toUpperCase();
    const userNameEl   = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    if (userNameEl)   userNameEl.textContent = displayName;
    if (userAvatarEl) userAvatarEl.textContent = initial;

    document.dispatchEvent(new CustomEvent('hg:profile:loaded', { detail: profile }));

    // User and organisation confirmed: send anything waiting in the write queue.
    try { if (window.HG_DB && window.HG_DB._flush) window.HG_DB._flush(); } catch (_) {}

    // Signed in through a password-reset link: ask for the new password now; the team invite (if
    // any) is offered after that sheet closes. One sheet at a time.
    if (!maybeAskNewPassword()) { try { maybeOfferInvite(); } catch (_) {} }
    // An expired / already-used e-mail link while signed in: say so once.
    if (pendingLinkError) { const m = pendingLinkError; pendingLinkError = null; if (typeof window.showToast === 'function') window.showToast(m); }
  }

  // ── Password reset link + own account details ───────────
  // A reset e-mail link signs the user in (supabase-client records that user's id in sessionStorage);
  // they still have to choose the new password, so ask once the profile is loaded. Pending = true
  // (also while the sheet is already open), so nothing else opens on top of it.
  function maybeAskNewPassword() {
    let pending = null;
    try { pending = sessionStorage.getItem('hg-pw-recovery'); } catch (_) {}
    if (!pending || !window.hgSheet) return false;
    const me = window.HG_PROFILE && window.HG_PROFILE.id;
    if (!me || pending !== me) {   // someone else's (signed out since): never ask the next person
      try { sessionStorage.removeItem('hg-pw-recovery'); } catch (_) {}
      return false;
    }
    if (!window.__hgPwSheetOpen) openPasswordSheet(true);
    return true;
  }
  document.addEventListener('hg:auth:recovery', function () { if (window.HG_PROFILE) maybeAskNewPassword(); });

  // Account changes need the cloud (local-only mode or a missing SDK can't make them).
  function cloudReady() { return !!(window.HG_AUTH && window.HG_AUTH.configured && typeof window.HG_AUTH.updatePassword === 'function'); }
  function notAvailable() { if (typeof window.showToast === 'function') window.showToast('Account changes need a connection to the Hadron servers. Sign in first.'); }
  // A server call that can't hang the sheet ("Saving…" can't be dismissed while busy).
  function withLimit(p, ms) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej({ code: 'timeout', message: 'timeout' }); }, ms || 20000); })]);
  }
  // Server / network errors in words a user can act on (other messages, e.g. a password-policy
  // rule from the server, are already readable and pass through).
  function accountErrorText(e, fallback) {
    const m = String((e && (e.message || e.error_description)) || '');
    const code = String((e && (e.code || e.name)) || '');
    if (code === 'timeout') return 'That took too long. Check your connection and try again.';
    if (/failed to fetch|load failed|networkerror|network request/i.test(m) || code === 'AuthRetryableFetchError') return 'Couldn’t reach the server. Check your connection and try again.';
    if (/session missing|not signed in|signed out|jwt/i.test(m) || code === 'session_not_found') return 'You’re signed out. Sign in again, then try once more.';
    if (/reauthenticat|current password|nonce/i.test(m) || code === 'reauthentication_needed') return 'For security, set your new password with “Forgot password?” on the sign-in screen. It e-mails you a link.';
    if (/should be different|same password/i.test(m) || code === 'same_password') return 'That is your current password. Choose a different one.';
    if (code === '42501' || /row-level security|permission denied/i.test(m)) return 'Your account isn’t allowed to change this. Ask your organisation’s admin.';
    return m || fallback;
  }
  function isSamePasswordError(e) {
    const m = String((e && e.message) || ''), code = String((e && e.code) || '');
    return code === 'same_password' || /should be different|same password/i.test(m);
  }

  const PW_MIN = 6;   // Supabase Auth's minimum (the sign-up form uses the same)
  function openPasswordSheet(recovery) {
    if (!window.hgSheet) return;
    if (!cloudReady()) { notAvailable(); return; }
    window.__hgPwSheetOpen = true;
    const p = window.HG_PROFILE || {};
    let timedOut = false;   // an earlier attempt in this sheet ran out of time
    const done = function () {
      window.__hgPwSheetOpen = false;
      try { sessionStorage.removeItem('hg-pw-recovery'); } catch (_) {}
    };
    async function save(c) {
      const p1 = c.el.querySelector('#hgPw1'), p2 = c.el.querySelector('#hgPw2'), err = c.el.querySelector('#hgPwErr');   // (values are never logged or stored)
      const say = function (msg, field) {
        err.textContent = msg; err.hidden = !msg;
        [p1, p2].forEach(function (f) { f.removeAttribute('aria-invalid'); });
        if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
      };
      // The sign-in form trims the password, so a space at either end would make this password one
      // that can never be typed in again.
      if (p1.value !== p1.value.trim()) return say('Remove the space at the start or end of the password.', p1);
      if (p1.value.length < PW_MIN) return say('Use at least ' + PW_MIN + ' characters.', p1);
      if (p1.value !== p2.value) return say('The two passwords don’t match.', p2);
      if (navigator.onLine === false) return say('You’re offline. Connect to the internet and try again.');
      say('');
      c.setBusy(true, 'Saving…');
      try {
        await withLimit(window.HG_AUTH.updatePassword(p1.value));
      } catch (e) {
        // A save that timed out can still have gone through: then the retry is told this is already
        // the current password, which means it worked.
        if (!(timedOut && isSamePasswordError(e))) {
          if (e && e.code === 'timeout') timedOut = true;
          c.setBusy(false);
          return say(accountErrorText(e, 'The password couldn’t be changed. Try again.'));
        }
      }
      done();
      c.close();
      if (typeof window.showToast === 'function') window.showToast('Password changed');
    }
    const ctx = window.hgSheet.open({
      title: recovery ? 'Choose a new password' : 'Change password',
      body: (recovery ? '<p>You opened a password reset link' + (p.email ? ' for <b>' + escH(p.email) + '</b>' : '') + '. Choose your new password to finish.</p>' : '') +
            '<label class="hg-sheet-field"><span>New password</span><input type="password" id="hgPw1" autocomplete="new-password" minlength="' + PW_MIN + '"></label>' +
            '<label class="hg-sheet-field"><span>Repeat the new password</span><input type="password" id="hgPw2" autocomplete="new-password"></label>' +
            '<div class="hg-sheet-note danger" id="hgPwErr" role="alert" hidden></div>',
      actions: [{ label: 'Save password', kind: 'primary', keepOpen: true, onClick: save }, { label: recovery ? 'Later' : 'Cancel', kind: 'plain' }],
      onClose: function () {
        window.__hgPwSheetOpen = false;
        if (recovery) { done(); setTimeout(function () { try { maybeOfferInvite(); } catch (_) {} }, 0); }
      }
    });
    enterSubmits(ctx);
    setTimeout(function () { const f = document.getElementById('hgPw1'); if (f) f.focus(); }, 60);
  }
  // Enter in a field of a form sheet presses its main button.
  function enterSubmits(ctx) {
    ctx.el.querySelectorAll('input').forEach(function (i) {
      i.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const main = ctx.el.querySelector('.hg-sheet-actions button');
        if (main && !main.disabled) main.click();
      });
    });
  }
  window.hgChangePassword = function () { openPasswordSheet(false); };

  // Own name and phone (role, company and e-mail are managed by the organisation / Hadron).
  window.hgEditProfile = function () {
    if (!window.hgSheet) return;
    if (!cloudReady()) { notAvailable(); return; }
    const p = window.HG_PROFILE || {};
    async function save(c) {
      const nameEl = c.el.querySelector('#hgPfName'), phoneEl = c.el.querySelector('#hgPfPhone'), err = c.el.querySelector('#hgPfErr');
      const say = function (msg, field) {
        err.textContent = msg; err.hidden = !msg;
        [nameEl, phoneEl].forEach(function (f) { f.removeAttribute('aria-invalid'); });
        if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
      };
      const name = nameEl.value.trim().replace(/\s+/g, ' ');
      const phone = phoneEl.value.trim();
      if (!name) return say('Enter your name.', nameEl);
      if (name.length > 120) return say('That name is too long (120 characters at most).', nameEl);
      if (phone && !/^[0-9+()\-.\s]+$/.test(phone)) return say('Use digits, spaces and + ( ) - only.', phoneEl);
      const digits = phone.replace(/\D/g, '').length;
      if (phone && (digits < 6 || digits > 15)) return say('Enter the full number (6 to 15 digits).', phoneEl);
      if (navigator.onLine === false) return say('You’re offline. Connect to the internet and try again.');
      say('');
      c.setBusy(true, 'Saving…');
      let data;
      try { data = await withLimit(window.HG_AUTH.updateMyProfile({ full_name: name, phone: phone || null })); }
      catch (e) { c.setBusy(false); return say(accountErrorText(e, 'Your details couldn’t be saved. Try again.')); }
      if (window.HG_PROFILE) { window.HG_PROFILE.full_name = data.full_name; window.HG_PROFILE.phone = data.phone; }
      const set = function (id, v) { const el = document.getElementById(id); if (el) el.textContent = v || '—'; };
      set('profileName', data.full_name || p.email);
      set('profilePhone', data.phone);
      set('userName', data.full_name || (p.email ? p.email.split('@')[0] : 'User'));
      set('userAvatar', (data.full_name || p.email || 'U').trim().charAt(0).toUpperCase());
      c.close();
      if (typeof window.showToast === 'function') window.showToast('Your details are saved');
    }
    const ctx = window.hgSheet.open({
      title: 'Your details',
      body: '<label class="hg-sheet-field"><span>Name</span><input type="text" id="hgPfName" autocomplete="name" maxlength="120" value="' + escH(p.full_name || '') + '"></label>' +
            '<label class="hg-sheet-field"><span>Phone</span><input type="tel" id="hgPfPhone" autocomplete="tel" maxlength="30" value="' + escH(p.phone || '') + '"></label>' +
            '<p class="hg-sheet-hint">To change your e-mail address, company or role, ask your organisation’s admin or Hadron support.</p>' +
            '<div class="hg-sheet-note danger" id="hgPfErr" role="alert" hidden></div>',
      actions: [{ label: 'Save', kind: 'primary', keepOpen: true, onClick: save }, { label: 'Cancel', kind: 'plain' }]
    });
    enterSubmits(ctx);
    setTimeout(function () { const f = document.getElementById('hgPfName'); if (f) f.focus(); }, 60);
  };

  // The organisation the data on this phone belongs to is recorded in hg-last-org (stashes are
  // tagged with it too). If the same user now belongs to a different organisation (invite accepted
  // on another device, moved by an admin, or a join whose reply was lost), that organisation's data
  // must neither stay visible nor sync into the new one: clear it, and the user's stash of it.
  async function hgEnsureOrg(profile) {
    const uid = profile && profile.id;
    if (!uid || uid !== lastUid()) return false;
    if (window.__hgTenantFrozen) return true;            // a sign-out / switch is already reloading
    const org = profile.organisation_id || '';
    const prev = lastOrg();
    if (prev && prev !== org) {
      window.__hgTenantFrozen = true;
      window.__hgSuppressQueuePersist = true;
      try { await hgClearTenantData(); } catch (_) {}
      try { await stashDel(uid); } catch (_) {}
      try {
        if (org) localStorage.setItem('hg-last-org', org); else localStorage.removeItem('hg-last-org');
        localStorage.removeItem('hg-last-role');   // the role in the new organisation comes with its profile
        localStorage.removeItem('hg-last-org-name');
        localStorage.removeItem('hg-restore-pending');
      } catch (_) {}
      try { location.reload(); } catch (_) {}
      return true;
    }
    if (!prev && org) { try { localStorage.setItem('hg-last-org', org); } catch (_) {} }
    return false;
  }

  // One-time-per-load consent prompt: my_pending_invite() (SECURITY DEFINER) tells us
  // if the signed-in email was invited somewhere; redeem_org_invite() moves them on accept.
  let _inviteOffered = false;
  async function maybeOfferInvite() {
    if (_inviteOffered || !window.HG_SUPA) return;
    _inviteOffered = true;
    let inv = null;
    try { const { data } = await window.HG_SUPA.rpc('my_pending_invite'); inv = data; }
    catch (_) { return; }
    if (!inv || !inv.organisation) return;
    const access = inv.role === 'viewer' ? 'with view-only access' : 'to create and view reports';

    // Joining moves the account into another organisation. Rows are written into whatever org the
    // account is in when they reach the server, so: send this org's unsent changes FIRST, then PAUSE
    // the queue and wait for any send in flight to finish, and only then move the account. Whatever
    // still couldn't be sent is named, and only removed if the user says so. After the move, this
    // org's device data and stash are cleared; hg-last-org keeps the OLD org, so the next profile load
    // (hgEnsureOrg) also clears anything a late writer put back before the reload.
    let decide = null;   // resolves the "join anyway?" step; a dismissed sheet counts as "no"
    function answer(v) { if (decide) { const d = decide; decide = null; d(v); } }
    function confirmLoss(c, n) {
      const msg = plural(n, 'change hasn’t', 'changes haven’t') + ' synced yet. Joining removes ' + (n === 1 ? 'it' : 'them') + ' from this phone.';
      if (!c) return Promise.resolve(window.confirm(msg + '\n\nJoin anyway?'));
      return new Promise(function (resolve) {
        decide = resolve;
        c.setBusy(false);
        c.setBody('<div class="hg-sheet-note warn"><span aria-hidden="true">⚠</span><span>' + msg + '</span></div>' +
                  '<p>To keep ' + (n === 1 ? 'it' : 'them') + ', choose Not now and try again when you have a connection.</p>');
        c.setActions([
          { label: 'Not now', kind: 'primary', onClick: function () { answer(false); } },
          { label: 'Join anyway and remove ' + (n === 1 ? 'it' : 'them'), kind: 'danger', keepOpen: true, onClick: function () { answer(true); } }
        ]);
      });
    }
    async function join(c) {
      if (c) c.setBusy(true, 'Sending unsynced changes…');
      try {
        if (navigator.onLine !== false && window.HG_DB && window.HG_DB._flush) {
          await Promise.race([window.HG_DB._flush(), new Promise(function (r) { setTimeout(r, 8000); })]);
        }
      } catch (_) {}
      window.__hgQueuePaused = true;
      // Wait for a send in flight to stop, but not for minutes: a big report on a slow link can take
      // that long, and the account must not move while it is still being written.
      let stopped = true;
      if (window.HG_DB && window.HG_DB._flush) {
        stopped = await Promise.race([
          window.HG_DB._flush().then(function () { return true; }, function () { return true; }),
          new Promise(function (r) { setTimeout(function () { r(false); }, 20000); })
        ]);
      }
      if (!stopped) {
        window.__hgQueuePaused = false;
        const busyMsg = 'A large upload is still sending. Try joining again in a few minutes.';
        if (!c) { window.alert(busyMsg); return; }
        c.setBusy(false);
        c.setBody('<div class="hg-sheet-note warn"><span>' + busyMsg + '</span></div>');
        c.setActions([{ label: 'Close', kind: 'plain', focus: true }]);
        return;
      }
      const left = (window.HG_DB && typeof window.HG_DB._queueLen === 'function') ? window.HG_DB._queueLen() : 0;
      if (left) {
        if (!(await confirmLoss(c, left))) { window.__hgQueuePaused = false; return; }
        if (c) c.setActions([{ label: 'Joining…', kind: 'danger' }]);
      }
      if (c) c.setBusy(true, 'Joining…');
      const oldOrg = (window.HG_PROFILE && window.HG_PROFILE.organisation_id) || lastOrg();
      // Time-limited, so "Joining…" (which can't be dismissed, not even with Back) can't hang for ever.
      let unsure = false;   // the join got no answer in time: the server may still move the account
      try {
        let joined = false;
        try {
          const r = await withLimit(window.HG_SUPA.rpc('redeem_org_invite'));
          joined = !!(r && r.data && r.data.joined);
          // No reply from the server (the connection dropped after sending): it may have moved the account all the same.
          if (r && r.error && !r.status && navigator.onLine !== false) unsure = true;
        }
        catch (e) { if (e && e.code === 'timeout') unsure = true; }
        // No answer doesn't mean no move (a dropped reply on mobile): check where the account is now.
        if (!joined) { try { const p = await withLimit(window.HG_AUTH.getProfile()); joined = !!(p && p.organisation_id && p.organisation_id !== oldOrg); } catch (_) {} }
        if (joined) {
          window.__hgSuppressQueuePersist = true;
          window.__hgTenantFrozen = true;
          try { await hgClearTenantData(); } catch (_) {}
          try { const uid = lastUid(); if (uid) await stashDel(uid); } catch (_) {}
          try { localStorage.removeItem('hg-last-role'); localStorage.removeItem('hg-last-org-name'); } catch (_) {}   // the old company's (hg-last-org stays: see above)
          try { location.reload(); } catch (_) {}
          return;
        }
      } catch (_) {}
      if (unsure) {
        // The move may still land after this: keep the queue paused (nothing is sent into the wrong
        // company) and start again from what the server says; a late move is cleared up by hgEnsureOrg.
        try { location.reload(); } catch (_) {}
        return;
      }
      window.__hgQueuePaused = false;
      if (c) {
        c.setBusy(false);
        c.setBody('<div class="hg-sheet-note danger"><span>Couldn’t join right now. Check your connection and try again.</span></div>');
        c.setActions([{ label: 'Try again', kind: 'primary', keepOpen: true, onClick: join }, { label: 'Close', kind: 'plain', focus: true }]);
      }
    }

    if (!window.hgSheet) {
      if (window.confirm('You have been invited to join "' + inv.organisation + '" ' + access + '.\n\nJoin now? Your account moves into this company.')) join(null);
      return;
    }
    window.hgSheet.open({
      title: 'Join ' + inv.organisation + '?',
      body: '<p>You’ve been invited to join <b>' + escH(inv.organisation) + '</b> ' + escH(access) + '.</p>' +
            '<p>Your account moves into this company. Anything not yet synced is sent first, then this phone’s data for your current company is removed.</p>',
      actions: [{ label: 'Join company', kind: 'primary', keepOpen: true, onClick: join }, { label: 'Not now', kind: 'plain', focus: true }],
      onClose: function () { answer(false); }
    });
  }

  // ── Tenant data on this device ──────────────────────────
  // Tenant data = every localStorage key starting hadron_ or hg_, except per-device prefs.
  // (hadron-theme, hg-last-uid and the hg-auth-v1 session use hyphens, so they never match.)
  const DEVICE_PREFS = new Set(['hadron_lang', 'hadron_dark']);
  function isTenantKey(k) { return !DEVICE_PREFS.has(k) && (k.indexOf('hadron_') === 0 || k.indexOf('hg_') === 0); }

  // Clear the LIVE store (LIMS IndexedDB + tenant localStorage) so the next person on this
  // browser never sees the previous account's customers/sites/reports. Server-side RLS already
  // isolates tenants; this closes the local-cache gap (the v110 fix). Per-user stashes below are
  // separate and survive this.
  async function hgClearTenantData() {
    try { if (typeof window.hgWipeLimsDb === 'function') await window.hgWipeLimsDb(); } catch (_) {}
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (isTenantKey(k)) { try { localStorage.removeItem(k); } catch (_) {} }
      });
    } catch (_) {}
    try { window.__custCache = null; window.__hgCustomerCache = {}; } catch (_) {}
  }
  window.hgClearTenantData = hgClearTenantData;

  // ── Per-user stash ──────────────────────────────────────
  // Sign-out used to DELETE everything kept only on the phone (history, jobs, LOTO, drafts and
  // unsynced changes). Now each user's tenant data is moved into their own stash and put back when
  // that same user signs in again. The stash lives in IndexedDB so it doesn't compete with the app
  // for localStorage space. LIMS IndexedDB is NOT stashed: it is a cloud cache (re-pulled at sign-in)
  // and its unsynced edits sit in the write queue, which IS stashed.
  // Each stash is tagged with the organisation it belongs to and is only ever restored into that
  // same organisation. A small index (hg-stash-index: uid → {t: savedAt, p: unsynced ops}) lives
  // outside the tenant keys, so pruning never has to load stashes (which can hold photos).
  const STASH_DB = 'hadron_stash', STASH_STORE = 'stash', STASH_INDEX = 'hg-stash-index';
  const STASH_KEEP = 10, STASH_MAX_AGE = 180 * 864e5;
  // IndexedDB can hang without ever answering (a known WebKit failure). Every stash step is time-
  // limited, so a hung database means "stash unavailable" (callers already handle that), never a
  // blank screen or a sign-out sheet stuck on "Signing out…".
  const IDB_TIMEOUT_MS = 4000;
  function timed(p) {
    return new Promise(function (res, rej) {
      const t = setTimeout(function () { rej(new Error('stash timeout')); }, IDB_TIMEOUT_MS);
      p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }
  function stashDb() {
    return new Promise(function (res, rej) {
      let settled = false;
      const t = setTimeout(function () { if (!settled) { settled = true; rej(new Error('stash db timeout')); } }, IDB_TIMEOUT_MS);
      const ok = function (db) { if (settled) { try { db.close(); } catch (_) {} return; } settled = true; clearTimeout(t); res(db); };
      const fail = function (e) { if (settled) return; settled = true; clearTimeout(t); rej(e); };
      try {
        const r = indexedDB.open(STASH_DB, 1);
        r.onupgradeneeded = function () { if (!r.result.objectStoreNames.contains(STASH_STORE)) r.result.createObjectStore(STASH_STORE); };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { fail(r.error); };
        r.onblocked = function () { fail(new Error('stash db blocked')); };
      } catch (e) { fail(e); }
    });
  }
  function txDone(tx) {
    return timed(new Promise(function (res, rej) {
      tx.oncomplete = function () { res(); };
      tx.onerror = function () { rej(tx.error); };
      tx.onabort = function () { rej(tx.error || new Error('stash tx aborted')); };
    }));
  }
  function reqDone(r) {
    return timed(new Promise(function (res, rej) {
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    }));
  }
  function stashIndex() { try { return JSON.parse(localStorage.getItem(STASH_INDEX) || '{}') || {}; } catch (_) { return {}; } }
  function saveStashIndex(ix) { try { localStorage.setItem(STASH_INDEX, JSON.stringify(ix)); } catch (_) {} }
  // Save a user's device data. It is MERGED into anything already set aside for them: a restore may
  // still be pending (the profile didn't load) or have failed for lack of space, so the live data can
  // be partial and must never replace the stash. Empty data writes nothing. A stash of another
  // organisation, or one already restored (hg-restore-done), is replaced instead: it can never come
  // back here, and re-merging restored ops would replay ones that were sent since.
  // Throws if the stash can't be read or written (callers treat that as "not saved").
  async function stashPut(uid, data, org) {
    if (!uid) return false;
    if (!data || !Object.keys(data).length) return true;
    const db = await stashDb();
    let rec = null;
    try {
      // Read and write in ONE transaction, so two tabs saving the same user's data can't lose a merge.
      const tx = db.transaction(STASH_STORE, 'readwrite'), st = tx.objectStore(STASH_STORE);
      const g = st.get(uid);
      g.onsuccess = function () {
        const prev = g.result || null;
        const merge = !!(prev && prev.data) && restoreDone(uid) !== prev.savedAt && !(prev.org && org && prev.org !== org);
        rec = { uid: uid, org: org || (merge && prev.org) || null, savedAt: Date.now(), data: merge ? mergeStash(prev.data, data) : data };
        st.put(rec, uid);
      };
      await txDone(tx);
    } finally { db.close(); }
    if (!rec) throw new Error('stash not written');
    let pending = 0;
    try { pending = (JSON.parse(rec.data.hg_sync_queue_v1 || '[]') || []).length; } catch (_) {}
    const ix = stashIndex(); ix[uid] = { t: rec.savedAt, p: pending }; saveStashIndex(ix);
    try { await pruneStashes(); } catch (_) {}   // best effort
    return true;
  }
  // older = what's in the stash, newer = live data. Lists and keyed maps are merged (see
  // mergeValues); for anything else a non-empty newer value wins.
  function mergeStash(older, newer) {
    const out = Object.assign({}, older);
    Object.keys(newer).forEach(function (k) {
      const o = older[k], n = newer[k];
      if (typeof n !== 'string' || EMPTY_VALUES.has(n)) return;
      if (typeof o !== 'string' || EMPTY_VALUES.has(o)) { out[k] = n; return; }
      const m = mergeValues(k, n, o);
      out[k] = m === null ? n : m;
    });
    return out;
  }
  // Which stash (by savedAt) was last put back for each user: a stash that was restored but couldn't
  // be deleted must never be restored or merged into again (its queued ops may have been sent since).
  function restoreDoneMap() { try { return JSON.parse(localStorage.getItem('hg-restore-done') || '{}') || {}; } catch (_) { return {}; } }
  function restoreDone(uid) { return restoreDoneMap()[uid] || null; }
  function setRestoreDone(uid, savedAt) {
    try { const m = restoreDoneMap(); m[uid] = savedAt; localStorage.setItem('hg-restore-done', JSON.stringify(m)); } catch (_) {}
  }
  // Keep the newest STASH_KEEP stashes. A stash still holding unsynced changes is kept beyond that
  // (up to STASH_MAX_AGE), so another user's unsent work isn't silently evicted.
  async function pruneStashes() {
    const ix = stashIndex(), now = Date.now();
    const ids = Object.keys(ix).sort(function (a, b) { return (ix[b].t || 0) - (ix[a].t || 0); });
    const drop = ids.filter(function (id, i) {
      const e = ix[id] || {};
      return (now - (e.t || 0) > STASH_MAX_AGE) || (i >= STASH_KEEP && !(e.p > 0));
    });
    if (!drop.length) return;
    const db = await stashDb();
    try {
      const tx = db.transaction(STASH_STORE, 'readwrite'), st = tx.objectStore(STASH_STORE);
      drop.forEach(function (id) { st.delete(id); });
      await txDone(tx);
    } finally { db.close(); }
    drop.forEach(function (id) { delete ix[id]; });
    saveStashIndex(ix);
  }
  async function stashGet(uid) {
    const db = await stashDb();
    try {
      return (await reqDone(db.transaction(STASH_STORE).objectStore(STASH_STORE).get(uid))) || null;
    } finally { db.close(); }
  }
  async function stashDel(uid) {
    const db = await stashDb();
    try {
      const tx = db.transaction(STASH_STORE, 'readwrite');
      tx.objectStore(STASH_STORE).delete(uid);
      await txDone(tx);
    } finally { db.close(); }
    const ix = stashIndex(); if (ix[uid]) { delete ix[uid]; saveStashIndex(ix); }
  }
  function collectTenantData() {
    const out = {};
    Object.keys(localStorage).forEach(function (k) { if (isTenantKey(k)) out[k] = localStorage.getItem(k); });
    return out;
  }
  // Put a stash back into the live store without losing anything written since (e.g. offline, when
  // the desktop opened before the profile loaded): empty keys are filled; lists present on both
  // sides are merged (the write queue keeps its order: stashed ops first); any other non-empty live
  // value wins. All-or-nothing: if storage fills part-way, every key written is put back as it was
  // and the stash is kept for a later try.
  const EMPTY_VALUES = new Set(['[]', '{}', 'null', '""']);
  const FIFO_KEYS = new Set(['hg_sync_queue_v1', 'hg_sync_deadletter_v1']);
  const MAP_KEYS = new Set(['hadron_sr_limits', 'hadron_academy_progress']);   // keyed maps: merge their keys
  // Merge a live (newer) and a saved (older) value of key k, or null = no merge (the newer one wins).
  // Lists: items from both, de-duplicated by qid / id (the write queue and dead-letter keep their
  // order, older ops first; other lists newest first). Keyed maps: keys from both, newer entry wins.
  function mergeValues(k, live, saved) {
    let a, b;
    try { a = JSON.parse(live); b = JSON.parse(saved); } catch (_) { return null; }
    if (MAP_KEYS.has(k) && a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      return JSON.stringify(Object.assign({}, b, a));
    }
    if (!Array.isArray(a) || !Array.isArray(b)) return null;
    const idOf = function (x) { return (x && typeof x === 'object') ? String(x.qid || x.id || JSON.stringify(x)) : JSON.stringify(x); };
    const first = FIFO_KEYS.has(k) ? b : a, second = FIFO_KEYS.has(k) ? a : b;
    const seen = new Set(first.map(idOf));
    return JSON.stringify(first.concat(second.filter(function (x) { const id = idOf(x); if (seen.has(id)) return false; seen.add(id); return true; })));
  }
  // Returns how many keys it wrote (0 = the live store already had everything), or -1 if storage
  // filled part-way (everything written is rolled back).
  function restoreTenantData(data) {
    const written = [];
    try {
      Object.keys(data || {}).forEach(function (k) {
        if (!isTenantKey(k) || typeof data[k] !== 'string') return;
        const cur = localStorage.getItem(k);
        let val = data[k];
        if (cur !== null && !EMPTY_VALUES.has(cur)) {
          val = mergeValues(k, cur, data[k]);
          if (val === null || val === cur) return;   // the live value wins / nothing to add
        }
        localStorage.setItem(k, val);
        written.push([k, cur]);
      });
      return written.length;
    } catch (e) {
      written.forEach(function (w) { try { if (w[1] === null) localStorage.removeItem(w[0]); else localStorage.setItem(w[0], w[1]); } catch (_) {} });
      return -1;
    }
  }
  function lastUid() { try { return localStorage.getItem('hg-last-uid'); } catch (_) { return null; } }
  function lastOrg() { try { return localStorage.getItem('hg-last-org'); } catch (_) { return null; } }

  // ── User switch (single-flight) ─────────────────────────
  // Runs on every reconcile with the SESSION's user id (so it doesn't depend on the profile fetch).
  // Same user → nothing. Otherwise the live store may hold another person's data (they never signed
  // out) or late writes from an earlier sign-out: set the previous user's data aside for THEM, clear
  // the live store, record the new user, and mark their own stash for restore (finished in
  // refreshProfileCard once the organisation can be checked).
  // Single-flight: boot and supabase's INITIAL_SESSION / SIGNED_IN can call this concurrently.
  // Crash-safe: hg-last-uid changes right after the clear, and a stash is never overwritten with
  // empty data, so an interrupted switch can't destroy or misfile anyone's data.
  let _switchRun = null;
  function hgEnsureUser(uid) {
    if (_switchRun) return _switchRun;
    _switchRun = (async function () {
      const prev = lastUid();
      if (!uid) return false;
      if (prev === uid) {
        // Same user. If their data is set aside (a sign-out that didn't finish, so the markers were
        // never dropped), mark it for restore: the restore merges and never clobbers, so this is safe.
        // Not while a sign-out is running in another tab (it has set the data aside on purpose).
        try {
          if (stashIndex()[uid] && !localStorage.getItem('hg-restore-pending') && !(await signOutInProgress())) localStorage.setItem('hg-restore-pending', uid);
        } catch (_) {}
        return false;
      }
      window.__hgTenantFrozen = true;            // late tenant writers (report autosave…) must not write now
      window.__hgSuppressQueuePersist = true;    // nor the sync queue
      const residue = Object.keys(localStorage).some(isTenantKey);
      if (prev && residue) {
        try { await stashPut(prev, collectTenantData(), lastOrg()); } catch (_) {}   // best effort; isolation wins either way
      }
      const purge = !!prev || residue;
      if (purge) { try { await hgClearTenantData(); } catch (_) {} }
      try {
        localStorage.setItem('hg-last-uid', uid);
        localStorage.removeItem('hg-last-org');
        localStorage.removeItem('hg-last-role');
        localStorage.removeItem('hg-last-org-name');
        localStorage.setItem('hg-restore-pending', uid);
      } catch (_) {}
      if (purge) { try { location.reload(); } catch (_) {} return true; }   // modules may still hold the old data in memory
      window.__hgTenantFrozen = false;
      window.__hgSuppressQueuePersist = false;
      return false;
    })().finally(function () { _switchRun = null; });
    return _switchRun;
  }

  // Finish a pending restore for this user (single-flight). Only into the SAME organisation the data
  // was saved from: if the account has moved org since, that org's data is discarded, never restored.
  let _restoreRun = null, _restoreWarned = false;
  function hgRestorePending(profile) {
    if (_restoreRun) return _restoreRun;
    _restoreRun = (async function () {
      let pending = null;
      try { pending = localStorage.getItem('hg-restore-pending'); } catch (_) {}
      const uid = profile && profile.id;
      if (!pending || !uid || pending !== uid) return false;
      if (await signOutInProgress()) return false;   // another tab is signing this user out right now
      const clearPending = function () { try { localStorage.removeItem('hg-restore-pending'); } catch (_) {} };
      let st;
      try { st = await stashGet(uid); } catch (_) { return false; }   // storage unavailable now: retry on a later load
      if (!st || !st.data) { clearPending(); return false; }
      if (st.org && st.org !== (profile.organisation_id || null)) {
        try { await stashDel(uid); } catch (_) {}
        clearPending();
        return false;
      }
      // Already put back once (the app closed before the stash could be deleted): restoring it again
      // would re-add queued changes that have been sent since, and replay them over newer edits.
      if (restoreDone(uid) === st.savedAt) {
        try { await stashDel(uid); } catch (_) {}
        clearPending();
        return false;
      }
      // A stash with no organisation recorded (signed out offline on the first launch of this
      // version) is restored into the current one: its queued rows carry their own organisation_id
      // where it was known, so the server rejects any that belong elsewhere.
      const wrote = restoreTenantData(st.data);
      if (wrote < 0) {   // storage full: keep stash + marker, retried next load
        if (!_restoreWarned) {
          _restoreWarned = true;
          setTimeout(function () {
            const msg = 'Your saved data couldn’t be put back on this phone because storage is full. It is kept safely and comes back automatically once there is space: remove old photos or saved items, then reopen the app.';
            if (window.hgSheet) window.hgSheet.open({ title: 'Saved data not restored yet', body: '<div class="hg-sheet-note warn"><span>' + msg + '</span></div>', actions: [{ label: 'OK', kind: 'primary' }] });
            else if (typeof window.showToast === 'function') window.showToast(msg);
          }, 600);
        }
        return false;
      }
      setRestoreDone(uid, st.savedAt);   // same task as the restore
      try { await stashDel(uid); } catch (_) {}
      clearPending();
      // Reload only if something was put back (modules read their data at start-up). Nothing new
      // (already live) means no reload, so a stash that can't be deleted can never cause a loop.
      if (wrote > 0) { try { location.reload(); } catch (_) {} return true; }
      return false;
    })().finally(function () { _restoreRun = null; });
    return _restoreRun;
  }

  // Sign out. opts.removeData (shared device) deletes this user's data from the phone; otherwise it
  // is kept in their stash. Throws Error('stash-failed') if the data could not be set aside — then
  // NOTHING has been signed out or cleared (the caller offers "remove data" or cancel).
  // Throws Error('not-configured') when there is no cloud sign-in (the caller uses the local path).
  window.hgSignOut = async function (opts) {
    opts = opts || {};
    if (!window.HG_AUTH || !window.HG_AUTH.configured) throw new Error('not-configured');
    const uid = (window.HG_PROFILE && window.HG_PROFILE.id) || lastUid();
    const org = (window.HG_PROFILE && window.HG_PROFILE.organisation_id) || lastOrg();
    // 1. Online only: try to land queued changes under the still-valid session (persistence stays
    //    ON, so the queue records progress op by op). Offline a flush would only burn retry attempts.
    try {
      if (navigator.onLine !== false && window.HG_DB && window.HG_DB._flush) {
        const wait = opts.syncWait == null ? 3000 : opts.syncWait;
        await Promise.race([window.HG_DB._flush(), new Promise(function (res) { setTimeout(res, wait); })]);
      }
    } catch (_) {}
    // Steps 2–6 hold the sign-out lock, so another tab can't put this user's data back half-way
    // through (between setting it aside and the session ending).
    await withSignOutLock(async function () {
      // 2. Freeze: the queue stops sending/persisting, and late tenant writers (e.g. the report draft
      //    autosave that fires on unload) must not write the departing user's data back.
      window.__hgSuppressQueuePersist = true;
      window.__hgTenantFrozen = true;
      // 3. Keep this user's device data for them, unless they asked to remove it.
      if (opts.removeData) {
        if (uid) { try { await stashDel(uid); } catch (_) {} }
      } else {
        const data = collectTenantData();
        let ok = false;
        if (!Object.keys(data).length) ok = true;   // nothing to keep
        else { try { ok = !!uid && await stashPut(uid, data, org); } catch (_) { ok = false; } }
        if (!ok) {
          window.__hgSuppressQueuePersist = false;
          window.__hgTenantFrozen = false;
          throw new Error('stash-failed');
        }
      }
      // 4. Clear the live store (isolation).
      try { await hgClearTenantData(); } catch (_) {}
      // 5. End the session. Bounded: a hung request must not freeze the sheet, and supabase-js can
      //    return early offline WITHOUT removing the stored session, so always remove it locally too.
      try { await Promise.race([window.HG_AUTH.signOut(), new Promise(function (res) { setTimeout(res, 3000); })]); } catch (_) {}
      try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('hg-auth-v1') === 0) localStorage.removeItem(k); }); } catch (_) {}
      // 6. Only now drop the per-device markers: other tabs reload when hg-last-uid changes, and must
      //    find the session already gone (else they'd boot as this user again and re-fill the phone).
      //    If the app dies before this line, hgEnsureUser finds the user's stash and marks it for restore.
      try { ['hg-last-uid', 'hg-last-org', 'hg-last-role', 'hg-last-org-name', 'hg-restore-pending'].forEach(function (k) { localStorage.removeItem(k); }); } catch (_) {}
    });
    try { location.reload(); } catch (_) {}   // no tenant state left in memory
  };

  // A sign-out in progress, in this tab or another one. Web Locks are released automatically if the
  // tab dies; where they aren't available, a 15-second marker does the same job.
  const SIGNOUT_LOCK = 'hg-signout', SIGNOUT_MARK = 'hg-signing-out';
  function withSignOutLock(fn) {
    if (navigator.locks && typeof navigator.locks.request === 'function') return navigator.locks.request(SIGNOUT_LOCK, fn);
    try { localStorage.setItem(SIGNOUT_MARK, String(Date.now())); } catch (_) {}
    return Promise.resolve().then(fn).finally(function () { try { localStorage.removeItem(SIGNOUT_MARK); } catch (_) {} });
  }
  async function signOutInProgress() {
    try {
      if (navigator.locks && typeof navigator.locks.query === 'function') {
        const s = await navigator.locks.query();
        return (s.held || []).some(function (l) { return l.name === SIGNOUT_LOCK; });
      }
    } catch (_) {}
    try { const t = +localStorage.getItem(SIGNOUT_MARK) || 0; return t > 0 && Date.now() - t < 15000; } catch (_) { return false; }
  }

  // ── Account menu + sign-out confirmation (in-app sheets, not browser pop-ups) ──
  function escH(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  window.hgConfirmSignOut = function () {
    if (!window.hgSheet) {   // sheet UI failed to load: plain confirm, keep data (the safe default)
      if (window.confirm('Sign out? Your saved data stays on this phone for when you sign in again.')) {
        window.hgSignOut().catch(function (e) {
          if (e && e.message === 'not-configured') { if (typeof window.logout === 'function') window.logout(); }
          else if (e && e.message === 'stash-failed') window.alert('This phone couldn’t set your data aside, so you are still signed in.');
        });
      }
      return;
    }
    const pending = (window.HG_DB && typeof window.HG_DB._queueLen === 'function') ? window.HG_DB._queueLen() : 0;
    const dead = (window.HG_DB && typeof window.HG_DB._deadLen === 'function') ? window.HG_DB._deadLen() : 0;
    const online = navigator.onLine !== false;
    const status = pending
      ? '<div class="hg-sheet-note warn"><span aria-hidden="true">⚠</span><span>' + plural(pending, 'change is', 'changes are') + ' still waiting to sync. ' +
          (online ? 'Signing out will try to send ' + (pending === 1 ? 'it' : 'them') + ' first.'
                  : 'You’re offline. ' + (pending === 1 ? 'It stays' : 'They stay') + ' on this phone and sync the next time you sign in here.') + '</span></div>'
      : '<div class="hg-sheet-note ok"><span aria-hidden="true">✓</span><span>' + (dead ? 'Nothing is waiting to sync.' : 'Everything is synced.') + '</span></div>';
    const body = status +
      '<p>Your calculation history, job cards, safety records and drafts stay on this phone and come back when you sign in again. Lab (LIMS) records come back from the cloud.</p>' +
      '<label class="hg-sheet-check"><input type="checkbox" id="hgSoRemove"><span><b>This is a shared device</b><small>Remove my data from this phone when I sign out.</small></span></label>' +
      '<div class="hg-sheet-note danger" id="hgSoRemoveWarn" hidden><span>This deletes everything saved only on this phone: calculation history, job cards, safety records and drafts.' +
        (pending ? ' ' + plural(pending, 'unsynced change', 'unsynced changes') + ' will be lost.' : '') + '</span></div>';

    async function run(c) {
      const remove = !!(c.el.querySelector('#hgSoRemove') || {}).checked;
      c.setBusy(true, pending && online ? 'Syncing…' : 'Signing out…');
      try {
        await window.hgSignOut({ removeData: remove, syncWait: pending && online ? 10000 : 1500 });
      } catch (e) {
        if (e && e.message === 'not-configured') { c.close(); if (typeof window.logout === 'function') window.logout(); return; }
        c.setBusy(false);
        c.setBody('<div class="hg-sheet-note danger"><span>This phone couldn’t set your data aside (a storage problem), so you are still signed in.</span></div>' +
          '<p>To sign out anyway, remove your data from this phone.' + (pending ? ' ' + plural(pending, 'unsynced change', 'unsynced changes') + ' will be lost.' : '') + '</p>');
        c.setActions([
          { label: 'Sign out and remove data', kind: 'danger', keepOpen: true, onClick: async function (c2) {
              c2.setBusy(true, 'Signing out…');
              try { await window.hgSignOut({ removeData: true, syncWait: 1500 }); } catch (_) { c2.setBusy(false); }
            } },
          { label: 'Cancel', kind: 'plain', focus: true }
        ]);
      }
    }

    const ctx = window.hgSheet.open({
      title: 'Sign out?',
      body: body,
      actions: [{ label: 'Sign out', kind: 'primary', keepOpen: true, onClick: run }, { label: 'Cancel', kind: 'plain' }]
    });
    const cb = ctx.el.querySelector('#hgSoRemove'), warn = ctx.el.querySelector('#hgSoRemoveWarn');
    if (cb) cb.addEventListener('change', function () {
      warn.hidden = !cb.checked;
      const main = ctx.el.querySelector('.hg-sheet-actions button');
      if (main) { main.textContent = cb.checked ? 'Sign out and remove data' : 'Sign out'; main.className = 'hg-sheet-btn ' + (cb.checked ? 'danger' : 'primary'); }
    });
  };

  window.hgOpenAccountMenu = function () {
    const go = function (name) { if (typeof window.openWindow === 'function') window.openWindow(name); };
    if (!window.hgSheet) { go('profile'); return; }
    const p = window.HG_PROFILE || {};
    const name = p.full_name || (p.email ? p.email.split('@')[0] : 'Your account');
    const org = (p.organisations && p.organisations.name) || '';
    window.hgSheet.open({
      title: name,
      body: (p.email || org) ? '<p>' + escH(p.email || '') + (p.email && org ? '<br>' : '') + escH(org) + '</p>' : '',
      actions: [
        { label: 'Profile', kind: 'secondary', onClick: function () { go('profile'); } },
        { label: 'Settings', kind: 'secondary', onClick: function () { go('settings'); } },
        { label: 'Sign out', kind: 'secondary', keepOpen: true, onClick: function (c) { c.close(); setTimeout(window.hgConfirmSignOut, 0); } },
        { label: 'Close', kind: 'plain' }
      ]
    });
  };

  // Wait for supabase-client.js to finish initialising. If it's already
  // initialised by the time we get here (race: defer script vs setTimeout(0)),
  // boot synchronously instead of waiting for an event we missed.
  if (window.HG_AUTH) {
    boot();
  } else {
    document.addEventListener('hg:supa:ready', boot, { once: true });
  }
})();
