/**
 * PM Essentials — Open Projects Widget
 *
 * Custom element: <pm-open-projects>
 * Mount point:    overview
 *
 * Fetches active projects from the plugin's readonly-data endpoint and renders
 * a compact list with task counts and due dates.  Styled for the EvoNexus dark
 * theme (no external CSS dependencies).
 *
 * Bundle format: vanilla JS — no bundler, no framework.  Loaded by
 * PluginWidgetsGrid via dynamic import() at runtime.
 */

const ENDPOINT = "/api/plugins/pm-essentials/readonly-data/open_projects";

const STYLE = `
  :host {
    display: block;
    font-family: Inter, -apple-system, sans-serif;
    color: #e6edf3;
  }
  .widget {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 16px;
    padding: 20px;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba(0,255,167,0.08);
    border: 1px solid rgba(0,255,167,0.15);
    color: #00FFA7;
    font-size: 14px;
  }
  .title {
    font-size: 14px;
    font-weight: 600;
    color: #e6edf3;
  }
  .empty {
    color: #667085;
    font-size: 13px;
    text-align: center;
    padding: 16px 0;
  }
  .error {
    color: #f87171;
    font-size: 12px;
    padding: 8px 0;
  }
  .project-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #21262d;
  }
  .project-row:last-child {
    border-bottom: none;
  }
  .project-name {
    font-size: 13px;
    font-weight: 500;
    color: #e6edf3;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .task-badge {
    font-size: 11px;
    background: #21262d;
    color: #667085;
    padding: 2px 7px;
    border-radius: 20px;
  }
  .due {
    font-size: 11px;
    color: #667085;
  }
  .due.overdue {
    color: #f87171;
  }
  .loading {
    color: #667085;
    font-size: 13px;
    padding: 12px 0;
  }
`;

class PmOpenProjects extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._render({ loading: true });
    this._fetch();
  }

  async _fetch() {
    try {
      const res = await fetch(ENDPOINT, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      const rows = Array.isArray(data.rows) ? data.rows : [];
      this._render({ rows });
    } catch (err) {
      this._render({ error: err.message });
    }
  }

  _isOverdue(dueDateStr) {
    if (!dueDateStr) return false;
    return new Date(dueDateStr) < new Date();
  }

  _formatDate(str) {
    if (!str) return "";
    try {
      return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return str;
    }
  }

  _render({ loading = false, error = null, rows = [] } = {}) {
    let body = "";

    if (loading) {
      body = `<p class="loading">Loading projects…</p>`;
    } else if (error) {
      body = `<p class="error">Error: ${error}</p>`;
    } else if (rows.length === 0) {
      body = `<p class="empty">No active projects</p>`;
    } else {
      body = rows
        .map((p) => {
          const overdue = this._isOverdue(p.due_date) ? "overdue" : "";
          const dueStr = this._formatDate(p.due_date);
          return `
            <div class="project-row">
              <span class="project-name" title="${p.name}">${p.name}</span>
              <span class="meta">
                <span class="task-badge">${p.task_count} task${p.task_count !== 1 ? "s" : ""}</span>
                ${dueStr ? `<span class="due ${overdue}">${dueStr}</span>` : ""}
              </span>
            </div>
          `;
        })
        .join("");
    }

    this._shadow.innerHTML = `
      <style>${STYLE}</style>
      <div class="widget">
        <div class="header">
          <div class="icon">P</div>
          <span class="title">Open Projects</span>
        </div>
        ${body}
      </div>
    `;
  }
}

customElements.define("pm-open-projects", PmOpenProjects);
