/**
 * Workshilla — Dashboard views (management / lead / developer)
 */
(function (WS) {
  'use strict';

  const U = WS.Utils;

  function kpiCard(label, value, variant) {
    return `
      <div class="ws-kpi ws-kpi--${variant}">
        <p class="ws-kpi__label">${U.escapeHtml(label)}</p>
        <p class="ws-kpi__value">${value}</p>
      </div>
    `;
  }

  function healthCard(p) {
    const progress = U.timelineProgress(p.estimated_timeline.start_date, p.estimated_timeline.end_date);
    const todayUpdates = WS.Store.getDb().daily_updates.filter(
      (u) => u.project_id === p.id && u.date === U.todayISO()
    );
    let health = 'no_update';
    if (todayUpdates.some((u) => u.status_flag === 'blocked')) health = 'blocked';
    else if (todayUpdates.some((u) => u.status_flag === 'delayed')) health = 'delayed';
    else if (todayUpdates.length) health = 'on_track';

    const healthHtml = health === 'no_update'
      ? '<span class="text-xs text-slate-400 font-medium">No update today</span>'
      : U.statusBadge(health);

    const lead = WS.Store.getUser(p.lead_id);
    const teamLabel = p.type === 'internal'
      ? (p.team_name || '—')
      : [p.cst_team_name, p.client_name].filter(Boolean).join(' · ');

    return `
      <div class="ws-card flex flex-col gap-3 !p-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h4 class="font-semibold text-slate-900 font-display">${U.escapeHtml(p.title)}</h4>
            <p class="text-xs text-slate-500 mt-0.5">${U.escapeHtml(teamLabel)}</p>
          </div>
          ${U.projectStatusBadge(p.status)}
        </div>
        <p class="text-sm text-slate-600 line-clamp-2">${U.escapeHtml(p.project_scope)}</p>
        <div>
          <div class="flex justify-between text-xs text-slate-500 mb-1">
            <span>Timeline</span>
            <span>${progress}%</span>
          </div>
          <div class="ws-progress">
            <div class="ws-progress__bar" style="width:${progress}%"></div>
          </div>
          <p class="text-xs text-slate-400 mt-1">${U.formatDate(p.estimated_timeline.start_date)} – ${U.formatDate(p.estimated_timeline.end_date)}</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${lead ? `<span class="ws-chip ws-chip--lead">Lead: ${U.escapeHtml(lead.name)}</span>` : ''}
          ${p.developer_ids.map((id) => {
            const u = WS.Store.getUser(id);
            return u ? `<span class="ws-chip">${U.escapeHtml(u.name)}</span>` : '';
          }).join('')}
        </div>
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-500">Health</span>
          ${healthHtml}
        </div>
      </div>
    `;
  }

  function activityFiltersHtml(projects) {
    const f = WS.Store.state.feedFilters;
    const members = [...new Set(
      WS.Store.getDb().daily_updates
        .filter((u) => projects.some((p) => p.id === u.project_id))
        .map((u) => u.user_id)
    )].map((id) => WS.Store.getUser(id)).filter(Boolean);

    return `
      <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <div>
          <label class="ws-label">From</label>
          <input type="date" id="f-date-from" value="${U.escapeHtml(f.dateFrom)}" class="ws-input" />
        </div>
        <div>
          <label class="ws-label">To</label>
          <input type="date" id="f-date-to" value="${U.escapeHtml(f.dateTo)}" class="ws-input" />
        </div>
        <div>
          <label class="ws-label">Project</label>
          <select id="f-project" class="ws-select">
            <option value="">All</option>
            ${projects.map((p) => `<option value="${p.id}" ${f.projectId === p.id ? 'selected' : ''}>${U.escapeHtml(p.title)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="ws-label">Team Member</label>
          <select id="f-user" class="ws-select">
            <option value="">All</option>
            ${members.map((u) => `<option value="${u.id}" ${f.userId === u.id ? 'selected' : ''}>${U.escapeHtml(u.name)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="ws-label">Status</label>
          <select id="f-status" class="ws-select">
            <option value="">All</option>
            <option value="on_track" ${f.statusFlag === 'on_track' ? 'selected' : ''}>On Track</option>
            <option value="delayed" ${f.statusFlag === 'delayed' ? 'selected' : ''}>Delayed</option>
            <option value="blocked" ${f.statusFlag === 'blocked' ? 'selected' : ''}>Blocked</option>
          </select>
        </div>
      </div>
    `;
  }

  function filteredActivityFeed(projects) {
    const f = WS.Store.state.feedFilters;
    const ids = new Set(projects.map((p) => p.id));
    return WS.Store.getDb().daily_updates
      .filter((u) => {
        if (!ids.has(u.project_id)) return false;
        if (f.dateFrom && u.date < f.dateFrom) return false;
        if (f.dateTo && u.date > f.dateTo) return false;
        if (f.projectId && u.project_id !== f.projectId) return false;
        if (f.userId && u.user_id !== f.userId) return false;
        if (f.statusFlag && u.status_flag !== f.statusFlag) return false;
        return true;
      })
      .sort((a, b) => (b.date + b.created_at).localeCompare(a.date + a.created_at));
  }

  function allocationTable(projects) {
    const rows = [];
    projects.forEach((p) => {
      if (p.lead_id) {
        const u = WS.Store.getUser(p.lead_id);
        if (u) rows.push({ user: u, role: 'Lead', project: p });
      }
      p.developer_ids.forEach((id) => {
        const u = WS.Store.getUser(id);
        if (u) rows.push({ user: u, role: 'Developer', project: p });
      });
    });

    if (!rows.length) return '<p class="text-sm text-slate-500">No team allocations.</p>';

    return `
      <div class="ws-table-wrap">
        <table class="ws-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>System Role</th>
              <th>Assignment</th>
              <th>Project</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r) => `
              <tr>
                <td class="font-medium text-slate-900">${U.escapeHtml(r.user.name)}</td>
                <td>${U.roleBadge(r.user.role)}</td>
                <td>${r.role}</td>
                <td>${U.escapeHtml(r.project.title)}</td>
                <td>${U.projectStatusBadge(r.project.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderManagement() {
    const projects = WS.Auth.visibleProjects();
    const activeProjects = projects.filter((p) => p.status === 'active');
    const today = U.todayISO();
    const projectIds = new Set(projects.map((p) => p.id));
    const db = WS.Store.getDb();

    const todaysFlags = db.daily_updates.filter((u) =>
      u.date === today && projectIds.has(u.project_id)
      && (u.status_flag === 'delayed' || u.status_flag === 'blocked')
    );

    const weekStart = U.startOfWeek();
    const weekEnd = U.endOfWeek();
    const weekHours = db.daily_updates
      .filter((u) => {
        if (!projectIds.has(u.project_id)) return false;
        const d = new Date(u.date + 'T12:00:00');
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, u) => sum + (Number(u.hours_spent) || 0), 0);

    const activeDevIds = new Set();
    activeProjects.forEach((p) => {
      p.developer_ids.forEach((id) => activeDevIds.add(id));
      if (p.lead_id) activeDevIds.add(p.lead_id);
    });

    const feed = filteredActivityFeed(projects);

    return `
      <div class="space-y-6">
        <div>
          <h2 class="ws-page-title">${WS.Auth.isLead() ? 'Lead Dashboard' : 'Management Dashboard'}</h2>
          <p class="ws-page-sub">
            ${WS.Auth.isLead()
              ? 'Health and activity for projects you lead.'
              : 'Global project health, team activity, and allocation.'}
          </p>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          ${kpiCard('Active Projects', activeProjects.length, 'indigo')}
          ${kpiCard('Delayed / Blocked Today', todaysFlags.length, todaysFlags.length ? 'red' : 'emerald')}
          ${kpiCard('Hours This Week', weekHours, 'slate')}
          ${kpiCard('Active Developers', activeDevIds.size, 'indigo')}
        </div>

        <div>
          <h3 class="font-semibold text-slate-900 mb-3 font-display">Project Health</h3>
          <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            ${projects.length === 0
              ? '<p class="text-sm text-slate-500 col-span-full">No projects in scope.</p>'
              : projects.map((p) => healthCard(p)).join('')}
          </div>
        </div>

        <div class="ws-card">
          <h3 class="font-semibold text-slate-900 mb-4 font-display">Daily Activity Feed</h3>
          ${activityFiltersHtml(projects)}
          <div class="mt-4">${WS.Updates.renderTable(feed, false)}</div>
        </div>

        <div class="ws-card">
          <h3 class="font-semibold text-slate-900 mb-4 font-display">Team Allocation</h3>
          ${allocationTable(projects)}
        </div>
      </div>
    `;
  }

  function bindManagement() {
    const apply = () => {
      WS.Store.state.feedFilters = {
        dateFrom: document.getElementById('f-date-from')?.value || '',
        dateTo: document.getElementById('f-date-to')?.value || '',
        projectId: document.getElementById('f-project')?.value || '',
        userId: document.getElementById('f-user')?.value || '',
        statusFlag: document.getElementById('f-status')?.value || ''
      };
      render();
    };
    ['f-date-from', 'f-date-to', 'f-project', 'f-user', 'f-status'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', apply);
    });
    WS.Updates.bindTableActions();
  }

  function renderDeveloper() {
    const userId = WS.Store.state.currentUserId;
    const projects = WS.Auth.visibleProjects();
    const myUpdates = WS.Store.getDb().daily_updates.filter((u) => u.user_id === userId);
    const today = U.todayISO();
    const weekStart = U.startOfWeek();
    const weekEnd = U.endOfWeek();

    const hoursThisWeek = myUpdates
      .filter((u) => {
        const d = new Date(u.date + 'T12:00:00');
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, u) => sum + (Number(u.hours_spent) || 0), 0);

    const loggedToday = myUpdates.some((u) => u.date === today);
    const openBlockers = myUpdates.filter((u) =>
      u.status_flag === 'blocked' || (u.blockers && String(u.blockers).trim())
    ).length;
    const onTrackPct = myUpdates.length
      ? Math.round((myUpdates.filter((u) => u.status_flag === 'on_track').length / myUpdates.length) * 100)
      : 0;

    const recent = [...myUpdates]
      .sort((a, b) => (b.date + b.created_at).localeCompare(a.date + a.created_at))
      .slice(0, 3);

    return `
      <div class="space-y-6">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="ws-page-title">Developer Dashboard</h2>
            <p class="ws-page-sub">Your workload snapshot. Submit logs from Daily Updates.</p>
          </div>
          <button type="button" id="dev-goto-updates" class="ws-btn ws-btn--primary">Go to Daily Updates</button>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          ${kpiCard('Assigned Projects', projects.length, 'indigo')}
          ${kpiCard('Hours This Week', hoursThisWeek, 'slate')}
          ${kpiCard('Logged Today', loggedToday ? 'Yes' : 'No', loggedToday ? 'emerald' : 'red')}
          ${kpiCard('Open Blockers', openBlockers, openBlockers ? 'red' : 'emerald')}
        </div>

        <div class="grid sm:grid-cols-3 gap-3">
          ${kpiCard('Total Updates', myUpdates.length, 'slate')}
          ${kpiCard('On-Track Rate', `${onTrackPct}%`, onTrackPct >= 70 ? 'emerald' : 'indigo')}
          ${kpiCard('Active Projects', projects.filter((p) => p.status === 'active').length, 'indigo')}
        </div>

        <div class="ws-card">
          <h3 class="font-semibold text-slate-900 mb-3 font-display">My Assignments</h3>
          ${projects.length === 0
            ? '<p class="text-sm text-slate-500">You are not assigned to any projects yet.</p>'
            : `<div class="grid sm:grid-cols-2 gap-3">
                ${projects.map((p) => {
                  const progress = U.timelineProgress(p.estimated_timeline.start_date, p.estimated_timeline.end_date);
                  const lead = WS.Store.getUser(p.lead_id);
                  return `
                    <div class="border border-slate-200 rounded-xl p-4">
                      <div class="flex items-start justify-between gap-2 mb-2">
                        <p class="font-semibold text-slate-900">${U.escapeHtml(p.title)}</p>
                        ${U.projectStatusBadge(p.status)}
                      </div>
                      <p class="text-xs text-slate-500 mb-2">
                        Lead: ${U.escapeHtml(lead?.name || '—')}
                        · ${U.formatDate(p.estimated_timeline.start_date)} – ${U.formatDate(p.estimated_timeline.end_date)}
                      </p>
                      <div class="ws-progress mb-1">
                        <div class="ws-progress__bar" style="width:${progress}%"></div>
                      </div>
                      <p class="text-xs text-slate-400">${progress}% timeline elapsed</p>
                    </div>
                  `;
                }).join('')}
              </div>`}
        </div>

        <div class="ws-card">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 class="font-semibold text-slate-900 font-display">Recent Status</h3>
            <span class="text-xs text-slate-500">Last 3 updates · full history in Daily Updates</span>
          </div>
          ${recent.length === 0
            ? '<p class="text-sm text-slate-500">No updates yet. Use Daily Updates to log your work.</p>'
            : `<ul class="divide-y divide-slate-100">
                ${recent.map((u) => {
                  const p = WS.Store.getProject(u.project_id);
                  return `
                    <li class="py-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p class="text-sm font-medium text-slate-800">${U.escapeHtml(p?.title || 'Project')} · ${U.formatDate(u.date)}</p>
                        <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">${U.escapeHtml(u.task_summary)}</p>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-500">${u.hours_spent}h</span>
                        ${U.statusBadge(u.status_flag)}
                      </div>
                    </li>
                  `;
                }).join('')}
              </ul>`}
        </div>
      </div>
    `;
  }

  function bindDeveloper() {
    document.getElementById('dev-goto-updates')?.addEventListener('click', () => {
      WS.UI.navigate('updates');
    });
  }

  function render() {
    const panel = document.getElementById('panel-dashboard');
    if (WS.Auth.isDeveloper() && !WS.Auth.isLead()) {
      panel.innerHTML = renderDeveloper();
      bindDeveloper();
    } else {
      panel.innerHTML = renderManagement();
      bindManagement();
    }
  }

  WS.Dashboard = { render };
})(window.Workshilla);
