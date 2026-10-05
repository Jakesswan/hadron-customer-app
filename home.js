/*
 * Hadron Group — Home: sections and search
 *
 * The home screen groups its tiles into sections (index.html: section.hg-home-sec[data-home-sec] holding
 * an .apps-grid[data-home-grid]). This module:
 *   - puts tiles that other modules add later (Team, Portal) into the right section: window.hgHomePlace;
 *   - hides a section when none of its tiles is shown for the signed-in role;
 *   - searches every tool, including the ones inside Dosage, Effluent, Assets, Safety and LIMS, and opens
 *     the one picked directly;
 *   - shows unfinished work at the top (Continue: a service report that wasn't saved, a job timer still
 *     running), the tools this person pinned (Pinned) and the last tools opened (Recent). While customizing,
 *     every tile has a star that pins it; so does every search result.
 * Customize home (customize.js) reorders tiles within each section.
 * On a phone or tablet the home is split into tabs (Home, Tools, Field, Learn, Account): see "Tabs" below.
 */
(function () {
  'use strict';

  const tr = (k, en) => { const v = (typeof window.t === 'function') ? window.t(k) : null; return v && v !== k ? v : en; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Lower case, no accents, so "regsitreer" style typos aside, "Sakrekenaar" finds "sakrekenaar" and ClO₂ finds "clo2".
  const fold = (s) => String(s || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();   // every combining mark: accents, and the Arabic / Devanagari marks people often leave out

  // Tiles other modules add after load, and the section they belong to ('first' = the front of Calculators, the first
  // section for every role that sees such a tile).
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
    if (where === 'first') { const g = document.querySelector('[data-home-sec="' + SEC_DEFAULT[0] + '"] [data-home-grid]') || grids[0]; tile.setAttribute('data-home-first', ''); g.insertBefore(tile, g.firstChild); }
    else (document.querySelector('[data-home-sec="' + where + '"] [data-home-grid]') || grids[grids.length - 1]).appendChild(tile);
    // A saved layout may already say where this tile goes (customize.js keeps data-home-first tiles in front).
    if (window.HG_HOME && typeof window.HG_HOME.applyOrder === 'function' && !window.HG_HOME.isEditing()) window.HG_HOME.applyOrder();
    refreshSections();
    if (editing()) paintTileStars(tile);
    renderQuick();   // a recent Team / Portal can be shown now
    return true;
  }
  window.hgHomePlace = place;

  // Home by role: Hadron's own people (admin) are mostly on site visits, so Field service comes first for them;
  // everyone else starts with the calculators (a viewer's Portal is in front of those).
  const SEC_ORDER = { admin: ['field', 'calculators', 'lab', 'learn', 'more'] };
  const SEC_DEFAULT = ['calculators', 'field', 'lab', 'learn', 'more'];
  function orderSections() {
    const all = Array.from(document.querySelectorAll('[data-home-sec]'));
    if (all.length < 2) return;
    const want = SEC_ORDER[document.body.getAttribute('data-role') || ''] || SEC_DEFAULT;
    const rank = (s) => { const i = want.indexOf(s.getAttribute('data-home-sec')); return i === -1 ? want.length : i; };
    const sorted = all.slice().sort((a, b) => rank(a) - rank(b));
    if (sorted.every((s, i) => s === all[i])) return;
    const parent = all[0].parentNode, after = all[all.length - 1].nextSibling;
    sorted.forEach((s) => parent.insertBefore(s, after));
  }

  function refreshSections() {
    orderSections();
    document.querySelectorAll('[data-home-sec]').forEach((sec) => {
      const any = Array.from(sec.querySelectorAll('.app-icon[data-app]')).some(tileShown);
      sec.hidden = !any;
    });
    // the Home tab shows the role's own section (the first in its order) under the unfinished, pinned and recent tools
    const primary = Array.from(document.querySelectorAll('[data-home-sec]')).find((s) => !s.hidden && s.getAttribute('data-home-sec') !== 'more');
    document.querySelectorAll('[data-home-sec]').forEach((s) => { if (s === primary) s.setAttribute('data-home-primary', ''); else s.removeAttribute('data-home-primary'); });
    if (tabHasContent(tab)) paintTabs(); else goTab(homeTab());   // a role without that tab's tools: Home
  }

  // ── Tabs (a phone or a tablet): Home · Tools · Field · Learn · Account ──
  // A bar at the bottom shows one part of the home at a time: Home (search, unfinished work, pinned and recent tools,
  // and the role's own section), Tools (the calculators), Field (field service and the lab), Learn, and Account. A wider
  // screen keeps the one-page home, and the avatar opens the account menu there. Back on another tab goes Home first
  // (index.html's Back guard asks hgHomeTab.away()), then out of the app as before.
  const TABS = ['home', 'tools', 'field', 'learn', 'account'];
  const TAB_SECS = { tools: ['calculators'], field: ['field', 'lab'], learn: ['learn'] };
  const TAB_ICONS = { home: 'dashboard', tools: 'dosage', field: 'document', learn: 'academy', account: 'profile', signin: 'profile' };
  const tabsMq = typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 768px)') : null;
  let tab = 'home';
  const tabsOn = () => !!(tabsMq && tabsMq.matches);
  // A guest (the calculators without an account, auth-ui.js): Tools (their start) and Learn; "Sign in" in the bar
  const isGuest = () => document.body.classList.contains('hg-guest');
  const homeTab = () => isGuest() ? 'tools' : 'home';
  const secsShown = (name) => (TAB_SECS[name] || []).some((s) => { const sec = document.querySelector('[data-home-sec="' + s + '"]'); return !!sec && !sec.hidden; });
  const tabHasContent = (name) => isGuest() ? ((name === 'tools' || name === 'learn') && secsShown(name)) : (name === 'home' || name === 'account' || secsShown(name));
  function paintTabs() {
    if (!tabHasContent(tab)) tab = homeTab();   // (became a guest, or no longer one)
    document.body.classList.toggle('hg-tabs', tabsOn());
    // the avatar: the Account tab on a phone (no pop-up), the account menu (a dialog) on a wider screen
    const ab = document.getElementById('hgAccountBtn');
    if (ab) { if (tabsOn()) { ab.removeAttribute('aria-haspopup'); ab.setAttribute('aria-label', tr('tab.account', 'Account')); } else { ab.setAttribute('aria-haspopup', 'dialog'); ab.setAttribute('aria-label', 'Account menu'); } }
    const desk = document.getElementById('desktop');
    if (desk) desk.setAttribute('data-tab', tab);
    document.querySelectorAll('#hgTabbar .hg-tab[data-tab]').forEach((b) => {
      const name = b.getAttribute('data-tab');
      b.hidden = name === 'signin' ? !isGuest() : !tabHasContent(name);
      if (name === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  function goTab(name) {
    if (TABS.indexOf(name) === -1) return;
    if (!tabsOn() || !tabHasContent(name)) name = homeTab();
    const was = tab;
    if (name !== 'home' && input && input.value) { input.value = ''; render(); }   // a search hides every section: not carried to another tab
    // Account has no tiles to arrange: Customize ends there (what was arranged is kept). Tools, Field and Learn have theirs.
    if (name === 'account' && editing() && window.HG_HOME && typeof window.HG_HOME.exitEditMode === 'function') window.HG_HOME.exitEditMode();
    tab = name;
    paintTabs();
    if (name === 'account') renderAccount();
    // the focus was in what just went out of view (Back from another tab): the current tab takes it, not the page
    const f = document.activeElement;
    if (f && f !== document.body && !f.getClientRects().length) { const cur = document.querySelector('#hgTabbar .hg-tab[data-tab="' + tab + '"]'); if (cur && cur.getClientRects().length) cur.focus({ preventScroll: true }); }
    const c = document.querySelector('.desktop-content'); if (c) c.scrollTop = 0;   // a tab opens at its top (tapped again: back to the top)
    // Back: from another tab, Home first (one history entry, index.html); Home itself keeps none
    if (was !== name) {
      if (name !== homeTab()) { if (typeof window.hgArmBack === 'function') window.hgArmBack(); }
      else if (typeof window.hgDisarmBack === 'function') window.hgDisarmBack();
    }
  }
  window.hgHomeTab = { go: goTab, get: () => tab, away: () => tabsOn() && tab !== homeTab() };

  // ── Account (the tab): who is signed in and how this phone's changes stand, their settings, the company's tools, and
  // signing out. From the profile; offline before it loads, from the top bar (name, company) and the last known role.
  const ROLE_WORDS = { admin: ['account.role.admin', 'Hadron staff (admin)'], customer_admin: ['account.role.customer_admin', 'Customer admin'],
    operator: ['account.role.operator', 'Operator'], viewer: ['account.role.viewer', 'Viewer'] };
  const CHEV = '<svg class="hg-acct-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const textOf = (id) => { const el = document.getElementById(id); return el ? el.textContent.trim() : ''; };
  const noMark = (s) => String(s || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();   // "🌓 Auto" → "Auto"
  const openW = (id) => { if (typeof window.openWindow === 'function') window.openWindow(id); };
  const ACCOUNT_DO = {
    profile: () => openW('profile'),
    language: () => { openW('settings'); setTimeout(() => { const s = document.getElementById('languageSelect'); if (s) s.focus(); }, 350); },
    appearance: () => openW('settings'),
    customize: () => { goTab('home'); if (typeof window.hgCustomizeHome === 'function') window.hgCustomizeHome(); },
    team: () => { const t = homeTile('team'); if (t) t.click(); },
    data: () => { const t = homeTile('data'); if (t) t.click(); },
    files: () => openW('files'),
    support: () => openW('support'),
    settings: () => openW('settings'),
    signout: () => { if (typeof window.hgConfirmSignOut === 'function') window.hgConfirmSignOut(); else if (typeof window.hgOpenAccountMenu === 'function') window.hgOpenAccountMenu(); }
  };
  let acctHtml = '';   // what the panel shows now: drawn again only when that changes
  function renderAccount() {
    const host = document.getElementById('hgAccount');
    if (!host) return;
    const p = window.HG_PROFILE || {};
    const name = String(p.full_name || (p.email ? String(p.email).split('@')[0] : '') || textOf('userName'));
    const org = String((p.organisations && p.organisations.name) || textOf('hgTopOrg'));
    const rw = ROLE_WORDS[document.body.getAttribute('data-role') || p.role || ''];
    const chip = document.getElementById('hgSyncChip');
    const sync = chip && !chip.hidden ? textOf('hgSyncText') : '';
    const langs = (window.HADRON_I18N && Array.isArray(window.HADRON_I18N.LANGUAGES)) ? window.HADRON_I18N.LANGUAGES : [];
    const lang = (langs.find((l) => l && l.code === (window.currentLanguage || 'en')) || {}).name || '';
    const choice = typeof window.themeChoice === 'function' ? window.themeChoice() : 'auto';
    const theme = noMark(tr('settings.' + choice, choice === 'light' ? 'Light' : choice === 'dark' ? 'Dark' : 'Auto'));
    const shown = (id) => { const t = homeTile(id); return !!t && tileShown(t); };
    const kv = Array.from(document.querySelectorAll('.hg-kv')).find((x) => ((x.querySelector('.k') || {}).textContent || '').trim() === 'Version');
    const version = kv ? ((kv.querySelector('.v') || {}).textContent || '').trim() : '';
    const row = (id, label, value) => '<button type="button" class="hg-acct-row" data-acct="' + id + '"><span class="hg-acct-label">' + esc(label) + '</span>' +
      (value ? '<span class="hg-acct-val">' + esc(value) + '</span>' : '') + CHEV + '</button>';
    const html =
      '<h2 class="hg-sr-only" id="hgAccountTitle">' + esc(tr('account.title', 'Account')) + '</h2>' +
      '<div class="hg-acct-you">' +
        '<span class="hg-acct-avatar" aria-hidden="true">' + esc((textOf('userAvatar') || name.charAt(0) || '?').slice(0, 2)) + '</span>' +
        '<span class="hg-acct-who"><span class="hg-acct-name">' + esc(name) + '</span>' +
          ((org || rw) ? '<span class="hg-acct-sub">' + esc([org, rw ? tr(rw[0], rw[1]) : ''].filter(Boolean).join(' · ')) + '</span>' : '') +
          (sync ? '<span class="hg-acct-sync" data-state="' + esc(chip.getAttribute('data-state') || '') + '">' + esc(sync) + '</span>' : '') +
        '</span></div>' +
      '<div class="hg-acct-group" role="group" aria-label="' + esc(tr('account.settingsGroup', 'Your settings')) + '">' +
        row('profile', tr('account.profile', 'Profile and password')) +
        row('language', tr('settings.language', 'Language'), lang) +
        row('appearance', tr('settings.appearance', 'Appearance'), theme) +
        row('customize', tr('account.customize', 'Customize home')) + '</div>' +
      '<div class="hg-acct-group" role="group" aria-label="' + esc(tr('account.app', 'App and company')) + '">' +
        (shown('team') ? row('team', tr('account.team', 'Team')) : '') +
        (shown('data') ? row('data', tr('account.data', 'Data manager')) : '') +
        row('files', tr('app.files', 'Files')) + row('support', tr('app.support', 'Support')) + row('settings', tr('app.settings', 'Settings')) + '</div>' +
      '<button type="button" class="hg-acct-signout" data-acct="signout">' + esc(tr('account.signOut', 'Sign out')) + '</button>' +
      (version ? '<p class="hg-acct-version">' + esc(tr('account.version', 'Version {v}').replace('{v}', () => version)) + '</p>' : '');
    // Unchanged (the sync chip refreshed, a window closed): left as it is, so the focus and a tap in progress aren't lost.
    if (html === acctHtml && host.firstChild) return;
    const had = host.contains(document.activeElement) ? document.activeElement.getAttribute('data-acct') : null;
    host.innerHTML = acctHtml = html;
    if (had) { const b = host.querySelector('[data-acct="' + had + '"]'); if (b) b.focus({ preventScroll: true }); }   // a row redrawn keeps the keyboard
  }

  // ── Continue (unfinished work) and Recent (the last tools opened) ──
  // The recent list is this person's data on the phone: an hg_ key, kept per user at sign-out.
  const RECENT_KEY = 'hg_home_recent_v1';
  const RECENT_KEEP = 10, RECENT_SHOW = 3;
  // Pinned: the tools this person keeps at the top, in their order (an hg_ key too).
  const PINS_KEY = 'hg_home_pins_v1', PINS_MAX = 9;
  let quick = null, pinSort = null;   // pinSort: the Pinned row's SortableJS while customizing
  const readJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (_) { return d; } };
  const homeTile = (id) => Array.from(document.querySelectorAll('[data-home-grid] .app-icon[data-app]')).find((t) => t.getAttribute('data-app') === id) || null;
  const editing = () => !!(window.HG_HOME && typeof window.HG_HOME.isEditing === 'function' && window.HG_HOME.isEditing());
  const iconOf = (tile) => { const i = tile && tile.querySelector('.icon'); return i ? i.innerHTML : ''; };
  function recentList() {
    const a = readJSON(RECENT_KEY, []);
    return Array.isArray(a) ? a.filter((x) => x && typeof x.id === 'string') : [];
  }
  function recordRecent(id) {
    if (!id || window.__hgTenantFrozen) return;   // signing out: this person's data is being put away
    const next = [{ id: id, at: Date.now() }].concat(recentList().filter((x) => x.id !== id)).slice(0, RECENT_KEEP);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch (_) {}
  }
  function pinList() {
    const a = readJSON(PINS_KEY, []);
    return Array.isArray(a) ? a.filter((x, i) => typeof x === 'string' && a.indexOf(x) === i) : [];
  }
  function savePins(list) {
    if (window.__hgTenantFrozen) return false;
    try { localStorage.setItem(PINS_KEY, JSON.stringify(list)); } catch (_) { return false; }
    setSyncState('pending'); pushPins();   // to the person's other phones
    return true;
  }
  // ── Pins follow the person to their other phones: profiles.preferences.home_pins, like the home order ──
  // hg_home_pins_sync_v1 (this person's data on the phone, like the pins): 'pending' while a change made here
  // hasn't reached the cloud (offline: it goes later), 'ok' once it has; not there on a phone that hasn't synced
  // its pins yet, whose pins are then merged with the cloud's (pins made on two phones before v165 are both kept).
  const PINS_SYNC_KEY = 'hg_home_pins_sync_v1';
  const syncState = () => { try { return localStorage.getItem(PINS_SYNC_KEY); } catch (_) { return null; } };
  const setSyncState = (v) => { if (window.__hgTenantFrozen) return; try { localStorage.setItem(PINS_SYNC_KEY, v); } catch (_) {} };
  const cloudOn = () => !!(window.HG_AUTH && window.HG_AUTH.configured && typeof window.HG_AUTH.setPreference === 'function' && window.HG_PROFILE);
  function pushPins() {
    if (!cloudOn() || window.__hgOfflineSession || navigator.onLine === false) return;   // stays 'pending': sent later
    const list = pinList();
    Promise.resolve(window.HG_AUTH.setPreference('home_pins', list)).then((res) => {
      // reached the cloud, and nothing was changed here meanwhile: in sync
      if (res && JSON.stringify(pinList()) === JSON.stringify(list)) setSyncState('ok');
    }, () => {});
  }
  // When the profile loads (sign-in, start-up, refresh) and when back online: send a change still waiting; else
  // take the cloud's pins (a change made on another phone).
  function syncPins() {
    if (!cloudOn() || window.__hgTenantFrozen) return;
    const state = syncState();
    if (state === 'pending') { pushPins(); return; }
    const prefs = (window.HG_PROFILE && window.HG_PROFILE.preferences) || {};
    const cloud = Array.isArray(prefs.home_pins) ? prefs.home_pins.filter((x, i, a) => typeof x === 'string' && a.indexOf(x) === i) : null;
    const local = pinList();
    let next;
    if (!cloud) next = local;                                    // none in the cloud yet: this phone's go up
    else if (state !== 'ok') {                                   // first sync here: both kept
      next = cloud.concat(local.filter((id) => cloud.indexOf(id) === -1));
      // past twice the limit, pins this person can't open here make way first (as when pinning), not this phone's own
      const can = new Set(items().map((it) => it.id));
      for (let i = 0; next.length > PINS_MAX * 2 && i < next.length;) { if (can.has(next[i])) i++; else next.splice(i, 1); }
      next = next.slice(0, PINS_MAX * 2);
    }
    else next = cloud;                                           // in sync before: the cloud's are the latest
    if (JSON.stringify(next) !== JSON.stringify(local)) {
      try { localStorage.setItem(PINS_KEY, JSON.stringify(next)); } catch (_) { return; }
      syncPinToggles(); renderQuick();
    }
    if (!cloud || JSON.stringify(next) !== JSON.stringify(cloud)) { setSyncState('pending'); pushPins(); }
    else setSyncState('ok');
  }
  const toast = (m) => { if (typeof window.showToast === 'function') window.showToast(m); };
  function togglePin(id) {
    const list = pinList(), on = list.indexOf(id) === -1;
    // The limit is about what this person sees: ids they can't open here (another role's tools, a tool renamed or
    // gone) don't count. They are kept for when they come back, but never more than a few: past twice the limit
    // the oldest of them make way.
    const can = new Set(items().map((it) => it.id));
    if (on && list.filter((x) => can.has(x)).length >= PINS_MAX) { toast(tr('home.pinFull', 'You can pin up to {n} tools. Unpin one first.').replace('{n}', PINS_MAX)); return; }
    const next = on ? list.concat(id) : list.filter((x) => x !== id);
    for (let i = 0; next.length > PINS_MAX * 2 && i < next.length;) { if (can.has(next[i])) i++; else next.splice(i, 1); }
    if (!savePins(next)) return;
    toast(on ? tr('home.pinnedToast', 'Pinned to the top') : tr('home.unpinnedToast', 'Removed from pinned'));
    // A star in the Pinned row is redrawn with the row: keep the keyboard on the nearest star there.
    const stars = () => (quick ? Array.from(quick.querySelectorAll('.hg-pin-toggle')) : []);
    const at = stars().indexOf(document.activeElement);
    syncPinToggles();
    renderQuick();
    if (at !== -1) { const s = stars(); const nx = s[Math.min(at, s.length - 1)]; if (nx) nx.focus(); else focusPinnedHead(); }   // never the search box: a phone would open its keyboard
  }
  // A pin toggle: its name stays "Pin <tool>", aria-pressed says whether it is pinned.
  function pinToggle(id, name, cls) {
    const star = typeof window.hadronIcon === 'function' ? window.hadronIcon('star', { size: 22, strokeWidth: 1.6 }) : '★';
    return '<button type="button" class="hg-pin-toggle' + (cls ? ' ' + cls : '') + '" data-pin="' + esc(id) + '" aria-pressed="' + (pinList().indexOf(id) !== -1) + '"' +
      ' aria-label="' + esc(tr('home.pin', 'Pin {x}').replace('{x}', () => name)) + '">' + star + '</button>';
  }
  function syncPinToggles() {
    const pins = pinList();
    document.querySelectorAll('.hg-pin-toggle[data-pin]').forEach((b) => b.setAttribute('aria-pressed', String(pins.indexOf(b.getAttribute('data-pin')) !== -1)));
  }
  // Customizing: a star on every home tile (removed again when done).
  function paintTileStars(only) {
    const edit = editing();
    const tiles = only ? [only] : homeGrids().reduce((a, g) => a.concat(Array.from(g.querySelectorAll('.app-icon[data-app]'))), []);
    tiles.forEach((tile) => {
      const old = tile.querySelector(':scope > .hg-pin-toggle');
      if (!edit) { if (old) old.remove(); return; }
      const html = pinToggle(tile.getAttribute('data-app'), tileName(tile));
      if (!old) { tile.insertAdjacentHTML('beforeend', html); return; }
      // already there (a language change): renamed in place, so a focused star keeps the focus
      const t = document.createElement('div'); t.innerHTML = html;
      ['aria-label', 'aria-pressed'].forEach((a) => old.setAttribute(a, t.firstChild.getAttribute(a)));
    });
  }
  // The Pinned heading takes the focus when its row has no star left (or Customize was started from a link there).
  function focusPinnedHead() {
    const h = document.getElementById('hgSec-pinned');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  // A time today as 08:42; an earlier one with its date.
  function when(v) {
    const d = new Date(v);
    if (isNaN(d.getTime())) return '';
    const fmt = (fn, o) => { try { return d[fn]([(window.currentLanguage || 'en') + '-ZA', 'en-ZA'], o); } catch (_) { return d[fn](undefined, o); } };
    const time = fmt('toLocaleTimeString', { hour: '2-digit', minute: '2-digit' });
    return d.toDateString() === new Date().toDateString() ? time : fmt('toLocaleDateString', { day: 'numeric', month: 'short' }) + ' ' + time;
  }
  // Unfinished work and what reopens it: a service report that wasn't saved (index.html keeps it in one draft
  // slot), a job timer still running. Each only for a role that has its tool.
  function unfinished() {
    const out = [];
    const srTile = homeTile('servicereport');
    const sr = srTile && tileShown(srTile) && window.hgSrDraft ? window.hgSrDraft.get() : null;
    if (sr) {
      const site = String(sr.site || '').trim(), t = when(sr._draftAt);
      out.push({ tile: srTile, title: tileName(srTile) + (site ? ' · ' + site : ''),
        note: t ? tr('home.contNotSaved', 'Not saved · edited {t}').replace('{t}', () => t) : tr('home.notSaved', 'Not saved'),
        go: tr('home.resume', 'Resume'), open: () => { recordRecent('servicereport'); window.hgSrDraft.resume(); },
        drop: () => discardReport(site) });
    }
    const jobsTile = homeTile('jobs');
    const tm = jobsTile && tileShown(jobsTile) ? readJSON('hadron_timer_active', null) : null;
    if (tm && tm.start) {
      const label = String(tm.label || '').trim(), t = when(tm.start);
      out.push({ tile: jobsTile, title: tileName(jobsTile) + (label ? ' · ' + label : ''),
        note: tr('home.contTimer', 'Timer running since {t}').replace('{t}', () => t),
        go: tr('home.open', 'Open'), open: () => jobsTile.click() });
    }
    return out;
  }
  function discardReport(site) {
    if (!window.hgSheet || !window.hgSrDraft) return;
    window.hgSheet.open({
      title: tr('home.discardTitle', 'Discard unsaved work?'),
      body: '<p>' + esc(site
        ? tr('home.discardBody', 'The changes to the report for {site} that weren’t saved will be lost. This can’t be undone.').replace('{site}', () => site)
        : tr('home.discardBodyNoSite', 'The changes to this report that weren’t saved will be lost. This can’t be undone.')) + '</p>',
      actions: [
        { label: tr('home.discard', 'Discard'), kind: 'danger', onClick: () => { window.hgSrDraft.discard(); renderQuick(); } },
        { label: tr('home.keep', 'Keep'), kind: 'plain', focus: true }
      ],
      onClose: () => { if (quick && !quick.contains(document.activeElement)) { const b = quick.querySelector('button'); if (b) b.focus(); } }   // Discard removed the × that opened it
    });
  }
  function renderQuick() {
    if (!quick) return;
    if (pinSort) { try { pinSort.destroy(); } catch (_) {} pinSort = null; }
    if (input && input.value.trim()) { quick.hidden = true; return; }   // a search: the results only
    const edit = editing();   // customizing: only the Pinned row (to arrange), no Continue / Recent
    if (!edit && window.hgSrDraft && window.hgSrDraft.flush) window.hgSrDraft.flush();   // an edit still waiting to be autosaved counts
    const cont = edit ? [] : unfinished();
    const byId = new Map(items().map((it) => [it.id, it]));
    const pinIds = pinList();
    const pinned = pinIds.map((id) => byId.get(id)).filter(Boolean);
    const recent = edit ? [] : recentList().filter((x) => pinIds.indexOf(x.id) === -1).map((x) => byId.get(x.id)).filter(Boolean).slice(0, RECENT_SHOW);
    const link = (text) => '<button type="button" class="hg-quick-link">' + esc(text) + '</button>';
    // While customizing, a pinned shortcut doesn't open its tool: its star (unpin) is what's there to use.
    const shortcut = (it, i, kind) => '<div role="listitem" class="hg-short-wrap"' + (kind === 'p' ? ' data-id="' + esc(it.id) + '"' : '') + '>' +
      '<button type="button" class="hg-short" data-' + kind + '="' + i + '"' + (edit ? ' tabindex="-1" aria-hidden="true"' : ' aria-label="' + esc(it.sub ? it.name + ', ' + it.sub : it.name) + '"') + '>' +
        '<span class="icon" aria-hidden="true">' + iconOf(it.iconFrom) + '</span><span class="app-name">' + esc(it.label || it.name) + '</span></button>' +
      (edit ? pinToggle(it.id, it.sub ? it.name + ', ' + it.sub : it.name) : '') + '</div>';
    let html = '';
    if (cont.length) html += '<div class="hg-cont-list" role="list" aria-label="' + esc(tr('home.unfinished', 'Unfinished work')) + '">' + cont.map((c, i) =>
      '<div class="hg-cont" role="listitem">' +
        '<span class="icon" aria-hidden="true">' + iconOf(c.tile) + '</span>' +
        '<span class="hg-cont-txt"><span class="hg-cont-title" id="hgCont' + i + '">' + esc(c.title) + '</span><span class="hg-cont-note" id="hgContN' + i + '">' + esc(c.note) + '</span></span>' +
        '<button type="button" class="hg-cont-go" data-c="' + i + '" aria-describedby="hgCont' + i + ' hgContN' + i + '">' + esc(c.go) + '</button>' +
        (c.drop ? '<button type="button" class="hg-cont-x" data-c="' + i + '" aria-label="' + esc(tr('home.discardAria', 'Discard unsaved work')) + '" aria-describedby="hgCont' + i + '">×</button>' : '') +
      '</div>').join('') + '</div>';
    if (pinned.length || edit) html += '<section class="hg-home-pins" aria-labelledby="hgSec-pinned"><div class="hg-home-quick-head"><h2 class="hg-home-sec-title" id="hgSec-pinned">' + esc(tr('home.pinned', 'Pinned')) + '</h2>' +
        (edit ? '' : link(tr('home.editPins', 'Edit'))) + '</div>' +
      (pinned.length ? '<div class="hg-short-grid" role="list" id="hgHomePins">' + pinned.map((it, i) => shortcut(it, i, 'p')).join('') + '</div>'
        : '<p class="hg-pin-hint">' + esc(tr('home.pinHint', 'Tap the star on a tool to pin it here.')) + '</p>') + '</section>';
    if (recent.length) html += '<section class="hg-home-recent" aria-labelledby="hgSec-recent"><div class="hg-home-quick-head"><h2 class="hg-home-sec-title" id="hgSec-recent">' + esc(tr('home.recent', 'Recent')) + '</h2>' +
        (pinned.length ? '' : link(tr('home.pinTools', 'Pin tools'))) + '</div>' +
      '<div class="hg-short-grid" role="list">' + recent.map((it, i) => shortcut(it, i, 'r')).join('') + '</div></section>';
    quick.innerHTML = html;
    quick.hidden = !html;
    quick.querySelectorAll('.hg-cont-go').forEach((b) => b.addEventListener('click', () => cont[+b.getAttribute('data-c')].open()));
    quick.querySelectorAll('.hg-cont-x').forEach((b) => b.addEventListener('click', () => cont[+b.getAttribute('data-c')].drop()));
    quick.querySelectorAll('.hg-quick-link').forEach((b) => b.addEventListener('click', () => {
      if (!(window.HG_HOME && typeof window.HG_HOME.enterEditMode === 'function')) return;
      Promise.resolve(window.HG_HOME.enterEditMode()).then(() => { if (editing()) focusPinnedHead(); }, () => {});   // the link is redrawn away
    }));
    const openShort = (it) => { if (!it || editing()) return; recordRecent(it.id); it.open(); };
    quick.querySelectorAll('.hg-short[data-r]').forEach((b) => b.addEventListener('click', () => openShort(recent[+b.getAttribute('data-r')])));
    quick.querySelectorAll('.hg-short[data-p]').forEach((b) => b.addEventListener('click', () => openShort(pinned[+b.getAttribute('data-p')])));
    // Customizing: drag the pinned tools into order (with the SortableJS customize.js loaded). Pins this role
    // doesn't show keep their place after the ones arranged.
    const grid = edit ? document.getElementById('hgHomePins') : null;
    if (grid && window.Sortable && typeof window.Sortable.create === 'function') {
      pinSort = window.Sortable.create(grid, { animation: 180, forceFallback: true, fallbackTolerance: 5, filter: '.hg-pin-toggle', preventOnFilter: false,
        onEnd: () => { const order = Array.from(grid.querySelectorAll('[data-id]')).map((el) => el.getAttribute('data-id')); savePins(order.concat(pinList().filter((id) => order.indexOf(id) === -1))); } });
    }
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
      // label: the name as the tile shows it, soft hyphens included, for the Pinned / Recent shortcuts
      out.push({ id, name: tileName(tile), label: ((tile.querySelector('.app-name') || {}).textContent || '').trim(), sub: '', words: (TILE_WORDS[id] || '') + ' ' + id + ' ' + secWords + ' ' + parts, iconFrom: tile, open: () => tile.click() });
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
      renderQuick();
      return;
    }
    const found = search(q);
    sections.forEach((s) => { s.style.display = 'none'; });
    if (quick) quick.hidden = true;
    results.hidden = false;
    if (!found.length) {
      const msg = tr('home.noMatch', 'No tool matches “{q}”').replace('{q}', () => q);   // a function: "$&" in q stays as typed
      results.innerHTML = '<p class="hg-home-noresult">' + esc(msg) + '</p>';
      status.textContent = msg;
      return;
    }
    results.innerHTML = found.map((it, i) =>
      '<div role="listitem" class="hg-home-result-row"><button type="button" class="hg-home-result" data-i="' + i + '">' +
        '<span class="hg-home-result-ico" aria-hidden="true">' + ((it.iconFrom && it.iconFrom.querySelector('.icon svg')) ? it.iconFrom.querySelector('.icon').innerHTML : '') + '</span>' +
        '<span class="hg-home-result-txt"><span class="hg-home-result-name">' + esc(it.name) + '</span>' +
        (it.sub ? '<span class="hg-home-result-sub">' + esc(it.sub) + '</span>' : '') + '</span>' +
      '</button>' + pinToggle(it.id, it.sub ? it.name + ', ' + it.sub : it.name, 'hg-pin-toggle--row') + '</div>').join('');
    results.querySelectorAll('.hg-home-result').forEach((b) => b.addEventListener('click', () => pick(found[+b.getAttribute('data-i')])));
    status.textContent = found.length === 1 ? tr('home.oneResult', '1 tool') : tr('home.nResults', '{n} tools').replace('{n}', found.length);
  }
  function pick(it) {
    if (!it) return;
    input.value = '';
    render();
    input.blur();
    recordRecent(it.id);
    it.open();
  }

  function boot() {
    input = document.getElementById('hgHomeSearch');
    clearBtn = document.getElementById('hgHomeSearchClear');
    results = document.getElementById('hgHomeResults');
    status = document.getElementById('hgHomeSearchStatus');
    sections = Array.from(document.querySelectorAll('[data-home-sec]'));
    quick = document.getElementById('hgHomeQuick');
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
    if (window.MutationObserver) new MutationObserver(() => { refreshSections(); renderQuick(); if (input.value) render(); }).observe(document.body, { attributes: true, attributeFilter: ['data-role'] });
    // A pin star, wherever it is: handled here, at the start of the click, so neither the tile under it opens nor
    // Customize's click blocker swallows it.
    document.addEventListener('click', (e) => {
      const b = e.target && e.target.closest ? e.target.closest('.hg-pin-toggle[data-pin]') : null;
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      togglePin(b.getAttribute('data-pin'));
    }, true);
    // A home tile opened is remembered (Recent); not in Customize, where a tap doesn't open it.
    document.addEventListener('click', (e) => {
      const tile = e.target && e.target.closest ? e.target.closest('[data-home-grid] .app-icon[data-app]') : null;
      if (tile && !editing()) recordRecent(tile.getAttribute('data-app'));
    }, true);
    // The home shows again when the last window closes: unfinished work may have changed (a report saved, a
    // timer stopped) and the tool just used is now the most recent.
    if (window.MutationObserver) {
      const shown = new MutationObserver(() => { if (!document.querySelector('.window.active')) { renderQuick(); if (tab === 'account') renderAccount(); } });   // (back from Settings: the language or theme shown)
      const watch = (w) => shown.observe(w, { attributes: true, attributeFilter: ['class'] });
      document.querySelectorAll('.window').forEach(watch);
      new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1 && n.classList.contains('window')) watch(n); })))
        .observe(document.body, { childList: true });   // windows mounted later (Team, Portal)
    }
    window.addEventListener('storage', (e) => { if (!e.key || e.key === RECENT_KEY || e.key === PINS_KEY || e.key === 'hadron_sr_draft' || e.key === 'hadron_timer_active') { syncPinToggles(); renderQuick(); } });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !document.querySelector('.window.active')) renderQuick(); });   // "edited 08:42" becomes a date after midnight
    document.addEventListener('hg:home:edit', () => { paintTileStars(); renderQuick(); });
    // Tabs: their icons, a tap, the avatar (on a phone it opens Account), the screen getting wider or narrower
    document.querySelectorAll('#hgTabbar .hg-tab[data-tab]').forEach((b) => {
      const ico = b.querySelector('.hg-tab-ico');
      if (ico && typeof window.hadronIcon === 'function') ico.innerHTML = window.hadronIcon(TAB_ICONS[b.getAttribute('data-tab')], { size: 24, strokeWidth: 1.5 });
      b.addEventListener('click', () => {
        const name = b.getAttribute('data-tab');
        if (name === 'signin') { if (window.HG_AUTH_UI) window.HG_AUTH_UI.show('signin'); return; }   // a guest's: the sign-in screen
        goTab(name);
      });
    });
    document.addEventListener('click', (e) => {
      if (!tabsOn() || !e.target || !e.target.closest || !e.target.closest('#hgAccountBtn')) return;
      e.preventDefault(); e.stopPropagation();   // before the button's own handler (the account menu)
      goTab('account');
    }, true);
    const acct = document.getElementById('hgAccount');
    if (acct) acct.addEventListener('click', (e) => { const b = e.target && e.target.closest ? e.target.closest('[data-acct]') : null; const go = b && ACCOUNT_DO[b.getAttribute('data-acct')]; if (go) go(); });
    if (tabsMq) {
      const onWidth = () => { if (!tabsOn() && tab !== homeTab()) goTab(homeTab()); else paintTabs(); };
      if (typeof tabsMq.addEventListener === 'function') tabsMq.addEventListener('change', onWidth); else if (typeof tabsMq.addListener === 'function') tabsMq.addListener(onWidth);
    }
    // Customize started from Settings while on Account (no tiles there): Home, where the pinned tools and the role's own
    // section are arranged (the other tabs' tiles are arranged on those tabs). Back still ends Customize first.
    document.addEventListener('hg:home:edit', (e) => { if (e.detail && e.detail.editing && tab === 'account') goTab('home'); });
    // a guest (or no longer one): their tabs, from their start
    document.addEventListener('hg:guest', () => { const was = tab; tab = homeTab(); refreshSections(); if (was !== tab && typeof window.hgDisarmBack === 'function') window.hgDisarmBack(); });
    // the Account tab's sync line follows the top bar's chip
    const chip = document.getElementById('hgSyncChip');
    if (chip && window.MutationObserver) new MutationObserver(() => { if (tab === 'account') renderAccount(); }).observe(chip, { attributes: true, childList: true, subtree: true, characterData: true });
    // ...and its Appearance row the theme (the top bar's sun / moon button changes it without Settings)
    if (window.MutationObserver) new MutationObserver(() => { if (tab === 'account') renderAccount(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    paintTabs();
    renderQuick();
    // The language and the tiles' Hadron icons are applied on window load (index.html), after this ran: draw
    // again then, or a start with nothing else to redraw it (offline) keeps English words and emoji icons.
    if (document.readyState === 'complete') renderQuick(); else window.addEventListener('load', () => renderQuick());
    // The profile can load before this (deferred) script runs; hg:profile:loaded has then been missed. auth-ui sets
    // __hgOfflineSession to false just before sending it, after the user / organisation / restore checks.
    if (window.HG_PROFILE && window.__hgOfflineSession === false) setTimeout(syncPins, 0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  // Roles decide which tiles show; a language change renames them (results follow the new names).
  document.addEventListener('hg:profile:loaded', () => setTimeout(() => { refreshSections(); renderQuick(); if (input && input.value) render(); syncPins(); if (tab === 'account') renderAccount(); }, 0));
  // A pin change made offline goes now. Only that: another phone's pins are taken from a profile just loaded (this
  // page's copy of the profile can be older than another tab's, whose change it would undo).
  window.addEventListener('online', () => setTimeout(() => { if (syncState() === 'pending') syncPins(); }, 1500));
  document.addEventListener('hg:lang:changed', () => { if (editing()) paintTileStars(); renderQuick(); if (input && input.value) render(); if (tab === 'account') renderAccount(); });
})();
