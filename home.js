/*
 * Hadron Group — Home: sections and search
 *
 * The home screen groups its tiles into sections (index.html: section.hg-home-sec[data-home-sec] holding
 * an .apps-grid[data-home-grid]). This module:
 *   - puts tiles that other modules add later (Team, Portal) into the right section: window.hgHomePlace;
 *   - hides a section when none of its tiles is shown for the signed-in role;
 *   - searches every tool, including the ones inside Dosage, Effluent, Assets, Safety and LIMS, and opens
 *     the one picked directly.
 * Customize home (customize.js) reorders tiles within each section.
 */
(function () {
  'use strict';

  const tr = (k, en) => { const v = (typeof window.t === 'function') ? window.t(k) : null; return v && v !== k ? v : en; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Lower case, no accents, so "regsitreer" style typos aside, "Sakrekenaar" finds "sakrekenaar" and ClO₂ finds "clo2".
  const fold = (s) => String(s || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();   // every combining mark: accents, and the Arabic / Devanagari marks people often leave out

  // Tiles other modules add after load, and the section they belong to ('first' = the front of the first one).
  const PLACE = { team: 'more', portal: 'first' };

  // Tools inside other tools: found by search and opened directly. label is English (the tools' own screens
  // are English); words add what people type.
  const open = (id) => () => { if (typeof window.openWindow === 'function') window.openWindow(id); };
  const dosage = (calc) => () => { if (typeof window.openWindow === 'function') window.openWindow('dosage'); if (typeof window.showCalculator === 'function') window.showCalculator(calc); };
  // openWindow('lims') starts limsOpen(), which is async (IndexedDB) and ends by showing the LIMS hub: go to the
  // view only after it has, or the hub replaces it.
  const lims = (view) => () => {
    let opening = null;
    const orig = window.limsOpen;
    if (typeof orig === 'function') window.limsOpen = function () { opening = orig.apply(this, arguments); return opening; };
    try { if (typeof window.openWindow === 'function') window.openWindow('lims'); }
    finally { if (typeof orig === 'function') window.limsOpen = orig; }
    Promise.resolve(opening).catch(() => {}).then(() => { if (typeof window.limsGo === 'function') window.limsGo(view); });
  };
  const SUBTOOLS = [
    { parent: 'dosage', icon: 'dosage', label: 'Chlorine (TCCA)', words: 'chlorine tcca hth hypochlorite trichlor granules tablets dose', open: dosage('chlorine') },
    { parent: 'dosage', icon: 'dosage', label: 'Chlorine dioxide (ClO₂)', words: 'clo2 chlorine dioxide generator hcl chlorite', open: dosage('chlorinedioxide') },
    { parent: 'dosage', icon: 'dosage', label: 'Coagulants', words: 'coagulant alum ferric chloride pac polyaluminium flocculant', open: dosage('coagulants') },
    { parent: 'dosage', icon: 'dosage', label: 'ClO₂ skid sizing', words: 'clo2 chlorine dioxide skid sizing generator', open: dosage('clo2skid') },
    { parent: 'effluent', tile: 'removalcalc', label: 'BOD / COD / TSS removal', words: 'removal efficiency bod cod tss percent effluent', open: open('removalcalc') },
    { parent: 'effluent', tile: 'fmcalc', label: 'F:M · MLSS · SVI₃₀', words: 'fm food microorganism ratio mlss svi activated sludge', open: open('fmcalc') },
    { parent: 'effluent', tile: 'srtcalc', label: 'Sludge age / SRT', words: 'sludge age srt solids retention mlss wasting', open: open('srtcalc') },
    { parent: 'effluent', tile: 'jartest', label: 'Polymer jar log', words: 'polymer jar test flocculant dose log', open: open('jartest') },
    { parent: 'assets', tile: 'sites', label: 'Site register', words: 'sites site register locations plants', open: open('sites') },
    { parent: 'assets', tile: 'consumables', label: 'Consumables', words: 'consumables stock chemicals inventory', open: open('consumables') },
    { parent: 'assets', tile: 'qrscan', label: 'QR scan', words: 'qr scan code camera', open: open('qrscan') },
    { parent: 'assets', tile: 'qrgen', label: 'QR generator', words: 'qr generator code label sticker print', open: () => { if (typeof window.openAssetsQR === 'function') window.openAssetsQR(); } },
    { parent: 'assets', tile: 'schedule', label: 'PM schedule', words: 'pm planned maintenance schedule service due', open: open('schedule') },
    { parent: 'safety', tile: 'msds', label: 'MSDS library', words: 'msds sds safety data sheet chemical', open: open('msds') },
    { parent: 'safety', tile: 'spill', label: 'Spill response', words: 'spill response leak emergency', open: open('spill') },
    { parent: 'safety', tile: 'ppe', label: 'PPE checklist', words: 'ppe protective equipment gloves goggles checklist', open: open('ppe') },
    { parent: 'safety', tile: 'loto', label: 'LOTO log', words: 'loto lockout tagout isolation', open: open('loto') },
    { parent: 'safety', tile: 'incident', label: 'Incident', words: 'incident accident near miss injury report', open: open('incident') },
    { parent: 'lims', icon: 'lims', label: 'Samples', words: 'samples sample login chain custody lab', open: lims('samples') },
    { parent: 'lims', icon: 'lims', label: 'Results', words: 'results result entry review authorise lab', open: lims('results') },
    { parent: 'lims', icon: 'lims', label: 'Worksheets', words: 'worksheets batch qc lab', open: lims('worksheets') },
    { parent: 'lims', icon: 'lims', label: 'Instruments', words: 'instruments calibration lab register', open: lims('instruments') },
    { parent: 'lims', icon: 'lims', label: 'Reports & COA', words: 'reports coa certificate analysis lab', open: lims('reports') }
  ];
  // What people type for the home tiles themselves, besides their (translated) names.
  const TILE_WORDS = {
    dosage: 'dose dosing chlorine coagulant', waterindex: 'lsi rsi langelier ryznar saturation scaling corrosion',
    coolingtower: 'cooling tower cycles blowdown', boiler: 'boiler steam blowdown cycles', softener: 'softener hardness resin salt',
    rocalc: 'ro reverse osmosis membrane recovery rejection', converters: 'convert units conversion', neutralise: 'acid alkali neutralise ph',
    effluent: 'effluent wastewater sludge', pool: 'pool swimming', 'jartest-dss': 'jar test coagulation', history: 'history saved calculations',
    servicereport: 'service report visit', jobs: 'jobs tasks timer', customers: 'customers clients', assets: 'assets sites equipment qr',
    trends: 'trends graph chart readings', catalogue: 'catalogue products quote', qr: 'qr builder code', safety: 'safety msds ppe loto incident spill',
    lims: 'lims lab laboratory samples results', calibration: 'calibration instruments', academy: 'academy course training learn',
    sops: 'sop procedures', troubleshoot: 'troubleshoot fault problem guide', profile: 'profile account password', settings: 'settings language theme dark',
    files: 'files documents', support: 'support help contact', data: 'data manager import export', team: 'team users invite', portal: 'portal results'
  };

  // A section's name finds its tiles too ("calculator" lists all of them).
  const SEC_WORDS = { calculators: 'calculators calculator', field: 'field service', lab: 'lab laboratory', learn: 'learn learning training', more: 'more' };

  const homeGrids = () => Array.from(document.querySelectorAll('[data-home-grid]'));
  const tileShown = (tile) => tile.style.display !== 'none' && !tile.hidden;
  const tileName = (tile) => { const n = tile.querySelector('.app-name'); return n ? n.textContent.replace(/\u00AD/g, '').trim() : ''; };

  // ── Tiles added later, and sections with nothing to show ──
  function place(tile) {
    const id = tile.getAttribute('data-app');
    const where = PLACE[id] || 'more';
    const grids = homeGrids();
    if (!grids.length) return false;
    if (where === 'first') { tile.setAttribute('data-home-first', ''); grids[0].insertBefore(tile, grids[0].firstChild); }
    else (document.querySelector('[data-home-sec="' + where + '"] [data-home-grid]') || grids[grids.length - 1]).appendChild(tile);
    // A saved layout may already say where this tile goes (customize.js keeps data-home-first tiles in front).
    if (window.HG_HOME && typeof window.HG_HOME.applyOrder === 'function' && !window.HG_HOME.isEditing()) window.HG_HOME.applyOrder();
    refreshSections();
    return true;
  }
  window.hgHomePlace = place;

  function refreshSections() {
    document.querySelectorAll('[data-home-sec]').forEach((sec) => {
      const any = Array.from(sec.querySelectorAll('.app-icon[data-app]')).some(tileShown);
      sec.hidden = !any;
    });
  }

  // ── Search ──
  let input, clearBtn, results, sections, status;
  function items() {
    const out = [];
    homeGrids().forEach((g) => g.querySelectorAll('.app-icon[data-app]').forEach((tile) => {
      if (!tileShown(tile)) return;
      const id = tile.getAttribute('data-app');
      const sec = tile.closest('[data-home-sec]');
      const secWords = sec ? ((sec.querySelector('.hg-home-sec-title') || {}).textContent || '') + ' ' + (SEC_WORDS[sec.getAttribute('data-home-sec')] || '') : '';
      // the parts of a long label split at its soft hyphens are words too: 'berekening' finds 'Doseer\u00ADberekening'
      const parts = ((tile.querySelector('.app-name') || {}).textContent || '').split('\u00AD').join(' ');
      out.push({ id, name: tileName(tile), sub: '', words: (TILE_WORDS[id] || '') + ' ' + id + ' ' + secWords + ' ' + parts, iconFrom: tile, open: () => tile.click() });
    }));
    const parents = {};
    out.forEach((it) => { parents[it.id] = it; });
    SUBTOOLS.forEach((s) => {
      const p = parents[s.parent];
      if (!p) return;                                   // its tool isn't on this home (role): nor is it
      const iconTile = s.tile ? document.querySelector('.app-icon[data-app="' + s.tile + '"]') : p.iconFrom;
      out.push({ id: s.parent + ':' + (s.tile || s.label), name: s.label, sub: tr('home.inside', 'in {parent}').replace('{parent}', p.name), words: s.words, iconFrom: iconTile || p.iconFrom, open: s.open });
    });
    return out;
  }
  const wordsOf = (s) => fold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);   // letters of any script (Cyrillic, Arabic, Devanagari, Han), not only a-z
  // Every word typed must start a word of the tool's name, its section or what people type for it ("ph" finds
  // pH tools, not "graph"). Names first: the name starting with the query, then a word of the name, then the
  // other words; the home's own tiles before the tools inside them.
  function search(q) {
    const terms = wordsOf(q);
    if (!terms.length) return [];
    const scored = [];
    items().forEach((it) => {
      const nameWords = wordsOf(it.name), all = nameWords.concat(wordsOf(it.words));
      if (!terms.every((t) => all.some((w) => w.startsWith(t)))) return;
      const first = terms[0];
      const score = nameWords.join(' ').startsWith(first) ? 0 : nameWords.some((w) => w.startsWith(first)) ? 1 : 2;
      scored.push({ it, score: score + (it.sub ? 1.5 : 0) });
    });
    scored.sort((a, b) => a.score - b.score || a.it.name.localeCompare(b.it.name));
    return scored.map((s) => s.it);
  }
  function render() {
    const q = input.value.trim();
    clearBtn.hidden = !q;
    if (!q) {
      results.hidden = true; results.innerHTML = '';
      sections.forEach((s) => { s.style.display = ''; });
      status.textContent = '';
      return;
    }
    const found = search(q);
    sections.forEach((s) => { s.style.display = 'none'; });
    results.hidden = false;
    if (!found.length) {
      const msg = tr('home.noMatch', 'No tool matches “{q}”').replace('{q}', () => q);   // a function: "$&" in q stays as typed
      results.innerHTML = '<p class="hg-home-noresult">' + esc(msg) + '</p>';
      status.textContent = msg;
      return;
    }
    results.innerHTML = found.map((it, i) =>
      '<div role="listitem"><button type="button" class="hg-home-result" data-i="' + i + '">' +
        '<span class="hg-home-result-ico" aria-hidden="true">' + ((it.iconFrom && it.iconFrom.querySelector('.icon svg')) ? it.iconFrom.querySelector('.icon').innerHTML : '') + '</span>' +
        '<span class="hg-home-result-txt"><span class="hg-home-result-name">' + esc(it.name) + '</span>' +
        (it.sub ? '<span class="hg-home-result-sub">' + esc(it.sub) + '</span>' : '') + '</span>' +
      '</button></div>').join('');
    results.querySelectorAll('.hg-home-result').forEach((b) => b.addEventListener('click', () => pick(found[+b.getAttribute('data-i')])));
    status.textContent = found.length === 1 ? tr('home.oneResult', '1 tool') : tr('home.nResults', '{n} tools').replace('{n}', found.length);
  }
  function pick(it) {
    if (!it) return;
    input.value = '';
    render();
    input.blur();
    it.open();
  }

  function boot() {
    input = document.getElementById('hgHomeSearch');
    clearBtn = document.getElementById('hgHomeSearchClear');
    results = document.getElementById('hgHomeResults');
    status = document.getElementById('hgHomeSearchStatus');
    sections = Array.from(document.querySelectorAll('[data-home-sec]'));
    if (!input || !clearBtn || !results || !status) return;
    const ico = document.querySelector('.hg-home-search-ico');
    if (ico && typeof window.hadronIcon === 'function') ico.innerHTML = window.hadronIcon('search', { size: 20 });
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (document.querySelector('.window.active')) return;   // a window covers the home: Esc / Enter are the window's (app-wide Esc rule)
      if (e.key === 'Enter') { const first = results.querySelector('.hg-home-result'); if (first) { e.preventDefault(); first.click(); } }
      else if (e.key === 'Escape' && input.value) { e.preventDefault(); e.stopPropagation(); input.value = ''; render(); }
    });
    clearBtn.addEventListener('click', () => { input.value = ''; render(); input.focus(); });
    // Tiles another module added straight into a grid before this ran go to their section too.
    document.querySelectorAll('[data-home-grid] .app-icon[data-app]').forEach((tile) => { if (PLACE[tile.getAttribute('data-app')] === 'more' && !tile.closest('[data-home-sec="more"]')) place(tile); });
    refreshSections();
    // The role can be set without a profile event (an offline start uses the last known role): body[data-role].
    if (window.MutationObserver) new MutationObserver(() => { refreshSections(); if (input.value) render(); }).observe(document.body, { attributes: true, attributeFilter: ['data-role'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  // Roles decide which tiles show; a language change renames them (results follow the new names).
  document.addEventListener('hg:profile:loaded', () => setTimeout(() => { refreshSections(); if (input && input.value) render(); }, 0));
  document.addEventListener('hg:lang:changed', () => { if (input && input.value) render(); });
})();
