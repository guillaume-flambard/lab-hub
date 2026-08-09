import { fetchState, subscribe, type WorkerActivity } from "./activity";

type NodeInfo = { name: string; live: boolean; x: number; y: number };

// positions des nodes sur une ellipse (constellation) + espace pour l'entité
function layoutNodes(names: string[], liveNames: Set<string>): NodeInfo[] {
  const n = names.length;
  const CX = 480, CY = 220, RX = 400, RY = 150;
  return names.map((name, i) => {
    const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    return {
      name,
      live: liveNames.has(name),
      x: CX + RX * Math.cos(angle) + (Math.random() - 0.5) * 60,
      y: CY + RY * Math.sin(angle) * 0.7 + (Math.random() - 0.5) * 30,
    };
  });
}

export function renderScene(root: HTMLElement, projects: { name: string; status: string }[]): void {
  const liveNames = new Set(projects.filter((p) => p.status === "live").map((p) => p.name));
  const allNames = projects.map((p) => p.name).slice(0, 32);
  const nodes = layoutNodes(allNames, liveNames);

  root.innerHTML = `
      <div class="shead">
        <h2>L'IA <span class="acc">au travail</span></h2>
        <p>Un agent surveille les repos du lab, se déplace de projet en projet — et apprend à chaque cycle.</p>
      </div>

      <div class="scene">
        <div class="scene-head">
          <span id="ia-dot" class="scene-dot"></span>
          <span id="ia-state" class="scene-state">connexion…</span>
          <span id="ia-detail" class="scene-detail"></span>
          <span id="ia-learned" class="scene-learned"></span>
        </div>

        <svg id="scene-svg" class="scene-svg" viewBox="0 0 960 420" aria-hidden="true">
          <g id="scene-links"></g>
          <g id="scene-nodes"></g>
          <g id="scene-trail"></g>
          <circle id="entity" class="entity" r="7"></circle>
        </svg>

        <div id="scene-bubble" class="scene-bubble" hidden></div>
      </div>

      <div class="journal">
        <div class="journal-title">journal</div>
        <div id="journal-lines" class="journal-lines"></div>
      </div>
`;

  const nodesG = document.getElementById("scene-nodes")!;
  const trailG = document.getElementById("scene-trail")!;
  const entity = document.getElementById("entity")!;
  const bubble = document.getElementById("scene-bubble")!;
  const stateEl = document.getElementById("ia-state")!;
  const dotEl = document.getElementById("ia-dot")!;
  const detailEl = document.getElementById("ia-detail")!;
  const learnedEl = document.getElementById("ia-learned")!;

  const names = new Map(nodes.map((n) => [n.name, n]));
  const order: string[] = [];
  let currentNode: string | null = null;
  const journal: string[] = [];

  // trace le chemin parcouru (l'ordre réel)
  function updateTrail(): void {
    trailG.innerHTML = "";
    const pts = order
      .map((n) => names.get(n))
      .filter(Boolean) as NodeInfo[];
    if (pts.length < 2) return;
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    trailG.innerHTML = `<path class="trail" d="${d}" />`;
  }

  function drawNodes(): void {
    nodesG.innerHTML = "";
    for (const n of nodes) {
      const cls = n.live ? "node-live" : "node-lab";
      const isCurrent = n.name === currentNode;
      nodesG.innerHTML += `
        <g class="nodeg ${isCurrent ? "node-current" : ""}" data-name="${n.name}" transform="translate(${n.x},${n.y})">
          <circle class="node-ring ${cls}" r="${n.live ? 7 : 5}"></circle>
          <text class="node-label" x="0" y="${n.live ? -14 : -11}">${n.name}</text>
        </g>`;
    }
  }

  function moveTo(name: string): void {
    const n = names.get(name);
    if (!n) return;
    currentNode = name;
    // l'entité va au node
    entity.setAttribute("transform", `translate(${n.x},${n.y})`);
    // déplace la bulle près du node
    bubble.hidden = false;
    bubble.style.left = `${Math.min(Math.max(n.x / 9.6, 2), 70)}%`;
    bubble.style.top = `${Math.max(n.y / 4.2 - 6, 2)}%`;
    bubble.textContent = `${name} · en cours`;
    dotEl.classList.add("live");
    drawNodes();
    updateTrail();
  }

  function applyActivity(a: WorkerActivity, learned?: number): void {
    const repo = a.repo;
    if (repo === "system") {
      stateEl.textContent = a.detail || "cycle";
      return;
    }
    if (a.order && a.order.length) {
      order.length = 0;
      order.push(...a.order);
    } else if (!order.includes(repo)) {
      order.push(repo);
    }
    moveTo(repo);
    const mins = Math.max(0, Math.round((Date.now() - new Date(a.ts).getTime()) / 60000));
    stateEl.textContent = `sur ${repo}`;
    detailEl.textContent = a.detail.replace(/\d+\/\d+/, "") + ` · il y a ${mins} min`;
    if (typeof learned === "number") learnedEl.textContent = `${learned} patterns appris`;
    // journal
    const line = `→ ${repo}: ${a.detail}`;
    if (journal[journal.length - 1] !== line) {
      journal.push(line);
      if (journal.length > 20) journal.shift();
      renderJournal();
    }
  }

  function renderJournal(): void {
    const el = document.getElementById("journal-lines")!;
    el.innerHTML = journal
      .map((l) => `<div class="journal-line">${l}</div>`)
      .join("");
    el.scrollTop = el.scrollHeight;
  }

  drawNodes();

  fetchState().then((s) => {
    if (s.activity) applyActivity(s.activity, s.learned?.total_learned);
    else {
      stateEl.textContent = "agent hors ligne";
      dotEl.classList.remove("live");
    }
  });

  subscribe((a) => applyActivity(a));
}
