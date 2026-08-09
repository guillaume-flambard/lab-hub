import { loadProjects, type Project } from "./projects";
import "./style.css";

const TINTS = ["t1", "t2", "t3", "t4"];

const STATUS: Record<string, { label: string; cls: string }> = {
  live: { label: "Live", cls: "b-live" },
  beta: { label: "Beta", cls: "b-beta" },
  lab: { label: "WIP", cls: "b-lab" },
  internal: { label: "Internal", cls: "b-internal" },
  private: { label: "Private", cls: "b-private" },
  archived: { label: "Stale", cls: "b-stale" },
};

function tint(name: string): string {
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return TINTS[sum % TINTS.length];
}

function badge(p: Project): string {
  const s = STATUS[p.status] ?? { label: p.status, cls: "b-lab" };
  return `<span class="badge ${s.cls}">${s.label}</span>`;
}

function card(p: Project): string {
  const desc = p.description && p.description !== "projet local (pas de repo GitHub)"
    ? p.description
    : "Experiment in the Memo Labs playground.";
  const lang = p.language ? `<span class="chip">${p.language}</span>` : "";
  const href = p.url ?? p.repo ?? "https://memolabs.dev";
  return `
  <a class="card" href="${href}" target="_blank" rel="noopener">
    <div class="thumb ${tint(p.name)}">${p.name}</div>
    <div class="cbody">
      <h3>${p.name}<span class="arrow">→</span></h3>
      <p>${desc}</p>
      <div class="card-foot">${lang}${badge(p)}</div>
    </div>
  </a>`;
}

function section(title: string, projects: Project[]): string {
  return `
  <section class="sec">
    <div class="wrap">
      <div class="shead">
        <h2>${title}</h2>
        <span class="count">${projects.length}</span>
      </div>
      <div class="grid">${projects.map(card).join("")}</div>
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
    root.innerHTML = `<div class="wrap"><p class="err">Failed to load projects.json: ${(e as Error).message}</p></div>`;
    return;
  }

  const live = projects.filter((p) => p.status === "live");
  const lab = projects.filter((p) => p.lab_candidate);

  root.innerHTML =
    section("Live", live) +
    section("Playground", lab);
}

main();
