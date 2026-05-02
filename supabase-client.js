/*
 * Hadron Group — Supabase client + auth + sync bridge
 *
 * Exposes:
 *   window.HG_AUTH   — auth helpers (signIn, signUp, signOut, onChange, getSession)
 *   window.HG_DB     — typed CRUD helpers per table, with offline queue fallback
 *   window.HG_SUPA   — raw supabase-js client (escape hatch)
 *
 * Configuration:
 *   Edit SUPABASE_URL and SUPABASE_ANON_KEY below after creating your
 *   Supabase project. Both values are PUBLIC (anon key is safe to ship in
 *   the browser; row-level security in supabase-schema.sql guards the data).
 */

(function () {
  'use strict';

  // ── EDIT ME ─────────────────────────────────────────────
  // SUPABASE_ANON_KEY is the "Publishable key" in newer Supabase dashboards
  // (Project Settings → API Keys → Publishable key, sb_publishable_…). Both
  // values are public-facing; row-level security guards the data.
  const SUPABASE_URL      = 'https://flttrqcstzprtxcdvexx.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_7_PDTLJxHx7tXxDbDeI6ow_DnEvoJGC';
  // ────────────────────────────────────────────────────────

  const CONFIGURED = !SUPABASE_URL.includes('YOUR-PROJECT')
                  && !SUPABASE_ANON_KEY.includes('YOUR-');

  // Wait for supabase-js (loaded via CDN in index.html) before initialising.
  // Always defers the callback so listeners registered by deferred scripts
  // have a chance to attach before we fire hg:supa:ready.
  function waitForSdk(cb, attempts) {
    attempts = attempts || 0;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return setTimeout(cb, 0);
    }
    if (attempts > 50) {
      console.error('[HG_SUPA] supabase-js never loaded — check the CDN script tag. Falling back to local-only mode.');
      setTimeout(() => document.dispatchEvent(new CustomEvent('hg:supa:ready', { detail: { configured: false, sdk: false } })), 0);
      return;
    }
    setTimeout(() => waitForSdk(cb, attempts + 1), 100);
  }

  // ── Offline queue ───────────────────────────────────────
  // When the user is offline (or not signed in), writes go to localStorage
  // and replay on next reconnect.
  const QUEUE_KEY = 'hg_sync_queue_v1';
  function loadQueue()   { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } }
  function saveQueue(q)  { localStorage.setItem(QUEUE_KEY, JSON.stringify(q || [])); }
  function enqueue(op)   { const q = loadQueue(); q.push(op); saveQueue(q); }
  function queueLen()    { return loadQueue().length; }

  async function flushQueue() {
    if (!CONFIGURED) return;
    const sb = window.HG_SUPA;
    if (!sb) return;
    const session = (await sb.auth.getSession()).data.session;
    if (!session) return;
    let q = loadQueue();
    if (!q.length) return;
    const remaining = [];
    for (const op of q) {
      try {
        if (op.kind === 'upsert') await sb.from(op.table).upsert(op.row);
        else if (op.kind === 'delete') await sb.from(op.table).delete().eq('id', op.id);
      } catch (err) {
        console.warn('[HG_SYNC] replay failed, requeuing', op, err);
        remaining.push(op);
      }
    }
    saveQueue(remaining);
    document.dispatchEvent(new CustomEvent('hg:sync:flushed', { detail: { remaining: remaining.length } }));
  }

  // ── Init ────────────────────────────────────────────────
  waitForSdk(function init() {
    if (!CONFIGURED) {
      console.warn('[HG_SUPA] Not configured yet — running in local-only mode. Edit SUPABASE_URL / SUPABASE_ANON_KEY in supabase-client.js.');
    }

    const client = CONFIGURED
      ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage,
            storageKey: 'hg-auth-v1'
          }
        })
      : null;

    window.HG_SUPA = client;

    // ── Auth helpers ────────────────────────────────────
    const HG_AUTH = {
      configured: CONFIGURED,
      get client() { return client; },

      async getSession() {
        if (!client) return null;
        const { data } = await client.auth.getSession();
        return data.session || null;
      },

      async getProfile() {
        if (!client) return null;
        const session = await this.getSession();
        if (!session) return null;
        const { data, error } = await client
          .from('profiles')
          .select('id, email, full_name, phone, organisation_id, role, language, preferences, created_at, organisations(name,slug,type)')
          .eq('id', session.user.id)
          .maybeSingle();
        if (error) { console.warn('[HG_AUTH] getProfile error', error); return null; }
        return data;
      },

      async signUpEmail(email, password, fullName) {
        if (!client) throw new Error('Cloud not configured.');
        const { data, error } = await client.auth.signUp({
          email, password,
          options: { data: { full_name: fullName || '' } }
        });
        if (error) throw error;
        return data;
      },

      async signInEmail(email, password) {
        if (!client) throw new Error('Cloud not configured.');
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
      },

      async signInGoogle() {
        if (!client) throw new Error('Cloud not configured.');
        const { error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: location.origin + location.pathname }
        });
        if (error) throw error;
      },

      async sendPasswordReset(email) {
        if (!client) throw new Error('Cloud not configured.');
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + location.pathname
        });
        if (error) throw error;
      },

      async signOut() {
        if (!client) return;
        await client.auth.signOut();
      },

      // Patch a single key into profiles.preferences (jsonb merge).
      async setPreference(key, value) {
        if (!client) return null;
        const session = await this.getSession();
        if (!session) return null;
        const current = (window.HG_PROFILE && window.HG_PROFILE.preferences) || {};
        const next = Object.assign({}, current, { [key]: value });
        const { data, error } = await client
          .from('profiles')
          .update({ preferences: next })
          .eq('id', session.user.id)
          .select('preferences')
          .maybeSingle();
        if (error) { console.warn('[HG_AUTH] setPreference error', error); return null; }
        if (window.HG_PROFILE) window.HG_PROFILE.preferences = data?.preferences || next;
        return data?.preferences || next;
      },

      onChange(handler) {
        if (!client) return () => {};
        const { data: { subscription } } = client.auth.onAuthStateChange((_evt, session) => handler(session));
        return () => subscription.unsubscribe();
      }
    };
    window.HG_AUTH = HG_AUTH;

    // ── DB helpers ──────────────────────────────────────
    function tableApi(table) {
      return {
        async list(filters) {
          if (!client) return [];
          let q = client.from(table).select('*');
          if (filters) Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
          const { data, error } = await q;
          if (error) { console.warn('[HG_DB]', table, 'list error', error); return []; }
          return data || [];
        },
        async get(id) {
          if (!client) return null;
          const { data, error } = await client.from(table).select('*').eq('id', id).maybeSingle();
          if (error) { console.warn('[HG_DB]', table, 'get error', error); return null; }
          return data;
        },
        async upsert(row) {
          if (!client || !navigator.onLine) {
            enqueue({ kind: 'upsert', table, row });
            return row;
          }
          const { data, error } = await client.from(table).upsert(row).select().maybeSingle();
          if (error) {
            console.warn('[HG_DB]', table, 'upsert error — queued', error);
            enqueue({ kind: 'upsert', table, row });
            return row;
          }
          return data;
        },
        async remove(id) {
          if (!client || !navigator.onLine) {
            enqueue({ kind: 'delete', table, id });
            return true;
          }
          const { error } = await client.from(table).delete().eq('id', id);
          if (error) {
            console.warn('[HG_DB]', table, 'delete error — queued', error);
            enqueue({ kind: 'delete', table, id });
          }
          return !error;
        },
        subscribe(handler) {
          if (!client) return () => {};
          const channel = client
            .channel('rt:' + table)
            .on('postgres_changes', { event: '*', schema: 'public', table }, handler)
            .subscribe();
          return () => client.removeChannel(channel);
        }
      };
    }

    window.HG_DB = {
      organisations:      tableApi('organisations'),
      profiles:           tableApi('profiles'),
      customers:          tableApi('customers'),
      sites:              tableApi('sites'),
      equipment:          tableApi('equipment'),
      samples:            tableApi('samples'),
      sample_results:     tableApi('sample_results'),
      jobs:               tableApi('jobs'),
      audit_log:          tableApi('audit_log'),
      messages:           tableApi('messages'),
      push_subscriptions: tableApi('push_subscriptions'),
      lims_tests:           tableApi('lims_tests'),
      lims_test_profiles:   tableApi('lims_test_profiles'),
      lims_worksheets:      tableApi('lims_worksheets'),
      lims_instruments:     tableApi('lims_instruments'),
      lims_inventory:       tableApi('lims_inventory'),
      lims_documents:       tableApi('lims_documents'),
      lims_competencies:    tableApi('lims_competencies'),
      _queueLen: queueLen,
      _flush: flushQueue
    };

    // Auto-flush queue when we come back online or sign in
    window.addEventListener('online', flushQueue);
    HG_AUTH.onChange((session) => {
      document.dispatchEvent(new CustomEvent('hg:auth:changed', { detail: { session } }));
      if (session) flushQueue();
    });

    // Notify the app that the bridge is ready
    document.dispatchEvent(new CustomEvent('hg:supa:ready', { detail: { configured: CONFIGURED } }));
  });
})();
