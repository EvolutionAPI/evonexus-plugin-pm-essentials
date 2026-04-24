/**
 * PM Essentials — Projects Page
 *
 * Custom element: <pm-projects-page>
 * Route:         /plugins-ui/pm-essentials/projects
 *
 * Full CRUD for pm_essentials_projects via the writable_data endpoint.
 * List rendered from readonly-data/open_projects.
 * No bundler, no framework. Shadow DOM, vanilla JS.
 */

const SLUG = "pm-essentials";
const READONLY_ENDPOINT = "/api/plugins/" + SLUG + "/readonly-data/open_projects";
const WRITABLE_ENDPOINT = "/api/plugins/" + SLUG + "/data/projects";
const NAVIGATE = (to) => {
  if (window.EvoNexus && window.EvoNexus.navigate) window.EvoNexus.navigate(to);
  else window.location.href = to;
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
  .page { padding: 32px; max-width: 1100px; margin: 0 auto; }
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .page-title {
    font-size: 22px;
    font-weight: 700;
    color: #e6edf3;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .page-title .dot { width: 8px; height: 8px; border-radius: 50%; background: #00FFA7; }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s;
  }
  .btn:hover { opacity: 0.85; }
  .btn-primary { background: #00FFA7; color: #0a0f1a; }
  .btn-secondary { background: #21262d; color: #d0d5dd; border: 1px solid #344054; }
  .btn-danger { background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th {
    text-align: left;
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #667085;
    border-bottom: 1px solid #21262d;
  }
  td {
    padding: 12px 14px;
    border-bottom: 1px solid #161b22;
    color: #d0d5dd;
    vertical-align: middle;
  }
  tr:hover td { background: rgba(255,255,255,0.02); }
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11px;
    background: #21262d;
    color: #667085;
  }
  .status-badge.active { background: rgba(0,255,167,0.1); color: #00FFA7; }
  .status-badge.on_hold { background: rgba(251,191,36,0.1); color: #fbbf24; }
  .status-badge.completed { background: rgba(52,211,153,0.1); color: #34d399; }
  .due { font-size: 12px; color: #667085; }
  .due.overdue { color: #f87171; }
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 16px;
    padding: 28px;
    width: 400px;
    max-width: 95vw;
  }
  .modal-title { font-size: 16px; font-weight: 600; margin-bottom: 20px; color: #e6edf3; }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 12px; color: #667085; margin-bottom: 6px; }
  .field input, .field select {
    width: 100%;
    box-sizing: border-box;
    background: #0a0f1a;
    border: 1px solid #344054;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: #e6edf3;
    outline: none;
  }
  .field input:focus, .field select:focus { border-color: #00FFA7; }
  .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
  .err-msg { font-size: 12px; color: #f87171; margin-top: 8px; }
  .loading { color: #5a6b7f; font-size: 13px; padding: 20px 0; }
`;

class PmProjectsPage extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: "open" });
    this._projects = [];
    this._loading = true;
    this._error = null;
    this._showModal = false;
    this._editRow = null;
    this._formErr = null;
  }

  connectedCallback() {
    this._render();
    this._fetchProjects();
  }

  async _fetchProjects() {
    this._loading = true;
    this._render();
    try {
      const res = await fetch(READONLY_ENDPOINT, { credentials: "include" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      this._projects = Array.isArray(data.rows) ? data.rows : [];
      this._error = null;
    } catch (e) {
      this._error = e.message;
    }
    this._loading = false;
    this._render();
  }

  _formatDate(str) {
    if (!str) return "";
    // Parse YYYY-MM-DD as a local date (new Date("2025-01-01") would be UTC
    // and render in the prior day for negative timezones).
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
    if (!m) return str;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    try { return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return str; }
  }

  _isOverdue(str) {
    if (!str) return false;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
    if (!m) return false;
    const due = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return due < today;
  }

  _statusBadge(s) {
    const cls = ["active", "on_hold", "completed"].includes(s) ? s : "";
    return `<span class="status-badge ${cls}">${s || "unknown"}</span>`;
  }

  async _save(form) {
    const name = form.querySelector("#pm-proj-name").value.trim();
    const status = form.querySelector("#pm-proj-status").value;
    const due_date = form.querySelector("#pm-proj-due").value || null;
    if (!name) { this._formErr = "Name is required"; this._render(); return; }
    this._formErr = null;

    const isEdit = !!this._editRow;
    const method = isEdit ? "PUT" : "POST";
    const body = isEdit
      ? { id: this._editRow.id, name, status, due_date }
      : { name, status, due_date };

    try {
      const res = await fetch(WRITABLE_ENDPOINT, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "HTTP " + res.status);
      }
      this._showModal = false;
      this._editRow = null;
      await this._fetchProjects();
    } catch (e) {
      this._formErr = e.message;
      this._render();
    }
  }

  async _delete(id) {
    if (!confirm("Delete this project?")) return;
    try {
      const res = await fetch(WRITABLE_ENDPOINT + "?id=" + id, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      await this._fetchProjects();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  }

  _openCreate() {
    this._showModal = true;
    this._editRow = null;
    this._formErr = null;
    this._render();
  }

  _openEdit(row) {
    this._showModal = true;
    this._editRow = row;
    this._formErr = null;
    this._render();
  }

  _closeModal() {
    this._showModal = false;
    this._editRow = null;
    this._formErr = null;
    this._render();
  }

  _render() {
    let tableContent = "";
    if (this._loading) {
      tableContent = `<p class="loading">Loading projects…</p>`;
    } else if (this._error) {
      tableContent = `<p style="color:#f87171;font-size:12px;">Error: ${this._error}</p>`;
    } else if (this._projects.length === 0) {
      tableContent = `<p style="color:#667085;font-size:13px;padding:20px 0;">No active projects. Create one!</p>`;
    } else {
      tableContent = `
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Tasks</th>
              <th>Due</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${this._projects.map((p) => `
              <tr>
                <td>${p.name}</td>
                <td>${this._statusBadge(p.status)}</td>
                <td>${p.task_count}</td>
                <td class="due ${this._isOverdue(p.due_date) ? "overdue" : ""}">${this._formatDate(p.due_date)}</td>
                <td style="text-align:right;">
                  <button class="btn btn-secondary btn-edit" data-id="${p.id}" data-name="${p.name}" data-status="${p.status}" data-due="${p.due_date || ""}" style="padding:5px 10px;font-size:12px;margin-right:4px;">Edit</button>
                  <button class="btn btn-danger btn-del" data-id="${p.id}" style="padding:5px 10px;font-size:12px;">Delete</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    const modal = this._showModal ? `
      <div class="modal-backdrop" id="pm-backdrop">
        <div class="modal">
          <div class="modal-title">${this._editRow ? "Edit Project" : "New Project"}</div>
          <div class="field">
            <label>Name</label>
            <input id="pm-proj-name" type="text" value="${this._editRow ? this._editRow.name : ""}" placeholder="Project name" />
          </div>
          <div class="field">
            <label>Status</label>
            <select id="pm-proj-status">
              ${["active", "on_hold", "completed"].map((s) =>
                `<option value="${s}" ${this._editRow && this._editRow.status === s ? "selected" : ""}>${s}</option>`
              ).join("")}
            </select>
          </div>
          <div class="field">
            <label>Due Date</label>
            <input id="pm-proj-due" type="date" value="${this._editRow && this._editRow.due_date ? this._editRow.due_date.split("T")[0] : ""}" />
          </div>
          ${this._formErr ? `<div class="err-msg">${this._formErr}</div>` : ""}
          <div class="modal-actions">
            <button class="btn btn-secondary" id="pm-modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="pm-modal-save">Save</button>
          </div>
        </div>
      </div>
    ` : "";

    this._shadow.innerHTML = `
      <style>${PAGE_STYLE}</style>
      <div class="page">
        <div class="page-header">
          <div class="page-title"><div class="dot"></div>Projects</div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" data-nav="/plugins-ui/pm-essentials/company">Overview</button>
            <button class="btn btn-secondary" data-nav="/plugins-ui/pm-essentials/kanban">Kanban</button>
            <button class="btn btn-primary" id="pm-create-btn">+ New Project</button>
          </div>
        </div>
        ${tableContent}
      </div>
      ${modal}
    `;

    this._shadow.querySelector("#pm-create-btn")?.addEventListener("click", () => this._openCreate());
    this._shadow.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => NAVIGATE(btn.dataset.nav));
    });
    this._shadow.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => this._openEdit({
        id: btn.dataset.id,
        name: btn.dataset.name,
        status: btn.dataset.status,
        due_date: btn.dataset.due || null,
      }));
    });
    this._shadow.querySelectorAll(".btn-del").forEach((btn) => {
      btn.addEventListener("click", () => this._delete(btn.dataset.id));
    });

    const modal_el = this._shadow.getElementById("pm-backdrop");
    if (modal_el) {
      modal_el.addEventListener("click", (e) => { if (e.target === modal_el) this._closeModal(); });
    }
    this._shadow.getElementById("pm-modal-cancel")?.addEventListener("click", () => this._closeModal());
    this._shadow.getElementById("pm-modal-save")?.addEventListener("click", () => {
      this._save(this._shadow);
    });
  }
}

customElements.define("pm-projects-page", PmProjectsPage);
