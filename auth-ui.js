/*
 * Hadron Group — Auth UI
 *
 * Renders the login / signup gate and the session-aware profile card.
 * Activates only once supabase-client.js fires hg:supa:ready and only if
 * the cloud is configured. Otherwise the app boots in legacy local-only
 * mode (useful for dev and for users who haven't migrated yet).
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
      color: var(--text-primary, #0e1530);
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
      background: var(--bg-primary, #fff); color: inherit;
      font-size: 15px;
    }
    .hg-auth-row input:focus { outline: 2px solid #00b1ca; outline-offset: 1px; }
    .hg-auth-btn {
      width: 100%; padding: 13px; border-radius: 12px; border: none;
      font-size: 15px; font-weight: 700; cursor: pointer;
      background: linear-gradient(135deg, #00b1ca, #1a3d9e); color: #fff;
      transition: transform 0.1s ease;
    }
    .hg-auth-btn:hover { transform: translateY(-1px); }
    .hg-auth-btn:disabled { opacity: 0.6; cursor: wait; }
    .hg-auth-btn.ghost {
      background: transparent; color: var(--text-primary, #0e1530);
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
    .hg-auth-switch { text-align: center; margin-top: 16px; font-size: 13px; opacity: 0.85; }
    .hg-auth-switch a { color: #00b1ca; cursor: pointer; font-weight: 600; }
    .hg-auth-error {
      margin-top: 12px; padding: 10px 12px; border-radius: 10px;
      background: rgba(220, 53, 69, 0.10); color: #d32f2f;
      font-size: 13px; line-height: 1.4;
    }
    .hg-auth-info {
      margin-top: 12px; padding: 10px 12px; border-radius: 10px;
      background: rgba(0,177,202,0.12); color: var(--text-primary, #0e1530);
      font-size: 13px; line-height: 1.4;
    }
    .hg-auth-footer {
      text-align: center; margin-top: 18px; font-size: 11px; opacity: 0.55;
    }
    .hg-sync-pill {
      position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
      z-index: 8000; background: #00b1ca; color: #fff;
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
      <img class="hg-auth-logo light" src="Hadron_Logo.png" alt="Hadron Group" />
      <img class="hg-auth-logo dark"  src="Hadron_Logo_dark.png" alt="Hadron Group" />
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

      ${lastError ? `<div class="hg-auth-error">${lastError}</div>` : ''}
      ${lastInfo  ? `<div class="hg-auth-info">${lastInfo}</div>`   : ''}

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
      setError(err.message || String(err));
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
      setError(err.message || String(err));
      busy = false; render();
    }
  }

  function teardown() {
    if (overlay) { overlay.remove(); overlay = null; }
  }

  // ── Public API ──────────────────────────────────────────
  window.HG_AUTH_UI = {
    show()  { mode = 'signin'; clear(); render(); },
    hide()  { teardown(); },
    isOpen() { return !!overlay; }
  };

  // ── Sync pill ───────────────────────────────────────────
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
    setTimeout(() => pill.classList.remove('show'), ms || 2400);
  }

  document.addEventListener('hg:sync:flushed', (e) => {
    const remaining = e.detail?.remaining ?? 0;
    showSyncPill(remaining ? `${remaining} change${remaining===1?'':'s'} still pending` : 'All changes synced ✓');
  });

  // ── Boot logic ──────────────────────────────────────────
  function paintLocalProfile() {
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    set('profileName', 'Local user');
    set('profileEmail', 'local@hadrongrp.com');
    set('profileCompany', 'Hadron Group (local mode)');
    set('profileRole', 'Local — cloud not configured');
    set('profileMemberSince', '—');
  }

  function showDesktop(visible) {
    // Always hide the legacy "demo / password" screen when cloud is configured.
    // We use an inline style so nothing — not the legacy logout(), not a stray
    // classList toggle — can accidentally re-reveal it.
    const legacy = document.getElementById('loginScreen');
    const desktop = document.getElementById('desktop');
    if (legacy) {
      legacy.classList.add('hidden');
      legacy.style.display = 'none';
      legacy.setAttribute('aria-hidden', 'true');
    }
    if (desktop) desktop.classList[visible ? 'add' : 'remove']('visible');
  }

  function boot() {
    if (!window.HG_AUTH || !window.HG_AUTH.configured) {
      // Cloud not configured — leave the legacy demo gate in place so
      // local-only users can still get into the app.
      console.info('[HG_AUTH_UI] Cloud not configured; running locally.');
      paintLocalProfile();
      return;
    }

    // Cloud configured — desktop is gated by Supabase session, not demo password.
    // Permanently retire the legacy demo gate.
    const legacy = document.getElementById('loginScreen');
    if (legacy) {
      legacy.classList.add('hidden');
      legacy.style.display = 'none';
      legacy.setAttribute('aria-hidden', 'true');
    }

    async function reconcile() {
      const session = await window.HG_AUTH.getSession();
      if (session) {
        teardown();
        showDesktop(true);
        await refreshProfileCard();
      } else {
        // Hide desktop and demo gate; auth overlay covers everything.
        showDesktop(false);
        window.HG_AUTH_UI.show();
      }
    }

    document.addEventListener('hg:auth:changed', () => reconcile());
    reconcile();
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
    document.body.setAttribute('data-role', profile.role || '');
    document.body.setAttribute('data-org-type', profile.organisations?.type || '');

    // Phase 3 seed — role-based home tile visibility.
    // Tiles tagged with `data-roles="admin"` show only for that role; tiles
    // without the attribute show for everyone.
    document.querySelectorAll('[data-roles]').forEach(el => {
      const allowed = (el.getAttribute('data-roles') || '').split(',').map(s => s.trim()).filter(Boolean);
      el.style.display = allowed.includes(profile.role) ? '' : 'none';
    });

    document.dispatchEvent(new CustomEvent('hg:profile:loaded', { detail: profile }));
  }

  // Sign out helper bound to a global so the profile screen can call it.
  // No confirm() — modal dialogs can be blocked by browsers / cause hangs,
  // and signing out is reversible (just sign back in).
  window.hgSignOut = async function () {
    if (!window.HG_AUTH) return;
    if (!window.HG_AUTH.configured) return;
    await window.HG_AUTH.signOut();
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
