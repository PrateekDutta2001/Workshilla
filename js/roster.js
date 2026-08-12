/**
 * Workshilla — Team roster view (scoped + account creation)
 */
(function (WS) {
  'use strict';

  const U = WS.Utils;

  function render() {
    const panel = document.getElementById('panel-roster');
    const users = [...WS.Auth.visibleUsers()].sort(
      (a, b) => WS.ROLE_ORDER.indexOf(a.role) - WS.ROLE_ORDER.indexOf(b.role)
    );
    const db = WS.Store.getDb();
    const visibleProjectIds = new Set(WS.Auth.visibleProjects().map((p) => p.id));

    panel.innerHTML = `
      <div class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="ws-page-title">Team Roster</h2>
            <p class="ws-page-sub">${WS.Auth.isManager()
              ? 'All team members, credentials, and project assignments.'
              : 'Members related to your tagged projects only.'}</p>
          </div>
          ${WS.Auth.canCreateAccounts() ? `
            <button type="button" id="btn-create-account" class="ws-btn ws-btn--primary">Create Account</button>
          ` : ''}
        </div>
        <div class="ws-card !p-0 overflow-hidden">
          <div class="ws-table-wrap">
            <table class="ws-table" style="min-width:860px">
              <thead class="bg-slate-50">
                <tr>
                  <th class="!pl-4">Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Designation</th>
                  <th>Email</th>
                  ${WS.Auth.isManager() ? '<th>Password</th>' : ''}
                  <th class="!pr-4">Assigned Projects</th>
                </tr>
              </thead>
              <tbody>
                ${users.map((u) => {
                  const assigned = db.projects.filter((p) =>
                    visibleProjectIds.has(p.id)
                    && (
                      p.lead_id === u.id
                      || p.developer_ids.includes(u.id)
                      || p.engagement_manager_id === u.id
                      || p.project_manager_id === u.id
                    )
                  );
                  return `
                    <tr>
                      <td class="!pl-4 font-medium text-slate-900">${U.escapeHtml(u.name)}</td>
                      <td><code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded">${U.escapeHtml(u.username || '—')}</code></td>
                      <td>${U.roleBadge(u.role)}</td>
                      <td class="text-slate-600">${U.escapeHtml(u.designation || '—')}</td>
                      <td>${U.escapeHtml(u.email)}</td>
                      ${WS.Auth.isManager()
                        ? `<td><code class="text-xs bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded">${U.escapeHtml(u.password || '—')}</code></td>`
                        : ''}
                      <td class="!pr-4">
                        ${assigned.length
                          ? assigned.map((p) => `<span class="ws-chip mr-1 mb-1">${U.escapeHtml(p.title)}</span>`).join('')
                          : '<span class="text-slate-400">—</span>'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-create-account')?.addEventListener('click', () => {
      WS.UI.openCreateAccountModal();
    });
  }

  WS.Roster = { render };
})(window.Workshilla);
