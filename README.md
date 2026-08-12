# Workshilla

**Enterprise work tracking for project teams** — manage projects, daily updates, team allocation, and role-based access in one lightweight web app. Built for GitHub Pages (static hosting) with persistent local JSON storage and easy team sync via export/import.

---

## Why use Workshilla?

| Advantage | What it means for you |
|-----------|------------------------|
| **One place for daily work** | Developers and leads log hours, blockers, and status in a shared project view — managers see the full picture without chasing updates. |
| **Role-based clarity** | Admin, Engagement Manager, Project Manager, Lead, and Developer each see only what they need. Leads and developers are limited to their tagged projects. |
| **No server required** | Runs entirely in the browser. Host free on GitHub Pages; data lives in `localStorage` and can be shared as a single JSON file. |
| **Fast team sync** | Export / import the full database so teammates stay aligned without a backend or SaaS subscription. |
| **Instant onboarding** | New members get auto-created logins (`FIRSTNAME` / `LastName@2026`) when added to a project — change password after first sign-in. |
| **History that lasts** | Removing someone from a project unassigns them from the active team but **keeps their past daily tasks** for audit and continuity. |
| **Project health at a glance** | KPI cards, timeline progress, status flags (On Track / Delayed / Blocked), and name-wise update feeds help PMs and leads act early. |
| **Works your way** | Light & dark mode, create-account flow, timeline editing for leads/PMs, and an audit log for management roles. |

---

## Features

- **Login & accounts** — Sign in, create account (email, name, role, designation), change password  
- **RBAC** — Scoped dashboards and projects per role  
- **Projects** — Internal / client types, wizards, team manage, timeline edit, member add/remove  
- **Daily updates** — Hours, summary, blockers, status flags, personal history  
- **Dashboards** — Management/Lead KPIs & allocation; Developer metrics-focused home  
- **Team roster** — Assignments and (for managers) live credentials view  
- **Data settings** — Export / import JSON, reset seed data, audit log viewer  
- **Theme** — Light / dark mode persisted in the browser  

---

## Quick start

1. Open `index.html` in a modern browser, **or** publish the folder to GitHub Pages.  
2. Sign in with a demo account (or create a new one).

### Demo logins

| Role | Username | Password |
|------|----------|----------|
| Admin | `ALEX` | `Rivera@2026` |
| Project Manager | `SAM` | `Patel@2026` |
| Lead | `CASEY` | `Morgan@2026` |
| Developer | `TAYLOR` | `Brooks@2026` |

Default rule for new users: **username** = first name in CAPITALS · **password** = `LastName@2026`.

---

## Project structure

```
PM_App/
├── index.html          # App shell
├── css/app.css         # Design system (light/dark)
├── js/
│   ├── config.js       # Constants
│   ├── theme.js        # Light/dark mode
│   ├── utils.js        # Helpers
│   ├── seed.js         # Mock data
│   ├── users.js        # Accounts & credentials
│   ├── store.js        # localStorage database
│   ├── auth.js         # RBAC & login
│   ├── login.js        # Auth screens
│   ├── ui.js           # Modals, toasts, navigation
│   ├── dashboard.js
│   ├── projects.js
│   ├── updates.js
│   ├── roster.js
│   ├── settings.js
│   └── app.js          # Bootstrap
└── README.md
```

---

## Data & storage

- **Key:** `workshilla_db` (JSON in `localStorage`)  
- **Session:** `workshilla_session`  
- **Theme:** `workshilla_theme`  
- **Export file:** `workshilla_export.json`  

Entities: `users`, `projects`, `daily_updates`, `audit_logs`.

---

## Tech stack

HTML5 · CSS3 · Tailwind CSS (CDN) · Vanilla JavaScript (ES6+) · localStorage  

No build step. No backend.

---

## Credits

Designed & Developed by **Prateek Dutta**  
© 2026 All copyright Reserved.
