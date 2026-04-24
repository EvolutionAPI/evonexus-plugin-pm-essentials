-- PM Essentials — initial schema
-- All tables must be prefixed with pm_essentials_ (ADR-4 / Vault F8)

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
