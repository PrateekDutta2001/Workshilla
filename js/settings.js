/**
 * Workshilla — Data settings (export / import / reset / audit / password)
 */
(function (WS) {
  'use strict';

  const U = WS.Utils;
  const { EXPORT_FILENAME, DB_KEY } = WS.Config;

  function exportDatabase() {
    const blob = new Blob([JSON.stringify(WS.Store.getDb(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = EXPORT_FILENAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    WS.Store.addAudit('database_exported', `Exported full database as ${EXPORT_FILENAME}`);
    WS.UI.toast('Database exported');
    render();
  }

  function importDatabase(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!WS.Store.isValidDb(parsed)) {
          WS.UI.toast('Invalid database file: missing required arrays', 'error');
          return;
        }
        WS.Store.setDb(parsed);
        WS.Store.clearSession();
        WS.UI.toast('Database imported — please sign in again', 'info');
        WS.UI.showLogin();
      } catch (_) {
        WS.UI.toast('Failed to parse JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function resetDatabase() {
    WS.UI.openModal(`
      <div class="p-6">
        <h3 id="modal-title" class="text-lg font-bold text-slate-900 font-display mb-2">Reset to Default Data?</h3>
        <p class="text-sm text-slate-600 mb-5">This clears the current local database and re-seeds mock data. You will be signed out.</p>
        <div class="flex justify-end gap-2">
          <button type="button" id="modal-cancel" class="ws-btn ws-btn--ghost">Cancel</button>
          <button type="button" id="confirm-reset" class="ws-btn ws-btn--danger !bg-red-600 !text-white !border-red-600 hover:!bg-red-700">Reset Data</button>
        </div>
      </div>
    `);
    document.getElementById('modal-cancel').addEventListener('click', WS.UI.closeModal);
    document.getElementById('confirm-reset').addEventListener('click', () => {
      WS.Store.resetToSeed();
      WS.UI.closeModal();
      WS.UI.toast('Database reset to defaults');
      WS.UI.showLogin();
    });
  }

  function render() {
    const panel = document.getElementById('panel-settings');
    const canData = WS.Auth.canManageData();
    const user = WS.Store.currentUser();
    const logs = [...WS.Store.getDb().audit_logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    panel.innerHTML = `
      <div class="space-y-6">
        <div>
          <h2 class="ws-page-title">Data Settings</h2>
          <p class="ws-page-sub">Account security, database portability, and audit history.</p>
        </div>

        <div class="ws-card space-y-3">
          <h3 class="font-semibold text-slate-900 font-display">Your Account</h3>
          <div class="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span class="text-slate-500">Name</span><p class="font-medium">${U.escapeHtml(user?.name || '')}</p></div>
            <div><span class="text-slate-500">Username</span><p class="font-medium"><code>${U.escapeHtml(user?.username || '')}</code></p></div>
            <div><span class="text-slate-500">Email</span><p class="font-medium">${U.escapeHtml(user?.email || '')}</p></div>
            <div><span class="text-slate-500">Designation</span><p class="font-medium">${U.escapeHtml(user?.designation || '')}</p></div>
          </div>
          <button type="button" id="btn-settings-password" class="ws-btn ws-btn--secondary">Change Password</button>
        </div>

        ${canData ? `
          <div class="ws-card space-y-4">
            <h3 class="font-semibold text-slate-900 font-display">Database Portability</h3>
            <p class="text-sm text-slate-600">Export or import the full JSON database (includes users, passwords, projects, and logs).</p>
            <div class="flex flex-wrap gap-3">
              <button type="button" id="btn-export" class="ws-btn ws-btn--primary">Export Database (JSON)</button>
              <label class="ws-btn ws-btn--secondary cursor-pointer">
                Import Database (JSON)
                <input type="file" id="btn-import" accept=".json,application/json" class="hidden" />
              </label>
              <button type="button" id="btn-reset" class="ws-btn ws-btn--danger">Reset to Default Data</button>
            </div>
            <div class="ws-alert ws-alert--info">
              Storage key: <code class="font-mono">${DB_KEY}</code>
              · Export filename: <code class="font-mono">${EXPORT_FILENAME}</code>
            </div>
          </div>
        ` : `
          <div class="ws-alert ws-alert--warn">
            Export, import, and reset are available to Admins, Engagement Managers, and Project Managers.
          </div>
        `}

        ${canData ? `
          <div class="ws-card">
            <h3 class="font-semibold text-slate-900 mb-4 font-display">Audit Log Viewer</h3>
            <div class="ws-table-wrap max-h-[480px] overflow-y-auto scrollbar-thin">
              <table class="ws-table">
                <thead class="sticky top-0 bg-white">
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  ${logs.length === 0
                    ? '<tr><td colspan="4" class="text-slate-500">No audit entries yet.</td></tr>'
                    : logs.map((log) => {
                        const actor = WS.Store.getUser(log.performed_by);
                        return `
                          <tr>
                            <td class="whitespace-nowrap">${U.formatDateTime(log.timestamp)}</td>
                            <td><code class="text-xs bg-slate-100 px-1.5 py-0.5 rounded">${U.escapeHtml(log.action)}</code></td>
                            <td>${U.escapeHtml(log.details)}</td>
                            <td>${U.escapeHtml(actor?.name || log.performed_by)}</td>
                          </tr>
                        `;
                      }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <div class="ws-card text-sm text-slate-500">Audit log viewer is restricted to management roles.</div>
        `}
      </div>
    `;

    document.getElementById('btn-settings-password')?.addEventListener('click', () => {
      WS.UI.openChangePasswordModal(false);
    });

    if (!canData) return;
    document.getElementById('btn-export')?.addEventListener('click', exportDatabase);
    document.getElementById('btn-import')?.addEventListener('change', importDatabase);
    document.getElementById('btn-reset')?.addEventListener('click', resetDatabase);
  }

  WS.Settings = { render };
})(window.Workshilla);
