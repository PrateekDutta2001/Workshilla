/**
 * Workshilla — Application configuration & constants
 */
window.Workshilla = window.Workshilla || {};

Workshilla.Config = Object.freeze({
  APP_NAME: 'Workshilla',
  DB_KEY: 'workshilla_db',
  SESSION_KEY: 'workshilla_session',
  THEME_KEY: 'workshilla_theme',
  LEGACY_DB_KEY: 'team_tracker_db',
  EXPORT_FILENAME: 'workshilla_export.json',
  VERSION: '2.1.0',
  SCHEMA_VERSION: 2,
  DEFAULT_PASSWORD_YEAR: '2026'
});

Workshilla.ROLE_LABELS = Object.freeze({
  admin: 'Admin',
  engagement_manager: 'Engagement Manager',
  project_manager: 'Project Manager',
  lead: 'Lead',
  developer: 'Developer'
});

Workshilla.STATUS_LABELS = Object.freeze({
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed'
});

Workshilla.FLAG_LABELS = Object.freeze({
  on_track: 'On Track',
  delayed: 'Delayed',
  blocked: 'Blocked'
});

Workshilla.ROLE_ORDER = Object.freeze([
  'admin',
  'engagement_manager',
  'project_manager',
  'lead',
  'developer'
]);
