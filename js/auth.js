/**
 * Workshilla — Role-based access control
 */
(function (WS) {
  'use strict';

  function currentUser() {
    return WS.Store.currentUser();
  }

  function isManager() {
    const u = currentUser();
    if (!u) return false;
    return u.role === 'admin' || u.role === 'engagement_manager' || u.role === 'project_manager';
  }

  function isLead() {
    return currentUser()?.role === 'lead';
  }

  function isDeveloper() {
    return currentUser()?.role === 'developer';
  }

  function canCreateProjects() {
    return isManager() || isLead();
  }

  function canManageData() {
    return isManager();
  }

  function canCreateAccounts() {
    return isManager();
  }

  function canViewProjectUpdates(project) {
    if (!project) return false;
    if (isManager()) return true;
    return canAccessProject(project);
  }

  function canAccessProject(project) {
    const user = currentUser();
    if (!user || !project) return false;
    if (isManager()) return true;
    if (user.role === 'lead') return project.lead_id === user.id;
    if (user.role === 'developer') return project.developer_ids.includes(user.id);
    return false;
  }

  function canEditProjectTeam(project) {
    if (!project) return false;
    if (isManager()) return true;
    if (isLead() && project.lead_id === WS.Store.state.currentUserId) return true;
    return false;
  }

  function canReassignLead(project) {
    return isManager() && !!project;
  }

  function canEditTimeline(project) {
    return canEditProjectTeam(project);
  }

  function visibleProjects() {
    const user = currentUser();
    if (!user) return [];
    const projects = WS.Store.getDb().projects;
    if (isManager()) return [...projects];
    if (user.role === 'lead') {
      return projects.filter((p) => p.lead_id === user.id);
    }
    // Developers: only projects they are tagged on
    return projects.filter((p) => p.developer_ids.includes(user.id));
  }

  function assignedProjectsForUpdates() {
    const user = currentUser();
    if (!user) return [];
    return WS.Store.getDb().projects.filter((p) =>
      p.developer_ids.includes(user.id) || p.lead_id === user.id
    );
  }

  function visibleUsers() {
    const user = currentUser();
    if (!user) return [];
    const db = WS.Store.getDb();
    if (isManager()) return [...db.users];

    const projectIds = new Set(visibleProjects().map((p) => p.id));
    const related = new Set([user.id]);
    db.projects.forEach((p) => {
      if (!projectIds.has(p.id)) return;
      if (p.lead_id) related.add(p.lead_id);
      (p.developer_ids || []).forEach((id) => related.add(id));
      if (p.engagement_manager_id) related.add(p.engagement_manager_id);
      if (p.project_manager_id) related.add(p.project_manager_id);
    });
    return db.users.filter((u) => related.has(u.id));
  }

  function login(username, password) {
    const found = WS.Users.findByUsername(username);
    if (!found || found.password !== password) {
      return { ok: false, error: 'Invalid username or password.' };
    }
    WS.Store.setCurrentUser(found.id);
    WS.Store.addAudit('user_login', `${found.name} signed in`);
    return { ok: true, user: found };
  }

  function logout() {
    const user = currentUser();
    if (user) WS.Store.addAudit('user_logout', `${user.name} signed out`);
    WS.Store.clearSession();
  }

  WS.Auth = {
    isManager,
    isLead,
    isDeveloper,
    canCreateProjects,
    canManageData,
    canCreateAccounts,
    canViewProjectUpdates,
    canAccessProject,
    canEditProjectTeam,
    canEditTimeline,
    canReassignLead,
    visibleProjects,
    assignedProjectsForUpdates,
    visibleUsers,
    login,
    logout
  };
})(window.Workshilla);
