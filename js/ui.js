/**
 * Workshilla — UI chrome (toasts, modals, navigation, shell)
 */
(function (WS) {
  'use strict';

  const { escapeHtml } = WS.Utils;

  function toast(message, type) {
    type = type || 'success';
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  function openModal(html) {
    const root = document.getElementById('modal-root');
    document.getElementById('modal-content').innerHTML = html;
    root.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modal-root').classList.add('hidden');
    document.getElementById('modal-content').innerHTML = '';
    document.body.style.overflow = '';
  }

  function navigate(tab) {
    if (tab !== 'projects') WS.Store.state.selectedProjectId = null;
    WS.Store.state.activeTab = tab;
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
    const panel = document.getElementById(`panel-${tab}`);
    if (panel) panel.classList.remove('hidden');
    renderActivePanel();
  }

  function renderActivePanel() {
    switch (WS.Store.state.activeTab) {
      case 'dashboard': WS.Dashboard.render(); break;
      case 'projects': WS.Projects.render(); break;
      case 'updates': WS.Updates.render(); break;
      case 'roster': WS.Roster.render(); break;
      case 'settings': WS.Settings.render(); break;
      default: break;
    }
  }

  function updateHeaderUser() {
    const user = WS.Store.currentUser();
    const badge = document.getElementById('current-role-badge');
    const nameEl = document.getElementById('header-user-name');
    const metaEl = document.getElementById('header-user-meta');
    if (!user) {
      if (badge) badge.hidden = true;
      if (nameEl) nameEl.textContent = '';
      if (metaEl) metaEl.textContent = '';
      return;
    }
    if (badge) {
      badge.textContent = WS.ROLE_LABELS[user.role];
      badge.hidden = false;
    }
    if (nameEl) nameEl.textContent = user.name;
    if (metaEl) metaEl.textContent = `${user.username} · ${user.designation || WS.ROLE_LABELS[user.role]}`;
  }

  function refreshAll() {
    updateHeaderUser();
    renderActivePanel();
  }

  function showApp() {
    WS.Login.hide();
    document.getElementById('app-workspace')?.classList.remove('hidden');
    document.getElementById('auth-screen')?.classList.add('hidden');
    refreshAll();
    navigate('dashboard');
  }

  function showLogin() {
    document.getElementById('app-workspace')?.classList.add('hidden');
    WS.Login.show();
  }

  function openChangePasswordModal(forced) {
    const user = WS.Store.currentUser();
    if (!user) return;
    openModal(`
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 id="modal-title" class="text-lg font-bold text-slate-900 font-display">Change Password</h3>
            <p class="text-sm text-slate-500">${forced ? 'Please set a new password for your account.' : 'Update your Workshilla password.'}</p>
          </div>
          ${forced ? '' : '<button type="button" id="modal-close" class="modal-close" aria-label="Close">&times;</button>'}
        </div>
        <form id="password-form" class="space-y-3">
          <div>
            <label class="ws-label">Current Password</label>
            <input name="current" type="password" class="ws-input" required />
          </div>
          <div>
            <label class="ws-label">New Password</label>
            <input name="next" type="password" class="ws-input" minlength="6" required />
          </div>
          <div>
            <label class="ws-label">Confirm New Password</label>
            <input name="confirm" type="password" class="ws-input" minlength="6" required />
          </div>
          <div id="password-error" class="ws-error"></div>
          <div class="flex justify-end gap-2 pt-2">
            ${forced ? '' : '<button type="button" id="modal-cancel" class="ws-btn ws-btn--ghost">Cancel</button>'}
            <button type="submit" class="ws-btn ws-btn--primary">Save Password</button>
          </div>
        </form>
      </div>
    `);

    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
    document.getElementById('password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const err = document.getElementById('password-error');
      const showErr = (msg) => { err.textContent = msg; err.classList.add('is-visible'); };
      const next = String(fd.get('next') || '');
      const confirm = String(fd.get('confirm') || '');
      if (next !== confirm) return showErr('New passwords do not match.');
      try {
        WS.Users.changePassword(user.id, String(fd.get('current') || ''), next);
        WS.Store.addAudit('password_changed', `${user.name} changed password`);
        closeModal();
        toast('Password updated');
        refreshAll();
      } catch (ex) {
        showErr(ex.message || 'Could not update password.');
      }
    });
  }

  function openCreateAccountModal() {
    openModal(`
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 id="modal-title" class="text-lg font-bold text-slate-900 font-display">Create Account</h3>
          <button type="button" id="modal-close" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <form id="admin-create-account" class="space-y-3">
          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="ws-label">First Name *</label>
              <input name="first_name" class="ws-input" required />
            </div>
            <div>
              <label class="ws-label">Last Name *</label>
              <input name="last_name" class="ws-input" required />
            </div>
          </div>
          <div>
            <label class="ws-label">Email *</label>
            <input name="email" type="email" class="ws-input" required />
          </div>
          <div>
            <label class="ws-label">Role in Project *</label>
            <select name="role" class="ws-select" required>
              ${WS.ROLE_ORDER.map((r) => `<option value="${r}">${WS.ROLE_LABELS[r]}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="ws-label">Designation in Organization *</label>
            <input name="designation" class="ws-input" required />
          </div>
          <div class="ws-alert ws-alert--info">
            Login will be created as <strong>FIRSTNAME</strong> / <strong>LastName@2026</strong>.
          </div>
          <div id="create-account-error" class="ws-error"></div>
          <div class="flex justify-end gap-2">
            <button type="button" id="modal-cancel" class="ws-btn ws-btn--ghost">Cancel</button>
            <button type="submit" class="ws-btn ws-btn--primary">Create Account</button>
          </div>
        </form>
      </div>
    `);

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('admin-create-account').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const err = document.getElementById('create-account-error');
      try {
        const user = WS.Users.createUser({
          first_name: String(fd.get('first_name') || '').trim(),
          last_name: String(fd.get('last_name') || '').trim(),
          email: String(fd.get('email') || '').trim(),
          role: fd.get('role'),
          designation: String(fd.get('designation') || '').trim(),
          must_change_password: true
        });
        WS.Store.addAudit('account_created', `Account created for ${user.name} (${user.username}) by ${WS.Store.currentUser()?.name}`);
        closeModal();
        toast(`Account created: ${user.username} / ${user.password}`);
        refreshAll();
      } catch (ex) {
        err.textContent = ex.message;
        err.classList.add('is-visible');
      }
    });
  }

  WS.UI = {
    toast,
    openModal,
    closeModal,
    navigate,
    renderActivePanel,
    updateHeaderUser,
    refreshAll,
    showApp,
    showLogin,
    openChangePasswordModal,
    openCreateAccountModal
  };
})(window.Workshilla);
