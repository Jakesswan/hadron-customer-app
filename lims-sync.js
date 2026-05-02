/*
 * Hadron Group — LIMS ↔ Supabase cloud sync bridge
 *
 * Responsibilities
 *  - On profile load, pull all org-scoped LIMS data from Supabase and seed
 *    the local IndexedDB so this device has the same view as every other.
 *  - When LIMS makes a local change (DB.put / DB.del), mirror it to the
 *    matching Supabase table.
 *  - Subscribe to realtime changes on each table; when a remote change
 *    arrives, write it to local IndexedDB without re-firing the sync hook,
 *    then ask LIMS to re-render.
 *
 * Mapping
 *  Several LIMS stores have a typed counterpart in Supabase (with a real
 *  schema). Others get serialised whole into a `payload` jsonb column so we
 *  don't have to maintain N migrations per LIMS feature change.
 *
 *  LIMS store              Supabase table         Strategy
 *  ──────────────────────────────────────────────────────────────────
 *  clients                 customers              typed columns + payload
 *  samples                 samples                typed columns + payload
 *  results                 sample_results         typed columns + payload
 *  tests                   lims_tests             payload only
 *  profiles (test profs)   lims_test_profiles     payload only
 *  worksheets              lims_worksheets        payload only
 *  instruments             lims_instruments       payload only
 *  inventory               lims_inventory         payload only
 *  documents               lims_documents         payload only
 *  users / personnel       — (not synced for now; stays local)
 *  audit / settings / qcs  — (local only; per-device)
 */

