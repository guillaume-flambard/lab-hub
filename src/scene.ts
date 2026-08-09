import { fetchState, subscribe, type WorkerActivity, type WorkerState } from "./activity";

type VineNode = { name: string; live: boolean; x: number; y: number };

// Disposition en "tige de plante" : les projets sont des nœuds-feuilles qui
// montent le long d'une tige sinueuse depuis le bas (comme une liane qui pousse).
function layoutVine(names: string[], live: Set<string>): VineNode[] {
  const n = Math.min(names.length, 14);
  const W = 1000, H = 560;
  const nodes: VineNode[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(n - 1, 1); // 0 bas → 1 haut
    const y = Math.round(H - 70 - t * (H - 140));
    const x = Math.round(W / 2 + Math.sin(i * 1.7) * 300);
    nodes.push({ name: names[i], live: live.has(names[i]), x, y });
  }
  return nodes;
}

// Génère le path de la tige passant par tous les nœuds (courbe lisse)
function stemPath(nodes: VineNode[]): string {
  if (!nodes.length) return "";
  let d = `M ${nodes[0].x},${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], b = nodes[i];
    const mx = (a.x + b.x) / 2;
    d += ` C ${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
  }
  return d;
}

export function renderScene(
  root: HTMLElement,
  projects: { name: string; status: string }[]
): void {
  const live = new Set(projects.filter((p) => p.status === "live").map((p) => p.name));
  const names = projects.map((p) => p.name);
  const nodes = layoutVine(names, live);
  const byName = new Map(nodes.map((n) => [n.name, n]));
  const stem = stemPath(nodes);

  root.innerHTML = `
    <section class="vine">
      <div class="vine-head">
        <span id="vn-dot" class="vn-dot"></span>
        <span id="vn-state" class="vn-state">connexion…</span>
        <span id="vn-learned" class="vn-learned"></span>
      </div>

      <div class="vine-stage">
        <svg id="vn-svg" class="vn-svg" viewBox="0 0 1000 560" aria-hidden="true">
          <defs>
            <linearGradient id="vn-stem" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stop-color="#e58a4a"/>
              <stop offset="1" stop-color="#ad4c16"/>
            </linearGradient>
          </defs>
          <path id="vn-stem-path" class="vn-stem" d="${stem}"/>
          <path id="vn-liana" class="vn-liana" d="${stem}" stroke-dasharray="2000" stroke-dashoffset="2000"/>
          <g id="vn-nodes"></g>
        </svg>
        <div id="vn-thought" class="vn-thought" hidden>
          <div class="vn-thought-label">l'IA réfléchit</div>
          <div id="vn-thinking" class="vn-thinking"></div>
        </div>
      </div>
    </section>`;

  const nodesG = document.getElementById("vn-nodes")!;
  const liana = document.getElementById("vn-liana")!;
  const stemEl = document.getElementById("vn-stem-path")!;
  const thoughtEl = document.getElementById("vn-thought")!;
  const thinkingEl = document.getElementById("vn-thinking")!;
  const stateEl = document.getElementById("vn-state")!;
  const dotEl = document.getElementById("vn-dot")!;
  const learnedEl = document.getElementById("vn-learned")!;

  const visited: string[] = [];
  let current: string | null = null;
  let typeTimer: ReturnType<typeof setTimeout> | null = null;

  // La tige pousse (animation de dessin) à l'arrivée
  const stemLen = (stemEl as unknown as SVGPathElement).getTotalLength?.() ?? 2000;
  stemEl.style.strokeDasharray = `${stemLen}`;
  stemEl.style.strokeDashoffset = `${stemLen}`;
  requestAnimationFrame(() => {
    stemEl.style.transition = "stroke-dashoffset 3s cubic-bezier(0.2,0.7,0.2,1)";
    stemEl.style.strokeDashoffset = "0";
  });

  function drawNodes(): void {
    nodesG.innerHTML = nodes
      .map((n) => {
        const isCur = n.name === current;
        const isVis = visited.includes(n.name);
        const cls = n.live ? "vn-live" : "vn-wip";
        const leafCls = isVis ? " leaf-out" : "";
        return `
        <g class="vn-nodeg ${isCur ? "vn-cur" : ""}" transform="translate(${n.x},${n.y})">
          <ellipse class="vn-leaf${leafCls}" rx="26" ry="10" transform="rotate(${n.live ? 30 : -30})"/>
          <circle class="vn-dotn ${cls}" r="${n.live ? 9 : 6}"/>
          <text class="vn-label" x="0" y="${n.live ? 26 : 22}">${n.name}</text>
        </g>`;
      })
      .join("");
  }

  // Déplace la liane + le curseur vers le nœud courant (la plante s'étire)
  function growTo(name: string): void {
    const n = byName.get(name);
    if (!n) return;
    current = name;
    if (!visited.includes(name)) visited.push(name);
    // étire la liane jusqu'au nœud courant
    const idx = visited.map((v) => byName.get(v)).filter(Boolean) as VineNode[];
    if (idx.length >= 2) {
      const seg = idx
        .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : ` L ${p.x},${p.y}`))
        .join("");
      liana.setAttribute("d", seg);
      liana.style.strokeDashoffset = "0";
    }
    // positionne la bulle de pensée près du nœud
    thoughtEl.hidden = false;
    thoughtEl.style.left = `${Math.min(Math.max(n.x / 10, 2), 82)}%`;
    thoughtEl.style.top = `${Math.max(n.y / 5.6 - 8, 0)}%`;
    dotEl.classList.add("live");
    drawNodes();
  }

  // Écrit le raisonnement lettre par lettre (typewriter temps réel)
  function typeThought(text: string): void {
    if (typeTimer) clearTimeout(typeTimer);
    thinkingEl.textContent = "";
    thoughtEl.classList.remove("typing");
    thoughtEl.hidden = false;
    if (!text) return;
    thoughtEl.classList.add("typing");
    let i = 0;
    const tick = () => {
      if (i <= text.length) {
        thinkingEl.textContent = text.slice(0, i);
        i += 2;
        typeTimer = setTimeout(tick, 20);
      } else {
        thoughtEl.classList.remove("typing");
      }
    };
    tick();
  }

  function apply(a: WorkerActivity, learned?: number): void {
    if (typeof learned === "number") learnedEl.textContent = `${learned} patterns appris`;
    if (a.repo === "system") {
      stateEl.textContent = a.detail || "cycle en cours";
      if (a.status === "learned") { typeThought(""); }
      if (a.status === "cycle_start") visited.length = 0;
      return;
    }
    if (a.order && a.order.length) {
      visited.length = 0;
      visited.push(...a.order);
    }
    growTo(a.repo);
    stateEl.textContent = `sur ${a.repo}`;
    if (a.thinking) typeThought(a.thinking);
  }

  function applyState(s: WorkerState): void {
    if (s.activity) apply(s.activity, s.learned?.total_learned);
    else { stateEl.textContent = "agent hors ligne"; dotEl.classList.remove("live"); }
  }

  drawNodes();
  fetchState().then(applyState);
  subscribe(applyState);
}
