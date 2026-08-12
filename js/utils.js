/**
 * Workshilla — Shared utilities
 */
(function (WS) {
  'use strict';

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysAgoISO(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function startOfWeek(date) {
    const d = new Date(date || new Date());
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function endOfWeek(date) {
    const s = startOfWeek(date);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return e;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function timelineProgress(start, end) {
    const s = new Date(start + 'T00:00:00').getTime();
    const e = new Date(end + 'T00:00:00').getTime();
    const t = new Date().setHours(0, 0, 0, 0);
    if (e <= s) return 100;
    return clamp(Math.round(((t - s) / (e - s)) * 100), 0, 100);
  }

  function statusBadge(flag) {
    const label = WS.FLAG_LABELS[flag] || flag;
    return `<span class="badge badge--${escapeHtml(flag)}">${escapeHtml(label)}</span>`;
  }

  function projectStatusBadge(status) {
    const label = WS.STATUS_LABELS[status] || status;
    return `<span class="badge badge--${escapeHtml(status)}">${escapeHtml(label)}</span>`;
  }

  function roleBadge(role) {
    return `<span class="badge badge--role">${escapeHtml(WS.ROLE_LABELS[role] || role)}</span>`;
  }

  WS.Utils = {
    uid,
    todayISO,
    daysAgoISO,
    escapeHtml,
    formatDate,
    formatDateTime,
    startOfWeek,
    endOfWeek,
    clamp,
    timelineProgress,
    statusBadge,
    projectStatusBadge,
    roleBadge
  };
})(window.Workshilla);
