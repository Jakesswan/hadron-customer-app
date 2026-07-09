/*
 * Hadron Group — Boiler (steam-side) field calculator
 * ===================================================
 * On-site calculator for boiler water-side operation: mass balance & cycles,
 * maximum cycles from the limiting species, drum-pressure control limits, the
 * high-purity tracer method, and fuel/efficiency context.
 *
 * SOURCE OF TRUTH: The Nalco Water Handbook (3rd ed., Flynn, McGraw-Hill):
 *   Ch.9 "Boiler Systems" Eqs. 9.2–9.9 and Table 9.1; Ch.11 Table 11.5 (control
 *   limits vs drum pressure); Ch.31 Table 31.2 (combustion efficiency);
 *   Ch.33 Eqs. 33.10–33.12 (tracer methods). Each formula carries its Nalco
 *   number inline and in its "Show formula" expander.
 *
 * ⚠ CONVENTION: boiler blowdown/makeup are a percentage of FEEDWATER, and boiler
 *   COC = 100/%BD (Ch.9). This is DIFFERENT from the cooling-tower CR convention.
 *   This calc core is deliberately independent of coolingtower.js — no cooling-
 *   tower formula is used here.
 *
 * Field constraints: fully OFFLINE (no network/CDN), mobile-first, every input
 * optional, metric default with imperial toggle, colour-coded, editable settings.
 * Reuse: cross-links to the `dosage` tool for scavenger dosing (Section G) rather
 * than implementing a dose calc; does NOT reimplement anything from waterindex
 * (LSI/RSI is not applicable to phosphate-program boiler water). Shares the app's
 * Save-to-History (CALC_META), showToast, localStorage and the section/expander UX.
 * Entry point: window.boilerOpen(); calc core + self-tests: window.HG_BOILER.
 */
