/*
 * Hadron Group — Pool Water module
 *
 * Covers chlorine, saltwater (SWG) and bromine pools.
 * Inputs: volume, pool type, and full water analysis panel.
 * Outputs: exact dosing in grams/ml of specific chemical products,
 *          LSI (Langelier Saturation Index), and troubleshooting notes.
 *
 * Exposes window.poolOpen() as the entry point.
 */
(function() {
  'use strict';

  /* ---------- Target ranges ----------
   * Based on APSP / WHO / SANS 10252 guidance.
   * fc/tc = mg/L, ta/ch/cya = mg/L as CaCO3 (TA) / Ca (CH) / CYA
   * Salt for SWG, bromine for bromine pools replaces FC.
   */
  const TARGETS = {
    chlorine: {
      ph:    { min: 7.2, ideal: 7.5, max: 7.6 },
      fc:    { min: 1,   ideal: 3,   max: 5 },
      tc:    { min: 0,   ideal: 0,   max: 0.5 },   // Combined chlorine = TC - FC should be <0.5
      ta:    { min: 80,  ideal: 100, max: 120 },
      ch:    { min: 200, ideal: 300, max: 400 },
      cya:   { min: 30,  ideal: 50,  max: 80 },
      temp:  { min: 20,  ideal: 27,  max: 32 },
      tds:   { min: 0,   ideal: 500, max: 1500 },
      phos:  { min: 0,   ideal: 0,   max: 100 },   // ppb
      copper:{ min: 0,   ideal: 0,   max: 0.3 },
      iron:  { min: 0,   ideal: 0,   max: 0.1 },
    },
    saltwater: {
      ph:    { min: 7.2, ideal: 7.5, max: 7.6 },
      fc:    { min: 1,   ideal: 3,   max: 5 },
      tc:    { min: 0,   ideal: 0,   max: 0.5 },
      ta:    { min: 80,  ideal: 100, max: 120 },
      ch:    { min: 200, ideal: 300, max: 400 },
      cya:   { min: 60,  ideal: 70,  max: 80 },    // Higher CYA recommended for SWG
      temp:  { min: 20,  ideal: 27,  max: 32 },
      tds:   { min: 0,   ideal: 500, max: 6000 },  // Higher TDS ok for salt pools
      salt:  { min: 2700, ideal: 3200, max: 3400 },// Typical SWG range, varies by unit
      phos:  { min: 0,   ideal: 0,   max: 100 },
      copper:{ min: 0,   ideal: 0,   max: 0.3 },
      iron:  { min: 0,   ideal: 0,   max: 0.1 },
    },
    bromine: {
      ph:    { min: 7.2, ideal: 7.5, max: 7.6 },
      fc:    { min: 3,   ideal: 4,   max: 6 },     // Bromine residual (mg/L as Br)
      tc:    { min: 0,   ideal: 0,   max: 0.5 },
      ta:    { min: 80,  ideal: 100, max: 120 },
      ch:    { min: 200, ideal: 300, max: 400 },
      cya:   { min: 0,   ideal: 0,   max: 0 },     // CYA not used with bromine
      temp:  { min: 20,  ideal: 32,  max: 38 },
      tds:   { min: 0,   ideal: 500, max: 1500 },
      phos:  { min: 0,   ideal: 0,   max: 100 },
      copper:{ min: 0,   ideal: 0,   max: 0.3 },
      iron:  { min: 0,   ideal: 0,   max: 0.1 },
    }
  };

  const PARAM_LABELS = {
    ph: 'pH', fc: 'Free Chlorine', tc: 'Total Chlorine', ta: 'Total Alkalinity',
    ch: 'Calcium Hardness', cya: 'Cyanuric Acid', temp: 'Temperature',
    tds: 'TDS', salt: 'Salt', phos: 'Phosphates', copper: 'Copper', iron: 'Iron'
  };

  const PARAM_UNITS = {
    ph: '', fc: 'mg/L', tc: 'mg/L', ta: 'mg/L', ch: 'mg/L', cya: 'mg/L',
    temp: '°C', tds: 'mg/L', salt: 'mg/L', phos: 'ppb', copper: 'mg/L', iron: 'mg/L'
  };

  /* ---------- Dosing constants ----------
   * Doses are calibrated per 10 000 L (10 kL) of water.
   * Reference: APSP/Pentair/Clorox dosing tables, cross-checked.
   */
  const DOSES = {
    // pH up: Soda ash (sodium carbonate) raises pH by ~0.2 at 160 g / 10 kL
    sodaAsh_perPH: 160,      // g / 10 kL per 0.2 pH increase
    // pH down: Hydrochloric acid (32%, ~1.16 kg/L) lowers pH by ~0.2 at 120 ml / 10 kL
    hcl_perPH: 120,          // ml / 10 kL per 0.2 pH decrease
    // Dry acid (sodium bisulfate) alternative: 150 g / 10 kL per 0.2 pH down
    dryAcid_perPH: 150,
    // Alkalinity up: Sodium bicarbonate raises TA by 10 mg/L at 170 g / 10 kL
    bicarb_perTA: 17,        // g / 10 kL per 1 mg/L TA increase
    // Calcium hardness up: Calcium chloride dihydrate raises CH by 10 mg/L at 145 g / 10 kL
    calcChloride_perCH: 14.5, // g / 10 kL per 1 mg/L CH increase
    // Cyanuric acid: raises CYA by 10 mg/L at 100 g / 10 kL
    cya_perCYA: 10,          // g / 10 kL per 1 mg/L CYA increase
    // Free chlorine: HTH granules (65% available Cl) raise FC by 1 mg/L at ~15 g / 10 kL
    hth_perFC: 15,           // g / 10 kL per 1 mg/L FC increase
    // Liquid chlorine (12.5% sodium hypochlorite) raises FC by 1 mg/L at ~85 ml / 10 kL
    liquidCl_perFC: 85,      // ml / 10 kL per 1 mg/L FC increase
    // Salt: to raise salt by 100 mg/L, add 1 kg per 10 kL
    salt_perSalt: 0.01,      // kg / 10 kL per 1 mg/L salt increase
    // Bromine tabs (BCDMH 66%): ~18 g / 10 kL per 1 mg/L Br
    bromine_perBr: 18,
  };

  const STATE = {
    poolType: 'chlorine',
    volumeL: 50000,
    readings: {
      ph: 7.6, fc: 1.5, tc: 1.8, ta: 70, ch: 180, cya: 25,
      temp: 26, tds: 800, salt: 0, phos: 0, copper: 0, iron: 0
    },
    analysis: null,  // last run results
  };

  /* ---------- Core math ---------- */
  function fmt(n, dp) {
    if (isNaN(n) || n === null || n === undefined) return '—';
    const d = dp == null ? 2 : dp;
    return Number(n).toFixed(d);
  }

  function round(n, dp) {
    const k = Math.pow(10, dp || 0);
    return Math.round(n * k) / k;
  }

  // Scale a per-10-kL dose to the actual pool volume
  function scale(amt10kL) {
    return amt10kL * (STATE.volumeL / 10000);
  }

  // Format mass: g if < 1000, kg otherwise
  function massFmt(g) {
    if (g < 1000) return fmt(g, 0) + ' g';
    return fmt(g / 1000, 2) + ' kg';
  }
  // Format volume: ml if < 1000, L otherwise
  function volFmt(ml) {
    if (ml < 1000) return fmt(ml, 0) + ' ml';
    return fmt(ml / 1000, 2) + ' L';
  }

  // Langelier Saturation Index
  // LSI = pH + TF + CF + AF - 12.1
  // where TF = temperature factor, CF = calcium hardness factor, AF = alkalinity factor
  function lsi(ph, temp, ch, ta, tds) {
    if (ph == null || temp == null || ch == null || ta == null) return null;
    // Carbonate alkalinity (assume ~equal to TA in normal range)
    // TF table approximation
    const tfTable = [[0,0.0],[4,0.1],[8,0.2],[12,0.3],[16,0.4],[20,0.5],[24,0.6],[28,0.7],[32,0.8],[36,0.9],[40,1.0],[44,1.1],[48,1.2],[52,1.3],[56,1.4]];
    let tf = 0;
    for (const [t,v] of tfTable) { if (temp >= t) tf = v; }
    const cf = Math.log10(ch) - 0.4;
    const af = Math.log10(ta);
    // TDS factor (approximation)
    const tdsFactor = (tds && tds > 800) ? 12.1 : 12.1; // Simplification
    return ph + tf + cf + af - tdsFactor;
  }

  function status(param, val, poolType) {
    const t = TARGETS[poolType][param];
    if (!t || val == null || isNaN(val)) return 'unknown';
    if (val < t.min) return 'low';
    if (val > t.max) return 'high';
    return 'ok';
  }

  /* ---------- Recommendation engine ---------- */
  function analyze() {
    const r = STATE.readings;
    const t = STATE.poolType;
    const ranges = TARGETS[t];
    const recs = [];
    const flags = [];
    const stat = {};

    // pH
    stat.ph = status('ph', r.ph, t);
    if (stat.ph === 'low') {
      const delta = ranges.ph.ideal - r.ph;
      const steps = delta / 0.2;
      const soda = scale(DOSES.sodaAsh_perPH * steps);
      recs.push({ param:'pH', action:'Raise pH', product:'Soda ash (sodium carbonate, Na₂CO₃)', dose: massFmt(soda), note:'Pre-dissolve in a bucket of pool water, pour evenly around the perimeter with pump running.' });
    } else if (stat.ph === 'high') {
      const delta = r.ph - ranges.ph.ideal;
      const steps = delta / 0.2;
      const hcl = scale(DOSES.hcl_perPH * steps);
      const dry = scale(DOSES.dryAcid_perPH * steps);
      recs.push({ param:'pH', action:'Lower pH', product:'Hydrochloric acid (HCl 32%)', dose: volFmt(hcl), alt:'or sodium bisulfate (dry acid): ' + massFmt(dry), note:'Add to deep end with pump running; wait 30 min before retesting. Never pre-mix acid with other chemicals.' });
    }

    // Alkalinity (adjust BEFORE pH ideally, but we present together)
    stat.ta = status('ta', r.ta, t);
    if (stat.ta === 'low') {
      const delta = ranges.ta.ideal - r.ta;
      const bicarb = scale(DOSES.bicarb_perTA * delta);
      recs.push({ param:'TA', action:'Raise total alkalinity', product:'Sodium bicarbonate (NaHCO₃)', dose: massFmt(bicarb), note:'Broadcast across pool surface with pump running. Safe to add alongside other chemistry. Raise TA first, then pH if both are low.' });
    } else if (stat.ta === 'high') {
      recs.push({ param:'TA', action:'Lower total alkalinity', product:'Hydrochloric acid (slow-drip method)', dose:'See note', note:'Add ~200 ml HCl per 10 kL at a single spot with pump OFF, leave 1 h undisturbed so CO₂ gases off. Repeat over several days until TA is in range. Re-check pH after.' });
    }

    // Calcium hardness
    stat.ch = status('ch', r.ch, t);
    if (stat.ch === 'low') {
      const delta = ranges.ch.ideal - r.ch;
      const cc = scale(DOSES.calcChloride_perCH * delta);
      recs.push({ param:'CH', action:'Raise calcium hardness', product:'Calcium chloride dihydrate (CaCl₂·2H₂O, 77%)', dose: massFmt(cc), note:'Pre-dissolve in a bucket. Low CH is aggressive — it will etch plaster and corrode metals.' });
    } else if (stat.ch === 'high') {
      recs.push({ param:'CH', action:'Lower calcium hardness', product:'Partial drain & refill', dose:'See note', note:'No chemical removes CH economically. Drain 20–30% of pool and top up with low-hardness water (rain/RO/softened). Use a sequestrant short-term to prevent scale.' });
    }

    // Cyanuric acid (skip for bromine)
    if (t !== 'bromine') {
      stat.cya = status('cya', r.cya, t);
      if (stat.cya === 'low') {
        const delta = ranges.cya.ideal - r.cya;
        const cya = scale(DOSES.cya_perCYA * delta);
        recs.push({ param:'CYA', action:'Raise cyanuric acid (stabiliser)', product:'Cyanuric acid granules', dose: massFmt(cya), note:'Add through the skimmer basket — dissolves slowly (up to a week). Do not backwash for 48 h after adding.' });
      } else if (stat.cya === 'high') {
        recs.push({ param:'CYA', action:'Lower cyanuric acid', product:'Partial drain & refill', dose:'See note', note:'CYA does not break down in normal use. Drain 25–50% and refill. Very high CYA ("chlorine lock") dramatically reduces sanitiser effectiveness.' });
      }
    }

    // Sanitiser (FC or bromine)
    stat.fc = status('fc', r.fc, t);
    if (t === 'bromine') {
      if (stat.fc === 'low') {
        const delta = ranges.fc.ideal - r.fc;
        const br = scale(DOSES.bromine_perBr * delta);
        recs.push({ param:'Bromine', action:'Raise bromine residual', product:'Bromine tabs (BCDMH, 1" or 3")', dose: massFmt(br), note:'Add to floater or feeder. Bromine is kinetically slower than chlorine but more stable at high temperature — ideal for spas.' });
      } else if (stat.fc === 'high') {
        recs.push({ param:'Bromine', action:'Lower bromine', product:'Wait 24–48 h with pump running', dose:'—', note:'Bromine dissipates with sunlight and aeration. Uncover pool, run pump, avoid using until <6 mg/L.' });
      }
    } else {
      if (stat.fc === 'low') {
        const delta = ranges.fc.ideal - r.fc;
        const hth = scale(DOSES.hth_perFC * delta);
        const liquid = scale(DOSES.liquidCl_perFC * delta);
        recs.push({ param:'FC', action:'Raise free chlorine', product:'HTH granules (calcium hypochlorite 65%)', dose: massFmt(hth), alt:'or liquid chlorine (12.5% NaOCl): ' + volFmt(liquid), note: t==='saltwater' ? 'For salt pools, the SWG should maintain FC. Shock-dose manually only if the cell can\'t keep up (e.g. after heavy bather load).' : 'Broadcast HTH over pool with pump running; dissolve in bucket if water temp < 18 °C.' });
      } else if (stat.fc === 'high') {
        recs.push({ param:'FC', action:'Lower free chlorine', product:'Wait + reduce SWG output / stop adding tabs', dose:'—', note: t==='saltwater' ? 'Turn SWG output down by 20–30% and retest tomorrow. Uncover pool to let UV dissipate FC.' : 'Remove any tablet feeders and let FC drop naturally. Sodium thiosulfate can neutralise quickly if needed (6 g / 10 kL per 1 mg/L reduction).' });
      }
    }

    // Combined chlorine (TC - FC)
    if (t !== 'bromine') {
      const cc = Math.max(0, (r.tc || 0) - (r.fc || 0));
      stat.cc = cc > 0.5 ? 'high' : 'ok';
      if (stat.cc === 'high') {
        const targetFC = cya => 10 * (cya > 0 ? cya : 30) / 7.5;  // Approximate breakpoint
        const shockFC = Math.max(10, targetFC(r.cya));
        const delta = shockFC - r.fc;
        const hth = scale(DOSES.hth_perFC * delta);
        recs.push({ param:'CC', action:'Shock to breakpoint (eliminate chloramines)', product:'HTH or liquid chlorine', dose:'Raise FC to ~' + fmt(shockFC,0) + ' mg/L — ' + massFmt(hth) + ' HTH', note:'Combined chlorine = ' + fmt(cc,1) + ' mg/L. Shock during evening (UV destroys chlorine). Hold FC high until CC drops below 0.5 mg/L.' });
        flags.push('⚠️ High combined chlorine (' + fmt(cc,1) + ' mg/L) — swimmers may report red eyes, strong "chlorine" smell.');
      }
    }

    // Salt (SWG only)
    if (t === 'saltwater') {
      stat.salt = status('salt', r.salt, t);
      if (stat.salt === 'low') {
        const delta = ranges.salt.ideal - r.salt;
        const kg = scale(DOSES.salt_perSalt * delta);
        recs.push({ param:'Salt', action:'Raise salt', product:'Pool salt (NaCl, non-iodised)', dose: fmt(kg, 1) + ' kg', note:'Broadcast into shallow end with pump running. Brush to dissolve. Re-check salt after 24 h. Check your SWG manual for the exact target (typically 3200 mg/L).' });
      } else if (stat.salt === 'high') {
        recs.push({ param:'Salt', action:'Lower salt', product:'Partial drain & refill', dose:'See note', note:'High salt stresses the SWG cell. Drain 20% and refill with fresh water.' });
      }
    }

    // Phosphates
    stat.phos = status('phos', r.phos, t);
    if (stat.phos === 'high') {
      recs.push({ param:'Phosphates', action:'Remove phosphates', product:'Phosphate remover (lanthanum-based)', dose:'Follow bottle instructions (typically 250 ml / 10 kL)', note:'Phosphates (> 100 ppb) feed algae. Reduce then run filter with the remover and clean filter afterwards.' });
      flags.push('Elevated phosphates can trigger algae blooms even with good chlorine.');
    }

    // Metals
    stat.copper = status('copper', r.copper, t);
    stat.iron   = status('iron',   r.iron,   t);
    if (stat.copper === 'high' || stat.iron === 'high') {
      recs.push({ param:'Metals', action:'Sequester metals', product:'Metal sequestrant (HEDP/EDTA)', dose:'250–500 ml / 10 kL initial dose, weekly maintenance', note:'Lower pH to 7.2 before treatment. Metals cause green/black staining and turn hair green. Retest after 1 week.' });
      flags.push('Metals detected — sequestrant needed to prevent staining.');
    }

    // LSI
    const lsiVal = lsi(r.ph, r.temp, r.ch, r.ta, r.tds);
    let lsiStat = 'ok';
    if (lsiVal == null) lsiStat = 'unknown';
    else if (lsiVal < -0.3) lsiStat = 'corrosive';
    else if (lsiVal > 0.3)  lsiStat = 'scaling';

    // TDS
    stat.tds = status('tds', r.tds, t);
    if (stat.tds === 'high' && t !== 'saltwater') {
      flags.push('TDS > ' + ranges.tds.max + ' mg/L — water may look cloudy/dull; consider partial drain.');
    }

    // Ordering advice
    const orderHint = [
      '1. Adjust Total Alkalinity first (it buffers pH).',
      '2. Adjust pH to 7.4–7.6.',
      '3. Adjust Calcium Hardness.',
      '4. Adjust Cyanuric Acid (if chlorine pool).',
      '5. Dose sanitiser (FC / bromine) last.'
    ];

    return { recs, flags, stat, lsi: lsiVal, lsiStat, orderHint };
  }

  /* ---------- Rendering ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function readingChip(param, val) {
    const s = status(param, val, STATE.poolType);
    const cls = s === 'ok' ? 'ok' : (s === 'unknown' ? 'neutral' : (s === 'low' ? 'warn' : 'fail'));
    const txt = s === 'ok' ? 'OK' : (s === 'unknown' ? '—' : (s === 'low' ? 'LOW' : 'HIGH'));
    return `<span class="hg-chip ${cls}">${txt}</span>`;
  }

  function readingRow(param) {
    const r = STATE.readings[param];
    const t = TARGETS[STATE.poolType][param];
    if (!t) return '';
    const label = PARAM_LABELS[param];
    const unit = PARAM_UNITS[param];
    const range = (t.min === t.max && t.max === 0) ? 'n/a' : `${t.min}–${t.max}${unit ? ' ' + unit : ''}`;
    return `
      <tr>
        <td><strong>${label}</strong></td>
        <td>${r == null ? '—' : fmt(r, param === 'ph' ? 1 : (param === 'fc' || param === 'tc' ? 2 : 0))} ${esc(unit)}</td>
        <td style="color:#6b7684; font-size:12px;">${range}</td>
        <td>${readingChip(param, r)}</td>
      </tr>
    `;
  }

  function render() {
    const shell = document.getElementById('poolShell');
    if (!shell) return;
    const t = STATE.poolType;
    const isBromine = t === 'bromine';
    const isSalt = t === 'saltwater';

    shell.innerHTML = `
      <div class="hg-hero" style="background:linear-gradient(135deg,#00b1ca 0%,#1a3d9e 100%);">
        <div>
          <h2 class="hg-hero-title">Pool Water Chemistry</h2>
          <div class="hg-hero-sub">Analyse, dose & troubleshoot your pool</div>
        </div>
        <div class="hg-hero-icon">🏊</div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">1. Pool setup</div>
        <div class="hg-fieldgrid">
          <div class="hg-field">
            <label>Pool type</label>
            <select id="poolTypeSel" onchange="poolSet('poolType', this.value)">
              <option value="chlorine" ${t==='chlorine'?'selected':''}>Chlorine (tabs/liquid)</option>
              <option value="saltwater" ${t==='saltwater'?'selected':''}>Saltwater (SWG)</option>
              <option value="bromine" ${t==='bromine'?'selected':''}>Bromine</option>
            </select>
          </div>
          <div class="hg-field">
            <label>Pool volume (litres)</label>
            <input type="number" id="poolVol" value="${STATE.volumeL}" min="1000" step="1000" oninput="poolSet('volumeL', this.value)">
            <div class="hint">${fmt(STATE.volumeL/1000, 1)} kL · ${fmt(STATE.volumeL*0.264,0)} US gal</div>
          </div>
          <div class="hg-field">
            <label>Or calculate volume</label>
            <button class="hg-btn ghost" onclick="poolCalcVol()">📐 Length × Width × Depth</button>
          </div>
        </div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">2. Water analysis (enter your test results)</div>
        <div class="hg-fieldgrid">
          <div class="hg-field">
            <label>pH</label>
            <input type="number" step="0.1" min="6" max="9" value="${STATE.readings.ph}" oninput="poolSetR('ph', this.value)">
          </div>
          <div class="hg-field">
            <label>${isBromine ? 'Bromine (mg/L)' : 'Free Chlorine (mg/L)'}</label>
            <input type="number" step="0.1" min="0" value="${STATE.readings.fc}" oninput="poolSetR('fc', this.value)">
          </div>
          ${isBromine ? '' : `
          <div class="hg-field">
            <label>Total Chlorine (mg/L)</label>
            <input type="number" step="0.1" min="0" value="${STATE.readings.tc}" oninput="poolSetR('tc', this.value)">
            <div class="hint">TC − FC = combined (chloramines)</div>
          </div>`}
          <div class="hg-field">
            <label>Total Alkalinity (mg/L)</label>
            <input type="number" step="10" min="0" value="${STATE.readings.ta}" oninput="poolSetR('ta', this.value)">
          </div>
          <div class="hg-field">
            <label>Calcium Hardness (mg/L)</label>
            <input type="number" step="10" min="0" value="${STATE.readings.ch}" oninput="poolSetR('ch', this.value)">
          </div>
          ${isBromine ? '' : `
          <div class="hg-field">
            <label>Cyanuric Acid (mg/L)</label>
            <input type="number" step="5" min="0" value="${STATE.readings.cya}" oninput="poolSetR('cya', this.value)">
          </div>`}
          <div class="hg-field">
            <label>Water temperature (°C)</label>
            <input type="number" step="1" min="0" max="45" value="${STATE.readings.temp}" oninput="poolSetR('temp', this.value)">
          </div>
          <div class="hg-field">
            <label>TDS (mg/L)</label>
            <input type="number" step="100" min="0" value="${STATE.readings.tds}" oninput="poolSetR('tds', this.value)">
          </div>
          ${isSalt ? `
          <div class="hg-field">
            <label>Salt (mg/L)</label>
            <input type="number" step="100" min="0" value="${STATE.readings.salt}" oninput="poolSetR('salt', this.value)">
          </div>` : ''}
          <div class="hg-field">
            <label>Phosphates (ppb)</label>
            <input type="number" step="50" min="0" value="${STATE.readings.phos}" oninput="poolSetR('phos', this.value)">
          </div>
          <div class="hg-field">
            <label>Copper (mg/L)</label>
            <input type="number" step="0.1" min="0" value="${STATE.readings.copper}" oninput="poolSetR('copper', this.value)">
          </div>
          <div class="hg-field">
            <label>Iron (mg/L)</label>
            <input type="number" step="0.1" min="0" value="${STATE.readings.iron}" oninput="poolSetR('iron', this.value)">
          </div>
        </div>
        <div class="hg-actions">
          <button class="hg-btn primary" onclick="poolAnalyse()">🧪 Analyse & recommend</button>
          <button class="hg-btn ghost" onclick="poolLoadExample()">Load example</button>
        </div>
      </div>

      <div id="poolResults"></div>
    `;
  }

  function renderResults() {
    const host = document.getElementById('poolResults');
    if (!host) return;
    if (!STATE.analysis) { host.innerHTML = ''; return; }
    const a = STATE.analysis;
    const r = STATE.readings;
    const t = STATE.poolType;
    const isBromine = t === 'bromine';
    const isSalt = t === 'saltwater';

    const params = ['ph','fc'];
    if (!isBromine) params.push('tc');
    params.push('ta','ch');
    if (!isBromine) params.push('cya');
    params.push('temp','tds');
    if (isSalt) params.push('salt');
    params.push('phos','copper','iron');

    const lsiChipCls = a.lsiStat === 'ok' ? 'ok' : (a.lsiStat === 'unknown' ? 'neutral' : 'fail');
    const lsiChipTxt = a.lsiStat === 'ok' ? 'BALANCED' : (a.lsiStat === 'unknown' ? '—' : a.lsiStat.toUpperCase());

    host.innerHTML = `
      <div class="hg-card">
        <div class="hg-section-title">📊 Readings summary</div>
        <table class="hg-table compact" style="margin-bottom:10px;">
          <thead><tr><th>Parameter</th><th>Reading</th><th>Target</th><th>Status</th></tr></thead>
          <tbody>${params.map(p => readingRow(p)).join('')}</tbody>
        </table>
        <div class="hg-kvgrid">
          <div class="hg-kv">
            <div class="k">LSI (Langelier)</div>
            <div class="v">${a.lsi == null ? '—' : fmt(a.lsi, 2)} <span class="hg-chip ${lsiChipCls}" style="margin-left:4px;">${lsiChipTxt}</span></div>
          </div>
          <div class="hg-kv">
            <div class="k">Combined Cl (chloramines)</div>
            <div class="v">${isBromine ? 'n/a' : fmt(Math.max(0, (r.tc||0) - (r.fc||0)), 1) + ' <small>mg/L</small>'}</div>
          </div>
          <div class="hg-kv">
            <div class="k">Pool volume</div>
            <div class="v">${fmt(STATE.volumeL/1000, 1)} <small>kL</small></div>
          </div>
        </div>
      </div>

      ${a.flags.length ? `<div class="hg-card">
        <div class="hg-section-title">⚠️ Flags</div>
        ${a.flags.map(f => `<div class="hg-alert warn">${esc(f)}</div>`).join('')}
      </div>` : ''}

      <div class="hg-card">
        <div class="hg-section-title">💊 Dosing recommendations</div>
        ${a.recs.length === 0
          ? `<div class="hg-alert ok"><strong>All parameters are in range.</strong> Maintain your current routine — retest in 3–7 days.</div>`
          : a.recs.map(rec => `
            <div class="hg-recipe">
              <div style="font-weight:700; margin-bottom:4px;">${esc(rec.action)} <span class="hg-chip accent" style="margin-left:6px;">${esc(rec.param)}</span></div>
              <div style="margin-bottom:6px;"><strong>Product:</strong> ${esc(rec.product)}</div>
              <div style="margin-bottom:6px;"><strong>Dose:</strong> ${esc(rec.dose)}</div>
              ${rec.alt ? `<div style="margin-bottom:6px; color:#6b7684; font-size:13px;">${esc(rec.alt)}</div>` : ''}
              ${rec.note ? `<div style="font-size:13px; color:#4f4f4f; line-height:1.5;">${esc(rec.note)}</div>` : ''}
            </div>
          `).join('')}
      </div>

      <div class="hg-card">
        <div class="hg-section-title">🧭 Recommended order of dosing</div>
        <ol style="padding-left:20px; line-height:1.8; color:#2e3742; font-size:14px; margin:0;">
          ${a.orderHint.map(s => `<li>${esc(s.replace(/^\d+\.\s*/, ''))}</li>`).join('')}
        </ol>
        <div class="hg-alert info" style="margin-top:14px;">
          <strong>Always retest 30 min after dosing (or 24 h after major changes).</strong> Wear gloves &amp; eye protection. Never mix chemicals — add one at a time with the pump running.
        </div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">🧯 Troubleshooting</div>
        ${renderTroubleshoot(a, r, t)}
      </div>

      <div class="hg-actions">
        <button class="hg-btn primary" onclick="poolExport()">📄 Export report</button>
        <button class="hg-btn ghost" onclick="poolAnalyse()">🔁 Re-analyse</button>
      </div>
    `;
  }

  function renderTroubleshoot(a, r, t) {
    const issues = [];
    // Cloudy water
    if (r.ph > 7.8 && r.ch > 350) issues.push({ icon:'☁️', title:'Cloudy water', cause:'High pH + high CH causing calcium carbonate scale', fix:'Lower pH to 7.4, check TA, consider partial drain if CH > 400.' });
    if (r.ph > 8 || r.ta > 150) issues.push({ icon:'☁️', title:'Cloudy / dull water', cause:'High pH or alkalinity', fix:'Lower pH and TA with HCl; run filter.' });
    // Green / algae
    if (r.fc < 1 && t !== 'bromine') issues.push({ icon:'🟢', title:'Green tint / algae risk', cause:'Free chlorine too low — algae starting to grow', fix:'Shock to 3× CYA level, brush walls, run filter 24 h, backwash, repeat if needed.' });
    if (r.phos > 200) issues.push({ icon:'🟢', title:'Recurring algae', cause:'High phosphates feeding algae despite chlorine', fix:'Reduce phosphates with lanthanum remover, then shock.' });
    // Eye/skin irritation
    if (t !== 'bromine' && ((r.tc||0) - (r.fc||0)) > 0.5) issues.push({ icon:'👁️', title:'Eye / skin irritation', cause:'Combined chlorine (chloramines) > 0.5 mg/L', fix:'Shock to breakpoint. Check pH is 7.4–7.6.' });
    if (r.ph < 7.0) issues.push({ icon:'👁️', title:'Stinging eyes, corroding metal', cause:'Acidic water (pH < 7.0)', fix:'Raise pH with soda ash; check TA.' });
    // Scale / staining
    if (a.lsi != null && a.lsi > 0.3) issues.push({ icon:'🤍', title:'White scale on waterline / equipment', cause:'Positive LSI — water is scale-forming', fix:'Lower pH to 7.2–7.4. If CH > 400, partial drain.' });
    if (a.lsi != null && a.lsi < -0.3) issues.push({ icon:'🩶', title:'Etched plaster, corroded metals', cause:'Negative LSI — water is aggressive', fix:'Raise pH, TA and CH to bring LSI into -0.3 to +0.3 range.' });
    // Metals
    if ((r.copper||0) > 0.3) issues.push({ icon:'💚', title:'Green hair / blue-green water', cause:'High copper (' + fmt(r.copper, 2) + ' mg/L)', fix:'Sequester metals, check any copper-based algaecide, source of copper (heater coil?).' });
    if ((r.iron||0) > 0.3)   issues.push({ icon:'🟤', title:'Brown/rust staining', cause:'High iron (' + fmt(r.iron, 2) + ' mg/L)', fix:'Sequester metals; consider filling from RO or softened water.' });
    // Salt pool specifics
    if (t === 'saltwater' && r.salt < 2700) issues.push({ icon:'🧂', title:'SWG not producing chlorine', cause:'Salt level too low (' + fmt(r.salt,0) + ' mg/L)', fix:'Add salt to target (~3200 mg/L). Check cell is clean & not scaled.' });
    if (t === 'saltwater' && r.ph > 7.8) issues.push({ icon:'📈', title:'pH drifts up in salt pool', cause:'SWG naturally drives pH up via aeration', fix:'Dose small amounts of HCl weekly, keep TA 70–80 mg/L (slightly lower than chlorine pools).' });

    if (issues.length === 0) return `<div class="hg-alert ok">No common issues detected from your readings.</div>`;
    return issues.map(i => `
      <div class="hg-recipe" style="border-left-color:#b37600;">
        <div style="font-weight:700; margin-bottom:4px;">${i.icon} ${esc(i.title)}</div>
        <div style="margin-bottom:4px;"><strong>Likely cause:</strong> ${esc(i.cause)}</div>
        <div style="font-size:13px; color:#4f4f4f; line-height:1.5;"><strong>Fix:</strong> ${esc(i.fix)}</div>
      </div>
    `).join('');
  }

  /* ---------- Handlers ---------- */
  window.poolSet = function(key, val) {
    if (key === 'poolType') STATE.poolType = val;
    else if (key === 'volumeL') STATE.volumeL = Math.max(1, Number(val) || 0);
    render();
  };

  window.poolSetR = function(param, val) {
    STATE.readings[param] = val === '' ? null : Number(val);
  };

  window.poolAnalyse = function() {
    STATE.analysis = analyze();
    renderResults();
    setTimeout(()=>{ const el = document.getElementById('poolResults'); if (el) el.scrollIntoView({behavior:'smooth', block:'start'}); }, 60);
  };

  window.poolLoadExample = function() {
    STATE.poolType = 'chlorine';
    STATE.volumeL = 50000;
    STATE.readings = { ph: 7.8, fc: 0.6, tc: 1.4, ta: 60, ch: 150, cya: 20, temp: 27, tds: 900, salt: 0, phos: 250, copper: 0, iron: 0 };
    render();
    setTimeout(()=>window.poolAnalyse(), 50);
  };

  window.poolCalcVol = function() {
    const l = prompt('Pool length (m)?'); if (l == null) return;
    const w = prompt('Pool width (m)?'); if (w == null) return;
    const d = prompt('Average pool depth (m)?'); if (d == null) return;
    const vol = (Number(l) * Number(w) * Number(d) * 1000);
    if (isNaN(vol) || vol <= 0) { alert('Invalid dimensions'); return; }
    STATE.volumeL = Math.round(vol);
    render();
  };

  window.poolExport = function() {
    if (!STATE.analysis) return;
    const a = STATE.analysis;
    const r = STATE.readings;
    const t = STATE.poolType;
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) { alert('Pop-up blocked — please allow pop-ups to export.'); return; }
    const lsiTxt = a.lsi == null ? '—' : fmt(a.lsi, 2) + ' (' + a.lsiStat + ')';
    const date = new Date().toLocaleString();
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Pool Water Report</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 720px; margin: 30px auto; padding: 20px; color:#2e3742; }
  h1 { color:#00b1ca; border-bottom:2px solid #00b1ca; padding-bottom:8px; }
  h2 { color:#00b1ca; margin-top:28px; font-size:16px; }
  table { width:100%; border-collapse: collapse; margin-bottom:16px; }
  th,td { padding:8px 10px; border-bottom:1px solid #eee; text-align:left; font-size:13px; }
  th { background:#f5f8fa; color:#6b7684; text-transform:uppercase; font-size:11px; letter-spacing:0.5px; }
  .rec { background:#f7fbfd; border-left:4px solid #00b1ca; padding:10px 12px; margin:8px 0; font-size:13px; line-height:1.5; border-radius:0 8px 8px 0; }
  .flag { background:#fff4de; border-left:4px solid #b37600; padding:10px 12px; margin:8px 0; font-size:13px; border-radius:0 8px 8px 0; }
  .footer { margin-top:30px; color:#9aa3aa; font-size:11px; text-align:center; border-top:1px solid #eee; padding-top:12px; }
  @media print { body { margin:0; padding:16px; } }
</style></head><body>
<h1>Hadron Group — Pool Water Report</h1>
<p><strong>Date:</strong> ${esc(date)}</p>
<p><strong>Pool type:</strong> ${esc(t)} &nbsp; · &nbsp; <strong>Volume:</strong> ${fmt(STATE.volumeL/1000,1)} kL</p>

<h2>Readings</h2>
<table>
  <tr><th>Parameter</th><th>Reading</th><th>Status</th></tr>
  ${Object.keys(r).filter(k=>TARGETS[t][k]).map(k=>{
    const s = status(k, r[k], t);
    const stat = s==='ok'?'OK':(s==='low'?'LOW':(s==='high'?'HIGH':'—'));
    return `<tr><td>${esc(PARAM_LABELS[k])}</td><td>${r[k]==null?'—':fmt(r[k], k==='ph'?1:(k==='fc'||k==='tc'?2:0)) + ' ' + esc(PARAM_UNITS[k])}</td><td>${stat}</td></tr>`;
  }).join('')}
  <tr><td><strong>LSI</strong></td><td colspan="2">${esc(lsiTxt)}</td></tr>
</table>

${a.flags.length ? '<h2>Flags</h2>' + a.flags.map(f=>`<div class="flag">${esc(f)}</div>`).join('') : ''}

<h2>Recommendations</h2>
${a.recs.length === 0 ? '<p>All parameters are in range — maintain current routine.</p>' :
  a.recs.map(rec => `<div class="rec"><strong>${esc(rec.action)} (${esc(rec.param)})</strong><br>Product: ${esc(rec.product)}<br>Dose: ${esc(rec.dose)}${rec.alt?'<br>'+esc(rec.alt):''}${rec.note?'<br><em>'+esc(rec.note)+'</em>':''}</div>`).join('')}

<h2>Dosing order</h2>
<ol>${a.orderHint.map(s=>`<li>${esc(s.replace(/^\d+\.\s*/,''))}</li>`).join('')}</ol>

<div class="footer">Hadron Group Pool Water Assistant · All calculations are on-device · Always retest after dosing.</div>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 200); };<\/script>
</body></html>`;
    w.document.write(html);
    w.document.close();
  };

  /* ---------- Entry point ---------- */
  window.poolOpen = function() {
    render();
  };
})();