(function () {
  'use strict';

  // Stores we sync. Anything not in this map stays local-only.
  const TABLE_MAP = {
    clients:     'customers',
    samples:     'samples',
    results:     'sample_results',
    tests:       'lims_tests',
    profiles:    'lims_test_profiles',
    worksheets:  'lims_worksheets',
    instruments: 'lims_instruments',
    inventory:   'lims_inventory',
    documents:    'lims_documents',
    competencies: 'lims_competencies'
  };

  // ── Mappers: local row → cloud row ──────────────────────
  // Every cloud row gets organisation_id stamped on it from the current profile.
  function mapOut(localStore, row, orgId) {
    const base = { id: row.id, organisation_id: orgId, payload: row };
    switch (localStore) {
      case 'clients':
        return Object.assign(base, {
          name:          row.name || row.client || 'Unknown',
          contact_name:  row.contactName || row.contact || null,
          contact_email: row.email || null,
          contact_phone: row.phone || null,
          address:       row.address || null,
          notes:         row.notes || null,
        });
      case 'samples':
        return Object.assign(base, {
          customer_id:   row.clientId || null,
          site_id:       row.siteId || null,
          sample_no:     row.no || row.sampleNo || row.id,
          matrix:        row.matrix || row.type || null,
          sample_point:  row.point || row.location || null,
          profile_code:  row.profileId || null,
          sampled_by:    row.sampledBy || null,
          sampled_at:    row.sampledAt || row.collectedAt || null,
          status:        row.status || 'received',
          notes:         row.notes || null,
        });
      case 'results':
        return Object.assign(base, {
          sample_id:     row.sampleId,
          test_code:     row.testId || row.code || null,
          test_name:     row.testName || null,
          value_text:    row.value != null ? String(row.value) : null,
          value_num:     (row.value != null && !isNaN(parseFloat(row.value))) ? parseFloat(row.value) : null,
          units:         row.unit || row.units || null,
          method:        row.method || null,
          sans241_class: row.sansClass || null,
          pass_fail:     row.spec || row.passFail || null,
          status:        row.status || null,
          recorded_by:   row.by || row.recordedBy || null,
          recorded_at:   row.ts || row.recordedAt || null,
        });
      default:
        // payload-only stores
        return base;
    }
  }

  // ── Mappers: cloud row → local row ──────────────────────
  // We trust the payload jsonb for everything (LIMS schema is the source of
  // truth), and only fall back to typed columns when payload is absent.
  function mapIn(localStore, cloudRow) {
    if (cloudRow && cloudRow.payload && typeof cloudRow.payload === 'object') {
      return Object.assign({ id: cloudRow.id }, cloudRow.payload);
    }
    // Reconstruct minimally from typed cols.
    switch (localStore) {
      case 'clients':
        return { id: cloudRow.id, name: cloudRow.name, contactName: cloudRow.contact_name,
                 email: cloudRow.contact_email, phone: cloudRow.contact_phone,
                 address: cloudRow.address, notes: cloudRow.notes };
      case 'samples':
        return { id: cloudRow.id, clientId: cloudRow.customer_id, siteId: cloudRow.site_id,
                 no: cloudRow.sample_no, matrix: cloudRow.matrix, point: cloudRow.sample_point,
                 profileId: cloudRow.profile_code, sampledBy: cloudRow.sampled_by,
                 sampledAt: cloudRow.sampled_at, status: cloudRow.status, notes: cloudRow.notes,
                 custody: [] };
      case 'results':
        return { id: cloudRow.id, sampleId: cloudRow.sample_id, testId: cloudRow.test_code,
                 testName: cloudRow.test_name, value: cloudRow.value_text, unit: cloudRow.units,
                 method: cloudRow.method, sansClass: cloudRow.sans241_class,
                 spec: cloudRow.pass_fail, status: cloudRow.status, by: cloudRow.recorded_by,
                 ts: cloudRow.recorded_at };
      default:
        return { id: cloudRow.id };
    }
  }

  // ── State ───────────────────────────────────────────────
  const state = {
    orgId: null,
    ready: false,
    paused: false,            // pause hook while applying remote changes
    subscriptions: []
  };

  function pause(fn) {
    state.paused = true;
    try { return fn(); } finally { state.paused = false; }
  }

  // ── Hook called by lims.js on every local DB.put / DB.del ──
  function onLocalChange(op, store, payload) {
    if (state.paused) return;
    const cloudTable = TABLE_MAP[store];
    if (!cloudTable) return;
    if (!state.ready || !state.orgId) return;
    if (!window.HG_DB || !window.HG_DB[cloudTable]) return;

    if (op === 'put') {
      const cloudRow = mapOut(store, payload, state.orgId);
      // fire-and-forget — HG_DB queues offline writes itself
      window.HG_DB[cloudTable].upsert(cloudRow).catch(() => {});
    } else if (op === 'del') {
      const id = payload;
      window.HG_DB[cloudTable].remove(id).catch(() => {});
    }
  }

  // ── Pull-down on session start ──────────────────────────
  async function pullAll() {
    if (!state.orgId || !window.HG_LIMS_DB || !window.HG_DB) return;
    const stores = Object.keys(TABLE_MAP);
    let pulled = 0;
    for (const store of stores) {
      const cloudTable = TABLE_MAP[store];
      try {
        const rows = await window.HG_DB[cloudTable].list({ organisation_id: state.orgId });
        if (!rows.length) continue;
        await pause(async () => {
          for (const r of rows) {
            const local = mapIn(store, r);
            await window.HG_LIMS_DB.putLocal(store, local);
            pulled++;
          }
        });
      } catch (e) {
        console.warn('[HG_LIMS_SYNC] pull failed for', store, e);
      }
    }
    if (pulled > 0) {
      console.info('[HG_LIMS_SYNC] pulled', pulled, 'rows from cloud.');
      // Trigger LIMS re-render so newly-pulled data shows up.
      try { window.limsRerender && window.limsRerender(); } catch (_) {}
    }
  }

  // ── Push-up: drain any local rows not yet on the server ──
  async function pushAllOnce() {
    if (!state.orgId || !window.HG_LIMS_DB || !window.HG_DB) return;
    const stores = Object.keys(TABLE_MAP);
    let pushed = 0;
    for (const store of stores) {
      const cloudTable = TABLE_MAP[store];
      try {
        const rows = await window.HG_LIMS_DB.all(store);
        for (const r of rows) {
          const cloudRow = mapOut(store, r, state.orgId);
          window.HG_DB[cloudTable].upsert(cloudRow).catch(() => {});
          pushed++;
        }
      } catch (e) {
        console.warn('[HG_LIMS_SYNC] push failed for', store, e);
      }
    }
    if (pushed > 0) console.info('[HG_LIMS_SYNC] pushed', pushed, 'rows to cloud.');
  }

  // ── Realtime subscriptions ──────────────────────────────
  function tearDownSubscriptions() {
    state.subscriptions.forEach(unsub => { try { unsub(); } catch (_) {} });
    state.subscriptions = [];
  }

  function subscribeAll() {
    tearDownSubscriptions();
    if (!window.HG_DB) return;
    Object.entries(TABLE_MAP).forEach(([store, cloudTable]) => {
      const unsub = window.HG_DB[cloudTable].subscribe(async (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            const id = payload.old?.id;
            if (id) await pause(() => window.HG_LIMS_DB.delLocal(store, id));
          } else {
            const row = payload.new;
            if (!row) return;
            const local = mapIn(store, row);
            await pause(() => window.HG_LIMS_DB.putLocal(store, local));
          }
          // Rerender LIMS only if it's already open; otherwise it'll pick up
          // fresh data on next open.
          try { window.limsRerender && window.limsRerender(); } catch (_) {}
        } catch (e) {
          console.warn('[HG_LIMS_SYNC] realtime apply failed', e);
        }
      });
      state.subscriptions.push(unsub);
    });
  }

  // ── Boot ────────────────────────────────────────────────
  async function activate() {
    const profile = window.HG_PROFILE;
    if (!profile || !profile.organisation_id) {
      console.info('[HG_LIMS_SYNC] no organisation_id on profile — sync paused.');
      return;
    }
    state.orgId = profile.organisation_id;
    state.ready = true;

    // Wait for the LIMS DB facade to be exposed by lims.js (defer-script timing).
    let waited = 0;
    while (!window.HG_LIMS_DB && waited < 30000) {
      await new Promise(r => setTimeout(r, 500));
      waited += 500;
    }
    if (!window.HG_LIMS_DB) {
      console.info('[HG_LIMS_SYNC] LIMS DB not ready; will sync when LIMS opens.');
      const watcher = setInterval(() => {
        if (window.HG_LIMS_DB) {
          clearInterval(watcher);
          activate();
        }
      }, 2000);
      return;
    }

    // Eagerly open the IndexedDB connection. LIMS opens it lazily on first
    // limsOpen() — but cloud sync needs to read/write to it before LIMS
    // opens for the first time. open() is idempotent.
    try {
      await window.HG_LIMS_DB.open();
    } catch (e) {
      console.warn('[HG_LIMS_SYNC] failed to open LIMS IndexedDB', e);
      return;
    }

    await pullAll();
    pushAllOnce();    // drain local-only rows up to the cloud
    subscribeAll();
    document.dispatchEvent(new CustomEvent('hg:lims:synced'));
  }

  function deactivate() {
    state.ready = false;
    state.orgId = null;
    tearDownSubscriptions();
  }

  // Public API
  window.HG_LIMS_SYNC = {
    onLocalChange,
    activate,
    deactivate,
    pullAll,
    pushAllOnce,
    state
  };

  // Wire to auth lifecycle. If profile is already loaded by the time we run
  // (race with auth-ui's event dispatch), kick off immediately.
  if (window.HG_PROFILE) activate();
  document.addEventListener('hg:profile:loaded', () => activate());
  document.addEventListener('hg:auth:changed', (e) => {
    if (!e.detail || !e.detail.session) deactivate();
  });
})();
