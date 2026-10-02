# Third-party software

The Hadron Customer App includes, or loads, the following third-party software.

## Included in this repository (served by the app itself)

### supabase-js 2.117.2 — `supabase-js-2.117.2.js`
The package's `dist/umd/supabase.js`, unmodified
(SHA-256 `WdOUh8NYmEO0EDItij1WLOAiq6HlzLFomO8/sqDaLs0=`, as published by jsDelivr).
https://github.com/supabase/supabase-js

    MIT License

    Copyright (c) 2020 Supabase

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

### html5-qrcode 2.3.8 — `html5-qrcode.min.js`
QR code scanning. By mebjas and contributors. https://github.com/mebjas/html5-qrcode
Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

### Gothic A1 — `fonts/gothic-a1-{400,700,800}-latin.woff2`
The Latin subset of Gothic A1 (Version 2.50) in three weights, as served by Google Fonts, unmodified.
"(C) Copyright HanYang I&C Co.,Ltd. All rights reserved." Licensed under the SIL Open Font License,
Version 1.1: the full text, with that copyright notice, is in `fonts/OFL.txt` (from the font's upstream,
google/fonts `ofl/gothica1/OFL.txt`). No Reserved Font Name is declared. Each font file also carries the
copyright notice and the licence's address.

### QR Code Generator for JavaScript — `qr.js`
Copyright (c) 2009 Kazuhiko Arase. Licensed under the MIT license (notice kept in the file).
"QR Code" is a registered trademark of DENSO WAVE INCORPORATED.

## Loaded from public CDNs at runtime

- **jsPDF 2.5.1** (cdnjs) — MIT License. https://github.com/parallax/jsPDF
- **Tesseract.js 5** (jsDelivr, loaded only when text is read from a photo) — Apache License 2.0. https://github.com/naptha/tesseract.js
- **SortableJS 1.15.2** (jsDelivr, Customize home) — MIT License. https://github.com/SortableJS/Sortable
- **SheetJS Community Edition 0.18.5** (jsDelivr, Data Manager import / export) — Apache License 2.0. https://github.com/SheetJS/sheetjs
- **html5-qrcode 2.3.8** (cdnjs, only if the copy above fails to load) — Apache License 2.0.
- **Chart.js 4.4.1** (cdnjs, Jar Test DSS page) — MIT License. https://github.com/chartjs/Chart.js
- **Space Mono and Syne** (Google Fonts, Jar Test DSS page) — SIL Open Font License 1.1.
