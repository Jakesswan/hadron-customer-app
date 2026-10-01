/*
 * Hadron Group — Water Softener sizing calculator
 * ================================================
 * On-site sizing for a sodium-cycle (strong-acid-cation) ion-exchange softener:
 * from the feed hardness and the water demand it works out the resin volume, the
 * standard FRP mineral tank, the salt per regeneration, the softening run length,
 * and the hydraulic checks (service velocity, bed-volumes/hour, bed depth).
 *
 * BASIS (standard ion-exchange design practice — resin-maker design guides,
 * e.g. Purolite / Lenntech):
 *   hardness load per cycle = volume treated × hardness (as CaCO₃)
 *   resin volume            = load ÷ operating exchange capacity
 *   operating capacity      is set by the salt dose (efficiency vs capacity trade-off)
 *   salt per regeneration   = resin volume × salt dose
 *   service velocity 15–40 m/h, service 8–40 bed-volumes/h are the hydraulic limits.
 * Iron is converted to a hardness equivalent (as CaCO₃) and added to the load;
 * clear-water iron above a threshold is flagged for pre-treatment (a softener only
 * handles low, clear ferrous iron — beyond that it fouls and loses capacity).
 *
 * Field constraints: fully OFFLINE, mobile-first, every input optional, metric
 * default with an imperial toggle, colour-coded, editable settings (so a branch can
 * pin its own resin capacities / salt doses / tank range). Shares the app's
 * Save-to-History (CALC_META), showToast, localStorage and the section/expander UX.
 * Entry point: window.softenerOpen();  calc core + self-tests: window.HG_SOFTENER.
 */
