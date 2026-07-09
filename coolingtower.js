/*
 * Hadron Group — Cooling Tower field calculator
 * =============================================
 * A complete on-site calculator for cooling-tower water balance, ion-balance
 * diagnostics, scaling/corrosion indices, limiting-species cycles, chemical
 * dosing and health/corrosion monitoring.
 *
 * SOURCE OF TRUTH for the water balance: The Nalco Water Handbook (3rd ed.,
 * Flynn, McGraw-Hill), Ch.14 "Cooling System Dynamics", Eqs. 14.7–14.20;
 * indices from Ch.15 (15.3, 15.4); corrosion targets Ch.16. Each formula
 * carries its Nalco equation number inline and in its "Show formula" expander.
 *
 * Field constraints: works fully OFFLINE (no network, no CDN deps), mobile-first,
 * every input optional (compute what the data allows), metric default with an
 * imperial toggle, colour-coded interpretation, editable coefficients.
 *
 * Reuses window.HG_langelier() (shared with the LSI/RSI Index tool) for pHs/LSI/RSI
 * rather than forking that maths. Exposes window.coolingtowerOpen() as entry point,
 * window.HG_CT for the calc core + self-tests, and feeds the app's Save-to-History
 * (CALC_META) and PDF export via window.HG_CT.lastReading().
 */
