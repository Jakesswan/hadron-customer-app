/* ============================================================
   HADRON ACADEMY — Lesson body content.
   Keys are 'courseId/moduleId' (matching academy.js COURSES[].modules[].id).
   Body uses tiny markdown (## h3, ### h4, blank-line paragraphs,
   - bullet, **bold**, _italic_, `code`).

   Sources cited per lesson follow the references uploaded by the user:
   WRC TT 265/06 — Handbook for the Operation of Water Treatment Works
   (Schutte 2006); Drinking Water Management (DWS 2024); Rand Water —
   Introduction to Water Treatment; Nalco Water Handbook (3rd ed., 2024
   compress); Chlorine Handling Information Pack; Basic Chemistry of
   Chlorination (USEPA); Paint Detack Treatment Guide; Food & Beverage
   Effluent Guide; Dissolved Air Flotation manual; Leopold filter manual
   (P. Leopold); WHO/UNICEF Climate-Resilient Water Safety Plan training
   manual; WISA 2008 P112 — Plant Operations.
   ============================================================ */

window._ACADEMY_BODIES = {

  /* ════════════════════════════════════════════════════════════════
     TRACK 1 — POTABLE WATER
     ════════════════════════════════════════════════════════════════ */

  /* ───── POT-101 — Introduction to Drinking Water Treatment ───── */

  'c-pot-101/m1': `## The water cycle and where contamination enters

Every drop you treat has been somewhere first. Rain falls onto a catchment, runs over rooftops, roads, farmland and informal settlements, picks up nutrients, microbes and chemical run-off, and ends up in a river, dam or aquifer. Groundwater spends months to centuries underground, dissolving minerals from the rock — calcium, magnesium, iron, sometimes nitrate from agriculture and uranium from natural deposits. By the time water arrives at the works, it carries the entire history of its catchment.

The treatment plant's job is to take whatever the catchment hands you and turn it into water that is _safe_ (no immediate health risk), _wholesome_ (palatable, odour-free, doesn't stain) and _stable_ (doesn't corrode pipes or scale them up).

## Public-health goals: acute vs chronic risk

Two categories of harm drive every standard:

- **Acute risk** — pathogens (E. coli, _Vibrio cholerae_, hepatitis A, _Cryptosporidium_) that make people sick within hours to days. Even one bad day at the plant can produce an outbreak.
- **Chronic risk** — chemicals (fluoride, lead, arsenic, nitrate, disinfection by-products) that cause harm only after months or years of exposure. The plant can't see the consequence today, so the standard demands continuous compliance.

Aesthetic problems (taste, odour, colour, hardness) are non-toxic but still cause public mistrust — unhappy customers buy bottled water and stop trusting your plant.

## SANS 241:2015 vs WHO guidelines

The South African standard SANS 241:2015 is the legally binding minimum. It splits determinands into four risk classes — _acute health_, _chronic health_, _aesthetic_, _operational_ — each with maximum allowable limits and a sampling frequency tied to the population served. The WHO _Guidelines for Drinking-water Quality_ (4th ed.) is the international reference SANS draws from. Where SANS is silent (e.g. a new emerging pollutant), look to WHO.

_Source: WRC Handbook (Schutte 2006), Ch A2; SANS 241:2015 Parts 1 & 2; WHO 4th ed._`,

  'c-pot-101/m2': `## Surface water — variability, algae and NOM

Rivers and dams are the most common raw-water source in South Africa. Their defining feature is _variability_: turbidity can swing from 5 NTU on a calm winter day to 5 000 NTU after a storm. Algal blooms in eutrophic dams produce taste-and-odour metabolites (geosmin, MIB) and, more dangerously, cyanotoxins like microcystin. Natural organic matter (NOM) — humic and fulvic acids leached from soil — gives water its yellow-brown tea colour, demands coagulant and chlorine, and produces THMs and HAAs when chlorinated.

The operator's first job on surface water is to know the source: where does the intake sit, how does turbidity behave seasonally, when does the dam stratify and turn over, what are the upstream landowners doing?

## Groundwater — hardness, iron, manganese, nitrate

Groundwater feels easier — it's microbiologically clean, low turbidity, stable from one day to the next. The traps are dissolved minerals:

- **Hardness** (Ca²⁺ + Mg²⁺) above 300 mg/L scales kettles and ruins geysers
- **Iron** above 0.3 mg/L stains laundry orange the moment it oxidises
- **Manganese** above 0.1 mg/L stains everything black, and fails SANS 241
- **Nitrate** from agriculture above 11 mg/L (as N) causes blue-baby syndrome
- **Fluoride** in dolomitic and igneous regions can naturally exceed 1.5 mg/L
- **Uranium** in some Karoo and West Rand boreholes is regulated at 0.03 mg/L

Each of these needs targeted treatment — aeration + filtration for Fe/Mn, ion exchange or RO for nitrate, blending or RO for U.

## Reuse — direct and indirect potable

Cape Town and Beaufort West have demonstrated that water-scarce cities will eventually need to drink their own treated effluent. _Indirect potable reuse_ blends advanced-treated effluent into a dam first; _direct potable reuse_ feeds it straight into the distribution system. Both demand a multi-barrier train (MBR + RO + advanced oxidation + GAC + chlorination) and a level of monitoring and operator competency well beyond a conventional works.

## Catchment management

The cheapest treatment is the one you don't have to do. Protecting the catchment — buffering riparian zones, regulating land-use, stopping sewer discharge upstream — keeps NOM, microbial and chemical loads down and the chemistry of the works simpler.

_Source: WRC Handbook Ch A1; Rand Water — Introduction to Water Treatment (Module 2); Drinking Water Management (DWS 2024) Ch 3._`,

  'c-pot-101/m3': `## The block diagram

The conventional drinking-water train is a sequence of unit processes, each fixing one problem before the next stage is overwhelmed:

1. **Screening** — bar racks remove twigs, fish, rags
2. **Pre-chlorination / pre-oxidation** — kills algae, breaks NOM, oxidises Fe/Mn
3. **Coagulation + flocculation** — destabilises colloids and grows floc
4. **Sedimentation or DAF** — removes the settleable / floatable solids
5. **Filtration** — polishes the remaining turbidity
6. **Disinfection** — kills surviving pathogens, leaves a residual
7. **Stabilisation** — pH-adjust + lime/CO₂ for non-corrosive water
8. **Storage and distribution** — clear well, reservoirs, network

Each stage exists because the next one can't cope without it. A filter can't run for more than a few hours on raw 100-NTU water; a chlorinator can't develop a residual in a turbidity > 1 NTU because chlorine demand never satisfies.

## Direct filtration vs conventional vs DAF-conventional

Three common variations:

- **Conventional** — full coagulation → flocculation → sedimentation → filtration. Best for variable, high-turbidity surface water.
- **Direct filtration** — coagulation → in-line floc → filtration only. Works on low-turbidity (< 10 NTU), low-colour raw water; about 30 % cheaper to build.
- **DAF + filtration** — coagulation → DAF → filtration. Best for algae-heavy, low-density floc waters where settling is poor.

## Membrane and hybrid trains

Microfiltration (MF) and ultrafiltration (UF) replace conventional clarification + filtration in one footprint, deliver ≤ 0.1 NTU permeate every minute of the day, and are the de-facto choice for new small-to-medium plants. Nanofiltration removes hardness and NOM. RO is reserved for desalination and reuse. Hybrid trains pair UF with conventional pre-treatment to handle bad raw water.

## Storage and contact time

The clear well does double duty: it provides _Ct_ for disinfection (concentration × contact time) and acts as a buffer between the works and the network. Baffled clear wells get a t10/T ratio of 0.7+; unbaffled ones drop to 0.3 and the operator has to dose more chlorine for the same kill.

_Source: WRC Handbook Part B; Rand Water Module 3._`,

  'c-pot-101/m4': `## The pre-shift walk-down

Every shift starts the same way: walk the plant. Look, listen, smell. The eye, the ear and the nose still catch problems an SCADA dashboard misses — a drip from a flange, a hum that wasn't there yesterday, the chlorine smell that means a leak.

A pre-shift checklist that most works use:

- Raw-water turbidity, colour and pH on the inlet
- Coagulant tank levels and pump operation
- Filter head loss across the filter bank
- Clear-well level and disinfection residual
- Final pH and conductivity
- Chemical-store dyke clean and dry
- Any alarms in the control room since last shift

Make it a written form, not a memory test.

## Sample regimen

The lab gets two streams of samples: _operational_ (high-frequency, turbidity / pH / residual Cl on every shift) and _compliance_ (full SANS 241 panel weekly, monthly or quarterly depending on population served). Operational samples drive day-to-day decisions; compliance samples prove to the regulator the standard was met.

## The logbook

A logbook is a legal record. Time-stamp every entry, sign every page, never tear out a page, never write in pencil. If a court of inquiry asks you in two years what you dosed at 04:30 on a Tuesday morning, the logbook must answer. Counter-sign the hand-over with the incoming shift — that signature transfers responsibility.

## Escalation: when to phone

Three tiers:
1. **Internal** — process upset that can be fixed on shift; supervise and log
2. **Manager** — exceedance of operational limit or extended chemical-feed failure; phone within 15 minutes
3. **Regulator + public-health authority** — exceedance of SANS 241 acute-risk parameter (E. coli, NO₃, microcystin) or water unfit for consumption; immediate notification and consideration of a boil-water notice

_Source: WISA 2008 P112 — Plant Operations; WRC Handbook Ch C2._`,

  'c-pot-101/m5': `## Knowledge check

Ten short questions covering the four prior modules. Score yourself; revisit any module where you score below 8/10.

1. Name three classes of contaminant a treatment plant exists to remove.
2. State the SANS 241 limit for E. coli in drinking water.
3. List the eight unit processes of a conventional treatment train, in order.
4. What is the difference between operational and compliance sampling?
5. Which two metals stain laundry and bathroom fittings, and at what threshold?
6. Define _Ct_ and explain why a baffled clear well delivers more of it than an unbaffled one.
7. When does direct filtration beat conventional treatment?
8. Why is groundwater rarely a microbiological problem but commonly a chemical one?
9. List three items on a pre-shift walk-down checklist.
10. What triggers an immediate regulator notification?

## Suggested study path from here

If you scored 9–10/10, move on to **POT-201 Coagulation, Flocculation & Sedimentation**.
If you scored 6–8/10, revisit module 3 (the treatment train) and module 4 (operator routine) before progressing.
If below 6/10, work back through all four modules — these are the foundations every other Potable course builds on.

_Self-assessment compiled from WRC Handbook end-of-chapter questions and Rand Water training-module recap quizzes._`,

  /* ───── POT-201 — Coagulation, Flocculation & Sedimentation ───── */

  'c-pot-201/m1': `## Why colloids float around forever

A colloid is a particle small enough (1 nm – 1 µm) that thermal motion of water molecules keeps it suspended indefinitely. Clay, silt, bacteria, viruses, NOM macromolecules, oil droplets — all colloids. In raw water they carry a negative surface charge. Because every particle has the same charge, they repel each other and refuse to come together. Left alone, your raw-water sample will still be turbid in a year.

This is the core problem of clarification: not removing big particles (those settle by themselves), but _persuading colloids to attach to each other_ so that the agglomerate is big and dense enough to settle or filter out.

## Zeta potential and the electrical double-layer

A negatively charged colloid attracts positive ions from the surrounding water. Right at the surface those counter-ions are tightly bound (Stern layer); a little further out they are loosely associated and shaded by thermal motion (diffuse layer). Together they form the _electrical double-layer_. The voltage you measure at the boundary between the bound and the diffuse layer is the **zeta potential** — typically –20 to –30 mV in South African surface water.

Coagulation works by knocking that zeta potential close to zero so the inter-particle repulsion disappears.

## Four ways to destabilise a colloid

1. **Double-layer compression** — add a high-ionic-strength salt; the diffuse layer collapses and zeta potential drops. Works in seawater; not the route used in drinking water.
2. **Charge neutralisation** — add a multivalent positive ion (Al³⁺, Fe³⁺, cationic polymer). It adsorbs onto the negative surface and neutralises it. The classic alum / ferric mechanism.
3. **Sweep coagulation** — overdose alum or ferric so it precipitates as a voluminous Al(OH)₃ or Fe(OH)₃ floc; colloids get caught up in the precipitate as it settles. Uses 30–60 mg/L alum.
4. **Bridging** — add a long-chain polymer that adsorbs onto multiple colloids simultaneously, physically linking them. Anionic and non-ionic polymers act this way.

Most plants run a **dual programme** — a primary coagulant (alum, ferric or PAC) that destabilises by charge neutralisation + sweep, and a secondary polymer that bridges the destabilised particles into bigger, denser floc. The optimum dose for each is found by jar-test, _not_ by formula.

_Source: WRC Handbook Ch B1; Rand Water Module 4; Bratby — _Coagulation and Flocculation in Water and Wastewater Treatment_._`,

  'c-pot-201/m2': `## Alum (aluminium sulfate)

Cheap, widely available, depresses pH (acid-demanding). Dose 5–60 mg/L as Al₂(SO₄)₃·18H₂O. Optimum coagulation pH 5.8–7.5. Each 1 mg/L of alum destroys ≈ 0.5 mg/L of alkalinity, so soft / low-alkalinity water needs lime co-dose. Aluminium residual in finished water must stay < 0.3 mg/L (SANS 241 operational).

## Ferric chloride / ferric sulfate

Higher coagulant cost than alum but stronger over a wider pH window (4–10) and better at NOM removal — important for THM control. Ferric makes a denser, faster-settling floc. Side effects: orange tint to the floor, iron stain on concrete, and you need careful pump material selection (Hastelloy or PVC-lined steel).

## PAC (polyaluminium chloride)

Pre-polymerised aluminium with chloride / hydroxide ligands. Less acid demand than alum, broader optimum pH window (5–9), works in cold water (< 5 °C) where alum struggles, and lower aluminium residual. About 30 % more expensive but typically 10–20 % less dose needed. Most new SA plants now run PAC as primary.

## Organic polymers (polyelectrolytes)

- **Cationic** (poly-DADMAC, polyamine) — primary coagulant on low-turbidity water, partial replacement for alum
- **Anionic** (polyacrylamide–acrylate copolymer) — bridging flocculant, dosed at 0.1–1 mg/L after the primary
- **Non-ionic** (polyacrylamide) — bridging in low-ionic-strength water

Polymers are powerful — overdose produces _re-stabilised, sticky_ colloids that pass straight through the filter. Underdose and there's no bridging. The jar test is your only honest answer.

## Sludge and side-effects

Alum/ferric programmes generate hydroxide sludge — about 1.4 kg dry solids per kg coagulant added. Polymer programmes add comparatively little sludge. Sludge handling is _the_ bottleneck of many SA plants and a big driver of operational cost (Module 7 of WRC Ch B7 is dedicated to it).

_Source: WRC Handbook Ch B1; Nalco Water Handbook Ch 8 (Coagulants & Flocculants)._`,

  'c-pot-201/m3': `## What a jar test actually proves

The jar test is the single most useful tool in clarification. In 30 minutes it answers: (1) what coagulant works on _this_ raw water _today_, (2) at what dose, (3) at what pH, (4) what polymer type and dose helps, (5) how fast does the floc settle. No projection software replaces it.

## Equipment and stock prep

Standard kit is a 6-paddle stirrer with one-litre square Phipps & Bird beakers. Stock solutions:

- Alum / ferric: 1 % w/v (10 g/L) — 1 mL added to 1 L beaker = 10 mg/L
- Polymer: 0.1 % w/v (1 g/L) — 1 mL = 1 mg/L (always pre-wet polymer; never dump dry)
- Lime / soda ash for pH adjustment: separate stocks 1 % each

## The dose ladder

A typical first-pass ladder for surface water at 50 NTU:
beaker 1 = 5 mg/L, 2 = 10, 3 = 20, 4 = 30, 5 = 45, 6 = 60 mg/L.

If turbidity is < 5 NTU, drop the ladder to 1–15 mg/L. If > 200 NTU, climb to 80 mg/L.

## The mixing programme

| Step | Speed | Time |
|------|-------|------|
| Rapid mix | 200 rpm | 1 min |
| Tapered floc | 60 → 30 rpm | 15 min |
| Settle (paddle out) | — | 20 min |

Pull samples 2 cm below the meniscus, measure NTU and UV-254. The lowest NTU + UV-254 within an acceptable settled-time window is the optimum dose. Don't pick the very first beaker that hits 0.5 NTU — you want the dose at which the system is _robust_, not just at minimum.

## Confirming with full-scale

A jar test is a sanity check, not gospel. Always confirm jar-test optimum at the works by stepping plant dose toward it, watching settled-water turbidity for 4–6 hours. Floc behaviour at 200 m³/h is never quite what 1 L beakers showed.

_Source: WRC Handbook Ch B1.4; Rand Water Coagulation Practical (Lab Manual)._`,

  'c-pot-201/m4': `## What G·t actually means

The intensity of mixing is measured by the velocity gradient _G_ (s⁻¹) — essentially how violently neighbouring water layers shear past each other. Camp & Stein's equation:

  G = √(P / (μ · V))

where P is power input (W), μ is dynamic viscosity (Pa·s), V is tank volume (m³).

G·t (the dimensionless product of G and contact time) controls whether floc forms, grows or shears apart.

## Targets

| Stage | G | Time | G·t |
|-------|---|------|-----|
| Rapid mix | 700–1000 s⁻¹ | 30–60 s | 30 000 – 60 000 |
| Floc 1 | 70 s⁻¹ | 8 min | 33 600 |
| Floc 2 | 50 s⁻¹ | 8 min | 24 000 |
| Floc 3 | 30 s⁻¹ | 8 min | 14 400 |

The _tapered_ floc design — high G first to grow many small floc, lower G later so they don't shear apart — gives the densest, fastest-settling floc.

## Sizing the impeller

For a paddle flocculator with paddles:

  P = 0.5 · Cd · ρ · A · v_rel³

where Cd ≈ 1.8, A = paddle area, v_rel = relative velocity between paddle and water (typically 0.75 × paddle tip speed). For axial-flow turbines:

  P = Np · ρ · n³ · D⁵

where Np is power number from manufacturer (1–6 typical), n = rev/s, D = impeller diameter.

Plug into Camp's equation, solve for the impeller speed that gives the target G.

## Common G·t mistakes

- Skipping the rapid mix and going straight from coagulant injection to flocculator → poor charge-neutralisation, big polymer demand
- Single-stage floc at constant G → either too much shear (small floc) or too little growth (loose floc)
- Over-baffling the rapid mix → dead zones, plug-flow rather than complete-mix
- Variable plant flow → G drops at low flow because most flocculators are fixed-speed; consider VSDs or a step-down train

_Source: WRC Handbook Ch B1.5; Kawamura — _Integrated Design and Operation of Water Treatment Facilities__._`,

  'c-pot-201/m5': `## The three contenders for clarification

After flocculation the water needs the floc taken out before filtration. Three approaches dominate:

### Conventional sedimentation
Floc settles by gravity in long, shallow rectangular or large circular tanks. Surface overflow rate (SOR) — the design parameter — is m³/m² · h, equivalent to the upflow velocity a particle has to overcome. For alum floc, design SOR is 1.5–2.5 m/h; ferric floc tolerates 2.5–3.5 m/h. Detention time 2–3 h. Efficient, robust, large footprint.

### Plate / lamella settlers
Tilted plates inside the basin reduce the settling distance from metres to centimetres. Effective SOR climbs to 5–10 m/h, footprint shrinks 3–5×. Trade-offs: more sludge build-up between plates, harder to clean, sensitive to high solids. Widely used for retrofit / upgrade where land is scarce.

### Sludge-blanket (solids-contact) clarifiers
Up-flow design with the floc held suspended as a fluidised "blanket". Incoming raw water passes through the blanket, which acts as a contact zone — colloids stick to the blanket and the clear effluent overflows the top. SOR up to 4 m/h on a stable blanket. Excellent for waters with consistent turbidity; intolerant of swings.

## When DAF beats sedimentation

Dissolved Air Flotation reverses gravity — instead of settling solids, it floats them on millimetre-scale microbubbles. DAF wins when:

- floc is low-density (algae, NOM-rich water, oily emulsions)
- raw turbidity is < 50 NTU (settling won't pack)
- footprint is constrained (DAF rate 10–15 m/h vs sedimentation 2.5)
- cold water (< 8 °C) — settling slows; DAF doesn't care

DAF is more capital-intensive (saturator, recycle pump, fine bubble diffusers) but the floor area saving usually wins on new plants where the source is a eutrophic dam.

_Source: WRC Handbook Ch B2; DAF Manual (uploaded); Bratby Ch 7._`,

  'c-pot-201/m6': `## Setting up the worked example

The Hadron Coagulants Calculator does this in 30 seconds, but the operator must understand what's happening underneath.

**Plant data:**
- Plant flow: 0.5 ML/d = 500 m³/d = 20.83 m³/h
- Target dose (from jar test): 35 mg/L of polyaluminium chloride
- Product strength (active PACL₃): 18 % w/v
- Product density: 1.20 kg/L
- Operating hours: 24 h/day

## Daily and monthly active mass

Daily active dose:
  500 m³/d × 35 g/m³ = 17 500 g/d = 17.5 kg/d (active)

Monthly = 17.5 × 30 = 525 kg/d (active).

## As-delivered product flow

The 18 % strength means 18 g of active per 100 g of product, so:
  Daily as-delivered mass = 17.5 / 0.18 = 97.2 kg/d
  Daily as-delivered volume = 97.2 / 1.20 = 81.0 L/d
  Hourly pump flow = 81.0 / 24 = 3.38 L/h

## Pump calibration target (mL/min)

  3 380 mL/h ÷ 60 = 56 mL/min

Catch in a measuring cylinder for one minute on the pump's discharge — that's your verification.

## Sanity-check against jar test

The jar-test optimum was 35 mg/L. If the operator dialled in 56 mL/min and the settled-water turbidity is _higher_ than the jar showed at 35 mg/L, something else is wrong: the pump may be cavitating, the stock may have aged, or raw-water chemistry has shifted since the jar was run. Re-jar-test.

## Operator habits

- Re-jar-test at minimum weekly, more often after rainfall events
- Log dose, settled NTU and final turbidity on every shift
- Replace pump tubing on schedule (peristaltic) or check diaphragm condition (diaphragm)
- Flush the dosing line if changing products

_Source: WRC Handbook Ch B1.6; Hadron Coagulants Calculator user guide._`,

  /* ───── POT-202 — Filtration: Sand, Multimedia & Leopold ───── */

  'c-pot-202/m1': `## Why filter at all

Settling tanks remove the bulk of the floc, but ≥ 1 NTU residual is normal and ≤ 0.3 NTU is required for safe disinfection. Filtration is the polishing step that bridges that gap. It also captures pathogens that survived clarification — _Cryptosporidium_ and _Giardia_ in particular, where SANS 241 demands ≥ 3-log removal.

## Rapid sand filter

The original. A bed of 0.7–1.2 m of silica sand (effective size 0.5–0.7 mm, uniformity coefficient < 1.7) on a gravel support. Rate 5–8 m/h. Run lengths 24–72 h. Backwashed by reversing flow at 36–55 m/h, optionally with air scour. Cheap, robust, well-understood. Limitation: the surface clogs first, head loss climbs sharply, and most of the bed depth is wasted as a sterile zone.

## Dual-media (anthracite + sand)

A 0.5 m cap of anthracite (effective size 1.0–1.2 mm) on top of a 0.3 m sand layer. The coarser, less dense anthracite sits on top; the finer, denser sand sits below. Floc penetrates _into_ the bed before clogging the surface, so the head loss curve is gentler and run lengths grow to 36–96 h. Dominant choice for new plants in SA.

## Multimedia (anthracite + sand + garnet)

Three-layer bed (1.0 mm anthracite + 0.5 mm silica + 0.3 mm garnet). The deepest layer is the densest and finest — depth filtration follows the natural pore-size gradient. Rate 8–15 m/h achievable, run lengths longer still. Capital and replacement cost higher; mainly used where filtration rate is the limiting factor.

## Slow sand filter

A different beast — 0.5–1.0 m of fine sand (effective size 0.15–0.3 mm) operating at 0.1–0.2 m/h. The biological _schmutzdecke_ on the surface does most of the work — bacteria, protozoa and a thin gel layer. No coagulant, no backwash; you scrape the top 20 mm off every 1–6 months. Brilliant for small communities with raw water < 10 NTU, low-energy and operator-friendly. Just needs land.

_Source: WRC Handbook Ch B3; Rand Water Module 5._`,

  'c-pot-202/m2': `## Why the underdrain matters

The underdrain has two jobs: collect filtered water on service, and distribute backwash water + air uniformly across the whole bed. A bad underdrain produces dead zones (channels of unwashed media), preferential flow on service (turbidity breakthrough), or media loss to the trough.

## Leopold Type-S blocks

The Leopold underdrain is the de-facto SA standard. Plastic blocks bolt to the filter floor in modular sheets, with a low-flow plenum below. Two-stage flow path: water enters the plenum, then percolates upward through media-retaining slots in the block top. Distribution non-uniformity is < 5 % across a typical 25-50 m² cell.

Variants: Type S (slotted top), Type SL (low-profile), Type Universal (gravel-less for shallow filters). The Hadron Group is a long-standing distributor of Leopold systems in SA.

## Gravel layers (or no gravel)

Traditional rapid-sand filters use 200–300 mm of graded gravel between the underdrain and the sand to prevent media migration. Modern Leopold blocks with their fine slots (0.25 mm typical) eliminate the need for gravel — saves 200 mm of bed depth and avoids the long-term problem of gravel mounding during repeated backwash.

## Air scour

Pre-1980 designs used water-only backwash. Modern designs use _air scour first_ (50–80 m/h for 2–3 min) to break up surface mud-balls, then air + water (sub-fluidisation), then water-only (40–55 m/h for 5–8 min) to lift solids out of the bed. Air scour cuts backwash water consumption by ~30 % and dramatically cleans the bed.

## Wash troughs and rise rate

Wash troughs sit 250–400 mm above the unexpanded bed. Backwash water carries solids up to the trough lip and overflows to waste. Rise rate (linear velocity over the trough) is typically 0.2–0.5 m/min — too low and solids settle back; too high and media migrates over the lip. Trough geometry (V-notch vs flat) and spacing matter for even collection.

_Source: P. Leopold filter design manual (uploaded); WRC Handbook Ch B3.4; Kawamura Ch 6._`,

  'c-pot-202/m3': `## Three reasons to take a filter off-line

1. **Time-based** — fixed run length (e.g. 48 h)
2. **Head-loss based** — when terminal head loss is reached (typically 2.4 m on a gravity filter, or 0.5–0.7 bar on a pressure filter)
3. **Turbidity-breakthrough** — when filtered turbidity rises through 0.3 NTU (some plants 0.1 NTU for _Crypto_ removal)

The earliest of the three triggers wins. A well-designed filter usually hits head loss before breakthrough, but operationally you should monitor both.

## Reading a filter profile

Plot turbidity and head loss against run time:

- **Healthy filter** — flat low turbidity with a slow rise in head loss
- **Surface-clogged** — head loss climbs sharply, turbidity stays flat (bed is filtering, surface needs backwash)
- **Breakthrough** — turbidity rises fast at constant head loss (bed depth is exhausted)
- **Negative head** — head loss exceeds water depth above sand; air comes out of solution and binds the bed

If you see breakthrough _before_ head loss limit, your media is too coarse or run rate is too high.

## Filter ripening

For 5–15 minutes after backwash, the cleaned filter shows elevated turbidity (the so-called _ripening peak_) — chemical residuals and stranded solids flush out as new floc layers establish. Plants that care about _Cryptosporidium_ (Stage 2 D/DBP rule territory) run **filter-to-waste**: divert ripening water to drain, return to service only when filtered turbidity is < 0.2 NTU.

## The 0.3 NTU rule

USEPA Surface Water Treatment Rule says combined-filter-effluent turbidity must be ≤ 0.3 NTU in 95 % of monthly readings. Stage 2 D/DBP tightens individual filters to ≤ 0.15 NTU at end of ripening. SANS 241:2015 sets a single 1.0 NTU limit but expects operational targets well below — most South African utilities run a 0.3 NTU rolling target.

_Source: WRC Handbook Ch B3.5; USEPA SWTR / Stage 2 D/DBP Rule._`,

  'c-pot-202/m4': `## Mud-balls

Symptom: head loss climbs slowly even on a fresh bed; backwash water comes off cloudy with chunks. Cause: insufficient air scour, low backwash rate, or coagulant-laden floc cementing media grains together. Fix: stronger air scour, longer total backwash time, occasionally a chemical "washdown" with chlorine or caustic in the backwash water.

## Air binding (negative head)

Symptom: filtered flow drops, you can hear bubbles from the bed during a run. Cause: head loss exceeds the static water column over the sand, so dissolved gas comes out of solution inside the bed. Fix: keep filter level high enough that the water column above sand always exceeds head loss; reduce run length; consider raising the wash trough.

## Channelling and short-circuiting

Symptom: turbidity breakthrough at unusually low head loss, but only on certain filters. Cause: poor underdrain distribution, side-wall short-circuit, or media migration leaving open paths. Fix: probe the bed with a long rod for soft spots; consider a complete backwash + air scour cycle, or a "double backwash" to redistribute media.

## Slow-sand schmutzdecke

For slow sand filters: when filtered turbidity climbs slowly over weeks or filter rate drops at constant head, scrape the top 20 mm of sand. The scraped sand is washed and re-deposited bottom-of-bed at the next major service (every 5–10 scrapings). The schmutzdecke recovers over 1–2 weeks ("ripening").

## Side-wall cracking

On gravity filters, you may see the media pull away from the side walls — a 5–10 mm crack runs around the perimeter. Cause: backwash flow short-circuits up the wall; can be a sign of filter wash trough mis-installation. Fix: re-level troughs, increase air scour at the start of backwash to lift the perimeter.

_Source: WRC Handbook Ch B3.6 (trouble-shooting); Hadron site reports._`,

  'c-pot-202/m5': `## Walking a filter from start to finish

This is the operator's drill — what you actually do, not what the textbook says.

**T+0 (start of run, just backwashed):**
- Filter level: above sand, below trough lip
- Open inlet valve slowly to set rate
- Open filter-to-waste valve if used
- Watch turbidity ramp down through 1, 0.5, 0.3 NTU
- When < 0.2 NTU stable for 5 min, switch from waste to service

**T+30 min (early run):**
- Confirm turbidity stable at < 0.1 NTU
- Note head loss reading (typical 0.2–0.3 m at start)
- Log on shift sheet

**T+12 h (mid-run):**
- Inspect filter top for media disturbance, surface mud
- Confirm filtered turbidity still in spec
- Note head loss (climbing slowly, typically 0.6–1.0 m)

**T+terminal (end of run):**
- Head loss approaches 2.4 m (gravity) or pre-set trigger
- Switch out of service to wash sequence
- Drain to wash level (or not, if pressure-filter)

**Backwash sequence (typical):**
1. Air scour 60 m/h × 2 min — mud-ball break
2. Air + water 45 + 35 m/h × 3 min — sub-fluidised wash
3. Water only 50 m/h × 5–7 min — fluidised wash
4. Drain to settle, refill to ripen, return to service

Total backwash water ≈ 1–3 % of plant production.

## Verification

After backwash, take a sample at the underdrain — a clean sample = clean bed. Filter run begins again.

_Source: WRC Handbook Ch B3.7; Operator drill cards (Rand Water training)._`,

  /* ───── POT-301 — SANS 241 Compliance & Water Safety Plans ───── */

  'c-pot-301/m1': `## The structure of SANS 241

SANS 241:2015 has two parts: **241-1** sets the maximum allowable limits, **241-2** sets the sampling and analytical methods. Both must be read together — citing a value without the corresponding method is not compliance.

## The four risk classes

Every determinand falls into one of four classes:

- **Acute health** — _E. coli_, NO₃ (as N), NO₂, CN, microcystin. A single exceedance is a public-health emergency. SANS demands 100 % compliance.
- **Chronic health** — most metals (As, Cd, Pb, Hg, Cr, Ni, Se, U), F, total THMs. Long-term exposure causes harm; SANS allows 95 % compliance with annual averages.
- **Aesthetic** — colour, taste, odour, hardness, Cl⁻, SO₄, Na, Fe, Mn, Zn, NH₃. Non-toxic but customer-facing; 95 % compliance.
- **Operational** — pH, EC, TDS, turbidity, free chlorine, Cl₂ residual, Total Coliforms, HPC. Indicators of treatment performance, not direct health; 95 % compliance.

## Sampling frequency tied to population

SANS scales sampling intensity to population served — a small rural works (500 people) might need 4 micro samples per month, while a metro utility (1 million+) needs 200+ per month plus distribution-network sampling.

## Operational vs full panel

Daily operational monitoring (pH, turbidity, free Cl on every shift) is _not_ SANS compliance — it's process control. SANS is the periodic _full panel_ run by an accredited lab. Both are needed; both go on the audit shelf.

## Reading the standard

The actual SANS document is dense. The DWS _Drinking Water Management_ guide (2024) is the operator-friendly companion that explains how the standard is enforced via the Blue Drop / No Drop programme.

_Source: SANS 241:2015 Parts 1 & 2; Drinking Water Management (DWS 2024) Ch 4-6._`,

  'c-pot-301/m2': `## A layered sampling scheme

The compliance sampling matrix has three layers:

### Source / raw water
Catches catchment-scale changes — algal blooms, agricultural run-off, upstream sewer spills. Monthly full-panel + daily operational micro at the intake.

### In-process
After each unit operation: post-coagulation, post-filtration, pre- and post-disinfection, post-chlorine-contact tank. These are operational samples (turbidity, residual Cl, pH) used by the operator to drive treatment, not SANS compliance.

### Final / distribution
The legally required samples. Final is post-chlorination at the works boundary. Distribution samples sweep the network at multiple representative points (weekly micro, monthly chemistry).

## Statistical sub-sampling for big networks

Joburg's network has ≈ 14 000 km of pipe. You can't sample everything every month. SANS allows _statistically representative_ sampling — a defined sub-set rotated quarterly, with critical points (dead-ends, tower bases) sampled monthly. The plan must be documented and defended to the regulator.

## What "operational" really means

SANS 241-2 lists test methods (e.g. APHA 4500-Cl G for free chlorine). Choosing the right method matters: a comparator-tube DPD test is operational (good enough for daily), but a SANAS-accredited DPD photometer reading is what the regulator counts. Operators who try to substitute one for the other lose audits.

## The compliance file

Every sample produces a chain-of-custody, an analytical report, a CoA, and a record in the LIMS. The compliance file is what an auditor sees first. Disorganised files = automatic fail.

_Source: SANS 241-2:2015; DWS Drinking Water Management Ch 5; Hadron LIMS Compliance reporting._`,

  'c-pot-301/m3': `## Why WSPs exist

A SANS-241 standard tells you what the water must look like. A **Water Safety Plan** tells you how to keep it that way. WHO formalised the WSP framework in 2004 — a risk-based, preventive approach that pulls the entire catchment-to-tap system into one document.

## The five WSP modules

1. **Assemble the team and describe the system** — every stakeholder from catchment manager to plumber, plus a complete process flow diagram with control points.
2. **Hazard identification and risk assessment** — every conceivable hazard (microbial, chemical, physical, radiological) at every step. Score each on likelihood × consequence (1–5 each, score 1–25). Anything > 12 is unacceptable risk and demands a control measure.
3. **Control measures and validation** — for each unacceptable risk, specify the barrier (coagulation, disinfection, distribution-network integrity). Validate that the control _actually works_ at the design rate.
4. **Operational monitoring** — define what to measure, where, how often, and the trigger value that says the control has failed (e.g. turbidity > 0.5 NTU after filter for > 15 min).
5. **Management procedures, supporting programmes, and periodic review** — corrective action, training, internal audit, annual WSP refresh. The WSP is a living document, not a once-off paper exercise.

## Documenting the WSP

A typical full WSP runs 80–200 pages: process diagram, hazard register, risk matrix, monitoring table, escalation procedures, contact lists, training records. The whole thing sits in the LIMS Documents module so it's revision-controlled.

## How South African utilities use WSPs

Blue-Drop assessment now requires a WSP. Many works treat it as a tick-box exercise; the ones that genuinely live their plan get noticeably better outcomes — fewer outbreaks, lower chemical cost, faster response to upsets.

_Source: WHO Climate-Resilient WSP Training Manual (uploaded); Drinking Water Management (DWS 2024) Ch 7._`,

  'c-pot-301/m4': `## Why climate matters now

Catchments don't behave the way they did 20 years ago. Drought concentrates pollutants. Veld fires deposit ash and increase NOM. Floods produce 1000-NTU turbidity pulses that overwhelm conventional treatment. Sea-level rise threatens coastal abstraction with salinity intrusion. The WHO's 2023 update to the WSP framework adds a _climate-resilience_ chapter for exactly this reason.

## Drought scenarios

Lower flows = higher concentration of every dissolved species. Ammonia, nitrate, sulfate, dissolved metals all climb. Algal blooms thrive in still warm water. The treatment plant's coagulant demand rises sharply, chlorine demand rises with NOM and ammonia. Operators need an in-place "low-flow operating mode" plan.

## Post-fire ash and NOM surges

When a catchment burns, the next rain washes ash + char + nutrients into the source water. NOM (as TOC) can quadruple. Coagulant dose triples. Manganese and iron leach out. Some plants in Cape Town and KZN saw chlorine-demand spikes of 5× post-fire. Stockpile coagulant; consider PAC for its broader pH window.

## Flood pulses

Heavy rain pushes turbidity from 30 NTU baseline to 1 000+ NTU in hours. Conventional sedimentation chokes; filters break through. Pre-sedimentation or bypass storage helps; many plants have an emergency "raw water lagoon" specifically for storm events.

## Sea-level rise and salinity intrusion

Coastal abstraction (Bushman's River, Knysna, eThekwini coastal works) is increasingly hit by tidal salinity. Conductivity climbs from 30 mS/m to 200+ during spring high tides. RO becomes the only viable treatment.

## Resilience interventions in the WSP

The WSP must specify _what changes_ during each scenario: dose ranges, alternate raw sources, customer demand-side actions, emergency disinfection. A plant that has run its WSP through tabletop scenario exercises responds in hours; one that hasn't responds in days.

_Source: WHO Climate-Resilient WSP Training Manual (uploaded), Modules 4–6._`,

  'c-pot-301/m5': `## What constitutes a non-conformance

A non-conformance (NC) is any departure from the specified treatment / sampling plan or any analytical result outside SANS limits. It can be:

- **Process** — coagulant feed pump tripped for 4 h
- **Quality** — turbidity > 1.0 NTU for an hour
- **Compliance** — E. coli detected in distribution
- **System** — calibration overdue on the residual analyser

Every NC must be logged in the LIMS, regardless of severity.

## Immediate actions

For an _acute health_ exceedance (e.g. E. coli):
1. Re-sample immediately (within 1 h)
2. Phone the plant manager and public-health authority
3. Check disinfection — residual, contact time, dose
4. If confirmed on second sample, consider boil-water notice
5. Increase chlorine residual at affected zone
6. Sample upstream and downstream to localise
7. Issue customer notification within 24 h

For a chronic-health exceedance, the timeline is days, not minutes — but still requires re-sample, RCA, action.

## Root-cause analysis

The 5-Why technique is the simplest reliable method:

> _Why did E. coli appear in zone 4?_ — Reservoir 4B was emptied for cleaning.
> _Why did emptying introduce E. coli?_ — Inspection hatches were left open for 6 h.
> _Why were hatches left open?_ — No SOP for cleaning procedure.
> _Why no SOP?_ — Reservoir cleaning was outsourced; contractor procedure not adopted.
> _Why not adopted?_ — Procurement specification didn't require it.

The corrective action sits at the deepest "why" — write the SOP and put it in procurement specs.

## CAPA documentation

A proper CAPA has: problem statement, immediate action taken, root cause, corrective action (fix the immediate issue), preventive action (stop recurrence), responsible person, target date, verification. The Hadron LIMS QC module gives you the template.

## Verification re-sampling

Don't close a CAPA on a single re-sample. Three consecutive in-spec results are minimum; for an acute exceedance, ten consecutive samples over a week.

_Source: SANS 241:2015 § 4 (action levels); DWS Drinking Water Management Ch 8 (corrective action); WSP Module 5._`,

  /* ════════════════════════════════════════════════════════════════
     TRACK 2 — DISINFECTION
     ════════════════════════════════════════════════════════════════ */

  /* ───── DIS-101 — Disinfection Fundamentals ───── */

  'c-dis-101/m1': `## Pathogens by class

Drinking-water pathogens fall into four functional groups, each with different disinfectant tolerances:

- **Bacteria** — most are easy to kill (E. coli, Salmonella, Vibrio, Shigella, Campylobacter). Free chlorine 0.3 mg/L for 5 min hits them all. Indicator: total coliforms / E. coli.
- **Viruses** — small, harder to inactivate than vegetative bacteria but still vulnerable to free Cl. Examples: rotavirus, norovirus, hepatitis A. Surrogate indicator: somatic coliphages.
- **Protozoa** — _Giardia lamblia_ (cysts), _Cryptosporidium parvum_ (oocysts). Cryptosporidium is essentially _chlorine-resistant_ at any practical Ct — needs UV, ozone, or membrane filtration.
- **Spores** — bacterial endospores (Clostridium, Bacillus). Robust against everything except prolonged ozonation, autoclaving or chlorine dioxide.

## Log-reduction targets

USEPA, WHO and SANS treatment goals are expressed as _log reductions_:

| Organism | Log target | What this means |
|---|---|---|
| Giardia | 3-log | 99.9 % removal |
| Virus | 4-log | 99.99 % removal |
| Cryptosporidium | 2–3-log | 99–99.9 % |

A multi-barrier train (coag + filter + disinfect) earns credit at each step. Conventional clarification + filtration earns ~2.5-log Giardia and 2-log virus before disinfection even starts.

## Why indicator organisms

You cannot test for every pathogen on every sample. Indicator organisms (E. coli, total coliforms, somatic coliphages) are easy to detect, found at higher numbers than the pathogens, and behave _at least as resistantly_ to treatment as the worst-case pathogen they represent. Find them in finished water and you have a problem.

_Source: USEPA SWTR / LT2ESWTR; Basic Chemistry of Chlorination (USEPA, uploaded); WHO Guidelines 4th ed. Ch 11._`,

  'c-dis-101/m2': `## The Ct concept

The cornerstone of disinfection design:

  Ct = C × t

where C is residual disinfectant concentration (mg/L) and t is contact time (min). Ct has units mg·min/L. The required Ct for a given log-removal of a given pathogen at a given pH and temperature is tabulated in the USEPA Surface Water Treatment Rule.

## Sample Ct values

For 3-log Giardia inactivation:

| Disinfectant | pH 7, 10 °C | pH 8, 10 °C |
|---|---|---|
| Free chlorine | 174 | 250 |
| Monochloramine | 1 850 | 1 900 |
| ClO₂ | 23 | 26 |
| Ozone | 1.43 | 1.43 |

Notice how ClO₂ is ~8× more effective than free chlorine; ozone is 100× better still. But the Ct for chloramine is 10× worse than free Cl — that's why chloramine isn't a primary disinfectant.

## Hydraulic retention vs t10

The "t" in Ct is _not_ tank volume / flow. It's the time the _earliest_ disinfectant-water has to react before reaching the outlet — the **t10**, the 10th-percentile residence time from a tracer test. A perfectly baffled clear well has t10 / t_theoretical ≈ 0.7. An unbaffled tank can drop to 0.1.

## Baffling factors (BF)

USEPA tabulates BF based on inlet/outlet design and number of baffles:

| Baffling | BF |
|---|---|
| Unbaffled (open tank) | 0.1 |
| Poor (single internal baffle) | 0.3 |
| Average (intermediate baffling) | 0.5 |
| Superior (perforated baffle inlet, longitudinal baffles) | 0.7 |

Effective contact time = HRT × BF. Most plants underestimate this — your "60 min HRT clear well" might give only 30 min effective contact time.

_Source: USEPA SWTR Disinfection Profiling and Benchmarking Guidance Manual; Basic Chemistry of Chlorination Ch 4._`,

  'c-dis-101/m3': `## Free chlorine

Cheapest, most universal, most familiar. Forms HOCl in water (the active disinfectant). pKa = 7.5 — at low pH, mostly HOCl (50× stronger); at high pH, mostly OCl⁻ (weaker). Leaves a residual that protects the network downstream — the only disinfectant in this list that does. Side-effect: produces THMs and HAAs from NOM.

## Chlorine dioxide (ClO₂)

True oxidant, not a chlorinating agent — does not produce THMs. Effective at high pH, doesn't form chloramines, kills _Cryptosporidium_ at moderate Ct. By-products: chlorite (ClO₂⁻) and chlorate (ClO₃⁻), regulated to ≤ 1 mg/L combined. Generated on-site (won't store). Capital cost higher than chlorine.

## UV (ultraviolet)

Photochemical — inactivates DNA without leaving any residual. Spectacular for _Cryptosporidium_ (3-log at 12 mJ/cm²). No DBPs. Operating cost is mainly lamp replacement. Limitation: only works while the water is in the reactor — no protection downstream. Almost always followed by free chlorine for residual.

## Ozone (O₃)

Strongest oxidant in routine use — 100× faster than free chlorine for Giardia. Beautiful for taste-and-odour (geosmin / MIB), micropollutants and colour. Generated on-site from oxygen. By-products: bromate (BrO₃⁻) where bromide is present in raw water — regulated to 10 µg/L. Highest capital + energy cost; followed by chlorine for residual.

## The decision matrix

| Driver | Pick |
|---|---|
| Cheapest, simplest | Free chlorine |
| High pH (> 8), no THMs | ClO₂ |
| Cryptosporidium concern | UV (or ozone) |
| Taste & odour, micropollutants | Ozone |
| Long network, residual needed | Always end with free Cl or chloramine |

## Combinations

Most modern plants run a _primary_ disinfectant (UV or ozone) for pathogen kill + a _secondary_ disinfectant (free chlorine or chloramine) for residual.

_Source: WRC Handbook Ch B4; Nalco Water Handbook Ch 9; WHO Guidelines._`,

  'c-dis-101/m4': `## Source-quality screen

Before choosing primary disinfectant, ask:

- **Microbiological load** — borehole vs surface vs reuse. Surface and reuse demand multi-barrier treatment.
- **NOM (TOC) level** — high TOC → THM risk → consider ClO₂ or ozone over free Cl
- **Bromide** — > 0.05 mg/L raw → ozone may produce excess bromate
- **Cryptosporidium risk** — agricultural / informal-settlement upstream → UV or ozone needed
- **pH of finished water** — > 8 → free Cl loses potency, ClO₂ stays effective

## Capital vs operating cost (typical)

| Disinfectant | CapEx (rel.) | OpEx (rel.) |
|---|---|---|
| Free Cl gas | 1× | 1× |
| Free Cl from NaOCl | 1.5× | 2.5× |
| Chloramine | 1.5× | 1.5× |
| ClO₂ | 5× | 4× |
| UV | 4× | 1.5× |
| Ozone | 8× | 5× |

Numbers vary widely by scale; small works pay disproportionately for advanced disinfection.

## Operator competency required

- Free Cl gas — high (cylinder management, leak response)
- NaOCl liquid — low
- ClO₂ generator — medium-high (acid/chlorite handling, residual chlorite testing)
- UV — low (lamp swap and quartz cleaning)
- Ozone — high (high-voltage equipment, off-gas destruction, leak monitoring)

## Regulatory acceptance

In SA, all five are accepted. Internationally, some jurisdictions discourage chloramine (taste, kidney-dialysis interaction) or ozone (bromate). Always verify with the regulator before specifying.

## The pragmatic choice

For most South African municipal works treating surface water:

- Small (< 5 ML/d): _free chlorine from NaOCl or HTH_, sometimes preceded by pre-chlorination at the head of the plant
- Medium (5–50 ML/d): _free chlorine_ ± UV for Crypto
- Large (> 50 ML/d): _UV or ozone_ + _chloramine in the network_ to limit DBPs

_Source: WRC Handbook Ch B4.7 (selection); DWS Drinking Water Management Ch 9._`,

  'c-dis-101/m5': `## Knowledge check

Ten short questions to confirm the foundation:

1. Define a 3-log reduction in plain language.
2. Why is Cryptosporidium said to be "chlorine-resistant"?
3. State the Ct concept and its units.
4. Name a typical baffling factor for an unbaffled clear well and a well-baffled one.
5. Which disinfectant produces THMs and which two do not?
6. What is the only disinfectant that leaves a residual?
7. Why is ozone strong on taste-and-odour and bad on bromide-laden water?
8. List two operational drivers that push a plant from free Cl to ClO₂.
9. Why is UV almost always followed by free Cl?
10. What is the role of an indicator organism?

## Suggested study path

If you scored 9–10/10, move to **DIS-201 Chlorine Chemistry & Practice** for a deep dive into the workhorse disinfectant.
If you scored 6–8/10, revisit module 2 (the Ct concept) — it underpins every later course.
If below 6/10, work back through all four modules.

_Self-assessment compiled from USEPA disinfection benchmarking guidance and WHO WSP Module 4._`,

  /* ───── DIS-201 — Chlorine Chemistry & Practice ───── */

  'c-dis-201/m1': `## Cl₂ in water

When chlorine gas dissolves in water it hydrolyses almost completely:

  Cl₂ + H₂O ⇌ HOCl + HCl

The hydrochloric acid ionises immediately, so each kg of Cl₂ dissolved yields effectively 1 mol HOCl + 1 mol HCl.

## The HOCl ⇌ OCl⁻ equilibrium

HOCl is a weak acid:

  HOCl ⇌ H⁺ + OCl⁻       pKa = 7.5

The fraction of HOCl vs OCl⁻ depends sharply on pH:

| pH | % HOCl | % OCl⁻ |
|---|---|---|
| 6 | 97 | 3 |
| 7 | 76 | 24 |
| 7.5 | 50 | 50 |
| 8 | 24 | 76 |
| 9 | 3 | 97 |

## Why pH matters so much

HOCl is the active disinfectant. OCl⁻ is ~80–100× weaker. So at pH 6 you get full disinfection power; at pH 9 you have to dose roughly an order of magnitude more chlorine for the same Ct. This is why the **target operational pH is 7.0–7.5** — close to maximum HOCl, with enough alkalinity that the post-chlorination pH doesn't drop sharply.

## The temperature side-effect

Disinfection rate also doubles for every 10 °C — winter water (5 °C) needs roughly 2× the Ct of summer water (25 °C). The USEPA Ct tables build in temperature corrections.

## Practical consequence for the operator

Two same-residual readings at different pH values do _not_ mean the same disinfection. Free Cl 0.5 mg/L at pH 7 is dramatically more effective than 0.5 mg/L at pH 8.5. If your plant is dosing lime late and the pH at chlorination is ~9, you are wasting chlorine. Re-sequence: chlorinate _before_ lime, and let the lime adjust pH at the clear-well outlet.

_Source: Basic Chemistry of Chlorination (USEPA, uploaded), Ch 1-2; Nalco Water Handbook Ch 9._`,

  'c-dis-201/m2': `## Chlorine demand vs free residual

Add chlorine to water and three things happen, in this order:

1. **Reducing agents consumed first** — Fe²⁺, Mn²⁺, sulfide, NOM. They react with chlorine to form chloride.
2. **Ammonia reacts next** — forms chloramines.
3. **Free chlorine residual** — appears only after demand is satisfied.

The total chlorine demand is the dose required to reach a measurable free residual.

## Mono-, di-, tri-chloramine

In presence of ammonia (NH₃), chlorine forms chloramines progressively:

  NH₃ + HOCl → NH₂Cl + H₂O    (monochloramine)
  NH₂Cl + HOCl → NHCl₂ + H₂O   (dichloramine)
  NHCl₂ + HOCl → NCl₃ + H₂O    (trichloramine)

The Cl:N mass ratio tells you which species dominates:
- 3:1 to 5:1 → mostly monochloramine
- 5:1 to 7.6:1 → dichloramine forms
- > 7.6:1 stoichiometric — di- and trichloramine break down to N₂ + Cl⁻

## The breakpoint dip

Plot residual chlorine against dose. At first, residual climbs as chloramines form. Past Cl:N ≈ 5:1, the curve _dips_ — chloramines decompose faster than new ones form. The minimum (the **breakpoint**) is at Cl:N ≈ 7.6:1 stoichiometric, but practical breakpoint is typically 8–10:1 because of natural organics that consume extra Cl.

Beyond the breakpoint, every extra mg of Cl appears as free residual.

## Operator consequence

To get a free chlorine residual on water containing ammonia, you must dose past the breakpoint. Dose curves are taught in every textbook and re-discovered every shift by every operator who's ever asked "why does my residual disappear at noon?". Run a chlorine demand curve on raw water once a quarter (16 jars at increasing dose, measure residual after 30 min). The dose corresponding to the first 0.2 mg/L free Cl after the dip is your breakpoint.

_Source: Basic Chemistry of Chlorination (USEPA, uploaded) Ch 3; WRC Handbook Ch B4.3._`,

  'c-dis-201/m3': `## Cl₂ gas

The cheapest form per kg active. Delivered in 50 kg or 1 t cylinders. Pure Cl₂, vacuum-fed through a chlorinator into water (under negative pressure, so any leak draws air _in_, not Cl₂ out). 1 kg Cl₂ = 1 kg active.

Pros: cheapest, very accurate dose control, decades of operator experience.
Cons: heavily regulated (OHS Act Hazardous Chemical Substances), needs SCBA, bunded scrubber tower, off-site emergency response plan. Increasingly avoided on new builds.

## Sodium hypochlorite (NaOCl)

Liquid bleach. Available in industrial strengths (10–15 % w/v active Cl). Pumped via diaphragm metering pump. Decomposes in storage — about 5 % loss per month at 20 °C, 15 % at 35 °C. Stored in vented HDPE / FRP tanks.

Pros: easy to handle, no respiratory hazard, can be made on-site by chlor-alkali (where economical).
Cons: needs ~7× the volume of Cl₂ gas for same active mass. Decomposes — buy fresh, use within 60 days. Generates chlorate as a decomposition product (chronic-health by-product).

## Calcium hypochlorite (Ca(OCl)₂, HTH)

Granular or briquette, 65–70 % active Cl. Excellent for small / remote works — non-decomposing, easy to bag. Dissolved on-site in a saturator or batch tank. Leaves calcium scale; check feed lines monthly.

Pros: stable, long shelf life, simple infrastructure.
Cons: dust hazard during decanting, calcium accumulation in feed system.

## TCCA / DCCA tabs

Trichloroisocyanuric acid (90 % active) — slow-dissolve tablets. The granular / tab form is _stabilised_: the cyanurate moiety holds chlorine and releases it slowly. Heavy use in pool / spa / small water schemes.

Pros: extreme stability, slow dose, robust to power-failure.
Cons: cyanuric-acid build-up (operational concern in pools); not generally used in municipal drinking-water.

## Picking a form

Small remote works → HTH. Medium municipal → NaOCl. Large municipal with experienced operators → Cl₂ gas (still cheapest by mass). Pool / spa → TCCA.

_Source: Chlorine Handling Information Pack (uploaded); WRC Handbook Ch B4.4._`,

  'c-dis-201/m4': `## The dosing pump

Three contenders in chlorine service:

- **Diaphragm metering pump** (Pulsafeeder, Grundfos, ProMinent, LMI) — most common. Stroke / frequency control, accurate at 5–100 % turn-down, typical 3–10 bar discharge. Diaphragm life 2–5 yr.
- **Peristaltic pump** (Watson-Marlow) — squeeze a tube; chlorine never touches metal. Self-priming, robust to gas-locking. Tubing replacement every 6–12 months. Lower discharge pressure (typically < 4 bar).
- **Solenoid metering** — cheap, less precise; small-scale only.

For Cl₂ gas service, the chlorinator (vacuum regulator + rotameter + injector) is _the_ pump — there's no positive-pressure pump on Cl₂ gas.

## Sample line for residual control

The on-line analyser (DPD photometric or amperometric) lives on a sample line tapped after the chlorine contact tank. Sample line design rules:

- Minimum-distance, no dead legs (avoid biofilm growth)
- Constant flow, throttled to manufacturer spec (e.g. 500 mL/min)
- Sample temperature controlled if possible (heat-tracing or cooling)
- Calibrated against grab samples at least monthly

## Compound-loop control

Modern plants run **compound-loop** dosing: feedforward on plant flow + feedback on residual analyser. Flow change → immediate dose change. Residual deviation → trim adjustment. This keeps residual stable at ± 0.05 mg/L despite flow swings.

## Contact tank

Standard design: long, narrow, baffled. Length-to-width 40:1 minimum, 5+ longitudinal baffles. Typical sizing: 30–60 min HRT × baffling factor 0.7. Inlet far end, outlet other end, no short-circuits. Sample tap 3 m before outlet (at point of compliance).

_Source: WRC Handbook Ch B4.5; Hach DPD analyser manual; Hadron Service Reports._`,

  'c-dis-201/m5': `## The killer chemical

Cl₂ gas is among the most dangerous chemicals routinely used in municipal water. At 30 ppm in air, it's immediately incapacitating; at 1 000 ppm, fatal in minutes. Treat every cylinder, every line, every fitting as a live hand-grenade until proven safe.

## PPE per task

- **Routine inspection** — long sleeves, splash goggles, latex gloves
- **Cylinder change-out / valve work** — full SCBA + butyl gloves + chemical apron
- **Spill / leak response** — Level A suit + SCBA + spotter

A "B-pack" (butyl rubber suit + filter mask) is _not_ adequate for a confirmed leak — only escape, not entry.

## Leak detection

- **Eyeball + nose** — yellow-green vapour above 3 ppm; sweet bleach smell at 0.05 ppm. Don't rely on this; you may not smell it before it disables you.
- **Ammonia rag** — wave a rag soaked in household ammonia near a suspected leak; white smoke (NH₄Cl) confirms Cl₂.
- **Fixed gas detector** — every Cl₂ store should have one (NDIR or electrochemical). Alarm at 1 ppm, evacuation at 3 ppm.

## Spill / release response

1. **Evacuate** — sound alarm, clear area to upwind position
2. **Don PPE** — only trained responders, only with SCBA
3. **Identify leak** — listen for hiss, look for vapour
4. **Stop or contain** — close inlet valve if accessible; drop a salvage / emergency capping kit; shut off feed
5. **Ventilate / scrub** — fan vapour to scrubber tower (lime/caustic absorber) or evacuate to dilute
6. **Notify** — facility manager, emergency services, regulator (Section 24 NEMA notification within 24 h)

## Cylinder management

- Store secured upright, capped when not in use
- 50 kg cylinders: changed every few weeks; rotate stock first-in-first-out
- Empty cylinders returned with all valves closed and caps fitted
- Date-stamp every cylinder on arrival
- Annual hydrotest required by SANS / DOL

_Source: Chlorine Handling Information Pack (uploaded), full document; Chlorine Institute Pamphlet 1; OHS Act HCS regulations._`,

  'c-dis-201/m6': `## The plant

- Plant flow: 2 ML/d = 2 000 m³/d = 83.3 m³/h
- Water: SANS 241 borehole, low NH₃, low NOM. Demand: 1.5 mg/L
- Free Cl target: 0.5 mg/L at point of compliance (after contact tank)
- Chemical: Calcium hypochlorite (HTH), 65 % active

## Stoichiometric calc

Total Cl needed = demand + target residual
            = 1.5 + 0.5 = 2.0 mg/L

Daily active chlorine:
  2 000 m³ × 2.0 g/m³ = 4 000 g/d = 4 kg/d (active)

Monthly = 4 × 30 = 120 kg/d (active).

## Convert to product

HTH 65 % means 0.65 kg active per kg HTH.
  Daily HTH mass = 4 / 0.65 = 6.15 kg/d
  Monthly HTH mass = 184.6 kg/month

A 25 kg HTH bag therefore lasts about 4 days at 1.5 mg/L demand.

## Saturator solution

Dissolve daily HTH in a saturator (200 L) to 30 g/L:
  200 L × 30 g/L = 6 000 g = 6 kg active. Roughly 1.5 days' supply per fresh batch.

Pump rate from saturator:
  Daily volume out of saturator = 4 kg active ÷ 30 g/L = 133 L/d
  Hourly = 133 ÷ 24 = 5.6 L/h
  → set dosing pump at 5.6 L/h ≈ 93 mL/min

## Sanity check at far end of system

Take a residual sample at the furthest network point (typically 4–8 h hydraulic age). If residual there is < 0.2 mg/L, demand has caught up — increase plant dose. If > 1 mg/L there too, you can ease back at the plant. The Hadron Chlorine (TCCA) calculator gives the kg/day directly; HTH version differs only in product strength.

_Source: Hadron Chlorine Calculator user guide; WRC Handbook Ch B4.6._`,

  /* ───── DIS-202 — Chlorine Dioxide & Alternative Disinfectants ───── */

  'c-dis-202/m1': `## Why ClO₂ is different

Chlorine dioxide is a true oxidant — it accepts electrons from microbial cell components without _chlorinating_ anything. The key consequence: **no THMs, no HAAs**. Where source water has high NOM and free Cl produces unacceptable THM, ClO₂ is the textbook answer.

## Generation chemistry

ClO₂ is too unstable to ship — generated on-site from sodium chlorite (NaClO₂):

  5 NaClO₂ + 4 HCl → 4 ClO₂ + 5 NaCl + 2 H₂O

This is the most common route — chlorite + hydrochloric acid. Other industrial routes:
- NaClO₂ + Cl₂ (gas) → 2 ClO₂ + NaCl    (chlorine-chlorite, used at large municipal scale)
- NaClO₂ + H₂SO₄ → ClO₂ + Na₂SO₄ + by-products    (sulfuric-acid route, simpler chemistry)

Yield matters: HCl route gives 80–95 % conversion, requiring residual-chlorite testing.

## By-products: chlorite and chlorate

ClO₂ partially decays to:
- **Chlorite (ClO₂⁻)** — half of all chemical reactions of ClO₂ produce this. SANS 241 cap = 1 mg/L (combined ClO₂ + ClO₂⁻ + ClO₃⁻ ≤ 1 mg/L sum is the operational target).
- **Chlorate (ClO₃⁻)** — forms via UV photolysis or at high pH. WHO provisional guideline 0.7 mg/L.

The operator must monitor both. A DPD-based residual analyser doesn't distinguish — use a dedicated ClO₂ analyser (Lovibond, Hach) and a chlorite test kit.

## When ClO₂ wins

- High NOM raw water → THM precursor reduction
- pH > 8 finished water → ClO₂ holds potency where free Cl fades
- Iron / manganese / sulfide oxidation
- Odour / taste removal (much better than free Cl)

_Source: WRC Handbook Ch B4.4; Nalco Water Handbook Ch 9; Hadron ClO₂ Skid Calculator._`,

  'c-dis-202/m2': `## The skid components

A typical 2 ML/d ClO₂ skid:

- **Stock tanks** — 25 % NaClO₂ solution, 30 % HCl, both stored in HDPE bunds. Day tanks size to 2–3 days' supply.
- **Generator vessel** — small reactor (1–10 L) with mixing baffle; reaction completes in seconds.
- **Dilution / quench** — dilution water flow chosen so ClO₂ concentration is 2 000–3 000 ppm (above this, ClO₂ explosive in air).
- **Dosing pumps** — calibrated to chlorite : acid stoichiometric ratio.
- **ClO₂ analyser + dosing trim loop** — closed-loop residual control.
- **Sample line** — to plant water.

## Sizing the skid

Hadron's ClO₂ Skid calculator does this:

- Plant flow × dose ppm × hours = daily mass ClO₂
- Stock strength (e.g. 2 500 ppm) → daily L of generated ClO₂ solution
- Tank size = daily L × refill interval (days)
- Pump turn-down: minimum dose / maximum dose ratio

## Refill intervals

Typical:
- 25 % NaClO₂ — 25 kg drum lasts 3–5 days at 2 ML/d
- 30 % HCl — 25 L drum lasts ~2 days at 2 ML/d

Both should be re-stocked monthly, never let either run dry — generator stalls produce un-reacted feed in finished water (chlorite or HCl into product).

## Pump calibration

Daily routine: catch the generator output for one minute, measure ClO₂ concentration with analyser. Confirm matches the calculated stock strength (typically 2 500 ppm). If output drifts, suspect pump tubing wear, blockage, or feed-tank dilution.

_Source: Hadron ClO₂ Skid Calculator + Hadron skid datasheet; WRC Handbook Ch B4.4._`,

  'c-dis-202/m3': `## How UV inactivates pathogens

UV-C light (254 nm) is absorbed by nucleic acids in microbial DNA, forming thymine dimers that prevent replication. The cell isn't killed — it's _sterilised_. For drinking water this is enough; the cell can't reproduce so it can't infect.

## Lamp types

- **Low-pressure (LP)** — single sharp emission line at 254 nm, electrical efficiency ≈ 35 %, lamp life 9 000–12 000 h. Compact reactor, low power. _Standard for drinking water._
- **Low-pressure high-output (LPHO)** — same wavelength, higher intensity. Lower lamp count for same UV output. Lamp life 8 000–10 000 h.
- **Medium-pressure (MP)** — broad-spectrum 200–300 nm, much hotter, very high intensity. Lamp life 6 000–8 000 h, electrical efficiency ≈ 12 %. Used for large flows and where ozone-like effects on micropollutants are wanted.

## UVT (ultraviolet transmittance)

Measures % of UV reaching 1 cm into the water. Pure water 99 %; clean filtered drinking water 90–95 %; partially clarified water 70–80 %; raw river water can be < 50 %. UVT is the operating-cost driver: at 60 % UVT, you need 3–4× the lamp count of 90 % UVT.

## Validated dose

UV dose (mJ/cm² = mWs/cm²) is the energy delivered to a unit cross-section of water. The reactor manufacturer publishes a _validated_ dose at a stated flow + UVT — this is the dose the regulator will credit.

| Target | Dose |
|---|---|
| Bacteria (E. coli, Salmonella) | 6–10 mJ/cm² |
| Virus (rotavirus, norovirus) | 30 mJ/cm² |
| Cryptosporidium oocysts | 12 mJ/cm² (3-log) |
| Giardia cysts | 12 mJ/cm² (3-log) |

USEPA validated minimum: 40 mJ/cm² for combined bacterial + viral target.

## Quartz sleeves and fouling

The lamp sits inside a quartz sleeve to keep it dry. Hard water deposits calcium carbonate / iron oxide on the sleeve surface, blocking UV. Auto-wiper systems (mechanical or chemical) clean the sleeves on schedule. Without a wiper, manual cleaning every 1–3 months. Lamp ageing reduces UV output by ~20 % over rated life — control system trims dose with a UV intensity sensor.

_Source: IUVA UV Disinfection Guidelines; WRC Handbook Ch B4.4; Trojan / Wedeco / NeoTech reactor manuals._`,

  'c-dis-202/m4': `## Why chloramination at all

Chloramines are weaker disinfectants than free Cl (Ct for Giardia is 10× higher), so why use them? Two reasons:

1. **Persistence in long networks** — chloramine residual decays much slower than free Cl. In Pretoria's 14 000 km network, chloramine maintains 0.5 mg/L at the far end where free Cl would be < 0.1.
2. **No THMs in the network** — chloramines don't react further with NOM, so DBP formation effectively stops at the works.

## Mono- vs di-chloramine

The operator wants **monochloramine** (NH₂Cl). To stay there:

- Cl:N mass ratio = 4–5:1
- pH 7.5–8.5 (mono- favoured at higher pH)
- Avoid breakpoint dosing — past 7.6:1 Cl:N, di- and trichloramine form, both of which produce taste-and-odour and decay back to ammonia in the network

## Practical dose

Plant typically pre-doses ammonia (5 mg/L NH₃-N) and free Cl (4 mg/L) sequentially to the clear-well outlet. A short contact zone (~5 min) is enough to form monochloramine.

## Nitrification in dead-ends

The classic chloramine network problem: in long dead-end mains, the ammonia portion of monochloramine slowly hydrolyses, releasing free NH₃. AOB (ammonia-oxidising bacteria) then bloom on pipe biofilm, consuming the chloramine residual entirely. Symptoms: ammonia disappearing, nitrite rising, residual collapsing.

Solutions:
- Boost chlorination at strategic points
- Periodic break-point switch (3 weeks/year) to free Cl to flush biofilm
- Avoid extended dead-ends in network design

## Switching seasonally

Some utilities (Cape Town, Johannesburg) run free Cl in winter, chloramine in summer (when warmer water + algal NOM elevates THM risk). The switch needs a documented procedure — rapid switching causes massive coloured-water complaints from biofilm slough.

_Source: Drinking Water Management (DWS 2024) Ch 9; Nalco Water Handbook Ch 9; AWWA M56 — Nitrification Prevention._`,

  /* ───── DIS-301 — Disinfection By-products & Compliance ───── */

  'c-dis-301/m1': `## The four families of DBPs

Disinfection necessarily creates by-products. The four major families:

### Trihalomethanes (THMs)
Chloroform (CHCl₃), bromodichloromethane (CHCl₂Br), dibromochloromethane (CHClBr₂), bromoform (CHBr₃). Sum = Total THMs (TTHM). SANS 241 limit: 100 µg/L. Formed when free Cl reacts with NOM.

### Haloacetic acids (HAAs)
Five regulated species: monochloroacetic, dichloroacetic, trichloroacetic, monobromoacetic, dibromoacetic. Sum = HAA5. WHO guideline 60 µg/L; SANS does not yet regulate HAA but it's coming.

### Inorganic by-products from ClO₂
Chlorite (ClO₂⁻), chlorate (ClO₃⁻). SANS 241: combined ≤ 1.0 mg/L.

### N-nitrosamines
NDMA (N-nitrosodimethylamine) — formed from chloramination of certain organic precursors. WHO provisional 100 ng/L. Becoming a hot topic in chloraminated networks.

## Brominated DBPs

If raw water contains bromide (typical estuarine / agricultural inputs), bromine substitutes onto the THM/HAA molecules. The brominated species are 10–100× more carcinogenic per mass than chlorinated. Even a modest bromide rise dramatically shifts toxicology.

## Why DBP control matters

USEPA's Stage 2 D/DBP rule found that long-term exposure to TTHM correlates with bladder cancer. SANS adopted the 100 µg/L limit reflecting this. The compliance challenge is that TTHM forms _continuously in the network_, so the highest concentration is at the network extremes where contact time is longest.

_Source: USEPA Stage 2 D/DBP Rule; SANS 241:2015 Annex C; Nalco Water Handbook Ch 9._`,

  'c-dis-301/m2': `## The driver variables

Total THM formation predictably depends on:

- **NOM concentration** — measured as TOC (total organic carbon) or UV-254 absorbance. Higher TOC = more THM precursors.
- **Chlorine dose** — higher dose produces more THM, but the relationship plateaus.
- **Contact time** — TTHMs form continuously over days. The longest hydraulic age in the network sets compliance.
- **pH** — higher pH increases THM yield and shifts toward the more brominated forms.
- **Temperature** — THM formation roughly doubles per 10 °C rise.
- **Bromide** — drives the chlorinated → brominated shift.

## The SUVA proxy

SUVA = (UV-254 / TOC) × 100. A SUVA > 4 L/(mg·m) indicates aromatic, hydrophobic NOM that is highly reactive with chlorine. SUVA < 2 indicates non-reactive NOM. Use SUVA to predict whether your raw water is THM-prone — raw waters from upper-catchment dams with peat or fynbos drainage often have SUVA 4–6.

## Predicting the value

Empirical correlations like Amy's model:

  TTHM (µg/L) ≈ 0.0412 × (TOC)^1.098 × (Cl₂ dose)^0.152 × (T)^1.388 × (pH-2.6)^1.601 × (Br⁻)^0.068 × (time)^0.265

Don't memorise the formula — use the trend: TOC, T and pH dominate, contact time matters, bromide modifies the species mix.

## Worst-case sampling location

Find the longest hydraulic-age point in your network. Take TTHM samples there quarterly. The Locational Running Annual Average (LRAA) is the regulatory metric — average of four quarterly results.

_Source: Amy et al., USEPA — Disinfection By-products Information Collection Rule; Nalco Water Handbook._`,

  'c-dis-301/m3': `## Enhanced coagulation

The cheapest THM mitigation is to remove the precursors before chlorination. Enhanced coagulation:

- Higher coagulant dose (1.5–2.5× sweep dose)
- Slightly lower coagulation pH (6.0–6.5 for alum; 5.5–6.0 for ferric)
- TOC removal target tied to raw-water TOC and alkalinity (USEPA Stage 1 D/DBP Step 1 table)

For raw TOC 2–4 mg/L, low-alkalinity, target 25 % TOC removal. For TOC 4–8 + low alkalinity, 35 %. Achievable with ferric or PAC + acid; alum struggles below pH 6.

## GAC adsorption

Granular activated carbon polishes residual TOC. Two configurations:

- **GAC sandwich** — replaces top 15 % of sand depth in a multimedia filter. Cheap retrofit, life 6–18 months, easy to switch back.
- **Post-filter GAC contactor** — a separate vessel after the sand filter, EBCT 10–20 min, virgin GAC life 12–36 months, on-site or off-site reactivation.

GAC removes 30–70 % of TOC depending on pore-size match.

## Switch primary disinfectant

If TTHM still exceeds, change the primary:

- **Chloramine network** — use free Cl for primary disinfection (short contact in clear well), then add ammonia at clear-well outlet to form chloramine for the network. THM formation effectively halts at the works.
- **ClO₂** — no THM formation at all from primary disinfection.

## Reduce contact time

The clear well is the single biggest place TTHM forms. Many older clear wells provide 2–4 h HRT, far more than needed for Ct compliance. A shorter, properly-baffled tank (1 h HRT, BF 0.7) gives the same Ct with much less THM yield.

_Source: USEPA Stage 1 D/DBP Rule § 141.135; WRC research projects on enhanced coagulation; Hadron Service Reports._`,

  'c-dis-301/m4': `## Where to sample

SANS 241-2 requires distribution-system sampling for TTHM at locations representative of maximum residence time:

- Far end of distribution (longest hydraulic age)
- Storage tank outlet (long contact)
- Dead-end zones (high age + biofilm)
- Network pressure-zone interfaces

For a network served by a 5-ML/d works with a 24 h tankage + 48 h pipe age, the worst point is usually 60–80 km of pipe from the works.

## Frequency

Population served sets sampling frequency:
- < 10 000 — quarterly TTHM at one rep point
- 10 000–100 000 — quarterly at four points
- > 100 000 — monthly at multiple points + quarterly LRAA

## Sample handling

THMs are volatile. Sample collection rules:

- Use 60 mL vials with no headspace
- Pre-add 4 mg sodium thiosulfate to dechlorinate (stops further THM formation in the bottle)
- Cap tightly, no air bubble
- Cool 4 °C, hold ≤ 14 days before analysis
- Analyse by GC-ECD or GC-MS per APHA 6232 / EPA 524.2

## LRAA calculation

LRAA = mean(Q1, Q2, Q3, Q4 results at that location) updated each quarter. Compliance is per location, not network-wide. A location running 95 µg/L LRAA is compliant; one running 105 µg/L is not, even if the network mean is below 100.

## Audit defence

For an exceedance to stand up to challenge or appeal: chain-of-custody complete, sample integrity documented (no headspace verified, dechlorination dose noted), method accreditation valid, lab QC samples passed, calibration records on hand. Anything weaker and the exceedance can be challenged.

_Source: SANS 241-2:2015 § 7; APHA 6232; USEPA Stage 2 D/DBP Rule._`,

  /* ════════════════════════════════════════════════════════════════
     TRACK 3 — SEWAGE TREATMENT
     ════════════════════════════════════════════════════════════════ */

  /* ───── SEW-101 — Sewage Composition & Treatment Overview ───── */

  'c-sew-101/m1': `## Per-capita loading

Domestic sewage from a typical South African household:

| Parameter | g/cap/day | Concentration (mg/L at 200 L/cap/d) |
|---|---|---|
| BOD₅ | 60 | 300 |
| COD | 120 | 600 |
| TSS | 70 | 350 |
| TKN (Total N) | 12 | 60 |
| NH₃-N | 8 | 40 |
| Total P | 2 | 10 |
| FOG | 25 | 125 |

Note these are _design averages_. Real-world concentrations vary 30–300 % around them depending on water consumption per capita, infiltration into the sewer, and industrial contributions.

## Diurnal variation

Flow follows a daily pattern: minimum at 03:00 (about 30 % of average), peak at 09:00–10:00 (180 % of average), second peak at 19:00 (150 %). Load peaks around 11:00 (160 %) — slightly later than flow because morning showers / WCs dump higher-strength water.

Plant design must handle peak hourly flow (typically 2 × Q_avg) and peak hourly load (typically 1.6 × L_avg), not just averages.

## Industrial contributions

Industrial discharge to municipal sewer is regulated by trade-effluent by-laws. Common high-strength contributions:

- Abattoirs: 5–15 kg COD/m³ × variable volume
- Breweries: 2–8 kg COD/m³
- Dairies: 1–5 kg COD/m³
- Tanneries: high SO₄, Cr — needs source control
- Mining: pH (acid mine drainage) — separate treatment usually

Operators should know the top 10 industries discharging into their plant.

## Conservative parameters

Some pollutants pass through biological treatment unchanged: chloride, sulfate, sodium, conductivity, dissolved metals. They concentrate up if water-recycle is practised, and they tell you nothing about plant performance — just about source-water composition.

_Source: Metcalf & Eddy — Wastewater Engineering, 5th ed., Ch 3; WISA 2008 P112 — Plant Operations._`,

  'c-sew-101/m2': `## Pre-treatment

The first line of defence — keeps non-treatable solids out of the rest of the plant:

1. **Coarse screens** (50 mm) — trap rags, plastics, branches
2. **Fine screens** (3–10 mm) — final solids screening, often automatic raked
3. **Grit chambers** — sand, eggshells, coffee grounds (anything denser than 1.5 g/cm³). Aerated grit chambers (2 min HRT, fine bubble) classify by density.
4. **FOG (Fat-Oil-Grease) traps** — skimmed surface scum from primary clarifier or dedicated DAF

Without these, downstream pumps clog, biological treatment chokes, and plant uptime suffers.

## Primary settlement

Rectangular or circular tanks, 1.5–2.5 h HRT, surface overflow rate (SOR) 30–50 m³/m²·d. Removes 50–60 % TSS, 30–35 % BOD by gravity. Primary sludge is 4–6 % solids — pumped to thickening or directly to a digester.

## Secondary biological

Three main configurations:

- **Activated sludge** — most common. Aerated tank with mixed liquor of bacteria, plus a clarifier to settle the biomass. Returns activated sludge (RAS) recirculated to maintain MLSS; waste activated sludge (WAS) removed to control SRT.
- **Trickling filter** — fixed-film: bacteria grow on rotating distributor over a media bed. Lower energy than aerated AS, less sensitive to load swings.
- **Rotating biological contactor (RBC)** — bacteria grow on slowly rotating discs half-submerged in sewage. Compact, reliable for small works.

Biological stages typically remove 90–95 % of remaining BOD.

## Tertiary polishing

If discharge spec is tight (general standard COD ≤ 75, special standard ≤ 25), tertiary treatment polishes:

- Sand or membrane filtration (TSS, residual BOD)
- Activated carbon (residual COD)
- UV or chlorine disinfection (E. coli)
- Phosphorus precipitation (FeCl₃, alum) where bio-P insufficient

## Discharge

Final effluent must meet permit conditions — chronic BOD, COD, TSS, NH₃, P limits — before going to receiving water (river / sea / re-use scheme).

_Source: Metcalf & Eddy Ch 5–9; WISA 2008 P112._`,

  'c-sew-101/m3': `## Three discharge regimes in SA

South African wastewater discharge is governed by the National Water Act, with three permit regimes:

### General Authorisation (2013, 2024 update)
"GA" applies to any works that meets the standard limits, no individual permit needed. Limits include:

| Parameter | GA limit | Special standard |
|---|---|---|
| pH | 5.5–9.5 | 5.5–9.5 |
| COD | 75 mg/L | 30 mg/L |
| Suspended solids | 25 mg/L | 10 mg/L |
| NH₃ (free + saline) | 6 mg/L | 1 mg/L |
| Total P (as P) | 10 mg/L | 1 mg/L |
| Faecal coliforms | 1 000 cfu/100 mL | 0 cfu/100 mL |
| E. coli | 1 000 cfu/100 mL | nil |

A works that fails any GA limit must apply for a Water Use Licence (WUL) with site-specific limits.

### Special standard
For sensitive catchments — Hartbeespoort, Vaal Barrage upstream, Mhlatuze. Tighter limits, plus extra parameters (bacterial, dissolved oxygen, residual chlorine).

### Listed activities (NEMA, S. 24)
For works above 2 ML/d, requires an environmental authorisation in addition to WUL.

## Sewer discharge (different rules)

Trade waste discharged into a municipal sewer follows _city by-laws_ — much more lenient, since the works will treat it. Typical Joburg / CoT sewer permit:

- pH 6–10
- COD ≤ 5 000 mg/L
- TDS ≤ 3 000 mg/L
- Specific limits on metals, FOG, sulfide

## The cumulative load

A river that already carries 70 mg/L COD from upstream discharges can't accept another 75 mg/L from your works without crossing class I water-quality thresholds. Modern WUL conditions limit _load_ (kg/day), not just concentration. A drought-shrunken river may be receiving 5× its design load even if every plant is at its concentration limit.

_Source: Drinking Water Management (DWS 2024); General Authorisation in terms of the National Water Act, 2013 amendment 2024._`,

  'c-sew-101/m4': `## Composite vs grab sampling

For sewage compliance:

- **Composite samples** (24 h, flow-paced) — required for COD, TSS, N, P, BOD.
- **Grab samples** — required for pH, residual Cl, dissolved oxygen, faecal coliforms, E. coli (which decay during a 24 h composite).

The standard composite is 100 mL per 200 m³ flow, so a 5 ML/d plant collects 25 sub-samples spread over 24 h.

## SRT control via WAS

Sludge retention time = total sludge mass in the system / sludge mass wasted per day. Operators control SRT by adjusting WAS pump rate. Targets:

- Conventional AS, no nitrification: 4–6 days
- AS with nitrification: 10–15 days (nitrifiers grow slowly)
- AS with simultaneous N + P removal (BNR): 15–25 days

A plant with too-short SRT loses nitrification (NH₃ rises). Too-long loses bio-P removal and breeds filamentous organisms.

## Storm-event protocols

When influent flow exceeds 3 × Q_avg, the plant cannot biologically treat all of it. Most plants have:

- Storm overflow tanks — store excess for treatment after storm
- Bypass to receiving water — last resort, requires regulator notification

Protocols define when to activate each. The shift operator must know: "if flow > X for > Y hours, bypass; if storm tank > Z, divert to receiving water and notify".

## Operator's daily routine

- Walk-down (smell, sight, sound — compressor running, scum on clarifier surface, brown vs grey colour of activated sludge)
- Sample regimen
- Check / log: Plant flow, RAS rate, WAS rate, MLSS, DO, blower pressure, clarifier SBV
- Adjust WAS pump (small increments only; SRT changes lag 3–5 days)
- Hand-over with full briefing

_Source: WISA 2008 P112 — Plant Operations; Metcalf & Eddy Ch 8._`,

  /* ───── SEW-201 — Activated Sludge & Biological Treatment ───── */

  'c-sew-201/m1': `## Who does the work

Activated sludge is a complex microbial community. Each functional group has a job:

- **Heterotrophic bacteria** — eat organic carbon (BOD/COD) using oxygen. Fast-growing, robust. Most of the floc-forming bacteria you see in MLSS.
- **Autotrophic AOB** (ammonia-oxidising bacteria, _Nitrosomonas_) — oxidise NH₃ to NO₂⁻. Slow-growing, sensitive to pH, DO and toxics.
- **Autotrophic NOB** (nitrite-oxidising bacteria, _Nitrobacter_, _Nitrospira_) — oxidise NO₂⁻ to NO₃⁻. Even slower than AOB; the rate-limiting step in nitrification.
- **Denitrifiers** — facultative heterotrophs that reduce NO₃⁻ to N₂ in anoxic conditions, using BOD as electron donor.
- **PAOs** (phosphate-accumulating organisms, _Accumulibacter_) — store P intracellularly. Active in alternating anaerobic / aerobic environments (BNR plants).
- **Protozoa** — graze on bacteria, polish the effluent, and help bacteria flocculate.

The microscopic exam (Eikelboom, Jenkins) is the operator's window into community health.

## Carbonaceous oxidation

  C₅H₇NO₂ (cell biomass) + 5 O₂ → 5 CO₂ + 2 H₂O + NH₃ + energy

Heterotrophs use 1.42 kg O₂ per kg biomass synthesised. New cells form at yield ~0.6 kg VSS per kg BOD removed.

## Nitrification

  NH₄⁺ + 1.5 O₂ → NO₂⁻ + 2 H⁺ + H₂O    (AOB)
  NO₂⁻ + 0.5 O₂ → NO₃⁻                  (NOB)

Net: 4.57 g O₂ per g NH₃-N oxidised. Nitrification consumes alkalinity (~7.1 mg CaCO₃ per mg NH₃-N) — low-alkalinity sewage may need lime supplementation.

## Floc formation

Bacteria secrete extracellular polymeric substances (EPS) that bind cells together into floc. Good floc settles fast (SVI 80–120). Bad floc (filamentous bulking, pin-floc, dispersed) doesn't settle and washes out of the clarifier.

_Source: Metcalf & Eddy Ch 8; WRC TT 685/16._`,

  'c-sew-201/m2': `## F:M, MLSS, SRT — the three numbers

These three control the entire activated-sludge system:

### F:M (food-to-microorganism ratio)

F:M = (kg BOD applied per day) / (kg MLVSS in the aeration tank)

Typical targets:

| Mode | F:M (kg BOD/kg MLVSS·d) |
|---|---|
| Extended aeration | 0.05–0.15 |
| Conventional | 0.2–0.4 |
| High-rate | 0.5–1.5 |

Low F:M → oxidation goes far, low sludge yield, but old sludge (filamentous risk).
High F:M → high sludge production, fast process, but dispersed effluent.

### MLSS (mixed liquor suspended solids)

The total mass of solids (biomass + inerts) in the aeration tank. Typical:

- Conventional AS: 2 500–3 500 mg/L
- BNR plants: 3 500–5 000 mg/L
- MBR: 8 000–12 000 mg/L

MLVSS (volatile, the biological fraction) is typically 70–80 % of MLSS.

### SRT (sludge retention time)

SRT = total sludge mass in system / sludge mass wasted per day

Targets:

| Process | SRT |
|---|---|
| Carbon removal only | 4–6 d |
| Nitrification | 10–15 d |
| BNR (N + P) | 15–25 d |
| Extended aeration | 25+ d |

SRT is the operator's main lever — adjust WAS rate, SRT changes over a few days, and the whole microbial population shifts to suit.

## How they relate

- F:M and SRT are two faces of the same number: low F:M = high SRT, high F:M = low SRT.
- MLSS is a state variable; F:M and SRT are control variables.

The Hadron F:M Calculator gives you all three from plant readings.

_Source: Metcalf & Eddy Ch 8; WISA 2008 P112; Hadron F:M Calculator._`,

  'c-sew-201/m3': `## SVI₃₀

SVI (sludge volume index) is the volume occupied by 1 g of MLSS after 30 minutes settling in a 1 L cylinder:

  SVI = (SV₃₀ in mL/L × 1 000) / (MLSS in mg/L)

Where SV₃₀ is the volume the sludge occupies in 30 min.

## Reading the SVI

| SVI | Diagnosis |
|---|---|
| < 80 mL/g | Pin-floc / dispersed — F:M too high or sludge too young |
| 80–120 mL/g | Healthy, dense floc |
| 120–150 mL/g | Borderline — early filamentous |
| > 150 mL/g | Bulking — filamentous overgrowth |
| > 300 mL/g | Severe bulking — clarifier failure imminent |

## Causes of bulking

- Persistent low DO (< 1 mg/L) — favours filamentous _Microthrix_
- Low nutrient (low P / low pH) — favours _Type 021N_, _Sphaerotilus_
- Septic recycle from primary or thickener — favours _Beggiatoa_, _Thiothrix_
- Industrial discharges (FOG, sulfide) — _Nocardia_, foam-causing

## Microscopic exam

A drop of mixed liquor under 100× phase contrast. Look for:

- Floc structure: open vs compact
- Filamentous count: few = healthy, many = bulking
- Identify dominant filament type (Eikelboom guide) → root cause
- Protozoa: stalked ciliates indicate good treatment; free-swimming dominant = young sludge; absence = toxicity

## Bulking control

Address root cause first:
- Raise DO to 2 mg/L if sustained low
- Add P or alkalinity if deficient
- Eliminate septic recycle
- Source-control industrial inputs

Symptomatic control (when running while fixing):
- Selector tank (high F:M zone at front of aeration) — re-establishes dominance of floc-formers
- Chlorination of RAS at 2–5 mg/L to selectively kill filaments (RAS-Cl₂)

_Source: Eikelboom — _Process Control of Activated Sludge Plants by Microscopic Investigation_; Jenkins — _Manual on the Causes and Control of Activated Sludge Bulking_._`,

  'c-sew-201/m4': `## Why DO matters

Aerobic bacteria need dissolved oxygen. Below 2 mg/L, oxygen transfer into floc becomes diffusion-limited; below 0.5 mg/L, anaerobic zones form inside floc and filamentous organisms (which tolerate low DO better than floc-formers) gain advantage.

## DO targets

| Mode | DO target |
|---|---|
| Carbonaceous oxidation only | 1.5–2.0 mg/L |
| Nitrification | 2.0 mg/L (AOB cap at 0.5) |
| Pre-anoxic for denitrification | < 0.2 mg/L |
| Anaerobic for bio-P | < 0.1 mg/L |

In a single tank, DO varies along its length — uniform DO mixing isn't usually possible; instead, design as plug-flow with DO gradient.

## Oxygen demand and α-factor

  AOTR (actual oxygen transfer rate) = SOTR × α × β × (Cs* − C) / Cs(20) × 1.024^(T-20)

α (alpha-factor) is the ratio of mass-transfer in mixed liquor vs clean water — typically 0.5–0.85 for diffused aeration. β is salinity correction (typical 0.95). The α drops as MLSS rises; modern fine-bubble diffusers in deep tanks (6–9 m) achieve SOTE 25–30 %.

## Blower turn-down

Blowers are typically 50 % of total plant energy. DO-based blower control trims air supply to match demand:

- Most-Open-Valve (MOV) control — tracks the most-demanded zone, sets blower output
- Ammonia-based control — blower output set to keep effluent NH₃ at target (saves 10–25 % energy vs DO-only)

## Diurnal sag

DO drops at peak load (10:00, 19:00) when oxygen demand exceeds blower output. Operators should expect this and design for peak-hour demand, not 24 h average.

## Compound loop control

Modern PLCs run NH₃ + DO control: ammonia analyser drives blower base output; DO sensor trims it for transient response. Best-in-class plants run this with 50 % less energy than fixed-DO control.

_Source: Metcalf & Eddy Ch 8; EPRI Wastewater Energy Performance database._`,

  'c-sew-201/m5': `## RAS — return activated sludge

The clarifier collects MLSS as settled sludge at the bottom. Most of it is recirculated to the head of aeration as RAS to maintain MLSS. Typical RAS rates:

- 50–100 % of plant flow Q for conventional AS
- 100–150 % Q for nitrification
- Up to 250 % Q for BNR

Higher RAS rate = higher MLSS at given WAS rate. RAS adjusts MLSS, WAS adjusts SRT.

## WAS — waste activated sludge

A small fraction of returned sludge is wasted to control SRT. WAS pump rate (m³/h) typically 0.5–3 % of plant flow. Calculation:

  WAS rate = MLSS × V_aeration / (RAS_solids × SRT_target)

Most plants waste 3–6× per day in pulses rather than continuously, to keep RAS thickener consistent.

## Day-to-day strategy

The operator's three-step routine:

1. **Measure** MLSS at 09:00 daily
2. **Compare** to target (e.g. 3 000 mg/L)
3. **Adjust**:
   - If MLSS rising — increase WAS slightly (e.g. + 5 % rate)
   - If MLSS falling — decrease WAS
   - If MLSS swinging — check RAS pump operation, clarifier sludge depth

## Sludge age 10–20 days for nitrification

Nitrifiers grow at ~0.5 d⁻¹. To prevent washout, SRT must exceed 1/μ = 2 d. Add safety factor 5× for cold winter and target 10–15 d. Below 10 d, NH₃ will rise; above 25 d, biomass goes endogenous and effluent quality may worsen.

## Integration with chemistry

For BNR plants: keep RAS DO low (< 0.5) so denitrification can complete in pre-anoxic zone before recirculation. RAS that arrives oxic carries NO₃ into the anaerobic P-release zone, ruining bio-P.

_Source: Metcalf & Eddy Ch 8; WRC TT 685/16; WISA 2008 P112._`,

  /* ───── SEW-202 — Sludge Treatment & Nutrient Removal ───── */

  'c-sew-202/m1': `## Two sludge streams

A typical municipal works produces:

- **Primary sludge** — settled solids from the primary clarifier. 4–6 % dry solids, putrescible (turns septic in hours), high VS:TS ratio.
- **Waste activated sludge (WAS)** — biomass wasted to control SRT. 0.8–1.2 % dry solids, less septic (already aerated), 60–70 % VS.

Modern plants thicken WAS first to bring it up to 2–4 % before further processing.

## Thickening

- **Gravity thickener** — primary sludge to 5–8 % DS by simple settling. SOR 25–35 m³/m²·d.
- **Dissolved-Air Flotation (DAF) thickener** — for WAS. Air bubbles attach to floc and float them; thickened sludge skimmed off. 3–5 % DS achievable.
- **Mechanical drum / belt thickeners** — newer, more compact, 4–6 % DS typical with polymer.

## Dewatering

After digestion (or directly, in plants without digesters):

- **Belt-press** — old workhorse. 18–22 % DS cake with polymer. Cheap, dependable, water-hungry.
- **Centrifuge** — 22–28 % DS cake. More energy, high capital, less footprint, smaller polymer dose.
- **Screw-press** — 20–24 % DS, low energy, slow throughput. Good for small works.
- **Filter-press / chamber-press** — 25–35 % DS, batch operation, used for industrial sludges with high inerts.

## Disposal

- **Landfill** — cheapest historically; increasingly restricted (no organic waste allowed in some jurisdictions)
- **Land application / agriculture** — class A or B biosolids per WRC TT 261/05; controlled by sludge category, soil chemistry, crop type
- **Incineration** — energy-intensive; common in Europe, rare in SA
- **Beneficial reuse** — composting, pyrolysis to biochar, lime stabilisation for soil amendment

The disposal pathway dictates the dewatering target — agricultural use accepts 18 % cake; landfill demands ≥ 25 %.

_Source: WRC TT 261/05 (Guidelines for utilisation and disposal of wastewater sludge); Metcalf & Eddy Ch 14._`,

  'c-sew-202/m2': `## The four-stage degradation

Anaerobic digestion is the controlled decomposition of organic sludge in absence of oxygen, producing biogas (60–65 % CH₄, 35–40 % CO₂):

1. **Hydrolysis** — extracellular enzymes break complex organics into sugars, amino acids, fatty acids. Slow, often rate-limiting.
2. **Acidogenesis** — fermenting bacteria convert sugars to volatile fatty acids (VFA), H₂, CO₂.
3. **Acetogenesis** — VFAs converted to acetate, H₂, CO₂.
4. **Methanogenesis** — methanogens convert acetate or H₂/CO₂ to methane. Strict anaerobes, slow growers, sensitive to upset.

## Operating parameters

| Parameter | Mesophilic | Thermophilic |
|---|---|---|
| Temperature | 35 °C | 55 °C |
| HRT | 20–30 d | 12–18 d |
| VSS destruction | 50–60 % | 55–65 % |
| Pathogen reduction | Class B | Class A |
| Stability | High | Sensitive |

Most SA plants run mesophilic — easier to operate, more forgiving.

## Stability indicators

A healthy digester:

- pH 6.8–7.4 (methanogens fail outside this range)
- Alkalinity 2 000–5 000 mg/L (CaCO₃) — buffers against VFA accumulation
- VFA / alkalinity ratio < 0.3 (early warning if > 0.5)
- Biogas: 60–65 % CH₄. Drop to 50 % = methanogens stressed.

## Why digesters fail

Most acidic upsets follow:
- Hydraulic shock (too much sludge, too fast)
- Toxic load (heavy metals, ammonia > 1 500 mg/L NH₄-N inhibits methanogens)
- Cooling (winter, especially short HRT systems)
- Foaming from foaming organisms (Microthrix, Nocardia)

When VFA climbs above 1 000 mg/L acetate-equivalent, stop sludge feed, raise alkalinity (lime or NaOH dose), wait. Recovery takes 1–4 weeks.

## Biogas yield

Typical yield 0.45–0.60 m³ CH₄ / kg VS destroyed. A 50 ML/d plant with 20 % VSS destruction in digesters can produce 2 000 m³/d biogas — enough to run a 200 kW combined-heat-and-power unit, partially offsetting plant energy.

_Source: Metcalf & Eddy Ch 14; WRC research projects; Hadron site reports on Pretoria / Joburg digester operation._`,

  'c-sew-202/m3': `## Why BNR

In-river phosphorus is the #1 driver of eutrophication and algal blooms. Nitrogen forms (NH₃, NO₃) consume oxygen in receiving water and are toxic to aquatic life. The cheapest place to remove both is the WWTW — biologically, in the activated-sludge stage.

## Modified Ludzack-Ettinger (MLE) — N removal only

Two-zone process:

- **Anoxic zone** at front — receives raw sewage + RAS + internal recycle (NO₃-rich aerated effluent) — denitrification using BOD as electron donor
- **Aerobic zone** at back — nitrification

Internal recycle 200–400 % Q. NO₃ removal 70–80 %. Simple, robust, low chemical cost.

## UCT (University of Cape Town) — N + P removal

Three-zone:

- **Anaerobic zone** at front — RAS + raw sewage; PAOs release stored P, take up VFA
- **Anoxic zone** middle — receives nitrate from aerobic recirc, denitrifies
- **Aerobic zone** at back — nitrification + P uptake by stressed PAOs

UCT manages the problem of NO₃ contamination in the anaerobic P-release zone (which kills bio-P) by clever recirculation paths.

## 5-stage Bardenpho

Anaerobic → anoxic → aerobic → second anoxic (post-denitrification) → re-aerobic. The second anoxic uses endogenous respiration as electron donor for residual NO₃ removal. Achieves < 5 mg/L total N. Capital-heavy but the benchmark for tight-spec discharge.

## PAOs and the bio-P cycle

In anaerobic conditions, PAOs use stored polyphosphate as energy and accumulate VFA into PHB granules. In subsequent aerobic conditions, they oxidise the PHB and recharge polyphosphate from the surrounding water — taking up _more_ P than they released. Net effect: P concentrates in biomass, leaving the water.

Effluent P typically 0.5–2 mg/L from bio-P alone. To hit < 1 mg/L reliably, supplement with FeCl₃ or alum dosing — often called "polish" P removal.

_Source: Metcalf & Eddy Ch 8; WRC TT 685/16 — _Biological Nutrient Removal_; Wentzel & Ekama (UCT) papers._`,

  'c-sew-202/m4': `## NH₃ effluent target

GA limit: 6 mg/L. Special standard: 1 mg/L. Achievable targets:

- 6 mg/L: SRT > 8 d, DO 2 mg/L
- 3 mg/L: SRT > 12 d
- 1 mg/L: SRT > 18 d, alkalinity > 100 mg/L, MLSS > 3 500

Cold weather (T < 12 °C) adds 30 % to required SRT — design winter, not summer.

## NO₃ effluent target

GA does not regulate NO₃ directly, but Special standards may set 10–20 mg/L. NO₃ removal needs an anoxic zone with BOD as electron donor. Typical:

- 70 % NO₃ removal: MLE, internal recycle 300 % Q
- 90 % NO₃ removal: 5-stage Bardenpho or external carbon dosing (methanol, glycerol)

NO₃ budget: 1 g of NO₃-N reduces ~ 2.86 g BOD (assuming reasonable C:N stoichiometry). If BOD:NO₃ ratio < 4, supplement carbon.

## Total P effluent target

GA: 10 mg/L. Special standard: 1 mg/L. Achievable:

- < 5 mg/L: bio-P with anaerobic zone
- < 1 mg/L: bio-P + chemical polish (FeCl₃ at clarifier weir)
- < 0.1 mg/L: tertiary alum + sand filtration

Chemical P removal stoichiometry: 1.5 mol Fe per mol P (operational), or about 2.7 g FeCl₃ per g P removed.

## Operator drill

Read the daily lab report. If:

- NH₃ rises → SRT too short or DO too low → trim WAS down, raise DO target
- NO₃ rises → anoxic zone failing → check internal recycle pump, check for DO bleed into anoxic zone
- P rises → bio-P struggling (NO₃ in anaerobic zone?) → check recycle paths, raise FeCl₃ dose
- All three rise simultaneously → likely hydraulic / load shock — review flow records

Use the Hadron F:M and SRT calculators to convert "we wasted 100 m³ today" into a target SRT trend.

_Source: WRC TT 685/16; Metcalf & Eddy Ch 8; Hadron Effluent Tools._`,

  /* ───── SEW-301 — Plant Optimisation & Compliance ───── */

  'c-sew-301/m1': `## What Green Drop measures

Green Drop is the DWS-administered annual audit of all municipal wastewater treatment works. Score from 0 – 100 % across four dimensions:

### Process control (35 %)
- Documented operating procedures
- Skilled, classified operators on every shift (DWS Class IV → Class I plants)
- Calibration and maintenance discipline
- Sampling integrity

### Effluent quality (35 %)
- Compliance with discharge limits over the past 12 months
- Microbiological compliance separately scored
- Trend / direction of compliance (improving vs degrading)

### Capacity (15 %)
- Hydraulic + organic load relative to design
- Asset condition (buildings, electromechanical, civils)
- Spare-capacity / replacement readiness

### Compliance management (15 %)
- WUL conditions met
- Annual reporting on time
- Risk register maintained
- Public-health response capability

## The Green Drop scorecard

Score brackets:
- ≥ 90 % = Green Drop status (gold standard)
- 80–89 % = excellent
- 50–79 % = average
- < 50 % = critical risk

Most SA municipal works are in 30–60 % bracket. The 2024 report flagged > 60 % of South African WWTWs as critical-risk.

## Recovery roadmap

A failing plant doesn't fix itself. The roadmap:

1. **Operator competency** — get every shift Class III / IV minimum; PMs on calibration
2. **Sampling discipline** — fix the lab pipeline first; you can't manage what you can't measure
3. **Maintenance backlog** — focus on aeration system (50 % of energy), filter under-drains, dewatering
4. **Capital upgrade** — only after operations are sound; otherwise upgrade is wasted

_Source: DWS Green Drop reports 2013, 2022, 2024; WISA conference papers on Green Drop recovery._`,

  'c-sew-301/m2': `## Where the energy goes

A typical 50 ML/d plant uses 0.5–1.0 kWh/m³ treated. Of that:

| Process | Share of energy |
|---|---|
| Aeration blowers | 40–55 % |
| Pumping (RAS/WAS, plant feed) | 15–20 % |
| Sludge handling | 15–20 % |
| Mixing, scraping, lighting | 10–15 % |

So aeration is _the_ energy-saving target. Cutting it 30 % cuts plant power bill 15 %.

## Most-Open-Valve (MOV) control

The blower output should track the most-demanded zone. MOV strategy:

1. Identify the air valve that's most open across all aeration zones
2. Adjust blower output (variable-speed drive or inlet guide vane) so that valve sits at 90–95 % open
3. All other valves throttle as needed

Result: blower never delivers more pressure than the leakiest zone needs. Saves 10–25 % vs constant-pressure strategy.

## Ammonia-based control

Even smarter: install a NH₃ analyser on aeration outlet. Set blower output so effluent NH₃ stays at target (e.g. 1 mg/L). Saves further 10–15 % because nitrification only happens when needed, not 24 h continuous.

## Turbo vs lobe blowers

- **Lobe blowers** (Roots-type): cheap, robust, fixed-speed without VSD, efficiency ≈ 50 %. Fine for small works.
- **Multi-stage centrifugal**: efficiency ≈ 65 % at design point, drops sharply off-design.
- **Turbo (high-speed magnetic-bearing)** — newer, 75–80 % efficient, wide turn-down 30–100 %, minimal maintenance. 30–40 % more capital, often pays back in 2–3 years on energy alone.

## Diffuser maintenance

Old / fouled diffusers reduce SOTE from 30 % to 15 %. Half the oxygen, double the air. Symptom: blower output rising over months at constant load. Fix: bring tank empty for diffuser inspection / replacement every 5–8 years.

_Source: EPRI Wastewater Energy Performance database; Eskom-funded WRC studies on aeration energy._`,

  'c-sew-301/m3': `## What's already on the plant

Most plants have more instrumentation than they realise:

- Plant inlet flow (mag flow meter)
- DO probes in aeration
- Sludge depth in clarifier
- pH at clarifier outlet
- Effluent flow
- Sometimes: NH₃, NO₃, TSS, conductivity

These feed into a PLC / SCADA, but the data often dies there — SCADA shows live trends but nobody looks at yesterday's behaviour.

## Soft sensors

Where there's no direct sensor, _calculated_ values fill in:

- **MLSS** from clarifier sludge depth + RAS rate
- **F:M** from inlet flow + influent COD + MLVSS (manual sample)
- **OUR** (oxygen uptake rate) from blower output + DO setpoint + flow
- **SRT** from MLSS × tank volume / WAS pump record

UV-254 absorbance is a great _surrogate_ for COD — instant reading, much cheaper to instrument than continuous COD.

## Daily Service Report

The Hadron Service Report tool turns a plant tour into a structured daily record. Per shift, capture:

- Influent flow + composite COD/BOD/TSS
- Aeration MLSS / DO / pH
- Clarifier sludge depth / RAS rate / WAS rate
- Effluent flow + pH + ammonia / NO₃ / TSS
- Photos of mixed liquor, foam, scum

After 30 days you have a trend dataset. After 90 days you can spot drift before it becomes a non-conformance.

## Phone dashboards

The PLC can push key KPIs to a manager dashboard via MQTT or HTTPS. Manager checks 10 numbers each morning before leaving for the office. Doesn't replace plant visits — but flags the plant that needs a visit.

_Source: WRC TT (digital tools for WWTW); Hadron Service Report module._`,

  'c-sew-301/m4': `## A repeatable plant audit

Every 6–12 months, an audit walk that takes one afternoon:

### Step 1: Mass balances on flow

Compare influent meter to effluent meter. Difference > 10 % = leak (concrete crack, infiltration), unmetered bypass, or meter calibration error. Reconcile.

### Step 2: Mass balance on load

  Influent COD load (kg/d) = Q × COD = effluent load + sludge wasted (×COD content) + biogas (× C content)

If load doesn't balance, your sampling regime has a hole.

### Step 3: Sample integrity

Walk the sampling round. Are samplers calibrated? Are they pulling from a representative point? Are bottles pre-cleaned? Is the LIMS booking-in procedure followed?

### Step 4: Maintenance + calibration register

Open the file. When was the DO probe last calibrated (should be quarterly)? When was the magflow meter last verified (annual)? When were aeration diffusers last inspected (5 yr)? Anything overdue is a finding.

### Step 5: Operator competency review

Talk to each shift operator for 15 min. Can they explain F:M, SRT, alkalinity, why the clarifier is short-circuiting? If not, training plan. Class certification on file?

### Step 6: Risk register

Open the WSP / risk register. When was it last reviewed? Are corrective actions for past NCs closed? Are they re-assessed on current data?

## The audit report

Three pages — findings, recommendations, scoring. Distribute to plant manager, asset manager and regulator-facing official. Re-audit in 6 months.

_Source: DWS Green Drop audit framework; WISA Plant Operations Auditor course._`,

  /* ════════════════════════════════════════════════════════════════
     TRACK 4 — INDUSTRIAL EFFLUENT
     ════════════════════════════════════════════════════════════════ */

  /* ───── EFF-101 — Effluent Characterisation & Standards ───── */

  'c-eff-101/m1': `## The minimum panel

Before you treat anything, characterise it. Standard panel for industrial effluent:

- **Flow** — peak hourly, daily volume, batch profile if intermittent
- **pH** — equalisation tank average; range hour-to-hour
- **COD / BOD** — sketch the BOD/COD ratio (≥ 0.5 = biodegradable; < 0.3 = recalcitrant)
- **TSS / VSS** — settleable solids vs total
- **TKN, NH₃-N, NO₃-N** — nitrogen forms
- **Total P** — orthophosphate vs total
- **Conductivity / TDS** — proxy for dissolved-salt loading
- **FOG (Fat-Oil-Grease)** — 1664-A solvent extraction
- **Heavy metals** — ICP scan for Cu, Zn, Cr, Ni, Pb, Cd, As (+ Hg if relevant)
- **Anions** — Cl⁻, SO₄, F⁻

Two samples a week for a month establishes the baseline.

## Composite vs grab

- _COD, BOD, TSS, N, P_ — composite (24 h, flow-paced) is honest. Grab samples lie about variable inflow.
- _pH, residual Cl, DO, sulfide_ — grab only (composites change over time)
- _FOG_ — grab from surface (composite homogenisation breaks emulsion)

## Loading vs concentration

Concentration tells you what comes out of the tap. _Load_ (kg/day) tells you what the receiving system has to handle. Concentration × volume = load.

A 10 m³/d tannery effluent at 20 000 mg/L COD imposes the same daily load (200 kg) as a 1 000 m³/d brewery at 200 mg/L. The treatment economics are wildly different.

## What to ask the production floor

A dataset is necessary but not sufficient — also ask:
- What product / batch produces the worst load?
- Is there a campaign / shutdown washdown that spikes flow + COD?
- Is rinse water re-used or once-through?
- Are there any specific spent baths being dumped to drain (chrome, cyanide, paint)?
- Are pH-neutralisation chemicals already on-site?

The answers usually halve the eventual capital cost.

_Source: APHA Standard Methods; DWS WUL guidance._`,

  'c-eff-101/m2': `## Three regulatory routes

Industrial effluent has three possible legal destinations, each with its own limits:

### To municipal sewer (trade-effluent permit)

City by-laws typically allow:

- pH 6–10
- COD ≤ 5 000 mg/L
- TDS ≤ 4 000 mg/L
- Specific limits on metals (Cu 5, Zn 5, Cr 3, Ni 5, Cd 0.5, Pb 5 mg/L typical)
- FOG ≤ 200 mg/L
- Sulfide ≤ 50 mg/L
- T ≤ 40 °C

The works will polish what you discharge. But you pay tariff on COD load.

### To surface water (General Authorisation)

- pH 5.5–9.5
- COD ≤ 75 mg/L
- Suspended solids ≤ 25 mg/L
- NH₃ ≤ 6 mg/L
- E. coli ≤ 1 000 cfu/100 mL

Tightest limits — your effluent must approach drinking-water quality.

### Special standard / Water Use Licence

Site-specific. Tighter than GA. Issued where the receiving river is already stressed.

## Picking your route

Most industrial sites discharge to sewer because sewer limits are 50–100× more lenient than surface-water limits. The trade-effluent tariff is then the operating cost driver — typically R 5–15 per kg COD loaded. A 50 t/month COD reduction saves R 250 000–750 000/y.

## Cumulative effects

Increasingly, regulators look at receiving water _quality_ not just permit compliance. A river already at its assimilative capacity may force a permit holder to reduce load even if they're complying with the original permit. Don't assume "we've always discharged this much" — load limits change.

_Source: National Water Act 1998; DWS GA notice 665 of 2013, amendments 2024; municipal trade-effluent by-laws (Joburg, Tshwane, eThekwini)._`,

  'c-eff-101/m3': `## A decision matrix

Walk through these questions in sequence:

### 1. Is BOD/COD ratio > 0.5?
- **Yes** → Biological treatment is viable. Aerobic for moderate strength, anaerobic for COD > 3 000 mg/L.
- **No** → Recalcitrant organics. Need physical/chemical pre-treatment (DAF, oxidation) before biology, or skip biology entirely.

### 2. Are heavy metals > sewer limits?
- **Yes** → Chemical precipitation first. pH-adjust + lime/caustic to precipitate hydroxides; sulfide polish for ppb residuals. (See EFF-301)
- **No** → Skip the metals stage.

### 3. Is FOG > 200 mg/L?
- **Yes** → Pre-treat. Gravity grease trap (cheap, low-rate), DAF (better, more expensive), or biological FOG digestion (industrial-only).
- **No** → Skip.

### 4. Is pH within 6–10?
- **Yes** → No neutralisation needed.
- **No** → Two-stage neutraliser with auto-pH control. Acid + base feeds, residence time, pH probes.

### 5. Are sulfides / cyanide / chrome(VI) present?
- **Yes** → Specialised pre-treatment. Sulfide → oxidation; CN → alkaline chlorination; Cr(VI) → reduction with sulfite or bisulfite.

### 6. After all the pre-treatment, can biology handle the residual?
- **Yes** → Activated sludge / anaerobic digester / SBR / MBR
- **No** → Add tertiary polishing: GAC, ozone, RO

## A sample treatment train

Brewery effluent (3 000 mg/L COD, BOD/COD 0.7, pH 5.2, low metals):

1. Equalisation 12 h
2. pH neutralisation to 7.0
3. Anaerobic UASB (80 % COD removal → 600 mg/L COD)
4. Aerobic SBR (80 % polish → 120 mg/L COD)
5. Optional sand filter for TSS
6. Discharge to sewer (within 5 000 limit, well below 75 GA limit)

## Hadron tools that help

- BOD/COD/TSS removal calculator → measure your removal efficiency
- Effluent F:M / SRT / Jar Test → optimise biology
- Acid/Alkali → size the neutraliser
- Coagulants Calc → dose any chemical addition

_Source: Metcalf & Eddy Industrial Wastewater chapters; Hadron Effluent Tools._`,

  /* ───── EFF-201 — Paint Detackification ───── */

  'c-eff-201/m1': `## Why paint booth water is a problem

In a spray booth, only 30–50 % of paint actually lands on the part. The rest — overspray — is captured by water curtain or downdraft sump. That water progressively loads up with sticky paint solids that:

- Coat the booth floor and walls — slip hazard, fire hazard
- Block recirculation pumps and nozzles
- Accumulate as a sludge mat that won't float, won't settle, won't pump
- Generate VOC odours

Without detackification, the booth is unusable inside a week.

## Paint chemistries

Different paint types behave differently in the sump:

### Solvent-borne
Resin dissolved in organic solvent. Overspray droplets keep their tack until solvent evaporates. Most aggressive on booth water.

### Water-borne
Resin dispersed in water (latex, acrylic emulsion). Overspray droplets dilute in the sump. Easier to detack, but can re-disperse if pH drifts.

### 2K (two-component)
Polyurethane, epoxy. Cure on contact regardless of water. Detackification helps by binding the solids before they cure to surfaces.

### Powder
Electrostatic dry powder, no solvent. If captured to water sump, must coalesce + float (different chemistry from liquid paints).

## Solids loading

Typical loadings:
- Light vehicle production: 0.05–0.2 kg paint solids per car body
- Truck cab: 0.5–1.5 kg per cab
- Industrial component finishing: 5–15 g/m² coated

Multiply by units/day to get kg solids/day to handle.

## Booth water baseline

Operator weekly tests:
- pH 7.0–9.0 typical
- Conductivity stable (drift = chemical accumulation)
- ORP > 0 (negative = septic — Beggiatoa, foul odour)
- Sludge depth in pit
- Booth-floor stickiness (subjective but real)

_Source: Hadron Paint Detack Treatment Guide (uploaded), Section 1; Nalco Water Handbook Ch 22._`,

  'c-eff-201/m2': `## How detackification works

Two coupled chemical actions:

### Stage 1: Cationic detackifier — kill the tack
Cationic polymer (poly-DADMAC, polyamine, or melamine resin) bonds to the paint resin's anionic surface, neutralising charge and "killing" the surface tack. The droplet stops being sticky.

### Stage 2: Anionic flocculant — form sludge
Anionic polyacrylamide (high MW) bridges multiple detackified particles into large floc. The floc:
- Floats (most water-borne paints) → skimmed off as a sludge mat
- Settles (solvent-borne, dense pigments) → bottom-pumped from sludge cone

Together: tack killed, floc formed, sludge separable.

## Programme types

### Melamine-formaldehyde based
Classical, ~80 % of installations. Cationic primary at 50–250 mg/L. Effective on most paint chemistries; some odour.

### Bentonite + polymer
Clay-based. Bentonite adsorbs solvent; polymer bridges. Used in older systems. Higher sludge volume, lower cost per kg paint.

### All-organic (polymer-only)
Modern systems. Cationic + anionic polymer dose. No bentonite, lower sludge volume, easier disposal.

### Sequential mix
Mixed metering of cationic + anionic into the booth recirc. Two pumps, two storage tanks, dose ratio set by jar test.

## Dose ranges

Typical operating dose:
- Cationic primary: 50–250 mg/L (2–10 L per 1 000 L booth water at 5 % strength stock)
- Anionic floc: 1–5 mg/L (0.5–2.5 L per 1 000 L at 1 % stock)

Always run a fresh jar test for new paint chemistry. Use a 3-jar dose ladder cation × 3-jar dose ladder anion = 9 combinations. Pick the one with cleanest float, no re-dispersion.

_Source: Hadron Paint Detack Treatment Guide, Sections 3–4; AWMA coatings conference papers._`,

  'c-eff-201/m3': `## The four-test daily round

Take these readings every shift:

### 1. pH
Target 7.5–8.5 (most programmes). Drift up = caustic accumulation from caustic-substrate cleaners; drift down = paint resin oxidation, septic.

### 2. Conductivity
Trends matter more than absolute. Steady-state ≈ 1 500–3 500 µS/cm. Sharp rise = chemical overdose or losing make-up control.

### 3. Residual cationic detackifier
Use a cationic-charge titration (Mütek-style streaming-current detector or simple charge-demand titration). Negative = under-dosed, paint will redisperse. > 0 = adequate dose.

### 4. Sludge depth + booth-floor inspection
- Sludge depth in pit: log mm. Skim or pump when > target (200–500 mm depending on pit design).
- Booth floor: dragging fingertip across grating — should be tacky-to-firm, not gummy.

## Settled sludge

Periodic 30-minute settlement test (1 L Imhoff cone or equivalent):
- Healthy: 200–400 mL/L floats; clear water below
- Re-dispersing (under-dosed cation): cloudy water + slow float
- Sticky carry-over (over-dosed cation): floats + bottom layer + grease ring

## Make-up control

Booth water evaporates and is dragged out as sludge. Make-up is added to maintain level. The make-up rate sets your overall chemistry concentration:

- Add too much = dilute programme, paint re-disperses
- Add too little = chemicals concentrate, foam forms, sludge over-condenses

Most plants run a level-trigger auto-make-up with periodic blowdown to control TDS.

## Sludge skim / bottom-pump

Every 4–8 h: skim float to dewatering pit. Every shift: log volume removed. Sludge runs ~ 5–8 % DS leaving the booth. Belt-press or filter-press dewaters to 30–40 % cake.

_Source: Hadron Paint Detack Treatment Guide, Section 5._`,

  'c-eff-201/m4': `## Sticky booth floor

Symptom: paint solids smear, gummy patches on grating.
Cause: under-dosed cationic detackifier. The droplets aren't being killed before settling.
Fix:
1. Run a cationic-charge titration. Negative reading confirms under-dose.
2. Increase cation dose 25 % at a time, retest after 4 h
3. If problem persists, jar-test against fresh paint chemistry — formulation may have changed at the spray supplier.

## Re-dispersed sludge

Symptom: floc breaks apart, water turns cloudy, no clean float.
Cause: over-dosed cation re-stabilises as positive zeta-potential. Or chemistry ageing.
Fix:
1. Dilute booth water 10–20 %
2. Reduce cation dose
3. Increase anion (often the answer is more bridging, not less cation)

## Foam / surface scum

Symptom: foam on surface, doesn't settle.
Cause: surfactants from substrate cleaners; or air entrainment from over-aerated recirc; or specific paint additive.
Fix:
1. Add silicone defoamer (50–200 mg/L)
2. Reduce surfactant inflow (substrate clean before paint, not during)
3. If from paint, switch to lower-foaming detack chemistry

## Septic odour / black sludge

Symptom: "rotten egg" or rancid smell, ORP negative.
Cause: anaerobic bacteria in pit, sulfide formation. Common after weekend shutdowns.
Fix:
1. Shock biocide (glutaraldehyde or DBNPA) at 50–100 mg/L
2. Increase recirculation flow / aeration
3. Reduce sludge residence time in pit

## Sludge that won't dewater

Symptom: belt-press cake too soft, won't release from belt; centrifuge spinning sludge instead of compacting.
Cause: programme imbalance — too much polymer, too little floc strength.
Fix:
1. Reduce polymer dose to dewatering aid
2. Switch to a more ionic-strength polymer (anionic for water-borne, cationic for solvent)
3. Pre-condition sludge with FeCl₃ or alum before press

_Source: Hadron Paint Detack Treatment Guide, Section 6; site case-studies._`,

  /* ───── EFF-202 — Food & Beverage Effluent ───── */

  'c-eff-202/m1': `## Brewery (lager / craft / micro)

The cleanest of the F&B effluents in some ways — high carbohydrate, no surfactants beyond CIP. But _huge_ batch peaks (yeast pull, tank wash, line CIP).

- COD: 2–8 kg per HL beer produced
- BOD: 1.5–5 kg/HL
- BOD/COD ratio: 0.6–0.7 (highly biodegradable)
- pH: 4–11 swings hour by hour (CIP cycles)
- TSS: 100–500 mg/L
- N + P: usually adequate ratio for biology

A 100 hL/day micro-brewery makes 200–800 kg COD/day — equivalent to a town of 1 500 people.

## Dairy

Milk + whey are nutrient-rich, biodegradable, high FOG.

- COD: 1–5 kg per m³ milk processed
- FOG: 100–500 mg/L (very high, source of foaming + line clog)
- Lactose-rich → easy biology, but rapid souring if equalised too long
- pH 4–11 swings (alkaline CIP, acid CIP)
- Casein precipitates at pH 4.6 — pre-treat upstream of biology

## Abattoir

The dirtiest. Blood, manure, paunch contents, fat.

- COD: 5–15 kg/m³ effluent
- FOG: 500–2 000 mg/L
- High N (urea, blood proteins → NH₃ in days)
- Suspended solids high
- Strong odour, septic in hours

Pre-treatment via screening, equalisation + DAF is mandatory. Direct biology fails.

## Soft drinks / sugar / confectionery

High BOD from sugar, low N (sugar carries no nitrogen). Need supplemental nitrogen for biological treatment (urea or NH₃ dose).

## Seasonal swings

Most F&B plants run campaign-style — wine in Feb–May, citrus in May–Aug, sugar in Apr–Dec. Designed for peak season; in off-season may need partial-throughput or recycle-loop operation.

_Source: Hadron Food & Beverage Effluent Guide (uploaded), Section 1; Brewers Association — wastewater BMP._`,

  'c-eff-202/m2': `## The four pre-treatment stages

Before any biology, F&B effluent needs:

### 1. Screening
1 mm screen at minimum. Removes hops, paunch, packaging fragments, hair, bones.

### 2. Equalisation tank

The single most important tank in F&B. Without it:
- Biology is shocked by hourly load swings
- pH chemistry can't keep up with CIP cycles
- Pumping system can't size

Sizing: 6–24 h volume, equal to peak day's flow. Mixing essential (avoid sour pockets). Cover for odour control.

### 3. pH neutralisation

Auto-pH dosing system: HCl (or H₂SO₄) for alkaline, NaOH (or Ca(OH)₂) for acidic. Two-stage with intermediate measurement. pH probe with ATC and weekly calibration.

### 4. FOG removal

Three options:

- **Static skimmers / API separators** — gravity. Cheap. Removes 60–80 % FOG. Slow (HRT 4–8 h).
- **Dissolved-air flotation (DAF)** — microbubbles float emulsified FOG. 90–95 % removal at 5–10 m/h. (See EFF-203.)
- **Induced gas flotation (IGF)** — like DAF but uses inducers, simpler, lower removal.

## When pre-treatment is enough

Sometimes a high-rate aerobic system can handle the residual without a separate biological stage. SBR (sequencing batch reactor) is popular — 4 cycles/d × fill / aerate / settle / decant.

For COD > 3 000 mg/L, anaerobic before aerobic almost always pays.

_Source: Hadron F&B Effluent Guide, Sections 2–3._`,

  'c-eff-202/m3': `## Why anaerobic

For COD > 2 000 mg/L:
- Anaerobic produces biogas → energy recovery
- 80–90 % COD removal at modest energy input
- Sludge yield 5–10× lower than aerobic
- Footprint smaller than equivalent aerobic

Below 2 000 mg/L COD, anaerobic struggles — slow kinetics, aerobic wins.

## UASB — upflow anaerobic sludge blanket

The dominant technology for F&B effluents:
- Sludge granules form naturally — pellet of methanogens with high specific activity
- Effluent enters bottom, rises through granular bed, biogas separated at top
- HRT 4–8 h (way faster than CSTR digester)
- Removal: 80–90 % COD
- Granule formation 3–6 months on ramp-up

Operating temperature 30–35 °C (mesophilic). Ramp up slowly — over-feeding kills granules.

## EGSB — expanded granular sludge blanket

The next-generation UASB:
- Higher upflow velocity (4–10 m/h vs 1–2 m/h UASB)
- Better mass transfer
- Smaller footprint at same load
- More forgiving to load swings

Used at brewery / sugar / paper mill scales.

## Biogas yield and use

Yield: 0.4 m³ CH₄ / kg COD removed. A brewery with 1 000 kg COD/d removed → 400 m³ CH₄/d → ~ 4 000 kWh thermal value → 1 500 kWh electrical via CHP.

Most plants flare excess; modern plants run a CHP (combined heat-and-power) and offset 30–60 % of plant energy.

## Trouble-shooting

- VFA accumulation → reduce feed rate, raise alkalinity
- Granule washout → check upflow velocity, gas-solid separator design
- Sour effluent (pH dropping below 6.5) → emergency lime feed, halve feed rate

_Source: Hadron F&B Effluent Guide, Section 4; Lettinga & Hulshoff Pol — UASB design papers; Brewers Association BMP._`,

  'c-eff-202/m4': `## Why aerobic polishing after anaerobic

UASB effluent at 80 % COD removal still carries 400–800 mg/L COD. Aerobic stage cuts this to < 75 mg/L (GA discharge) or < 30 mg/L (special standard).

## SBR (Sequencing Batch Reactor)

A single tank running cycles:
1. Fill (15 min – 2 h)
2. Aerate (4–6 h)
3. Settle (1 h)
4. Decant (30 min)
5. Idle / waste sludge

Whole cycle 6–8 h, so 3–4 cycles per day. Operationally simpler than continuous AS — no clarifier, no RAS pumps. But control system is more complex (timers, level sensors, auto-decant).

## Continuous AS

Standard activated-sludge if flow / load is constant. SRT 8–15 d, MLSS 3 000–4 500 mg/L.

## SRT control for nitrification

F&B effluent is high in N (especially abattoir). To nitrify reliably:
- SRT > 12 d (winter)
- DO > 2 mg/L
- Alkalinity supplementation if low

Without nitrification, effluent NH₃ remains high — fails GA limit of 6 mg/L.

## Final discharge polish

After AS:
- TSS clarifier (if not in SBR)
- Sand filter (residual TSS, BOD)
- Optional UV (microbiological compliance)

For large dairy / brewery, MBR (membrane bioreactor) replaces clarifier + sand filter — gives constant 0.1 NTU, 5 mg/L TSS effluent.

_Source: Hadron F&B Effluent Guide, Section 5; Metcalf & Eddy industrial wastewater chapters._`,

  /* ───── EFF-203 — Dissolved Air Flotation ───── */

  'c-eff-203/m1': `## How DAF works in 30 seconds

1. A side-stream of treated effluent (recycle, typically 8–30 % of feed flow) is pumped through a saturator vessel held at 4–6 bar pressure with compressed air.
2. At that pressure, water dissolves about 6× as much air as at 1 bar.
3. The pressurised, air-saturated recycle is mixed with incoming effluent + chemicals, then released into the DAF tank at 1 bar.
4. The instant pressure drop releases dissolved air as ~ 30–80 µm microbubbles.
5. Microbubbles attach to floc + FOG droplets, dramatically reducing apparent density.
6. Particle-bubble agglomerate floats to the surface as a sludge mat.
7. Surface skimmer mechanically removes the float; clarified effluent leaves through a submerged outlet.

## Henry's Law

The amount of air dissolved is proportional to pressure:

  Cs(P) = K × P

where K is the Henry constant for air in water. At 5 bar gauge (6 bar absolute), 6× as much air dissolves as at atmospheric.

## Bubble size and capture

Bubble size 30–80 µm gives:
- Slow rise (Stokes), allowing contact time with particles
- Adequate buoyancy when attached
- High surface-area-to-volume → good attachment kinetics

Bubbles > 200 µm rise too fast; < 20 µm don't lift particles.

## Particle-bubble agglomeration

Three mechanisms:
1. **Direct adhesion** — hydrophobic surface (FOG, bacteria) directly captures bubble
2. **Entrainment** — bubble physically traps a particle in its rising path
3. **Pre-attachment** — if floc is formed first by polymer, bubbles get trapped inside the floc as it forms

DAF works best with all three — flocculate first, then float.

_Source: Hadron DAF Manual (uploaded), Section 1; Bratby — _Coagulation & Flocculation in Water and Wastewater Treatment_, Ch 7._`,

  'c-eff-203/m2': `## Hydraulic loading

Surface loading rate (SOR or hydraulic load):

  SOR = (Q + Q_recycle) / A

Typical: 5–15 m/h. Low end for fragile floc (algae); high end for industrial sludge thickening.

Compared with sedimentation (1–3 m/h) DAF is 3–5× more compact.

## Solids loading

  Solids load = mass solids in feed / area of DAF surface

Typical 5–12 kg/m²·h for clarification, 2–6 kg/m²·h for sludge thickening.

## Air-to-solids ratio (A:S)

The single most important sizing number:

  A:S = (R × P × Cs × f) / (Q × X)

where R = recycle rate, P = saturation pressure, Cs = saturation concentration of air, f = saturator efficiency (0.7–0.8), Q = feed flow, X = feed solids.

Typical:
- Clarification: A:S = 0.005–0.015
- Sludge thickening: A:S = 0.02–0.06
- Difficult sludges (FOG-laden, viscous): up to 0.10

Below the minimum A:S, particles don't all attach a bubble; you get short-circuit failures.

## Recycle ratio

Recycle ratio R = Q_recycle / Q_feed. Typical 8–30 %. Higher recycle = more air available + dilution of feed (which improves visibility for the bubbles to attach).

## Saturator pressure

5–6 bar typical. Higher pressure dissolves more air but burns more energy. Saturator "f" factor — how completely the saturator equilibrates pressure-air-water — depends on internals (random packing, structured packing, baffles); good design gets 80 %.

_Source: Hadron DAF Manual, Section 2; Edzwald — _Dissolved Air Flotation in Water and Wastewater Treatment_, IWA Publishing._`,

  'c-eff-203/m3': `## Daily routine

The DAF operator's morning round:

1. **Saturator pressure** — should sit at design (typically 5–6 bar). Drop = compressor or relief-valve issue.
2. **Saturator level** — sight glass; should be 50–70 % full. Too high = water carries-over to outlet; too low = air carries-through, no microbubbles.
3. **Recycle pump pressure** — confirms recycle flow. Check magflow if available.
4. **Float quality** — looks like a coffee-foam mat; thick, stable, easily skimmable. Watery / non-cohesive = under-dosed coagulant.
5. **Effluent turbidity** — should be < 30 NTU after DAF on chemical-treated effluent. Higher = breakthrough or air loss.
6. **Skimmer speed** — too fast tears up the float; too slow lets it drown. Adjust to remove most of the float without breaking it.
7. **Sludge pit level** — make sure float is being collected and not just being skimmed onto an overflowing trough.

## Float dryness

Good DAF sludge is 2–4 % dry solids. With polymer + favourable chemistry, can reach 5–6 %. Wet float (< 1 % DS) is symptomatic of skimmer too aggressive or air-bubble release insufficient.

## Polymer dose

Most DAF chemistry runs a 2-stage programme:
- Cationic / inorganic primary coagulant (alum, ferric, PAC) at 30–100 mg/L
- Anionic polymer at 0.2–1 mg/L for floc bridging

Inject the primary 1–2 min upstream of the DAF (give time for charge neutralisation); polymer 10–30 sec upstream (immediate before float).

## Compressor / saturator condition

Quarterly: open the saturator inspection cap, look for biofouling on the packing. Annual: relief-valve test, compressor air-receiver drain, pressure-gauge calibration. Air leaks anywhere in the saturator/release path destroy A:S; find and seal them.

_Source: Hadron DAF Manual, Section 3._`,

  'c-eff-203/m4': `## Sinking sludge / loss of float

Symptom: sludge mat fragments and falls to bottom; effluent gets cloudy.
Causes:
1. A:S ratio too low — increase recycle pressure or recycle rate
2. Saturator running low / no air — refill, check air supply
3. Polymer dose wrong (too low or too high) — re-jar test
4. Inflow surge breaks mat — install / improve flow distributor

## No float at all

Symptom: water comes through cloudy, no skimmable layer.
Causes:
1. Saturator empty (bypassed) — check air feed, level switches
2. Coagulant dose stopped — pump failure, empty tank
3. pH outside coagulant window — auto-pH dosing failed

## Float break-up (over-treated)

Symptom: mat starts to break apart in random patches.
Causes:
1. Polymer overdose — re-stabilises particles
2. Skimmer running too fast — reduce
3. Excess turbulence at outlet — baffle the outlet weir

## Excessive scum carry-over

Symptom: clarified effluent has surface debris.
Causes:
1. Skimmer too slow or running blind — adjust
2. Float ring around outlet weir — install scum baffle / oil-skimmer
3. Sludge trough overflowing back into clarified zone

## Pump cavitation in recycle

Symptom: noisy recycle pump, dropping pressure.
Causes:
1. NPSH starved (saturator level too low) — top up
2. Air entrainment in pump suction — re-pipe with proper flooded suction

## Maintaining performance

A well-run DAF should hold its operating envelope for years with minimal intervention. The key is daily monitoring and quick response to drift; once any of these fault patterns has run for hours, recovery is slow.

_Source: Hadron DAF Manual, Section 4; Edzwald — DAF for Water Treatment._`,

  /* ───── EFF-301 — Heavy Metals & pH Neutralisation ───── */

  'c-eff-301/m1': `## The principle

Most heavy metals form insoluble hydroxides. Add OH⁻ (lime / caustic / soda ash), pH rises, hydroxide precipitates. Filter / clarify / dewater. Dispose of metal-bearing sludge.

  M²⁺ + 2 OH⁻ → M(OH)₂↓

Each metal has its own minimum solubility pH, set by its Ksp. Above _and below_ that pH the hydroxide redissolves.

## Solubility-vs-pH curves

| Metal | pH min | Min solubility |
|---|---|---|
| Zn(OH)₂ | 9.5–10.5 | 0.01 mg/L |
| Cu(OH)₂ | 9.0–9.5 | 0.05 mg/L |
| Ni(OH)₂ | 10.0 | 0.07 mg/L |
| Cd(OH)₂ | 10.0 | 0.005 mg/L |
| Pb(OH)₂ | 9.5–10.5 | 0.01 mg/L |
| Cr(III)(OH)₃ | 8.5 | 0.05 mg/L |
| Fe(III)(OH)₃ | 7.0 | < 0.01 mg/L |
| Hg(OH)₂ | wider, but precipitate poor | needs sulfide |

The textbook trick: at pH 9.5, you get adequate removal of most metals simultaneously. For multi-metal effluent, target pH 9.5–10 as compromise.

## Cr(VI) — special case

Hexavalent chromium (CrO₄²⁻, Cr₂O₇²⁻) is _soluble_ at any pH and acutely toxic. Two-step:

1. Reduce to Cr(III) at pH 2–3 with sulfite (NaHSO₃, SO₂) or ferrous sulfate (FeSO₄):
   Cr(VI) + 3 Fe(II) → Cr(III) + 3 Fe(III)
2. Raise pH to 8.5 to precipitate Cr(OH)₃

## Other special cases

- **Mercury (Hg)** — hydroxide poor; use sulfide (Na₂S, NaHS, TMT-15)
- **Arsenic** — requires pre-oxidation As(III) → As(V); precipitate with FeCl₃ at pH 6–7
- **Cyanide (CN⁻)** — alkaline chlorination at pH > 10 oxidises CN⁻ → CNO⁻ → CO₂ + N₂

## Sludge implications

Hydroxide sludge is voluminous (1.5–2 % DS at clarifier underflow). Volume can be 5–10 % of treated effluent. Dewatering to 30 % cake essential before disposal.

_Source: USEPA — Removal of Heavy Metals from Water; Crites & Tchobanoglous Ch 12._`,

  'c-eff-301/m2': `## Why two stages

Single-stage neutralisation at pH 9.5 fights against itself: at pH 9.5, Cr(VI) is still soluble, and any acid surge can drive metals back into solution. Two-stage gives finer control:

### Stage 1 — pH 2–3 (acid attack)
- Adds HCl or H₂SO₄ to drive pH down
- Sulfite or ferrous sulfate dose for Cr(VI) reduction
- Residence time 20–30 min
- All metals soluble; acidic conditions

### Stage 2 — pH 9–10 (alkaline precipitation)
- NaOH, lime, or soda ash dose
- Polymer dose for floc formation
- Residence time 30–60 min
- Hydroxide precipitates form
- Sludge separates in subsequent clarifier or DAF

## Auto-pH control

Stage-by-stage pH probes drive the chemical pumps. Rules:

- Probes calibrated weekly at minimum (acid environment is harsh on glass)
- Backup probe: install two probes per stage with cross-check alarm
- Dead-band 0.2 pH to prevent hunting
- Slow-response integral term — pH systems oscillate without it

## Lime vs caustic vs soda ash

| Reagent | Cost | Sludge | Notes |
|---|---|---|---|
| NaOH (50 %) | High | Low (Na soluble) | Easy to dose, no scale |
| Ca(OH)₂ (lime, slurry) | Cheap | High (Ca remains) | Dosing system more complex |
| Na₂CO₃ (soda ash) | Medium | Some carbonate | Useful for Pb, Cd |

For highly acidic effluent, lime is cheapest by mass; for clean dose control, NaOH; for specific metal targets (lead), soda ash.

## Storage and feed

- 32 % HCl: HDPE tanks, Hastelloy/Viton seals on pumps
- 50 % NaOH: HDPE or steel-lined, heat-traced (freezing point 12 °C at 50 %)
- Lime slurry: agitated tank, eccentric-rotor pumps to handle solids

_Source: WRC Handbook B6 (chemical neutralisation); Hadron Acid/Alkali Calculator._`,

  'c-eff-301/m3': `## Why polishing matters

Hydroxide precipitation gives 0.05–1 mg/L residual metals. Some discharge permits demand 0.05–0.5 mg/L for specific metals (especially Cr, Cd, Hg). At those levels, two polishing technologies dominate:

## Sulfide precipitation

Metal sulfides have far lower solubility than hydroxides:

  M²⁺ + S²⁻ → MS↓

Solubility comparison (mg/L):
| Metal | Hydroxide | Sulfide |
|---|---|---|
| Cu | 0.05 | 0.0002 |
| Ni | 0.07 | 0.001 |
| Pb | 0.01 | 0.001 |
| Cd | 0.005 | 0.00005 |
| Hg | poor | 0.00001 |

Implementation:
- Add Na₂S, NaHS, or TMT-15 (trimercaptotriazine) at 1.05–1.2 stoichiometric ratio
- Dose at pH 8–9 (avoid H₂S evolution at low pH)
- Polymer + clarifier downstream
- Excess sulfide must be removed (catalysed air oxidation) before discharge

Risks: H₂S off-gassing if pH drops; black, foul-smelling sludge; operator-protection critical.

## Chelating ion-exchange resin

Selective resins (Lewatit TP207, Purolite S930+, Dowex M4195) bind specific metals via chelating functional groups:

- Iminodiacetic acid groups → Cu, Ni, Zn, Cd, Pb
- Bispicolylamine → Cu, Ni preferentially
- Aminophosphonic → broader spectrum

Process:
- Polished effluent passes through column at 10–20 BV/h
- Column loads to 30–50 g metal / L resin
- Elute with HCl or H₂SO₄ to recover metal as concentrate
- Re-condition, return to service

Expensive, but the only route to ppb residuals + metal recovery (chrome plating, copper electrowinning).

## Membrane diffusion (DDD)

For very dilute effluents with minimal organic load, donnan-dialysis membranes can selectively migrate metals to a concentrate stream. Niche application.

_Source: Crites & Tchobanoglous Ch 12; Lewatit / Purolite resin manuals._`,

  'c-eff-301/m4': `## What kind of waste is metal sludge

Metal hydroxide sludge from chemical precipitation is a **hazardous waste** under SA waste classification (NEMWA). Type HW01 if total metal concentration is "significant" (typically > 1 % combined metals). Disposal requires:

- Manifest tracking (NEMWA Schedule 1 procedures)
- Disposal at a class A or B hazardous landfill (limited number nationally)
- Cost typically R 5 000–15 000 per ton dewatered cake

## Encapsulation / stabilisation-solidification (S/S)

Mix sludge with cement, fly ash, or proprietary binder. Result: monolithic block with metals locked in cement matrix. After S/S:
- Leaching tests (TCLP) fall below thresholds
- Waste reclassifies from HW01 to HW02 (lower-class)
- Disposal cost roughly halved

S/S adds 50–100 % mass + costs R 1 000–3 000/t but dramatically reduces disposal cost.

## Resource recovery

Ideal but rare. Some technologies recover the metal:

- **Ion-exchange + electrowinning** — Cu, Ni from rinse waters recovered as plating-grade metal
- **Hydrometallurgical leaching** — Cr, Zn from sludges (chemical-recycling plants in Europe)
- **Cement kiln co-processing** — sludge fed as cement raw material; metals locked in clinker

For a typical industrial plant in SA, only ion-exchange + electrowinning is locally viable, and only for high-value (Cu, Ni) operations.

## On-site waste minimisation

Better than treatment:
- **Counter-current rinse** — reduces drag-out 80–95 %
- **Closed-loop spray** — captures evaporated metal mist
- **Bath maintenance** — extend bath life 5–10× with carbon filtration, ion-exchange polish
- **Source segregation** — chrome-bearing waste separate from cyanide / acidic; can't combine

These cut metal load to the wastewater plant by 50–90 %, often saving more than the treatment plant ever could.

_Source: NEMWA classification; HASA and CMP local case-studies; Eskom mining-effluent papers._`,

  /* ════════════════════════════════════════════════════════════════
     TRACK 5 — COOLING WATER
     ════════════════════════════════════════════════════════════════ */

  /* ───── COOL-101 — Cooling Tower Fundamentals ───── */

  'c-cool-101/m1': `## How a cooling tower works

A cooling tower removes heat from a process by exposing recirculating water to ambient air. Heat transfer occurs by:

- **Sensible heat** transfer (water → air, by temperature difference) — small contribution
- **Latent heat** of evaporation — about 90 % of total cooling

Each kg of water that evaporates removes ~ 2 270 kJ from the bulk water (latent heat of vaporisation). Hot water cools, cool water gets pumped back to process.

## The two basic types

### Counterflow
Water falls vertically through the fill; air drawn upward by induced-draft fan. Most efficient — exit air is closest to entering water temperature.

### Crossflow
Water falls vertically, air flows horizontally across. Easier to maintain, less efficient. Common on smaller commercial / HVAC towers.

### Induced vs forced draft
- Induced (fan at top, pulling air through) — more common, prevents recirculation of saturated air
- Forced (fan at bottom, blowing air through) — older / smaller designs, prone to ice in cold climates

## Wet-bulb approach and range

Two key design temperatures:

- **Range** (R) = Temperature drop across tower = T_in − T_out (typically 5–15 °C)
- **Approach** (A) = Cold water temp − wet-bulb temp (typically 3–8 °C)

The lower the approach, the bigger and more expensive the tower. South African design typically targets approach = 5 °C at design wet-bulb (e.g. 22 °C → cold water 27 °C).

## Counterflow vs crossflow fill

Modern counterflow towers use either:
- **Splash fill** — slats arranged so droplets break and form film. Robust, fouling-tolerant.
- **Film fill** — corrugated PVC sheets, water flows as film. 2–3× more efficient, but can plug if water dirty.

Industrial / utility towers usually film fill; chiller plants on dirty water often splash.

_Source: Nalco Water Handbook Ch 18; Cooling Technology Institute (CTI) bulletins._`,

  'c-cool-101/m2': `## The mass balance

For every cooling tower:

  M = E + D + B

where:
- **M** = make-up water (added)
- **E** = evaporation (lost as vapour)
- **D** = drift (lost as entrained droplets in air stream)
- **B** = blowdown (intentionally wasted to control TDS)

## Numbers operators must know

### Evaporation
  E ≈ 1 % of recirculation flow per 5.5 °C of cooling range

For a tower with 1 000 m³/h recirc and 10 °C range:
  E ≈ 1 000 × (10/5.5) × 0.01 = 18 m³/h

### Drift
Modern drift eliminators: 0.001–0.005 % of recirc flow. Old towers: 0.05–0.2 %. Drift carries salts at full recirc concentration (so high-cycle operation amplifies salt loss to environment).

### Blowdown
Blowdown is the controllable variable. Set by required cycles of concentration:

  B = E / (cycles − 1)

For 5 cycles: B = 18 / 4 = 4.5 m³/h.

## Cycles of concentration (COC)

COC measures how concentrated the recirc water is relative to make-up:

  COC = TDS_recirc / TDS_makeup
       = Cl_recirc / Cl_makeup
       = Conductivity_recirc / Conductivity_makeup

Chloride is the favourite tracer (conservative, easy to measure, no scaling).

Typical operation:
- 3 cycles: very generous blowdown, low scaling risk
- 5 cycles: target for most installations
- 8+ cycles: aggressive operation, requires advanced chemistry

## Why operators stare at conductivity

Recirc conductivity is the everyday proxy for cycles. Plant has:
- Make-up: 50 mS/m
- Recirc target: 250 mS/m → 5 cycles
- Conductivity-based blowdown valve opens when recirc > 270, closes when < 230

_Source: Nalco Water Handbook Ch 18; Hadron Cooling Tower Calculator._`,

  'c-cool-101/m3': `## Higher cycles = lower water + chemicals

Doubling cycles halves blowdown, which halves:
- Make-up water consumed (assuming same evaporation)
- Chemicals consumed (proportional to blowdown)
- Effluent produced (and tariff if water is purchased)

For a 1 000 m³/h tower at 5 °C range, going from 3 to 6 cycles saves ≈ 9 m³/h of water — 78 m³/d, 28 000 m³/y.

## ... but at a chemistry price

Each doubling of cycles concentrates dissolved species 2×:
- Hardness, alkalinity, chloride, silica, sulfate all double
- LSI (Langelier Saturation Index) climbs sharply
- Bromide → ppm range, drives BrO₃ formation under chlorination
- Silica may exceed 150 mg/L → silicate scale (very hard to remove)

Practical limits:
- LSI < +2.5 with polymer + acid feed
- Total silica < 150 mg/L
- Conductivity < 4 000 µS/cm (Cu/Zn corrosion otherwise)

## LSI / RSI implications

For 50 mg/L Ca, 70 mg/L alkalinity, pH 7.5 make-up:
- 3 cycles: 150 / 210 / pH ~ 8.0 → LSI ~ +0.5 (mild scale risk)
- 5 cycles: 250 / 350 / pH ~ 8.3 → LSI ~ +1.3 (scale risk, polymer essential)
- 8 cycles: 400 / 560 / pH ~ 8.5 → LSI ~ +2.3 (acid-feed mandatory)

Use the Hadron LSI Calculator at each cycle to plot the trajectory.

## Practical economic optimum

Cost optimum sits where:
- Water tariff savings = additional chemical + acid feed + membrane / fouling cost

For most SA installations:
- Municipal water: 5–6 cycles
- Borehole make-up: 4–5 cycles
- Treated effluent reuse: 3–4 cycles

_Source: Nalco Water Handbook Ch 18; CTI water-conservation papers; Hadron LSI Calc._`,

  'c-cool-101/m4': `## A worked example using Hadron Cooling Tower calc

**Plant data:**
- Circulation rate: 1 200 m³/h
- ΔT (range): 7 °C
- Make-up conductivity: 50 mS/m
- Blowdown conductivity (current): 200 mS/m
- Drift loss factor: 0.02 %

**Run the calc:**
- Evaporation E = 1 200 × (7/5.5) × 0.01 = 15.27 m³/h
- Drift D = 1 200 × 0.0002 = 0.24 m³/h
- Cycles = 200 / 50 = 4×
- Blowdown B = E / (cycles − 1) = 15.27 / 3 = 5.09 m³/h
- Make-up M = E + D + B = 20.6 m³/h

## What if cycles climb to 6×?

- New blowdown target = 50 × 6 = 300 mS/m
- B = 15.27 / 5 = 3.05 m³/h (saves 2 m³/h vs 4×)
- M = 18.56 m³/h

Annual water saving = 2 × 24 × 365 = 17 520 m³/y. At R 25/m³, that's R 438 000/y.

## The LSI implication

Run the Hadron LSI calc on:
- 4 cycles: Ca 200 mg/L, alk 280 mg/L → LSI ~ +1.0 (manageable with phosphonate)
- 6 cycles: Ca 300 mg/L, alk 420 mg/L → LSI ~ +1.7 (needs phosphonate + acid feed)

The 6× operation makes good economic sense if the chemical programme can hold the calcium in solution. Specify acid-feed (sulfuric or hydrochloric to drop pH 0.3–0.5) plus a phosphonate antiscalant.

## Operator hand-over routine

- Read circulation flow, ΔT, make-up & blowdown conductivities
- Calculate E, B, M, cycles via Hadron Cooling Tower calc
- Compare against design / target
- Trend chemistry (hardness, alkalinity, silica) weekly
- Adjust blowdown setpoint quarterly as season changes wet-bulb

_Source: Hadron Cooling Tower Calculator; Nalco Water Handbook Ch 18._`,

  /* ───── COOL-201 — Scale, Corrosion & Biofouling Control ───── */

  'c-cool-201/m1': `## Why scale is bad

CaCO₃ scale on heat-exchanger tubes:
- 0.5 mm scale = 15–20 % loss of heat-transfer (insulating layer)
- Increases pumping head (rough surface)
- Localised under-deposit corrosion
- Hard to remove; chemical cleaning needed

Three scaling species dominate cooling water:

### CaCO₃ (calcium carbonate)
The classic scale. Forms from saturated Ca + alkalinity at warm temperatures. Predicted by LSI.

### CaSO₄ (calcium sulfate)
Solubility 2 000 mg/L; forms when high-Ca + sulfate together. Less common but harder to remove than CaCO₃.

### Silica (SiO₂, MgSiO₃)
Forms above 150 mg/L. Glass-hard, almost impossible to chemically clean. Requires alkaline cleaning at high temperature.

### Calcium phosphate (Ca₃(PO₄)₂)
Forms from phosphate-based programmes if Ca × PO₄ × pH product exceeds threshold. Avoidable by programme balance.

## The four indices

- **LSI** (Langelier) — the standard, fresh water TDS < 500 mg/L
- **RSI** (Ryznar) — gives stability category from corrosive to scaling
- **PSI** (Puckorius) — empirical, for cooling water specifically (corrects for high-cycle effects)
- **S&DSI** (Stiff-Davis) — for high-TDS waters (> 4 000 mg/L)

Use the Hadron LSI calc which computes all four.

## Threshold inhibitors

Phosphonates and polymers _suspend_ super-saturated species rather than letting them crystallise:

- **HEDP** (1-hydroxyethylidene-1,1-diphosphonic acid) — broad-spectrum, low cost
- **PBTC** (phosphonobutane tricarboxylic acid) — chlorine-stable, high-temperature stability
- **AA-AMPS** (acrylic acid–acrylamido sulfonic acid copolymer) — silica scale specialist

Typical dose 5–15 mg/L active in tower water.

## Dispersants for silt and iron

Polymeric dispersants prevent agglomerated particulates depositing:
- Polyacrylate (low MW, anionic) for sludge dispersion
- Sulfonate copolymers for ferric / iron oxide
- 5–20 mg/L typical

_Source: Nalco Water Handbook Ch 18; AWT Technical Reference; Hadron LSI Calc._`,

  'c-cool-201/m2': `## Three different problems

Most cooling systems have three different metals — mild steel (heat exchanger shells, piping), copper alloys (HX tubes), galvanised steel (cooling tower fill). Each corrodes by a different mechanism:

### Mild steel
General + localised corrosion. Drivers: dissolved O₂, Cl⁻, SO₄, low pH, low alkalinity. Symptom: red rust on suction strainers; thin, sometimes pitted, surface.

### Copper alloys (admiralty brass, 90/10 Cu/Ni)
Selective leaching (dezincification of brass), MIC, pitting under deposits. Drivers: free Cl₂ > 0.5 mg/L, NH₃, polysulfide. Symptom: green / blue corrosion product, pinhole leaks.

### Galvanised steel (zinc on steel)
Sacrificial protection until zinc consumed. Drivers: low pH, soft water, high TDS. Symptom: white-rust streaks on tower fill.

## Inhibitor types

### Anodic inhibitors
Form passive film at the anode (where iron dissolves). Examples: nitrite, molybdate, orthophosphate, silicate.

Risk: under-dose creates _localised_ corrosion (pitting) rather than uniform — worse than no inhibitor at all.

### Cathodic inhibitors
Form barrier film at the cathode (where O₂ + e⁻ → OH⁻). Examples: zinc, calcium phosphate, polyphosphate.

Lower risk of localised attack; usually combined with anodic for best protection.

### Mixed inhibitors
Most modern programmes:
- **Phosphate-zinc** (anodic + cathodic) — broad-spectrum, classic
- **All-organic** (polymer + phosphonate + tolyltriazole) — phosphate-free, environmentally friendlier
- **Molybdate-based** — nitrite-zinc replacement; higher cost but excellent for soft water

## Tolyltriazole for copper

Tolyltriazole (TTZ) and benzotriazole (BTZ) form chemisorbed films on Cu/Cu-alloy surfaces. Dose 1–3 mg/L active. Not optional in any system with Cu.

## Programme verification

Mild-steel and copper coupons exposed in side-stream rack for 30–90 days. Mass-loss measurement → corrosion rate (mils per year, mpy):

- < 2 mpy = excellent
- 2–5 mpy = acceptable
- > 5 mpy = unacceptable, programme review

_Source: Nalco Water Handbook Ch 18; NACE corrosion handbook; Hadron Service Reports._`,

  'c-cool-201/m3': `## What lives in cooling water

Open recirculating cooling water at 30–45 °C is a perfect bioreactor. Common organisms:

- **Algae** (Chlorella, Cladophora) — green slime on tower fill, sunlit surfaces
- **Bacteria** (heterotrophs, _Pseudomonas_, _Sphaerotilus_) — slime / biofilm on heat exchanger tubes
- **Sulfate-reducing bacteria** (_Desulfovibrio_) — anaerobic in deposit underside; produce H₂S, drive MIC
- **Iron-oxidising bacteria** (_Gallionella_) — orange tubercles, MIC of mild steel
- **Legionella pneumophila** — health risk; aerosol infectious dose < 100 cfu

Biofilm is dramatically harder to inactivate than planktonic cells (1 000× the chlorine dose for same kill).

## Oxidising biocides

- **Free chlorine** — cheap, effective, residual control, depleted by NOM. Maintain 0.5–1 mg/L free.
- **Bromine** (NaBr + Cl₂ → HOBr) — works at higher pH (HOBr pKa = 8.7 vs HOCl 7.5)
- **Chlorine dioxide** — strong, no THM formation, biofilm penetration. ~ 0.2 mg/L target.
- **Stabilised oxidants** (BCDMH, DBDMH tablets) — slow-release, automated.

## Non-oxidising biocides

For periodic shock or where oxidising biocide ineffective:

- **Isothiazolone** (Kathon) — 2–10 mg/L, broad-spectrum
- **Glutaraldehyde** — 25–100 mg/L, fast-acting on planktonic
- **DBNPA** (2,2-dibromo-3-nitrilopropionamide) — fast kill, short half-life (hours)
- **THPS** (tetrakis hydroxymethyl phosphonium sulfate) — selective for SRB, biofilm-active

## Legionella risk

Cooling towers must be assessed under OHS Act / SANS 893:
- Routine HPC < 10 000 cfu/mL
- Legionella < 1 000 cfu/L
- Quarterly verification

Risk-mitigation programme:
- Drift eliminators in good condition
- Free residual maintained 0.5+ mg/L
- Periodic shock chlorination (5–10 mg/L for 4 h)
- Tower cleaning annually + after extended shutdown

## Dispersants and clean-out

Biofilm shielded by EPS (extracellular polymeric matrix). Surfactants and polymeric dispersants help biocides reach the cells. Clean-out hits — high-dose biocide + dispersant + acid clean — once or twice per year.

_Source: Nalco Water Handbook Ch 18; HSE L8 ACoP — Legionella; SANS 893; AWT Technical Reference._`,

  'c-cool-201/m4': `## The daily / weekly / monthly cadence

### Daily
- Visual: fill condition, water clarity, foam, scum
- Conductivity (proxy for cycles)
- pH
- Free chlorine residual at distribution point

### Weekly
- Hardness, alkalinity (jar titrations)
- Total iron / manganese (post-corrosion proxy)
- Inhibitor residual (chemical-specific test kit or fluorescent tracer)

### Monthly
- Full water analysis (Cl⁻, SO₄, SiO₂, total Fe, total Mn)
- Corrosion coupon mass-loss read
- HPC + Legionella sample

### Quarterly
- Heat-exchanger inspection (deposit weight)
- Programme review with chemistry supplier

## Conductivity-based blowdown

The standard control loop:
- Probe in basin or pumped sample line
- PLC / controller compares to setpoint
- Solenoid / motorised blowdown valve opens / closes

Setpoint = makeup_conductivity × target_cycles. Allow ±5 % deadband.

## ORP-based biocide control

Oxidation-Reduction Potential (mV) tracks free oxidant residual. Target 600–700 mV ORP for adequate biocide. Below 500 → dose more; above 750 → reduce.

ORP probe needs cleaning monthly (deposit forms on platinum tip).

## Inhibitor residual via fluorescent tracer

Modern programmes contain a fluorescent tracer (e.g. PTSA, sulfonated naphthol) at ratio matching the active:

- Trace fluorescence with online sensor
- Calculates residual inhibitor in real-time
- Auto-trims pump dose

This is a step-change in control vs traditional weekly residual testing — keeps residual at setpoint despite swings in load and blowdown.

## Audit-ready records

Every test result, every dose change, every cleaning event logged in LIMS / Service Report. Cooling-water records are often the first thing an auditor asks for in a Legionella outbreak investigation.

_Source: Nalco Water Handbook Ch 18; Hadron Service Report; Hadron Calibration module._`,

  /* ───── COOL-301 — Optimisation & Cycle Management ───── */

  'c-cool-301/m1': `## How far can you push cycles?

Limits set by chemistry of make-up water + chemistry of programme:

### CaCO₃ scaling
Most common limit. Cycle limit set by LSI < +2.5 (polymer-supported) or +1.5 (no polymer).

### Silica
SiO₂ ceiling 150 mg/L (some chemistry to 180). For makeup with 30 mg/L silica, max cycles = 5.

### Chloride
> 1 500 mg/L promotes pitting of stainless steel and Cu alloys. Limit: cycles such that recirc Cl⁻ < 1 500.

### Calcium × sulfate
Ca × SO₄ < 500 000 (mg/L)² — calcium sulfate solubility limit.

### Conductivity
> 4 000–5 000 µS/cm risks corrosion of Cu, Zn, galvanised. Above 5 000, condenser tube life shortens noticeably.

## Acid feed for cycle bump

Adding acid (typically H₂SO₄ 32 % or HCl) lowers alkalinity, drops pH, shifts CO₂ equilibrium, allows higher Ca × HCO₃ before LSI exceeded.

Dose: typically 2–10 mg/L acid (as 100 %), driven by pH controller. For each 0.1 unit pH drop, LSI drops 0.1.

But acid feed has risks:
- Localised low-pH spots = corrosion
- Pump failure → pH crashes → severe corrosion
- Operator must understand the chemistry and the alarm response

## Polymer support

Phosphonate + polyacrylate dose at 10–20 mg/L active raises the scaling threshold by 1–2 LSI units. Programmes are typically priced at 80–150 mg/L active total dose.

## When you've gone too far

Symptoms of cycle-overshoot:
- White scale crust on tower fill
- Increasing condenser approach temperature (insulation)
- Pump head climbing (deposits)
- Drop in inhibitor residual at constant feed (over-saturation precipitates inhibitor too)

Pull back 10 % cycles, watch for recovery.

_Source: Nalco Water Handbook Ch 18; Hadron LSI Calc; AWT Technical Reference._`,

  'c-cool-301/m2': `## Why filter the recirc

Cooling water picks up:
- Air-borne dust through fan stack
- Deposits sloughing off heat exchangers
- Sand / silt entering from process leaks
- Biological debris from periodic shock biocide

Without filtration, this material settles in dead zones, breeds biofilm, fouls heat exchangers. Side-stream filtration treats 5–10 % of recirc continuously.

## Hydrocyclone

For coarse grit (> 50 µm, density > 1.5 g/cm³):
- No moving parts, low capital
- High pressure drop (4–6 bar)
- Continuous reject stream (~2 % of treated flow)

Cheap and effective for low solids loading.

## Multimedia filter

Same as drinking-water multimedia (anthracite + sand):
- Effective on 5–50 µm particles
- Backwash every 2–4 days
- Higher capital, lower operating pressure
- Removes biological + scale + grit

## Disposable cartridge

For polish (after multimedia or for trace particle):
- 1–10 µm cartridges
- Replace when ΔP > 1 bar
- Used after major cleaning event

## Cyclic operation

Side-stream filtration runs continuously, returning filtered water to basin or to specific HX zones. Backwash to drain (and out as part of blowdown), or in some installations to a recovery tank for solids dewatering.

## Sizing rules-of-thumb

Side-stream flow as % of recirculation:
- Low solids load (clean make-up, indoor system): 2–3 %
- Standard industrial: 5 %
- High solids load (open / dusty / biological): 10 %

For 1 200 m³/h recirc + 5 %, side-stream = 60 m³/h. A 60 m³/h multimedia filter sized at 15 m/h = 4 m² area, single vessel.

_Source: Nalco Water Handbook Ch 18; CTI bulletins on side-stream._`,

  'c-cool-301/m3': `## When is it good enough

Cooling tower blowdown can sometimes feed:
- Another (lower-quality) cooling tower
- A makeup-water RO system
- Dust suppression / irrigation
- A boiler feed pretreatment (rare)

Quality screen — blowdown is acceptable if:
- TDS < 5 000 mg/L
- Hardness manageable for downstream RO antiscalant
- No biocide residual that would damage RO membranes
- COD low (no oily / organic carry-over)

## Pre-treatment for second pass

If blowdown feeds RO:
- De-chlorinate (SBS or GAC) to remove residual oxidant
- Antiscalant for the new chemistry
- Check biocide compatibility (some membrane-friendly biocides exist)

## Operator practice

- Auto-divert valve based on conductivity / chemistry
- Storage tank between primary and secondary use to buffer batch chemistry
- Monthly verification analysis at the secondary use point
- Loop check — blowdown reuse should not loop back into the make-up sample without isolation

## Economic case

Typical SA municipal water cost R 25–35/m³. RO permeate from blowdown costs R 8–15/m³. For a facility producing 5 m³/h blowdown × 8 000 h, that's 40 000 m³/y × R 20 = R 800 000/y saving.

But operating complexity rises — three water-chemistry programmes to manage instead of one. Worth it only at scale.

## A real-world example

Rand Water's Roodeplaat Plant operates a hybrid: cooling-tower blowdown polishes through softening + RO, providing make-up to a second tower at half the cost of fresh water. CapEx paid back in 3 years; ongoing OpEx ~ 60 % of fresh-water alternative.

_Source: Nalco Water Handbook — Reuse chapter; Hadron Sustainability projects._`,

  'c-cool-301/m4': `## A repeatable annual audit

Once a year, formal audit of the chemical programme:

### Cost dimension
- Total chemistry cost / m³ make-up
- Total cost per cooled MJ (kg fuel / unit refrigeration)
- Compare cost to industry benchmark

### Performance dimension
- Corrosion rate (coupons): mild steel mpy, copper mpy
- Heat-transfer KPI (approach trending up?)
- Microbiology: HPC, Legionella, ATP rapid test
- Scale inspection (visual + scrape sample to lab)

### Compliance dimension
- HSE / OHS records up to date
- Legionella monitoring per SANS 893
- Effluent permit for blowdown
- Chemical SDS on file + accessible

### Operational dimension
- Daily / weekly / monthly logs complete
- Calibration records on instruments
- Operator training records
- Service reports from chemical supplier

## Output

The audit produces a 3-page report:

1. Findings (good + bad) — with photos, data
2. Recommendations — prioritised by impact + cost
3. Action plan — owners, dates, KPIs

## Continuous improvement KPIs

Track quarter-on-quarter:
- Cycles operated (higher is better, until something fails)
- Mild-steel corrosion rate (lower)
- Chemical cost per m³ recirc (lower, while corrosion holds)
- HPC trend (stable low)

If KPIs all improve simultaneously, you have a great programme. If one improves at the cost of another, programme is being mis-pushed.

## When to switch chemistry suppliers

Red flags: corrosion rate creeping up, biofouling cleaning interval shortening, condenser approach climbing, daily-test complaint queue from the operator. Re-tender; modern chemistry has come a long way and old programmes (old polyphosphate-zinc, no fluorescent tracer) are well past their prime.

_Source: Nalco Water Handbook Ch 18; AWT — Cooling Water Audit Standard._`,

  /* ════════════════════════════════════════════════════════════════
     TRACK 6 — BOILER WATER
     ════════════════════════════════════════════════════════════════ */

  /* ───── BOIL-101 — Boiler Water Chemistry ───── */

  'c-boil-101/m1': `## The four water-side enemies

A steam boiler runs at high temperature, high pressure, with constant evaporation that concentrates whatever is in the feedwater. Four damage mechanisms dominate:

### Hardness scale
Ca²⁺ + Mg²⁺ entering with feedwater concentrate in boiler water and precipitate as CaCO₃, CaSO₄, MgSiO₃ on the hot tube side. 1 mm of scale can raise tube metal temperature 50–100 °C → tube failure. Hardness in feedwater must approach zero.

### Dissolved oxygen
Causes pitting. Even 50 ppb O₂ causes localised pinhole failures over months. Mechanical deaeration + chemical scavenger required.

### Silica
Volatile under high-pressure boiler conditions, carries over with steam, deposits on superheater + turbine blades. Silica limits drop with pressure: ≤ 20 mg/L at 20 bar, ≤ 0.5 mg/L at 100 bar.

### Organics
Foam, carry-over of liquid into steam, and decomposition products in superheaters. Modern feedwater specs limit TOC to single ppm.

## Why hardness must approach zero

In a 100 t/h boiler operating 24 × 365 = 800 000 t/y water evaporated. If feedwater carries even 5 mg/L hardness:

  800 000 × 5 = 4 000 kg hardness deposited per year

That's 4 t of scale per boiler. Either the softener / demin must deliver < 0.5 mg/L hardness, or the chemical programme must hold what gets through in suspension.

## Carry-over

Volatile species (silica, ammonia, organic acids) and entrained droplets cross from boiler water into steam. Steam should be analysed for:
- Silica < spec (depends on pressure)
- Sodium (cation conductivity surrogate)
- Conductivity (carry-over indicator)

_Source: ABMA Recommended Boiler Water Limits; ASME Consensus on Boiler Water Quality; Nalco Water Handbook Ch 11–13._`,

  'c-boil-101/m2': `## Pressure tiers

Limits for boiler water tighten dramatically with pressure. ABMA / ASME guidelines simplified:

### Low-pressure (< 20 bar / 300 psig)

| Parameter | Limit |
|---|---|
| Total alkalinity | 350–700 mg/L CaCO₃ |
| OH alkalinity | 100–500 |
| TDS | ≤ 3 500 |
| Silica | ≤ 150 |
| Iron | ≤ 0.1 |
| Hardness | < 1 |

Forgiving regime — 90 % of industrial process boilers.

### Medium-pressure (20–40 bar / 300–600 psig)

| Parameter | Limit |
|---|---|
| Total alkalinity | 250–500 |
| TDS | ≤ 2 500 |
| Silica | ≤ 90 |
| Iron | ≤ 0.05 |
| Hardness | < 0.5 |

Tighter feedwater spec, demin or RO-prepared make-up.

### High-pressure (> 40 bar / 600 psig)

| Parameter | Limit |
|---|---|
| Total alkalinity | < 50 |
| TDS | ≤ 250 |
| Silica | ≤ 0.5 |
| Iron | ≤ 0.02 |
| Hardness | < 0.05 |

Polished water (mixed-bed demin), all-volatile chemistry, oxygen scavenger ppb dose.

### Supercritical (> 220 bar)

Polishing demin + condensate polish + AVT (all-volatile treatment). Power-plant operators only.

## pH targets

- Low pressure: 10.5–11.5 (alkaline phosphate-pH curve)
- Medium pressure: 9.5–10.5
- High pressure: 9.0–9.5 (AVT)
- Cu-bearing alloy systems: 8.8–9.2 to protect copper

## Why higher pressure is unforgiving

At higher pressure / temperature:
- Solubility limits drop sharply (silica)
- Volatility increases (silica, NH₃)
- Tube heat flux rises (deposit insulation matters more)
- Cleaning and inspection windows shrink (downtime is enormous cost)

_Source: ABMA Recommended Limits; Nalco Water Handbook Ch 12._`,

  'c-boil-101/m3': `## Why sample handling is a high bar

Boiler water is hot (up to 350 °C in HP boilers) and highly alkaline. Sample lines must:

- Cool to < 25 °C before reaching analyser (heat exchanger required)
- Not flash-evaporate (pressure-reduce slowly)
- Use proper materials (316L SS, no copper / brass)

A bad sample (flash-evaporated, hot, contaminated) gives values that may be 50 % wrong.

## The cooled-sample station

A dedicated cooler for boiler-water sampling:

- 1/4" or 3/8" tubing from sample tap
- Stainless-steel tube-in-shell heat exchanger (cooling water on shell side)
- Pressure-reducing orifice or back-pressure regulator
- Continuous flow ~ 500 mL/min
- Sample taken at the cooled outlet

## What to test

- pH (cooled sample, glass electrode)
- Conductivity (specific + cation conductivity)
- Total alkalinity (M / P, by titration)
- Hardness (EDTA titration)
- Silica (molybdate-blue colorimetric)
- Phosphate residual (programme-dependent)
- Iron (where corrosion concern)

## Cation conductivity

Cooled sample passed through a cation-exchange column converts all dissolved salts to their acid form. Measured conductivity then reflects total anion content (Cl⁻, SO₄, NO₃, organic acids) — sensitive way to detect carry-over from condenser leak or organic contamination.

Target < 0.2 µS/cm in HP boiler systems. Climbing trend = leak.

## Storage and hold times

Boiler-water samples for off-line lab analysis:
- Glass or HDPE bottles (no metal)
- Cooled to < 5 °C
- Hold time ≤ 24 h for pH / alkalinity
- ≤ 7 d for chloride / sulfate / silica
- Silica preserves better acidified, but other parameters change at low pH

_Source: ASME Guide to Steam Sampling; Nalco Water Handbook Ch 11._`,

  /* ───── BOIL-201 — Pretreatment, Internal Treatment & Steam ───── */

  'c-boil-201/m1': `## The pretreatment ladder

Feedwater quality determines internal treatment requirement. Climb the ladder until quality matches boiler pressure tier:

### Softener (Na-form ion-exchange)
Removes Ca + Mg, swaps for Na. Capacity 60–120 g hardness / L resin per regen. Regenerated with NaCl brine. Effluent hardness < 1 mg/L.

Use when: low-pressure boiler (< 20 bar), abundant brine disposal, raw water hardness < 500 mg/L.

### Dealkaliser (chloride-form ion-exchange)
Removes HCO₃⁻, swaps for Cl⁻. Used after softener. Drops alkalinity (and CO₂ in steam → condensate corrosion).

Use when: medium-pressure boiler with high-alkalinity feedwater; high condensate return rate where CO₂ is a corrosion driver.

### Demineraliser (cation + anion + mixed bed)
Removes everything ionic. Strong-acid cation in H-form + strong-base anion in OH-form. Mixed bed polish to 1–10 µS/cm conductivity.

Use when: HP boiler (> 40 bar), TDS specification < 250 mg/L feedwater.

### RO + EDI (electrodeionisation)
Modern alternative to demin. RO removes 98–99 % of TDS; EDI polishes to < 1 µS/cm continuously without chemical regen.

Use when: HP / supercritical boiler; low waste-stream tolerance; lower OpEx than demin over life.

## The feedwater spec

Three tiers commonly specified:

- **Softened**: hardness < 1, alkalinity unchanged
- **Demin**: conductivity < 5 µS/cm (specific), < 0.2 µS/cm (cation conductivity)
- **Polished demin**: < 0.1 µS/cm (cation conductivity)

A new boiler installation should match feedwater treatment to the boiler pressure with one tier of headroom — saves grief in 5 years when chemistry creeps.

_Source: Nalco Water Handbook Ch 11–13; Hadron RO Performance calc._`,

  'c-boil-201/m2': `## The internal-treatment programmes

Internal treatment (chemicals dosed _into_ the boiler / feedwater) controls residual hardness, alkalinity, dispersion, and corrosion:

### Phosphate-pH (coordinated phosphate)
Classic LP / MP programme:
- Trisodium phosphate (Na₃PO₄) + sodium hydroxide doses
- pH-PO₄ curve held within an envelope (avoids both caustic gouging and acidic conditions)
- Phosphate reacts with residual hardness → calcium phosphate sludge → suspended → blowdown

Operating range: pH 10.5–11.2, PO₄ 30–60 mg/L.

### All-volatile treatment (AVT)
HP and supercritical:
- Only volatile species (NH₃ for pH, hydrazine / DEHA for O₂)
- No solids in boiler water → no carry-over of solids in steam
- Demands polished water (no hardness, near-zero TDS)

### Polymer / chelant (low-pressure, alternative)
- Polymeric dispersant + chelant (EDTA, NTA, polyacrylate)
- No phosphate → simpler chemistry
- Operating cost slightly higher
- Used where phosphate scaling has been a recurring problem

## Coordinated phosphate envelope

Plot PO₄ vs pH; the operating envelope is bounded:

- Above by Na/PO₄ ratio < 3 (avoids free caustic)
- Below by Na/PO₄ ratio > 2.6 (avoids acid phosphate)

Operating outside the envelope = caustic gouging (above) or acidic phosphate attack (below). Both eat tubes.

## AVT(R) vs AVT(O)

- AVT(R) — reducing AVT, with hydrazine or DEHA scavenger. Standard for steam-only boilers.
- AVT(O) — oxidising AVT, with low-level dissolved oxygen (5–20 ppb) for ferritic-steel passivation. Used in supercritical units.

## Polymer dispersants

Even in phosphate-pH systems, a polyacrylate or sulfonated copolymer at 5–15 mg/L holds suspended scale-precipitate in dispersion until blowdown carries it out. Without the polymer, scale falls onto the tube surface.

_Source: Nalco Water Handbook Ch 12; EPRI feedwater chemistry guidelines._`,

  'c-boil-201/m3': `## Mechanical removal first

Dissolved oxygen comes in with feedwater. Two-stage removal:

### Tray deaerator
Vertical column with stack of trays. Steam injected at base, feedwater cascades over trays. Steam strips O₂ + CO₂ out of water. Vent at top releases gas.

Performance: O₂ < 7 ppb, CO₂ < 1 ppm in deaerated water.

Sizing: HRT 10–15 min in storage compartment below trays. Steam consumption 1–2 % of feedwater flow.

### Spray deaerator
Vertical column with spray nozzles. Water atomised, contacts steam. More compact than tray, slightly less efficient.

Performance: O₂ < 15 ppb.

## Chemical scavenger (the mop-up)

After mechanical deaeration, residual O₂ is reduced chemically:

### Sulfite (Na₂SO₃)
- Reaction: 2 Na₂SO₃ + O₂ → 2 Na₂SO₄
- Stoichiometric: 7.9 g sulfite per g O₂
- Practical dose: 30–60 mg/L SO₃ in deaerator
- Cheap, fast-acting at hot temperatures
- Limit: produces TDS (sulfate) — restricted in HP boilers
- Catalysed by cobalt for faster kinetics

### Hydrazine (N₂H₄)
- Reaction: N₂H₄ + O₂ → 2 H₂O + N₂
- Stoichiometric: 1 g per g O₂
- Volatile (carries to steam), no TDS contribution
- Toxicity / carcinogen — being phased out
- Still used in HP boilers in some regions

### DEHA (diethylhydroxylamine)
- Reaction: similar to hydrazine
- Lower toxicity than hydrazine
- Volatile, helps condensate corrosion (acts as filming agent precursor)
- Common modern replacement

### Carbohydrazide
- Volatile, hydrazine-like reactivity, lower toxicity
- Used in HP / supercritical AVT programmes

## Residual O₂ targets

- Low pressure: < 50 ppb
- Medium pressure: < 20 ppb
- High pressure: < 7 ppb
- Supercritical: < 5 ppb

## ORP-based scavenger control

Modern HP plants use ORP probes on deaerator outlet for closed-loop scavenger control. Target ORP −300 to −400 mV (reducing). Below = over-fed; above = under-fed.

_Source: Nalco Water Handbook Ch 13; ASME Consensus on Boiler Water Quality._`,

  'c-boil-201/m4': `## Volatile vs non-volatile alkalinity

Boiler water alkalinity comes from two sources:

- **Non-volatile** — Na₂CO₃, NaOH, Na₃PO₄. Stays in boiler. Builds via concentration cycles.
- **Volatile** — NH₃, amines. Vaporises with steam, distributes to condensate.

The condensate system needs volatile alkalinity for pH protection; the boiler water is fine on non-volatile.

## Neutralising amines

Volatile amines that protect condensate from CO₂-driven corrosion. CO₂ + H₂O → H₂CO₃ → drops condensate pH to 5.5 → eats steel pipes.

Amines neutralise H₂CO₃:
  R-NH₂ + H₂CO₃ → R-NH₃⁺ + HCO₃⁻

### Common amines
| Amine | DR (distribution ratio) | Use |
|---|---|---|
| Ammonia | 5–10 | HP, no Cu in system |
| Cyclohexylamine | 4 | LP-MP, broad coverage |
| Morpholine | 0.4 | Concentrates near deaerator (head-end protection) |
| DEAE | 1.7 | Mid-range condensate protection |

The DR (distribution ratio) determines how the amine partitions between steam and condensate. Multi-amine blends (high DR + low DR) protect both head-end and far-end of condensate system.

## Filming amines

For aggressive conditions or where neutralising amines insufficient:

- Octadecylamine (ODA) — long-chain alkylamine
- Forms hydrophobic film on metal surface
- Physical barrier to water + CO₂ + O₂
- Dose 0.5–2 mg/L
- Used in cyclic / load-following plants where neutralising amine alone insufficient

## Setting amine dose

- Measure condensate pH at multiple points (head, mid, far)
- Target pH 8.5–9.0 across all points
- Mismatched pH (head 9.5, far 7.0) → wrong amine blend
- Adjust by switching the high-DR / low-DR ratio

## Condensate return

Returning condensate halves make-up water demand and dramatically reduces chemical cost. But:
- Risk of contamination from process leak
- Conductivity / cation-conductivity monitoring on returned condensate essential
- Auto-divert to drain when conductivity exceeds setpoint

_Source: Nalco Water Handbook Ch 13–14; Drew — Steam System Operations._`,

  /* ───── BOIL-301 — Layup, Cleaning & Failure Analysis ───── */

  'c-boil-301/m1': `## Layup philosophy

Whenever a boiler is offline > 24 h, water-side corrosion accelerates dramatically. Air contact + residual water + hot metal = pitting + stress-corrosion cracking. A poor 6-month layup can erase 5 years of careful operation.

## Wet layup

For short-term offline (days to ~ 3 months) or where the boiler will return to service quickly:

- Drain to ½ level, then refill with treated water + scavenger
- Maintain pH 9.5–10.5 with NaOH or amine
- Maintain reducing conditions (sulfite 200 mg/L or hydrazine 50 mg/L)
- Periodic recirc (weekly)
- N₂ blanket (1–2 psig) over the water surface to exclude O₂

## Dry layup

For extended offline (> 3 months) or where freeze risk:

- Drain completely, dry mechanically (warm air, fans)
- Maintain dryness with desiccant (silica gel) trays
- Cap all openings + N₂ purge
- Inspection windows once per quarter

## Long-term storage

For new boilers awaiting commissioning, or extended-shutdown plants:

- Combination: drain, dry, N₂ blanket, monthly inspection
- Surface-treated with vapour-phase corrosion inhibitor (VCI) for steel parts
- Documented procedure with chain of custody

## Re-commissioning

After layup:
- Pre-fill flush (chemistry verification)
- Hot pressure test
- Confirm scavenger residual
- Steam-blow re-checked for cleanliness
- All instruments re-calibrated

A 24-hour layup→re-commission protocol is documented in the plant operating manual; deviation requires manager sign-off.

_Source: Nalco Water Handbook Ch 12; ASME PTC 39 — Steam Generator Layup._`,

  'c-boil-301/m2': `## When to clean

Triggers for an off-line cleaning:

- Deposit weight density (DWD) > 30 g/m² (HP) or > 60 g/m² (LP) → clean before tube failure
- Heat-flux loss > 5 % → economic case for cleaning
- Tube failure → forced cleaning + RCA
- Approaching scheduled outage → opportunistic clean

## Inhibited acid clean

For CaCO₃ / Fe oxide deposits:

### Inhibited HCl
- 5–10 % HCl with corrosion inhibitor (typically aromatic amine + sulfur)
- 65–80 °C
- 4–8 h circulation
- Followed by neutralisation rinse + passivation

### Inhibited formic / citric
- For HP boilers where Cl⁻ is forbidden (stress-corrosion cracking risk)
- Lower acid strength, longer contact time
- More environmentally manageable waste

## Chelant clean

For hardness scale + iron oxide:
- Na₄EDTA at pH 8.5–10
- 90–100 °C
- 6–12 h circulation
- Excellent for Cu / Cu-alloy systems (acid attacks Cu)

## Alkaline boilout (new boiler / heavy oil deposits)

- 2–5 % NaOH + dispersant + surfactant
- 90–100 °C
- 8–24 h
- Removes hydrocarbon residues from manufacturing oils, mill scale conditioning

## Passivation

After acid / chelant clean, surface is highly active and oxidises rapidly:
- Na₂CO₃ + Na₂SO₃ at pH 9.5–10
- Forms protective magnetite layer
- 2–4 h hot circulation
- Critical step — skip and surface re-rusts within hours

## Safety

Acid cleanings are extremely hazardous:
- Hydrogen evolution → explosion risk
- Hot acid spray
- Dissolved metals in waste (Fe, Cu, Zn, sometimes Ni / Cr)
- Specialist contractor strongly recommended
- Plant emergency plan reviewed and rehearsed before start

_Source: Nalco Water Handbook Ch 12; NACE / ASME RP-0590 — Boiler Cleaning._`,

  'c-boil-301/m3': `## DWD — deposit weight density

Standard inspection metric. Cut a section of tube, weigh deposits per unit area:

- < 15 g/m² — clean
- 15–30 g/m² — light deposits
- 30–60 g/m² — moderate, schedule cleaning
- > 60 g/m² — heavy, immediate cleaning + tube damage check

DWD measurements at multiple locations (steam-drum, mud-drum, water-tube headers) reveal deposit pattern.

## Caustic gouging

Excess free hydroxide attacks ferritic steel under deposits. Symptoms:
- Local thinning under deposit
- "Caustic well" — hemispherical pit
- Operating boiler outside the phosphate-pH envelope (Na/PO₄ > 3)

Prevention: hold Na/PO₄ ratio < 3, avoid dosing pure NaOH, control coordinated phosphate.

## Hydrogen damage

Corrosion under deposits releases atomic H, which diffuses into steel. Steel becomes brittle, cracks at boiler pressure.

Symptoms:
- Sudden tube rupture without prior thinning
- "Window-tube" failure (clean break)
- Often associated with prior caustic gouging

Prevention: clean to remove deposits (so water-side corrosion stops), fix root cause of high deposit rate.

## Fatigue (mechanical)

Cyclic stress from start-stop, rapid load swings, scale-induced thermal cycling. Failures show ductile fracture features, often at expansions / supports.

Prevention: avoid rapid temperature swings; rationalise startup ramp rate.

## Steam-side oxide

On the steam side of HP / supercritical boilers, surface forms a thick oxide (Fe₃O₄) layer. As it grows it spalls, blocks tube outlets, and produces:
- Uneven heat flux
- "Tube-bulge" failures
- Chemical cleaning required

## A failure-analysis routine

1. Photograph failure in situ
2. Sample failed tube section
3. Metallographic exam (cross-section, microstructure)
4. EDS / XRD of deposits
5. Chemistry record review (last 6 months)
6. Operations record review (start-stops, off-spec excursions)
7. Root cause + corrective action
8. Re-inspect adjacent tubes for similar damage

A complete failure-analysis report is what insurance + regulator demand after a major incident.

_Source: NACE Corrosion Handbook; EPRI Boiler Failure Studies; ASME Section VII._`,

  /* ════════════════════════════════════════════════════════════════
     TRACK 7 — REVERSE OSMOSIS & MEMBRANES
     ════════════════════════════════════════════════════════════════ */

  /* ───── RO-101 — Membrane Fundamentals ───── */

  'c-ro-101/m1': `## The size-exclusion ladder

Membrane processes separate by size, from microns down to single ions:

| Process | Pore size | Removes | Driving pressure |
|---|---|---|---|
| Microfiltration (MF) | 0.05–10 µm | Bacteria, particulates | 0.5–2 bar |
| Ultrafiltration (UF) | 0.001–0.05 µm | Viruses, macromolecules | 1–4 bar |
| Nanofiltration (NF) | 0.0001–0.005 µm | Hardness, NOM, divalent ions | 5–15 bar |
| Reverse osmosis (RO) | < 0.0001 µm | Monovalent ions | 10–80 bar |

Each step demands more pressure, more pretreatment, and rejects smaller particles.

## What MF / UF removes

- MF: 6-log removal of bacteria, 2-log virus
- UF: 6-log virus, 4-log Cryptosporidium
- Used as a barrier in drinking water, ahead of RO, or for tertiary wastewater polishing

## What NF removes

- 70–90 % rejection of divalent ions (Ca, Mg, SO₄)
- 30–60 % rejection of monovalent ions (Na, Cl)
- 90 %+ rejection of NOM
- Used for water softening, NOM removal, partial desalination

## What RO removes

- 99 % rejection of all ionic species
- 99.9 % rejection of organics > 100 Da
- Standard for desalination, ultrapure water, water reuse

## Membrane materials

- **Cellulose acetate (CA)** — chlorine-tolerant (1 mg/L OK), hydrolyses outside pH 4–7, lower rejection
- **Polyamide thin-film composite (TFC)** — high rejection (99.5 %+), broader pH range, but chlorine-intolerant (must dechlorinate)

Modern systems are 99 % polyamide.

_Source: AWWA M46 — Reverse Osmosis and Nanofiltration; Hydranautics Engineering Manual._`,

  'c-ro-101/m2': `## Osmotic pressure

Osmosis is the natural flow of water through a semi-permeable membrane from low to high solute concentration. The pressure required to stop that flow is the **osmotic pressure**:

  π ≈ 0.7 bar per 1 000 mg/L NaCl  (at 25 °C)

So a feedwater of 35 000 mg/L (seawater) has osmotic pressure ≈ 25 bar. To force water _backward_ (from high TDS to low), you need pressure exceeding the osmotic pressure.

## Net driving pressure (NDP)

The actual force pushing water through the membrane:

  NDP = (P_feed − ΔP_membrane − P_permeate) − (π_feed − π_permeate)

Typical operation:
- Brackish water RO: 15–25 bar NDP
- Seawater RO: 50–70 bar NDP
- Wastewater reuse: 15–20 bar NDP

## Recovery vs rejection

Two key performance metrics:

### Recovery (R)
  R = Q_permeate / Q_feed × 100 %

Typical: 75 % for brackish, 35–50 % for seawater.

### Rejection (Ro)
  Ro = (1 − C_permeate / C_feed) × 100 %

For NaCl on a TFC membrane: 99.5 %.

## Why high recovery is hard

As recovery rises, the concentrate (reject) becomes increasingly concentrated. At 75 % recovery, the concentrate is 4× the feed concentration. At 90 %, it's 10×. Scaling species (Ca, SO₄, Si, Ba) hit solubility limits; organic + biological fouling accelerates.

Recovery limit set by:
- Calcium carbonate / sulfate solubility
- Silica solubility
- Membrane element ΔP (bursting)
- Concentration polarisation (boundary layer at membrane surface)

## Thermodynamics in 1 line

You always pay the osmotic-pressure tax. A perfect RO system at 50 % recovery on 35 g/L seawater has minimum specific energy ≈ 1 kWh/m³ permeate. Real systems hit 2.5–3 kWh/m³ at best, 4–6 kWh/m³ typical.

_Source: AWWA M46; Wilf — _The Guidebook to Membrane Desalination Technology__.`,

  'c-ro-101/m3': `## Membrane chemistry

### Polyamide thin-film composite (TFC)
Modern standard. Three-layer construction:
- Polyester support fabric
- Microporous polysulfone substrate
- Polyamide active layer (~ 0.2 µm thick)

Manufactured by interfacial polymerisation of m-phenylenediamine + trimesoyl chloride at the substrate surface.

Properties:
- 99.5 % NaCl rejection
- pH operating range 2–11
- Temperature 5–45 °C
- Chlorine intolerance — > 0.05 mg/L free Cl irreversibly damages the membrane

### Cellulose acetate (CA)
Older technology, still used in specific applications:
- 90–95 % NaCl rejection
- pH 4–7 (hydrolyses outside)
- Tolerates 1 mg/L free Cl
- Lower flux than TFC, higher operating pressure

## Construction

### Spiral-wound element
The standard for water RO:
- Flat-sheet membrane wrapped around a central permeate tube
- Mesh feed-spacers create channels
- Permeate-spacers conduct permeate inward
- 8" diameter × 40" long elements typical
- 4" elements for small systems

### Hollow-fibre
Most common for MF / UF (high packing density). Less common for RO; mainly seawater niche use.

### Plate-and-frame and tubular
Used for industrial / dirty applications (paper mill effluent, dairy whey UF). High capital, robust.

## Pressure-vessel arrangements

Spiral-wound elements load 4–8 per pressure vessel. Multiple vessels arranged in stages:

- 2:1 — typical brackish water RO at 75 % recovery
- 3:2:1 — high recovery (85 %), brackish
- Single-pass — seawater desalination at 35–50 % recovery
- 2-pass — high purity (e.g. boiler feed): permeate of 1st pass becomes feed of 2nd pass

_Source: Hydranautics Engineering Manual; DuPont WAVE software docs; Pentair / Lewabrane membrane datasheets._`,

  'c-ro-101/m4': `## Reading a membrane datasheet

Every TFC element comes with a published spec sheet. Standard test conditions:

- Feed: 2 000 ppm NaCl
- Pressure: 15.5 bar (225 psi)
- Recovery: 15 %
- Temperature: 25 °C
- pH: 8

At those conditions, the rated flow + rated rejection are listed.

## Real-world derating

At plant conditions, performance differs:

- **Temperature** — flow rises 3 % per °C above 25, drops 3 % per °C below
- **Pressure** — flow proportional to NDP
- **Salinity** — higher feed TDS → higher osmotic pressure → lower flow
- **Fouling** — surface obstruction reduces effective area
- **Age** — membrane compaction reduces flow over time

## Mass-transfer coefficient (MTC)

The element's "permeability constant", normalised to 25 °C and design pressure:

  MTC = J_w / (NDP × A)

where J_w is permeate flow (L/h), A is membrane area (m²). Used in normalisation calculations to compare performance across operating conditions.

## Fouling factor

A "running" reduction applied to design flow:

- Year 1: 1.0 (new)
- Year 2: 0.85
- Year 3: 0.7

Account for this in design — system sized for end-of-life flow, runs faster than design when new.

## Recommendations

When picking a membrane for a new application:

1. Pull datasheets from multiple suppliers (Hydranautics, DuPont/Filmtec, Toray, Lewabrane)
2. Run vendor projection software (RO-Pro, IMSDesign, WAVE) with actual feedwater analysis
3. Compare predicted permeate quality, recovery, energy
4. Verify pretreatment requirements (especially SDI₁₅)
5. Consider availability + shipping (replacements may be needed unexpectedly)

_Source: Hydranautics Engineering Manual; Hadron RO Performance calc._`,

  /* ───── RO-201 — RO System Design & Operation ───── */

  'c-ro-201/m1': `## The 2:1 brackish array

Standard design for 75 % recovery brackish water RO:

- Stage 1: 2 pressure vessels in parallel (e.g. 6 elements each)
- Stage 2: 1 pressure vessel (also 6 elements)
- Concentrate from stage 1 → feed to stage 2

Each stage has decreasing flow but increasing pressure (pumped between stages by booster, or pressure progressed through). The downstream stage sees concentrated, slower-moving feed; rejection per stage drops; overall system rejection still 99 %.

## Recovery and concentration polarisation

At the membrane surface, the velocity drops and salts accumulate (concentration polarisation). The local concentration is higher than bulk; scaling potential rises.

Design rule: cross-flow velocity > 0.1 m/s at every element. Below that, polarisation factors > 1.2 and scaling kicks in.

## Element ΔP limits

Each element has a maximum allowable ΔP (typically 1.0 bar) and a maximum cumulative ΔP per pressure vessel (typically 3.5 bar). Above these, the element creases / telescopes / breaks.

A bank running at full recovery hits these limits when fouled — backwash or clean.

## Stage ratio

For 75 % recovery, stage ratio (Q_stage1 : Q_stage2) is typically 2:1. For higher recovery (85 %), need 3-stage 4:2:1 or similar. Vendor projection software optimises the ratio for membrane area, energy, and end-of-life performance.

## Brackish vs seawater

| Variable | Brackish | Seawater |
|---|---|---|
| Feed TDS | 1 000–10 000 mg/L | 35 000 mg/L |
| Operating pressure | 8–25 bar | 50–80 bar |
| Recovery | 75–85 % | 35–50 % |
| SEC | 0.3–0.8 kWh/m³ | 2.5–4 kWh/m³ |
| Energy recovery | optional | mandatory (PX) |

_Source: Hydranautics IMS Design (online); DuPont WAVE software._`,

  'c-ro-201/m2': `## Why energy recovery for seawater

A seawater RO at 80 bar NDP, 40 % recovery: 60 % of feed leaves as concentrate at near-feed pressure. That high-pressure concentrate carries 60 % of pumping energy to the drain — 2–3 kWh/m³ permeate equivalent.

Energy recovery devices (ERDs) capture that pressure and apply it back to the feed:

## ERI Pressure Exchanger (PX)

Rotary positive-displacement device:
- High-pressure concentrate enters one end
- Low-pressure feed enters the other
- The two streams swap position via rotating ducts
- Pressure transferred at 95–98 % efficiency

Modern seawater RO with PX: SEC 2.0–2.5 kWh/m³ — ~ half of pre-PX systems.

## Turbine-based ERDs

Older technology. Pelton wheel or reverse-pump on the concentrate, mechanically coupled to the high-pressure feed pump shaft.

Efficiency 75–85 %; simpler, less expensive than PX, but lower energy savings.

## Where ERDs aren't economic

Brackish RO (low pressure, low recovery) doesn't need ERD — energy recovery would be < 0.1 kWh/m³, not worth capital.

ERDs become economic above ~ 30 bar feed pressure and ~ 50 % recovery. Below that, throttling concentrate is cheap enough.

## SEC (specific energy consumption)

Industry benchmark:

| Application | SEC kWh/m³ permeate |
|---|---|
| Brackish water (1 000 ppm) | 0.3–0.5 |
| Brackish water (5 000 ppm) | 0.6–1.0 |
| Seawater (with PX) | 2.0–3.0 |
| Seawater (no PX) | 4.5–6.0 |
| Wastewater reuse | 0.5–1.5 |

Real plant SEC depends on permeate quality, feed temperature, fouling, and ancillary loads (pumps, controls).

_Source: ERI PX brochures; IDA Desalination Yearbook; Wilf — _Membrane Desalination Technology__.`,

  'c-ro-201/m3': `## Daily routine

Operator checks every shift:

- **Permeate flow** (per stage)
- **Pressure**: feed, interstage, concentrate, permeate
- **Conductivity**: feed, permeate, concentrate
- **Temperature**: feed
- **pH**: feed
- **Free Cl** — must be zero
- **Turbidity / SDI** of feed (if measured)
- **Antiscalant pump** (visual confirmation of dose)

## Normalisation

Raw plant numbers need to be _normalised_ to a reference temperature and pressure to spot true trends. Three normalised metrics:

### Normalised flow
  Q_n = Q_actual × (NDP_design / NDP_actual) × (TCF_25 / TCF_actual)

TCF = temperature correction factor (1.0 at 25 °C, 1.03 at 26, 0.97 at 24, etc.).

### Normalised salt passage
  SP_n = SP_actual × (J_design / J_actual)

### Normalised ΔP
  ΔP_n = ΔP_actual × (Q_design / Q_actual)²

## The 15 / 15 / 15 rules

Common cleaning triggers:

- Normalised flow drops 15 % vs initial
- Normalised salt passage rises 15 % vs initial
- Normalised ΔP rises 10–15 % vs initial

Any one trigger → CIP (cleaning in place).

## First vs last vessel profiling

Take samples at:
- Each element's permeate (via probe)
- Concentrate at each stage exit

Compare first-stage to last-stage:
- ΔP rising on stage 1 only → particulate fouling
- Salt passage rising on stage 2 only → scaling on tail-end
- Both rising → biofouling (biofilm spreads through all stages)

## When in doubt — autopsy

Pull a stage-2 element after 6+ months service. Cut, photograph, lab-analyse:
- Surface deposits (FTIR, EDS)
- Microbial counts
- Permeability test post-clean

The autopsy report informs cleaning frequency + chemistry.

_Source: Hydranautics TSB-107; DuPont WAVE; Hadron RO Performance Calc._`,

  'c-ro-201/m4': `## Setting up the worked example

The Hadron RO Performance calc takes:

- Feed flow + permeate flow → recovery
- Feed conductivity + permeate conductivity → rejection
- Feed pressure + concentrate pressure → ΔP
- Feed temperature → TCF correction

## Worked example

**Plant data:**
- Feed: 4 200 mg/L TDS, 8 m³/h, 22 °C, 14 bar
- Permeate: 80 mg/L TDS, 6 m³/h, 0.5 bar
- Concentrate: 11 bar (back-pressure)

**Calc:**
- Recovery R = 6 / 8 = 75 %
- Rejection: feed = 4 200 mg/L; concentrate (mass balance) = (4 200 × 8 − 80 × 6) / (8 − 6) = 16 560 mg/L
  Average feed-concentrate = (4 200 + 16 560) / 2 = 10 380 mg/L
  Rejection = (1 − 80 / 10 380) × 100 % = 99.2 %
- ΔP across array = 14 − 11 = 3 bar
- Osmotic pressure (avg feed-conc) ≈ 0.7 × (10 380/1 000) = 7.3 bar
- NDP = (P_feed − ΔP/2 − P_perm) − (π_feed_avg − π_perm)
       = (14 − 1.5 − 0.5) − (7.3 − 0.06) = 4.7 bar

The system is running at low NDP — feed pressure could be raised to drive higher flux, but check antiscalant + ΔP first.

## Compare to vendor-specified normalisation

Vendor projection at 25 °C, 14 bar feed: 7 m³/h permeate, 30 mg/L. Real plant at 22 °C: 6 m³/h, 80 mg/L.

Temperature-corrected expected flow at 22 °C = 7 × 0.91 = 6.37. Real = 6 → 6 % below normalised.
Salt passage actual vs expected = 80 / 30 = 2.7× → 170 % above expected.

Both numbers indicate fouling (likely biological — high salt passage with moderate flow loss). Plan a high-pH CIP.

## When to call the membrane supplier

When normalised performance has degraded > 20 % from design and three CIP cycles haven't recovered it. Element replacement may be needed; supplier autopsy can confirm.

_Source: Hadron RO Performance Calc; Hydranautics IMS Design; DuPont WAVE._`,

  /* ───── RO-202 — Pretreatment & Antiscalant Selection ───── */

  'c-ro-202/m1': `## Why pretreatment is everything

A polyamide membrane is a delicate film. Three things destroy it:

- Particulates (scratch, plug feed channels)
- Chlorine / oxidants (chemical attack on PA film)
- Scale (precipitates onto membrane surface)

Pretreatment removes all three before they reach the membrane.

## The standard pretreatment train

For brackish water RO:

1. **Multimedia filter (MMF)** — 5–15 µm cutoff. Reduces TSS to < 1 mg/L, SDI₁₅ to < 3.
2. **Cartridge filter** — 5 µm absolute. Final guard against particulate breakthrough.
3. **Antiscalant injection** — phosphonate or polymer at 3–6 mg/L
4. **Dechlorination** (if free Cl present in feed) — SBS or GAC
5. **pH adjustment** (sometimes) — drop to 5.5–6.5 for CaCO₃ scale control
6. **High-pressure pump** → membrane

For seawater:
- Pre-screening (1 mm)
- Coagulation + flocculation
- DAF or sedimentation
- Multimedia + cartridge
- Chlorination (booster, high enough to maintain network pressure)
- _Then_ dechlorination
- Antiscalant
- HP pump

For wastewater reuse:
- MBR or UF as fine pre-treatment
- Cartridge filter
- pH + antiscalant
- HP pump (lower pressure than seawater, similar to brackish)

## Multimedia filter detail

Standard SA design:
- 1.5–2 m bed depth
- Anthracite (1.0–1.2 mm) + silica sand (0.5–0.7 mm) + sometimes garnet (0.3 mm)
- Underdrain: Leopold or nozzle plate
- Filtration rate 8–12 m/h
- Backwash with air + water, 5–8 m/h backwash rate
- Typical service interval 24–48 h

## Final guard cartridge

- 5 µm nominal (or 1 µm absolute for sensitive applications)
- Pleated polypropylene or string-wound cellulose
- ΔP at clean: 0.1 bar; replace at 1.0–1.5 bar
- Disposable (not cleaned) — change every 1–4 months

_Source: Hydranautics TSB-107; AWWA M46._`,

  'c-ro-202/m2': `## SDI₁₅ — the membrane fouling proxy

Silt Density Index is the standard measure of particulate fouling potential:

  SDI₁₅ = 100 × (1 − t_initial/t_final) / 15 min

where t is the time to filter 500 mL through a 0.45 µm filter under 2.1 bar feed pressure.

## Targets

- SDI₁₅ < 3 — design target for membrane RO
- SDI₁₅ < 5 — operational maximum
- SDI₁₅ > 5 — pretreatment failing; membranes will foul rapidly

## How to test

1. Filter at 2.1 bar through fresh 0.45 µm membrane
2. Note time for first 500 mL
3. Continue filtering for 15 minutes
4. Note time for last 500 mL (after 15 min)
5. Calculate SDI₁₅

The ratio of times indicates how much the filter clogged during the test — surrogate for membrane fouling rate.

## Modified Fouling Index (MFI)

More rigorous than SDI:
- Measures filtration rate over time
- Identifies fouling type (cake, blocking, intermediate)
- Better predictor of actual membrane fouling
- Used by some specialists; SDI more common operationally

## When SDI rises

Causes:
- Pretreatment performance drift (MMF needs cleaning, cartridge change)
- Source-water turbidity rise (storm, algal bloom)
- Coagulant programme change

Response:
- Check MMF effluent SDI separately from system feed
- Replace cartridge filter
- Increase pretreatment dose
- Worst case: upgrade pretreatment (UF instead of MMF)

## Cleaning vs upgrading

If SDI₁₅ trends upward over months but pretreatment is intact: source water has changed — consider permanent upgrade. If a single excursion: short-term action, find cause, restore.

_Source: ASTM D4189-95 (SDI test method); Hydranautics TSB-107._`,

  'c-ro-202/m3': `## Why antiscalant matters

At 75 % recovery, sparingly soluble salts in the feed concentrate 4× in the reject. CaCO₃, CaSO₄, BaSO₄, SrSO₄, silica all approach or exceed solubility.

Without antiscalant, calcium scale forms on the membrane within days and rejection collapses.

## The chemistry

Antiscalants don't prevent _saturation_ — they prevent _crystallisation_:

- **Threshold inhibition** — small dose (mg/L) stabilises supersaturated solution by adsorbing onto incipient crystal nuclei
- **Dispersion** — keeps any precipitate suspended, away from membrane surface

## Major antiscalant chemistries

### Phosphonates
- HEDP, ATMP, PBTC
- Most cost-effective for CaCO₃, calcium phosphate
- 2–6 mg/L typical
- Risk: form Ca-phosphonate scale at very high concentration; use dilute brine

### Polymers
- Polyacrylates, AA-AMPS copolymers
- Better for silica, iron oxide, heavy metals
- Higher cost; 3–8 mg/L typical
- More forgiving of overfeed

### Blends
- Most commercial products are phosphonate + polymer + dispersant
- Vendor will run feedwater analysis through projection software (Vitec, AquaWorks, Pretreat-Plus)

## When phosphonate is wrong

- High Sr / Ba in feed → use polymer
- Very high silica (> 100 mg/L) → use polymer
- Very high iron / Mn → use polymer + dispersant
- Effluent reuse with high organics → use polymer (phosphonate fouls quickly)

## Testing dose

Vendor tools predict the minimum dose for your feedwater. Real-world: start at vendor recommendation + 25 % safety, monitor scaling indicators, optimise downward over 6 months.

Operational dose typically 3–6 mg/L. Don't underdose — scaling damage is permanent.

_Source: Avista Technologies — Antiscalant Manual; Hydranautics — Antiscalant Selection Guide._`,

  'c-ro-202/m4': `## Calculating dose

Dose target × feed flow = mass per time. Use the Hadron Coagulants / Dosage calc:

- Plant feed flow: 100 m³/h
- Antiscalant dose: 4 mg/L
- Active strength: 100 % (most antiscalants are sold as 50 % or 100 % active solutions)
- Density: 1.10 kg/L

Daily mass of active = 100 × 24 × 4 = 9.6 kg/d
Daily as-delivered (50 % product) = 9.6 / 0.5 = 19.2 kg/d
Daily volume = 19.2 / 1.10 = 17.5 L/d
Pump rate = 17.5 / 24 = 0.73 L/h = 12.1 mL/min

## Verification

Catch the dosing pump output for 1 minute in a measuring cylinder. Should match calculated mL/min.

## Pump selection

- Diaphragm metering pump for low-flow accuracy (Pulsafeeder, Grundfos)
- Set turn-down range 5–100 % so flow can vary with seasonal feed
- Pump on level switch alarm — empty antiscalant tank should sound alarm before membrane sees clean feed

## Dilution / pre-mix

Many antiscalants are 50–100 % active. Dilute 1:10 with permeate (not raw water — risk of seeding crystals from raw water minerals into the antiscalant tank) for easier metering.

## Storage life

- Most antiscalants stable 12 months from manufacture
- Date-stamp every drum on receipt
- FIFO usage
- Visual: discoloured / precipitated product → reject

## Safety

- Antiscalants are mildly acidic (pH 2–4 typical)
- Skin contact = irritation
- Eye contact = serious
- Required PPE: nitrile gloves + splash goggles for transfers
- SDS in Hadron LIMS Documents

_Source: Hadron Coagulants Calculator; Avista / GE / Hydranautics antiscalant SDS._`,

  /* ───── RO-301 — Performance Monitoring & CIP ───── */

  'c-ro-301/m1': `## Why normalise

Raw RO plant data is misleading. Run pressure changes by flow demand. Temperature swings by season. Feed salinity by source. Without normalising, you can't tell genuine fouling from operational drift.

## The three normalised metrics

### Normalised permeate flow
Adjusts for:
- Temperature (TCF — flow rises with T)
- Net Driving Pressure (NDP)

  Q_n = Q_actual × (NDP_ref / NDP_actual) × (TCF_ref / TCF_actual)

Plot Q_n over time. Falling → membrane fouling.

### Normalised salt passage
Adjusts for:
- Permeate flow (membrane "leaks" more salt at low flow)
- Feed-side salinity (higher feed → higher SP)

  SP_n = SP_actual × (Q_actual / Q_ref) × (C_ref / C_actual)

Plot SP_n over time. Rising → membrane damage or scaling allowing leakage.

### Normalised ΔP
Adjusts for:
- Flow (ΔP scales with Q²)

  ΔP_n = ΔP_actual × (Q_ref / Q_actual)²

Plot ΔP_n over time. Rising → particulate or biological fouling between elements.

## TCF (temperature correction factor)

  TCF = e^(2640 × (1/(273+T) − 1/298))

At 20 °C: 0.85
At 25 °C: 1.00
At 30 °C: 1.18

So a 20 °C plant runs 15 % below 25 °C normalised flow on temperature alone. Don't blame fouling for what's just the season.

## Pressure correction

NDP = (P_feed − ΔP/2 − P_perm) − (π_feed_avg − π_perm)

At lower feed pressure, NDP is lower, flow is lower. The normalisation factor brings it back to design.

## Plant data acquisition

Modern RO has SCADA logging:
- Every parameter every minute
- Daily extracts to spreadsheet / database
- Trend plots (per stage)
- 30-day moving average

Without good data acquisition, normalisation is impossible. Old plants with paper logs simply can't normalise — first upgrade to digital before any optimisation.

_Source: Hydranautics IMS Design + TSB-107; DuPont WAVE._`,

  'c-ro-301/m2': `## Reading the fouling pattern

Different fouling types produce distinctive patterns in the three normalised metrics:

### Biofouling
- ΔP_n rises (biofilm thickens between elements)
- Q_n drops (surface obstruction)
- SP_n stable or slowly rising
- Worse on stages near concentrate (slower flow, more nutrients)

### Scaling
- ΔP_n stable or slow rise
- Q_n drops sharply
- SP_n rises (defects in scale layer let salt through)
- Worse on tail end (highest concentration)

### Particulate fouling (silt, colloidal)
- ΔP_n rises (cake on lead element)
- Q_n drops
- SP_n stable
- Worse on stage 1 (catches everything first)

### Oxidation damage
- Q_n stable or higher (chlorine attack opens up membrane)
- SP_n rises sharply
- ΔP_n stable
- Often spotted within hours of free-Cl excursion

### Membrane compaction (age)
- Q_n drops gradually over years
- SP_n stable
- ΔP_n stable

## Stage-by-stage diagnosis

Profile each stage to localise:

- Lead-stage flow normal, tail-stage flow low → scaling (concentrating)
- Lead-stage ΔP high → particulate (catches solids first)
- All stages flow drop → biofouling (spreads everywhere)

## Confirmation

- Pull representative element after 6+ months
- Visually inspect (sticky biofilm? hard scale? oily deposits?)
- Lab analysis (FTIR, EDS, viable counts)
- Test cleaning recipes on lab-scale before full plant CIP

_Source: Hydranautics — Biofouling Solutions; DuPont — Membrane Cleaning Guide._`,

  'c-ro-301/m3': `## CIP categories

Two main cleanings, sometimes combined:

### High-pH (alkaline) clean — for organics and biological fouling
- 0.1–0.2 % NaOH (pH 11–12)
- ± 0.1 % Na₄EDTA (chelant for organic + iron-organic complexes)
- ± 0.05 % SDS or biocide (deep-clean biofilm)
- Temperature 30–35 °C (max 45 °C for TFC)
- 30–60 min recirculation

### Low-pH (acid) clean — for scale
- 0.5 % HCl or 1 % citric acid (pH 2)
- Or 1 % oxalic for iron scale
- Temperature 30–35 °C
- 30–60 min recirculation

### Combined clean (biofouling with scale layer)
- High-pH first
- Drain, rinse to neutral
- Low-pH second
- Drain, rinse, return to service

## CIP equipment

A dedicated CIP rig:
- Cleaning solution tank (10–20 % of pressure-vessel volume)
- Heater (steam coil or electric)
- Recirculation pump (sized for membrane manufacturer's recommended flow)
- pH probe + temperature gauge

## Cleaning sequence

1. Take RO offline, isolate from feed
2. Drain feed channel, fill with permeate
3. Heat to 30–35 °C, dose cleaning chemistry
4. Recirculate at low pressure (typically 4–7 bar)
5. Soak overnight if heavy fouling
6. Drain, rinse with permeate until pH neutral
7. Performance test at design conditions

## Frequency

- Light fouling environment: 2–4 cleanings per year
- Heavy fouling (effluent reuse, surface water): 6–12 per year
- Each clean takes 4–24 h

## When clean doesn't work

If three CIPs in succession don't restore performance to within 90 % of normalised baseline, membrane is at end-of-life. Replacement strategy: stagger over 2–3 years (replace stage 2 first, since it sees worst conditions; rotate stage 1 elements to stage 2 next round).

_Source: Hydranautics CIP Guide; DuPont — Membrane Cleaning Bulletin._`,

  'c-ro-301/m4': `## Predicting membrane life

A membrane element typically lasts 3–7 years in brackish water RO. Key indicators of approaching end-of-life:

- Normalised flow > 25 % below initial after CIP
- Salt passage > 2× initial after CIP
- Visible damage (creasing, telescoping, brown deposits not removable)
- Element ΔP > 1.5 bar individual

## End-of-life ΔP signature

The "last-stage ΔP rises first" pattern is universal:
1. Stage 2 elements see highest concentration
2. Scaling / biofouling begins there
3. ΔP rises across stage 2
4. Cleaning recovers some but not all
5. Eventually stage 2 is saturated; replace

## Stagger replacement

The cheapest strategy:
- Year N: replace stage 2 elements (move new to stage 2)
- Year N+1: replace stage 1 elements (move stage 1 from year N-1 to stage 2)
- Year N+2: repeat

Result: each element sees ~3 years stage 1 + ~2 years stage 2. Whole system rotated every 2–3 years at half-cost-per-year of replacing all annually.

## Used-element autopsy

Don't throw away a failed element. Send for autopsy:
- Surface: visual + optical microscopy
- Salts: XRD + EDS
- Organics: FTIR
- Bio: viable count + microscopic morphology
- Membrane condition: dye penetration test, lab-scale flow test

The autopsy report tells you _why_ it failed, so you can fix the cause for the next set.

## Disposal

Used membranes are mostly polypropylene + polyamide:
- Cleaned, dried → low-grade plastic recycle
- Or landfill (general waste) if free of process contaminants
- Some specialist recyclers reclaim membrane elements for industrial filter use (rough applications)

## Replacement specs

When buying:
- Same vendor + spec where possible (avoids re-piping, re-projection)
- If switching vendor: run new projection
- Verify membrane area, geometry, performance ratings
- Check warranty terms

_Source: Hydranautics + DuPont end-of-life guides; IDA Yearbook membrane longevity studies._`,

  /* ════════════════════════════════════════════════════════════════
     TRACK 8 — TREATMENT EQUIPMENT
     ════════════════════════════════════════════════════════════════ */

  /* ───── EQ-101 — Pumps, Mixers & Dosing Systems ───── */

  'c-eq-101/m1': `## Centrifugal pumps

The workhorse of water treatment. A rotating impeller imparts kinetic energy to water; volute converts kinetic to pressure energy. Plot **Q-H curve** — flow versus head — and identify duty point (intersection with system curve).

Characteristics:
- Smooth flow (no pulsation)
- Single duty point per impeller
- Run-out (high flow, low head) and shut-off (zero flow, max head) extremes
- Efficiency drops away from BEP (best efficiency point)

## NPSH and cavitation

Net Positive Suction Head Required (NPSHR) is the absolute pressure the pump needs at suction to avoid vapour bubble formation. NPSHA (Available) must exceed NPSHR with margin.

NPSHA = (P_atm − P_vap) / (ρ × g) − suction lift − suction friction

Cavitation symptoms:
- Pump noise like "rocks in pump"
- Pressure pulsation
- Erosion of impeller surface
- Drop in head

Prevention:
- Flooded suction (positive head)
- Short, smooth suction pipe
- Suction strainer kept clean

## Positive-displacement pumps

For accurate dosing, low flow, high pressure:

- **Diaphragm metering** — accurate (1 % volumetric), 5–100 % turn-down, 3–10 bar typical
- **Piston** — higher pressure (up to 100 bar), high accuracy, more wear parts
- **Peristaltic** — squeeze a hose; chemical never touches metal; self-priming, gas-tolerant

PD pumps generate fixed volume per stroke regardless of discharge head — critical for accurate chemical dose.

## Common selection mistakes

- Centrifugal pump for chemistry → flow varies with system head; dose isn't consistent
- Diaphragm pump on suction lift → cavitates, no flow
- Oversized pump → throttled at duty point, wears prematurely
- Wrong material → polymer attack on EPDM O-rings, etc.

_Source: Karassik — _Pump Handbook_; Grundfos / Watson Marlow / ProMinent technical literature._`,

  'c-eq-101/m2': `## Why mix at all

Two distinct mixing jobs in water treatment:

### Rapid mix
Distribute coagulant uniformly into raw water in seconds. High intensity (G ≈ 1 000 s⁻¹), short time (30–60 s).

### Slow / floc mix
Allow destabilised colloids to collide and grow into floc. Lower intensity (G ≈ 30–70 s⁻¹), longer time (15–30 min total in 3 stages).

## G-value (velocity gradient)

  G = √(P / (μ V))

where P = power (W), μ = dynamic viscosity (Pa·s), V = tank volume (m³). Typical:

| Stage | G (s⁻¹) | t (min) | G·t |
|---|---|---|---|
| Rapid mix | 700–1 500 | 0.5–1 | ~30 000 |
| Floc 1 | 70 | 10 | 42 000 |
| Floc 2 | 50 | 10 | 30 000 |
| Floc 3 | 30 | 10 | 18 000 |

Tapered G in floc gives densest, fastest-settling floc.

## Impeller types

- **Axial-flow turbine** (marine prop) — high flow, low pressure; efficient mixing in tall tanks
- **Radial-flow turbine** (Rushton) — high shear, lower flow — for rapid mix
- **Hydrofoil** — modern, very efficient axial flow; low power for given mixing
- **Paddle** — slow flocculator; long arms, low rpm

## Calculating power

For Rushton turbine in turbulent flow:

  P = Np × ρ × n³ × D⁵

where Np = power number (5.5 typical), ρ = water density, n = rev/s, D = impeller diameter.

For paddle:

  P = 0.5 × Cd × ρ × A × v_rel³

where Cd ≈ 1.8, A = paddle area, v_rel = paddle velocity relative to water.

Plug into G equation, solve for impeller speed.

## Vortex prevention

In rapid mix, central vortex pulls air down into water and reduces effective mixing. Prevent with:
- 4 baffles 1/12 of tank diameter
- Off-centre impeller
- Inclined impeller axis

For floc, slow speed avoids vortex naturally.

_Source: WRC Handbook Ch B1.5; AWWA — Mixing in Water Treatment._`,

  'c-eq-101/m3': `## The dosing system layout

Every chemical dosing setup has the same skeleton:

1. **Storage tank** (HDPE, FRP, lined steel — material per chemistry)
2. **Suction line** (rigid, no leaks, valve-isolatable)
3. **Pump** (diaphragm or peristaltic)
4. **Discharge line** (no dead legs)
5. **Anti-siphon valve** (close to feed point)
6. **Pressure-relief valve** (back to tank)
7. **Calibration cylinder** (clear, marked, 100–500 mL)
8. **Pulsation dampener** (if pump pulses are problematic)
9. **Injection quill / point** (into mainline)

## Materials of construction

- **Acid (HCl, H₂SO₄)** — PVC, CPVC; PTFE/Viton seals; Hastelloy if needed
- **Caustic (NaOH)** — HDPE; EPDM seals; not aluminium / brass
- **Hypochlorite (NaOCl)** — HDPE; Viton or Kalrez seals; tank vent
- **Polymer** — HDPE; mild steel acceptable
- **Lime slurry** — abrasion-resistant: Hastelloy, Hardened SS, ceramic-lined

## Calibration cylinders

A vertical clear tube, sealed top with a 3-way valve to suction line:
- Switch valve to "calibrate" — pump draws from cylinder, not tank
- Time the drop in cylinder volume → flow rate
- Verify against expected setpoint

## Anti-siphon valve

Prevents siphon-back when pump stops. Spring-loaded check valve. Must be installed close to mainline injection point — long discharge line allows siphon despite check valve.

## Common dosing mistakes

- **Pump too far from chemical tank** — long suction line gas-locks
- **No calibration cylinder** — operator can't verify dose
- **Anti-siphon valve missing** — chemical drains into mainline overnight
- **Storage tank uncovered** — bacteria + dust contaminate chemistry
- **No leak detection** — invisible drip becomes visible after R 50 000 of chemical lost

## Maintenance schedule

- Weekly: visual check, calibrate cylinder
- Monthly: replace pump tubing (peristaltic)
- Quarterly: replace diaphragm + valves (diaphragm pumps)
- Annual: hydrotest, full pump strip + rebuild

_Source: ProMinent / LMI / Watson Marlow technical manuals; SANS / OHS chemical-handling regulations._`,

  'c-eq-101/m4': `## Worked example: dosing pump calibration

**Plant data:**
- Coagulant target: 35 mg/L
- Plant flow: 500 m³/d
- Product: PAC 18 % active, density 1.2 kg/L

## Calculate target

Daily active = 500 × 35 = 17 500 g = 17.5 kg/d
Daily as-product = 17.5 / 0.18 = 97.2 kg/d
Daily volume = 97.2 / 1.2 = 81 L/d
Hourly = 81 / 24 = 3.4 L/h
Per-minute = 3.4 × 1000 / 60 = 56 mL/min

## Calibrate

1. Switch suction to calibration cylinder
2. Open suction line, pump primed
3. Note start volume (e.g. 500 mL)
4. Run pump for exactly 60 seconds at intended setpoint
5. Note end volume (e.g. 444 mL)
6. Pumped volume = 500 − 444 = 56 mL → matches target

## If calibration is off

If real flow is 50 mL/min when target is 56:
- Increase pump stroke length (or frequency) until calibration matches
- Re-verify after adjustment

## Verifying dose at the works

Confirmation in the plant — increase coagulant by 10 % and watch settled water turbidity:
- Improvement → dose was on the underside; new dose better
- No change → dose is at optimum
- Worsening → over-dose, restabilising

## Build a calibration log

Per pump:
- Date / time
- Operator
- Pump setpoint
- Calibration result (mL/min)
- Difference vs target
- Notes (tubing replaced, etc.)

This log is key to LIMS-tracked maintenance + audit defense.

_Source: Hadron Coagulants Calculator user guide; pump manufacturer manuals._`,

  /* ───── EQ-201 — Filters & Clarifiers ───── */

  'c-eq-201/m1': `## Sedimentation tanks

Three common geometries:

### Rectangular
Long horizontal tank, water enters one end, settles, exits other end:
- Length-to-width 4–6:1
- Surface overflow rate (SOR) 1.5–2.5 m/h
- Detention 2–4 h
- Sludge collected by chain-and-flight scraper to hopper at inlet end

### Circular (clarifier)
Centre-inlet, peripheral overflow:
- Diameter 5–50 m typical
- SOR 1.0–2.0 m/h
- Centre-driven scraper bridge
- Sludge to centre hopper

### Plate / lamella settler
Tilted plates create multiple parallel settling zones:
- Effective SOR 5–10 m/h (3–5× rectangular)
- Footprint 3–5× smaller
- Plate fouling risk; periodic flush

## Sludge-blanket clarifier

Up-flow, with a "fluidised" sludge blanket suspended at mid-depth:
- SOR 3–4 m/h
- Excellent for stable feeds
- Intolerant of swings
- Used in older plants and select industrial

## Surface Overflow Rate (SOR)

The design parameter. Effectively the maximum upflow velocity a particle has to overcome to escape:

  SOR = Q / A

where Q is overflow flow, A is surface area. A particle settling at velocity vs > SOR will be removed; below, it escapes.

Hazen's law: settling velocity is the design driver, not retention time.

## Weir loading

Outlet weirs limit how fast water leaves:
- Typical 200–250 m³/m·d (8–10 m³/h per linear m)
- Higher rates re-entrain settled solids
- V-notch weirs preferred for low loadings

## Sludge-mechanism types

- **Chain-and-flight** — old workhorse, simple, slow speed
- **Travelling bridge** — better cleaning of corner zones
- **Suction-tube** — for shallow / dilute sludges
- **Helical scraper** — modern, energy-efficient, low-RPM

_Source: WRC Handbook Ch B2; Kawamura — _Integrated Design and Operation of Water Treatment Facilities__.`,

  'c-eq-201/m2': `## Filter design parameters

A rapid sand or multimedia filter has these key dimensions:

### Bed depth
- Single sand: 0.7–1.2 m
- Dual media (anthracite + sand): 0.8–1.4 m total (anthracite 0.5 m + sand 0.3 m)
- Multimedia: 1.0–1.5 m total

### Filtration rate
- Rapid sand: 5–8 m/h
- Dual media: 8–12 m/h
- Multimedia: 12–15 m/h
- Slow sand: 0.1–0.2 m/h

### Effective size + uniformity coefficient
ES = 10th-percentile grain size; UC = 60th / 10th percentile.

| Media | ES (mm) | UC max |
|---|---|---|
| Anthracite | 1.0–1.2 | 1.7 |
| Silica sand | 0.5–0.7 | 1.5 |
| Garnet | 0.25–0.3 | 1.5 |

Lower UC = more uniform = better stratification + cleaner backwash.

## Support gravels

Between filter media and underdrain, graded gravels prevent media migration:

| Layer | Depth | Size |
|---|---|---|
| Top gravel | 100 mm | 1.2–2.5 mm |
| Mid gravel | 100 mm | 2.5–5 mm |
| Bottom gravel | 100 mm | 5–10 mm |
| Underdrain | — | nozzles/blocks |

Modern Leopold underdrains with fine slots eliminate gravel — saves 300 mm of bed depth.

## Underdrain options

- **Leopold blocks** (modular plastic) — most common, even distribution, no gravel
- **Nozzle plate** — ceramic / plastic strainers in concrete floor; cheaper but uneven
- **False bottom** — perforated plate with gravels; legacy

## Air-scour vs water-only backwash

Modern: air scour first (mud-balls), then sub-fluidised air + water, then fluidised water-only. 30 % less water than pre-1990 water-only systems.

_Source: WRC Handbook Ch B3; AWWA M44 — Backwashing Filter Media._`,

  'c-eq-201/m3': `## Backwash phases

Standard sequence on a multimedia filter:

### Phase 1: Air scour (mud-ball break)
- Air rate 60–80 m/h
- Duration 2–3 min
- Water level just above sand surface
- Breaks up surface mud, dislodges sticky deposits

### Phase 2: Air + water (sub-fluidised wash)
- Air at same rate
- Water 35–45 m/h (below fluidisation)
- Duration 3–5 min
- Suspends solids without lifting media

### Phase 3: Water-only (fluidised wash)
- Air off
- Water 50–55 m/h (fluidised, expanded ~30 %)
- Duration 5–8 min
- Carries solids to wash trough

### Phase 4: Drain or rinse
- Drain to set level for refill
- Or rinse top of bed before service

## Backwash water budget

Total backwash water ≈ 1–3 % of plant production. For a 5 ML/d plant: 50–150 m³/d to drain.

## Wash trough geometry

Trough at 0.4–0.6 m above expanded bed surface. Spacing such that horizontal travel < 1 m. V-notch or flat lip:
- V-notch — better for low rise rates, more even distribution
- Flat — handles higher rates

Rise rate over the lip = 0.2–0.4 m/min. Below = solids fall back; above = media carry-over.

## Backwash rate vs media

Rate must fluidise the media without expelling it. For 0.5 mm sand at 25 °C: 50 m/h. For 1.0 mm anthracite: 65 m/h. Multimedia uses 55–60 m/h to balance both.

## Cold-water adjustment

Backwash rate depends on water density / viscosity:
- 5 °C: 75 % of 25 °C rate (more dense water)
- 30 °C: 110 % of 25 °C rate

Plants in winter need lower backwash rates or longer durations to compensate.

_Source: WRC Handbook Ch B3.5; AWWA M44._`,

  'c-eq-201/m4': `## Common filter problems

### Mud-balls
Symptom: head loss climbs rapidly, backwash water dirty.
Cause: insufficient air scour, sticky floc cementing media.
Fix: stronger air scour, longer total wash, occasional NaOH wash (chemical cleaning).

### Channelling / short-circuiting
Symptom: turbidity breakthrough at unusually low head loss.
Cause: media migration, side-wall short-circuit, uneven underdrain.
Fix: probe bed for soft spots, double-backwash to redistribute, repair underdrain.

### Air binding (negative head)
Symptom: filtered flow drops, audible bubbles in bed.
Cause: head loss exceeds water column, dissolved gas comes out of solution.
Fix: keep water level high above bed; reduce run length.

### Cracking / wall pull-away
Symptom: visible 5–10 mm gap around filter wall.
Cause: backwash short-circuits up wall.
Fix: re-level wash troughs, increase air scour.

## Clarifier problems

### Short-circuiting
Symptom: tracer test shows quick early peak.
Cause: poor inlet baffling, floor irregularity, density currents.
Fix: install or improve flocculator-clarifier baffle, even distribution wall.

### Sludge build-up
Symptom: sludge depth climbs, scraper bogs down.
Cause: scraper failure, sludge pump unable to keep up.
Fix: increase sludge withdrawal frequency, verify scraper torque, check sludge pump.

### Floating sludge
Symptom: clumps surface in clarifier.
Cause: gases (CO₂, N₂) generated in sludge layer; sludge too old.
Fix: more frequent sludge withdrawal, consider mechanical aeration, raise temperature.

### Algae growth on clarifier walls
Symptom: green / brown slime visible.
Cause: sunlight + nutrients.
Fix: cover, periodic clean, light-resistant cover material.

_Source: WRC Handbook Ch B2.6 + B3.6 (trouble-shooting); Hadron site reports._`,

  /* ───── EQ-202 — Instruments & Calibration ───── */

  'c-eq-202/m1': `## pH electrode

Glass-membrane electrode produces a voltage proportional to pH:

  E = E_0 + (R T / F) × ln(a_H+)

at 25 °C, 59.16 mV per pH unit.

Lifespan: 12–18 months in clean water; 6–12 months in dirty / extreme. Drift signs:
- Slow response (> 30 s to stabilise)
- Slope < 90 % (i.e., not 53 mV per pH unit)
- Erratic readings

Calibration: 2-point with pH 4 / 7 / 10 buffers. Slope 90–105 % is healthy. Probe replacement when slope < 90 % despite cleaning.

## ORP electrode

Measures redox potential against reference electrode (Ag/AgCl):
- Used for chlorine residual control (cooling water)
- Range −500 to +800 mV
- Calibration with quinhydrone or Zobell solution
- Pt electrode tip — easily fouled, monthly cleaning

## Conductivity

Measures ionic content via electrical conductance between two cells:

- Cell constant K = 1.0 (typical for clean water)
- 0.1 (low conductivity, e.g., RO permeate)
- 10 (high conductivity, e.g., seawater)

  σ (µS/cm) = G × K

Temperature compensation built in (default 2 % / °C).

Calibration: standard solution (e.g., 1 413 µS/cm KCl) at 25 °C. Cell constant verified annually.

## Common faults

- pH probe slow → glass dirty (clean with dilute HCl), or aged (replace)
- pH drift → reference electrode poisoned (KCl bridge contaminated)
- ORP fluctuating → Pt tip oxidised (clean with dilute HNO₃)
- Conductivity low → cell fouled (clean with dilute acid)

_Source: Hach Analytical Procedures; Endress+Hauser Liquid Analytical handbook._`,

  'c-eq-202/m2': `## Turbidity (nephelometry)

90° scatter from incident light:
- Hach 2100 series — bench / online
- Range 0–10 000 NTU
- Calibration: formazin or polymer-bead standards
- Typical accuracy ± 2 % to 100 NTU; ± 5 % above

Online turbidimeters need:
- Constant flow (10–30 mL/min through cell)
- Bubble trap (air bubbles read as turbidity)
- Periodic vial cleaning (deposit forms over weeks)

## Residual chlorine

Two technologies:

### DPD photometric
- Reagent (DPD) added to sample, develops pink colour, photometric reading
- Hach CL17 / Endress E+H series
- 0.05–5 mg/L range
- Reagent change weekly, calibration monthly

### Amperometric
- Direct electrochemical reading
- No reagent
- More precise at low residual (< 0.1 mg/L)
- Calibration weekly with DPD grab

For most water plants, DPD is adequate. For drinking-water at low residual, amperometric preferred.

## Chlorine dioxide

- Lovibond comparator (manual)
- Online ClO₂ analysers (Hach, Knick) — selective vs free Cl, chlorite, chlorate
- Dual-probe systems for ClO₂ + chlorite (verifies generator efficiency)

## Maintenance schedule

| Instrument | Cleaning | Calibration |
|---|---|---|
| pH | Weekly | Daily zero, monthly slope |
| ORP | Monthly | Quarterly |
| Conductivity | Monthly | Quarterly |
| Turbidity | Monthly cell wipe | Quarterly with formazin |
| Cl₂ DPD | Weekly reagent change | Monthly with grab |
| Cl₂ amperometric | Weekly | Weekly with DPD grab |

_Source: Hach Analytical Procedures; AWWA M53 — Operational Monitoring._`,

  'c-eq-202/m3': `## Calibration discipline

Calibration is the single biggest factor distinguishing audit-passing from audit-failing plants. The discipline:

### Two-point cal at minimum
For pH: pH 4 + pH 7 (acidic range) or pH 7 + pH 10 (alkaline range). Both buffers fresh, in-spec date.

### Slope check
Healthy probe: slope 92–102 % of theoretical (53–61 mV/pH).
- < 90 % → probe ageing, replace
- > 102 % → probe error, check buffer fresh

### Drift monitoring
After 7 days at field conditions, recalibrate — probe should return to within ± 0.05 pH of calibration buffer reading.

### Validation against grab sample
Independently of calibration, compare online reading to grab sample analysed in lab:
- Daily for residual Cl
- Weekly for pH, conductivity
- Monthly for turbidity

### Documentation
Log every calibration:
- Date, time, operator
- Buffer batch / standard batch
- As-found reading + as-left reading
- Slope (for pH, ORP)
- Pass/fail vs acceptance criteria
- Action if fail (re-cal, probe replace)

## Reference standards

Critical: traceability of calibration standards to national reference (NMISA in SA). When you buy buffer or standard:
- Verify CoA
- Note batch + expiry
- Refrigerate if required
- Single-use small bottles preferred (avoid contamination)

## Documentation in LIMS

Hadron LIMS Calibration module records each cal event. Overdue alerts when interval expires. Master calibration register for the audit.

## Audit defence

When the auditor asks "show me calibration records for instrument X over past 12 months":
- Pull report from LIMS
- 12 months of dated entries with operator signatures
- Slopes within tolerance
- Validation events logged

This is what good vs bad plant looks like.

_Source: ISO/IEC 17025:2017 §6.5; SANAS R 47._`,

  'c-eq-202/m4': `## The Hadron Calibration module

In LIMS or in the Calibration sub-app:

- Per-meter / per-instrument record
- Calibration interval (days)
- Last cal date + result
- Next cal due date
- Auto-alarm when overdue
- Calibration history visible to auditor

## What goes in each record

For every instrument:
- ID + serial number
- Make + model
- Tag location
- Calibration interval
- Last cal: date, operator, slope, action
- Next cal due
- Status: in-tolerance / out-of-tolerance / scheduled / overdue

## Per-meter interval

| Instrument | Interval |
|---|---|
| pH probe | 90 d (recal); 7 d (zero check) |
| ORP probe | 90 d |
| Conductivity | 180 d |
| Turbidity | 90 d |
| Free Cl | 30 d |
| Mass-flow meters | 365 d (verify) or 1095 d (recal) |
| Pressure gauge | 365 d |
| Temperature transmitter | 365 d |

## Logging cal events

Use the Hadron Calibration app:

1. Open the meter's record
2. Click "Log calibration"
3. Enter:
   - As-found reading
   - As-left reading
   - Slope (for pH/ORP)
   - Pass / fail
   - Notes
4. Save → calibration history updated, next cal date scheduled

## Overdue alerts

When a cal expires, the instrument shows in red on the Calibration dashboard. Manager reviews weekly. Action either:
- Recalibrate (if instrument still in service)
- Decommission (if replaced or removed)
- Justify the delay (rare — needs manager + QA sign-off)

## Auditor review

Audit trail in Hadron LIMS shows:
- All calibration events
- Who performed (signature + role chip)
- When (timestamp)
- Action

This is the kind of digital audit trail SANAS / ISO auditors increasingly expect.

_Source: Hadron Calibration module user guide; ISO 17025 calibration requirements._`,

  /* ───── EQ-301 — Maintenance & Troubleshooting ───── */

  'c-eq-301/m1': `## Maintenance philosophies

### Run-to-failure
Operate equipment until it breaks, then fix. Acceptable for non-critical, low-cost items (e.g., spare submersible pump).

### Time-based PM
Service at fixed intervals (e.g., pump rebuild every 4 000 h). Simple to schedule, often over- or under-services.

### Condition-based monitoring (CBM)
Service triggered by measured condition (vibration rising, oil contamination, temperature rising). Optimum: catches failures before they happen, doesn't service unnecessarily.

### Reliability-Centred Maintenance (RCM)
Holistic — analyse each piece of equipment for failure modes, decide for each whether RTF / time / condition-based is best. Time-intensive to implement; gold standard for critical assets.

## Vibration analysis

For rotating equipment (pumps, blowers, fans):
- Accelerometer on bearing housing
- FFT analysis identifies fault frequencies
- Detects unbalance, misalignment, bearing wear, looseness

Trend over 6+ months. Sudden increase → schedule service.

## Oil analysis

For gearboxes, large pumps:
- Sample oil monthly
- Lab analysis: viscosity, water content, particle count, wear metals
- Detects bearing wear (Fe, Cr, Ni rising), seal failure (water rising), oil ageing (viscosity changing)

## Thermography

Infrared camera for:
- Electrical hotspots (loose connections, overload)
- Bearing failure (hot bearing housing)
- Insulation degradation

Quarterly thermography survey on critical motor circuits and gearbox housings.

## PM register + overdue alerts

Hadron Service Report + Calibration modules log every PM event. Monthly review by maintenance manager.

_Source: SAE JA-1011 (RCM); ISO 17359 (Condition Monitoring)._`,

  'c-eq-301/m2': `## The "5 Whys" technique

A failure → ask "why" five times. Don't stop at "operator error":

> Pump failed.
> Why? Bearing seized.
> Why? No oil in housing.
> Why? Operator didn't top up.
> Why? Top-up SOP didn't include this pump.
> Why? When the pump was installed, SOP wasn't updated.

The fix sits at the deepest "why" — update SOP procedure for adding new equipment.

## Ishikawa fishbone diagram

Categorise possible causes:
- **Man** — operator error, training, fatigue
- **Method** — SOP wrong, missing
- **Machine** — equipment issue
- **Material** — chemical, water, parts
- **Measurement** — instruments, sampling
- **Environment** — temperature, humidity, ventilation

Each cause asks the 5-Whys. Visual layout shows multiple contributing factors.

## Pareto of failures

80/20 rule applied to maintenance: 20 % of failure modes cause 80 % of downtime. Identify those modes first.

For most water plants:
- Dosing-pump failures (chemistry stops)
- Filter underdrain damage (filter offline)
- Aeration blower issues (biology fails)
- pH probe drift (operating outside coag pH window)

Focusing PM effort on these 4 categories captures most reliability gain.

## RCA documentation

After major failure:
1. Capture facts immediately (photo, sample, data)
2. Quarantine evidence — don't repair / clean until evidence preserved
3. Convene RCA team (ops, maintenance, engineering)
4. 5-Why session (1–2 h)
5. Document findings + corrective + preventive actions
6. Track CAPA closure
7. Review at quarterly maintenance review

## Common RCA mistakes

- Stopping at first plausible cause
- Blaming "operator error" without asking why operator did that
- Not testing the conclusion (does the proposed fix actually prevent recurrence?)
- Not closing the loop — CAPA opened but not verified

_Source: Apollo Root Cause Analysis methodology; Six Sigma DMAIC._`,

  'c-eq-301/m3': `## Pre-built decision trees

For common faults, a decision tree gets the operator to root cause in minutes. Hadron Troubleshoot module has trees for the big-five plant faults:

### RO permeate TDS rising
- Q: Salt passage normalised? Yes/No
  - Yes → check feed-side concentration polarisation, check antiscalant, check feed-pump
  - No → membrane damage (oxidation, biofouling), inspect membrane stage by stage

### Cooling tower algae bloom
- Q: Sunlight + warmth + nutrient? Yes
- Q: Biocide dose adequate? Check log + ORP
  - No → boost biocide
  - Yes → check biocide effectiveness (resistance? rotation?)

### Dosing pump no output
- Q: Pump motor running?
  - No → power, control signal, motor failure
  - Yes → suction issue (gas-locked, empty tank, blocked strainer), discharge issue (blocked line), pump internal (diaphragm rupture)

### Chlorinator not dissolving tablets
- Q: Tablet quality OK?
  - No → reject batch
  - Yes → flow rate too low (fluidisation issue), water ageing, calcium buildup on basket

### Coag floc carry-over
- Q: pH in coag window?
  - No → adjust pH
  - Yes → dose too low / too high (re-jar), turbulence at clarifier inlet (baffling), sludge wasting overdue

## How operators use trees

The decision tree is visible in the Hadron Troubleshoot app. When a fault occurs:
1. Open Troubleshoot, select the fault
2. Walk the questions in order
3. Capture observations along the way
4. Reach root cause in 5–10 minutes
5. Apply documented fix

If the tree leads nowhere (root cause not in tree) → flag for engineer review and add new branch to tree.

## Continuously evolving

Each new RCA closes a fault → update the relevant tree with the new branch. Over years, trees become institutional knowledge.

_Source: Hadron Troubleshoot module; WRC Handbook Ch C3 (operational trouble-shooting)._`,

  'c-eq-301/m4': `## Writing a CAPA that survives audit

A good CAPA report is short, specific, and traceable. Sections:

### Problem statement
What happened, when, where, how detected.

> Example: "On 14 Mar 2024 at 14:30, free chlorine residual at distribution exit dropped to 0.05 mg/L (target 0.5 mg/L). Detected by online analyser. Re-sampled at 14:45, confirmed 0.07 mg/L. SANS 241 acute risk."

### Immediate action
What was done in the first hour.

> "Manually increased dose by 50 %. Notified plant manager and DWS regional office. Issued precautionary boil-water notice for affected zone. Re-sampled hourly until residual > 0.3 mg/L for 4 consecutive samples."

### Root cause
The 5-Why result.

> "Calcium hypochlorite saturator clogged with calcium scale. Operator hadn't noted feed pressure dropping. Saturator clean SOP last performed 6 months prior; SOP frequency was monthly. SOP not on display."

### Corrective action (fix immediate)
Specific actions.

> "Saturator fully cleaned 14 Mar 2024. SOP frequency revised to monthly. SOP printed and posted on saturator door. Operator trained on the SOP."

### Preventive action (stop recurrence)
Systemic changes.

> "Pressure trend on saturator added to operator daily walk-down. Alarm threshold of 4 bar feed-pressure increase configured. Calcium hardness in saturator water added to monthly test list."

### Verification
Confirmation it worked.

> "Saturator pressure stable 0.5–1 bar over 4 weeks. No further chlorine residual NCs. Boil-water notice lifted on 18 Mar after 4 days of in-spec residual."

### Closure
Date + responsible person.

## CAPA review

Quarterly: review all open CAPAs. If any has been open > 90 days without progress, escalate. Audit pulls open CAPAs first.

_Source: ISO 9001 § 10.2; FDA 21 CFR Part 820 §820.100._`,

  /* ════════════════════════════════════════════════════════════════
     TRACK 9 — OPERATIONS & SAFETY
     ════════════════════════════════════════════════════════════════ */

  /* ───── OPS-101 — Plant Operations Fundamentals ───── */

  'c-ops-101/m1': `## Pre-shift, mid-shift, post-shift

Every shift follows a discipline:

### Pre-shift (15 min)
- Walk the plant — visual + auditory + olfactory
- Read SCADA / control-room overview
- Review hand-over notes from previous shift
- Confirm chemistry tanks have stock, dosing pumps running
- Note any open NCs / CAPAs you might inherit

### Mid-shift
- Process sample round (turbidity, residual Cl, pH at multiple points)
- Log readings + alarms
- Trim chemistry as needed
- Respond to unusual readings

### Post-shift / hand-over (15 min)
- Update logbook with all events
- Brief incoming shift in person if possible
- Counter-sign hand-over with incoming operator
- Highlight anything pending action

## The pre-shift walk-down

Standard SA municipal works walk-down:

1. Raw water inlet — visible turbidity, smell, debris on screens
2. Coagulant tanks — level, no leaks, pump operating
3. Flocculator — gentle mixing, floc forming
4. Clarifier — sludge depth, no carry-over, weirs even
5. Filter bank — head loss readings, turbidity per filter
6. Clear well — chlorine residual, level
7. Final pump — running, no abnormal sound
8. Chemical store — stocks adequate, bunds dry
9. Effluent / waste — flow normal, no spills

15–20 minutes for a small plant; 45–60 for a big one. Catches 80 % of problems before they become incidents.

## Why it matters

The plant talks to operators who listen. A drip from a flange tomorrow becomes a 3-day shutdown next month if ignored. The discipline of walking the plant builds the situational awareness that distinguishes a Class II operator from a Class IV.

_Source: WISA 2008 P112 — Plant Operations; WRC Handbook Ch C2._`,

  'c-ops-101/m2': `## Why the logbook is sacrosanct

A logbook is a legal record of plant operation. In court (and audit), it's the most credible source of what happened. Rules:

- Time-stamped entries — exact time of each event
- Pen, not pencil — never erasable
- Mistakes corrected with single line through, initialled
- Never tear out a page
- Sign every page
- Counter-sign at hand-over
- Pages numbered sequentially — missing page is suspicious

## What goes in

Every shift:
- Operator name + date + shift
- Plant flow + key readings (turbidity, residual Cl, pH)
- Settings changes (coagulant dose, blower output, etc.)
- Alarm events with time
- Sample collections
- Maintenance activities
- Visitors (regulator, supplier, contractor)
- Unusual events (storm, power-cut, equipment fault)

## What stays out

- Personal opinions ("Joe is incompetent")
- Speculation ("I think the dam is contaminated")
- Anything that's not a verified observation

Stick to facts.

## Counter-sign discipline

At hand-over:
- Incoming operator reads previous shift's notes
- Asks any clarifying questions
- Signs as having received hand-over
- Outgoing operator signs as having handed over

No counter-sign = no hand-over completed. Either party can refuse to sign if they disagree with the record (rare, but allowed).

## Digital logbooks

Modern plants use SCADA-integrated logging:
- Auto-records continuous data
- Operator adds free-text annotations
- Alarms time-stamped automatically
- Hand-over via electronic sign-off

Hadron Service Report tool acts as digital logbook.

_Source: WISA P112; SANAS R47 — Records and Documentation._`,

  'c-ops-101/m3': `## The escalation matrix

A clear-cut tiered list of who-to-call-when:

### Tier 1 — Internal supervision
**Trigger:** Process upset that can be fixed on shift (chemistry trim, filter early backwash, equipment minor fault).
**Action:** Operator handles, logs in book.

### Tier 2 — Plant manager
**Trigger:** Extended chemistry feed failure, exceedance of operational limit, equipment breakdown.
**Action:** Phone within 15 minutes. Manager decides escalation.

### Tier 3 — Engineer / specialist
**Trigger:** Engineering issue (pump failure, chemistry programme upset), recurring fault.
**Action:** Manager calls; can be next-business-day or immediate.

### Tier 4 — Regulator + public-health
**Trigger:** SANS 241 acute-health exceedance (E. coli, NO₃, microcystin), boil-water notice scenario, chemical spill, unsafe water leaving plant.
**Action:** Immediate. DWS regional office + provincial DoH within 1 hour. Boil-water notice within 24 hours.

## Escalation evidence

Bring data:
- Sample results with chain-of-custody
- SCADA trends covering the event
- Timeline of operator actions
- Photos / observations

Without evidence, the regulator's first action will be to demand it; meanwhile the public health risk increases.

## Public-health threshold

Acute-risk parameters demand zero-tolerance:
- E. coli > 0 cfu/100 mL
- NO₃ > 11 mg/L (as N)
- NO₂ > 0.9 mg/L
- Cyanide > 0.07 mg/L
- Microcystin > 1 µg/L

These trigger immediate action, regardless of magnitude. A single positive E. coli warrants escalation.

## Don't over- or under-call

Both equally dangerous. Plant manager who under-calls covers up; regulator finds out later, severe consequences. Operator who over-calls (every minor thing escalates) wastes resources and loses credibility.

Discipline: clear thresholds + documented decision = correct call.

_Source: SANS 241:2015 § 4 (action thresholds); DWS Drinking Water Management Ch 8._`,

  'c-ops-101/m4': `## The Hadron Service Report tool

Designed for the operator on a site visit. Captures everything in one form:

### Site details
- Site name, GPS, contact person
- Visit date / time / technician
- Reason (routine, incident, commissioning)

### Water readings
- pH, conductivity, ORP, residual Cl
- Tank levels, pump pressures
- Flow rates

### Actions taken
- Free-text description of what was done
- Chemicals dosed (product, qty, point of injection)
- Maintenance actions
- Compliance actions (sampling, calibration)

### Photos
- Site photos (snapshots from operator's phone)
- Equipment condition
- Issues to flag

### Sign-off
- Operator signature (digital)
- Client representative signature
- Date / time stamped

## The output

A branded Hadron PDF report:
- Cover with site + date
- Readings table
- Actions list
- Photos
- Signatures

Auto-saves to LIMS for audit trail. Email to client.

## Workflow

Service tech arrives at site → opens Hadron app on phone → presses + New Report → fills form during visit → captures GPS automatically → photos taken in-app → signatures captured → Generate PDF → emailed to client.

Total time: ~ 15 min beyond the actual technical work.

## Why it beats paper

- Legible (no handwriting interpretation)
- Searchable (LIMS database)
- Immediate (client gets PDF within hours)
- Backed up (cloud-based)
- Compliance-ready (timestamps, geolocation, immutable)

_Source: Hadron Service Report module._`,

  /* ───── OPS-201 — Chemical Handling & MSDS ───── */

  'c-ops-201/m1': `## The 16-section SDS (Safety Data Sheet)

GHS standardised the format globally:

1. Identification — product name, supplier, emergency phone
2. Hazard identification — pictograms, signal word, H-statements
3. Composition — chemical name, CAS, %
4. First-aid measures — eye, skin, ingestion, inhalation
5. Fire-fighting — extinguishing media, hazardous combustion
6. Accidental release — spill response
7. Handling and storage
8. Exposure controls / PPE — TLV, engineering controls, PPE specs
9. Physical and chemical properties — pH, density, solubility, etc.
10. Stability and reactivity — incompatibilities, decomposition
11. Toxicology — LD50, route-specific effects
12. Ecology — environmental fate
13. Disposal
14. Transport — UN number, packing group
15. Regulatory
16. Other (date, version, references)

## Pictograms

The standard GHS hazard pictograms:

- 💀 Skull (acute toxicity)
- 🧪 Test tube and hand (corrosion)
- 🔥 Flame (flammable)
- ⚠️ Health hazard (chronic toxicity)
- 🎈 Gas cylinder (gas under pressure)
- ❗ Exclamation (irritant)
- 🌳 Environment (aquatic toxicity)
- 💥 Bomb (explosive)
- ⭕ Flame over circle (oxidiser)

## H-statements vs P-statements

- **H-statements** = Hazard ("H314 Causes severe skin burns and eye damage")
- **P-statements** = Precaution ("P280 Wear protective gloves/protective clothing/eye protection")

Read both. Hazards tell you what can happen; precautions tell you what to do.

## Why operators must read the SDS

- New chemical arrives — read SDS first
- Spill response procedure — section 6
- PPE selection — section 8
- Fire emergency — section 5

The SDS is the most accessible, authoritative source. Hadron LIMS Documents holds all SDSes per chemical.

_Source: GHS rev 7 (2017); SANS 10234:2008 (GHS adoption)._`,

  'c-ops-201/m2': `## Acid handling (HCl, H₂SO₄, citric)

PPE:
- Butyl gloves (nitrile fails on prolonged exposure)
- Splash goggles (face shield for transfers)
- Apron / chemical splash suit
- Closed-toe boots

Fume hazard for HCl and H₂SO₄ — work in well-ventilated area. Always add acid TO water (not vice versa) to avoid violent exotherm.

## Caustic handling (NaOH, KOH)

PPE:
- Butyl or neoprene gloves
- Splash goggles (always)
- Long-sleeved chemical suit
- Apron for transfers

NaOH spills are slow-acting on skin (you don't immediately feel burn) but produce deep tissue damage. Wash any contact for 15 minutes minimum.

## Chlorine handling (Cl₂ gas, NaOCl, HTH)

For Cl₂ gas:
- SCBA (self-contained breathing apparatus) for any work near cylinders
- Butyl gloves + chemical suit
- Buddy system mandatory

For NaOCl liquid:
- Nitrile / butyl gloves
- Splash goggles
- Apron — bleach destroys clothes

For HTH solid:
- N95 mask for dust during decanting
- Goggles
- Gloves

Critical: HTH + acid produce Cl₂ gas. Never mix.

## Solvent handling (cleaning agents, polymer carriers)

Most polymer makeups use a hydrocarbon carrier. PPE:
- Nitrile gloves
- Goggles
- Vapour mask if confined

Flammable; bond + ground for transfers.

## General principles

- Always know the chemical before opening the drum
- Never decant alone (buddy system)
- Eye-wash + safety shower within 10 m of every chemical handling station
- First-aid kit + SDS at every transfer point
- After-hours visits: full PPE always (no shortcuts when alone)

_Source: SDSes for HCl, NaOH, NaOCl, HTH, Cl₂; OHS Act § 11; Hadron MSDS Library._`,

  'c-ops-201/m3': `## A typical transfer scenario

Tanker delivers 5 m³ of 50 % NaOH. Operator must transfer to day tank without spilling, splashing, or hurting anyone.

## Pre-transfer checklist

1. Confirm chemical identity from delivery docs (right product, right strength)
2. Read SDS section 7 (handling)
3. Don PPE: butyl gloves, splash goggles, chemical apron, boots
4. Ensure eye-wash and safety shower available
5. Confirm receiving tank has capacity (level + space)
6. Check transfer hose: integrity, correct material (HDPE), correct fittings
7. Position spill containment (drip tray, spill pad, dyke)
8. Bond and earth the tanker + receiving tank (static buildup risk)
9. Notify control room

## During transfer

1. Open receiving tank vent (NaOH is hygroscopic; sealed tank pressurises)
2. Connect hose to tanker
3. Connect hose to receiving tank
4. Open valves slowly (no surge)
5. Monitor flow + level
6. If level rises faster than expected → leak somewhere; stop
7. Do not leave transfer unattended

## End of transfer

1. Close tanker valve
2. Drain hose into receiving tank
3. Close receiving valve
4. Flush hose with water (or appropriate flush) to drain
5. Disconnect, store hose
6. Close vent if pressure-rated; or leave open for non-pressurised tank
7. Clean up any drips on dyke
8. Sign delivery docs + log in book

## Lockout / Tagout (LOTO)

Where transfer requires equipment maintenance during the operation, lock out the equipment at its energy source:
- Disconnect electrical supply (lock + tag at MCC)
- Bleed pressure
- Tag the lock with operator's name + date
- Verify isolation by attempting to start

Re-energising requires the same operator to remove their lock, in person.

## Common mistakes

- Skipping bonding / earthing → static spark, fire/explosion (hydrocarbons + oxidisers)
- Mixing chemistry by transferring without flush
- Closing receiving valve before tanker valve → pressure buildup
- Walking away during transfer

_Source: SDS section 7; OHS Act § 19; Hadron Chemical Handling SOP._`,

  'c-ops-201/m4': `## Spill response framework

Same framework regardless of chemical:

### 1. Stop the source
- Close valve, plug drum, right the tanker
- Without source isolation, every other action is firefighting

### 2. Contain
- Sand, vermiculite, spill pads, portable dyke
- Stop spread to drains, sewers, surface water

### 3. Neutralise / absorb
- Acid spill → soda ash, lime
- Caustic spill → diluted citric acid or vinegar
- Solvent spill → vermiculite or proprietary absorbent

### 4. Collect
- Solid absorbent into drums
- Liquid via pump or vacuum
- Label drums with date + chemical

### 5. Decontaminate
- Wash spill area with water (final)
- Test pH or residual chemistry
- Document

### 6. Disposal
- Per chemical waste classification
- Hazardous waste manifest if applicable
- Vendor accepts back the recovered material in some cases

### 7. Report
- Internal: manager, OHS officer
- External: regulator (NEMA Section 30 within 24 h for major incidents)
- Document: incident report, RCA, CAPA

## Chlorine release special procedure

1. Sound alarm — evacuate immediately
2. Identify upwind position
3. Don PPE (SCBA only) before re-entry
4. Use ammonia rag to confirm vapour direction
5. Stop or contain leak (only with SCBA)
6. Ventilate / scrub
7. Notify regulator + emergency services

Never approach a chlorine leak without SCBA.

## Spill kit contents

Standard kit per chemical area:
- Absorbent material (vermiculite or specific to chemistry)
- Containment dykes (rigid plastic / inflatable)
- Plastic drums + labels
- PPE (gloves, apron, goggles, mask)
- pH indicator + neutralisation chemicals
- First-aid kit
- Emergency contact list

Annually: inspect, replace expired items, train staff on use.

_Source: NEMA Section 30; OHS Act; Hadron Spill Response Library._`,

  /* ───── OPS-202 — Sampling Best Practice & QMS ───── */

  'c-ops-202/m1': `## The four enemies of a good sample

A sample is supposed to represent the bulk water. Four things compromise that:

### Contamination
External substances enter the sample bottle:
- Dirty bottle (re-used without proper clean)
- Hands touching neck of bottle
- Sampling station leaching plasticiser
- Airborne particulates settling during collection

### Change
Composition shifts after sampling:
- Volatiles escape (Cl₂, THM, sulfide)
- pH drifts (CO₂ uptake / loss)
- Bacteria grow (or die)
- Chemical reactions continue

### Loss
Substances disappear:
- Adsorbing onto bottle wall (Hg on glass)
- Settling out (solids)
- Volatilising

### Mixing
Sample doesn't represent its source:
- Stagnant water in plumbing flushes into sample
- Composite samples bias to time of collection
- Bottle inverted, mixing layers

## Bottle pre-cleaning

Standard:
- New bottles: rinse 3× with sample water before fill
- Re-used bottles: detergent wash + acid rinse + DI rinse + drying + storage in clean bag
- Microbiology: autoclaved sterile + thiosulfate (chlorine neutraliser)
- Trace metals: acid-rinsed, plastic only (glass leaches)

## Preservatives

Per analyte:
- pH, conductivity, alkalinity — none, immediate analysis
- Metals — HNO₃ to pH 2, room temp
- COD, total organic — H₂SO₄ to pH 2, refrigerate
- BOD — none, refrigerate, analyse 48 h
- Microbiology — sodium thiosulfate (dechlorinates), refrigerate
- THMs / VOCs — fill no headspace, sodium thiosulfate, dichlorinate

## Hold time / cool chain

| Analyte | Max hold |
|---|---|
| pH, residual Cl | 15 min |
| BOD | 48 h |
| COD | 7 d |
| Metals | 6 mo |
| Microbiology | 24 h |
| THMs | 14 d |

Refrigerate to 4 °C immediately. Carry samples in cooler with ice packs; verify temperature on receipt at lab.

_Source: APHA Standard Methods Pt 1060; SANS 241-2; SANAS R47._`,

  'c-ops-202/m2': `## What a CoC form does

A Chain-of-Custody form proves the sample's integrity from collection to result. Its job: any link in the chain who handled the sample is identified.

## Required fields

### Sampling event
- Date, time
- Location (GPS or descriptive)
- Sampler (printed name + signature)
- Sample IDs (barcodes)
- Sample type (raw, treated, distribution, effluent)

### Sample details
- Container type (HDPE, glass, sterile)
- Preservative added
- Volume
- Field readings (pH, residual Cl at sampling)

### Analysis requested
- Per sample: list of tests
- Method codes
- Lab name (if external)

### Custody log
- Each handler: name, signature, date, time
- Each transfer: from / to
- Any storage events (e.g., overnight in laboratory fridge)

## Tamper-evident seals

For high-stakes samples (compliance, dispute):
- Heat-shrink tamper seal over bottle neck
- Cable-tie + numbered tag through carrier handle
- Unbroken seal on receipt = sample authentic

## LIMS booking-in

Sample arrives at lab:
- Scan barcode → matched to CoC entry
- Verify temperature on receipt (cold chain)
- Note any non-conformance (broken seal, late arrival, leaking)
- Assign to analyst
- Status = received in LIMS

## Common mistakes

- Field readings not on CoC
- Sampler not signed
- Lab receipt not signed
- CoC photocopy survives but original lost
- Multiple samples on one CoC without unique IDs

## When CoC matters most

- Regulatory dispute
- Court evidence
- Public-health investigation
- ISO 17025 audit

A weak CoC = the result is contestable.

_Source: SANAS R47; ISO 17025 § 7.4._`,

  'c-ops-202/m3': `## ISO 17025 sampling clauses

ISO/IEC 17025:2017 covers sampling in three clauses:

### § 7.3 Sampling

If the lab does sampling:
- Has a sampling plan that addresses sample type, sample size, sampling frequency, statistical considerations
- Documented sampling method
- Trained samplers (records on file)

### § 7.4 Sample handling

- Avoid contamination, deterioration, loss
- Documented procedures for receipt, retention, disposal
- Conditions controlled (T, light, humidity)
- Identification system that prevents confusion

### § 7.7 Reporting

- Sampling deviations from plan must be documented
- Any factors that influenced result (sample condition, sampling method) reported
- Results traceable to sampling event

## Sampling plan validation

Critical for compliance. The sampling plan must:
- Be documented (written, version-controlled)
- Be technically defensible (sample size, location, frequency justified)
- Be statistically representative (covers spatial + temporal variation)
- Be reviewed periodically (annually or on operational change)

## Documented method

Step-by-step:
- Pre-sample preparation (bottle, preservative, equipment)
- Sampling location identification
- Field readings to record
- Sample collection technique (grab vs composite, how to fill bottle)
- Preservation and transport
- Receipt at lab

The method is referenced on each CoC. Auditors verify the method matches what was actually done.

## Uncertainty contribution from sampling

Total measurement uncertainty = lab uncertainty + sampling uncertainty.

Sampling can dominate:
- Spatial heterogeneity in distribution network → 20–50 % uncertainty
- Temporal variation → composite vs grab differences
- Operator-to-operator variation → typically < 10 %

ISO 17025 requires uncertainty estimation; sampling uncertainty is often the missing piece.

## Audit defence

When auditor asks "show me your sampling procedure":
- Pull current sampling plan
- Pull a recent sample's CoC matching the plan
- Show training records of the sampler
- Show uncertainty calculation including sampling

If any link is missing, the sampling result is contestable.

_Source: ISO/IEC 17025:2017 § 7.3, 7.4, 7.7; SANAS R47._`,

  /* ───── OPS-301 — Emergency Response & Incident Management ───── */

  'c-ops-301/m1': `## Boil-water notice (BWN)

The strongest public-health intervention a water utility can issue. Tells consumers: assume water is unsafe; boil for 1 min before drinking, brushing teeth, food prep.

## Trigger thresholds

A BWN should be considered when:
- E. coli detected in distribution water
- Coliforms in distribution + history of recent operational issues
- Loss of disinfection residual (< 0.1 mg/L) at distribution point
- Catastrophic equipment failure (filter breakthrough, treatment plant offline)
- Cross-connection / back-siphonage event suspected
- Sustained turbidity > 1 NTU at finished water (Crypto risk)

## Public-health authority coordination

A BWN is not solely the utility's call. Coordinate with:
- DWS regional office (regulator)
- Provincial Department of Health (public-health authority)
- Local emergency services (large-scale public communication)

Some utilities have pre-approved BWN scripts and authority to issue immediately; others must consult first. Know your authority before the incident.

## Communication channels

- SMS to subscribers
- Local radio + TV
- Social media + website
- Door-to-door for elderly / vulnerable areas
- Notice at major distribution points + clinics

## Lift criteria

A BWN is lifted when:
- Source of contamination identified and corrected
- 3+ consecutive samples showing absence of E. coli
- Disinfection residual restored network-wide
- Public-health authority concurs

Document everything: the trigger, communication times, sample results, lift decision.

## Cost of BWN

A BWN costs:
- Direct: communication + extra sampling
- Indirect: lost public confidence (months to recover)
- Liability: legal exposure if issued late or missed

But the cost of NOT issuing when needed is enormous — outbreak, deaths, criminal liability.

_Source: DWS Drinking Water Management Ch 8; WHO WSP Module 5._`,

  'c-ops-301/m2': `## What a T&O event looks like

Customer complaints flood in: "the water tastes like dirt", "smells like a swimming pool", "metallic". Three common causes:

### Algae bloom (geosmin / MIB)
Eutrophic dam, summer warming, blue-green algae bloom. Geosmin (earthy) and 2-methyl-isoborneol (MIB, musty) are released into water.

### Chlorination of NOM
High NOM + free Cl produces chlorinous / swimming-pool taste. Especially at pH > 8 where chloramines form preferentially.

### Iron / manganese release
Network biofilm cleared by chlorination event releases accumulated Fe/Mn → metallic taste, brown / black discolouration.

## Response — algae bloom

1. Confirm source via lab analysis (geosmin / MIB, microcystin)
2. Increase pre-oxidation (KMnO₄ or O₃ if available)
3. Powdered activated carbon (PAC) at the head of the plant — 5–25 mg/L
4. If GAC tertiary present, replace if exhausted
5. Source-water management: aerate dam, control bloom

## Response — chloramination by-product

1. Lower chlorine dose
2. Verify pH at clear well (< 8 ideal)
3. Consider switch to ClO₂ or chloramine
4. Check NOM levels (consider enhanced coagulation)

## Response — Fe/Mn

1. Sample distribution to confirm
2. Check on-line analysers at plant
3. Flush affected mains (high-velocity)
4. Investigate at-source if recurring
5. Customer compensation / notification

## Communication

- Acknowledge complaints rapidly (within hours)
- Investigate; communicate findings
- Plan timeline for resolution
- If health risk possible (cyanotoxin), trigger BWN

## Documentation

Every T&O event:
- Capture in LIMS as NC
- Root-cause analysis
- Corrective + preventive action
- Closure with verification samples

Recurring events become CAPA themes — drive permanent solutions (source-water management, GAC tertiary).

_Source: DWS Drinking Water Management Ch 9; AWWA M57 — Algae and Cyanotoxins._`,

  'c-ops-301/m3': `## Single source of truth

During an incident:
- One spokesperson (chief executive, plant manager, communications officer)
- One agreed message
- Agreed channels (SMS, radio, social media, website)
- Agreed lift criteria

Multiple voices = mixed messages = panic + lawsuits.

## Plain-language briefings

Avoid jargon. The public doesn't know what "free chlorine residual" means. Translate:

- "We had a problem with the chlorine pump. Your water might not have been disinfected for 2 hours. We've fixed it. Boil your water for 1 minute before drinking, just to be safe. We'll tell you when it's safe again."

- Not: "Disinfection failure resulted in non-compliance with SANS 241 acute-health limits."

## Daily updates rule

Once an incident is communicated, daily updates until resolved:
- Same time each day
- Same channels
- Even if there's no progress ("we're still working on it; next update tomorrow at 17:00")

Silence breeds rumours. Daily updates build trust.

## Media coordination

- Designate one media spokesperson
- Brief politicians / ward councillors before public announcement
- Avoid speculation
- Get the technical right before the press conference

## Post-incident review

After the incident:
- Public-thank-you to staff who worked through it
- Public-explanation of what happened and the long-term fix
- Regulatory notifications closed
- Internal RCA + CAPA

Public confidence rebuilds slowly. Honest, timely communication during the incident accelerates that recovery.

## Examples

Cape Town's "Day Zero" 2017–18 communication was textbook: daily updates, clear water-saving measures, transparency about dam levels. By contrast, several SA towns have lost public trust through silence during plant failures.

_Source: WHO Pandemic Communication Guidelines (general); Cape Town drought communication case-study._`,

  /* ════════════════════════════════════════════════════════════════
     TRACK 10 — WATER CHEMISTRY FOUNDATIONS
     ════════════════════════════════════════════════════════════════ */

  /* ───── CHEM-101 — Inorganic Chemistry Basics ───── */

  'c-chem-101/m1': `## Atoms, moles and Avogadro

Every chemical reaction is a counting exercise. The mole (mol) is chemistry's "dozen": 6.022 × 10²³ particles.

  1 mol of any element = atomic mass in grams

So 1 mol of Na = 23 g; 1 mol of Cl = 35.45 g; 1 mol of NaCl = 58.45 g.

For water treatment, mole-thinking matters because:
- Stoichiometry (acid + base) requires mole ratios
- Concentration units convert via molar mass
- Equivalents (eq/L) need valence

## Cations vs anions

- **Cations** — positively charged. In water: Na⁺, K⁺, Ca²⁺, Mg²⁺, NH₄⁺, Fe²⁺, Mn²⁺, H⁺
- **Anions** — negatively charged. In water: Cl⁻, SO₄²⁻, HCO₃⁻, NO₃⁻, NO₂⁻, OH⁻, F⁻, CO₃²⁻

A water sample with 100 mg/L Ca, 25 mg/L Mg, 50 mg/L Na, 20 mg/L SO₄, 50 mg/L Cl, 250 mg/L HCO₃ — at first glance just numbers. Convert to meq/L (concentration ÷ equivalent weight) and verify:

  meq cations = meq anions

If they don't balance ± 5 %, sample analysis is wrong. Operators rarely get this wrong; lab errors do.

## Activity vs concentration

In dilute fresh water, _concentration_ ≈ _activity_. In high-TDS water (cooling water, RO concentrate, seawater), the actual chemical "thermodynamic" activity is lower than the concentration suggests, because of ion-shielding.

For most water-treatment calcs in fresh water, use concentration. For high-TDS work, use activity coefficient corrections (Debye-Hückel approximation).

## The periodic table's relevant cells

Most water-treatment chemistry involves:
- H, O, N (water + nutrients)
- Ca, Mg (hardness)
- Na, K (alkalinity contributors)
- Cl, S (anions, oxidation states)
- Fe, Mn (oxidisable metals)
- C (alkalinity / NOM)

You don't need to memorise the whole table — just the chemistry that affects water.

_Source: WRC Handbook Ch A3; Stumm & Morgan — _Aquatic Chemistry__.`,

  'c-chem-101/m2': `## mg/L = ppm (in water)

For dilute aqueous solutions, mg/L ≈ ppm (mass/mass) because water density is 1 kg/L.

This breaks down at high concentration; for 100 g/L solutions, mass-mass and mass-volume diverge. For most water-treatment work, just use mg/L.

## Molarity (M)

  M = mol/L = (mg/L) / (molar mass)

Example: 35 mg/L NaCl = 35 / 58.45 = 0.60 mmol/L = 0.60 × 10⁻³ M.

Useful when you need stoichiometric reasoning (acid-base, oxidation-reduction).

## Equivalents (eq/L)

  eq/L = (mg/L) / (equivalent weight) = M × valence

Equivalent weight = molar mass / valence.

For Ca²⁺: equivalent weight = 40 / 2 = 20. So 80 mg/L Ca²⁺ = 4 meq/L = 2 mmol/L.

Equivalents are the natural unit for ion-exchange capacity, alkalinity titration, and acid-base calcs.

## Percent (% w/v)

  % w/v = g per 100 mL = 10 × g/L = 10 000 × mg/L (approximately)

So 32 % HCl is 320 g/L (approximately, allowing for density).

For a 32 % HCl, density 1.16 kg/L, the active mass is:
  1.16 × 0.32 × 1000 = 371 g/L active HCl
  371 / 36.5 = 10.2 M

## Conversions in practice

Use the Hadron Unit Converter calc to switch between:
- Molarity (M) ↔ ppm (mg/L)
- Normality (N = eq/L) ↔ ppm
- % w/v ↔ ppm

Example: HCl 32 % at density 1.16 → 371 000 mg/L → 10.2 M → 10.2 N (HCl monoprotic).

## Mistakes to avoid

- Forgetting molar mass when converting M to mg/L
- Using mg/L of HCl as "32 mg/L" when product is 32 % (3 orders of magnitude wrong)
- Conflating moles and equivalents for divalent species

_Source: WRC Handbook Ch A3; Hadron Unit Converter calc._`,

  'c-chem-101/m3': `## Major ions in natural waters

Typical SA municipal water profile:

| Ion | Range (mg/L) | Note |
|---|---|---|
| Ca²⁺ | 30–120 | Hardness contributor |
| Mg²⁺ | 5–30 | Hardness contributor |
| Na⁺ | 20–80 | Aesthetic at high level |
| K⁺ | 1–10 | Usually minor |
| HCO₃⁻ | 100–250 | Alkalinity dominant |
| Cl⁻ | 30–100 | Aesthetic at > 300 |
| SO₄²⁻ | 30–100 | Aesthetic at > 250 |
| NO₃⁻ | 0.5–10 | Health if > 11 |

These are the "major-ion" set that defines water character.

## Cation–anion balance

Sum of meq of cations should equal sum of meq of anions (electroneutrality):

  Ca²⁺/40 × 2 + Mg²⁺/24 × 2 + Na⁺/23 + K⁺/39 = HCO₃⁻/61 + Cl⁻/35.45 + SO₄²⁻/48 × 2 + NO₃⁻/62

(Each ion's mg/L divided by its molar mass × valence.)

If cation meq ≠ anion meq within ± 5 %, lab made an error or analysis is incomplete.

## TDS calculation from ions

  TDS (mg/L) = sum of major-ion concentrations + silica + minor

For most fresh waters: TDS ≈ 0.6 × EC (mS/m × 100). Cation-anion balance verifies the sum.

## Hardness — what it really is

Hardness = sum of multivalent cations expressed as CaCO₃:

  Hardness (mg/L as CaCO₃) = Ca²⁺/40 × 100 + Mg²⁺/24 × 100

Categories:
- < 75 mg/L: soft
- 75–150: moderately hard
- 150–300: hard
- > 300: very hard

## Alkalinity — distinct from pH

Alkalinity = capacity to neutralise acid:

  Total alkalinity (mg/L as CaCO₃) = HCO₃⁻ + 2·CO₃²⁻ + OH⁻ (each in mmol/L) × 50

Most natural water alkalinity is HCO₃⁻. Higher pH waters get CO₃²⁻ contribution.

A water with pH 8.3, alkalinity 200, hardness 150 is well-buffered — adding acid to it produces only modest pH change.

_Source: WRC Handbook Ch A3; Stumm & Morgan Ch 4._`,

  'c-chem-101/m4': `## Real-life conversions

Five exercises operators do every week:

### 1. HCl 32 % to molarity
- Product: 32 % w/w, density 1.16 kg/L
- Active mass per L = 1.16 × 0.32 × 1000 = 371 g/L
- Molar mass HCl = 36.5
- Molarity = 371 / 36.5 = 10.2 M

### 2. Lime kg/day from acid mg/L
- Plant flow: 5 ML/d
- Acid demand (as CaCO₃ equivalent): 50 mg/L
- Daily acid load = 5 000 × 50 = 250 000 g = 250 kg/d as CaCO₃
- Convert to Ca(OH)₂ neutraliser: equivalent weight Ca(OH)₂ = 37; CaCO₃ = 50
- Ratio: 37/50 = 0.74
- Ca(OH)₂ daily = 250 × 0.74 = 185 kg/d
- Adjust for product purity (e.g., 90 %): 185 / 0.9 = 206 kg/d

### 3. TDS estimate from EC
- EC: 80 mS/m at 25 °C
- TDS factor 0.6 (fresh water): TDS = 0.6 × 800 = 480 mg/L
- Confirm with ion balance if available

### 4. Alkalinity to pH change
- Add 50 mg/L HCl as CaCO₃ to water with alk 200, pH 8.0
- Net alkalinity post-acid = 150 mg/L
- Approximate post-pH = 7.4–7.6 (carbonate buffer)
- Use Hadron LSI calc for accurate computation

### 5. Polymer dose
- Polymer 1 % w/v stock, density 1.05
- Required field dose: 0.5 mg/L
- Plant flow: 100 m³/h
- Daily mass = 100 × 24 × 0.5 = 1 200 g/d active
- Daily volume of stock = 1 200 / 10 g/L = 120 L/d
- Hourly = 5 L/h pump rate

## Practice habits

Do conversions every shift. The Hadron Unit Converter calc is your friend, but understand the maths underneath. Operators who can't convert without the calc are vulnerable when the calc isn't available.

_Source: WRC Handbook end-of-chapter exercises; Hadron Unit Converter Calc._`,

  /* ───── CHEM-102 — pH, Alkalinity & Hardness ───── */

  'c-chem-102/m1': `## pH in depth

pH is defined as:

  pH = −log a(H⁺)

where a(H⁺) is the _activity_ of H⁺ (close to concentration in dilute solution). Range 0–14:

- pH 0 = 1 M H⁺ (strong acid)
- pH 7 = 10⁻⁷ M H⁺ (neutral, pure water)
- pH 14 = 10⁻¹⁴ M H⁺ (strong base)

Each unit is 10× stronger. pH 5 is 100× more acidic than pH 7.

## Activity and ionic strength

In dilute fresh water, activity ≈ concentration. In high-TDS:
- Activity coefficient < 1
- True activity is lower than concentration measurement
- pH meter reads activity; chemistry uses activity

For routine water work in TDS < 1 000 mg/L, ignore the difference. For RO concentrate, brine, cooling water at high cycles, apply Debye-Hückel correction (or use specialised software).

## Buffer capacity (β)

A buffer resists pH change when acid or base is added. Quantified as:

  β = dC_acid / dpH

The change in acid (mol/L) per unit pH change. Higher β = more buffering.

In water treatment:
- Carbonate system (HCO₃⁻ ⇌ CO₃²⁻) is the natural buffer
- Maximum β at pH = pKa (≈ 6.4 for HCO₃⁻ → CO₃²⁻ around pH 6.4)
- At alkalinity 100–200 mg/L as CaCO₃, β is significant — adding 10 mg/L HCl barely shifts pH

## pH vs acidity (titratable acidity)

- **pH** — instantaneous H⁺ activity
- **Acidity** — how much OH⁻ you need to neutralise

Two waters can have the same pH but very different titratable acidity if they have different alkalinity. This matters for boilers (where carry-over of CO₂ acidity can corrode condensate piping despite "neutral" pH at production).

## Practical implications

- pH alone tells you nothing about how a water will behave when chemistry is added
- Always know alkalinity and hardness alongside pH
- Buffer capacity dictates how much acid / base you need to dose

_Source: Stumm & Morgan Ch 3; APHA Standard Methods._`,

  'c-chem-102/m2': `## Alkalinity is not pH

A water at pH 7.0 with alkalinity 300 mg/L is _strongly buffered_; adding 50 mg/L HCl drops pH to ~ 6.5. A water at pH 7.0 with alkalinity 30 mg/L is poorly buffered; adding 5 mg/L HCl drops pH to 5.5.

Alkalinity is the capacity, pH is the state.

## Total alkalinity = sum of acid-neutralising species

  Total alk (mg/L as CaCO₃) = (HCO₃⁻ + 2·CO₃²⁻ + OH⁻) × 50 / 1000 × 1000
                             = (HCO₃⁻ in mmol/L + 2·CO₃²⁻ + OH⁻) × 50

Most natural fresh water:
- pH < 8.3: alkalinity = HCO₃⁻
- pH 8.3–10: HCO₃⁻ + CO₃²⁻
- pH > 10: HCO₃⁻ + CO₃²⁻ + OH⁻

## Phenolphthalein vs total alkalinity

Two-stage titration:
- Phenolphthalein alkalinity (P) = endpoint at pH 8.3 (corresponds to OH⁻ + ½ CO₃²⁻)
- Methyl-orange alkalinity (M) = endpoint at pH 4.5 (corresponds to total alkalinity = OH⁻ + CO₃²⁻ + HCO₃⁻)

Compare P and M to determine ratio:

| Relationship | Meaning |
|---|---|
| P = 0 | Only HCO₃⁻ |
| 2P < M | HCO₃⁻ + CO₃²⁻ |
| 2P = M | Only CO₃²⁻ |
| 2P > M | OH⁻ + CO₃²⁻ |
| P = M | Only OH⁻ |

This is the classic "Walker test" pattern — useful for diagnosing pH > 8.3 conditions.

## Carbonate-bicarbonate-hydroxide split

For boilers, pool water and high-pH systems, knowing the split matters because OH⁻ alkalinity is corrosive in boilers (caustic gouging) and scaling in pools.

Most fresh water at pH 7.5–8.3 is essentially all HCO₃⁻; that's the simple case.

_Source: APHA 2320; WRC Handbook Ch A3._`,

  'c-chem-102/m3': `## What hardness is

Hardness is the sum of multivalent cations expressed as CaCO₃ equivalents:

  Total hardness = Ca²⁺ + Mg²⁺ (in CaCO₃ units)

In some natural waters, Sr²⁺, Ba²⁺ contribute too, but Ca + Mg dominate.

## Ca / Mg / total split

Ca and Mg can be measured separately:

- **Total hardness** by EDTA at pH 10 (Eriochrome Black T indicator)
- **Ca hardness** by EDTA at pH 12 (Mg precipitates out, Murexide indicator)
- **Mg hardness** = total − Ca

Ratio Ca:Mg in SA waters typically 1.5:1 to 4:1 depending on geology.

## Carbonate vs non-carbonate hardness

- **Carbonate hardness** = the portion of hardness associated with HCO₃⁻ alkalinity. Removed by boiling (CaCO₃ precipitates).
- **Non-carbonate hardness** = associated with Cl⁻, SO₄²⁻. Doesn't go away with boiling.

  Non-carbonate hardness = Total hardness − Total alkalinity (when both expressed as CaCO₃, and hardness > alkalinity)

If alkalinity > hardness, all hardness is carbonate.

## EDTA titration

The standard hardness test:
- Buffer to pH 10 (ammonium hydroxide buffer)
- Add Eriochrome Black T indicator (red in presence of Ca/Mg, blue when removed)
- Titrate with 0.01 M EDTA until colour changes red → blue
- mL EDTA × 1 000 / sample volume = mg/L as CaCO₃

## Hardness categories (SANS 241)

- < 75 mg/L: soft (poor lather, geyser-friendly)
- 75–150: moderately hard
- 150–300: hard (typical SA municipal)
- > 300: very hard (geyser scale, soap waste, washing complaints)

## Why operators care

- Boilers: hardness must approach zero in feedwater
- Cooling water: cycle limit set by hardness × alkalinity (LSI)
- Drinking water: aesthetic threshold 150–300 mg/L
- Reverse osmosis: scaling potential set by hardness in concentrate

_Source: APHA 2340; WRC Handbook Ch A3._`,

  'c-chem-102/m4': `## Putting it together — LSI

The Langelier Saturation Index integrates pH, alkalinity, hardness, temperature and TDS into a single scaling-corrosion indicator:

  LSI = pH_actual − pH_saturated

where pH_saturated is the pH at which CaCO₃ would precipitate at given Ca, alkalinity, T, TDS:

  pH_s ≈ 9.3 + (Ca log term) + (alkalinity log term) + (T term) + (TDS term)

Hadron LSI calc does the calculation. You provide:
- pH
- Temperature (°C)
- Calcium hardness (mg/L as CaCO₃)
- Total alkalinity (mg/L as CaCO₃)
- Total dissolved solids (mg/L)

Output: LSI value.

## Reading the LSI

| LSI | Meaning |
|---|---|
| < −2 | Strongly corrosive — pipes dissolve |
| −1 to −2 | Mildly corrosive |
| −0.3 to +0.3 | Balanced |
| +1 to +2 | Mildly scaling |
| > +2 | Strongly scaling |

Most municipal water targets ± 0.3.

## Practical use

For a cooling tower at 5 cycles:
- Make-up water LSI: −0.5 (corrosive)
- Concentration ×5 → LSI rises to +1.5 (mildly scaling)
- With phosphonate antiscalant: holds in suspension, no actual scale

For a borehole supplying RO:
- Raw LSI +0.8 (scaling risk)
- After acid feed for pre-treatment: LSI 0 (balanced)
- Concentrate at 75 % recovery: LSI back to +1.5 (antiscalant essential)

## RSI (Ryznar Stability Index)

  RSI = 2 × pH_s − pH_actual

Categories:
- < 4: heavy scale
- 4–5: moderate scale
- 5–6: balanced
- 6–7: corrosive
- > 7: heavy corrosion

LSI and RSI agree on direction (scaling vs corroding) but RSI gives a more interpretable number for pipe-system design.

## Use case

Whenever a calculation involves cycling, mixing, or temperature-change-with-stable-chemistry, run LSI. The Hadron LSI calc is the fastest way to predict whether your chemistry stays stable, scales, or corrodes.

_Source: Langelier 1936; Hadron LSI Calc; Nalco Water Handbook Ch 2._`,

  /* ───── CHEM-201 — Solubility, Saturation & LSI ───── */

  'c-chem-201/m1': `## Solubility product (Ksp)

For an ionic solid M_a A_b in water:

  M_a A_b ⇌ a M⁺ + b A⁻
  Ksp = [M⁺]^a × [A⁻]^b

Example: CaCO₃ → Ca²⁺ + CO₃²⁻; Ksp ≈ 4.5 × 10⁻⁹.

If [Ca²⁺] × [CO₃²⁻] < Ksp, the solid dissolves. If > Ksp, the solid precipitates. If = Ksp, equilibrium.

## Ion product vs Ksp

The actual product of dissolved ion concentrations (ion product, IP) compared to Ksp:

- IP / Ksp = saturation index
- < 1: undersaturated
- = 1: saturated
- > 1: supersaturated (precipitate forms)

LSI is essentially this comparison expressed as log:

  LSI = log(IP / Ksp_eff)

## Common-ion effect

Adding a common ion suppresses solubility. Example: adding more Ca²⁺ to water saturated with CaCO₃ shifts equilibrium toward precipitation.

In cooling water at 5× cycles, both Ca²⁺ and CO₃²⁻ have concentrated 5× → IP grows as the square (25×) → far more supersaturated than at 1×.

## Activity correction

In high-TDS water, true thermodynamic activity is lower than concentration:

  a_i = γ_i × C_i

where γ is activity coefficient (< 1 for high ionic strength).

For dilute fresh water, γ ≈ 1.0; for cooling water at 5× cycles, γ might be 0.6–0.7.

This is why high-TDS solubility indices (S&DSI, Stiff-Davis) replace the simple LSI in cooling and brine systems.

## Solubility limits in practice

| Salt | Ksp | Practical limit (mg/L) at 25 °C |
|---|---|---|
| CaCO₃ | 4.5 × 10⁻⁹ | 50–80 (LSI dependent) |
| CaSO₄·2H₂O | 4.9 × 10⁻⁵ | 2 100 |
| Mg(OH)₂ | 5.6 × 10⁻¹² | 1.4 (at pH 10) |
| BaSO₄ | 1.1 × 10⁻¹⁰ | 2.5 |
| SiO₂ | — | 150 |

The numbers shift with temperature — CaCO₃ becomes _less_ soluble at higher temperature (unusual for salts), which is why hot-water heaters scale.

_Source: Stumm & Morgan Ch 6; Snoeyink & Jenkins — _Water Chemistry__.`,

  'c-chem-201/m2': `## Indices side-by-side

Different applications need different indices:

### LSI (Langelier Saturation Index)
For fresh water with TDS < 500 mg/L. Predicts CaCO₃ scaling.
- LSI > 0: scaling
- LSI < 0: corrosive
- LSI ≈ 0: balanced

### RSI (Ryznar Stability Index)
Empirical, derived from LSI + plant experience:
  RSI = 2pH_s − pH

| RSI | Behaviour |
|---|---|
| < 5 | Heavy scale |
| 5–6 | Light scale |
| 6–7 | Balanced |
| 7–8 | Corrosive |
| > 8 | Strong corrosion |

### PSI (Puckorius Stability Index)
For cooling water specifically. Adjusts LSI for high-cycle effects:
  pH_eq = 1.465 × log(alk) + 4.54
  PSI = 2pH_s − pH_eq

PSI > 6 → corrosive; < 6 → scaling. Used in modern Nalco-style cooling water assessment.

### S&DSI (Stiff-Davis Stability Index)
For high-TDS water (> 4 000 mg/L), seawater, brine. Activity-coefficient corrected.

  S&DSI = pH − pH_s − activity_correction

### Larson-Skold Index
For pipe corrosion (not CaCO₃ scaling). Based on Cl⁻ + SO₄²⁻ vs HCO₃⁻ ratio. > 1.2 = aggressive.

## Picking the right one

| Application | Index |
|---|---|
| Drinking water | LSI |
| Cooling water | LSI + PSI |
| Boiler | not LSI (use phosphate-pH curve instead) |
| Seawater RO | S&DSI |
| Mining process water | Larson-Skold for pipes |

The Hadron LSI calc gives all four. Compare them; consistent direction = robust answer. Disagreement between indices = water is in a transition regime, dose carefully.

_Source: AWWA M58 — Internal Corrosion Control; Nalco Water Handbook Ch 2; Hadron LSI Calc._`,

  'c-chem-201/m3': `## A real cooling-water example

**Make-up water:**
- pH 7.4
- Ca 60 mg/L
- Mg 25 mg/L
- Total alkalinity 150 mg/L as CaCO₃
- TDS 350 mg/L
- T 25 °C

LSI at 1× cycle: −0.5 (mildly corrosive — needs corrosion inhibitor).

## At 3 cycles

- Ca → 180 mg/L
- Alk → 450 mg/L
- TDS → 1 050 mg/L
- pH (rises with alkalinity concentration) → ~ 8.0

LSI rises to about +0.8 (mildly scaling). Manageable with phosphonate.

## At 5 cycles

- Ca → 300 mg/L
- Alk → 750 mg/L
- TDS → 1 750 mg/L
- pH → ~ 8.3

LSI ~ +1.5 (scaling). Polymer programme essential. Some operators add acid feed (drop pH 0.3) to keep LSI < 1.

## At 8 cycles

- Ca → 480
- Alk → 1 200
- TDS → 2 800
- pH → ~ 8.5

LSI ~ +2.2 (heavy scale risk). Acid feed mandatory. Still risky for silica and CaSO₄.

## Polymer support strategy

At LSI < +1: phosphonate alone (HEDP, ATMP) — typical 5–15 mg/L
At LSI +1 to +2: phosphonate + polyacrylate (e.g. AA-AMPS) — 10–25 mg/L combined
At LSI > +2: aggressive blend + acid feed; consider higher cycles only with full-time chemistry monitoring

## Acid feed for cycle bump

Adding sulfuric acid (or HCl) reduces alkalinity 1:1 (as CaCO₃ equivalents), drops pH, and lowers LSI:
- Each 0.1 pH drop → 0.1 LSI drop
- Each 50 mg/L alkalinity reduction → ~ 0.2 LSI drop

A 4-cycle tower at LSI +1.5 can hold +0.5 LSI with 50 mg/L acid feed (as CaCO₃ equiv).

## Trade-off

Acid feed risks localised low pH (corrosion) if pump fails. Use:
- Two pH probes for redundancy
- Safety override on dose
- Backup dose system for critical operations

_Source: Hadron LSI / Cooling Tower calculators; Nalco Water Handbook Ch 18._`,

  /* ───── CHEM-202 — Microbiology Basics ───── */

  'c-chem-202/m1': `## Why coliforms ≠ pathogens

The original water-treatment microbiology was disease-focused — looking for cholera, typhoid, dysentery directly. But these pathogens are hard to detect (low numbers, specialised media, slow).

Coliforms — a much larger group of intestinal bacteria — are present in much higher numbers when faecal contamination occurs, and they're easy to grow on standard media. So the industry settled on coliforms as **indicators**: not the pathogens themselves, but a reliable warning sign.

## The coliform hierarchy

### Total coliforms (TC)
Lactose-fermenting Gram-negative rods. Includes _E. coli_, _Klebsiella_, _Citrobacter_, _Enterobacter_. Found everywhere — soil, plants, surface water, intestinal tract. Detection in finished water = "anything could be wrong" — broad indicator.

### Faecal coliforms (FC)
Sub-set of TC that grows at 44 °C (vs 35 °C TC). More specific to intestinal origin.

### E. coli
Sub-set of FC. Specific to mammalian / bird intestines. Detection = recent faecal contamination.

| Indicator | What it signals |
|---|---|
| TC > 10 cfu/100 mL | Treatment failure or distribution issue |
| FC present | Faecal contamination, recent or via warm-blooded source |
| E. coli present | Recent faecal contamination, public-health risk |

## Limitations of indicators

- Cryptosporidium, viruses, some pathogens don't correlate well with coliform numbers (more chlorine-resistant)
- Modern molecular tests (PCR, viability indicators) emerging but not yet standard
- "Indicator absence" doesn't guarantee "pathogen absence"

## When indicators are enough

For routine drinking-water monitoring, the indicator system works. For incident investigation, supplement with direct pathogen testing (if available).

## Recreational vs drinking water

For recreational water (pools, beaches), faecal coliform / Enterococcus thresholds are higher (e.g., 1 000 cfu/100 mL) reflecting different exposure routes. For drinking water, zero tolerance for E. coli.

_Source: APHA 9000-9999; SANS 241:2015 § 5; WHO Guidelines._`,

  'c-chem-202/m2': `## What HPC tells you

Heterotrophic Plate Count = total culturable aerobic and facultative anaerobic bacteria at standard incubation. Method APHA 9215, R2A medium, 7 days at 22 °C (or 30 °C).

## What HPC doesn't tell you

- Identity of bacteria (just total count)
- Pathogen presence (HPC organisms are mostly harmless saprophytes)
- Recent faecal contamination (better tracked by E. coli)

## Why operators care

HPC is the **trend** indicator. A water plant whose HPC is consistently below 100 cfu/mL has good biological control. A plant whose HPC drifts upward over months — say 100 → 500 → 1 500 — is biofilm-fouling somewhere.

SANS 241 limit: 1 000 cfu/mL. Many utilities target 100 or below.

## Causes of rising HPC

- Biofilm growth on pipework, tank walls
- Inadequate disinfection (residual too low, too short contact time)
- Contamination from pipe repair, tank cleaning
- Algae bloom releasing biodegradable carbon
- High TOC (organic carbon) feeding bacteria growth

## Reading HPC numbers

Single-event spikes are common (sample contamination, lab variability). Consistent rise over multiple months = real signal.

Track per location: source, post-coag, post-filter, clear well, distribution at 1 km, distribution at 50 km. Identify where HPC rises — that's where biofilm lives.

## What to do

- Boost residual chlorine where HPC rising
- Schedule reservoir / tank cleaning
- Investigate pipe biofilm with pigging or chemical clean
- Reduce TOC at source if possible

## R2A medium

R2A is "low-nutrient" medium — slow-growing oligotrophs (typical drinking-water bacteria) prefer it. Higher-nutrient media (e.g., plate count agar) underestimate HPC because oligotrophs don't grow well.

_Source: APHA 9215; SANS 241:2015 § 5; AWWA M48 — Water Quality Surveillance._`,

  'c-chem-202/m3': `## Legionella — the cooling-tower bacterium

_Legionella pneumophila_ causes Legionnaires' disease — pneumonia with 10–25 % mortality in untreated cases. The bacterium grows in warm water, especially in:
- Cooling towers (35–45 °C)
- Hot-water systems (35–55 °C)
- Spa and pool plumbing
- Decorative fountains

## Aerosol generation = transmission

Inhalation of small droplets (1–5 µm) carrying Legionella infects the alveoli. Cooling towers naturally generate aerosols via drift. Estimated infectious dose: < 100 cfu inhaled.

## High-risk zones

- 35 °C tower bath water
- Stagnant zones in piping
- Biofilm on tower fill
- Sediment at tank bottom
- Inactive piping after layoffs

## Risk assessment per OHS / SANS 893

SANS 893 (similar to UK HSE L8) requires:
- Annual written risk assessment
- Routine monitoring (Legionella culture or PCR, monthly to quarterly)
- Documented control programme
- Trained competent person
- Action plan if Legionella > thresholds

Action thresholds:
- < 100 cfu/L: routine monitoring continues
- 100–1 000 cfu/L: enhanced monitoring + biocide review
- 1 000–10 000 cfu/L: shock biocide + investigation
- > 10 000 cfu/L: shock biocide + immediate notification + suspect source

## Prevention

- Maintain free chlorine residual 0.5+ mg/L or equivalent biocide
- Eliminate stagnation (deadlegs, intermittent operation)
- Annual mechanical clean of cooling tower fill + basin
- Drift eliminator in good condition
- Monthly biocide rotation (oxidising + non-oxidising)
- Periodic shock chlorination (5–10 mg/L for 4 h)

## Outbreak history

Legionella outbreaks in SA have been associated with cooling towers in malls (Sandton 2011), hospitals (KZN 2018), and a tabakery in Cape Town. Each became a major public-health investigation; the affected cooling tower was decommissioned or rebuilt.

_Source: SANS 893; OHS Act § 11; HSE L8 ACoP (UK)._`,

  'c-chem-202/m4': `## How an MPN report looks

For Total Coliforms or E. coli, a typical SANS 241 report includes:

| Sample ID | Location | Date | TC (cfu/100 mL) | E. coli (cfu/100 mL) | Method | Result |
|---|---|---|---|---|---|---|
| HAD-26-0421-001 | Distribution Z3 | 21 Apr 2026 | 0 | 0 | SANS 5221 | PASS |
| HAD-26-0421-002 | Distribution Z4 | 21 Apr 2026 | 12 | 0 | SANS 5221 | OPERATIONAL FAIL (TC > 10) |

## MPN vs CFU

Two enumeration methods:

### Most Probable Number (MPN)
Statistical method based on dilution series + presence/absence reading. Common with IDEXX Quanti-Tray (commercial product) — incubate, count positive wells, look up MPN value from table.

### Colony-Forming Units (CFU)
Direct counting of colonies on filter membrane after incubation. More precise at low counts.

Both report as "X per 100 mL" for water samples.

## IDEXX Quanti-Tray

Commercial system widely used:
- 100 mL sample mixed with reagent
- Poured into a tray with 49 small wells + 48 large wells
- Sealed and incubated 24 h
- Yellow wells = TC; yellow + fluorescent = E. coli (using Colilert reagent)
- Count + look up MPN

Range: 0–2 419 MPN/100 mL. Above that, dilute and re-test.

## Reporting in LIMS

The Hadron LIMS Results module flags:
- Detected E. coli in TC-target sample → red OUT-OF-SPEC chip
- TC > 10 cfu in distribution → orange OPERATIONAL chip (SANS 241 limit)
- HPC > 1 000 → orange chip
- All clear → green PASS chip

Sample-level audit trail tracks who collected, who analysed, who reviewed, who authorised.

## What to report to whom

- Internal: every result in LIMS
- Manager: any abnormal result within hours
- Regulator: SANS 241 acute-health exceedances within 24 h
- Public-health authority: same as regulator for E. coli or microcystin

_Source: APHA 9221, 9223; IDEXX Quanti-Tray manual; SANS 5221._`,
};

