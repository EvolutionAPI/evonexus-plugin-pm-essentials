/**
 * PM Essentials — Reports Page
 *
 * Custom element: <pm-reports-page>
 * Route:         /plugins-ui/pm-essentials/reports
 *
 * Sprint burndown data rendered as:
 *   - HTML table (primary — no external deps, works with CSP)
 *   - ASCII bar chart using <canvas> for visual representation
 *
 * No bundler, no CDN, no recharts (CSP blocks external CDN; recharts is
 * not available to plugin bundles in same-scope mode without bundler).
 * Canvas bar chart uses 2D context only. Shadow DOM, vanilla JS.
 */

const SLUG = "pm-essentials";
const BURNDOWN_ENDPOINT = "/api/plugins/" + SLUG + "/readonly-data/sprint_burndown";
const NAVIGATE = (to) => {
  if (window.EvoNexus && window.EvoNexus.navigate) window.EvoNexus.navigate(to);
  else window.location.href = to;
};

const STATUS_COLOR = {
  todo:        "#667085",
  in_progress: "#fbbf24",
  review:      "#60a5fa",
  done:        "#34d399",
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
  .page { padding: 32px; max-width: 900px; margin: 0 auto; }
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
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid #344054;
    background: transparent;
    color: #d0d5dd;
    transition: border-color 0.15s, color 0.15s;
  }
  .btn:hover { border-color: #00FFA7; color: #00FFA7; }
  .card {
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }
  .card-title {
    font-size: 14px;
    font-weight: 600;
    color: #d0d5dd;
    margin-bottom: 16px;
  }
  canvas { display: block; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th {
    text-align: left;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #667085;
    border-bottom: 1px solid #21262d;
  }
  td { padding: 10px 12px; border-bottom: 1px solid #161b22; color: #d0d5dd; }
  tr:hover td { background: rgba(255,255,255,0.02); }
  .status-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; }
  .count { font-weight: 600; }
  .pct { font-size: 11px; color: #5a6b7f; }
  .loading { color: #5a6b7f; font-size: 13px; padding: 20px 0; }
  .error-msg { color: #f87171; font-size: 12px; }
`;

class PmReportsPage extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: "open" });
    this._rows = [];
    this._loading = true;
    this._error = null;
  }

  connectedCallback() {
    this._render();
    this._fetchData();
  }

  async _fetchData() {
    this._loading = true;
    this._render();
    try {
      const res = await fetch(BURNDOWN_ENDPOINT, { credentials: "include" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      this._rows = Array.isArray(data.rows) ? data.rows : [];
      this._error = null;
    } catch (e) {
      this._error = e.message;
    }
    this._loading = false;
    this._render();
    if (!this._loading && !this._error) this._drawChart();
  }

  _drawChart() {
    const canvas = this._shadow.querySelector("#pm-burndown-chart");
    if (!canvas || this._rows.length === 0) return;

    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 16, right: 20, bottom: 32, left: 44 };
    const total = this._rows.reduce((s, r) => s + (r.count || 0), 0);
    const maxVal = Math.max(...this._rows.map((r) => r.count || 0), 1);

    ctx.clearRect(0, 0, W, H);

    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    const barW = Math.floor(chartW / this._rows.length) - 12;

    // Background grid lines
    ctx.strokeStyle = "#21262d";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + chartH - (chartH * i / 4);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(W - PAD.right, y);
      ctx.stroke();
      ctx.fillStyle = "#667085";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(Math.round(maxVal * i / 4)), PAD.left - 6, y + 3);
    }

    // Bars
    this._rows.forEach((row, i) => {
      const color = STATUS_COLOR[row.status] || "#667085";
      const barH = chartH * (row.count / maxVal);
      const x = PAD.left + i * (chartW / this._rows.length) + 6;
      const y = PAD.top + chartH - barH;

      ctx.fillStyle = color + "33"; // translucent fill
      ctx.fillRect(x, y, barW, barH);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barW, barH);

      // Count label on top of bar
      ctx.fillStyle = color;
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(row.count), x + barW / 2, y - 4);

      // Status label on x-axis
      ctx.fillStyle = "#667085";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(row.status.replace("_", " "), x + barW / 2, H - 8);
    });

    // Total annotation
    ctx.fillStyle = "#5a6b7f";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Total: ${total} tasks`, PAD.left, PAD.top - 2);
  }

  _render() {
    let content = "";
    if (this._loading) {
      content = `<p class="loading">Loading burndown data…</p>`;
    } else if (this._error) {
      content = `<p class="error-msg">Error: ${this._error}</p>`;
    } else if (this._rows.length === 0) {
      content = `<p style="color:#667085;font-size:13px;">No active sprint data.</p>`;
    } else {
      const total = this._rows.reduce((s, r) => s + (r.count || 0), 0);
      content = `
        <div class="card">
          <div class="card-title">Sprint Burndown — Active Sprint</div>
          <canvas id="pm-burndown-chart" width="760" height="220" style="max-width:100%;border-radius:8px;background:#0d1117;"></canvas>
        </div>
        <div class="card">
          <div class="card-title">Task Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Count</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              ${this._rows.map((row) => `
                <tr>
                  <td>
                    <span class="status-label">
                      <span class="status-dot" style="background:${STATUS_COLOR[row.status] || "#667085"}"></span>
                      ${row.status}
                    </span>
                  </td>
                  <td><span class="count">${row.count}</span></td>
                  <td><span class="pct">${total > 0 ? Math.round(row.count / total * 100) : 0}%</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    this._shadow.innerHTML = `
      <style>${PAGE_STYLE}</style>
      <div class="page">
        <div class="page-header">
          <div class="page-title"><div class="dot"></div>Reports</div>
          <div style="display:flex;gap:8px;">
            <button class="btn" data-nav="/plugins-ui/pm-essentials/company">Overview</button>
            <button class="btn" data-nav="/plugins-ui/pm-essentials/projects">Projects</button>
            <button class="btn" data-nav="/plugins-ui/pm-essentials/kanban">Kanban</button>
          </div>
        </div>
        ${content}
      </div>
    `;

    this._shadow.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => NAVIGATE(btn.dataset.nav));
    });

    if (!this._loading && !this._error) this._drawChart();
  }
}

customElements.define("pm-reports-page", PmReportsPage);
