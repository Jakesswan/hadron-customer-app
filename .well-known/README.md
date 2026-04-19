# Digital Asset Links

This folder contains `assetlinks.json`, which Android uses to verify that your
Trusted Web Activity (TWA) — the wrapper Google Play will install on user
devices — is legitimately owned by the same entity that controls this web app.

## What you need to do before Play Store launch

1. **Get your Android app's package name.** When you wrap this PWA with
   [PWABuilder](https://www.pwabuilder.com/), you'll pick a package name.
   Suggested: `com.hadrongrp.customer` (already filled in).

2. **Get your app signing SHA-256 fingerprint.**
   - If you let Google Play manage signing (recommended, and the default),
     grab the fingerprint from:
     **Play Console → your app → Setup → App integrity → App signing key certificate**
   - Copy the "SHA-256 certificate fingerprint" (looks like `AA:BB:CC:...`, 64 hex pairs).

3. **Replace the placeholder in `assetlinks.json`:**
   - `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT` → your actual SHA-256.

4. **Verify it's live** after deploy by opening:
   `https://hadrongrp.github.io/.well-known/assetlinks.json`
   (or wherever this site is hosted). It should return the JSON you see here.

5. **Test with Google's verifier:**
   https://developers.google.com/digital-asset-links/tools/generator

## Why `.nojekyll`?

GitHub Pages uses Jekyll by default, which skips files/folders that start with
a dot (`.well-known`, `.github`, etc.). The empty `.nojekyll` file at the repo
root tells GitHub Pages to serve them as-is.
