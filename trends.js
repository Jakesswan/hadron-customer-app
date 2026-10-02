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
  function fmtDate(d) { if (!d) return '—'; if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d; const x = new Date(d); if (isNaN(x)) return String(d).slice(0, 10); const p = (n) => String(n).padStart(2, '0'); return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()); }   // the phone's own calendar day
  // Smallest and largest of a list (Math.min.apply runs out of stack on very long lists).
  function lowHigh(vals) { let lo = Infinity, hi = -Infinity; for (let i = 0; i < vals.length; i++) { const v = vals[i]; if (v < lo) lo = v; if (v > hi) hi = v; } return [lo, hi]; }
  // The limits of the newest reading that has them (rows are oldest first).
  function newestSpec(rows) { let min = null, max = null; for (let i = rows.length - 1; i >= 0 && (min == null || max == null); i--) { if (min == null && rows[i].specMin != null) min = rows[i].specMin; if (max == null && rows[i].specMax != null) max = rows[i].specMax; } return { min, max }; }
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
      accent2: g('--accent-2', '#F5A623'),
      danger:  g('--danger', '#F87171'),
      success: g('--success', '#34D399')
    };
  }
  // Distinct series palette (built off the brand accents, cycled).
  const SERIES_COLORS = ['#3AAEDB', '#F5A623', '#8E7CC3', '#5FB878', '#E4785B', '#4A7CB5', '#C0507A', '#7A8794'];

  // ── data ────────────────────────────────────────────────
  let _readings = null;   // cached flat readings
  let _lastLoad = 0;
  let _partial = false;      // the server could not be reached: only this phone's reports are shown
  let _loadSeq = 0;          // only the newest load may replace the readings
  const CLOUD_WAIT_MS = 12000;

  // The server answers at most 1000 rows per request: read page after page, after the last id seen (a report
  // added meanwhile can't shift a page). { rows } on success, { rejected: true } when the server refused this
  // select (400), null when the read failed.
  async function readAll(cols) {
    const PAGE = 1000, out = [];
    let after = null;
    for (;;) {
      let q = window.HG_SUPA.from('service_reports').select(cols).order('id', { ascending: true }).limit(PAGE);
      if (after !== null) q = q.gt('id', after);
      const res = await q;
      if (!res || res.error || !Array.isArray(res.data)) return (res && res.status === 400) ? { rejected: true } : null;
      for (const r of res.data) out.push(r);
      if (res.data.length !== PAGE) return { rows: out };   // a short page is the last; a longer one means no paging was applied
      const next = res.data[res.data.length - 1].id;
      if (next == null || next === after) return null;   // no progress: never loop on a bad answer
      after = next;
    }
  }

  async function fetchCloudReports() {
    if (!window.HG_SUPA) return [];
    try {
      // Light: pull just the readings (points) + identity keys, NOT the base64 photos/signature.
      let r = await readAll('id, report_date, site, customer_name, points:payload->points, p_siteId:payload->>siteId, p_customerId:payload->>customerId, p_customerName:payload->>customerName, p_date:payload->>date');
      if (r && r.rows) return r.rows;
      if (!r || !r.rejected) return null;   // only a rejected select is retried with the whole payload (photos and all)
      // Fallback: some PostgREST configs differ — pull the whole payload and extract client-side.
      r = await readAll('id, report_date, site, customer_name, payload');
      if (r && r.rows) {
        return r.rows.map(row => ({
          id: row.id, report_date: row.report_date, site: row.site, customer_name: row.customer_name,
          points: (row.payload && row.payload.points) || [],
          p_siteId: row.payload && row.payload.siteId, p_customerId: row.payload && row.payload.customerId,
          p_customerName: row.payload && row.payload.customerName, p_date: row.payload && row.payload.date
        }));
      }
    } catch (_) {}
    return null;   // couldn't reach the server: the caller shows this phone's reports only
  }

  function pointsOf(rep) {
    if (Array.isArray(rep.points) && rep.points.length) return rep.points;
    if (Array.isArray(rep.tests) && rep.tests.length) return [{ name: '', tests: rep.tests }];   // legacy flat report
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
    const seq = ++_loadSeq;
    const byId = {};
    LS.get('hadron_sr', []).forEach(r => { if (r && r.id) byId[r.id] = localToReading(r); });
    // A slow or dead connection must not leave the screen on "Loading…": after CLOUD_WAIT_MS use this phone's reports.
    // Offline, or signed in but not confirmed by the server yet (auth-ui __hgOfflineSession): don't wait for it.
    const offline = navigator.onLine === false || !!window.__hgOfflineSession;
    const cloud = offline ? null : await Promise.race([fetchCloudReports(), new Promise(res => setTimeout(() => res(null), CLOUD_WAIT_MS))]);
    if (seq !== _loadSeq) return null;   // a newer load (Refresh) has taken over: it draws the screen
    _partial = cloud == null;
    (cloud || []).forEach(cr => { if (cr && cr.id && !byId[cr.id]) byId[cr.id] = cloudToReading(cr); });

    const out = [];
    Object.values(byId).forEach(rep => {
      pointsOf(rep).forEach(pt => {
        const pointName = ((pt && pt.name) || '').trim();
        (pt && Array.isArray(pt.tests) ? pt.tests : []).forEach(t => {
          if (!t) return;
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
    _readings = out; _lastLoad = _partial ? 0 : Date.now();   // partial: ask the server again next time
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
      min: lowHigh(vals)[0], max: lowHigh(vals)[1],
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      breaches, judgedCount: judged.length,
      pctIn: judged.length ? Math.floor((judged.filter(Boolean).length / judged.length) * 100) : null   // floored: one breach is never "100 %"
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

  // Drawn at the width it is shown at (meta.width; about 300 px on a phone), so its labels stay 10-11 px
  // instead of shrinking with a fixed 760-wide drawing. The PDF uses the full 760 x 360.
  function chartSvg(series, spec, meta, colors) {
    const C = colors || themeColors();
    // Drop readings with an unparseable date — they can't be placed on the time axis, and one NaN
    // time would poison tMin/tMax and blank the whole chart for that one bad report.
    series = series.map(function (s) { return { name: s.name, color: s.color, points: s.points.filter(function (p) { return isFinite(new Date(p.date).getTime()); }) }; }).filter(function (s) { return s.points.length; });
    const W = Math.max(230, Math.min(760, Math.round((meta && meta.width) || 760)));
    const small = W < 500, FS = small ? 11 : 10, H = small ? 250 : 360;
    const NS = 'xmlns="http://www.w3.org/2000/svg"';   // needed when the PDF loads it as an image
    const all = [];
    series.forEach(s => s.points.forEach(p => all.push(p)));
    if (!all.length) return `<svg ${NS} viewBox="0 0 ${W} ${H}" width="100%"></svg>`;

    let [vMin, vMax] = lowHigh(all.map(p => p.value));
    if (spec && spec.min != null) vMin = Math.min(vMin, spec.min);
    if (spec && spec.max != null) vMax = Math.max(vMax, spec.max);
    if (vMin === vMax) { vMin -= 1; vMax += 1; }
    const pad = (vMax - vMin) * 0.08; vMin -= pad; vMax += pad;
    const span = vMax - vMin;
    const dp = span > 20 ? 0 : span > 2 ? 1 : span > 0.2 ? 2 : span > 0.02 ? 3 : 4;   // tick labels as short as the range allows (trace values too)
    const yticks = small ? 4 : 5;
    const yLabels = [];
    for (let i = 0; i <= yticks; i++) yLabels.push(vMin + (i / yticks) * (vMax - vMin));
    const labelW = Math.max.apply(null, yLabels.map(v => String(round(v, dp)).length)) * FS * 0.6;

    // Legend (more than one sample point) laid out first: its rows decide the bottom margin.
    const unitRoom = meta && meta.unit ? FS + 6 : 2;
    const mL = Math.ceil(labelW + 8 + unitRoom), mR = small ? 10 : 16, mT = 12;
    const legend = [];
    if (series.length > 1) {
      let lx = 0, row = 0, more = 0;
      const room = W - mL - mR, MAXR = small ? 3 : 5;   // the plot keeps its height: the rest become "+N more"
      series.forEach(s => {
        const name = s.name || '(unnamed)';
        const label = name.length > 28 ? name.slice(0, 27) + '…' : name;
        const w = 22 + label.length * FS * 0.6;
        if (lx > 0 && lx + w > room) { lx = 0; row++; }
        if (row >= MAXR) { more++; return; }
        legend.push({ s, label, x: lx, row });
        lx += w;
      });
      if (more) { const last = legend.pop(); legend.push({ s: null, label: '+' + (more + 1) + ' more', x: last.x, row: last.row }); }
    }
    const lRows = legend.length ? legend[legend.length - 1].row + 1 : 0;
    const mB = FS + 10 + (lRows ? 8 + lRows * (FS + 6) : 0);
    const pL = mL, pR = W - mR, pT = mT, pB = H - mB, pW = pR - pL, pH = pB - pT;

    const [tMin, tMax] = lowHigh(all.map(p => new Date(p.date).getTime()));
    const xOf = t => (tMax === tMin) ? pL + pW / 2 : pL + ((t - tMin) / (tMax - tMin)) * pW;
    const yOf = v => pB - ((v - vMin) / (vMax - vMin)) * pH;

    let svg = `<svg ${NS} viewBox="0 0 ${W} ${H}" width="100%" style="max-width:100%;font-family:system-ui,sans-serif;">`;
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
    yLabels.forEach(v => {
      const y = yOf(v);
      svg += `<line x1="${pL}" y1="${y}" x2="${pR}" y2="${y}" stroke="${C.border}" stroke-width="0.5" opacity="0.6"/>`;
      svg += `<text x="${pL - 6}" y="${y + FS * 0.35}" text-anchor="end" font-size="${FS}" fill="${C.muted}">${round(v, dp)}</text>`;
    });
    // x date labels: 2-3 on a phone, up to 5 otherwise; the end ones anchored so they stay inside
    const xticks = tMax === tMin ? 1 : Math.min(pW < 200 ? 2 : small ? 3 : 5, all.length);   // one moment: one date; each label is about 66 px wide
    for (let i = 0; i < xticks; i++) {
      const t = tMin + (xticks === 1 ? 0.5 : i / (xticks - 1)) * (tMax - tMin), x = xOf(t);
      const anchor = xticks === 1 ? 'middle' : i === 0 ? 'start' : i === xticks - 1 ? 'end' : 'middle';
      svg += `<line x1="${x}" y1="${pB}" x2="${x}" y2="${pB + 4}" stroke="${C.muted}"/>`;
      svg += `<text x="${x}" y="${pB + 6 + FS}" text-anchor="${anchor}" font-size="${FS}" fill="${C.muted}">${fmtDate(t)}</text>`;
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

    // legend rows under the dates
    legend.forEach(it => {
      const lx = pL + it.x, ly = pB + FS + 14 + it.row * (FS + 6);
      if (it.s) svg += `<rect x="${lx}" y="${ly}" width="10" height="10" fill="${it.s.color}"/>`;
      svg += `<text x="${it.s ? lx + 14 : lx}" y="${ly + 9}" font-size="${FS}" fill="${it.s ? C.text : C.muted}">${esc(it.label)}</text>`;
    });
    // y-axis title (unit)
    if (meta && meta.unit) svg += `<text x="${FS + 2}" y="${pT + pH / 2}" transform="rotate(-90 ${FS + 2} ${pT + pH / 2})" text-anchor="middle" font-size="${FS}" fill="${C.muted}">${esc(meta.unit)}</text>`;
    svg += `</svg>`;
    return svg;
  }

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

  function partialNote() {
    return _partial ? '<div class="tr-note" role="status">Showing the reports saved on this phone only: the server couldn’t be reached. Tap Refresh to try again.</div>' : '';
  }

  function renderChartArea() {
    const host = document.getElementById('tr_chartArea'); if (!host) return;
    const rows = filtered();
    if (!F.param) { host.innerHTML = partialNote() + `<p style="color:var(--muted);padding:20px;text-align:center;">No parameters found yet — trends appear here once Service Reports with readings are saved.</p>`; return; }
    if (!rows.length) { host.innerHTML = partialNote() + `<p style="color:var(--muted);padding:20px;text-align:center;">No readings match this selection.</p>`; return; }
    const series = buildSeries(rows);
    const spec = newestSpec(rows);
    const st = computeStats(rows);
    const chartW = host.clientWidth ? host.clientWidth - 18 : 0;   // the chart box's inside (8 px padding, 1 px border)
    const paramName = rows[0].name, unit = rows[0].unit;

    const stat = (label, val, cls) => `<div class="tr-stat"><div class="tr-stat-v"${cls ? ` style="color:${cls}"` : ''}>${val}</div><div class="tr-stat-l">${esc(label)}</div></div>`;
    const cC = themeColors();
    host.innerHTML = partialNote() + `
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
      <div style="border:1px solid var(--border);border-radius:10px;padding:8px;background:var(--surface);overflow-x:auto;">${chartSvg(series, spec, { unit, width: chartW || 760 })}</div>
      <details style="margin-top:12px;"><summary style="cursor:pointer;color:var(--accent-ink);font-weight:600;">Readings (${rows.length})</summary>
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
        #trendsContent .hg-card{overflow:visible;}
        .tr-note{margin:0 0 10px;padding:8px 10px;border-radius:8px;font-size:13px;line-height:1.4;background:rgba(245,166,35,.14);color:var(--warn-ink,#9A6400);}
      </style>
      <div class="hg-hero">
        <h2 class="hg-hero-title">Trends &amp; Reports</h2>
        <div class="hg-hero-sub">Trace measurements from Service Reports over time</div>
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
    // A name starting with = + - @ must not run as a formula when the CSV is opened in a spreadsheet.
    const q = s => { let v = String(s == null ? '' : s); if (/^[=+\-@\t\r]/.test(v) && !isFinite(Number(v))) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    const lines = [head.map(q).join(',')].concat(rows.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map(r =>
      [fmtDate(r.date), r.customerName, r.site, r.point, r.name, r.value, r.unit, r.specMin == null ? '' : r.specMin, r.specMax == null ? '' : r.specMax,
       inSpec(r) === false ? 'Out of spec' : inSpec(r) ? 'In spec' : ''].map(q).join(',')));
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });   // BOM: Excel reads it as UTF-8
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
    if (!(window.jspdf && window.jspdf.jsPDF)) { toast(navigator.onLine === false ? 'Making the PDF needs an internet connection: try again when you’re online' : 'PDF library still loading — try again'); return; }
    const ctx = currentContext();
    if (!ctx.rows.length) { toast('Nothing to export for this selection'); return; }
    const rows = ctx.rows;
    const series = buildSeries(rows);
    const spec = newestSpec(rows);
    const st = computeStats(rows);
    // The PDF's Helvetica has no sub/superscript digits (PO₄, SO₄²⁻): plain characters instead.
    const P = (s) => String(s == null ? '' : s).replace(/[\u2080-\u2089]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x2050)).replace(/[\u2070\u2074-\u2079]/g, c => String.fromCharCode(c.charCodeAt(0) === 0x2070 ? 48 : c.charCodeAt(0) - 0x2040)).replace(/\u207A/g, '+').replace(/\u207B/g, '-');

    // Render the chart with a fixed LIGHT palette so it rasterizes crisply on the white PDF page,
    // regardless of the app's current (possibly dark) theme.
    const LIGHT = { text: '#1d262d', muted: '#6b7684', border: '#c9d2da', surface: '#ffffff', accent: '#3AAEDB', accent2: '#F5A623', danger: '#C0392B', success: '#2E7D5B' };
    const pdfSvg = chartSvg(series, spec, { unit: ctx.unit }, LIGHT);
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
    const line = (k, v) => { doc.setFont('helvetica', 'bold'); doc.text(k, 40, y); doc.setFont('helvetica', 'normal'); doc.text(P(v), 150, y); y += 18; };
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
    const heading = () => {
      doc.setTextColor(30, 38, 45); doc.setFont('helvetica', 'bold'); cols.forEach(c => doc.text(c[0], c[1], y)); y += 4;
      doc.setDrawColor(200); doc.line(40, y, PW - 40, y); y += 12;
      doc.setFont('helvetica', 'normal');
    };
    heading();
    const sorted = rows.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const PH = doc.internal.pageSize.getHeight();
    sorted.forEach(r => {
      if (y > PH - 40) { doc.addPage(); y = 50; doc.setFontSize(9); heading(); }   // the heading again on every page
      const ok = inSpec(r);
      const specTxt = (r.specMin != null || r.specMax != null) ? `${r.specMin != null ? r.specMin : ''}-${r.specMax != null ? r.specMax : ''}` : '-';
      const cells = [fmtDate(r.date), P(r.site).slice(0, 22), P(r.point).slice(0, 20), String(round(r.value, 3)), specTxt, ok === false ? 'Out' : ok ? 'In' : '-'];
      if (ok === false) doc.setTextColor(200, 40, 40); else doc.setTextColor(30, 38, 45);
      cells.forEach((t, i) => doc.text(t, cols[i][1], y));
      y += 14;
    });

    doc.save(('trend-' + ctx.custLabel + '-' + ctx.paramLabel + '.pdf').replace(/[^a-z0-9.\-]+/gi, '_'));
  };

  window.hgTrendsRefresh = async function () {
    const host = document.getElementById('tr_chartArea'); if (host) host.innerHTML = `<p style="color:var(--muted);padding:20px;text-align:center;">Refreshing…</p>`;
    if (!(await loadReadings(true))) return;
    repopulate(); renderChartArea();
    toast(_partial ? 'Server not reachable: showing this phone’s reports' : 'Trends refreshed');
  };

  // Turning the phone: draw the chart again at the new width. Only when the width changed (the on-screen
  // keyboard changes just the height) and Trends is open.
  let _lastW = window.innerWidth, _resizeT = null;
  window.addEventListener('resize', function () {
    clearTimeout(_resizeT);
    _resizeT = setTimeout(function () {
      if (window.innerWidth === _lastW) return;
      _lastW = window.innerWidth;
      const win = document.getElementById('window-trends');
      if (_readings && win && win.classList.contains('active')) renderChartArea();
    }, 250);
  });

  // ── entry ───────────────────────────────────────────────
  window.hgTrendsOpen = async function () {
    render();
    try {
      if (!(await loadReadings(false))) return;
      repopulate();
      renderChartArea();
    } catch (e) {
      const host = document.getElementById('tr_chartArea');
      if (host) host.innerHTML = `<p style="color:var(--danger);padding:20px;text-align:center;">Could not load trend data.</p>`;
    }
  };
})();
