-- PM Essentials — teardown
--
-- Ran by the EvoNexus installer on DELETE /api/plugins/pm-essentials.
-- Must drop every table the install.sql created. Foreign keys cascade,
-- so dropping projects first would be fine too — we drop dependents
-- first for clarity and to make the order explicit.

DROP TABLE IF EXISTS pm_essentials_tasks;
DROP TABLE IF EXISTS pm_essentials_sprints;
DROP TABLE IF EXISTS pm_essentials_projects;
