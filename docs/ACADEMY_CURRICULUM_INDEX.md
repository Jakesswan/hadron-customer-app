# Hadron Academy - Existing Curriculum Index

> Auto-generated from `academy.js` (the source of truth). Upload this to the authoring
> Project so it can (1) judge NEW vs DEEPENING + flag overlap, and (2) pick the next
> free id/code in a track. Code convention: **1xx = Foundation, 2xx = Intermediate, 3xx = Advanced**.

**39 courses across 10 tracks.**

## Potable Water  `track-potable`
_Drinking water treatment from source to tap_

Codes used (POT-): 101, 201, 202, 301

- **POT-101** `c-pot-101` - Introduction to Drinking Water Treatment _(Foundation, 4 hrs, 5 modules, has quiz)_
  - tools: waterindex, dosage, lims
  - modules: m1 Why we treat water | m2 Source water types | m3 The conventional treatment train | m4 The operator's daily checks | m5 Knowledge check
- **POT-201** `c-pot-201` - Coagulation, Flocculation & Sedimentation _(Intermediate, 5 hrs, 6 modules)_
  - prereqs: c-pot-101
  - tools: dosage, effluent, converters
  - modules: m1 Colloid chemistry & destabilisation | m2 Coagulant chemistry side-by-side | m3 The jar test, properly run | m4 Mixing energy and basin design | m5 Sedimentation & DAF — picking a clarifier | m6 Practical: dose a 0.5 ML/d plant
- **POT-202** `c-pot-202` - Filtration: Sand, Multimedia & Leopold _(Intermediate, 4 hrs, 5 modules)_
  - prereqs: c-pot-201
  - tools: dosage, lims
  - modules: m1 Filter types & media | m2 Underdrains & wash systems | m3 Run length, head loss & breakthrough | m4 Common faults & fixes | m5 Operator drill
- **POT-301** `c-pot-301` - SANS 241 Compliance & Water Safety Plans _(Advanced, 6 hrs, 5 modules)_
  - prereqs: c-pot-101
  - tools: lims, servicereport
  - modules: m1 SANS 241 in detail | m2 Designing the sampling matrix | m3 Water Safety Plans (WSP) | m4 Climate resilience | m5 Non-conformance & CAPA

## Disinfection  `track-disinfection`
_Chlorine, ClO₂, UV, ozone & DBPs_

Codes used (DIS-): 101, 201, 202, 301

- **DIS-101** `c-dis-101` - Disinfection Fundamentals _(Foundation, 3 hrs, 5 modules)_
  - prereqs: c-pot-101
  - tools: dosage, pool
  - modules: m1 Pathogens & log-reduction | m2 The Ct concept | m3 The big four compared | m4 Picking the primary | m5 Knowledge check
- **DIS-201** `c-dis-201` - Chlorine Chemistry & Practice _(Intermediate, 5 hrs, 6 modules)_
  - prereqs: c-dis-101
  - tools: dosage, pool, converters
  - modules: m1 Aqueous chlorine chemistry | m2 Free, combined & breakpoint | m3 Forms of chlorine | m4 Dosing skids & on-line control | m5 Chlorine safety in practice | m6 Worked example: 2 ML/d plant
- **DIS-202** `c-dis-202` - Chlorine Dioxide & Alternative Disinfectants _(Intermediate, 4 hrs, 4 modules)_
  - prereqs: c-dis-201
  - tools: dosage, converters
  - modules: m1 ClO₂ chemistry & generation | m2 Skid design & sizing | m3 UV disinfection | m4 Chloramination & long networks
- **DIS-301** `c-dis-301` - Disinfection By-products & Compliance _(Advanced, 4 hrs, 4 modules)_
  - prereqs: c-dis-201, c-pot-301
  - tools: lims, dosage
  - modules: m1 DBP families | m2 Predicting THM formation | m3 Mitigation strategy | m4 Compliance sampling

## Sewage Treatment  `track-sewage`
_Wastewater treatment & sludge_

Codes used (SEW-): 101, 201, 202, 301

- **SEW-101** `c-sew-101` - Sewage Composition & Treatment Overview _(Foundation, 4 hrs, 4 modules)_
  - tools: effluent, servicereport
  - modules: m1 What's in domestic sewage | m2 The treatment train | m3 Discharge standards (SA) | m4 Operator's daily sewage routine
- **SEW-201** `c-sew-201` - Activated Sludge & Biological Treatment _(Intermediate, 5 hrs, 5 modules)_
  - prereqs: c-sew-101
  - tools: effluent
  - modules: m1 The activated-sludge process | m2 F:M, SRT & MLSS | m3 Settlement & SVI₃₀ | m4 Aeration & DO control | m5 RAS / WAS strategy
- **SEW-202** `c-sew-202` - Sludge Treatment & Nutrient Removal _(Intermediate, 4 hrs, 4 modules)_
  - prereqs: c-sew-201
  - tools: effluent, servicereport
  - modules: m1 Sludge handling | m2 Anaerobic digestion | m3 Biological nutrient removal | m4 Operator targets
