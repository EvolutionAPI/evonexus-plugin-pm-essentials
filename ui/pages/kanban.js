/**
 * PM Essentials — Kanban Page
 *
 * Custom element: <pm-kanban-page>
 * Route:         /plugins-ui/pm-essentials/kanban
 *
 * Kanban board for sprint tasks. Columns: todo / in_progress / review / done.
 * Drag-and-drop: HTML5 native only (draggable + ondragstart + ondrop).
 * Status updates via writable_data endpoint (PUT).
 * No bundler, no CDN libs. Shadow DOM, vanilla JS.
 */

const SLUG = "pm-essentials";
const SPRINT_TASKS_ENDPOINT = "/api/plugins/" + SLUG + "/readonly-data/sprint_tasks";
const WRITABLE_TASKS_ENDPOINT = "/api/plugins/" + SLUG + "/data/tasks";
const NAVIGATE = (to) => {
  if (window.EvoNexus && window.EvoNexus.navigate) window.EvoNexus.navigate(to);
  else window.location.href = to;
};

const COLUMNS = [
  { key: "todo",        label: "To Do",       color: "#667085" },
  { key: "in_progress", label: "In Progress",  color: "#fbbf24" },
  { key: "review",      label: "Review",       color: "#60a5fa" },
  { key: "done",        label: "Done",         color: "#34d399" },
];

const PRIORITY_COLOR = {
  urgent: "#f87171",
  high:   "#fb923c",
  medium: "#fbbf24",
  low:    "#667085",
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
    padding: 24px 32px;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-shrink: 0;
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
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #344054;
    background: transparent;
    color: #d0d5dd;
    transition: border-color 0.15s, color 0.15s;
  }
  .btn:hover { border-color: #00FFA7; color: #00FFA7; }
  .board {
    display: flex;
    gap: 16px;
    flex: 1;
    overflow-x: auto;
    padding-bottom: 8px;
  }
  .column {
    flex: 1;
    min-width: 220px;
    max-width: 300px;
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .column.drag-over {
    border-color: #00FFA7;
    background: rgba(0,255,167,0.03);
  }
  .col-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .col-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .col-count {
    font-size: 11px;
    background: #21262d;
    color: #667085;
    padding: 2px 7px;
    border-radius: 20px;
  }
  .card {
    background: #0d1117;
    border: 1px solid #21262d;
    border-radius: 10px;
    padding: 12px;
    cursor: grab;
    transition: border-color 0.15s, box-shadow 0.15s;
    user-select: none;
  }
  .card:hover {
    border-color: #30363d;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .card.dragging {
    opacity: 0.4;
    cursor: grabbing;
  }
  .card-title {
    font-size: 13px;
    font-weight: 500;
    color: #e6edf3;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  .card-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .priority-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .assignee {
    font-size: 11px;
    color: #5a6b7f;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
  }
  .project-tag {
    font-size: 10px;
    background: #21262d;
    color: #667085;
    padding: 1px 6px;
    border-radius: 20px;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .empty-col {
    font-size: 12px;
    color: #344054;
    text-align: center;
    padding: 20px 0;
    border: 2px dashed #21262d;
    border-radius: 8px;
  }
  .loading { color: #5a6b7f; font-size: 13px; padding: 20px 0; }
  .error-msg { color: #f87171; font-size: 12px; }
`;

class PmKanbanPage extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: "open" });
    this._tasks = [];
    this._loading = true;
    this._error = null;
    this._draggingId = null;
  }

  connectedCallback() {
    this._render();
    this._fetchTasks();
  }

  async _fetchTasks() {
    this._loading = true;
    this._render();
    try {
      const res = await fetch(SPRINT_TASKS_ENDPOINT, { credentials: "include" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      this._tasks = Array.isArray(data.rows) ? data.rows : [];
      this._error = null;
    } catch (e) {
      this._error = e.message;
    }
    this._loading = false;
    this._render();
  }

  async _moveTask(taskId, newStatus) {
    // Optimistic update
    const task = this._tasks.find((t) => String(t.id) === String(taskId));
    if (!task || task.status === newStatus) return;
    const prevStatus = task.status;
    task.status = newStatus;
    this._render();

    try {
      const res = await fetch(WRITABLE_TASKS_ENDPOINT, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });
      if (!res.ok) {
        task.status = prevStatus; // rollback
        this._render();
      }
    } catch {
      task.status = prevStatus;
      this._render();
    }
  }

  _renderBoard() {
    if (this._loading) return `<p class="loading">Loading sprint tasks…</p>`;
    if (this._error) return `<p class="error-msg">Error: ${this._error}</p>`;

    return `<div class="board">
      ${COLUMNS.map((col) => {
        const colTasks = this._tasks.filter((t) => t.status === col.key);
        return `
          <div class="column" data-col="${col.key}">
            <div class="col-header">
              <span class="col-label" style="color:${col.color}">${col.label}</span>
              <span class="col-count">${colTasks.length}</span>
            </div>
            ${colTasks.length === 0
              ? `<div class="empty-col">Drop here</div>`
              : colTasks.map((t) => `
                <div class="card" draggable="true" data-task-id="${t.id}">
                  <div class="card-title">${t.title}</div>
                  <div class="card-meta">
                    <div class="priority-dot" style="background:${PRIORITY_COLOR[t.priority] || "#667085"}" title="${t.priority || "low"}"></div>
                    ${t.assignee ? `<span class="assignee">${t.assignee}</span>` : ""}
                    ${t.project_name ? `<span class="project-tag">${t.project_name}</span>` : ""}
                  </div>
                </div>
              `).join("")
            }
          </div>
        `;
      }).join("")}
    </div>`;
  }

  _render() {
    this._shadow.innerHTML = `
      <style>${PAGE_STYLE}</style>
      <div class="page">
        <div class="page-header">
          <div class="page-title"><div class="dot"></div>Sprint Kanban</div>
          <div style="display:flex;gap:8px;">
            <button class="btn" data-nav="/plugins-ui/pm-essentials/company">Overview</button>
            <button class="btn" data-nav="/plugins-ui/pm-essentials/projects">Projects</button>
            <button class="btn" data-nav="/plugins-ui/pm-essentials/reports">Reports</button>
          </div>
        </div>
        ${this._renderBoard()}
      </div>
    `;

    this._shadow.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => NAVIGATE(btn.dataset.nav));
    });

    // HTML5 drag-and-drop wiring
    this._shadow.querySelectorAll(".card[draggable]").forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        this._draggingId = card.dataset.taskId;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", this._draggingId);
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        this._shadow.querySelectorAll(".column").forEach((c) => c.classList.remove("drag-over"));
      });
    });

    this._shadow.querySelectorAll(".column").forEach((col) => {
      col.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        col.classList.add("drag-over");
      });
      col.addEventListener("dragleave", (e) => {
        if (!col.contains(e.relatedTarget)) col.classList.remove("drag-over");
      });
      col.addEventListener("drop", (e) => {
        e.preventDefault();
        col.classList.remove("drag-over");
        const taskId = e.dataTransfer.getData("text/plain") || this._draggingId;
        const newStatus = col.dataset.col;
        if (taskId && newStatus) this._moveTask(taskId, newStatus);
      });
    });
  }
}

customElements.define("pm-kanban-page", PmKanbanPage);
