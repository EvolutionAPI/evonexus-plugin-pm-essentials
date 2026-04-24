"""PM Essentials — Weekly Status Routine.

Generates a Markdown status report for all active projects and saves it to
workspace/development/features/pm-essentials/ (if the path exists) or prints
to stdout.

Schedule: Every Friday at 09:00 (configure via routines.yaml).
"""

from __future__ import annotations

import os
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / "dashboard" / "data" / "evonexus.db"


def _db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def run():
    now = datetime.now(tz=timezone.utc)
    report_lines = [
        f"# PM Essentials — Weekly Status",
        f"Generated: {now.strftime('%Y-%m-%d %H:%M UTC')}",
        "",
    ]

    with _db() as conn:
        projects = conn.execute(
            "SELECT id, name, status, due_date FROM pm_essentials_projects WHERE status = 'active' ORDER BY due_date ASC"
        ).fetchall()

        if not projects:
            report_lines.append("No active projects.")
        else:
            for p in projects:
                tasks = conn.execute(
                    "SELECT status, COUNT(*) AS n FROM pm_essentials_tasks WHERE project_id = ? GROUP BY status",
                    (p["id"],),
                ).fetchall()
                task_summary = {row["status"]: row["n"] for row in tasks}
                total = sum(task_summary.values())
                done = task_summary.get("done", 0)
                pct = int(done / total * 100) if total else 0

                report_lines += [
                    f"## {p['name']}",
                    f"- Due: {p['due_date'] or 'TBD'}",
                    f"- Progress: {done}/{total} tasks done ({pct}%)",
                    f"- Todo: {task_summary.get('todo', 0)} | In Progress: {task_summary.get('in_progress', 0)} | Review: {task_summary.get('review', 0)}",
                    "",
                ]

    print("\n".join(report_lines))


if __name__ == "__main__":
    run()