(function () {
  'use strict';

  /* ============================================================
     PALETTE — Hadron ERP theme (matches the rest of the Customer App).
     Keep every colour on the app scheme: teal #3AAEDB, dark #2e3742, gold #f5a623,
     green #157b3a, red #c0392b. Do NOT introduce off-scheme brand hexes.
     ============================================================ */
  var PAL = { charcoal: '#2e3742', teal: '#3AAEDB', gold: '#f5a623', ok: '#157b3a', watch: '#f5a623', action: '#c0392b' };

  /* ============================================================
     SETTINGS (editable thresholds) — persisted like the rest of the app.
     Operating capacities + salt doses are the numbers a branch tunes to its resin.
     ============================================================ */
  var SETTINGS_KEY = 'hadron_softener_settings';
  var UNITS_KEY = 'hadron_softener_units';
  var DEFAULTS = {
    capEconomy: 40, capStandard: 50, capHigh: 57,       // operating capacity, g CaCO₃ per L resin, by salt dose
    doseEconomy: 80, doseStandard: 120, doseHigh: 160,  // salt dose, g NaCl per L resin
    ironFactor: 1.79,   // 1 mg/L Fe → mg/L as CaCO₃ (stoichiometric equivalent)
    ironWarn: 0.3,      // mg/L: clear-water iron above this typically needs pre-treatment
    velMax: 40,         // m/h: service linear-velocity ceiling
    velNom: 25,         // m/h: nominal service velocity (amber above this)
    bvMin: 8, bvMax: 40 // service range, bed-volumes/hour
  };
  function loadSettings() { try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { return Object.assign({}, DEFAULTS); } }
  function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {} }
  var S = loadSettings();

  // Standard FRP mineral tanks: code = diameter+height in inches, typical MAX softening
  // resin fill (L), leaving freeboard for backwash. 1054 & 1354 are the common pair.
  var FRP_TANKS = [
    { code: '0817', d: 8,  h: 17, resin: 7 },
    { code: '0844', d: 8,  h: 44, resin: 14 },
    { code: '0948', d: 9,  h: 48, resin: 21 },
    { code: '1054', d: 10, h: 54, resin: 28 },
    { code: '1252', d: 12, h: 52, resin: 42 },
    { code: '1354', d: 13, h: 54, resin: 50 },
    { code: '1465', d: 14, h: 65, resin: 71 },
    { code: '1665', d: 16, h: 65, resin: 85 },
    { code: '1865', d: 18, h: 65, resin: 113 },
    { code: '2162', d: 21, h: 62, resin: 142 },
    { code: '2472', d: 24, h: 72, resin: 198 }
  ];
  // Hardness entry units → factor to mg/L as CaCO₃.
  var HARD_UNITS = [['mgl', 'mg/L CaCO₃', 1], ['dH', '°dH (German)', 17.848], ['fH', '°f (French)', 10], ['gpg', 'gpg (grains/US gal)', 17.118], ['mmol', 'mmol/L', 100.09]];
  var SALT_SETTINGS = [['economy', 'Economy (low salt)'], ['standard', 'Standard'], ['high', 'High capacity']];

  /* ============================================================
     UNITS — metric canonical; imperial for display of flow/volume/salt/resin.
     Hardness carries its own entry-unit dropdown (independent of this toggle).
     ============================================================ */
  var UNITS = (function () { try { return localStorage.getItem(UNITS_KEY) === 'imperial' ? 'imperial' : 'metric'; } catch (e) { return 'metric'; } })();
  var K = { flow: 4.402868, volday: 264.172052, mass: 2.2046226, resin: 0.0353147 }; // m³/h→US gpm, m³/day→US gal/day, kg→lb, L→ft³
  function toMetric(v, kind) {
    if (v == null || isNaN(v)) return null;
    if (UNITS === 'metric' || !K[kind]) return v;
    return v / K[kind];
  }
  function toDisplay(v, kind) {
    if (v == null || isNaN(v)) return null;
    if (UNITS === 'metric' || !K[kind]) return v;
    return v * K[kind];
  }
  function convertBetween(v, kind, from, to) {
    if (v == null || isNaN(v) || from === to || !K[kind]) return v;
    var m = (from === 'metric') ? v : v / K[kind];
    return (to === 'metric') ? m : m * K[kind];
  }
  function U(kind) {
    var m = { flow: 'm³/h', volday: 'm³/day', mass: 'kg', resin: 'L', len: 'm', conc: 'mg/L' };
    var i = { flow: 'US gpm', volday: 'gal/day', mass: 'lb', resin: 'ft³', len: 'm', conc: 'mg/L' };
    return (UNITS === 'imperial' ? i : m)[kind] || '';
  }

  /* ============================================================
     PURE CALC CORE — all metric internally.
     ============================================================ */
  function isN(v) { return typeof v === 'number' && isFinite(v); }
  function num(v) { return isN(v) ? v : (v == null || v === '' || isNaN(+v) ? null : +v); }
  function tankArea(t) { var dm = t.d * 0.0254; return Math.PI / 4 * dm * dm; } // m²

  // x = { hardness (mg/L CaCO₃), iron (mg/L), flow (m³/h), dailyVol (m³/day),
  //       hoursPerDay, daysBetween, salt: 'economy'|'standard'|'high' }
  function sizeSoftener(x, s) {
    s = s || S;
    var r = { ok: false };
    var hard = num(x.hardness), iron = num(x.iron) || 0, flow = num(x.flow);
    var vol = num(x.dailyVol), hours = num(x.hoursPerDay), days = num(x.daysBetween) || 1;
    var preset = x.salt || 'standard';
    var opCap = preset === 'economy' ? s.capEconomy : preset === 'high' ? s.capHigh : s.capStandard;
    var dose = preset === 'economy' ? s.doseEconomy : preset === 'high' ? s.doseHigh : s.doseStandard;
    r.opCap = opCap; r.dose = dose; r.preset = preset;
    if (!isN(hard) || hard <= 0) return r;                 // hardness is the one required input
    if (!isN(vol) && isN(flow) && isN(hours)) vol = flow * hours;   // derive daily volume from flow × hours
    r.compHard = hard + s.ironFactor * iron;               // iron folded into the hardness load
    r.ironAdded = s.ironFactor * iron;
    if (!isN(vol) || vol <= 0) { r.needVol = true; return r; }
    r.days = days;
    r.volPerCycle = vol * days;                            // m³ treated between regenerations
    r.loadCycle_g = r.volPerCycle * r.compHard;            // g CaCO₃  (m³×1000 L × mg/L ÷ 1000 mg/g)
    r.resinDesign = r.loadCycle_g / opCap;                 // L resin (minimum)

    // Pick the smallest standard tank that holds the design resin AND (if flow known) keeps
    // the service velocity within the ceiling. A high flow can drive a bigger tank than the load.
    var pick = null;
    for (var i = 0; i < FRP_TANKS.length; i++) {
      var t = FRP_TANKS[i];
      if (t.resin < r.resinDesign) continue;
      if (isN(flow) && (flow / tankArea(t)) > s.velMax) continue;
      pick = t; break;
    }
    r.tank = pick;
    if (!pick) r.noTank = true;                            // load/flow exceeds the largest standard tank

    var loaded = pick ? pick.resin : r.resinDesign;        // resin actually loaded
    r.resinLoaded = loaded;
    r.saltPerRegen = loaded * dose / 1000;                 // kg NaCl per regeneration
    r.capLoaded_g = loaded * opCap;                        // g CaCO₃ the loaded resin holds
    r.volCapacity = r.capLoaded_g / r.compHard;            // m³ it can soften before regen
    r.daysActual = vol > 0 ? r.volCapacity / vol : null;   // real interval (≥ requested — the tank holds ≥ design)

    if (isN(flow) && pick) {
      r.area = tankArea(pick);
      r.serviceVel = flow / r.area;                        // m/h linear velocity
      r.bvh = flow / (loaded / 1000);                      // bed-volumes/hour = flow(m³/h) ÷ resin(m³)
      r.bedDepth = (loaded / 1000) / r.area;               // m
    }
    // salt consumption projection (metered regen on the real interval)
    var regensPerDay = isN(r.daysActual) && r.daysActual > 0 ? 1 / r.daysActual : (days ? 1 / days : null);
    r.saltPerDay = regensPerDay != null ? r.saltPerRegen * regensPerDay : null;
    r.saltPerMonth = isN(r.saltPerDay) ? r.saltPerDay * 30.44 : null;
    r.saltPerYear = isN(r.saltPerDay) ? r.saltPerDay * 365 : null;
    r.ok = true;
    return r;
  }

  /* ============================================================
     SELF-TESTS — assert on load; runnable via window.HG_SOFTENER.selfTest()
     ============================================================ */
  function selfTest() {
    var out = [], ok = true;
    function ap(cond, msg) { out.push((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) ok = false; }
    function near(a, b, t) { return isN(a) && Math.abs(a - b) <= (t == null ? 0.5 : t); }
    var d = DEFAULTS;
    // 1) 250 mg/L, 5 m³/day, 1 day, standard(50) → 25 L resin, tank 1054, salt 3.36 kg
    var r1 = sizeSoftener({ hardness: 250, dailyVol: 5, daysBetween: 1, salt: 'standard' }, d);
    ap(near(r1.resinDesign, 25, 0.01), 'design resin = 25 L (got ' + (r1.resinDesign || 0).toFixed(2) + ')');
    ap(r1.tank && r1.tank.code === '1054', 'tank = 1054 (got ' + (r1.tank ? r1.tank.code : 'none') + ')');
    ap(near(r1.saltPerRegen, 28 * 120 / 1000, 0.01), 'salt/regen = 3.36 kg (got ' + (r1.saltPerRegen || 0).toFixed(2) + ')');
    // 2) iron folds into the load: +2 mg/L Fe × 1.79 → comp 253.58
    var r2 = sizeSoftener({ hardness: 250, iron: 2, dailyVol: 5, daysBetween: 1, salt: 'standard' }, d);
    ap(near(r2.compHard, 253.58, 0.05), 'iron-compensated hardness = 253.58 (got ' + (r2.compHard || 0).toFixed(2) + ')');
    // 3) high flow drives a bigger tank than the tiny load: 100 mg/L, 2 m³/day, 3 m³/h → 1354 (velocity)
    var r3 = sizeSoftener({ hardness: 100, dailyVol: 2, flow: 3, daysBetween: 1, salt: 'standard' }, d);
    ap(r3.tank && r3.tank.code === '1354', 'velocity-driven tank = 1354 (got ' + (r3.tank ? r3.tank.code : 'none') + ')');
    ap(r3.serviceVel <= d.velMax + 1e-6, 'service velocity within ceiling (got ' + (r3.serviceVel || 0).toFixed(1) + ' m/h)');
    // 4) flow + hours derives daily volume
    var r4 = sizeSoftener({ hardness: 250, flow: 1, hoursPerDay: 5, daysBetween: 1, salt: 'standard' }, d);
    ap(near(r4.resinDesign, 25, 0.01), 'daily vol from flow×hours → 25 L (got ' + (r4.resinDesign || 0).toFixed(2) + ')');
    out.forEach(function (l) { (l.indexOf('FAIL') === 0 ? console.error : console.log)('[Softener self-test] ' + l); });
    console.log('[Softener self-test] ' + (ok ? 'ALL PASS' : 'FAILURES ABOVE'));
    return { ok: ok, out: out };
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function esc(s2) { return String(s2 == null ? '' : s2).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fg(id, label, kind, ph) {
    var unit = kind && kind !== 'plain' ? (' (' + U(kind) + ')') : '';
    return '<div class="so-fg"><label>' + esc(label) + unit + '</label><input type="number" inputmode="decimal" id="' + id + '" data-kind="' + (kind || 'plain') + '" step="any" placeholder="' + (ph || '') + '"></div>';
  }
  function injectStyles() {
    if (document.getElementById('softener-styles')) return;
    var css =
      '#sf_root{--so-char:' + PAL.charcoal + ';--so-teal:var(--accent-ink,' + PAL.teal + ');--so-gold:' + PAL.gold + ';--so-ok:' + PAL.ok + ';--so-watch:' + PAL.watch + ';--so-act:' + PAL.action + ';}' +
      'body.dark #sf_root{--so-char:#e8ecef;}' +
      '#sf_root .so-lead{font-size:13px;color:#6b7684;margin:0 0 12px;}' +
      '#sf_root .so-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;}' +
      '#sf_root .so-seg{display:inline-flex;border:1.5px solid var(--so-teal);border-radius:10px;overflow:hidden;}' +
      '#sf_root .so-seg button{border:0;background:#fff;color:var(--so-teal);font-weight:700;padding:9px 16px;font-size:14px;cursor:pointer;}' +
      '#sf_root .so-seg button.on{background:var(--accent-ink,#1B77A0);color:var(--on-accent,#fff);}' +
      'body.dark #sf_root .so-seg button{background:#0F172A;} body.dark #sf_root .so-seg button.on{background:var(--accent-ink,#1B77A0);color:var(--on-accent,#fff);}' +
      '#sf_root details.so-sec{border:1px solid #e3e9ee;border-left:4px solid var(--so-teal);border-radius:12px;margin-bottom:12px;background:#fff;overflow:hidden;}' +
      'body.dark #sf_root details.so-sec{background:#0F172A;border-color:#1A222F;}' +
      '#sf_root details.so-sec[data-accent="gold"]{border-left-color:var(--so-gold);}' +
      '#sf_root summary.so-head{list-style:none;cursor:pointer;padding:14px 16px;font-weight:800;font-size:15px;color:var(--so-char);display:flex;justify-content:space-between;align-items:center;}' +
      'body.dark #sf_root summary.so-head{color:#e8ecef;}' +
      '#sf_root summary.so-head::-webkit-details-marker{display:none;}' +
      '#sf_root summary.so-head .so-chev{color:var(--so-teal);font-size:13px;}' +
      '#sf_root .so-body{padding:0 16px 16px;}' +
      '#sf_root .so-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;}' +
      '#sf_root .so-fg label{display:block;font-size:12px;font-weight:600;color:#5a6a76;margin-bottom:4px;}' +
      'body.dark #sf_root .so-fg label{color:#9aa3aa;}' +
      '#sf_root .so-fg input,#sf_root .so-fg select{width:100%;padding:12px;font-size:16px;border:1px solid #d7dee4;border-radius:10px;background:#fff;color:var(--so-char);box-sizing:border-box;}' +
      'body.dark #sf_root .so-fg input,body.dark #sf_root .so-fg select{background:#111a24;border-color:#28323d;color:#e8ecef;}' +
      '#sf_root .so-fg input:focus,#sf_root .so-fg select:focus{outline:2px solid var(--so-teal);border-color:var(--so-teal);}' +
      '#sf_root .so-res{margin-top:12px;border-top:1px dashed #dce3e9;padding-top:10px;}' +
      '#sf_root .so-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f0f3f6;}' +
      'body.dark #sf_root .so-row{border-color:#1A222F;}' +
      '#sf_root .so-row.dim{opacity:.45;}' +
      '#sf_root .so-row .k{font-size:13px;color:var(--so-char);}' +
      'body.dark #sf_root .so-row .k{color:#c8cfd6;}' +
      '#sf_root .so-row .v{font-weight:800;font-size:16px;white-space:nowrap;text-align:right;}' +
      '#sf_root .so-badge{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:7px;vertical-align:middle;}' +
      '#sf_root .st-ok{color:var(--so-ok);} #sf_root .st-ok .so-badge{background:var(--so-ok);}' +
      '#sf_root .st-watch{color:var(--so-watch);} #sf_root .st-watch .so-badge{background:var(--so-watch);}' +
      '#sf_root .st-act{color:var(--so-act);} #sf_root .st-act .so-badge{background:var(--so-act);}' +
      '#sf_root .so-hero{background:rgba(58,174,219,.08);border:1px solid rgba(58,174,219,.35);border-radius:12px;padding:12px 14px;margin-bottom:10px;}' +
      '#sf_root .so-hero .big{font-size:26px;font-weight:800;color:var(--so-teal);line-height:1.1;}' +
      '#sf_root .so-hero .sub{font-size:13px;color:#5a6a76;margin-top:3px;}' +
      'body.dark #sf_root .so-hero .sub{color:#9aa3aa;}' +
      '#sf_root .so-fx{margin:2px 0 8px;}' +
      '#sf_root .so-fx summary{cursor:pointer;font-size:11px;color:var(--so-teal);font-weight:700;}' +
      '#sf_root .so-fx div{font-size:12px;color:#5a6a76;background:#f5f8fa;border-radius:8px;padding:8px 10px;margin-top:5px;line-height:1.5;}' +
      'body.dark #sf_root .so-fx div{background:#11202e;color:#b5c4cf;}' +
      '#sf_root .so-fx code{font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--so-char);}' +
      'body.dark #sf_root .so-fx code{color:#9fe6f0;}' +
      '#sf_root .so-flag{border-radius:10px;padding:10px 12px;margin:8px 0;font-size:13px;line-height:1.5;}' +
      '#sf_root .so-flag.red{background:rgba(192,57,43,.10);border:1px solid rgba(192,57,43,.4);color:#8e2419;}' +
      '#sf_root .so-flag.amber{background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.5);color:#8a5a00;}' +
      '#sf_root .so-flag.info{background:rgba(58,174,219,.10);border:1px solid rgba(58,174,219,.4);color:#1f6f7a;}' +
      'body.dark #sf_root .so-flag.info{color:#8fd3dd;} body.dark #sf_root .so-flag.amber{color:#f0c674;} body.dark #sf_root .so-flag.red{color:#f5b0a6;}' +
      '#sf_root .so-actions{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 4px;}' +
      '#sf_root .so-btn{border:0;border-radius:10px;padding:12px 16px;font-size:14px;font-weight:700;cursor:pointer;}' +
      '#sf_root .so-btn.teal{background:var(--accent-ink,#1B77A0);color:var(--on-accent,#fff);} #sf_root .so-btn.gold{background:var(--so-gold);color:#2E3742;} #sf_root .so-btn.ghost{background:#fff;color:var(--so-char);border:1px solid #cdd6dd;}' +
      'body.dark #sf_root .so-btn.ghost{background:#0F172A;color:#e8ecef;border-color:#28323d;}' +
      '#sf_root .so-note{font-size:11.5px;color:#8a97a4;margin:6px 0 0;line-height:1.5;}';
    var st = document.createElement('style'); st.id = 'softener-styles'; st.textContent = css; document.head.appendChild(st);
  }

  function sec(id, title, open, accent, body) {
    return '<details class="so-sec" id="' + id + '" data-accent="' + accent + '"' + (open ? ' open' : '') + '><summary class="so-head">' + esc(title) + '<span class="so-chev">▾</span></summary><div class="so-body">' + body + '</div></details>';
  }
  function shell() {
    var h = '';
    h += '<h2 style="margin:0 0 2px;">Water Softener Sizing</h2>';
    h += '<p class="so-lead">Sizes a sodium-cycle (SAC) ion-exchange softener from the feed hardness and the water demand — resin volume, the standard FRP tank, salt per regeneration and the hydraulic checks.</p>';
    h += '<div class="so-toolbar"><div class="so-seg"><button id="sf_um" class="' + (UNITS === 'metric' ? 'on' : '') + '" onclick="HG_SOFTENER.setUnits(\'metric\')">Metric</button><button id="sf_ui" class="' + (UNITS === 'imperial' ? 'on' : '') + '" onclick="HG_SOFTENER.setUnits(\'imperial\')">Imperial</button></div>' +
      '<button class="so-btn ghost" onclick="HG_SOFTENER.toggle(\'sf_help\')">How to use</button><button class="so-btn ghost" onclick="HG_SOFTENER.toggle(\'sf_settings\')">⚙ Settings</button></div>';
    h += '<div id="sf_help" style="display:none;">' + helpPanel() + '</div>';
    h += '<div id="sf_settings" style="display:none;">' + settingsPanel() + '</div>';

    // Feed water
    h += sec('sf_sec_feed', 'Feed water', true, 'teal',
      '<div class="so-grid">' +
      '<div class="so-fg"><label>Total hardness</label><input type="number" inputmode="decimal" id="sf_hard" data-kind="plain" step="any" placeholder="e.g. 300"></div>' +
      '<div class="so-fg"><label>Hardness unit</label><select id="sf_hard_unit" data-kind="plain">' + HARD_UNITS.map(function (u) { return '<option value="' + u[0] + '">' + u[1] + '</option>'; }).join('') + '</select></div>' +
      fg('sf_iron', 'Iron (Fe)', 'conc', 'optional, e.g. 0.2') +
      '</div><p class="so-note">Iron is added to the hardness load as a CaCO₃ equivalent. A softener only removes low, clear (ferrous) iron — high or oxidised iron needs pre-treatment.</p>');

    // Demand
    h += sec('sf_sec_demand', 'Water demand', true, 'teal',
      '<div class="so-grid">' +
      fg('sf_flow', 'Peak service flow', 'flow', 'e.g. 1.5') +
      fg('sf_vol', 'Daily volume', 'volday', 'e.g. 10') +
      fg('sf_hours', 'or hours run / day', 'plain', 'e.g. 8') +
      fg('sf_days', 'Days between regens', 'plain', 'default 1') +
      '<div class="so-fg"><label>Salt / capacity setting</label><select id="sf_salt" data-kind="plain">' + SALT_SETTINGS.map(function (u) { return '<option value="' + u[0] + '"' + (u[0] === 'standard' ? ' selected' : '') + '>' + u[1] + '</option>'; }).join('') + '</select></div>' +
      '</div><p class="so-note">Enter the daily volume, or leave it blank and give peak flow + hours/day. Peak flow also sizes the vessel diameter (service velocity).</p>');

    h += '<div id="sf_out"></div>';

    h += '<div class="so-actions">' +
      '<button class="so-btn teal save-calc-btn" onclick="saveCalculation(\'softener\', this)">💾 Save sizing</button>' +
      '<button class="so-btn gold" onclick="HG_SOFTENER.copyText(this)">📋 Copy as text</button>' +
      '<button class="so-btn ghost pdf-calc-btn" onclick="exportPdf(\'softener\')">📄 PDF</button></div>';
    return h;
  }

  function settingsPanel() {
    var f = [['capEconomy', 'Capacity — Economy (g CaCO₃/L)'], ['capStandard', 'Capacity — Standard'], ['capHigh', 'Capacity — High'],
      ['doseEconomy', 'Salt dose — Economy (g/L)'], ['doseStandard', 'Salt dose — Standard'], ['doseHigh', 'Salt dose — High'],
      ['ironFactor', 'Iron → hardness factor (×)'], ['ironWarn', 'Iron pre-treat warn (mg/L)'],
      ['velNom', 'Service velocity nominal (m/h)'], ['velMax', 'Service velocity max (m/h)'],
      ['bvMin', 'Service BV/h min'], ['bvMax', 'Service BV/h max']];
    return '<div class="so-sec" style="border-left-color:var(--so-gold);padding:14px 16px;"><div style="font-weight:800;color:var(--so-char);margin-bottom:8px;">Resin, salt &amp; hydraulic thresholds</div><p class="so-note" style="margin-top:0;">Tune these to your resin data sheet and house practice.</p><div class="so-grid">' +
      f.map(function (x) { return '<div class="so-fg"><label>' + x[1] + '</label><input type="number" inputmode="decimal" id="sf_set_' + x[0] + '" step="any" value="' + S[x[0]] + '"></div>'; }).join('') +
      '</div><div class="so-actions"><button class="so-btn teal" onclick="HG_SOFTENER.applySettings()">Save settings</button><button class="so-btn ghost" onclick="HG_SOFTENER.resetSettings()">Reset defaults</button></div></div>';
  }
  function helpPanel() {
    return '<div class="so-sec" style="border-left-color:var(--so-gold);padding:14px 16px;"><div style="font-weight:800;color:var(--so-char);margin-bottom:6px;">How the sizing works</div>' +
      '<ol style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#5a6a76;">' +
      '<li><b>Load</b> = water treated between regenerations × hardness (as CaCO₃). Iron is added in as a CaCO₃ equivalent.</li>' +
      '<li><b>Resin</b> = load ÷ operating capacity. The salt setting picks the capacity: more salt = more capacity but poorer salt efficiency.</li>' +
      '<li><b>Tank</b> = the smallest standard FRP vessel that holds the resin and keeps the service velocity in range (a high flow can drive a bigger tank than the load alone).</li>' +
      '<li><b>Salt</b> = loaded resin × salt dose. <b>Run length</b> = the loaded resin\'s capacity ÷ your daily use.</li>' +
      '<li>Colours: <span style="color:' + PAL.ok + ';font-weight:700;">green</span> OK · <span style="color:' + PAL.watch + ';font-weight:700;">amber</span> watch · <span style="color:' + PAL.action + ';font-weight:700;">red</span> action. Capacities and doses are editable in ⚙ Settings.</li></ol>' +
      '<p class="so-note">A sizing aid, not a guarantee — confirm against the resin data sheet and the site\'s duty.</p></div>';
  }

  /* ---------- read + compute ---------- */
  function readF(id, kind) { var el = document.getElementById(id); if (!el) return null; var v = el.value; if (v === '' || v == null) return null; var n = +v; return isN(n) ? toMetric(n, kind || el.getAttribute('data-kind')) : null; }
  function readRaw(id) { var el = document.getElementById(id); return el && el.value !== '' ? +el.value : null; }
  function readSel(id) { var el = document.getElementById(id); return el ? el.value : null; }
  function dsp(m, kind, dp) { var v = toDisplay(m, kind); return isN(v) ? v.toFixed(dp == null ? 2 : dp) : '—'; }
  function fx(formula, src, extra) { return '<details class="so-fx"><summary>ƒ how it\'s worked out</summary><div><code>' + esc(formula) + '</code>' + (src ? '<br><i>' + esc(src) + '</i>' : '') + (extra ? '<br>' + esc(extra) : '') + '</div></details>'; }
  function row(label, disp, status, formula) {
    var has = disp != null && disp !== '—';
    var st = 'st-' + ({ ok: 'ok', watch: 'watch', act: 'act' }[status] || 'none');
    return '<div class="so-row ' + (has ? '' : 'dim') + '"><span class="k">' + label + (formula || '') + '</span><span class="v ' + (has && status ? st : '') + '">' + (has && status ? '<span class="so-badge"></span>' : '') + (has ? disp : '—') + '</span></div>';
  }

  var LAST = { summary: '', inputs: [], results: [] };

  function recompute() {
    if (!document.getElementById('sf_root')) return;
    S = loadSettings();
    var hardRaw = readRaw('sf_hard'), hUnitSel = readSel('sf_hard_unit') || 'mgl';
    var hUnit = HARD_UNITS.find(function (u) { return u[0] === hUnitSel; }) || HARD_UNITS[0];
    var hardMgL = isN(hardRaw) ? hardRaw * hUnit[2] : null;
    var x = {
      hardness: hardMgL, iron: readRaw('sf_iron'),
      flow: readF('sf_flow', 'flow'), dailyVol: readF('sf_vol', 'volday'),
      hoursPerDay: readRaw('sf_hours'), daysBetween: readRaw('sf_days'), salt: readSel('sf_salt') || 'standard'
    };
    var r = sizeSoftener(x, S);
    var inp = [], res = [], sum = [];
    var html = '';

    if (!isN(r.compHard)) { setHtml('sf_out', '<p class="so-note">Enter the feed hardness to size the softener.</p>'); LAST = { summary: 'No inputs yet', inputs: [], results: [] }; return; }   // compHard is set only after the hardness check passes
    if (hardMgL != null) inp.push({ label: 'Hardness', value: Math.round(hardMgL) + ' mg/L CaCO₃' + (hUnit[0] !== 'mgl' ? ' (' + hardRaw + ' ' + hUnit[1] + ')' : '') });
    if (isN(x.iron) && x.iron > 0) inp.push({ label: 'Iron', value: x.iron + ' mg/L' });
    if (isN(x.flow)) inp.push({ label: 'Peak flow', value: dsp(x.flow, 'flow', 2) + ' ' + U('flow') });
    if (isN(x.dailyVol)) inp.push({ label: 'Daily volume', value: dsp(x.dailyVol, 'volday', 1) + ' ' + U('volday') });
    inp.push({ label: 'Salt setting', value: (SALT_SETTINGS.find(function (u) { return u[0] === r.preset; }) || [, r.preset])[1] });

    if (r.needVol) {
      html += '<div class="so-flag amber">Enter a <b>daily volume</b>, or a <b>peak flow + hours/day</b>, to size the resin and tank.</div>';
    } else {
      // Hero — resin + tank
      html += '<div class="so-hero"><div class="big">' + dsp(r.resinLoaded, 'resin', UNITS === 'imperial' ? 2 : 0) + ' ' + U('resin') + ' resin' + (r.tank ? '  ·  ' + r.tank.code : '') + '</div>' +
        '<div class="sub">' + (r.tank ? ('Standard FRP tank <b>' + r.tank.code + '</b> (' + r.tank.d + '&quot; × ' + r.tank.h + '&quot;), holds ' + dsp(r.tank.resin, 'resin', UNITS === 'imperial' ? 2 : 0) + ' ' + U('resin') + ' resin') : 'No standard tank fits — see below') + '</div></div>';

      html += '<div class="so-res">';
      html += row('Resin required (minimum)', dsp(r.resinDesign, 'resin', UNITS === 'imperial' ? 2 : 1) + ' ' + U('resin'), 'ok',
        fx('resin = (daily volume × days × hardness) ÷ operating capacity', 'ion-exchange sizing', 'operating capacity ' + r.opCap + ' g CaCO₃/L at the ' + r.preset + ' salt setting'));
      if (r.ironAdded > 0) html += row('Design hardness (incl. iron)', Math.round(r.compHard) + ' mg/L CaCO₃', 'watch', fx('compensated = hardness + iron × ' + S.ironFactor, 'iron as CaCO₃ equivalent', ''));
      if (r.tank) html += row('Recommended FRP tank', r.tank.code + ' (' + r.tank.d + '&quot;×' + r.tank.h + '&quot;)', 'ok', '');
      if (r.noTank) html += '<div class="so-flag red">🔴 The load or flow is beyond the largest standard tank in the list — split across a <b>duplex / parallel pair</b>, or spec a custom vessel. Sizing below is for the bare design resin.</div>';
      html += row('Salt per regeneration', dsp(r.saltPerRegen, 'mass', 1) + ' ' + U('mass'), 'ok', fx('salt = loaded resin × salt dose (' + r.dose + ' g/L)', 'salt-dose setting', ''));
      html += row('Softening run per cycle', dsp(r.volCapacity, 'volday', 1) + ' ' + U('volday').replace('/day', ''), 'ok', fx('run = (loaded resin × capacity) ÷ hardness', 'volume treated before regen', ''));
      if (isN(r.daysActual)) html += row('Regenerate about every', r.daysActual.toFixed(1) + ' day' + (r.daysActual >= 1.95 ? 's' : (r.daysActual < 1.05 ? '' : 's')), 'ok', fx('interval = run ÷ daily volume', 'metered regeneration', r.days > 1 ? ('you targeted ' + r.days + ' days') : ''));

      // hydraulic checks
      if (isN(r.serviceVel)) {
        var velSt = r.serviceVel > S.velMax ? 'act' : (r.serviceVel > S.velNom ? 'watch' : 'ok');
        html += row('Service velocity', r.serviceVel.toFixed(0) + ' m/h', velSt, fx('velocity = flow ÷ bed area', 'target ≤ ' + S.velNom + ', max ' + S.velMax + ' m/h', ''));
        var bvSt = (r.bvh > S.bvMax || r.bvh < S.bvMin) ? 'watch' : 'ok';
        html += row('Service rate', r.bvh.toFixed(0) + ' BV/h', bvSt, fx('bed-volumes/hour = flow ÷ resin volume', 'service range ' + S.bvMin + '–' + S.bvMax + ' BV/h', ''));
        html += row('Bed depth', r.bedDepth.toFixed(2) + ' m', r.bedDepth < 0.3 ? 'watch' : 'ok', '');
        if (r.serviceVel > S.velMax) html += '<div class="so-flag amber">⚠ Service velocity is above ' + S.velMax + ' m/h — risk of channelling / hardness leakage. Go to a larger tank or a duplex.</div>';
      }
      // salt usage
      if (isN(r.saltPerMonth)) html += row('Estimated salt use', Math.round(r.saltPerMonth * (UNITS === 'imperial' ? K.mass : 1)) + ' ' + U('mass') + '/month · ' + Math.round(r.saltPerYear * (UNITS === 'imperial' ? K.mass : 1)) + ' ' + U('mass') + '/year', 'ok', '');
      html += '</div>';

      res.push({ label: 'Resin', value: dsp(r.resinLoaded, 'resin', UNITS === 'imperial' ? 2 : 0) + ' ' + U('resin') });
      if (r.tank) res.push({ label: 'FRP tank', value: r.tank.code + ' (' + r.tank.d + '"×' + r.tank.h + '")' });
      res.push({ label: 'Salt / regen', value: dsp(r.saltPerRegen, 'mass', 1) + ' ' + U('mass') });
      res.push({ label: 'Run per cycle', value: dsp(r.volCapacity, 'volday', 1) + ' ' + U('volday').replace('/day', '') });
      if (isN(r.daysActual)) res.push({ label: 'Regen interval', value: r.daysActual.toFixed(1) + ' days' });
      sum.push((r.tank ? r.tank.code + ' · ' : '') + dsp(r.resinLoaded, 'resin', 0) + ' ' + U('resin') + ' · ' + dsp(r.saltPerRegen, 'mass', 1) + ' ' + U('mass') + '/regen');
    }

    // iron pre-treatment warning
    if (isN(x.iron) && x.iron > S.ironWarn) {
      html += '<div class="so-flag amber">⚠ Feed iron ' + x.iron + ' mg/L is above ' + S.ironWarn + ' mg/L. A softener only handles low, clear (ferrous) iron — fit iron pre-treatment (oxidation / filtration) ahead of it, or expect fouling, capacity loss and shorter runs.</div>';
    }

    setHtml('sf_out', html);
    LAST = { summary: sum.join('  ·  ') || 'Enter demand to size', inputs: inp, results: res };
  }

  function setHtml(id, h) { var el = document.getElementById(id); if (el) el.innerHTML = h; }

  /* ---------- units / settings / share ---------- */
  function setUnits(u) {
    if (u === UNITS) return;
    document.querySelectorAll('#sf_root input[data-kind]').forEach(function (el) { var k = el.getAttribute('data-kind'); if (k === 'plain' || !K[k]) return; var v = el.value; if (v === '' || v == null) return; var n = +v; if (!isN(n)) return; el.value = Math.round(convertBetween(n, k, UNITS, u) * 1e6) / 1e6; });
    UNITS = u; try { localStorage.setItem(UNITS_KEY, u); } catch (e) {}
    var vals = {}; document.querySelectorAll('#sf_root input,#sf_root select').forEach(function (el) { if (el.id) vals[el.id] = el.value; });
    mount();
    Object.keys(vals).forEach(function (id) { var el = document.getElementById(id); if (el) el.value = vals[id]; });
    recompute();
  }
  function applySettings() { var n = {}; Object.keys(DEFAULTS).forEach(function (k) { var el = document.getElementById('sf_set_' + k); if (el && el.value !== '') { var v = +el.value; if (isN(v)) n[k] = v; } }); S = Object.assign(loadSettings(), n); saveSettings(S); if (typeof showToast === 'function') showToast('Settings saved'); recompute(); }
  function resetSettings() { S = Object.assign({}, DEFAULTS); saveSettings(S); mount(); recompute(); if (typeof showToast === 'function') showToast('Defaults restored'); }
  function toggle(id) { var el = document.getElementById(id); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; }

  function textSummary() {
    var lines = ['*Hadron — Softener sizing*', new Date().toLocaleString(), ''];
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

  function mount() {
    var root = document.getElementById('sf_root'); if (!root) return;
    injectStyles(); root.innerHTML = shell();
    root.addEventListener('input', recompute); root.addEventListener('change', recompute);
  }
  window.softenerOpen = function () { mount(); recompute(); };
  window.HG_SOFTENER = {
    sizeSoftener: sizeSoftener, selfTest: selfTest,
    lastReading: function () { recompute(); return { inputs: LAST.inputs, results: LAST.results, summary: LAST.summary }; },
    setUnits: setUnits, toggle: toggle, applySettings: applySettings, resetSettings: resetSettings, copyText: copyText
  };
  try { selfTest(); } catch (e) { console.error('[Softener self-test] crashed', e); }
})();
