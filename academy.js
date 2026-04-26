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
  function saveProgress(p) { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {} }

  function markModuleComplete(courseId, moduleId) {
    const p = loadProgress();
    p[courseId] = p[courseId] || { startedAt: new Date().toISOString(), completed: [], lastViewed: null };
    if (p[courseId].completed.indexOf(moduleId) === -1) p[courseId].completed.push(moduleId);
    p[courseId].lastViewed = moduleId;
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

  /* ---------- Linked calc tools metadata ---------- */
  // Map app-window IDs to friendly labels so lessons can deep-link cleanly.
  const TOOLS = {
    dosage:        { label: 'Dosage Calculator (Cl, ClO₂, Coagulants, Skid)', icon: '💊' },
    waterindex:    { label: 'LSI / RSI Index',                                icon: '🧮' },
    coolingtower:  { label: 'Cooling Tower',                                  icon: '🏭' },
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
    { id: 'track-potable',      name: 'Potable Water',         icon: '🚰', g: 'linear-gradient(135deg, #00b1ca 0%, #1a3d9e 100%)', sub: 'Drinking water treatment from source to tap' },
    { id: 'track-disinfection', name: 'Disinfection',          icon: '🛡️', g: 'linear-gradient(135deg, #2e3742 0%, #00b1ca 100%)', sub: 'Chlorine, ClO₂, UV, ozone & DBPs' },
    { id: 'track-sewage',       name: 'Sewage Treatment',      icon: '🚽', g: 'linear-gradient(135deg, #6c4a1f 0%, #b07a3f 100%)', sub: 'Wastewater treatment & sludge' },
    { id: 'track-effluent',     name: 'Industrial Effluent',   icon: '🏭', g: 'linear-gradient(135deg, #4ec5d4 0%, #2c5e8a 100%)', sub: 'Trade waste, paint detack, F&B, DAF' },
    { id: 'track-cooling',      name: 'Cooling Water',         icon: '❄️', g: 'linear-gradient(135deg, #5a73c2 0%, #1a3d9e 100%)', sub: 'Cooling towers & closed-loop systems' },
    { id: 'track-boiler',       name: 'Boiler Water',          icon: '🔥', g: 'linear-gradient(135deg, #d44a26 0%, #8a1f0a 100%)', sub: 'Steam systems & internal treatment' },
    { id: 'track-ro',           name: 'Reverse Osmosis',       icon: '💧', g: 'linear-gradient(135deg, #00b1ca 0%, #007a8a 100%)', sub: 'RO, NF, UF, MF & antiscalants' },
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
          summary:'10 multi-choice questions covering the train, SANS 241 classes and operator routine.',
          sections:['10 MCQ spanning the four prior modules'] }
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
      id: 'c-pot-301', trackId: 'track-potable', code: 'POT-301',
      title: 'SANS 241 Compliance & Water Safety Plans',
      level: 'Advanced', duration: '6 hrs',
      summary: 'How a plant proves to the regulator and to the public that the water it produces is safe. SANS 241 risk-based compliance + WHO Water Safety Plans.',
      outcomes: [
        'Build a sampling matrix that satisfies SANS 241',
        'Run an HACCP-style risk assessment on a plant',
        'Author the operational, monitoring and verification sections of a WSP',
        'Manage a non-conformance through to CAPA closure'
      ],
      prereqs: ['c-pot-101'],
      linkedTools: ['lims', 'servicereport'],
      sources: ['SANS 241-1:2015 + 241-2:2015', 'WHO — Climate-Resilient Water Safety Plans (training manual)', 'Drinking Water Management (DWS, 2024)'],
      modules: [
        { id:'m1', title:'SANS 241 in detail', duration:'60 min',
          summary:'The four risk classes, the determinand list, and the testing frequencies the standard demands.',
          sections:['Acute health (E.coli, NO₃, NO₂, CN, microcystin)','Chronic health (most metals, F, THMs)','Aesthetic vs operational determinands','Sampling frequency tied to population served'] },
        { id:'m2', title:'Designing the sampling matrix', duration:'50 min',
          summary:'How to layer raw, in-process, final and distribution samples without over-sampling.',
          sections:['Raw → coag → filter effluent → final → reservoir → tap','Statistical sub-sampling for large distribution networks','Operational micro vs full SANS 241 panel'] },
        { id:'m3', title:'Water Safety Plans (WSP)', duration:'70 min',
          summary:'WHO WSP framework — five modules from team formation to verification.',
          sections:['Module 1: Assemble team & describe system','Module 2: Hazard ID & risk assessment','Module 3: Control measures & validation','Module 4: Operational monitoring','Module 5: Management procedures, supporting programmes, periodic review'] },
        { id:'m4', title:'Climate resilience', duration:'40 min',
          summary:'Drought, flood, fire and ash impact on raw-water quality — the new chapter every utility now needs.',
          sections:['Drought / low-flow → concentration of pollutants','Post-fire ash, NOM and Mn surges','Flood pulses & turbidity spikes','Resilience interventions in the WSP'] },
        { id:'m5', title:'Non-conformance & CAPA', duration:'40 min',
          summary:'When a result falls out of spec — what the operator, manager and regulator each do next.',
          sections:['Immediate consumer-protection actions','Root-cause analysis (5-Why, fishbone)','Corrective + preventive action wording','Verification re-sampling and stand-down'] }
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
      linkedTools: ['coolingtower', 'waterindex', 'dosage', 'lims'],
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
      linkedTools: ['coolingtower', 'rocalc', 'waterindex'],
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
      linkedTools: ['rocalc', 'dosage', 'converters'],
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
      linkedTools: ['neutralise'],
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

    root.innerHTML = `
      <div class="hg-hero" style="background: linear-gradient(135deg, #7a59d4 0%, #00b1ca 100%);">
        <div>
          <h2 class="hg-hero-title">Hadron Academy</h2>
          <div class="hg-hero-sub">Water-treatment courseware — wired to the Hadron calc &amp; LIMS suite</div>
        </div>
        <div class="hg-hero-icon">🎓</div>
      </div>

      <div class="hg-kvgrid" style="margin-bottom: 18px;">
        <div class="hg-kv"><div class="k">Tracks</div><div class="v">${TRACKS.length}</div></div>
        <div class="hg-kv"><div class="k">Courses</div><div class="v">${totalCourses}</div></div>
        <div class="hg-kv"><div class="k">Started</div><div class="v">${startedCourses}</div></div>
        <div class="hg-kv"><div class="k">Modules done</div><div class="v">${totalCompleted}</div></div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">Pick a track</div>
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

      <div class="hg-card">
        <div class="hg-section-title">How it works</div>
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
      ${breadcrumb([{ label: 'Academy', view: 'home' }, { label: t.name, view: 'track', params: { trackId: t.id } }])}
      <div class="hg-hero" style="background: ${t.g};">
        <div>
          <h2 class="hg-hero-title">${esc(t.name)}</h2>
          <div class="hg-hero-sub">${esc(t.sub)}</div>
        </div>
        <div class="hg-hero-icon">${t.icon}</div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">Courses in this track</div>
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
                  <div style="font-size:22px; font-weight:700; color:${pct === 100 ? '#157b3a' : '#00b1ca'};">${pct}%</div>
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

    root.innerHTML = `
      ${breadcrumb([
        { label: 'Academy', view: 'home' },
        { label: t.name, view: 'track', params: { trackId: t.id } },
        { label: c.code, view: 'course', params: { courseId: c.id } }
      ])}

      <div class="hg-hero" style="background: ${t.g};">
        <div>
          <div style="font-size:12px; opacity:0.85; letter-spacing:0.4px;">${esc(c.code)} · ${esc(c.level)} · ${esc(c.duration)}</div>
          <h2 class="hg-hero-title" style="margin-top:4px;">${esc(c.title)}</h2>
          <div class="hg-hero-sub">${esc(c.summary)}</div>
        </div>
        <div class="hg-hero-icon">${t.icon}</div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">Learning outcomes</div>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.7;">
          ${c.outcomes.map(o => `<li>${esc(o)}</li>`).join('')}
        </ul>
      </div>

      ${c.linkedTools && c.linkedTools.length ? `
        <div class="hg-card">
          <div class="hg-section-title">Linked Hadron tools</div>
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
          <div class="hg-section-title">Prerequisites</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${c.prereqs.map(pid => {
              const pc = COURSES.find(x => x.id === pid); if (!pc) return '';
              return `<button class="hg-btn" onclick="academyGo('course',{courseId:'${pc.id}'})">${esc(pc.code)} ${esc(pc.title)}</button>`;
            }).join('')}
          </div>
        </div>` : ''}

      <div class="hg-card">
        <div class="hg-section-title" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Modules</span>
          <span style="font-size:13px; font-weight:500; color:${pct === 100 ? '#157b3a' : '#6b7684'};">${pct}% complete</span>
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

      <div class="hg-card">
        <div class="hg-section-title">Sources &amp; references</div>
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

    root.innerHTML = `
      ${breadcrumb([
        { label: 'Academy', view: 'home' },
        { label: t.name, view: 'track', params: { trackId: t.id } },
        { label: c.code, view: 'course', params: { courseId: c.id } },
        { label: m.title, view: 'module', params: { moduleId: m.id } }
      ])}

      <div class="hg-hero" style="background: ${t.g};">
        <div>
          <div style="font-size:12px; opacity:0.85; letter-spacing:0.4px;">Module ${idx + 1} of ${c.modules.length} · ${esc(m.duration)}</div>
          <h2 class="hg-hero-title" style="margin-top:4px;">${esc(m.title)}</h2>
          <div class="hg-hero-sub">${esc(m.summary)}</div>
        </div>
        <div class="hg-hero-icon">${t.icon}</div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">What you'll learn</div>
        <ul style="margin:0; padding-left:20px; line-height:1.8;">
          ${m.sections.map(s => `<li>${esc(s)}</li>`).join('')}
        </ul>
      </div>

      <div class="hg-card academy-lesson">
        <div class="hg-section-title">Lesson content</div>
        ${renderLessonBody(STATE.courseId, m.id, m.title)}
      </div>

      ${c.linkedTools && c.linkedTools.length ? `
        <div class="hg-card">
          <div class="hg-section-title">Practise with these tools</div>
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
            ${next ? `<button class="hg-btn primary" onclick="academyMarkAndNext('${m.id}', '${next.id}')">${isDone ? 'Next' : 'Mark complete &amp; next'}: ${esc(next.title)} →</button>`
                   : `<button class="hg-btn primary" onclick="academyMarkAndFinish('${m.id}')">${isDone ? 'Finish course ✓' : 'Mark complete &amp; finish course ✓'}</button>`}
          </div>
          ${isDone ? '<span class="hg-chip ok">✓ Completed</span>' : ''}
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
