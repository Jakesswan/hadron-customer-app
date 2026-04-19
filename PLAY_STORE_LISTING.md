# Google Play Store Listing — Hadron Group

Everything you need to paste into the Play Console when you submit. Character
limits shown in brackets come from Google's current Play Console rules.

---

## App title  `[max 30 chars]`

**Hadron Group**  *(12 chars)* — the chosen title.

Alternates kept here for reference:
- **Hadron Customer Interface**  *(27 chars)*
- **Hadron Water Dosage**  *(20 chars)*

---

## Short description  `[max 80 chars]`

**Water-treatment dosage, LSI/RSI and support tools for Hadron Group customers.**  *(80 chars)*

Backup versions:
- *Dosage calculators, LSI/RSI, and 24/7 AI support for water-treatment pros.*  *(76)*
- *Chlorine & ClO₂ dosage, water balance indices, and direct line to Hadron.*  *(76)*

---

## Full description  `[max 4000 chars]`

```
The Hadron Group app is the quickest way for water-treatment professionals to get the job done on site.

Built for operators, plant managers and service techs working with Hadron Group, the app bundles the calculations you actually use every day into one clean, offline-capable interface.

— WHAT'S INSIDE —

• Chlorine Dosage Calculator
  Enter your plant size, target ppm and current concentration. Get the exact daily dose in grams, kilograms per week and a clear breakdown of assumptions.

• Chlorine Dioxide (ClO₂) Dosage Calculator
  Dial in your target ppm, and the app works out the precise ClO₂ generator output and precursor volumes required.

• LSI / RSI Water Balance Index
  The Langelier Saturation Index and Ryznar Stability Index, calculated from pH, temperature, TDS, calcium hardness and total alkalinity. Instant interpretation tells you whether the water is scaling, balanced or corrosive — no more flipping through charts.

• Hadron Store
  One tap takes you to the Hadron online store to order dosing equipment, test kits, consumables and spares.

• AI Support Assistant
  24/7 chat powered by our product-trained assistant. Ask about dosing, troubleshooting, alternative chemistries or product specs — any time, any day.

• Direct Sales & Support Contact
  Phone, email and WhatsApp shortcuts so you can reach a real human at Hadron when you need one.

• Offline Ready
  The app is a Progressive Web App wrapped for Play Store. Once installed it caches the tools on your device, so you can run calculations on a plant site with flaky reception.

— WHO IT'S FOR —

• Municipal and industrial water-treatment operators
• Plant maintenance and engineering teams
• Consulting engineers specifying dosing systems
• Resellers, installers and service technicians working with Hadron Group products

— PRIVACY & DATA —

Calculator inputs never leave your device. We don't sell data and we don't use advertising. The AI Assistant sends your messages to Chatbase to generate replies — see our in-app privacy policy for the full picture.

— ABOUT HADRON GROUP —

Hadron Group supplies water-treatment chemicals, dosing equipment and related consumables across Southern Africa and beyond. Learn more at hadrongrp.com.

Questions, bugs or feature requests? Email us at Sales@hadrongrp.com — we ship updates regularly.
```

*(≈ 1,750 characters — well under the 4000 limit, leaving room for you to add case studies or extra bullet points later.)*

---

## What's new (release notes)  `[max 500 chars per locale]`

```
Version 1.0 — Initial release.

• Chlorine and ClO₂ dosage calculators with configurable target ppm
• LSI / RSI water-balance index with instant scaling/corrosion interpretation
• One-tap link to the Hadron online store
• Built-in AI support assistant and direct contact shortcuts
• Works offline after first launch
```

---

## Category & tags

| Field | Value |
|---|---|
| **Application type** | App |
| **Category** | Business |
| **Alternate if you prefer** | Productivity, or Tools |
| **Tags (up to 5)** | Business, Productivity, Water treatment, Calculator, Industry |

---

## Contact details (Play Console "Store listing" tab)

