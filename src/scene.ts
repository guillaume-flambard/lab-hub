import { fetchState, subscribe, type WorkerActivity, type WorkerState } from "./activity";

type ProjectNode = { name: string; live: boolean; x: number; y: number };

// positions des nodes sur une constellation (grille topo inspirée Stitch)
function layout(names: string[], live: Set<string>): ProjectNode[] {
  const n = names.length;
  const CX = 500, CY = 280, RX = 380, RY = 170;
  return names.map((name, i) => {
    const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    return {
      name,
      live: live.has(name),
      x: Math.round(CX + RX * Math.cos(angle) + (Math.sin(i * 7) - 0.5) * 80),
      y: Math.round(CY + RY * Math.sin(angle) * 0.72 + (Math.cos(i * 11) - 0.5) * 40),
    };
  });
}

export function renderScene(
  root: HTMLElement,
  projects: { name: string; status: string }[]
): void {
  const live = new Set(projects.filter((p) => p.status === "live").map((p) => p.name));
  const names = projects.map((p) => p.name).slice(0, 24);
  const nodes = layout(names, live);
  const byName = new Map(nodes.map((n) => [n.name, n]));

  root.innerHTML = `
    <section class="scene">
      <div class="scene-head">
        <span id="sc-dot" class="sc-dot"></span>
        <span id="sc-state" class="sc-state">connexion…</span>
        <span id="sc-detail" class="sc-detail"></span>
        <span id="sc-learned" class="sc-learned"></span>
      </div>

      <div class="scene-map">
        <svg id="sc-svg" class="sc-svg" viewBox="0 0 1000 560" aria-hidden="true">
          <defs>
            <pattern id="sc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#16130F" stroke-opacity="0.07" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect fill="url(#sc-grid)" width="100%" height="100%"/>
          <g id="sc-paths"></g>
          <g id="sc-trail"></g>
          <g id="sc-nodes"></g>
          <circle id="sc-entity" class="sc-entity" r="8"/>
        </svg>
        <div id="sc-bubble" class="sc-bubble" hidden>fluxa · en cours</div>
      </div>

      <div class="sc-journal">
        <div class="sc-journal-title">journal</div>
        <div id="sc-lines" class="sc-lines"></div>
      </div>
    </section>`;

  const pathsG = document.getElementById("sc-paths")!;
  const trailG = document.getElementById("sc-trail")!;
  const nodesG = document.getElementById("sc-nodes")!;
  const entity = document.getElementById("sc-entity")!;
  const bubble = document.getElementById("sc-bubble")!;
  const stateEl = document.getElementById("sc-state")!;
  const dotEl = document.getElementById("sc-dot")!;
  const detailEl = document.getElementById("sc-detail")!;
  const learnedEl = document.getElementById("sc-learned")!;
  const linesEl = document.getElementById("sc-lines")!;

  const visited: string[] = [];
  const journal: string[] = [];
  let current: string | null = null;

  // liens topo entre nodes voisins (constellation)
  function drawLinks(): void {
    pathsG.innerHTML = nodes
      .map((n, i) => {
        const next = nodes[(i + 1) % nodes.length];
        const mx = (n.x + next.x) / 2, my = (n.y + next.y) / 2;
        return `<path class="sc-link" d="M${n.x},${n.y} Q${mx},${my + 60} ${next.x},${next.y}"/>`;
      })
      .join("");
  }

  function drawNodes(): void {
    nodesG.innerHTML = nodes
      .map((n) => {
        const isCur = n.name === current;
        const isVisited = visited.includes(n.name);
        const cls = n.live ? "sc-node-live" : "sc-node-wip";
        return `
        <g class="sc-nodeg ${isCur ? "sc-cur" : ""} ${isVisited ? "sc-visited" : ""}" data-name="${n.name}" transform="translate(${n.x},${n.y})">
          <circle class="sc-ring ${cls}" r="${n.live ? 8 : 6}"></circle>
          <text class="sc-label" x="14" y="4">${n.name}</text>
        </g>`;
      })
      .join("");
  }

  function drawTrail(): void {
    const pts = visited.map((n) => byName.get(n)).filter(Boolean) as ProjectNode[];
    if (pts.length < 2) { trailG.innerHTML = ""; return; }
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    trailG.innerHTML = `<path class="sc-trail" d="${d}"/>`;
  }

  function moveTo(name: string): void {
    const n = byName.get(name);
    if (!n) return;
    current = name;
    if (!visited.includes(name)) visited.push(name);
    entity.setAttribute("transform", `translate(${n.x},${n.y})`);
    bubble.hidden = false;
    bubble.style.left = `${Math.min(Math.max(n.x / 10, 2), 88)}%`;
    bubble.style.top = `${Math.max(n.y / 5.6 - 5, 0)}%`;
    bubble.textContent = `${name} · en cours`;
    dotEl.classList.add("live");
    drawNodes();
    drawTrail();
  }

  function pushJournal(a: WorkerActivity): void {
    const line = `→ ${a.repo}: ${a.detail}`;
    if (journal[journal.length - 1] !== line) {
      journal.push(line);
      if (journal.length > 12) journal.shift();
      linesEl.innerHTML = journal.map((l) => `<div class="sc-line">${l}</div>`).join("");
      linesEl.scrollTop = linesEl.scrollHeight;
    }
  }

  function apply(a: WorkerActivity, learned?: number): void {
    if (typeof learned === "number") learnedEl.textContent = `${learned} patterns appris`;
    if (a.repo === "system") {
      stateEl.textContent = a.detail || "cycle en cours";
      if (a.status === "cycle_start") visited.length = 0;
      return;
    }
    if (a.order && a.order.length) {
      visited.length = 0;
      visited.push(...a.order);
    }
    moveTo(a.repo);
    const mins = Math.max(0, Math.round((Date.now() - new Date(a.ts).getTime()) / 60000));
    stateEl.textContent = `sur ${a.repo}`;
    detailEl.textContent = `${a.detail} · il y a ${mins} min`;
    pushJournal(a);
  }

  function applyState(s: WorkerState): void {
    if (s.activity) apply(s.activity, s.learned?.total_learned);
    else { stateEl.textContent = "agent hors ligne"; dotEl.classList.remove("live"); }
  }

  drawLinks();
  drawNodes();

  fetchState().then(applyState);
  subscribe(applyState);
}
