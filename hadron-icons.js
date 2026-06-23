/*
 * Hadron Tristroke icon system — ported from the ERP (components/hadron-icons.tsx).
 *
 * Every icon is three stroked layers: primary outline → secondary teal accent →
 * yellow pop. Strokes reference CSS variables (--icon-primary/secondary/accent),
 * so icons re-tint automatically when the theme flips.
 *
 * Exposes (window.*):
 *   HADRON_ICONS        — name → SVG inner-markup map (30 here; 113 total in ERP)
 *   renderHadronIcon(name, opts)  — returns an SVGSVGElement (per the ERP helper)
 *   hadronIcon(name, opts)        — returns an SVG *string* (for innerHTML templates)
 *   hadronThemeIcon(theme)        — sun/moon string for the theme toggle
 *
 * opts: { size=24, strokeWidth=1, title }
 */
(function () {
  'use strict';

  const HADRON_ICONS = {
    dashboard:    '<g stroke="var(--icon-primary)"><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.3"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.3"/></g><g stroke="var(--icon-secondary)"><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.3"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.3"/></g><g stroke="var(--icon-accent)"><line x1="5" y1="6" x2="9.5" y2="6"/><line x1="14.5" y1="16" x2="19" y2="16"/></g>',
    invoice:      '<g stroke="var(--icon-primary)"><path d="M6 3.5h9l4 4v13H6z"/></g><g stroke="var(--icon-secondary)"><path d="M15 3.5v4h4"/></g><g stroke="var(--icon-accent)"><path d="M10 10h3a1.4 1.4 0 0 1 0 2.8h-3M10 10v6.5M10 12.8l3.5 2.5"/></g>',
    statement:    '<g stroke="var(--icon-primary)"><path d="M6 3.5h12v17H6z"/></g><g stroke="var(--icon-secondary)"><path d="M9 8h8M9 11h8M9 14h5"/></g><g stroke="var(--icon-accent)"><circle cx="14.5" cy="17" r="1.2"/></g>',
    quote:        '<g stroke="var(--icon-primary)"><path d="M6 3.5h9l4 4v13H6z"/></g><g stroke="var(--icon-secondary)"><path d="M15 3.5v4h4"/></g><g stroke="var(--icon-accent)"><path d="M9 11h6M9 14h6M9 17h3"/></g>',
    salesOrder:   '<g stroke="var(--icon-primary)"><path d="M6 3.5h9l4 4v13H6z"/></g><g stroke="var(--icon-secondary)"><path d="M15 3.5v4h4"/><line x1="9" y1="17" x2="13" y2="17"/></g><g stroke="var(--icon-accent)"><polyline points="9,13.5 11,15.5 15,11"/></g>',
    creditNote:   '<g stroke="var(--icon-primary)"><path d="M6 3.5h9l4 4v13H6z"/></g><g stroke="var(--icon-secondary)"><path d="M15 3.5v4h4"/></g><g stroke="var(--icon-accent)"><line x1="9" y1="14" x2="16" y2="14"/><polyline points="11,12 9,14 11,16"/></g>',
    payment:      '<g stroke="var(--icon-primary)"><rect x="3" y="6" width="18" height="12" rx="1.6"/></g><g stroke="var(--icon-secondary)"><line x1="3" y1="10" x2="21" y2="10"/></g><g stroke="var(--icon-accent)"><circle cx="12" cy="14.5" r="2"/><path d="M11 13.5h2"/></g>',
    deliveryNote: '<g stroke="var(--icon-primary)"><path d="M6 3.5h9l4 4v13H6z"/></g><g stroke="var(--icon-secondary)"><path d="M15 3.5v4h4"/><rect x="9" y="10" width="6" height="4"/></g><g stroke="var(--icon-accent)"><circle cx="11" cy="16" r="0.8"/><circle cx="14" cy="16" r="0.8"/></g>',
    document:     '<g stroke="var(--icon-primary)"><path d="M6 3.5h9l4 4v13H6z"/></g><g stroke="var(--icon-secondary)"><path d="M15 3.5v4h4"/></g><g stroke="var(--icon-accent)"><line x1="9" y1="12" x2="16" y2="12"/><line x1="9" y1="15" x2="16" y2="15"/><line x1="9" y1="18" x2="13" y2="18"/></g>',
    folder:       '<g stroke="var(--icon-primary)"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></g><g stroke="var(--icon-secondary)"><path d="M3 10h18"/></g>',
    profile:      '<g stroke="var(--icon-primary)"><path d="M5 20.5c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5"/></g><g stroke="var(--icon-secondary)"><circle cx="12" cy="8.5" r="3.5"/></g>',
    settings:     '<g stroke="var(--icon-primary)"><path d="M18.87 10.64L21.81 10.05L21.81 13.95L18.87 13.37L17.82 15.89L20.32 17.56L17.56 20.32L15.89 17.82L13.37 18.87L13.95 21.81L10.05 21.81L10.64 18.87L8.11 17.82L6.44 20.32L3.68 17.56L6.18 15.89L5.13 13.37L2.19 13.95L2.19 10.05L5.13 10.64L6.18 8.11L3.68 6.44L6.44 3.68L8.11 6.18L10.64 5.13L10.05 2.19L13.95 2.19L13.37 5.13L15.89 6.18L17.56 3.68L20.32 6.44L17.82 8.11Z"/></g><g stroke="var(--icon-secondary)"><circle cx="12" cy="12" r="3.8"/></g><g stroke="var(--icon-accent)"><circle cx="12" cy="12" r="1.4"/></g>',
    notifications:'<g stroke="var(--icon-primary)"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/></g><g stroke="var(--icon-secondary)"><path d="M10 20.5a2 2 0 0 0 4 0"/></g><g stroke="var(--icon-accent)"><circle cx="17.5" cy="6.5" r="2.2"/></g>',
    search:       '<g stroke="var(--icon-primary)"><circle cx="10.5" cy="10.5" r="6"/></g><g stroke="var(--icon-secondary)"><line x1="20" y1="20" x2="15" y2="15"/></g><g stroke="var(--icon-accent)"><line x1="8" y1="10.5" x2="13" y2="10.5"/></g>',
    calendar:     '<g stroke="var(--icon-primary)"><rect x="3.5" y="5" width="17" height="15.5" rx="1.6"/></g><g stroke="var(--icon-secondary)"><line x1="3.5" y1="10" x2="20.5" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></g><g stroke="var(--icon-accent)"><rect x="10" y="13" width="4" height="4" rx="0.6"/></g>',
    help:         '<g stroke="var(--icon-primary)"><circle cx="12" cy="12" r="8.5"/></g><g stroke="var(--icon-secondary)"><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4"/></g><g stroke="var(--icon-accent)"><circle cx="12" cy="17" r="0.7"/></g>',
    menu:         '<g stroke="var(--icon-primary)"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/></g><g stroke="var(--icon-secondary)"><line x1="4" y1="12" x2="20" y2="12"/></g>',
    close:        '<g stroke="var(--icon-primary)"><line x1="6" y1="6" x2="18" y2="18"/></g><g stroke="var(--icon-secondary)"><line x1="18" y1="6" x2="6" y2="18"/></g>',
    logout:       '<g stroke="var(--icon-primary)"><path d="M10 4h-5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/></g><g stroke="var(--icon-secondary)"><line x1="9" y1="12" x2="16" y2="12"/></g><g stroke="var(--icon-accent)"><path d="M14 8l4 4-4 4"/></g>',
    backArrow:    '<g stroke="var(--icon-primary)"><line x1="19" y1="12" x2="5" y2="12"/></g><g stroke="var(--icon-accent)"><polyline points="10,7 5,12 10,17"/></g>',
    forwardArrow: '<g stroke="var(--icon-primary)"><line x1="5" y1="12" x2="19" y2="12"/></g><g stroke="var(--icon-accent)"><polyline points="14,7 19,12 14,17"/></g>',
    add:          '<g stroke="var(--icon-primary)"><circle cx="12" cy="12" r="8.5"/></g><g stroke="var(--icon-accent)"><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></g>',
    edit:         '<g stroke="var(--icon-primary)"><path d="M4 20l1-4 11-11 3 3-11 11z"/></g><g stroke="var(--icon-secondary)"><line x1="14" y1="7" x2="17" y2="10"/></g><g stroke="var(--icon-accent)"><line x1="4" y1="20" x2="7" y2="19"/></g>',
    view:         '<g stroke="var(--icon-primary)"><path d="M2 12c2.5-4.5 6-7 10-7s7.5 2.5 10 7c-2.5 4.5-6 7-10 7s-7.5-2.5-10-7z"/></g><g stroke="var(--icon-secondary)"><circle cx="12" cy="12" r="2.8"/></g><g stroke="var(--icon-accent)"><circle cx="12" cy="12" r="1"/></g>',
    download:     '<g stroke="var(--icon-primary)"><path d="M4 16v3.5h16V16"/></g><g stroke="var(--icon-secondary)"><line x1="12" y1="4" x2="12" y2="15"/></g><g stroke="var(--icon-accent)"><polyline points="7,11 12,16 17,11"/></g>',
    print:        '<g stroke="var(--icon-primary)"><path d="M5 9h14v8h-3v3H8v-3H5z"/></g><g stroke="var(--icon-secondary)"><path d="M7 9V4h10v5"/></g><g stroke="var(--icon-accent)"><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="17" x2="15" y2="17"/></g>',
    email:        '<g stroke="var(--icon-primary)"><rect x="3" y="5.5" width="18" height="13" rx="1.6"/></g><g stroke="var(--icon-secondary)"><polyline points="4,7 12,13 20,7"/></g>',
    phone:        '<g stroke="var(--icon-primary)"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 6a2 2 0 0 1 2-2z"/></g>',
    location:     '<g stroke="var(--icon-primary)"><path d="M12 21c-4-5-7-9-7-12.5a7 7 0 0 1 14 0c0 3.5-3 7.5-7 12.5z"/></g><g stroke="var(--icon-accent)"><circle cx="12" cy="8.5" r="2.5"/></g>',
    bank:         '<g stroke="var(--icon-primary)"><path d="M3 20h18M3 10L12 4l9 6"/></g><g stroke="var(--icon-secondary)"><path d="M4 10h16"/></g><g stroke="var(--icon-accent)"><line x1="7" y1="13" x2="7" y2="18"/><line x1="11" y1="13" x2="11" y2="18"/><line x1="13" y1="13" x2="13" y2="18"/><line x1="17" y1="13" x2="17" y2="18"/></g>',
    currency:     '<g stroke="var(--icon-primary)"><circle cx="12" cy="12" r="8.5"/></g><g stroke="var(--icon-accent)"><path d="M10 8h4a1.5 1.5 0 0 1 0 3h-4M10 8v9M10 11l5 3.5"/></g>',
    approve:      '<g stroke="var(--icon-primary)"><circle cx="12" cy="12" r="8.5"/></g><g stroke="var(--icon-accent)"><polyline points="8,12 11,15 16,9.5"/></g>',
    reject:       '<g stroke="var(--icon-primary)"><circle cx="12" cy="12" r="8.5"/></g><g stroke="var(--icon-secondary)"><line x1="9" y1="9" x2="15" y2="15"/></g><g stroke="var(--icon-accent)"><line x1="15" y1="9" x2="9" y2="15"/></g>',
    statusPending:'<g stroke="var(--icon-primary)"><circle cx="12" cy="12" r="8.5"/></g><g stroke="var(--icon-accent)"><path d="M12 7v5.5l3 2"/></g>',
    statusPaid:   '<g stroke="var(--icon-primary)"><rect x="3" y="6" width="18" height="12" rx="1.6"/></g><g stroke="var(--icon-secondary)"><circle cx="17.5" cy="12" r="1.3"/></g><g stroke="var(--icon-accent)"><polyline points="7,12 10,14.5 14,10"/></g>',
    statusOverdue:'<g stroke="var(--icon-primary)"><circle cx="12" cy="12" r="8.5"/></g><g stroke="var(--icon-accent)"><path d="M12 8v4.5l-2.5 2.5"/><circle cx="12" cy="12" r="0.5"/></g>',
    trendUp:      '<g stroke="var(--icon-primary)"><polyline points="3,17 9,11 13,15 21,7"/></g><g stroke="var(--icon-accent)"><polyline points="15,7 21,7 21,13"/></g>',
    trendDown:    '<g stroke="var(--icon-primary)"><polyline points="3,7 9,13 13,9 21,17"/></g><g stroke="var(--icon-accent)"><polyline points="15,17 21,17 21,11"/></g>',
  };

  function svgOpen(size, sw, title) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
      'width="' + size + '" height="' + size + '" fill="none" stroke-width="' + sw + '" ' +
      'stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle" ' +
      (title ? 'role="img" aria-label="' + title + '"><title>' + title + '</title>'
             : 'role="presentation">');
  }

  // SVG string — for the app's innerHTML template literals.
  function hadronIcon(name, opts) {
    opts = opts || {};
    const body = HADRON_ICONS[name];
    if (!body) return '';
    return svgOpen(opts.size || 24, opts.strokeWidth || 1, opts.title) + body + '</svg>';
  }

  // SVGSVGElement — matches the ERP's renderHadronIcon signature.
  function renderHadronIcon(name, opts) {
    opts = opts || {};
    if (!HADRON_ICONS[name]) return null;
    const wrap = document.createElement('div');
    wrap.innerHTML = hadronIcon(name, opts);
    return wrap.firstChild;
  }

  // Theme-toggle sun/moon (outside the Tristroke set; uses currentColor).
  // Pass the CURRENT theme; returns the icon of what you'll switch INTO.
  function hadronThemeIcon(theme) {
    const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>';
    const moon = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    const inner = theme === 'dark' ? sun : moon; // dark now → show sun (switch to light)
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle">' +
      inner + '</svg>';
  }

  window.HADRON_ICONS = HADRON_ICONS;
  window.renderHadronIcon = renderHadronIcon;
  window.hadronIcon = hadronIcon;
  window.hadronThemeIcon = hadronThemeIcon;
})();
