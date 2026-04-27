/* ============================================================
   HADRON QR Builder — standalone app + LIMS asset helpers
   Depends on qr.js (qrcode-generator by Kazuhiko Arase).
   ============================================================ */
(function(){
  'use strict';

  const BASE_URL = (function(){
    // Derive the hosted URL so deep-links scan correctly from any phone
    const { protocol, host, pathname } = window.location;
    const path = pathname.replace(/index\.html$/,'');
    return `${protocol}//${host}${path}`;
  })();

  const STATE = {
    type: 'text',      // text | url | lims-sample | lims-instrument | lims-inventory | hg-site | hg-asset | vcard | wifi
    payload: 'https://hadrongrp.com',
    label: '',
    sublabel: '',
    ecc: 'M',           // L|M|Q|H
    fg: '#111111',
    bg: '#ffffff',
    margin: 2,
    sheet: []          // array of { payload, label, sublabel }
  };

  const esc = (s) => (s==null?'':String(s)).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  /* ---------- Core: generate QR as SVG ---------- */
  function makeQR(text, ecc, margin, fg, bg, sizePx) {
    ecc = ecc || 'M';
    margin = margin == null ? 2 : margin;
    sizePx = sizePx || 240;
    // pick lowest type that fits (type=0 auto)
    const qr = qrcode(0, ecc);
    qr.addData(String(text||' '));
    try { qr.make(); } catch(e) { return `<div class="qr-error">Payload too long for this ECC level</div>`; }
    const count = qr.getModuleCount();
    const total = count + margin * 2;
    const cell = sizePx / total;
    let rects = '';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          const x = ((c + margin) * cell).toFixed(2);
          const y = ((r + margin) * cell).toFixed(2);
          const s = cell.toFixed(2);
          rects += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${fg}"/>`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sizePx} ${sizePx}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${bg}"/>${rects}</svg>`;
  }

  // Build payload from current type + inputs
  function currentPayload() {
    const s = STATE;
    switch (s.type) {
      case 'url':
      case 'text':           return s.payload;
      case 'lims-sample':    return BASE_URL + '#lims/sample/' + encodeURIComponent(s.payload);
      case 'lims-instrument':return BASE_URL + '#lims/instrument/' + encodeURIComponent(s.payload);
      case 'lims-inventory': return BASE_URL + '#lims/inventory/' + encodeURIComponent(s.payload);
      case 'hg-site':        return BASE_URL + '#asset/site/' + encodeURIComponent(s.payload);
      case 'hg-asset':       return BASE_URL + '#asset/equip/' + encodeURIComponent(s.payload); // payload = "siteId|equipId"
      case 'vcard':          return s.payload; // built as full vCard string in the form handler
      case 'wifi':           return s.payload; // built as WIFI: string
      default: return s.payload;
    }
  }

  /* ---------- UI ---------- */
  async function renderShell() {
    const root = document.getElementById('qrShell');
    if (!root) return;
    root.innerHTML = `
      <div class="qr-wrap">
        <div class="qr-left">
          <div class="qr-card">
            <div class="qr-section-title">1 · What do you want to encode?</div>
            <div class="qr-typegrid">
              ${[
                ['text','📝 Free text'],
                ['url','🔗 URL'],
                ['hg-asset','🏷️ Hadron asset'],
                ['hg-site','🏢 Hadron site'],
                ['lims-sample','🧪 LIMS sample'],
                ['lims-instrument','⚙️ LIMS instrument'],
                ['lims-inventory','📦 LIMS reagent / lot'],
                ['vcard','🪪 Contact (vCard)'],
                ['wifi','📶 Wi-Fi']
              ].map(([k,l])=>`<button class="qr-typebtn ${STATE.type===k?'active':''}" onclick="qrSetType('${k}')">${l}</button>`).join('')}
            </div>
          </div>

          <div class="qr-card" id="qrInputPanel"></div>

          <div class="qr-card">
            <div class="qr-section-title">3 · Style & options</div>
            <div class="qr-fieldgrid">
              <div class="qr-field">
                <label>Error correction</label>
                <select id="qrEcc" onchange="qrSetOpt('ecc', this.value)">
                  <option value="L" ${STATE.ecc==='L'?'selected':''}>L — ~7%</option>
                  <option value="M" ${STATE.ecc==='M'?'selected':''}>M — ~15% (recommended)</option>
                  <option value="Q" ${STATE.ecc==='Q'?'selected':''}>Q — ~25%</option>
                  <option value="H" ${STATE.ecc==='H'?'selected':''}>H — ~30% (best)</option>
                </select>
              </div>
              <div class="qr-field">
                <label>Quiet-zone margin</label>
                <input type="number" min="0" max="8" value="${STATE.margin}" onchange="qrSetOpt('margin', parseInt(this.value)||0)">
              </div>
              <div class="qr-field">
                <label>Foreground</label>
                <input type="color" value="${STATE.fg}" onchange="qrSetOpt('fg', this.value)">
              </div>
              <div class="qr-field">
                <label>Background</label>
                <input type="color" value="${STATE.bg}" onchange="qrSetOpt('bg', this.value)">
              </div>
              <div class="qr-field qr-field-wide">
                <label>Top label (printed above QR)</label>
                <input type="text" value="${esc(STATE.label)}" oninput="qrSetOpt('label', this.value)" placeholder="e.g. HAD-26-0421-001">
              </div>
              <div class="qr-field qr-field-wide">
                <label>Bottom caption</label>
                <input type="text" value="${esc(STATE.sublabel)}" oninput="qrSetOpt('sublabel', this.value)" placeholder="e.g. Borehole BH-07 · Greenfields">
              </div>
            </div>
          </div>
        </div>

        <div class="qr-right">
          <div class="qr-card qr-preview-card">
            <div class="qr-section-title">Preview</div>
            <div class="qr-sticker" id="qrStickerPreview"></div>
            <div class="qr-payload" id="qrPayloadBox"></div>
            <div class="qr-actions">
              <button class="qr-btn" onclick="qrDownload('svg')">⬇ SVG</button>
              <button class="qr-btn" onclick="qrDownload('png')">⬇ PNG</button>
              <button class="qr-btn" onclick="qrPrintSingle()">🖨 Print sticker</button>
              <button class="qr-btn primary" onclick="qrAddToSheet()">＋ Add to sheet</button>
            </div>
          </div>

          <div class="qr-card">
            <div class="qr-section-title">Sheet queue <span class="qr-badge" id="qrSheetCount">${STATE.sheet.length}</span></div>
            <div class="qr-sheet-list" id="qrSheetList"></div>
            <div class="qr-actions">
              <button class="qr-btn" onclick="qrClearSheet()">Clear</button>
              <button class="qr-btn primary" onclick="qrPrintSheet()" id="qrPrintSheetBtn" ${STATE.sheet.length?'':'disabled'}>🖨 Print sheet</button>
            </div>
          </div>
        </div>
      </div>
    `;
    renderInputPanel();
    refreshPreview();
    renderSheetList();
  }

  function renderInputPanel() {
    const el = document.getElementById('qrInputPanel');
    if (!el) return;
    const s = STATE;
    let inner = '';
    if (s.type === 'text') {
      inner = `<div class="qr-section-title">2 · Text</div>
        <textarea class="qr-textarea" placeholder="Anything you want encoded…" oninput="qrSetPayload(this.value)">${esc(s.payload)}</textarea>`;
    } else if (s.type === 'url') {
      inner = `<div class="qr-section-title">2 · URL</div>
        <input class="qr-input" type="url" placeholder="https://…" value="${esc(s.payload)}" oninput="qrSetPayload(this.value)">
        <div class="qr-hint">Scanning opens the URL in the phone's browser.</div>`;
    } else if (s.type === 'lims-sample' || s.type === 'lims-instrument' || s.type === 'lims-inventory') {
      const store = s.type === 'lims-sample' ? 'samples' : (s.type === 'lims-instrument' ? 'instruments' : 'inventory');
      const items = await_asLIMSItems_sync();
      const list = items[store] || [];
      inner = `<div class="qr-section-title">2 · Pick ${s.type.replace('lims-','')}</div>
        <select class="qr-input" onchange="qrPickLimsAsset(this.value)">
          <option value="">— select from LIMS —</option>
          ${list.map(it => `<option value="${esc(it.id)}" ${s.payload===it.id?'selected':''}>${esc(it.__label)}</option>`).join('')}
        </select>
        <div class="qr-hint">Scanning opens the Hadron app directly to this asset (${esc(BASE_URL)}#lims/${s.type.replace('lims-','')}/…).</div>
        ${list.length===0?'<div class="qr-hint" style="color:#c59d2b;">No LIMS entries loaded yet — open LIMS once to seed the demo data.</div>':''}`;
    } else if (s.type === 'hg-site' || s.type === 'hg-asset') {
      const sites = loadHGSites();
      if (s.type === 'hg-site') {
        inner = `<div class="qr-section-title">2 · Pick site</div>
          <select class="qr-input" onchange="qrPickHGSite(this.value)">
            <option value="">— select a site —</option>
            ${sites.map(st => `<option value="${esc(st.id)}" ${s.payload===st.id?'selected':''}>${esc(st.name)} · ${st.equipment.length} asset(s)</option>`).join('')}
          </select>
          <div class="qr-hint">Scanning opens the Site Register (Assets app) for this site.</div>
          ${sites.length===0?'<div class="qr-hint" style="color:#c59d2b;">No sites yet — open Assets → Site Register to add one.</div>':''}`;
      } else {
        // hg-asset: dropdown of all equipment across all sites
        const allEquip = [];
        sites.forEach(st => (st.equipment||[]).forEach(eq => allEquip.push({ siteId:st.id, siteName:st.name, eq })));
        inner = `<div class="qr-section-title">2 · Pick asset</div>
          <select class="qr-input" onchange="qrPickHGAsset(this.value)">
            <option value="">— select an asset —</option>
            ${allEquip.map(a => {
              const v = a.siteId + '|' + a.eq.id;
              return `<option value="${esc(v)}" ${s.payload===v?'selected':''}>${esc(a.eq.type)} · ${esc(a.eq.serial||'no serial')} · ${esc(a.siteName)}</option>`;
            }).join('')}
          </select>
          <div class="qr-hint">Scanning opens the asset's site in the Site Register.</div>
          ${allEquip.length===0?'<div class="qr-hint" style="color:#c59d2b;">No assets yet — open Assets → Site Register and click "+ Add asset" on a site.</div>':''}`;
      }
    } else if (s.type === 'vcard') {
      inner = `<div class="qr-section-title">2 · Contact card</div>
        <div class="qr-fieldgrid">
          <div class="qr-field"><label>Full name</label><input class="qr-input" id="vcN" oninput="qrBuildVCard()" placeholder="Jaco Swanepoel"></div>
          <div class="qr-field"><label>Organisation</label><input class="qr-input" id="vcO" oninput="qrBuildVCard()" value="Hadron Group"></div>
          <div class="qr-field"><label>Title</label><input class="qr-input" id="vcT" oninput="qrBuildVCard()" placeholder="Laboratory Manager"></div>
          <div class="qr-field"><label>Phone</label><input class="qr-input" id="vcP" oninput="qrBuildVCard()" placeholder="+27 12 345 6789"></div>
          <div class="qr-field"><label>Email</label><input class="qr-input" id="vcE" oninput="qrBuildVCard()" placeholder="name@hadrongrp.com"></div>
          <div class="qr-field"><label>Website</label><input class="qr-input" id="vcW" oninput="qrBuildVCard()" value="https://hadrongrp.com"></div>
        </div>`;
    } else if (s.type === 'wifi') {
      inner = `<div class="qr-section-title">2 · Wi-Fi</div>
        <div class="qr-fieldgrid">
          <div class="qr-field"><label>SSID (network name)</label><input class="qr-input" id="wifS" oninput="qrBuildWifi()"></div>
          <div class="qr-field"><label>Password</label><input class="qr-input" id="wifP" oninput="qrBuildWifi()"></div>
          <div class="qr-field"><label>Security</label>
            <select class="qr-input" id="wifT" onchange="qrBuildWifi()">
              <option value="WPA">WPA / WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">None (open)</option>
            </select></div>
          <div class="qr-field"><label>Hidden?</label><select class="qr-input" id="wifH" onchange="qrBuildWifi()"><option value="false">No</option><option value="true">Yes</option></select></div>
        </div>
        <div class="qr-hint">Most modern phones connect automatically when scanning.</div>`;
    }
    el.innerHTML = inner;
  }

  // Sync accessor for LIMS items (LIMS uses IndexedDB, so we must await — wrapper caches)
  const _limsCache = { samples: null, instruments: null, inventory: null };
  function await_asLIMSItems_sync() {
    return _limsCache;
  }

  // Hadron Sites/Assets are stored in localStorage by the Assets app — synchronous read
  function loadHGSites() {
    try {
      const raw = localStorage.getItem('hadron_sites');
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.map(s => ({ id:s.id, name:s.name||'(unnamed site)', equipment: s.equipment||[] })) : [];
    } catch (e) { return []; }
  }
  async function preloadLIMS() {
    try {
      const open = indexedDB.open('hadron_lims', 1);
      await new Promise((res, rej) => {
        open.onsuccess = () => { _limsCache.db = open.result; res(); };
        open.onerror = () => rej(open.error);
        open.onupgradeneeded = () => { /* fresh install — no data yet */ };
      });
      const db = _limsCache.db;
      for (const store of ['samples','instruments','inventory']) {
        if (!db.objectStoreNames.contains(store)) { _limsCache[store] = []; continue; }
        _limsCache[store] = await new Promise((res) => {
          const r = db.transaction(store).objectStore(store).getAll();
          r.onsuccess = () => res(r.result || []);
          r.onerror = () => res([]);
        });
        // Add display labels
        _limsCache[store].forEach(it => {
          if (store === 'samples')     it.__label = (it.barcode||it.id) + ' — ' + (it.description||'');
          else if (store === 'instruments') it.__label = (it.name||it.id) + ' (' + (it.serial||'') + ')';
          else                         it.__label = (it.name||it.id) + ' · lot ' + (it.lot||'—');
        });
      }
    } catch (e) { console.warn('LIMS preload skipped', e); }
  }

  /* ---------- State helpers ---------- */
  window.qrSetType = function(t) {
    STATE.type = t;
    // Set a sensible default payload per type
    if (t === 'url')  STATE.payload = STATE.payload.startsWith('http') ? STATE.payload : 'https://hadrongrp.com';
    if (t === 'text') STATE.payload = STATE.payload || 'Hello from Hadron';
    if (t.startsWith('lims-')) STATE.payload = '';
    if (t === 'hg-site' || t === 'hg-asset') { STATE.payload = ''; STATE.label = ''; STATE.sublabel = ''; }
    renderShell();
  };
  window.qrSetPayload = function(v) { STATE.payload = v; refreshPreview(); };
  window.qrSetOpt = function(k, v) { STATE[k] = v; refreshPreview(); };
  window.qrPickHGSite = function(siteId) {
    STATE.payload = siteId;
    const site = loadHGSites().find(s => s.id === siteId);
    if (site) {
      STATE.label = site.name;
      STATE.sublabel = (site.equipment.length||0) + ' asset(s) on site';
    }
    renderShell();
  };

  window.qrPickHGAsset = function(combined) {
    // combined = "siteId|equipId"
    STATE.payload = combined;
    if (!combined) { renderShell(); return; }
    const [siteId, equipId] = combined.split('|');
    const site = loadHGSites().find(s => s.id === siteId);
    const eq = site && (site.equipment||[]).find(e => e.id === equipId);
    if (eq) {
      STATE.label = (eq.type || 'Asset') + (eq.serial ? ' ' + eq.serial : '');
      STATE.sublabel = site.name + (eq.installed ? ' · installed ' + eq.installed : '');
    }
    renderShell();
  };

  window.qrPickLimsAsset = function(id) {
    STATE.payload = id;
    // auto-populate label with the item's display string
    const list = _limsCache[STATE.type.replace('lims-','')+'s'] || _limsCache[STATE.type.replace('lims-','')] || [];
    // Compat: samples->samples, instruments->instruments, inventory->inventory
    const store = STATE.type === 'lims-sample' ? 'samples' : (STATE.type === 'lims-instrument' ? 'instruments' : 'inventory');
    const item = (_limsCache[store]||[]).find(x=>x.id===id);
    if (item) {
      if (STATE.type === 'lims-sample') { STATE.label = item.barcode; STATE.sublabel = item.description; }
      else if (STATE.type === 'lims-instrument') { STATE.label = item.name; STATE.sublabel = item.model + ' · ' + item.serial; }
      else { STATE.label = item.name; STATE.sublabel = 'Lot ' + item.lot + ' · exp ' + (item.expiry||''); }
    }
    renderShell();
  };
  window.qrBuildVCard = function() {
    const g = (id) => (document.getElementById(id)||{value:''}).value;
    const v = 'BEGIN:VCARD\nVERSION:3.0\nFN:'+g('vcN')+'\nORG:'+g('vcO')+'\nTITLE:'+g('vcT')+'\nTEL:'+g('vcP')+'\nEMAIL:'+g('vcE')+'\nURL:'+g('vcW')+'\nEND:VCARD';
    STATE.payload = v; STATE.label = g('vcN'); STATE.sublabel = g('vcO'); refreshPreview();
  };
  window.qrBuildWifi = function() {
    const g = (id) => (document.getElementById(id)||{value:''}).value;
    const t = g('wifT') || 'WPA';
    const esc1 = (s) => s.replace(/([\\;,":])/g,'\\$1');
    const v = `WIFI:T:${t};S:${esc1(g('wifS'))};P:${esc1(g('wifP'))};H:${g('wifH')||'false'};;`;
    STATE.payload = v; STATE.label = g('wifS'); STATE.sublabel = 'Wi-Fi · '+t; refreshPreview();
  };

  function refreshPreview() {
    const data = currentPayload();
    const svg = makeQR(data, STATE.ecc, STATE.margin, STATE.fg, STATE.bg, 280);
    const el = document.getElementById('qrStickerPreview');
    const pb = document.getElementById('qrPayloadBox');
    if (!el) return;
    el.innerHTML = `
      <div class="qr-sticker-inner">
        ${STATE.label ? `<div class="qr-sticker-label">${esc(STATE.label)}</div>` : ''}
        <div class="qr-sticker-code">${svg}</div>
        ${STATE.sublabel ? `<div class="qr-sticker-sub">${esc(STATE.sublabel)}</div>` : ''}
        <div class="qr-sticker-brand">hadrongrp.com</div>
      </div>
    `;
    if (pb) pb.textContent = data;
  }

  /* ---------- Download / print ---------- */
  window.qrDownload = function(fmt) {
    const data = currentPayload();
    const fn = (STATE.label || 'hadron-qr').replace(/[^\w\-]+/g,'-');
    if (fmt === 'svg') {
      const svg = makeQR(data, STATE.ecc, STATE.margin, STATE.fg, STATE.bg, 512);
      const blob = new Blob([svg], {type:'image/svg+xml'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fn + '.svg'; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 500);
    } else {
      // PNG via canvas
      const size = 1024;
      const svg = makeQR(data, STATE.ecc, STATE.margin, STATE.fg, STATE.bg, size);
      const img = new Image();
      const blob = new Blob([svg], {type:'image/svg+xml'});
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = size; c.height = size;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        c.toBlob((b) => {
          const u = URL.createObjectURL(b);
          const a = document.createElement('a'); a.href = u; a.download = fn + '.png'; a.click();
          setTimeout(()=>URL.revokeObjectURL(u), 500);
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.src = url;
    }
  };

  window.qrPrintSingle = function() {
    const payload = currentPayload();
    const svg = makeQR(payload, STATE.ecc, STATE.margin, STATE.fg, STATE.bg, 380);
    const html = `<!doctype html><html><head><title>Hadron QR sticker</title><style>
      @page { size: 70mm 50mm; margin: 3mm; }
      body { font-family: Arial, sans-serif; margin: 0; padding: 4mm; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2mm; }
      .lbl { font-weight: 700; font-size: 11pt; font-family: 'Courier New', monospace; }
      .sub { font-size: 8pt; color: #333; text-align: center; max-width: 64mm; }
      .brand { font-size: 7pt; color: #00b1ca; letter-spacing: 1px; margin-top: 1mm; }
      svg { width: 36mm; height: 36mm; }
    </style></head><body>
      ${STATE.label ? `<div class="lbl">${esc(STATE.label)}</div>` : ''}
      ${svg}
      ${STATE.sublabel ? `<div class="sub">${esc(STATE.sublabel)}</div>` : ''}
      <div class="brand">HADRON GROUP</div>
      <script>window.onload=()=>window.print();</script>
    </body></html>`;
    const w = window.open('', '_blank', 'width=480,height=360');
    if (!w) { alert('Pop-up blocked — please allow pop-ups to print.'); return; }
    w.document.write(html); w.document.close();
  };

  window.qrAddToSheet = function() {
    STATE.sheet.push({ payload: currentPayload(), label: STATE.label, sublabel: STATE.sublabel });
    renderSheetList();
  };
  window.qrClearSheet = function() { STATE.sheet = []; renderSheetList(); };
  window.qrRemoveFromSheet = function(i) { STATE.sheet.splice(i,1); renderSheetList(); };

  function renderSheetList() {
    const el = document.getElementById('qrSheetList');
    const cnt = document.getElementById('qrSheetCount');
    const btn = document.getElementById('qrPrintSheetBtn');
    if (cnt) cnt.textContent = STATE.sheet.length;
    if (btn) btn.disabled = STATE.sheet.length === 0;
    if (!el) return;
    el.innerHTML = STATE.sheet.length ? STATE.sheet.map((s,i)=>`
      <div class="qr-sheet-item">
        <div>
          <div class="qr-sheet-label">${esc(s.label||'(no label)')}</div>
          <div class="qr-sheet-sub">${esc((s.sublabel||s.payload).slice(0,60))}${(s.sublabel||s.payload).length>60?'…':''}</div>
        </div>
        <button class="qr-btn small" onclick="qrRemoveFromSheet(${i})">✕</button>
      </div>
    `).join('') : '<div class="qr-empty">Nothing queued yet. Build a code above and press "Add to sheet".</div>';
  }

  window.qrPrintSheet = function() {
    if (!STATE.sheet.length) return;
    // A4 sticker sheet — 3 cols × 7 rows = 21 stickers per page, 63.5×38.1 mm
    const stickers = STATE.sheet.map(s => `
      <div class="st">
        ${s.label ? `<div class="lbl">${esc(s.label)}</div>` : ''}
        ${makeQR(s.payload, STATE.ecc, STATE.margin, STATE.fg, STATE.bg, 140)}
        ${s.sublabel ? `<div class="sub">${esc(s.sublabel).slice(0,42)}</div>` : ''}
        <div class="brand">HADRON GROUP</div>
      </div>
    `).join('');
    const html = `<!doctype html><html><head><title>Hadron QR sheet</title><style>
      @page { size: A4; margin: 10mm; }
      body { font-family: Arial, sans-serif; margin: 0; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
      .st { border: 0.3mm dashed #ccc; border-radius: 3mm; padding: 3mm; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 38mm; text-align: center; break-inside: avoid; }
      .lbl { font-family: 'Courier New', monospace; font-weight: 700; font-size: 9pt; margin-bottom: 1mm; }
      .sub { font-size: 7pt; color: #333; margin-top: 1mm; }
      .brand { font-size: 6pt; color: #00b1ca; letter-spacing: 1px; margin-top: 1mm; }
      svg { width: 28mm; height: 28mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    </style></head><body>
      <div class="grid">${stickers}</div>
      <script>window.onload=()=>window.print();</script>
    </body></html>`;
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (!w) { alert('Pop-up blocked — please allow pop-ups to print.'); return; }
    w.document.write(html); w.document.close();
  };

  /* ---------- Public entry ---------- */
  window.qrOpen = async function(presetType, presetId) {
    await preloadLIMS();
    if (presetType) {
      STATE.type = presetType;
      if (presetId) STATE.payload = presetId;
      // preset labels
      if (presetType === 'lims-sample' || presetType === 'lims-instrument' || presetType === 'lims-inventory') {
        const store = presetType === 'lims-sample' ? 'samples' : (presetType === 'lims-instrument' ? 'instruments' : 'inventory');
        const item = (_limsCache[store]||[]).find(x => x.id === presetId);
        if (item) {
          if (presetType === 'lims-sample')     { STATE.label = item.barcode; STATE.sublabel = item.description||''; }
          else if (presetType === 'lims-instrument') { STATE.label = item.name;    STATE.sublabel = (item.model||'')+' · '+(item.serial||''); }
          else                                  { STATE.label = item.name;    STATE.sublabel = 'Lot '+(item.lot||'')+(item.expiry?(' · exp '+item.expiry):''); }
        }
      } else if (presetType === 'hg-site' && presetId) {
        const site = loadHGSites().find(s => s.id === presetId);
        if (site) { STATE.label = site.name; STATE.sublabel = (site.equipment.length||0) + ' asset(s) on site'; }
      } else if (presetType === 'hg-asset' && presetId) {
        const [siteId, equipId] = String(presetId).split('|');
        const site = loadHGSites().find(s => s.id === siteId);
        const eq = site && (site.equipment||[]).find(e => e.id === equipId);
        if (eq) {
          STATE.label = (eq.type || 'Asset') + (eq.serial ? ' ' + eq.serial : '');
          STATE.sublabel = site.name + (eq.installed ? ' · installed ' + eq.installed : '');
        }
      }
    }
    renderShell();
  };

  // Re-render the QR Builder when the user switches UI language so any
  // localised section titles + button labels update without re-opening.
  window.qrRerender = function () {
    const host = document.getElementById('qrShell');
    if (host && host.children.length) renderShell();
  };

  // Expose the raw renderer for LIMS / Assets to use
  window.qrMakeSVG = makeQR;
  window.qrBuildAssetURL = function(kind, id) {
    // kind = 'sample' | 'instrument' | 'inventory'  (LIMS deep link)
    return BASE_URL + '#lims/' + kind + '/' + encodeURIComponent(id);
  };
  window.qrBuildSiteURL = function(siteId) {
    return BASE_URL + '#asset/site/' + encodeURIComponent(siteId);
  };
  window.qrBuildEquipURL = function(siteId, equipId) {
    return BASE_URL + '#asset/equip/' + encodeURIComponent(siteId + '|' + equipId);
  };

  /* ---------- Deep-link handler ---------- */
  function handleHash() {
    const h = (window.location.hash || '').replace(/^#/, '');
    if (!h) return;
    const parts = h.split('/');
    if (parts[0] === 'lims' && parts[1] && parts[2]) {
      const kind = parts[1]; // sample|instrument|inventory
      const id   = decodeURIComponent(parts[2]);
      // Open LIMS, then navigate to the item
      if (typeof window.openWindow === 'function') window.openWindow('lims');
      // Wait a tick for LIMS to init, then go
      const go = () => {
        if (typeof window.limsGo !== 'function') return setTimeout(go, 150);
        const view = kind === 'sample' ? 'sample' : (kind === 'instrument' ? 'instrument' : 'inventory');
        if (view === 'inventory') window.limsGo('inventory');
        else window.limsGo(view, { id });
        // Clear the hash so it's not re-handled
        history.replaceState(null, '', window.location.pathname + window.location.search);
      };
      setTimeout(go, 400);
    } else if (parts[0] === 'qr') {
      if (typeof window.openWindow === 'function') window.openWindow('qr');
      setTimeout(()=>window.qrOpen(), 200);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } else if (parts[0] === 'asset' && parts[1] && parts[2]) {
      // #asset/site/<siteId>  or  #asset/equip/<siteId|equipId>
      if (typeof window.openWindow === 'function') {
        window.openWindow('assets');
        setTimeout(() => window.openWindow('sites'), 250);
      }
      // Highlight the asset/site after sites window renders
      setTimeout(() => {
        if (typeof window.renderSites === 'function') window.renderSites();
        const target = decodeURIComponent(parts[2]);
        const flashId = parts[1] === 'equip' ? 'site-equip-' + target.replace('|','-') : 'site-' + target;
        const el = document.getElementById(flashId);
        if (el) {
          el.scrollIntoView({ behavior:'smooth', block:'center' });
          el.style.transition = 'box-shadow 0.4s, background 0.4s';
          el.style.boxShadow = '0 0 0 3px #00b1ca';
          setTimeout(()=>{ el.style.boxShadow = 'none'; }, 1800);
        }
      }, 600);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
  // Run after DOM ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(handleHash, 600);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(handleHash, 600));
  }
  window.addEventListener('hashchange', handleHash);

})();
