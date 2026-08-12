/**
 * Workshilla — Seed / mock dataset (with login credentials)
 * Username = FIRST NAME in CAPS · Default password = LastName@2026
 */
(function (WS) {
  'use strict';

  const { todayISO, daysAgoISO } = WS.Utils;

  function user(partial) {
    const first_name = partial.first_name;
    const last_name = partial.last_name;
    return {
      id: partial.id,
      first_name,
      last_name,
      name: `${first_name} ${last_name}`,
      email: partial.email,
      role: partial.role,
      designation: partial.designation,
      username: first_name.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      password: `${last_name.replace(/\s+/g, '')}@2026`,
      must_change_password: false
    };
  }

  function seedData() {
    const users = [
      user({ id: 'u_admin', first_name: 'Alex', last_name: 'Rivera', role: 'admin', email: 'alex.rivera@company.com', designation: 'Platform Administrator' }),
      user({ id: 'u_em1', first_name: 'Jordan', last_name: 'Lee', role: 'engagement_manager', email: 'jordan.lee@company.com', designation: 'Engagement Manager' }),
      user({ id: 'u_pm1', first_name: 'Sam', last_name: 'Patel', role: 'project_manager', email: 'sam.patel@company.com', designation: 'Senior Project Manager' }),
      user({ id: 'u_lead1', first_name: 'Casey', last_name: 'Morgan', role: 'lead', email: 'casey.morgan@company.com', designation: 'Technical Lead' }),
      user({ id: 'u_lead2', first_name: 'Riley', last_name: 'Chen', role: 'lead', email: 'riley.chen@company.com', designation: 'Delivery Lead' }),
      user({ id: 'u_dev1', first_name: 'Taylor', last_name: 'Brooks', role: 'developer', email: 'taylor.brooks@company.com', designation: 'Software Engineer' }),
      user({ id: 'u_dev2', first_name: 'Morgan', last_name: 'Blake', role: 'developer', email: 'morgan.blake@company.com', designation: 'Full-Stack Developer' }),
      user({ id: 'u_dev3', first_name: 'Jamie', last_name: 'Quinn', role: 'developer', email: 'jamie.quinn@company.com', designation: 'Frontend Developer' })
    ];

    const projects = [
      {
        id: 'p_001',
        title: 'Platform Modernization',
        type: 'internal',
        team_name: 'Core Engineering',
        cst_team_name: null,
        client_name: null,
        estimated_timeline: { start_date: daysAgoISO(30), end_date: daysAgoISO(-60) },
        project_scope: 'Migrate legacy services to microservices, improve CI/CD, and establish observability standards across core product teams.',
        engagement_manager_id: 'u_em1',
        project_manager_id: 'u_pm1',
        lead_id: 'u_lead1',
        developer_ids: ['u_dev1', 'u_dev2'],
        status: 'active',
        created_at: daysAgoISO(35) + 'T09:00:00.000Z'
      },
      {
        id: 'p_002',
        title: 'Acme Portal Redesign',
        type: 'client',
        team_name: null,
        cst_team_name: 'CST Digital Experience',
        client_name: 'Acme Corp',
        estimated_timeline: { start_date: daysAgoISO(14), end_date: daysAgoISO(-45) },
        project_scope: 'Redesign customer self-service portal with accessibility upgrades, new dashboard widgets, and SSO integration.',
        engagement_manager_id: 'u_em1',
        project_manager_id: 'u_pm1',
        lead_id: 'u_lead2',
        developer_ids: ['u_dev2', 'u_dev3'],
        status: 'active',
        created_at: daysAgoISO(20) + 'T10:30:00.000Z'
      },
      {
        id: 'p_003',
        title: 'Internal Knowledge Base',
        type: 'internal',
        team_name: 'Enablement',
        cst_team_name: null,
        client_name: null,
        estimated_timeline: { start_date: daysAgoISO(7), end_date: daysAgoISO(-90) },
        project_scope: 'Build a searchable internal knowledge base with tagging, versioning, and role-based article visibility.',
        engagement_manager_id: 'u_em1',
        project_manager_id: 'u_pm1',
        lead_id: 'u_lead1',
        developer_ids: ['u_dev3'],
        status: 'planning',
        created_at: daysAgoISO(10) + 'T14:00:00.000Z'
      }
    ];

    const daily_updates = [
      {
        id: 'du_001', project_id: 'p_001', user_id: 'u_dev1', user_role: 'developer',
        date: todayISO(), hours_spent: 6,
        task_summary: 'Completed auth service extraction and unit tests for token refresh flow.',
        blockers: '', status_flag: 'on_track', created_at: todayISO() + 'T17:00:00.000Z'
      },
      {
        id: 'du_002', project_id: 'p_001', user_id: 'u_dev2', user_role: 'developer',
        date: todayISO(), hours_spent: 5,
        task_summary: 'Debugged CI pipeline flakiness; waiting on infra for runner capacity.',
        blockers: 'Limited CI runners causing queue delays', status_flag: 'delayed',
        created_at: todayISO() + 'T16:30:00.000Z'
      },
      {
        id: 'du_003', project_id: 'p_002', user_id: 'u_dev3', user_role: 'developer',
        date: todayISO(), hours_spent: 7,
        task_summary: 'Implemented dashboard widget shell and wired mock data bindings.',
        blockers: '', status_flag: 'on_track', created_at: todayISO() + 'T18:00:00.000Z'
      },
      {
        id: 'du_004', project_id: 'p_002', user_id: 'u_lead2', user_role: 'lead',
        date: todayISO(), hours_spent: 4,
        task_summary: 'Reviewed SSO design with client security team; clarified claim mapping.',
        blockers: 'Client IdP docs incomplete', status_flag: 'blocked',
        created_at: todayISO() + 'T15:00:00.000Z'
      },
      {
        id: 'du_005', project_id: 'p_001', user_id: 'u_lead1', user_role: 'lead',
        date: daysAgoISO(1), hours_spent: 5,
        task_summary: 'Paired on service boundaries; updated architecture decision record.',
        blockers: '', status_flag: 'on_track', created_at: daysAgoISO(1) + 'T17:00:00.000Z'
      },
      {
        id: 'du_006', project_id: 'p_001', user_id: 'u_dev1', user_role: 'developer',
        date: daysAgoISO(1), hours_spent: 8,
        task_summary: 'Migrated user profile endpoints; added OpenAPI docs.',
        blockers: '', status_flag: 'on_track', created_at: daysAgoISO(1) + 'T18:00:00.000Z'
      },
      {
        id: 'du_007', project_id: 'p_002', user_id: 'u_dev2', user_role: 'developer',
        date: daysAgoISO(1), hours_spent: 6,
        task_summary: 'Accessibility pass on navigation and form labels.',
        blockers: '', status_flag: 'on_track', created_at: daysAgoISO(1) + 'T16:00:00.000Z'
      },
      {
        id: 'du_008', project_id: 'p_002', user_id: 'u_dev3', user_role: 'developer',
        date: daysAgoISO(2), hours_spent: 7,
        task_summary: 'Built responsive layout grid for portal redesign.',
        blockers: '', status_flag: 'on_track', created_at: daysAgoISO(2) + 'T17:30:00.000Z'
      },
      {
        id: 'du_009', project_id: 'p_003', user_id: 'u_dev3', user_role: 'developer',
        date: daysAgoISO(2), hours_spent: 3,
        task_summary: 'Spike on search indexing options for knowledge base.',
        blockers: 'Need product decision on full-text vs vector search', status_flag: 'delayed',
        created_at: daysAgoISO(2) + 'T14:00:00.000Z'
      },
      {
        id: 'du_010', project_id: 'p_001', user_id: 'u_dev2', user_role: 'developer',
        date: daysAgoISO(3), hours_spent: 6,
        task_summary: 'Added structured logging to billing adapter service.',
        blockers: '', status_flag: 'on_track', created_at: daysAgoISO(3) + 'T17:00:00.000Z'
      }
    ];

    const audit_logs = [
      {
        id: 'al_001',
        timestamp: daysAgoISO(35) + 'T09:05:00.000Z',
        action: 'project_created',
        details: 'Created project "Platform Modernization" (internal)',
        performed_by: 'u_pm1'
      },
      {
        id: 'al_002',
        timestamp: daysAgoISO(20) + 'T10:35:00.000Z',
        action: 'project_created',
        details: 'Created project "Acme Portal Redesign" (client)',
        performed_by: 'u_pm1'
      },
      {
        id: 'al_003',
        timestamp: daysAgoISO(10) + 'T14:05:00.000Z',
        action: 'project_created',
        details: 'Created project "Internal Knowledge Base" (internal)',
        performed_by: 'u_admin'
      },
      {
        id: 'al_004',
        timestamp: daysAgoISO(5) + 'T11:00:00.000Z',
        action: 'developer_added',
        details: 'Added Morgan Blake to Platform Modernization',
        performed_by: 'u_lead1'
      }
    ];

    return {
      schema_version: WS.Config.SCHEMA_VERSION,
      users,
      projects,
      daily_updates,
      audit_logs
    };
  }

  WS.Seed = { seedData };
})(window.Workshilla);
