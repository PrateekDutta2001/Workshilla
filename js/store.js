/**
 * Workshilla — Persistent JSON store (localStorage)
 */
(function (WS) {
  'use strict';

  const { DB_KEY, SESSION_KEY, LEGACY_DB_KEY, SCHEMA_VERSION } = WS.Config;
  const { uid } = WS.Utils;

  const state = {
    db: null,
    currentUserId: null,
    isAuthenticated: false,
    activeTab: 'dashboard',
    selectedProjectId: null,
    feedFilters: { dateFrom: '', dateTo: '', projectId: '', userId: '', statusFlag: '' },
    updateSearch: '',
    editingUpdateId: null
  };

  function isValidDb(obj) {
    return obj
      && Array.isArray(obj.users)
      && Array.isArray(obj.projects)
      && Array.isArray(obj.daily_updates)
      && Array.isArray(obj.audit_logs);
  }

  function migrateLegacyIfNeeded() {
    if (localStorage.getItem(DB_KEY)) return;
    const legacy = localStorage.getItem(LEGACY_DB_KEY);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (isValidDb(parsed)) localStorage.setItem(DB_KEY, legacy);
      } catch (_) { /* ignore */ }
    }
  }

  function ensureSchema(db) {
    WS.Users.migrateAllUsers(db);
    if (db.schema_version !== SCHEMA_VERSION) {
      db.schema_version = SCHEMA_VERSION;
    }
  }

  function loadDb() {
    migrateLegacyIfNeeded();
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) {
        state.db = WS.Seed.seedData();
        saveDb();
        return;
      }
      const parsed = JSON.parse(raw);
      if (!isValidDb(parsed)) {
        state.db = WS.Seed.seedData();
        saveDb();
        return;
      }
      ensureSchema(parsed);
      state.db = parsed;
      saveDb();
    } catch (_) {
      state.db = WS.Seed.seedData();
      saveDb();
    }
  }

  function saveDb() {
    localStorage.setItem(DB_KEY, JSON.stringify(state.db));
  }

  function getDb() {
    return state.db;
  }

  function setDb(db) {
    ensureSchema(db);
    state.db = db;
    saveDb();
  }

  function loadSession() {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved && state.db.users.some((u) => u.id === saved)) {
      state.currentUserId = saved;
      state.isAuthenticated = true;
    } else {
      state.currentUserId = null;
      state.isAuthenticated = false;
      localStorage.removeItem(SESSION_KEY);
    }
  }

  function setCurrentUser(id) {
    state.currentUserId = id;
    state.isAuthenticated = !!id;
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  }

  function clearSession() {
    state.currentUserId = null;
    state.isAuthenticated = false;
    state.selectedProjectId = null;
    state.editingUpdateId = null;
    localStorage.removeItem(SESSION_KEY);
  }

  function currentUser() {
    if (!state.currentUserId) return null;
    return state.db.users.find((u) => u.id === state.currentUserId) || null;
  }

  function getUser(id) {
    return state.db.users.find((u) => u.id === id);
  }

  function getProject(id) {
    return state.db.projects.find((p) => p.id === id);
  }

  function addAudit(action, details) {
    state.db.audit_logs.unshift({
      id: uid('al'),
      timestamp: new Date().toISOString(),
      action,
      details,
      performed_by: state.currentUserId || 'system'
    });
    saveDb();
  }

  function resetToSeed() {
    state.db = WS.Seed.seedData();
    saveDb();
    clearSession();
  }

  WS.Store = {
    state,
    isValidDb,
    loadDb,
    saveDb,
    getDb,
    setDb,
    loadSession,
    setCurrentUser,
    clearSession,
    currentUser,
    getUser,
    getProject,
    addAudit,
    resetToSeed
  };
})(window.Workshilla);
