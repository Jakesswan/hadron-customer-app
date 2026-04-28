/*
 * Hadron Group — Web Push subscription helper
 *
 * Exposes:
 *   window.hgEnablePush()      — request permission + register subscription
 *   window.hgDisablePush()     — unsubscribe and remove the row from Supabase
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

  async function setStatusText() {
    const el = document.getElementById('profilePushStatus');
    if (!el) return;
    const s = status();
    const map = {
      unsupported: '🚫 Push not supported on this device. On iPhone, install this app to your Home Screen first.',
      denied: '🔇 Push is blocked. Enable it in your browser settings to receive alerts.',
      granted: '✅ Push enabled.',
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

    const reg = await getRegistration();
    if (!reg) {
      alert('Service worker not ready. Reload the app and try again.');
      return false;
    }

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    const json = sub.toJSON();
    await window.HG_DB.push_subscriptions.upsert({
      user_id:     session.user.id,
      endpoint:    json.endpoint,
      p256dh:      json.keys.p256dh,
      auth_secret: json.keys.auth,
      user_agent:  navigator.userAgent
    });

    setStatusText();
    return true;
  }

  async function disable() {
    if (!isSupported()) return;
    const reg = await getRegistration();
    const sub = reg && await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      // Best-effort cleanup of the server row
      try {
        const session = await window.HG_AUTH.getSession();
        if (session && window.HG_SUPA) {
          await window.HG_SUPA
            .from('push_subscriptions')
            .delete()
            .eq('user_id', session.user.id)
            .eq('endpoint', endpoint);
        }
      } catch (e) { /* ignore */ }
    }
    setStatusText();
  }

  // Public API
  window.hgEnablePush  = enable;
  window.hgDisablePush = disable;
  window.hgPushStatus  = status;

  // Refresh the profile page status text whenever the profile tab opens
  // or the auth state changes.
  document.addEventListener('hg:profile:loaded', setStatusText);
  document.addEventListener('hg:auth:changed', setStatusText);
})();
