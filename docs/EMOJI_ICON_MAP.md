# Emoji → Hadron Tristroke icon replacement

**How it works:** `emoji.js` finds the emoji in the `EMOJI_TO_ICON` map in the page's
text and swaps each for the matching inline Tristroke SVG (from `hadron-icons.js`). It is
theme-aware (`var(--icon-*)`; the main stroke follows the text colour), sized to ~1em, and
idempotent. It runs at start-up, when a window opens, on LIMS sync / profile / language
events, and whenever content with a mapped emoji is added to the page, so re-rendered
screens are covered too. Form fields, code, SVG and editable text are left alone. Emoji
not in the map stay as the phone's own emoji (since v155 there is no Twemoji; avoid emoji
newer than Emoji 12, which older phones draw as an empty box). One central map; no
per-call-site edits.

To change a mapping, edit `EMOJI_TO_ICON` in `emoji.js`.

## ✅ Replaced (emoji → icon)
Actions: 💾 save · 📄/📝/📒 document · ➕ add · ✏ edit · 🗑 delete · 📋 clipboard ·
🔗 link · 🖨 print · ⚙ settings · ✅ approve · ❌/🛑 reject · ⬇ download · ⬆ upload ·
🔁 refresh · 🔒 lock · 🔓 unlock · 👁 view.
Objects/contacts: 📦 product · 🛒 purchasing · 🏷 barcode · 👤 profile · 👥 customers ·
💬 chat · 📁 folder · 📍 location · 📷 camera · 📅 calendar · 📞/📱 phone · 📧/✉/📬 email ·
🔔 notifications · 🛠/🧰 work_order · 🦺/🛡 shield_check · 📚 sops · ⏳ hourglass.
Domain: 💊 dosage · 🏊 pool · 🎓 academy · 🏭 manufacturing · 📊 reports · 📈 trend_up ·
⚠/🚨 hazard · 🧪/🧬/🔬 lims · 🧫 jar_test · ⚗ coa · 🎧 help.

(~56 distinct emoji, covering the large majority of the ~382 emoji occurrences in the app.)

## ⏸ Intentionally NOT replaced (kept as emoji — by design)
- **Coloured status indicators** 🟢 🟤 💚 🤍 🩶 — the **colour encodes state** (ok/active/inactive); a monochrome icon would lose that meaning.
- **Theme toggle** ☀ 🌙 — handled by the dedicated top-bar/settings toggle.
- **Media controls** ▶ ⏹ ⏩ — no catalog equivalent.
- **Inline prose arrows** ↔ ↗ and the filled square ⬛ — decorative/text, not actions.
- **Greeting** 👋 (onboarding) — no "waving hand" icon.

## ❗ Couldn't be replaced — no faithful icon exists yet
These have real meaning but no matching Tristroke icon; mapping them to a near-miss
would mislead, so they stay as emoji for now:

💧 droplet/water · 🌊 wave · 🔥 fire/heat · ☁ cloud · 🌬 wind/aeration · ❄ snowflake/freeze ·
⚡ power · 🔌 plug · 🥽 goggles · 🧤 gloves · 🧯 extinguisher · 🧭 compass · 📐 ruler ·
🛢 chemical drum · 🚰 tap · 🚽 fixture · 🧂 salt/softener · 🏢 building/company · 🪪 ID card ·
📶 signal · 🧮 calculator · ⏰ alarm · ⏱ stopwatch · ℹ info · 🚫 prohibition · 🔇 mute · 📌 pin.

### ✅ Solution — commission a small "batch 2"
Most of the above are genuine water-treatment / plant / PPE concepts worth having as
real icons. Run them through the same `docs/ICON_DESIGN_BRIEF.md` flow with Claude
Design, then: regenerate `hadron-icons.js` (the merge generator) and add the new
names to `EMOJI_TO_ICON`. Highest-value to commission first:

1. **water droplet** (💧/🚰) — the core water-treatment hero mark.
2. **flame/heat** (🔥) — boiler/combustion/heat, distinct from the ⚠ hazard triangle.
3. **info** (ℹ) — the catalog has no information indicator.
4. **alarm** (⏰) and **stopwatch/timer** (⏱) — distinct from `hourglass` (elapsed/waiting).
5. **PPE set** — goggles 🥽, gloves 🧤 (safety module).
6. **power/electrical** (⚡/🔌), **aeration/blower** (🌬), **cold/freeze** (❄) — plant assets.
7. **salt/softener** (🧂), **compass** (🧭), **building/company** (🏢), **prohibition** (🚫).

Until then they show as the phone's own emoji — legible, just not Tristroke. (Coloured status dots stay as emoji permanently — that's intentional.)
