// JARVIS-style Mission Control panel served as iframe srcDoc on /admin.
// Source of truth on the Mac:
//   /Users/ryannichols/Documents/Claude/Artifacts/faretta-mission-control/index.html
// When the artifact changes, regenerate this constant.

const COWORK_BRIDGE_SHIM = /* html */ `
<script>
(function () {
  if (window.cowork && typeof window.cowork.callMcpTool === "function") return;
  async function callMcpTool(name, args) {
    const res = await fetch("/api/admin/vercel/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name: name, args: args || {} }),
    });
    if (!res.ok) {
      const text = await res.text().catch(function () { return ""; });
      throw new Error("Proxy " + res.status + ": " + text);
    }
    return res.json();
  }
  window.cowork = { callMcpTool: callMcpTool };
})();
</script>
`;

const MISSION_CONTROL_BODY = /* html */ `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Faretta Mission Control</title>
<style>
  :root {
    --bg: #04060b;
    --panel: rgba(12, 18, 32, 0.72);
    --panel-edge: rgba(120, 200, 255, 0.18);
    --cyan: #5ee7ff;
    --cyan-dim: #6fb6cf;
    --violet: #b48cff;
    --green: #46e08a;
    --amber: #f5c45a;
    --red: #ff6473;
    --text: #d6ecff;
    --text-dim: #88a4c0;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; height: 100%;
    background:
      radial-gradient(1200px 600px at 20% -10%, rgba(94, 231, 255, 0.10), transparent 60%),
      radial-gradient(900px 500px at 110% 110%, rgba(180, 140, 255, 0.10), transparent 60%),
      var(--bg);
    color: var(--text);
    font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
  }
  header.top {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px; border-bottom: 1px solid var(--panel-edge);
    background: linear-gradient(180deg, rgba(94,231,255,0.04), rgba(0,0,0,0));
  }
  header.top h1 {
    margin: 0; font-size: 14px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--cyan);
  }
  header.top .subtitle { color: var(--text-dim); font-size: 12px; }
  nav.tabs { display: flex; gap: 6px; padding: 12px 18px 0; }
  nav.tabs button {
    background: transparent; color: var(--text-dim);
    border: 1px solid transparent;
    padding: 8px 14px; border-radius: 8px;
    font-size: 12px; letter-spacing: .08em; text-transform: uppercase;
    cursor: pointer;
  }
  nav.tabs button.active {
    color: var(--cyan); border-color: var(--panel-edge);
    background: rgba(94, 231, 255, 0.06);
    box-shadow: 0 0 0 1px rgba(94, 231, 255, 0.10) inset;
  }
  main { padding: 14px 18px 28px; }
  .panel {
    background: var(--panel); border: 1px solid var(--panel-edge); border-radius: 14px;
    padding: 18px; backdrop-filter: blur(6px);
  }
  .grid { display: grid; gap: 14px; }
  .grid.two { grid-template-columns: 1fr 1fr; }
  .grid.three { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 900px) {
    .grid.two, .grid.three { grid-template-columns: 1fr; }
  }
  h2 { margin: 0 0 8px; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: var(--cyan); }
  h3 { margin: 0 0 6px; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--violet); }
  .muted { color: var(--text-dim); font-size: 12px; }
  .row { display: flex; align-items: center; gap: 10px; }
  .pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border-radius: 999px; font-size: 11px;
    border: 1px solid var(--panel-edge); color: var(--cyan-dim);
  }
  .orb {
    width: 22px; height: 22px; border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, var(--green), #0c4a2c 70%);
    box-shadow: 0 0 16px rgba(70, 224, 138, 0.55);
    transition: background .35s ease, box-shadow .35s ease;
  }
  .orb.amber { background: radial-gradient(circle at 30% 30%, var(--amber), #5a3c00 70%); box-shadow: 0 0 16px rgba(245, 196, 90, 0.55); }
  .orb.red { background: radial-gradient(circle at 30% 30%, var(--red), #5a0010 70%); box-shadow: 0 0 16px rgba(255, 100, 115, 0.55); }
  button.action {
    background: linear-gradient(180deg, rgba(94,231,255,0.18), rgba(94,231,255,0.06));
    color: var(--cyan); border: 1px solid var(--panel-edge);
    padding: 9px 14px; border-radius: 10px; cursor: pointer;
    font-size: 12px; letter-spacing: .1em; text-transform: uppercase;
  }
  button.action:hover { background: rgba(94,231,255,0.18); }
  button.action[disabled] { opacity: .55; cursor: not-allowed; }
  ul.deploys { list-style: none; padding: 0; margin: 0; max-height: 280px; overflow: auto; }
  ul.deploys li {
    display: flex; justify-content: space-between; gap: 12px;
    padding: 8px 0; border-bottom: 1px dashed var(--panel-edge); font-size: 12px;
  }
  ul.deploys li:last-child { border-bottom: 0; }
  pre.log {
    margin: 0; padding: 10px 12px; max-height: 220px; overflow: auto;
    background: rgba(0,0,0,0.45); border: 1px solid var(--panel-edge); border-radius: 10px;
    font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: #b6e3ff;
  }
  .stat {
    border: 1px solid var(--panel-edge); border-radius: 12px; padding: 12px 14px;
    background: rgba(94,231,255,0.04);
  }
  .stat .v { font-size: 18px; color: var(--cyan); }
  .stat .l { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--text-dim); }
  .ship { padding: 8px 0; border-bottom: 1px dashed var(--panel-edge); }
  .ship:last-child { border-bottom: 0; }
  .ship .t { color: var(--cyan); }
  .ship .d { color: var(--text-dim); font-size: 11px; }
</style>
</head>
<body>

<header class="top">
  <div class="orb" id="brand-orb" aria-hidden="true"></div>
  <h1>Faretta Mission Control</h1>
  <span class="subtitle" id="now-clock">--:--</span>
</header>

<nav class="tabs" role="tablist">
  <button role="tab" data-tab="preview" class="active">Preview</button>
  <button role="tab" data-tab="deploy">Deploy</button>
  <button role="tab" data-tab="shipped">Shipped</button>
</nav>

<main>
  <!-- PREVIEW TAB -->
  <section data-panel="preview" class="grid two">
    <div class="panel">
      <h2>JARVIS Member Dashboard</h2>
      <p class="muted">Cyan + violet glass. Live mock of the member surface.</p>
      <div class="grid three" style="margin-top:10px">
        <div class="stat"><div class="v">12</div><div class="l">Active Cases</div></div>
        <div class="stat"><div class="v">3</div><div class="l">Tips Today</div></div>
        <div class="stat"><div class="v">98%</div><div class="l">Uptime 30d</div></div>
      </div>
      <div style="margin-top:14px">
        <h3>Activity Pulse</h3>
        <pre class="log" id="activity-log">[boot] mission-control online
[ok]   supabase auth ready
[ok]   vercel proxy attached</pre>
      </div>
    </div>
    <div class="panel">
      <h3>Quick Links</h3>
      <ul style="list-style:none; padding:0; margin:8px 0 0; display:flex; flex-direction:column; gap:6px;">
        <li><a class="pill" href="https://faretta.legal" target="_blank" rel="noreferrer">faretta.legal</a></li>
        <li><a class="pill" href="https://admin.faretta.legal/admin" target="_blank" rel="noreferrer">admin.faretta.legal/admin</a></li>
        <li><a class="pill" href="/account/security" target="_blank" rel="noreferrer">/account/security</a></li>
      </ul>
    </div>
  </section>

  <!-- DEPLOY TAB -->
  <section data-panel="deploy" hidden class="grid two">
    <div class="panel">
      <h2>Production Status</h2>
      <div class="row" style="gap:14px; margin-top:6px">
        <div class="orb" id="status-orb" aria-label="status orb"></div>
        <div>
          <div id="status-label">Checking…</div>
          <div class="muted" id="status-detail">faretta.legal ping pending</div>
        </div>
      </div>
      <div class="row" style="margin-top:14px; gap:10px;">
        <button id="deploy-btn" class="action">Deploy Now</button>
        <button id="refresh-btn" class="action">Refresh</button>
      </div>
      <h3 style="margin-top:18px">Live Deploy Log</h3>
      <pre class="log" id="deploy-log">idle</pre>
    </div>
    <div class="panel">
      <h2>Last 10 Deployments</h2>
      <ul class="deploys" id="deploys-list">
        <li class="muted">Loading…</li>
      </ul>
    </div>
  </section>

  <!-- SHIPPED TAB -->
  <section data-panel="shipped" hidden>
    <div class="panel">
      <h2>Shipped</h2>
      <div id="shipped-list"></div>
    </div>
  </section>
</main>

${COWORK_BRIDGE_SHIM}

<script>
(function () {
  // ---------- TASKS / SHIPPED ----------
  var TASKS = [
    { t: "Cross-subdomain auth cookies (.faretta.legal)", d: "2026-04-27" },
    { t: "Login page: add Google OAuth button on all tabs", d: "2026-04-27" },
    { t: "Account security: set/change password for OAuth users", d: "2026-04-27" },
    { t: "Mission Control iframe + Cowork bridge shim", d: "2026-04-27" },
    { t: "Vercel proxy route at /api/admin/vercel/proxy", d: "2026-04-27" }
  ];
  var shippedList = document.getElementById("shipped-list");
  shippedList.innerHTML = TASKS.map(function (x) {
    return '<div class="ship"><div class="t">' + x.t + '</div><div class="d">' + x.d + '</div></div>';
  }).join("");

  // ---------- TABS ----------
  var tabs = document.querySelectorAll('nav.tabs button');
  var panels = document.querySelectorAll('section[data-panel]');
  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      var name = b.getAttribute('data-tab');
      panels.forEach(function (p) {
        p.hidden = p.getAttribute('data-panel') !== name;
      });
    });
  });

  // ---------- CLOCK ----------
  function tickClock() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    document.getElementById('now-clock').textContent =
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  setInterval(tickClock, 1000); tickClock();

  // ---------- ORB / STATUS ----------
  var orb = document.getElementById('status-orb');
  var statusLabel = document.getElementById('status-label');
  var statusDetail = document.getElementById('status-detail');
  function setOrb(state, label, detail) {
    orb.classList.remove('amber', 'red');
    if (state === 'amber') orb.classList.add('amber');
    if (state === 'red') orb.classList.add('red');
    statusLabel.textContent = label || '';
    statusDetail.textContent = detail || '';
  }

  function fmtTime(ts) {
    if (!ts) return '';
    try { return new Date(ts).toLocaleTimeString(); } catch (e) { return ''; }
  }

  // ---------- DEPLOY LOG ----------
  var deployLog = document.getElementById('deploy-log');
  function logLine(line) {
    var stamp = new Date().toISOString().slice(11, 19);
    deployLog.textContent = '[' + stamp + '] ' + line + '\\n' + deployLog.textContent;
  }

  // ---------- LOAD DEPLOYMENTS ----------
  var deploysList = document.getElementById('deploys-list');
  async function loadDeployments() {
    try {
      var r = await window.cowork.callMcpTool('list_deployments', { limit: 10 });
      var items = (r && r.deployments) || [];
      if (!items.length) {
        deploysList.innerHTML = '<li class="muted">No deployments returned</li>';
        return;
      }
      deploysList.innerHTML = items.map(function (d) {
        var state = (d.state || d.readyState || '').toLowerCase();
        var dot = state === 'ready' ? 'green' : (state === 'error' ? 'red' : 'amber');
        var label = d.url ? d.url : (d.uid || d.id || 'deployment');
        var when = fmtTime(d.createdAt || d.created || d.ready);
        return '<li><span class="row"><span class="orb ' + (dot === 'green' ? '' : dot) + '" style="width:10px;height:10px"></span>'
          + '<a href="https://' + label + '" target="_blank" rel="noreferrer" style="color:var(--cyan)">' + label + '</a></span>'
          + '<span class="muted">' + state + ' · ' + when + '</span></li>';
      }).join('');
    } catch (e) {
      deploysList.innerHTML = '<li class="muted">Error: ' + (e && e.message ? e.message : e) + '</li>';
    }
  }

  // ---------- PING faretta.legal ----------
  async function pingSite() {
    var t0 = Date.now();
    try {
      var r = await window.cowork.callMcpTool('ping_site', { url: 'https://faretta.legal' });
      if (r && r.ok) {
        setOrb('green', 'All systems nominal', 'faretta.legal up · ' + (Date.now() - t0) + 'ms');
      } else {
        setOrb('amber', 'Site responding non-ok', 'faretta.legal status ' + (r && r.status));
      }
    } catch (e) {
      // Best-effort: a missing ping endpoint shouldn't blow up the panel.
      setOrb('amber', 'Ping unavailable', String(e && e.message || e));
    }
  }

  // ---------- DEPLOY NOW ----------
  document.getElementById('deploy-btn').addEventListener('click', async function () {
    var btn = this;
    btn.disabled = true;
    setOrb('amber', 'Deploying…', 'triggered manual production redeploy');
    logLine('deploy_to_vercel: requested');
    try {
      var res = await window.cowork.callMcpTool('deploy_to_vercel', {});
      logLine('deploy_to_vercel: queued ' + (res && (res.id || res.uid || 'ok')));
      await loadDeployments();
      setTimeout(loadDeployments, 6000);
      setTimeout(loadDeployments, 18000);
      setOrb('green', 'Deploy queued', 'monitor list for READY state');
    } catch (e) {
      logLine('deploy error: ' + (e && e.message || e));
      setOrb('red', 'Deploy failed', String(e && e.message || e));
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('refresh-btn').addEventListener('click', function () {
    loadDeployments(); pingSite();
  });

  // ---------- BOOT ----------
  loadDeployments();
  pingSite();
  setInterval(function () { loadDeployments(); pingSite(); }, 30000);
})();
</script>
</body>
</html>
`;

export const MISSION_CONTROL_HTML = MISSION_CONTROL_BODY;