| Field | Value |
|---|---|
| **Email** | Sales@hadrongrp.com |
| **Phone (optional)** | *(your sales line)* |
| **Website** | https://hadrongrp.com |
| **Privacy policy URL** | https://<your-github-username>.github.io/hadron-app/privacy.html |

> ⚠️ Replace the privacy-policy placeholder with the real deployed URL once
> GitHub Pages is live. Google Play will reject the submission if this URL
> doesn't resolve or is missing required sections.

---

## Graphic assets checklist

| Asset | Required size | Status |
|---|---|---|
| App icon | 512×512 PNG, 32-bit, no alpha | ✅ `icons/icon-512.png` |
| Feature graphic | 1024×500 PNG/JPG (no transparency) | ✅ `play-store-feature-graphic.png` (in repo root) |
| Phone screenshots | 2–8 screenshots, 16:9 or 9:16, min 320 px short side | 🔲 Take on your phone after install |
| 7-inch tablet | Optional | 🔲 |
| 10-inch tablet | Optional | 🔲 |

**Screenshot plan:** capture the home screen, dosage calculator with results, LSI/RSI calculator with results, AI assistant window, and the store landing. Five solid screenshots is usually the sweet spot.

---

## Content rating

Complete the Play Console's content-rating questionnaire honestly — for this
app the answers are all "No" (no violence, no user-generated content shared
publicly, no gambling, no controlled-substance content, no profanity). Expected
rating: **Everyone / PEGI 3 / ESRB Everyone**.

---

## Data safety form

Google requires you to declare what the app collects. Fill it in as follows:

| Data type | Collected? | Shared? | Purpose |
|---|---|---|---|
| Name / email | Yes (only if user emails you) | No | App support / communications |
| Messages (in-app AI) | Yes | Yes — to Chatbase as processor | App functionality |
| App activity (crash logs) | Optional (depends on if you enable Play vitals) | No | Analytics / App functionality |
| Device or other identifiers | Yes (standard Android install ID) | No | Analytics |
| Any financial info | **No** | — | — |
| Any health info | **No** | — | — |
| Location | **No** | — | — |
| Photos / videos / files | **No** | — | — |

Declare encryption-in-transit: **Yes** (HTTPS-only).
Declare users can request data deletion: **Yes** — point to
privacy@hadrongrp.com.

---

## Pricing & distribution

| Field | Value |
|---|---|
| **Paid or free** | Free |
| **In-app purchases** | No |
| **Contains ads** | No |
| **Countries** | All countries (start broad; you can always narrow later) |
| **Designed for families / children** | No |

---

## Submission workflow reminder

1. **Create the closed testing track first.** Google now requires first-time
   personal-account developers to run a closed test with 12+ testers for
   14 days before you can push to production.
2. Build the signed bundle (`.aab`) with PWABuilder →
   Package for stores → Android.
3. Upload the `.aab` to Play Console → Testing → Closed testing → Create
   release.
4. Add your testers' Gmail addresses (you, any Hadron staff, friends willing
   to help). Share the opt-in URL Play Console gives you.
5. While the 14 days run, fill in the **Store listing**, **Content rating**,
   **Data safety**, **Pricing & distribution**, and **App content** forms
   using this document.
6. After 14 days of active testing, the **Promote to production** button
   unlocks. Click it, fill in the production release notes, and submit
   for review.
7. Review typically takes 1–7 days for a new account / new app.

---

## Post-launch: assetlinks.json

Once Play Console has assigned your app signing key:

1. Play Console → Setup → App integrity → App signing key certificate →
   copy the SHA-256 fingerprint.
2. Open `.well-known/assetlinks.json` in this repo and replace
   `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT` with that value.
3. Commit, push, wait for the GitHub Pages deploy to finish.
4. Verify at `https://<your-host>/.well-known/assetlinks.json` and with
   Google's verifier:
   https://developers.google.com/digital-asset-links/tools/generator
5. This is what lets the TWA open in full-screen mode without a browser chrome
   bar — worth getting right before wide launch.
