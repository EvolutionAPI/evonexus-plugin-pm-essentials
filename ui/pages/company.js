/**
 * PM Essentials — Company Overview Page
 *
 * Custom element: <pm-company-page>
 * Route:         /plugins-ui/pm-essentials/company
 *
 * Full-screen page displaying active projects summary and sprint status.
 * Fetches from readonly-data endpoints. No bundler, no framework.
 * Shadow DOM mode: open (same as widgets — bundle runs in main window scope).
 */

const SLUG = "pm-essentials";
const API_BASE = "/api/plugins/" + SLUG;
const NAVIGATE = (to) => {
  if (window.EvoNexus && window.EvoNexus.navigate) {
    window.EvoNexus.navigate(to);
  } else {
    window.location.href = to;
  }
};

const PAGE_STYLE = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    font-family: Inter, -apple-system, sans-serif;
    color: #e6edf3;
    background: transparent;
  }
  .page {
    padding: 32px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }
  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: #e6edf3;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .page-title .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00FFA7;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  .card {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 16px;
    padding: 20px;
  }
  .stat-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #667085;
    margin-bottom: 8px;
  }
  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #00FFA7;
  }
  .stat-sub {
    font-size: 12px;
    color: #5a6b7f;
    margin-top: 4px;
  }
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #d0d5dd;
    margin-bottom: 12px;
  }
  .project-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .project-item {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .project-item:hover {
    border-color: #00FFA7;
    background: rgba(0,255,167,0.04);
  }
  .project-name {
    font-size: 14px;
    font-weight: 500;
    color: #e6edf3;
  }
  .project-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 20px;
    background: #21262d;
    color: #667085;
  }
  .badge.active {
    background: rgba(0,255,167,0.1);
    color: #00FFA7;
  }
  .due {
    font-size: 11px;
    color: #667085;
  }
  .due.overdue {
    color: #f87171;
  }
  .loading {
    color: #5a6b7f;
    font-size: 13px;
    padding: 20px 0;
  }
  .error {
    color: #f87171;
    font-size: 12px;
  }
  .nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid #344054;
    background: transparent;
    color: #d0d5dd;
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .nav-btn:hover {
    border-color: #00FFA7;
    color: #00FFA7;
  }
`;

class PmCompanyPage extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: "open" });
    this._projects = [];
    this._loading = true;
    this._error = null;
  }

  connectedCallback() {
    this._render();
    this._fetchData();
  }

  async _fetchData() {
    try {
      const res = await fetch(API_BASE + "/readonly-data/open_projects", { credentials: "include" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      this._projects = Array.isArray(data.rows) ? data.rows : [];
      this._loading = false;
    } catch (err) {
      this._error = err.message;
      this._loading = false;
    }
    this._render();
  }

  _formatDate(str) {
    if (!str) return "";
    try { return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return str; }
  }

  _isOverdue(str) {
    return str && new Date(str) < new Date();
  }

  _render() {
    const projects = this._projects;
    const totalTasks = projects.reduce((s, p) => s + (p.task_count || 0), 0);

    let content = "";
    if (this._loading) {
      content = `<p class="loading">Loading company overview…</p>`;
    } else if (this._error) {
      content = `<p class="error">Error: ${this._error}</p>`;
    } else {
      content = `
        <div class="grid">
          <div class="card">
            <div class="stat-label">Active Projects</div>
            <div class="stat-value">${projects.length}</div>
            <div class="stat-sub">Currently in flight</div>
          </div>
          <div class="card">
            <div class="stat-label">Open Tasks</div>
            <div class="stat-value">${totalTasks}</div>
            <div class="stat-sub">Across all projects</div>
          </div>
        </div>
        <div class="section-title">Active Projects</div>
        <div class="project-list">
          ${projects.length === 0
            ? '<p style="color:#667085;font-size:13px;">No active projects</p>'
            : projects.map((p) => `
              <div class="project-item" data-slug="pm-essentials" data-id="${p.id}">
                <span class="project-name">${p.name}</span>
                <span class="project-meta">
                  <span class="badge">${p.task_count} task${p.task_count !== 1 ? "s" : ""}</span>
                  ${p.due_date
                    ? `<span class="due ${this._isOverdue(p.due_date) ? "overdue" : ""}">${this._formatDate(p.due_date)}</span>`
                    : ""}
                </span>
              </div>
            `).join("")
          }
        </div>
      `;
    }

    this._shadow.innerHTML = `
      <style>${PAGE_STYLE}</style>
      <div class="page">
        <div class="page-header">
          <div class="page-title">
            <div class="dot"></div>
            Company Overview
          </div>
          <div style="display:flex;gap:8px;">
            <button class="nav-btn" data-nav="/plugins-ui/pm-essentials/projects">Projects</button>
            <button class="nav-btn" data-nav="/plugins-ui/pm-essentials/kanban">Kanban</button>
            <button class="nav-btn" data-nav="/plugins-ui/pm-essentials/reports">Reports</button>
          </div>
        </div>
        ${content}
      </div>
    `;

    this._shadow.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => NAVIGATE(btn.dataset.nav));
    });
  }
}

customElements.define("pm-company-page", PmCompanyPage);
