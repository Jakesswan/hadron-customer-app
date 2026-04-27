/*
 * Hadron Group — Customer Portal
 *
 * A simplified, read-mostly home for customer_admin users.
 *  - Open samples (status: received / testing)
 *  - Recent reports (status: reported, last 30 days)
 *  - Upcoming jobs (status: open / in_progress)
 *  - Quick actions: open LIMS, open Academy, contact Support
 *
 * RLS already filters everything to the user's org, so we just query
 * HG_DB and render. Hadron staff and operators never see this view —
 * they get the regular desktop.
 */

(function () {
  'use strict';

  let bootedFor = null;     // last profile.id we rendered for
  let mounted   = false;

  // ── Render ──────────────────────────────────────────────
  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return iso; }
  }

  function statusBadge(status) {
    const map = {
      received:    { color: '#5a73c2', label: 'Received' },
      testing:     { color: '#f5a623', label: 'In testing' },
      reported:    { color: '#2bb673', label: 'Reported' },
      archived:    { color: '#4b5b6d', label: 'Archived' },
      rejected:    { color: '#d44a26', label: 'Rejected' },
      open:        { color: '#5a73c2', label: 'Open' },
      in_progress: { color: '#f5a623', label: 'In progress' },
      done:        { color: '#2bb673', label: 'Done' },
      cancelled:   { color: '#4b5b6d', label: 'Cancelled' }
    };
    const m = map[status] || { color:'#888', label: status || '—' };
    return `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${m.color}1f;color:${m.color};font-size:11px;font-weight:600;">${m.label}</span>`;
  }

  function emptyState(emoji, title, body) {
    return `
      <div class="hg-empty" style="padding:30px 20px;text-align:center;">
        <span class="emoji" style="font-size:36px;">${emoji}</span>
        <h3 style="margin:10px 0 6px;">${title}</h3>
        <p style="margin:0;font-size:13px;opacity:0.75;">${body}</p>
      </div>`;
  }

  async function renderInto(host) {
    if (!host) return;
    if (!window.HG_DB || !window.HG_PROFILE) {
      host.innerHTML = `<div class="hg-card">${emptyState('🔌','Cloud not connected','Sign in to see your samples and reports here.')}</div>`;
      return;
    }

    const profile = window.HG_PROFILE;
    const orgName = profile.organisations?.name || 'Your organisation';

    host.innerHTML = `
      <div class="hg-hero" style="background: linear-gradient(135deg, #00b1ca 0%, #1a3d9e 100%);">
        <div>
          <h2 class="hg-hero-title">${esc(orgName)}</h2>
          <div class="hg-hero-sub">Welcome back, ${esc(profile.full_name || profile.email)}</div>
        </div>
        <div class="hg-hero-icon">🌊</div>
      </div>

      <div class="hg-card" id="portal-samples">
        <div class="hg-section-title">Open samples</div>
        <div class="hg-empty" style="padding:18px 0;font-size:13px;opacity:0.6;">Loading…</div>
      </div>

      <div class="hg-card" id="portal-reports">
        <div class="hg-section-title">Recent reports</div>
        <div class="hg-empty" style="padding:18px 0;font-size:13px;opacity:0.6;">Loading…</div>
      </div>

      <div class="hg-card" id="portal-jobs">
        <div class="hg-section-title">Upcoming service visits</div>
        <div class="hg-empty" style="padding:18px 0;font-size:13px;opacity:0.6;">Loading…</div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">Quick actions</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="hg-btn primary" onclick="openWindow('lims')">🧪 Open LIMS</button>
          <button class="hg-btn ghost"   onclick="openWindow('academy')">🎓 Hadron Academy</button>
          <button class="hg-btn ghost"   onclick="openWindow('support')">🎧 Contact Support</button>
        </div>
      </div>
    `;

    // Pull data in parallel
    const [samples, reports, jobs] = await Promise.all([
      window.HG_DB.samples.list().catch(()=>[]),
      window.HG_DB.sample_results.list().catch(()=>[]),
      window.HG_DB.jobs.list().catch(()=>[])
    ]);

    // ── Open samples ──
    const openSamples = (samples || [])
      .filter(s => ['received','testing','in-progress','pending'].includes(s.status))
      .sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0))
      .slice(0, 8);

    const sampleHost = document.getElementById('portal-samples');
    if (sampleHost) {
      if (!openSamples.length) {
        sampleHost.querySelector('.hg-empty').outerHTML = emptyState('🧪','No open samples','New samples your operator logs will appear here.');
      } else {
        sampleHost.innerHTML = `
          <div class="hg-section-title">Open samples</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${openSamples.map(s => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border,rgba(0,0,0,0.08));border-radius:10px;cursor:pointer;" onclick="location.hash='#lims/sample/${esc(s.id)}'; openWindow('lims');">
                <div>
                  <div style="font-weight:600;">${esc(s.sample_no || s.id)}</div>
                  <div style="font-size:12px;opacity:0.7;">${esc(s.matrix||'—')} · ${esc(s.sample_point||'')} · ${fmtDate(s.sampled_at)}</div>
                </div>
                <div>${statusBadge(s.status)}</div>
              </div>
            `).join('')}
          </div>`;
      }
    }

    // ── Recent reports ──
    const recentReports = (reports || [])
      .filter(r => r.status === 'authorised' || r.pass_fail)
      .sort((a,b) => new Date(b.recorded_at||b.created_at||0) - new Date(a.recorded_at||a.created_at||0))
      .slice(0, 8);

    const reportHost = document.getElementById('portal-reports');
    if (reportHost) {
      if (!recentReports.length) {
        reportHost.querySelector('.hg-empty').outerHTML = emptyState('📊','No reports yet','Once a sample is reported and authorised, the result lands here.');
      } else {
        reportHost.innerHTML = `
          <div class="hg-section-title">Recent reports</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${recentReports.map(r => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border,rgba(0,0,0,0.08));border-radius:10px;">
                <div>
                  <div style="font-weight:600;">${esc(r.test_name || r.test_code || '—')}</div>
                  <div style="font-size:12px;opacity:0.7;">Sample ${esc(r.sample_id)} · ${fmtDate(r.recorded_at)}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:600;">${esc(r.value_text||'—')} ${esc(r.units||'')}</div>
                  ${r.pass_fail ? statusBadge(r.pass_fail) : ''}
                </div>
              </div>
            `).join('')}
          </div>`;
      }
    }

    // ── Upcoming jobs ──
    const upcomingJobs = (jobs || [])
      .filter(j => ['open','in_progress'].includes(j.status))
      .sort((a,b) => new Date(a.scheduled_for||a.created_at||0) - new Date(b.scheduled_for||b.created_at||0))
      .slice(0, 6);

    const jobsHost = document.getElementById('portal-jobs');
    if (jobsHost) {
      if (!upcomingJobs.length) {
        jobsHost.querySelector('.hg-empty').outerHTML = emptyState('📅','No upcoming visits','Hadron Group will schedule visits here when they\'re booked.');
      } else {
        jobsHost.innerHTML = `
          <div class="hg-section-title">Upcoming service visits</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${upcomingJobs.map(j => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border,rgba(0,0,0,0.08));border-radius:10px;">
                <div>
                  <div style="font-weight:600;">${esc(j.title||'Service visit')}</div>
                  <div style="font-size:12px;opacity:0.7;">${j.scheduled_for ? fmtDate(j.scheduled_for) : 'Date TBC'}${j.description?(' · '+esc(j.description.slice(0,60))):''}</div>
                </div>
                <div>${statusBadge(j.status)}</div>
              </div>
            `).join('')}
          </div>`;
      }
    }

    bootedFor = profile.id;
  }

  // simple esc helper
  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  // ── Mount the window if the role demands it ─────────────
  function ensureMounted() {
    if (mounted) return;
    if (document.getElementById('window-portal')) { mounted = true; return; }
    const win = document.createElement('div');
    win.className = 'window';
    win.id = 'window-portal';
    win.innerHTML = `
      <div class="window-header">
        <button class="back-button" onclick="closeWindow('portal')">←</button>
        <span class="window-title">Customer Portal</span>
      </div>
      <div class="window-content" id="portalContent">
        <div class="hg-empty" style="padding:30px 20px;text-align:center;">Loading…</div>
      </div>
    `;
    document.body.appendChild(win);
    mounted = true;
  }

  // Add a tile to the home grid for customer_admin role.
  function ensureTile() {
    const grid = document.querySelector('.app-icons') || document.querySelector('.apps-grid') || document.querySelector('.home-grid');
    if (!grid) return;
    if (document.querySelector('[data-app="portal"]')) return;
    const tile = document.createElement('div');
    tile.className = 'app-icon';
    tile.setAttribute('data-app', 'portal');
    tile.setAttribute('data-roles', 'customer_admin,viewer');
    tile.setAttribute('onclick', "openWindow('portal')");
    tile.innerHTML = `
      <div class="icon" style="background: linear-gradient(135deg, #00b1ca 0%, #1a3d9e 100%);">🌊</div>
      <div class="app-name">Portal</div>
    `;
    // Insert at the very front so it's the first thing the customer sees.
    grid.insertBefore(tile, grid.firstChild);
  }

  // Hook openWindow to render content when portal opens.
  const _origOpen = window.openWindow;
  window.openWindow = function (id) {
    if (typeof _origOpen === 'function') _origOpen(id);
    if (id === 'portal') {
      ensureMounted();
      const host = document.getElementById('portalContent');
      renderInto(host);
    }
  };

  // ── Boot on profile load ────────────────────────────────
  document.addEventListener('hg:profile:loaded', () => {
    ensureMounted();
    ensureTile();

    // Re-apply role visibility now that the new tile exists.
    const role = window.HG_PROFILE?.role;
    document.querySelectorAll('[data-roles]').forEach(el => {
      const allowed = (el.getAttribute('data-roles') || '').split(',').map(s => s.trim()).filter(Boolean);
      el.style.display = allowed.includes(role) ? '' : 'none';
    });

    // Auto-open the portal for customer admins on sign-in (only if no other
    // window is already open).
    if (role === 'customer_admin' || role === 'viewer') {
      const anyOpen = document.querySelector('.window.active');
      if (!anyOpen) setTimeout(() => window.openWindow('portal'), 250);
    }
  });

  // Refresh content when LIMS sync delivers new data.
  document.addEventListener('hg:lims:synced', () => {
    const host = document.getElementById('portalContent');
    if (host && document.getElementById('window-portal')?.classList.contains('active')) {
      renderInto(host);
    }
  });
})();
