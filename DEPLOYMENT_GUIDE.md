# Hadron App — GitHub Deployment Guide

This guide walks through publishing the Hadron customer app to GitHub Pages, with the included GitHub Actions workflow for automatic deploys.

---

## Option A — Web UI only (no command line)

Use this if you'd rather drag-and-drop. Browser already logged in to GitHub? You can knock this out in about 5 minutes.

### 1. Create a new repository

- Click the **+** menu (top right) → **New repository**
- **Owner:** your account
- **Repository name:** `hadron-customer-app`
- **Visibility:** **Public** *(required for free GitHub Pages)*
- Do **not** add a README, .gitignore, or license — we already have them
- Click **Create repository**

### 2. Upload the files

You'll see "uploading an existing file" on the empty repo page. Click it.

Then drag the **entire contents** of the `hadron-app` folder into the upload area:

```
index.html
Hadron_Logo.png
manifest.webmanifest
sw.js
README.md
LICENSE
DEPLOYMENT_GUIDE.md
.gitignore
.github/             ← important: includes workflows/deploy.yml
icons/               ← all six icon files
```

> **Tip for Windows:** open `C:\Users\jaco\Downloads\Hadron Application\files\hadron-app`, press `Ctrl+A` to select all, then drag onto the GitHub upload page. The `.github` folder will come along.
>
> If GitHub doesn't accept the folders, ZIP the entire `hadron-app` folder, upload the ZIP, and then... actually it doesn't auto-extract. Better: use Option B below, or upload files in batches keeping subfolder structure.

Commit message: `Initial commit — Hadron PWA`

Click **Commit changes**.

### 3. Enable GitHub Pages

- Go to **Settings → Pages** (left sidebar)
- Under **Build and deployment → Source**, select **GitHub Actions**
- That's it — no further config needed. The workflow we shipped does the rest.

### 4. Watch the first deploy

- Click the **Actions** tab
- You should see "Deploy to GitHub Pages" running
- ~1–2 minutes later it goes green
- Your live URL: `https://<your-username>.github.io/hadron-customer-app/`

---

## Option B — Command line (recommended for ongoing updates)

You'll need [Git](https://git-scm.com/downloads) and optionally the [GitHub CLI](https://cli.github.com/).

### 1. Init git in the folder

Open PowerShell or Command Prompt:

```powershell
cd "C:\Users\jaco\Downloads\Hadron Application\files\hadron-app"
git init -b main
git add .
git commit -m "Initial commit — Hadron PWA"
```

### 2. Create the GitHub repo and push

**Easiest — with GitHub CLI:**

```powershell
gh auth login
gh repo create hadron-customer-app --public --source=. --remote=origin --push
```

**Without GitHub CLI** — first create the empty repo via the web UI (Option A, step 1), then:

```powershell
git remote add origin https://github.com/<your-username>/hadron-customer-app.git
git push -u origin main
```

### 3. Enable Pages (one-time)

In the repo on GitHub: **Settings → Pages → Source: GitHub Actions**.

### 4. Future updates auto-deploy

```powershell
git add .
git commit -m "Update calculator"
git push
```

Workflow rebuilds and republishes within ~1–2 min of every push to `main`.

---

## Installing the PWA on a phone or tablet

Once the site is live:

### iPhone / iPad (Safari)
1. Open the URL in Safari
2. Tap the **Share** button
3. Tap **Add to Home Screen**
4. Tap **Add**

The app launches fullscreen with the Hadron icon, no browser chrome.

### Android (Chrome / Edge)
1. Open the URL in Chrome
2. Tap the **⋮ menu** → **Install app** *(or look for the install banner at the bottom)*
3. Confirm

### Desktop (Chrome, Edge, Brave)
- Look for the **install icon** in the address bar (a small monitor with a down arrow), or
- Menu → **Install Hadron…**

---

## Custom domain (optional)

To host at e.g. `app.hadrongrp.com`:

1. Create a file at the repo root named `CNAME` containing exactly: `app.hadrongrp.com`
2. At your DNS provider, add a `CNAME` record: `app` → `<your-username>.github.io`
3. In **Settings → Pages**, enter the custom domain and tick **Enforce HTTPS** once the cert issues.

---

## Updating the PWA after changes

The service worker caches the app shell, so users may need to relaunch the installed app twice to see updates. To force a faster update, bump `CACHE_VERSION` in `sw.js` (e.g. `'hadron-v2'`) whenever you ship a meaningful change.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Site 404 after enabling Pages | Wait 1–2 min; confirm Source is **GitHub Actions**; check Actions tab for a green run. |
| Logo missing | Confirm `Hadron_Logo.png` is at the repo root (case-sensitive filename). |
| Install prompt missing on Android | Service workers require HTTPS. GitHub Pages provides it automatically; just don't open via `file://`. |
| "Add to Home Screen" missing on iOS | Must use **Safari**, not Chrome on iOS. |
| Chatbase bot won't load | Browser console will show the error; confirm the Chatbase script ID in `index.html`. |
| Old version still showing after deploy | Service worker caching — close and reopen the installed PWA, or hard refresh in browser (`Ctrl+F5` / `Cmd+Shift+R`). |

---

Questions? Email **Jaco@hadrongrp.com**.
