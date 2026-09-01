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
  // When the user is offline (or a write errors) ops go to localStorage and replay on next
  // reconnect / sign-in. Replays are BOUNDED: a transient failure retries up to MAX_ATTEMPTS,
  // a permanent one (RLS/constraint/4xx — e.g. a demoted user's owner-only write, or a
  // lost-response-after-commit whose row now exists and can't be re-UPDATEd by that role) is
  // moved to a dead-letter list instead of looping forever. Enqueue de-dupes per (table,id) so
  // the latest write for a record wins and the queue can't grow unbounded on repeated pulls.
  const QUEUE_KEY = 'hg_sync_queue_v1';
  const DEAD_KEY  = 'hg_sync_deadletter_v1';
  const MAX_ATTEMPTS = 6;
  function loadQueue()   { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } }
  // While signing out, a raced-out flush must NOT re-persist the queue after hgClearTenantData
  // wipes it — otherwise the departing user's ops would survive and replay into the NEXT user's
  // session (cross-tenant leak). hgSignOut sets window.__hgSuppressQueuePersist before wiping;
  // the reload clears it. Sends still happen (under the still-valid old session); only local
  // persistence is suppressed.
  function saveQueue(q)  { if (window.__hgSuppressQueuePersist) return; localStorage.setItem(QUEUE_KEY, JSON.stringify(q || [])); }
  function loadDead()    { try { return JSON.parse(localStorage.getItem(DEAD_KEY) || '[]'); } catch { return []; } }
  function saveDead(d)   { if (window.__hgSuppressQueuePersist) return; try { localStorage.setItem(DEAD_KEY, JSON.stringify((d || []).slice(-50))); } catch (_) {} }
  function opId(op)      { return op.table + ':' + (op.kind === 'delete' ? op.id : (op.row && op.row.id)); }
  function enqueue(op)   {
    const key = opId(op);
    const q = loadQueue().filter(o => opId(o) !== key);   // a newer write for a record supersedes any pending op for it
    op.attempts = op.attempts || 0;
    q.push(op);
    saveQueue(q);
  }
  function queueLen()    { return loadQueue().length; }
  function deadLen()     { return loadDead().length; }
  function deadLetter(op, reason) {
    const d = loadDead();
    d.push({ kind: op.kind, table: op.table, id: op.kind === 'delete' ? op.id : (op.row && op.row.id),
             attempts: op.attempts, reason: String(reason || '').slice(0, 300), deadAt: new Date().toISOString() });
    saveDead(d);
  }
  // Permanent = won't self-heal on retry: RLS/permission (42501, PGRST301), not-found (PGRST116),
  // any data-exception / integrity-constraint class (22xxx / 23xxx, incl. lettered codes like 22P02
  // / 23P01), or a 4xx other than timeout (408) / rate-limit (429). NOTE: supabase-js puts the HTTP
  // status on the RESPONSE envelope (res.status), not on res.error — flushQueue passes it in.
  function isPermanentError(err, status) {
    const code = String((err && err.code) || '');
    if (/^(42501|PGRST301|PGRST116|2[23][0-9A-Z]{3})$/.test(code)) return true;
    const s = Number(status || (err && (err.status || err.statusCode)) || 0);
    if (s >= 400 && s < 500 && s !== 408 && s !== 429) return true;
    return false;
  }

  async function flushQueue() {
    if (!CONFIGURED) return;
    const sb = window.HG_SUPA;
    if (!sb) return;
    const session = (await sb.auth.getSession()).data.session;
    if (!session) return;
    let q = loadQueue();
    if (!q.length) return;
    const remaining = [];
    let deadened = 0;
    for (const op of q) {
      let error = null, status = 0;
      try {
        let res;
        if (op.kind === 'upsert') res = await sb.from(op.table).upsert(op.row);
        else if (op.kind === 'delete') res = await sb.from(op.table).delete().eq('id', op.id);
        error = res && res.error;                          // supabase-js returns {error} (no throw) on RLS/constraint
        status = (res && res.status) || 0;                 // HTTP status lives on the response envelope, not on error
      } catch (thrown) {
        error = thrown;                                    // network / transport failure → transient
      }
      if (!error) continue;                                // success → drop from the queue
      op.attempts = (op.attempts || 0) + 1;
      if (!isPermanentError(error, status) && op.attempts < MAX_ATTEMPTS) {
        remaining.push(op);                                // transient / unknown → retry, bounded
      } else {
        deadLetter(op, (error && (error.message || error.code)) || 'failed');   // permanent or exhausted → set aside
        deadened++;
      }
    }
    saveQueue(remaining);
    if (deadened) console.warn('[HG_SYNC] ' + deadened + ' op(s) could not sync and were set aside (localStorage.' + DEAD_KEY + ')');
    document.dispatchEvent(new CustomEvent('hg:sync:flushed', { detail: { remaining: remaining.length, dead: loadDead().length, deadNew: deadened } }));
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
          .select('id, email, full_name, phone, organisation_id, role, language, preferences, created_at, organisations(name,slug,type,erp_tenant_id)')
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
      lims_personnel:       tableApi('lims_personnel'),
      lims_calibrations:    tableApi('lims_calibrations'),
      lims_ncs:             tableApi('lims_ncs'),
      lims_quotes:          tableApi('lims_quotes'),
      academy_progress:     tableApi('academy_progress'),
      service_reports:      tableApi('service_reports'),
      org_invites:          tableApi('org_invites'),
      incidents:            tableApi('incidents'),
      _queueLen: queueLen,
      _deadLen: deadLen,
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