(function () {
  'use strict';

  /* ============================================================
     PALETTE — Hadron ERP theme (matches the rest of the Customer App).
     NOTE (keep this): every colour in this tool must stay on the app's ERP design
     palette — teal #3AAEDB, dark #2e3742, gold #f5a623, green #157b3a, red #c0392b.
     Do NOT introduce off-scheme brand hexes; keep the whole product one system.
     ============================================================ */
  var PAL = { charcoal: '#2e3742', teal: '#3AAEDB', gold: '#f5a623', ok: '#157b3a', watch: '#f5a623', action: '#c0392b' };

  /* ============================================================
     SETTINGS (editable thresholds) — persisted like the rest of the app
     ============================================================ */
  var SETTINGS_KEY = 'hadron_boiler_settings';
  var UNITS_KEY = 'hadron_boiler_units';
  var DEFAULTS = {
    cocHardCap: 50,       // Table 11.5 footnote: industrial boilers should not exceed 50 COC
    lowTdsFw: 5,          // mg/L: below this, feedwater TDS too low to measure — use tracers (Sec E)
    silicaRatioMin: 3,    // O(hydrate)-alkalinity : SiO2 must be >= 3:1 (Table 9.1 note)
    tracerR2Warn: 0.95,   // warn if least-squares R^2 below this (Ch.33)
    disagreePct: 1        // % mismatch between 9.7d and 9.7e that triggers a discrepancy warning
  };
  function loadSettings() { try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULTS); } }
  function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {} }
  var S = loadSettings();

  // Nalco Table 11.5 — control limits for PHOSPHATE-RESIDUAL programs vs drum pressure.
  // psigLo/psigHi gauge; TDS/PO4/SiO2/N2H4 mg/L; pH range. <600 psig uses soft-feedwater limits.
  var TABLE_115 = [
    { psigLo: 0, psigHi: 600, mpaLo: 0, mpaHi: 4.1, tds: null, po4: null, phLo: null, phHi: null, sio2: null, n2h4: null, note: 'use the same limits as for soft feedwaters' },
    { psigLo: 601, psigHi: 750, mpaLo: 4.1, mpaHi: 5.2, tds: 970, po4: '20–40', phLo: 9.8, phHi: 10.2, sio2: 30, n2h4: '0.04–0.06' },
    { psigLo: 751, psigHi: 900, mpaLo: 5.2, mpaHi: 6.2, tds: 750, po4: '15–25', phLo: 9.8, phHi: 10.2, sio2: 20, n2h4: '0.05–0.06' },
    { psigLo: 901, psigHi: 1000, mpaLo: 6.2, mpaHi: 6.9, tds: 600, po4: '15–25', phLo: 9.4, phHi: 9.7, sio2: 8, n2h4: '0.04–0.06' },
    { psigLo: 1001, psigHi: 1500, mpaLo: 6.9, mpaHi: 10.3, tds: 100, po4: '5–10', phLo: 9.4, phHi: 9.7, sio2: 2, n2h4: '0.04–0.06' },
    { psigLo: 1501, psigHi: 2000, mpaLo: 10.3, mpaHi: 13.8, tds: 50, po4: '5–10', phLo: 9.4, phHi: 9.7, sio2: 1, n2h4: '0.04–0.06' }
  ];
  // Nalco Table 31.2 — typical combustion efficiency by fuel (%), estimation only.
  var FUELS = [['coal', 'Coal', 89], ['wood', 'Wood', 74], ['oil2', 'No. 2 Oil', 88], ['oil6', 'No. 6 Oil', 88], ['gas', 'Natural Gas', 85]];
  // Species for the limiting-species table (Table 9.1 style).
  var SPECIES = [['tds', 'TDS'], ['sio2', 'Silica (SiO₂)'], ['ca', 'Ca hardness'], ['alk', 'M-alkalinity'], ['fe', 'Iron'], ['cu', 'Copper']];

  /* ============================================================
     UNITS — metric canonical; imperial for display. Round-trip safe.
     ============================================================ */
  var UNITS = (function () { try { return localStorage.getItem(UNITS_KEY) === 'imperial' ? 'imperial' : 'metric'; } catch (e) { return 'metric'; } })();
  var K = { flow: 2.2046226, press: 145.0377, vol: 264.172052 }; // kg/h→lb/h, MPa→psi, m³→US gal
  function c2f(c) { return c * 9 / 5 + 32; } function f2c(f) { return (f - 32) * 5 / 9; }
  function toMetric(v, kind) {
    if (v == null || isNaN(v)) return null;
    if (UNITS === 'metric') return v;
    switch (kind) { case 'flow': return v / K.flow; case 'press': return v / K.press; case 'vol': return v / K.vol; case 'tempAbs': return f2c(v); default: return v; }
  }
  function toDisplay(v, kind) {
    if (v == null || isNaN(v)) return null;
    if (UNITS === 'metric') return v;
    switch (kind) { case 'flow': return v * K.flow; case 'press': return v * K.press; case 'vol': return v * K.vol; case 'tempAbs': return c2f(v); default: return v; }
  }
  function convertBetween(v, kind, from, to) {
    if (v == null || isNaN(v) || from === to) return v;
    var m = (from === 'metric') ? v : (function () { switch (kind) { case 'flow': return v / K.flow; case 'press': return v / K.press; case 'vol': return v / K.vol; case 'tempAbs': return f2c(v); default: return v; } })();
    if (to === 'metric') return m;
    switch (kind) { case 'flow': return m * K.flow; case 'press': return m * K.press; case 'vol': return m * K.vol; case 'tempAbs': return c2f(m); default: return m; }
  }
  function U(kind) {
    var m = { flow: 'kg/h', press: 'MPag', tempAbs: '°C', vol: 'm³', conc: 'mg/L', cond: 'µS/cm', pct: '%', h: 'h' };
    var i = { flow: 'lb/h', press: 'psig', tempAbs: '°F', vol: 'US gal', conc: 'mg/L', cond: 'µS/cm', pct: '%', h: 'h' };
    return (UNITS === 'imperial' ? i : m)[kind] || '';
  }

  /* ============================================================
     PURE CALC CORE — all metric; each formula tagged with its Nalco number.
     ============================================================ */
  function isN(v) { return typeof v === 'number' && isFinite(v); }
  function num(v) { return isN(v) ? v : (v == null || v === '' || isNaN(+v) ? null : +v); }

  // A. MASS BALANCE & CYCLES (Nalco Ch.9). x = metric inputs; `gate` = sampling acks OK.
  function massBalance(x, gate, s) {
    s = s || S;
    var r = {};
    var S_ = num(x.S), FW = num(x.FW), MU = num(x.MU), BD = num(x.BD), RC = num(x.RC), NRC = num(x.NRC), DA = num(x.DA), Vv = num(x.Vvent);
    var COCt = num(x.COCtarget);

    // Chemistry COC / %BD — GATED behind the two sampling acknowledgements.
    var cocChem = null;
    r.lowTds = isN(x.tdsFW) && x.tdsFW > 0 && x.tdsFW < s.lowTdsFw;   // demin makeup: TDS too low → use tracers
    if (gate && isN(x.tdsFW) && isN(x.tdsBD) && x.tdsFW > 0 && x.tdsBD > 0 && !r.lowTds) {
      r.pctBD_chem = 100 * x.tdsFW / x.tdsBD;                          // 9.4  %BD = 100·TDS_FW/TDS_BD
      cocChem = x.tdsBD / x.tdsFW;                                    // 9.7a COC = BW conc / FW conc (=100/%BD, 9.6)
      r.cocChem = cocChem;
    }
    if (gate && isN(x.tdsFW) && isN(x.tdsMU) && isN(x.tdsC) && (x.tdsMU - x.tdsC) !== 0) {
      r.pctMU_chem = 100 * (x.tdsFW - x.tdsC) / (x.tdsMU - x.tdsC);   // 9.5  %MU
    }

    // Flow COC / %BD
    if (isN(BD) && isN(FW) && FW > 0) { r.pctBD_flow = 100 * BD / FW; r.cocFlow = 100 / r.pctBD_flow; }   // 9.2 → 9.6
    if (isN(MU) && isN(FW) && FW > 0) r.pctMU_flow = 100 * MU / FW;    // 9.3

    // Resolve a working COC (chemistry preferred, then flows, then 9.7b, then target)
    var COC = cocChem, cocBasis = cocChem ? 'chem (9.7a)' : null;
    if (!isN(COC) && isN(r.cocFlow)) { COC = r.cocFlow; cocBasis = 'flows (9.2)'; }
    if (!isN(COC) && isN(S_) && isN(BD) && BD > 0) { COC = (S_ + BD) / BD; cocBasis = '9.7b'; }            // 9.7b (S+BD)/BD
    if (!isN(COC) && isN(COCt)) { COC = COCt; cocBasis = 'target'; }
    r.COC = COC; r.cocBasis = cocBasis;
    r.cocOverCap = isN(COC) && COC > s.cocHardCap;                     // Table 11.5 footnote: >50 not allowed

    // Derive BD / FW from S + COC (9.7c/d/e), with the 9.7d vs 9.7e agreement check.
    if (isN(S_) && isN(COC) && COC > 1) {
      r.BD = S_ / (COC - 1);                                           // 9.7c  BD = S/(COC−1)
      r.FW = S_ + r.BD;                                               // 9.7d  FW = S + BD
      r.FW_alt = S_ * COC / (COC - 1);                               // 9.7e  FW = S·COC/(COC−1)
      r.fwDisagree = Math.abs(r.FW - r.FW_alt) > Math.abs(r.FW_alt) * s.disagreePct / 100;
      r.cocBack = 100 / (100 * r.BD / r.FW);                          // 9.6 round-trip
    } else if (isN(FW) && isN(S_)) {
      r.BD_fromDiff = FW - S_;                                         // 9.7f  BD = FW − S  (cautioned: two large meters)
    }

    // Percentages actually shown (prefer flow, else derived)
    r.pctBD = isN(r.pctBD_flow) ? r.pctBD_flow : (isN(r.BD) && isN(r.FW) ? 100 * r.BD / r.FW : (isN(r.pctBD_chem) ? r.pctBD_chem : null));
    r.pctMU = isN(r.pctMU_flow) ? r.pctMU_flow : r.pctMU_chem;
    if (isN(r.pctBD) && !isN(r.COC)) { r.COC = 100 / r.pctBD; }        // 9.6

    // Balance identities (informational)
    if (isN(MU) && isN(RC) && isN(DA)) r.FW_balance = MU + RC + DA - (Vv || 0);   // 9.8  FW = MU + RC + DA − V
    if (isN(RC) && isN(NRC)) r.S_balance = RC + NRC;                              // 9.9  S = RC + NRC
    r.S = S_; r.gate = gate;
    return r;
  }

  // C. MAXIMUM CYCLES FROM THE LIMITING SPECIES (Table 9.1). rows: {key,label,fw,limit}
  function maxCycles(rows, s) {
    s = s || S;
    var out = rows.map(function (r) {
      var coc = (isN(r.fw) && r.fw > 0 && isN(r.limit)) ? r.limit / r.fw : null;   // COC_max = boiler_limit / FW_conc
      return { key: r.key, label: r.label, fw: r.fw, limit: r.limit, coc: coc };
    }).filter(function (r) { return isN(r.coc); });
    if (!out.length) return null;
    var sorted = out.slice().sort(function (a, b) { return a.coc - b.coc; });
    var limiting = sorted[0];
    var pctBD = 100 / limiting.coc;                                                // %BD = 100/COC_max (9.6)
    var opportunity = null;
    if (sorted.length > 1) {
      var next = sorted[1];
      var pctBD2 = 100 / next.coc;
      opportunity = { limiting: limiting.label, next: next.label, nextCoc: next.coc, pctBD: pctBD, pctBD2: pctBD2, savingPct: (pctBD - pctBD2) / pctBD * 100 };
    }
    return { rows: out, sorted: sorted, limiting: limiting.label, practicalMax: limiting.coc, pctBD: pctBD, opportunity: opportunity };
  }

  // Silica inhibition: O(hydrate)-alkalinity : SiO2 must be >= silicaRatioMin (default 3:1).
  function silicaRatio(ohAlk, sio2, s) {
    s = s || S;
    if (!(isN(ohAlk) && isN(sio2) && sio2 > 0)) return null;
    var ratio = ohAlk / sio2;
    return { ratio: ratio, ok: ratio >= s.silicaRatioMin };
  }

  // D. CONTROL LIMITS vs DRUM PRESSURE (Table 11.5). pressureMPa (gauge) → limit row.
  function controlLimits(pressureMPa) {
    if (!isN(pressureMPa)) return null;
    for (var i = 0; i < TABLE_115.length; i++) { if (pressureMPa >= TABLE_115[i].mpaLo && pressureMPa < TABLE_115[i].mpaHi) return TABLE_115[i]; }
    return TABLE_115[TABLE_115.length - 1];
  }

  // E. TRACER METHOD (Ch.33). Least-squares fit of ln(Ct) vs t: slope = −BD/V (33.10).
  function tracerFit(points, Vmetric, s) {
    s = s || S;
    var pts = points.filter(function (p) { return isN(p.t) && isN(p.Ct) && p.Ct > 0; }).map(function (p) { return { x: p.t, y: Math.log(p.Ct) }; });
    var n = pts.length; if (n < 2) return null;
    var sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
    var denom = n * sxx - sx * sx; if (denom === 0) return null;
    var slope = (n * sxy - sx * sy) / denom;
    var intercept = (sy - slope * sx) / n;
    var ybar = sy / n, ssTot = 0, ssRes = 0;
    pts.forEach(function (p) { var yh = slope * p.x + intercept; ssRes += (p.y - yh) * (p.y - yh); ssTot += (p.y - ybar) * (p.y - ybar); });
    var r2 = ssTot > 0 ? 1 - ssRes / ssTot : 1;
    var bdOverV = -slope;                                             // 33.10  slope = −BD/V
    var BD = (isN(Vmetric) && Vmetric > 0) ? bdOverV * Vmetric : null;
    return { slope: slope, intercept: intercept, Ci: Math.exp(intercept), r2: r2, n: n, bdOverV: bdOverV, BD: BD, lowR2: r2 < s.tracerR2Warn };
  }

  /* ============================================================
     SELF-TESTS — assert on load; runnable via window.HG_BOILER.selfTest()
     ============================================================ */
  function selfTest() {
    var out = [], ok = true;
    function ap(a, b, tolPct, name) { var pass = isN(a) && Math.abs(a - b) <= Math.abs(b) * tolPct / 100 + 1e-9; if (!pass) ok = false; out.push((pass ? 'PASS ' : 'FAIL ') + name + ' got ' + (isN(a) ? a.toFixed(3) : a) + ' exp ' + b); }
    function assert(cond, name) { if (!cond) ok = false; out.push((cond ? 'PASS ' : 'FAIL ') + name); }

    // 1) Table 9.1 worked example
    var mc = maxCycles([{ key: 'tds', label: 'TDS', fw: 75, limit: 2000 }, { key: 'sio2', label: 'Silica', fw: 1.5, limit: 30 }], DEFAULTS);
    ap(mc.rows.find(function (r) { return r.key === 'tds'; }).coc, 26.7, 1, '9.1 TDS COC_max');
    ap(mc.rows.find(function (r) { return r.key === 'sio2'; }).coc, 20.0, 1, '9.1 SiO2 COC_max');
    assert(mc.limiting === 'Silica', '9.1 limiting = Silica');
    ap(mc.practicalMax, 20, 1, '9.1 practical max COC');
    ap(mc.pctBD, 5.0, 1, '9.1 %BD');
    // after silica reduction (FW SiO2 1.5 → 1.0): limiting switches to TDS 26.7, %BD 3.75, 25% reduction
    var mc2 = maxCycles([{ key: 'tds', label: 'TDS', fw: 75, limit: 2000 }, { key: 'sio2', label: 'Silica', fw: 1.0, limit: 30 }], DEFAULTS);
    assert(mc2.limiting === 'TDS', '9.1 post-reduction limiting = TDS');
    ap(mc2.pctBD, 3.75, 1, '9.1 post-reduction %BD');
    ap((mc.pctBD - mc2.pctBD) / mc.pctBD * 100, 25, 2, '9.1 blowdown reduction %');

    // 2) internal consistency S=10000, COC=20
    var mb = massBalance({ S: 10000, COCtarget: 20 }, true, DEFAULTS);
    ap(mb.BD, 526.3, 0.5, '9.7c BD');
    ap(mb.FW, 10526.3, 0.5, '9.7d FW');
    ap(mb.FW_alt, 10526.3, 0.5, '9.7e FW');
    assert(!mb.fwDisagree, '9.7d/9.7e agree');
    ap(100 * mb.BD / mb.FW, 5.0, 0.5, '9.2 %BD');
    ap(mb.cocBack, 20, 0.5, '9.6 COC round-trip');
    ap((mb.S + mb.BD) / mb.BD, 20, 0.5, '9.7b COC');

    // 3) COC 51 → over-cap flag
    var mb51 = massBalance({ S: 10000, COCtarget: 51 }, true, DEFAULTS);
    assert(mb51.cocOverCap === true, '3) COC 51 raises >50 cap flag');
    assert(massBalance({ S: 10000, COCtarget: 49 }, true, DEFAULTS).cocOverCap === false, '3) COC 49 no cap flag');

    // 4) TDS-derived results gated — chem COC null until gate true
    var gOff = massBalance({ tdsFW: 75, tdsBD: 1500 }, false, DEFAULTS);
    var gOn = massBalance({ tdsFW: 75, tdsBD: 1500 }, true, DEFAULTS);
    assert(!isN(gOff.cocChem) && isN(gOn.cocChem), '4) chem COC gated by sampling acks');

    // 5) silica O-alk:SiO2 ratio
    assert(silicaRatio(25, 10, DEFAULTS).ok === false, '5) 2.5:1 flags red');
    assert(silicaRatio(35, 10, DEFAULTS).ok === true, '5) 3.5:1 ok');

    // 6) unit round-trip
    var rt = true;
    [['flow', 10000], ['press', 6.9], ['tempAbs', 105], ['vol', 12]].forEach(function (p) { var b = convertBetween(convertBetween(p[1], p[0], 'metric', 'imperial'), p[0], 'imperial', 'metric'); if (Math.abs(b - p[1]) > 1e-6) rt = false; });
    assert(rt, '6) unit round-trip metric→imperial→metric');

    // 7) tracer least-squares fit (Ct = 100·e^(−0.05t)) — decay rate, R², volumetric BD
    var tf = tracerFit([{ t: 0, Ct: 100 }, { t: 1, Ct: 95.123 }, { t: 2, Ct: 90.484 }, { t: 3, Ct: 86.071 }, { t: 4, Ct: 81.873 }], 12, DEFAULTS);
    ap(tf.bdOverV, 0.05, 2, '33.10 decay rate BD/V');
    ap(tf.r2, 1.0, 0.5, '33.10 R²');
    ap(tf.BD, 0.6, 2, '33.10 BD volumetric (m³/h)');

    out.forEach(function (l) { (l.indexOf('FAIL') === 0 ? console.error : console.log)('[Boiler self-test] ' + l); });
    console.log('[Boiler self-test] ' + (ok ? 'ALL PASS' : 'FAILURES ABOVE'));
    return { ok: ok, lines: out };
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fg(id, label, kind, ph) {
    var unit = kind ? (' (' + U(kind) + ')') : '';
    return '<div class="bo-fg"><label>' + esc(label) + unit + '</label><input type="number" inputmode="decimal" id="' + id + '" data-kind="' + (kind || 'plain') + '" step="any" placeholder="' + (ph || '') + '"></div>';
  }
  function injectStyles() {
    if (document.getElementById('boiler-styles')) return;
    var css =
      '#bo_root{--bo-char:' + PAL.charcoal + ';--bo-teal:' + PAL.teal + ';--bo-gold:' + PAL.gold + ';--bo-ok:' + PAL.ok + ';--bo-watch:' + PAL.watch + ';--bo-act:' + PAL.action + ';}' +
      '#bo_root .bo-lead{font-size:13px;color:#6b7684;margin:0 0 12px;}' +
      '#bo_root .bo-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;}' +
      '#bo_root .bo-seg{display:inline-flex;border:1.5px solid var(--bo-teal);border-radius:10px;overflow:hidden;}' +
      '#bo_root .bo-seg button{border:0;background:#fff;color:var(--bo-teal);font-weight:700;padding:9px 16px;font-size:14px;cursor:pointer;}' +
      '#bo_root .bo-seg button.on{background:var(--bo-teal);color:#fff;}' +
      'body.dark #bo_root .bo-seg button{background:#0F172A;} body.dark #bo_root .bo-seg button.on{background:var(--bo-teal);color:#fff;}' +
      '#bo_root details.bo-sec{border:1px solid #e3e9ee;border-left:4px solid var(--bo-teal);border-radius:12px;margin-bottom:12px;background:#fff;overflow:hidden;}' +
      'body.dark #bo_root details.bo-sec{background:#0F172A;border-color:#1A222F;}' +
      '#bo_root details.bo-sec[data-accent="gold"]{border-left-color:var(--bo-gold);}' +
      'body.dark #bo_root details.bo-sec[data-accent="gold"]{border-left-color:var(--bo-gold);}' +
      '#bo_root summary.bo-head{list-style:none;cursor:pointer;padding:14px 16px;font-weight:800;font-size:15px;color:var(--bo-char);display:flex;justify-content:space-between;align-items:center;}' +
      'body.dark #bo_root summary.bo-head{color:#e8ecef;}' +
      '#bo_root summary.bo-head::-webkit-details-marker{display:none;}' +
      '#bo_root summary.bo-head .bo-chev{color:var(--bo-teal);font-size:13px;}' +
      '#bo_root .bo-body{padding:0 16px 16px;}' +
      '#bo_root .bo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;}' +
      '#bo_root .bo-fg label{display:block;font-size:12px;font-weight:600;color:#5a6a76;margin-bottom:4px;}' +
      'body.dark #bo_root .bo-fg label{color:#9aa3aa;}' +
      '#bo_root .bo-fg input,#bo_root .bo-fg select{width:100%;padding:12px;font-size:16px;border:1px solid #d7dee4;border-radius:10px;background:#fff;color:var(--bo-char);}' +
      'body.dark #bo_root .bo-fg input,body.dark #bo_root .bo-fg select{background:#111a24;border-color:#28323d;color:#e8ecef;}' +
      '#bo_root .bo-fg input:focus{outline:2px solid var(--bo-teal);border-color:var(--bo-teal);}' +
      '#bo_root .bo-res{margin-top:12px;border-top:1px dashed #dce3e9;padding-top:10px;}' +
      '#bo_root .bo-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f0f3f6;}' +
      'body.dark #bo_root .bo-row{border-color:#1A222F;}' +
      '#bo_root .bo-row.dim{opacity:.45;}' +
      '#bo_root .bo-row .k{font-size:13px;color:var(--bo-char);}' +
      'body.dark #bo_root .bo-row .k{color:#c8cfd6;}' +
      '#bo_root .bo-row .v{font-weight:800;font-size:16px;white-space:nowrap;}' +
      '#bo_root .bo-badge{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:7px;vertical-align:middle;}' +
      '#bo_root .st-ok{color:var(--bo-ok);} #bo_root .st-ok .bo-badge{background:var(--bo-ok);}' +
      '#bo_root .st-watch{color:var(--bo-watch);} #bo_root .st-watch .bo-badge{background:var(--bo-watch);}' +
      '#bo_root .st-act{color:var(--bo-act);} #bo_root .st-act .bo-badge{background:var(--bo-act);}' +
      '#bo_root .bo-fx{margin:2px 0 8px;}' +
      '#bo_root .bo-fx summary{cursor:pointer;font-size:11px;color:var(--bo-teal);font-weight:700;}' +
      '#bo_root .bo-fx div{font-size:12px;color:#5a6a76;background:#f5f8fa;border-radius:8px;padding:8px 10px;margin-top:5px;line-height:1.5;}' +
      'body.dark #bo_root .bo-fx div{background:#11202e;color:#b5c4cf;}' +
      '#bo_root .bo-fx code{font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--bo-char);}' +
      'body.dark #bo_root .bo-fx code{color:#9fe6f0;}' +
      '#bo_root .bo-flag{border-radius:10px;padding:10px 12px;margin:8px 0;font-size:13px;line-height:1.5;}' +
      '#bo_root .bo-flag.red{background:rgba(192,57,43,.10);border:1px solid rgba(192,57,43,.4);color:#8e2419;}' +
      '#bo_root .bo-flag.amber{background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.5);color:#8a5a00;}' +
      '#bo_root .bo-flag.info{background:rgba(58,174,219,.10);border:1px solid rgba(58,174,219,.4);color:#1f6f7a;}' +
      'body.dark #bo_root .bo-flag.info{color:#8fd3dd;} body.dark #bo_root .bo-flag.amber{color:#f0c674;} body.dark #bo_root .bo-flag.red{color:#f5b0a6;}' +
      '#bo_root .bo-gate{background:rgba(245,166,35,.10);border:1px solid rgba(245,166,35,.45);border-radius:12px;padding:12px 14px;margin-bottom:12px;}' +
      '#bo_root .bo-gate label{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--bo-char);margin:8px 0;cursor:pointer;line-height:1.45;}' +
      'body.dark #bo_root .bo-gate label{color:#e8ecef;}' +
      '#bo_root .bo-gate input{width:22px;height:22px;flex-shrink:0;margin-top:1px;}' +
      '#bo_root table.bo-t{width:100%;border-collapse:collapse;font-size:13px;min-width:340px;}' +
      '#bo_root table.bo-t th{text-align:left;color:#6b7684;padding:4px;font-weight:600;}' +
      '#bo_root table.bo-t td{padding:3px 4px;}' +
      '#bo_root table.bo-t input{width:84px;padding:9px;font-size:15px;border:1px solid #d7dee4;border-radius:8px;}' +
      'body.dark #bo_root table.bo-t input{background:#111a24;border-color:#28323d;color:#e8ecef;}' +
      '#bo_root .bo-actions{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 4px;}' +
      '#bo_root .bo-btn{border:0;border-radius:10px;padding:12px 16px;font-size:14px;font-weight:700;cursor:pointer;}' +
      '#bo_root .bo-btn.teal{background:var(--bo-teal);color:#fff;} #bo_root .bo-btn.gold{background:var(--bo-gold);color:#fff;} #bo_root .bo-btn.ghost{background:#fff;color:var(--bo-char);border:1px solid #cdd6dd;}' +
      'body.dark #bo_root .bo-btn.ghost{background:#0F172A;color:#e8ecef;border-color:#28323d;}' +
      '#bo_root .bo-note{font-size:11.5px;color:#8a97a4;margin:6px 0 0;line-height:1.5;}';
    var st = document.createElement('style'); st.id = 'boiler-styles'; st.textContent = css; document.head.appendChild(st);
  }

  function sec(id, title, open, accent, body) {
    return '<details class="bo-sec" id="' + id + '" data-accent="' + accent + '"' + (open ? ' open' : '') + '><summary class="bo-head">' + esc(title) + '<span class="bo-chev">▾</span></summary><div class="bo-body">' + body + '</div></details>';
  }
  function shell() {
    var h = '';
    h += '<h2 style="margin:0 0 2px;">Boiler / Steam Field Calculator</h2>';
    h += '<p class="bo-lead">Water-side mass balance, cycles, limiting-species max cycles and drum-pressure control limits. Nalco Water Handbook (3rd ed.) Ch.9/11/31/33. Boiler blowdown is a % of <b>feedwater</b>; COC = 100/%BD.</p>';
    h += '<div class="bo-toolbar"><div class="bo-seg"><button id="bo_um" class="' + (UNITS === 'metric' ? 'on' : '') + '" onclick="HG_BOILER.setUnits(\'metric\')">Metric</button><button id="bo_ui" class="' + (UNITS === 'imperial' ? 'on' : '') + '" onclick="HG_BOILER.setUnits(\'imperial\')">Imperial</button></div>' +
      '<button class="bo-btn ghost" onclick="HG_BOILER.toggle(\'bo_help\')">How to use</button><button class="bo-btn ghost" onclick="HG_BOILER.toggle(\'bo_settings\')">⚙ Settings</button></div>';
    h += '<div id="bo_help" style="display:none;">' + helpPanel() + '</div>';
    h += '<div id="bo_settings" style="display:none;">' + settingsPanel() + '</div>';

    // B — SAMPLING GATE (prominent, top)
    h += '<div class="bo-gate"><div style="font-weight:800;color:var(--bo-char);margin-bottom:2px;">⚠ Sampling validity — required for any TDS/conductivity result</div>' +
      '<label><input type="checkbox" id="bo_ack1"><span>Feedwater sample was taken <b>after all chemicals were added</b>.</span></label>' +
      '<label><input type="checkbox" id="bo_ack2"><span>Boiler-water sample was <b>neutralised before</b> measuring conductivity.</span></label>' +
      '<p class="bo-note">Hydrate (OH) alkalinity greatly raises sample conductivity, which understates boiler TDS and gives a <b>falsely low % blowdown</b> — you would believe the boiler is cycling harder than it is (Nalco Ch.9).</p></div>';

    // C — MAX CYCLES (headline)
    h += sec('bo_sec_max', 'Maximum cycles from the limiting species — headline', true, 'gold',
      '<p class="bo-note">Enter the feedwater concentration and the boiler-water limit for each species you control. COC_max = boiler limit ÷ feedwater concentration; the smallest wins. (Nalco Table 9.1.)</p>' +
      '<div style="overflow-x:auto;"><table class="bo-t"><tr><th>Species</th><th>Feedwater</th><th>Boiler limit</th></tr>' +
      SPECIES.map(function (sp) { return '<tr><td style="font-weight:600;">' + sp[1] + '</td><td><input type="number" inputmode="decimal" id="bo_lim_' + sp[0] + '_f"></td><td><input type="number" inputmode="decimal" id="bo_lim_' + sp[0] + '_l"></td></tr>'; }).join('') +
      '</table></div><div id="bo_max_out"></div>' +
      '<div class="bo-grid" style="margin-top:10px;">' + fg('bo_ohalk', 'O (hydrate) alkalinity', 'conc', 'e.g. 40') + fg('bo_sio2bw', 'Boiler-water SiO₂', 'conc', 'e.g. 10') + '</div><div id="bo_silica_out"></div>');

    // A — MASS BALANCE
    h += sec('bo_sec_mb', 'Mass balance & cycles', true, 'teal',
      '<div class="bo-grid">' +
      fg('bo_S', 'Steam flow S', 'flow', 'e.g. 10000') + fg('bo_FW', 'Feedwater FW', 'flow', 'optional') +
      fg('bo_BD', 'Blowdown BD', 'flow', 'optional') + fg('bo_MU', 'Makeup MU', 'flow', 'optional') +
      fg('bo_COCt', 'Target COC', null, 'e.g. 20') +
      fg('bo_RC', 'Returned condensate RC', 'flow', 'optional') + fg('bo_NRC', 'Non-returned cond. NRC', 'flow', 'optional') +
      fg('bo_DA', 'Deaerator steam DA', 'flow', 'optional') + fg('bo_Vv', 'DA vent V', 'flow', 'optional') +
      fg('bo_tdsMU', 'TDS makeup', 'conc', 'optional') + fg('bo_tdsFW', 'TDS feedwater', 'conc', 'optional') +
      fg('bo_tdsC', 'TDS condensate', 'conc', 'optional') + fg('bo_tdsBD', 'TDS boiler water', 'conc', 'optional') +
      '</div><div id="bo_mb_out" class="bo-res"></div>');

    // D — CONTROL LIMITS
    h += sec('bo_sec_lim', 'Control limits vs drum pressure (phosphate program)', false, 'teal',
      '<div class="bo-grid">' + fg('bo_press', 'Drum pressure', 'press', 'e.g. 6.9') +
      fg('bo_r_tds', 'Boiler TDS reading', 'conc', 'optional') + fg('bo_r_po4', 'PO₄ reading', 'conc', 'optional') +
      fg('bo_r_ph', 'pH reading', null, 'optional') + fg('bo_r_sio2', 'SiO₂ reading', 'conc', 'optional') +
      fg('bo_r_n2h4', 'N₂H₄ (feedwater)', 'conc', 'optional') + '</div><div id="bo_lim_out" class="bo-res"></div>');

    // E — TRACER
    h += sec('bo_sec_tr', 'High-purity / tracer method (demineralised makeup)', false, 'teal',
      '<p class="bo-note">When TDS is too low to measure, slug-dose an inert tracer and enter its decay. Least-squares fit of ln(Ct) vs t gives slope = −BD/V. (Nalco Ch.33.)</p>' +
      '<div class="bo-grid">' + fg('bo_tr_V', 'Boiler water volume V', 'vol', 'e.g. 12') + fg('bo_tr_S', 'Steam flow S', 'flow', 'optional') + '</div>' +
      '<div style="overflow-x:auto;margin-top:8px;"><table class="bo-t"><tr><th>t (h)</th><th>Tracer Cₜ (mg/L)</th></tr>' +
      [0, 1, 2, 3, 4].map(function (i) { return '<tr><td><input type="number" inputmode="decimal" id="bo_tr_t' + i + '"></td><td><input type="number" inputmode="decimal" id="bo_tr_c' + i + '"></td></tr>'; }).join('') +
      '</table></div><div id="bo_tr_out" class="bo-res"></div>' +
      '<div class="bo-grid" style="margin-top:8px;">' + fg('bo_ct_bw', 'Continuous tracer — boiler water', 'conc', 'optional') + fg('bo_ct_fw', 'Continuous tracer — feedwater', 'conc', 'optional') + '</div><div id="bo_ct_out"></div>');

    // F — FUEL
    h += sec('bo_sec_fuel', 'Fuel & efficiency context', false, 'teal',
      '<div class="bo-grid"><div class="bo-fg"><label>Fuel type</label><select id="bo_fuel">' + FUELS.map(function (f) { return '<option value="' + f[0] + '">' + f[1] + ' (' + f[2] + '%)</option>'; }).join('') + '</select></div>' +
      fg('bo_eff', 'Efficiency override %', null, 'optional') + fg('bo_fuelPrice', 'Fuel price (per unit)', null, 'optional') + '</div><div id="bo_fuel_out" class="bo-res"></div>' +
      '<div class="bo-flag amber">⚠ Boiler efficiency varies with firing rate — a single arbitrary efficiency rating is "meaningless and apt to be misleading" (Nalco Ch.31). These are typical values for estimation only; proper analysis needs the boiler\'s performance curves.</div>');

    // G — O2 SCAVENGER INFO
    h += sec('bo_sec_o2', 'Oxygen scavenging (information only)', false, 'teal',
      '<div class="bo-flag info">This tool does <b>not</b> compute a scavenger dose — the Handbook names the scavengers (sulfite, hydrazine, carbohydrazide, erythorbate) but publishes no scavenger:oxygen stoichiometry, so it cannot be grounded here.</div>' +
      '<ul style="font-size:13px;line-height:1.7;color:#5a6a76;margin:0;padding-left:18px;">' +
      '<li>A pressure deaerator can reduce O₂ to <b>&lt; 10 µg/L</b>; chemical scavenging is the <b>last opportunity</b> to remove the remaining traces before O₂ enters the boiler.</li>' +
      '<li>Injection point matters: into the water downcomer between vessels (with an injection quill), or below the water line of the storage tank, fed at both ends or via a distributing header. A single central injection point mixes poorly and often fails to give enough contact time.</li></ul>' +
      '<button class="bo-btn ghost" style="margin-top:10px;" onclick="if(typeof openWindow===\'function\')openWindow(\'dosage\')">Open the Dosage tool for a product dose →</button>');

    // actions
    h += '<div class="bo-actions">' +
      '<button class="bo-btn teal save-calc-btn" style="background:var(--bo-teal);" onclick="saveCalculation(\'boiler\', this)">💾 Save reading</button>' +
      '<button class="bo-btn gold" onclick="HG_BOILER.copyText(this)">📋 Copy as text</button>' +
      '<button class="bo-btn ghost" onclick="HG_BOILER.prefillServiceReport()">📝 To service report</button>' +
      '<button class="bo-btn ghost pdf-calc-btn" onclick="exportPdf(\'boiler\')">📄 PDF</button></div>';
    return h;
  }

  function settingsPanel() {
    var f = [['cocHardCap', 'Max COC (industrial cap)'], ['lowTdsFw', 'Low FW TDS threshold mg/L'], ['silicaRatioMin', 'Min O-alk : SiO₂ ratio'], ['tracerR2Warn', 'Tracer R² warn below'], ['disagreePct', '9.7d/9.7e disagree %']];
    return '<div class="bo-sec" style="border-left-color:var(--bo-gold);padding:14px 16px;"><div style="font-weight:800;color:var(--bo-char);margin-bottom:8px;">Thresholds</div><div class="bo-grid">' +
      f.map(function (x) { return '<div class="bo-fg"><label>' + x[1] + '</label><input type="number" inputmode="decimal" id="bo_set_' + x[0] + '" step="any" value="' + S[x[0]] + '"></div>'; }).join('') +
      '</div><div class="bo-actions"><button class="bo-btn teal" style="background:var(--bo-teal);" onclick="HG_BOILER.applySettings()">Save settings</button><button class="bo-btn ghost" onclick="HG_BOILER.resetSettings()">Reset defaults</button></div></div>';
  }
  function helpPanel() {
    return '<div class="bo-sec" style="border-left-color:var(--bo-gold);padding:14px 16px;"><div style="font-weight:800;color:var(--bo-char);margin-bottom:6px;">Using this on site — read the two gotchas first</div>' +
      '<ol style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#5a6a76;">' +
      '<li><b>Gotcha 1 — feedwater timing:</b> take the feedwater sample <b>after</b> all chemical is added, or %BD is wrong.</li>' +
      '<li><b>Gotcha 2 — neutralise the boiler-water sample</b> before reading conductivity; OH-alkalinity inflates conductivity and gives a falsely LOW %BD (you think you are cycling harder than you are). Both are locked behind the tick-boxes above.</li>' +
      '<li><b>Demin makeup?</b> Feedwater TDS is too low to measure — the TDS calcs do not apply; use the tracer method (Section E).</li>' +
      '<li><b>Start with the limiting species</b> (headline): it sets your practical max cycles and the minimum blowdown; reducing it in makeup cuts blowdown → fuel + water savings.</li>' +
      '<li>Every result has a <b>Show formula</b> link with its Nalco equation/table number.</li>' +
      '<li>Colours: <span style="color:' + PAL.ok + ';font-weight:700;">green</span> OK · <span style="color:' + PAL.watch + ';font-weight:700;">amber</span> watch · <span style="color:' + PAL.action + ';font-weight:700;">red</span> action. <b>Thermal</b> efficiency is heat-to-water; <b>fuel-to-steam</b> efficiency also counts stack + radiation losses.</li></ol>' +
      '<p class="bo-note">This tool flags risk; it does not certify safety. Confirm against your treatment programme.</p></div>';
  }

  /* ---------- read + compute ---------- */
  function readF(id, kind) { var el = document.getElementById(id); if (!el) return null; var v = el.value; if (v === '' || v == null) return null; var n = +v; return isN(n) ? toMetric(n, kind || el.getAttribute('data-kind')) : null; }
  function readRaw(id) { var el = document.getElementById(id); return el && el.value !== '' ? +el.value : null; }
  function dsp(m, kind, dp) { var v = toDisplay(m, kind); return isN(v) ? v.toFixed(dp == null ? 2 : dp) : '—'; }
  function fx(formula, eq, extra) { return '<details class="bo-fx"><summary>ƒ formula · Nalco ' + esc(eq) + '</summary><div><code>' + esc(formula) + '</code>' + (extra ? '<br>' + esc(extra) : '') + '</div></details>'; }
  function row(label, m, kind, dp, status, formula, rawText) {
    var has = rawText != null ? true : isN(m);
    var disp = rawText != null ? rawText : (has ? (kind ? dsp(m, kind, dp) : m.toFixed(dp)) : '—');
    var unit = (rawText == null && kind) ? ' ' + U(kind) : '';
    var st = 'st-' + ({ ok: 'ok', watch: 'watch', act: 'act' }[status] || 'none');
    return '<div class="bo-row ' + (has ? '' : 'dim') + '"><span class="k">' + label + (formula || '') + '</span><span class="v ' + (has && status ? st : '') + '">' + (has && status ? '<span class="bo-badge"></span>' : '') + disp + unit + '</span></div>';
  }
  function setHtml(id, h) { var el = document.getElementById(id); if (el) el.innerHTML = h; }

  var LAST = { summary: '', inputs: [], results: [] };

  function recompute() {
    if (!document.getElementById('bo_root')) return;
    S = loadSettings();
    var sum = [], inp = [], res = [];
    var gate = !!(document.getElementById('bo_ack1') && document.getElementById('bo_ack1').checked && document.getElementById('bo_ack2') && document.getElementById('bo_ack2').checked);

    /* C — max cycles (headline) */
    var mcRows = SPECIES.map(function (sp) { return { key: sp[0], label: sp[1], fw: readF('bo_lim_' + sp[0] + '_f', 'conc'), limit: readF('bo_lim_' + sp[0] + '_l', 'conc') }; });
    var mc = maxCycles(mcRows, S);
    var mcOut = '';
    if (mc) {
      mc.sorted.forEach(function (r) { mcOut += row('COC max — ' + r.label, r.coc, null, 1, r.label === mc.limiting ? 'act' : 'ok', ''); });
      mcOut += '<div class="bo-flag info">Practical max COC = <b>' + mc.practicalMax.toFixed(1) + '</b>, limited by <b>' + esc(mc.limiting) + '</b> → minimum blowdown <b>' + mc.pctBD.toFixed(2) + '% of feedwater</b>. <span class="bo-note" style="display:inline;">COC_max = boiler limit ÷ feedwater conc (Table 9.1); %BD = 100/COC (9.6).</span></div>';
      if (mc.opportunity && mc.opportunity.savingPct > 0.5) {
        var o = mc.opportunity;
        mcOut += '<div class="bo-flag amber">💡 Opportunity: reduce <b>' + esc(o.limiting) + '</b> in the makeup and <b>' + esc(o.next) + '</b> becomes limiting at COC ' + o.nextCoc.toFixed(1) + ' → %BD falls ' + o.pctBD.toFixed(2) + '% → ' + o.pctBD2.toFixed(2) + '% (a <b>' + o.savingPct.toFixed(0) + '% blowdown cut</b>). Less blowdown = fuel savings (larger with no blowdown heat recovery), plus lower makeup-water and sewer cost.</div>';
      }
      res.push({ label: 'Practical max COC', value: mc.practicalMax.toFixed(1) + ' (' + mc.limiting + ')' }, { label: 'Min blowdown', value: mc.pctBD.toFixed(2) + '%' });
      sum.push('Max COC ' + mc.practicalMax.toFixed(1) + ' (' + mc.limiting + ') · %BD ' + mc.pctBD.toFixed(2));
    } else mcOut = '<p class="bo-note">Enter a feedwater concentration and a boiler limit for at least one species.</p>';
    setHtml('bo_max_out', mcOut);
    // silica ratio
    var sr = silicaRatio(readF('bo_ohalk', 'conc'), readF('bo_sio2bw', 'conc'), S);
    var srOut = '';
    if (sr) {
      srOut += row('O-alkalinity : SiO₂ ratio', sr.ratio, null, 2, sr.ok ? 'ok' : 'act', fx('OH-alkalinity ÷ SiO₂ ≥ ' + S.silicaRatioMin + ':1', 'Table 9.1 note', 'below the ratio → silica deposition risk'));
      if (!sr.ok) srOut += '<div class="bo-flag red">🔴 O-alkalinity : SiO₂ is below ' + S.silicaRatioMin + ':1 — silica deposition risk. Raise hydrate alkalinity or cut boiler-water silica. (Silica may run higher only if there are no condensing turbines in the cycle.)</div>';
      res.push({ label: 'O-alk:SiO₂', value: sr.ratio.toFixed(2) + ':1' });
    }
    setHtml('bo_silica_out', srOut);

    /* A — mass balance */
    var mbIn = { S: readF('bo_S', 'flow'), FW: readF('bo_FW', 'flow'), BD: readF('bo_BD', 'flow'), MU: readF('bo_MU', 'flow'), COCtarget: readRaw('bo_COCt'),
      RC: readF('bo_RC', 'flow'), NRC: readF('bo_NRC', 'flow'), DA: readF('bo_DA', 'flow'), Vvent: readF('bo_Vv', 'flow'),
      tdsMU: readF('bo_tdsMU', 'conc'), tdsFW: readF('bo_tdsFW', 'conc'), tdsC: readF('bo_tdsC', 'conc'), tdsBD: readF('bo_tdsBD', 'conc') };
    var mb = massBalance(mbIn, gate, S);
    var mbOut = '';
    if (mb.lowTds) mbOut += '<div class="bo-flag amber">⚠ Feedwater TDS is below ' + S.lowTdsFw + ' mg/L (demineralised makeup) — TDS-based blowdown does not apply. Use the tracer method in the high-purity section.</div>';
    // chemistry (gated)
    if (!gate && (isN(mbIn.tdsFW) || isN(mbIn.tdsBD))) mbOut += '<div class="bo-flag amber">⚠ Tick both sampling acknowledgements at the top to unlock the conductivity/TDS results.</div>';
    mbOut += row('COC (cycles)' + (mb.cocBasis ? ' <span class="bo-note" style="display:inline;">(' + mb.cocBasis + ')</span>' : ''), mb.COC, null, 2, mb.cocOverCap ? 'act' : (isN(mb.COC) ? 'ok' : 'none'), fx('COC = 100/%BD; or BW conc ÷ FW conc', '9.6 / 9.7a', 'chemistry preferred; gated behind sampling acks'));
    if (mb.cocOverCap) mbOut += '<div class="bo-flag red">🔴 COC ' + mb.COC.toFixed(1) + ' exceeds ' + S.cocHardCap + ' — industrial boilers should NOT be operated above ' + S.cocHardCap + ' cycles regardless of TDS limits (Nalco Table 11.5 footnote).</div>';
    mbOut += row('%BD (of feedwater)', mb.pctBD, null, 2, isN(mb.pctBD) ? 'ok' : 'none', fx('%BD = 100·BD/FW; or 100·TDS_FW/TDS_BD', '9.2 / 9.4', ''));
    mbOut += row('%MU (of feedwater)', mb.pctMU, null, 2, isN(mb.pctMU) ? 'ok' : 'none', fx('%MU = 100·MU/FW; or 100·(TDS_FW−TDS_C)/(TDS_MU−TDS_C)', '9.3 / 9.5', ''));
    mbOut += row('Blowdown BD', mb.BD, 'flow', 1, isN(mb.BD) ? 'ok' : 'none', fx('BD = S/(COC − 1)', '9.7c', ''));
    mbOut += row('Feedwater FW', mb.FW, 'flow', 1, isN(mb.FW) ? 'ok' : 'none', fx('FW = S + BD  (=S·COC/(COC−1))', '9.7d / 9.7e', ''));
    if (mb.fwDisagree) mbOut += '<div class="bo-flag red">🔴 9.7d and 9.7e disagree — check the steam-flow and COC inputs.</div>';
    if (isN(mb.BD_fromDiff)) { mbOut += row('BD = FW − S', mb.BD_fromDiff, 'flow', 1, 'watch', fx('BD = FW − S', '9.7f', 'subtracts two large meters — high error; prefer 9.7c')); mbOut += '<div class="bo-flag amber">⚠ 9.7f subtracts two large metered numbers to get a small one — error is high and either meter may be out of calibration. Prefer BD = S/(COC−1).</div>'; }
    if (isN(mb.FW_balance)) mbOut += row('FW (balance)', mb.FW_balance, 'flow', 1, 'ok', fx('FW = MU + RC + DA − V', '9.8', ''));
    if (isN(mb.S_balance)) mbOut += row('Steam (balance)', mb.S_balance, 'flow', 1, 'ok', fx('S = RC + NRC', '9.9', ''));
    setHtml('bo_mb_out', mbOut);
    if (isN(mb.COC)) { sum.push('COC ' + mb.COC.toFixed(1) + (isN(mb.pctBD) ? ' · %BD ' + mb.pctBD.toFixed(2) : '')); if (isN(mb.BD)) res.push({ label: 'Blowdown', value: dsp(mb.BD, 'flow', 1) + ' ' + U('flow') }); }
    [['Steam S', mbIn.S, 'flow'], ['Feedwater FW', mbIn.FW, 'flow']].forEach(function (p) { if (isN(p[1])) inp.push({ label: p[0], value: dsp(p[1], p[2], 1) + ' ' + U(p[2]) }); });

    /* D — control limits */
    var pMPa = readF('bo_press', 'press');
    var cl = controlLimits(pMPa);
    var clOut = '';
    if (cl) {
      var band = (UNITS === 'imperial' ? (cl.psigLo + '–' + cl.psigHi + ' psig') : (cl.mpaLo + '–' + cl.mpaHi + ' MPag'));
      if (cl.tds == null) clOut += '<div class="bo-flag info">Below 600 psig (4.1 MPag) — ' + esc(cl.note) + '.</div>';
      else {
        clOut += '<div class="bo-flag info">Band <b>' + band + '</b> (phosphate-residual program): TDS ≤ ' + cl.tds + ' · PO₄ ' + cl.po4 + ' · pH ' + cl.phLo + '–' + cl.phHi + ' · SiO₂ ≤ ' + cl.sio2 + ' · N₂H₄ ' + cl.n2h4 + ' (mg/L).</div>';
        var rTds = readF('bo_r_tds', 'conc'), rPo4 = readF('bo_r_po4', 'conc'), rPh = readRaw('bo_r_ph'), rSi = readF('bo_r_sio2', 'conc');
        if (isN(rTds)) clOut += row('TDS reading vs ≤ ' + cl.tds, rTds, 'conc', 0, rTds <= cl.tds ? 'ok' : 'act', fx('limit ≤ ' + cl.tds + ' mg/L', 'Table 11.5', ''));
        if (isN(rPh)) { var pl = cl.phLo, ph = cl.phHi; clOut += row('pH reading vs ' + pl + '–' + ph, rPh, null, 2, (rPh >= pl && rPh <= ph) ? 'ok' : 'act', fx('range ' + pl + '–' + ph, 'Table 11.5', '')); }
        if (isN(rSi)) clOut += row('SiO₂ reading vs ≤ ' + cl.sio2, rSi, 'conc', 1, rSi <= cl.sio2 ? 'ok' : 'act', fx('limit ≤ ' + cl.sio2 + ' mg/L', 'Table 11.5', ''));
        if (isN(rPo4)) clOut += row('PO₄ reading (target ' + cl.po4 + ')', rPo4, 'conc', 1, 'watch', fx('target ' + cl.po4 + ' mg/L', 'Table 11.5', ''));
      }
      clOut += '<p class="bo-note">Limits for <b>phosphate-residual</b> programs — a different internal treatment carries different limits. TDS limits also vary with boiler design / steam-purity needs. Hydrazine is measured in feedwater just ahead of the boiler (economizer inlet).</p>';
    } else clOut = '<p class="bo-note">Enter the drum pressure to see the control-limit band.</p>';
    setHtml('bo_lim_out', clOut);

    /* E — tracer */
    var V = readF('bo_tr_V', 'vol');
    var pts = [0, 1, 2, 3, 4].map(function (i) { return { t: readRaw('bo_tr_t' + i), Ct: readRaw('bo_tr_c' + i) }; });
    var tf = tracerFit(pts, V, S);
    var trOut = '';
    if (tf) {
      trOut += row('Fitted BD/V (decay rate)', tf.bdOverV, null, 4, 'ok', fx('ln Ct = −(BD/V)·t + ln Ci', '33.10', 'slope = −BD/V, from ' + tf.n + ' points'));
      trOut += row('R² of fit', tf.r2, null, 3, tf.lowR2 ? 'act' : 'ok', fx('coefficient of determination', 'Ch.33', 'warn below ' + S.tracerR2Warn));
      if (tf.lowR2) trOut += '<div class="bo-flag red">🔴 R² ' + tf.r2.toFixed(3) + ' is below ' + S.tracerR2Warn + ' — the decay is not clean (bad tracer, poor mixing, or a metering step). Re-run before trusting BD.</div>';
      if (isN(tf.BD)) {
        // tf.BD is a VOLUMETRIC flow (m³/h). To combine with the steam MASS flow S (kg/h)
        // in FW = S + BD (33.11) and COC (33.12), convert to mass using boiler-water density.
        var bdMass = tf.BD * 1000;   // m³/h → kg/h, assuming ρ ≈ 1000 kg/m³
        trOut += row('Blowdown BD', bdMass, 'flow', 1, 'ok', fx('BD = (BD/V) · V · ρ', '33.10', 'V-turnover × volume × ρ≈1000 kg/m³'));
        var Str = readF('bo_tr_S', 'flow');
        if (isN(Str)) {
          var fwT = Str + bdMass;
          trOut += row('Feedwater FW', fwT, 'flow', 1, 'ok', fx('FW = S + BD', '33.11', ''));
          trOut += row('COC', fwT / bdMass, null, 2, 'ok', fx('COC follows from FW ÷ BD', '33.12', ''));
        }
        trOut += '<div class="bo-note">Blowdown is converted from the volumetric decay rate to a mass flow assuming boiler-water density ≈ 1000 kg/m³ — adjust for hot/pressurised water if you need precision.</div>';
      }
    } else trOut = '<p class="bo-note">Enter boiler volume and at least two (t, Cₜ) tracer readings.</p>';
    setHtml('bo_tr_out', trOut);
    // continuous tracer 9.7a
    var ctBw = readF('bo_ct_bw', 'conc'), ctFw = readF('bo_ct_fw', 'conc');
    setHtml('bo_ct_out', (isN(ctBw) && isN(ctFw) && ctFw > 0) ? row('COC (continuous tracer)', ctBw / ctFw, null, 2, 'ok', fx('COC = boiler-water tracer ÷ feedwater tracer', '9.7a', '')) : '');

    /* F — fuel */
    var fuelSel = (document.getElementById('bo_fuel') || {}).value;
    var fuel = FUELS.find(function (f) { return f[0] === fuelSel; });
    var effOv = readRaw('bo_eff');
    var eff = isN(effOv) ? effOv : (fuel ? fuel[2] : null);
    var fuelOut = '';
    if (fuel) {
      fuelOut += row('Typical combustion efficiency', eff, null, 0, 'ok', fx('Table 31.2 typical values', 'Table 31.2', 'coal 89 · wood 74 · No.2 oil 88 · No.6 oil 88 · gas 85')).replace('—', eff + ' %');
      var price = readRaw('bo_fuelPrice');
      if (isN(price) && isN(eff) && isN(mb.BD)) fuelOut += '<div class="bo-flag amber">Estimate only: with fuel price ' + price + '/unit and ' + eff + '% efficiency, the fuel value of blowdown scales with BD (' + dsp(mb.BD, 'flow', 1) + ' ' + U('flow') + ') and its heat content — supply a proper heat balance for a real figure.</div>';
    }
    setHtml('bo_fuel_out', fuelOut);

    LAST = { summary: sum.join('  ·  ') || 'No inputs yet', inputs: inp, results: res };
  }

  /* ---------- units / settings / share ---------- */
  function setUnits(u) {
    if (u === UNITS) return;
    document.querySelectorAll('#bo_root input[data-kind]').forEach(function (el) { var v = el.value; if (v === '' || v == null) return; var n = +v; if (!isN(n)) return; el.value = Math.round(convertBetween(n, el.getAttribute('data-kind'), UNITS, u) * 1e6) / 1e6; });
    UNITS = u; try { localStorage.setItem(UNITS_KEY, u); } catch (e) {}
    var vals = {}, checks = {}; document.querySelectorAll('#bo_root input,#bo_root select').forEach(function (el) { if (el.id) { if (el.type === 'checkbox') checks[el.id] = el.checked; else vals[el.id] = el.value; } });
    mount();
    Object.keys(vals).forEach(function (id) { var el = document.getElementById(id); if (el) el.value = vals[id]; });
    Object.keys(checks).forEach(function (id) { var el = document.getElementById(id); if (el) el.checked = checks[id]; });
    recompute();
  }
  function applySettings() { var n = {}; Object.keys(DEFAULTS).forEach(function (k) { var el = document.getElementById('bo_set_' + k); if (el && el.value !== '') { var v = +el.value; if (isN(v)) n[k] = v; } }); S = Object.assign(loadSettings(), n); saveSettings(S); if (typeof showToast === 'function') showToast('Settings saved'); recompute(); }
  function resetSettings() { S = Object.assign({}, DEFAULTS); saveSettings(S); mount(); recompute(); if (typeof showToast === 'function') showToast('Defaults restored'); }
  function toggle(id) { var el = document.getElementById(id); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; }

  function textSummary() {
    var lines = ['*Hadron — Boiler reading*', new Date().toLocaleString(), ''];
    LAST.inputs.forEach(function (i) { lines.push('• ' + i.label + ': ' + i.value); });
    if (LAST.inputs.length) lines.push('');
    LAST.results.forEach(function (r) { lines.push(r.label + ': ' + r.value); });
    lines.push('', 'Units: ' + UNITS + '  ·  ' + LAST.summary);
    return lines.join('\n');
  }
  function copyText(btn) {
    recompute(); var txt = textSummary();
    var done = function () { if (btn) { var o = btn.textContent; btn.textContent = '✓ Copied'; setTimeout(function () { btn.textContent = o; }, 1500); } if (typeof showToast === 'function') showToast('Copied — paste into WhatsApp or email'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt, done); }); else fallbackCopy(txt, done);
  }
  function fallbackCopy(txt, done) { var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { if (typeof showToast === 'function') showToast('Copy not supported'); } document.body.removeChild(ta); }
  function prefillServiceReport() {
    recompute();
    if (typeof openWindow !== 'function') return;
    openWindow('servicereport'); if (typeof newServiceReport === 'function') { try { newServiceReport(); } catch (e) {} }
    setTimeout(function () {
      var m = { sr_ph: readRaw('bo_r_ph'), sr_cond: readRaw('bo_tdsBD') || readRaw('bo_r_tds') };
      Object.keys(m).forEach(function (id) { var el = document.getElementById(id); if (el && m[id] != null && el.value === '') el.value = m[id]; });
      if (typeof showToast === 'function') showToast('Key readings sent to service report');
    }, 250);
  }

  function mount() {
    var root = document.getElementById('bo_root'); if (!root) return;
    injectStyles(); root.innerHTML = shell();
    root.addEventListener('input', recompute); root.addEventListener('change', recompute);
  }
  window.boilerOpen = function () { mount(); recompute(); };
  window.HG_BOILER = {
    massBalance: massBalance, maxCycles: maxCycles, silicaRatio: silicaRatio, controlLimits: controlLimits, tracerFit: tracerFit,
    selfTest: selfTest, lastReading: function () { recompute(); return { inputs: LAST.inputs, results: LAST.results, summary: LAST.summary }; },
    setUnits: setUnits, toggle: toggle, applySettings: applySettings, resetSettings: resetSettings, copyText: copyText, prefillServiceReport: prefillServiceReport
  };
  try { selfTest(); } catch (e) { console.error('[Boiler self-test] crashed', e); }
})();
