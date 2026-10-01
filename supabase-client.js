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
  // While signing out / switching user, a raced-out flush must NOT re-persist the queue after
  // hgClearTenantData wipes it — otherwise the departing user's ops would survive and replay into
  // the NEXT user's session (cross-tenant leak). auth-ui sets window.__hgSuppressQueuePersist before
  // wiping (the reload clears it); a running flush also stops sending at its next op.
  function saveQueue(q)  { if (window.__hgSuppressQueuePersist) return; try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q || [])); } catch (e) { console.warn('[HG_SYNC] queue persist failed (storage full?)', e); } }
  function loadDead()    { try { return JSON.parse(localStorage.getItem(DEAD_KEY) || '[]'); } catch { return []; } }
  function saveDead(d)   { if (window.__hgSuppressQueuePersist) return; try { localStorage.setItem(DEAD_KEY, JSON.stringify((d || []).slice(-50))); } catch (_) {} }
  function opId(op)      { return op.table + ':' + (op.kind === 'delete' ? op.id : (op.row && op.row.id)); }
  function enqueue(op)   {
    const key = opId(op);
    const q = loadQueue().filter(o => opId(o) !== key);   // a newer write for a record supersedes any pending op for it
    op.attempts = op.attempts || 0;
    // Unique per enqueue, so a running flush can tell ops added (or replaced) mid-run from the snapshot it is sending.
    op.qid = op.qid || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    q.push(op);
    saveQueue(q);
  }
  // Identity of one queued op: its qid, or table:id for ops queued before qids existed
  // (unique within a queue because enqueue de-dupes per record).
  function opTok(op)     { return op.qid ? 'q:' + op.qid : 'k:' + opId(op); }
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

  // Single-flight: the online event, sign-in and sign-out can all ask for a flush at once; they share
  // one run instead of sending the same ops twice and racing each other's final save.
  let _flushRun = null;
  function flushQueue() {
    if (_flushRun) return _flushRun;
    _flushRun = _flushOnce().finally(() => { _flushRun = null; });
    return _flushRun;
  }
  // A stalled request must not pin the single-flight run forever, so each op has a time limit. It
  // scales with the payload (a report with photos on a slow uplink needs minutes, ~100 kbps floor),
  // and a time-out is NOT a failed attempt: the op stays queued as it was, so a big upload is never
  // dead-lettered just for being slow (the run moves on past a big one, and stops if a small one
  // times out too).
  const OP_TIMEOUT_MS = 20000;
  function opTimeoutMs(op) {
    let n = 0;
    try { n = JSON.stringify(op.row || '').length; } catch (_) {}
    return Math.max(OP_TIMEOUT_MS, Math.round(n / 12.5));
  }
  async function sendOp(sb, op) {
    const b = op.kind === 'upsert' ? sb.from(op.table).upsert(op.row)
            : op.kind === 'delete' ? sb.from(op.table).delete().eq('id', op.id) : null;
    if (!b) return { res: { error: { message: 'unknown op kind' }, status: 400 }, timedOut: false };
    if (typeof b.abortSignal !== 'function' || typeof AbortController === 'undefined') return { res: await b, timedOut: false };
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), opTimeoutMs(op));
    try {
      const res = await b.abortSignal(ctrl.signal);
      return { res, timedOut: ctrl.signal.aborted };
    } catch (e) {
      if (ctrl.signal.aborted) return { res: null, timedOut: true };
      throw e;
    } finally { clearTimeout(t); }
  }
  // The queue may only be sent by the user it belongs to (hg-last-uid), in the organisation it was
  // made in (hg-last-org, checked against the loaded profile), and never while sign-out / a user or
  // org switch has frozen it (__hgSuppressQueuePersist) or a join has paused it (__hgQueuePaused).
  // Rows default to current_org() on the server, so sending under the wrong user or org would write
  // them into someone else's organisation.
  function queueOwner() { try { return localStorage.getItem('hg-last-uid'); } catch (_) { return null; } }
  function queueBlocked() { return !!(window.__hgSuppressQueuePersist || window.__hgQueuePaused); }
  async function mayFlushAs(sb, owner) {
    const s = (await sb.auth.getSession()).data.session;
    if (!s || !s.user || !owner || s.user.id !== owner || queueOwner() !== owner) return false;
    const p = window.HG_PROFILE;
    if (!p || p.id !== owner) return false;              // profile not loaded yet: refreshProfileCard flushes once it is
    let org = null;
    try { org = localStorage.getItem('hg-last-org'); } catch (_) {}
    // No organisation recorded (e.g. storage too full to record it) can't be compared: allow, as the
    // rows themselves carry organisation_id where it was known.
    return !org || org === (p.organisation_id || null);
  }
  async function _flushOnce() {
    if (!CONFIGURED) return;
    const sb = window.HG_SUPA;
    if (!sb || queueBlocked()) return;
    const owner = queueOwner();
    if (!(await mayFlushAs(sb, owner))) return;
    const snapshot = loadQueue();
    if (!snapshot.length) return;
    const done = new Set();       // tokens sent or set aside
    const retry = new Map();      // token -> op with bumped attempts (transient failure, try again later)
    let deadened = 0;
    // Persist progress after EVERY op, merged with the live queue. Ops enqueued while this run is
    // sending (new qids), or newer writes that replaced a snapshot op, are kept. The old single save at
    // the end dropped anything saved mid-flush, and left already-sent ops queued if the run was cut short
    // (e.g. sign-out's time limit), which could later replay stale data over newer edits.
    const persist = () => {
      const out = [];
      for (const o of loadQueue()) {
        const t = opTok(o);
        if (done.has(t)) continue;
        out.push(retry.has(t) ? retry.get(t) : o);
      }
      saveQueue(out);
      return out.length;
    };
    for (const op of snapshot) {
      // Signing out / switching user froze the queue, or a join paused it: stop sending. Anything sent
      // after a freeze would stay in the frozen copy and replay later as a stale overwrite.
      if (queueBlocked()) break;
      // Another tab may have signed this user out or switched user since the run started.
      if (!(await mayFlushAs(sb, owner))) break;
      let error = null, status = 0;
      const t = opTok(op);
      try {
        const sent = await sendOp(sb, op);
        if (sent.timedOut) {                               // too slow right now: op stays queued unchanged
          persist();
          if (opTimeoutMs(op) > OP_TIMEOUT_MS) continue;    // a big upload timed out: smaller ops behind it may still get through
          break;                                           // even a small op timed out: the link is down
        }
        const res = sent.res;
        error = res && res.error;                          // supabase-js returns {error} (no throw) on RLS/constraint
        status = (res && res.status) || 0;                 // HTTP status lives on the response envelope, not on error
      } catch (thrown) {
        error = thrown;                                    // network / transport failure → transient
      }
      if (!error) { done.add(t); persist(); continue; }   // success → drop from the queue
      op.attempts = (op.attempts || 0) + 1;
      if (!isPermanentError(error, status) && op.attempts < MAX_ATTEMPTS) {
        retry.set(t, op);                                  // transient / unknown → retry, bounded
      } else {
        deadLetter(op, (error && (error.message || error.code)) || 'failed');   // permanent or exhausted → set aside
        deadened++;
        done.add(t);
      }
      persist();
    }
    const remaining = persist();
    if (deadened) console.warn('[HG_SYNC] ' + deadened + ' op(s) could not sync and were set aside (localStorage.' + DEAD_KEY + ')');
    document.dispatchEvent(new CustomEvent('hg:sync:flushed', { detail: { remaining, dead: loadDead().length, deadNew: deadened } }));
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

      // Set a new password for the signed-in user (after a reset link, or from Profile).
      async updatePassword(password) {
        if (!client) throw new Error('Cloud not configured.');
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
      },

      // The user's own name / phone (RLS profiles_self_update: own row; role and organisation can't change).
      async updateMyProfile(fields) {
        if (!client) throw new Error('Cloud not configured.');
        const session = await this.getSession();
        if (!session) throw new Error('You are signed out. Sign in and try again.');
        const patch = {};
        ['full_name', 'phone'].forEach((k) => { if (fields && k in fields) patch[k] = fields[k]; });
        const { data, error } = await client.from('profiles').update(patch).eq('id', session.user.id)
          .select('full_name, phone').maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Your profile could not be updated.');
        return data;
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
        const { data: { subscription } } = client.auth.onAuthStateChange((evt, session) => handler(session, evt));
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
    HG_AUTH.onChange((session, event) => {
      // Signed in through a password-reset link: auth-ui asks for a new password once the profile has
      // loaded. Kept in sessionStorage, so it survives a start-up reload (e.g. a user switch).
      if (event === 'PASSWORD_RECOVERY' && session && session.user) {
        // Whose reset it is: only that user is asked (never the next person on this tab).
        try { sessionStorage.setItem('hg-pw-recovery', session.user.id); } catch (_) {}
        document.dispatchEvent(new CustomEvent('hg:auth:recovery'));
      }
      document.dispatchEvent(new CustomEvent('hg:auth:changed', { detail: { session, event } }));
      if (session) flushQueue();
    });

    // Notify the app that the bridge is ready
    document.dispatchEvent(new CustomEvent('hg:supa:ready', { detail: { configured: CONFIGURED } }));
  });
})();
