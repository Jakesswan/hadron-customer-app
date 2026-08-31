/*
 * Hadron Group — Team management (account owner only)
 *
 *  - Lists the company's members (name, email, role)
 *  - Invites a teammate by email as Operator (create + view) or Viewer (view only)
 *  - Changes a member's role, or revokes a pending invite
 *
 * Everything here is ALSO enforced server-side by RLS + the org_invites policies
 * and the redeem_org_invite() / my_pending_invite() functions — this module is
 * only the interface. Tile + window are shown only for admin / customer_admin.
 */
(function () {
  'use strict';

  let mounted = false;

  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"']/g,
      m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
  function toast(m) { if (window.showToast) window.showToast(m); }
  function canManage() {
    const r = window.HG_PROFILE && window.HG_PROFILE.role;
    return r === 'admin' || r === 'customer_admin';
  }
  const roleName = { admin: 'Hadron staff', customer_admin: 'Owner', operator: 'Operator', viewer: 'Viewer' };

  // ── Render ──────────────────────────────────────────────
  async function renderInto(host) {
    if (!host) return;
    if (!window.HG_DB || !window.HG_PROFILE) {
      host.innerHTML = '<div class="hg-card"><p style="color:var(--muted);">Sign in to manage your team.</p></div>';
      return;
    }
    if (!canManage()) {
      host.innerHTML = '<div class="hg-card"><p style="color:var(--muted);">Only the account owner can manage the team.</p></div>';
      return;
    }
    const orgName = (window.HG_PROFILE.organisations && window.HG_PROFILE.organisations.name) || 'Your company';
    host.innerHTML = `
      <div class="hg-hero" style="background:linear-gradient(135deg,#3AAEDB 0%,#1a3d9e 100%);">
        <div>
          <h2 class="hg-hero-title">${esc(orgName)} · Team</h2>
          <div class="hg-hero-sub">Invite teammates and set what they can do</div>
        </div>
        <div class="hg-hero-icon">👥</div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">Invite a teammate</div>
        <p style="color:var(--muted);font-size:13px;margin:2px 0 12px;">They sign up (or sign in) with this email, then accept the invite to join ${esc(orgName)}. Operators create &amp; view reports; viewers can only view. Only you can edit or delete.</p>
        <div class="calc-form">
          <div class="form-group"><label>Email</label><input type="email" id="team_inv_email" placeholder="teammate@company.com" autocomplete="off"></div>
          <div class="form-group"><label>Role</label>
            <select id="team_inv_role">
              <option value="operator">Operator — create &amp; view reports</option>
              <option value="viewer">Viewer — view only</option>
            </select>
          </div>
          <button type="button" class="calc-btn" style="background:#3AAEDB;color:#0f2733;" onclick="hgTeamInvite()">✉️ Send invite</button>
        </div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">Members</div>
        <div id="team_members"><p style="color:var(--muted);">Loading…</p></div>
      </div>

      <div class="hg-card">
        <div class="hg-section-title">Pending invites</div>
        <div id="team_invites"><p style="color:var(--muted);">Loading…</p></div>
      </div>`;
    refreshMembers();
    refreshInvites();
  }

  async function refreshMembers() {
    const host = document.getElementById('team_members');
    if (!host) return;
    let members = [];
    try { members = await window.HG_DB.profiles.list(); } catch (_) {}
    const me = window.HG_PROFILE.id;
    members.sort((a, b) => String(a.full_name || a.email || '').localeCompare(String(b.full_name || b.email || '')));
    host.innerHTML = members.length ? members.map(m => {
      const isMe = m.id === me;
      const editable = !isMe && (m.role === 'operator' || m.role === 'viewer');
      const rightSide = editable
        ? `<select onchange="hgTeamSetRole('${esc(m.id)}', this.value)" aria-label="Role" style="padding:6px 8px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);">
             <option value="operator"${m.role === 'operator' ? ' selected' : ''}>Operator</option>
             <option value="viewer"${m.role === 'viewer' ? ' selected' : ''}>Viewer</option>
           </select>`
        : `<span class="hg-chip neutral">${esc(roleName[m.role] || m.role)}</span>`;
      return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="min-width:0;">
          <div style="font-weight:600;">${esc(m.full_name || m.email)}${isMe ? ' <span style="color:var(--muted);font-weight:400;">(you)</span>' : ''}</div>
          <div style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;">${esc(m.email)}</div>
        </div>
        <div style="flex:none;">${rightSide}</div>
      </div>`;
    }).join('') : '<p style="color:var(--muted);">No members yet.</p>';
  }

  async function refreshInvites() {
    const host = document.getElementById('team_invites');
    if (!host) return;
    let invites = [];
    try { invites = await window.HG_DB.org_invites.list({ status: 'pending' }); } catch (_) {}
    host.innerHTML = invites.length ? invites.map(i =>
      `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="min-width:0;">
          <div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;">${esc(i.email)}</div>
          <div style="font-size:12px;color:var(--muted);">Invited as ${esc(roleName[i.role] || i.role)}</div>
        </div>
        <button class="hg-btn ghost" style="flex:none;" onclick="hgTeamRevoke('${esc(i.id)}')">Revoke</button>
      </div>`).join('') : '<p style="color:var(--muted);">No pending invites.</p>';
  }

  // ── Actions ─────────────────────────────────────────────
  window.hgTeamInvite = async function () {
    if (!canManage() || !window.HG_SUPA) return;
    const email = (document.getElementById('team_inv_email').value || '').trim().toLowerCase();
    const role = document.getElementById('team_inv_role').value;
    if (!email || email.indexOf('@') < 1) { toast('Enter a valid email address'); return; }
    if (role !== 'operator' && role !== 'viewer') return;
    try {
      const { error } = await window.HG_SUPA.from('org_invites').upsert(
        { email, organisation_id: window.HG_PROFILE.organisation_id, role, status: 'pending',
          invited_by: window.HG_PROFILE.id, accepted_at: null },
        { onConflict: 'email,organisation_id' });
      if (error) throw error;
      document.getElementById('team_inv_email').value = '';
      toast('Invite sent to ' + email);
      refreshInvites();
    } catch (e) { toast('Could not invite: ' + (e.message || e)); }
  };

  window.hgTeamSetRole = async function (id, role) {
    if (!canManage() || !window.HG_SUPA) return;
    if (role !== 'operator' && role !== 'viewer') return;
    try {
      const { error } = await window.HG_SUPA.from('profiles').update({ role }).eq('id', id);
      if (error) throw error;
      toast('Role updated');
    } catch (e) { toast('Could not update role: ' + (e.message || e)); refreshMembers(); }
  };

  window.hgTeamRevoke = async function (id) {
    if (!canManage() || !window.HG_SUPA) return;
    try {
      const { error } = await window.HG_SUPA.from('org_invites').update({ status: 'revoked' }).eq('id', id);
      if (error) throw error;
      toast('Invite revoked');
      refreshInvites();
    } catch (e) { toast('Could not revoke: ' + (e.message || e)); }
  };

  // ── Mount window + tile (mirrors portal.js) ─────────────
  function ensureMounted() {
    if (mounted || document.getElementById('window-team')) { mounted = true; return; }
    const win = document.createElement('div');
    win.className = 'window';
    win.id = 'window-team';
    win.innerHTML = `
      <div class="window-header">
        <button class="back-button" onclick="closeWindow('team')">←</button>
        <span class="window-title">Team</span>
      </div>
      <div class="window-content" id="teamContent">
        <div class="hg-empty" style="padding:30px 20px;text-align:center;">Loading…</div>
      </div>`;
    document.body.appendChild(win);
    mounted = true;
  }

  function ensureTile() {
    const grid = document.querySelector('.app-icons') || document.querySelector('.apps-grid') || document.querySelector('.home-grid');
    if (!grid || document.querySelector('[data-app="team"]')) return;
    const tile = document.createElement('div');
    tile.className = 'app-icon';
    tile.setAttribute('data-app', 'team');
    tile.setAttribute('data-roles', 'admin,customer_admin');
    tile.setAttribute('onclick', "openWindow('team')");
    tile.innerHTML = '<div class="icon" style="background:linear-gradient(135deg,#3AAEDB 0%,#1a3d9e 100%);">👥</div><div class="app-name">Team</div>';
    grid.appendChild(tile);
  }

  const _origOpen = window.openWindow;
  window.openWindow = function (id) {
    if (typeof _origOpen === 'function') _origOpen(id);
    if (id === 'team') { ensureMounted(); renderInto(document.getElementById('teamContent')); }
  };

  function onProfileLoaded() {
    ensureMounted();
    ensureTile();
    // Re-apply role visibility now that the Team tile exists (mirrors portal.js/auth-ui.js).
    const role = window.HG_PROFILE && window.HG_PROFILE.role;
    document.querySelectorAll('[data-roles]').forEach(el => {
      const allowed = (el.getAttribute('data-roles') || '').split(',').map(s => s.trim()).filter(Boolean);
      el.style.display = allowed.includes(role) ? '' : 'none';
    });
  }

  if (window.HG_PROFILE) onProfileLoaded();
  document.addEventListener('hg:profile:loaded', onProfileLoaded);
})();
