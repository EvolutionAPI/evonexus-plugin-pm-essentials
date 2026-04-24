/**
 * PM Essentials — Sprint Burndown Widget
 *
 * Custom element: <pm-sprint-burndown>
 * Mount point:    overview
 *
 * Renders a stacked horizontal bar of task counts per status in the current
 * active sprint (todo / in_progress / review / done). Uses only the plugin's
 * declarative readonly_data endpoint — no API key, no mutation.
 *
 * Bundle format: vanilla JS. Host mounts the element via
 *   document.createElement("pm-sprint-burndown")
 * so we never assume a bundler or framework on the consumer side.
 */

const ENDPOINT = "/api/plugins/pm-essentials/readonly-data/sprint_burndown";

const STATUS_STYLES = {
  todo:        { label: "To do",       color: "#667085" },
  in_progress: { label: "In progress", color: "#00FFA7" },
  review:      { label: "Review",      color: "#8B5CF6" },
  done:        { label: "Done",        color: "#10B981" },
  cancelled:   { label: "Cancelled",   color: "#EF4444" },
};

class PmSprintBurndown extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render({ loading: true });
    this.fetchData();
  }

  async fetchData() {
    try {
      const res = await fetch(ENDPOINT, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.render({ rows: data.rows || [] });
    } catch (err) {
      this.render({ error: err.message || "Failed to load sprint data" });
    }
  }

  render({ loading = false, error = null, rows = null }) {
    const style = `
      :host {
        display: block;
        font-family: Inter, system-ui, sans-serif;
        color: #e6edf3;
      }
      .card { padding: 20px; }
      .title {
        font-size: 13px;
        font-weight: 600;
        color: #e6edf3;
        margin: 0 0 4px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .sub {
        font-size: 11px;
        color: #667085;
        margin: 0 0 14px 0;
      }
      .bar {
        display: flex;
        height: 10px;
        border-radius: 999px;
        overflow: hidden;
        background: #21262d;
      }
      .bar-segment {
        height: 100%;
      }
      .legend {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px 16px;
        margin-top: 12px;
        font-size: 11px;
      }
      .legend-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .count { color: #e6edf3; font-weight: 600; }
      .label { color: #667085; }
      .state {
        font-size: 11px;
        color: #667085;
        padding: 10px 0;
      }
      .error { color: #EF4444; }
    `;

    let body;
    if (loading) {
      body = `<div class="state">Carregando sprint…</div>`;
    } else if (error) {
      body = `<div class="state error">${error}</div>`;
    } else if (!rows || rows.length === 0) {
      body = `<div class="state">Nenhum sprint ativo no momento.</div>`;
    } else {
      const total = rows.reduce((s, r) => s + Number(r.count || 0), 0) || 1;
      const segments = rows.map((r) => {
        const meta = STATUS_STYLES[r.status] || { label: r.status, color: "#667085" };
        const pct = (Number(r.count || 0) / total) * 100;
        return `<div class="bar-segment" style="width:${pct}%;background:${meta.color}" title="${meta.label}: ${r.count}"></div>`;
      }).join("");
      const legend = rows.map((r) => {
        const meta = STATUS_STYLES[r.status] || { label: r.status, color: "#667085" };
        return `
          <div class="legend-row">
            <span class="dot" style="background:${meta.color}"></span>
            <span class="count">${r.count}</span>
            <span class="label">${meta.label}</span>
          </div>
        `;
      }).join("");
      body = `
        <div class="bar">${segments}</div>
        <div class="legend">${legend}</div>
      `;
    }

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <div class="card">
        <h3 class="title">Sprint burndown</h3>
        <p class="sub">Tasks por status no sprint ativo</p>
        ${body}
      </div>
    `;
  }
}

if (!customElements.get("pm-sprint-burndown")) {
  customElements.define("pm-sprint-burndown", PmSprintBurndown);
}
