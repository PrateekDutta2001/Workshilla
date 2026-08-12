/**
 * Workshilla — Light / Dark theme controller
 */
(function (WS) {
  'use strict';

  const KEY = () => (WS.Config && WS.Config.THEME_KEY) || 'workshilla_theme';

  function getPreferred() {
    try {
      const saved = localStorage.getItem(KEY());
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (_) { /* ignore */ }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function apply(theme) {
    const mode = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#0f172a' : '#312e81');
    syncButtons(mode);
  }

  function syncButtons(mode) {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      const isDark = mode === 'dark';
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      const label = btn.querySelector('[data-theme-label]');
      if (label) label.textContent = isDark ? 'Light' : 'Dark';
      const iconSun = btn.querySelector('[data-icon="sun"]');
      const iconMoon = btn.querySelector('[data-icon="moon"]');
      if (iconSun) iconSun.classList.toggle('hidden', !isDark);
      if (iconMoon) iconMoon.classList.toggle('hidden', isDark);
    });
  }

  function current() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function set(theme) {
    const mode = theme === 'dark' ? 'dark' : 'light';
    try { localStorage.setItem(KEY(), mode); } catch (_) { /* ignore */ }
    apply(mode);
  }

  function toggle() {
    set(current() === 'dark' ? 'light' : 'dark');
  }

  function buttonHtml(extraClass) {
    return `
      <button type="button" class="theme-toggle ${extraClass || ''}" data-theme-toggle aria-label="Toggle color theme">
        <svg data-icon="moon" class="theme-toggle__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
        <svg data-icon="sun" class="theme-toggle__icon hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05L5.636 5.636m12.728 0L16.95 7.05M7.05 16.95l-1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z"/>
        </svg>
        <span data-theme-label>Dark</span>
      </button>
    `;
  }

  function bindAll() {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      if (btn.dataset.boundTheme === '1') return;
      btn.dataset.boundTheme = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggle();
      });
    });
    syncButtons(current());
  }

  function init() {
    apply(getPreferred());
    bindAll();
  }

  WS.Theme = { getPreferred, apply, current, set, toggle, buttonHtml, bindAll, init };
})(window.Workshilla);
