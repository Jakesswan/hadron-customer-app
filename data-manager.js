/*
 * Hadron Group — Data Manager
 *
 * Import / export to Excel (.xlsx) for:
 *   - Customers   (LIMS clients store)
 *   - Sites       (hadron_sites localStorage + assets)
 *   - Operators   (LIMS users store)
 *   - Tests       (LIMS tests catalogue)
 *   - Inventory   (LIMS inventory)
 *
 * Why this is useful: bulk-load a customer spreadsheet, mass-edit in Excel,
 * pull a backup before a big change. SheetJS is lazy-loaded the first time
 * the user clicks Import or Export, so it doesn't bloat first-load.
 *
 * Cloud sync flows automatically — once an entity is written to its local
 * store, the existing lims-sync.js / Supabase hooks mirror it up.
 */

(function () {
  'use strict';

  const SHEETJS_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

  // ── Lazy load SheetJS ────────────────────────────────────
  function loadSheetJs() {
    if (window.XLSX) return Promise.resolve();
    if (window.__xlsxLoading) return window.__xlsxLoading;
    window.__xlsxLoading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = SHEETJS_CDN;
      s.onload = res;
      s.onerror = () => rej(new Error('SheetJS CDN failed to load'));
      document.head.appendChild(s);
    });
    return window.__xlsxLoading;
  }

  // ── Entity adapters ──────────────────────────────────────
  // Each adapter knows how to:
  //   list()       — read all rows from local store
  //   columns      — array of [header, fieldName] for export/import mapping
  //   import(rows) — persist a batch (handles new + update by id)
  //   matchKey     — column to match for upsert (e.g. 'name' or 'email')
  //   uidPrefix    — id prefix when generating new IDs
  //   storeName    — store name for IndexedDB / localStorage key

  const ADAPTERS = {
    customers: {
      label: 'Customers',
      icon: '🏢',
      sub: 'Companies + contacts (LIMS clients)',
      columns: [
        ['ID',       'id'],
        ['Name',     'name'],
        ['Industry', 'industry'],
        ['Contact',  'contact'],
        ['Email',    'email'],
        ['Phone',    'phone'],
        ['Address',  'address'],
        ['Notes',    'notes']
      ],
      requiredFields: ['name'],
      matchKey: 'name',
      uidPrefix: 'c',
      async list() {
        if (window.HG_LIMS_DB) {
          try { await window.HG_LIMS_DB.open(); } catch (_) {}
          return window.HG_LIMS_DB.all('clients');
        }
        return [];
      },
      async upsert(row) {
        if (!window.HG_LIMS_DB) throw new Error('LIMS DB not ready');
        return window.HG_LIMS_DB.put('clients', row);
      }
    },

    sites: {
      label: 'Sites',
      icon: '📍',
      sub: 'Site register + attached assets',
      columns: [
        ['ID',           'id'],
        ['Name',         'name'],
        ['Address',      'address'],
        ['System type',  'systemType'],
        ['Source type',  'sourceType'],
        ['Contact name', 'contactName'],
        ['Contact email','contactEmail'],
        ['Contact phone','contactPhone'],
        ['Status',       'status'],
        ['Notes',        'notes']
      ],
      requiredFields: ['name'],
      matchKey: 'name',
      uidPrefix: 's',
      async list() {
        try { return JSON.parse(localStorage.getItem('hadron_sites') || '[]'); }
        catch { return []; }
      },
      async upsert(row) {
        const list = (await this.list());
        const idx = list.findIndex(x => x.id === row.id);
        if (idx >= 0) list[idx] = Object.assign(list[idx], row);
        else list.push(Object.assign({ equipment: [], createdAt: new Date().toISOString() }, row));
        localStorage.setItem('hadron_sites', JSON.stringify(list));
        if (typeof window.renderSites === 'function') window.renderSites();
        return row;
      }
    },

    operators: {
      label: 'Operators',
      icon: '👥',
      sub: 'Lab personnel (LIMS users)',
      columns: [
        ['ID',        'id'],
        ['Name',      'name'],
        ['Role',      'role'],
        ['Email',     'email'],
        ['Phone',     'phone'],
        ['Signature', 'signature'],
        ['Active',    'active']
      ],
      requiredFields: ['name', 'email'],
      matchKey: 'email',
      uidPrefix: 'u',
      async list() {
        if (window.HG_LIMS_DB) {
          try { await window.HG_LIMS_DB.open(); } catch (_) {}
          return window.HG_LIMS_DB.all('users');
        }
        return [];
      },
      async upsert(row) {
        if (!window.HG_LIMS_DB) throw new Error('LIMS DB not ready');
        // Coerce active to boolean
        if (typeof row.active === 'string') {
          row.active = /^(true|yes|1|active|on)$/i.test(row.active.trim());
        }
        return window.HG_LIMS_DB.put('users', row);
      }
    },

    tests: {
      label: 'Tests',
      icon: '🔬',
      sub: 'Test catalogue (LIMS tests)',
      columns: [
        ['ID',         'id'],
        ['Code',       'code'],
        ['Name',       'name'],
        ['Category',   'category'],
        ['Method',     'method'],
        ['Method ver', 'methodVer'],
        ['Unit',       'unit'],
        ['LOD',        'lod'],
        ['LOQ',        'loq'],
        ['Range',      'range'],
        ['Spec min',   'specMin'],
        ['Spec max',   'specMax'],
        ['SANS class', 'sans241'],
        ['TAT (days)', 'tat'],
        ['Accredited', 'accredited']
      ],
      requiredFields: ['code', 'name'],
      matchKey: 'code',
      uidPrefix: 't',
      async list() {
        if (window.HG_LIMS_DB) {
          try { await window.HG_LIMS_DB.open(); } catch (_) {}
          return window.HG_LIMS_DB.all('tests');
        }
        return [];
      },
      async upsert(row) {
        if (!window.HG_LIMS_DB) throw new Error('LIMS DB not ready');
        if (typeof row.accredited === 'string') {
          row.accredited = /^(true|yes|1)$/i.test(row.accredited.trim());
        }
        ['specMin','specMax','tat'].forEach(k => {
          if (row[k] !== '' && row[k] != null) row[k] = parseFloat(row[k]);
        });
        return window.HG_LIMS_DB.put('tests', row);
      }
    },

    inventory: {
      label: 'Inventory',
      icon: '📦',
      sub: 'Reagents & consumables',
      columns: [
        ['ID',        'id'],
        ['Name',      'name'],
        ['Lot',       'lot'],
        ['Supplier',  'supplier'],
        ['Received',  'received'],
        ['Expiry',    'expiry'],
        ['Quantity',  'qty'],
        ['Unit',      'unit'],
        ['Min stock', 'min'],
        ['Storage',   'storage'],
        ['COA',       'coa'],
        ['Notes',     'notes']
      ],
      requiredFields: ['name'],
      matchKey: 'name',
      uidPrefix: 'inv',
      async list() {
        if (window.HG_LIMS_DB) {
          try { await window.HG_LIMS_DB.open(); } catch (_) {}
          return window.HG_LIMS_DB.all('inventory');
        }
        return [];
      },
      async upsert(row) {
        if (!window.HG_LIMS_DB) throw new Error('LIMS DB not ready');
        ['qty','min'].forEach(k => {
          if (row[k] !== '' && row[k] != null) row[k] = parseFloat(row[k]) || 0;
        });
        if (typeof row.coa === 'string') row.coa = /^(true|yes|1)$/i.test(row.coa.trim());
        return window.HG_LIMS_DB.put('inventory', row);
      }
    }
  };

  // ── Helpers ──────────────────────────────────────────────
  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  }
  const esc = (s) => (s == null ? '' : String(s)).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function buildRows(adapter, items) {
    return items.map(it => {
      const obj = {};
      adapter.columns.forEach(([header, field]) => {
        const v = it[field];
        obj[header] = (v === null || v === undefined) ? '' : v;
      });
      return obj;
    });
  }

  function rowsToObjects(adapter, rows) {
    // rows is array of objects with header keys; map to entity field keys
    return rows.map(r => {
      const obj = {};
      adapter.columns.forEach(([header, field]) => {
        if (r[header] !== undefined) obj[field] = r[header];
      });
      return obj;
    });
  }

  // ── Export ───────────────────────────────────────────────
  async function exportEntity(key) {
    const a = ADAPTERS[key];
    if (!a) return;
    try { await loadSheetJs(); }
    catch (e) { alert('Could not load Excel library — check your internet.'); return; }
    const items = await a.list();
    const data  = buildRows(a, items);
    const ws = window.XLSX.utils.json_to_sheet(data, { header: a.columns.map(c => c[0]) });
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, a.label);
    const filename = 'hadron_' + key + '_' + new Date().toISOString().slice(0,10) + '.xlsx';
    window.XLSX.writeFile(wb, filename);
  }

  // ── Import ───────────────────────────────────────────────
  async function importEntity(key, file) {
    const a = ADAPTERS[key];
    if (!a) return null;
    try { await loadSheetJs(); }
    catch (e) { alert('Could not load Excel library.'); return null; }
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rawRows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return rowsToObjects(a, rawRows);
  }

  function validateRows(adapter, rows) {
    const issues = [];
    rows.forEach((r, i) => {
      adapter.requiredFields.forEach(f => {
        if (r[f] == null || String(r[f]).trim() === '') {
          issues.push(`Row ${i + 2}: ${f} is required`);
        }
      });
    });
    return issues;
  }

  async function commitImport(key, rows) {
    const a = ADAPTERS[key];
    if (!a) return { added: 0, updated: 0 };
    const existing = await a.list();
    const byKey = Object.fromEntries(existing.filter(x => x[a.matchKey]).map(x => [String(x[a.matchKey]).toLowerCase(), x]));
    const byId  = Object.fromEntries(existing.map(x => [x.id, x]));
    let added = 0, updated = 0;
    for (const row of rows) {
      let target = null;
      if (row.id && byId[row.id]) target = byId[row.id];
      else if (row[a.matchKey]) {
        const k = String(row[a.matchKey]).toLowerCase();
        if (byKey[k]) target = byKey[k];
      }
      if (target) {
        await a.upsert(Object.assign({}, target, row, { id: target.id }));
        updated++;
      } else {
        const newRow = Object.assign({}, row, { id: row.id || uid(a.uidPrefix) });
        await a.upsert(newRow);
        added++;
      }
    }
    return { added, updated };
  }

  // ── Window UI ────────────────────────────────────────────
  function buildWindow() {
    if (document.getElementById('window-data')) return;
    const win = document.createElement('div');
    win.className = 'window';
    win.id = 'window-data';
    win.innerHTML = `
      <div class="window-header">
        <button class="back-button" onclick="closeWindow('data')">←</button>
        <span class="window-title">Data Manager</span>
      </div>
      <div class="window-content" id="dataMgrContent"></div>
    `;
    document.body.appendChild(win);
  }

  async function renderHub() {
    const host = document.getElementById('dataMgrContent');
    if (!host) return;
    const rows = await Promise.all(Object.entries(ADAPTERS).map(async ([key, a]) => {
      const list = await a.list().catch(() => []);
      return { key, a, count: list.length };
    }));
    host.innerHTML = `
      <div class="hg-hero" style="background: linear-gradient(135deg, #1a3d9e 0%, #00b1ca 100%);">
        <div>
          <h2 class="hg-hero-title">Data Manager</h2>
          <div class="hg-hero-sub">Bulk-import or export to Excel — for spreadsheet jockeys and migration day</div>
        </div>
        <div class="hg-hero-icon">📊</div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">How this works</div>
        <p style="margin: 0 0 8px; font-size: 13.5px; line-height:1.55;">
          <strong>Export</strong> downloads everything as an .xlsx file you can open in Excel, Numbers, or Google Sheets — handy for backups, audits, or bulk edits.
        </p>
        <p style="margin: 0 0 8px; font-size: 13.5px; line-height:1.55;">
          <strong>Import</strong> reads a spreadsheet and pushes each row into the matching local store. Rows are matched by the <em>match key</em> for that entity (Name for customers/sites/inventory, Email for operators, Code for tests). Existing rows get updated; new rows are added with a fresh ID.
        </p>
        <p style="margin: 0; font-size: 13.5px; line-height:1.55;">
          <strong>Cloud sync flows automatically.</strong> Whatever you import here gets mirrored to Supabase via the existing sync layer, so other devices see it within a second.
        </p>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">Pick an entity</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;">
          ${rows.map(({key, a, count}) => `
            <div class="hg-card" style="margin:0;padding:14px;border:1px solid var(--border,rgba(0,0,0,0.08));">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                <div style="font-size:24px;">${a.icon}</div>
                <div style="flex:1;">
                  <div style="font-weight:700;">${esc(a.label)}</div>
                  <div style="font-size:12px;opacity:0.7;">${esc(a.sub)}</div>
                </div>
              </div>
              <div style="font-size:13px;color:#6b7684;margin-bottom:10px;">${count} row${count===1?'':'s'} stored</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button class="hg-btn primary" onclick="hgDataExport('${key}')">⬇️ Export .xlsx</button>
                <label class="hg-btn ghost" style="cursor:pointer;">
                  ⬆️ Import…
                  <input type="file" accept=".xlsx,.xls,.csv" style="display:none;" onchange="hgDataImport('${key}', this.files[0])">
                </label>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div id="dataMgrPreview"></div>
    `;
  }

  // ── Public API ──────────────────────────────────────────
  window.openDataManager = async function () {
    buildWindow();
    if (typeof window.openWindow === 'function') {
      window.openWindow('data');
    }
    await renderHub();
  };

  window.hgDataExport = async function (key) {
    try {
      await exportEntity(key);
    } catch (e) {
      console.error(e);
      alert('Export failed: ' + (e.message || e));
    }
  };

  window.hgDataImport = async function (key, file) {
    if (!file) return;
    const a = ADAPTERS[key];
    if (!a) return;
    let rows;
    try {
      rows = await importEntity(key, file);
    } catch (e) {
      alert('Could not parse spreadsheet: ' + (e.message || e));
      return;
    }
    if (!rows || !rows.length) {
      alert('No rows found in that spreadsheet.');
      return;
    }
    const issues = validateRows(a, rows);
    const preview = document.getElementById('dataMgrPreview');
    if (!preview) return;
    const sample = rows.slice(0, 5);
    preview.innerHTML = `
      <div class="hg-card">
        <div class="hg-section-title">${esc(a.label)} import preview — ${rows.length} row${rows.length===1?'':'s'}</div>
        ${issues.length ? `
          <div style="background:rgba(220,53,69,0.1);color:#d32f2f;padding:10px;border-radius:8px;margin-bottom:10px;font-size:13px;">
            <strong>${issues.length} validation issue${issues.length===1?'':'s'}:</strong>
            <ul style="margin:6px 0 0 18px;">${issues.slice(0,8).map(i=>`<li>${esc(i)}</li>`).join('')}</ul>
            ${issues.length>8 ? `<div style="margin-top:4px;">…and ${issues.length-8} more</div>` : ''}
          </div>
        ` : ''}
        <div style="overflow-x:auto;border:1px solid var(--border,rgba(0,0,0,0.08));border-radius:8px;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f7fbfd;">
              ${a.columns.map(c=>`<th style="text-align:left;padding:8px 10px;border-bottom:1px solid #eef3f7;">${esc(c[0])}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${sample.map(r=>`<tr>${a.columns.map(c=>`<td style="padding:8px 10px;border-bottom:1px solid #eef3f7;">${esc(r[c[1]])}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${rows.length > 5 ? `<div style="font-size:12px;opacity:0.6;margin-top:6px;">Showing first 5 rows of ${rows.length}</div>` : ''}
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="hg-btn primary" onclick="hgDataCommit('${key}')">💾 Commit ${rows.length} row${rows.length===1?'':'s'}</button>
          <button class="hg-btn ghost" onclick="document.getElementById('dataMgrPreview').innerHTML='';">Cancel</button>
        </div>
      </div>
    `;
    // Stash rows on window for the commit handler.
    window.__hgPendingImport = { key, rows };
  };

  window.hgDataCommit = async function (key) {
    const pending = window.__hgPendingImport;
    if (!pending || pending.key !== key) return;
    const { added, updated } = await commitImport(pending.key, pending.rows);
    window.__hgPendingImport = null;
    const preview = document.getElementById('dataMgrPreview');
    if (preview) preview.innerHTML = `
      <div class="hg-card" style="border-left:4px solid #2bb673;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-size:28px;">✅</div>
          <div>
            <div style="font-weight:700;font-size:15px;">Import complete</div>
            <div style="font-size:13px;opacity:0.8;">Added ${added} new row${added===1?'':'s'}, updated ${updated} existing.</div>
          </div>
        </div>
      </div>
    `;
    // Refresh hub counts
    await renderHub();
  };
})();
