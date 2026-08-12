/**
 * Workshilla — Daily updates form, history, and shared table
 */
(function (WS) {
  'use strict';

  const U = WS.Utils;

  function renderFormCard(projects) {
    const editing = WS.Store.state.editingUpdateId
      ? WS.Store.getDb().daily_updates.find((u) => u.id === WS.Store.state.editingUpdateId)
      : null;

    return `
      <div class="ws-card">
        <h3 class="font-semibold text-slate-900 mb-4 font-display">${editing ? 'Edit Daily Update' : 'Submit Daily Update'}</h3>
        <form id="update-form" class="space-y-3">
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="ws-label">Project <span class="text-red-500">*</span></label>
              <select name="project_id" required class="ws-select">
                <option value="">Select…</option>
                ${projects.map((p) => `<option value="${p.id}" ${editing?.project_id === p.id ? 'selected' : ''}>${U.escapeHtml(p.title)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="ws-label">Date <span class="text-red-500">*</span></label>
              <input name="date" type="date" required value="${U.escapeHtml(editing?.date || U.todayISO())}" class="ws-input" />
            </div>
          </div>
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="ws-label">Hours Spent <span class="text-red-500">*</span></label>
              <input name="hours_spent" type="number" min="0.25" max="24" step="0.25" required
                value="${editing ? editing.hours_spent : ''}" class="ws-input" />
            </div>
            <div>
              <label class="ws-label">Status Flag <span class="text-red-500">*</span></label>
              <select name="status_flag" required class="ws-select">
                <option value="on_track" ${!editing || editing.status_flag === 'on_track' ? 'selected' : ''}>On Track</option>
                <option value="delayed" ${editing?.status_flag === 'delayed' ? 'selected' : ''}>Delayed</option>
                <option value="blocked" ${editing?.status_flag === 'blocked' ? 'selected' : ''}>Blocked</option>
              </select>
            </div>
          </div>
          <div>
            <label class="ws-label">Work Summary <span class="text-red-500">*</span></label>
            <textarea name="task_summary" rows="3" required class="ws-textarea">${U.escapeHtml(editing?.task_summary || '')}</textarea>
          </div>
          <div>
            <label class="ws-label">Blockers <span class="text-slate-400 font-normal">(if any)</span></label>
            <textarea name="blockers" rows="2" class="ws-textarea">${U.escapeHtml(editing?.blockers || '')}</textarea>
          </div>
          <div id="update-form-error" class="ws-error"></div>
          <div class="flex justify-end gap-2">
            ${editing ? `<button type="button" id="cancel-edit-update" class="ws-btn ws-btn--ghost">Cancel Edit</button>` : ''}
            <button type="submit" class="ws-btn ws-btn--primary">${editing ? 'Save Changes' : 'Submit Update'}</button>
          </div>
        </form>
      </div>
    `;
  }

  function renderTable(updates, allowEdit) {
    if (!updates.length) {
      return '<p class="text-sm text-slate-500 py-4">No updates found.</p>';
    }
    return `
      <div class="ws-table-wrap">
        <table class="ws-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Project</th>
              <th>Member</th>
              <th>Hours</th>
              <th>Summary</th>
              <th>Status</th>
              ${allowEdit ? '<th>Actions</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${updates.map((u) => {
              const p = WS.Store.getProject(u.project_id);
              const user = WS.Store.getUser(u.user_id);
              const canEdit = allowEdit && u.user_id === WS.Store.state.currentUserId;
              return `
                <tr>
                  <td class="whitespace-nowrap">${U.formatDate(u.date)}</td>
                  <td class="font-medium text-slate-800">${U.escapeHtml(p?.title || '—')}</td>
                  <td>${U.escapeHtml(user?.name || '—')}</td>
                  <td>${u.hours_spent}</td>
                  <td class="max-w-xs">
                    <p>${U.escapeHtml(u.task_summary)}</p>
                    ${u.blockers ? `<p class="text-xs text-red-600 mt-1">Blocker: ${U.escapeHtml(u.blockers)}</p>` : ''}
                  </td>
                  <td>${U.statusBadge(u.status_flag)}</td>
                  ${allowEdit ? `
                    <td>
                      ${canEdit
                        ? `<button type="button" data-edit-update="${u.id}" class="text-indigo-600 hover:text-indigo-800 text-xs font-semibold">Edit</button>`
                        : '—'}
                    </td>
                  ` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function bindForm() {
    const form = document.getElementById('update-form');
    if (!form) return;

    document.getElementById('cancel-edit-update')?.addEventListener('click', () => {
      WS.Store.state.editingUpdateId = null;
      WS.UI.renderActivePanel();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const projectId = fd.get('project_id');
      const date = fd.get('date');
      const hours = parseFloat(fd.get('hours_spent'));
      const summary = (fd.get('task_summary') || '').toString().trim();
      const blockers = (fd.get('blockers') || '').toString().trim();
      const flag = fd.get('status_flag');
      const errEl = document.getElementById('update-form-error');
      const showErr = (msg) => {
        errEl.textContent = msg;
        errEl.classList.add('is-visible');
      };

      const allowed = WS.Auth.assignedProjectsForUpdates().map((p) => p.id);
      if (!projectId || !allowed.includes(projectId)) return showErr('Select a project you are assigned to.');
      if (!date) return showErr('Date is required.');
      if (!(hours > 0) || hours > 24) return showErr('Hours must be between 0.25 and 24.');
      if (!summary) return showErr('Work summary is required.');
      if (!['on_track', 'delayed', 'blocked'].includes(flag)) return showErr('Invalid status flag.');

      const user = WS.Store.currentUser();
      const db = WS.Store.getDb();

      if (WS.Store.state.editingUpdateId) {
        const existing = db.daily_updates.find((u) => u.id === WS.Store.state.editingUpdateId);
        if (!existing || existing.user_id !== WS.Store.state.currentUserId) {
          return showErr('You can only edit your own updates.');
        }
        existing.project_id = projectId;
        existing.date = date;
        existing.hours_spent = hours;
        existing.task_summary = summary;
        existing.blockers = blockers;
        existing.status_flag = flag;
        existing.user_role = user.role;
        WS.Store.addAudit('daily_update_edited', `Edited daily update for ${WS.Store.getProject(projectId)?.title || projectId} on ${date}`);
        WS.UI.toast('Update saved');
      } else {
        db.daily_updates.unshift({
          id: U.uid('du'),
          project_id: projectId,
          user_id: WS.Store.state.currentUserId,
          user_role: user.role,
          date,
          hours_spent: hours,
          task_summary: summary,
          blockers,
          status_flag: flag,
          created_at: new Date().toISOString()
        });
        WS.Store.addAudit('daily_update_created', `Submitted daily update for ${WS.Store.getProject(projectId)?.title || projectId} on ${date}`);
        WS.UI.toast('Daily update submitted');
      }

      WS.Store.state.editingUpdateId = null;
      WS.Store.saveDb();
      WS.UI.renderActivePanel();
    });
  }

  function bindTableActions() {
    document.querySelectorAll('[data-edit-update]').forEach((btn) => {
      btn.addEventListener('click', () => {
        WS.Store.state.editingUpdateId = btn.dataset.editUpdate;
        WS.UI.navigate('updates');
      });
    });
  }

  function render() {
    const panel = document.getElementById('panel-updates');
    const assigned = WS.Auth.assignedProjectsForUpdates();
    const user = WS.Store.currentUser();
    const db = WS.Store.getDb();

    let updates;
    if (WS.Auth.isManager()) {
      updates = [...db.daily_updates];
    } else if (WS.Auth.isLead()) {
      const ledIds = new Set(db.projects.filter((p) => p.lead_id === user.id).map((p) => p.id));
      updates = db.daily_updates.filter((u) =>
        u.user_id === user.id || ledIds.has(u.project_id)
      );
    } else {
      updates = db.daily_updates.filter((u) => u.user_id === user.id);
    }

    updates.sort((a, b) => (b.date + b.created_at).localeCompare(a.date + a.created_at));

    const q = WS.Store.state.updateSearch.toLowerCase();
    const filtered = q
      ? updates.filter((u) => {
          const p = WS.Store.getProject(u.project_id);
          const member = WS.Store.getUser(u.user_id);
          return (u.task_summary || '').toLowerCase().includes(q)
            || (u.blockers || '').toLowerCase().includes(q)
            || (p?.title || '').toLowerCase().includes(q)
            || (member?.name || '').toLowerCase().includes(q);
        })
      : updates;

    const showForm = assigned.length > 0
      && (WS.Auth.isDeveloper() || WS.Auth.isLead() || WS.Auth.isManager());

    panel.innerHTML = `
      <div class="space-y-5">
        <div>
          <h2 class="ws-page-title">Daily Updates</h2>
          <p class="ws-page-sub">Log progress and review activity history.</p>
        </div>
        ${showForm ? renderFormCard(assigned) : `
          <div class="ws-alert ws-alert--warn">
            You are not assigned to any projects as a lead or developer, so you cannot submit daily updates.
          </div>
        `}
        <div class="ws-card">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 class="font-semibold text-slate-900 font-display">
              ${WS.Auth.isManager() || WS.Auth.isLead() ? 'Activity History' : 'Your Update History'}
            </h3>
            <input type="search" id="updates-search" value="${U.escapeHtml(WS.Store.state.updateSearch)}"
              placeholder="Search updates…" class="ws-input sm:!w-64" />
          </div>
          ${renderTable(filtered, true)}
        </div>
      </div>
    `;

    const search = document.getElementById('updates-search');
    if (search) {
      search.addEventListener('input', (e) => {
        WS.Store.state.updateSearch = e.target.value;
        render();
        const el = document.getElementById('updates-search');
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      });
    }
    bindForm();
    bindTableActions();
  }

  WS.Updates = {
    render,
    renderFormCard,
    renderTable,
    bindForm,
    bindTableActions
  };
})(window.Workshilla);