(function () {
  'use strict';

  /* ============================================================
     PALETTE — Hadron ERP theme (matches the rest of the Customer App).
     NOTE (keep this): every colour in this tool must stay on the app's ERP design
     palette — teal #3AAEDB, dark #2e3742, gold #f5a623, green #157b3a, red #c0392b.
     Do NOT introduce off-scheme brand hexes; future changes must stay consistent
     with the rest of the app so the whole product reads as one system.
     ============================================================ */
  var PAL = {
    charcoal: '#2e3742', teal: '#3AAEDB', gold: '#f5a623',
    ok: '#157b3a', watch: '#f5a623', action: '#c0392b'
  };

  /* Shared Langelier pHs/LSI/RSI — SINGLE SOURCE OF TRUTH for this tool AND the LSI/RSI
     Index tool (Nalco Ch.15 uses these indices but does not define pHs; this is the standard
     Langelier pHs). Defined here if not already present; the LSI/RSI Index calls the same fn. */
  if (typeof window.HG_langelier !== 'function') {
    window.HG_langelier = function (pH, tC, tds, ca, alk) {
      var A = (Math.log10(tds) - 1) / 10, B = -13.12 * Math.log10(tC + 273.15) + 34.55,
        C = Math.log10(ca) - 0.4, D = Math.log10(alk), pHs = (9.3 + A + B) - (C + D);
      return { pHs: pHs, lsi: pH - pHs, rsi: 2 * pHs - pH };  // 15.3 / 15.4
    };
  }

  /* ============================================================
     EDITABLE COEFFICIENTS (settings) — persisted like the rest of the app
     ============================================================ */
  var SETTINGS_KEY = 'hadron_ct_settings';
  var UNITS_KEY = 'hadron_ct_units';
  var DEFAULTS = {
    f: 0.85,          // evaporation factor (14.8): ~85% of heat rejection is evaporative
    driftPct: 0.01,   // drift as % of R (14.18): 0.01% modern default; older 0.005–0.02%
    Cp: 4.1868,       // kJ/(kg·°C)  [1 Btu/(lb·°F)]
    lambda: 2300,     // kJ/kg       [1000 Btu/lb]
    approachLo: 3,    // °C design approach window
    approachHi: 6,
    csAmber: 76,      // carbon-steel corrosion µm/y (Ch.16: acceptable <76 = 3 mpy)
    csRed: 100,
    cuAmber: 5,       // copper-alloy corrosion µm/y (acceptable <5 = 0.2 mpy)
    cuRed: 8,
    ionDevPct: 10,    // % deviation from median CR that flags an ion
    halogenTarget: 1.0, // mg/L free residual target
    orpTarget: 650    // mV ORP target
  };
  function loadSettings() {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); }
    catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {} }
  var S = loadSettings();

  /* ============================================================
     UNITS — metric canonical internally; imperial for display only
     Round-trip safe: every convertible field carries a "kind".
     ============================================================ */
  var UNITS = (function () { try { return localStorage.getItem(UNITS_KEY) === 'imperial' ? 'imperial' : 'metric'; } catch (e) { return 'metric'; } })();
  var CONV = {
    flow: 4.40286754,   // 1 m³/h = 4.40287 US gpm
    vol: 264.172052,    // 1 m³   = 264.172 US gal
    corr: 25.4          // 1 mpy  = 25.4 µm/y
  };
  // absolute temperature
  function c2f(c) { return c * 9 / 5 + 32; }
  function f2c(f) { return (f - 32) * 5 / 9; }
  // temperature difference (no offset)
  function dc2f(c) { return c * 9 / 5; }
  function df2c(f) { return f * 5 / 9; }
  // Convert a display value (current UNITS) → metric, by field kind.
  function toMetric(val, kind) {
    if (val == null || isNaN(val)) return null;
    if (UNITS === 'metric') return val;
    switch (kind) {
      case 'flow': return val / CONV.flow;
      case 'vol': return val / CONV.vol;
      case 'tempAbs': return f2c(val);
      case 'tempDelta': return df2c(val);
      case 'corr': return val / CONV.corr;
      default: return val; // conc, cond, plain, mV, ppm — unit-agnostic
    }
  }
  // Convert a metric value → display (current UNITS).
  function toDisplay(val, kind) {
    if (val == null || isNaN(val)) return null;
    if (UNITS === 'metric') return val;
    switch (kind) {
      case 'flow': return val * CONV.flow;
      case 'vol': return val * CONV.vol;
      case 'tempAbs': return c2f(val);
      case 'tempDelta': return dc2f(val);
      case 'corr': return val * CONV.corr;
      default: return val;
    }
  }
  // Convert a raw value between two unit systems (for the toggle round-trip).
  function convertBetween(val, kind, from, to) {
    if (val == null || isNaN(val) || from === to) return val;
    // route through metric
    var metric = (from === 'metric') ? val : (function () {
      switch (kind) {
        case 'flow': return val / CONV.flow; case 'vol': return val / CONV.vol;
        case 'tempAbs': return f2c(val); case 'tempDelta': return df2c(val);
        case 'corr': return val / CONV.corr; default: return val;
      }
    })();
    if (to === 'metric') return metric;
    switch (kind) {
      case 'flow': return metric * CONV.flow; case 'vol': return metric * CONV.vol;
      case 'tempAbs': return c2f(metric); case 'tempDelta': return dc2f(metric);
      case 'corr': return metric * CONV.corr; default: return metric;
    }
  }
  // Unit label for a kind under the current system.
  function U(kind) {
    var m = { flow: 'm³/h', vol: 'm³', tempAbs: '°C', tempDelta: '°C', corr: 'µm/y', conc: 'mg/L', cond: 'µS/cm', mV: 'mV', ppm: 'mg/L', Lday: 'L/day', h: 'h', pct: '%' };
    var i = { flow: 'gpm', vol: 'US gal', tempAbs: '°F', tempDelta: '°F', corr: 'mpy', conc: 'mg/L', cond: 'µS/cm', mV: 'mV', ppm: 'mg/L', Lday: 'L/day', h: 'h', pct: '%' };
    return (UNITS === 'imperial' ? i : m)[kind] || '';
  }

  /* ============================================================
     PURE CALC CORE — all metric. Every formula tagged with its Nalco eq no.
     ============================================================ */

  // A. WATER BALANCE (Nalco Ch.14). Input keys are metric; any may be null.
  function waterBalance(x, s) {
    s = s || S;
    var r = {};
    var R = num(x.R), V = num(x.V), L = num(x.L) || 0;
    // ΔT: prefer T1−T2 (14.7), else a directly supplied dT.
    var dT = (isN(x.T1) && isN(x.T2)) ? (x.T1 - x.T2) : num(x.dT);
    r.dT = dT;                                                        // 14.7  ΔT = T1 − T2
    r.approach = (isN(x.T2) && isN(x.wetbulb)) ? (x.T2 - x.wetbulb) : null; // approach = T2 − wet-bulb

    // Evaporation (14.8): E = f · R · ΔT · Cp / λ
    var E = (isN(R) && isN(dT)) ? s.f * R * dT * s.Cp / s.lambda : null;
    r.E = E;

    // Cycles of concentration. Prefer chemistry (14.9), else flows (14.10), else target.
    var CR = null, crBasis = null;
    if (isN(x.tracerM) && x.tracerM > 0 && isN(x.tracerR)) { CR = x.tracerR / x.tracerM; crBasis = 'chem'; }   // 14.9  CR = C_recirc / C_makeup
    else if (isN(x.MU_meas) && isN(x.BD_meas) && x.BD_meas > 0) { CR = x.MU_meas / x.BD_meas; crBasis = 'flows'; } // 14.10 CR = MU / BD
    else if (isN(x.targetCR)) { CR = x.targetCR; crBasis = 'target'; }
    r.CR = CR; r.crBasis = crBasis;

    // Drift (14.18): D = driftPct% · R
    var D = isN(R) ? (s.driftPct / 100) * R : null;
    r.D = D;

    // Blowdown (TOTAL — already includes drift + leakage) and Makeup.
    var BD = null, MU = null;
    if (isN(x.MU_meas) && isN(E)) { BD = x.MU_meas - E; MU = x.MU_meas; r.bdEq = '14.15'; r.muEq = 'measured'; } // 14.15 BD = MU − E
    else if (isN(E) && isN(CR) && CR > 1) { BD = E / (CR - 1); MU = E * CR / (CR - 1); r.bdEq = '14.17'; r.muEq = '14.13'; } // 14.17 / 14.13
    else if (isN(x.BD_meas) && isN(E)) { BD = x.BD_meas; MU = x.BD_meas + E; r.bdEq = 'measured'; r.muEq = '14.11'; }        // 14.11 MU = BD + E
    r.BD = BD; r.MU = MU;

    // Controlled blowdown the operator actually valves: BDc = BD − D − L   (14.14 rearranged)
    var BDc = (isN(BD)) ? BD - (D || 0) - L : null;
    r.BDc = BDc;
    r.bdcWarn = (isN(BDc) && BDc <= 0);

    // Time per cycle (14.19) and Holding Time Index (14.20, uses TOTAL BD).
    r.t = (isN(V) && isN(R) && R > 0) ? V / R : null;                          // 14.19  t = V / R
    r.HTI = (isN(V) && isN(BD) && BD > 0) ? 0.693 * V / BD : null;             // 14.20  HTI = 0.693·V / BD

    // Percentages of R
    r.pctE = pctOf(E, R); r.pctBD = pctOf(BD, R); r.pctD = pctOf(D, R);
    r.R = R; r.V = V; r.L = L;
    // Guard: MU can never be below E (the makeup floor is the evaporation rate).
    r.muFloorOk = !(isN(MU) && isN(E)) || MU >= E - 1e-9;
    return r;
  }

  // B. ION-BALANCE DIAGNOSTIC (Nalco Ch.14, Table 14.3). species: {key,label,makeup,recirc}
  function ionBalance(species, s) {
    s = s || S;
    var rows = species.map(function (sp) {
      var cr = (isN(sp.makeup) && sp.makeup > 0 && isN(sp.recirc)) ? sp.recirc / sp.makeup : null;
      return { key: sp.key, label: sp.label, makeup: sp.makeup, recirc: sp.recirc, cr: cr };
    });
    var crs = rows.map(function (r) { return r.cr; }).filter(isN).sort(function (a, b) { return a - b; });
    var median = crs.length ? (crs.length % 2 ? crs[(crs.length - 1) / 2] : (crs[crs.length / 2 - 1] + crs[crs.length / 2]) / 2) : null;
    var byKey = {}; rows.forEach(function (r) { byKey[r.key] = r.cr; });
    var dev = s.ionDevPct / 100;
    // CaCO3 precipitation flag: BOTH Ca and alkalinity CR are >dev% below Mg CR.
    var caco3 = (isN(byKey.ca) && isN(byKey.malk) && isN(byKey.mg)) &&
      (byKey.ca < byKey.mg * (1 - dev)) && (byKey.malk < byKey.mg * (1 - dev));
    // Per-ion interpretation notes (a deviation is not always scale — check chemical feeds).
    var notes = [];
    if (isN(median)) rows.forEach(function (r) {
      if (!isN(r.cr)) return;
      var hi = r.cr > median * (1 + dev), lo = r.cr < median * (1 - dev);
      if (r.key === 'so4' && hi) notes.push('SO₄ cycles elevated → sulfuric-acid dosing, or SO₂ in the plant atmosphere.');
      if (r.key === 'malk' && lo) notes.push('Alkalinity cycles depressed → alkalinity destroyed by acid feed.');
      if (r.key === 'cl' && hi) notes.push('Chloride cycles elevated → chlorination.');
    });
    return { rows: rows, median: median, caco3: caco3, notes: notes };
  }

  // C. INDICES (Nalco Ch.15) — reuse the shared Langelier helper (do not fork).
  function indices(x) {
    if (!(isN(x.pH) && isN(x.tempC) && isN(x.tds) && isN(x.ca) && x.ca > 0 && isN(x.alk) && x.alk > 0 && x.tds > 0)) return null;
    var L = (typeof window.HG_langelier === 'function')
      ? window.HG_langelier(x.pH, x.tempC, x.tds, x.ca, x.alk)
      : langelierFallback(x.pH, x.tempC, x.tds, x.ca, x.alk);
    return { pHs: L.pHs, lsi: L.lsi, rsi: L.rsi };
  }
  // Defensive local copy of the exact standard Langelier pHs (only used if the shared
  // helper is somehow unavailable). Kept identical to the LSI/RSI Index tool.
  function langelierFallback(pH, tC, tds, ca, alk) {
    var A = (Math.log10(tds) - 1) / 10;
    var B = -13.12 * Math.log10(tC + 273.15) + 34.55;
    var C = Math.log10(ca) - 0.4;
    var D = Math.log10(alk);
    var pHs = (9.3 + A + B) - (C + D);      // 15.x standard Langelier pHs
    return { pHs: pHs, lsi: pH - pHs, rsi: 2 * pHs - pH };  // 15.3 / 15.4
  }

  // D. MAX CYCLES FROM A LIMITING SPECIES. limits: [{key,label,makeup,limit}]
  function maxCycles(limits) {
    var rows = limits.map(function (l) {
      var crMax = (isN(l.makeup) && l.makeup > 0 && isN(l.limit)) ? l.limit / l.makeup : null;
      return { key: l.key, label: l.label, crMax: crMax };
    }).filter(function (r) { return isN(r.crMax); });
    if (!rows.length) return null;
    var min = rows.reduce(function (a, b) { return b.crMax < a.crMax ? b : a; });
    return { rows: rows, practicalMax: min.crMax, limiting: min.label };
  }

  // E. CHEMICAL DOSING (standard relationship, NOT a Nalco Handbook equation).
  function dosing(x) {
    if (!(isN(x.dosePpm) && isN(x.controlFlow) && x.controlFlow > 0 && isN(x.active) && x.active > 0 && isN(x.sg) && x.sg > 0)) return null;
    var controlLday = x.controlFlow * 1000 * 24;                 // m³/h → L/day
    var Lday = (x.dosePpm * controlLday) / (1e6 * x.active * x.sg);
    return { Lday: Lday, mlMin: Lday * 1000 / 1440 };
  }

  /* ---------- helpers ---------- */
  function isN(v) { return typeof v === 'number' && isFinite(v); }
  function num(v) { return isN(v) ? v : (v == null || v === '' || isNaN(+v) ? null : +v); }
  function pctOf(x, R) { return (isN(x) && isN(R) && R > 0) ? 100 * x / R : null; }

  /* ============================================================
     SELF-TESTS — assert on load; also runnable via window.HG_CT.selfTest()
     ============================================================ */
  function selfTest() {
    var out = [], ok = true;
    function approx(a, b, tolPct, name) {
      var pass = isN(a) && Math.abs(a - b) <= Math.abs(b) * tolPct / 100 + 1e-9;
      if (!pass) ok = false;
      out.push((pass ? 'PASS ' : 'FAIL ') + name + ' got ' + (isN(a) ? a.toFixed(3) : a) + ' exp ' + b);
    }
    // Test 1 — worked water balance
    var t1 = waterBalance({ R: 500, dT: 8, targetCR: 5, V: 300, L: 0 }, DEFAULTS);
    approx(t1.E, 6.19, 1, '14.8 E');
    approx(t1.BD, 1.55, 1, '14.17 BD');
    approx(t1.MU, 7.74, 1, '14.13/14.11 MU');
    approx(t1.D, 0.05, 1, '14.18 D');
    approx(t1.BDc, 1.50, 1, '14.14 BDc');
    approx(t1.t, 0.60, 1, '14.19 t');
    approx(t1.HTI, 134, 1, '14.20 HTI');
    // Test 2 — Nalco Table 14.3 (Corunna) ion balance
    var ib = ionBalance([
      { key: 'ca', label: 'Ca', makeup: 69, recirc: 420 }, { key: 'mg', label: 'Mg', makeup: 30, recirc: 180 },
      { key: 'na', label: 'Na', makeup: 7.7, recirc: 77 }, { key: 'cl', label: 'Cl', makeup: 13, recirc: 100 },
      { key: 'so4', label: 'SO₄', makeup: 19, recirc: 510 }, { key: 'malk', label: 'M-alk', makeup: 72, recirc: 27 },
      { key: 'cond', label: 'Cond', makeup: 240, recirc: 1400 }
    ], DEFAULTS);
    var crMap = {}; ib.rows.forEach(function (r) { crMap[r.key] = r.cr; });
    approx(crMap.ca, 6.1, 2, 'CR Ca'); approx(crMap.mg, 6.0, 2, 'CR Mg'); approx(crMap.na, 10, 2, 'CR Na');
    approx(crMap.cl, 7.7, 2, 'CR Cl'); approx(crMap.so4, 26.8, 2, 'CR SO4'); approx(crMap.malk, 0.375, 3, 'CR M-alk');
    approx(crMap.cond, 5.83, 2, 'CR Cond');
    if (ib.caco3) { ok = false; out.push('FAIL Corunna must NOT raise CaCO3-precip flag'); } else out.push('PASS Corunna no CaCO3 flag');
    // Test 3 — MU never below E for CR>1
    var mu3 = true; [1.2, 2, 5, 10, 50].forEach(function (cr) { var t = waterBalance({ R: 500, dT: 8, targetCR: cr }, DEFAULTS); if (t.MU < t.E - 1e-6) mu3 = false; });
    if (!mu3) ok = false; out.push((mu3 ? 'PASS ' : 'FAIL ') + 'MU ≥ E for all CR>1');
    // Test 4 — unit round-trip
    var rt = true;
    [['flow', 500], ['vol', 300], ['tempAbs', 30], ['tempDelta', 8], ['corr', 76]].forEach(function (p) {
      var back = convertBetween(convertBetween(p[1], p[0], 'metric', 'imperial'), p[0], 'imperial', 'metric');
      if (Math.abs(back - p[1]) > 1e-6) rt = false;
    });
    if (!rt) ok = false; out.push((rt ? 'PASS ' : 'FAIL ') + 'unit round-trip metric→imperial→metric');
    out.forEach(function (l) { (l.indexOf('FAIL') === 0 ? console.error : console.log)('[CT self-test] ' + l); });
    console.log('[CT self-test] ' + (ok ? 'ALL PASS' : 'FAILURES ABOVE'));
    return { ok: ok, lines: out };
  }

  /* ============================================================
     RENDERING
     ============================================================ */
  var TRACERS = [['cond', 'Conductivity'], ['ca', 'Calcium'], ['mg', 'Magnesium'], ['cl', 'Chloride'], ['na', 'Sodium'], ['so4', 'Sulfate'], ['malk', 'M-alkalinity']];
  var ION_SPECIES = [['ca', 'Ca (as CaCO₃)'], ['mg', 'Mg (as CaCO₃)'], ['na', 'Na'], ['cl', 'Cl'], ['so4', 'SO₄'], ['malk', 'M-alkalinity'], ['cond', 'Conductivity']];

  function injectStyles() {
    if (document.getElementById('ct-styles')) return;
    var css = '' +
      '#ct_root{--ct-char:' + PAL.charcoal + ';--ct-teal:' + PAL.teal + ';--ct-gold:' + PAL.gold + ';--ct-ok:' + PAL.ok + ';--ct-watch:' + PAL.watch + ';--ct-act:' + PAL.action + ';}' +
      '#ct_root .ct-lead{font-size:13px;color:#6b7684;margin:0 0 12px;}' +
      '#ct_root .ct-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;}' +
      '#ct_root .ct-seg{display:inline-flex;border:1.5px solid var(--ct-teal);border-radius:10px;overflow:hidden;}' +
      '#ct_root .ct-seg button{border:0;background:#fff;color:var(--ct-teal);font-weight:700;padding:9px 16px;font-size:14px;cursor:pointer;}' +
      '#ct_root .ct-seg button.on{background:var(--ct-teal);color:#fff;}' +
      'body.dark #ct_root .ct-seg button{background:#0F172A;}' +
      'body.dark #ct_root .ct-seg button.on{background:var(--ct-teal);color:#fff;}' +   /* keep active toggle teal in dark */
      'body.dark #ct_root details.ct-sec[data-accent="gold"]{border-left-color:var(--ct-gold);}' +   /* keep gold headline accent in dark */
      '#ct_root details.ct-sec{border:1px solid #e3e9ee;border-left:4px solid var(--ct-teal);border-radius:12px;margin-bottom:12px;background:#fff;overflow:hidden;}' +
      'body.dark #ct_root details.ct-sec{background:#0F172A;border-color:#1A222F;border-left-color:var(--ct-teal);}' +
      '#ct_root details.ct-sec[data-accent="gold"]{border-left-color:var(--ct-gold);}' +
      '#ct_root summary.ct-head{list-style:none;cursor:pointer;padding:14px 16px;font-weight:800;font-size:15px;color:var(--ct-char);display:flex;justify-content:space-between;align-items:center;}' +
      'body.dark #ct_root summary.ct-head{color:#e8ecef;}' +
      '#ct_root summary.ct-head::-webkit-details-marker{display:none;}' +
      '#ct_root summary.ct-head .ct-chev{color:var(--ct-teal);font-size:13px;font-weight:700;}' +
      '#ct_root .ct-body{padding:0 16px 16px;}' +
      '#ct_root .ct-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;}' +
      '#ct_root .ct-fg label{display:block;font-size:12px;font-weight:600;color:#5a6a76;margin-bottom:4px;}' +
      'body.dark #ct_root .ct-fg label{color:#9aa3aa;}' +
      '#ct_root .ct-fg input,#ct_root .ct-fg select{width:100%;padding:12px;font-size:16px;border:1px solid #d7dee4;border-radius:10px;background:#fff;color:var(--ct-char);}' +
      'body.dark #ct_root .ct-fg input,body.dark #ct_root .ct-fg select{background:#111a24;border-color:#28323d;color:#e8ecef;}' +
      '#ct_root .ct-fg input:focus{outline:2px solid var(--ct-teal);border-color:var(--ct-teal);}' +
      '#ct_root .ct-res{margin-top:12px;border-top:1px dashed #dce3e9;padding-top:10px;}' +
      '#ct_root .ct-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f0f3f6;}' +
      'body.dark #ct_root .ct-row{border-color:#1A222F;}' +
      '#ct_root .ct-row.dim{opacity:.45;}' +
      '#ct_root .ct-row .k{font-size:13px;color:var(--ct-char);}' +
      'body.dark #ct_root .ct-row .k{color:#c8cfd6;}' +
      '#ct_root .ct-row .v{font-weight:800;font-size:16px;white-space:nowrap;}' +
      '#ct_root .ct-badge{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:7px;vertical-align:middle;}' +
      '#ct_root .st-ok{color:var(--ct-ok);} #ct_root .st-ok .ct-badge{background:var(--ct-ok);}' +
      '#ct_root .st-watch{color:var(--ct-watch);} #ct_root .st-watch .ct-badge{background:var(--ct-watch);}' +
      '#ct_root .st-act{color:var(--ct-act);} #ct_root .st-act .ct-badge{background:var(--ct-act);}' +
      '#ct_root .ct-fx{margin:2px 0 8px;}' +
      '#ct_root .ct-fx summary{cursor:pointer;font-size:11px;color:var(--ct-teal);font-weight:700;}' +
      '#ct_root .ct-fx div{font-size:12px;color:#5a6a76;background:#f5f8fa;border-radius:8px;padding:8px 10px;margin-top:5px;line-height:1.5;}' +
      'body.dark #ct_root .ct-fx div{background:#11202e;color:#b5c4cf;}' +
      '#ct_root .ct-fx code{font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--ct-char);}' +
      'body.dark #ct_root .ct-fx code{color:#9fe6f0;}' +
      '#ct_root .ct-flag{border-radius:10px;padding:10px 12px;margin:8px 0;font-size:13px;line-height:1.5;}' +
      '#ct_root .ct-flag.red{background:rgba(192,57,43,.10);border:1px solid rgba(192,57,43,.4);color:#8e2419;}' +
      '#ct_root .ct-flag.amber{background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.5);color:#8a5a00;}' +
      '#ct_root .ct-flag.info{background:rgba(58,174,219,.10);border:1px solid rgba(58,174,219,.4);color:#1f6f7a;}' +
      'body.dark #ct_root .ct-flag.info{color:#8fd3dd;} body.dark #ct_root .ct-flag.amber{color:#f0c674;} body.dark #ct_root .ct-flag.red{color:#f5b0a6;}' +
      '#ct_root .ct-chart{margin-top:10px;}' +
      '#ct_root .ct-bar{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:12px;}' +
      '#ct_root .ct-bar .lab{width:96px;color:var(--ct-char);flex-shrink:0;}' +
      'body.dark #ct_root .ct-bar .lab{color:#c8cfd6;}' +
      '#ct_root .ct-bar .track{flex:1;height:16px;background:#eef2f5;border-radius:8px;position:relative;overflow:hidden;}' +
      'body.dark #ct_root .ct-bar .track{background:#1A222F;}' +
      '#ct_root .ct-bar .fill{height:100%;border-radius:8px;}' +
      '#ct_root .ct-bar .med{position:absolute;top:-2px;bottom:-2px;width:2px;background:var(--ct-char);opacity:.6;}' +
      '#ct_root .ct-bar .val{width:64px;text-align:right;font-weight:700;flex-shrink:0;}' +
      '#ct_root .ct-actions{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 4px;}' +
      '#ct_root .ct-btn{border:0;border-radius:10px;padding:12px 16px;font-size:14px;font-weight:700;cursor:pointer;}' +
      '#ct_root .ct-btn.teal{background:var(--ct-teal);color:#fff;} #ct_root .ct-btn.gold{background:var(--ct-gold);color:#fff;} #ct_root .ct-btn.ghost{background:#fff;color:var(--ct-char);border:1px solid #cdd6dd;}' +
      'body.dark #ct_root .ct-btn.ghost{background:#0F172A;color:#e8ecef;border-color:#28323d;}' +
      '#ct_root .ct-note{font-size:11.5px;color:#8a97a4;margin:6px 0 0;line-height:1.5;}';
    var st = document.createElement('style'); st.id = 'ct-styles'; st.textContent = css;
    document.head.appendChild(st);
  }

  // small input builder
  function fg(id, label, kind, ph, val) {
    var unit = kind ? (' (' + U(kind) + ')') : '';
    return '<div class="ct-fg"><label>' + esc(label) + unit + '</label>' +
      '<input type="number" inputmode="decimal" id="' + id + '" data-kind="' + (kind || 'plain') + '" step="any" placeholder="' + (ph || '') + '"' + (val != null ? ' value="' + val + '"' : '') + '></div>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function shell() {
    var h = '';
    h += '<h2 style="margin:0 0 2px;">Cooling Tower Field Calculator</h2>';
    h += '<p class="ct-lead">Enter whatever you have measured — every field is optional and results compute live. Water balance per Nalco Water Handbook (3rd ed.) Ch.14. Units convert consistently; nothing is ever mixed.</p>';
    h += '<div class="ct-toolbar"><div class="ct-seg"><button id="ct_um" class="' + (UNITS === 'metric' ? 'on' : '') + '" onclick="HG_CT.setUnits(\'metric\')">Metric</button><button id="ct_ui" class="' + (UNITS === 'imperial' ? 'on' : '') + '" onclick="HG_CT.setUnits(\'imperial\')">Imperial</button></div>' +
      '<button class="ct-btn ghost" onclick="HG_CT.toggle(\'ct_help\')">How to use</button>' +
      '<button class="ct-btn ghost" onclick="HG_CT.toggle(\'ct_settings\')">⚙ Settings</button></div>';

    // Help (hidden)
    h += '<div id="ct_help" style="display:none;">' + helpPanel() + '</div>';
    // Settings (hidden)
    h += '<div id="ct_settings" style="display:none;">' + settingsPanel() + '</div>';

    // B — ION BALANCE (headline, open)
    h += sec('ct_sec_ion', 'Ion-balance diagnostic — the headline check', true, 'gold',
      '<p class="ct-note">In a balanced system every ion cycles up by the same factor. Enter make-up and recirculating concentrations; deviations expose scale, acid feed or chlorination. (Nalco Table 14.3.)</p>' +
      '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;min-width:340px;">' +
      '<tr style="text-align:left;color:#6b7684;"><th style="padding:4px;">Species</th><th>Make-up</th><th>Recirc</th></tr>' +
      ION_SPECIES.map(function (sp) {
        return '<tr><td style="padding:4px;font-weight:600;">' + sp[1] + '</td>' +
          '<td><input type="number" inputmode="decimal" id="ct_ion_' + sp[0] + '_m" style="width:90px;padding:9px;font-size:15px;border:1px solid #d7dee4;border-radius:8px;"></td>' +
          '<td><input type="number" inputmode="decimal" id="ct_ion_' + sp[0] + '_r" style="width:90px;padding:9px;font-size:15px;border:1px solid #d7dee4;border-radius:8px;"></td></tr>';
      }).join('') + '</table></div>' +
      '<div id="ct_ion_out"></div>');

    // A — WATER BALANCE (open)
    h += sec('ct_sec_wb', 'Water balance (evaporation, blowdown, make-up, HTI)', true, 'teal',
      '<div class="ct-grid">' +
      fg('ct_R', 'Recirculation rate', 'flow', 'e.g. 500') +
      fg('ct_T1', 'Hot return T₁', 'tempAbs', 'e.g. 38') +
      fg('ct_T2', 'Cold basin T₂', 'tempAbs', 'e.g. 30') +
      fg('ct_wb', 'Wet-bulb', 'tempAbs', 'e.g. 24') +
      fg('ct_dT', 'ΔT (if T₁/T₂ unknown)', 'tempDelta', 'e.g. 8') +
      fg('ct_V', 'System volume', 'vol', 'e.g. 300') +
      fg('ct_targetCR', 'Target cycles (CR)', null, 'e.g. 5') +
      fg('ct_L', 'Leakage loss L', 'flow', '0') +
      fg('ct_MU', 'Measured make-up', 'flow', 'optional') +
      fg('ct_BD', 'Measured blowdown', 'flow', 'optional') +
      '<div class="ct-fg"><label>CR tracer (chemistry, preferred)</label><select id="ct_tracerSel">' + TRACERS.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('') + '</select></div>' +
      fg('ct_trM', 'Tracer in make-up', 'conc', 'e.g. 300') +
      fg('ct_trR', 'Tracer in recirc', 'conc', 'e.g. 1500') +
      '</div>' +
      '<div id="ct_wb_out" class="ct-res"></div>' +
      '<p class="ct-note">Evaporation (14.8) is a rule-of-thumb — error grows at low ambient temperature and at very low or high humidity. A value from a <b>measured</b> make-up or blowdown plus cycles is better.</p>');

    // C — INDICES
    h += sec('ct_sec_idx', 'Scaling / corrosion indices (LSI & RSI)', false, 'teal',
      '<div class="ct-grid">' +
      fg('ct_idx_ph', 'pH', null, 'e.g. 8.2') +
      fg('ct_idx_t', 'Temperature', 'tempAbs', 'e.g. 30') +
      fg('ct_idx_tds', 'TDS', 'conc', 'e.g. 1400') +
      fg('ct_idx_ca', 'Calcium (as CaCO₃)', 'conc', 'e.g. 420') +
      fg('ct_idx_alk', 'M-alkalinity (as CaCO₃)', 'conc', 'e.g. 120') +
      '</div><div id="ct_idx_out" class="ct-res"></div>' +
      '<div class="ct-flag amber">⚠ Simple indices are rules of thumb and should seldom be relied on for cooling systems. They ignore or severely limit temperature and ionic-strength effects, ignore scaling species other than CaCO₃, and ignore ion pairing. Treat as <b>directional only</b>; confirm against your water-treatment programme. <i>(Paraphrased from Nalco Ch.15.)</i></div>' +
      '<button class="ct-btn ghost" style="margin-top:4px;" onclick="if(typeof openWindow===\'function\')openWindow(\'waterindex\')">Open the LSI / RSI Index tool →</button>');

    // D — MAX CYCLES
    h += sec('ct_sec_max', 'Practical max cycles from a limiting species', false, 'teal',
      '<p class="ct-note">Enter each species\' make-up concentration and its recirc limit. Practical max CR = the smallest limit ÷ make-up.</p>' +
      '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;min-width:340px;">' +
      '<tr style="text-align:left;color:#6b7684;"><th style="padding:4px;">Species</th><th>Make-up</th><th>Recirc limit</th></tr>' +
      [['ca', 'Ca (as CaCO₃)'], ['mg', 'Mg (as CaCO₃)'], ['cl', 'Cl'], ['so4', 'SO₄'], ['sio2', 'Silica (SiO₂)'], ['cond', 'Conductivity']].map(function (sp) {
        return '<tr><td style="padding:4px;font-weight:600;">' + sp[1] + '</td>' +
          '<td><input type="number" inputmode="decimal" id="ct_lim_' + sp[0] + '_m" style="width:90px;padding:9px;font-size:15px;border:1px solid #d7dee4;border-radius:8px;"></td>' +
          '<td><input type="number" inputmode="decimal" id="ct_lim_' + sp[0] + '_l" style="width:90px;padding:9px;font-size:15px;border:1px solid #d7dee4;border-radius:8px;"></td></tr>';
      }).join('') + '</table></div><div id="ct_max_out"></div>');

    // E — DOSING
    h += sec('ct_sec_dose', 'Chemical dosing', false, 'teal',
      '<div class="ct-grid">' +
      fg('ct_dose_ppm', 'Dose (ppm as active)', null, 'e.g. 100') +
      '<div class="ct-fg"><label>Control stream</label><select id="ct_dose_stream"><option value="mu">Make-up</option><option value="bd">Blowdown</option></select></div>' +
      fg('ct_dose_act', 'Product active fraction', null, '1 = neat') +
      fg('ct_dose_sg', 'Product SG', null, 'e.g. 1.2') +
      '</div><div id="ct_dose_out" class="ct-res"></div>' +
      '<p class="ct-note">Standard proportional-feed relationship — <b>not</b> a Nalco Handbook equation. A long Holding Time Index means a slug dose persists far longer.</p>');

    // F — HEALTH
    h += sec('ct_sec_health', 'Corrosion, halogen & Legionella monitoring', false, 'teal',
      '<div class="ct-grid">' +
      fg('ct_cs', 'Carbon-steel coupon', 'corr', 'e.g. 40') +
      fg('ct_cu', 'Copper-alloy coupon', 'corr', 'e.g. 3') +
      fg('ct_dpdF', 'Free halogen (DPD)', 'ppm', 'e.g. 0.8') +
      fg('ct_dpdT', 'Total halogen (DPD)', 'ppm', 'optional') +
      fg('ct_orp', 'ORP', 'mV', 'e.g. 650') +
      '<div class="ct-fg"><label>Drift eliminators</label><select id="ct_drifts"><option value="ok">Good condition</option><option value="bad">Damaged / fouled</option></select></div>' +
      '</div><div id="ct_health_out" class="ct-res"></div>');

    // Actions
    h += '<div class="ct-actions">' +
      '<button class="ct-btn teal save-calc-btn" style="background:var(--ct-teal);" onclick="saveCalculation(\'coolingtower\', this)">💾 Save reading</button>' +
      '<button class="ct-btn gold" onclick="HG_CT.copyText(this)">📋 Copy as text</button>' +
      '<button class="ct-btn ghost" onclick="HG_CT.prefillServiceReport()">📝 To service report</button>' +
      '<button class="ct-btn ghost pdf-calc-btn" onclick="exportPdf(\'coolingtower\')">📄 PDF</button>' +
      '</div>';
    return h;
  }

  function sec(id, title, open, accent, body) {
    return '<details class="ct-sec" id="' + id + '" data-accent="' + accent + '"' + (open ? ' open' : '') + '>' +
      '<summary class="ct-head">' + esc(title) + '<span class="ct-chev">▾</span></summary>' +
      '<div class="ct-body">' + body + '</div></details>';
  }

  function settingsPanel() {
    var f = [
      ['f', 'Evaporation factor f (0.5–1.0)'], ['driftPct', 'Drift (% of R)'], ['Cp', 'Cp kJ/(kg·°C)'], ['lambda', 'λ latent heat kJ/kg'],
      ['approachLo', 'Approach min °C'], ['approachHi', 'Approach max °C'],
      ['csAmber', 'Carbon steel amber µm/y'], ['csRed', 'Carbon steel red µm/y'], ['cuAmber', 'Copper amber µm/y'], ['cuRed', 'Copper red µm/y'],
      ['ionDevPct', 'Ion deviation flag %'], ['halogenTarget', 'Halogen target mg/L'], ['orpTarget', 'ORP target mV']
    ];
    return '<div class="ct-sec" style="border-left-color:var(--ct-gold);padding:14px 16px;"><div style="font-weight:800;color:var(--ct-char);margin-bottom:8px;">Coefficients & thresholds</div>' +
      '<div class="ct-grid">' + f.map(function (x) {
        return '<div class="ct-fg"><label>' + x[1] + '</label><input type="number" inputmode="decimal" id="ct_set_' + x[0] + '" step="any" value="' + S[x[0]] + '"></div>';
      }).join('') + '</div>' +
      '<div class="ct-actions"><button class="ct-btn teal" style="background:var(--ct-teal);" onclick="HG_CT.applySettings()">Save settings</button><button class="ct-btn ghost" onclick="HG_CT.resetSettings()">Reset defaults</button></div>' +
      '<p class="ct-note">Drift: modern eliminators ≈0.0005%; older 0.005–0.02% — prefer the tower spec. Corrosion targets: Nalco Ch.16 (carbon steel &lt;3 mpy/76 µm·y⁻¹; copper &lt;0.2 mpy/5 µm·y⁻¹).</p></div>';
  }

  function helpPanel() {
    return '<div class="ct-sec" style="border-left-color:var(--ct-gold);padding:14px 16px;">' +
      '<div style="font-weight:800;color:var(--ct-char);margin-bottom:6px;">Using this on site</div>' +
      '<ol style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#5a6a76;">' +
      '<li><b>Start with the ion balance.</b> Enter make-up and tower concentrations for whatever the lab gave you. Equal cycles = balanced. A red flag = probable CaCO₃ scaling.</li>' +
      '<li><b>Water balance:</b> enter recirculation, temperatures (or ΔT) and target cycles. Prefer a <b>measured</b> make-up/blowdown or a chemistry tracer over the evaporation rule-of-thumb.</li>' +
      '<li>Every result has a <b>Show formula</b> link with its Nalco equation number and the constants used.</li>' +
      '<li>Colours: <span style="color:' + PAL.ok + ';font-weight:700;">green</span> OK · <span style="color:' + PAL.watch + ';font-weight:700;">amber</span> watch · <span style="color:' + PAL.action + ';font-weight:700;">red</span> action.</li>' +
      '<li><b>Save reading</b> stores it on this device (works offline); <b>Copy as text</b> gives a summary to paste into WhatsApp or email.</li>' +
      '<li>Adjust coefficients under <b>⚙ Settings</b> — they persist on this device.</li>' +
      '</ol><p class="ct-note">This tool flags risk; it does not certify safety. Confirm against your water-treatment programme.</p></div>';
  }

  /* ---------- live compute + render ---------- */
  function readF(id, kind) { var el = document.getElementById(id); if (!el) return null; var v = el.value; if (v === '' || v == null) return null; var n = +v; return isN(n) ? toMetric(n, kind || (el.getAttribute('data-kind'))) : null; }
  function dsp(metricVal, kind, dp) { var v = toDisplay(metricVal, kind); return isN(v) ? v.toFixed(dp == null ? 2 : dp) : '—'; }

  var LAST = { summary: '', inputs: [], results: [] };

  function recompute() {
    if (!document.getElementById('ct_root')) return;
    S = loadSettings();
    var summaryParts = [], inputsRec = [], resultsRec = [];

    /* ---- B ion balance ---- */
    var species = ION_SPECIES.map(function (sp) {
      return { key: sp[0], label: sp[1], makeup: readF('ct_ion_' + sp[0] + '_m', 'conc'), recirc: readF('ct_ion_' + sp[0] + '_r', 'conc') };
    });
    var ib = ionBalance(species, S);
    var ionOut = '';
    var haveIon = ib.rows.some(function (r) { return isN(r.cr); });
    if (haveIon) {
      if (ib.caco3) ionOut += '<div class="ct-flag red">🔴 CaCO₃ is probably precipitating in the system — calcium and alkalinity are both cycling well below magnesium.</div>';
      ib.notes.forEach(function (n) { ionOut += '<div class="ct-flag amber">⚠ ' + esc(n) + '</div>'; });
      ionOut += '<div class="ct-chart">';
      var maxCr = Math.max.apply(null, ib.rows.map(function (r) { return isN(r.cr) ? r.cr : 0; }).concat([ib.median || 1]));
      ib.rows.forEach(function (r) {
        if (!isN(r.cr)) return;
        var dev = ib.median ? Math.abs(r.cr - ib.median) / ib.median : 0;
        var col = dev > S.ionDevPct / 100 ? (r.cr < ib.median ? PAL.action : PAL.gold) : PAL.teal;
        var w = Math.max(3, Math.round(r.cr / maxCr * 100));
        var medLeft = ib.median ? Math.round(ib.median / maxCr * 100) : 0;
        ionOut += '<div class="ct-bar"><span class="lab">' + r.label + '</span><span class="track"><span class="fill" style="width:' + w + '%;background:' + col + ';"></span><span class="med" style="left:' + medLeft + '%;"></span></span><span class="val">' + r.cr.toFixed(1) + '×</span></div>';
        resultsRec.push({ label: 'CR ' + r.label.replace(/<[^>]+>/g, ''), value: r.cr.toFixed(2) + '×' });
      });
      ionOut += '</div><p class="ct-note">Vertical mark = median CR (' + (ib.median ? ib.median.toFixed(1) : '—') + '×). Amber = above median, red = below — a deviation is not always scale, check chemical feeds.</p>';
      summaryParts.push('Ion CR median ' + (ib.median ? ib.median.toFixed(1) : '—') + '×' + (ib.caco3 ? ' ⚠CaCO₃ risk' : ''));
    } else { ionOut = '<p class="ct-note">Enter make-up and recirc concentrations above to compute cycles per species.</p>'; }
    setHtml('ct_ion_out', ionOut);

    /* ---- A water balance ---- */
    var trSel = (document.getElementById('ct_tracerSel') || {}).value;
    var wbIn = {
      R: readF('ct_R', 'flow'), T1: readF('ct_T1', 'tempAbs'), T2: readF('ct_T2', 'tempAbs'), wetbulb: readF('ct_wb', 'tempAbs'),
      dT: readF('ct_dT', 'tempDelta'), V: readF('ct_V', 'vol'), targetCR: readF('ct_targetCR'), L: readF('ct_L', 'flow'),
      MU_meas: readF('ct_MU', 'flow'), BD_meas: readF('ct_BD', 'flow'), tracerM: readF('ct_trM', 'conc'), tracerR: readF('ct_trR', 'conc')
    };
    var wb = waterBalance(wbIn, S);
    var wbOut = '';
    wbOut += row('Range ΔT', wb.dT, 'tempDelta', 1, statusApproach(null), fx('ΔT = T₁ − T₂', '14.7', 'T₁, T₂ in ' + U('tempAbs')));
    var apSt = 'none', apNote = '';
    if (isN(wb.approach)) { apSt = (wb.approach > S.approachHi ? 'act' : (wb.approach < S.approachLo ? 'watch' : 'ok')); if (wb.approach > S.approachHi) apNote = ' — tower underperforming'; }
    wbOut += row('Approach' + (apNote ? '<span class="ct-note" style="display:inline;"> ' + apNote + '</span>' : ''), wb.approach, 'tempDelta', 1, apSt, fx('approach = T₂ − wet-bulb', 'Ch.14', 'design ' + S.approachLo + '–' + S.approachHi + ' ' + U('tempDelta') + '; >' + S.approachHi + ' ⇒ underperforming'));
    wbOut += row('Cycles of concentration' + (wb.crBasis ? ' <span class="ct-note" style="display:inline;">(' + ({ chem: 'chemistry', flows: 'MU/BD', target: 'target' }[wb.crBasis]) + ')</span>' : ''), wb.CR, null, 2, wb.CR ? 'ok' : 'none', fx('CR = C_recirc / C_makeup (preferred)', '14.9', 'or CR = MU/BD (14.10)'));
    wbOut += row('Evaporation E', wb.E, 'flow', 2, wb.E ? 'ok' : 'none', fx('E = f · R · ΔT · Cp / λ', '14.8', 'f=' + S.f + ', Cp=' + S.Cp + ' kJ/(kg·°C), λ=' + S.lambda + ' kJ/kg · metric check E≈R·ΔT·0.001547 at f=0.85'), wb.pctE);
    wbOut += row('Drift D', wb.D, 'flow', 3, wb.D ? 'ok' : 'none', fx('D = ' + S.driftPct + '% · R', '14.18', 'modern eliminators ≈0.0005%; older 0.005–0.02%'), wb.pctD);
    wbOut += row('Blowdown BD (total)', wb.BD, 'flow', 2, wb.BD ? 'ok' : 'none', fx('BD ' + (wb.bdEq === '14.17' ? '= E / (CR − 1)' : wb.bdEq === '14.15' ? '= MU − E' : '(measured)'), wb.bdEq || '14.14', 'TOTAL loss — already includes drift + leakage'), wb.pctBD);
    var bdcSt = wb.bdcWarn ? 'act' : (isN(wb.BDc) ? 'ok' : 'none');
    wbOut += row('Controlled blowdown BDc', wb.BDc, 'flow', 2, bdcSt, fx('BDc = BD − D − L', '14.14', 'the valve loss the operator actually sets'));
    if (wb.bdcWarn) wbOut += '<div class="ct-flag amber">⚠ Drift + leakage alone exceed the required loss — no controlled blowdown needed; actual cycles will settle above target.</div>';
    wbOut += row('Make-up MU', wb.MU, 'flow', 2, wb.MU ? 'ok' : 'none', fx('MU = E · CR / (CR − 1)', '14.13', 'also MU = BD + E (14.11). Floor: MU can never be below E.'));
    if (!wb.muFloorOk) wbOut += '<div class="ct-flag red">🔴 Internal check failed: MU computed below E.</div>';
    wbOut += row('Time per cycle t', wb.t, 'h', 2, wb.t ? 'ok' : 'none', fx('t = V / R', '14.19', ''));
    wbOut += row('Holding Time Index', wb.HTI, 'h', 0, wb.HTI ? 'ok' : 'none', fx('HTI = 0.693 · V / BD', '14.20', 'half-life of an added chemical; uses TOTAL BD'));
    if (isN(wb.L) && wb.L > 0 && isN(wb.MU) && wb.L > 0.3 * wb.MU) wbOut += '<div class="ct-flag amber">⚠ Heavy leakage/once-through use can hold a system below CR 1.2–1.5, blocking economical chemical treatment.</div>';
    wbOut += '<div class="ct-flag info">💡 Make-up falls steeply as cycles rise from 1 to ~6, then only marginally above 6. The floor on make-up is the evaporation rate — MU can never be less than E.</div>';
    setHtml('ct_wb_out', wbOut);
    if (isN(wb.MU)) summaryParts.unshift('CR ' + (isN(wb.CR) ? wb.CR.toFixed(1) : '—') + ' · MU ' + dsp(wb.MU, 'flow', 2) + ' ' + U('flow') + ' · BD ' + dsp(wb.BD, 'flow', 2));
    [['Recirculation R', wb.R, 'flow'], ['ΔT', wb.dT, 'tempDelta'], ['Volume', wb.V, 'vol']].forEach(function (p) { if (isN(p[1])) inputsRec.push({ label: p[0], value: dsp(p[1], p[2], 2) + ' ' + U(p[2]) }); });
    if (isN(wb.MU)) resultsRec.push({ label: 'Make-up', value: dsp(wb.MU, 'flow', 2) + ' ' + U('flow') });
    if (isN(wb.BD)) resultsRec.push({ label: 'Blowdown (total)', value: dsp(wb.BD, 'flow', 2) + ' ' + U('flow') });
    if (isN(wb.HTI)) resultsRec.push({ label: 'HTI', value: wb.HTI.toFixed(0) + ' h' });

    /* ---- C indices ---- */
    var idx = indices({ pH: readF('ct_idx_ph'), tempC: readF('ct_idx_t', 'tempAbs'), tds: readF('ct_idx_tds', 'conc'), ca: readF('ct_idx_ca', 'conc'), alk: readF('ct_idx_alk', 'conc') });
    var idxOut = '';
    if (idx) {
      idxOut += row('Saturation pH (pHs)', idx.pHs, null, 2, 'none', fx('pHs = (9.3 + A + B) − (C + D)', 'std Langelier (NOT from Nalco)', 'A=(log₁₀TDS−1)/10, B=−13.12·log₁₀T(K)+34.55, C=log₁₀Ca−0.4, D=log₁₀alk'));
      idxOut += row('LSI', idx.lsi, null, 2, idx.lsi > 0 ? 'watch' : 'ok', fx('LSI = pH − pHs', '15.3', 'LSI>0 scaling; ≤0 non-scaling'));
      idxOut += row('RSI', idx.rsi, null, 2, idx.rsi > 6 ? 'act' : 'watch', fx('RSI = 2·pHs − pH', '15.4', 'RSI>6.0 corrosive; <6.0 scaling'));
      resultsRec.push({ label: 'LSI', value: idx.lsi.toFixed(2) }, { label: 'RSI', value: idx.rsi.toFixed(2) });
      summaryParts.push('LSI ' + idx.lsi.toFixed(2) + ' / RSI ' + idx.rsi.toFixed(2));
    } else idxOut = '<p class="ct-note">Enter pH, temperature, TDS, calcium and alkalinity to compute LSI/RSI.</p>';
    setHtml('ct_idx_out', idxOut);

    /* ---- D max cycles ---- */
    var limits = [['ca', 'Ca'], ['mg', 'Mg'], ['cl', 'Cl'], ['so4', 'SO₄'], ['sio2', 'Silica'], ['cond', 'Conductivity']].map(function (sp) {
      return { key: sp[0], label: sp[1], makeup: readF('ct_lim_' + sp[0] + '_m', 'conc'), limit: readF('ct_lim_' + sp[0] + '_l', 'conc') };
    });
    var mc = maxCycles(limits);
    var maxOut = '';
    if (mc) {
      mc.rows.forEach(function (r) { maxOut += row('Max CR — ' + r.label, r.crMax, null, 1, r.crMax === mc.practicalMax ? 'act' : 'ok', ''); });
      maxOut += '<div class="ct-flag info">Practical max CR = <b>' + mc.practicalMax.toFixed(1) + '×</b>, limited by <b>' + esc(mc.limiting) + '</b>. Each conservative species concentrates as C_recirc = C_makeup × CR.</div>';
      resultsRec.push({ label: 'Practical max CR', value: mc.practicalMax.toFixed(1) + '× (' + mc.limiting + ')' });
      summaryParts.push('Max CR ' + mc.practicalMax.toFixed(1) + '× (' + mc.limiting + ')');
    } else maxOut = '<p class="ct-note">Enter a make-up concentration and a recirc limit for at least one species.</p>';
    setHtml('ct_max_out', maxOut);

    /* ---- E dosing ---- */
    var stream = (document.getElementById('ct_dose_stream') || {}).value;
    var ctrl = stream === 'bd' ? wb.BD : wb.MU;
    var dose = dosing({ dosePpm: readF('ct_dose_ppm'), controlFlow: ctrl, active: readF('ct_dose_act'), sg: readF('ct_dose_sg') });
    var doseOut = '';
    if (dose) {
      doseOut += row('Product feed', dose.Lday, 'Lday', 2, 'ok', fx('L/day = dose_ppm × flow_L/day / (1e6 × active × SG)', 'standard feed (not Nalco)', 'control = ' + (stream === 'bd' ? 'blowdown' : 'make-up') + ' ' + dsp(ctrl, 'flow', 2) + ' ' + U('flow')));
      doseOut += row('Product feed', dose.mlMin, null, 1, 'ok', '') .replace('—</span>', (dose.mlMin.toFixed(1)) + ' mL/min</span>');
      doseOut += '<div class="ct-flag info">HTI beside this: ' + (isN(wb.HTI) ? '<b>' + wb.HTI.toFixed(0) + ' h</b> — a long holding time means a slug dose persists far longer.' : 'enter system volume + blowdown for the holding time.') + '</div>';
      resultsRec.push({ label: 'Product feed', value: dose.Lday.toFixed(2) + ' L/day' });
    } else doseOut = '<p class="ct-note">Enter dose (ppm), product active fraction and SG. Needs a make-up or blowdown flow from the water balance.</p>';
    setHtml('ct_dose_out', doseOut);

    /* ---- F health ---- */
    var cs = readF('ct_cs', 'corr'), cu = readF('ct_cu', 'corr'), dpdF = readF('ct_dpdF'), orp = readF('ct_orp');
    var drifts = (document.getElementById('ct_drifts') || {}).value;
    var hOut = '';
    hOut += row('Carbon-steel corrosion', cs, 'corr', 1, isN(cs) ? (cs > S.csRed ? 'act' : cs > S.csAmber ? 'watch' : 'ok') : 'none', fx('acceptable < 76 µm/y (3 mpy)', 'Ch.16', 'amber ' + S.csAmber + '–' + S.csRed + ', red >' + S.csRed + ' µm/y'));
    hOut += row('Copper-alloy corrosion', cu, 'corr', 2, isN(cu) ? (cu > S.cuRed ? 'act' : cu > S.cuAmber ? 'watch' : 'ok') : 'none', fx('acceptable < 5 µm/y (0.2 mpy)', 'Ch.16', 'amber ' + S.cuAmber + '–' + S.cuRed + ', red >' + S.cuRed + ' µm/y'));
    hOut += row('Free halogen (DPD)', dpdF, 'ppm', 2, isN(dpdF) ? (dpdF >= S.halogenTarget ? 'ok' : 'watch') : 'none', fx('target ≥ ' + S.halogenTarget + ' mg/L', 'operator target', 'DPD working range to 5 mg/L'));
    hOut += row('ORP', orp, 'mV', 0, isN(orp) ? (orp >= S.orpTarget ? 'ok' : 'watch') : 'none', fx('target ≥ ' + S.orpTarget + ' mV', 'operator target', 'convenient oxidant-control measure'));
    if (isN(orp)) hOut += '<div class="ct-flag amber">⚠ ORP readings are affected by temperature and pH, and ORP does <b>not</b> work for stabilised halogens.</div>';
    if (drifts === 'bad') hOut += '<div class="ct-flag amber">⚠ Damaged drift eliminators: drift (not evaporated vapour) is the aerosol that can carry <i>Legionella</i> — repair is a direct health control.</div>';
    hOut += '<div class="ct-flag info">This tool flags risk; it does not certify safety. <i>Legionella</i> control depends on drift-eliminator condition, biocide programme and regular sampling.</div>';
    setHtml('ct_health_out', hOut);

    LAST = { summary: summaryParts.join('  ·  ') || 'No inputs yet', inputs: inputsRec, results: resultsRec };
  }

  // Build a result row: label, metric value, unit-kind, decimals, status, formula HTML, optional %ofR.
  function row(label, metricVal, kind, dp, status, formulaHtml, pct) {
    var has = isN(metricVal);
    var disp = has ? (kind ? dsp(metricVal, kind, dp) : metricVal.toFixed(dp)) : '—';
    var unit = kind ? (' ' + U(kind)) : '';
    var st = 'st-' + ({ ok: 'ok', watch: 'watch', act: 'act', none: 'none' }[status] || 'none');
    var pctTxt = (isN(pct)) ? ' <span class="ct-note" style="display:inline;">(' + pct.toFixed(1) + '% of R)</span>' : '';
    return '<div class="ct-row ' + (has ? '' : 'dim') + '">' +
      '<span class="k">' + label + (formulaHtml ? formulaHtml : '') + '</span>' +
      '<span class="v ' + (has ? st : '') + '">' + (has ? '<span class="ct-badge"></span>' : '') + disp + unit + pctTxt + '</span></div>';
  }
  function fx(formula, eq, constants) {
    return '<details class="ct-fx"><summary>ƒ formula · Nalco ' + esc(eq) + '</summary><div><code>' + esc(formula) + '</code>' + (constants ? '<br>' + esc(constants) : '') + '</div></details>';
  }
  function statusApproach() { return 'none'; }
  function setHtml(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }

  /* ---------- units toggle ---------- */
  function setUnits(u) {
    if (u === UNITS) return;
    // convert every registered numeric field's raw value between systems
    document.querySelectorAll('#ct_root input[data-kind]').forEach(function (el) {
      var v = el.value; if (v === '' || v == null) return; var n = +v; if (!isN(n)) return;
      var conv = convertBetween(n, el.getAttribute('data-kind'), UNITS, u);
      el.value = (Math.round(conv * 1e6) / 1e6);
    });
    UNITS = u; try { localStorage.setItem(UNITS_KEY, u); } catch (e) {}
    // re-render shell to refresh all unit labels, preserving current field values
    var vals = {}; document.querySelectorAll('#ct_root input,#ct_root select').forEach(function (el) { if (el.id) vals[el.id] = el.value; });
    mount(true);
    Object.keys(vals).forEach(function (id) { var el = document.getElementById(id); if (el) el.value = vals[id]; });
    recompute();
  }

  /* ---------- settings ---------- */
  function applySettings() {
    var n = {};
    Object.keys(DEFAULTS).forEach(function (k) { var el = document.getElementById('ct_set_' + k); if (el && el.value !== '') { var v = +el.value; if (isN(v)) n[k] = v; } });
    S = Object.assign(loadSettings(), n); saveSettings(S); if (typeof showToast === 'function') showToast('Settings saved'); recompute();
  }
  function resetSettings() { S = Object.assign({}, DEFAULTS); saveSettings(S); document.getElementById('ct_settings').style.display = 'none'; mount(true); recompute(); if (typeof showToast === 'function') showToast('Defaults restored'); }
  function toggle(id) { var el = document.getElementById(id); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; }

  /* ---------- copy / service report ---------- */
  function textSummary() {
    var lines = ['*Hadron — Cooling Tower reading*', new Date().toLocaleString(), ''];
    LAST.inputs.forEach(function (i) { lines.push('• ' + i.label + ': ' + i.value); });
    if (LAST.inputs.length) lines.push('');
    LAST.results.forEach(function (r) { lines.push(r.label + ': ' + r.value); });
    lines.push('', 'Units: ' + UNITS + '  ·  ' + LAST.summary);
    return lines.join('\n');
  }
  function copyText(btn) {
    recompute();
    var txt = textSummary();
    var done = function () { if (btn) { var o = btn.textContent; btn.textContent = '✓ Copied'; setTimeout(function () { btn.textContent = o; }, 1500); } if (typeof showToast === 'function') showToast('Copied — paste into WhatsApp or email'); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt, done); }); }
    else fallbackCopy(txt, done);
  }
  function fallbackCopy(txt, done) {
    var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { if (typeof showToast === 'function') showToast('Copy not supported — long-press to select'); }
    document.body.removeChild(ta);
  }
  function prefillServiceReport() {
    recompute();
    // The service report captures only pH / conductivity / free-Cl — push those across; the
    // full reading lives in History (Save reading) to avoid losing cooling-tower data.
    if (typeof openWindow !== 'function') return;
    openWindow('servicereport');
    if (typeof newServiceReport === 'function') { try { newServiceReport(); } catch (e) {} }
    setTimeout(function () {
      var map = { sr_ph: readFRaw('ct_idx_ph'), sr_cond: readFRaw('ct_ion_cond_r') || readFRaw('ct_idx_tds'), sr_fcl: readFRaw('ct_dpdF') };
      Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el && map[id] != null && el.value === '') el.value = map[id]; });
      if (typeof showToast === 'function') showToast('Key readings sent to service report');
    }, 250);
  }
  function readFRaw(id) { var el = document.getElementById(id); return el && el.value !== '' ? el.value : null; }

  /* ---------- mount ---------- */
  function mount(keepPanels) {
    var root = document.getElementById('ct_root');
    if (!root) return;
    injectStyles();
    root.innerHTML = shell();
    // live compute on any input/select change
    root.addEventListener('input', recompute);
    root.addEventListener('change', recompute);
  }

  window.coolingtowerOpen = function () { mount(); recompute(); };
  window.HG_CT = {
    // calc core (metric) — auditable + used by self-tests
    waterBalance: waterBalance, ionBalance: ionBalance, indices: indices, maxCycles: maxCycles, dosing: dosing,
    selfTest: selfTest, lastReading: function () { recompute(); return { inputs: LAST.inputs, results: LAST.results, summary: LAST.summary }; },
    setUnits: setUnits, toggle: toggle, applySettings: applySettings, resetSettings: resetSettings,
    copyText: copyText, prefillServiceReport: prefillServiceReport
  };

  // Run self-tests on load (assert), non-blocking.
  try { selfTest(); } catch (e) { console.error('[CT self-test] crashed', e); }
})();
