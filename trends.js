/*
 * Hadron Group — Trends & Reports
 *
 * Traces water-quality measurements captured in Service Reports over time.
 *  - Reads local reports (localStorage 'hadron_sr') + the whole org's cloud reports
 *    (public.service_reports, RLS org-scoped) so a manager sees every teammate's field data.
 *  - Flattens each report's points[].tests[] into readings keyed by the STABLE parameter id
 *    (test.id, e.g. 't-ph'); each reading carries the spec limits snapshotted at save time.
 *  - Pick Customer -> Site -> Sample point -> Parameter -> date range and see the values charted
 *    over time against their pass/fail spec band, with stats + a readings table.
 *  - Export a branded PDF report + a CSV for the selection.
 *
 * Self-contained (own esc/LS helpers); uses only window globals (HG_SUPA, jspdf, showToast,
 * hgMakeSearchable). Charts are hand-drawn theme-aware SVG so they work offline (no chart lib).
 * Entry point window.hgTrendsOpen() is called by index.html's openWindow('trends').
 */
(function () {
  'use strict';

  // ── helpers ─────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const LS = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (_) { return d; } } };
  function toast(m) { if (window.showToast) window.showToast(m); }
  function num(v) { if (v === '' || v == null) return null; const n = parseFloat(v); return isFinite(n) ? n : null; }
  function fmtDate(d) { if (!d) return '—'; const x = new Date(d); return isNaN(x) ? String(d).slice(0, 10) : x.toISOString().slice(0, 10); }
  function round(n, p) { const f = Math.pow(10, p == null ? 2 : p); return Math.round(n * f) / f; }

  function themeColors() {
    const cs = getComputedStyle(document.documentElement);
    const g = (name, fb) => { const v = (cs.getPropertyValue(name) || '').trim(); return v || fb; };
    return {
      text:    g('--text', '#1d262d'),
      muted:   g('--muted', '#7a8794'),
      border:  g('--border', '#ccd3da'),
      surface: g('--surface', '#ffffff'),
      accent:  g('--accent', '#3AAEDB'),
      accent2: g('--accent-2', '#F5B82E'),
      danger:  g('--danger', '#F87171'),
      success: g('--success', '#34D399')
    };
  }
  // Distinct series palette (built off the brand accents, cycled).
  const SERIES_COLORS = ['#3AAEDB', '#F5B82E', '#8E7CC3', '#5FB878', '#E4785B', '#4A7CB5', '#C0507A', '#7A8794'];

  // ── data ────────────────────────────────────────────────
  let _readings = null;   // cached flat readings
  let _lastLoad = 0;

  async function fetchCloudReports() {
    if (!window.HG_SUPA) return [];
    try {
      // Light: pull just the readings (points) + identity keys, NOT the base64 photos/signature.
      let res = await window.HG_SUPA.from('service_reports')
        .select('id, report_date, site, customer_name, points:payload->points, p_siteId:payload->>siteId, p_customerId:payload->>customerId, p_customerName:payload->>customerName, p_date:payload->>date');
      if (res && !res.error && Array.isArray(res.data)) return res.data;
      // Fallback: some PostgREST configs differ — pull the whole payload and extract client-side.
      res = await window.HG_SUPA.from('service_reports').select('id, report_date, site, customer_name, payload');
      if (res && !res.error && Array.isArray(res.data)) {
        return res.data.map(r => ({
          id: r.id, report_date: r.report_date, site: r.site, customer_name: r.customer_name,
          points: (r.payload && r.payload.points) || [],
          p_siteId: r.payload && r.payload.siteId, p_customerId: r.payload && r.payload.customerId,
          p_customerName: r.payload && r.payload.customerName, p_date: r.payload && r.payload.date
        }));
      }
    } catch (_) {}
    return [];
  }

  function pointsOf(rep) {
    if (rep.points && rep.points.length) return rep.points;
    if (rep.tests && rep.tests.length) return [{ name: '', tests: rep.tests }];   // legacy flat report
    return [];
  }
  function localToReading(r) {
    return { id: r.id, date: r.date || r.savedAt, customerId: r.customerId || '', customerName: r.customerName || '',
             siteId: r.siteId || '', site: r.site || '', points: pointsOf(r) };
  }
  function cloudToReading(cr) {
    return { id: cr.id, date: cr.p_date || cr.report_date, customerId: cr.p_customerId || '',
             customerName: cr.p_customerName || cr.customer_name || '', siteId: cr.p_siteId || '',
             site: cr.site || '', points: cr.points || [] };
  }

  async function loadReadings(force) {
    if (_readings && !force && (Date.now() - _lastLoad) < 60000) return _readings;
    const byId = {};
    LS.get('hadron_sr', []).forEach(r => { if (r && r.id) byId[r.id] = localToReading(r); });
    (await fetchCloudReports()).forEach(cr => { if (cr && cr.id && !byId[cr.id]) byId[cr.id] = cloudToReading(cr); });

    const out = [];
    Object.values(byId).forEach(rep => {
      pointsOf(rep).forEach(pt => {
        const pointName = ((pt && pt.name) || '').trim();
        (pt && pt.tests || []).forEach(t => {
          const v = num(t.value);
          if (v == null) return;                                     // skip blank / non-numeric readings
          out.push({
            reportId: rep.id, date: rep.date,
            custKey: rep.customerId || ('name:' + (rep.customerName || '—')),
            customerName: rep.customerName || rep.customerId || '—',
            siteKey: rep.siteId || ('name:' + (rep.site || '—')),
            site: rep.site || '—',
            point: pointName || '(unnamed)',
            paramId: t.id || t.code || t.name || '?',
            name: t.name || t.code || t.id || 'Parameter', unit: t.unit || '',
            value: v, specMin: num(t.specMin), specMax: num(t.specMax),
            pass: (typeof t.pass === 'boolean') ? t.pass : null
          });
        });
      });
    });
    out.sort((a, b) => new Date(a.date) - new Date(b.date));
    _readings = out; _lastLoad = Date.now();
    return out;
  }

  function inSpec(r) {
    if (typeof r.pass === 'boolean') return r.pass;
    if (r.specMin != null && r.value < r.specMin) return false;
    if (r.specMax != null && r.value > r.specMax) return false;
    if (r.specMin == null && r.specMax == null) return null;         // no spec → not judged
    return true;
  }

  // ── filter option builders ──────────────────────────────
  function uniqBy(rows, keyFn, labelFn) {
    const m = new Map();
    rows.forEach(r => { const k = keyFn(r); if (!m.has(k)) m.set(k, { key: k, label: labelFn(r) }); });
    return Array.from(m.values()).sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }

  // ── state ───────────────────────────────────────────────
  const F = { cust: '', site: '', point: '__all__', param: '', days: 0 };   // days 0 = all time

  function filtered() {
    const now = Date.now();
    return _readings.filter(r =>
      (!F.cust || r.custKey === F.cust) &&
      (!F.site || r.siteKey === F.site) &&
      (F.point === '__all__' || r.point === F.point) &&
      (!F.param || r.paramId === F.param) &&
      (!F.days || (now - new Date(r.date).getTime()) <= F.days * 86400000)
    );
  }

  // ── stats ───────────────────────────────────────────────
  function computeStats(rows) {
    if (!rows.length) return null;
    const vals = rows.map(r => r.value);
    const judged = rows.map(inSpec).filter(x => x !== null);
    const breaches = rows.filter(r => inSpec(r) === false).length;
    const last = rows.reduce((a, b) => new Date(a.date) >= new Date(b.date) ? a : b);
    return {
      count: rows.length, latest: last.value, latestDate: last.date, latestIn: inSpec(last),
      unit: rows[0].unit,
      min: Math.min.apply(null, vals), max: Math.max.apply(null, vals),
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      breaches, judgedCount: judged.length,
      pctIn: judged.length ? Math.round((judged.filter(Boolean).length / judged.length) * 100) : null
    };
  }

  // ── chart (theme-aware, offline SVG) ────────────────────
  function buildSeries(rows) {
    const byPoint = new Map();
    rows.forEach(r => { if (!byPoint.has(r.point)) byPoint.set(r.point, []); byPoint.get(r.point).push(r); });
    let i = 0;
    return Array.from(byPoint.entries()).map(([name, pts]) => ({
      name, color: SERIES_COLORS[i++ % SERIES_COLORS.length],
      points: pts.slice().sort((a, b) => new Date(a.date) - new Date(b.date))
    }));
  }

  function chartSvg(series, spec, meta, colors) {
    const C = colors || themeColors();
    // Drop readings with an unparseable date — they can't be placed on the time axis, and one NaN
    // time would poison tMin/tMax (via Math.min/max) and blank the whole chart for that one bad report.
    series = series.map(function (s) { return { name: s.name, color: s.color, points: s.points.filter(function (p) { return isFinite(new Date(p.date).getTime()); }) }; }).filter(function (s) { return s.points.length; });
    const W = 760, H = 360, mL = 52, mR = 16, mT = 16, mB = series.length > 1 ? 64 : 44;
    const pL = mL, pR = W - mR, pT = mT, pB = H - mB, pW = pR - pL, pH = pB - pT;

    const all = [];
    series.forEach(s => s.points.forEach(p => all.push(p)));
    if (!all.length) return `<svg viewBox="0 0 ${W} ${H}" width="100%"></svg>`;

    let vMin = Math.min.apply(null, all.map(p => p.value));
    let vMax = Math.max.apply(null, all.map(p => p.value));
    if (spec && spec.min != null) vMin = Math.min(vMin, spec.min);
    if (spec && spec.max != null) vMax = Math.max(vMax, spec.max);
    if (vMin === vMax) { vMin -= 1; vMax += 1; }
    const pad = (vMax - vMin) * 0.08; vMin -= pad; vMax += pad;

    const times = all.map(p => new Date(p.date).getTime());
    let tMin = Math.min.apply(null, times), tMax = Math.max.apply(null, times);
    const xOf = t => (tMax === tMin) ? pL + pW / 2 : pL + ((t - tMin) / (tMax - tMin)) * pW;
    const yOf = v => pB - ((v - vMin) / (vMax - vMin)) * pH;

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:100%;font-family:system-ui,sans-serif;">`;
    svg += `<rect x="${pL}" y="${pT}" width="${pW}" height="${pH}" fill="${C.surface}" stroke="${C.border}"/>`;

    // spec band (in-spec zone) + dashed limit lines
    if (spec && (spec.min != null || spec.max != null)) {
      const yTop = spec.max != null ? yOf(spec.max) : pT;
      const yBot = spec.min != null ? yOf(spec.min) : pB;
      svg += `<rect x="${pL}" y="${yTop}" width="${pW}" height="${Math.max(0, yBot - yTop)}" fill="${C.success}" opacity="0.10"/>`;
      if (spec.max != null) svg += `<line x1="${pL}" y1="${yOf(spec.max)}" x2="${pR}" y2="${yOf(spec.max)}" stroke="${C.danger}" stroke-width="1" stroke-dasharray="5 4"/>`;
      if (spec.min != null) svg += `<line x1="${pL}" y1="${yOf(spec.min)}" x2="${pR}" y2="${yOf(spec.min)}" stroke="${C.danger}" stroke-width="1" stroke-dasharray="5 4"/>`;
    }

    // y gridlines + labels
    const yticks = 5;
    for (let i = 0; i <= yticks; i++) {
      const v = vMin + (i / yticks) * (vMax - vMin), y = yOf(v);
      svg += `<line x1="${pL}" y1="${y}" x2="${pR}" y2="${y}" stroke="${C.border}" stroke-width="0.5" opacity="0.6"/>`;
      svg += `<text x="${pL - 6}" y="${y + 3}" text-anchor="end" font-size="10" fill="${C.muted}">${round(v, 2)}</text>`;
    }
    // x date labels (up to 5)
    const xticks = Math.min(5, all.length);
    for (let i = 0; i < xticks; i++) {
      const t = tMin + (xticks === 1 ? 0.5 : i / (xticks - 1)) * (tMax - tMin), x = xOf(t);
      svg += `<line x1="${x}" y1="${pB}" x2="${x}" y2="${pB + 4}" stroke="${C.muted}"/>`;
      svg += `<text x="${x}" y="${pB + 16}" text-anchor="middle" font-size="10" fill="${C.muted}">${fmtDate(t)}</text>`;
    }

    // series
    series.forEach(s => {
      const pts = s.points;
      if (pts.length > 1) {
        const d = pts.map(p => `${round(xOf(new Date(p.date).getTime()), 1)},${round(yOf(p.value), 1)}`).join(' ');
        svg += `<polyline points="${d}" fill="none" stroke="${s.color}" stroke-width="2"/>`;
      }
      pts.forEach(p => {
        const bad = inSpec(p) === false;
        svg += `<circle cx="${round(xOf(new Date(p.date).getTime()), 1)}" cy="${round(yOf(p.value), 1)}" r="${bad ? 4 : 3}" fill="${bad ? C.danger : s.color}" stroke="${C.surface}" stroke-width="1"/>`;
      });
    });

    // legend (when >1 series) — spec band note otherwise
    if (series.length > 1) {
      let lx = pL, ly = H - 34;
      series.forEach(s => {
        const label = s.name || '(unnamed)';
        svg += `<rect x="${lx}" y="${ly}" width="10" height="10" fill="${s.color}"/>`;
        svg += `<text x="${lx + 14}" y="${ly + 9}" font-size="10" fill="${C.text}">${esc(label)}</text>`;
        lx += 24 + label.length * 6.2;
        if (lx > pR - 60) { lx = pL; ly += 14; }
      });
    }
    // y-axis title (unit)
    if (meta && meta.unit) svg += `<text x="12" y="${pT + pH / 2}" transform="rotate(-90 12 ${pT + pH / 2})" text-anchor="middle" font-size="10" fill="${C.muted}">${esc(meta.unit)}</text>`;
    svg += `</svg>`;
    return svg;
  }

  // ── render ──────────────────────────────────────────────
  function opt(list, sel, extra) {
    return (extra || []).concat(list.map(o => ({ key: o.key, label: o.label })))
      .map(o => `<option value="${esc(o.key)}"${o.key === sel ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
  }

  function repopulate() {
    const rd = _readings;
    // customers
    const custs = uniqBy(rd, r => r.custKey, r => r.customerName);
    if (F.cust && !custs.some(c => c.key === F.cust)) F.cust = '';
    // sites within customer
    const siteRows = rd.filter(r => !F.cust || r.custKey === F.cust);
    const sites = uniqBy(siteRows, r => r.siteKey, r => r.site);
    if (F.site && !sites.some(s => s.key === F.site)) F.site = '';
    // points within customer+site
    const ptRows = siteRows.filter(r => !F.site || r.siteKey === F.site);
    const points = uniqBy(ptRows, r => r.point, r => r.point);
    if (F.point !== '__all__' && !points.some(p => p.key === F.point)) F.point = '__all__';
    // params within the above
    const paRows = ptRows.filter(r => F.point === '__all__' || r.point === F.point);
    const params = uniqBy(paRows, r => r.paramId, r => (r.name + (r.unit ? ' (' + r.unit + ')' : '')));
    if (F.param && !params.some(p => p.key === F.param)) F.param = params.length ? params[0].key : '';
    if (!F.param && params.length) F.param = params[0].key;

    const setSel = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; if (el) { if (window.hgSearchableSync) window.hgSearchableSync(id); } };
    setSel('trf_cust', opt(custs, F.cust, [{ key: '', label: 'All customers' }]));
    setSel('trf_site', opt(sites, F.site, [{ key: '', label: 'All sites' }]));
    setSel('trf_point', opt(points, F.point, [{ key: '__all__', label: 'All sample points' }]));
    setSel('trf_param', opt(params, F.param, []));
    const cs = document.getElementById('trf_cust'), ss = document.getElementById('trf_site');
    if (cs) cs.value = F.cust; if (ss) ss.value = F.site;
    if (window.hgSearchableSync) { window.hgSearchableSync('trf_cust'); window.hgSearchableSync('trf_site'); }
  }

  function renderChartArea() {
    const host = document.getElementById('tr_chartArea'); if (!host) return;
    const rows = filtered();
    if (!F.param) { host.innerHTML = `<p style="color:var(--muted);padding:20px;text-align:center;">No parameters found yet — trends appear here once Service Reports with readings are saved.</p>`; return; }
    if (!rows.length) { host.innerHTML = `<p style="color:var(--muted);padding:20px;text-align:center;">No readings match this selection.</p>`; return; }
    const series = buildSeries(rows);
    const specMin = rows.map(r => r.specMin).find(v => v != null);
    const specMax = rows.map(r => r.specMax).find(v => v != null);
    const spec = { min: specMin == null ? null : specMin, max: specMax == null ? null : specMax };
    const st = computeStats(rows);
    const paramName = rows[0].name, unit = rows[0].unit;

    const stat = (label, val, cls) => `<div class="tr-stat"><div class="tr-stat-v"${cls ? ` style="color:${cls}"` : ''}>${val}</div><div class="tr-stat-l">${esc(label)}</div></div>`;
    const cC = themeColors();
    host.innerHTML = `
      <div style="margin:4px 2px 10px;font-weight:700;font-size:15px;color:var(--text);">${esc(paramName)}${unit ? ` <span style="color:var(--muted);font-weight:400;">(${esc(unit)})</span>` : ''}</div>
      <div class="tr-stats">
        ${stat('Latest', round(st.latest, 2) + (st.latestIn === false ? ' ⚠' : ''), st.latestIn === false ? cC.danger : '')}
        ${stat('Readings', st.count)}
        ${stat('Min', round(st.min, 2))}
        ${stat('Max', round(st.max, 2))}
        ${stat('Average', round(st.avg, 2))}
        ${stat('In spec', st.pctIn == null ? 'n/a' : st.pctIn + '%', st.pctIn != null && st.pctIn < 100 ? cC.danger : cC.success)}
        ${stat('Breaches', st.breaches, st.breaches ? cC.danger : '')}
      </div>
      <div style="border:1px solid var(--border);border-radius:10px;padding:8px;background:var(--surface);overflow-x:auto;">${chartSvg(series, spec, { unit })}</div>
      <details style="margin-top:12px;"><summary style="cursor:pointer;color:var(--accent);font-weight:600;">Readings (${rows.length})</summary>
        <div style="overflow-x:auto;margin-top:8px;"><table class="tr-table"><thead><tr><th>Date</th><th>Site</th><th>Point</th><th>Value</th><th>Spec</th><th>Status</th></tr></thead><tbody>
        ${rows.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => {
          const ok = inSpec(r);
          const specTxt = (r.specMin != null || r.specMax != null) ? `${r.specMin != null ? r.specMin : ''}–${r.specMax != null ? r.specMax : ''}` : '—';
          return `<tr><td>${esc(fmtDate(r.date))}</td><td>${esc(r.site)}</td><td>${esc(r.point)}</td><td>${round(r.value, 3)}</td><td>${esc(specTxt)}</td><td style="color:${ok === false ? cC.danger : ok ? cC.success : cC.muted};">${ok === false ? 'Out' : ok ? 'In' : '—'}</td></tr>`;
        }).join('')}
        </tbody></table></div>
      </details>`;
  }

  function onFilterChange() { repopulate(); renderChartArea(); }

  function render() {
    const root = document.getElementById('trendsContent'); if (!root) return;
    root.innerHTML = `
      <style>
        .tr-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:8px;margin:6px 0 12px;}
        .tr-stat{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 6px;text-align:center;}
        .tr-stat-v{font-size:17px;font-weight:800;color:var(--text);}
        .tr-stat-l{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-top:2px;}
        .tr-table{width:100%;border-collapse:collapse;font-size:13px;}
        .tr-table th,.tr-table td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);white-space:nowrap;}
        .tr-table th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.03em;}
        .tr-field label{display:block;font-size:11px;color:var(--muted);margin:0 0 3px;text-transform:uppercase;letter-spacing:.03em;}
        .tr-field select{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-size:14px;}
      </style>
      <div class="hg-hero" style="background:linear-gradient(135deg,#3AAEDB 0%,#1a3d9e 100%);">
        <div><h2 class="hg-hero-title">Trends &amp; Reports</h2><div class="hg-hero-sub">Trace measurements from Service Reports over time</div></div>
        <div class="hg-hero-icon">📈</div>
      </div>
      <div class="hg-card">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
          <div class="tr-field"><label>Customer</label><select id="trf_cust"></select></div>
          <div class="tr-field"><label>Site</label><select id="trf_site"></select></div>
          <div class="tr-field"><label>Sample point</label><select id="trf_point"></select></div>
          <div class="tr-field"><label>Parameter</label><select id="trf_param"></select></div>
          <div class="tr-field"><label>Period</label><select id="trf_days">
            <option value="0">All time</option><option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option><option value="180">Last 6 months</option>
            <option value="365">Last 12 months</option></select></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
          <button class="hg-btn primary" onclick="hgTrendsExportPdf()">📄 Export PDF report</button>
          <button class="hg-btn ghost" onclick="hgTrendsExportCsv()">⬇️ Export CSV</button>
          <button class="hg-btn ghost" onclick="hgTrendsRefresh()">↻ Refresh</button>
        </div>
      </div>
      <div class="hg-card"><div id="tr_chartArea"><p style="color:var(--muted);padding:20px;text-align:center;">Loading…</p></div></div>`;

    ['trf_cust', 'trf_site', 'trf_point', 'trf_param'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => {
        F.cust = document.getElementById('trf_cust').value;
        F.site = document.getElementById('trf_site').value;
        F.point = document.getElementById('trf_point').value;
        F.param = document.getElementById('trf_param').value;
        onFilterChange();
      });
    });
    const daysEl = document.getElementById('trf_days');
    if (daysEl) { daysEl.value = String(F.days); daysEl.addEventListener('change', () => { F.days = +daysEl.value || 0; renderChartArea(); }); }
    if (window.hgMakeSearchable) { window.hgMakeSearchable('trf_cust', { placeholder: 'Search customers…' }); window.hgMakeSearchable('trf_site', { placeholder: 'Search sites…' }); }
  }

  // ── exports ─────────────────────────────────────────────
  function currentContext() {
    const rows = filtered();
    const custLabel = F.cust ? (rows[0] ? rows[0].customerName : F.cust) : 'All customers';
    const siteLabel = F.site ? (rows[0] ? rows[0].site : F.site) : 'All sites';
    const paramLabel = rows[0] ? rows[0].name : '';
    const unit = rows[0] ? rows[0].unit : '';
    const period = ({ 0: 'All time', 30: 'Last 30 days', 90: 'Last 90 days', 180: 'Last 6 months', 365: 'Last 12 months' })[F.days] || 'All time';
    return { rows, custLabel, siteLabel, paramLabel, unit, period };
  }

  window.hgTrendsExportCsv = function () {
    const { rows, custLabel, paramLabel } = currentContext();
    if (!rows.length) { toast('Nothing to export for this selection'); return; }
    const head = ['Date', 'Customer', 'Site', 'Sample point', 'Parameter', 'Value', 'Unit', 'Spec min', 'Spec max', 'Status'];
    const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const lines = [head.map(q).join(',')].concat(rows.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map(r =>
      [fmtDate(r.date), r.customerName, r.site, r.point, r.name, r.value, r.unit, r.specMin == null ? '' : r.specMin, r.specMax == null ? '' : r.specMax,
       inSpec(r) === false ? 'Out of spec' : inSpec(r) ? 'In spec' : ''].map(q).join(',')));
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = ('trend-' + custLabel + '-' + paramLabel + '.csv').replace(/[^a-z0-9.\-]+/gi, '_');
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  function svgToPng(svg, scale) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 760 * (scale || 2); c.height = 360 * (scale || 2);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  window.hgTrendsExportPdf = async function () {
    if (!(window.jspdf && window.jspdf.jsPDF)) { toast('PDF library still loading — try again'); return; }
    const ctx = currentContext();
    if (!ctx.rows.length) { toast('Nothing to export for this selection'); return; }
    const rows = ctx.rows;
    const series = buildSeries(rows);
    const specMin = rows.map(r => r.specMin).find(v => v != null);
    const specMax = rows.map(r => r.specMax).find(v => v != null);
    const st = computeStats(rows);

    // Render the chart with a fixed LIGHT palette so it rasterizes crisply on the white PDF page,
    // regardless of the app's current (possibly dark) theme.
    const LIGHT = { text: '#1d262d', muted: '#6b7684', border: '#c9d2da', surface: '#ffffff', accent: '#3AAEDB', accent2: '#F5B82E', danger: '#C0392B', success: '#2E7D5B' };
    const pdfSvg = chartSvg(series, { min: specMin == null ? null : specMin, max: specMax == null ? null : specMax }, { unit: ctx.unit }, LIGHT);
    let png = null;
    try { png = await svgToPng(pdfSvg, 2); } catch (_) {}

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const PW = doc.internal.pageSize.getWidth();
    // header
    doc.setFillColor(0, 168, 224); doc.rect(0, 0, PW, 60, 'F');
    doc.setFillColor(245, 184, 46); doc.rect(0, 60, PW, 4, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
    doc.text('Water-Quality Trend Report', 40, 30);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('The Hadron Group', 40, 48);

    let y = 90;
    doc.setTextColor(30, 38, 45); doc.setFontSize(11);
    const line = (k, v) => { doc.setFont('helvetica', 'bold'); doc.text(k, 40, y); doc.setFont('helvetica', 'normal'); doc.text(String(v), 150, y); y += 18; };
    line('Customer:', ctx.custLabel);
    line('Site:', ctx.siteLabel);
    line('Parameter:', ctx.paramLabel + (ctx.unit ? ' (' + ctx.unit + ')' : ''));
    line('Period:', ctx.period);
    line('Generated:', fmtDate(new Date().toISOString()));
    y += 6;

    if (png) { const iw = PW - 80, ih = iw * (360 / 760); doc.addImage(png, 'PNG', 40, y, iw, ih); y += ih + 16; }

    // stats
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Summary', 40, y); y += 16;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const summary = `Readings: ${st.count}    Latest: ${round(st.latest, 2)}    Min: ${round(st.min, 2)}    Max: ${round(st.max, 2)}    Avg: ${round(st.avg, 2)}    In spec: ${st.pctIn == null ? 'n/a' : st.pctIn + '%'}    Breaches: ${st.breaches}`;
    doc.text(summary, 40, y); y += 22;

    // readings table
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Readings', 40, y); y += 16;
    doc.setFontSize(9);
    const cols = [['Date', 40], ['Site', 120], ['Point', 250], ['Value', 380], ['Spec', 440], ['Status', 510]];
    doc.setFont('helvetica', 'bold'); cols.forEach(c => doc.text(c[0], c[1], y)); y += 4;
    doc.setDrawColor(200); doc.line(40, y, PW - 40, y); y += 12;
    doc.setFont('helvetica', 'normal');
    const sorted = rows.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const PH = doc.internal.pageSize.getHeight();
    sorted.forEach(r => {
      if (y > PH - 40) { doc.addPage(); y = 50; }
      const ok = inSpec(r);
      const specTxt = (r.specMin != null || r.specMax != null) ? `${r.specMin != null ? r.specMin : ''}-${r.specMax != null ? r.specMax : ''}` : '-';
      const cells = [fmtDate(r.date), String(r.site).slice(0, 22), String(r.point).slice(0, 20), String(round(r.value, 3)), specTxt, ok === false ? 'Out' : ok ? 'In' : '-'];
      if (ok === false) doc.setTextColor(200, 40, 40); else doc.setTextColor(30, 38, 45);
      cells.forEach((t, i) => doc.text(t, cols[i][1], y));
      y += 14;
    });

    doc.save(('trend-' + ctx.custLabel + '-' + ctx.paramLabel + '.pdf').replace(/[^a-z0-9.\-]+/gi, '_'));
  };

  window.hgTrendsRefresh = async function () {
    const host = document.getElementById('tr_chartArea'); if (host) host.innerHTML = `<p style="color:var(--muted);padding:20px;text-align:center;">Refreshing…</p>`;
    await loadReadings(true);
    repopulate(); renderChartArea();
    toast('Trends refreshed');
  };

  // ── entry ───────────────────────────────────────────────
  window.hgTrendsOpen = async function () {
    render();
    try {
      await loadReadings(false);
      repopulate();
      renderChartArea();
    } catch (e) {
      const host = document.getElementById('tr_chartArea');
      if (host) host.innerHTML = `<p style="color:var(--danger);padding:20px;text-align:center;">Could not load trend data.</p>`;
    }
  };
})();