- **SEW-301** `c-sew-301` - Plant Optimisation & Compliance _(Advanced, 4 hrs, 4 modules)_
  - prereqs: c-sew-202
  - tools: servicereport, effluent
  - modules: m1 Green-Drop framework | m2 Aeration energy | m3 Digital tools & dashboards | m4 Audit walk-through

## Industrial Effluent  `track-effluent`
_Trade waste, paint detack, F&B, DAF_

Codes used (EFF-): 101, 201, 202, 203, 301

- **EFF-101** `c-eff-101` - Effluent Characterisation & Standards _(Foundation, 3 hrs, 3 modules)_
  - tools: effluent, lims, neutralise
  - modules: m1 Characterisation | m2 Discharge standards | m3 Treatment direction
- **EFF-201** `c-eff-201` - Paint Detackification _(Intermediate, 3 hrs, 4 modules)_
  - prereqs: c-eff-101
  - tools: neutralise, effluent, servicereport
  - modules: m1 Paint chemistry & overspray | m2 Detack programme design | m3 Daily operator checks | m4 Trouble-shooting
- **EFF-202** `c-eff-202` - Food & Beverage Effluent _(Intermediate, 4 hrs, 4 modules)_
  - prereqs: c-eff-101
  - tools: effluent, neutralise
  - modules: m1 Sector profiles | m2 Pre-treatment | m3 Anaerobic treatment (UASB / EGSB) | m4 Aerobic polishing
- **EFF-203** `c-eff-203` - Dissolved Air Flotation (DAF) _(Intermediate, 3 hrs, 4 modules)_
  - prereqs: c-eff-101
  - tools: effluent
  - modules: m1 Principle | m2 Sizing | m3 Operation | m4 Trouble-shooting
- **EFF-301** `c-eff-301` - Heavy Metals & pH Neutralisation _(Advanced, 4 hrs, 4 modules)_
  - prereqs: c-eff-101
  - tools: neutralise, effluent, lims
  - modules: m1 Metal hydroxide chemistry | m2 Two-stage neutraliser | m3 Polishing techniques | m4 Sludge & disposal

## Cooling Water  `track-cooling`
_Cooling towers & closed-loop systems_

Codes used (COOL-): 101, 201, 301

- **COOL-101** `c-cool-101` - Cooling Tower Fundamentals _(Foundation, 3 hrs, 4 modules)_
  - tools: coolingtower, waterindex
  - modules: m1 How a cooling tower works | m2 The mass balance | m3 Why cycles matter | m4 Plant walk
- **COOL-201** `c-cool-201` - Scale, Corrosion & Biofouling Control _(Intermediate, 5 hrs, 4 modules)_
  - prereqs: c-cool-101, c-pot-101
  - tools: coolingtower, waterindex, dosage, lims
  - modules: m1 Scale chemistry & control | m2 Corrosion control | m3 Microbiological control | m4 On-site testing & dosing
- **COOL-301** `c-cool-301` - Optimisation & Cycle Management _(Advanced, 3 hrs, 4 modules)_
  - prereqs: c-cool-201
  - tools: coolingtower, rocalc, waterindex
  - modules: m1 Pushing cycles up | m2 Side-stream filtration | m3 Blowdown reuse | m4 Chemical programme audit

## Boiler Water  `track-boiler`
_Steam systems & internal treatment_

Codes used (BOIL-): 101, 201, 301

- **BOIL-101** `c-boil-101` - Boiler Water Chemistry _(Foundation, 3 hrs, 3 modules)_
  - prereqs: c-pot-101
  - tools: waterindex, converters
  - modules: m1 The four enemies | m2 Limits by pressure | m3 Sampling boiler water
- **BOIL-201** `c-boil-201` - Pretreatment, Internal Treatment & Steam _(Intermediate, 5 hrs, 4 modules)_
  - prereqs: c-boil-101
  - tools: rocalc, dosage, converters
  - modules: m1 External pretreatment | m2 Internal treatment | m3 Deaeration & oxygen scavengers | m4 Steam, condensate & amines
- **BOIL-301** `c-boil-301` - Layup, Cleaning & Failure Analysis _(Advanced, 3 hrs, 3 modules)_
  - prereqs: c-boil-201
  - tools: neutralise
  - modules: m1 Layup | m2 Off-line cleaning | m3 Deposit analysis & failures

## Reverse Osmosis  `track-ro`
_RO, NF, UF, MF & antiscalants_

Codes used (RO-): 101, 201, 202, 301

- **RO-101** `c-ro-101` - Membrane Fundamentals _(Foundation, 3 hrs, 4 modules)_
  - prereqs: c-pot-101
  - tools: rocalc
  - modules: m1 Size exclusion ladder | m2 Driving forces | m3 Membrane chemistry & construction | m4 Reading a datasheet
