/*
 * Hadron Group — Web Push subscription helper
 *
 * Exposes:
 *   window.hgEnablePush()      — request permission + register subscription
 *   window.hgDisablePush()     — unsubscribe and remove the row from Supabase (turned off on purpose)
 *   window.hgPushPause(uid, keep) — the phone stops taking an account's notifications (sign-out, guest, user switch);
 *                                 keep: they come back by themselves when that account signs in here again
 *   window.hgPushResume()      — signed in: this account's notifications back on, where it had them (hg:profile:loaded)
 *   window.hgPushStatus()      — current state ('unsupported','denied','granted','unknown')
 *
 * The actual push *delivery* (the server-side bit that sends a payload to
 * the user's browser) is done by a Supabase Edge Function — see
 * SUPABASE_SETUP.md for the deploy steps. This file only handles the
 * client-side subscription lifecycle.
 */

(function () {
  'use strict';

  // VAPID public key — Hadron Group production keypair (Apr 2026).
  // The matching private key lives only as a Supabase Edge Function secret.
  const VAPID_PUBLIC_KEY = 'BF7HRqIbJ_MbQSIx6Huph2pWcYWPYLneNjCLMhHXC5FySxfcZCpMJ9WtWuJ89EdqAWNB_0AY7Qjs8aewkmvc2lo';

  function isSupported() {
    return 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window;
  }

  function urlB64ToUint8Array(b64) {
    const padding = '='.repeat((4 - b64.length % 4) % 4);
    const base64  = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  async function getRegistration() {
    if (!('serviceWorker' in navigator)) return null;
    return await navigator.serviceWorker.ready;
  }

  function status() {
    if (!isSupported())                          return 'unsupported';
    if (Notification.permission === 'denied')    return 'denied';
    if (Notification.permission === 'granted')   return 'granted';
    return 'unknown';
  }

  // Whose notifications this phone takes, kept on the phone across sign-outs (device markers, not account data):
  // hg-push-owner = the account this phone's subscription was made for; hg-push-wish = the accounts that had push on
  // here. Signing out, "Use the calculators" or another account signing in ends the subscription (pause), so the next
  // person doesn't get them; they come back by themselves when that same account signs in again (resume), on a phone
  // that still allows notifications (Jaco, 2026-10-09).
  const OWNER_KEY = 'hg-push-owner', WISH_KEY = 'hg-push-wish';
  // hg-push-v176: this phone's subscriptions are made by v176 or later. Then a subscription with no owner recorded is
  // nobody's (the page that asked for it closed before the browser made it): ended, never handed to whoever signs in.
  // Without it, one with no owner is from before v176: the account signed in's (Jaco, 2026-10-09).
  const MADE_KEY = 'hg-push-v176';
  function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (_) {} }
  function wishes() {
    try { const a = JSON.parse(lsGet(WISH_KEY) || '[]'); return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string' && x; }) : []; } catch (_) { return []; }
  }
  function setWish(uid, on) {
    if (!uid) return;
    const a = wishes().filter(function (x) { return x !== uid; });
    if (on) a.push(uid);
    lsSet(WISH_KEY, a.length ? JSON.stringify(a.slice(-20)) : null);
  }
  // Still this account's turn on this phone (resume): signed in as it here, not a guest, and no sign-out or user switch
  // under way, in this tab (frozen) or another one (its sign-out lock, auth-ui.js withSignOutLock).
  async function stillFor(uid) {
    const p = window.HG_PROFILE;
    if (!uid || !p || p.id !== uid || window.__hgTenantFrozen || document.body.classList.contains('hg-guest')) return false;
    if (lsGet('hg-last-uid') !== uid) return false;
    try {
      if (navigator.locks && typeof navigator.locks.query === 'function') {
        const s = await navigator.locks.query();
        if ((s.held || []).concat(s.pending || []).some(function (l) { return l.name === 'hg-signout'; })) return false;
      }
    } catch (_) {}
    const t = +lsGet('hg-signing-out') || 0;
    return !(t > 0 && Date.now() - t < 15000);
  }
  // A subscription made for this account. One made for another account, or before v176 (no owner recorded), is replaced:
  // the server keeps a row per account and address, and this phone must never take someone else's notifications.
  // guard (resume): asked again once the browser has made it and once its row is sent; no longer this account's turn (it
  // signed out meanwhile, here or in another tab): the subscription ends again, so it can't outlive the sign-out.
  async function subscribeFor(uid, guard) {
    const reg = await getRegistration();
    if (!reg) return false;
    let sub = await reg.pushManager.getSubscription();
    if (sub && lsGet(OWNER_KEY) !== uid) {
      const old = sub.endpoint;
      try { await sub.unsubscribe(); } catch (_) {}
      sub = null;
      // this account's own row for the old address, if it had one (another account's can't be reached: it stops working)
      try { if (window.HG_SUPA) await window.HG_SUPA.from('push_subscriptions').delete().eq('user_id', uid).eq('endpoint', old); } catch (_) {}
    }
    if (!sub) {
      lsSet(MADE_KEY, '1');
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }
    if (guard && !(await guard())) { try { await sub.unsubscribe(); } catch (_) {} return false; }
    const json = sub.toJSON();
    // Its row, straight to the server: one per account and address, so a second Enable (or a renewal) updates it. Not
    // through the offline queue: there a row already on the server was refused (23505) and set aside as an unsaved change.
    // Not sent (offline, an error): it throws, and the subscription isn't recorded as this account's (made again next time).
    if (!window.HG_SUPA) throw new Error('push: no connection to the server');
    const row = {
      user_id:     uid,
      endpoint:    json.endpoint,
      p256dh:      json.keys.p256dh,
      auth_secret: json.keys.auth,
      user_agent:  navigator.userAgent
    };
    let sent = await window.HG_SUPA.from('push_subscriptions').upsert(row, { onConflict: 'user_id,endpoint' });
    // (a database without supabase-schema.sql's unique (user_id, endpoint) answers 42P10: the row is then replaced the long
    // way, this account's own row for that address deleted and the row inserted, under the same push_self rule)
    if (sent && sent.error && sent.error.code === '42P10') {
      try { await window.HG_SUPA.from('push_subscriptions').delete().eq('user_id', uid).eq('endpoint', json.endpoint); } catch (_) {}
      sent = await window.HG_SUPA.from('push_subscriptions').insert(row);
      // not inserted once its row was deleted: no longer recorded as this account's (Profile says off, and the next resume
      // makes it again), never left "on" with no row on the server
      if (sent && sent.error) lsSet(OWNER_KEY, null);
    }
    if (sent && sent.error) throw sent.error;
    if (guard && !(await guard())) {
      try { await sub.unsubscribe(); } catch (_) {}
      try { if (window.HG_SUPA) await window.HG_SUPA.from('push_subscriptions').delete().eq('user_id', uid).eq('endpoint', json.endpoint); } catch (_) {}
      return false;
    }
    lsSet(OWNER_KEY, uid);
    return true;
  }

  async function setStatusText() {
    const el = document.getElementById('profilePushStatus');
    if (!el) return;
    let s = status();
    // Allowed isn't on: this phone's subscription can have ended ("Use the calculators" ends it) with the permission kept. And
    // on only when the subscription is the signed-in account's (one Enable couldn't record, or another account's not yet
    // ended, isn't this account's push).
    if (s === 'granted') {
      try {
        const reg = await navigator.serviceWorker.getRegistration(); const sub = reg ? await reg.pushManager.getSubscription() : null;
        const me = window.HG_PROFILE && window.HG_PROFILE.id;
        if (!sub || !me || lsGet(OWNER_KEY) !== me) s = 'off';
      } catch (_) {}
    }
    const map = {
      unsupported: '🚫 Push not supported on this device. On iPhone, install this app to your Home Screen first.',
      denied: '🔇 Push is blocked. Enable it in your browser settings to receive alerts.',
      granted: '✅ Push enabled.',
      off: '🔕 Push is off on this phone. Tap “Enable push notifications” to turn it on.',
      unknown: ''
    };
    el.textContent = map[s] || '';
  }

  async function enable() {
    if (!isSupported()) {
      alert('Push notifications are not supported on this device. iPhone users: install this app to your Home Screen first (Share → Add to Home Screen), then try again.');
      setStatusText();
      return false;
    }

    if (VAPID_PUBLIC_KEY.startsWith('YOUR-')) {
      alert('Push isn\'t configured yet. Generate VAPID keys (see SUPABASE_SETUP.md) and paste the public key into push.js.');
      return false;
    }

    if (!window.HG_AUTH || !window.HG_AUTH.configured) {
      alert('Sign in first. Push subscriptions are tied to your account.');
      return false;
    }

    const session = await window.HG_AUTH.getSession();
    if (!session) {
      alert('Sign in first.');
      return false;
    }

    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      setStatusText();
      return false;
    }

    let made = false;
    try { made = await subscribeFor(session.user.id); }
    catch (e) {
      alert('Push notifications couldn\'t be turned on. Check your connection and try again.');
      setStatusText();
      return false;
    }
    if (!made) {
      alert('Service worker not ready. Reload the app and try again.');
      return false;
    }
    setWish(session.user.id, true);
    setStatusText();
    return true;
  }

  // This phone stops taking an account's notifications: signing out, "Use the calculators", another account signing in
  // (auth-ui.js). keep: they come back by themselves when that account signs in here again (resume); not after "remove my
  // data from this phone", nor when turned off on purpose. Its server row goes too while the session still allows it.
  // The registration as it is now: a phone still installing the app (no active worker yet) has no subscription to end,
  // and navigator.serviceWorker.ready would wait for the install ("Use the calculators" waited its full 3 s).
  async function pause(uid, keep) {
    if (!isSupported()) return;
    const owner = lsGet(OWNER_KEY) || null;
    let sub = null;
    try { const reg = await navigator.serviceWorker.getRegistration(); sub = reg ? await reg.pushManager.getSubscription() : null; } catch (_) {}
    const who = uid || owner;
    if (who) {
      if (!keep) setWish(who, false);
      else if (sub && (owner === who || (!owner && !lsGet(MADE_KEY)))) setWish(who, true);   // (before v176 no owner was recorded: this account's)
    }
    let ended = true;
    if (sub) {
      const endpoint = sub.endpoint;
      try { ended = (await sub.unsubscribe()) !== false; } catch (_) { ended = false; }
      // Best-effort cleanup of the server row: a second at most (the subscription has ended; its row can't reach the phone)
      try {
        const session = window.HG_AUTH && window.HG_AUTH.configured ? await window.HG_AUTH.getSession() : null;
        if (session && session.user && window.HG_SUPA) {
          await Promise.race([window.HG_SUPA
            .from('push_subscriptions')
            .delete()
            .eq('user_id', session.user.id)
            .eq('endpoint', endpoint), new Promise(function (r) { setTimeout(r, 1000); })]);
        }
      } catch (e) { /* ignore */ }
    }
    if (ended) lsSet(OWNER_KEY, null);   // (not ended: still that account's, so it's ended again later, never handed on)
    setStatusText();
  }
  // Turned off on purpose: it doesn't come back by itself.
  async function disable() {
    const p = window.HG_PROFILE;
    let uid = p && p.id;
    if (!uid) { try { const s = window.HG_AUTH && window.HG_AUTH.configured ? await window.HG_AUTH.getSession() : null; uid = s && s.user && s.user.id; } catch (_) {} }
    return pause(uid || null, false);
  }

  // Signed in: this account's notifications come back where it had them on (paused at sign-out, guest use or another
  // account's sign-in), on a phone that still allows notifications: no question asked. A subscription this phone still
  // holds for another account ends now (its row stays on the server, unreachable). One from before v176 (no owner
  // recorded) is renewed under this account's name when the server has this account's row for it; else it was another
  // account's or nobody's, and ends.
  let resuming = null;
  function resume() {
    if (resuming) return resuming;
    resuming = (async function () {
      const p = window.HG_PROFILE, uid = p && p.id;
      if (!isSupported() || !(await stillFor(uid))) return;
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      const owner = lsGet(OWNER_KEY);
      if (sub && owner === uid) return;                                        // already this account's
      let legacy = !!(sub && !owner && !lsGet(MADE_KEY));                      // from before v176: whose?
      if (legacy) {   // this account's only if the server has its row for that address; not known yet (offline): later
        let mine = null;
        try {
          const r = window.HG_SUPA ? await window.HG_SUPA.from('push_subscriptions').select('endpoint').eq('user_id', uid).eq('endpoint', sub.endpoint).limit(1) : null;
          if (r && !r.error && Array.isArray(r.data)) mine = r.data.length > 0;
        } catch (_) {}
        if (mine === null) return;
        legacy = mine;
        // this account had push on here: wanted from now on, so a renewal that fails half-way (its old subscription and row
        // already ended) is made again at the next resume instead of being dropped
        if (legacy) setWish(uid, true);
      }
      const want = wishes().indexOf(uid) !== -1 || legacy;
      if (!want || Notification.permission !== 'granted') {
        if (sub && !legacy) { try { await sub.unsubscribe(); } catch (_) {} lsSet(OWNER_KEY, null); setStatusText(); }   // another account's, or nobody's
        return;
      }
      if (await subscribeFor(uid, function () { return stillFor(uid); })) setWish(uid, true);
      setStatusText();
    })().catch(function () {}).finally(function () { resuming = null; });
    return resuming;
  }

  // Public API
  window.hgEnablePush  = enable;
  window.hgDisablePush = disable;
  window.hgPushPause   = pause;
  window.hgPushResume  = resume;
  window.hgPushStatus  = status;

  // Refresh the profile page status text whenever the profile tab opens
  // or the auth state changes. Signed in (the profile confirmed who this is): this account's notifications back on.
  document.addEventListener('hg:profile:loaded', function () { setStatusText(); resume(); });
  document.addEventListener('hg:auth:changed', setStatusText);
  window.addEventListener('online', function () { if (window.HG_PROFILE) resume(); });   // a try offline failed
  if (window.HG_PROFILE) resume();   // the profile loaded before this script
})();
