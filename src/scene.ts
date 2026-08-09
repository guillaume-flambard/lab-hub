import { fetchState, subscribe, type WorkerActivity, type WorkerState } from "./activity";

// Voyage organique vivant : un chemin sinueux, l'agent voyage le long de la
// courbe réelle (getPointAtLength) avec un easing humain (accélère/décélère),
// et au repos il dérive en continu (jamais figé). Particules, halo pulsant,
// indicateur « pensée… » avant chaque raisonnement qui s'écrit en streaming.

type ProjectNode = { name: string; live: boolean; x: number; y: number };

const W = 1000, H = 640;

function buildPath(count: number): { path: string; nodes: ProjectNode[] } {
  const n = Math.min(count, 10);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(n - 1, 1);
    const y = Math.round(70 + t * (H - 140));
    const x = Math.round(W / 2 + Math.sin(i * 1.1) * 240 + Math.cos(i * 0.7) * 50);
    pts.push([x, y]);
  }
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
  const nodes: ProjectNode[] = rawNodes.map((nd, i) => ({
    ...nd, name: items[i]?.name ?? "", live: items[i]?.live ?? false,
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
          <g id="j-particles"></g>
          <g id="j-nodes"></g>
          <g id="j-agent-g"></g>
        </svg>
        <div id="j-think" class="j-think" hidden><span></span><span></span><span></span></div>
        <div id="j-bubble" class="j-bubble" hidden></div>
      </div>
    </div>`;

  const pathEl = document.getElementById("j-path") as unknown as SVGPathElement;
  const trailEl = document.getElementById("j-trail") as unknown as SVGPathElement;
  const nodesG = document.getElementById("j-nodes")!;
  const agentG = document.getElementById("j-agent-g")!;
  const particlesG = document.getElementById("j-particles")!;
  const bubbleEl = document.getElementById("j-bubble")!;
  const thinkEl = document.getElementById("j-think")!;
  const stateEl = document.getElementById("j-state")!;
  const dotEl = document.getElementById("j-dot")!;
  const learnedEl = document.getElementById("j-learned")!;

  const visited: string[] = [];
  let current: string | null = null;
  let raf = 0;
  let typeTl: ReturnType<typeof setTimeout> | null = null;

  const pathLen = pathEl.getTotalLength();
  // distance le long du path pour chaque nœud (fraction 0..1)
  const nodeDist = new Map<string, number>();
  nodes.forEach((nd, i) => {
    nodeDist.set(nd.name, i / Math.max(nodes.length - 1, 1));
  });

  function drawNodes(): void {
    nodesG.innerHTML = nodes
      .map((nd) => {
        const isCur = nd.name === current;
        const isVis = visited.includes(nd.name);
        const right = nd.x > W / 2;
        return `
        <g class="j-nodeg ${isCur ? "j-cur" : ""} ${isVis ? "j-vis" : ""}" data-name="${nd.name}"
           transform="translate(${nd.x},${nd.y})">
          <circle class="j-leaf" r="${nd.live ? 20 : 15}"/>
          <circle class="j-core ${nd.live ? "j-live" : "j-wip"}" r="${nd.live ? 7 : 5}"/>
          <text class="j-label" x="${right ? -14 : 16}" y="3" text-anchor="${right ? "end" : "start"}">${nd.name}</text>
        </g>`;
      })
      .join("");
  }

  // particules qui flottent le long du chemin (vie)
  function spawnParticles(): void {
    particlesG.innerHTML = "";
    for (let i = 0; i < 14; i++) {
      const d = (i / 14 + Math.random() * 0.02) % 1;
      const p = pathEl.getPointAtLength(d * pathLen);
      const r = 1.5 + Math.random() * 2;
      const delay = Math.random() * 4;
      const dur = 5 + Math.random() * 5;
      const opacity = 0.15 + Math.random() * 0.3;
      const pt = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pt.setAttribute("cx", String(p.x));
      pt.setAttribute("cy", String(p.y));
      pt.setAttribute("r", String(r));
      pt.setAttribute("fill", "#e58a4a");
      pt.setAttribute("opacity", String(opacity));
      pt.style.animation = `j-drift ${dur}s ease-in-out ${delay}s infinite`;
      particlesG.appendChild(pt);
    }
  }

  // ---- moteur d'animation continu : position actuelle + dérive ----
  let agentX = nodes[0].x, agentY = nodes[0].y;   // position courante de l'agent
  let phase = Math.random() * 10;

  function updateAgent(now: number): void {
    phase += 0.012;
    // au repos : dérive organique autour du nœud (jamais immobile)
    const driftX = Math.sin(phase) * 6;
    const driftY = Math.cos(phase * 0.8) * 5;
    const x = agentX + driftX;
    const y = agentY + driftY;
    const agent = agentG.querySelector(".j-agent");
    if (agent) agent.setAttribute("transform", `translate(${x},${y})`);
    // halo pulse + étincelle orbite
    const halo = agentG.querySelector("#j-halo");
    const core = agentG.querySelector("#j-core");
    const spark = agentG.querySelector("#j-spark");
    const s = (Math.sin(now / 500) + 1) / 2;
    if (halo) { halo.setAttribute("r", String(16 + s * 10)); halo.setAttribute("opacity", String(0.18 + s * 0.2)); }
    if (core) { core.setAttribute("r", String(5 + s * 2)); }
    if (spark) {
      const a = now / 700;
      spark.setAttribute("transform", `translate(${Math.cos(a) * 16},${Math.sin(a) * 16})`);
      spark.setAttribute("opacity", String(0.4 + Math.sin(a * 2) * 0.3));
    }
    // bulle suit l'agent
    if (!bubbleEl.hidden) {
      bubbleEl.style.left = `${Math.min(Math.max(x / 10, 2), 82)}%`;
      bubbleEl.style.top = `${Math.max(y / 6.4 - 6, 0)}%`;
    }
    raf = requestAnimationFrame(updateAgent);
  }

  // voyage le long du path réel vers un nœud
  function travelToNode(name: string): void {
    const target = nodes.find((n) => n.name === name);
    if (!target) return;
    const fromD = nodeDist.get(current ?? nodes[0].name) ?? 0;
    const toD = nodeDist.get(name) ?? 0;
    const from = pathEl.getPointAtLength(fromD * pathLen);
    const to = pathEl.getPointAtLength(toD * pathLen);
    const start = performance.now();
    const dur = 2400;
    const step = (now: number) => {
      let t = Math.min(1, (now - start) / dur);
      // easing humain : accélération puis forte décélération + micro-hésitation
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      agentX = from.x + (to.x - from.x) * e;
      agentY = from.y + (to.y - from.y) * e;
      // trace le trail parcouru
      const dist = (1 - e) * fromD + e * toD;
      trailEl.style.strokeDasharray = `${dist * pathLen} ${pathLen}`;
      if (t < 1) raf = requestAnimationFrame(step);
      else { agentX = to.x; agentY = to.y; }
    };
    raf = requestAnimationFrame(step);
  }

  // ---- indicateur « pensée… » puis streaming ----
  function typeText(text: string): void {
    if (typeTl) clearTimeout(typeTl);
    bubbleEl.innerHTML = `<div class="j-bubble-text"></div>`;
    const t = bubbleEl.querySelector(".j-bubble-text");
    bubbleEl.classList.add("show");
    thinkEl.hidden = false;
    thinkEl.style.left = bubbleEl.style.left;
    thinkEl.style.top = bubbleEl.style.top;
    if (!text) { thinkEl.hidden = true; bubbleEl.classList.remove("show"); return; }
    // pause réflexion (~1s) pendant que les points s'animent
    typeTl = setTimeout(() => {
      thinkEl.hidden = true;
      let i = 0;
      const chars = text.split("");
      const tick = () => {
        if (i <= chars.length) {
          (t as HTMLElement).textContent = chars.slice(0, i).join("");
          i += 1;
          const c = chars[i - 1];
          const delay = c === "." || c === "…" || c === ":" ? 110 : c === "," ? 70 : 18 + Math.random() * 14;
          typeTl = setTimeout(tick, delay);
        } else {
          (t as HTMLElement).classList.add("done");
        }
      };
      tick();
    }, 900);
  }

  function apply(a: WorkerActivity, learned?: number): void {
    if (typeof learned === "number") learnedEl.textContent = `${learned} patterns appris`;
    if (a.repo === "system") {
      stateEl.textContent = a.detail || "cycle en cours";
      if (a.status === "learned") { thinkEl.hidden = true; bubbleEl.classList.remove("show"); dotEl.classList.remove("live"); }
      if (a.status === "cycle_start") { visited.length = 0; drawNodes(); }
      return;
    }
    if (!visited.includes(a.repo)) visited.push(a.repo);
    current = a.repo;
    stateEl.textContent = `sur ${a.repo}`;
    dotEl.classList.add("live");
    travelToNode(a.repo);
    if (a.thinking) typeText(a.thinking);
    drawNodes();
  }

  function applyState(s: WorkerState): void {
    if (s.activity) apply(s.activity, s.learned?.total_learned);
    else { stateEl.textContent = "agent hors ligne"; dotEl.classList.remove("live"); }
  }

  // ---- mise en scène d'entrée ----
  drawNodes();
  agentG.innerHTML = `
    <g class="j-agent">
      <circle id="j-halo" class="j-halo" r="20"/>
      <circle id="j-core" class="j-core" r="6"/>
      <circle id="j-spark" class="j-spark" r="3"/>
    </g>`;
  spawnParticles();

  pathEl.style.strokeDasharray = `${pathLen}`;
  pathEl.style.strokeDashoffset = `${pathLen}`;
  trailEl.style.strokeDasharray = `0 ${pathLen}`;

  const enter = performance.now();
  const drawIn = (now: number) => {
    const t = Math.min(1, (now - enter) / 2400);
    pathEl.style.strokeDashoffset = String(pathLen * (1 - t));
    nodesG.querySelectorAll<SVGGElement>(".j-nodeg").forEach((g, i) => {
      const tt = Math.min(1, Math.max(0, t * 2.2 - i * 0.09));
      g.setAttribute("opacity", String(tt));
    });
    if (t < 1) raf = requestAnimationFrame(drawIn);
  };
  raf = requestAnimationFrame(drawIn);
  raf = requestAnimationFrame(updateAgent);

  fetchState().then(applyState);
  subscribe(applyState);

  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
}
