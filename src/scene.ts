import { fetchState, subscribe, type WorkerActivity, type WorkerState } from "./activity";

// Voyage organique : un chemin sinueux qui serpente, les projets = nœuds le long
// du chemin. L'agent voyage EN CONTINU le long du chemin (requestAnimationFrame +
// getPointAtLength) — jamais immobile : halo pulsant, trainée qui se trace,
// nœuds qui respirent.

type ProjectNode = { name: string; live: boolean; x: number; y: number };

const W = 1000, H = 640;

// chemin sinueux organique (comme une rivière) + nœuds répartis dessus
function buildPath(count: number): { path: string; nodes: ProjectNode[] } {
  // points de contrôle d'une courbe sinueuse verticale
  const pts: [number, number][] = [];
  const n = Math.min(count, 10);
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(n - 1, 1);
    const y = Math.round(70 + t * (H - 140));
    const x = Math.round(W / 2 + Math.sin(i * 1.1) * 260 + Math.cos(i * 0.7) * 40);
    pts.push([x, y]);
  }
  // courbe lisse catmull-rom-like via bezier
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return { path: d, nodes: pts.map(([x, y]) => ({ x, y, name: "", live: false })) };
}

export function renderScene(
  root: HTMLElement,
  projects: { name: string; status: string }[]
): void {
  const items = projects.map((p) => ({ name: p.name, live: p.status === "live" })).slice(0, 10);
  const { path, nodes: rawNodes } = buildPath(items.length);
  // assigner les noms aux nœuds
  const nodes: ProjectNode[] = rawNodes.map((nd, i) => ({
    ...nd,
    name: items[i]?.name ?? "",
    live: items[i]?.live ?? false,
  }));

  root.innerHTML = `
    <div class="journey">
      <div class="journey-head">
        <span id="j-dot" class="j-dot"></span>
        <span id="j-state" class="j-state">connexion…</span>
        <span id="j-learned" class="j-learned"></span>
      </div>

      <div class="journey-stage">
        <svg id="j-svg" class="j-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">
          <path id="j-path" class="j-path" d="${path}"/>
          <path id="j-trail" class="j-trail" d="${path}"/>
          <g id="j-nodes"></g>
          <g id="j-agent-g"></g>
        </svg>
        <div id="j-bubble" class="j-bubble" hidden></div>
      </div>
    </div>`;

  const pathEl = document.getElementById("j-path") as unknown as SVGPathElement;
  const trailEl = document.getElementById("j-trail") as unknown as SVGPathElement;
  const nodesG = document.getElementById("j-nodes")!;
  const agentG = document.getElementById("j-agent-g")!;
  const bubbleEl = document.getElementById("j-bubble")!;
  const stateEl = document.getElementById("j-state")!;
  const dotEl = document.getElementById("j-dot")!;
  const learnedEl = document.getElementById("j-learned")!;

  const visited: string[] = [];
  let current: string | null = null;
  let raf = 0;
  let typeTl: ReturnType<typeof setTimeout> | null = null;

  const pathLen = pathEl.getTotalLength();

  // dessine les nœuds-projets le long du chemin
  function drawNodes(): void {
    nodesG.innerHTML = nodes
      .map((nd) => {
        const isCur = nd.name === current;
        const isVis = visited.includes(nd.name);
        const labelPos = nd.x > W / 2 ? -14 : 16;
        const anchor = nd.x > W / 2 ? "end" : "start";
        return `
        <g class="j-nodeg ${isCur ? "j-cur" : ""} ${isVis ? "j-vis" : ""}" data-name="${nd.name}"
           transform="translate(${nd.x},${nd.y})">
          <circle class="j-leaf" r="${nd.live ? 20 : 15}"/>
          <circle class="j-core ${nd.live ? "j-live" : "j-wip"}" r="${nd.live ? 7 : 5}"/>
          <text class="j-label" x="${labelPos}" y="3" text-anchor="${anchor}">${nd.name}</text>
        </g>`;
      })
      .join("");
  }

  // agent + halo, placé par rAF
  function buildAgent(): void {
    agentG.innerHTML = `
      <g class="j-agent">
        <circle id="j-halo" class="j-halo" r="20"/>
        <circle id="j-core" class="j-core" r="6"/>
        <circle id="j-spark" class="j-spark" r="3"/>
      </g>`;
  }

  // position sur le chemin à une distance donnée (0..1)
  function pointAt(dist: number): { x: number; y: number } {
    const p = pathEl.getPointAtLength(dist * pathLen);
    return { x: p.x, y: p.y };
  }

  // fait voyager l'agent de sa position actuelle vers le nœud cible, en continu
  function travelTo(distFrom: number, distTo: number): void {
    const agent = agentG.querySelector(".j-agent");
    if (!agent) return;
    const from = { ...pointAt(distFrom) };
    const to = pointAt(distTo);
    const start = performance.now();
    const dur = 2200;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic, décélère à l'arrivée
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = ease(t);
      const x = from.x + (to.x - from.x) * e;
      const y = from.y + (to.y - from.y) * e;
      agent.setAttribute("transform", `translate(${x},${y})`);
      // positionne la bulle près de l'agent
      bubbleEl.classList.add("show");
      bubbleEl.style.left = `${Math.min(Math.max(x / 10, 2), 82)}%`;
      bubbleEl.style.top = `${Math.max(y / 6.4 - 6, 0)}%`;
      // trace le chemin parcouru sur le trail
      const dist = (1 - t) * distFrom + t * distTo;
      trailEl.style.strokeDasharray = `${dist * pathLen} ${pathLen}`;
      if (t < 1) raf = requestAnimationFrame(step);
      else bubbleEl.style.top = `${Math.max(to.y / 6.4 - 6, 0)}%`;
    };
    raf = requestAnimationFrame(step);
  }

  // écrit le raisonnement en streaming (typewriter)
  function typeText(text: string): void {
    if (typeTl) clearTimeout(typeTl);
    const t = bubbleEl.querySelector(".j-bubble-text");
    if (!t) return;
    (t as HTMLElement).textContent = "";
    bubbleEl.classList.add("show");
    if (!text) { bubbleEl.classList.remove("show"); return; }
    let i = 0;
    const tick = () => {
      if (i <= text.length) {
        (t as HTMLElement).textContent = text.slice(0, i);
        i += 1;
        const c = text[i - 1];
        typeTl = setTimeout(tick, c === "." || c === "…" ? 90 : 20);
      }
    };
    tick();
  }

  function setBubble(thinking: string): void {
    bubbleEl.innerHTML = `<div class="j-bubble-text"></div>`;
    typeText(thinking);
  }

  function apply(a: WorkerActivity, learned?: number): void {
    if (typeof learned === "number") learnedEl.textContent = `${learned} patterns appris`;
    if (a.repo === "system") {
      stateEl.textContent = a.detail || "cycle en cours";
      if (a.status === "learned") { bubbleEl.classList.remove("show"); dotEl.classList.remove("live"); }
      if (a.status === "cycle_start") { visited.length = 0; drawNodes(); }
      return;
    }
    if (!visited.includes(a.repo)) visited.push(a.repo);
    current = a.repo;
    stateEl.textContent = `sur ${a.repo}`;
    dotEl.classList.add("live");
    // calcule les distances : de la position actuelle vers le nœud cible
    const idx = nodes.findIndex((nd) => nd.name === a.repo);
    if (idx >= 0) {
      const startDist = nodes
        .filter((nd, i) => i <= idx && visited.includes(nd.name))
        .length
        ? nodes[idx].y / H
        : 0;
      travelTo(startDist, nodes[idx].y / H);
      setBubble(a.thinking ?? "");
    }
    drawNodes();
  }

  function applyState(s: WorkerState): void {
    if (s.activity) apply(s.activity, s.learned?.total_learned);
    else { stateEl.textContent = "agent hors ligne"; dotEl.classList.remove("live"); }
  }

  // --- mise en scène d'entrée : le chemin se dessine, les nœuds apparaissent ---
  pathEl.style.strokeDasharray = `${pathLen}`;
  pathEl.style.strokeDashoffset = `${pathLen}`;
  trailEl.style.strokeDasharray = `0 ${pathLen}`;

  drawNodes();
  buildAgent();

  // halo qui pulse en continu (toujours vivant)
  const halo = document.getElementById("j-halo");
  const core = document.getElementById("j-core");
  const spark = document.getElementById("j-spark");
  let t0 = performance.now();
  const breathe = (now: number) => {
    const s = (Math.sin((now - t0) / 700) + 1) / 2; // 0..1
    if (halo) halo.setAttribute("r", String(16 + s * 10));
    if (halo) halo.setAttribute("opacity", String(0.15 + s * 0.2));
    if (core) core.setAttribute("r", String(5 + s * 2));
    if (spark) {
      const a = now / 900;
      spark.setAttribute("transform", `translate(${Math.cos(a) * 18},${Math.sin(a) * 18})`);
      spark.setAttribute("opacity", String(0.5 + Math.sin(a * 2) * 0.3));
    }
    raf = requestAnimationFrame(breathe);
  };
  raf = requestAnimationFrame(breathe);

  // entrée : dessiner le chemin progressivement
  const enter = performance.now();
  const drawIn = (now: number) => {
    const t = Math.min(1, (now - enter) / 2200);
    pathEl.style.strokeDashoffset = String(pathLen * (1 - t));
    // révéler les nœuds progressivement
    nodesG.querySelectorAll<SVGGElement>(".j-nodeg").forEach((g, i) => {
      const tt = Math.min(1, Math.max(0, t * 2 - i * 0.1));
      g.setAttribute("opacity", String(tt));
    });
    if (t < 1) raf = requestAnimationFrame(drawIn);
  };
  raf = requestAnimationFrame(drawIn);

  fetchState().then(applyState);
  subscribe(applyState);

  // cleanup rAF si le composant est retiré (gardé simple)
  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
}