- **RO-201** `c-ro-201` - RO System Design & Operation _(Intermediate, 5 hrs, 4 modules)_
  - prereqs: c-ro-101
  - tools: rocalc, lims
  - modules: m1 Array design | m2 Energy recovery | m3 Daily operation | m4 Hadron RO calc walk-through
- **RO-202** `c-ro-202` - Pretreatment & Antiscalant Selection _(Intermediate, 4 hrs, 4 modules)_
  - prereqs: c-ro-101
  - tools: rocalc, dosage, waterindex
  - modules: m1 Pretreatment train | m2 SDI / MFI / fouling indices | m3 Antiscalant chemistry | m4 Dose calculation
- **RO-301** `c-ro-301` - Performance Monitoring & CIP _(Advanced, 4 hrs, 4 modules)_
  - prereqs: c-ro-201, c-ro-202
  - tools: rocalc, lims
  - modules: m1 Normalisation in detail | m2 Fouling diagnosis | m3 CIP recipes | m4 Replacement planning

## Treatment Equipment  `track-equipment`
_Pumps, filters, dosers, instruments_

Codes used (EQ-): 101, 201, 202, 301

- **EQ-101** `c-eq-101` - Pumps, Mixers & Dosing Systems _(Foundation, 4 hrs, 4 modules)_
  - tools: dosage, effluent, converters
  - modules: m1 Pumps & curves | m2 Mixing | m3 Dosing systems | m4 Practical: cal a dosing pump
- **EQ-201** `c-eq-201` - Filters & Clarifiers _(Intermediate, 4 hrs, 4 modules)_
  - prereqs: c-pot-201, c-pot-202
  - tools: effluent
  - modules: m1 Sedimentation tanks | m2 Filter design | m3 Backwash systems | m4 Trouble-shooting
- **EQ-202** `c-eq-202` - Instruments & Calibration _(Intermediate, 4 hrs, 4 modules)_
  - prereqs: c-eq-101
  - tools: lims, servicereport
  - modules: m1 pH / ORP / conductivity | m2 Turbidity & residual Cl | m3 Calibration discipline | m4 Audit trail
- **EQ-301** `c-eq-301` - Maintenance & Troubleshooting _(Advanced, 4 hrs, 4 modules)_
  - prereqs: c-eq-101
  - tools: servicereport
  - modules: m1 PM scheduling | m2 Root-cause analysis | m3 Decision trees | m4 Documenting CAPA

## Operations & Safety  `track-ops`
_Plant ops, MSDS, sampling, response_

Codes used (OPS-): 101, 201, 202, 301

- **OPS-101** `c-ops-101` - Plant Operations Fundamentals _(Foundation, 3 hrs, 4 modules)_
  - tools: servicereport, lims
  - modules: m1 The shift | m2 Logbook discipline | m3 Escalation | m4 Service Report tool
- **OPS-201** `c-ops-201` - Chemical Handling & MSDS _(Intermediate, 4 hrs, 4 modules)_
  - prereqs: c-ops-101
  - tools: servicereport
  - modules: m1 GHS & SDS | m2 PPE per chemical class | m3 Transfer & decant | m4 Spill response
- **OPS-202** `c-ops-202` - Sampling Best Practice & QMS _(Intermediate, 3 hrs, 3 modules)_
  - prereqs: c-ops-101
  - tools: lims, servicereport
  - modules: m1 Sample integrity | m2 Chain of custody | m3 ISO 17025 sampling clauses
- **OPS-301** `c-ops-301` - Emergency Response & Incident Management _(Advanced, 3 hrs, 3 modules)_
  - prereqs: c-ops-201
  - tools: lims, servicereport
  - modules: m1 Boil-water notices | m2 T&O events | m3 Communication

## Water Chemistry  `track-chemistry`
_pH, alkalinity, hardness, microbiology_

Codes used (CHEM-): 101, 102, 201, 202

- **CHEM-101** `c-chem-101` - Inorganic Chemistry Basics _(Foundation, 3 hrs, 4 modules)_
  - tools: converters, neutralise
  - modules: m1 Atoms, moles & ions | m2 Concentration units | m3 Major ions in water | m4 Worked examples
- **CHEM-102** `c-chem-102` - pH, Alkalinity & Hardness _(Foundation, 3 hrs, 4 modules)_
  - prereqs: c-chem-101
  - tools: waterindex, neutralise
  - modules: m1 pH in depth | m2 Alkalinity | m3 Hardness | m4 Putting it together — LSI
- **CHEM-201** `c-chem-201` - Solubility, Saturation & LSI _(Intermediate, 3 hrs, 3 modules)_
  - prereqs: c-chem-102
  - tools: waterindex, coolingtower
  - modules: m1 Solubility & Ksp | m2 Indices side-by-side | m3 Practical cooling-water example
- **CHEM-202** `c-chem-202` - Microbiology Basics _(Intermediate, 3 hrs, 4 modules)_
  - tools: lims, dosage
  - modules: m1 Indicator organisms | m2 Heterotrophic plate count | m3 Legionella & cooling | m4 Reading a micro report
