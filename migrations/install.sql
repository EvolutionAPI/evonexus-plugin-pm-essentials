-- PM Essentials — initial schema + seed data
--
-- EvoNexus v1a plugin contract: the installer runs `migrations/install.sql`
-- inside a transaction (BEGIN IMMEDIATE ... COMMIT). Any error rolls back.
-- ALL tables must be prefixed with the plugin slug — `pm_essentials_` —
-- so uninstall can drop them safely and readonly_data queries can be
-- validated against the slug namespace (ADR-4, Vault F8).

CREATE TABLE IF NOT EXISTS pm_essentials_projects (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    name        TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'completed', 'archived', 'on_hold')),
    due_date    TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS pm_essentials_sprints (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    project_id  TEXT REFERENCES pm_essentials_projects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'planned'
                     CHECK (status IN ('planned', 'active', 'completed')),
    goal        TEXT,
    started_at  TEXT,
    ended_at    TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS pm_essentials_tasks (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
    project_id  TEXT NOT NULL REFERENCES pm_essentials_projects(id) ON DELETE CASCADE,
    sprint_id   TEXT REFERENCES pm_essentials_sprints(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'todo'
                     CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
    priority    TEXT NOT NULL DEFAULT 'medium'
                     CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    assignee    TEXT,
    due_date    TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_pm_essentials_tasks_project
    ON pm_essentials_tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_pm_essentials_tasks_sprint
    ON pm_essentials_tasks(sprint_id);

CREATE INDEX IF NOT EXISTS idx_pm_essentials_projects_status
    ON pm_essentials_projects(status);

-- ---------------------------------------------------------------------------
-- Seed data — three realistic projects, one active sprint, eight tasks.
-- Gives the widgets something to render and the agent something to reason
-- about on first install. INSERT OR IGNORE keeps install.sql idempotent if
-- the author re-runs it against an existing DB.
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO pm_essentials_projects (id, name, description, status, due_date) VALUES
    ('seed-billing',    'Billing v2',          'Revamp checkout and invoice flows',   'active',  '2026-06-30'),
    ('seed-onboarding', 'Onboarding Redesign', 'Cut drop-off in first-run setup',     'active',  '2026-05-15'),
    ('seed-docs',       'Docs Portal',         'Unified public documentation portal', 'on_hold', '2026-07-31');

INSERT OR IGNORE INTO pm_essentials_sprints (id, project_id, name, status, goal, started_at) VALUES
    ('seed-sprint-1', 'seed-billing', 'Sprint 1 — Checkout core', 'active',
     'Ship v2 checkout to 10% of customers with full instrumentation',
     strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days'));

INSERT OR IGNORE INTO pm_essentials_tasks
    (id, project_id, sprint_id, title, status, priority, assignee) VALUES
    ('seed-task-1', 'seed-billing',    'seed-sprint-1', 'Wire new Stripe price IDs',    'done',        'high',   'davidson'),
    ('seed-task-2', 'seed-billing',    'seed-sprint-1', 'Checkout page redesign',       'in_progress', 'high',   'gui'),
    ('seed-task-3', 'seed-billing',    'seed-sprint-1', 'Server-side idempotency keys', 'in_progress', 'urgent', 'nick'),
    ('seed-task-4', 'seed-billing',    'seed-sprint-1', 'Webhook retry logic',          'review',      'medium', 'davidson'),
    ('seed-task-5', 'seed-billing',    'seed-sprint-1', 'Analytics funnel events',      'todo',        'medium', 'danilo'),
    ('seed-task-6', 'seed-billing',    'seed-sprint-1', 'Feature flag for 10% rollout', 'todo',        'high',   'nick'),
    ('seed-task-7', 'seed-onboarding', NULL,            'First-run checklist copy',     'todo',        'low',    NULL),
    ('seed-task-8', 'seed-onboarding', NULL,            'Replace tour library',         'todo',        'medium', 'gui');
