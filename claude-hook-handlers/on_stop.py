"""PM Essentials — Stop hook handler.

Called when Claude finishes a session (PostToolUse → Stop event).
Saves any task updates the agent made during the session to the audit log.

Handler contract: receives hook event JSON on stdin, exits 0 on success.
"""

from __future__ import annotations

import json
import sys


def main() -> None:
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        # No input or malformed — exit cleanly (non-blocking)
        sys.exit(0)

    # Log the stop event for observability
    session_id = event.get("session_id", "unknown")
    agent = event.get("agent_slug", "unknown")

    # In a real implementation, you could write to pm_essentials audit table here.
    # For now we just log to stderr (captured by EvoNexus heartbeat runner).
    print(
        json.dumps({
            "hook": "Stop",
            "plugin": "pm-essentials",
            "session_id": session_id,
            "agent": agent,
        }),
        file=sys.stderr,
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
