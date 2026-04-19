# Hadron Group — Customer Interface

A mobile-first customer web application for **Hadron Group**, specializing in chlorine and water treatment solutions. The app provides authenticated access to technical dosage calculators, an AI support assistant, and quick access to company information. Installs to home screen as a Progressive Web App (PWA) for a native-like experience on phones and tablets.

Live site (after deploy): `https://<your-github-username>.github.io/hadron-customer-app/`

---

## Features

- **Secure customer login** — gated access to the application
- **Dosage calculators** — three specialized tools with formulas matching Hadron's reference Excel sheets:
  - Chlorine (TCCA)
  - Chlorine Dioxide (ClO2)
  - Coagulants
- **AI support assistant** — Chatbase integration for instant customer help
- **Installable PWA** — add to home screen on iOS/Android and run fullscreen, offline-capable
- **Mobile-first UI** — fullscreen layouts, touch-optimized, safe-area aware
- **Branded experience** — Hadron Group colors (`#00b1ca`, `#f9bb32`, `#4f4f4f`) and logo throughout

## Tech stack

- HTML5 / CSS3 / Vanilla JavaScript (single-file, zero build step)
- PWA: `manifest.webmanifest` + `sw.js` service worker for offline app-shell caching
- Chatbase embed for the AI assistant
- GitHub Pages for hosting
- GitHub Actions for automated deploys

## Project structure

```
hadron-app/
├── index.html              # Main application
├── Hadron_Logo.png         # Brand logo
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker
├── icons/                  # App icons for iOS, Android, favicons
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon.png
│   ├── favicon-32.png
│   └── favicon-16.png
├── README.md
├── DEPLOYMENT_GUIDE.md
├── LICENSE
├── .gitignore
└── .github/workflows/deploy.yml
```

## Running locally

No build step is needed:

```bash
# Python 3
python -m http.server 8080

# Node
npx serve .
```

Then visit `http://localhost:8080`.

> Note: service workers require HTTPS or `localhost`. Opening `index.html` via `file://` disables the PWA install prompt.

## Demo credentials

- **Username:** `demo`
- **Password:** `password`

## Deployment

Deployment happens automatically via GitHub Actions when you push to the `main` branch. See `DEPLOYMENT_GUIDE.md` for first-time setup.

## Company

**Hadron Group**
- Plot 442, Mooiplaats, Boschkop Road, Pretoria, 0040
- 087 265 1711 · 082 375 9734
- Sales@hadrongrp.com · Jaco@hadrongrp.com · Ricardo@hadrongrp.com

## License

MIT — see [`LICENSE`](./LICENSE).

---

© 2026 Hadron Group. All rights reserved.
