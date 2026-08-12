/**
 * Workshilla — User provisioning & credential helpers
 */
(function (WS) {
  'use strict';

  const { uid } = WS.Utils;
  const YEAR = WS.Config.DEFAULT_PASSWORD_YEAR;

  function splitName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/);
    if (parts.length === 0 || (parts.length === 1 && !parts[0])) {
      return { first_name: 'User', last_name: 'Unknown' };
    }
    if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] };
    return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
  }

  function displayName(user) {
    if (!user) return '—';
    if (user.name) return user.name;
    return [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || '—';
  }

  function defaultPassword(lastName) {
    const last = String(lastName || 'User').replace(/\s+/g, '');
    return `${last}@${YEAR}`;
  }

  function makeUsername(firstName, existingUsers, excludeId) {
    const base = String(firstName || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'USER';
    const users = existingUsers || WS.Store.getDb().users;
    let candidate = base;
    let n = 2;
    while (users.some((u) => u.username === candidate && u.id !== excludeId)) {
      candidate = `${base}${n}`;
      n += 1;
    }
    return candidate;
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function findByEmail(email) {
    const key = normalizeEmail(email);
    return WS.Store.getDb().users.find((u) => normalizeEmail(u.email) === key);
  }

  function findByUsername(username) {
    const key = String(username || '').trim().toUpperCase();
    return WS.Store.getDb().users.find((u) => String(u.username || '').toUpperCase() === key);
  }

  function buildUser(payload) {
    const first_name = String(payload.first_name || '').trim();
    const last_name = String(payload.last_name || '').trim();
    const email = normalizeEmail(payload.email);
    const role = payload.role;
    const designation = String(payload.designation || '').trim();
    const users = WS.Store.getDb().users;
    const username = payload.username
      ? String(payload.username).toUpperCase()
      : makeUsername(first_name, users);
    const password = payload.password || defaultPassword(last_name);

    return {
      id: payload.id || uid('u'),
      first_name,
      last_name,
      name: `${first_name} ${last_name}`.trim(),
      email,
      role,
      designation: designation || WS.ROLE_LABELS[role] || role,
      username,
      password,
      must_change_password: payload.must_change_password !== false
    };
  }

  function createUser(payload) {
    const user = buildUser(payload);
    const db = WS.Store.getDb();
    if (findByEmail(user.email)) {
      throw new Error('An account with this email already exists.');
    }
    if (db.users.some((u) => u.username === user.username)) {
      user.username = makeUsername(user.first_name, db.users);
    }
    db.users.push(user);
    WS.Store.saveDb();
    return user;
  }

  function updateUser(id, patch) {
    const user = WS.Store.getUser(id);
    if (!user) throw new Error('User not found.');
    if (patch.first_name != null) user.first_name = String(patch.first_name).trim();
    if (patch.last_name != null) user.last_name = String(patch.last_name).trim();
    if (patch.email != null) {
      const email = normalizeEmail(patch.email);
      const clash = findByEmail(email);
      if (clash && clash.id !== id) throw new Error('Email already in use.');
      user.email = email;
    }
    if (patch.role != null) user.role = patch.role;
    if (patch.designation != null) user.designation = String(patch.designation).trim();
    if (patch.password != null) {
      user.password = String(patch.password);
      user.must_change_password = !!patch.must_change_password;
    }
    if (patch.username != null) {
      const username = String(patch.username).toUpperCase();
      const clash = findByUsername(username);
      if (clash && clash.id !== id) throw new Error('Username already in use.');
      user.username = username;
    }
    user.name = `${user.first_name} ${user.last_name}`.trim();
    WS.Store.saveDb();
    return user;
  }

  function changePassword(userId, currentPassword, newPassword) {
    const user = WS.Store.getUser(userId);
    if (!user) throw new Error('User not found.');
    if (user.password !== currentPassword) throw new Error('Current password is incorrect.');
    if (!newPassword || String(newPassword).length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }
    user.password = String(newPassword);
    user.must_change_password = false;
    WS.Store.saveDb();
    return user;
  }

  /**
   * Resolve a project member by email — reuse existing account or create one.
   */
  function resolveOrCreateMember({ first_name, last_name, email, role, designation }) {
    const existing = findByEmail(email);
    if (existing) {
      const patch = {};
      if (first_name) patch.first_name = first_name;
      if (last_name) patch.last_name = last_name;
      if (designation) patch.designation = designation;
      if (role && existing.role !== role && (role === 'lead' || role === 'developer')) {
        patch.role = role;
      }
      if (Object.keys(patch).length) updateUser(existing.id, patch);
      return { user: WS.Store.getUser(existing.id), created: false };
    }
    if (!first_name || !last_name || !email) {
      throw new Error('First name, last name, and email are required for new members.');
    }
    const user = createUser({
      first_name,
      last_name,
      email,
      role: role || 'developer',
      designation: designation || WS.ROLE_LABELS[role || 'developer'],
      must_change_password: true
    });
    return { user, created: true };
  }

  function migrateUserRecord(u) {
    if (u.username && u.password && u.first_name && u.last_name) {
      u.name = `${u.first_name} ${u.last_name}`.trim();
      return u;
    }
    const { first_name, last_name } = u.first_name
      ? { first_name: u.first_name, last_name: u.last_name || u.first_name }
      : splitName(u.name);
    u.first_name = first_name;
    u.last_name = last_name;
    u.name = `${first_name} ${last_name}`.trim();
    u.designation = u.designation || WS.ROLE_LABELS[u.role] || u.role;
    u.username = u.username || makeUsername(first_name, [u], u.id);
    u.password = u.password || defaultPassword(last_name);
    if (u.must_change_password == null) u.must_change_password = false;
    return u;
  }

  function migrateAllUsers(db) {
    const seen = new Set();
    db.users.forEach((u) => {
      migrateUserRecord(u);
      let base = u.username;
      let n = 2;
      while (seen.has(u.username)) {
        u.username = `${base}${n}`;
        n += 1;
      }
      seen.add(u.username);
    });
    db.schema_version = WS.Config.SCHEMA_VERSION;
  }

  WS.Users = {
    splitName,
    displayName,
    defaultPassword,
    makeUsername,
    normalizeEmail,
    findByEmail,
    findByUsername,
    buildUser,
    createUser,
    updateUser,
    changePassword,
    resolveOrCreateMember,
    migrateUserRecord,
    migrateAllUsers
  };
})(window.Workshilla);
