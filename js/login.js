/**
 * Workshilla — Login / Create Account home screen
 */
(function (WS) {
  'use strict';

  const U = WS.Utils;

  function roleOptions(selected) {
    return WS.ROLE_ORDER.map((role) =>
      `<option value="${role}" ${selected === role ? 'selected' : ''}>${WS.ROLE_LABELS[role]}</option>`
    ).join('');
  }

  function renderLoginForm() {
    return `
      <form id="login-form" class="auth-form space-y-4">
        <div>
          <label class="ws-label" for="login-username">Username</label>
          <input id="login-username" name="username" type="text" autocomplete="username"
            placeholder="e.g. ALEX" class="ws-input" required />
          <p class="text-xs text-slate-500 mt-1">Username is your first name in CAPITAL letters.</p>
        </div>
        <div>
          <label class="ws-label" for="login-password">Password</label>
          <input id="login-password" name="password" type="password" autocomplete="current-password"
            placeholder="LastName@2026" class="ws-input" required />
        </div>
        <div id="login-error" class="ws-error"></div>
        <button type="submit" class="ws-btn ws-btn--primary w-full">Sign In</button>
        <p class="text-center text-sm text-slate-500">
          New to Workshilla?
          <button type="button" id="goto-register" class="text-indigo-600 font-semibold hover:underline">Create Account</button>
        </p>
      </form>
    `;
  }

  function renderRegisterForm() {
    return `
      <form id="register-form" class="auth-form space-y-4">
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="ws-label">First Name <span class="text-red-500">*</span></label>
            <input name="first_name" type="text" class="ws-input" required />
          </div>
          <div>
            <label class="ws-label">Last Name <span class="text-red-500">*</span></label>
            <input name="last_name" type="text" class="ws-input" required />
          </div>
        </div>
        <div>
          <label class="ws-label">Email <span class="text-red-500">*</span></label>
          <input name="email" type="email" class="ws-input" required />
        </div>
        <div>
          <label class="ws-label">Role in Project <span class="text-red-500">*</span></label>
          <select name="role" class="ws-select" required>${roleOptions('developer')}</select>
        </div>
        <div>
          <label class="ws-label">Designation in Organization <span class="text-red-500">*</span></label>
          <input name="designation" type="text" class="ws-input" placeholder="e.g. Software Engineer" required />
        </div>
        <div class="ws-alert ws-alert--info">
          Your username will be your <strong>first name in CAPITALS</strong>.
          Default password will be <strong>LastName@2026</strong>. You can change it after login.
        </div>
        <div id="register-error" class="ws-error"></div>
        <button type="submit" class="ws-btn ws-btn--primary w-full">Create Account</button>
        <p class="text-center text-sm text-slate-500">
          Already have an account?
          <button type="button" id="goto-login" class="text-indigo-600 font-semibold hover:underline">Sign In</button>
        </p>
      </form>
    `;
  }

  function render(mode) {
    mode = mode || 'login';
    const root = document.getElementById('auth-screen');
    if (!root) return;

    root.innerHTML = `
      <div class="auth-topbar">
        ${WS.Theme.buttonHtml('theme-toggle--auth')}
      </div>
      <div class="auth-hero">
        <div class="auth-card">
          <div class="auth-card__brand">
            <div class="brand-mark auth-mark">W</div>
            <h1 class="brand-name">Workshilla</h1>
            <p class="auth-card__tagline">Enterprise Work Tracking Platform</p>
          </div>
          <div class="auth-tabs">
            <button type="button" class="auth-tab ${mode === 'login' ? 'is-active' : ''}" data-auth-mode="login">Sign In</button>
            <button type="button" class="auth-tab ${mode === 'register' ? 'is-active' : ''}" data-auth-mode="register">Create Account</button>
          </div>
          <div id="auth-form-slot">
            ${mode === 'register' ? renderRegisterForm() : renderLoginForm()}
          </div>
          <div class="auth-demo-hint">
            <p class="font-semibold auth-demo-hint__title mb-1">Demo logins</p>
            <p>Admin: <code>ALEX</code> / <code>Rivera@2026</code></p>
            <p>PM: <code>SAM</code> / <code>Patel@2026</code></p>
            <p>Lead: <code>CASEY</code> / <code>Morgan@2026</code></p>
            <p>Dev: <code>TAYLOR</code> / <code>Brooks@2026</code></p>
          </div>
        </div>
      </div>
    `;

    WS.Theme.bindAll();

    root.querySelectorAll('[data-auth-mode]').forEach((btn) => {
      btn.addEventListener('click', () => render(btn.dataset.authMode));
    });

    document.getElementById('goto-register')?.addEventListener('click', () => render('register'));
    document.getElementById('goto-login')?.addEventListener('click', () => render('login'));

    if (mode === 'login') bindLogin();
    else bindRegister();
  }

  function bindLogin() {
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const username = String(fd.get('username') || '').trim();
      const password = String(fd.get('password') || '');
      const err = document.getElementById('login-error');
      const result = WS.Auth.login(username, password);
      if (!result.ok) {
        err.textContent = result.error;
        err.classList.add('is-visible');
        return;
      }
      WS.UI.toast(`Welcome, ${result.user.name}`);
      WS.UI.showApp();
      if (result.user.must_change_password) {
        setTimeout(() => WS.UI.openChangePasswordModal(true), 400);
      }
    });
  }

  function bindRegister() {
    document.getElementById('register-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const err = document.getElementById('register-error');
      const showErr = (msg) => {
        err.textContent = msg;
        err.classList.add('is-visible');
      };
      try {
        const first_name = String(fd.get('first_name') || '').trim();
        const last_name = String(fd.get('last_name') || '').trim();
        const email = String(fd.get('email') || '').trim();
        const role = fd.get('role');
        const designation = String(fd.get('designation') || '').trim();
        if (!first_name || !last_name || !email || !role || !designation) {
          return showErr('All fields are required.');
        }
        const user = WS.Users.createUser({
          first_name, last_name, email, role, designation, must_change_password: true
        });
        WS.Store.addAudit('account_created', `Account created for ${user.name} (${user.username})`);
        WS.UI.toast(`Account created. Username: ${user.username}`);
        WS.Auth.login(user.username, user.password);
        WS.UI.showApp();
        setTimeout(() => WS.UI.openChangePasswordModal(true), 400);
      } catch (ex) {
        showErr(ex.message || 'Could not create account.');
      }
    });
  }

  function hide() {
    const el = document.getElementById('auth-screen');
    if (el) el.classList.add('hidden');
  }

  function show() {
    const el = document.getElementById('auth-screen');
    if (el) {
      el.classList.remove('hidden');
      render('login');
    }
  }

  WS.Login = { render, show, hide };
})(window.Workshilla);
