/**
 * Workshilla — Projects list, detail (daily updates), wizard, team management
 */
(function (WS) {
  'use strict';

  const U = WS.Utils;

  function projectCard(p) {
    const em = WS.Store.getUser(p.engagement_manager_id);
    const pm = WS.Store.getUser(p.project_manager_id);
    const lead = WS.Store.getUser(p.lead_id);
    const progress = U.timelineProgress(p.estimated_timeline.start_date, p.estimated_timeline.end_date);
    const canTeam = WS.Auth.canEditProjectTeam(p);
    const typeLabel = p.type === 'internal'
      ? `Internal · ${p.team_name || '—'}`
      : `Client · ${p.cst_team_name || '—'}${p.client_name ? ' · ' + p.client_name : ''}`;

    return `
      <article class="ws-card project-card" data-open-project="${p.id}" role="button" tabindex="0">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-lg font-semibold text-slate-900 font-display">${U.escapeHtml(p.title)}</h3>
              ${U.projectStatusBadge(p.status)}
              <span class="ws-chip capitalize">${U.escapeHtml(p.type)}</span>
            </div>
            <p class="text-sm text-slate-500 mt-1">${U.escapeHtml(typeLabel)}</p>
          </div>
          <div class="flex flex-wrap gap-2" onclick="event.stopPropagation()">
            ${WS.Auth.canEditTimeline(p) ? `
              <button type="button" data-edit-timeline="${p.id}" class="ws-btn ws-btn--secondary">Edit Timeline</button>
            ` : ''}
            ${canTeam ? `
              <button type="button" data-manage-team="${p.id}" class="ws-btn ws-btn--link">Manage Team</button>
            ` : ''}
            <button type="button" data-open-project="${p.id}" class="ws-btn ws-btn--secondary">View Details</button>
          </div>
        </div>
        <p class="text-sm text-slate-600 mt-3">${U.escapeHtml(p.project_scope)}</p>
        <div class="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div>
            <p class="text-xs text-slate-500 uppercase font-semibold tracking-wide">Engagement Manager</p>
            <p class="font-medium text-slate-800 mt-0.5">${U.escapeHtml(em?.name || '—')}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500 uppercase font-semibold tracking-wide">Project Manager</p>
            <p class="font-medium text-slate-800 mt-0.5">${U.escapeHtml(pm?.name || '—')}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500 uppercase font-semibold tracking-wide">Lead</p>
            <p class="font-medium text-slate-800 mt-0.5">${U.escapeHtml(lead?.name || '—')}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500 uppercase font-semibold tracking-wide">Developers</p>
            <p class="font-medium text-slate-800 mt-0.5">${p.developer_ids.map((id) => WS.Store.getUser(id)?.name).filter(Boolean).map(U.escapeHtml).join(', ') || '—'}</p>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex justify-between text-xs text-slate-500 mb-1">
            <span>${U.formatDate(p.estimated_timeline.start_date)} – ${U.formatDate(p.estimated_timeline.end_date)}</span>
            <span>${progress}% elapsed</span>
          </div>
          <div class="ws-progress">
            <div class="ws-progress__bar" style="width:${progress}%"></div>
          </div>
        </div>
        <p class="text-xs text-indigo-600 font-medium mt-3">Click to view name-wise daily updates →</p>
      </article>
    `;
  }

  function memberUpdatesGrouped(projectId) {
    const updates = WS.Store.getDb().daily_updates
      .filter((u) => u.project_id === projectId)
      .sort((a, b) => (b.date + b.created_at).localeCompare(a.date + a.created_at));

    const byUser = new Map();
    updates.forEach((u) => {
      if (!byUser.has(u.user_id)) byUser.set(u.user_id, []);
      byUser.get(u.user_id).push(u);
    });
    return byUser;
  }

  function renderProjectDetail(p) {
    const canTeam = WS.Auth.canEditProjectTeam(p);
    const canTimeline = WS.Auth.canEditTimeline(p);
    const canSeeUpdates = WS.Auth.canViewProjectUpdates(p);
    const lead = WS.Store.getUser(p.lead_id);
    const grouped = memberUpdatesGrouped(p.id);
    const activeIds = new Set([p.lead_id, ...(p.developer_ids || [])].filter(Boolean));

    // Keep empty sections for current members with no logs yet
    activeIds.forEach((id) => {
      if (!grouped.has(id)) grouped.set(id, []);
    });

    const totalLogs = WS.Store.getDb().daily_updates.filter((u) => u.project_id === p.id).length;

    // Active members first, then former members who still have historical tasks
    const sortedMemberIds = [...grouped.keys()].sort((a, b) => {
      const aActive = activeIds.has(a) ? 0 : 1;
      const bActive = activeIds.has(b) ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      const na = WS.Store.getUser(a)?.name || '';
      const nb = WS.Store.getUser(b)?.name || '';
      return na.localeCompare(nb);
    });

    const currentDevs = (p.developer_ids || []).map((id) => WS.Store.getUser(id)).filter(Boolean);

    return `
      <div class="space-y-5">
        <div class="flex flex-wrap items-center gap-3">
          <button type="button" id="btn-back-projects" class="ws-btn ws-btn--ghost">← Back to Projects</button>
          ${canTimeline ? `<button type="button" data-edit-timeline="${p.id}" class="ws-btn ws-btn--secondary">Edit Timeline</button>` : ''}
          ${canTeam ? `<button type="button" data-manage-team="${p.id}" class="ws-btn ws-btn--link">Manage Team</button>` : ''}
        </div>

        <div class="ws-card">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="ws-page-title">${U.escapeHtml(p.title)}</h2>
              <p class="ws-page-sub">${U.escapeHtml(p.project_scope)}</p>
            </div>
            ${U.projectStatusBadge(p.status)}
          </div>
          <div class="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <p class="text-xs text-slate-500 uppercase font-semibold">Lead</p>
              <p class="font-medium">${U.escapeHtml(lead?.name || '—')} ${lead ? `<span class="text-slate-400 text-xs">(${U.escapeHtml(lead.email)})</span>` : ''}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 uppercase font-semibold">Timeline</p>
              <p class="font-medium">${U.formatDate(p.estimated_timeline.start_date)} – ${U.formatDate(p.estimated_timeline.end_date)}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 uppercase font-semibold">Active Team</p>
              <p class="font-medium">${activeIds.size} members</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 uppercase font-semibold">Update Logs</p>
              <p class="font-medium">${totalLogs} entries</p>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-slate-100">
            <p class="text-xs text-slate-500 uppercase font-semibold mb-2">Current Team Members</p>
            <div class="flex flex-wrap gap-2">
              ${lead ? `<span class="ws-chip ws-chip--lead">Lead: ${U.escapeHtml(lead.name)}</span>` : ''}
              ${currentDevs.length
                ? currentDevs.map((u) => `
                    <span class="ws-chip inline-flex items-center gap-2">
                      ${U.escapeHtml(u.name)}
                      ${canTeam ? `
                        <button type="button" data-remove-member="${u.id}" data-project-id="${p.id}"
                          class="text-red-600 hover:text-red-800 text-[10px] font-bold uppercase tracking-wide"
                          title="Remove from team (keeps their tasks)">Remove</button>
                      ` : ''}
                    </span>
                  `).join('')
                : '<span class="text-sm text-slate-500">No developers assigned</span>'}
            </div>
            <p class="text-xs text-slate-400 mt-2">Removing a member only drops them from the active team. Their past daily tasks stay in the log below.</p>
          </div>
        </div>

        ${canSeeUpdates ? `
          <div class="ws-card">
            <h3 class="font-semibold text-slate-900 font-display mb-1">Daily Updates by Name</h3>
            <p class="text-sm text-slate-500 mb-4">Includes active and former members. Historical tasks are never deleted when someone is removed from the team.</p>
            <div class="space-y-5">
              ${sortedMemberIds.length === 0
                ? '<p class="text-sm text-slate-500">No updates or team members yet.</p>'
                : sortedMemberIds.map((uid) => {
                    const member = WS.Store.getUser(uid);
                    const logs = grouped.get(uid) || [];
                    const isActive = activeIds.has(uid);
                    const isLead = p.lead_id === uid;
                    return `
                      <div class="border border-slate-200 rounded-xl overflow-hidden ${isActive ? '' : 'opacity-95'}">
                        <div class="bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p class="font-semibold text-slate-900">
                              ${U.escapeHtml(member?.name || 'Unknown')}
                              ${!isActive ? '<span class="ws-chip ml-2 text-[10px] uppercase tracking-wide">Former member</span>' : ''}
                              ${isLead ? '<span class="ws-chip ws-chip--lead ml-2">Lead</span>' : ''}
                            </p>
                            <p class="text-xs text-slate-500">${U.escapeHtml(WS.ROLE_LABELS[member?.role] || '')} · ${U.escapeHtml(member?.email || '')}</p>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="ws-chip">${logs.length} update${logs.length === 1 ? '' : 's'}</span>
                            ${canTeam && isActive && !isLead ? `
                              <button type="button" data-remove-member="${uid}" data-project-id="${p.id}"
                                class="ws-btn ws-btn--danger text-xs !py-1 !px-2">Remove from Team</button>
                            ` : ''}
                          </div>
                        </div>
                        ${logs.length === 0
                          ? '<p class="text-sm text-slate-500 px-4 py-3">No daily updates submitted yet.</p>'
                          : `<div class="divide-y divide-slate-100">
                              ${logs.map((log) => `
                                <div class="px-4 py-3">
                                  <div class="flex flex-wrap items-center gap-2 mb-1">
                                    <span class="text-sm font-semibold text-slate-800">${U.formatDate(log.date)}</span>
                                    <span class="text-xs text-slate-500">${log.hours_spent}h</span>
                                    ${U.statusBadge(log.status_flag)}
                                  </div>
                                  <p class="text-sm text-slate-700">${U.escapeHtml(log.task_summary)}</p>
                                  ${log.blockers ? `<p class="text-xs text-red-600 mt-1">Blocker: ${U.escapeHtml(log.blockers)}</p>` : ''}
                                </div>
                              `).join('')}
                            </div>`}
                      </div>
                    `;
                  }).join('')}
            </div>
          </div>
        ` : `
          <div class="ws-alert ws-alert--warn">You do not have access to view team daily updates for this project.</div>
        `}
      </div>
    `;
  }

  function memberPickerHtml(roleFilter, selectedIds, namePrefix) {
    const users = WS.Store.getDb().users.filter((u) => u.role === roleFilter || (roleFilter === 'lead' && u.role === 'lead'));
    return users.map((u) => `
      <label class="flex items-start gap-2 text-sm border border-slate-100 rounded-lg p-2 hover:bg-slate-50">
        <input type="checkbox" name="${namePrefix}" value="${u.id}"
          ${selectedIds.includes(u.id) ? 'checked' : ''} class="mt-1 rounded text-indigo-600" />
        <span>
          <span class="font-medium text-slate-800">${U.escapeHtml(u.name)}</span>
          <span class="block text-xs text-slate-500">${U.escapeHtml(u.email)}</span>
        </span>
      </label>
    `).join('');
  }

  function openProjectWizard() {
    const db = WS.Store.getDb();
    const ems = db.users.filter((u) => u.role === 'engagement_manager' || u.role === 'admin');
    const pms = db.users.filter((u) => u.role === 'project_manager' || u.role === 'admin');
    const leads = db.users.filter((u) => u.role === 'lead');
    const current = WS.Store.currentUser();
    const leadLocked = WS.Auth.isLead();

    WS.UI.openModal(`
      <div class="p-6 max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-5">
          <h3 id="modal-title" class="text-lg font-bold text-slate-900 font-display">Create Project</h3>
          <button type="button" id="modal-close" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <form id="project-form" class="space-y-4">
          <div>
            <label class="ws-label">Project Type <span class="text-red-500">*</span></label>
            <div class="flex gap-4 mt-1">
              <label class="inline-flex items-center gap-2 text-sm"><input type="radio" name="type" value="internal" checked /> Internal</label>
              <label class="inline-flex items-center gap-2 text-sm"><input type="radio" name="type" value="client" /> Client</label>
            </div>
          </div>
          <div id="field-team-name">
            <label class="ws-label">Team Name <span class="text-red-500">*</span></label>
            <input name="team_name" type="text" class="ws-input" />
          </div>
          <div id="field-cst" class="hidden space-y-3">
            <div>
              <label class="ws-label">CST Team Name <span class="text-red-500">*</span></label>
              <input name="cst_team_name" type="text" class="ws-input" />
            </div>
            <div>
              <label class="ws-label">Client Name <span class="text-slate-400 font-normal">(optional)</span></label>
              <input name="client_name" type="text" class="ws-input" />
            </div>
          </div>
          <div>
            <label class="ws-label">Title <span class="text-red-500">*</span></label>
            <input name="title" type="text" required class="ws-input" />
          </div>
          <div>
            <label class="ws-label">Project Scope <span class="text-red-500">*</span></label>
            <textarea name="project_scope" rows="3" required class="ws-textarea"></textarea>
          </div>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="ws-label">Start Date <span class="text-red-500">*</span></label>
              <input name="start_date" type="date" required class="ws-input" />
            </div>
            <div>
              <label class="ws-label">End Date <span class="text-red-500">*</span></label>
              <input name="end_date" type="date" required class="ws-input" />
            </div>
          </div>
          <div>
            <label class="ws-label">Status</label>
            <select name="status" class="ws-select">
              <option value="planning">Planning</option>
              <option value="active" selected>Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="ws-label">Engagement Manager <span class="text-red-500">*</span></label>
              <select name="engagement_manager_id" required class="ws-select">
                <option value="">Select…</option>
                ${ems.map((u) => `<option value="${u.id}">${U.escapeHtml(u.name)} (${U.escapeHtml(u.email)})</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="ws-label">Project Manager <span class="text-red-500">*</span></label>
              <select name="project_manager_id" required class="ws-select">
                <option value="">Select…</option>
                ${pms.map((u) => `<option value="${u.id}">${U.escapeHtml(u.name)} (${U.escapeHtml(u.email)})</option>`).join('')}
              </select>
            </div>
          </div>
          <div>
            <label class="ws-label">Lead <span class="text-red-500">*</span> <span class="text-slate-400 font-normal">(max 1)</span></label>
            ${leadLocked ? `
              <input type="hidden" name="lead_id" value="${current.id}" />
              <p class="text-sm font-medium text-slate-800 mt-1">${U.escapeHtml(current.name)} <span class="text-slate-400">(${U.escapeHtml(current.email)})</span></p>
            ` : `
              <select name="lead_id" required class="ws-select">
                <option value="">Select…</option>
                ${leads.map((u) => `<option value="${u.id}">${U.escapeHtml(u.name)} (${U.escapeHtml(u.email)})</option>`).join('')}
              </select>
            `}
          </div>

          <div>
            <label class="ws-label">Developers (existing)</label>
            <div class="border border-slate-200 rounded-lg p-3 max-h-36 overflow-y-auto space-y-2">
              ${memberPickerHtml('developer', [], 'developer_ids') || '<p class="text-sm text-slate-500">No developers yet.</p>'}
            </div>
          </div>

          <div class="border border-dashed border-indigo-200 rounded-xl p-4 bg-indigo-50/40 space-y-3">
            <p class="text-sm font-semibold text-indigo-900">Add new team member (creates login)</p>
            <p class="text-xs text-indigo-800">Username = FIRSTNAME · Password = LastName@2026</p>
            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="ws-label">First Name</label>
                <input name="new_first_name" class="ws-input" />
              </div>
              <div>
                <label class="ws-label">Last Name</label>
                <input name="new_last_name" class="ws-input" />
              </div>
            </div>
            <div>
              <label class="ws-label">Email <span class="text-red-500">*</span> (required if adding new)</label>
              <input name="new_email" type="email" class="ws-input" placeholder="member@company.com" />
            </div>
            <div>
              <label class="ws-label">Role</label>
              <select name="new_role" class="ws-select">
                <option value="developer">Developer</option>
                <option value="lead">Lead</option>
              </select>
            </div>
          </div>

          <div id="project-form-error" class="ws-error"></div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" id="modal-cancel" class="ws-btn ws-btn--ghost">Cancel</button>
            <button type="submit" class="ws-btn ws-btn--primary">Create Project</button>
          </div>
        </form>
      </div>
    `);

    const form = document.getElementById('project-form');
    const toggleType = () => {
      const type = form.querySelector('input[name="type"]:checked').value;
      document.getElementById('field-team-name').classList.toggle('hidden', type !== 'internal');
      document.getElementById('field-cst').classList.toggle('hidden', type !== 'client');
    };
    form.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', toggleType));
    document.getElementById('modal-close').addEventListener('click', WS.UI.closeModal);
    document.getElementById('modal-cancel').addEventListener('click', WS.UI.closeModal);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const errEl = document.getElementById('project-form-error');
      const showErr = (msg) => { errEl.textContent = msg; errEl.classList.add('is-visible'); };

      try {
        const type = fd.get('type');
        const title = String(fd.get('title') || '').trim();
        const scope = String(fd.get('project_scope') || '').trim();
        const start = fd.get('start_date');
        const end = fd.get('end_date');
        const teamName = String(fd.get('team_name') || '').trim();
        const cstName = String(fd.get('cst_team_name') || '').trim();
        const clientName = String(fd.get('client_name') || '').trim();
        let leadId = fd.get('lead_id');
        let developerIds = [...form.querySelectorAll('input[name="developer_ids"]:checked')].map((c) => c.value);
        const createdLogins = [];

        const newEmail = String(fd.get('new_email') || '').trim();
        const newFirst = String(fd.get('new_first_name') || '').trim();
        const newLast = String(fd.get('new_last_name') || '').trim();
        const newRole = fd.get('new_role') || 'developer';

        if (!title) return showErr('Title is required.');
        if (!scope) return showErr('Project scope is required.');
        if (!start || !end) return showErr('Start and end dates are required.');
        if (end < start) return showErr('End date must be on or after start date.');
        if (type === 'internal' && !teamName) return showErr('Team Name is required for internal projects.');
        if (type === 'client' && !cstName) return showErr('CST Team Name is required for client projects.');
        if (!fd.get('engagement_manager_id') || !fd.get('project_manager_id')) return showErr('EM and PM are required.');
        if (!leadId) return showErr('Lead is required (exactly one).');

        if (newEmail) {
          if (!newFirst || !newLast) return showErr('First and last name are required when adding a new member by email.');
          const { user, created } = WS.Users.resolveOrCreateMember({
            first_name: newFirst,
            last_name: newLast,
            email: newEmail,
            role: newRole,
            designation: WS.ROLE_LABELS[newRole]
          });
          if (created) createdLogins.push(`${user.username} / ${user.password}`);
          if (newRole === 'lead') leadId = user.id;
          else if (!developerIds.includes(user.id)) developerIds.push(user.id);
        }

        const project = {
          id: U.uid('p'),
          title,
          type,
          team_name: type === 'internal' ? teamName : null,
          cst_team_name: type === 'client' ? cstName : null,
          client_name: type === 'client' && clientName ? clientName : null,
          estimated_timeline: { start_date: start, end_date: end },
          project_scope: scope,
          engagement_manager_id: fd.get('engagement_manager_id'),
          project_manager_id: fd.get('project_manager_id'),
          lead_id: leadId,
          developer_ids: developerIds,
          status: fd.get('status'),
          created_at: new Date().toISOString()
        };

        WS.Store.getDb().projects.push(project);
        WS.Store.addAudit('project_created', `Created project "${title}" (${type})`);
        WS.Store.saveDb();
        WS.UI.closeModal();
        let msg = 'Project created successfully';
        if (createdLogins.length) msg += ` · Login(s): ${createdLogins.join(', ')}`;
        WS.UI.toast(msg);
        WS.Store.state.selectedProjectId = project.id;
        render();
      } catch (ex) {
        showErr(ex.message || 'Could not create project.');
      }
    });
  }

  function removeDeveloperFromProject(project, userId) {
    if (!project || !userId) return false;
    if (!project.developer_ids.includes(userId)) return false;
    const name = WS.Store.getUser(userId)?.name || userId;
    // Only unassign from active team — never delete daily_updates / historical tasks
    project.developer_ids = project.developer_ids.filter((id) => id !== userId);
    WS.Store.addAudit(
      'developer_removed',
      `Removed ${name} from active team on ${project.title} (historical tasks retained)`
    );
    WS.Store.saveDb();
    return true;
  }

  function openEditTimelineModal(projectId) {
    const project = WS.Store.getProject(projectId);
    if (!project || !WS.Auth.canEditTimeline(project)) return;

    WS.UI.openModal(`
      <div class="p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 id="modal-title" class="text-lg font-bold text-slate-900 font-display">Edit Timeline</h3>
            <p class="text-sm text-slate-500">${U.escapeHtml(project.title)}</p>
          </div>
          <button type="button" id="modal-close" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <form id="timeline-form" class="space-y-4">
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="ws-label">Start Date <span class="text-red-500">*</span></label>
              <input name="start_date" type="date" required class="ws-input"
                value="${U.escapeHtml(project.estimated_timeline.start_date)}" />
            </div>
            <div>
              <label class="ws-label">End Date <span class="text-red-500">*</span></label>
              <input name="end_date" type="date" required class="ws-input"
                value="${U.escapeHtml(project.estimated_timeline.end_date)}" />
            </div>
          </div>
          <div id="timeline-form-error" class="ws-error"></div>
          <div class="flex justify-end gap-2">
            <button type="button" id="modal-cancel" class="ws-btn ws-btn--ghost">Cancel</button>
            <button type="submit" class="ws-btn ws-btn--primary">Save Timeline</button>
          </div>
        </form>
      </div>
    `);

    document.getElementById('modal-close').addEventListener('click', WS.UI.closeModal);
    document.getElementById('modal-cancel').addEventListener('click', WS.UI.closeModal);
    document.getElementById('timeline-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const start = fd.get('start_date');
      const end = fd.get('end_date');
      const errEl = document.getElementById('timeline-form-error');
      if (!start || !end) {
        errEl.textContent = 'Both dates are required.';
        errEl.classList.add('is-visible');
        return;
      }
      if (end < start) {
        errEl.textContent = 'End date must be on or after start date.';
        errEl.classList.add('is-visible');
        return;
      }
      const prev = `${project.estimated_timeline.start_date} → ${project.estimated_timeline.end_date}`;
      project.estimated_timeline = { start_date: start, end_date: end };
      WS.Store.addAudit('timeline_updated', `Timeline updated on "${project.title}" from ${prev} to ${start} → ${end}`);
      WS.Store.saveDb();
      WS.UI.closeModal();
      WS.UI.toast('Timeline updated');
      render();
    });
  }

  function openTeamModal(projectId) {
    const project = WS.Store.getProject(projectId);
    if (!project || !WS.Auth.canEditProjectTeam(project)) return;

    const canLead = WS.Auth.canReassignLead(project);
    const canTimeline = WS.Auth.canEditTimeline(project);
    const db = WS.Store.getDb();
    const leads = db.users.filter((u) => u.role === 'lead');
    const currentDevIds = [...(project.developer_ids || [])];
    const currentDevs = currentDevIds.map((id) => WS.Store.getUser(id)).filter(Boolean);
    const availableDevs = db.users.filter((u) => u.role === 'developer' && !currentDevIds.includes(u.id));

    WS.UI.openModal(`
      <div class="p-6 max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 id="modal-title" class="text-lg font-bold text-slate-900 font-display">Manage Team & Timeline</h3>
            <p class="text-sm text-slate-500">${U.escapeHtml(project.title)}</p>
          </div>
          <button type="button" id="modal-close" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <form id="team-form" class="space-y-4">
          ${canTimeline ? `
            <div class="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <p class="text-sm font-semibold text-slate-900">Project Timeline</p>
              <div class="grid sm:grid-cols-2 gap-3">
                <div>
                  <label class="ws-label">Start Date</label>
                  <input name="start_date" type="date" class="ws-input"
                    value="${U.escapeHtml(project.estimated_timeline.start_date)}" />
                </div>
                <div>
                  <label class="ws-label">End Date</label>
                  <input name="end_date" type="date" class="ws-input"
                    value="${U.escapeHtml(project.estimated_timeline.end_date)}" />
                </div>
              </div>
            </div>
          ` : ''}

          ${canLead ? `
            <div>
              <label class="ws-label">Lead (max 1)</label>
              <select name="lead_id" class="ws-select">
                ${leads.map((u) => `<option value="${u.id}" ${u.id === project.lead_id ? 'selected' : ''}>${U.escapeHtml(u.name)} — ${U.escapeHtml(u.email)}</option>`).join('')}
              </select>
            </div>
          ` : `
            <p class="text-sm text-slate-500">Lead: <span class="font-medium text-slate-800">${U.escapeHtml(WS.Store.getUser(project.lead_id)?.name || '—')}</span>
              <span class="text-slate-400">(${U.escapeHtml(WS.Store.getUser(project.lead_id)?.email || '')})</span></p>
          `}

          <div>
            <label class="ws-label">Current Team Members</label>
            <div class="border border-slate-200 rounded-lg divide-y divide-slate-100">
              ${currentDevs.length === 0
                ? '<p class="text-sm text-slate-500 p-3">No developers on this project.</p>'
                : currentDevs.map((u) => `
                  <div class="flex flex-wrap items-center justify-between gap-2 p-3">
                    <div>
                      <p class="text-sm font-medium text-slate-900">${U.escapeHtml(u.name)}</p>
                      <p class="text-xs text-slate-500">${U.escapeHtml(u.email)}</p>
                      <input type="hidden" name="developer_ids" value="${u.id}" />
                    </div>
                    <button type="button" class="ws-btn ws-btn--danger text-xs !py-1.5 !px-3"
                      data-modal-remove-dev="${u.id}">Remove from Project</button>
                  </div>
                `).join('')}
            </div>
            <p class="text-xs text-slate-500 mt-1">Remove only unassigns them from the active team. Their past daily tasks remain on this project.</p>
          </div>

          <div>
            <label class="ws-label">Add Existing Developers</label>
            <div class="border border-slate-200 rounded-lg p-3 max-h-36 overflow-y-auto space-y-2">
              ${availableDevs.length === 0
                ? '<p class="text-sm text-slate-500">No additional developers available.</p>'
                : availableDevs.map((u) => `
                  <label class="flex items-start gap-2 text-sm">
                    <input type="checkbox" name="add_developer_ids" value="${u.id}" class="mt-1 rounded text-indigo-600" />
                    <span><span class="font-medium">${U.escapeHtml(u.name)}</span>
                    <span class="block text-xs text-slate-500">${U.escapeHtml(u.email)}</span></span>
                  </label>
                `).join('')}
            </div>
          </div>

          <div class="border border-dashed border-indigo-200 rounded-xl p-4 bg-indigo-50/40 space-y-3">
            <p class="text-sm font-semibold text-indigo-900">Add member by email (creates login if new)</p>
            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="ws-label">First Name</label>
                <input name="new_first_name" class="ws-input" />
              </div>
              <div>
                <label class="ws-label">Last Name</label>
                <input name="new_last_name" class="ws-input" />
              </div>
            </div>
            <div>
              <label class="ws-label">Email *</label>
              <input name="new_email" type="email" class="ws-input" />
            </div>
            <div>
              <label class="ws-label">Assign as</label>
              <select name="new_role" class="ws-select">
                <option value="developer">Developer</option>
                ${canLead ? '<option value="lead">Lead</option>' : ''}
              </select>
            </div>
          </div>

          <div id="team-form-error" class="ws-error"></div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" id="modal-cancel" class="ws-btn ws-btn--ghost">Cancel</button>
            <button type="submit" class="ws-btn ws-btn--primary">Save Changes</button>
          </div>
        </form>
      </div>
    `);

    document.getElementById('modal-close').addEventListener('click', WS.UI.closeModal);
    document.getElementById('modal-cancel').addEventListener('click', WS.UI.closeModal);

    // Immediate remove from current list in modal UI
    document.querySelectorAll('[data-modal-remove-dev]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('div.flex');
        const hidden = row?.querySelector('input[name="developer_ids"]');
        if (hidden) hidden.remove();
        row?.remove();
        const list = document.querySelector('#team-form .border.divide-y');
        if (list && !list.querySelector('[name="developer_ids"]')) {
          list.innerHTML = '<p class="text-sm text-slate-500 p-3">No developers on this project.</p>';
        }
        WS.UI.toast('Member marked for removal — click Save Changes to confirm', 'info');
      });
    });

    document.getElementById('team-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target;
      const fd = new FormData(form);
      const errEl = document.getElementById('team-form-error');
      const showErr = (msg) => { errEl.textContent = msg; errEl.classList.add('is-visible'); };

      try {
        if (canTimeline) {
          const start = fd.get('start_date');
          const end = fd.get('end_date');
          if (!start || !end) return showErr('Timeline start and end dates are required.');
          if (end < start) return showErr('End date must be on or after start date.');
          const prev = `${project.estimated_timeline.start_date} → ${project.estimated_timeline.end_date}`;
          if (start !== project.estimated_timeline.start_date || end !== project.estimated_timeline.end_date) {
            project.estimated_timeline = { start_date: start, end_date: end };
            WS.Store.addAudit('timeline_updated', `Timeline updated on "${project.title}" from ${prev} to ${start} → ${end}`);
          }
        }

        const prevLead = project.lead_id;
        const prevDevs = [...project.developer_ids];
        let newDevs = [...form.querySelectorAll('input[name="developer_ids"]')].map((c) => c.value);
        const toAdd = [...form.querySelectorAll('input[name="add_developer_ids"]:checked')].map((c) => c.value);
        toAdd.forEach((id) => {
          if (!newDevs.includes(id)) newDevs.push(id);
        });

        let newLead = prevLead;
        if (canLead) {
          newLead = form.querySelector('[name="lead_id"]').value;
          if (!newLead) return showErr('A lead is required.');
        }

        const newEmail = String(fd.get('new_email') || '').trim();
        const createdLogins = [];
        if (newEmail) {
          const newFirst = String(fd.get('new_first_name') || '').trim();
          const newLast = String(fd.get('new_last_name') || '').trim();
          const newRole = fd.get('new_role') || 'developer';
          if (!newFirst || !newLast) return showErr('First and last name required when adding by email.');
          const { user, created } = WS.Users.resolveOrCreateMember({
            first_name: newFirst,
            last_name: newLast,
            email: newEmail,
            role: newRole,
            designation: WS.ROLE_LABELS[newRole]
          });
          if (created) createdLogins.push(`${user.username} / ${user.password}`);
          if (newRole === 'lead' && canLead) newLead = user.id;
          else if (!newDevs.includes(user.id)) newDevs.push(user.id);
        }

        if (newLead !== prevLead) {
          WS.Store.addAudit('lead_changed', `Lead changed on "${project.title}" from ${WS.Store.getUser(prevLead)?.name} to ${WS.Store.getUser(newLead)?.name}`);
          project.lead_id = newLead;
        }
        newDevs.filter((id) => !prevDevs.includes(id)).forEach((id) => {
          WS.Store.addAudit('developer_added', `Added ${WS.Store.getUser(id)?.name || id} (${WS.Store.getUser(id)?.email || ''}) to ${project.title}`);
        });
        prevDevs.filter((id) => !newDevs.includes(id)).forEach((id) => {
          WS.Store.addAudit(
            'developer_removed',
            `Removed ${WS.Store.getUser(id)?.name || id} from active team on ${project.title} (historical tasks retained)`
          );
        });

        project.developer_ids = newDevs;
        WS.Store.saveDb();
        WS.UI.closeModal();
        let msg = 'Team & timeline saved';
        if (createdLogins.length) msg += ` · Login(s): ${createdLogins.join(', ')}`;
        WS.UI.toast(msg);
        render();
      } catch (ex) {
        showErr(ex.message || 'Could not update team.');
      }
    });
  }

  function bindProjectList(panel) {
    panel.querySelectorAll('[data-open-project]').forEach((el) => {
      const open = () => {
        const id = el.dataset.openProject;
        const project = WS.Store.getProject(id);
        if (!project || !WS.Auth.canAccessProject(project)) {
          WS.UI.toast('You do not have access to this project', 'error');
          return;
        }
        WS.Store.state.selectedProjectId = id;
        render();
      };
      el.addEventListener('click', open);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
    panel.querySelectorAll('[data-manage-team]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTeamModal(btn.dataset.manageTeam);
      });
    });
    panel.querySelectorAll('[data-edit-timeline]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditTimelineModal(btn.dataset.editTimeline);
      });
    });
  }

  function render() {
    const panel = document.getElementById('panel-projects');
    const selectedId = WS.Store.state.selectedProjectId;
    if (selectedId) {
      const project = WS.Store.getProject(selectedId);
      if (!project || !WS.Auth.canAccessProject(project)) {
        WS.Store.state.selectedProjectId = null;
      } else {
        panel.innerHTML = renderProjectDetail(project);
        document.getElementById('btn-back-projects')?.addEventListener('click', () => {
          WS.Store.state.selectedProjectId = null;
          render();
        });
        panel.querySelectorAll('[data-manage-team]').forEach((btn) => {
          btn.addEventListener('click', () => openTeamModal(btn.dataset.manageTeam));
        });
        panel.querySelectorAll('[data-edit-timeline]').forEach((btn) => {
          btn.addEventListener('click', () => openEditTimelineModal(btn.dataset.editTimeline));
        });
        panel.querySelectorAll('[data-remove-member]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const project = WS.Store.getProject(btn.dataset.projectId);
            const userId = btn.dataset.removeMember;
            if (!project || !WS.Auth.canEditProjectTeam(project)) return;
            const name = WS.Store.getUser(userId)?.name || 'this member';
            if (!confirm(`Remove ${name} from the active team on "${project.title}"?\n\nTheir past daily tasks will stay on this project.`)) return;
            if (removeDeveloperFromProject(project, userId)) {
              WS.UI.toast(`${name} removed from team — their tasks are still listed`);
              render();
            }
          });
        });
        return;
      }
    }

    const projects = WS.Auth.visibleProjects();
    panel.innerHTML = `
      <div class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="ws-page-title">Projects</h2>
            <p class="ws-page-sub">${WS.Auth.isManager()
              ? 'Create projects and open any project to review name-wise daily updates.'
              : 'Only projects tagged to you are listed. Open a project for details.'}</p>
          </div>
          ${WS.Auth.canCreateProjects() ? `
            <button type="button" id="btn-new-project" class="ws-btn ws-btn--primary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              New Project
            </button>
          ` : ''}
        </div>
        ${projects.length === 0
          ? '<div class="ws-card ws-empty">No projects available for your role.</div>'
          : `<div class="grid gap-4">${projects.map((p) => projectCard(p)).join('')}</div>`}
      </div>
    `;

    document.getElementById('btn-new-project')?.addEventListener('click', openProjectWizard);
    bindProjectList(panel);
  }

  WS.Projects = { render, openProjectWizard, openTeamModal, openEditTimelineModal };
})(window.Workshilla);
