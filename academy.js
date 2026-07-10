/* ============================================================
   HADRON ACADEMY — water-treatment courseware shell.
   Standalone IIFE module: data + UI + progress tracking.
   Lessons reference the Hadron calculator suite + LIMS, so a
   student can jump from theory straight to the matching tool.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Utilities ---------- */
  const esc = (s) => (s == null ? '' : String(s)).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  const PROGRESS_KEY = 'hadron_academy_progress';

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
    academySyncPush();   // mirror to the cloud (debounced; no-ops if not signed in)
  }

  function markModuleComplete(courseId, moduleId) {
    const p = loadProgress();
    p[courseId] = p[courseId] || { startedAt: new Date().toISOString(), completed: [], lastViewed: null };
    if (p[courseId].completed.indexOf(moduleId) === -1) p[courseId].completed.push(moduleId);
    p[courseId].lastViewed = moduleId;
    // Stamp the completion date the first time every module is done — used on the certificate.
    const course = COURSES.find(x => x.id === courseId);
    if (course && !p[courseId].completedAt && p[courseId].completed.length >= course.modules.length) {
      p[courseId].completedAt = new Date().toISOString();
    }
    saveProgress(p);
  }
  function progressFor(courseId) {
    const p = loadProgress();
    return p[courseId] || { completed: [], lastViewed: null };
  }
  function courseProgressPct(course) {
    const p = progressFor(course.id);
    if (!course.modules.length) return 0;
    return Math.round((p.completed.length / course.modules.length) * 100);
  }

  // Record the best score (0–100) a learner has achieved on a module's quiz.
  function recordQuizScore(courseId, moduleId, pct) {
    const p = loadProgress();
    p[courseId] = p[courseId] || { startedAt: new Date().toISOString(), completed: [], lastViewed: null };
    p[courseId].scores = p[courseId].scores || {};
    if (!(moduleId in p[courseId].scores) || pct > p[courseId].scores[moduleId]) {
      p[courseId].scores[moduleId] = pct;
    }
    saveProgress(p);
  }

  // Average of the learner's best quiz scores across a course's quiz modules.
  function courseQuizResult(course) {
    const scores = progressFor(course.id).scores || {};
    const quizModules = course.modules.filter(m => Array.isArray(m.quiz) && m.quiz.length);
    const taken = quizModules.filter(m => m.id in scores);
    if (!taken.length) return { has: false, count: 0, total: quizModules.length, avg: 0 };
    const avg = Math.round(taken.reduce((n, m) => n + scores[m.id], 0) / taken.length);
    return { has: true, count: taken.length, total: quizModules.length, avg: avg };
  }

  /* ---------- Completion certificates ----------
     A course is "complete" (certificate-eligible) at 100% module progress. Because
     a Knowledge-check module only completes on a passing quiz score, 100% implies
     the quiz was passed. The certificate is a branded, self-contained HTML page
     opened in a new tab for print / Save-as-PDF — no library, works offline. */
  function courseIsComplete(course) { return course && course.modules.length > 0 && courseProgressPct(course) === 100; }

  function fmtCertDate(d) {
    const M = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return d.getDate() + ' ' + M[d.getMonth()] + ' ' + d.getFullYear();
  }
  // Deterministic, stable certificate id from learner + course (FNV-1a → base36).
  function certHash(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(36).toUpperCase();
  }
  function certId(profId, course) { return 'HA-' + course.code + '-' + certHash((profId || 'anon') + '|' + course.id).slice(0, 5); }

  function academyCertData(courseId) {
    const c = COURSES.find(x => x.id === courseId);
    if (!c) return null;
    const prof = window.HG_PROFILE || {};
    const p = progressFor(c.id);
    const res = courseQuizResult(c);
    const completedAt = p.completedAt ? new Date(p.completedAt) : new Date();
    const name = (prof.full_name && prof.full_name.trim()) || prof.email || 'Hadron Academy Learner';
    const org = (prof.organisations && prof.organisations.name) || '';
    return {
      eligible: courseIsComplete(c),
      code: c.code, title: c.title, level: c.level, duration: c.duration,
      track: (TRACKS.find(t => t.id === c.trackId) || {}).name || '',
      name: name, org: org,
      scoreText: res.has ? (res.avg + '%') : null,
      dateText: fmtCertDate(completedAt),
      certId: certId(prof.id, c)
    };
  }

  function academyCertHtml(d) {
    const e = esc;
    return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<title>Certificate — ' + e(d.title) + '</title><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<style>' +
      '@page { size: A4 landscape; margin: 0; }' +
      ':root { --blue:#123E63; --blue2:#1a3d9e; --accent:#3AAEDB; --ink:#2e3742; --gold:#d4a12a; --gold2:#f5a623; }' +
      '* { box-sizing: border-box; }' +
      'body { margin:0; font-family: Georgia, "Times New Roman", serif; color: var(--ink); background:#5b6b78; }' +
      '.bar { text-align:center; padding:14px; }' +
      '.bar button { font-family: system-ui, sans-serif; font-size:14px; font-weight:600; cursor:pointer; border:0; border-radius:8px; padding:10px 18px; margin:0 4px; background:var(--accent); color:#fff; }' +
      '.bar button.ghost { background:#fff; color:var(--ink); border:1px solid #ccc; }' +
      '.sheet { width:297mm; min-height:210mm; margin:0 auto 24px; background:#fff; position:relative; padding:18mm 20mm; }' +
      '.frame { position:absolute; inset:8mm; border:2px solid var(--blue); }' +
      '.frame:after { content:""; position:absolute; inset:3mm; border:1px solid var(--accent); }' +
      '.inner { position:relative; text-align:center; height:100%; display:flex; flex-direction:column; }' +
      '.brand { font-family: system-ui, sans-serif; letter-spacing:3px; font-size:13px; font-weight:700; color:var(--blue); text-transform:uppercase; }' +
      '.brand small { display:block; letter-spacing:2px; font-size:10px; font-weight:600; color:var(--accent); margin-top:3px; }' +
      '.title { font-size:40px; font-weight:700; color:var(--blue); margin:18px 0 2px; letter-spacing:1px; }' +
      '.rule { width:90px; height:3px; background:var(--gold2); margin:6px auto 14px; border-radius:2px; }' +
      '.pre { font-size:15px; color:#5a6a76; }' +
      '.name { font-size:38px; color:var(--ink); margin:10px 0 6px; }' +
      '.course { font-size:24px; font-weight:700; color:var(--blue2); margin:8px 0 2px; padding:0 10mm; }' +
      '.meta { font-family: system-ui, sans-serif; font-size:13px; color:#5a6a76; }' +
      '.chips { font-family: system-ui, sans-serif; margin:12px 0 4px; }' +
      '.chip { display:inline-block; border:1px solid #d7dee4; border-radius:999px; padding:5px 12px; margin:0 4px; font-size:12px; color:var(--ink); }' +
      '.chip b { color:var(--blue); }' +
      '.seal { width:96px; height:96px; margin:14px auto 0; }' +
      '.foot { margin-top:auto; display:flex; justify-content:space-between; align-items:flex-end; font-family: system-ui, sans-serif; padding-top:16px; }' +
      '.sig { text-align:center; }' +
      '.sig .line { width:200px; border-top:1.5px solid var(--ink); margin:0 auto 4px; }' +
      '.sig .who { font-size:13px; font-weight:600; color:var(--ink); }' +
      '.sig .sub { font-size:11px; color:#5a6a76; }' +
      '.cid { text-align:right; font-size:11px; color:#5a6a76; line-height:1.6; }' +
      '.cid b { color:var(--ink); }' +
      '@media print { body { background:#fff; } .bar { display:none; } .sheet { margin:0; box-shadow:none; } }' +
      '@media screen { .sheet { box-shadow:0 10px 40px rgba(0,0,0,.35); margin-top:8px; } }' +
      '</style></head><body>' +
      '<div class="bar"><button onclick="window.print()">Print / Save as PDF</button><button class="ghost" onclick="window.close()">Close</button></div>' +
      '<div class="sheet"><div class="frame"></div><div class="inner">' +
      '<div class="brand">Hadron Academy<small>Water Treatment Training</small></div>' +
      '<div class="title">Certificate of Completion</div><div class="rule"></div>' +
      '<div class="pre">This is to certify that</div>' +
      '<div class="name">' + e(d.name) + '</div>' +
      (d.org ? '<div class="meta">of ' + e(d.org) + '</div>' : '') +
      '<div class="pre" style="margin-top:14px;">has successfully completed the course</div>' +
      '<div class="course">' + e(d.title) + '</div>' +
      '<div class="meta">' + e(d.code) + ' · ' + e(d.level) + ' · ' + e(d.track) + ' Track · ' + e(d.duration) + '</div>' +
      '<div class="chips">' +
      (d.scoreText ? '<span class="chip">Knowledge check: <b>' + e(d.scoreText) + '</b></span>' : '') +
      '<span class="chip">Completed: <b>' + e(d.dateText) + '</b></span></div>' +
      '<div class="seal">' + certSealSvg() + '</div>' +
      '<div class="foot">' +
      '<div class="sig"><div class="line"></div><div class="who">Hadron Group</div><div class="sub">Water Treatment Specialists</div></div>' +
      '<div class="cid">Certificate ID<br><b>' + e(d.certId) + '</b><br>Issued by Hadron Academy</div>' +
      '</div></div></div></body></html>';
  }

  // Self-contained gold rosette seal (no external assets).
  function certSealSvg() {
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="96" height="96">' +
      '<defs><radialGradient id="g" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#f5cf6a"/><stop offset="100%" stop-color="#d4a12a"/></radialGradient></defs>' +
      '<path d="M42 78 L36 96 L50 88 L64 96 L58 78 Z" fill="#1a3d9e"/>' +
      '<circle cx="50" cy="46" r="30" fill="url(#g)" stroke="#b9861f" stroke-width="2"/>' +
      '<circle cx="50" cy="46" r="23" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.7"/>' +
      '<path d="M40 47 l7 7 l14 -16" fill="none" stroke="#123E63" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  window.academyCertificate = function (courseId) {
    const d = academyCertData(courseId);
    if (!d) return;
    if (!d.eligible) { alert('Complete all modules (including the Knowledge check) to earn your certificate.'); return; }
    const w = window.open('', '_blank');
    if (!w) { alert('Please allow pop-ups so your certificate can open in a new tab.'); return; }
    w.document.open(); w.document.write(academyCertHtml(d)); w.document.close();
  };
  // exposed for verification/testing
  window._academyCertData = academyCertData;
  window._academyCertHtml = academyCertHtml;

  /* ---------- Cloud sync (per-user training record) ----------
     The progress blob (completed modules + quiz scores) syncs per user, scoped to
     the org, into the academy_progress table. Pull-merge when the profile loads,
     debounced push on every change. No-ops gracefully until the user is signed in
     and migration 0004 has created the table. Mirrors lims-sync's lifecycle. */
  const SYNC = { orgId: null, userId: null, pushTimer: null };

  function mergeProgress(localP, cloudP) {
    Object.keys(cloudP || {}).forEach(function (cid) {
      const cloud = cloudP[cid]; if (!cloud) return;
      const loc = localP[cid] || { startedAt: cloud.startedAt || null, completed: [], lastViewed: null, scores: {} };
      const seen = {};
      (loc.completed || []).concat(cloud.completed || []).forEach(function (mid) { seen[mid] = 1; });
      loc.completed = Object.keys(seen);                                   // union of completed modules
      loc.scores = loc.scores || {};
      const cs = cloud.scores || {};
      Object.keys(cs).forEach(function (mid) { if (!(mid in loc.scores) || cs[mid] > loc.scores[mid]) loc.scores[mid] = cs[mid]; }); // best score wins
      if (cloud.startedAt && (!loc.startedAt || cloud.startedAt < loc.startedAt)) loc.startedAt = cloud.startedAt;
      if (cloud.lastViewed && (!loc.lastViewed || cloud.lastViewed > loc.lastViewed)) loc.lastViewed = cloud.lastViewed;
      localP[cid] = loc;
    });
    return localP;
  }

  function academySyncPull() {
    if (!SYNC.userId || !window.HG_DB || !window.HG_DB.academy_progress) return;
    window.HG_DB.academy_progress.get(SYNC.userId).then(function (row) {
      if (row && row.payload) {
        saveProgress(mergeProgress(loadProgress(), row.payload));          // merge cloud → local (and push the union back)
        if (typeof window.academyRerender === 'function') window.academyRerender();
      }
    }).catch(function () {});   // table may not exist yet (pre-migration)
  }

  function academySyncPushNow() {
    if (!SYNC.userId || !SYNC.orgId || !window.HG_DB || !window.HG_DB.academy_progress) return;
    window.HG_DB.academy_progress.upsert({
      id: SYNC.userId, organisation_id: SYNC.orgId, user_id: SYNC.userId,
      payload: loadProgress(), updated_at: new Date().toISOString()
    }).catch(function () {});
  }
  function academySyncPush() {
    if (SYNC.pushTimer) clearTimeout(SYNC.pushTimer);
    SYNC.pushTimer = setTimeout(academySyncPushNow, 1500);
  }

  function academySyncActivate() {
    const prof = window.HG_PROFILE;
    if (!prof || !prof.organisation_id || !prof.id) return;
    SYNC.orgId = prof.organisation_id;
    SYNC.userId = prof.id;
    academySyncPull();
  }
  if (window.HG_PROFILE) academySyncActivate();
  document.addEventListener('hg:profile:loaded', academySyncActivate);
  document.addEventListener('hg:auth:changed', function (e) {
    if (!e.detail || !e.detail.session) { SYNC.orgId = null; SYNC.userId = null; }   // signed out
  });

  /* ---------- Linked calc tools metadata ---------- */
  // Map app-window IDs to friendly labels so lessons can deep-link cleanly.
  const TOOLS = {
    dosage:        { label: 'Dosage Calculator (Cl, ClO₂, Coagulants, Skid)', icon: '💊' },
    waterindex:    { label: 'LSI / RSI Index',                                icon: '🧮' },
    coolingtower:  { label: 'Cooling Tower',                                  icon: '🏭' },
    boiler:        { label: 'Boiler / Steam',                                 icon: '🔥' },
    rocalc:        { label: 'RO Performance',                                 icon: '💧' },
    converters:    { label: 'Unit Converters (M ↔ N ↔ ppm)',                  icon: '🔁' },
    neutralise:    { label: 'Acid / Alkali Neutralisation',                   icon: '⚗️' },
    effluent:      { label: 'Effluent Tools (BOD / F:M / SRT / Jar Test)',    icon: '🌊' },
    servicereport: { label: 'Service Report',                                 icon: '📝' },
    pool:          { label: 'Pool Water',                                     icon: '🏊' },
    lims:          { label: 'LIMS',                                           icon: '🧬' },
    qr:            { label: 'QR Builder',                                     icon: '⬛' }
  };

  /* ---------- Tracks (top-level categories) ---------- */
  const TRACKS = [
    { id: 'track-potable',      name: 'Potable Water',         icon: '🚰', g: 'linear-gradient(135deg, #3AAEDB 0%, #1a3d9e 100%)', sub: 'Drinking water treatment from source to tap' },
    { id: 'track-disinfection', name: 'Disinfection',          icon: '🛡️', g: 'linear-gradient(135deg, #2e3742 0%, #3AAEDB 100%)', sub: 'Chlorine, ClO₂, UV, ozone & DBPs' },
    { id: 'track-sewage',       name: 'Sewage Treatment',      icon: '🚽', g: 'linear-gradient(135deg, #6c4a1f 0%, #b07a3f 100%)', sub: 'Wastewater treatment & sludge' },
    { id: 'track-effluent',     name: 'Industrial Effluent',   icon: '🏭', g: 'linear-gradient(135deg, #4ec5d4 0%, #2c5e8a 100%)', sub: 'Trade waste, paint detack, F&B, DAF' },
    { id: 'track-cooling',      name: 'Cooling Water',         icon: '❄️', g: 'linear-gradient(135deg, #5a73c2 0%, #1a3d9e 100%)', sub: 'Cooling towers & closed-loop systems' },
    { id: 'track-boiler',       name: 'Boiler Water',          icon: '🔥', g: 'linear-gradient(135deg, #d44a26 0%, #8a1f0a 100%)', sub: 'Steam systems & internal treatment' },
    { id: 'track-ro',           name: 'Reverse Osmosis',       icon: '💧', g: 'linear-gradient(135deg, #3AAEDB 0%, #007a8a 100%)', sub: 'RO, NF, UF, MF & antiscalants' },
    { id: 'track-equipment',    name: 'Treatment Equipment',   icon: '⚙️', g: 'linear-gradient(135deg, #4b5b6d 0%, #2e3742 100%)', sub: 'Pumps, filters, dosers, instruments' },
    { id: 'track-ops',          name: 'Operations & Safety',   icon: '🦺', g: 'linear-gradient(135deg, #ff9a3f 0%, #d44a26 100%)', sub: 'Plant ops, MSDS, sampling, response' },
    { id: 'track-chemistry',    name: 'Water Chemistry',       icon: '⚗️', g: 'linear-gradient(135deg, #7a59d4 0%, #4b3a8c 100%)', sub: 'pH, alkalinity, hardness, microbiology' }
  ];

  /* ---------- Courses (curriculum) ---------- */
  // Each course: { id, trackId, code, title, level, duration, summary, outcomes,
  //                prereqs, linkedTools, sources, modules: [{id,title,duration,summary,sections}] }

  const COURSES = [

    /* ──────────────────  POTABLE WATER  ────────────────── */

    {
      id: 'c-pot-101', trackId: 'track-potable', code: 'POT-101',
      title: 'Introduction to Drinking Water Treatment',
      level: 'Foundation', duration: '4 hrs',
      summary: 'A grounded tour of why we treat water, the typical treatment train, and the operator\'s daily reality. Sets up every other course in the Potable track.',
      outcomes: [
        'Describe the public-health drivers behind water treatment',
        'Identify the major unit processes in a conventional plant',
        'List the SANS 241 risk classes (acute / chronic / aesthetic / operational)',
        'Run a basic operator pre-shift walk-down'
      ],
      prereqs: [],
      linkedTools: ['waterindex', 'dosage', 'lims'],
      sources: ['WRC Handbook for the Operation of Water Treatment Works (Schutte, 2006)', 'Rand Water — Introduction to Water Treatment', 'SANS 241:2015'],
      modules: [
        { id:'m1', title:'Why we treat water', duration:'25 min',
          summary:'Pathogens, chemical risks, aesthetics — the three reasons the world built water plants.',
          sections:['The water cycle and where contamination enters','Public-health goals: acute vs chronic risk','SANS 241:2015 vs WHO guidelines for drinking water'] },
        { id:'m2', title:'Source water types', duration:'30 min',
          summary:'Surface water, groundwater and reuse each behave differently. Knowing which one you have decides everything that follows.',
          sections:['Surface water — variability, algae, NOM','Groundwater — hardness, iron, manganese, nitrate','Direct potable / indirect potable reuse','Catchment management & raw-water sampling'] },
        { id:'m3', title:'The conventional treatment train', duration:'40 min',
          summary:'Coagulation → flocculation → sedimentation → filtration → disinfection → stabilisation. The skeleton of 95 % of plants you\'ll meet.',
          sections:['Block diagram and why each step exists','Direct filtration vs conventional vs DAF-conventional','Membrane and hybrid trains — when they fit','Storage, reservoir cycling and contact time'] },
        { id:'m4', title:'The operator\'s daily checks', duration:'30 min',
          summary:'A short, repeatable routine that catches 80 % of plant problems before the public ever sees them.',
          sections:['Pre-shift walk-down checklist','On-line vs grab sampling regime','Logbooks, hand-overs and audit trails','Escalation: when to phone the manager'] },
        { id:'m5', title:'Knowledge check', duration:'15 min',
          summary:'8 interactive multi-choice questions covering the train, SANS 241 classes and operator routine. 70% to pass.',
          sections:['8 interactive MCQ spanning the four prior modules'],
          quiz:[
            { q:'The two categories of health risk that drive drinking-water standards are:',
              options:['Acute (pathogens) and chronic (chemicals)','Bacterial and viral','Physical and biological','Primary and secondary'],
              answer:0, explain:'Acute risk = pathogens that make people ill within hours to days; chronic risk = chemicals that harm over months to years. Aesthetic problems are a third, non-toxic concern.' },
            { q:'How many risk classes does SANS 241:2015 split determinands into?',
              options:['Two','Three','Four','Six'],
              answer:2, explain:'Four: acute health, chronic health, aesthetic and operational — each with limits and a sampling frequency tied to the population served.' },
            { q:'In the conventional train, which step comes immediately BEFORE filtration?',
              options:['Disinfection','Sedimentation / DAF','Coagulation','Screening'],
              answer:1, explain:'Clarification (sedimentation or DAF) removes the bulk of solids so the filter is not overwhelmed; filtration then polishes the remaining turbidity.' },
            { q:'Direct filtration (no sedimentation stage) is best suited to:',
              options:['High-turbidity, variable surface water','Low-turbidity, low-colour raw water','Algae-heavy water','Seawater desalination'],
              answer:1, explain:'Without a settling stage it only suits low-turbidity (<10 NTU), low-colour water. Variable or high-turbidity water needs full conventional treatment.' },
            { q:'Why can a chlorinator not develop a free residual at high turbidity?',
              options:['Particles exert continuous chlorine demand that is never satisfied','Chlorine evaporates','Turbidity lowers the pH','Turbidity neutralises chlorine gas'],
              answer:0, explain:'Suspended particles keep consuming chlorine and shield pathogens, so a stable free residual only forms once turbidity is about 1 NTU or less.' },
            { q:'Manganese in groundwater fails SANS 241 and stains fixtures black above roughly:',
              options:['0.01 mg/L','0.1 mg/L','1.0 mg/L','10 mg/L'],
              answer:1, explain:'Manganese above ~0.1 mg/L stains black; iron above ~0.3 mg/L stains orange. Both are removed by aeration plus filtration.' },
            { q:'What key disinfection parameter does a clear well (contact tank) provide?',
              options:['G-value','Ct — concentration × contact time','Surface overflow rate','Zeta potential'],
              answer:1, explain:'The clear well supplies contact time for Ct. A well-baffled tank reaches a t10/T ratio of 0.7+, so less chlorine is needed for the same kill.' },
            { q:'Which routine catches roughly 80% of plant problems before the public is affected?',
              options:['The annual external audit','The operator pre-shift walk-down','The monthly SANS 241 report','Turbidimeter calibration'],
              answer:1, explain:'A short, repeatable pre-shift walk-down is the single highest-value operator habit for catching problems early.' }
          ] }
      ]
    },

    {
      id: 'c-pot-201', trackId: 'track-potable', code: 'POT-201',
      title: 'Coagulation, Flocculation & Sedimentation',
      level: 'Intermediate', duration: '5 hrs',
      summary: 'The "C-F-S" stage drives everything that follows. Pick the wrong coagulant or the wrong G-value and the rest of the plant pays for it all day.',
      outcomes: [
        'Pick a coagulant for a given raw water (alum, PAC, ferric, organic polymer)',
        'Run a 6-jar jar-test and read it correctly',
        'Calculate dose in kg/day and L/h on the dosing pump',
        'Design rapid-mix and slow-mix energy (G·t) targets'
      ],
      prereqs: ['c-pot-101'],
      linkedTools: ['dosage', 'effluent', 'converters'],
      sources: ['WRC Handbook (Schutte) — Ch B1', 'AWWA Coagulation & Flocculation', 'Hadron Coagulants Calculator'],
      modules: [
        { id:'m1', title:'Colloid chemistry & destabilisation', duration:'40 min',
          summary:'Why colloids float around forever — and the four ways we knock them out.',
          sections:['Zeta potential & the electrical double-layer','Double-layer compression, charge neutralisation, sweep, bridging','Selecting a coagulant based on water type'] },
        { id:'m2', title:'Coagulant chemistry side-by-side', duration:'45 min',
          summary:'Alum, ferric, PAC and organic polymers — chemistry, dose ranges, pH windows and side-effects.',
          sections:['Alum vs ferric vs PAC — when each wins','Polymer aids: cationic, anionic, non-ionic','Acid demand and pH-shift','Sludge production per kg coagulant'] },
        { id:'m3', title:'The jar test, properly run', duration:'50 min',
          summary:'How to set the test up, what speeds and times to use, and how to read the result.',
          sections:['Stock dilutions and dose ladder (e.g. 5–60 mg/L)','Rapid mix 200 rpm × 1 min, slow mix 30 rpm × 15 min','Settle 20 min, read NTU & UV-254','Confirm with full-scale dose-response'] },
        { id:'m4', title:'Mixing energy and basin design', duration:'45 min',
          summary:'G·t targets for the rapid mix and floc basin and how to set impeller speed to hit them.',
          sections:['Rapid mix G ≈ 700–1000 s⁻¹, t ≈ 30–60 s','Flocculation tapered G: 70 → 30 s⁻¹, t ≈ 20–30 min','Calculating G from power input or paddle area'] },
        { id:'m5', title:'Sedimentation & DAF — picking a clarifier', duration:'40 min',
          summary:'Conventional sedimentation, plate / lamella settlers, and DAF — the three contenders for clarification.',
          sections:['Surface overflow rate (SOR) and Hazen\'s law','Plate / tube settlers vs sludge-blanket clarifiers','When DAF beats sedimentation (algae, low-density flocs)'] },
        { id:'m6', title:'Practical: dose a 0.5 ML/d plant', duration:'30 min',
          summary:'Walk through a real worked example using the Coagulants Calculator.',
          sections:['Pull plant flow, target dose, product strength, density','Run Coagulants Calc → kg/day, L/h pump rate, mL/min cal target','Sanity-check against jar-test optimum'] }
      ]
    },

    {
      id: 'c-pot-202', trackId: 'track-potable', code: 'POT-202',
      title: 'Filtration: Sand, Multimedia & Leopold',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'Filters are where polished water becomes drinkable. This course covers media selection, run lengths, backwashing and trouble-shooting.',
      outcomes: [
        'Specify a multimedia bed (anthracite / silica / garnet)',
        'Set rational filter runs and a backwash sequence',
        'Diagnose mud-balling, breakthrough, air-binding',
        'Read a filter profile (head loss vs run time)'
      ],
      prereqs: ['c-pot-201'],
      linkedTools: ['dosage', 'lims'],
      sources: ['WRC Handbook (Schutte) — Ch B3', 'Leopold Type-S Underdrain Manual', 'Kawamura — Integrated Design'],
      modules: [
        { id:'m1', title:'Filter types & media', duration:'40 min',
          summary:'Rapid sand, dual-media, multimedia, slow sand, GAC sandwich.',
          sections:['Effective size, uniformity coefficient, depth','Anthracite-silica-garnet (1.0 / 0.5 / 0.25 mm)','Slow sand still works — when to use it'] },
        { id:'m2', title:'Underdrains & wash systems', duration:'45 min',
          summary:'The Leopold / Tetra / nozzle underdrain decides whether your backwash is even.',
          sections:['Leopold Type-S blocks, gravel layers, plenum','Air-scour + water sequence','Wash-trough geometry and rise rate'] },
        { id:'m3', title:'Run length, head loss & breakthrough', duration:'40 min',
          summary:'When to take a filter off-line: time-based, head-loss based, or turbidity-breakthrough.',
          sections:['Filter profile interpretation','Terminal head loss (≈ 2.4 m typical)','0.3 NTU breakthrough rule (some plants 0.1)'] },
        { id:'m4', title:'Common faults & fixes', duration:'35 min',
          summary:'Mud-balls, air binding, channelling, schmutzdecke for slow sand.',
          sections:['Mud-ball formation and remedy','Negative head + air binding','Cracking, side-wall short-circuiting'] },
        { id:'m5', title:'Operator drill', duration:'20 min',
          summary:'Walk a filter from start of run through ripening, mid-run, and backwash.',
          sections:['Ripening period (filter-to-waste 5–15 min)','Mid-run inspection points','Backwash duration & verification'] }
      ]
    },

    {
      id: 'c-pot-203', trackId: 'track-potable', code: 'POT-203',
      title: 'Coagulant Blends: Selection, Dosing & Plant Trials',
      level: 'Intermediate', duration: '3 hrs',
      summary: 'Most works do not dose a single coagulant — they dose a formulated blend. This course extends POT-201 into the world of blended and pre-hydrolysed coagulants: why polyaluminium chloride is almost always paired with a polyamine or polyDADMAC, what each component contributes, and how to find the right blend ratio and dose. It then walks the discipline of commissioning a blend on a live plant — the pre-trial meeting, the dose curve, the trial log and the daily review — and the faults to watch for, from polyelectrolyte overdosing to floc carry-over. It includes a worked coagulant-and-sludge saving example.',
      outcomes: [
        'Explain why pre-hydrolysed aluminium coagulants are usually blended with a cationic polyelectrolyte',
        'Identify the common blend components — PACl/ACH, polyamine, polyDADMAC and natural coagulants — and the property each contributes',
        'Determine an optimum blend ratio and dose by jar test, and quantify the sludge and lime savings',
        'Run a coagulant blend trial on a plant, from pre-trial planning through the dose curve to daily review',
        'Diagnose blend-related faults such as polyelectrolyte overdosing and small-floc carry-over'
      ],
      prereqs: ['c-pot-201'],
      linkedTools: ['dosage','effluent','converters'],
      sources: [
        'Chemistry of Wastewater Treatment (WRC, 2009) — Coagulants and Flocculants (polyaluminium chlorides, polyamines, polyDADMAC, sodium aluminate)',
        'Saritha, Karnena & Dwarapureddi (2020), Competence of Blended Coagulants for Surface Water Treatment, Applied Water Science 10:20',
        'Operation of Water Treatment Works (WRC) — Coagulation, dosing and corrective actions'
      ],
      modules: [
        { id:'m1', title:'Why blend coagulants exist', duration:'30 min',
          summary:'The single-coagulant trade-off, the best-of-both-worlds idea, and what a blend buys you.',
          sections:['The single-coagulant trade-off','Best of both worlds','What a blend buys you'] },
        { id:'m2', title:'The building blocks of a blend', duration:'35 min',
          summary:'Pre-hydrolysed aluminium (PACl/ACH), cationic polyelectrolytes, and other components including natural coagulants.',
          sections:['Pre-hydrolysed aluminium: PACl and ACH','Cationic polyelectrolytes: polyamine and polyDADMAC','Other components and natural coagulants'] },
        { id:'m3', title:'Blend ratios, dose and sludge', duration:'40 min',
          summary:'Finding the optimum ratio, the dose and sludge advantage, and a worked alum-replacement example.',
          sections:['Finding the optimum ratio','Dose and the sludge advantage','Worked example: part-replacing alum with a blend'] },
        { id:'m4', title:'Commissioning a blend: the trial', duration:'35 min',
          summary:'Pre-trial planning, running the dose curve with a floc comparator, and logging and daily review.',
          sections:['Before the trial','Running the dose curve','Logging and review'] },
        { id:'m5', title:'Choosing and controlling a blend in service', duration:'30 min',
          summary:'Matching a blend to the water, watching for faults, and handling, storage and dose limits.',
          sections:['Matching a blend to the water and the works','Watching for trouble','Handling, storage and limits'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'10 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['10 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'A polyaluminium chloride (PAC) used on its own often gives:',
              options:['Large, fast-settling flocs','No flocs at all','Small flocs that settle slowly and can carry over','Excessive sludge'],
              answer:2,
              explain:'PACs — especially sulphate-free grades — tend to form small flocs that settle slowly and carry over, which is why they are usually blended with a polyelectrolyte that builds floc size and settling rate.' },
            { q:'In a PAC-plus-polyelectrolyte blend, what does each component mainly contribute?',
              options:['The PAC gives clarity and ‘sparkle’; the polyelectrolyte gives floc size and settling rate','The PAC builds large flocs; the polymer adds sludge','Both only neutralise charge','The polymer lowers the pH'],
              answer:0,
              explain:'The best-of-both-worlds blend pairs the PAC’s high clarity with the polyelectrolyte’s floc-building and settling, covering the PAC’s small-floc weakness.' },
            { q:'Compared with aluminium sulphate (alum), polyaluminium chlorides such as ACH tend to:',
              options:['Produce more sludge and need more lime','Produce significantly less sludge and have little effect on pH','Be far more acidic','Have no coagulating power'],
              answer:1,
              explain:'ACH has a high cation-to-anion ratio, so it produces significantly less sludge than alum or iron salts, and being much less acidic it barely shifts pH — cutting the lime needed for correction.' },
            { q:'How does polyDADMAC typically differ from a polyamine?',
              options:['It is more acidic and smells strongly of amine','It contains no charge','It is sold at around 50% solids like polyamine','It has a higher molecular weight, is more viscous, has no amine smell and is non-hazardous'],
              answer:3,
              explain:'PolyDADMAC is a higher-molecular-weight cationic polymer, more viscous (sold around 25% solids versus a polyamine’s ~50%), without the amine odour, and non-hazardous — differences an experienced operator can even tell by smell.' },
            { q:'A noted advantage of natural coagulants such as chitin, sago or Moringa in a blend is that they:',
              options:['Sharply raise the pH','Do not alter the pH, so little or no lime is needed','Add large amounts of sludge','Only work in hot water'],
              answer:1,
              explain:'Plant-based coagulants generally do not shift the water’s pH, so they avoid the lime or bicarbonate dosing that metal salts often require, adding a cost saving when used to part-replace alum.' },
            { q:'Blend studies typically find that the optimum dose of a blended coagulant is about:',
              options:['Twice the single-coagulant dose','The same as the single-coagulant dose','Half the single-coagulant dose, with less sludge','Ten times the single-coagulant dose'],
              answer:2,
              explain:'Blended coagulants commonly reach the same or better turbidity removal at roughly half the dose of a single coagulant, which also reduces the sludge produced.' },
            { q:'A works dosing alum at 40 mg/L treats 10 ML/d. Its alum consumption is:',
              options:['40 kg/day','400 kg/day','4,000 kg/day','4 kg/day'],
              answer:1,
              explain:'40 mg/L × 10 ML/d = 400 kg/day (since 1 mg/L × 1 ML = 1 kg). If a blend trial halves the dose to ~20 mg/L, consumption falls to ~200 kg/day — with a matching drop in sludge and lime — once the jar test and plant confirm the clarified and filtered turbidity still meet target.' },
            { q:'Good practice when running a coagulant blend trial on a plant is to:',
              options:['Start at the lowest dose and work up at night','Change several variables at once to save time','Avoid recording the raw-water turbidity','Start at the higher end of the dose curve and optimise downward, making changes on the day shift and logging data regularly'],
              answer:3,
              explain:'Trials begin at the high end of the dose curve and optimise down, with changes made on the daylight shift and raw, clarified and filtered readings logged hourly so the effect of each change is clear and reversible.' },
            { q:'During a blend trial, a floc comparator chart is used to:',
              options:['Judge floc size against a standard reference set','Measure the pH of the water','Count bacteria','Set the pump speed'],
              answer:0,
              explain:'A floc comparator lets the operator grade the floc size produced (for example from well under a millimetre up to several millimetres) against a reference, a practical check that the blend and dose are building settleable floc.' },
            { q:'Foam collecting at the flocculation chamber usually signals:',
              options:['Too little coagulant','The water is too cold','Overdosing of the polyelectrolyte','Perfect dosing'],
              answer:2,
              explain:'Foam at the flocculator is a sign of polyelectrolyte overdosing; it can be confirmed by adding a little bentonite to filtered water and running a jar test — floc formation indicates excess polyelectrolyte carrying over.' }
          ] }
      ]
    },

    {
      id: 'c-pot-204', trackId: 'track-potable', code: 'POT-204',
      title: 'SANS 241 Determinands, Limits & Risk Categories',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'SANS 241:2015 is the standard the whole works exists to meet — yet it is easy to know the name and not the numbers. This course is the operator’s guide to SANS 241-1: what it specifies, the legal duty behind it, and the four risk categories that decide how urgently you act. It walks every determinand group — microbiological, physical and aesthetic, chemical macro and micro, and organic — with the actual limits and what each one tells you, then teaches the sum-of-ratios rule for combined nitrate-plus-nitrite and trihalomethanes. It includes a worked compliance check that shows how water can pass every individual limit and still fail.',
      outcomes: [
        'State what SANS 241-1:2015 specifies and the legal basis that makes compliance mandatory',
        'Classify a determinand by its risk category — acute health, chronic health, aesthetic or operational — and explain what that implies',
        'Recall the numerical limits for the key microbiological, physical, chemical and organic determinands',
        'Apply the sum-of-ratios rule to assess combined nitrate-plus-nitrite and combined trihalomethane compliance',
        'Interpret a set of water-quality results against SANS 241, including dual-limit and special-case determinands'
      ],
      prereqs: ['c-pot-101'],
      linkedTools: ['lims','converters'],
      sources: [
        'SANS 241-1:2015, Drinking water — Part 1: Microbiological, physical, aesthetic and chemical determinands (SABS)',
        'Operation of Water Treatment Works (WRC) — Guidelines for the application of SANS 241',
        'Introduction to Water Treatment (Rand Water) — South African water legislation and SANS 241'
      ],
      modules: [
        { id:'m1', title:'What SANS 241 is and why it binds', duration:'35 min',
          summary:'The standard’s legal force, the four risk categories, and how to read its numerical limits.',
          sections:['The standard and its legal force','The four risk categories','How the limits are structured'] },
        { id:'m2', title:'Microbiological determinands', duration:'35 min',
          summary:'Faecal indicators, protozoan parasites, and the operational process indicators.',
          sections:['The faecal-indicator determinands','Protozoan parasites','Process and operational indicators'] },
        { id:'m3', title:'Physical, aesthetic & macro-chemical determinands', duration:'40 min',
          summary:'The physical/aesthetic group, the disinfection and nitrogen macro-determinands, and the other macros.',
          sections:['Physical and aesthetic determinands','Disinfection and nitrogen macro-determinands','Other macro determinands'] },
        { id:'m4', title:'Metals and organic determinands', duration:'40 min',
          summary:'The chronic-health metals (and cyanide), the dual-limit metals, and the organic determinands.',
          sections:['The chronic-health metals','Dual-limit metals: iron, manganese, aluminium','Organic determinands'] },
        { id:'m5', title:'Reading the standard like an operator', duration:'35 min',
          summary:'The sum-of-ratios rule, a worked compliance check, and the special cases beyond the tables.',
          sections:['The sum-of-ratios rule','Worked example: a compliance check','When a determinand isn’t listed, and other special cases'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'11 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['11 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'Water that complies with SANS 241-1:2015 is considered safe for:',
              options:['Lifetime consumption — about 2 litres a day for 70 years by a 60 kg person','A single glass only','One year of use','Industrial use only'],
              answer:0,
              explain:'SANS 241 limits are set so that water meeting them presents an acceptable health risk over a lifetime — modelled as 2 L/day for 70 years for a 60 kg adult.' },
            { q:'Which SANS 241 risk category denotes a determinand that poses an immediate unacceptable health risk if its limit is exceeded?',
              options:['Aesthetic','Operational','Acute health','Chronic health'],
              answer:2,
              explain:'Acute-health determinands (such as E. coli, nitrate and cyanide) pose an immediate risk; chronic-health determinands act over long exposure, aesthetic ones affect only taste/odour/colour, and operational ones flag treatment or infrastructure issues.' },
            { q:'What is the SANS 241 limit for E. coli in drinking water?',
              options:['≤ 10 per 100 mL','Not detected per 100 mL','≤ 1 per litre','≤ 100 per 100 mL'],
              answer:1,
              explain:'E. coli (or faecal coliforms) must be Not detected per 100 mL — it is the preferred indicator of faecal pollution and an acute-health determinand.' },
            { q:'Heterotrophic plate count and total coliforms are classified as operational determinands because they:',
              options:['Pose an immediate health risk','Only affect taste','Are never measured','Indicate treatment efficiency and after-growth in the network'],
              answer:3,
              explain:'As process indicators, HPC (≤ 1000/mL) and total coliforms (≤ 10/100 mL) tell you about treatment efficiency, disinfectant adequacy and after-growth in distribution, rather than signalling direct disease risk.' },
            { q:'The SANS 241 turbidity limits are:',
              options:['Operational ≤ 1 NTU and aesthetic ≤ 5 NTU','A single limit of 10 NTU','Operational ≤ 5 NTU only','No limit applies'],
              answer:0,
              explain:'Turbidity carries an operational limit of ≤ 1 NTU and an aesthetic limit of ≤ 5 NTU; values above the operational figure may also impair disinfection, which is why it is watched closely.' },
            { q:'Nitrate (as N) is an acute-health determinand with a SANS 241 limit of:',
              options:['≤ 50 mg/L','≤ 11 mg/L','≤ 0,9 mg/L','≤ 1,5 mg/L'],
              answer:1,
              explain:'Nitrate as N is limited to ≤ 11 mg/L (equivalent to 50 mg/L as NO₃), an acute-health limit set to protect bottle-fed infants; it applies at the point of consumption.' },
            { q:'Both arsenic and lead are chronic-health determinands. Their SANS 241 limit is:',
              options:['10 mg/L','10 µg/L','100 µg/L','1 µg/L'],
              answer:1,
              explain:'Arsenic and lead are both limited to ≤ 10 µg/L (note the units — micrograms, not milligrams); these limits protect susceptible subpopulations over a lifetime.' },
            { q:'Iron and manganese each carry two SANS 241 limits. In practice this means:',
              options:['Only the health limit ever matters','They have no aesthetic effect','The lower aesthetic limit is usually reached first, before the health limit','The two limits are identical'],
              answer:2,
              explain:'Iron (chronic-health ≤ 2000 µg/L, aesthetic ≤ 300 µg/L) and manganese (≤ 400 and ≤ 100 µg/L) discolour and taint water well below their health limits, so the aesthetic limit is usually the binding one.' },
            { q:'A sample has nitrate-N at 8 mg/L (limit 11) and nitrite-N at 0,5 mg/L (limit 0,9). For combined nitrate-plus-nitrite, the result is:',
              options:['Compliant — each is below its own limit','Non-compliant — the sum of the ratios exceeds 1','Not assessable','Compliant only in winter'],
              answer:1,
              explain:'The sum-of-ratios rule applies: 8/11 + 0,5/0,9 = 0,73 + 0,56 = 1,29, which exceeds 1 — so the water fails the combined limit even though each determinand individually passes.' },
            { q:'If an aesthetic determinand such as colour or chloride exceeds its limit, it means the water:',
              options:['Is an immediate poisoning risk','Cannot be supplied under any circumstances','May be unappealing in taste, odour or colour but is not a direct health risk at that level','Has failed microbiologically'],
              answer:2,
              explain:'Aesthetic determinands taint taste, odour or colour without posing a health risk at the exceedance; they still matter for consumer acceptability, and a complaints register must be kept.' },
            { q:'When sampling for a metal determinand under SANS 241, the sample should be:',
              options:['Filtered and left unpreserved','Frozen immediately','Boiled before testing','Acidified to pH < 2 and not filtered, to capture acid-soluble metals'],
              answer:3,
              explain:'For metals the sample is acidified to below pH 2 and not filtered, so the acid-soluble metal content is measured; results below the limit of quantification are reported with a ‘<’ sign.' }
          ] }
      ]
    },

    {
      id: 'c-pot-301', trackId: 'track-potable', code: 'POT-301',
      title: 'Water Safety Plans & Climate Resilience',
      level: 'Advanced', duration: '5 hrs',
      summary: 'Knowing the SANS 241 limits (POT-204) and how to monitor them (POT-302) leaves one question: how do you consistently keep water within them? The answer is a Water Safety Plan — the catchment-to-tap risk-management system that SANS 241-2 and Blue Drop require. This Advanced course teaches the WSP end to end: the paradigm shift from end-product testing to prevention, assembling the team and assessing the system, identifying hazards and scoring risk, defining control measures and an improvement plan, and running operational monitoring, verification and corrective action. It then layers in climate resilience — how floods, droughts and rising temperatures intensify the hazards, and how to adapt — and closes with a worked risk-prioritisation example.',
      outcomes: [
        'Explain the Water Safety Plan paradigm and why catchment-to-tap risk management replaces end-product testing',
        'Carry out a WSP system assessment: assemble the team, describe the system, and identify hazards and hazardous events',
        'Assess and prioritise risks, define control measures and critical control points, and build an improvement plan',
        'Set up operational monitoring, verification and corrective action that feed the WSP',
        'Integrate climate resilience into each step of the WSP, with appropriate adaptation and contingency measures',
        'Run and review a WSP as a living document aligned with SANS 241'
      ],
      prereqs: ['c-pot-204','c-pot-302'],
      linkedTools: ['lims','servicereport'],
      sources: [
        'Training Manual on Climate Resilient Water Safety Plans (CR-WSP): Facilitator’s Handbook (DWSS/WHO)',
        'SANS 241-2:2015, Drinking water — Part 2: Application of SANS 241-1, §8 (Water Safety Plans) (SABS)',
        'Introduction to Water Treatment (Rand Water) — Water Safety Plans, Blue Drop and the WHO risk-management paradigm',
        'Drinking Water Quality Management (WRC) — source risk and climate response'
      ],
      modules: [
        { id:'m1', title:'Why a Water Safety Plan', duration:'40 min',
          summary:'The paradigm shift to catchment-to-tap risk management, what a WSP is, and its place under SANS 241 and Blue Drop.',
          sections:['The paradigm shift','What a WSP is','The WSP, SANS 241 and Blue Drop'] },
        { id:'m2', title:'System assessment: team, description, hazards', duration:'45 min',
          summary:'Assembling the team and describing the system, identifying hazards and hazardous events, and assessing risk.',
          sections:['Assemble the team and describe the system','Identify hazards and hazardous events','Assess the risks'] },
        { id:'m3', title:'Control measures, monitoring & verification', duration:'50 min',
          summary:'Control measures and critical control points, the improvement plan, and operational monitoring, verification and corrective action.',
          sections:['Control measures and critical control points','The improvement plan','Operational monitoring, verification and corrective action'] },
        { id:'m4', title:'Climate resilience in the WSP', duration:'50 min',
          summary:'How climate change intensifies the hazards, building climate into each WSP step, and adaptation and contingency.',
          sections:['How climate change threatens water safety','Building climate into each WSP step','Adaptation and contingency'] },
        { id:'m5', title:'Running and reviewing the WSP', duration:'40 min',
          summary:'Management procedures and supporting programmes, the review cycle, and a worked risk-prioritisation example.',
          sections:['Management procedures and supporting programmes','The WSP cycle and review','Worked example: prioritising a hazard'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'12 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['12 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'What is the central idea of a Water Safety Plan?',
              options:['Testing only the final water to confirm it is safe','Chlorinating more heavily than required','Managing risk across the whole supply chain from catchment to tap','Sampling once a year'],
              answer:2,
              explain:'A WSP shifts from relying on end-product testing to proactively managing risk at every step from catchment to consumer — the most effective way to consistently ensure a safe supply.' },
            { q:'A Water Safety Plan is built on the principles of:',
              options:['Hazard analysis and critical control points (HACCP) and multiple barriers','Single-barrier disinfection only','Annual chemical analysis','Consumer billing'],
              answer:0,
              explain:'The WSP applies HACCP — systematically finding hazards and the critical points that control them — together with the multiple-barrier principle, so no single failure reaches the consumer.' },
            { q:'The WSP paradigm shift changes monitoring from ‘verify the water is safe’ to:',
              options:['Stop monitoring once compliant','Monitor only after complaints','Monitor to detect contamination, since the potential for it is always present','Monitor the budget'],
              answer:2,
              explain:'WSP thinking assumes contamination is always possible, so monitoring is designed to detect current and future risks early — not merely to confirm, after the fact, that the water was safe.' },
            { q:'In WSP terms, a ‘hazardous event’ is:',
              options:['Any chemical in the water','A scheduled maintenance task','A consumer complaint','A process that introduces a hazard, or fails to remove one, from the supply'],
              answer:3,
              explain:'A hazard is the agent that can cause harm; a hazardous event is the process or circumstance that introduces that hazard into the water, or fails to remove it — for example heavy rain washing contamination into an intake.' },
            { q:'How is risk scored in a WSP risk assessment?',
              options:['Consequence only','Likelihood only','Likelihood multiplied by consequence','The number of samples taken'],
              answer:2,
              explain:'Risk is assessed as likelihood × consequence, giving each hazardous event a risk score so that the most significant risks can be prioritised for control.' },
            { q:'A ‘control measure’ in a WSP is:',
              options:['Any action that prevents, eliminates or reduces a hazard to an acceptable level','A penalty for non-compliance','A type of laboratory test','A billing adjustment'],
              answer:0,
              explain:'A control measure is any step — catchment protection, coagulation, disinfection, a covered reservoir — that prevents, eliminates or reduces a water-safety hazard; the critical ones become critical control points with defined limits.' },
            { q:'With limited capital, a WSP improvement plan should address:',
              options:['The cheapest fixes first regardless of risk','The risks identified as critical first','Only aesthetic issues','Whichever item is easiest'],
              answer:1,
              explain:'Because resources are limited, the improvement/upgrade plan tackles the highest-risk, critical items first, with short-, medium- and long-term actions matched to the significance of each risk.' },
            { q:'What is the difference between operational monitoring and verification in a WSP?',
              options:['They are the same thing','Verification happens first','Operational monitoring is done yearly only','Operational monitoring checks that control measures are working; verification confirms the whole WSP is effective'],
              answer:3,
              explain:'Operational monitoring checks, in real time, that each control measure is working within its limits; verification — through compliance monitoring, audits and consumer satisfaction — confirms the WSP as a whole is delivering safe water.' },
            { q:'How does more intense rainfall from climate change typically threaten water safety?',
              options:['It always improves water quality','It raises turbidity and contaminant loading and can overwhelm treatment barriers','It has no effect on treatment','It only affects billing'],
              answer:1,
              explain:'Heavier rainfall increases surface-water turbidity and seasonal contaminant loading, and flooding can overwhelm sanitary barriers and damage infrastructure — raising the risk of water-borne disease.' },
            { q:'A recommended climate-adaptation response under flood conditions is to:',
              options:['Reduce chlorine dosing','Stop treatment','Increase chlorine dosing to maintain disinfection, focusing on bacteriological risk','Ignore turbidity'],
              answer:2,
              explain:'Under flood conditions, disinfection becomes harder as turbidity and microbial load rise, so chlorine dosing is increased to maintain an effective residual, with monitoring focused on bacteriological pollution.' },
            { q:'A hazardous event is rated likelihood 4 and consequence 4 on a 1–5 scale. Its risk score is:',
              options:['8','16','4','20'],
              answer:1,
              explain:'Risk score = likelihood × consequence = 4 × 4 = 16 (out of a maximum 25) — a high score that flags the event for priority control, such as boosting disinfection and adding a turbidity trigger under flood conditions.' },
            { q:'A Water Safety Plan should be treated as:',
              options:['A living document, reviewed at least annually and after any incident or system change','A one-off document filed away','A purely legal formality','A monthly lab report'],
              answer:0,
              explain:'A WSP is reviewed and updated continuously — at least annually, and whenever an incident occurs or the system changes — mirroring the SANS 241-2 risk-assessment triggers; it is a standing management system, not a one-off.' }
          ] }
      ]
    },

    /* ──────────────────  DISINFECTION  ────────────────── */

    {
      id: 'c-dis-101', trackId: 'track-disinfection', code: 'DIS-101',
      title: 'Disinfection Fundamentals',
      level: 'Foundation', duration: '3 hrs',
      summary: 'Pathogen biology, log-reduction targets, the Ct concept and the four primary disinfectants compared.',
      outcomes: [
        'Define log-reduction and Ct',
        'Compare Cl₂, ClO₂, UV, O₃ on the four key axes',
        'Read a Ct table for Giardia / virus inactivation',
        'Pick a primary disinfectant for a given source'
      ],
      prereqs: ['c-pot-101'],
      linkedTools: ['dosage', 'pool'],
      sources: ['Basic Chemistry of Chlorination (USEPA)', 'WRC Handbook — Ch B4', 'WHO Guidelines 4th ed.'],
      modules: [
        { id:'m1', title:'Pathogens & log-reduction', duration:'30 min',
          summary:'Bacteria vs viruses vs protozoa vs spores — what each is, and what disinfectant levels they tolerate.',
          sections:['E.coli, faecal coliforms, somatic coliphages','Viruses: rotavirus, hepatitis A, norovirus','Protozoa: Giardia, Cryptosporidium','Log-reduction targets (3-log virus, etc.)'] },
        { id:'m2', title:'The Ct concept', duration:'40 min',
          summary:'Concentration × time. The single most useful number in disinfection design.',
          sections:['Ct = C × t (mg/L · min)','Ct tables for Giardia at various pH/T','Hydraulic retention time vs t10 vs theoretical t','Baffling factors'] },
        { id:'m3', title:'The big four compared', duration:'45 min',
          summary:'Cl₂ / ClO₂ / UV / O₃ — strengths, weaknesses and where each one lives in a real plant.',
          sections:['Free chlorine — cheap, residual, DBPs','ClO₂ — better for pH > 8, no THMs, but DBPs (chlorite/chlorate)','UV — fast, no residual, low DBP','Ozone — strongest oxidant, no residual, high cost'] },
        { id:'m4', title:'Picking the primary', duration:'30 min',
          summary:'A short decision tree for green-fields and retrofits.',
          sections:['Source quality & residual requirement','Capital vs operating cost','Operator competency required','Regulatory acceptance'] },
        { id:'m5', title:'Knowledge check', duration:'15 min',
          summary:'10 MCQ on Ct, log-reduction and disinfectant trade-offs.',
          sections:['10 MCQ assessment'] }
      ]
    },

    {
      id: 'c-dis-201', trackId: 'track-disinfection', code: 'DIS-201',
      title: 'Chlorine Chemistry & Practice',
      level: 'Intermediate', duration: '5 hrs',
      summary: 'Free vs combined chlorine, breakpoint, gas vs hypo vs TCCA, dosing skids, and the safety case for each form.',
      outcomes: [
        'Calculate breakpoint dose from raw NH₃-N',
        'Run a free / total / combined Cl test correctly',
        'Choose between gas, hypo and TCCA on cost + safety',
        'Apply the OHS chlorine handling procedures'
      ],
      prereqs: ['c-dis-101'],
      linkedTools: ['dosage', 'pool', 'converters'],
      sources: ['Basic Chemistry of Chlorination (USEPA)', 'WHO Chlorine Safety Handling Pack', 'Hadron Chlorine Calculator'],
      modules: [
        { id:'m1', title:'Aqueous chlorine chemistry', duration:'45 min',
          summary:'HOCl ↔ OCl⁻, the pH-driven dissociation curve, and why pH 7.2 is the disinfection sweet spot.',
          sections:['Cl₂ + H₂O → HOCl + HCl','HOCl/OCl⁻ pKa ≈ 7.5','HOCl is 80–100× more germicidal than OCl⁻','Implication for dose at high pH'] },
        { id:'m2', title:'Free, combined & breakpoint', duration:'40 min',
          summary:'How chloramines form, why the curve looks the way it does, and where breakpoint sits.',
          sections:['Mono- → di- → trichloramine','The breakpoint dip and the breakpoint dose','Cl₂ : NH₃-N ≈ 7.6 : 1 stoichiometric','Practical 8–10 : 1 with chlorine demand'] },
        { id:'m3', title:'Forms of chlorine', duration:'45 min',
          summary:'Cl₂ gas, NaOCl liquid (10–15 %), Ca(OCl)₂ HTH, TCCA / DCCA tabs.',
          sections:['Cl₂ gas — cheapest, most regulated','NaOCl — easy, decomposes (5 % loss/month)','Ca(OCl)₂ 65–70 % — granular, dust','TCCA 90 % — slow-dissolve, stabilised'] },
        { id:'m4', title:'Dosing skids & on-line control', duration:'45 min',
          summary:'Pump types, sample line design, residual analysers, contact tank baffling.',
          sections:['Diaphragm vs peristaltic dosing pumps','DPD analysers (Hach CL17, etc.) — care & calibration','Compound-loop control (residual + flow)','Contact tank baffling factor 0.3–0.7'] },
        { id:'m5', title:'Chlorine safety in practice', duration:'45 min',
          summary:'PPE, leak detection, emergency response, decommissioning a leaking cylinder.',
          sections:['SCBA, butyl gloves, splash goggles','Cl₂ leak: ammonia rag → fan to safe area','Chlorinator maintenance under positive lockout','Spill response per the Chlorine Safety Pack'] },
        { id:'m6', title:'Worked example: 2 ML/d plant', duration:'25 min',
          summary:'Use the Chlorine (TCCA) calc to design dose, monthly consumption and pump rate.',
          sections:['Pull plant size, target free Cl, demand','Run TCCA calc → kg/day, kg/month','Sanity-check residual at far end of system'] }
      ]
    },

    {
      id: 'c-dis-202', trackId: 'track-disinfection', code: 'DIS-202',
      title: 'Chlorine Dioxide & Alternative Disinfectants',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'When chlorine isn\'t enough — ClO₂, ozone, UV and chloramination. Includes generator chemistry and skid sizing.',
      outcomes: [
        'Compare ClO₂ generation routes (NaClO₂ + Cl₂ vs HCl vs H₂SO₄)',
        'Size a ClO₂ skid to a plant flow',
        'Specify a UV reactor on UVT and dose target',
        'Pick chloramination over free Cl in a long network'
      ],
      prereqs: ['c-dis-201'],
      linkedTools: ['dosage', 'converters'],
      sources: ['WRC Handbook — Ch B4', 'Hadron ClO₂ Skid Calculator', 'IUVA — UV Disinfection Guidelines'],
      modules: [
        { id:'m1', title:'ClO₂ chemistry & generation', duration:'45 min',
          summary:'ClO₂ is a true oxidant rather than a chlorinating agent. Generator chemistry decides skid layout.',
          sections:['ClO₂ vs Cl₂ — selectivity','5 NaClO₂ + 4 HCl → 4 ClO₂ + 5 NaCl + 2 H₂O','By-products: chlorite (ClO₂⁻) ≤ 1 mg/L SANS','Chlorate management at high pH'] },
        { id:'m2', title:'Skid design & sizing', duration:'50 min',
          summary:'Pump, tank, dilution-water flow and refill interval — using the Hadron Skid calc.',
          sections:['Stock strength (typical 2500 ppm)','Pump turn-down & calibration','Tank size from refill interval × consumption','Recommended skid for plant flow band'] },
        { id:'m3', title:'UV disinfection', duration:'40 min',
          summary:'Low-pressure vs medium-pressure lamps, UVT, fouling, and validated dose.',
          sections:['Wavelength 254 nm — DNA dimerisation','UVT (transmittance) and dose mJ/cm²','Validated dose 40 mJ/cm² typical','Quartz sleeve fouling & wiper systems'] },
        { id:'m4', title:'Chloramination & long networks', duration:'40 min',
          summary:'Why huge cities (Sydney, Pretoria) chloraminate — and the nitrification risk that comes with it.',
          sections:['Mono- vs di-chloramine','Cl : NH₃-N 4–5 : 1 monochloramine target','Nitrification in dead-ends','Switching free / chloramine seasonally'] }
      ]
    },

    {
      id: 'c-dis-203', trackId: 'track-disinfection', code: 'DIS-203',
      title: 'Gas Chlorine: Handling, Storage & Emergency Response',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'Chlorine gas disinfects most of South Africa’s drinking water — and it is the most dangerous chemical on the average works. This course turns the supplier code of practice into operator competence: how to store, connect, draw and inspect cylinders and one-tonne drums safely, how to read the faults the gas system throws at you, and exactly what to do in the first minutes of a leak. Every step is grounded in the Chlorine Handling Information Pack and the WRC handling guidance, with a worked supply-sizing example you can repeat on your own plant.',
      outcomes: [
        'Identify chlorine’s key physical, chemical and health hazards and explain why each one drives a specific handling precaution',
        'Apply correct storage, segregation and container-orientation rules for cylinders and one-tonne drums',
        'Connect and disconnect a chlorine container safely, leak-testing every joint with ammonia vapour',
        'Calculate a plant’s chlorine withdrawal rate and decide how many containers must be in service to stay within safe limits',
        'Diagnose common gas-supply faults — leaks, suck-back, liquefaction and ferric-chloride fouling — and state the control for each',
        'Execute the correct incident-response and first-aid steps for a chlorine leak'
      ],
      prereqs: ['c-dis-101'],
      linkedTools: ['dosage','converters','servicereport'],
      sources: [
        'Chlorine Handling Information Pack, Chlorine Tech Services (Pty) Ltd',
        'Operation of Water Treatment Works (WRC), Chapter B4: Disinfection — Handling of chlorine compounds',
        'Hadron Group Chlorine Training Manual — Safety, Storage and Handling Guidelines'
      ],
      modules: [
        { id:'m1', title:'Know your hazard', duration:'25 min',
          summary:'Chlorine’s properties, health effects and the legal frame — why this chemical demands respect.',
          sections:['Chlorine’s physical and chemical properties','Health effects and routes of exposure','The legal and code-of-practice framework'] },
        { id:'m2', title:'Storing chlorine safely', duration:'30 min',
          summary:'Storage rules, container orientation and temperature, and the site safety systems that make a fast response possible.',
          sections:['Storage rules and incompatible materials','Container orientation, temperature and the supply room','Signage, gas detection and emergency-equipment access'] },
        { id:'m3', title:'Connecting & disconnecting containers', duration:'30 min',
          summary:'The disciplined routine for changing a container — tools, the connect/disconnect sequence, and the valve.',
          sections:['Tools, PPE and pre-connection checks','The connect and disconnect sequence','Valve anatomy and freeing a stuck valve'] },
        { id:'m4', title:'Leak detection, withdrawal rate & process faults', duration:'35 min',
          summary:'Finding a leak with ammonia, sizing the supply within withdrawal limits, and the classic gas-system faults.',
          sections:['Finding a leak with ammonia','Withdrawal rate and sizing the supply (worked example)','Suck-back, liquefaction, frosting and ferric chloride'] },
        { id:'m5', title:'Emergency response & first aid', duration:'40 min',
          summary:'The incident drill, evacuation and responder PPE, first aid by exposure type, and emergency kits, the action plan and fire.',
          sections:['The chlorine-incident drill','Evacuation and responder PPE','First aid by exposure type','Emergency kits, the action plan and fire'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'10 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['10 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'Compared with air, chlorine gas is:',
              options:['Denser than air, so it collects in low-lying and subsurface areas','Lighter than air, so a leak rises and disperses quickly','The same density as air','Lighter or denser depending on humidity'],
              answer:0,
              explain:'Chlorine is heavier than air and pools in low spots and pits — which is exactly why subsurface chlorine storage is prohibited. Assuming a leak will rise and clear is dangerous.' },
            { q:'Why is keeping moisture out of a chlorine system so important?',
              options:['Dry chlorine is the corrosive form and moisture neutralises it','Moisture makes chlorine flammable','Moisture has no real effect on chlorine equipment','Dry chlorine is only mildly corrosive, but with water it forms hydrochloric acid that attacks metal'],
              answer:3,
              explain:'Dry chlorine gas is reactive but not very corrosive; once it meets water or humidity it forms hydrochloric acid, which corrodes steel and brass — hence the emphasis on moisture control at every joint.' },
            { q:'Chlorine containers should be stored at a temperature that does not exceed:',
              options:['25 °C','40 °C','55 °C (130 °F)','100 °C'],
              answer:2,
              explain:'The storage limit is 55 °C. Chlorine expands as it heats, and an over-pressured container can rupture, so stores are kept cool and out of direct sunlight.' },
            { q:'How are chlorine containers correctly oriented in storage and use?',
              options:['Both cylinders and tanks upright','Cylinders upright, one-tonne portable tanks on their sides','Cylinders on their sides, one-tonne tanks upright','Orientation does not matter'],
              answer:1,
              explain:'Cylinders stand upright and one-tonne tanks lie on their sides so the valve draws gas rather than liquid — orientation directly controls what comes out of the valve.' },
            { q:'The correct way to test for a chlorine leak at a joint is to:',
              options:['Hold ammonia vapour from a squeeze bottle near the joint and watch for a white cloud','Squirt liquid ammonia solution directly onto the fitting','Pass a lit match along the pipe','Wipe the joint with a dry rag'],
              answer:0,
              explain:'Ammonia vapour reacts with chlorine to form a white ammonium-chloride cloud, pinpointing the leak. Liquid ammonia must never be squirted on equipment because it corrodes the fittings.' },
            { q:'A container valve is stuck. You should:',
              options:['Strike the valve body directly with a hammer','Heat the valve with a flame to loosen it','Force it hard in the clockwise direction','Use the valve spanner and strike the side of the spanner with your palm, turning anti-clockwise'],
              answer:3,
              explain:'Never hammer the valve itself. Use the spanner, palm-strike its side and turn anti-clockwise to open; if it still won’t free, stop and call your supervisor rather than risk shearing the valve.' },
            { q:'A works uses 50 kg/day of chlorine. If each 68 kg cylinder is limited to 1.3 kg/h, the minimum number of cylinders that must be manifolded is:',
              options:['1','2','3','4'],
              answer:1,
              explain:'50 kg/day ÷ 24 h ≈ 2.1 kg/h. Each cylinder safely delivers 1.3 kg/h, so two are needed (2 × 1.3 = 2.6 kg/h ≥ 2.1). Drawing it all from one cylinder would exceed the limit and frost the cylinder.' },
            { q:'Suck-back (reverse flow) into a chlorine container is best described and prevented as:',
              options:['Over-pressure from heat; prevented by cooling the cylinder','Frosting of the pipe; prevented by lagging','Liquid drawn back when chlorine flow stops; prevented by non-return valves, vacuum breakers or a barometric loop','Low storage temperature; prevented by sunlight'],
              answer:2,
              explain:'When flow ceases — empty supply, wrong valve shut, or a failed injector seat — liquid can be sucked back, forming corrosive ferric chloride. Non-return valves, flow interlocks, vacuum breakers or a barometric loop prevent it.' },
            { q:'There is a chlorine leak and the wind is blowing. You evacuate people:',
              options:['Sideways at 90° to the wind, then upwind, until the chlorine smell is gone','Downwind, directly away from the container','To the lowest indoor level available','Onto the roof, which is always the safest place'],
              answer:0,
              explain:'Move across the wind (90°) and then upwind to get out of the plume. Going downwind keeps people in the gas, and height alone is not safe because local air currents carry chlorine.' },
            { q:'A casualty has severe chlorine inhalation and has stopped breathing. The correct response is to:',
              options:['Give them water to drink straight away','Rub their chest and limbs vigorously to revive them','Wait beside them for the ambulance without intervening','Don a BA set or full-face mask, remove them from the area, secure the airway and start artificial respiration'],
              answer:3,
              explain:'Protect yourself first so you don’t become a second casualty, then remove the casualty, open the airway and begin artificial respiration until help arrives. Nothing is given by mouth to an unconscious person.' }
          ] }
      ]
    },

    {
      id: 'c-dis-204', trackId: 'track-disinfection', code: 'DIS-204',
      title: 'Solid Chlorine Donors: SDIC & TCCA in Practice',
      level: 'Intermediate', duration: '3 hrs',
      summary: 'Chlorine does not only arrive as a gas or a liquid. Sodium dichloroisocyanurate (SDIC) and trichloroisocyanuric acid (TCCA) are dry, stabilised chlorine donors widely used for pool sanitation, small and package plants, and point-of-use disinfection. This course explains what they are, how they release free chlorine, where they fit against calcium hypochlorite and liquid chlorine, and how to dose them — then drills the storage, segregation and emergency rules that keep these powerful oxidisers safe. It is grounded in the Hadron chlorine manual, with a worked dosing example you can reuse on any tank.',
      outcomes: [
        'Describe the chemistry of SDIC and TCCA and state the available-chlorine content and pH behaviour of each',
        'Explain how cyanuric acid stabilises chlorine and the consequence of letting it accumulate',
        'Select between SDIC, TCCA, calcium hypochlorite and liquid chlorine for a given disinfection duty',
        'Calculate the mass of solid chlorine needed to reach a target free-chlorine residual',
        'Apply correct storage, segregation and dosing-equipment rules for solid chlorine donors',
        'Respond correctly to a solid-chlorine spill, exposure or fire'
      ],
      prereqs: ['c-dis-201'],
      linkedTools: ['dosage','pool','converters'],
      sources: [
        'Hadron Group Chlorine Training Manual — SDIC and TCCA Technical Overview, Comparison, and Safety, Storage & Handling Guidelines',
        'Operation of Water Treatment Works (WRC), Chapter B4: Disinfection — Handling of chlorine compounds'
      ],
      modules: [
        { id:'m1', title:'What SDIC and TCCA are', duration:'30 min',
          summary:'The chemistry of the two isocyanurate chlorines — strength, pH, and what “stabilised” means.',
          sections:['The two isocyanurates: dichlor and trichlor','How they release chlorine','Stabilised chlorine and cyanuric acid'] },
        { id:'m2', title:'Choosing a solid chlorine source', duration:'35 min',
          summary:'SDIC vs TCCA, and how both compare with calcium hypochlorite and liquid chlorine.',
          sections:['SDIC versus TCCA','Compared with calcium hypochlorite and liquid chlorine','Matching the product to the job'] },
        { id:'m3', title:'Dosing solid chlorine correctly', duration:'40 min',
          summary:'Feeders and floaters, a worked dosing calculation, and keeping cyanuric acid in check.',
          sections:['Feeders, floaters and manual dosing','Worked example: dosing to a target residual','Managing cyanuric acid and the residual'] },
        { id:'m4', title:'Storage and the incompatibility hazard', duration:'35 min',
          summary:'How to store solid chlorine, the cardinal mixing rules, and why mixing is so dangerous.',
          sections:['Store it dry, cool and segregated','The cardinal rules: never mix, add chemical to water','Why mixing is so dangerous'] },
        { id:'m5', title:'Spills, exposure and emergency response', duration:'35 min',
          summary:'Cleaning a dry spill, first aid by exposure type, and handling fire and large spills.',
          sections:['Cleaning up a dry spill','First aid by exposure type','Fire and large spills'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'10 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['10 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'Roughly how much available chlorine do TCCA and SDIC contain?',
              options:['TCCA ~90%, SDIC ~56–60%','TCCA ~30%, SDIC ~15%','Both about 100%','TCCA ~56%, SDIC ~90%'],
              answer:0,
              explain:'TCCA (trichlor) is about 90% available chlorine and SDIC (dichlor) about 56–60%, so TCCA is the more concentrated of the two and a little goes a long way.' },
            { q:'When dissolved in water, how do dichlor (SDIC) and trichlor (TCCA) affect pH?',
              options:['Both strongly raise pH','SDIC is nearly neutral; TCCA is acidic (~pH 2.8) and lowers pH slightly','SDIC is acidic; TCCA is neutral','Neither has any effect on pH'],
              answer:1,
              explain:'SDIC is close to pH-neutral in water, while TCCA is acidic (solution pH around 2.5–3) and pulls pH and alkalinity down with continued use.' },
            { q:'What does the cyanuric acid in SDIC and TCCA do?',
              options:['It increases calcium hardness','It acts like a sunscreen, protecting free chlorine from UV breakdown','It makes the chlorine dissolve faster','It neutralises acidity in the water'],
              answer:1,
              explain:'Cyanuric acid (CYA) shields free chlorine from the sun’s UV, so “stabilised” chlorine lasts far longer in an outdoor pool or open tank than unstabilised cal-hypo or liquid bleach.' },
            { q:'What happens if cyanuric acid is allowed to build up too high (around 80–100 ppm)?',
              options:['The chlorine dissolves more slowly','Nothing — more CYA is always better','Chlorine’s ability to kill germs and algae drops (“over-stabilisation”); the fix is partial dilution','The water turns acidic'],
              answer:2,
              explain:'Above roughly 80–100 ppm CYA, chlorine becomes “locked” and loses effectiveness. Because CYA does not evaporate, it is controlled by partially draining and refilling, or by using unstabilised chlorine for a while. Around 30–50 ppm is ideal.' },
            { q:'Compared with SDIC/TCCA, what does calcium hypochlorite add to the water over time?',
              options:['Cyanuric acid','Sodium','Calcium hardness, which can cause scaling','Nothing measurable'],
              answer:2,
              explain:'Cal-hypo is a calcium compound, so it raises calcium hardness and can scale surfaces and equipment; SDIC and TCCA instead add cyanuric acid as their side-product.' },
            { q:'Which product form suits slow, continuous “maintenance” dosing through a feeder or floater?',
              options:['SDIC granules','Liquid sodium hypochlorite','Calcium hypochlorite shock powder','TCCA tablets/pucks'],
              answer:3,
              explain:'Slow-dissolving TCCA tablets are designed for erosion feeders and floaters, giving a steady feed; SDIC granules dissolve fast and suit quick or daily dosing instead.' },
            { q:'You need to lift free chlorine by 2 mg/L in a 50 m³ tank. Using SDIC at 56% available chlorine, roughly how much SDIC is required (ignoring chlorine demand)?',
              options:['About 100 g','About 179 g','About 111 g','About 50 g'],
              answer:1,
              explain:'Chlorine needed = 2 mg/L × 50,000 L = 100 g of available chlorine; at 56% strength, 100 ÷ 0.56 ≈ 179 g of SDIC. TCCA at 90% would need only ≈111 g — the higher strength means less product.' },
            { q:'Why must SDIC/TCCA never be mixed or stored together with calcium hypochlorite?',
              options:['It wastes product','The colours clash','Mixing incompatible chlorine products can cause a fire or explosion','It raises the pH too much'],
              answer:2,
              explain:'These are strong oxidisers; mixing them with cal-hypo or other incompatible chemicals can react violently and start a fire or explosion, so products are added one at a time and stored apart.' },
            { q:'When pre-dissolving granular chlorine in a bucket, the correct method is to:',
              options:['Pour water onto the chlorine','Mix it with cal-hypo first','Use any scoop that is handy','Add the chlorine to a bucket already filled with water, stirring'],
              answer:3,
              explain:'Always add chemical to water, never water to chemical — dumping water onto chlorine can react violently and spatter. Use a clean, dry, product-dedicated scoop, never one shared with another chemical.' },
            { q:'A dry spill of chlorine granules should be:',
              options:['Hosed down with water immediately','Vacuumed up quickly','Swept into a clean, sealable plastic container, without adding water or vacuuming, then ventilated','Left to disperse on its own'],
              answer:2,
              explain:'Clear people and put on PPE, then sweep the spill into a clean sealable plastic container — do not add water (it can react) and do not vacuum (the motor can ignite chlorine dust), and ventilate the area afterwards.' }
          ] }
      ]
    },

    {
      id: 'c-dis-301', trackId: 'track-disinfection', code: 'DIS-301',
      title: 'Disinfection By-products & Compliance',
      level: 'Advanced', duration: '4 hrs',
      summary: 'THMs, HAAs, chlorite, chlorate, NDMA — what they are, how to predict them, how the regulator measures them.',
      outcomes: [
        'List the SANS 241 DBP limits',
        'Predict THM formation from precursor + dose + contact time',
        'Implement enhanced coagulation to cut DBP precursors',
        'Audit a sampling regime against SANS 241-2'
      ],
      prereqs: ['c-dis-201', 'c-pot-301'],
      linkedTools: ['lims', 'dosage'],
      sources: ['SANS 241-2:2015 (sampling & analytical methods)', 'USEPA — Stage 2 D/DBP Rule', 'WRC research reports on NOM removal'],
      modules: [
        { id:'m1', title:'DBP families', duration:'45 min',
          summary:'THMs, HAAs, chlorite, chlorate, NDMA, bromate — chemistry and regulated limits.',
          sections:['THM₄: chloroform, BDCM, DBCM, bromoform','HAA₅, chlorite, chlorate, bromate','SANS 241 limit 100 µg/L (Total THMs)'] },
        { id:'m2', title:'Predicting THM formation', duration:'40 min',
          summary:'NOM (TOC, UV-254) × Cl₂ dose × pH × time × bromide → THM µg/L.',
          sections:['Linear NOM-vs-THM correlations','SUVA as a precursor proxy','Bromide swap to brominated THMs'] },
        { id:'m3', title:'Mitigation strategy', duration:'45 min',
          summary:'Enhanced coagulation, GAC, switching to ClO₂ or chloramine, contact-tank shortening.',
          sections:['Enhanced coagulation: TOC removal targets','GAC + sand sandwich filters','Move chlorine point downstream','Reduce CT in the clear well'] },
        { id:'m4', title:'Compliance sampling', duration:'40 min',
          summary:'Where to sample, how often, and how to defend the result in a hearing.',
          sections:['Quarterly THM at distribution extremes','Locational running annual average (LRAA)','Hold time, headspace, dechlorination at sampling'] }
      ]
    },

    {
      id: 'c-dis-302', trackId: 'track-disinfection', code: 'DIS-302',
      title: 'Chlorite & Chlorate Control in ClO₂ and Hypochlorite Systems',
      level: 'Advanced', duration: '4 hrs',
      summary: 'Chlorine dioxide buys you freedom from trihalomethanes — but it hands you two regulated inorganic by-products instead: chlorite and chlorate. Chlorate also follows aged sodium hypochlorite into supply on plants that have no ClO₂ at all. This Advanced course shows where both anions come from, the WHO provisional guideline values and the health effects behind them, and the operator levers that keep them in check — with the hard truth that chlorate, once formed, has no cheap cure, so prevention is everything. It includes a worked dose-to-chlorite example and a disciplined response to an exceedance that never sacrifices disinfection.',
      outcomes: [
        'Distinguish the by-products of chlorine dioxide from those of free chlorine and explain why ClO₂ produces no THMs but does produce chlorite and chlorate',
        'Trace how chlorite and chlorate form, both at the ClO₂ generator and from ageing sodium hypochlorite',
        'State the WHO provisional guideline values for chlorite and chlorate and the health effects that justify them',
        'Specify the operator levers that prevent and remove chlorite and chlorate, and explain why chlorate must be controlled by prevention',
        'Calculate the chlorite expected from a given ClO₂ dose and check it against the guideline value',
        'Respond to a chlorite or chlorate exceedance without compromising disinfection'
      ],
      prereqs: ['c-dis-202','c-dis-301'],
      linkedTools: ['dosage','lims','converters'],
      sources: [
        'Chlorine Dioxide, Chlorate and Chlorite in Drinking-water (WHO background document, January 2017)',
        'EPA / ATSDR Toxicological Profile for Chlorine Dioxide and Chlorite'
      ],
      modules: [
        { id:'m1', title:'The ClO₂ by-product family', duration:'35 min',
          summary:'Why ClO₂ avoids THMs but produces chlorite and chlorate, and how chlorate also links to hypochlorite.',
          sections:['Why ClO₂ has a different by-product profile','Chlorite: the inevitable by-product','Chlorate and the hypochlorite link'] },
        { id:'m2', title:'How chlorite and chlorate form', duration:'40 min',
          summary:'Disproportionation and photolysis, the role of generator tuning, and chlorate from ageing hypochlorite.',
          sections:['ClO₂ disproportionation and photolysis','Generator performance and free-chlorine reactions','Chlorate from sodium hypochlorite'] },
        { id:'m3', title:'The limits and the health basis', duration:'35 min',
          summary:'The WHO provisional guideline values, the health effects behind them, and the disinfection-first principle.',
          sections:['The guideline values','Why they matter: health effects','The disinfection-first principle'] },
        { id:'m4', title:'Controlling chlorite and chlorate', duration:'45 min',
          summary:'Prevent at the generator, remove chlorite, manage hypochlorite, and why chlorate is prevention-only.',
          sections:['Prevent at the generator','Remove chlorite','Manage hypochlorite to limit chlorate','Why chlorate is special'] },
        { id:'m5', title:'Monitoring, worked example & non-conformance', duration:'40 min',
          summary:'What to monitor, a worked dose-to-chlorite calculation, and the response to an exceedance.',
          sections:['What to monitor and how','Worked example: ClO₂ dose versus chlorite formed','When you exceed a limit'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'11 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['11 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'Compared with free chlorine, chlorine dioxide (ClO₂):',
              options:['Forms no THMs, but does form chlorite and chlorate','Forms more trihalomethanes (THMs)','Forms no disinfection by-products at all','Forms only bromate'],
              answer:0,
              explain:'A key advantage of ClO₂ is that it does not form THMs; the trade-off is that it produces the inorganic by-products chlorite and chlorate (plus some lower chlorinated organics).' },
            { q:'Roughly what fraction of the ClO₂ that reacts in water appears immediately as chlorite?',
              options:['About 5%','Essentially 100%','About 50–70%','None — chlorite forms only from chlorine'],
              answer:2,
              explain:'About 50–70% of reacted ClO₂ converts straight to chlorite (and chloride), which is why chlorite is described as an inevitable by-product of ClO₂ disinfection.' },
            { q:'Chlorate in treated water can arise from:',
              options:['Only chlorine dioxide','Only sodium hypochlorite','Both chlorine dioxide and ageing sodium hypochlorite','Neither — chlorate does not occur in treated water'],
              answer:2,
              explain:'Chlorate comes from ClO₂ (disproportionation and photolysis) and from the slow decomposition of sodium hypochlorite, so a works using either disinfectant must watch it.' },
            { q:'As a sodium hypochlorite solution ages and loses available chlorine, chlorate in the treated water tends to:',
              options:['Fall, because there is less chlorine','Stay exactly the same','Disappear entirely','Rise, because more product must be dosed to hold the residual'],
              answer:3,
              explain:'Ageing hypochlorite both contains more chlorate and forces a higher dose to maintain disinfection, so more chlorate reaches the water. Solid calcium hypochlorite decomposes much more slowly, making it lower-risk for chlorate.' },
            { q:'Up to roughly what share of the chlorate in a distribution system can be attributed to the chlorine dioxide generator’s type and tuning?',
              options:['About 1%','About 35%','About 90%','None'],
              answer:1,
              explain:'As much as 35% of distribution-system chlorate can be traced to generator type and performance, which is why optimising and tuning the generator is a primary control lever.' },
            { q:'What are the WHO provisional guideline values for chlorite and chlorate in drinking water?',
              options:['0.1 mg/L each','0.7 mg/L each','5 mg/L each','There is no guideline value for either'],
              answer:1,
              explain:'The WHO provisional guideline value is 0.7 mg/L for both chlorite and chlorate. No separate value is set for ClO₂ itself, since it reduces to chlorite on ingestion. SANS 241:2015 should be consulted for the exact South African limits.' },
            { q:'Which health concern is most associated with chlorate specifically?',
              options:['Effects on the thyroid via reduced iodide uptake','Dental fluorosis','Improved oxygen transport','Kidney stones'],
              answer:0,
              explain:'Chlorate’s most sensitive effect is on the thyroid (reduced iodide transport), a particular concern for iodine-deficient pregnant women; chlorite, by contrast, is linked more to oxidative red-cell effects such as methaemoglobinaemia.' },
            { q:'Once chlorate has formed in water, why is it so hard to deal with?',
              options:['It evaporates and spreads','It is removed easily by sand filtration','It converts back to ClO₂','There is no low-cost removal — GAC does not work, so control relies on prevention'],
              answer:3,
              explain:'Chlorate has no cheap removal once formed (it is only reversibly adsorbed on GAC; anion exchange and RO are high-cost), so it must be controlled by preventing its addition from hypochlorite and its formation from ClO₂.' },
            { q:'To stop residual chlorite turning into chlorate, the operator should:',
              options:['Add more free chlorine on top of the chlorite','Raise the pH sharply','Remove the chlorite (e.g. with ferrous iron or a sulfur reducing agent) before adding free chlorine','Do nothing — chlorite is inert'],
              answer:2,
              explain:'Unremoved chlorite reacts with applied free chlorine to form chlorate, so chlorite is reduced — using ferrous iron, a sulfur reducing agent or activated carbon — before any free chlorine is added.' },
            { q:'A works applies ClO₂ at 1.0 mg/L. Assuming about 60% converts to chlorite, the expected chlorite concentration is roughly:',
              options:['0.06 mg/L','0.6 mg/L','1.6 mg/L','6 mg/L'],
              answer:1,
              explain:'1.0 mg/L × 0.60 ≈ 0.6 mg/L of chlorite — already close to the 0.7 mg/L guideline value, showing how even a modest ClO₂ dose demands dose discipline and chlorite removal. Sanity-check: chlorite can never exceed the applied ClO₂.' },
            { q:'The chlorite and chlorate guideline values are “provisional”, and difficulties in meeting them mean an operator should:',
              options:['Cut the disinfectant dose until the by-product passes, even if disinfection suffers','Ignore the limits entirely','Never compromise effective disinfection — control by-products by prevention instead','Switch off chlorination at night'],
              answer:2,
              explain:'WHO is explicit that meeting the by-product guideline must never come at the cost of adequate disinfection; the values are provisional for exactly this reason, and by-products are controlled by prevention and removal rather than by under-dosing.' }
          ] }
      ]
    },

    {
      id: 'c-pot-302', trackId: 'track-potable', code: 'POT-302',
      title: 'SANS 241 Compliance: Monitoring, Sampling & Non-conformance',
      level: 'Advanced', duration: '4 hrs',
      summary: 'Knowing the SANS 241 limits is half the job; the other half is proving you meet them. This Advanced course covers SANS 241-2, the application standard — how a works turns the limits into a working compliance system. It walks the water quality risk assessment, the prescribed and risk-defined monitoring programmes, the sampling points and frequencies (including how E. coli sample numbers scale with population), and the incident-management response when a limit is breached. It then shows how compliance is calculated and how distribution systems are categorised from Excellent to Unacceptable, all feeding the Water Safety Plan. It includes a worked compliance calculation and the crucial distinction between an annual percentage and a single-incident response.',
      outcomes: [
        'Explain how SANS 241-2 applies SANS 241-1 through risk assessment, monitoring, response and verification',
        'Distinguish prescribed from risk-defined monitoring and place sampling points across the supply chain',
        'Conduct a water quality risk assessment and use its results to adapt the monitoring programme',
        'Determine the required monitoring determinands and frequencies, including E. coli sample numbers by population',
        'Calculate water quality compliance and categorise distribution-system performance',
        'Run an incident-management response when a numerical limit is exceeded'
      ],
      prereqs: ['c-pot-204'],
      linkedTools: ['lims','converters','servicereport'],
      sources: [
        'SANS 241-2:2015, Drinking water — Part 2: Application of SANS 241-1 (SABS)',
        'SANS 241-1:2015, Drinking water — Part 1: Microbiological, physical, aesthetic and chemical determinands (SABS)',
        'Introduction to Water Treatment (Rand Water) — South African water legislation, DWS and Blue/Green Drop'
      ],
      modules: [
        { id:'m1', title:'The two-part monitoring system', duration:'35 min',
          summary:'What Part 2 adds to Part 1, the prescribed and risk-defined programmes, and sampling points across the supply chain.',
          sections:['What SANS 241-2 adds to SANS 241-1','Prescribed versus risk-defined monitoring','Sampling points across the supply chain'] },
        { id:'m2', title:'The water quality risk assessment', duration:'40 min',
          summary:'What the risk assessment is and when to do it, how hazards are quantified and grouped, and how results adapt monitoring.',
          sections:['What the risk assessment is, and when to do it','Quantifying and grouping hazards','Interpreting results to adapt monitoring'] },
        { id:'m3', title:'Routine monitoring: determinands & frequency', duration:'45 min',
          summary:'The prescribed process risk indicators, E. coli sample numbers by population, and risk-defined frequencies.',
          sections:['The prescribed process risk indicators','E. coli sample numbers by population','Risk-defined frequencies'] },
        { id:'m4', title:'Response monitoring & verification', duration:'45 min',
          summary:'Incident management when a limit is exceeded, calculating compliance, and a worked compliance calculation.',
          sections:['Response monitoring: incident management','Calculating compliance','Worked example: a compliance calculation'] },
        { id:'m5', title:'Performance categories & the Water Safety Plan', duration:'35 min',
          summary:'Categorising performance, the WSP as the umbrella, and the continuous compliance cycle.',
          sections:['Categorising performance','The Water Safety Plan as the umbrella','Putting it together: the compliance cycle'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'12 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['12 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'What does SANS 241-2:2015 provide that SANS 241-1 does not?',
              options:['How to apply the standard — risk assessment, monitoring, response and verification','The numerical limits for determinands','A list of laboratories','The legal penalties for non-compliance'],
              answer:0,
              explain:'SANS 241-1 sets the determinand limits; SANS 241-2 is the application part — it covers the water quality risk assessment, the monitoring programmes, response monitoring and verification of compliance.' },
            { q:'A SANS 241-2 monitoring programme is made up of:',
              options:['A single fixed list of tests for every works','A prescribed (mandatory minimum) programme plus a risk-defined programme from the risk assessment','Only whatever the operator chooses','Annual sampling only'],
              answer:1,
              explain:'Every works runs a prescribed water quality monitoring programme (the mandatory minimum in tables 1 and 2) plus a risk-defined programme covering the extra determinands the risk assessment flags.' },
            { q:'Distribution-zone sampling points should be sited to ensure at least:',
              options:['10% coverage of the distribution system area','50% coverage','80% coverage of the distribution system area','Coverage of the treatment works only'],
              answer:2,
              explain:'Sampling points must verify quality across the whole supply chain and, within the distribution zone, give at least 80% coverage of the distribution system area — including reservoirs, dead ends, and high-risk sites such as hospitals and schools.' },
            { q:'How often must a water quality risk assessment be conducted, as a minimum?',
              options:['Once, when the works is built','Every five years','Only after a complaint','At least annually, and whenever a defined trigger occurs'],
              answer:3,
              explain:'The risk assessment is done at minimum annually — timed for the poorest water quality or peak demand — and also whenever a trigger occurs, such as a raw-water change, a treatment failure, a new or refurbished plant, or a change of treatment chemical.' },
            { q:'If a determinand exceeds its limit in both the raw and the final water, it means:',
              options:['The water is fine — no action needed','Only the laboratory is at fault','The treatment system is not removing it, so treatment must be installed or optimised','The determinand should be ignored'],
              answer:2,
              explain:'Exceedance in both raw and final water shows the existing treatment is not removing the determinand; treatment must be installed or optimised, and the determinand added to the risk-defined monitoring programme.' },
            { q:'Under the prescribed programme, the disinfectant residual in final water is monitored at minimum:',
              options:['Once a year','Once per shift','Once a month','Never'],
              answer:1,
              explain:'Prescribed monitoring requires the disinfectant residual to be checked once per shift (an eight-hour work period) on final water, and fortnightly in the distribution system — it is a frontline indicator that disinfection is holding.' },
            { q:'A town of 200 000 people falls in the 100 000–500 000 band (1 per 10 000 head + 11 additional). The minimum E. coli samples per month in distribution is:',
              options:['20','31','11','200'],
              answer:1,
              explain:'200 000 ÷ 10 000 = 20, plus 11 additional samples = 31 samples per month. Sampling should increase further during the rainy season.' },
            { q:'Under the risk-defined programme, chronic-health risk determinands are monitored at minimum:',
              options:['Daily','Weekly','Monthly','Once per shift'],
              answer:2,
              explain:'Risk-defined frequencies scale with risk: chronic-health determinands are monitored monthly on raw, final and critical distribution points, whereas acute-health chemical and operational determinands are monitored weekly.' },
            { q:'When a single E. coli detection occurs in final water, the operator must:',
              options:['Wait for the annual compliance calculation','Do nothing if the yearly percentage is still high','Only record it','Take remedial action and non-routine follow-up sampling immediately, continuing until results are compliant'],
              answer:3,
              explain:'Any acute-health microbiological exceedance triggers immediate response monitoring — remedial action plus non-routine follow-up sampling at increased frequency until results comply — regardless of how good the annual compliance percentage looks.' },
            { q:'Risk-defined compliance for a determinand is calculated as:',
              options:['Total results minus failures','The highest result recorded','(Number of compliant results ÷ total number of results) × 100%','Compliant results ÷ population'],
              answer:2,
              explain:'Compliance is the percentage of compliant results: (compliant results ÷ total results) × 100%. It is worked out for each determinand and then classified against its risk category.' },
            { q:'SANS 241-2 categorises distribution-system performance as:',
              options:['Excellent, Good or Unacceptable, by percentage compliance and population served','Pass or fail only','A score out of 100','Gold, Silver or Bronze'],
              answer:0,
              explain:'Performance is categorised as Excellent, Good or Unacceptable, with the percentage thresholds depending on the determinand’s risk category and whether the population served is above or below 100 000.' },
            { q:'A Water Safety Plan, which SANS 241-2 requires, is best described as:',
              options:['A monthly lab report','A catchment-to-tap risk management system built on HACCP and multiple-barrier principles','A list of chemical suppliers','A turbidity log'],
              answer:1,
              explain:'A WSP is an integrated, preventive water-quality management system covering the whole supply chain from catchment to point of delivery, embracing hazard analysis (HACCP) and multiple-barrier principles; the SANS 241-2 monitoring and verification feed into it.' }
          ] }
      ]
    },

    {
      id: 'c-pot-303', trackId: 'track-potable', code: 'POT-303',
      title: 'Legionella & Building Water Systems',
      level: 'Advanced', duration: '5 hrs',
      summary: 'Water leaving a treatment works may be perfectly compliant and still kill someone in a building three kilometres away. Legionella is not a treatment failure but a distribution and building-systems failure — amplified by warm water, stagnation, deposits and biofilm, and delivered by any system that makes a breathable aerosol. This Advanced course covers the organism and the disease it causes, the conditions that let it multiply, and why protozoa and biofilm make it so hard to kill. It then teaches control: the temperature scheme for hot and cold potable water systems, the design faults that defeat it, thermal disinfection and flushing, and the risk-assessed water management programme that ties it all together and proves control.',
      outcomes: [
        'Distinguish legionellosis, Legionnaires’ disease and Pontiac fever, and identify who is most susceptible',
        'State the temperature ranges for Legionella dormancy, growth, optimal growth and thermal kill',
        'Explain how stagnation, deposits, biofilm and protozoa amplify and protect Legionella',
        'Identify the systems and design faults that generate the aerosol route of infection',
        'Apply the hot and cold potable water temperature control scheme, thermal disinfection and flushing regimes',
        'Build a risk-assessed water management programme covering growth risk, aerosol risk and human risk, with an auditable defect-action log'
      ],
      prereqs: ['c-pot-301'],
      linkedTools: ['servicereport','lims','coolingtower'],
      sources: [
        'The Nalco Water Handbook, 3rd ed. (Ed. Flynn, McGraw-Hill) — Ch.20, Legionella and Legionellosis',
        'The Nalco Water Handbook, 3rd ed. (Ed. Flynn, McGraw-Hill) — Ch.21, Water Management Programs for Engineered Water Systems'
      ],
      modules: [
        { id:'m1', title:'The disease', duration:'40 min',
          summary:'Legionellosis, Legionnaires’ disease and Pontiac fever, who is susceptible, and the scale of the problem.',
          sections:['Legionellosis: two diseases, one genus','Who is susceptible','The scale of the problem'] },
        { id:'m2', title:'The bacterium and how it thrives', duration:'50 min',
          summary:'Where Legionella lives, temperature as the master variable, and the roles of stagnation, biofilm and protozoa.',
          sections:['Where Legionella lives','Temperature: the master variable','Stagnation, biofilms and protozoa'] },
        { id:'m3', title:'Sources of risk: the aerosol route', duration:'40 min',
          summary:'Why breathable aerosols are the danger, which systems produce them, and how building systems amplify risk.',
          sections:['Why the aerosol is the danger','The systems that generate aerosols','How building water systems amplify risk'] },
        { id:'m4', title:'Controlling hot and cold potable water', duration:'55 min',
          summary:'The temperature control scheme, the design faults that defeat it, and thermal disinfection and flushing.',
          sections:['Keep hot water hot and cold water cold','System design: tanks, heaters and dead legs','Thermal disinfection and flushing'] },
        { id:'m5', title:'The water management programme', duration:'50 min',
          summary:'Risk assessment across growth, aerosol and human risk; monitoring and proving control; cooling tower measures.',
          sections:['Assessing the risk','Monitoring and proving control','Cooling towers: cleaning and online disinfection'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'12 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['12 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'Which organism causes over 90% of legionellosis outbreaks worldwide?',
              options:['Legionella pneumophila serogroup 1','Escherichia coli','Pseudomonas aeruginosa','Cryptosporidium parvum'],
              answer:0,
              explain:'Legionella pneumophila serogroup 1 causes over 90% of legionellosis outbreaks worldwide. Legionellosis is the umbrella term for all infections caused by Legionella bacteria, and includes both Legionnaires’ disease and Pontiac fever.' },
            { q:'Pontiac fever differs from Legionnaires’ disease in that Pontiac fever:',
              options:['Is caused by a different genus of bacteria','Is a milder, flu-like illness with no deaths attributed to it','Is more often fatal','Only affects children'],
              answer:1,
              explain:'Pontiac fever, named from a 1968 outbreak in Pontiac, Michigan, is a less serious flu-like illness — headache, fatigue, fever, joint and muscle pain — and no deaths have been attributed to it. It is considered similar to influenza rather than pneumonia.' },
            { q:'According to the CDC, which group of people generally does not become ill even when exposed to Legionella pneumophila?',
              options:['Smokers','Healthy people under 20 years of age','Hospital patients','People over 65'],
              answer:1,
              explain:'Most people exposed do not become ill, and healthy people under 20 generally do not become ill. Risk rises with age and with factors such as smoking, cancer or immune suppression, lung disease, and liver, kidney or heart disease. Only a qualified medical practitioner can assess an individual’s susceptibility.' },
            { q:'The mortality rate among people who contract Legionnaires’ disease is approximately:',
              options:['Less than 1%','5 to 20%','50%','Over 80%'],
              answer:1,
              explain:'Mortality is 5 to 20% of those who contract the disease, and individual susceptibility strongly affects both contracting it and surviving it. Roughly 20% of cases are acquired during hospitalisation. The disease is deemed preventable, which is why water management matters.' },
            { q:'Legionella growth and multiplication occurs over which water temperature range?',
              options:['0 to 15 °C','20 to 50 °C, with optimal growth at 35 to 45 °C','60 to 80 °C','Only above 60 °C'],
              answer:1,
              explain:'Growth occurs from 20 to 50 °C (68–122 °F), optimally at 35 to 45 °C (95–113 °F). They seldom grow below 20 °C and do not survive above 60 °C, provided that temperature is maintained for sufficient contact time.' },
            { q:'Which statement about stagnation and biofilm is correct?',
              options:['Biofilm only forms in stagnant water','Stagnation is not the primary factor determining whether biofilm forms — biofilm also forms at high flow, such as in heat exchanger tubes','Biofilm cannot form on scaled surfaces','High flow prevents all microbial growth'],
              answer:1,
              explain:'Stagnation reduces biocide residual and promotes deposits, but it is not what determines whether biofilm forms; biofilm also forms at high flow rates. Flow rate influences the morphology and composition of the biofilm rather than its existence.' },
            { q:'Because Legionella are aerobic bacteria, an anaerobic stagnant area of a system may be:',
              options:['The most dangerous location','Less prone to Legionella growth than a well-oxygenated area with reasonable flow, such as tower fill','Impossible to disinfect','Free of all biofilm'],
              answer:1,
              explain:'Legionella need oxygen to grow. Anaerobic stagnant areas may therefore be less prone to Legionella growth than areas with reasonable flow and oxygen content — a counterintuitive point that stops operators assuming stagnation alone predicts risk.' },
            { q:'Why does the ability of Legionella to live inside protozoa matter so much?',
              options:['It makes the bacteria harmless','It makes control harder — protozoan cysts protect Legionella through harsh conditions, and this adaptation is believed to give Legionella the ability to infect humans','It kills the protozoa','It prevents biofilm formation'],
              answer:1,
              explain:'Legionella infest at least 14 species of protozoa as facultative parasites and can survive inside protozoan cysts when conditions turn harsh, making control difficult in heavily contaminated systems. It is now believed that adaptation to live within protozoa is what gives Legionella the ability to infect human cells.' },
            { q:'The greatest risk of Legionella infection comes from systems that:',
              options:['Store water in sealed tanks','Produce aerosols, mists or fine sprays that can be inhaled deep into the lungs','Operate above 60 °C','Carry water at high pressure'],
              answer:1,
              explain:'Infection occurs by inhaling fine droplets that penetrate deep into the lungs. Cooling towers and evaporative condensers are the most notorious sources, but whirlpool spas, decorative fountains, and hot and cold potable water systems with showerheads are all implicated. Person-to-person transmission is unlikely.' },
            { q:'A hot water system stores water at 55 °C and delivers 46 °C at the tap. Assessed against the control scheme, this system:',
              options:['Meets both targets','Fails both targets — storage should exceed 60 °C and distribution should deliver 51 °C — and the 46 °C tap sits inside the 20–50 °C growth range','Meets the storage target but not the tap target','Is safe because 55 °C exceeds 50 °C'],
              answer:1,
              explain:'Water heaters with storage tanks should operate above 60 °C, with distribution delivering 51 °C to the point of use. At 55 °C the store neither kills reliably nor accounts for thermal stratification at the heater base, and a 46 °C tap lies within the growth range. Sanity-check: 55 °C is above the 50 °C growth ceiling but below the 60 °C kill threshold — the gap between those two numbers is exactly where complacency lives.' },
            { q:'Thermal disinfection of a hot water system on standby involves:',
              options:['Raising the heater and recirculating water to 60 °C for at least one hour, flushing each outlet for five minutes','Chilling the system below 20 °C','Draining the tank and leaving it dry','Dosing 5 mg/L chlorine for 6 hours'],
              answer:0,
              explain:'This pasteurisation of the water heater raises the heater and recirculating water to 60 °C (140 °F) for at least one hour, with every outlet flushed for five minutes during that period. Super-chlorination to 5 mg/L free residual oxidant for 5–6 hours is the separate online disinfection procedure used on cooling systems.' },
            { q:'When a monitoring control limit is not met, the water management programme requires that you:',
              options:['Wait for the next scheduled review','Undertake remedial action, prove the action was effective, and document the event in an auditable defect/action log','Increase the biocide dose and say nothing','Shut the building'],
              answer:1,
              explain:'A defined management process must follow: take remedial action, prove it reduced the risk, and document the event. The defect/action log or escalation process records who is responsible for each action and all correspondence, and must be auditable so that the review can validate and verify that the programme has been effective.' }
          ] }
      ]
    },

    /* ──────────────────  SEWAGE TREATMENT  ────────────────── */

    {
      id: 'c-sew-101', trackId: 'track-sewage', code: 'SEW-101',
      title: 'Sewage Composition & Treatment Overview',
      level: 'Foundation', duration: '4 hrs',
      summary: 'What raw sewage actually contains, the unit-process train of a typical municipal works, and the discharge standards we have to hit.',
      outcomes: [
        'Describe domestic sewage composition (BOD, COD, TSS, NH₃, P)',
        'Sketch a primary → secondary → tertiary plant',
        'List general & special standard discharge limits',
        'Explain the role of pre-treatment in protecting downstream stages'
      ],
      prereqs: [],
      linkedTools: ['effluent', 'servicereport'],
      sources: ['DWS General Authorisations (2013)', 'Metcalf & Eddy — Wastewater Engineering', 'WISA Plant Operations P112'],
      modules: [
        { id:'m1', title:'What\'s in domestic sewage', duration:'40 min',
          summary:'Typical loadings per capita and how they vary over the day.',
          sections:['BOD₅ ≈ 60 g/cap/day, COD ≈ 120 g/cap/day','TSS ≈ 70 g/cap/day, NH₃-N ≈ 8 g/cap/day','Diurnal flow & load patterns','Industrial contributions'] },
        { id:'m2', title:'The treatment train', duration:'45 min',
          summary:'Screens → grit → primary → biological → secondary clarifier → disinfection → discharge.',
          sections:['Pre-treatment: bar screens, grit, FOG','Primary settlement','Activated sludge / trickling filter / RBCs','Tertiary polishing & disinfection'] },
        { id:'m3', title:'Discharge standards (SA)', duration:'40 min',
          summary:'General Authorisation vs Special Standard, the dis charge licence and risk-based regulation.',
          sections:['DWS General Auth limits (COD, NH₃, P, etc.)','Special standard for sensitive catchments','Cumulative effects and load-based limits'] },
        { id:'m4', title:'Operator\'s daily sewage routine', duration:'30 min',
          summary:'Sample regimens, sludge wasting, blockage response.',
          sections:['Composite vs grab sampling','Sludge age control via WAS','Storm-event protocols'] }
      ]
    },

    {
      id: 'c-sew-201', trackId: 'track-sewage', code: 'SEW-201',
      title: 'Activated Sludge & Biological Treatment',
      level: 'Intermediate', duration: '5 hrs',
      summary: 'F:M, MLSS, SRT, SVI₃₀ — the core operating ratios of an activated-sludge plant, how to read them and how to act on them.',
      outcomes: [
        'Calculate F:M and SRT from on-plant data',
        'Read an SVI₃₀ and call bulking vs filamentous',
        'Set an aeration DO target',
        'Manage RAS / WAS rates'
      ],
      prereqs: ['c-sew-101'],
      linkedTools: ['effluent'],
      sources: ['Metcalf & Eddy', 'WISA P112 — Plant Operations'],
      modules: [
        { id:'m1', title:'The activated-sludge process', duration:'50 min',
          summary:'How heterotrophs, autotrophs and protozoa do all the actual work.',
          sections:['Carbonaceous oxidation','Nitrification (AOB / NOB)','Floc formation and settling','Endogenous respiration'] },
        { id:'m2', title:'F:M, SRT & MLSS', duration:'50 min',
          summary:'The three ratios that decide whether a plant runs lean, fat or sick.',
          sections:['F:M = BOD-load / MLVSS-mass — typical 0.2–0.5','SRT = MLSS-mass / WAS-mass-out per day','MLSS targets 2500–4000 mg/L for conventional','Use the Hadron F:M Calc'] },
        { id:'m3', title:'Settlement & SVI₃₀', duration:'40 min',
          summary:'30-min settled volume, sludge volume index, and what bulking looks like.',
          sections:['SVI = SV₃₀ × 1000 / MLSS — target 80–120','> 150 = filamentous bulking','< 80 = pin-floc, dispersed','Microscopic exam for filaments (Eikelboom)'] },
        { id:'m4', title:'Aeration & DO control', duration:'45 min',
          summary:'DO 2 mg/L target, oxygen demand, blower turn-down.',
          sections:['α-factor and SOTE','DO sag at peak load','Compound loop: NH₃ + DO control'] },
        { id:'m5', title:'RAS / WAS strategy', duration:'30 min',
          summary:'How to actually set the pump rates day-to-day.',
          sections:['RAS to maintain MLSS','WAS to control SRT','Sludge age 10–20 days for nitrification'] }
      ]
    },

    {
      id: 'c-sew-202', trackId: 'track-sewage', code: 'SEW-202',
      title: 'Sludge Treatment & Nutrient Removal',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'Anaerobic digestion, dewatering, nitrification-denitrification, BNR for phosphorus removal.',
      outcomes: [
        'Specify a sludge thickening + dewatering line',
        'Run a Modified Ludzack-Ettinger N-removal scheme',
        'Set a UCT or 5-stage Bardenpho for combined N + P',
        'Manage digester pH and gas production'
      ],
      prereqs: ['c-sew-201'],
      linkedTools: ['effluent', 'servicereport'],
      sources: ['Metcalf & Eddy', 'WRC TT 685/16 — Biological Nutrient Removal'],
      modules: [
        { id:'m1', title:'Sludge handling', duration:'45 min',
          summary:'Thickening (gravity / DAF / drum), digestion (mesophilic / thermophilic) and disposal.',
          sections:['Primary + WAS sludge characteristics','Belt-press, centrifuge, screw-press dewatering','Cake disposal — landfill, agriculture, incineration'] },
        { id:'m2', title:'Anaerobic digestion', duration:'45 min',
          summary:'How a digester actually works, and the four causes of acidic upset.',
          sections:['Hydrolysis → acidogenesis → acetogenesis → methanogenesis','HRT 15–30 d, T 35 °C','VFA / alkalinity ratio < 0.3 healthy','Biogas: 60–65 % CH₄, ~0.5 m³/kg VSS destroyed'] },
        { id:'m3', title:'Biological nutrient removal', duration:'50 min',
          summary:'The dance of anoxic + aerobic + anaerobic zones for combined N and P removal.',
          sections:['Modified Ludzack-Ettinger (MLE)','UCT and Johannesburg processes','5-stage Bardenpho','PAOs and the bio-P window'] },
        { id:'m4', title:'Operator targets', duration:'30 min',
          summary:'Effluent NH₃, NO₃ and total-P targets and how to chase them.',
          sections:['NH₃-N < 3 mg/L typical','NO₃-N target via internal recycle','TP < 1 mg/L on bio-P + chemical polish'] }
      ]
    },

    {
      id: 'c-sew-203', trackId: 'track-sewage', code: 'SEW-203',
      title: 'Biological Treatment & Activated Sludge Process Control',
      level: 'Intermediate', duration: '5 hrs',
      summary: 'Secondary treatment is where sewage is actually cleaned, and it is done by organisms, not chemicals. This course opens up the biological heart of a works: the microbial community that builds the floc, the growth curve that governs it, and the ten parameters that keep it alive. It covers the nutrient ratio that industrial effluent so often violates, where the sludge actually comes from, and how to calculate the oxygen the process demands. It then teaches the three levers an operator has — solids retention time, food-to-microorganism ratio and sludge volume index — and how to read pin floc, straggler floc and bulking as symptoms of specific failures. Includes a fully worked, self-consistent process check.',
      outcomes: [
        'Describe the two essential components of a biological treatment system and classify the major process types',
        'Identify the key microorganisms in activated sludge and interpret their presence as indicators of process health',
        'Control pH, alkalinity, temperature and nutrients within the ranges biological treatment requires',
        'Calculate carbonaceous and nitrogenous oxygen demand and check them against loading rules of thumb',
        'Calculate solids retention time, food-to-microorganism ratio and sludge volume index, and act on the results',
        'Diagnose pin floc, straggler floc and bulking from SRT, F/M and SVI data'
      ],
      prereqs: ['c-sew-101'],
      linkedTools: ['effluent','lims','converters'],
      sources: [
        'The Nalco Water Handbook, 3rd ed. (Ed. Flynn, McGraw-Hill) — Ch.23, Secondary Effluent Treatment (Eqs. 23.6, 23.7, 23.9–23.12, Tables 23.1, 23.3–23.5)'
      ],
      modules: [
        { id:'m1', title:'Why biology, and who does the work', duration:'45 min',
          summary:'The two essential components, the major process families, the microbial community and how bacteria grow.',
          sections:['The two essential components','The microbial community','How bacteria grow'] },
        { id:'m2', title:'The control parameters', duration:'50 min',
          summary:'The ten parameters, pH and alkalinity, temperature, and the nutrient ratio that industrial effluent violates.',
          sections:['The ten parameters','pH, alkalinity and temperature','Nutrients and the 100/5/1 rule'] },
        { id:'m3', title:'Sludge production & oxygen demand', duration:'50 min',
          summary:'Where the sludge comes from, calculating carbonaceous and nitrogenous oxygen demand, and the loading rules of thumb.',
          sections:['Where the sludge comes from','Carbonaceous oxygen demand','Nitrogenous oxygen demand and rules of thumb'] },
        { id:'m4', title:'Activated sludge process control', duration:'50 min',
          summary:'The conventional process, solids retention time and what it dictates, and the food-to-microorganism ratio.',
          sections:['The conventional process','Solids retention time','Food-to-microorganism ratio'] },
        { id:'m5', title:'Settling, diagnosis & a worked example', duration:'50 min',
          summary:'Sludge volume index and its trap, a fully worked process check, and reading pin floc, straggler floc and bulking.',
          sections:['Sludge volume index','Worked example: a full process check','Reading the process: pin floc, straggler floc and bulking'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'12 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['12 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'The two essential components of a biological effluent treatment system are:',
              options:['A screen and a grit chamber','A reactor where organic matter contacts the microbial population, and a clarifier where biological solids settle','An aerator and a chlorinator','A digester and a drying bed'],
              answer:1,
              explain:'Every biological system needs a reactor in which organic matter is brought into contact with the microbial population, and a clarifier in which biological solids settle into a sludge blanket and are separated from the clarified effluent passing to receiving waters.' },
            { q:'A trickling filter and a rotating biological contactor are both examples of:',
              options:['Suspended growth processes','Attached growth processes','Anoxic processes','Chemical treatment'],
              answer:1,
              explain:'Activated sludge and aerated lagoons are suspended growth; trickling filters, RBCs and packed bed reactors are attached growth. Denitrification appears in both forms as an anoxic process.' },
            { q:'The presence of rotifers in the mixed liquor indicates:',
              options:['A toxic shock load','A highly efficient aerobic biological purification process','Imminent bulking','Insufficient oxygen'],
              answer:1,
              explain:'Rotifers are aerobic, heterotrophic, multicellular organisms that effectively consume dispersed and flocculated bacteria and small organic particles. Their presence indicates a highly efficient aerobic purification process. Worms, by contrast, characterise systems with very high sludge age.' },
            { q:'Most biological treatment processes operate within a pH range of:',
              options:['2 to 4','5 to 9, with an optimum of 6,5 to 7,5','9 to 12','Any pH'],
              answer:1,
              explain:'Operation is limited to pH 5–9, optimally 6,5–7,5. pH tends to fall because nitrate and carbon dioxide are generated from BOD and nitrogen; if the effluent lacks bicarbonate alkalinity, the pH can drop out of range and caustic, lime or another alkali must be added.' },
            { q:'The recommended BOD to nitrogen to phosphorus ratio for maintaining good biological conditions is:',
              options:['100/5/1','10/1/1','100/50/10','1/1/1'],
              answer:0,
              explain:'A ratio of BOD/N/P of 100/5/1 is recommended. For healthy growth, maintain a small excess in the final effluent — roughly 1 or 2 mg/L of nitrogen as ammonia and soluble orthophosphate on a filtered sample.' },
            { q:'Which is NOT a suitable source of phosphorus for a nutrient-deficient effluent?',
              options:['Phosphoric acid','Monosodium phosphate','Polyphosphates and hexametaphosphate','Trisodium phosphate'],
              answer:2,
              explain:'Polyphosphates and hexametaphosphate are not a readily available source of phosphate for microorganisms and should not be used. Phosphoric acid and mono-, di- and trisodium phosphate are suitable; ammonia and urea supply nitrogen.' },
            { q:'For an activated sludge process operating at an SRT of 5 to 10 days, typical sludge yield when treating domestic BOD is about:',
              options:['0,05 kg dry solids per kg BOD','0,5 to 0,6 kg dry solids per kg BOD','2 kg dry solids per kg BOD','5 kg dry solids per kg BOD'],
              answer:1,
              explain:'Net sludge production is mainly a function of total BOD treated and SRT. At 5–10 days SRT the yield is typically 0,5–0,6 kg dry mass per kg of domestic BOD treated, and lower with longer SRT, because endogenous respiration reduces the biomass over time.' },
            { q:'When nitrification occurs, the additional oxygen demand is calculated using a conversion factor of:',
              options:['1,42','0,68','4,57','8,34'],
              answer:2,
              explain:'ODN = 4,57 × Q(N₀ − N) × f_C, where 4,57 is the oxygen required for complete oxidation of TKN. In the carbonaceous equation, 0,68 converts BOD₅ to BOD_L for municipal effluent, and 1,42 relates cell mass to its oxygen equivalent.' },
            { q:'Why is nitrification impossible at a solids retention time below five days?',
              options:['The clarifier overflows','There is not enough time to grow the slowly growing autotrophic microorganisms that oxidise nitrogen','The pH is too high','Oxygen cannot dissolve'],
              answer:1,
              explain:'The autotrophs that oxidise ammonia grow slowly. An SRT below five days does not retain them long enough to build a population, so nitrification cannot occur regardless of aeration or loading.' },
            { q:'A mixed liquor sample settles to 300 mL/L after 30 minutes, with an MLSS of 3000 mg/L. The sludge volume index is:',
              options:['10 mL/g','100 mL/g','900 mL/g','0,1 mL/g'],
              answer:1,
              explain:'SVI = Vs ÷ MLSS = 300 mL/L ÷ 3,0 g/L = 100 mL/g. For mixed liquor in the 1500–3500 mg/L range, an SVI of 80–120 is normal and indicates good settling. Sanity-check the units: mL/L divided by g/L gives mL/g.' },
            { q:'An SVI consistently above 120 most likely indicates:',
              options:['Very compact, heavy floc','Possible bulking in the clarifier','Perfect settling','A failed clarifier scraper'],
              answer:1,
              explain:'SVI above 120 indicates possible bulking; below 80 indicates very compact and heavy floc. Note the important caveat: a good-settling SVI varies with the type of waste and mixed liquor concentration, so a plant’s own values should not be compared with those from other plants or the literature.' },
            { q:'An operator finds light, fluffy, buoyant floc being pulled over the clarifier weirs, white billowy foam in the aeration basin, and a clear effluent. This is characteristic of:',
              options:['Young sludge — SRT below the recommended range','Pin floc from excessive SRT','Nutrient deficiency','Toxic shock'],
              answer:0,
              explain:'Operating below the recommended SRT gives “young sludge”, also called straggler floc: light, fluffy and slow-settling, with white billowy foam — typical just after startup. The opposite fault, excessive SRT, dismantles the floc into pin floc, causing solids loss and rising effluent turbidity.' }
          ] }
      ]
    },

    {
      id: 'c-sew-301', trackId: 'track-sewage', code: 'SEW-301',
      title: 'Plant Optimisation & Compliance',
      level: 'Advanced', duration: '4 hrs',
      summary: 'Green-Drop, energy optimisation, instrumentation control loops, and digital tools to get the most from an existing works.',
      outcomes: [
        'Read a Green-Drop report',
        'Optimise blower turn-down to halve aeration energy',
        'Set up a real-time dashboard from existing instruments',
        'Lead a plant-wide audit'
      ],
      prereqs: ['c-sew-202'],
      linkedTools: ['servicereport', 'effluent'],
      sources: ['DWS Green Drop reports', 'Hadron Service Report tool'],
      modules: [
        { id:'m1', title:'Green-Drop framework', duration:'45 min',
          summary:'The audit dimensions and how to score well in each.',
          sections:['Process control','Effluent quality','Capacity','Compliance management'] },
        { id:'m2', title:'Aeration energy', duration:'45 min',
          summary:'Aeration is 50 % of plant energy. DO control + blower turn-down typically halves it.',
          sections:['Most-open valve (MOV) control','Ammonia-based aeration control','Turbo-blowers vs lobe blowers'] },
        { id:'m3', title:'Digital tools & dashboards', duration:'40 min',
          summary:'How to wire the existing plant SCADA into a phone dashboard your manager actually checks.',
          sections:['On-line BOD/COD surrogates (UV-254)','Soft sensors for MLSS','Daily Service Report routine'] },
        { id:'m4', title:'Audit walk-through', duration:'30 min',
          summary:'A repeatable plant audit you can run in one afternoon.',
          sections:['Mass balances on flow / load','Sample integrity check','Maintenance & calibration register review'] }
      ]
    },

    /* ──────────────────  INDUSTRIAL EFFLUENT  ────────────────── */

    {
      id: 'c-eff-101', trackId: 'track-effluent', code: 'EFF-101',
      title: 'Effluent Characterisation & Standards',
      level: 'Foundation', duration: '3 hrs',
      summary: 'Trade waste is hugely varied. This course shows how to characterise an effluent and which discharge standards apply.',
      outcomes: [
        'Run a comprehensive effluent characterisation',
        'Identify the limiting determinand for a given trade',
        'Apply the correct discharge standard (Municipal vs General Auth vs Special)',
        'Pick a treatment direction (physical / chemical / biological)'
      ],
      prereqs: [],
      linkedTools: ['effluent', 'lims', 'neutralise'],
      sources: ['DWS General Auth (2013)', 'Municipal trade-waste by-laws', 'Hadron BOD/COD/TSS Removal Calculator'],
      modules: [
        { id:'m1', title:'Characterisation', duration:'45 min',
          summary:'BOD, COD, TSS, NH₃, P, FOG, conductivity, metals — the standard panel.',
          sections:['Sampling: composite vs grab','Laboratory turnaround','Loading vs concentration thinking'] },
        { id:'m2', title:'Discharge standards', duration:'45 min',
          summary:'Municipal sewer permits, General Authorisation for surface discharge, Special Standard.',
          sections:['Sewer discharge: COD ≤ 5000, pH 6–10','GA surface discharge: COD ≤ 75','Special standard: receiving-water-specific'] },
        { id:'m3', title:'Treatment direction', duration:'40 min',
          summary:'A decision matrix from "BOD-rich" to "metal-laden" effluents.',
          sections:['BOD/COD-rich → biological','Metals-laden → chemical precipitation','Oily/colloidal → DAF / coalescing'] }
      ]
    },

    {
      id: 'c-eff-201', trackId: 'track-effluent', code: 'EFF-201',
      title: 'Paint Detackification',
      level: 'Intermediate', duration: '3 hrs',
      summary: 'How automotive and powder-coat plants kill the tack of overspray paint so it floats out as a dry sludge — the chemistry and operator practice.',
      outcomes: [
        'Distinguish solvent-borne, water-borne and 2K paint chemistries',
        'Specify a melamine + organic flocculant detack programme',
        'Run the daily booth-water tests (pH, conductivity, ORP, residual)',
        'Trouble-shoot sticky-floor and sludge-density issues'
      ],
      prereqs: ['c-eff-101'],
      linkedTools: ['neutralise', 'effluent', 'servicereport'],
      sources: ['Hadron / Nalco Paint Detack Treatment Guide', 'AWMA Coating Conference papers'],
      modules: [
        { id:'m1', title:'Paint chemistry & overspray', duration:'40 min',
          summary:'Solvent-borne, water-borne, 2K and powder — each behaves differently in the booth water.',
          sections:['Resin types: alkyd, epoxy, polyurethane','Solids loading per car / per panel','Booth water chemistry baseline'] },
        { id:'m2', title:'Detack programme design', duration:'50 min',
          summary:'Melamine resins, organic polymers, dual-pump dosing systems.',
          sections:['Cationic detack (kill float)','Anionic floc (form sludge)','Dose ranges 50–250 mg/L'] },
        { id:'m3', title:'Daily operator checks', duration:'40 min',
          summary:'pH, conductivity, residual coag, sludge depth — the four-test daily round.',
          sections:['pH 7.5–9','Conductivity drift','Sludge depth in the pit','Booth-floor stickiness'] },
        { id:'m4', title:'Trouble-shooting', duration:'30 min',
          summary:'Common faults: sticky floor, foam, sludge that won\'t skim.',
          sections:['Under-dosed cation → sticky','Over-dosed cation → re-dispersed','Foam: try defoamer or anionic boost'] }
      ]
    },

    {
      id: 'c-eff-202', trackId: 'track-effluent', code: 'EFF-202',
      title: 'Food & Beverage Effluent',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'High-BOD, FOG-laden, often warm — F&B effluents tend to crash sewers. Pre-treatment design + biological options for on-site treatment.',
      outcomes: [
        'Profile a typical brewery / dairy / abattoir effluent',
        'Specify FOG removal (gravity vs DAF vs IGF)',
        'Decide between anaerobic + aerobic on-site treatment',
        'Manage the COD-NH₃ balance for biological systems'
      ],
      prereqs: ['c-eff-101'],
      linkedTools: ['effluent', 'neutralise'],
      sources: ['Hadron Food & Beverage Effluent Guide', 'Brewers Association — wastewater best practice'],
      modules: [
        { id:'m1', title:'Sector profiles', duration:'50 min',
          summary:'Brewery, dairy, abattoir, soft-drink, sugar — load profiles & seasonal swings.',
          sections:['Brewery: COD 2–8 kg/HL beer','Dairy: COD 1–5 kg/m³','Abattoir: COD 5–15 kg/m³, high N'] },
        { id:'m2', title:'Pre-treatment', duration:'50 min',
          summary:'pH adjust, FOG separation, screening — before any biology.',
          sections:['Equalisation tank: 6–24 h volume','Static skimmers vs DAF / IGF','Auto-pH dosing'] },
        { id:'m3', title:'Anaerobic treatment (UASB / EGSB)', duration:'50 min',
          summary:'When biogas pays back the capital — typically COD > 3000 mg/L.',
          sections:['UASB granule formation','COD removal 80–90 %','Biogas: 0.4 m³/kg COD removed'] },
        { id:'m4', title:'Aerobic polishing', duration:'30 min',
          summary:'MBR or conventional AS following the anaerobic stage.',
          sections:['SBR vs continuous AS','SRT control for nitrification','Final discharge polish'] }
      ]
    },

    {
      id: 'c-eff-203', trackId: 'track-effluent', code: 'EFF-203',
      title: 'Dissolved Air Flotation (DAF)',
      level: 'Intermediate', duration: '3 hrs',
      summary: 'DAF is the workhorse of FOG, algae and low-density-floc removal. This course covers principle, sizing and operation.',
      outcomes: [
        'Explain Henry\'s-law solubilisation and bubble release',
        'Size a DAF on hydraulic + solids loading',
        'Set air:solids ratio and recycle pressure',
        'Diagnose loss-of-float and short-circuiting'
      ],
      prereqs: ['c-eff-101'],
      linkedTools: ['effluent'],
      sources: ['Hadron / Nalco DAF Manual', 'Bratby — Coagulation & Flocculation in Water Treatment'],
      modules: [
        { id:'m1', title:'Principle', duration:'30 min',
          summary:'Pressurise, saturate, release. The microbubble physics in 30 minutes.',
          sections:['Henry\'s law and saturator vessel','Bubble size 30–80 µm','Particle-bubble agglomeration'] },
        { id:'m2', title:'Sizing', duration:'45 min',
          summary:'Hydraulic loading 5–15 m/h, solids loading 5–12 kg/m²·h, A:S 0.005–0.06.',
          sections:['Surface area from peak flow','Air:solids ratio for solids type','Recycle ratio 8–30 %'] },
        { id:'m3', title:'Operation', duration:'40 min',
          summary:'Recycle pressure, saturator level, skimmer speed, sludge consistency.',
          sections:['4–6 bar saturator typical','Skimmer paddle speed','Sludge dryness 2–4 %'] },
        { id:'m4', title:'Trouble-shooting', duration:'25 min',
          summary:'Sinking sludge, no float, scum break-up.',
          sections:['Loss of saturation → check air supply','Float break-up → polymer overdose'] }
      ]
    },

    {
      id: 'c-eff-301', trackId: 'track-effluent', code: 'EFF-301',
      title: 'Heavy Metals & pH Neutralisation',
      level: 'Advanced', duration: '4 hrs',
      summary: 'Hydroxide precipitation, sulfide polishing, pH-vs-solubility curves. Core for plating, mining and electronics effluents.',
      outcomes: [
        'Read a metal solubility-vs-pH curve',
        'Specify a 2-stage neutraliser with auto-pH control',
        'Choose lime vs caustic vs soda ash on cost + sludge',
        'Polish to ppb metals using sulfide or chelate-resin'
      ],
      prereqs: ['c-eff-101'],
      linkedTools: ['neutralise', 'effluent', 'lims'],
      sources: ['EPA — Metals Removal from Industrial Wastewater', 'Crites & Tchobanoglous'],
      modules: [
        { id:'m1', title:'Metal hydroxide chemistry', duration:'45 min',
          summary:'Each metal has its own solubility minimum — the regulatory limit decides which pH you target.',
          sections:['Cu min ≈ pH 9.0–9.5','Zn min ≈ pH 9.5–10.5','Cr(III) ≈ pH 8.5; Cr(VI) → reduce first','Ni / Cd / Pb minima'] },
        { id:'m2', title:'Two-stage neutraliser', duration:'45 min',
          summary:'Acid attack → caustic neutralise — with safe G-values and pH instruments.',
          sections:['HCl / H₂SO₄ acid feed','NaOH / Ca(OH)₂ / Na₂CO₃ neutralise','Stage 1 pH 4 (Cr reduction), Stage 2 pH 9.5'] },
        { id:'m3', title:'Polishing techniques', duration:'45 min',
          summary:'Sulfide precipitation and ion-exchange resins for sub-ppm metals.',
          sections:['Na₂S / TMT-15 sulfide polish','Chelating resin (Lewatit TP207)','Membrane diffusion'] },
        { id:'m4', title:'Sludge & disposal', duration:'30 min',
          summary:'Hazardous classification, encapsulation, recycling routes.',
          sections:['HW01 hazardous waste classification','Encapsulation / S/S','Resource recovery (Cu, Ni)'] }
      ]
    },

    /* ──────────────────  COOLING WATER  ────────────────── */

    {
      id: 'c-cool-101', trackId: 'track-cooling', code: 'COOL-101',
      title: 'Cooling Tower Fundamentals',
      level: 'Foundation', duration: '3 hrs',
      summary: 'Open recirculating cooling, evaporation losses, drift, blowdown and cycles of concentration. The numbers that decide a tower\'s economics.',
      outcomes: [
        'Calculate evaporation, drift, blowdown and make-up',
        'Set a cycles-of-concentration target',
        'Read a cooling tower mass balance',
        'List the LSI / Ryznar implications of high COC'
      ],
      prereqs: [],
      linkedTools: ['coolingtower', 'waterindex'],
      sources: ['Nalco Water Handbook (2nd ed.) — Cooling chapters', 'Cooling Technology Institute (CTI) bulletins'],
      modules: [
        { id:'m1', title:'How a cooling tower works', duration:'40 min',
          summary:'Counterflow, crossflow, induced vs forced draft. The hot side, the cold side and the evaporator in between.',
          sections:['Wet-bulb approach','Range and approach','Counterflow vs crossflow fill'] },
        { id:'m2', title:'The mass balance', duration:'45 min',
          summary:'E + D + B = M. Cycles = M / B. Numbers operators must know cold.',
          sections:['Evaporation ≈ 1 % of recirc per 5.5 °C ΔT','Drift 0.001 – 0.2 %','Cycles 3–8 typical'] },
        { id:'m3', title:'Why cycles matter', duration:'40 min',
          summary:'Higher cycles = less make-up + chemical, but at a scaling/corrosion price.',
          sections:['Doubling cycles halves blowdown','LSI/RSI at 5× cycles','Practical economic optimum'] },
        { id:'m4', title:'Plant walk', duration:'15 min',
          summary:'Use the Hadron Cooling Tower calc on a real installation.',
          sections:['Capture circulation, ΔT, makeup conductivity','Run the calc → cycles, blowdown, evaporation','Compare LSI before / after a cycle change'] }
      ]
    },

    {
      id: 'c-cool-201', trackId: 'track-cooling', code: 'COOL-201',
      title: 'Scale, Corrosion & Biofouling Control',
      level: 'Intermediate', duration: '5 hrs',
      summary: 'The chemical programme: scale inhibitors, corrosion inhibitors, biocides — and how to dose them via the Hadron Coagulants/Dosage tool.',
      outcomes: [
        'Calculate LSI, Ryznar and Puckorius',
        'Specify a phosphonate / polymer scale programme',
        'Pick a corrosion inhibitor for steel + Cu/Zn',
        'Run an oxidising + non-oxidising biocide rotation'
      ],
      prereqs: ['c-cool-101', 'c-pot-101'],
      linkedTools: ['coolingtower', 'dosage', 'converters'],
      sources: ['Nalco Water Handbook', 'AWT Technical Reference', 'Hadron LSI Calc'],
      modules: [
        { id:'m1', title:'Scale chemistry & control', duration:'60 min',
          summary:'CaCO₃, CaSO₄, silica, calcium phosphate. Indices vs reality.',
          sections:['LSI / RSI / Puckorius / S&DSI','Threshold inhibitors (HEDP, PBTC, AA-AMPS)','Dispersants for silt + iron'] },
        { id:'m2', title:'Corrosion control', duration:'60 min',
          summary:'Mild steel + Cu + galvanised — three different problems, often one programme.',
          sections:['Anodic / cathodic / mixed inhibitors','Phosphate-zinc, all-organic, molybdate','Tolytriazole for Cu'] },
        { id:'m3', title:'Microbiological control', duration:'60 min',
          summary:'Algae, slime, sulfate-reducers and Legionella — and the rotation that keeps them in check.',
          sections:['Oxidising biocides: Cl₂, Br₂, ClO₂','Non-oxidising: isothiazolone, glut, DBNPA','Legionella risk assessment','Dispersants and clean-out hits'] },
        { id:'m4', title:'On-site testing & dosing', duration:'45 min',
          summary:'Daily / weekly tests, pump turn-down, alarm thresholds.',
          sections:['Conductivity-based blowdown','ORP-based biocide','Inhibitor residual via fluorescent tracer'] }
      ]
    },

    {
      id: 'c-cool-202', trackId: 'track-cooling', code: 'COOL-202',
      title: 'Cooling System Dynamics: Water Balance, Cycles & Control',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'Every chemical decision on a cooling tower rests on one thing: knowing where the water goes. This course teaches the water balance of an open recirculating system — how evaporation concentrates the dissolved solids, how cycles of concentration are calculated two different ways, and how makeup, blowdown, drift and leakage fit together. It covers the holding time index that governs how long a dosed chemical survives, and the ion-by-ion cycles check that reveals scale forming inside the system before anyone sees it. It includes a full worked water balance using the cooling tower calculator.',
      outcomes: [
        'Distinguish once-through, closed recirculating and open recirculating cooling systems',
        'Calculate the range, approach and evaporation rate of a cooling tower and judge its performance',
        'Determine cycles of concentration from water chemistry and from measured flows',
        'Calculate makeup, total blowdown, controlled blowdown, drift and holding time index',
        'Diagnose calcium carbonate precipitation by comparing cycles of concentration ion by ion',
        'Explain how leakage, drift and ambient air conditions limit the cycles a system can hold'
      ],
      prereqs: ['c-cool-201'],
      linkedTools: ['coolingtower','converters','dosage'],
      sources: [
        'The Nalco Water Handbook, 3rd ed. (Ed. Flynn, McGraw-Hill) — Ch.14, Cooling System Dynamics (Eqs. 14.7–14.20, Tables 14.1, 14.3)'
      ],
      modules: [
        { id:'m1', title:'The three cooling system types', duration:'35 min',
          summary:'Once-through, closed recirculating and open recirculating systems, and why only one concentrates solids.',
          sections:['Once-through systems','Closed recirculating systems','Open recirculating systems and cooling lakes'] },
        { id:'m2', title:'The tower variables: range, approach & evaporation', duration:'45 min',
          summary:'Recirculation rate, the range, approach temperature as a performance measure, and the evaporation equation.',
          sections:['Recirculation rate and the range','Approach temperature and tower performance','Calculating the evaporation rate'] },
        { id:'m3', title:'Cycles of concentration', duration:'45 min',
          summary:'Two ways to calculate cycles, the economics of cycling up, and the makeup and blowdown relationships.',
          sections:['Two ways to calculate cycles','The economics of cycling up','Makeup and blowdown'] },
        { id:'m4', title:'Drift, leakage, volume & holding time', duration:'40 min',
          summary:'What is inside total blowdown, why leakage caps cycles, and the holding time index that governs chemical residence.',
          sections:['Drift and what total blowdown contains','Leakage and its limit on cycles','System volume, time per cycle and holding time index'] },
        { id:'m5', title:'The ion balance & a full worked example', duration:'45 min',
          summary:'Reading cycles ion by ion to detect precipitation, a complete worked water balance, and ambient air effects.',
          sections:['Reading cycles ion by ion','Worked example: a full water balance','Ambient air and other tower problems'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'12 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['12 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'Which cooling system type concentrates dissolved solids because water is lost as pure vapour?',
              options:['Once-through','Open recirculating','Closed recirculating','All three equally'],
              answer:1,
              explain:'Only the open recirculating system evaporates water to cool it. Pure water vapour leaves, the dissolved solids stay behind and concentrate — which is why cycles of concentration, blowdown and scale control exist at all.' },
            { q:'The “range” of a cooling tower is:',
              options:['The difference between the cold basin water and the wet-bulb temperature','The width of the tower','The hot return water temperature minus the cold basin water temperature','The recirculation rate'],
              answer:2,
              explain:'Range (ΔT) = T₁ − T₂, the temperature drop of the water passing through the tower. It is used to approximate the evaporation rate. Do not confuse it with approach.' },
            { q:'Approach temperature measures tower efficiency as:',
              options:['The cold basin water temperature minus the ambient wet-bulb temperature','The hot water temperature minus the cold water temperature','The dry-bulb minus the wet-bulb temperature','The fan power divided by the flow'],
              answer:0,
              explain:'Approach is how closely the cold basin water “approaches” the ambient wet-bulb temperature. Water cooling towers are economically designed for an approach of 3–6 °C (5–10 °F); a widening approach signals the tower is underperforming.' },
            { q:'In the evaporation equation, why is the evaporation factor f typically taken as 0,85 rather than 1,0?',
              options:['Because pumps are only 85% efficient','Because some heat is always rejected as sensible heat, not by evaporation','Because towers run 85% of the time','Because 15% of the water leaks'],
              answer:1,
              explain:'If all heat loss were latent (evaporative), f would be 1. But sensible heat loss — by conduction through piping and to the air — can be as much as 20% of the total, so a rule of thumb of f = 0,85 gives a better approximation. Ambient temperature and humidity can push f as low as 0,5.' },
            { q:'The most reliable way to determine cycles of concentration on an operating tower is:',
              options:['Reading the pump nameplate','Dividing the concentration of an ion in the recirculating water by its concentration in the makeup','Guessing from the tower size','Measuring the fan speed'],
              answer:1,
              explain:'CR = C_recirc ÷ C_makeup for any conservative ion (Eq. 14.9). It can also be found from flows as CR = MU ÷ BD (Eq. 14.10), but flows are often unmetered or inaccurate, whereas a water analysis is easy to obtain.' },
            { q:'As cycles of concentration increase from 1 to about 6, the makeup water demand:',
              options:['Rises steeply','Falls steeply, then falls only marginally above about 6 cycles','Stays constant','Falls to zero'],
              answer:1,
              explain:'Most of the water saving is won by the sixth cycle; beyond that the reduction in makeup is small. The absolute floor on makeup is the evaporation rate — makeup can never be less than what evaporates.' },
            { q:'Total blowdown (BD) in the Nalco relationships:',
              options:['Excludes drift and leakage','Equals the makeup rate','Includes controlled blowdown plus drift plus leakage','Is always metered'],
              answer:2,
              explain:'BD = BDᴄ + D + L (Eq. 14.14). Total blowdown is every route by which concentrated water leaves the system. The controlled blowdown the operator actually valves is therefore BDᴄ = BD − D − L — a distinction that catches people out.' },
            { q:'If the tower specification is unavailable, drift is estimated as:',
              options:['0,01% of the recirculation rate','10% of the recirculation rate','1% of the makeup','Equal to the evaporation rate'],
              answer:0,
              explain:'D = 0,0001 × R (Eq. 14.18), i.e. 0,01% of recirculation. Modern drift eliminators achieve as low as 0,0005%, while older ones range 0,005–0,02% — always prefer the tower specification if you can find it.' },
            { q:'The holding time index (HTI) of a cooling system tells you:',
              options:['How long the pump runs per day','The time for a chemical to dilute to half its original concentration','How long the tower takes to fill','The time for one pass around the loop'],
              answer:1,
              explain:'HTI = 0,693 × V ÷ BD (Eq. 14.20) — the half-life of any chemical added to the system. A long HTI means a dosed chemical persists far longer, which changes how you schedule biocide and inhibitor feeds. Time per cycle (t = V ÷ R) is a different thing entirely.' },
            { q:'A tower runs at R = 500 m³/h with a range of 8 °C. Using f = 0,85, the evaporation rate is approximately:',
              options:['0,62 m³/h','62 m³/h','6,2 m³/h','16 m³/h'],
              answer:2,
              explain:'E = f × R × ΔT × Cp ÷ λ = 0,85 × 500 × 8 × 4,1868 ÷ 2300 ≈ 6,19 m³/h, roughly 1,2% of recirculation. Sanity-check: evaporation is typically around 1% of recirculation per 5,5 °C of range.' },
            { q:'You calculate cycles for each ion and find the cycles for calcium and alkalinity are more than 10% below the cycles for magnesium. This most likely means:',
              options:['The magnesium result is wrong','Calcium carbonate is precipitating in the system','The tower is running too few cycles','Chlorination has increased'],
              answer:1,
              explain:'In a balanced system all ions concentrate equally. Calcium and alkalinity falling behind magnesium means they are leaving the water — precipitating as CaCO₃. Check the feeds first though: acid dosing depresses alkalinity cycles, sulfuric acid raises sulfate cycles, and chlorination raises chloride cycles.' },
            { q:'Large miscellaneous losses of recirculating water (leakage) in a plant typically:',
              options:['Improve chemical treatment','Have no effect on cycles','Increase the holding time index','Prevent operation above about 1,2 to 1,5 cycles of concentration'],
              answer:3,
              explain:'Leakage is uncontrolled loss of concentrated water. Heavy leakage — gland cooling, floor washing, valve leaks — forces so much fresh makeup in that the system cannot cycle up, which severely limits economical chemical treatment and wastes water.' }
          ] }
      ]
    },

    {
      id: 'c-cool-301', trackId: 'track-cooling', code: 'COOL-301',
      title: 'Optimisation & Cycle Management',
      level: 'Advanced', duration: '3 hrs',
      summary: 'Pushing cycles up, minimising blowdown chemistry-cost, side-stream filtration and reuse of blowdown.',
      outcomes: [
        'Build a cost model: cycles vs water + chemical + boiler',
        'Specify side-stream sand or media filtration',
        'Reuse cooling blowdown as RO feed',
        'Audit the chemical programme'
      ],
      prereqs: ['c-cool-201'],
      linkedTools: ['coolingtower', 'waterindex', 'lims'],
      sources: ['Nalco Water Handbook — sustainability chapters'],
      modules: [
        { id:'m1', title:'Pushing cycles up', duration:'50 min',
          summary:'How far can you go before something starts depositing or pitting?',
          sections:['Limits by hardness, alkalinity, silica, chloride','LSI cap & polymer support','Acid feed for cycle bump'] },
        { id:'m2', title:'Side-stream filtration', duration:'40 min',
          summary:'Sand, multimedia, or hydrocyclone — usually 5–10 % of recirc.',
          sections:['Hydrocyclone for grit','Multimedia for slime/scale','Backwash regime'] },
        { id:'m3', title:'Blowdown reuse', duration:'40 min',
          summary:'When the blowdown is good enough to feed the RO or another tower.',
          sections:['Quality screen','Pre-treatment for second pass','Operator practice'] },
        { id:'m4', title:'Chemical programme audit', duration:'25 min',
          summary:'A repeatable annual audit format.',
          sections:['Cost per cooled MJ','Inhibitor residual KPI','Microbial KPI'] }
      ]
    },

    {
      id: 'c-cool-302', trackId: 'track-cooling', code: 'COOL-302',
      title: 'Cooling System Deposition & Corrosion',
      level: 'Advanced', duration: '5 hrs',
      summary: 'Scale and corrosion are not two problems but one coupled problem: corroded metal is rougher, so it holds scale better; scale shields metal, so corrosion accelerates beneath it. This Advanced course opens up both. It traces how scale nucleates, grows, ages and adheres, and the chemistry and hydraulics that drive it — concentration, pH and CO₂ stripping, inverse solubility, ionic strength, ion pairing, coprecipitation and flow velocity. It then treats the scaling indices honestly, showing where they mislead on cooling towers. Finally it covers the corrosion cell, carbon steel and copper alloy behaviour, under-deposit and microbiologically influenced attack, and the coupon rates that define acceptable performance.',
      outcomes: [
        'Explain how mineral scale nucleates, grows, ages and adheres to a metal surface',
        'Identify the chemical, thermal and hydraulic factors that drive deposition in a cooling system',
        'Distinguish inversely from directly soluble minerals and predict where each will deposit',
        'Calculate and interpret the Langelier and Ryznar indices, and state the limits of both',
        'Describe the corrosion cell and the characteristic behaviour of carbon steel and copper alloys',
        'Judge corrosion coupon results against accepted rates and explain the scale–corrosion coupling'
      ],
      prereqs: ['c-cool-202'],
      linkedTools: ['waterindex','coolingtower','lims'],
      sources: [
        'The Nalco Water Handbook, 3rd ed. (Ed. Flynn, McGraw-Hill) — Ch.15, Cooling Water Deposition (Eqs. 15.3–15.4)',
        'The Nalco Water Handbook, 3rd ed. (Ed. Flynn, McGraw-Hill) — Ch.16, Cooling System Corrosion'
      ],
      modules: [
        { id:'m1', title:'How scale forms', duration:'45 min',
          summary:'Nucleation and crystal growth, the kinetic versus thermodynamic question, and how scale ages and adheres.',
          sections:['Nucleation and crystal growth','Kinetics versus thermodynamics','Ageing, adherence and the corrosion link'] },
        { id:'m2', title:'What drives deposition', duration:'50 min',
          summary:'Concentration and pH, temperature and inverse solubility, and the solubility effects that work in your favour.',
          sections:['Concentration, pH and CO₂ stripping','Temperature and inverse solubility','Ionic strength, ion pairing and coprecipitation'] },
        { id:'m3', title:'Predicting scale: the indices and their limits', duration:'45 min',
          summary:'The Langelier and Ryznar indices, a worked example where they disagree, and how to use them responsibly.',
          sections:['The Langelier and Ryznar indices','Worked example: when the indices disagree','Why indices mislead on cooling towers'] },
        { id:'m4', title:'Cooling system corrosion', duration:'50 min',
          summary:'The corrosion cell, carbon steel behaviour and pH, and copper alloys with their galvanic consequences.',
          sections:['The corrosion cell','Carbon steel','Copper alloys and galvanic effects'] },
        { id:'m5', title:'Deposits, attack & monitoring', duration:'45 min',
          summary:'Under-deposit and microbiologically influenced corrosion, flow velocity, and judging coupon results.',
          sections:['Under-deposit and microbiologically influenced corrosion','Flow velocity and hydrodynamics','Monitoring: coupons and acceptable rates'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'12 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['12 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'Scale inhibitors work by affecting:',
              options:['Only the water temperature','The formation of initial molecule clusters, or the growing crystal steps','The pump flow rate','The colour of the deposit'],
              answer:1,
              explain:'Scale grows by nucleation into clusters, then outward in molecule-thick layers called terraces, with new crystals forming along the steps at each terrace edge. Inhibitors intervene at one or both points — nucleation, or step growth.' },
            { q:'Quartz has a much lower solubility than amorphous silica, yet quartz never forms in a cooling system. This illustrates:',
              options:['That thermodynamics always wins','A measurement error','That the kinetic rate of formation, not just the energy, governs what actually deposits','That silica cannot scale'],
              answer:2,
              explain:'Thermodynamics says which state has lower energy; kinetics says how fast it gets there. Quartz is favoured thermodynamically but forms so slowly it never appears. Control system conditions to reduce the driving force, and use inhibitors to slow the kinetic rate.' },
            { q:'Compared with freshly precipitated scale, aged scale is generally:',
              options:['Softer and easier to remove','Harder, denser and more adherent','Unchanged','More porous'],
              answer:1,
              explain:'Rapidly precipitated scale is relatively porous and removable with little mechanical effort, but ageing — by dissolution, redeposition and regrowth — hardens and densifies it. Ageing is accelerated on heat transfer surfaces, which is exactly where you least want it.' },
            { q:'Why does adherent scale form more readily on a corroding surface?',
              options:['Corrosion raises the pH','Because surface roughness is a primary factor in adherence, and corrosion products mix with the scale','Corroding metal is hotter','It does not — corrosion prevents scale'],
              answer:1,
              explain:'Microscopic surface roughness, natural or produced by corrosion, increases scale adherence, and corrosion by-products mix into the forming scale and increase adhesion. Easily corroded metals therefore accumulate significantly more deposit than metals that do not corrode.' },
            { q:'An inversely soluble mineral — one less soluble at high temperature — will tend to precipitate:',
              options:['In the cooling tower fill','In the heat exchangers','In the makeup line','Nowhere'],
              answer:1,
              explain:'Inversely soluble minerals drop out where it is hot: the heat exchangers. Directly soluble minerals, being less soluble when cold, tend instead to precipitate in the cooling tower fill. Knowing which you have tells you where to look.' },
            { q:'A high concentration of non-precipitating ions such as sodium, potassium and chloride will:',
              options:['Always cause immediate scaling','Have no effect','Extend the solubility of some scaling salts such as calcium sulfate','Lower the pH to 4'],
              answer:2,
              explain:'High TDS from ions that do not themselves precipitate raises ionic strength and extends the solubility of scaling salts like CaSO₄, so high-TDS systems benefit most from this effect. High suspended solids do the opposite — they add nucleation sites and increase scale potential.' },
            { q:'Adding magnesium chloride to water increases calcium carbonate solubility because:',
              options:['Magnesium forms soluble carbonate and bicarbonate ion pairs, freeing calcium','Chloride destroys carbonate','It lowers the temperature','Magnesium precipitates the calcium'],
              answer:0,
              explain:'This is ion pairing: Mg²⁺ forms weak, soluble associations as MgCO₃ and Mg(HCO₃)₂, which raises the solubility of Ca²⁺. It is the opposite of the common ion effect — and it is one of the effects the simple scaling indices ignore entirely.' },
            { q:'In a cooling tower, the contact between air and water strips CO₂ from carbonate-buffered water. The consequence is:',
              options:['pH falls, causing corrosion only','pH rises and the bicarbonate/carbonate balance shifts, promoting scale if cycles and pH are uncontrolled','Nothing measurable','Alkalinity is destroyed'],
              answer:1,
              explain:'Stripping CO₂ drives the pH up and pushes bicarbonate toward carbonate. Since scaling potential for calcium carbonate, calcium and zinc phosphates, zinc hydroxide and magnesium silicate all rise with pH, uncontrolled cycles plus this shift means scale.' },
            { q:'Water velocity below about 0,6 m/s (2 ft/s) in exchanger tubes is a problem because:',
              options:['It wastes pump energy only','It causes erosion corrosion','Laminar flow creates a low-velocity boundary layer, reducing heat transfer, raising surface temperature and cutting scale removal by shear','It increases the drift rate'],
              answer:2,
              explain:'Low velocity produces non-turbulent flow and a stagnant boundary layer next to the metal: convective heat transfer falls, skin temperature rises, and the shear that would otherwise slough off forming scale disappears. Deposition is the steady-state balance of formation against removal.' },
            { q:'A cooling water has pH 8,3 and the laboratory reports pHs = 7,5. Calculating both indices gives:',
              options:['LSI = +0,8 (scaling) and RSI = 6,7 (corrosive) — the two indices disagree','LSI = −0,8 and RSI = 6,7, both corrosive','LSI = +0,8 and RSI = 5,3, both scaling','Neither index can be calculated'],
              answer:0,
              explain:'LSI = pH − pHs = 8,3 − 7,5 = +0,8, which is above zero and so predicts scaling. RSI = 2 × pHs − pH = 15,0 − 8,3 = 6,7, which is above 6,0 and so predicts corrosion. Sanity-check: the arithmetic is right and both are legitimate — they simply disagree, which is exactly why these indices are directional at best.' },
            { q:'The Nalco Handbook cautions that simple scaling indices should seldom be relied on for cooling towers because they:',
              options:['Are difficult to calculate','Require expensive instruments','Ignore or severely limit temperature and ionic strength effects, ignore scales other than CaCO₃, and ignore ion pairing','Only work above pH 10'],
              answer:2,
              explain:'The indices were developed for simpler waters. They address calcium carbonate alone, handle temperature and ionic strength poorly, and take no account of ion pairing — so on a concentrated, high-TDS tower water they can be badly misleading. Use them for direction; confirm against the treatment programme.' },
            { q:'Generally accepted corrosion rates for a well-controlled cooling system are:',
              options:['Carbon steel < 30 mpy; copper alloys < 2 mpy','Carbon steel < 3 mpy (76 µm/y); copper alloys < 0,2 mpy (5 µm/y)','Both metals < 10 mpy','There are no accepted rates'],
              answer:1,
              explain:'Properly controlled programmes hold carbon steel below about 3 mpy (76 µm/y). Copper alloys, being far more corrosion resistant, are held below 0,2 mpy (5 µm/y) — achievable only if the surfaces are kept clean.' }
          ] }
      ]
    },

    /* ──────────────────  BOILER WATER  ────────────────── */

    {
      id: 'c-boil-101', trackId: 'track-boiler', code: 'BOIL-101',
      title: 'Boiler Water Chemistry',
      level: 'Foundation', duration: '3 hrs',
      summary: 'Hardness, alkalinity, dissolved oxygen, silica — why each matters and what the ABMA / ASME limits look like at different drum pressures.',
      outcomes: [
        'List the four main boiler-water enemies',
        'Read an ABMA recommended-limits table',
        'Apply correct sample handling for boiler chemistry',
        'Recognise carry-over symptoms'
      ],
      prereqs: ['c-pot-101'],
      linkedTools: ['waterindex', 'converters'],
      sources: ['ABMA Recommended Boiler Water Limits', 'ASME Consensus on Boiler Water Quality', 'Nalco Water Handbook — Boilers'],
      modules: [
        { id:'m1', title:'The four enemies', duration:'40 min',
          summary:'Hardness, oxygen, silica, organics. What each one does to a boiler.',
          sections:['Hardness → scale → tube failure','O₂ → pitting','Silica → turbine deposits','Organics → foaming, carry-over'] },
        { id:'m2', title:'Limits by pressure', duration:'45 min',
          summary:'Low-pressure (< 20 bar) vs medium (20–40) vs high (> 40). Different rules.',
          sections:['Conductivity, TDS, silica caps','Alkalinity vs hydroxide alkalinity','pH targets'] },
        { id:'m3', title:'Sampling boiler water', duration:'30 min',
          summary:'Cooled samples, copper coil, isokinetic. Get this wrong and the data is useless.',
          sections:['Cooled-sample station','Conductivity measurement post-cation column','Storage and hold times'] }
      ]
    },

    {
      id: 'c-boil-201', trackId: 'track-boiler', code: 'BOIL-201',
      title: 'Pretreatment, Internal Treatment & Steam',
      level: 'Intermediate', duration: '5 hrs',
      summary: 'Softening, dealkalisation, demineralisation, polymeric and phosphate-based internal programmes, deaeration, condensate amines.',
      outcomes: [
        'Specify softening vs dealkaliser vs demin train',
        'Pick a phosphate vs polymer internal programme',
        'Set a deaerator pressure / temperature',
        'Choose neutralising amines for condensate pH'
      ],
      prereqs: ['c-boil-101'],
      linkedTools: ['boiler', 'dosage', 'converters'],
      sources: ['Nalco Water Handbook — Boilers / Steam', 'EPRI feedwater chemistry'],
      modules: [
        { id:'m1', title:'External pretreatment', duration:'60 min',
          summary:'Softener, dealkaliser, demin, RO + EDI.',
          sections:['Cation softener — Na-form, capacity','Strong-acid + weak-base demin','RO + EDI for HP boilers'] },
        { id:'m2', title:'Internal treatment', duration:'60 min',
          summary:'Coordinated phosphate, all-volatile, polymer chelates.',
          sections:['Phosphate-pH curves','AVT(R) / AVT(O) for HP','Polymer dispersants'] },
        { id:'m3', title:'Deaeration & oxygen scavengers', duration:'45 min',
          summary:'Mechanical removal then chemical mop-up.',
          sections:['Tray vs spray deaerators','Sulfite, hydrazine, carbohydrazide, DEHA','Residual O₂ targets ppb'] },
        { id:'m4', title:'Steam, condensate & amines', duration:'45 min',
          summary:'Volatile vs non-volatile alkalinity, neutralising vs filming amines.',
          sections:['Cyclohexylamine, morpholine, DEAE','Amine distribution coefficient','Filming amines (octadecylamine)'] }
      ]
    },

    {
      id: 'c-boil-202', trackId: 'track-boiler', code: 'BOIL-202',
      title: 'Boiler Mass Balance, Cycles & Blowdown Optimisation',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'Steam leaves the boiler pure; every dissolved solid it carried in stays behind. Blowdown is the deliberate loss of water that stops that concentration running away into scale, corrosion and dirty steam — and every kilogram of it costs fuel. This course teaches the boiler mass balance from first principles, the cycles of concentration and percent blowdown relationships, and the two sampling mistakes that silently corrupt every calculation. It closes on optimisation: finding the species that actually limits your cycles, and what it is worth to relieve it. Includes a full worked example showing how reducing makeup silica cuts blowdown by a quarter.',
      outcomes: [
        'Explain why boiler blowdown is necessary and distinguish continuous, surface and bottom blowdown',
        'Construct a boiler mass balance linking makeup, feedwater, condensate return, steam and blowdown',
        'Calculate percent blowdown, percent makeup and cycles of concentration from flows or from water chemistry',
        'Draw correct feedwater and boiler water samples, and explain what each sampling error does to the result',
        'Identify the species limiting the maximum concentration ratio and quantify the blowdown saving from relieving it',
        'State the practical cycles ceiling for industrial boilers and describe blowdown heat recovery'
      ],
      prereqs: ['c-boil-201'],
      linkedTools: ['boiler','converters','lims'],
      sources: [
        'The Nalco Water Handbook, 3rd ed. (Ed. Flynn, McGraw-Hill) — Ch.9, Boiler Systems (Eqs. 9.1–9.9, Table 9.1)',
        'The Nalco Water Handbook, 3rd ed. (Ed. Flynn, McGraw-Hill) — Ch.11, Boiler Feedwater Treatment (Table 11.5)'
      ],
      modules: [
        { id:'m1', title:'Why boilers blow down', duration:'35 min',
          summary:'How steam generation concentrates solids, what blowdown prevents, and the three kinds of blowdown.',
          sections:['Steam leaves, solids stay','What blowdown prevents — and what the limits are','Continuous, surface and bottom blowdown'] },
        { id:'m2', title:'The boiler mass balance', duration:'45 min',
          summary:'Total makeup and the three loss streams, the feedwater equation, and steam versus returned condensate.',
          sections:['Total makeup and the loss streams','Feedwater, condensate and the deaerator','Steam and returned condensate'] },
        { id:'m3', title:'Cycles and percent blowdown', duration:'50 min',
          summary:'The feedwater convention, the percentage and cycles equations, and calculating blowdown from steam flow.',
          sections:['Percent blowdown and percent makeup','Cycles of concentration','Calculating blowdown from steam flow'] },
        { id:'m4', title:'Sampling: the two mistakes that ruin the numbers', duration:'40 min',
          summary:'Where the feedwater sample must be taken, why boiler water must be neutralised, and when TDS methods fail.',
          sections:['The feedwater sample','The boiler water sample','When TDS methods do not apply'] },
        { id:'m5', title:'Optimising blowdown: the limiting species', duration:'50 min',
          summary:'Maximum concentration ratio, a worked silica-versus-TDS example, the 50-cycle cap and heat recovery.',
          sections:['Maximum concentration ratio','Worked example: silica versus TDS','The cycles ceiling and blowdown heat recovery'] },
        { id:'m6', title:'Knowledge check', duration:'15 min',
          summary:'12 interactive multi-choice questions covering modules m1–m5. 70% to pass.',
          sections:['12 interactive MCQ spanning the prior modules'],
          quiz:[
            { q:'Why does boiler water become increasingly concentrated in dissolved solids?',
              options:['Because makeup water is added','Because the vapour leaving the boiler is essentially pure, leaving dissolved solids behind','Because chemicals are dosed','Because the boiler leaks'],
              answer:1,
              explain:'As vapour leaves the boiling water, the dissolved solids originally in the water are left behind. Concentration is therefore inevitable, and blowdown is the deliberate removal of that concentrated water.' },
            { q:'If highly concentrated boiler water is not removed, the consequences are:',
              options:['Scale deposition, corrosion, and problems with steam quality or purity','Only a higher water bill','Reduced fuel use','Nothing measurable'],
              answer:0,
              explain:'Beyond a certain concentration, further concentration causes scale or deposits, corrosion, or degraded steam quality and purity — which is precisely why the concentrated water must be blown down.' },
            { q:'The continuous blowdown line of a boiler is designed to:',
              options:['Remove particulate matter efficiently','Remove soluble species efficiently, and is not optimised for particulate','Vent steam','Dose chemicals'],
              answer:1,
              explain:'Continuous blowdown removes soluble species efficiently but is not optimised for particulate. Surface blowdown removes some particulate but is not isokinetically designed for two-phase liquid-and-solids material — which is why intermittent manual blowdown of the mud drum is also practised.' },
            { q:'Total makeup to a boiler system equals:',
              options:['Steam flow only','Blowdown only','Steam losses + condensate losses + boiler water losses','Feedwater minus steam'],
              answer:2,
              explain:'TM = SL + CL + BL (Eq. 9.1). Makeup must replace every stream leaving the system — steam that is not returned, condensate that is lost, and the boiler water deliberately blown down.' },
            { q:'Boiler feedwater is made up of:',
              options:['Makeup + returned condensate + deaerator heating steam − deaerator vent','Makeup only','Steam + blowdown','Condensate only'],
              answer:0,
              explain:'FW = MU + RC + DA − V (Eq. 9.8). Makeup and returned condensate combine with deaerator steam to become feedwater, less whatever is lost out of the deaerator vent.' },
            { q:'In the Nalco convention, blowdown and makeup are expressed as a percentage of:',
              options:['Steam flow','Feedwater','Makeup','Boiler volume'],
              answer:1,
              explain:'%BD = 100 × BD/FW and %MU = 100 × MU/FW (Eqs. 9.2, 9.3). They can be calculated as a percentage of steam flow instead, but the feedwater convention is used throughout — and it differs from the cooling tower convention, so do not mix them.' },
            { q:'Cycles of concentration in a boiler relate to percent blowdown as:',
              options:['COC = %BD / 100','COC = 100 − %BD','COC = 100 / %BD','COC = %BD × 100'],
              answer:2,
              explain:'COC = 100/%BD (Eq. 9.6) — the cycles are the reciprocal of the percent blowdown. So 5% blowdown corresponds to 20 cycles, and 3,75% blowdown to 26,7 cycles.' },
            { q:'A boiler produces 10 000 kg/h of steam at 20 cycles of concentration. The blowdown rate is:',
              options:['500 kg/h','526 kg/h','2 000 kg/h','200 kg/h'],
              answer:1,
              explain:'BD = S/(COC − 1) = 10 000/19 = 526,3 kg/h (Eq. 9.7c). Sanity-check with Eq. 9.7d: FW = S + BD = 10 526,3 kg/h, so %BD = 100 × 526,3/10 526,3 = 5,0%, and COC = 100/5 = 20 ✓.' },
            { q:'Calculating blowdown as BD = FW − S is discouraged because:',
              options:['It is not a valid equation','A relatively small number is derived from the difference of two larger numbers, taken from two meters that may both be out of calibration','Steam flow cannot be measured','It only works above 50 cycles'],
              answer:1,
              explain:'Equation 9.7f is valid but carries a high error. Prefer BD = S/(COC − 1), since steam flow is usually metered and cycles are easily obtained from a water analysis — blowdown itself is rarely metered.' },
            { q:'When taking a feedwater sample for a percent blowdown calculation, the sample must be drawn:',
              options:['Before any chemicals are added','After all chemicals have been added to the system','From the steam header','From the makeup line'],
              answer:1,
              explain:'The feedwater sample must be taken after all chemicals have been added. Sampling upstream of chemical addition understates the feedwater solids and therefore falsifies the percent blowdown.' },
            { q:'Why must a boiler water sample be neutralised before its conductivity is measured?',
              options:['To prevent the meter corroding','Because hydrate alkalinity greatly increases the sample conductivity, which would understate TDS and give a falsely low percent blowdown','To remove suspended solids','To cool the sample'],
              answer:1,
              explain:'Hydrate (O) alkalinity greatly increases conductivity. An un-neutralised sample reads high in apparent TDS, so %BD = 100 × TDS_FW/TDS_BD comes out low — and the operator wrongly believes the boiler is cycling harder than it really is.' },
            { q:'Makeup contains 150 mg/L TDS and 3 mg/L silica; feedwater 75 mg/L TDS and 1,5 mg/L silica. Boiler limits are 2000 mg/L TDS and 30 mg/L silica. The maximum concentration ratio is:',
              options:['26,7, limited by TDS','20,0, limited by silica','30,0, limited by silica','2000, limited by TDS'],
              answer:1,
              explain:'TDS allows 2000/75 = 26,7 cycles, but silica allows only 30/1,5 = 20,0. The lower figure governs, so silica is the controlling species: max CR = 20, i.e. 5% blowdown. Reducing makeup silica to 2 mg/L would lift silica to 30 cycles and hand the limit to TDS at 26,7 — cutting blowdown to 3,75%.' }
          ] }
      ]
    },

    {
      id: 'c-boil-301', trackId: 'track-boiler', code: 'BOIL-301',
      title: 'Layup, Cleaning & Failure Analysis',
      level: 'Advanced', duration: '3 hrs',
      summary: 'Wet vs dry layup, off-line cleaning chemistries, deposit weight density, and metallographic failure analysis.',
      outcomes: [
        'Design wet and dry layup procedures',
        'Specify acid-clean vs chelant-clean vs alkaline',
        'Read a deposit weight-density report',
        'Diagnose caustic gouging, hydrogen damage, fatigue'
      ],
      prereqs: ['c-boil-201'],
      linkedTools: ['boiler', 'lims', 'converters'],
      sources: ['Nalco Water Handbook — Cleaning chapter', 'NACE corrosion handbook'],
      modules: [
        { id:'m1', title:'Layup', duration:'40 min',
          summary:'Short, medium and long-term layup procedures.',
          sections:['Wet layup chemistry','Dry layup with N₂','Documentation & re-commissioning'] },
        { id:'m2', title:'Off-line cleaning', duration:'50 min',
          summary:'When and how to clean — including the safety case.',
          sections:['Inhibited HCl / formic / citric','Chelant cleaning (EDTA, NTA)','Alkaline boilout','Passivation'] },
        { id:'m3', title:'Deposit analysis & failures', duration:'40 min',
          summary:'How to read the post-mortem and prevent the next one.',
          sections:['DWD g/m² and cleaning trigger','Caustic gouging vs acid attack','Hydrogen damage','Steam-side oxide'] }
      ]
    },

    /* ──────────────────  REVERSE OSMOSIS  ────────────────── */

    {
      id: 'c-ro-101', trackId: 'track-ro', code: 'RO-101',
      title: 'Membrane Fundamentals',
      level: 'Foundation', duration: '3 hrs',
      summary: 'MF, UF, NF, RO — the size-exclusion ladder, driving forces, and basic membrane chemistry.',
      outcomes: [
        'Place MF / UF / NF / RO on the size-exclusion ladder',
        'Explain osmotic pressure and flux',
        'Describe spiral-wound vs hollow-fibre construction',
        'Read a membrane datasheet'
      ],
      prereqs: ['c-pot-101'],
      linkedTools: ['rocalc'],
      sources: ['Hydranautics Engineering Manual', 'AWWA M46 — RO/NF for Water Treatment'],
      modules: [
        { id:'m1', title:'Size exclusion ladder', duration:'40 min',
          summary:'From 0.1 µm bacteria down to 0.0001 µm sodium ion.',
          sections:['MF removes bacteria, particulates','UF removes viruses, macromolecules','NF removes hardness, NOM','RO removes monovalent ions'] },
        { id:'m2', title:'Driving forces', duration:'40 min',
          summary:'Pressure, concentration, electrical potential.',
          sections:['Osmotic pressure ≈ 0.7 bar/g/L NaCl','Net driving pressure (NDP)','Recovery vs rejection trade-off'] },
        { id:'m3', title:'Membrane chemistry & construction', duration:'45 min',
          summary:'Polyamide vs CA, spiral-wound vs hollow-fibre.',
          sections:['Thin-film composite (TFC) PA','Cellulose acetate (chlorine-tolerant)','8" vs 4" elements','Pressure-vessel arrangements'] },
        { id:'m4', title:'Reading a datasheet', duration:'15 min',
          summary:'Rated flow, % rejection, MTC, fouling factor.',
          sections:['Datasheet conditions are best-case','MTC and temperature correction','Fouling factor over 3 yr life'] }
      ]
    },

    {
      id: 'c-ro-201', trackId: 'track-ro', code: 'RO-201',
      title: 'RO System Design & Operation',
      level: 'Intermediate', duration: '5 hrs',
      summary: 'Array design, recovery vs concentration polarisation, energy recovery, daily operator practice.',
      outcomes: [
        'Design a 2-stage 75 % recovery array',
        'Calculate ΔP, recovery, salt passage',
        'Set a normalisation routine',
        'Apply the 15 % flux / 15 % salt / 10–15 % ΔP rules'
      ],
      prereqs: ['c-ro-101'],
      linkedTools: ['rocalc', 'lims'],
      sources: ['Hydranautics IMS Design', 'DuPont WAVE software documentation', 'Hadron RO Performance Calc'],
      modules: [
        { id:'m1', title:'Array design', duration:'60 min',
          summary:'2:1 array, 75 % recovery, 6-element vessels — the typical brackish design.',
          sections:['Recovery vs concentration polarisation','Element ΔP limits','Ratio between stages'] },
        { id:'m2', title:'Energy recovery', duration:'45 min',
          summary:'Pressure-exchanger devices in seawater RO.',
          sections:['ERI PX devices','Turbine-based recovery','SEC kWh/m³'] },
        { id:'m3', title:'Daily operation', duration:'60 min',
          summary:'CIP triggers, normalisation, fouling diagnosis.',
          sections:['Normalised flow, salt passage, ΔP','15 / 15 / 15 rules','Profiling first vs last vessel'] },
        { id:'m4', title:'Hadron RO calc walk-through', duration:'25 min',
          summary:'Calculate recovery and concentrate TDS for a real plant.',
          sections:['Capture feed flow, permeate flow, conductivities','Run RO Perf calc','Compare vs vendor-specified normalisation'] }
      ]
    },

    {
      id: 'c-ro-202', trackId: 'track-ro', code: 'RO-202',
      title: 'Pretreatment & Antiscalant Selection',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'Pretreatment is 80 % of RO success. SDI, chlorine removal, antiscalant chemistry and dose calculation.',
      outcomes: [
        'Run an SDI₁₅ test and read it',
        'Specify GAC vs SBS for de-chlorination',
        'Pick an antiscalant for the dominant scale',
        'Calculate antiscalant dose from feed flow + speciation'
      ],
      prereqs: ['c-ro-101'],
      linkedTools: ['rocalc', 'dosage', 'waterindex'],
      sources: ['Hydranautics TSB-107', 'AvistaTech antiscalant manuals'],
      modules: [
        { id:'m1', title:'Pretreatment train', duration:'45 min',
          summary:'Coagulation → MMF → cartridge → de-chlor → antiscalant.',
          sections:['Multimedia filter for SDI control','5 µm cartridge final guard','SBS or GAC for chlorine'] },
        { id:'m2', title:'SDI / MFI / fouling indices', duration:'45 min',
          summary:'SDI₁₅ < 3 for membrane life. How to test it and what to do if it\'s high.',
          sections:['SDI₁₅ apparatus & procedure','MFI as alternative','Cleaning vs upgrading pretreatment'] },
        { id:'m3', title:'Antiscalant chemistry', duration:'45 min',
          summary:'Phosphonates, polymers, blends. When phosphonate is wrong (Sr/Ba).',
          sections:['HEDP, ATMP, PBTC','Acrylates and copolymers','Vendor projection software'] },
        { id:'m4', title:'Dose calculation', duration:'25 min',
          summary:'Use the Hadron Coagulants / Dosage calc to verify the projected dose.',
          sections:['Feed flow × dose mg/L → kg/day','Adjust for product strength + density','Pump cal in mL/min'] }
      ]
    },

    {
      id: 'c-ro-301', trackId: 'track-ro', code: 'RO-301',
      title: 'Performance Monitoring & CIP',
      level: 'Advanced', duration: '4 hrs',
      summary: 'Normalisation theory, fouling diagnosis, CIP recipes, replacement planning.',
      outcomes: [
        'Normalise plant data to T = 25 °C, design pressure',
        'Diagnose biofouling vs scaling vs particulate',
        'Specify low-pH vs high-pH CIP and contact time',
        'Build a 3-year membrane replacement schedule'
      ],
      prereqs: ['c-ro-201', 'c-ro-202'],
      linkedTools: ['rocalc', 'lims'],
      sources: ['Hydranautics — CIP guide', 'DuPont — Membrane Cleaning bulletin'],
      modules: [
        { id:'m1', title:'Normalisation in detail', duration:'50 min',
          summary:'Why raw plant numbers lie, and how to extract the trend.',
          sections:['Temperature correction factor','Pressure correction','Flow correction'] },
        { id:'m2', title:'Fouling diagnosis', duration:'50 min',
          summary:'Pattern of ΔP / flow / salt-passage tells you the fouling type.',
          sections:['Biofouling: ΔP up, flow down, salt passage stable','Scaling: salt passage up, flow down','Particulate: ΔP up, salt passage stable','Oxidation: salt passage up only'] },
        { id:'m3', title:'CIP recipes', duration:'50 min',
          summary:'High-pH for organics/bio, low-pH for scale, sequence and timing.',
          sections:['High-pH: NaOH ± SDS or Na₄EDTA','Low-pH: HCl or citric','30–60 min recirculation','Soak overnight if heavy fouling'] },
        { id:'m4', title:'Replacement planning', duration:'30 min',
          summary:'Use last-stage element ΔP to predict end-of-life.',
          sections:['Last-stage ΔP rises first','Stagger replacement over 3 years','Used-element autopsy benefits'] }
      ]
    },

    /* ──────────────────  TREATMENT EQUIPMENT  ────────────────── */

    {
      id: 'c-eq-101', trackId: 'track-equipment', code: 'EQ-101',
      title: 'Pumps, Mixers & Dosing Systems',
      level: 'Foundation', duration: '4 hrs',
      summary: 'How a pump curve really works, mixer design, and the do-not-mess-this-up basics of chemical dosing.',
      outcomes: [
        'Read a pump curve & pick a duty point',
        'Design rapid + slow mixing G·t',
        'Specify diaphragm vs peristaltic dosing pumps',
        'Set anti-siphon and back-pressure valves correctly'
      ],
      prereqs: [],
      linkedTools: ['dosage', 'effluent', 'converters'],
      sources: ['Karassik — Pump Handbook', 'Watson Marlow / Grundfos / ProMinent manuals'],
      modules: [
        { id:'m1', title:'Pumps & curves', duration:'60 min',
          summary:'Centrifugal, positive-displacement, screw, piston. When each one is right.',
          sections:['Centrifugal Q-H curve','NPSH and cavitation','PD pumps for accurate dose'] },
        { id:'m2', title:'Mixing', duration:'60 min',
          summary:'G-value, axial vs radial impellers, baffles.',
          sections:['G·t targets for rapid + slow mix','Power number Np','Vortex prevention'] },
        { id:'m3', title:'Dosing systems', duration:'45 min',
          summary:'Tank, suction, pump, discharge, injection.',
          sections:['Diaphragm metering pumps','Peristaltic for difficult fluids','Calibration cylinders, pulsation dampeners'] },
        { id:'m4', title:'Practical: cal a dosing pump', duration:'30 min',
          summary:'Use the Hadron Coagulant / Chlorine calc to set up and verify a dosing pump.',
          sections:['Read calc target mL/min','Catch in measuring cylinder for 1 min','Adjust stroke / frequency'] }
      ]
    },

    {
      id: 'c-eq-201', trackId: 'track-equipment', code: 'EQ-201',
      title: 'Filters & Clarifiers',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'Sedimentation tanks, plate / lamella, sludge-blanket clarifiers, sand and multimedia filters.',
      outcomes: [
        'Size a clarifier on SOR + WSR',
        'Specify a multimedia filter bed',
        'Set a backwash sequence',
        'Trouble-shoot short-circuiting and ratholing'
      ],
      prereqs: ['c-pot-201', 'c-pot-202'],
      linkedTools: ['effluent'],
      sources: ['WRC Handbook — Ch B2 / B3', 'Kawamura — Integrated Design and Operation'],
      modules: [
        { id:'m1', title:'Sedimentation tanks', duration:'50 min',
          summary:'Rectangular, circular, plate / lamella settler, sludge-blanket clarifier.',
          sections:['Surface overflow rate','Detention time, weir loading','Sludge collector mechanics'] },
        { id:'m2', title:'Filter design', duration:'50 min',
          summary:'Bed depth, media, filtration rate, support gravels.',
          sections:['Filtration rate 5–15 m/h','UC < 1.5 ideally','Anthracite cap depth'] },
        { id:'m3', title:'Backwash systems', duration:'45 min',
          summary:'Air-scour, water-only, simultaneous, and the sequence.',
          sections:['Backwash rise rate 25–50 m/h','Air scour 50–80 m/h','Sequence: 1 min air → 2 min air+water → 5 min water'] },
        { id:'m4', title:'Trouble-shooting', duration:'25 min',
          summary:'Short-circuiting, jet-streaming, sludge build-up.',
          sections:['Tracer tests','Inlet baffle redesign','Sludge-pull rate'] }
      ]
    },

    {
      id: 'c-eq-202', trackId: 'track-equipment', code: 'EQ-202',
      title: 'Instruments & Calibration',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'pH, ORP, conductivity, turbidity, DO, residual Cl — the analyser ladder, plus calibration and validation.',
      outcomes: [
        'Specify a probe / analyser correctly',
        'Run a 2-point pH calibration',
        'Set conductivity cell-constant correction',
        'Manage a calibration register and audit trail'
      ],
      prereqs: ['c-eq-101'],
      linkedTools: ['lims', 'servicereport'],
      sources: ['Hach Analytical Procedures', 'Endress+Hauser Liquid Analytical', 'Hadron Calibration Reminders module'],
      modules: [
        { id:'m1', title:'pH / ORP / conductivity', duration:'50 min',
          summary:'How each electrode works, lifetime, common faults.',
          sections:['Glass electrode, 4 / 7 / 10 buffer','ORP redox couples','Cell constant 1 / 0.1 / 0.01'] },
        { id:'m2', title:'Turbidity & residual Cl', duration:'50 min',
          summary:'Nephelometric vs scattered, DPD vs amperometric.',
          sections:['Hach 2100 series, on-line','CL17 amperometric','Maintenance schedule'] },
        { id:'m3', title:'Calibration discipline', duration:'45 min',
          summary:'Two-point cal, slope, drift, validation against grab sample.',
          sections:['Slope 92–102 % healthy','Daily zero, monthly cal','Documentation in LIMS'] },
        { id:'m4', title:'Audit trail', duration:'25 min',
          summary:'Use the Hadron Calibration module to keep an SANAS-friendly register.',
          sections:['Per-meter interval','Log cal events','Overdue alerts'] }
      ]
    },

    {
      id: 'c-eq-301', trackId: 'track-equipment', code: 'EQ-301',
      title: 'Maintenance & Troubleshooting',
      level: 'Advanced', duration: '4 hrs',
      summary: 'Preventive vs reactive maintenance, root-cause analysis, and the operator\'s troubleshooting decision tree.',
      outcomes: [
        'Build a PM schedule',
        'Run a 5-Why / fishbone RCA',
        'Use a structured decision tree to diagnose plant faults',
        'Document corrective + preventive actions'
      ],
      prereqs: ['c-eq-101'],
      linkedTools: ['servicereport'],
      sources: ['SAE JA-1011 RCM', 'WRC Handbook — Ch C3'],
      modules: [
        { id:'m1', title:'PM scheduling', duration:'45 min',
          summary:'Run-to-failure vs interval-based vs condition-based.',
          sections:['RCM thinking','Vibration, oil analysis, thermography','PM register & overdue alerts'] },
        { id:'m2', title:'Root-cause analysis', duration:'45 min',
          summary:'Beyond "operator error" — actually finding the root.',
          sections:['5-Why technique','Ishikawa fishbone','Pareto of failures'] },
        { id:'m3', title:'Decision trees', duration:'45 min',
          summary:'Pre-built trees for the common big-five plant faults.',
          sections:['RO permeate TDS rising','Cooling tower algae bloom','Dosing pump no output','Chlorinator not dissolving','Coag floc carry-over'] },
        { id:'m4', title:'Documenting CAPA', duration:'30 min',
          summary:'Write a CAPA that an auditor (and your replacement) can read.',
          sections:['Problem statement','Immediate action','Root cause','Permanent fix','Verification'] }
      ]
    },

    /* ──────────────────  OPERATIONS & SAFETY  ────────────────── */

    {
      id: 'c-ops-101', trackId: 'track-ops', code: 'OPS-101',
      title: 'Plant Operations Fundamentals',
      level: 'Foundation', duration: '3 hrs',
      summary: 'The shift, the logbook, the hand-over and the calls operators make all day. Adapted from WISA P112.',
      outcomes: [
        'Run a shift hand-over',
        'Keep a logbook that survives an audit',
        'Make the right escalation call',
        'Use the daily Service Report tool'
      ],
      prereqs: [],
      linkedTools: ['servicereport', 'lims'],
      sources: ['WISA 2008 P112 — Plant Operations', 'WRC Handbook — Ch C2'],
      modules: [
        { id:'m1', title:'The shift', duration:'40 min',
          summary:'Pre-shift, mid-shift, post-shift routines.',
          sections:['Pre-shift walk-down','Mid-shift sample round','Post-shift logbook + hand-over'] },
        { id:'m2', title:'Logbook discipline', duration:'40 min',
          summary:'A logbook is a legal record. How to keep one that works for you.',
          sections:['Time-stamped entries','Sample results, settings changes, alarms','Counter-signed handovers'] },
        { id:'m3', title:'Escalation', duration:'30 min',
          summary:'Who do you phone when, and what evidence do you bring.',
          sections:['Plant alarm matrix','Manager / engineer / regulator','Public-health threshold escalation'] },
        { id:'m4', title:'Service Report tool', duration:'30 min',
          summary:'How to use the Hadron Service Report on a real site visit.',
          sections:['Capture readings, photos, signatures','Generate PDF for client','Sync to LIMS'] }
      ]
    },

    {
      id: 'c-ops-201', trackId: 'track-ops', code: 'OPS-201',
      title: 'Chemical Handling & MSDS',
      level: 'Intermediate', duration: '4 hrs',
      summary: 'Acid, caustic, chlorine, polymer — the actual handling of hazardous water-treatment chemicals on a plant.',
      outcomes: [
        'Read a GHS-format SDS quickly',
        'Specify PPE per chemical',
        'Plan a transfer / decant safely',
        'Run a spill response'
      ],
      prereqs: ['c-ops-101'],
      linkedTools: ['servicereport'],
      sources: ['Chlorine Handling Information Pack', 'OSHA HazCom 2012 / GHS', 'Hadron MSDS Library'],
      modules: [
        { id:'m1', title:'GHS & SDS', duration:'45 min',
          summary:'The 16 sections, the pictograms, the H/P phrases.',
          sections:['Sections 1–16','Pictograms','H-statements vs P-statements'] },
        { id:'m2', title:'PPE per chemical class', duration:'45 min',
          summary:'Acid, caustic, oxidiser, organic — different gloves, suits and respirators.',
          sections:['Acid: butyl gloves, splash goggles','Caustic: butyl + apron','Cl₂: SCBA + butyl','Solvents: nitrile / Viton'] },
        { id:'m3', title:'Transfer & decant', duration:'45 min',
          summary:'How to move 1 m³ of NaOH from delivery tanker to day-tank without injury.',
          sections:['Bonded earthing','Vented vs sealed transfer','Lock-out / tag-out'] },
        { id:'m4', title:'Spill response', duration:'45 min',
          summary:'Containment, neutralisation, disposal, paperwork.',
          sections:['Acid spill — soda ash dam, neutralise','Chlorine release — ammonia rag, evacuate','Reporting + post-incident review'] }
      ]
    },

    {
      id: 'c-ops-202', trackId: 'track-ops', code: 'OPS-202',
      title: 'Sampling Best Practice & QMS',
      level: 'Intermediate', duration: '3 hrs',
      summary: 'Sampling defects ruin downstream analysis. ISO 17025 / SANAS requirements for sample integrity.',
      outcomes: [
        'Pick the right bottle, preservative and hold-time',
        'Build a chain-of-custody form',
        'Apply ISO 17025 § 7 to sample handling',
        'Audit a sample-collection run'
      ],
      prereqs: ['c-ops-101'],
      linkedTools: ['lims', 'servicereport'],
      sources: ['ISO/IEC 17025:2017', 'SANAS R 47', 'APHA Standard Methods Pt 1060'],
      modules: [
        { id:'m1', title:'Sample integrity', duration:'45 min',
          summary:'The four enemies of a good sample: contamination, change, loss, mixing.',
          sections:['Bottle pre-cleaning','Preservatives by determinand','Cold-chain at 4 °C'] },
        { id:'m2', title:'Chain of custody', duration:'45 min',
          summary:'Who, what, when, where — every step.',
          sections:['CoC form fields','Tamper-evident seals','LIMS booking-in'] },
        { id:'m3', title:'ISO 17025 sampling clauses', duration:'45 min',
          summary:'§ 7.3 sampling, § 7.4 handling, § 7.7 reporting.',
          sections:['Sampling plan validation','Documented method','Uncertainty contribution from sampling'] }
      ]
    },

    {
      id: 'c-ops-301', trackId: 'track-ops', code: 'OPS-301',
      title: 'Emergency Response & Incident Management',
      level: 'Advanced', duration: '3 hrs',
      summary: 'Boil-water notices, taste-and-odour events, chemical leak, plant downtime — coordinated response.',
      outcomes: [
        'Trigger and communicate a boil-water notice',
        'Manage a T&O event end-to-end',
        'Run a chemical leak response',
        'Brief media and the public'
      ],
      prereqs: ['c-ops-201'],
      linkedTools: ['lims', 'servicereport'],
      sources: ['DWS Drinking Water Management (2024)', 'WHO WSP training manual'],
      modules: [
        { id:'m1', title:'Boil-water notices', duration:'45 min',
          summary:'When to issue, how to communicate, how to lift.',
          sections:['Trigger thresholds','Public-health authority coordination','Lift-criteria sampling'] },
        { id:'m2', title:'T&O events', duration:'45 min',
          summary:'Algae bloom, geosmin/MIB, post-fire ash.',
          sections:['Powdered AC dosing','GAC swap','Source-water management'] },
        { id:'m3', title:'Communication', duration:'45 min',
          summary:'Media, councillors and the public during an incident.',
          sections:['Single source of truth','Plain-language briefings','Daily updates rule'] }
      ]
    },

    /* ──────────────────  WATER CHEMISTRY FOUNDATIONS  ────────────────── */

    {
      id: 'c-chem-101', trackId: 'track-chemistry', code: 'CHEM-101',
      title: 'Inorganic Chemistry Basics',
      level: 'Foundation', duration: '3 hrs',
      summary: 'The chemistry every operator needs — moles, balances, ions in water and the periodic table\'s greatest hits for water treatment.',
      outcomes: [
        'Convert mg/L ↔ meq/L ↔ mmol/L',
        'Balance a precipitation or neutralisation reaction',
        'Identify the major cations and anions in natural water',
        'Use the unit converter calc fluently'
      ],
      prereqs: [],
      linkedTools: ['converters', 'neutralise'],
      sources: ['WRC Handbook — Ch A3', 'Stumm & Morgan — Aquatic Chemistry'],
      modules: [
        { id:'m1', title:'Atoms, moles & ions', duration:'45 min',
          summary:'A 45-minute refresher pitched at someone who hasn\'t opened a chem text in 20 years.',
          sections:['Atomic mass, moles, Avogadro','Cations vs anions','Activity vs concentration'] },
        { id:'m2', title:'Concentration units', duration:'45 min',
          summary:'mg/L, ppm, mol/L, eq/L, %w/v — and how to flip between them.',
          sections:['mg/L = ppm for dilute aqueous','M = mol/L = mg/L ÷ MW','Equivalents and valence n','Use Hadron Converter calc'] },
        { id:'m3', title:'Major ions in water', duration:'45 min',
          summary:'Ca, Mg, Na, K | HCO₃, SO₄, Cl, NO₃ — typical ranges and what they tell you.',
          sections:['Cation–anion balance','TDS calculation from ions','Hardness, alkalinity in disguise'] },
        { id:'m4', title:'Worked examples', duration:'25 min',
          summary:'Five real-life conversions and balances.',
          sections:['HCl 32 % to molarity','Lime kg/day from acid mg/L','TDS estimate from EC'] }
      ]
    },

    {
      id: 'c-chem-102', trackId: 'track-chemistry', code: 'CHEM-102',
      title: 'pH, Alkalinity & Hardness',
      level: 'Foundation', duration: '3 hrs',
      summary: 'The "ABC" trio of water chemistry — what each one is, how they interact, and how to titrate them.',
      outcomes: [
        'Define pH, alkalinity, hardness rigorously',
        'Run a 4.5 / 8.3 alkalinity titration',
        'Run an EDTA hardness titration',
        'Predict carbonate buffering capacity'
      ],
      prereqs: ['c-chem-101'],
      linkedTools: ['waterindex', 'neutralise'],
      sources: ['APHA Standard Methods', 'WRC Handbook — Ch A3'],
      modules: [
        { id:'m1', title:'pH in depth', duration:'40 min',
          summary:'Activity, the H₂O auto-ionisation, and the difference between pH and acidity.',
          sections:['pH = -log a(H⁺)','Buffer capacity β','pH vs acidity (titratable)'] },
        { id:'m2', title:'Alkalinity', duration:'45 min',
          summary:'The "ability to neutralise acid" — a mass balance, not a single species.',
          sections:['Total alkalinity = HCO₃⁻ + 2·CO₃²⁻ + OH⁻','Phenolphthalein vs total alkalinity','Carbonate-bicarbonate-hydroxide split'] },
        { id:'m3', title:'Hardness', duration:'45 min',
          summary:'Calcium + magnesium expressed as CaCO₃.',
          sections:['Total / Ca / Mg hardness','EDTA titration with EBT indicator','Carbonate vs non-carbonate'] },
        { id:'m4', title:'Putting it together — LSI', duration:'30 min',
          summary:'Use the Hadron LSI calculator to predict scaling vs corrosion.',
          sections:['LSI from pH, T, Ca, alk, TDS','Negative = corrosive, positive = scaling','Practical cycle limits'] }
      ]
    },

    {
      id: 'c-chem-201', trackId: 'track-chemistry', code: 'CHEM-201',
      title: 'Solubility, Saturation & LSI',
      level: 'Intermediate', duration: '3 hrs',
      summary: 'Going beyond the index — actual ion-product calculations, solubility products, and what a Stiff-Davis or Puckorius adds.',
      outcomes: [
        'Calculate ion product vs Ksp',
        'Apply Stiff-Davis for high-TDS waters',
        'Apply Puckorius for cooling',
        'Pick the right index for the application'
      ],
      prereqs: ['c-chem-102'],
      linkedTools: ['waterindex', 'coolingtower'],
      sources: ['Stumm & Morgan', 'Nalco Water Handbook'],
      modules: [
        { id:'m1', title:'Solubility & Ksp', duration:'45 min',
          summary:'Ion product vs solubility product — when precipitation actually starts.',
          sections:['CaCO₃ Ksp ≈ 4.5 × 10⁻⁹','Common-ion effect','Activity correction'] },
        { id:'m2', title:'Indices side-by-side', duration:'45 min',
          summary:'LSI, RSI, Puckorius (PSI), Stiff-Davis (S&DSI), Larson-Skold.',
          sections:['LSI for fresh water 0–500 mg/L TDS','S&DSI for high-salinity','PSI for cooling — practical'] },
        { id:'m3', title:'Practical cooling-water example', duration:'45 min',
          summary:'Run cycles of concentration from 3× to 8× and watch the indices move.',
          sections:['LSI vs cycles','Polymer support strategy','Acid feed for cycle bump'] }
      ]
    },

    {
      id: 'c-chem-202', trackId: 'track-chemistry', code: 'CHEM-202',
      title: 'Microbiology Basics',
      level: 'Intermediate', duration: '3 hrs',
      summary: 'Bacteria, virus and protozoa for the water-plant operator — enough to read a micro report and act on it.',
      outcomes: [
        'Distinguish coliforms, faecal coliforms, E. coli',
        'Understand HPC and what it means',
        'Recognise Legionella risk in cooling',
        'Read an MPN report'
      ],
      prereqs: [],
      linkedTools: ['lims', 'dosage'],
      sources: ['APHA Standard Methods Pt 9000', 'WHO Guidelines for Drinking-water Quality'],
      modules: [
        { id:'m1', title:'Indicator organisms', duration:'45 min',
          summary:'Why coliforms ≠ pathogens but still drive the water industry.',
          sections:['Total coliforms vs faecal vs E. coli','Limitations of indicators','Recreational vs drinking'] },
        { id:'m2', title:'Heterotrophic plate count', duration:'30 min',
          summary:'A general "biomass" indicator, not a health risk per se.',
          sections:['HPC method (R2A, plate count)','Trends matter more than absolute','SANS 241 limit 1000 cfu/mL'] },
        { id:'m3', title:'Legionella & cooling', duration:'45 min',
          summary:'Legionella pneumophila — what kills it, and the inspection regime.',
          sections:['Aerosol generation in cooling towers','35 °C bath the danger zone','Risk assessment per OSHA / HSE L8'] },
        { id:'m4', title:'Reading a micro report', duration:'30 min',
          summary:'MPN, CFU, IDEXX Quanti-Tray.',
          sections:['MPN tables','CFU per 100 mL or per mL','How to flag in LIMS'] }
      ]
    }
  ];

  /* ---------- State ---------- */
  const STATE = {
    view: 'home',          // home | track | course | module
    trackId: null,
    courseId: null,
    moduleId: null,
    stack: []
  };

  /* ---------- Router ---------- */
  window.academyGo = function (view, params) {
    STATE.stack.push({ view: STATE.view, trackId: STATE.trackId, courseId: STATE.courseId, moduleId: STATE.moduleId });
    STATE.view = view;
    if (params) {
      if ('trackId'  in params) STATE.trackId  = params.trackId;
      if ('courseId' in params) STATE.courseId = params.courseId;
      if ('moduleId' in params) STATE.moduleId = params.moduleId;
    }
    render();
  };
  window.academyBack = function () {
    if (STATE.stack.length) {
      const prev = STATE.stack.pop();
      Object.assign(STATE, prev);
    } else if (STATE.view !== 'home') {
      STATE.view = 'home';
    } else if (typeof closeWindow === 'function') {
      closeWindow('academy');
      return;
    }
    render();
  };
  window.academyOpen = function () {
    STATE.view = 'home';
    STATE.stack = [];
    render();
  };

  // Re-render the current Academy view (called when user changes language).
  window.academyRerender = function () {
    const shell = document.getElementById('academyShell');
    if (shell && shell.children.length) render();
  };

  // Tiny translator helper — falls back to provided English if i18n absent.
  function tt(key, en) {
    if (typeof window.t === 'function') {
      const v = window.t(key);
      if (v && v !== key) return v;   // fall back to the English default when the key is untranslated
    }
    return en;
  }

  /* ---------- Render ---------- */
  function render() {
    const root = document.getElementById('academyShell');
    if (!root) return;
    if (STATE.view === 'home')   return renderHome(root);
    if (STATE.view === 'track')  return renderTrack(root);
    if (STATE.view === 'course') return renderCourse(root);
    if (STATE.view === 'module') return renderModule(root);
    STATE.view = 'home'; render();
  }

  function breadcrumb(path) {
    return `<div class="hg-breadcrumb">${path.map((p, i) => {
      if (i === path.length - 1) return `<span class="current">${esc(p.label)}</span>`;
      return `<a onclick="academyGo('${p.view}', ${JSON.stringify(p.params || {}).replace(/"/g, '&quot;')})">${esc(p.label)}</a><span class="sep">›</span>`;
    }).join('')}</div>`;
  }

  function renderHome(root) {
    const allProgress = loadProgress();
    const totalCompleted = Object.values(allProgress).reduce((n, p) => n + (p.completed || []).length, 0);
    const totalCourses = COURSES.length;
    const startedCourses = Object.keys(allProgress).length;
    const earnedCerts = COURSES.filter(c => courseIsComplete(c));

    root.innerHTML = `
      <div class="hg-hero" style="background: linear-gradient(135deg, #7a59d4 0%, #3AAEDB 100%);">
        <div>
          <h2 class="hg-hero-title">${esc(tt('academy.heroTitle','Hadron Academy'))}</h2>
          <div class="hg-hero-sub">${esc(tt('academy.heroSub','Water-treatment courseware'))}</div>
        </div>
        <div class="hg-hero-icon">🎓</div>
      </div>

      <div class="hg-kvgrid" style="margin-bottom: 18px;">
        <div class="hg-kv"><div class="k">${esc(tt('academy.tracks','Tracks'))}</div><div class="v">${TRACKS.length}</div></div>
        <div class="hg-kv"><div class="k">${esc(tt('academy.courses','Courses'))}</div><div class="v">${totalCourses}</div></div>
        <div class="hg-kv"><div class="k">${esc(tt('academy.started','Started'))}</div><div class="v">${startedCourses}</div></div>
        <div class="hg-kv"><div class="k">${esc(tt('academy.modulesDone','Modules done'))}</div><div class="v">${totalCompleted}</div></div>
        <div class="hg-kv"><div class="k">${esc(tt('academy.certificates','Certificates'))}</div><div class="v">${earnedCerts.length}</div></div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">${esc(tt('academy.pickTrack','Pick a track'))}</div>
        <div class="academy-tracks">
          ${TRACKS.map(t => {
            const trackCourses = COURSES.filter(c => c.trackId === t.id);
            const completedHere = trackCourses.reduce((n, c) => {
              return n + ((allProgress[c.id] || { completed: [] }).completed.length);
            }, 0);
            const totalModulesHere = trackCourses.reduce((n, c) => n + c.modules.length, 0);
            const pct = totalModulesHere ? Math.round(completedHere / totalModulesHere * 100) : 0;
            return `
              <div class="academy-track" style="background: ${t.g};" onclick="academyGo('track', { trackId: '${t.id}' })">
                <div class="academy-track-icon">${t.icon}</div>
                <div class="academy-track-name">${esc(t.name)}</div>
                <div class="academy-track-sub">${esc(t.sub)}</div>
                <div class="academy-track-meta">${trackCourses.length} courses${pct ? ' · ' + pct + '% complete' : ''}</div>
              </div>`;
          }).join('')}
        </div>
      </div>

      ${earnedCerts.length ? `
        <div class="hg-card">
          <div class="hg-section-title">${esc(tt('academy.myCerts','My certificates'))}</div>
          ${earnedCerts.map(c => `
            <div class="academy-module" style="cursor:default;">
              <div class="academy-module-num">✓</div>
              <div style="flex:1;">
                <div style="font-weight:700; font-size:14px;">${esc(c.title)}</div>
                <div style="font-size:12px; color:#6b7684; margin-top:2px;">${esc(c.code)} · ${esc(c.level)}</div>
              </div>
              <button class="hg-btn primary" onclick="academyCertificate('${c.id}')">${esc(tt('academy.getCertShort','Certificate'))}</button>
            </div>`).join('')}
        </div>` : ''}

      <div class="hg-card">
        <div class="hg-section-title">${esc(tt('academy.howItWorks','How it works'))}</div>
        <p style="margin-bottom: 8px;">Each course is a series of focused modules with explicit learning outcomes. Where a topic links to one of the Hadron calculator tools or LIMS, the lesson hands you straight there so you can practise on real data.</p>
        <p style="font-size: 13px; color: #6b7684;">Progress is saved on this device. Sources are credited per course (WRC, WHO, Nalco, Rand Water, WISA, etc.) and full lesson content is rolled out per the Hadron Group product roadmap.</p>
      </div>
    `;
  }

  function renderTrack(root) {
    const t = TRACKS.find(x => x.id === STATE.trackId);
    if (!t) { STATE.view = 'home'; render(); return; }
    const courses = COURSES.filter(c => c.trackId === t.id);
    const progress = loadProgress();

    root.innerHTML = `
      ${breadcrumb([{ label: tt('academy.heroTitle','Academy'), view: 'home' }, { label: t.name, view: 'track', params: { trackId: t.id } }])}
      <div class="hg-hero" style="background: ${t.g};">
        <div>
          <h2 class="hg-hero-title">${esc(t.name)}</h2>
          <div class="hg-hero-sub">${esc(t.sub)}</div>
        </div>
        <div class="hg-hero-icon">${t.icon}</div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">${esc(tt('academy.coursesInTrack','Courses in this track'))}</div>
        ${courses.map(c => {
          const p = progress[c.id] || { completed: [] };
          const pct = c.modules.length ? Math.round(p.completed.length / c.modules.length * 100) : 0;
          const lvlChip = c.level === 'Foundation' ? 'ok' : (c.level === 'Intermediate' ? 'info' : 'warn');
          return `
            <div class="academy-course" onclick="academyGo('course', { courseId: '${c.id}' })">
              <div style="display:flex; justify-content:space-between; gap: 14px; align-items:flex-start; flex-wrap:wrap;">
                <div style="flex:1; min-width: 220px;">
                  <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:6px;">
                    <span class="hg-chip neutral">${esc(c.code)}</span>
                    <span class="hg-chip ${lvlChip}">${esc(c.level)}</span>
                    <span class="hg-chip neutral">${esc(c.duration)}</span>
                    <span class="hg-chip neutral">${c.modules.length} modules</span>
                  </div>
                  <div style="font-weight:700; font-size:15px; color:#2e3742;">${esc(c.title)}</div>
                  <div style="font-size:13px; color:#6b7684; margin-top:4px; line-height:1.45;">${esc(c.summary)}</div>
                </div>
                <div style="text-align:right; min-width: 120px;">
                  <div style="font-size:12px; color:#6b7684; text-transform:uppercase; letter-spacing:0.4px;">Progress</div>
                  <div style="font-size:22px; font-weight:700; color:${pct === 100 ? '#157b3a' : '#3AAEDB'};">${pct}%</div>
                  <div class="academy-progress-bar"><div class="academy-progress-fill" style="width:${pct}%;"></div></div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  }

  function renderCourse(root) {
    const c = COURSES.find(x => x.id === STATE.courseId);
    if (!c) { STATE.view = 'home'; render(); return; }
    const t = TRACKS.find(x => x.id === c.trackId);
    const p = progressFor(c.id);
    const pct = courseProgressPct(c);

    // Localise the level chip
    const levelLabel = c.level === 'Foundation' ? tt('academy.foundation','Foundation')
                     : c.level === 'Intermediate' ? tt('academy.intermediate','Intermediate')
                     : c.level === 'Advanced' ? tt('academy.advanced','Advanced')
                     : c.level;

    root.innerHTML = `
      ${breadcrumb([
        { label: tt('academy.heroTitle','Academy'), view: 'home' },
        { label: t.name, view: 'track', params: { trackId: t.id } },
        { label: c.code, view: 'course', params: { courseId: c.id } }
      ])}

      <div class="hg-hero" style="background: ${t.g};">
        <div>
          <div style="font-size:12px; opacity:0.85; letter-spacing:0.4px;">${esc(c.code)} · ${esc(levelLabel)} · ${esc(c.duration)}</div>
          <h2 class="hg-hero-title" style="margin-top:4px;">${esc(c.title)}</h2>
          <div class="hg-hero-sub">${esc(c.summary)}</div>
        </div>
        <div class="hg-hero-icon">${t.icon}</div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">${esc(tt('academy.outcomes','Learning outcomes'))}</div>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.7;">
          ${c.outcomes.map(o => `<li>${esc(o)}</li>`).join('')}
        </ul>
      </div>

      ${c.linkedTools && c.linkedTools.length ? `
        <div class="hg-card">
          <div class="hg-section-title">${esc(tt('academy.linkedTools','Linked Hadron tools'))}</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${c.linkedTools.map(k => {
              const tool = TOOLS[k]; if (!tool) return '';
              return `<button class="hg-btn ghost" onclick="event.stopPropagation();academyOpenTool('${k}')">${tool.icon} ${esc(tool.label)}</button>`;
            }).join('')}
          </div>
          <p style="font-size: 12px; color: #6b7684; margin-top: 10px; margin-bottom:0;">Open these alongside the course to practise on real plant numbers.</p>
        </div>` : ''}

      ${c.prereqs && c.prereqs.length ? `
        <div class="hg-card">
          <div class="hg-section-title">${esc(tt('academy.prerequisites','Prerequisites'))}</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${c.prereqs.map(pid => {
              const pc = COURSES.find(x => x.id === pid); if (!pc) return '';
              return `<button class="hg-btn" onclick="academyGo('course',{courseId:'${pc.id}'})">${esc(pc.code)} ${esc(pc.title)}</button>`;
            }).join('')}
          </div>
        </div>` : ''}

      <div class="hg-card">
        <div class="hg-section-title" style="display:flex; justify-content:space-between; align-items:center;">
          <span>${esc(tt('academy.modules','Modules'))}</span>
          <span style="font-size:13px; font-weight:500; color:${pct === 100 ? '#157b3a' : '#6b7684'};">${pct}${esc(tt('academy.percentComplete','% complete'))}</span>
        </div>
        ${c.modules.map((m, i) => {
          const done = p.completed.indexOf(m.id) !== -1;
          return `
            <div class="academy-module ${done ? 'done' : ''}" onclick="academyGo('module', { moduleId: '${m.id}' })">
              <div class="academy-module-num">${done ? '✓' : (i + 1)}</div>
              <div style="flex:1;">
                <div style="font-weight:700; font-size:14px;">${esc(m.title)}</div>
                <div style="font-size:12px; color:#6b7684; margin-top:2px;">${esc(m.summary)}</div>
              </div>
              <div style="font-size:12px; color:#6b7684; white-space:nowrap;">${esc(m.duration)}</div>
            </div>`;
        }).join('')}
      </div>

      ${(function () {
        const r = courseQuizResult(c);
        if (!r.total) return '';   // course has no quizzes
        if (!r.has) return `
          <div class="hg-card">
            <div class="hg-section-title">${esc(tt('academy.quizResult','Quiz result'))}</div>
            <div style="font-size:13px; color:#6b7684;">${esc(tt('academy.quizNotTaken','Complete the knowledge check to earn your course result.'))}</div>
          </div>`;
        const passed = r.avg >= 70;
        return `
          <div class="hg-card">
            <div class="hg-section-title">${esc(tt('academy.quizResult','Quiz result'))}</div>
            <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
              <div style="font-size:32px; font-weight:800; color:${passed ? '#157b3a' : '#c0392b'};">${r.avg}%</div>
              <div style="flex:1; min-width:170px;">
                <span class="hg-chip ${passed ? 'ok' : 'warn'}">${passed ? '✓ ' + esc(tt('academy.passed','Passed')) : esc(tt('academy.notYetPassed','Not yet passed'))}</span>
                <div style="font-size:12px; color:#6b7684; margin-top:6px;">${esc(tt('academy.avgAcross','Average across'))} ${r.count}/${r.total} ${esc(tt('academy.assessments','assessment(s)'))}</div>
              </div>
            </div>
          </div>`;
      })()}

      ${courseIsComplete(c) ? `
        <div class="hg-card academy-cert-card" style="text-align:center;">
          <div class="hg-section-title" style="justify-content:center;">${esc(tt('academy.certReady','Course complete — your certificate is ready'))}</div>
          <p style="font-size:13px; color:#6b7684; margin:2px 0 12px;">${esc(tt('academy.certBlurb','Open a printable certificate with your name, score and a verification ID — save it as a PDF from the print dialog.'))}</p>
          <button class="hg-btn primary" onclick="academyCertificate('${c.id}')">${esc(tt('academy.getCert','Download certificate (PDF)'))}</button>
        </div>` : ''}

      <div class="hg-card">
        <div class="hg-section-title">${esc(tt('academy.sources','Sources & references'))}</div>
        <ul style="margin:0; padding-left:20px; line-height:1.7; font-size:13px; color:#4f4f4f;">
          ${c.sources.map(s => `<li>${esc(s)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  function renderModule(root) {
    const c = COURSES.find(x => x.id === STATE.courseId);
    const m = c && c.modules.find(x => x.id === STATE.moduleId);
    if (!c || !m) { STATE.view = 'home'; render(); return; }
    const t = TRACKS.find(x => x.id === c.trackId);
    const idx = c.modules.findIndex(x => x.id === m.id);
    const next = c.modules[idx + 1];
    const prev = c.modules[idx - 1];
    const p = progressFor(c.id);
    const isDone = p.completed.indexOf(m.id) !== -1;
    const quiz = quizFor(m);
    if (quiz) QUIZ = { courseId: c.id, moduleId: m.id, picks: {}, submitted: false };  // fresh attempt each visit

    root.innerHTML = `
      ${breadcrumb([
        { label: tt('academy.heroTitle','Academy'), view: 'home' },
        { label: t.name, view: 'track', params: { trackId: t.id } },
        { label: c.code, view: 'course', params: { courseId: c.id } },
        { label: m.title, view: 'module', params: { moduleId: m.id } }
      ])}

      <div class="hg-hero" style="background: ${t.g};">
        <div>
          <div style="font-size:12px; opacity:0.85; letter-spacing:0.4px;">${esc(tt('academy.modules','Modules'))} ${idx + 1} / ${c.modules.length} · ${esc(m.duration)}</div>
          <h2 class="hg-hero-title" style="margin-top:4px;">${esc(m.title)}</h2>
          <div class="hg-hero-sub">${esc(m.summary)}</div>
        </div>
        <div class="hg-hero-icon">${t.icon}</div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">${esc(tt('academy.whatYoullLearn',"What you'll learn"))}</div>
        <ul style="margin:0; padding-left:20px; line-height:1.8;">
          ${m.sections.map(s => `<li>${esc(s)}</li>`).join('')}
        </ul>
      </div>

      ${quiz ? `
      <div class="hg-card">
        <div class="hg-section-title">${esc(tt('academy.quizTitle','Quiz'))} · ${quiz.length} ${esc(tt('academy.questions','questions'))}</div>
        <div style="font-size:13px; color:#6b7684; margin:-4px 0 14px;">${esc(tt('academy.quizIntro','Pick one answer per question, then submit. Score 70% to complete this module.'))}</div>
        <div id="academyQuiz">${quizInner(c, m)}</div>
      </div>` : `
      <div class="hg-card academy-lesson">
        <div class="hg-section-title">${esc(tt('academy.lessonContent','Lesson content'))}</div>
        ${renderLessonBody(STATE.courseId, m.id, m.title)}
      </div>`}

      ${c.linkedTools && c.linkedTools.length ? `
        <div class="hg-card">
          <div class="hg-section-title">${esc(tt('academy.practiseTools','Practise with these tools'))}</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${c.linkedTools.map(k => {
              const tool = TOOLS[k]; if (!tool) return '';
              return `<button class="hg-btn ghost" onclick="academyOpenTool('${k}')">${tool.icon} ${esc(tool.label)}</button>`;
            }).join('')}
          </div>
        </div>` : ''}

      <div class="hg-card">
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${prev ? `<button class="hg-btn" onclick="academyGo('module', { moduleId: '${prev.id}' })">← ${esc(prev.title)}</button>` : ''}
            ${(quiz && !isDone) ? '' : (next ? `<button class="hg-btn primary" onclick="academyMarkAndNext('${m.id}', '${next.id}')">${isDone ? esc(tt('common.next','Next')) : esc(tt('academy.markComplete','Mark complete & next'))}: ${esc(next.title)} →</button>`
                   : `<button class="hg-btn primary" onclick="academyMarkAndFinish('${m.id}')">${isDone ? esc(tt('academy.finishCourse','Finish course'))+' ✓' : esc(tt('academy.markComplete','Mark complete & next'))+' — '+esc(tt('academy.finishCourse','Finish course'))+' ✓'}</button>`)}
          </div>
          ${isDone ? '<span class="hg-chip ok">✓ '+esc(tt('common.done','Completed'))+'</span>' : ''}
        </div>
      </div>
    `;
  }

  /* ---------- Actions ---------- */
  window.academyMarkAndNext = function (moduleId, nextId) {
    if (STATE.courseId) markModuleComplete(STATE.courseId, moduleId);
    academyGo('module', { moduleId: nextId });
  };
  window.academyMarkAndFinish = function (moduleId) {
    if (STATE.courseId) markModuleComplete(STATE.courseId, moduleId);
    academyGo('course', { courseId: STATE.courseId });
  };

  // Open a calc / app from inside the Academy
  window.academyOpenTool = function (key) {
    if (typeof window.openWindow === 'function') {
      window.openWindow(key);
    }
  };

  /* ---------- Interactive quiz ----------
     A module may carry  quiz: [{ q, options:[...], answer:<0-based index>, explain }]
     Rendered as single-choice MCQs; the learner must score >= QUIZ_PASS % to
     complete the module. State is held in QUIZ and the block repaints in place. */
  const QUIZ_PASS = 70;            // percent required to pass
  let QUIZ = null;                 // { courseId, moduleId, picks:{qi:oi}, submitted }

  function quizFor(m) { return (m && Array.isArray(m.quiz) && m.quiz.length) ? m.quiz : null; }
  function quizScore(quiz) {
    let correct = 0;
    quiz.forEach(function (q, i) { if (QUIZ.picks[i] === q.answer) correct++; });
    return { correct: correct, total: quiz.length, pct: Math.round(correct / quiz.length * 100) };
  }
  function repaintQuiz() {
    const el = document.getElementById('academyQuiz');
    if (!el || !QUIZ) return;
    const c = COURSES.find(function (x) { return x.id === QUIZ.courseId; });
    const m = c && c.modules.find(function (x) { return x.id === QUIZ.moduleId; });
    if (c && m) el.innerHTML = quizInner(c, m);
  }
  function quizInner(c, m) {
    const quiz = quizFor(m); if (!quiz) return '';
    const submitted = QUIZ.submitted;
    const answered = Object.keys(QUIZ.picks).length;
    const idx = c.modules.findIndex(function (x) { return x.id === m.id; });
    const next = c.modules[idx + 1];
    let html = '';
    quiz.forEach(function (q, qi) {
      html += '<div class="academy-q"><div class="academy-q-title">' + (qi + 1) + '. ' + esc(q.q) + '</div>';
      (q.options || []).forEach(function (opt, oi) {
        const picked = QUIZ.picks[qi] === oi;
        let cls = 'academy-opt', mark = '';
        if (submitted) {
          if (oi === q.answer) { cls += ' correct'; mark = '  ✓'; }
          else if (picked) { cls += ' wrong'; mark = '  ✗'; }
        } else if (picked) { cls += ' picked'; }
        html += '<button type="button" class="' + cls + '"' + (submitted ? ' disabled' : '') +
          ' onclick="academyQuizPick(' + qi + ',' + oi + ')">' + esc(opt) + mark + '</button>';
      });
      if (submitted && q.explain) html += '<div class="academy-explain">' + esc(q.explain) + '</div>';
      html += '</div>';
    });
    if (!submitted) {
      html += '<button class="hg-btn primary"' + (answered < quiz.length ? ' disabled' : '') +
        ' onclick="academyQuizSubmit()">' + esc(tt('academy.submitQuiz', 'Submit answers')) +
        ' (' + answered + '/' + quiz.length + ')</button>';
    } else {
      const s = quizScore(quiz);
      const passed = s.pct >= QUIZ_PASS;
      html += '<div class="academy-score ' + (passed ? 'pass' : 'fail') + '">' +
        (passed ? '✓ ' : '✗ ') + esc(tt('academy.youScored', 'You scored')) + ' ' +
        s.correct + ' / ' + s.total + ' (' + s.pct + '%) — ' +
        (passed ? esc(tt('academy.quizPassed', 'passed, module complete'))
                : esc(tt('academy.quizFail', 'you need 70% to pass'))) + '</div>';
      html += '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">';
      html += '<button class="hg-btn" onclick="academyQuizRetry()">' + esc(tt('academy.retake', 'Retake quiz')) + '</button>';
      if (passed) {
        html += next
          ? '<button class="hg-btn primary" onclick="academyGo(\'module\', { moduleId: \'' + next.id + '\' })">' + esc(tt('common.next', 'Next')) + ': ' + esc(next.title) + ' →</button>'
          : '<button class="hg-btn primary" onclick="academyGo(\'course\', { courseId: \'' + c.id + '\' })">' + esc(tt('academy.finishCourse', 'Finish course')) + ' ✓</button>';
      }
      html += '</div>';
    }
    return html;
  }

  window.academyQuizPick = function (qi, oi) {
    if (!QUIZ || QUIZ.submitted) return;
    QUIZ.picks[qi] = oi;
    repaintQuiz();
  };
  window.academyQuizSubmit = function () {
    if (!QUIZ) return;
    const c = COURSES.find(function (x) { return x.id === QUIZ.courseId; });
    const m = c && c.modules.find(function (x) { return x.id === QUIZ.moduleId; });
    const quiz = quizFor(m); if (!quiz) return;
    if (Object.keys(QUIZ.picks).length < quiz.length) return;   // must answer all
    QUIZ.submitted = true;
    const s = quizScore(quiz);
    recordQuizScore(c.id, m.id, s.pct);
    if (s.pct >= QUIZ_PASS) markModuleComplete(c.id, m.id);
    repaintQuiz();
  };
  window.academyQuizRetry = function () {
    if (!QUIZ) return;
    QUIZ.picks = {}; QUIZ.submitted = false;
    repaintQuiz();
  };

  /* ---------- Lesson body lookup + tiny markdown renderer ----------
     Bodies live in window._ACADEMY_BODIES (set by academy-content.js).
     Keys are 'courseId/moduleId'. Bodies use a tiny subset of markdown:

       ## Subheading           → <h3>
       ### Subheading 2        → <h4>
       (blank line)            → paragraph break
       - bullet                → unordered list item
       1. numbered             → ordered list item
       **bold**                → <strong>
       _italic_                → <em>
       `code`                  → <code>

     Anything else is treated as plain prose. Paragraphs are wrapped in <p>. */
  function renderLessonBody(courseId, moduleId, title) {
    const bodies = window._ACADEMY_BODIES || {};
    const key = courseId + '/' + moduleId;
    const md  = bodies[key];
    if (!md) {
      return `<div class="hg-alert info" style="margin-bottom: 0;">
        📚 The full lesson body for <strong>${esc(title)}</strong> is being written.
        The outline above shows what's covered, and the <em>Linked tools</em> let you practise the
        calculations now — written material is rolling out.
      </div>`;
    }
    return '<div class="academy-body">' + mdLight(md) + '</div>';
  }

  function mdLight(src) {
    // Normalise line endings
    const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
    let html = '';
    let listType = null;        // 'ul' | 'ol' | null
    let paragraphBuf = [];

    function flushPara() {
      if (paragraphBuf.length) {
        html += '<p>' + inline(paragraphBuf.join(' ')) + '</p>';
        paragraphBuf = [];
      }
    }
    function closeList() { if (listType) { html += '</' + listType + '>'; listType = null; } }
    function openList(t) { if (listType !== t) { closeList(); html += '<' + t + '>'; listType = t; } }

    function inline(s) {
      // Escape HTML first, then re-insert formatting markers
      let out = String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
      out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
      out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      out = out.replace(/_([^_\n]+)_/g, '<em>$1</em>');
      return out;
    }

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.replace(/\s+$/, '');

      if (!line.trim()) { flushPara(); closeList(); continue; }

      let m;
      if ((m = line.match(/^###\s+(.*)/))) {
        flushPara(); closeList();
        html += '<h4 class="academy-h4">' + inline(m[1]) + '</h4>';
        continue;
      }
      if ((m = line.match(/^##\s+(.*)/))) {
        flushPara(); closeList();
        html += '<h3 class="academy-h3">' + inline(m[1]) + '</h3>';
        continue;
      }
      if ((m = line.match(/^[-*]\s+(.*)/))) {
        flushPara();
        openList('ul');
        html += '<li>' + inline(m[1]) + '</li>';
        continue;
      }
      if ((m = line.match(/^\d+\.\s+(.*)/))) {
        flushPara();
        openList('ol');
        html += '<li>' + inline(m[1]) + '</li>';
        continue;
      }
      // Plain text — accumulate into the current paragraph
      closeList();
      paragraphBuf.push(line.trim());
    }
    flushPara(); closeList();
    return html;
  }
})();
