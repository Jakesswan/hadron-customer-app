# Hadron Tristroke Icons — New Batch Hand-Off

## 1. Intro

Hadron is a water-treatment company. This brief asks you to design **exactly 15 new icons** that extend an existing 102-icon set called **"Hadron Tristroke,"** which is already used across Hadron's ERP and Customer App. The single overriding goal is **visual consistency with that existing set** — the new icons must look like they were drawn by the same hand, using the same construction rules, so they drop into the app seamlessly.

You have none of the surrounding context, so everything you need is reproduced below: the exact style spec, reference icons from the live set, the required delivery format, and a numbered spec for each of the 15 new icons (with a starting sketch you should refine). Deliver all 15, no more and no fewer, using the exact names listed.

## 2. Style Spec

```
HADRON TRISTROKE STYLE (must match the existing 102-icon set exactly):
- Canvas: viewBox "0 0 24 24"; design at 24x24; must stay legible down to 16px.
- All strokes: fill="none", stroke-width="1", stroke-linecap="round", stroke-linejoin="round". No fills. No text/letters/numerals.
- THREE stroked <g> layers, in this order and meaning:
    1) PRIMARY   - stroke="#4D4D4F" - the main silhouette / outline of the object.
    2) SECONDARY - stroke="#25B6D2" (Hadron teal) - a meaningful secondary element.
    3) ACCENT    - stroke="#FFC52B" (Hadron yellow) - a small "pop": an action mark, highlight, or status.
  Use 2 or 3 layers (most icons use all three). Keep each layer purposeful, not decorative noise.
- Coordinate limits:
    * HARD limit: every stroke path must lie fully inside the canvas. With the 1px stroke
      this means keep all path geometry within roughly x/y 1.5..22.5, and NEVER let any
      coordinate go below 0 or above 24 (anything outside 0..24 is clipped by the viewBox).
    * SOFT optical target: aim to keep geometry within ~2.5..21.5, optically centred, with
      balanced weight matching the set. A couple of icons intentionally push a little wider
      (e.g. flanking arrows) — that is fine as long as the HARD limit above is respected and
      a clear ~1.5px margin to the frame is kept so nothing touches or clips at 16px.
- Use ONLY inline presentation attributes (the ones shown above). Do NOT add class, id,
  style attributes, <style> blocks, <defs>, gradients, filters, masks, or transform attributes.
  Keep each <svg> exactly as the format below: xmlns + viewBox + width="32" + height="32".
- IMPORTANT: output uses these literal hex colours (NOT CSS variables) - the app converts
  #4D4D4F/#25B6D2/#FFC52B to theme tokens automatically. Do not pre-substitute them.
```

## 3. Reference Icons (from the existing set — match this exact style)

```
REFERENCE ICONS FROM THE EXISTING SET (copy this exact structure and stroke style).
Note: primary outlines need not be fully closed paths — match whatever reads cleanly,
exactly as these reference icons do.
```

**coa** (a lab flask — primary=flask body, secondary=neck/clip, accent=check):

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8c-1.5 2-3 4-3 8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3c0-4-1.5-6-3-8"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h2v4l-1 1-1-1z"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,15 11,17 15,13"/></g></svg>
```

**manufacturing** (a factory — primary=building roofline, secondary=doors, accent=smoke/spark):

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20.5V11l4.5 2.5V11l4.5 2.5V11l4.5 2.5V20.5z"/><path d="M3 20.5h17"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="16" width="2.5" height="3"/><rect x="11" y="16" width="2.5" height="3"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="4.5" cy="2.5" r="1.2"/></g></svg>
```

