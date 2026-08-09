import { fetchState, subscribe, type WorkerActivity, type WorkerState } from "./activity";
import { gsap } from "./gsapSetup";

type VineNode = { name: string; live: boolean; x: number; y: number };

// La tige est une liane qui monte : les projets sont des nœuds le long d'une
// courbe sinueuse, le premier en bas, le dernier en haut.
function layoutVine(names: string[], live: Set<string>): VineNode[] {
  const n = Math.min(names.length, 12);
  const W = 1000, H = 560;
  const nodes: VineNode[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(n - 1, 1); // 0 = bas, 1 = haut
    const y = Math.round(H - 90 - t * (H - 160));
    const x = Math.round(W / 2 + Math.sin(i * 1.9 + 0.6) * 280);
    nodes.push({ name: names[i], live: live.has(names[i]), x, y });
  }
  return nodes;
}

// path de la tige : courbe lisse passant par tous les nœuds
function vinePath(nodes: VineNode[]): string {
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
  const stem = vinePath(nodes);

  root.innerHTML = `
    <section class="vine">
      <div class="vine-head">
        <span id="vn-dot" class="vn-dot"></span>
        <span id="vn-state" class="vn-state">connexion…</span>
        <span id="vn-learned" class="vn-learned"></span>
      </div>

      <div class="vine-stage">
        <svg id="vn-svg" class="vn-svg" viewBox="0 0 1000 560" aria-hidden="true">
          <path id="vn-stem" class="vn-stem" d="${stem}"/>
          <path id="vn-glow" class="vn-glow" d="${stem}"/>
          <g id="vn-nodes"></g>
          <g id="vn-agent-g"></g>
        </svg>
        <div id="vn-thought" class="vn-thought" hidden>
          <div class="vn-thought-dots"><span></span><span></span><span></span></div>
          <div id="vn-thinking" class="vn-thinking"></div>
        </div>
      </div>
    </section>`;

  const stemEl = document.getElementById("vn-stem") as unknown as SVGPathElement;
  const glowEl = document.getElementById("vn-glow") as unknown as SVGPathElement;
  const nodesG = document.getElementById("vn-nodes")!;
  const agentG = document.getElementById("vn-agent-g")!;
  const thoughtEl = document.getElementById("vn-thought")!;
  const thinkingEl = document.getElementById("vn-thinking")!;
  const stateEl = document.getElementById("vn-state")!;
  const dotEl = document.getElementById("vn-dot")!;
  const learnedEl = document.getElementById("vn-learned")!;

  const visited: string[] = [];
  let current: string | null = null;

  // --- dessine les nœuds (feuilles) le long de la tige ---
  function drawNodes(): void {
    nodesG.innerHTML = nodes
      .map((n) => {
        const isCur = n.name === current;
        const isVis = visited.includes(n.name);
        return `
        <g class="vn-nodeg ${isCur ? "vn-cur" : ""} ${isVis ? "vn-vis" : ""}" data-name="${n.name}" transform="translate(${n.x},${n.y})">
          <ellipse class="vn-leaf" rx="30" ry="9" transform="rotate(${n.live ? 35 : -35})"/>
          <circle class="vn-dotn ${n.live ? "vn-live" : "vn-wip"}" r="${n.live ? 9 : 6}"/>
          <text class="vn-label" x="0" y="${n.live ? 26 : 22}">${n.name}</text>
        </g>`;
      })
      .join("");
  }

  // --- l'agent voyage le long de la tige vers le nœud courant ---
  function buildAgent(): void {
    agentG.innerHTML = `
      <g class="vn-agent">
        <circle class="vn-agent-halo" r="18"/>
        <circle class="vn-agent-core" r="7"/>
      </g>`;
  }

  function travelTo(name: string): void {
    const n = byName.get(name);
    if (!n) return;
    current = name;
    if (!visited.includes(name)) visited.push(name);

    const agent = agentG.querySelector(".vn-agent");
    const halo = agentG.querySelector(".vn-agent-halo");
    const core = agentG.querySelector(".vn-agent-core");
    if (!agent || !halo || !core) return;

    // l'agent suit la tige (MotionPath) jusqu'au nœud
    gsap.to(agent, {
      motionPath: { path: stemEl, align: stemEl, alignOrigin: [0.5, 0.5] },
      duration: 2.2,
      ease: "power2.inOut",
      onUpdate() {
        const p = (agent as unknown as SVGGraphicsElement).getBBox();
        // positionne la bulle près du point courant
        const cx = p.x + p.width / 2, cy = p.y + p.height / 2;
        thoughtEl.style.left = `${Math.min(Math.max(cx / 10, 2), 82)}%`;
        thoughtEl.style.top = `${Math.max(cy / 5.6 - 7, 0)}%`;
      },
    });
    // halo pulse
    gsap.to(halo, { scale: 1.6, opacity: 0.2, duration: 0.9, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(core, { scale: 1.25, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" });

    dotEl.classList.add("live");
    drawNodes();
  }

  // --- typewriter humain : vitesse variable, préfixe "…" ---
  let typeTl: gsap.core.Timeline | null = null;
  function typeThought(text: string): void {
    if (typeTl) typeTl.kill();
    thinkingEl.textContent = "";
    thoughtEl.hidden = false;
    thoughtEl.classList.add("visible");
    if (!text) { thoughtEl.classList.remove("visible"); return; }

    const chars = text.split("");
    typeTl = gsap.timeline();
    // pause "réflexion" initiale (points animés par CSS)
    typeTl.to(thoughtEl.querySelector(".vn-thought-dots")!, { autoAlpha: 1, duration: 0.3 })
      .to({}, { duration: 0.6 })
      .to(thoughtEl.querySelector(".vn-thought-dots")!, { autoAlpha: 0, duration: 0.2 })
      .add(() => {
        thinkingEl.classList.add("typing");
        let i = 0;
        const tick = () => {
          if (i <= chars.length) {
            thinkingEl.textContent = chars.slice(0, i).join("");
            i += 1;
            const delay = chars[i - 1] === "." || chars[i - 1] === "…" ? 160 : 24;
            typeTl?.add(() => {}, `+=${delay / 1000}`);
            gsap.delayedCall(delay / 1000, tick);
          } else {
            thinkingEl.classList.remove("typing");
          }
        };
        tick();
      });
  }

  function apply(a: WorkerActivity, learned?: number): void {
    if (typeof learned === "number") learnedEl.textContent = `${learned} patterns appris`;
    if (a.repo === "system") {
      stateEl.textContent = a.detail || "cycle en cours";
      if (a.status === "learned") typeThought("");
      if (a.status === "cycle_start") { visited.length = 0; drawNodes(); }
      return;
    }
    if (a.order && a.order.length) {
      visited.length = 0;
      visited.push(...a.order);
    }
    stateEl.textContent = `sur ${a.repo}`;
    travelTo(a.repo);
    if (a.thinking) typeThought(a.thinking);
  }

  function applyState(s: WorkerState): void {
    if (s.activity) apply(s.activity, s.learned?.total_learned);
    else { stateEl.textContent = "agent hors ligne"; dotEl.classList.remove("live"); }
  }

  // --- animation d'entrée : la tige se dessine ---
  drawNodes();
  buildAgent();
  gsap.set(stemEl, { drawSVG: "0%" });
  gsap.set(glowEl, { drawSVG: "0%", autoAlpha: 0.6 });
  gsap.to(stemEl, { drawSVG: "100%", duration: 2.5, ease: "power2.inOut" });
  gsap.to(glowEl, { drawSVG: "100%", duration: 2.5, ease: "power2.inOut", delay: 0.3 });

  // respiration lente de la tige (toujours en mouvement, jamais figé)
  gsap.to(glowEl, {
    drawSVG: "0% 100%",
    opacity: 0.25,
    duration: 3.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  fetchState().then(applyState);
  subscribe(applyState);
}
