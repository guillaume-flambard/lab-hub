import { fetchState, subscribe, type WorkerActivity, type WorkerState } from "./activity";

// Agent board moderne (style OpenHands / Symphony) :
// une colonne de work items (projets), chacun avec un état.
// Le projet en cours est surligné et son raisonnement s'écrit en streaming.

type WorkItem = { name: string; live: boolean };

export function renderScene(
  root: HTMLElement,
  projects: { name: string; status: string }[]
): void {
  const items: WorkItem[] = projects
    .map((p) => ({ name: p.name, live: p.status === "live" }))
    .slice(0, 10);

  root.innerHTML = `
    <div class="board">
      <div class="board-head">
        <span id="bd-dot" class="bd-dot"></span>
        <span id="bd-state" class="bd-state">connexion…</span>
        <div class="bd-progress"><span id="bd-bar" class="bd-bar"></span></div>
        <span id="bd-learned" class="bd-learned"></span>
      </div>

      <div id="bd-items" class="bd-items"></div>

      <div id="bd-thinking" class="bd-thinking" hidden>
        <div class="bd-thinking-caret"></div>
        <div id="bd-text" class="bd-text"></div>
      </div>
    </div>`;

  const itemsEl = document.getElementById("bd-items")!;
  const stateEl = document.getElementById("bd-state")!;
  const dotEl = document.getElementById("bd-dot")!;
  const barEl = document.getElementById("bd-bar")!;
  const learnedEl = document.getElementById("bd-learned")!;
  const thinkingEl = document.getElementById("bd-thinking")!;
  const textEl = document.getElementById("bd-text")!;

  const visited: string[] = [];
  let current: string | null = null;
  let order: string[] = [];
  let typeTl: ReturnType<typeof setTimeout> | null = null;

  function renderItems(): void {
    itemsEl.innerHTML = items
      .map((it) => {
        const isCur = it.name === current;
        const isVis = visited.includes(it.name);
        const isNext = !isCur && !isVis && order.includes(it.name);
        let state = "pending";
        if (isCur) state = "running";
        else if (isVis) state = "done";
        else if (isNext) state = "next";
        return `
        <div class="bd-item ${state}" data-name="${it.name}">
          <span class="bd-item-dot"></span>
          <span class="bd-item-name">${it.name}</span>
          ${it.live ? '<span class="bd-item-live">live</span>' : ""}
          <span class="bd-item-state">${{ pending: "en attente", running: "en cours", done: "terminé", next: "à venir" }[state]}</span>
        </div>`;
      })
      .join("");
    // progression = items visités / total
    const pct = Math.round((visited.filter((n) => items.some((i) => i.name === n)).length / items.length) * 100);
    barEl.style.width = `${pct}%`;
  }

  // écrit le raisonnement en streaming (typewriter)
  function typeText(text: string): void {
    if (typeTl) clearTimeout(typeTl);
    textEl.textContent = "";
    thinkingEl.hidden = false;
    if (!text) { thinkingEl.hidden = true; return; }
    let i = 0;
    const tick = () => {
      if (i <= text.length) {
        textEl.textContent = text.slice(0, i);
        i += 1;
        const c = text[i - 1];
        const delay = c === "." || c === "…" || c === ":" ? 90 : 22;
        typeTl = setTimeout(tick, delay);
      }
    };
    tick();
  }

  function apply(a: WorkerActivity, learned?: number): void {
    if (typeof learned === "number") learnedEl.textContent = `${learned} patterns appris`;
    if (a.repo === "system") {
      stateEl.textContent = a.detail || "cycle en cours";
      if (a.status === "learned") { thinkingEl.hidden = true; dotEl.classList.remove("live"); }
      if (a.status === "cycle_start") { visited.length = 0; renderItems(); }
      return;
    }
    if (a.order && a.order.length) order = [...a.order];
    if (!visited.includes(a.repo)) visited.push(a.repo);
    current = a.repo;
    stateEl.textContent = `sur ${a.repo}`;
    dotEl.classList.add("live");
    renderItems();
    if (a.thinking) typeText(a.thinking);
  }

  function applyState(s: WorkerState): void {
    if (s.activity) apply(s.activity, s.learned?.total_learned);
    else { stateEl.textContent = "agent hors ligne"; dotEl.classList.remove("live"); }
  }

  renderItems();
  fetchState().then(applyState);
  subscribe(applyState);
}