**payment** (a card — primary=card, secondary=magstripe, accent=coin):

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="1.6"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="10" x2="21" y2="10"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14.5" r="2"/></g></svg>
```

## 4. Delivery Format

```
DELIVERY FORMAT - produce ONE self-contained .html file that is a visual grid of the 15 new
icons, using EXACTLY this per-icon cell structure (identical to Hadron existing icon sheet, so
it merges into the app build pipeline with zero edits). Each <svg> keeps xmlns + viewBox + width="32" + height="32".
```

Per-icon cell (one per icon, 15 total):

```html
<div class="cell"><div class="ico"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">...</g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">...</g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">...</g></svg></div><div class="name">snake_case_name</div></div>
```

Wrap all 15 cells in this minimal self-contained page so a human can eyeball them and the `.cell`/`.ico`/`.name` classes resolve:

```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Hadron Tristroke — new batch</title>
<style>
  body { background:#fff; font-family:system-ui,sans-serif; margin:24px; }
  .grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; }
  .cell { border:1px solid #e5e5e5; border-radius:8px; padding:12px; text-align:center; }
  .ico svg { width:48px; height:48px; }
  .name { margin-top:8px; font-size:12px; color:#4D4D4F; }
</style></head>
<body>
  <div class="grid">
    <!-- the 15 .cell blocks go here, in spec order -->
  </div>
</body></html>
```

Use the exact snake_case name given for each icon. The SVG markup must use the literal hex above (not CSS variables) and inline presentation attributes only — no classes, ids, styles, defs, gradients, filters, or transforms on the SVG content.

## 5. Icon Specs

### 1. `dosage`

**Meaning:** A dropper dispensing a single measured drop of treatment chemical into a body of water — the literal act a dosage calculator helps you plan (how much chemical per volume of water). Distinct from the sealed lab flask of the `coa` icon: this is an open dispensing action, not a contained vessel.

**Composition:**
- **Primary (outline):** The dropper / pipette bottle outline at the top — a squeeze-bulb cap on a body that tapers to a clear nozzle tip. The universal tool of measured chemical dosing, drawn as a single continuous silhouette.
- **Secondary (teal):** The teal waterline at the bottom — a gentle multi-crest ripple spanning the canvas, representing the volume of water receiving the dose. Sits low to leave a clear gap between nozzle and surface.
- **Accent (yellow):** A single yellow drop falling in the gap between the nozzle tip and the water — the "dose" itself, the action/status pop. It is the moment of dispensing, the thing the calculator quantifies.

**Small-size note:** Three well-separated horizontal bands (dropper up high ~y3.5–11, drop in the middle ~y14.5–17, waterline near the bottom — the ripple sits at ~y20.5 and dips to ~y21.3 at its troughs, leaving a safe margin to the frame) so the layers never merge at 16px. The drop is a solid rounded blob ~2.8px tall that stays a distinct dot, and the ripple keeps broad ~4px crests rather than fine wiggles, so both survive downscaling. Stroke-width 1 with round caps matches the set's weight at small sizes.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 3.5h7v2a2 2 0 0 1-1 1.7v2.5l-2 2.8h-1l-2-2.8V7.2a2 2 0 0 1-1-1.7z"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20.5q2 1.6 4 0t4 0 4 0 4 0"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14.5l-1.1 1.7a1.4 1.4 0 1 0 2.2 0z"/></g></svg>
```

### 2. `water_index`

**Meaning:** The LSI/RSI water-balance index expressed as a balance scale: the eternal scaling-vs-corrosion equilibrium of treated water. A two-pan beam balance carries a water drop at its fulcrum (it is the water being judged), and a small needle reads the balance point. Instantly says "is this water in balance?" to a water-treatment operator, with no flask/factory/card overlap.

**Composition:**
- **Primary (outline):** The balance-scale silhouette in #4D4D4F: a horizontal beam, two shallow hanging pans (one = scaling, one = corrosion), and the central column with its base, forming the recognizable "weighing scale" outline that means equilibrium/index.
- **Secondary (teal):** A #25B6D2 teal water drop sitting on the beam's fulcrum — the substance being measured. Placing the drop at the pivot point (rather than in a pan) reads as "the water itself is what's being balanced," tying the generic scale specifically to water chemistry.
- **Accent (yellow):** A small #FFC52B yellow needle/pointer (an upward chevron) rising from the top of the beam — the balance "reading" mark. It is the status pop: the index value the operator is checking, and it keeps a crisp legible detail at 16px where thin hanger-chains would have vanished.

**Small-size note:** At 16px the three elements occupy distinct vertical bands (needle on top, drop in the middle on the beam, column+pans below) so none merge. The chevron apex sits at ~y2.2 (keeping a safe ~1.5px margin to the top frame so it never clips at 16px). The beam, column and pan curves are each at least ~3px apart and use round caps, the drop is a solid 5-unit-wide teardrop, and the accent is a single 2.6-unit-wide chevron rather than two tiny lines — all survive downscaling without blurring into a blob.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="8.5" x2="20" y2="8.5"/><path d="M4 8.5a2 2 0 0 0 4 0z"/><path d="M16 8.5a2 2 0 0 0 4 0z"/><line x1="12" y1="11" x2="12" y2="19"/><line x1="8.5" y1="19" x2="15.5" y2="19"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.2c-1.5 1.9-2.5 3.1-2.5 4.3a2.5 2.5 0 0 0 5 0c0-1.2-1-2.4-2.5-4.3z"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="10.7,3.5 12,2.2 13.3,3.5"/></g></svg>
```

### 3. `cooling_tower`

**Meaning:** Cooling-tower water treatment — the treated-water circuit of an industrial cooling tower.

**Composition:**
- **Primary (outline):** The unmistakable hyperboloid cooling-tower silhouette: two concave side profiles pinched in at a waist, a flat rim line across the top, and an elliptical base line across the bottom. This famous "waisted" industrial shape is the single most recognizable cooling-tower symbol and reads instantly distinct from the factory, flask, and card icons.
- **Secondary (teal):** A teal wavy waterline sitting in the lower basin of the tower — the treated cooling water. This is the explicit water-treatment signal that distinguishes the icon from a generic power-plant tower.
- **Accent (yellow):** A small two-stroke yellow vapor plume rising just above the rim — the operational "pop" showing the tower is live and venting warm moist air. Kept tiny and high, with clear daylight between the plume and the rim line, so it doesn't crowd the silhouette at small sizes.

**Small-size note:** The whole icon is only a handful of long simple strokes: four for the tower body, one gentle wave for water, and a two-line plume. There are no tight internal details to muddy at 16px. The waist pinch (half-width ~2.5 at the middle vs ~5 at the rim/base) stays visually open even when scaled down, the waterline wave amplitude is kept shallow so it doesn't blur into a solid band, and the vapor plume tips reach up to ~y2.0 (keeping a safe ~1.5px margin to the top frame) while sitting clear above the rim so they never merge with the outline or clip.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4.5C8 8 6.5 9 6.5 12c0 4 0.4 5.6 1 8.5"/><path d="M16 4.5C16 8 17.5 9 17.5 12c0 4 -0.4 5.6 -1 8.5"/><path d="M8 4.5h8"/><path d="M6.5 20.5h11"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M7.3 16.6c1-1 2-1 3 0s2 1 3 0 2-1 2.9 0"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 4c0-1.1 1-1.3 1-2.0v-0"/><path d="M13.5 4c0-1.1-1-1.3-1-2.0"/></g></svg>
```
*(If refining the plume, you may redraw it as two short upward-curving strokes whose tips land no higher than y2.0; the exact path is yours so long as it reads as a small two-stroke plume above the rim.)*

### 4. `ro_performance`

**Meaning:** A horizontal RO membrane pressure vessel: feed water enters the left inlet stub, the teal divider is the spiral-wound membrane, clean permeate exits the right stub, and the yellow check signals healthy plant performance.

**Composition:**
- **Primary (outline):** #4D4D4F outline draws the cylindrical RO pressure-vessel body (rounded rectangle) plus the short feed-water inlet stub on the left end — the instantly-recognisable membrane-housing silhouette.
- **Secondary (teal):** #25B6D2 teal adds the internal membrane element: a vertical divider line splitting feed from product inside the vessel, plus the permeate (clean-water) outlet stub on the right end — the functional separation that defines RO.
- **Accent (yellow):** #FFC52B yellow is a small check mark over the product side — a status "pop" reading as good/on-spec RO performance, matching how the reference set uses the yellow layer for an action/status mark.

**Small-size note:** At 16px the shapes stay separated: the vessel is one bold rounded rect, the two end stubs sit clear of the body on opposite ends, the single teal divider line keeps clear of the rounded corners, and the 3-point check is the only accent so it stays distinct from the membrane line rather than merging into clutter.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="14" height="10" rx="2.5"/><path d="M2.5 10v4"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7v10"/><path d="M18 12h3"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="13,14.5 15,16 18.5,11.5"/></g></svg>
```

### 5. `converters`

**Meaning:** Unit converters — turning a value expressed in one unit (e.g. ppm) into its equivalent in another (e.g. mg/L). The icon is a vertical "conversion expression": two unit containers proven equal to each other, with a direction-of-conversion mark.

**Composition:**
- **Primary (outline):** Two stacked, rounded tiles (rects) — an upper container and a lower container representing the source unit and the target unit. Two distinct quantities is the silhouette; pure outline, no fills.
- **Secondary (teal):** A teal equals sign — two short parallel bars sitting in the gap between the tiles. Equivalence is the literal job of a converter (ppm = mg/L), and parallel bars are a cleaner, more meaningful signal than swap arrows, so it won't read as the generic stock_transfer stand-in.
- **Accent (yellow):** A small yellow right-pointing arrowhead beside the equals bars — the "→" of a conversion expression ("this becomes that"). It is the action pop showing direction of conversion, set off to the right so it stays a separate, legible mark rather than crowding the tiles.

**Small-size note:** Content spans x:4–19.5, y:3–21, optically centred with set-matching weight. At 16px the two tiles scale to roughly 10.6x4.3px each and remain clearly separate stacked shapes; the two teal bars stay distinguishable as an equals band in the central gap, and the yellow arrowhead is isolated on the right edge so it never merges with the outline. No letters or numerals, so nothing fine-grained to lose.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="6.5" rx="1.6"/><rect x="4" y="14.5" width="16" height="6.5" rx="1.6"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="13" x2="16" y2="13"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="17.5,10.5 19.5,12 17.5,13.5"/></g></svg>
```

### 6. `neutralise`

**Meaning:** Acid/alkali neutralisation and pH adjustment: a dosing pipette adding neutralising reagent into a beaker of liquid, with a balance mark showing the result has reached neutral pH. Deliberately uses a straight-sided spouted beaker (not `coa`'s round-bottom flask) so the meaning is "adjusting/balancing a solution," not "lab sample."

**Composition:**
- **Primary (outline):** A straight-sided beaker with a pour spout — the vessel where neutralisation happens. Slightly tapered sides plus the spout flick at top-right distinguish it from the rounded `coa` flask and from any tank/container icon.
- **Secondary (teal):** A pipette/dropper (bulb + barrel) centred directly above the beaker mouth, tip aimed at the liquid — the act of dosing in the neutralising reagent (the pH-adjustment action).
- **Accent (yellow):** A yellow double-wave "≈" sitting on the liquid surface — the "pop"/status mark reading as balanced / neutral pH (the reaction has settled to neutral). Distinct from the set's checkmark, coin, and spark accents.

**Small-size note:** Three well-separated horizontal bands at 16px: dropper on top, beaker rim in the middle, beaker body below, with the wavy accent inside the body. Stroke-width 1 with round joins keeps each band readable; the spout is a single short flick that survives downscaling; no element sits closer than ~1px to another, so they don't merge into a blob.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 9l0.7 9a2 2 0 0 0 2 1.9h3.6a2 2 0 0 0 2-1.9l0.7-9"/><path d="M6.3 9h11.4"/><path d="M17.2 9l1.5-1.3"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="11" y="2.7" width="2" height="3.6" rx="0.5"/><path d="M12 6.3v1.5"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M9.2 14.4c0.85-0.9 1.7-0.9 2.55 0s1.7 0.9 2.55 0"/></g></svg>
```

### 7. `effluent`

**Meaning:** Effluent / wastewater treatment tools — a treatment tank discharging treated water through an outfall pipe. The vessel-plus-outfall reads instantly as "processed water leaving the works," which is exactly what effluent is, and it avoids the unrelated activity-waveform stand-in.

**Composition:**
- **Primary (outline):** The treatment tank/basin: an open-top vessel with rounded bottom corners (left+right walls down into a curved floor), plus an elbow outfall pipe exiting the right wall at mid-height and turning down — the core wastewater-treatment object.
- **Secondary (teal):** Two stacked teal ripple lines across the inside of the tank, depicting the water surface held in the basin so the vessel unambiguously reads as "full of water," not an empty box or bin.
- **Accent (yellow):** A small yellow wavy stream falling from the outfall pipe mouth — the effluent actually being discharged. It's the action/status pop that turns a static tank into "water flowing out / being released."

**Small-size note:** All features are 2px or larger and well separated: tank walls span x3–15, the pipe runs x15–20.5, the two ripple lines have ~2.6px vertical spacing and sit clear of the walls, and the discharge squiggle is a single isolated vertical mark on the right. No feature nests inside another or falls below ~2px, so silhouette (tank), water (ripples), and discharge (yellow) all stay distinguishable when scaled to 16px.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7"/><path d="M15 11h4a1.5 1.5 0 0 1 1.5 1.5V15"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11q1.5 1.4 3 0t3 0"/><path d="M5 13.6q1.5 1.4 3 0t3 0"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 16q-0.9 1.2 0 2.4t0 2.4"/></g></svg>
```

### 8. `calibration`

**Meaning:** Instrument calibration and verification — a graduated meter/gauge dial whose needle reading is confirmed against a reference scale. Targets water-treatment users who calibrate probes and meters; reads as "measuring instrument + verified" rather than time (the inadequate clock/hourglass stand-ins).

**Composition:**
- **Primary (outline):** #4D4D4F — the gauge silhouette: a semicircular dial arc, a flat baseline, a center hub, and a needle pointing up-right into the reading zone.
- **Secondary (teal):** #25B6D2 (teal) — three graduated calibration scale ticks stepping along the left/top of the arc (at 150°, 120°, 90°). They depict the reference scale the instrument is calibrated against, the meaningful "what you measure to" element, and leave the right side clear for the accent.
- **Accent (yellow):** #FFC52B (yellow) — a small check/tick sitting in the upper-right of the dial, right where the needle points. It's the status "pop": the reading is verified / calibration passed.

**Small-size note:** At 16px each element holds its own zone with no overlap: the dial arc and baseline form a bold readable silhouette, the needle is a single clear diagonal from a center hub, the three teal ticks read as a graduated scale rather than noise (spaced ~3px apart on the arc), and the yellow check occupies the open upper-right. Stroke-width 1 with round caps matches the set's weight; horizontally centered at x=12, x-range 4–20 and y-range 6–14 keep comfortable margins.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a8 8 0 0 1 16 0"/><path d="M4 14h16"/><path d="M12 14l2.7-5.2"/><circle cx="12" cy="14" r="1.1"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M5.07 10l1.21.7"/><path d="M8 7.07l.7 1.21"/><path d="M12 6v1.4"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="15.6,8.6 17,9.8 19.3,6.7"/></g></svg>
```

### 9. `lims`

**Meaning:** Laboratory Information Management System — a physical lab sample (test tube) linked to its tracked data record, with a logged/passed result. Distinct from the `coa` flask: LIMS is about managing samples + their information + results across the lab, not running a single assay.

**Composition:**
- **Primary (outline):** #4D4D4F draws the hero object: an upright round-bottom sample test tube (open rim line across the top, straight walls curving into a rounded base). This is the specimen every LIMS revolves around, and the slim straight-walled tube silhouette reads differently from the `coa` Erlenmeyer flask.
- **Secondary (teal):** #25B6D2 (teal) carries the "Information Management": the sample liquid level filling the lower tube (a meniscus curve down into the base) PLUS a linked data-record sheet to the right with two line-item rows. The tube is the sample, the sheet is its tracked record — together they say "specimen + its managed data."
- **Accent (yellow):** #FFC52B (yellow) is a small check mark sitting on the lower-right of the record sheet — the "pop" signalling a logged/approved result or passed test, the payoff of the whole sample-to-result workflow.

**Small-size note:** At 16px the three elements stay separated: the tube occupies the left third, the record sheet the right third, and the yellow check sits in the sheet's lower-right corner so it never collides with the tube. Tube walls are ~3 units apart and the sheet is 6.5 wide, both comfortably above the 1px stroke. Rendered at 96/32/16px the tube, sheet and check all remain individually legible. The only density risk is the two teal record rows being close — they read as a label texture rather than separate marks at 16px, which is acceptable.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3.5h5"/><path d="M6.5 3.5v13a1.5 1.5 0 0 0 3 0v-13"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 11.5q1.5 1 3 0v5a1.5 1.5 0 0 1-3 0z"/><rect x="13" y="6.5" width="6.5" height="12" rx="1"/><path d="M14.5 10h3.5M14.5 12.5h3.5"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.4,15.4 15.6,16.6 18,14"/></g></svg>
```

### 10. `pool`

**Meaning:** Swimming-pool water treatment — a pool basin holding water, with a chemical treatment dose being added.

**Composition:**
- **Primary (outline):** The pool basin in side cross-section: a wide vessel with sloping inner walls and a flat floor, plus a vertical pool ladder/handrail rising from the right rim with a curved top grab-hook. The ladder is the decisive "swimming pool" cue that separates this from a tank, beaker, or card.
- **Secondary (teal):** The water itself — a wavy waterline (gentle crests) spanning the pool interior just below the rim, the universal "this holds water" signal.
- **Accent (yellow):** A single treatment droplet falling toward the water surface — the "dose" action mark that turns a plain pool into water TREATMENT, and the pop of colour that draws the eye to the point of the icon.

**Small-size note:** At 16px the three layers stay separable because each occupies its own band: the dark basin trapezoid is the largest mass at the bottom, the teal waterline is a single horizontal stroke across the middle, and the yellow droplet sits alone in clear space at the top with no overlap. The ladder is a simple vertical line plus hook on the right edge, away from the droplet, so it doesn't merge. Only four short paths total, all stroke-width 1 with round caps, so no detail collapses or fills in when scaled down.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l1.8 9a1.5 1.5 0 0 0 1.48 1.2h11.44a1.5 1.5 0 0 0 1.48-1.2L21 8.5"/><path d="M17.5 8.5V5a1.3 1.3 0 0 1 2.6 0"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12q2 -1.6 4 0t4 0t4 0"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.5c1.6 1.7 1.6 2.8 0 3.4c-1.6-0.6-1.6-1.7 0-3.4z"/></g></svg>
```

### 11. `academy`

**Meaning:** Hadron Academy — training and learning. An open book (the universal learn symbol) topped with a water drop to make it domain-specific to water-treatment training, plus a completion check as the status pop.

**Composition:**
- **Primary (outline):** #4D4D4F primary draws the main silhouette: an open book seen from the front — two facing pages curving down from a raised center, with a vertical spine line dividing them. This is the instantly-readable "learning / lesson" object and is distinct from the existing flask, factory, and card icons.
- **Secondary (teal):** #25B6D2 teal adds a rising water drop centered above the book's spine. It converts a generic "book" into "Hadron water-treatment training" — the meaningful secondary element a water user recognises — and sits in clear space above the pages so it never muddies the silhouette.
- **Accent (yellow):** #FFC52B yellow is a small completion check mark on the right-hand page — a "lesson complete / knowledge gained" status pop. It mirrors the set's accent language (the `coa` flask's check, the `manufacturing` spark) and gives the icon an action/status beat without adding clutter.

**Small-size note:** All coordinates sit within 3..20 and the three layers occupy separate zones (book body 8–20, drop 3–7.5, check 12–15 on the right page), so nothing overlaps or merges at 16px. Strokes are width-1 round-cap/join matching the set; the book outline keeps a strong continuous silhouette, the drop is a single closed teardrop that stays a recognisable shape when shrunk, and the check is a 3-point polyline large enough (~4px tall) to remain a distinct tick rather than a blob.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9.5C10 8 7 7.5 4 8v10.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V8c-3-.5-6 0-8 1.5z"/><line x1="12" y1="9.5" x2="12" y2="20"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1.7 1.9 2.7 3.4 2.7 4.8a2.7 2.7 0 0 1-5.4 0C9.3 6.4 10.3 4.9 12 3z"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5,13.5 16,15 18.5,12"/></g></svg>
```

### 12. `qr_builder`

**Meaning:** QR-code builder / generator. The icon shows the three nested-square finder ("eye") patterns that are the universal, instantly-recognisable signature of a 2D QR matrix — never a 1D barcode. The teal element turns it from a static QR code into a builder, and the yellow check signals a valid generated code.

**Composition:**
- **Primary (outline):** Three rounded nested-square QR finder patterns in the top-left, top-right and bottom-left corners — the outer #4D4D4F squares (the silhouette every QR code has). This alone separates it from the barcode stand-in: it's a grid/matrix, not parallel bars.
- **Secondary (teal):** Teal #25B6D2 "build" layer: the inner pip of the top-left finder eye, plus a single continuous L-shaped module-placement bracket occupying the empty fourth (bottom-right) corner where a builder is actively assembling the code. It reads as construction/composition rather than a finished code. Keep it ONE continuous stroke — no detached stub marks, which would read as noise at 16px.
- **Accent (yellow):** A small yellow #FFC52B check mark centred in the matrix — the "pop" / status mark meaning the QR code has been successfully generated and is valid/scannable.

**Small-size note:** Only four coordinate clusters at 16px: three 6x6 corner squares plus one centred mark. The finder squares carry rounded corners and a single inner pip (matching real QR eyes) and never touch, so the silhouette stays open and readable. The teal L-bracket sits alone in the otherwise-empty corner as one continuous stroke so it doesn't merge with the squares or splinter into specks, and the check is the only element in the centre, keeping all three layers optically separated when scaled down. Stroke-width 1 with round caps matches the rest of the 102-icon set's weight.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="0.8"/><rect x="15" y="3" width="6" height="6" rx="0.8"/><rect x="3" y="15" width="6" height="6" rx="0.8"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="2" height="2"/><path d="M15 18v-3h3v3"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11.5l1.6 1.6 3-3"/></g></svg>
```

### 13. `jar_test`

**Meaning:** Jar test — a coagulation/flocculation bench test: a row of stirred jars on a flocculator, each with a paddle stirrer, with floc settling out. Recognisable to a water-treatment user as the bench gang-stirrer used to dose-optimise coagulant.

**Composition:**
- **Primary (outline):** #4D4D4F outline: a row of three identical open-top jars/beakers sitting side by side on the bench. This row is the signature silhouette of a jar-test apparatus and is what separates it from a single flask.
- **Secondary (teal):** #25B6D2 teal: the flocculator stirrer assembly — a horizontal drive bar spanning the tops of all three jars, with a paddle shaft dropping down into the centre jar and a short paddle blade at its tip. This mechanism is the defining feature of a jar/gang-stirrer test.
- **Accent (yellow):** #FFC52B yellow: a short floc/sediment mark settled at the base of the centre jar — the "result" pop showing flocs have formed and are settling, the whole point of running the test.

**Small-size note:** At 16px the three jar bodies stay distinct because each is ~6 units wide on the 24-unit canvas with clear gaps; the teal drive bar is one clean horizontal line and the paddle is a single vertical stroke with a tiny crossbar, so no detail collapses. The yellow floc is a short horizontal dash rather than fine dots, so it survives downscaling.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9v9.5a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V9"/><path d="M9.5 9v9.5a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V9"/><path d="M15.5 9v9.5a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V9"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6.5" x2="21" y2="6.5"/><line x1="12" y1="6.5" x2="12" y2="13"/><line x1="10.5" y1="13" x2="13.5" y2="13"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M11 16.5h2"/></g></svg>
```

### 14. `sops`

**Meaning:** Standard Operating Procedures — a controlled, bound procedure manual. Drawn as a ring/spine-bound manual (not a loose sheet), with ordered step lines on the page and an approval check, so a water-treatment operator reads it as "the official, signed-off procedure book" rather than a generic document.

**Composition:**
- **Primary (outline):** The bound manual itself: a rounded cover panel with a distinct hinged spine edge on the left (the curved double-line binding), giving the unmistakable silhouette of a controlled binder/manual rather than a flat document page.
- **Secondary (teal):** Three evenly-spaced teal step lines on the page body — the ordered, numbered-feel procedure steps that make it read as a "procedure" rather than just text, sitting in the right-hand reading area clear of the spine.
- **Accent (yellow):** A small yellow check mark at the top of the page — the "controlled / approved / signed-off" status pop that signals this is an authorised SOP, not a draft.

**Small-size note:** At 16px the read survives because the three load-bearing cues are well separated and none are fiddly: the spine is a bold double curve on the left edge, the three teal lines are spaced ~3.5px apart (clearly distinct, not merging), and the check is a simple 3-point tick in open space at top-left of the page. Coordinates sit within ~5.5..19 with stroke-width 1, matching the set's weight; no element relies on detail finer than ~1.5px.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7z"/><path d="M7 3.5a1.5 1.5 0 0 0-1.5 1.5v14a1.5 1.5 0 0 0 1.5 1.5"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="11" y1="8" x2="16" y2="8"/><line x1="11" y1="11.5" x2="16" y2="11.5"/><line x1="11" y1="15" x2="16" y2="15"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="7.8,7.8 8.6,8.6 9.8,7"/></g></svg>
```

### 15. `data_manager`

**Meaning:** Data manager — import, export and manage the app's data. The icon reads as "a managed store of data with traffic flowing both in and out": a database drum (the data) with a download/import arrow on one side and an upload/export arrow on the other, plus a status dot showing the store is active and managed.

**Composition:**
- **Primary (outline):** A classic database cylinder/drum drawn in three strokes — the top ellipse rim, the two side walls closing into the bottom curve, and one inner stack line. This is the universal "stored data" silhouette and is the main object, optically centred on the canvas. It deliberately avoids the flask, factory and card silhouettes already in the set.
- **Secondary (teal):** Two teal arrows flanking the drum that depict the import/export action: a down arrow on the left (data coming IN to the store) and an up arrow on the right (data going OUT). Placed symmetrically so the icon stays balanced, they turn a static database into an active "manage / move data" verb.
- **Accent (yellow):** A small yellow dot on the lower face of the drum — a status pop signalling the data store is active and under management (a single managed record/indicator light). It gives the "pop" the set uses for state, sitting clear of the rim lines so it survives at 16px.

**Small-size note:** Tested rendered at 120px, 32px and 16px. The drum uses only three strokes with generous spacing so the cylinder stays unmistakable at 16px; the two teal arrows sit fully outside the drum walls (centred at x=4 and x=20) so they never merge with the body and their direction stays legible. Note this icon intentionally runs slightly wider than the soft optical target — the arrow strokes reach ~x2.2 and ~x21.8, still comfortably inside the 0..24 hard limit with margin, so nothing clips. The yellow dot (r=1.2) is placed on open drum face below the inner stack line so it reads as a distinct pop rather than blurring into a rim line.

**Starting sketch (direction, not final — refine for polish):**

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><g stroke="#4D4D4F" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8c0 1 2 1.7 4 1.7s4-0.7 4-1.7-2-1.7-4-1.7-4 0.7-4 1.7z"/><path d="M8 8v8c0 1 2 1.7 4 1.7s4-0.7 4-1.7V8"/><path d="M8 12c0 1 2 1.7 4 1.7s4-0.7 4-1.7"/></g><g stroke="#25B6D2" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="3.5" x2="4" y2="9"/><polyline points="2.2,7.2 4,9 5.8,7.2"/><line x1="20" y1="20.5" x2="20" y2="15"/><polyline points="18.2,16.8 20,15 21.8,16.8"/></g><g stroke="#FFC52B" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="16.5" r="1.2"/></g></svg>
```

## 6. Closing Checklist

Before delivering, confirm every icon meets all of the following:

- [ ] Exactly **15 icons** delivered — no more, no fewer — using the exact names listed below.
- [ ] Every SVG uses the **literal hex colours** `#4D4D4F`, `#25B6D2`, `#FFC52B` — **not** CSS variables.
- [ ] Every SVG keeps `xmlns`, `viewBox="0 0 24 24"`, `width="32"`, `height="32"` and uses **inline presentation attributes only** — no `class`, `id`, `style`, `<style>`, `<defs>`, gradients, filters, masks, or `transform`.
- [ ] Every stroke is `stroke-width="1"`.
- [ ] Every stroke uses `stroke-linecap="round"` and `stroke-linejoin="round"`.
- [ ] **No fills** anywhere (`fill="none"` on every layer); **no text, letters, or numerals**.
- [ ] All geometry stays inside the canvas: nothing below 0 or above 24, and (allowing for the 1px stroke) a clear ~1.5px margin to each frame edge so nothing clips at 16px.
- [ ] Each icon is **legible at 16px** (layers stay separated, no detail collapses, no stray specks).
- [ ] The layer order is PRIMARY (`#4D4D4F`) → SECONDARY (`#25B6D2`) → ACCENT (`#FFC52B`), each layer purposeful.
- [ ] Names are **exactly** the snake_case names given: `dosage`, `water_index`, `cooling_tower`, `ro_performance`, `converters`, `neutralise`, `effluent`, `calibration`, `lims`, `pool`, `academy`, `qr_builder`, `jar_test`, `sops`, `data_manager`.
- [ ] Delivered as **one self-contained .html grid** (DOCTYPE + the CSS scaffold above) using the exact per-icon cell structure, all 15 cells in spec order.