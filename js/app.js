/**
 * Workshilla — Application bootstrap
 */
(function (WS) {
  'use strict';

  function init() {
    WS.Theme.init();
    WS.Store.loadDb();
    WS.Store.loadSession();

    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => WS.UI.navigate(btn.dataset.tab));
    });

    document.getElementById('modal-backdrop')?.addEventListener('click', WS.UI.closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') WS.UI.closeModal();
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      WS.Auth.logout();
      WS.UI.toast('Signed out', 'info');
      WS.UI.showLogin();
    });

    document.getElementById('btn-change-password')?.addEventListener('click', () => {
      WS.UI.openChangePasswordModal(false);
    });

    if (WS.Store.state.isAuthenticated && WS.Store.currentUser()) {
      WS.UI.showApp();
      if (WS.Store.currentUser().must_change_password) {
        setTimeout(() => WS.UI.openChangePasswordModal(true), 300);
      }
    } else {
      WS.UI.showLogin();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.Workshilla);
