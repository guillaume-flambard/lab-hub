import { loadProjects, type Project } from "./projects";
import { fetchState, subscribe } from "./activity";
import "./style.css";

const TINTS = ["t1", "t2", "t3", "t4", "t5"];

const STATUS_LABEL: Record<string, string> = {
  live: "En ligne",
  beta: "Beta",
  lab: "WIP",
  internal: "Interne",
  private: "Privé",
  archived: "Archivé",
};

function tint(name: string): string {
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return TINTS[sum % TINTS.length];
}

function badge(p: Project): string {
  const label = STATUS_LABEL[p.status] ?? "WIP";
  const cls = p.status === "live" ? "b-live" : p.status === "beta" ? "b-beta" : "b-lab";
  return `<span class="badge ${cls}">${label}</span>`;
}

function cleanDesc(p: Project): string {
  return p.description && p.description !== "projet local (pas de repo GitHub)"
    ? p.description
    : "Expérimentation dans le lab Memo Labs.";
}

function card(p: Project): string {
  const desc = cleanDesc(p);
  const href = p.url ?? p.repo ?? "#";
  const langChip = p.language ? `<span class="chip">${p.language}</span>` : "";
  const ext = p.url ? "↗" : "→";
  return `
  <a class="card" href="${href}" target="_blank" rel="noopener noreferrer">
    <div class="thumb ${tint(p.name)}">${p.name}</div>
    <div class="cbody">
      <h3>${p.name}<span class="arrow">→</span></h3>
      <p>${desc}</p>
      <div class="stack">${langChip}</div>
      <div class="foot-row">${badge(p)}<span class="go">${ext}</span></div>
    </div>
  </a>`;
}

function section(id: string, title: string, lede: string, projects: Project[]): string {
  const cards = projects.map((p) => card(p)).join("");
  return `
  <section id="${id}" class="sec">
    <div class="wrap">
      <div class="shead">
        <h2>${title}</h2>
        <p>${lede}</p>
      </div>
      <div class="grid">${cards}</div>
    </div>
  </section>`;
}

async function main() {
  const root = document.getElementById("content");
  if (!root) return;

  let projects: Project[];
  try {
    projects = await loadProjects();
  } catch (e) {
    root.innerHTML = `<div class="wrap"><p class="err">Impossible de charger les projets : ${(e as Error).message}</p></div>`;
    return;
  }

    const live = projects.filter((p) => p.status === "live");
  const lab = projects.filter((p) => p.lab_candidate);
  const explorations = projects.filter(
    (p) => (p.status === "beta" || p.status === "archived") && p.visibility === "PUBLIC" && p.description
  ).slice(0, 12);

  root.innerHTML =
    activitySection() +
    section("live", "En ligne", `Les produits Memo Labs déployés et accessibles — ${live.length} au total.`, live) +
    section("lab", "Le lab", `Les expérimentations en cours — ${lab.length} prototypes, agents et outils.`, lab) +
    section("explorations", "Explorations", "Des pistes explorées, en pause ou en beta — le travail continue.", explorations);

  wireActivity();
}

function activitySection(): string {
  return `
  <section id="ia" class="sec ia">
    <div class="wrap">
      <div class="shead">
        <h2>L'IA <span class="acc">au travail</span></h2>
        <p>L'agent de Memo Labs surveille les repos 24/7 — et apprend à chaque cycle.</p>
      </div>
      <div id="ia-status" class="ia-box">
        <div class="ia-line"><span class="dot live" aria-hidden></span><span id="ia-state">connexion…</span></div>
        <div class="ia-meta">
          <span id="ia-detail"></span>
          <span id="ia-learned" class="ia-learned"></span>
        </div>
      </div>
      <div id="ia-learn" class="ia-learn"></div>
    </div>
  </section>`;
}

function wireActivity(): void {
  const el = document.getElementById("ia-state");
  const det = document.getElementById("ia-detail");
  const learned = document.getElementById("ia-learned");
  const box = document.getElementById("ia-status");
  if (!el || !det || !learned || !box) return;

  const render = (a: { repo: string; status: string; detail: string; ts: string }, n?: number) => {
    el.textContent = a.status === "working" ? `sur ${a.repo}` : a.status === "cycle_start" ? "cycle en cours" : a.detail || a.status;
    det.textContent = a.ts ? `il y a ${Math.max(0, Math.round((Date.now() - new Date(a.ts).getTime()) / 60000))} min` : "";
    if (typeof n === "number") learned.textContent = n > 0 ? `${n} patterns appris` : "";
    box.classList.add("live");
  };

  fetchState().then((s) => {
    if (s.activity) render(s.activity, s.learned?.total_learned);
    else { el.textContent = "agent hors ligne"; box.classList.remove("live"); }
  });

  subscribe((a) => render(a));
}

main();
