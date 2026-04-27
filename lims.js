
/* ============================================================
   HADRON LIMS — ISO/IEC 17025 flavoured laboratory module
   ============================================================ */
(function(){
  'use strict';

  /* ---------- Config ---------- */
  const DB_NAME = 'hadron_lims';
  const DB_VERSION = 1;
  const STORES = ['samples','tests','profiles','worksheets','results','instruments','calibrations','personnel','competencies','documents','inventory','clients','quotes','ncs','users','audit','settings'];

  /* ---------- State ---------- */
  const S = {
    view: 'hub',
    stack: [],
    params: {},
    currentUser: null,
    db: null
  };

  /* ---------- IndexedDB wrapper ---------- */
  // Cloud sync hook: when window.HG_LIMS_SYNC is wired, every put/del also
  // mirrors to Supabase. The hook is best-effort; failures are swallowed so
  // local IndexedDB stays the source of truth.
  function _hook(op, store, payload) {
    try {
      if (window.HG_LIMS_SYNC && typeof window.HG_LIMS_SYNC.onLocalChange === 'function') {
        window.HG_LIMS_SYNC.onLocalChange(op, store, payload);
      }
    } catch (e) { /* sync errors must never block local writes */ }
  }

  const DB = {
    open() {
      return new Promise((res, rej) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => rej(req.error);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          STORES.forEach(s => {
            if (!db.objectStoreNames.contains(s)) {
              db.createObjectStore(s, { keyPath: 'id' });
            }
          });
        };
        req.onsuccess = () => { S.db = req.result; res(req.result); };
      });
    },
    tx(store, mode='readonly') { return S.db.transaction(store, mode).objectStore(store); },
    put(store, obj) {
      return new Promise((res, rej) => {
        const r = this.tx(store,'readwrite').put(obj);
        r.onsuccess = () => { _hook('put', store, obj); res(obj); };
        r.onerror = () => rej(r.error);
      });
    },
    // putLocal — used by sync layer to write incoming cloud changes WITHOUT
    // re-firing the sync hook (would create an echo loop).
    putLocal(store, obj) {
      return new Promise((res, rej) => {
        const r = this.tx(store,'readwrite').put(obj);
        r.onsuccess = () => res(obj); r.onerror = () => rej(r.error);
      });
    },
    get(store, id) {
      return new Promise((res, rej) => {
        const r = this.tx(store).get(id);
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
    },
    all(store) {
      return new Promise((res, rej) => {
        const r = this.tx(store).getAll();
        r.onsuccess = () => res(r.result || []); r.onerror = () => rej(r.error);
      });
    },
    del(store, id) {
      return new Promise((res, rej) => {
        const r = this.tx(store,'readwrite').delete(id);
        r.onsuccess = () => { _hook('del', store, id); res(); };
        r.onerror = () => rej(r.error);
      });
    },
    delLocal(store, id) {
      return new Promise((res, rej) => {
        const r = this.tx(store,'readwrite').delete(id);
        r.onsuccess = () => res(); r.onerror = () => rej(r.error);
      });
    },
    async audit(action, entity, entityId, before, after) {
      const entry = {
        id: 'aud-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
        ts: new Date().toISOString(),
        user: S.currentUser ? S.currentUser.name : 'System',
        action, entity, entityId,
        before: before || null,
        after: after || null
      };
      await this.put('audit', entry);
    }
  };

  /* ---------- Utilities ---------- */
  const esc = (s) => (s==null?'':String(s)).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const uid = (p) => p + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,6);
  const nowISO = () => new Date().toISOString();
  const fmtDate = (iso) => { if(!iso) return '—'; const d=new Date(iso); return d.toLocaleDateString(); };
  const fmtDT = (iso) => { if(!iso) return '—'; const d=new Date(iso); return d.toLocaleString(); };
  const daysBetween = (a,b) => Math.round((new Date(b)-new Date(a))/86400000);
  const daysFromNow = (iso) => daysBetween(new Date(), iso);

  function toast(msg, type='info') {
    const host = document.getElementById('limsToastHost');
    if (!host) return;
    const t = document.createElement('div');
    t.className = 'lims-toast ' + type;
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(10px)'; }, 2600);
    setTimeout(()=>t.remove(), 3000);
  }

  function chip(text, cls) { return `<span class="lims-chip ${cls||'neutral'}">${esc(text)}</span>`; }

  function breadcrumb(path) {
    // path: array of {label, view, params}
    const items = path.map((p,i) => {
      if (i === path.length-1) return `<span class="current">${esc(p.label)}</span>`;
      return `<a href="#" onclick="event.preventDefault();limsGo('${p.view}',${JSON.stringify(p.params||{}).replace(/'/g,"&#39;")})">${esc(p.label)}</a><span class="sep">›</span>`;
    });
    return `<div class="lims-breadcrumb">${items.join('')}</div>`;
  }

  /* ---------- Router ---------- */
  // Tiny localiser for chrome — falls back to English when t() unavailable
  const tt = (k, en) => (typeof window.t === 'function') ? window.t(k) : en;

  // Re-render the current view (used when user switches UI language)
  // Exposed for the cloud-sync layer (lims-sync.js).
  window.HG_LIMS_DB    = DB;
  window.HG_LIMS_STORES = STORES;

  window.limsRerender = function() {
    const root = document.getElementById('limsRoot');
    if (root && root.children.length) render();
  };

  window.limsGo = function(view, params) {
    S.stack.push({ view: S.view, params: S.params });
    S.view = view;
    S.params = params || {};
    render();
  };
  window.limsBack = function() {
    if (S.view === 'hub') {
      // Leave LIMS entirely
      if (typeof closeWindow === 'function') closeWindow('lims');
      return;
    }
    if (S.stack.length) {
      const prev = S.stack.pop();
      S.view = prev.view;
      S.params = prev.params;
      render();
    } else {
      S.view = 'hub'; S.params = {}; render();
    }
  };

  // Bump this when the test catalogue / profile bundles change so existing
  // devices pick up the new reference data without wiping their samples,
  // clients, results or audit trail.
  const CATALOGUE_VERSION = 2; // v2 = SANS 241:2015 full library, prices removed

  /* ---------- SANS 241:2015 Drinking-Water Reference Catalogue ----------
     Specs are the SANS 241 health / aesthetic / operational maximum allowable
     limits. Where SANS lists chronic + acute, the chronic (lower) limit is
     used as specMax. Cited methods follow APHA Standard Methods (24th ed.),
     EPA 200.7 / 200.8 / 245.1, and SANS 5667 / 5221 / 5215 / 6222 / 9308 /
     ISO 10705-2 / EPA 1623.
     Module-scope so SEED.refreshCatalogue() can reuse without duplicating. */
  const _SANS241_TESTS = [
    // ── Microbiological ─────────────────────────────────────────────────
    { id:'t-ec',     code:'ECOLI',  name:'Escherichia coli',             method:'SANS 5221 / 9308-1',    methodVer:'v2.0', unit:'cfu/100mL',  lod:1,    loq:1,    range:'0–>2000',  tat:3, specMin:0, specMax:0,     category:'Microbiological', accredited:true,  sans241:'Acute health' },
    { id:'t-colif',  code:'TC',     name:'Total Coliforms',              method:'SANS 5221',             methodVer:'v2.0', unit:'cfu/100mL',  lod:1,    loq:1,    range:'0–>2000',  tat:3, specMin:0, specMax:10,    category:'Microbiological', accredited:true,  sans241:'Operational' },
    { id:'t-hpc',    code:'HPC',    name:'Heterotrophic Plate Count',    method:'SANS 5221 / 6222',      methodVer:'v1.8', unit:'cfu/mL',     lod:1,    loq:1,    range:'0–>10000', tat:3, specMin:0, specMax:1000,  category:'Microbiological', accredited:true,  sans241:'Operational' },
    { id:'t-crypto', code:'CRYPT',  name:'Cryptosporidium',              method:'SANS / EPA 1623',       methodVer:'v1.0', unit:'oocysts/10L',lod:1,    loq:1,    range:'0–>100',   tat:5, specMin:0, specMax:0,     category:'Microbiological', accredited:false, sans241:'Acute health' },
    { id:'t-giardia',code:'GIARD',  name:'Giardia',                      method:'SANS / EPA 1623',       methodVer:'v1.0', unit:'cysts/10L',  lod:1,    loq:1,    range:'0–>100',   tat:5, specMin:0, specMax:0,     category:'Microbiological', accredited:false, sans241:'Acute health' },
    { id:'t-somph',  code:'SOMPH',  name:'Somatic Coliphages',           method:'ISO 10705-2',           methodVer:'v1.0', unit:'pfu/10mL',   lod:1,    loq:1,    range:'0–>1000',  tat:3, specMin:0, specMax:1,     category:'Microbiological', accredited:false, sans241:'Operational' },

    // ── Physical / Aesthetic ────────────────────────────────────────────
    { id:'t-ph',     code:'PH',     name:'pH',                           method:'SANS 5667 / APHA 4500-H+', methodVer:'v3.0', unit:'pH units',   lod:0.1,  loq:0.1,  range:'0–14',     tat:1, specMin:5.0, specMax:9.7,   category:'Physico-chemical', accredited:true,  sans241:'Operational' },
    { id:'t-cond',   code:'EC',     name:'Electrical Conductivity',      method:'APHA 2510-B',           methodVer:'v2.1', unit:'mS/m',       lod:1,    loq:2,    range:'0–10000',  tat:1, specMin:0, specMax:170,   category:'Physico-chemical', accredited:true,  sans241:'Aesthetic' },
    { id:'t-tds',    code:'TDS',    name:'Total Dissolved Solids',       method:'APHA 2540-C',           methodVer:'v1.2', unit:'mg/L',       lod:5,    loq:10,   range:'0–50000',  tat:2, specMin:0, specMax:1200,  category:'Physico-chemical', accredited:true,  sans241:'Aesthetic' },
    { id:'t-turb',   code:'TURB',   name:'Turbidity',                    method:'APHA 2130-B',           methodVer:'v1.4', unit:'NTU',        lod:0.1,  loq:0.5,  range:'0–1000',   tat:1, specMin:0, specMax:1.0,   category:'Physico-chemical', accredited:true,  sans241:'Operational' },
    { id:'t-colour', code:'COL',    name:'Colour',                       method:'APHA 2120-C',           methodVer:'v1.0', unit:'mg/L Pt',    lod:1,    loq:5,    range:'0–500',    tat:1, specMin:0, specMax:15,    category:'Physico-chemical', accredited:true,  sans241:'Aesthetic' },
    { id:'t-taste',  code:'TASTE',  name:'Taste',                        method:'SANS 5215 (Sensory)',   methodVer:'v1.0', unit:'TON',        lod:1,    loq:1,    range:'0–10',     tat:1, specMin:0, specMax:1,     category:'Physico-chemical', accredited:false, sans241:'Aesthetic' },
    { id:'t-odour',  code:'ODOUR',  name:'Odour',                        method:'SANS 5215 (Sensory)',   methodVer:'v1.0', unit:'TON',        lod:1,    loq:1,    range:'0–10',     tat:1, specMin:0, specMax:1,     category:'Physico-chemical', accredited:false, sans241:'Aesthetic' },

    // ── Disinfectants & Disinfection By-Products ────────────────────────
    { id:'t-fcl',    code:'FCL',    name:'Free Chlorine',                method:'APHA 4500-Cl G',        methodVer:'v1.1', unit:'mg/L',       lod:0.02, loq:0.05, range:'0–5',      tat:1, specMin:0.2, specMax:5.0, category:'Disinfectant',     accredited:true,  sans241:'Operational' },
    { id:'t-mchla',  code:'MCHLA',  name:'Monochloramine',               method:'APHA 4500-Cl G',        methodVer:'v1.0', unit:'mg/L',       lod:0.05, loq:0.1,  range:'0–5',      tat:1, specMin:0, specMax:3.0,   category:'Disinfectant',     accredited:false, sans241:'Chronic health' },
    { id:'t-cl2',    code:'CLO2',   name:'Chlorine Dioxide (residual)',  method:'DPD-Glycine APHA 4500', methodVer:'v1.0', unit:'mg/L',       lod:0.05, loq:0.1,  range:'0–5',      tat:1, specMin:0.2, specMax:0.8, category:'Disinfectant',     accredited:false, sans241:'Operational' },
    { id:'t-thm',    code:'THM',    name:'Total Trihalomethanes',        method:'APHA 6232-B (GC-ECD)',  methodVer:'v1.0', unit:'µg/L',       lod:1,    loq:5,    range:'0–500',    tat:5, specMin:0, specMax:100,   category:'Disinfectant',     accredited:false, sans241:'Chronic health' },

    // ── Macro-determinands (Inorganic chemistry) ────────────────────────
    { id:'t-no3',    code:'NO3',    name:'Nitrate (as N)',               method:'APHA 4500-NO3 B',       methodVer:'v1.0', unit:'mg/L',       lod:0.05, loq:0.1,  range:'0–100',    tat:2, specMin:0, specMax:11,    category:'Inorganic',        accredited:true,  sans241:'Acute health' },
    { id:'t-no2',    code:'NO2',    name:'Nitrite (as N)',               method:'APHA 4500-NO2 B',       methodVer:'v1.0', unit:'mg/L',       lod:0.01, loq:0.05, range:'0–50',     tat:2, specMin:0, specMax:0.9,   category:'Inorganic',        accredited:true,  sans241:'Acute health' },
    { id:'t-nh4',    code:'NH4',    name:'Ammonia (as N)',               method:'APHA 4500-NH3',         methodVer:'v1.0', unit:'mg/L',       lod:0.05, loq:0.1,  range:'0–100',    tat:2, specMin:0, specMax:1.5,   category:'Inorganic',        accredited:true,  sans241:'Aesthetic' },
    { id:'t-so4',    code:'SO4',    name:'Sulfate',                      method:'APHA 4500-SO4 E',       methodVer:'v1.0', unit:'mg/L',       lod:1,    loq:5,    range:'0–2000',   tat:2, specMin:0, specMax:250,   category:'Inorganic',        accredited:true,  sans241:'Aesthetic' },
    { id:'t-cl',     code:'CL',     name:'Chloride',                     method:'APHA 4500-Cl B',        methodVer:'v1.0', unit:'mg/L',       lod:1,    loq:5,    range:'0–10000',  tat:1, specMin:0, specMax:300,   category:'Inorganic',        accredited:true,  sans241:'Aesthetic' },
    { id:'t-f',      code:'F',      name:'Fluoride',                     method:'APHA 4500-F C',         methodVer:'v1.0', unit:'mg/L',       lod:0.05, loq:0.1,  range:'0–10',     tat:2, specMin:0, specMax:1.5,   category:'Inorganic',        accredited:true,  sans241:'Chronic health' },
    { id:'t-cn',     code:'CN',     name:'Cyanide (Total)',              method:'APHA 4500-CN E',        methodVer:'v1.0', unit:'mg/L',       lod:0.005,loq:0.01, range:'0–5',      tat:3, specMin:0, specMax:0.07,  category:'Inorganic',        accredited:false, sans241:'Acute health' },
    { id:'t-hard',   code:'HARD',   name:'Total Hardness (as CaCO₃)',    method:'APHA 2340-C',           methodVer:'v1.0', unit:'mg/L',       lod:1,    loq:2,    range:'0–1000',   tat:2, specMin:0, specMax:500,   category:'Inorganic',        accredited:true,  sans241:'Operational' },
    { id:'t-alk',    code:'ALK',    name:'Total Alkalinity (as CaCO₃)',  method:'APHA 2320-B',           methodVer:'v1.0', unit:'mg/L',       lod:1,    loq:2,    range:'0–1000',   tat:1, specMin:0, specMax:500,   category:'Inorganic',        accredited:true,  sans241:'Operational' },

    // ── Trace Metals (ICP-OES / ICP-MS) ─────────────────────────────────
    { id:'t-al',     code:'AL',     name:'Aluminium',                    method:'ICP-OES (EPA 200.7)',   methodVer:'v2.3', unit:'mg/L',       lod:0.005,loq:0.01, range:'0–10',     tat:3, specMin:0, specMax:0.3,   category:'Metals',           accredited:true,  sans241:'Operational' },
    { id:'t-sb',     code:'SB',     name:'Antimony',                     method:'ICP-MS (EPA 200.8)',    methodVer:'v1.0', unit:'mg/L',       lod:0.001,loq:0.005,range:'0–1',      tat:5, specMin:0, specMax:0.02,  category:'Metals',           accredited:true,  sans241:'Chronic health' },
    { id:'t-as',     code:'AS',     name:'Arsenic',                      method:'ICP-MS (EPA 200.8)',    methodVer:'v1.0', unit:'mg/L',       lod:0.001,loq:0.005,range:'0–1',      tat:5, specMin:0, specMax:0.01,  category:'Metals',           accredited:true,  sans241:'Chronic health' },
    { id:'t-ba',     code:'BA',     name:'Barium',                       method:'ICP-MS (EPA 200.8)',    methodVer:'v1.0', unit:'mg/L',       lod:0.001,loq:0.005,range:'0–10',     tat:5, specMin:0, specMax:0.7,   category:'Metals',           accredited:false, sans241:'Chronic health' },
    { id:'t-b',      code:'B',      name:'Boron',                        method:'ICP-OES (EPA 200.7)',   methodVer:'v2.3', unit:'mg/L',       lod:0.01, loq:0.05, range:'0–10',     tat:3, specMin:0, specMax:2.4,   category:'Metals',           accredited:false, sans241:'Chronic health' },
    { id:'t-cd',     code:'CD',     name:'Cadmium',                      method:'ICP-MS (EPA 200.8)',    methodVer:'v1.0', unit:'mg/L',       lod:0.0005,loq:0.001,range:'0–1',     tat:5, specMin:0, specMax:0.003, category:'Metals',           accredited:true,  sans241:'Chronic health' },
    { id:'t-ca',     code:'CA',     name:'Calcium',                      method:'ICP-OES (EPA 200.7)',   methodVer:'v2.3', unit:'mg/L',       lod:0.5,  loq:1,    range:'0–500',    tat:3, specMin:0, specMax:150,   category:'Metals',           accredited:true,  sans241:'Operational' },
    { id:'t-cr',     code:'CR',     name:'Chromium (Total)',             method:'ICP-OES (EPA 200.7)',   methodVer:'v2.3', unit:'mg/L',       lod:0.005,loq:0.01, range:'0–10',     tat:3, specMin:0, specMax:0.05,  category:'Metals',           accredited:true,  sans241:'Chronic health' },
    { id:'t-cu',     code:'CU',     name:'Copper',                       method:'ICP-OES (EPA 200.7)',   methodVer:'v2.3', unit:'mg/L',       lod:0.005,loq:0.01, range:'0–10',     tat:3, specMin:0, specMax:2.0,   category:'Metals',           accredited:true,  sans241:'Chronic health' },
    { id:'t-fe',     code:'FE',     name:'Iron (Total)',                 method:'ICP-OES (EPA 200.7)',   methodVer:'v2.3', unit:'mg/L',       lod:0.01, loq:0.05, range:'0–50',     tat:3, specMin:0, specMax:0.3,   category:'Metals',           accredited:true,  sans241:'Aesthetic' },
    { id:'t-pb',     code:'PB',     name:'Lead',                         method:'ICP-MS (EPA 200.8)',    methodVer:'v1.0', unit:'mg/L',       lod:0.001,loq:0.005,range:'0–1',      tat:5, specMin:0, specMax:0.01,  category:'Metals',           accredited:true,  sans241:'Chronic health' },
    { id:'t-mg',     code:'MG',     name:'Magnesium',                    method:'ICP-OES (EPA 200.7)',   methodVer:'v2.3', unit:'mg/L',       lod:0.5,  loq:1,    range:'0–500',    tat:3, specMin:0, specMax:70,    category:'Metals',           accredited:true,  sans241:'Operational' },
    { id:'t-mn',     code:'MN',     name:'Manganese',                    method:'ICP-OES (EPA 200.7)',   methodVer:'v2.3', unit:'mg/L',       lod:0.005,loq:0.01, range:'0–10',     tat:3, specMin:0, specMax:0.4,   category:'Metals',           accredited:true,  sans241:'Aesthetic' },
    { id:'t-hg',     code:'HG',     name:'Mercury',                      method:'CVAA (EPA 245.1)',      methodVer:'v1.0', unit:'mg/L',       lod:0.0002,loq:0.001,range:'0–0.1',   tat:5, specMin:0, specMax:0.006, category:'Metals',           accredited:true,  sans241:'Chronic health' },
    { id:'t-ni',     code:'NI',     name:'Nickel',                       method:'ICP-OES (EPA 200.7)',   methodVer:'v2.3', unit:'mg/L',       lod:0.005,loq:0.01, range:'0–10',     tat:3, specMin:0, specMax:0.07,  category:'Metals',           accredited:true,  sans241:'Chronic health' },
    { id:'t-na',     code:'NA',     name:'Sodium',                       method:'ICP-OES (EPA 200.7)',   methodVer:'v2.3', unit:'mg/L',       lod:0.5,  loq:1,    range:'0–10000',  tat:3, specMin:0, specMax:200,   category:'Metals',           accredited:true,  sans241:'Aesthetic' },
    { id:'t-se',     code:'SE',     name:'Selenium',                     method:'ICP-MS (EPA 200.8)',    methodVer:'v1.0', unit:'mg/L',       lod:0.001,loq:0.005,range:'0–1',      tat:5, specMin:0, specMax:0.04,  category:'Metals',           accredited:true,  sans241:'Chronic health' },
    { id:'t-u',      code:'U',      name:'Uranium',                      method:'ICP-MS (EPA 200.8)',    methodVer:'v1.0', unit:'mg/L',       lod:0.0005,loq:0.001,range:'0–1',     tat:5, specMin:0, specMax:0.03,  category:'Metals',           accredited:false, sans241:'Chronic health' },
    { id:'t-v',      code:'V',      name:'Vanadium',                     method:'ICP-MS (EPA 200.8)',    methodVer:'v1.0', unit:'mg/L',       lod:0.001,loq:0.005,range:'0–1',      tat:5, specMin:0, specMax:0.2,   category:'Metals',           accredited:false, sans241:'Chronic health' },
    { id:'t-zn',     code:'ZN',     name:'Zinc',                         method:'ICP-OES (EPA 200.7)',   methodVer:'v2.3', unit:'mg/L',       lod:0.005,loq:0.01, range:'0–10',     tat:3, specMin:0, specMax:5,     category:'Metals',           accredited:true,  sans241:'Aesthetic' },

    // ── Organic determinands ────────────────────────────────────────────
    { id:'t-toc',    code:'TOC',    name:'Total Organic Carbon',         method:'APHA 5310-B',           methodVer:'v1.0', unit:'mg/L',       lod:0.5,  loq:1,    range:'0–100',    tat:3, specMin:0, specMax:10,    category:'Organic',          accredited:false, sans241:'Chronic health' },
    { id:'t-phen',   code:'PHEN',   name:'Phenols (Total)',              method:'APHA 5530-D',           methodVer:'v1.0', unit:'mg/L',       lod:0.001,loq:0.005,range:'0–1',      tat:5, specMin:0, specMax:0.01,  category:'Organic',          accredited:false, sans241:'Aesthetic' },
    { id:'t-mcyst',  code:'MCYST',  name:'Microcystin-LR (free)',        method:'ELISA / LC-MS',         methodVer:'v1.0', unit:'µg/L',       lod:0.05, loq:0.1,  range:'0–10',     tat:5, specMin:0, specMax:1,     category:'Organic',          accredited:false, sans241:'Acute health' }
  ];

  const _SANS241_PROFILES = [
    { id:'p-sans241-acute',     name:'SANS 241 — Acute Health Suite',         tests:['t-ec','t-no3','t-no2','t-cn','t-mcyst'] },
    { id:'p-sans241-micro',     name:'SANS 241 — Microbiological',            tests:['t-ec','t-colif','t-hpc','t-somph'] },
    { id:'p-sans241-physical',  name:'SANS 241 — Physical / Aesthetic',       tests:['t-ph','t-cond','t-tds','t-turb','t-colour','t-taste','t-odour'] },
    { id:'p-sans241-disinf',    name:'SANS 241 — Disinfectants / By-products',tests:['t-fcl','t-mchla','t-thm'] },
    { id:'p-sans241-macro',     name:'SANS 241 — Macro-determinands',         tests:['t-nh4','t-no3','t-no2','t-cl','t-so4','t-f','t-cn','t-hard','t-alk'] },
    { id:'p-sans241-metals',    name:'SANS 241 — Trace Metals (full)',        tests:['t-al','t-sb','t-as','t-ba','t-b','t-cd','t-ca','t-cr','t-cu','t-fe','t-pb','t-mg','t-mn','t-hg','t-ni','t-na','t-se','t-u','t-v','t-zn'] },
    { id:'p-sans241-organic',   name:'SANS 241 — Organic determinands',       tests:['t-toc','t-phen','t-mcyst'] },
    { id:'p-sans241-operational',name:'SANS 241 — Operational Monitoring',    tests:['t-ph','t-cond','t-turb','t-fcl','t-ec','t-colif'] },
    { id:'p-sans241-full',      name:'SANS 241 — FULL Compliance Suite',      tests:['t-ec','t-colif','t-hpc','t-somph','t-ph','t-cond','t-tds','t-turb','t-colour','t-fcl','t-mchla','t-thm','t-nh4','t-no3','t-no2','t-cl','t-so4','t-f','t-cn','t-hard','t-alk','t-al','t-sb','t-as','t-cd','t-cr','t-cu','t-fe','t-pb','t-mn','t-hg','t-ni','t-na','t-se','t-u','t-zn','t-toc'] },
    { id:'p-bore',              name:'Borehole Potability Screen',            tests:['t-ph','t-cond','t-tds','t-turb','t-ec','t-colif','t-no3','t-fe','t-mn','t-hard','t-na'] }
  ];

  /* ---------- Seed Data ---------- */
  const SEED = {
    async run() {
      const existing = await DB.get('settings','seeded');
      if (existing) {
        // Already seeded — only refresh the test catalogue + profiles if the
        // catalogue version has bumped. User data (samples, clients, results,
        // users, instruments, inventory, audit) is left untouched.
        const cv = await DB.get('settings','catalogueVersion');
        const haveVersion = cv ? cv.value : 1;
        if (haveVersion < CATALOGUE_VERSION) {
          await SEED.refreshCatalogue();
          await DB.put('settings', { id:'catalogueVersion', value:CATALOGUE_VERSION, ts: nowISO() });
          await DB.audit('CATALOGUE_REFRESH', 'system', 'tests+profiles', { from: haveVersion }, { to: CATALOGUE_VERSION });
        }
        return;
      }

      // Users
      const users = [
        { id:'u-admin', name:'Dr. Nomsa Khumalo', role:'admin', email:'nomsa@hadrongrp.com', active:true, signature:'NK' },
        { id:'u-mgr',   name:'Jaco Swanepoel',     role:'authoriser', email:'jaco@hadrongrp.com', active:true, signature:'JS' },
        { id:'u-rev',   name:'Thandi Mokoena',     role:'reviewer', email:'thandi@hadrongrp.com', active:true, signature:'TM' },
        { id:'u-an1',   name:'Sipho Dlamini',      role:'analyst', email:'sipho@hadrongrp.com', active:true, signature:'SD' },
        { id:'u-an2',   name:'Marelize van Wyk',   role:'analyst', email:'marelize@hadrongrp.com', active:true, signature:'MvW' },
        { id:'u-sam',   name:'Bongani Nkosi',      role:'sampler', email:'bongani@hadrongrp.com', active:true, signature:'BN' }
      ];
      for (const u of users) await DB.put('users', u);
      S.currentUser = users[1]; // Jaco by default

      // Clients
      const clients = [
        { id:'c-muni', name:'City of Tshwane — Water & Sanitation', contact:'Mr. P. Moloi', email:'p.moloi@tshwane.gov.za', phone:'012-358-1234', address:'Pretoria CBD', industry:'Municipal', created: nowISO() },
        { id:'c-sasol',name:'Sasol Secunda Complex',                contact:'Ms. L. Botha',  email:'l.botha@sasol.com',     phone:'017-610-5000', address:'Secunda',     industry:'Petrochemical', created: nowISO() },
        { id:'c-farm', name:'Greenfields Agri (Pty) Ltd',           contact:'Mr. J. du Toit',email:'j.dutoit@greenfields.co.za',phone:'013-752-0909',address:'Mpumalanga', industry:'Agriculture', created: nowISO() },
        { id:'c-mine', name:'Sibanye-Stillwater Rustenburg Ops',    contact:'Eng. S. Kruger',email:'s.kruger@sibanyestillwater.com',phone:'014-571-7000',address:'Rustenburg',industry:'Mining', created: nowISO() }
      ];
      for (const c of clients) await DB.put('clients', c);

      // Tests + profiles come from module-scope constants so refreshCatalogue()
      // can reuse them without re-entering the seed flow.
      for (const t of _SANS241_TESTS) await DB.put('tests', t);
      for (const p of _SANS241_PROFILES) await DB.put('profiles', p);

      // Instruments
      const instruments = [
        { id:'i-phm',   name:'pH Meter — Bench',         model:'Hanna HI-5522',  serial:'HI25501',     location:'Lab A Bench 1', tests:['t-ph'],          calIntDays:90,  lastCal:'2026-02-20', nextCal:'2026-05-21', status:'active'  },
        { id:'i-ecm',   name:'Conductivity Meter',       model:'Thermo Orion 013005MD', serial:'O013005', location:'Lab A Bench 1', tests:['t-cond','t-tds'], calIntDays:180, lastCal:'2026-01-15', nextCal:'2026-07-14', status:'active'  },
        { id:'i-turb',  name:'Turbidity Meter',          model:'Hach 2100Q',     serial:'2100Q-417',   location:'Lab A Bench 2', tests:['t-turb'],        calIntDays:30,  lastCal:'2026-04-10', nextCal:'2026-05-10', status:'active'  },
        { id:'i-dpd',   name:'DPD Photometer',           model:'Hach DR1900',    serial:'DR1900-88',   location:'Lab A Bench 2', tests:['t-fcl','t-cl2'], calIntDays:365, lastCal:'2025-09-01', nextCal:'2026-09-01', status:'active'  },
        { id:'i-icp',   name:'ICP-OES',                  model:'Agilent 5800',   serial:'AG5800-221',  location:'Metals Lab',    tests:['t-fe','t-mn'],   calIntDays:7,   lastCal:'2026-04-20', nextCal:'2026-04-27', status:'active'  },
        { id:'i-inc35', name:'Incubator 35°C',           model:'Memmert IN55',   serial:'MM-55-04',    location:'Micro Lab',     tests:['t-colif','t-ec'],calIntDays:30,  lastCal:'2026-03-25', nextCal:'2026-04-24', status:'active'  },
        { id:'i-inc22', name:'Incubator 22°C',           model:'Memmert IN55',   serial:'MM-55-09',    location:'Micro Lab',     tests:['t-hpc'],         calIntDays:30,  lastCal:'2026-03-28', nextCal:'2026-04-27', status:'active'  },
        { id:'i-aut',   name:'Autoclave',                model:'Tuttnauer 3870', serial:'TU-3870-12',  location:'Micro Lab',     tests:[],                calIntDays:180, lastCal:'2025-12-05', nextCal:'2026-06-03', status:'active'  },
        { id:'i-bal',   name:'Analytical Balance',       model:'Mettler XPR205', serial:'MET-XPR-331', location:'Prep Room',     tests:[],                calIntDays:365, lastCal:'2025-10-12', nextCal:'2026-10-12', status:'active'  }
      ];
      for (const i of instruments) await DB.put('instruments', i);

      // Calibration records (recent)
      const cals = [
        { id:'cal-001', instrumentId:'i-phm',  date:'2026-02-20', type:'3-point', performedBy:'u-an1', result:'pass', notes:'Slope 98.2%, buffers pH 4.01, 7.00, 10.01', next:'2026-05-21' },
        { id:'cal-002', instrumentId:'i-turb', date:'2026-04-10', type:'StablCal set', performedBy:'u-an2', result:'pass', notes:'<0.1, 20, 100, 800 NTU — all within ±5%', next:'2026-05-10' },
        { id:'cal-003', instrumentId:'i-icp',  date:'2026-04-20', type:'Multi-element standard', performedBy:'u-an1', result:'pass', notes:'R²>0.9995 for Fe, Mn', next:'2026-04-27' }
      ];
      for (const c of cals) await DB.put('calibrations', c);

      // Inventory
      const inventory = [
        { id:'inv-phbuf4',  name:'pH Buffer 4.01',          lot:'PH4-2025-118', supplier:'Hanna',       received:'2025-11-10', expiry:'2026-11-10', qty:500, unit:'mL', min:250, coa:true, storage:'Room Temp' },
        { id:'inv-phbuf7',  name:'pH Buffer 7.00',          lot:'PH7-2025-118', supplier:'Hanna',       received:'2025-11-10', expiry:'2026-11-10', qty:500, unit:'mL', min:250, coa:true, storage:'Room Temp' },
        { id:'inv-phbuf10', name:'pH Buffer 10.01',         lot:'PH10-2025-118',supplier:'Hanna',       received:'2025-11-10', expiry:'2026-11-10', qty:500, unit:'mL', min:250, coa:true, storage:'Room Temp' },
        { id:'inv-ntuset',  name:'StablCal Turbidity Set',  lot:'SC-26-004',    supplier:'Hach',        received:'2026-01-12', expiry:'2026-07-12', qty:1,   unit:'set',min:1,   coa:true, storage:'Dark, cool' },
        { id:'inv-dpd',     name:'DPD Free Chlorine Powder',lot:'DPD-26-A12',   supplier:'Hach',        received:'2026-02-01', expiry:'2027-02-01', qty:500, unit:'sachets', min:100, coa:true, storage:'Dry' },
        { id:'inv-lac',     name:'Lactose Broth',           lot:'LB-25-2224',   supplier:'Merck',       received:'2025-12-02', expiry:'2026-05-02', qty:250, unit:'g',  min:100, coa:true, storage:'+4°C' },
        { id:'inv-mfc',     name:'mFC Agar',                lot:'MFC-26-003',   supplier:'Merck',       received:'2026-03-18', expiry:'2026-09-18', qty:500, unit:'g',  min:100, coa:true, storage:'+4°C' },
        { id:'inv-mnstd',   name:'Mn 1000 mg/L ICP Standard',lot:'MN-26-071',   supplier:'SMM Instruments', received:'2026-01-05', expiry:'2027-01-05', qty:100, unit:'mL', min:50,  coa:true, storage:'Room Temp' },
        { id:'inv-festd',   name:'Fe 1000 mg/L ICP Standard',lot:'FE-26-071',   supplier:'SMM Instruments', received:'2026-01-05', expiry:'2027-01-05', qty:100, unit:'mL', min:50,  coa:true, storage:'Room Temp' }
      ];
      for (const it of inventory) await DB.put('inventory', it);

      // Documents (SOP library)
      const docs = [
        { id:'doc-sop-001', title:'SOP — pH Determination',          ver:'3.0', effective:'2025-10-01', review:'2027-10-01', owner:'u-mgr', status:'approved', type:'SOP' },
        { id:'doc-sop-002', title:'SOP — Turbidity Measurement',     ver:'1.4', effective:'2025-06-14', review:'2027-06-14', owner:'u-mgr', status:'approved', type:'SOP' },
        { id:'doc-sop-003', title:'SOP — Total Coliforms (MF)',      ver:'2.0', effective:'2026-01-10', review:'2028-01-10', owner:'u-mgr', status:'approved', type:'SOP' },
        { id:'doc-sop-004', title:'SOP — ICP-OES Metals (Fe, Mn)',   ver:'2.3', effective:'2025-12-15', review:'2027-12-15', owner:'u-mgr', status:'approved', type:'SOP' },
        { id:'doc-qm-001',  title:'Quality Manual',                  ver:'5.2', effective:'2026-01-01', review:'2028-01-01', owner:'u-admin', status:'approved', type:'Manual' },
        { id:'doc-pol-001', title:'Policy — Impartiality Commitment',ver:'1.1', effective:'2025-07-01', review:'2027-07-01', owner:'u-admin', status:'approved', type:'Policy' },
        { id:'doc-wi-001',  title:'WI — Chain of Custody Handling',  ver:'2.0', effective:'2025-08-20', review:'2027-08-20', owner:'u-rev',  status:'approved', type:'Work Instruction' }
      ];
      for (const d of docs) await DB.put('documents', d);

      // Competency matrix
      const comp = [
        { id:'cm-001', userId:'u-an1', testId:'t-ph',   status:'authorised', assessed:'2026-01-10', nextReview:'2027-01-10', assessor:'u-rev' },
        { id:'cm-002', userId:'u-an1', testId:'t-cond', status:'authorised', assessed:'2026-01-10', nextReview:'2027-01-10', assessor:'u-rev' },
        { id:'cm-003', userId:'u-an1', testId:'t-turb', status:'authorised', assessed:'2026-01-10', nextReview:'2027-01-10', assessor:'u-rev' },
        { id:'cm-004', userId:'u-an1', testId:'t-fe',   status:'authorised', assessed:'2026-02-15', nextReview:'2027-02-15', assessor:'u-rev' },
        { id:'cm-005', userId:'u-an2', testId:'t-colif',status:'authorised', assessed:'2025-11-22', nextReview:'2026-11-22', assessor:'u-rev' },
        { id:'cm-006', userId:'u-an2', testId:'t-ec',   status:'authorised', assessed:'2025-11-22', nextReview:'2026-11-22', assessor:'u-rev' },
        { id:'cm-007', userId:'u-an2', testId:'t-hpc',  status:'authorised', assessed:'2025-11-22', nextReview:'2026-11-22', assessor:'u-rev' },
        { id:'cm-008', userId:'u-an2', testId:'t-fcl',  status:'training',   assessed:'2026-03-01', nextReview:'2026-06-01', assessor:'u-rev' }
      ];
      for (const c of comp) await DB.put('competencies', c);

      // Samples (mix of states)
      const today = new Date();
      const dIso = (offset) => { const d = new Date(today); d.setDate(d.getDate()+offset); return d.toISOString(); };
      const samples = [
        { id:'s-001', barcode:'HAD-26-0421-001', clientId:'c-muni',  description:'Potable tap — Clinic Mamelodi', matrix:'Drinking Water', received:dIso(-3), sampledAt:dIso(-4), sampledBy:'u-sam', temp:6.2, notes:'Flushed 2 min. Free Cl₂ on-site 0.35 mg/L', status:'in-progress', priority:'normal', profileId:'p-sans241-basic', tests:['t-ph','t-cond','t-turb','t-fcl','t-ec'], storage:'+4°C Fridge B', custody:[{ts:dIso(-4),event:'Collected',by:'u-sam'},{ts:dIso(-3),event:'Received at lab',by:'u-rev'},{ts:dIso(-3),event:'Booked in',by:'u-rev'}] },
        { id:'s-002', barcode:'HAD-26-0421-002', clientId:'c-muni',  description:'Reservoir outlet — Soshanguve #2', matrix:'Drinking Water', received:dIso(-3), sampledAt:dIso(-3), sampledBy:'u-sam', temp:5.8, notes:'', status:'under-review', priority:'normal', profileId:'p-sans241-basic', tests:['t-ph','t-cond','t-turb','t-fcl','t-ec'], storage:'+4°C Fridge B', custody:[{ts:dIso(-3),event:'Collected',by:'u-sam'},{ts:dIso(-3),event:'Received at lab',by:'u-rev'}] },
        { id:'s-003', barcode:'HAD-26-0420-003', clientId:'c-farm',  description:'Borehole BH-07 @ Greenfields',     matrix:'Groundwater',    received:dIso(-5), sampledAt:dIso(-6), sampledBy:'u-sam', temp:7.1, notes:'Client reports metallic taste', status:'authorised', priority:'high', profileId:'p-bore', tests:['t-ph','t-cond','t-turb','t-tds','t-ec','t-no3','t-fe','t-mn','t-hard'], storage:'+4°C Fridge A', custody:[{ts:dIso(-6),event:'Collected',by:'u-sam'},{ts:dIso(-5),event:'Received',by:'u-rev'},{ts:dIso(-1),event:'Authorised',by:'u-mgr'}] },
        { id:'s-004', barcode:'HAD-26-0422-004', clientId:'c-sasol', description:'Cooling tower CT-03 blowdown',     matrix:'Process Water',  received:dIso(-1), sampledAt:dIso(-2), sampledBy:'u-sam', temp:12.0, notes:'Non-accredited for CLO2', status:'received', priority:'urgent', profileId:null, tests:['t-ph','t-cond','t-cl2'], storage:'+4°C Fridge A', custody:[{ts:dIso(-2),event:'Collected',by:'u-sam'},{ts:dIso(-1),event:'Received',by:'u-rev'}] },
        { id:'s-005', barcode:'HAD-26-0418-005', clientId:'c-mine',  description:'Tailings decant dam',               matrix:'Waste Water',    received:dIso(-6), sampledAt:dIso(-7), sampledBy:'u-sam', temp:9.4, notes:'', status:'released', priority:'normal', profileId:null, tests:['t-ph','t-cond','t-fe','t-mn','t-hard'], storage:'Archived', custody:[{ts:dIso(-7),event:'Collected',by:'u-sam'},{ts:dIso(-6),event:'Received',by:'u-rev'},{ts:dIso(-2),event:'COA Released',by:'u-mgr'}] }
      ];
      for (const s of samples) await DB.put('samples', s);

      // Results (linked to samples)
      const results = [
        // s-003 (authorised)
        { id:'r-001', sampleId:'s-003', testId:'t-ph',   value:7.4,    unit:'pH units',  analyst:'u-an1', reviewer:'u-rev', authoriser:'u-mgr', entered:dIso(-4), reviewed:dIso(-2), authorised:dIso(-1), status:'authorised', instrumentId:'i-phm',  methodVer:'v3.0', flag:'ok' },
        { id:'r-002', sampleId:'s-003', testId:'t-cond', value:84,     unit:'mS/m',      analyst:'u-an1', reviewer:'u-rev', authoriser:'u-mgr', entered:dIso(-4), reviewed:dIso(-2), authorised:dIso(-1), status:'authorised', instrumentId:'i-ecm',  methodVer:'v2.1', flag:'ok' },
        { id:'r-003', sampleId:'s-003', testId:'t-turb', value:0.6,    unit:'NTU',       analyst:'u-an1', reviewer:'u-rev', authoriser:'u-mgr', entered:dIso(-4), reviewed:dIso(-2), authorised:dIso(-1), status:'authorised', instrumentId:'i-turb', methodVer:'v1.4', flag:'ok' },
        { id:'r-004', sampleId:'s-003', testId:'t-tds',  value:612,    unit:'mg/L',      analyst:'u-an1', reviewer:'u-rev', authoriser:'u-mgr', entered:dIso(-4), reviewed:dIso(-2), authorised:dIso(-1), status:'authorised', instrumentId:'i-ecm',  methodVer:'v1.2', flag:'ok' },
        { id:'r-005', sampleId:'s-003', testId:'t-ec',   value:0,      unit:'cfu/100mL', analyst:'u-an2', reviewer:'u-rev', authoriser:'u-mgr', entered:dIso(-3), reviewed:dIso(-2), authorised:dIso(-1), status:'authorised', instrumentId:'i-inc35', methodVer:'v2.0', flag:'ok' },
        { id:'r-006', sampleId:'s-003', testId:'t-no3',  value:8.1,    unit:'mg/L',      analyst:'u-an1', reviewer:'u-rev', authoriser:'u-mgr', entered:dIso(-3), reviewed:dIso(-2), authorised:dIso(-1), status:'authorised', instrumentId:null,     methodVer:'v1.0', flag:'ok' },
        { id:'r-007', sampleId:'s-003', testId:'t-fe',   value:0.42,   unit:'mg/L',      analyst:'u-an1', reviewer:'u-rev', authoriser:'u-mgr', entered:dIso(-3), reviewed:dIso(-2), authorised:dIso(-1), status:'authorised', instrumentId:'i-icp',  methodVer:'v2.3', flag:'fail' },
        { id:'r-008', sampleId:'s-003', testId:'t-mn',   value:0.18,   unit:'mg/L',      analyst:'u-an1', reviewer:'u-rev', authoriser:'u-mgr', entered:dIso(-3), reviewed:dIso(-2), authorised:dIso(-1), status:'authorised', instrumentId:'i-icp',  methodVer:'v2.3', flag:'ok' },
        { id:'r-009', sampleId:'s-003', testId:'t-hard', value:148,    unit:'mg/L',      analyst:'u-an1', reviewer:'u-rev', authoriser:'u-mgr', entered:dIso(-3), reviewed:dIso(-2), authorised:dIso(-1), status:'authorised', instrumentId:null,     methodVer:'v1.0', flag:'ok' },
        // s-002 (under review)
        { id:'r-010', sampleId:'s-002', testId:'t-ph',   value:7.9,    unit:'pH units',  analyst:'u-an1', reviewer:null, authoriser:null, entered:dIso(-2), reviewed:null, authorised:null, status:'pending-review', instrumentId:'i-phm',  methodVer:'v3.0', flag:'ok' },
        { id:'r-011', sampleId:'s-002', testId:'t-cond', value:55,     unit:'mS/m',      analyst:'u-an1', reviewer:null, authoriser:null, entered:dIso(-2), reviewed:null, authorised:null, status:'pending-review', instrumentId:'i-ecm',  methodVer:'v2.1', flag:'ok' },
        { id:'r-012', sampleId:'s-002', testId:'t-turb', value:0.4,    unit:'NTU',       analyst:'u-an1', reviewer:null, authoriser:null, entered:dIso(-2), reviewed:null, authorised:null, status:'pending-review', instrumentId:'i-turb', methodVer:'v1.4', flag:'ok' },
        { id:'r-013', sampleId:'s-002', testId:'t-fcl',  value:0.48,   unit:'mg/L',      analyst:'u-an1', reviewer:null, authoriser:null, entered:dIso(-2), reviewed:null, authorised:null, status:'pending-review', instrumentId:'i-dpd',  methodVer:'v1.1', flag:'ok' },
        { id:'r-014', sampleId:'s-002', testId:'t-ec',   value:0,      unit:'cfu/100mL', analyst:'u-an2', reviewer:null, authoriser:null, entered:dIso(-1), reviewed:null, authorised:null, status:'pending-review', instrumentId:'i-inc35', methodVer:'v2.0', flag:'ok' },
        // s-001 (in progress — only 2 done)
        { id:'r-015', sampleId:'s-001', testId:'t-ph',   value:7.1,    unit:'pH units',  analyst:'u-an1', reviewer:null, authoriser:null, entered:dIso(-1), reviewed:null, authorised:null, status:'entered', instrumentId:'i-phm',  methodVer:'v3.0', flag:'ok' },
        { id:'r-016', sampleId:'s-001', testId:'t-fcl',  value:0.32,   unit:'mg/L',      analyst:'u-an1', reviewer:null, authoriser:null, entered:dIso(-1), reviewed:null, authorised:null, status:'entered', instrumentId:'i-dpd',  methodVer:'v1.1', flag:'ok' }
      ];
      for (const r of results) await DB.put('results', r);

      // Worksheets
      const worksheets = [
        { id:'ws-001', code:'WS-2026-0421-PH',  test:'t-ph',  analyst:'u-an1', opened:dIso(-1), closed:null, samples:['s-001','s-002','s-003'], qc:[{type:'blank',expected:'<0.1',actual:0.05,status:'pass'},{type:'duplicate', of:'s-002',rpd:1.2,status:'pass'}], status:'open' },
        { id:'ws-002', code:'WS-2026-0420-MET', test:'t-fe',  analyst:'u-an1', opened:dIso(-3), closed:dIso(-2), samples:['s-003'], qc:[{type:'blank',expected:'<0.01',actual:0.008,status:'pass'},{type:'CRM',expected:0.50,actual:0.48,status:'pass'},{type:'spike',recovery:96,status:'pass'}], status:'closed' },
        { id:'ws-003', code:'WS-2026-0421-MIC', test:'t-ec',  analyst:'u-an2', opened:dIso(-1), closed:null, samples:['s-001','s-002'], qc:[{type:'negative control',actual:0,status:'pass'},{type:'positive control',actual:45,status:'pass'}], status:'open' }
      ];
      for (const w of worksheets) await DB.put('worksheets', w);

      // NCs / CAPAs
      const ncs = [
        { id:'nc-001', raised:dIso(-6), raisedBy:'u-an1', type:'Out-of-spec result', ref:'s-003 / t-fe', description:'Fe 0.42 mg/L exceeds SANS 241 (0.3). Informed client. Resample requested.', severity:'minor', status:'closed', correctiveAction:'Repeated analysis — confirmed. COA footnote added.', closed:dIso(-4), closedBy:'u-mgr' },
        { id:'nc-002', raised:dIso(-2), raisedBy:'u-rev', type:'Inventory near expiry', ref:'inv-lac', description:'Lactose Broth expires in 8 days, <1 month stock.', severity:'minor', status:'open', correctiveAction:'Order placed with Merck.', closed:null, closedBy:null },
        { id:'nc-003', raised:dIso(-10),raisedBy:'u-an2', type:'Calibration overdue', ref:'i-inc35', description:'Incubator temperature calibration delayed by 3 days.', severity:'moderate', status:'closed', correctiveAction:'External Cal performed. Review of cal schedule underway.', closed:dIso(-6), closedBy:'u-mgr' }
      ];
      for (const n of ncs) await DB.put('ncs', n);

      // Quotes — sample requests / bookings (no commercial pricing)
      const quotes = [
        { id:'q-001', clientId:'c-muni',  date:dIso(-14), items:[{profileId:'p-sans241-operational', qty:120}], status:'accepted' },
        { id:'q-002', clientId:'c-farm',  date:dIso(-7),  items:[{profileId:'p-bore', qty:4}],                 status:'sent' },
        { id:'q-003', clientId:'c-sasol', date:dIso(-2),  items:[{profileId:null, testId:'t-cl2', qty:24},{testId:'t-ph', qty:24}], status:'draft' }
      ];
      for (const q of quotes) await DB.put('quotes', q);

      await DB.put('settings', { id:'seeded', value:true, ts: nowISO() });
      await DB.put('settings', { id:'catalogueVersion', value:CATALOGUE_VERSION, ts: nowISO() });
      await DB.audit('SEED', 'system', 'seeded', null, { count: 'initial seed' });
    },

    // Replace just the tests + profiles tables with the latest reference set
    // (defined in run() above). Called from run() when CATALOGUE_VERSION has
    // moved on past the value stored on this device.
    async refreshCatalogue() {
      // Drop existing rows in tests + profiles, then re-add from the source of
      // truth — re-running run() with a flag would double-seed, so instead we
      // pull the canonical arrays out of the closure via a marker constant.
      // Easiest: clear, then re-run the seed which will skip because seeded:true
      // is already there. So we manually duplicate the catalogue arrays here.
      const tests = SEED._tests();
      const profiles = SEED._profiles();
      // Wipe + replace
      const existingTests = await DB.all('tests');
      for (const t of existingTests) await DB.del('tests', t.id);
      const existingProfiles = await DB.all('profiles');
      for (const p of existingProfiles) await DB.del('profiles', p.id);
      for (const t of tests) await DB.put('tests', t);
      for (const p of profiles) await DB.put('profiles', p);
    },

    // Canonical reference arrays — kept in helper functions so refreshCatalogue
    // can reach them without re-entering the full seed flow.
    _tests() { return _SANS241_TESTS; },
    _profiles() { return _SANS241_PROFILES; }
  };

  /* ---------- Module config: tiles and meta ---------- */
  const MODULES = [
    { key:'dashboard',  label:'Dashboard',    icon:'📊', g:'linear-gradient(135deg, #00b1ca 0%, #0078a3 100%)', sub:'KPIs & overview' },
    { key:'samples',    label:'Samples',      icon:'🧪', g:'linear-gradient(135deg, #4CAF50 0%, #2e7d32 100%)', sub:'Login & chain of custody' },
    { key:'tests',      label:'Tests',        icon:'🔬', g:'linear-gradient(135deg, #7a59d4 0%, #4527a0 100%)', sub:'Catalogue & methods' },
    { key:'worksheets', label:'Worksheets',   icon:'📋', g:'linear-gradient(135deg, #ff8f00 0%, #e65100 100%)', sub:'Batches & QC inserts' },
    { key:'results',    label:'Results',      icon:'✅', g:'linear-gradient(135deg, #26a69a 0%, #00695c 100%)', sub:'Entry, review, authorise' },
    { key:'instruments',label:'Instruments',  icon:'⚙️', g:'linear-gradient(135deg, #5c6bc0 0%, #283593 100%)', sub:'Register & calibration' },
    { key:'inventory',  label:'Inventory',    icon:'📦', g:'linear-gradient(135deg, #8d6e63 0%, #4e342e 100%)', sub:'Reagents, lots, expiry' },
    { key:'qc',         label:'Quality Control',icon:'📈',g:'linear-gradient(135deg, #ec407a 0%, #ad1457 100%)', sub:'Control charts & PT' },
    { key:'personnel',  label:'Personnel',    icon:'👥', g:'linear-gradient(135deg, #42a5f5 0%, #1565c0 100%)', sub:'Competency matrix' },
    { key:'documents',  label:'Documents',    icon:'📚', g:'linear-gradient(135deg, #78909c 0%, #37474f 100%)', sub:'SOPs & QMS' },
    { key:'reports',    label:'Reports & COA',icon:'📄', g:'linear-gradient(135deg, #ffa726 0%, #ef6c00 100%)', sub:'Generate & release' },
    { key:'clients',    label:'Clients',      icon:'🏢', g:'linear-gradient(135deg, #66bb6a 0%, #2e7d32 100%)', sub:'Accounts & quotes' },
    { key:'admin',      label:'Admin',        icon:'🛠️', g:'linear-gradient(135deg, #ef5350 0%, #c62828 100%)', sub:'Users, audit, settings' }
  ];

  /* ---------- Renderer ---------- */
  async function render() {
    const root = document.getElementById('limsShell');
    if (!root) return;
    root.scrollTop = 0;
    const title = document.getElementById('limsWinTitle');
    const mod = MODULES.find(m => m.key === S.view);
    title.textContent = mod ? ('LIMS · ' + mod.label) : 'LIMS';

    try {
      switch (S.view) {
        case 'hub':         return await renderHub(root);
        case 'dashboard':   return await renderDashboard(root);
        case 'samples':     return await renderSamples(root);
        case 'sample':      return await renderSampleDetail(root);
        case 'sample-new':  return await renderSampleForm(root);
        case 'tests':       return await renderTests(root);
        case 'test':        return await renderTestDetail(root);
        case 'worksheets':  return await renderWorksheets(root);
        case 'worksheet':   return await renderWorksheetDetail(root);
        case 'results':     return await renderResults(root);
        case 'instruments': return await renderInstruments(root);
        case 'instrument':  return await renderInstrumentDetail(root);
        case 'inventory':   return await renderInventory(root);
        case 'qc':          return await renderQC(root);
        case 'qc-chart':    return await renderQCChart(root);
        case 'personnel':   return await renderPersonnel(root);
        case 'person':      return await renderPersonDetail(root);
        case 'documents':   return await renderDocuments(root);
        case 'reports':     return await renderReports(root);
        case 'clients':     return await renderClients(root);
        case 'client':      return await renderClientDetail(root);
        case 'client-form': return await renderClientForm(root);
        case 'person-form': return await renderPersonForm(root);
        case 'admin':       return await renderAdmin(root);
        default: S.view = 'hub'; return render();
      }
    } catch (err) {
      root.innerHTML = `<div class="lims-empty">❌ ${esc(err.message)}</div>`;
      console.error(err);
    }
  }

  /* ---------- HUB ---------- */
  async function renderHub(root) {
    const [samples, results, instruments, ncs] = await Promise.all([DB.all('samples'), DB.all('results'), DB.all('instruments'), DB.all('ncs')]);
    const active = samples.filter(s => ['received','in-progress','under-review'].includes(s.status)).length;
    const pending = results.filter(r => r.status === 'pending-review').length;
    const overdueCals = instruments.filter(i => new Date(i.nextCal) < new Date()).length;
    const openNCs = ncs.filter(n => n.status === 'open').length;

    root.innerHTML = `
      <div class="lims-hub-header">
        <div class="lims-hub-welcome">
          <div class="lims-hub-hello">${esc(tt('lims.welcome','Welcome back'))}, ${esc((S.currentUser&&S.currentUser.name)||'Analyst')} 👋</div>
          <div class="lims-hub-sub">Hadron Group · ISO/IEC 17025:2017 Laboratory · SANAS T0492</div>
        </div>
        <div class="lims-hub-clock" id="limsClock">${new Date().toLocaleString()}</div>
      </div>

      <div class="lims-kpis">
        <div class="lims-kpi" onclick="limsGo('samples',{filter:'active'})"><div class="v">${active}</div><div class="l">${esc(tt('lims.activeSamples','Active samples'))}</div></div>
        <div class="lims-kpi" onclick="limsGo('results',{filter:'pending-review'})"><div class="v">${pending}</div><div class="l">${esc(tt('lims.pendingReview','Pending review'))}</div></div>
        <div class="lims-kpi" onclick="limsGo('instruments',{filter:'cal-due'})"><div class="v">${overdueCals}</div><div class="l">${esc(tt('lims.calOverdue','Cal overdue/due'))}</div></div>
        <div class="lims-kpi" onclick="limsGo('qc')"><div class="v">${openNCs}</div><div class="l">${esc(tt('lims.openNCs','Open NCs / CAPAs'))}</div></div>
      </div>

      <div class="lims-apps">
        ${MODULES.map(m => `
          <div class="lims-app" style="--g:${m.g};--c:${m.g.split(',')[1].trim().split(' ')[0]}" onclick="limsGo('${m.key}')">
            <div class="ribbon"></div>
            <div class="appicon">${m.icon}</div>
            <div class="appname">${esc(tt('lims.'+m.key, m.label))}</div>
            <div class="appsub">${esc(m.sub)}</div>
          </div>
        `).join('')}
      </div>

      <div class="lims-footer-note">
        <small>Demonstration build · seeded with example data · ${new Date().toLocaleDateString('en-ZA')}</small>
      </div>
    `;
    // live clock
    if (window._limsClockTimer) clearInterval(window._limsClockTimer);
    window._limsClockTimer = setInterval(()=>{ const el=document.getElementById('limsClock'); if(el) el.textContent=new Date().toLocaleString(); },1000);
  }

  /* ---------- DASHBOARD ---------- */
  async function renderDashboard(root) {
    const [samples, results, instruments, inventory, ncs, cms] = await Promise.all([
      DB.all('samples'), DB.all('results'), DB.all('instruments'), DB.all('inventory'), DB.all('ncs'), DB.all('competencies')
    ]);

    const now = new Date();
    const active = samples.filter(s => ['received','in-progress','under-review'].includes(s.status));
    const authorised = samples.filter(s => s.status === 'authorised' || s.status === 'released').length;
    const todayReceived = samples.filter(s => daysFromNow(s.received) === 0).length;
    const avgTat = (function(){
      const done = samples.filter(s => s.status === 'released' && s.custody);
      if (!done.length) return '—';
      const tats = done.map(s => {
        const rec = s.custody.find(c => c.event === 'Received at lab' || c.event === 'Received');
        const rel = s.custody.find(c => c.event === 'COA Released');
        if (!rec || !rel) return null;
        return daysBetween(rec.ts, rel.ts);
      }).filter(x => x !== null);
      return tats.length ? (tats.reduce((a,b)=>a+b,0)/tats.length).toFixed(1) + ' d' : '—';
    })();

    const calDue14 = instruments.filter(i => { const d = daysBetween(now, i.nextCal); return d <= 14 && d >= 0; });
    const calOverdue = instruments.filter(i => daysBetween(now, i.nextCal) < 0);
    const invExpSoon = inventory.filter(i => { const d = daysBetween(now, i.expiry); return d <= 30 && d >= 0; });
    const invExpired = inventory.filter(i => daysBetween(now, i.expiry) < 0);
    const invLow = inventory.filter(i => i.qty < i.min);
    const ncsOpen = ncs.filter(n => n.status === 'open');
    const failFlags = results.filter(r => r.flag === 'fail').length;

    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Dashboard',view:'dashboard'}])}
      <div class="lims-kpis">
        <div class="lims-kpi"><div class="v">${active.length}</div><div class="l">Active samples</div></div>
        <div class="lims-kpi"><div class="v">${todayReceived}</div><div class="l">Received today</div></div>
        <div class="lims-kpi"><div class="v">${authorised}</div><div class="l">Authorised / Released</div></div>
        <div class="lims-kpi"><div class="v">${avgTat}</div><div class="l">Avg TAT (released)</div></div>
        <div class="lims-kpi"><div class="v" style="color:#e53935;">${calOverdue.length}</div><div class="l">Cal overdue</div></div>
        <div class="lims-kpi"><div class="v" style="color:#c59d2b;">${calDue14.length}</div><div class="l">Cal due ≤14d</div></div>
        <div class="lims-kpi"><div class="v" style="color:#e53935;">${invExpired.length}</div><div class="l">Reagents expired</div></div>
        <div class="lims-kpi"><div class="v" style="color:#c59d2b;">${invExpSoon.length}</div><div class="l">Expire ≤30d</div></div>
        <div class="lims-kpi"><div class="v">${invLow.length}</div><div class="l">Low stock</div></div>
        <div class="lims-kpi"><div class="v">${ncsOpen.length}</div><div class="l">Open NCs</div></div>
        <div class="lims-kpi"><div class="v">${failFlags}</div><div class="l">Out-of-spec results</div></div>
      </div>

      <div class="lims-dashgrid">
        <div class="lims-dashcard">
          <div class="lims-section-title">Sample Workflow Board</div>
          <div class="lims-kanban">
            ${['received','in-progress','under-review','authorised','released'].map(st => `
              <div class="lims-kcol">
                <div class="lims-kcol-head">${st.replace('-',' ')} <span>(${samples.filter(s=>s.status===st).length})</span></div>
                ${samples.filter(s=>s.status===st).slice(0,5).map(s => `
                  <div class="lims-kcard" onclick="limsGo('sample',{id:'${s.id}'})">
                    <div class="kcard-title">${esc(s.barcode)}</div>
                    <div class="kcard-sub">${esc(s.description)}</div>
                    <div class="kcard-meta">${chip(s.priority,'neutral')} · ${s.tests.length} tests</div>
                  </div>
                `).join('') || '<div class="kcard-empty">—</div>'}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="lims-dashcard">
          <div class="lims-section-title">Alerts</div>
          <ul class="lims-alerts">
            ${calOverdue.map(i => `<li class="alert-fail">⚠️ <strong>Cal overdue:</strong> ${esc(i.name)} (by ${Math.abs(daysBetween(now,i.nextCal))}d) <a href="#" onclick="event.preventDefault();limsGo('instrument',{id:'${i.id}'})">open</a></li>`).join('')}
            ${calDue14.map(i => `<li class="alert-warn">🔔 <strong>Cal due ${daysBetween(now,i.nextCal)}d:</strong> ${esc(i.name)} <a href="#" onclick="event.preventDefault();limsGo('instrument',{id:'${i.id}'})">open</a></li>`).join('')}
            ${invExpired.map(it => `<li class="alert-fail">🛑 <strong>Reagent expired:</strong> ${esc(it.name)} (lot ${esc(it.lot)}) <a href="#" onclick="event.preventDefault();limsGo('inventory')">open</a></li>`).join('')}
            ${invExpSoon.map(it => `<li class="alert-warn">⏳ <strong>Expiring in ${daysBetween(now,it.expiry)}d:</strong> ${esc(it.name)} (lot ${esc(it.lot)})</li>`).join('')}
            ${ncsOpen.map(n => `<li class="alert-warn">📌 <strong>Open NC:</strong> ${esc(n.type)} — ${esc(n.ref)}</li>`).join('')}
            ${(calOverdue.length+calDue14.length+invExpired.length+invExpSoon.length+ncsOpen.length===0) ? '<li class="alert-ok">✅ All clear — no active alerts.</li>':''}
          </ul>
        </div>
      </div>
    `;
  }

  /* ---------- SAMPLES ---------- */
  async function renderSamples(root) {
    const samples = await DB.all('samples');
    const clients = await DB.all('clients');
    const clientMap = Object.fromEntries(clients.map(c=>[c.id,c.name]));
    const filter = S.params.filter;
    let list = samples.slice();
    if (filter === 'active') list = list.filter(s=>['received','in-progress','under-review'].includes(s.status));

    const byStatus = (st) => list.filter(s=>s.status===st);
    const view = S.params.view || 'kanban';

    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Samples',view:'samples'}])}
      <div class="lims-toolbar">
        <h2 class="lims-title">Samples <span class="lims-count">${list.length}</span></h2>
        <div style="flex:1"></div>
        <div class="lims-viewtoggle">
          <button class="lims-btn ${view==='kanban'?'primary':''}" onclick="limsGo('samples',{view:'kanban',filter:'${filter||''}'})">⊞ Kanban</button>
          <button class="lims-btn ${view==='list'?'primary':''}" onclick="limsGo('samples',{view:'list',filter:'${filter||''}'})">☰ List</button>
        </div>
        <button class="lims-btn primary" onclick="limsGo('sample-new')">+ New sample</button>
      </div>

      ${view === 'kanban' ? `
        <div class="lims-kanban">
          ${['received','in-progress','under-review','authorised','released','failed'].map(st => `
            <div class="lims-kcol">
              <div class="lims-kcol-head">${st.replace('-',' ')} <span>(${byStatus(st).length})</span></div>
              ${byStatus(st).map(s => `
                <div class="lims-kcard" onclick="limsGo('sample',{id:'${s.id}'})">
                  <div class="kcard-title">${esc(s.barcode)} ${s.priority==='urgent'?'🔥':(s.priority==='high'?'⚡':'')}</div>
                  <div class="kcard-sub">${esc(s.description)}</div>
                  <div class="kcard-meta"><span style="color:#6b7684;">${esc(clientMap[s.clientId]||'—').slice(0,28)}</span></div>
                  <div class="kcard-meta">${s.tests.length} test${s.tests.length!==1?'s':''} · Received ${fmtDate(s.received)}</div>
                </div>
              `).join('') || '<div class="kcard-empty">No samples</div>'}
            </div>
          `).join('')}
        </div>
      ` : `
        <table class="lims-table">
          <thead><tr><th>Barcode</th><th>Client</th><th>Description</th><th>Matrix</th><th>Received</th><th>Tests</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>
            ${list.map(s => `
              <tr onclick="limsGo('sample',{id:'${s.id}'})">
                <td><strong>${esc(s.barcode)}</strong></td>
                <td>${esc(clientMap[s.clientId]||'—')}</td>
                <td>${esc(s.description)}</td>
                <td>${esc(s.matrix)}</td>
                <td>${fmtDate(s.received)}</td>
                <td>${s.tests.length}</td>
                <td>${chip(s.priority, s.priority==='urgent'?'fail':(s.priority==='high'?'warn':'neutral'))}</td>
                <td>${chip(s.status, statusChipClass(s.status))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    `;
  }

  function statusChipClass(st) {
    return { received:'received','in-progress':'in-progress','under-review':'review',authorised:'authorised',released:'released',failed:'failed',expired:'expired',ok:'ok',warn:'warn' }[st] || 'neutral';
  }

  async function renderSampleDetail(root) {
    const s = await DB.get('samples', S.params.id);
    if (!s) { root.innerHTML = `<div class="lims-empty">Sample not found</div>`; return; }
    const clients = await DB.all('clients');
    const tests = await DB.all('tests');
    const results = (await DB.all('results')).filter(r=>r.sampleId===s.id);
    const users = await DB.all('users');
    const client = clients.find(c=>c.id===s.clientId);
    const testMap = Object.fromEntries(tests.map(t=>[t.id,t]));
    const userMap = Object.fromEntries(users.map(u=>[u.id,u.name]));

    const testRows = s.tests.map(tid => {
      const t = testMap[tid];
      const r = results.find(x=>x.testId===tid);
      if (!t) return '';
      const val = r ? r.value : '';
      const flagTxt = r ? (r.flag==='fail' ? chip('Out-of-spec','fail') : (r.flag==='ok' ? chip('In spec','ok') : chip(r.flag||'—','neutral'))) : chip('Pending','neutral');
      const statusTxt = r ? chip(r.status, r.status==='authorised'?'authorised':(r.status==='pending-review'?'review':'in-progress')) : chip('Awaiting','neutral');
      return `<tr>
        <td><strong>${esc(t.code)}</strong> ${esc(t.name)}</td>
        <td>${val===''?'—':esc(val)} ${r?esc(r.unit||t.unit):esc(t.unit)}</td>
        <td>${t.specMin!=null&&t.specMax!=null ? esc(t.specMin+' – '+t.specMax) : '—'}</td>
        <td>${flagTxt}</td>
        <td>${statusTxt}</td>
        <td>${r?esc(userMap[r.analyst]||''):''}</td>
      </tr>`;
    }).join('');

    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Samples',view:'samples'},{label:s.barcode,view:'sample',params:{id:s.id}}])}
      <div class="lims-toolbar">
        <h2 class="lims-title">${esc(s.barcode)}</h2>
        <span class="lims-badge-row">${chip(s.status,statusChipClass(s.status))} ${chip(s.priority, s.priority==='urgent'?'fail':'neutral')}</span>
        <div style="flex:1"></div>
        <button class="lims-btn" onclick="limsSampleAddCustody('${s.id}')">+ Custody event</button>
        <button class="lims-btn" onclick="limsSampleAdvance('${s.id}')">⏩ Advance status</button>
        <button class="lims-btn primary" onclick="limsSampleGenerateCOA('${s.id}')">📄 Generate COA</button>
      </div>

      <div class="lims-detail-grid">
        <div class="lims-detail-main">
          <div class="lims-card">
            <div class="lims-section-title">Sample details</div>
            <div class="lims-fieldgrid">
              <div class="lims-field"><label>Client</label><div>${esc(client?client.name:'—')}</div></div>
              <div class="lims-field"><label>Description</label><div>${esc(s.description)}</div></div>
              <div class="lims-field"><label>Matrix</label><div>${esc(s.matrix)}</div></div>
              <div class="lims-field"><label>Sampled at</label><div>${fmtDT(s.sampledAt)}</div></div>
              <div class="lims-field"><label>Sampled by</label><div>${esc(userMap[s.sampledBy]||'—')}</div></div>
              <div class="lims-field"><label>Received at lab</label><div>${fmtDT(s.received)}</div></div>
              <div class="lims-field"><label>Temperature on receipt</label><div>${s.temp!=null?esc(s.temp)+' °C':'—'}</div></div>
              <div class="lims-field"><label>Storage</label><div>${esc(s.storage||'—')}</div></div>
              <div class="lims-field lims-field-wide"><label>Notes</label><div>${esc(s.notes||'—')}</div></div>
            </div>
          </div>

          <div class="lims-card">
            <div class="lims-section-title">Tests requested (${s.tests.length})</div>
            <table class="lims-table compact">
              <thead><tr><th>Test</th><th>Result</th><th>Spec</th><th>Flag</th><th>Status</th><th>Analyst</th></tr></thead>
              <tbody>${testRows || '<tr><td colspan="6">No tests</td></tr>'}</tbody>
            </table>
            <div style="margin-top:10px;">
              <button class="lims-btn" onclick="limsSampleOpenResults('${s.id}')">Open result entry →</button>
            </div>
          </div>
        </div>

        <div class="lims-detail-side">
          <div class="lims-card">
            <div class="lims-section-title">Chain of custody</div>
            <div class="lims-timeline">
              ${(s.custody||[]).map(c => `
                <div class="tl-event">
                  <div class="tl-dot"></div>
                  <div class="tl-body">
                    <div class="tl-title">${esc(c.event)}</div>
                    <div class="tl-meta">${fmtDT(c.ts)} · ${esc(userMap[c.by]||c.by||'—')}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="lims-card">
            <div class="lims-section-title">QR / Barcode</div>
            <div class="lims-sticker">
              <div class="sticker-barcode">${esc(s.barcode)}</div>
              <div class="sticker-qr-real">${realQR(s.id, 'sample', 140)}</div>
              <div class="sticker-client">${esc(client?client.name:'')}</div>
              <div class="sticker-desc">${esc(s.description).slice(0,40)}</div>
              <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:4px;">
                <button class="lims-btn" onclick="limsQrPrint('sample','${s.id}','${esc(s.barcode)}','${esc(s.description).replace(/'/g,'')}')">🖨 Sticker</button>
                <button class="lims-btn ghost" onclick="limsQrBuilder('sample','${s.id}')">⬛ QR Builder</button>
              </div>
              <div style="font-size:10px;color:#6b7684;margin-top:6px;word-break:break-all;">${qrURL('sample', s.id)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Real QR via qr-app.js helpers (falls back to decorative stub if not loaded)
  function realQR(id, kind, size) {
    const sz = size || 140;
    if (typeof window.qrMakeSVG === 'function' && typeof window.qrBuildAssetURL === 'function') {
      const url = window.qrBuildAssetURL(kind, id);
      return window.qrMakeSVG(url, 'M', 2, '#111', '#fff', sz);
    }
    // Fallback: decorative
    return `<svg viewBox="0 0 80 80" width="${sz}" height="${sz}">${qrStub(id)}</svg>`;
  }

  function qrURL(kind, id) {
    if (typeof window.qrBuildAssetURL === 'function') return window.qrBuildAssetURL(kind, id);
    return `${location.origin}${location.pathname}#lims/${kind}/${id}`;
  }

  // Print a single sticker (70mm × 50mm) via a popup window
  window.limsQrPrint = function(kind, id, label, sublabel) {
    const url = qrURL(kind, id);
    const qrSVG = (typeof window.qrMakeSVG === 'function')
      ? window.qrMakeSVG(url, 'M', 2, '#111', '#fff', 280)
      : `<svg viewBox="0 0 80 80" width="280" height="280">${qrStub(id)}</svg>`;
    const w = window.open('', '_blank', 'width=420,height=340');
    if (!w) { toast('Pop-up blocked — please allow pop-ups to print', 'warn'); return; }
    const safeLabel = String(label||'').replace(/[<>]/g,'');
    const safeSub = String(sublabel||'').replace(/[<>]/g,'');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>QR Sticker</title>
<style>
  @page { size: 70mm 50mm; margin: 0; }
  body { margin:0; font-family: Arial, sans-serif; }
  .sticker { width:70mm; height:50mm; padding:3mm; box-sizing:border-box; display:grid; grid-template-columns: 38mm 1fr; gap:3mm; align-items:center; }
  .sticker .qr { width:38mm; height:38mm; }
  .sticker .qr svg { width:100%; height:100%; display:block; }
  .sticker .meta { font-size:9pt; }
  .sticker .meta .lbl { font-weight:700; font-size:11pt; margin-bottom:2mm; word-break:break-all; }
  .sticker .meta .sub { color:#333; font-size:8pt; line-height:1.2; max-height:16mm; overflow:hidden; }
  .sticker .meta .url { color:#666; font-size:6pt; margin-top:2mm; word-break:break-all; }
</style></head><body>
<div class="sticker">
  <div class="qr">${qrSVG}</div>
  <div class="meta">
    <div class="lbl">${safeLabel}</div>
    <div class="sub">${safeSub}</div>
    <div class="url">${url}</div>
  </div>
</div>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 200); };<\/script>
</body></html>`);
    w.document.close();
  };

  // Open the QR Builder app pre-filled with this asset
  window.limsQrBuilder = function(kind, id) {
    if (typeof openWindow === 'function') openWindow('qr');
    setTimeout(() => { if (typeof window.qrOpen === 'function') window.qrOpen('lims-' + kind, id); }, 150);
  };

  // Simple decorative "QR" grid (fallback only)
  function qrStub(seed) {
    let h = 0; for (let i=0;i<seed.length;i++) h = (h*31 + seed.charCodeAt(i)) >>> 0;
    const rand = () => { h = (h*1103515245 + 12345) >>> 0; return h; };
    let out = '';
    for (let y=0;y<10;y++) for (let x=0;x<10;x++) {
      if (rand()%2===0) out += `<rect x="${x*8}" y="${y*8}" width="8" height="8" fill="#111"/>`;
    }
    // Finder squares
    out += '<rect x="0" y="0" width="24" height="24" fill="#111"/><rect x="4" y="4" width="16" height="16" fill="#fff"/><rect x="8" y="8" width="8" height="8" fill="#111"/>';
    out += '<rect x="56" y="0" width="24" height="24" fill="#111"/><rect x="60" y="4" width="16" height="16" fill="#fff"/><rect x="64" y="8" width="8" height="8" fill="#111"/>';
    out += '<rect x="0" y="56" width="24" height="24" fill="#111"/><rect x="4" y="60" width="16" height="16" fill="#fff"/><rect x="8" y="64" width="8" height="8" fill="#111"/>';
    return out;
  }

  window.limsSampleAddCustody = async function(id) {
    const ev = prompt('Custody event (e.g., "Aliquoted", "Sub-sampled", "Transferred to Micro"):');
    if (!ev) return;
    const s = await DB.get('samples', id);
    s.custody = s.custody || [];
    s.custody.push({ ts: nowISO(), event: ev, by: S.currentUser.id });
    await DB.put('samples', s);
    await DB.audit('CUSTODY_ADD', 'sample', id, null, { event: ev });
    toast('Custody event added');
    render();
  };

  window.limsSampleAdvance = async function(id) {
    const s = await DB.get('samples', id);
    const flow = ['received','in-progress','under-review','authorised','released'];
    const i = flow.indexOf(s.status);
    if (i < 0 || i >= flow.length-1) { toast('Already at end of flow', 'warn'); return; }
    const before = { status: s.status };
    s.status = flow[i+1];
    const label = { 'in-progress':'Testing started', 'under-review':'Results submitted for review', 'authorised':'Authorised', 'released':'COA Released' }[s.status] || s.status;
    s.custody = s.custody || []; s.custody.push({ ts: nowISO(), event: label, by: S.currentUser.id });
    await DB.put('samples', s);
    await DB.audit('STATUS_CHANGE','sample',id,before,{status:s.status});
    toast('Advanced → ' + s.status);
    render();
  };

  window.limsSampleOpenResults = function(id) {
    limsGo('results', { sampleId: id });
  };

  async function renderSampleForm(root) {
    const clients = await DB.all('clients');
    const profiles = await DB.all('profiles');
    const tests = await DB.all('tests');
    const users = (await DB.all('users')).filter(u => u.role === 'sampler' || u.role === 'analyst');
    const defaultBarcode = 'HAD-' + new Date().toISOString().slice(2,10).replace(/-/g,'') + '-' + Math.floor(Math.random()*9000+1000);

    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Samples',view:'samples'},{label:'New',view:'sample-new'}])}
      <div class="lims-toolbar"><h2 class="lims-title">Login new sample</h2></div>
      <form class="lims-form" id="limsSampleForm" onsubmit="event.preventDefault();limsSampleSave();">
        <div class="lims-fieldgrid">
          <div class="lims-field"><label>Barcode</label><input id="f_barcode" value="${defaultBarcode}" required></div>
          <div class="lims-field"><label>Client</label><select id="f_client">${clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
          <div class="lims-field lims-field-wide"><label>Description</label><input id="f_desc" placeholder="e.g. Reservoir outlet — Sample point 3" required></div>
          <div class="lims-field"><label>Matrix</label><select id="f_matrix"><option>Drinking Water</option><option>Groundwater</option><option>Surface Water</option><option>Waste Water</option><option>Process Water</option><option>Soil</option><option>Other</option></select></div>
          <div class="lims-field"><label>Priority</label><select id="f_pri"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
          <div class="lims-field"><label>Sampled at</label><input type="datetime-local" id="f_samp" value="${new Date(Date.now()-86400000).toISOString().slice(0,16)}"></div>
          <div class="lims-field"><label>Sampled by</label><select id="f_sby">${users.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select></div>
          <div class="lims-field"><label>Received at</label><input type="datetime-local" id="f_rec" value="${new Date().toISOString().slice(0,16)}"></div>
          <div class="lims-field"><label>Temperature on receipt (°C)</label><input type="number" step="0.1" id="f_temp" value="6.0"></div>
          <div class="lims-field"><label>Storage</label><input id="f_store" value="+4°C Fridge B"></div>
          <div class="lims-field"><label>Profile</label><select id="f_prof" onchange="limsProfileChanged()"><option value="">— pick tests manually —</option>${profiles.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
          <div class="lims-field lims-field-wide"><label>Notes</label><textarea id="f_notes" rows="2"></textarea></div>
        </div>

        <div class="lims-section-title">Tests</div>
        <div class="lims-checkgrid" id="f_tests">
          ${tests.map(t => `
            <label class="lims-check"><input type="checkbox" value="${t.id}"> <strong>${esc(t.code)}</strong> ${esc(t.name)} <span style="color:#888;">${esc(t.unit||'')}</span></label>
          `).join('')}
        </div>

        <div style="margin-top:20px;display:flex;gap:10px;">
          <button type="submit" class="lims-btn primary">✅ Login sample</button>
          <button type="button" class="lims-btn" onclick="limsBack()">Cancel</button>
        </div>
      </form>
    `;
    window._limsProfiles = profiles;
  }

  window.limsProfileChanged = function() {
    const pid = document.getElementById('f_prof').value;
    const p = (window._limsProfiles||[]).find(x=>x.id===pid);
    document.querySelectorAll('#f_tests input[type=checkbox]').forEach(cb => { cb.checked = false; });
    if (p) p.tests.forEach(tid => { const cb = document.querySelector(`#f_tests input[value="${tid}"]`); if(cb) cb.checked = true; });
  };

  window.limsSampleSave = async function() {
    const f = (id) => document.getElementById(id).value;
    const tests = [...document.querySelectorAll('#f_tests input[type=checkbox]:checked')].map(cb=>cb.value);
    if (!tests.length) { toast('Pick at least one test','warn'); return; }
    const s = {
      id: uid('s'),
      barcode: f('f_barcode'),
      clientId: f('f_client'),
      description: f('f_desc'),
      matrix: f('f_matrix'),
      priority: f('f_pri'),
      sampledAt: new Date(f('f_samp')).toISOString(),
      sampledBy: f('f_sby'),
      received: new Date(f('f_rec')).toISOString(),
      temp: parseFloat(f('f_temp'))||null,
      storage: f('f_store'),
      profileId: f('f_prof')||null,
      tests,
      notes: f('f_notes'),
      status: 'received',
      custody: [
        { ts: new Date(f('f_samp')).toISOString(), event: 'Collected', by: f('f_sby') },
        { ts: new Date(f('f_rec')).toISOString(), event: 'Received at lab', by: S.currentUser.id },
        { ts: nowISO(), event: 'Booked in', by: S.currentUser.id }
      ]
    };
    await DB.put('samples', s);
    await DB.audit('CREATE','sample',s.id,null,s);
    toast('Sample ' + s.barcode + ' logged in');
    limsGo('sample', { id: s.id });
  };

  window.limsSampleGenerateCOA = async function(id) {
    limsGo('reports', { sampleId: id });
  };

  /* ---------- TESTS ---------- */
  async function renderTests(root) {
    const tests = await DB.all('tests');
    const cats = [...new Set(tests.map(t=>t.category))];
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Tests',view:'tests'}])}
      <div class="lims-toolbar"><h2 class="lims-title">Test Catalogue <span class="lims-count">${tests.length}</span></h2></div>
      ${cats.map(cat => `
        <div class="lims-card">
          <div class="lims-section-title">${esc(cat)}</div>
          <table class="lims-table compact">
            <thead><tr><th>Code</th><th>Name</th><th>Method</th><th>Ver</th><th>Unit</th><th>LOD / LOQ</th><th>SANS 241 limit</th><th>Risk class</th><th>TAT</th><th>Accred.</th></tr></thead>
            <tbody>
              ${tests.filter(t=>t.category===cat).map(t => `
                <tr onclick="limsGo('test',{id:'${t.id}'})">
                  <td><strong>${esc(t.code)}</strong></td>
                  <td>${esc(t.name)}</td>
                  <td>${esc(t.method)}</td>
                  <td>${esc(t.methodVer)}</td>
                  <td>${esc(t.unit)}</td>
                  <td>${esc(t.lod)} / ${esc(t.loq)}</td>
                  <td>${t.specMin!=null?esc(t.specMin+'–'+t.specMax):'—'}</td>
                  <td>${esc(t.sans241||'—')}</td>
                  <td>${t.tat}d</td>
                  <td>${t.accredited?chip('SANAS','ok'):chip('Non-accred','warn')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    `;
  }

  async function renderTestDetail(root) {
    const t = await DB.get('tests', S.params.id);
    if (!t) { root.innerHTML = `<div class="lims-empty">Test not found</div>`; return; }
    const results = (await DB.all('results')).filter(r=>r.testId===t.id);
    const recent = results.slice(-20).reverse();
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Tests',view:'tests'},{label:t.code,view:'test',params:{id:t.id}}])}
      <div class="lims-toolbar">
        <h2 class="lims-title">${esc(t.code)} · ${esc(t.name)}</h2>
        ${t.accredited?chip('SANAS T0492','ok'):chip('Non-accredited','warn')}
      </div>
      <div class="lims-card">
        <div class="lims-fieldgrid">
          <div class="lims-field"><label>Method</label><div>${esc(t.method)}</div></div>
          <div class="lims-field"><label>Method version</label><div>${esc(t.methodVer)}</div></div>
          <div class="lims-field"><label>Category</label><div>${esc(t.category)}</div></div>
          <div class="lims-field"><label>Unit</label><div>${esc(t.unit)}</div></div>
          <div class="lims-field"><label>LOD</label><div>${esc(t.lod)}</div></div>
          <div class="lims-field"><label>LOQ</label><div>${esc(t.loq)}</div></div>
          <div class="lims-field"><label>Working range</label><div>${esc(t.range)}</div></div>
          <div class="lims-field"><label>Spec (SANS 241)</label><div>${t.specMin!=null?esc(t.specMin+' – '+t.specMax+' '+t.unit):'—'}</div></div>
          <div class="lims-field"><label>TAT</label><div>${t.tat} day(s)</div></div>
          <div class="lims-field"><label>SANS 241 risk class</label><div>${esc(t.sans241||'—')}</div></div>
        </div>
      </div>
      <div class="lims-card">
        <div class="lims-section-title">Recent results (${recent.length})</div>
        <table class="lims-table compact">
          <thead><tr><th>When</th><th>Sample</th><th>Value</th><th>Flag</th><th>Status</th></tr></thead>
          <tbody>${recent.map(r=>`<tr><td>${fmtDate(r.entered)}</td><td>${esc(r.sampleId)}</td><td>${esc(r.value)} ${esc(r.unit)}</td><td>${chip(r.flag, r.flag==='fail'?'fail':'ok')}</td><td>${chip(r.status, r.status==='authorised'?'authorised':'review')}</td></tr>`).join('') || '<tr><td colspan="5">No results yet</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  /* ---------- WORKSHEETS ---------- */
  async function renderWorksheets(root) {
    const ws = await DB.all('worksheets');
    const tests = await DB.all('tests');
    const testMap = Object.fromEntries(tests.map(t=>[t.id,t.name]));
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Worksheets',view:'worksheets'}])}
      <div class="lims-toolbar">
        <h2 class="lims-title">Worksheets <span class="lims-count">${ws.length}</span></h2>
        <div style="flex:1"></div>
        <button class="lims-btn primary" onclick="limsWorksheetNew()">+ New worksheet</button>
      </div>
      <table class="lims-table">
        <thead><tr><th>Code</th><th>Test</th><th>Opened</th><th>Closed</th><th>Samples</th><th>QC</th><th>Status</th></tr></thead>
        <tbody>${ws.map(w => {
          const qcpass = w.qc.filter(q=>q.status==='pass').length; const qctot = w.qc.length;
          return `<tr onclick="limsGo('worksheet',{id:'${w.id}'})">
            <td><strong>${esc(w.code)}</strong></td>
            <td>${esc(testMap[w.test]||w.test)}</td>
            <td>${fmtDate(w.opened)}</td>
            <td>${w.closed?fmtDate(w.closed):'—'}</td>
            <td>${w.samples.length}</td>
            <td>${chip(qcpass+'/'+qctot+' pass', qcpass===qctot?'ok':'warn')}</td>
            <td>${chip(w.status, w.status==='closed'?'authorised':'in-progress')}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    `;
  }

  window.limsWorksheetNew = async function() {
    const tests = await DB.all('tests');
    const t = tests[0];
    const w = {
      id: uid('ws'),
      code: 'WS-' + new Date().toISOString().slice(2,10).replace(/-/g,'') + '-' + Math.floor(Math.random()*900+100),
      test: t.id,
      analyst: S.currentUser.id,
      opened: nowISO(), closed: null, samples: [],
      qc: [{type:'blank',expected:'<LOD',actual:null,status:'pending'}],
      status:'open'
    };
    await DB.put('worksheets', w);
    await DB.audit('CREATE','worksheet',w.id,null,w);
    toast('Worksheet ' + w.code + ' created');
    limsGo('worksheet', { id: w.id });
  };

  async function renderWorksheetDetail(root) {
    const w = await DB.get('worksheets', S.params.id);
    if (!w) { root.innerHTML = `<div class="lims-empty">Worksheet not found</div>`; return; }
    const tests = await DB.all('tests');
    const samples = await DB.all('samples');
    const users = await DB.all('users');
    const testMap = Object.fromEntries(tests.map(t=>[t.id,t]));
    const sampleMap = Object.fromEntries(samples.map(s=>[s.id,s]));
    const userMap = Object.fromEntries(users.map(u=>[u.id,u.name]));

    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Worksheets',view:'worksheets'},{label:w.code,view:'worksheet',params:{id:w.id}}])}
      <div class="lims-toolbar">
        <h2 class="lims-title">${esc(w.code)}</h2>
        ${chip(w.status, w.status==='closed'?'authorised':'in-progress')}
        <div style="flex:1"></div>
        ${w.status==='open'?`<button class="lims-btn primary" onclick="limsWorksheetClose('${w.id}')">Close worksheet</button>`:''}
      </div>

      <div class="lims-detail-grid">
        <div class="lims-detail-main">
          <div class="lims-card">
            <div class="lims-section-title">Header</div>
            <div class="lims-fieldgrid">
              <div class="lims-field"><label>Test</label><div>${esc(testMap[w.test]?testMap[w.test].name:w.test)}</div></div>
              <div class="lims-field"><label>Method</label><div>${esc(testMap[w.test]?testMap[w.test].method:'—')}</div></div>
              <div class="lims-field"><label>Analyst</label><div>${esc(userMap[w.analyst]||w.analyst)}</div></div>
              <div class="lims-field"><label>Opened</label><div>${fmtDT(w.opened)}</div></div>
              <div class="lims-field"><label>Closed</label><div>${w.closed?fmtDT(w.closed):'—'}</div></div>
              <div class="lims-field"><label>Samples on plate</label><div>${w.samples.length}</div></div>
            </div>
          </div>

          <div class="lims-card">
            <div class="lims-section-title">Samples</div>
            <table class="lims-table compact">
              <thead><tr><th>Position</th><th>Barcode</th><th>Description</th><th>Client</th></tr></thead>
              <tbody>${w.samples.map((sid,i) => {
                const s = sampleMap[sid]; if(!s) return '';
                return `<tr><td>${i+1}</td><td><strong>${esc(s.barcode)}</strong></td><td>${esc(s.description)}</td><td>${esc(s.clientId)}</td></tr>`;
              }).join('')}</tbody>
            </table>
          </div>
        </div>

        <div class="lims-detail-side">
          <div class="lims-card">
            <div class="lims-section-title">QC inserts</div>
            <table class="lims-table compact">
              <thead><tr><th>Type</th><th>Expected</th><th>Actual</th><th>Status</th></tr></thead>
              <tbody>${w.qc.map(q=>`<tr><td>${esc(q.type)}</td><td>${esc(q.expected||q.rpd||q.recovery||'')}</td><td>${esc(q.actual!=null?q.actual:'')}</td><td>${chip(q.status, q.status==='pass'?'ok':(q.status==='fail'?'fail':'warn'))}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  window.limsWorksheetClose = async function(id) {
    const w = await DB.get('worksheets', id);
    w.status = 'closed'; w.closed = nowISO();
    await DB.put('worksheets', w);
    await DB.audit('CLOSE','worksheet',id,null,{closed:w.closed});
    toast('Worksheet closed');
    render();
  };

  /* ---------- RESULTS ---------- */
  async function renderResults(root) {
    const results = await DB.all('results');
    const samples = await DB.all('samples');
    const tests = await DB.all('tests');
    const users = await DB.all('users');
    const sampleMap = Object.fromEntries(samples.map(s=>[s.id,s]));
    const testMap = Object.fromEntries(tests.map(t=>[t.id,t]));
    const userMap = Object.fromEntries(users.map(u=>[u.id,u.name]));

    let list = results.slice();
    const f = S.params.filter;
    if (f === 'pending-review') list = list.filter(r => r.status === 'pending-review');
    else if (f === 'entered') list = list.filter(r => r.status === 'entered');
    else if (S.params.sampleId) list = list.filter(r => r.sampleId === S.params.sampleId);

    // sample-restricted entry view
    let entryForSample = null;
    if (S.params.sampleId) {
      entryForSample = sampleMap[S.params.sampleId];
    }

    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Results',view:'results'}])}
      <div class="lims-toolbar">
        <h2 class="lims-title">${entryForSample?'Results entry — '+esc(entryForSample.barcode):'Results'} <span class="lims-count">${list.length}</span></h2>
        <div style="flex:1"></div>
        <button class="lims-btn ${!f?'primary':''}" onclick="limsGo('results')">All</button>
        <button class="lims-btn ${f==='entered'?'primary':''}" onclick="limsGo('results',{filter:'entered'})">Entered</button>
        <button class="lims-btn ${f==='pending-review'?'primary':''}" onclick="limsGo('results',{filter:'pending-review'})">Pending review</button>
      </div>

      ${entryForSample ? renderResultsEntryForm(entryForSample, list, testMap) : ''}

      <table class="lims-table">
        <thead><tr><th>Sample</th><th>Test</th><th>Value</th><th>Flag</th><th>Status</th><th>Analyst</th><th>Reviewer</th><th>Authoriser</th><th>Actions</th></tr></thead>
        <tbody>${list.map(r => {
          const sp = sampleMap[r.sampleId]; const t = testMap[r.testId];
          const flagChip = r.flag === 'fail' ? chip('Out-of-spec','fail') : (r.flag === 'ok' ? chip('In spec','ok') : chip(r.flag||'—','neutral'));
          const statCls = r.status==='authorised'?'authorised':(r.status==='pending-review'?'review':'in-progress');
          return `<tr>
            <td><a href="#" onclick="event.preventDefault();limsGo('sample',{id:'${r.sampleId}'})"><strong>${esc(sp?sp.barcode:r.sampleId)}</strong></a></td>
            <td>${esc(t?t.code:r.testId)}</td>
            <td>${esc(r.value)} ${esc(r.unit)}</td>
            <td>${flagChip}</td>
            <td>${chip(r.status, statCls)}</td>
            <td>${esc(userMap[r.analyst]||'')}</td>
            <td>${esc(userMap[r.reviewer]||'—')}</td>
            <td>${esc(userMap[r.authoriser]||'—')}</td>
            <td>
              ${r.status==='entered'?`<button class="lims-btn" onclick="limsResultSubmit('${r.id}')">Submit</button>`:''}
              ${r.status==='pending-review'?`<button class="lims-btn" onclick="limsResultReview('${r.id}',true)">✓ Review</button>`:''}
              ${r.status==='reviewed'?`<button class="lims-btn primary" onclick="limsResultAuthorise('${r.id}')">🔒 Authorise</button>`:''}
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    `;
  }

  function renderResultsEntryForm(sample, existingResults, testMap) {
    const existMap = Object.fromEntries(existingResults.map(r=>[r.testId, r]));
    return `
      <div class="lims-card">
        <div class="lims-section-title">Enter / update results</div>
        <table class="lims-table compact">
          <thead><tr><th>Test</th><th>Value</th><th>Unit</th><th>Spec</th><th>Instrument</th><th>Action</th></tr></thead>
          <tbody>${sample.tests.map(tid => {
            const t = testMap[tid]; if(!t) return '';
            const r = existMap[tid];
            return `<tr data-tid="${tid}">
              <td><strong>${esc(t.code)}</strong> ${esc(t.name)}</td>
              <td><input class="res-val" type="number" step="any" value="${r?esc(r.value):''}" ${r&&r.status==='authorised'?'disabled':''}></td>
              <td>${esc(t.unit)}</td>
              <td>${t.specMin!=null?esc(t.specMin+' – '+t.specMax):'—'}</td>
              <td><input class="res-inst" value="${r?esc(r.instrumentId||''):''}" placeholder="instrument id" style="width:120px;"></td>
              <td><button class="lims-btn primary" onclick="limsResultSave('${sample.id}','${tid}', this)" ${r&&r.status==='authorised'?'disabled':''}>${r?'Update':'Save'}</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    `;
  }

  window.limsResultSave = async function(sampleId, testId, btn) {
    const row = btn.closest('tr');
    const val = parseFloat(row.querySelector('.res-val').value);
    if (isNaN(val)) { toast('Enter a numeric value','warn'); return; }
    const inst = row.querySelector('.res-inst').value || null;
    const test = await DB.get('tests', testId);
    const all = await DB.all('results');
    let r = all.find(x => x.sampleId===sampleId && x.testId===testId);
    const flag = (test.specMin!=null && test.specMax!=null) ? (val < test.specMin || val > test.specMax ? 'fail' : 'ok') : 'ok';
    if (!r) {
      r = { id: uid('r'), sampleId, testId, value: val, unit: test.unit, analyst: S.currentUser.id, reviewer:null, authoriser:null, entered: nowISO(), reviewed:null, authorised:null, status:'entered', instrumentId: inst, methodVer: test.methodVer, flag };
    } else {
      r.value = val; r.unit = test.unit; r.instrumentId = inst; r.flag = flag; r.entered = nowISO(); r.analyst = S.currentUser.id;
      if (r.status === 'authorised') { toast('Locked','warn'); return; }
    }
    await DB.put('results', r);
    await DB.audit('SAVE','result',r.id,null,{sampleId,testId,value:val,flag});
    // If sample is 'received', advance to in-progress
    const s = await DB.get('samples', sampleId);
    if (s.status === 'received') { s.status = 'in-progress'; s.custody.push({ts:nowISO(),event:'Testing started',by:S.currentUser.id}); await DB.put('samples',s); }
    toast('Result saved · ' + (flag==='fail'?'⚠ Out-of-spec':'✓ In spec'), flag==='fail'?'warn':'info');
    render();
  };

  window.limsResultSubmit = async function(id) {
    const r = await DB.get('results', id); r.status = 'pending-review'; await DB.put('results', r);
    await DB.audit('SUBMIT','result',id,null,{status:'pending-review'});
    toast('Submitted for review'); render();
  };
  window.limsResultReview = async function(id, approve) {
    const r = await DB.get('results', id);
    if (!S.currentUser || (S.currentUser.role !== 'reviewer' && S.currentUser.role !== 'authoriser' && S.currentUser.role !== 'admin')) { toast('Reviewer role required','warn'); return; }
    if (r.analyst === S.currentUser.id) { toast('Reviewer must differ from analyst','warn'); return; }
    r.status = 'reviewed'; r.reviewer = S.currentUser.id; r.reviewed = nowISO();
    await DB.put('results', r);
    await DB.audit('REVIEW','result',id,null,{reviewer:S.currentUser.id});
    toast('Reviewed'); render();
  };
  window.limsResultAuthorise = async function(id) {
    const r = await DB.get('results', id);
    if (!S.currentUser || (S.currentUser.role !== 'authoriser' && S.currentUser.role !== 'admin')) { toast('Authoriser role required','warn'); return; }
    r.status = 'authorised'; r.authoriser = S.currentUser.id; r.authorised = nowISO();
    await DB.put('results', r);
    await DB.audit('AUTHORISE','result',id,null,{authoriser:S.currentUser.id});
    // If all results for sample are authorised, bump sample to authorised
    const s = await DB.get('samples', r.sampleId);
    const all = (await DB.all('results')).filter(x=>x.sampleId===s.id);
    const allAuth = s.tests.every(tid => all.find(x=>x.testId===tid && x.status==='authorised'));
    if (allAuth && s.status !== 'authorised' && s.status !== 'released') {
      s.status = 'authorised';
      s.custody.push({ts:nowISO(),event:'Authorised',by:S.currentUser.id});
      await DB.put('samples', s);
    }
    toast('Authorised 🔒'); render();
  };

  /* ---------- INSTRUMENTS ---------- */
  async function renderInstruments(root) {
    const list = await DB.all('instruments');
    const now = new Date();
    const sorted = list.slice().sort((a,b)=>new Date(a.nextCal)-new Date(b.nextCal));
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Instruments',view:'instruments'}])}
      <div class="lims-toolbar"><h2 class="lims-title">Instruments <span class="lims-count">${list.length}</span></h2></div>
      <table class="lims-table">
        <thead><tr><th>Instrument</th><th>Model</th><th>Serial</th><th>Location</th><th>Cal interval</th><th>Last cal</th><th>Next cal</th><th>Status</th></tr></thead>
        <tbody>${sorted.map(i => {
          const d = daysBetween(now, i.nextCal);
          const calChip = d < 0 ? chip(Math.abs(d)+'d overdue','fail') : (d <= 14 ? chip(d+'d left','warn') : chip(d+'d left','ok'));
          return `<tr onclick="limsGo('instrument',{id:'${i.id}'})">
            <td><strong>${esc(i.name)}</strong></td>
            <td>${esc(i.model)}</td>
            <td>${esc(i.serial)}</td>
            <td>${esc(i.location)}</td>
            <td>${i.calIntDays}d</td>
            <td>${fmtDate(i.lastCal)}</td>
            <td>${fmtDate(i.nextCal)} ${calChip}</td>
            <td>${chip(i.status, i.status==='active'?'ok':'warn')}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    `;
  }

  async function renderInstrumentDetail(root) {
    const i = await DB.get('instruments', S.params.id);
    if (!i) { root.innerHTML = `<div class="lims-empty">Instrument not found</div>`; return; }
    const tests = await DB.all('tests');
    const cals = (await DB.all('calibrations')).filter(c=>c.instrumentId===i.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const users = await DB.all('users');
    const userMap = Object.fromEntries(users.map(u=>[u.id,u.name]));
    const testMap = Object.fromEntries(tests.map(t=>[t.id,t.name]));
    const d = daysBetween(new Date(), i.nextCal);
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Instruments',view:'instruments'},{label:i.name,view:'instrument',params:{id:i.id}}])}
      <div class="lims-toolbar">
        <h2 class="lims-title">${esc(i.name)}</h2>
        ${chip(i.status, i.status==='active'?'ok':'warn')}
        <div style="flex:1"></div>
        <button class="lims-btn primary" onclick="limsInstCalibrate('${i.id}')">🧰 Log calibration</button>
      </div>
      <div class="lims-detail-grid">
        <div class="lims-detail-main">
          <div class="lims-card">
            <div class="lims-section-title">Details</div>
            <div class="lims-fieldgrid">
              <div class="lims-field"><label>Model</label><div>${esc(i.model)}</div></div>
              <div class="lims-field"><label>Serial</label><div>${esc(i.serial)}</div></div>
              <div class="lims-field"><label>Location</label><div>${esc(i.location)}</div></div>
              <div class="lims-field"><label>Calibration interval</label><div>${i.calIntDays} days</div></div>
              <div class="lims-field"><label>Last calibration</label><div>${fmtDate(i.lastCal)}</div></div>
              <div class="lims-field"><label>Next due</label><div>${fmtDate(i.nextCal)} · <strong style="color:${d<0?'#e53935':(d<14?'#c59d2b':'#2a9d3f')};">${d<0?Math.abs(d)+'d overdue':d+'d left'}</strong></div></div>
              <div class="lims-field lims-field-wide"><label>Tests performed on this instrument</label><div>${i.tests.length?i.tests.map(t=>chip(testMap[t]||t,'neutral')).join(' '):'—'}</div></div>
            </div>
          </div>
          <div class="lims-card">
            <div class="lims-section-title">Calibration history</div>
            <table class="lims-table compact">
              <thead><tr><th>Date</th><th>Type</th><th>Performed by</th><th>Result</th><th>Notes</th></tr></thead>
              <tbody>${cals.map(c=>`<tr><td>${fmtDate(c.date)}</td><td>${esc(c.type)}</td><td>${esc(userMap[c.performedBy]||'—')}</td><td>${chip(c.result,c.result==='pass'?'ok':'fail')}</td><td>${esc(c.notes||'')}</td></tr>`).join('') || '<tr><td colspan="5">No records yet</td></tr>'}</tbody>
            </table>
          </div>
        </div>
        <div class="lims-detail-side">
          <div class="lims-card">
            <div class="lims-section-title">QR / Asset tag</div>
            <div class="lims-sticker">
              <div class="sticker-barcode">${esc(i.serial)}</div>
              <div class="sticker-qr-real">${realQR(i.id, 'instrument', 140)}</div>
              <div class="sticker-client">${esc(i.name)}</div>
              <div class="sticker-desc">${esc(i.model)} · ${esc(i.location)}</div>
              <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:4px;">
                <button class="lims-btn" onclick="limsQrPrint('instrument','${i.id}','${esc(i.name).replace(/'/g,'')}','${esc(i.model).replace(/'/g,'')} · SN ${esc(i.serial).replace(/'/g,'')}')">🖨 Sticker</button>
                <button class="lims-btn ghost" onclick="limsQrBuilder('instrument','${i.id}')">⬛ QR Builder</button>
              </div>
              <div style="font-size:10px;color:#6b7684;margin-top:6px;word-break:break-all;">${qrURL('instrument', i.id)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.limsInstCalibrate = async function(id) {
    const notes = prompt('Calibration notes / standards used:');
    if (notes === null) return;
    const i = await DB.get('instruments', id);
    const cal = { id: uid('cal'), instrumentId: id, date: nowISO().slice(0,10), type:'Routine', performedBy: S.currentUser.id, result:'pass', notes, next: null };
    const nd = new Date(); nd.setDate(nd.getDate()+i.calIntDays);
    cal.next = nd.toISOString().slice(0,10);
    i.lastCal = cal.date; i.nextCal = cal.next;
    await DB.put('calibrations', cal);
    await DB.put('instruments', i);
    await DB.audit('CALIBRATE','instrument',id,null,cal);
    toast('Calibration logged — next due ' + cal.next);
    render();
  };

  /* ---------- INVENTORY ---------- */
  async function renderInventory(root) {
    const list = await DB.all('inventory');
    const now = new Date();
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Inventory',view:'inventory'}])}
      <div class="lims-toolbar"><h2 class="lims-title">Inventory <span class="lims-count">${list.length}</span></h2></div>
      <table class="lims-table">
        <thead><tr><th>Item</th><th>Lot</th><th>Supplier</th><th>Received</th><th>Expiry</th><th>Qty</th><th>Storage</th><th>Status</th><th>QR</th></tr></thead>
        <tbody>${list.map(it => {
          const exp = daysBetween(now, it.expiry);
          const statusC = exp < 0 ? chip('Expired','fail') : (exp <= 30 ? chip('Expires '+exp+'d','warn') : chip('OK','ok'));
          const lowC = it.qty < it.min ? chip('Low stock','warn') : '';
          const safeName = esc(it.name).replace(/'/g,'');
          const safeLot = esc(it.lot).replace(/'/g,'');
          return `<tr>
            <td><strong>${esc(it.name)}</strong></td>
            <td>${esc(it.lot)}</td>
            <td>${esc(it.supplier)}</td>
            <td>${fmtDate(it.received)}</td>
            <td>${fmtDate(it.expiry)}</td>
            <td>${esc(it.qty)} ${esc(it.unit)} ${lowC}</td>
            <td>${esc(it.storage)}</td>
            <td>${statusC}</td>
            <td style="white-space:nowrap;">
              <button class="lims-btn" title="Print sticker" onclick="limsQrPrint('inventory','${it.id}','${safeName}','Lot ${safeLot} · Exp ${fmtDate(it.expiry)}')">🖨</button>
              <button class="lims-btn ghost" title="QR Builder" onclick="limsQrBuilder('inventory','${it.id}')">⬛</button>
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    `;
  }

  /* ---------- QC ---------- */
  async function renderQC(root) {
    const results = await DB.all('results');
    const tests = await DB.all('tests');
    const ncs = await DB.all('ncs');
    const byTest = {};
    for (const r of results) { (byTest[r.testId] = byTest[r.testId]||[]).push(r); }
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Quality Control',view:'qc'}])}
      <div class="lims-toolbar"><h2 class="lims-title">Quality Control</h2></div>

      <div class="lims-card">
        <div class="lims-section-title">Control trends (click a test for Shewhart chart)</div>
        <div class="lims-tests-grid">
          ${tests.filter(t=>byTest[t.id]&&byTest[t.id].length>1).map(t=>{
            const vals = byTest[t.id].map(r=>Number(r.value)).filter(x=>!isNaN(x));
            const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
            const sd = Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length);
            return `<div class="lims-testcard" onclick="limsGo('qc-chart',{testId:'${t.id}'})">
              <div style="font-weight:700;">${esc(t.code)} · ${esc(t.name)}</div>
              <div style="color:#6b7684;font-size:12px;margin:4px 0;">n=${vals.length} · x̄=${mean.toFixed(2)} · s=${sd.toFixed(3)}</div>
              <div class="lims-sparkline">${sparkline(vals, t.specMin, t.specMax)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="lims-card">
        <div class="lims-section-title">Non-conformances & CAPAs</div>
        <table class="lims-table compact">
          <thead><tr><th>Raised</th><th>Type</th><th>Reference</th><th>Severity</th><th>Corrective action</th><th>Status</th></tr></thead>
          <tbody>${ncs.map(n=>`<tr>
            <td>${fmtDate(n.raised)}</td>
            <td>${esc(n.type)}</td>
            <td>${esc(n.ref)}</td>
            <td>${chip(n.severity, n.severity==='major'?'fail':(n.severity==='moderate'?'warn':'neutral'))}</td>
            <td>${esc(n.correctiveAction||'—')}</td>
            <td>${chip(n.status, n.status==='closed'?'ok':'warn')}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    `;
  }

  function sparkline(vals, specMin, specMax) {
    if (!vals.length) return '';
    const W=200, H=40;
    const min = Math.min(...vals, specMin!=null?specMin:Infinity);
    const max = Math.max(...vals, specMax!=null?specMax:-Infinity);
    const span = (max-min)||1;
    const pts = vals.map((v,i)=>`${(i/(vals.length-1||1))*W},${H-((v-min)/span)*H}`).join(' ');
    const specLines = [];
    if (specMin!=null) specLines.push(`<line x1="0" y1="${H-((specMin-min)/span)*H}" x2="${W}" y2="${H-((specMin-min)/span)*H}" stroke="#e53935" stroke-dasharray="3,3" stroke-width="1"/>`);
    if (specMax!=null) specLines.push(`<line x1="0" y1="${H-((specMax-min)/span)*H}" x2="${W}" y2="${H-((specMax-min)/span)*H}" stroke="#e53935" stroke-dasharray="3,3" stroke-width="1"/>`);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${specLines.join('')}<polyline points="${pts}" fill="none" stroke="#00b1ca" stroke-width="2"/></svg>`;
  }

  async function renderQCChart(root) {
    const t = await DB.get('tests', S.params.testId);
    const results = (await DB.all('results')).filter(r=>r.testId===t.id).sort((a,b)=>new Date(a.entered)-new Date(b.entered));
    const vals = results.map(r=>Number(r.value)).filter(x=>!isNaN(x));
    const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
    const sd = Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length);
    const W=720, H=320, pad=40;
    const xScale = (i) => pad + (i/(vals.length-1||1))*(W-2*pad);
    const min = Math.min(...vals, mean-3*sd);
    const max = Math.max(...vals, mean+3*sd);
    const span = (max-min)||1;
    const y = (v) => pad + (1-(v-min)/span)*(H-2*pad);
    const pts = vals.map((v,i)=>`${xScale(i)},${y(v)}`).join(' ');
    const zones = [
      {v:mean+3*sd, c:'#e53935', l:'+3σ (UCL)'},
      {v:mean+2*sd, c:'#c59d2b', l:'+2σ'},
      {v:mean+sd,   c:'#999',    l:'+1σ'},
      {v:mean,      c:'#00b1ca', l:'Mean'},
      {v:mean-sd,   c:'#999',    l:'−1σ'},
      {v:mean-2*sd, c:'#c59d2b', l:'−2σ'},
      {v:mean-3*sd, c:'#e53935', l:'−3σ (LCL)'}
    ];
    const violations = [];
    vals.forEach((v,i) => {
      if (Math.abs(v-mean) > 3*sd) violations.push({i, v, rule:'1-3s (single beyond 3σ)'});
      if (i>=1 && vals[i-1] && (v-mean)*(vals[i-1]-mean)>0 && Math.abs(v-mean) > 2*sd && Math.abs(vals[i-1]-mean) > 2*sd) violations.push({i, v, rule:'2-2s (two consecutive beyond 2σ, same side)'});
    });
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Quality Control',view:'qc'},{label:t.code,view:'qc-chart',params:{testId:t.id}}])}
      <div class="lims-toolbar"><h2 class="lims-title">Shewhart / Westgard — ${esc(t.code)} · ${esc(t.name)}</h2></div>
      <div class="lims-card">
        <div class="lims-chart-wrap">
          <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
            <rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
            ${zones.map(z=>`<line x1="${pad}" x2="${W-pad}" y1="${y(z.v)}" y2="${y(z.v)}" stroke="${z.c}" stroke-dasharray="${z.c==='#00b1ca'?'0':'4,4'}" stroke-width="${z.c==='#00b1ca'?2:1}"/>
              <text x="${W-pad+4}" y="${y(z.v)+4}" font-size="10" fill="${z.c}">${z.l}</text>`).join('')}
            <polyline points="${pts}" fill="none" stroke="#2e3742" stroke-width="1.5"/>
            ${vals.map((v,i)=>`<circle cx="${xScale(i)}" cy="${y(v)}" r="3.5" fill="${Math.abs(v-mean)>2*sd?'#e53935':'#00b1ca'}" stroke="#fff" stroke-width="1"/>`).join('')}
          </svg>
        </div>
        <div class="lims-fieldgrid">
          <div class="lims-field"><label>n</label><div>${vals.length}</div></div>
          <div class="lims-field"><label>Mean (x̄)</label><div>${mean.toFixed(3)} ${esc(t.unit)}</div></div>
          <div class="lims-field"><label>Std dev (s)</label><div>${sd.toFixed(4)}</div></div>
          <div class="lims-field"><label>CV</label><div>${((sd/mean)*100).toFixed(2)}%</div></div>
          <div class="lims-field"><label>Spec min</label><div>${t.specMin!=null?esc(t.specMin):'—'}</div></div>
          <div class="lims-field"><label>Spec max</label><div>${t.specMax!=null?esc(t.specMax):'—'}</div></div>
        </div>
        <div class="lims-section-title" style="margin-top:14px;">Westgard rule violations</div>
        ${violations.length?`<ul>${violations.map(v=>`<li>Point #${v.i+1} (${v.v.toFixed(3)}): <strong>${esc(v.rule)}</strong></li>`).join('')}</ul>`:'<div style="color:#2a9d3f;">✅ No Westgard violations detected</div>'}
      </div>
    `;
  }

  /* ---------- PERSONNEL ---------- */
  async function renderPersonnel(root) {
    const users = await DB.all('users');
    const cms = await DB.all('competencies');
    const tests = await DB.all('tests');
    const testMap = Object.fromEntries(tests.map(t=>[t.id,t]));
    const cmByUser = {};
    cms.forEach(cm => { (cmByUser[cm.userId]=cmByUser[cm.userId]||[]).push(cm); });
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Personnel',view:'personnel'}])}
      <div class="lims-toolbar">
        <h2 class="lims-title">Personnel & Competency <span class="lims-count">${users.length}</span></h2>
        <button class="lims-btn primary" onclick="limsGo('person-form',{})">➕ Add operator</button>
      </div>
      <table class="lims-table">
        <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Authorised tests</th><th>In training</th><th>Status</th><th></th></tr></thead>
        <tbody>${users.length ? users.map(u => {
          const mine = cmByUser[u.id] || [];
          const auth = mine.filter(c=>c.status==='authorised');
          const train = mine.filter(c=>c.status==='training');
          return `<tr>
            <td onclick="limsGo('person',{id:'${u.id}'})"><strong>${esc(u.name)}</strong></td>
            <td onclick="limsGo('person',{id:'${u.id}'})">${chip(u.role,'neutral')}</td>
            <td onclick="limsGo('person',{id:'${u.id}'})">${esc(u.email)}</td>
            <td onclick="limsGo('person',{id:'${u.id}'})">${auth.length?auth.map(c=>chip(testMap[c.testId]?testMap[c.testId].code:'?','ok')).join(' '):'—'}</td>
            <td onclick="limsGo('person',{id:'${u.id}'})">${train.length?train.map(c=>chip(testMap[c.testId]?testMap[c.testId].code:'?','warn')).join(' '):'—'}</td>
            <td onclick="limsGo('person',{id:'${u.id}'})">${chip(u.active?'active':'inactive', u.active?'ok':'neutral')}</td>
            <td style="white-space:nowrap;">
              <button class="lims-btn ghost" onclick="event.stopPropagation();limsGo('person-form',{id:'${u.id}'})">✏️</button>
              <button class="lims-btn ghost" onclick="event.stopPropagation();limsDeleteUser('${u.id}')">🗑️</button>
            </td>
          </tr>`;
        }).join('') : '<tr><td colspan="7" class="lims-empty">No operators yet — click ➕ Add operator to create one</td></tr>'}</tbody>
      </table>
    `;
  }

  /* ---------- PERSON FORM (add / edit) ---------- */
  async function renderPersonForm(root) {
    const id = S.params.id || null;
    const u = id ? (await DB.get('users', id)) : { id:'', name:'', role:'analyst', email:'', signature:'', active:true };
    const isNew = !id;
    const roles = [
      { v:'admin',      label:'Admin (full access)' },
      { v:'authoriser', label:'Authoriser (signs off reports)' },
      { v:'reviewer',   label:'Reviewer (reviews results)' },
      { v:'analyst',    label:'Analyst (enters results)' },
      { v:'sampler',    label:'Sampler (collects samples)' },
      { v:'viewer',     label:'Viewer (read-only)' }
    ];
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Personnel',view:'personnel'},{label:isNew?'Add operator':'Edit '+u.name,view:'person-form'}])}
      <div class="lims-toolbar"><h2 class="lims-title">${isNew?'Add new operator':'Edit '+esc(u.name)}</h2></div>
      <div class="lims-card">
        <div class="lims-section-title">Operator details</div>
        <div class="lims-fieldgrid">
          <div class="lims-field lims-field-wide"><label>Full name *</label><input id="pf_name" class="lims-search" value="${esc(u.name)}" placeholder="e.g. Dr. J. Smith"></div>
          <div class="lims-field"><label>Role *</label>
            <select id="pf_role" class="lims-search">
              ${roles.map(r=>`<option value="${r.v}" ${u.role===r.v?'selected':''}>${r.label}</option>`).join('')}
            </select>
          </div>
          <div class="lims-field"><label>Signature initials</label><input id="pf_sig" class="lims-search" value="${esc(u.signature)}" placeholder="e.g. JS" maxlength="6"></div>
          <div class="lims-field"><label>Email *</label><input id="pf_email" type="email" class="lims-search" value="${esc(u.email)}" placeholder="user@company.com"></div>
          <div class="lims-field"><label>Status</label>
            <select id="pf_active" class="lims-search">
              <option value="1" ${u.active?'selected':''}>Active</option>
              <option value="0" ${!u.active?'selected':''}>Inactive</option>
            </select>
          </div>
        </div>
        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="lims-btn primary" onclick="limsSaveUser(${isNew?'null':"'"+id+"'"})">💾 Save operator</button>
          <button class="lims-btn ghost" onclick="limsBack()">Cancel</button>
        </div>
        <p style="font-size:12px;color:#6b7684;margin-top:10px;">Roles control what this operator can do. <strong>Authoriser</strong> can sign off reports, <strong>Reviewer</strong> can approve results, <strong>Analyst</strong> enters data. Separation of duties is enforced for 21 CFR Part 11-style audit trails.</p>
      </div>
    `;
  }

  window.limsSaveUser = async function(existingId) {
    const name = document.getElementById('pf_name').value.trim();
    const email = document.getElementById('pf_email').value.trim();
    if (!name) { toast('Name is required', 'warn'); return; }
    if (!email) { toast('Email is required', 'warn'); return; }
    const role = document.getElementById('pf_role').value;
    let signature = document.getElementById('pf_sig').value.trim().toUpperCase();
    if (!signature) {
      // auto-generate signature from initials
      signature = name.split(/\s+/).map(w=>w[0]||'').join('').toUpperCase().slice(0,4);
    }
    const u = {
      id: existingId || uid('u'),
      name, role, email, signature,
      active: document.getElementById('pf_active').value === '1'
    };
    await DB.put('users', u);
    await DB.audit(existingId?'UPDATE':'CREATE', 'user', u.id, null, u);
    toast(existingId ? 'Operator updated' : 'Operator added', 'ok');
    limsGo('personnel');
  };

  window.limsDeleteUser = async function(id) {
    if (S.currentUser && S.currentUser.id === id) {
      toast('Cannot delete the currently logged-in operator', 'warn');
      return;
    }
    if (!confirm('Delete this operator? Their audit trail entries will be kept.')) return;
    await DB.del('users', id);
    await DB.audit('DELETE', 'user', id, null, null);
    toast('Operator deleted', 'ok');
    render();
  };

  async function renderPersonDetail(root) {
    const u = await DB.get('users', S.params.id);
    const cms = (await DB.all('competencies')).filter(c=>c.userId===u.id);
    const tests = await DB.all('tests');
    const testMap = Object.fromEntries(tests.map(t=>[t.id,t]));
    const userMap = Object.fromEntries((await DB.all('users')).map(x=>[x.id,x.name]));
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Personnel',view:'personnel'},{label:u.name,view:'person',params:{id:u.id}}])}
      <div class="lims-toolbar">
        <h2 class="lims-title">${esc(u.name)}</h2>${chip(u.role,'neutral')}
        <button class="lims-btn primary" onclick="limsGo('person-form',{id:'${u.id}'})">✏️ Edit</button>
      </div>
      <div class="lims-card">
        <div class="lims-section-title">Contact</div>
        <div class="lims-fieldgrid">
          <div class="lims-field"><label>Email</label><div>${esc(u.email)}</div></div>
          <div class="lims-field"><label>Signature initials</label><div>${esc(u.signature)}</div></div>
          <div class="lims-field"><label>Role</label><div>${esc(u.role)}</div></div>
          <div class="lims-field"><label>Status</label><div>${chip(u.active?'active':'inactive', u.active?'ok':'neutral')}</div></div>
        </div>
      </div>
      <div class="lims-card">
        <div class="lims-section-title">Competency matrix</div>
        <table class="lims-table compact">
          <thead><tr><th>Test</th><th>Status</th><th>Assessed</th><th>Next review</th><th>Assessor</th></tr></thead>
          <tbody>${cms.map(c=>`<tr>
            <td><strong>${esc(testMap[c.testId]?testMap[c.testId].code:'—')}</strong> ${esc(testMap[c.testId]?testMap[c.testId].name:'')}</td>
            <td>${chip(c.status, c.status==='authorised'?'ok':(c.status==='training'?'warn':'neutral'))}</td>
            <td>${fmtDate(c.assessed)}</td>
            <td>${fmtDate(c.nextReview)}</td>
            <td>${esc(userMap[c.assessor]||'—')}</td>
          </tr>`).join('') || '<tr><td colspan="5">No competencies assigned</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  /* ---------- DOCUMENTS ---------- */
  async function renderDocuments(root) {
    const docs = await DB.all('documents');
    const users = await DB.all('users');
    const userMap = Object.fromEntries(users.map(u=>[u.id,u.name]));
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Documents',view:'documents'}])}
      <div class="lims-toolbar"><h2 class="lims-title">Controlled Documents <span class="lims-count">${docs.length}</span></h2></div>
      <table class="lims-table">
        <thead><tr><th>Title</th><th>Type</th><th>Version</th><th>Effective</th><th>Review by</th><th>Owner</th><th>Status</th></tr></thead>
        <tbody>${docs.map(d => {
          const rd = daysBetween(new Date(), d.review);
          const revChip = rd < 0 ? chip('Overdue','fail') : (rd < 90 ? chip('Due '+rd+'d','warn') : chip('OK','ok'));
          return `<tr>
            <td><strong>${esc(d.title)}</strong></td>
            <td>${esc(d.type)}</td>
            <td>${esc(d.ver)}</td>
            <td>${fmtDate(d.effective)}</td>
            <td>${fmtDate(d.review)} ${revChip}</td>
            <td>${esc(userMap[d.owner]||'—')}</td>
            <td>${chip(d.status, d.status==='approved'?'ok':'warn')}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    `;
  }

  /* ---------- REPORTS & COA ---------- */
  async function renderReports(root) {
    const samples = await DB.all('samples');
    const authorised = samples.filter(s => s.status === 'authorised' || s.status === 'released');
    const clients = await DB.all('clients');
    const clientMap = Object.fromEntries(clients.map(c=>[c.id,c.name]));
    const preselect = S.params.sampleId;
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Reports & COA',view:'reports'}])}
      <div class="lims-toolbar"><h2 class="lims-title">Certificates of Analysis</h2></div>
      <div class="lims-card">
        <div class="lims-section-title">Generate COA</div>
        <p style="color:#6b7684;font-size:13px;">A certificate can be generated for any sample with fully authorised results. COAs are produced in PDF with digital signature of the authoriser.</p>
        <table class="lims-table compact">
          <thead><tr><th>Barcode</th><th>Client</th><th>Description</th><th>Status</th><th></th></tr></thead>
          <tbody>${samples.map(s=>`<tr style="${preselect===s.id?'background:#fffde7;':''}">
            <td><strong>${esc(s.barcode)}</strong></td>
            <td>${esc(clientMap[s.clientId]||'—')}</td>
            <td>${esc(s.description)}</td>
            <td>${chip(s.status, statusChipClass(s.status))}</td>
            <td>${(s.status==='authorised'||s.status==='released')?`<button class="lims-btn primary" onclick="limsGenerateCOA('${s.id}')">📄 Download PDF</button>`:`<span style="color:#888;font-size:12px;">Not yet authorised</span>`}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    `;
  }

  window.limsGenerateCOA = async function(id) {
    const s = await DB.get('samples', id);
    const client = await DB.get('clients', s.clientId);
    const tests = await DB.all('tests');
    const testMap = Object.fromEntries(tests.map(t=>[t.id,t]));
    const results = (await DB.all('results')).filter(r=>r.sampleId===s.id);
    const users = await DB.all('users');
    const userMap = Object.fromEntries(users.map(u=>[u.id,u]));

    if (!window.jspdf) { toast('PDF library loading…','warn'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({unit:'mm', format:'a4'});
    const W = 210;
    // Header
    doc.setFillColor(0,177,202); doc.rect(0,0,W,22,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(16);
    doc.text('HADRON GROUP · LABORATORY', 10, 10);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text('ISO/IEC 17025:2017 · SANAS Accredited · T0492', 10, 16);
    doc.text('hadrongrp.com · lab@hadrongrp.com · +27 12 345 6789', 10, 20);
    doc.setTextColor(0,0,0);
    // Title
    doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text('CERTIFICATE OF ANALYSIS', 10, 32);
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text('COA No: ' + s.barcode + '-COA', 10, 38);
    doc.text('Issued: ' + new Date().toLocaleDateString(), 140, 38);

    // Client / sample box
    doc.setDrawColor(200); doc.rect(10, 42, W-20, 38);
    doc.setFont('helvetica','bold'); doc.setFontSize(10);
    doc.text('Client', 12, 48); doc.text('Sample', 110, 48);
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.text((client?client.name:'—').slice(0,50), 12, 54);
    doc.text((client?client.contact:'').slice(0,50), 12, 59);
    doc.text((client?client.address:'').slice(0,50), 12, 64);
    doc.text('Barcode: '+s.barcode, 110, 54);
    doc.text(('Description: '+s.description).slice(0,55), 110, 59);
    doc.text('Matrix: '+s.matrix, 110, 64);
    doc.text('Sampled: '+fmtDT(s.sampledAt), 12, 74);
    doc.text('Received: '+fmtDT(s.received), 110, 74);

    // Results table
    let y = 88;
    doc.setFont('helvetica','bold'); doc.setFontSize(10);
    doc.text('Results', 10, y); y += 4;
    doc.setFillColor(240,245,250); doc.rect(10, y, W-20, 6, 'F');
    doc.setFontSize(8);
    doc.text('Test',12, y+4); doc.text('Method',50, y+4); doc.text('Result',100, y+4);
    doc.text('Unit',125, y+4); doc.text('Spec',145, y+4); doc.text('Eval',180, y+4);
    y += 6;
    doc.setFont('helvetica','normal');
    let anyFail = false;
    s.tests.forEach(tid => {
      const t = testMap[tid]; const r = results.find(x=>x.testId===tid);
      if (!t || !r) return;
      if (r.flag === 'fail') anyFail = true;
      doc.text(t.name.slice(0,22), 12, y+4);
      doc.text(t.method.slice(0,22), 50, y+4);
      doc.text(String(r.value), 100, y+4);
      doc.text(t.unit, 125, y+4);
      doc.text(t.specMin!=null?(t.specMin+'–'+t.specMax):'—', 145, y+4);
      if (r.flag === 'fail') { doc.setTextColor(220,38,38); doc.text('FAIL', 180, y+4); doc.setTextColor(0,0,0); }
      else { doc.setTextColor(42,157,63); doc.text('PASS', 180, y+4); doc.setTextColor(0,0,0); }
      y += 5;
      if (y > 250) { doc.addPage(); y = 20; }
    });

    // Conclusion
    y += 6;
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('Conclusion', 10, y); y += 5;
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    if (anyFail) doc.setTextColor(220,38,38);
    const concl = anyFail ? 'One or more parameters exceed SANS 241:2015 specifications. Sample is NOT COMPLIANT with the drinking water standard for those parameters.' : 'All tested parameters are within the SANS 241:2015 drinking water specifications.';
    doc.text(doc.splitTextToSize(concl, W-20), 10, y);
    doc.setTextColor(0,0,0);
    y += 16;

    // Signature
    const auth = users.find(u => results[0] && u.id === results[0].authoriser) || userMap['u-mgr'];
    doc.setFont('helvetica','bold'); doc.text('Authorised by', 10, y);
    doc.setFont('helvetica','normal'); doc.text((auth?auth.name:''), 10, y+5);
    doc.text('Electronically signed: '+new Date().toLocaleString(), 10, y+10);
    doc.text('Signature: '+(auth?auth.signature:''), 10, y+15);

    doc.setFontSize(7); doc.setTextColor(100,100,100);
    doc.text('Results apply only to items tested as received. Report may not be reproduced, except in full, without written approval of the laboratory.', 10, 285);
    doc.text('End of Certificate — Page 1 of 1', 10, 290);

    const fname = 'COA-'+s.barcode+'.pdf';
    doc.save(fname);

    // Mark released
    if (s.status === 'authorised') {
      s.status = 'released';
      s.custody = s.custody || []; s.custody.push({ts:nowISO(),event:'COA Released', by:S.currentUser.id});
      await DB.put('samples', s);
      await DB.audit('RELEASE','sample',s.id,null,{coa:fname});
    }
    toast('COA generated: '+fname);
    render();
  };

  /* ---------- CLIENTS ---------- */
  async function renderClients(root) {
    const clients = await DB.all('clients');
    const samples = await DB.all('samples');
    const quotes = await DB.all('quotes');
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Clients',view:'clients'}])}
      <div class="lims-toolbar">
        <h2 class="lims-title">Clients <span class="lims-count">${clients.length}</span></h2>
        <button class="lims-btn primary" onclick="limsGo('client-form',{})">➕ Add client</button>
      </div>
      <table class="lims-table">
        <thead><tr><th>Client</th><th>Industry</th><th>Contact</th><th>Email</th><th>Samples</th><th>Quotes</th><th></th></tr></thead>
        <tbody>${clients.length ? clients.map(c=>{
          const sc = samples.filter(s=>s.clientId===c.id).length;
          const qc = quotes.filter(q=>q.clientId===c.id).length;
          return `<tr>
            <td onclick="limsGo('client',{id:'${c.id}'})"><strong>${esc(c.name)}</strong></td>
            <td onclick="limsGo('client',{id:'${c.id}'})">${chip(c.industry,'neutral')}</td>
            <td onclick="limsGo('client',{id:'${c.id}'})">${esc(c.contact)}</td>
            <td onclick="limsGo('client',{id:'${c.id}'})">${esc(c.email)}</td>
            <td onclick="limsGo('client',{id:'${c.id}'})">${sc}</td>
            <td onclick="limsGo('client',{id:'${c.id}'})">${qc}</td>
            <td style="white-space:nowrap;">
              <button class="lims-btn ghost" onclick="event.stopPropagation();limsGo('client-form',{id:'${c.id}'})">✏️</button>
              <button class="lims-btn ghost" onclick="event.stopPropagation();limsDeleteClient('${c.id}')">🗑️</button>
            </td>
          </tr>`;
        }).join('') : '<tr><td colspan="7" class="lims-empty">No clients yet — click ➕ Add client to create one</td></tr>'}</tbody>
      </table>
    `;
  }

  /* ---------- CLIENT FORM (add / edit) ---------- */
  async function renderClientForm(root) {
    const id = S.params.id || null;
    const c = id ? (await DB.get('clients', id)) : { id:'', name:'', industry:'Municipal', contact:'', email:'', phone:'', address:'' };
    const isNew = !id;
    const industries = ['Municipal','Petrochemical','Mining','Agriculture','Industrial','Pharmaceutical','Food & Beverage','Hospitality','Healthcare','Other'];
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Clients',view:'clients'},{label:isNew?'Add client':'Edit '+c.name,view:'client-form'}])}
      <div class="lims-toolbar"><h2 class="lims-title">${isNew?'Add new client':'Edit '+esc(c.name)}</h2></div>
      <div class="lims-card">
        <div class="lims-section-title">Client details</div>
        <div class="lims-fieldgrid">
          <div class="lims-field lims-field-wide"><label>Company name *</label><input id="cf_name" class="lims-search" value="${esc(c.name)}" placeholder="e.g. ACME Industries (Pty) Ltd"></div>
          <div class="lims-field"><label>Industry</label>
            <select id="cf_industry" class="lims-search">
              ${industries.map(i=>`<option value="${i}" ${c.industry===i?'selected':''}>${i}</option>`).join('')}
            </select>
          </div>
          <div class="lims-field"><label>Contact person</label><input id="cf_contact" class="lims-search" value="${esc(c.contact)}" placeholder="e.g. Mr. J. Smith"></div>
          <div class="lims-field"><label>Email</label><input id="cf_email" type="email" class="lims-search" value="${esc(c.email)}" placeholder="contact@company.com"></div>
          <div class="lims-field"><label>Phone</label><input id="cf_phone" class="lims-search" value="${esc(c.phone)}" placeholder="012-345-6789"></div>
          <div class="lims-field lims-field-wide"><label>Address</label><input id="cf_address" class="lims-search" value="${esc(c.address)}" placeholder="Street, City, Province"></div>
        </div>
        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="lims-btn primary" onclick="limsSaveClient(${isNew?'null':"'"+id+"'"})">💾 Save client</button>
          <button class="lims-btn ghost" onclick="limsBack()">Cancel</button>
        </div>
      </div>
    `;
  }

  window.limsSaveClient = async function(existingId) {
    const name = document.getElementById('cf_name').value.trim();
    if (!name) { toast('Company name is required', 'warn'); return; }
    const c = {
      id: existingId || uid('c'),
      name,
      industry: document.getElementById('cf_industry').value,
      contact: document.getElementById('cf_contact').value.trim(),
      email: document.getElementById('cf_email').value.trim(),
      phone: document.getElementById('cf_phone').value.trim(),
      address: document.getElementById('cf_address').value.trim(),
      created: existingId ? (await DB.get('clients', existingId)).created : nowISO()
    };
    await DB.put('clients', c);
    await DB.audit(existingId?'UPDATE':'CREATE', 'client', c.id, null, c);
    toast(existingId ? 'Client updated' : 'Client added', 'ok');
    limsGo('clients');
  };

  window.limsDeleteClient = async function(id) {
    if (!confirm('Delete this client? Samples linked to it will keep the reference.')) return;
    await DB.del('clients', id);
    await DB.audit('DELETE', 'client', id, null, null);
    toast('Client deleted', 'ok');
    render();
  };

  async function renderClientDetail(root) {
    const c = await DB.get('clients', S.params.id);
    const samples = (await DB.all('samples')).filter(s=>s.clientId===c.id);
    const quotes = (await DB.all('quotes')).filter(q=>q.clientId===c.id);
    const profiles = await DB.all('profiles');
    const profMap = Object.fromEntries(profiles.map(p=>[p.id,p]));
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Clients',view:'clients'},{label:c.name,view:'client',params:{id:c.id}}])}
      <div class="lims-toolbar">
        <h2 class="lims-title">${esc(c.name)}</h2>
        <button class="lims-btn primary" onclick="limsGo('client-form',{id:'${c.id}'})">✏️ Edit</button>
      </div>
      <div class="lims-card">
        <div class="lims-fieldgrid">
          <div class="lims-field"><label>Industry</label><div>${esc(c.industry)}</div></div>
          <div class="lims-field"><label>Contact</label><div>${esc(c.contact)}</div></div>
          <div class="lims-field"><label>Email</label><div>${esc(c.email)}</div></div>
          <div class="lims-field"><label>Phone</label><div>${esc(c.phone)}</div></div>
          <div class="lims-field lims-field-wide"><label>Address</label><div>${esc(c.address)}</div></div>
        </div>
      </div>
      <div class="lims-card">
        <div class="lims-section-title">Recent samples (${samples.length})</div>
        <table class="lims-table compact">
          <thead><tr><th>Barcode</th><th>Description</th><th>Received</th><th>Status</th></tr></thead>
          <tbody>${samples.slice(-10).reverse().map(s=>`<tr onclick="limsGo('sample',{id:'${s.id}'})"><td><strong>${esc(s.barcode)}</strong></td><td>${esc(s.description)}</td><td>${fmtDate(s.received)}</td><td>${chip(s.status,statusChipClass(s.status))}</td></tr>`).join('') || '<tr><td colspan="4">None yet</td></tr>'}</tbody>
        </table>
      </div>
      <div class="lims-card">
        <div class="lims-section-title">Bookings &amp; Requests (${quotes.length})</div>
        <table class="lims-table compact">
          <thead><tr><th>Date</th><th>Items requested</th><th>Status</th></tr></thead>
          <tbody>${quotes.map(q=>`<tr>
            <td>${fmtDate(q.date)}</td>
            <td>${q.items.map(it=>(it.profileId?(profMap[it.profileId]?profMap[it.profileId].name:it.profileId):it.testId)+' ×'+it.qty).join(', ')}</td>
            <td>${chip(q.status, q.status==='accepted'?'ok':(q.status==='draft'?'neutral':'warn'))}</td>
          </tr>`).join('') || '<tr><td colspan="3">No bookings yet</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  /* ---------- ADMIN ---------- */
  async function renderAdmin(root) {
    const users = await DB.all('users');
    const audit = (await DB.all('audit')).sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,80);
    root.innerHTML = `
      ${breadcrumb([{label:'LIMS',view:'hub'},{label:'Admin',view:'admin'}])}
      <div class="lims-toolbar"><h2 class="lims-title">Administration</h2></div>

      <div class="lims-card">
        <div class="lims-section-title">Current operator</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <select id="limsUserSwitch" class="lims-search" style="max-width:360px;">
            ${users.map(u=>`<option value="${u.id}" ${S.currentUser&&S.currentUser.id===u.id?'selected':''}>${esc(u.name)} (${esc(u.role)})</option>`).join('')}
          </select>
          <button class="lims-btn primary" onclick="limsSwitchUser()">Switch user</button>
        </div>
        <p style="font-size:12px;color:#6b7684;margin-top:8px;">Current: <strong>${esc(S.currentUser?S.currentUser.name:'')}</strong> — role <strong>${esc(S.currentUser?S.currentUser.role:'')}</strong>. Switching affects who signs result reviews and authorisations (21 CFR Part 11-style separation of duties).</p>
      </div>

      <div class="lims-card">
        <div class="lims-section-title" style="display:flex;justify-content:space-between;align-items:center;">
          <span>Users</span>
          <button class="lims-btn primary" onclick="limsGo('person-form',{})">➕ Add user</button>
        </div>
        <table class="lims-table compact">
          <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Signature</th><th>Active</th><th></th></tr></thead>
          <tbody>${users.map(u=>`<tr>
            <td>${esc(u.name)}</td>
            <td>${chip(u.role,'neutral')}</td>
            <td>${esc(u.email)}</td>
            <td>${esc(u.signature)}</td>
            <td>${chip(u.active?'yes':'no', u.active?'ok':'neutral')}</td>
            <td style="white-space:nowrap;">
              <button class="lims-btn ghost" onclick="limsGo('person-form',{id:'${u.id}'})">✏️</button>
              <button class="lims-btn ghost" onclick="limsDeleteUser('${u.id}')">🗑️</button>
            </td>
          </tr>`).join('')}</tbody>
        </table>
      </div>

      <div class="lims-card">
        <div class="lims-section-title">Audit trail (last 80 events)</div>
        <table class="lims-table compact">
          <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Entity ID</th></tr></thead>
          <tbody>${audit.map(a=>`<tr><td>${fmtDT(a.ts)}</td><td>${esc(a.user)}</td><td>${esc(a.action)}</td><td>${esc(a.entity)}</td><td>${esc(a.entityId)}</td></tr>`).join('') || '<tr><td colspan="5">No events</td></tr>'}</tbody>
        </table>
      </div>

      <div class="lims-card">
        <div class="lims-section-title">⚠️ Danger zone</div>
        <button class="lims-btn warn" onclick="limsResetDB()">Reset LIMS data (re-seed)</button>
        <p style="font-size:12px;color:#6b7684;margin-top:8px;">Clears the IndexedDB and restores the demo dataset. Useful for client demos.</p>
      </div>
    `;
  }

  window.limsSwitchUser = async function() {
    const id = document.getElementById('limsUserSwitch').value;
    S.currentUser = await DB.get('users', id);
    toast('Switched to ' + S.currentUser.name);
    render();
  };

  window.limsResetDB = async function() {
    if (!confirm('Clear LIMS database and re-seed demo data?')) return;
    await new Promise((res, rej) => {
      S.db.close();
      const del = indexedDB.deleteDatabase(DB_NAME);
      del.onsuccess = () => res(); del.onerror = () => rej(del.error); del.onblocked = () => res();
    });
    await DB.open();
    await SEED.run();
    toast('LIMS reset and re-seeded', 'info');
    S.view = 'hub'; S.stack = []; render();
  };

  /* ---------- Public: open ---------- */
  window.limsOpen = async function() {
    if (!S.db) await DB.open();
    await SEED.run();
    if (!S.currentUser) {
      const users = await DB.all('users');
      S.currentUser = users.find(u => u.role === 'authoriser') || users[0];
    }
    S.view = 'hub'; S.stack = []; S.params = {};
    render();
  };

})();
