import { loadProjects, type Project } from "./projects";
import "./style.css";

const TINTS = ["t1", "t2", "t3", "t4", "t5"];

const STATUS: Record<string, { label: string; cls: string }> = {
  live: { label: "Live", cls: "" },
  beta: { label: "Beta", cls: "warn" },
  lab: { label: "WIP", cls: "lab" },
  internal: { label: "Internal", cls: "lab" },
  private: { label: "Private", cls: "lab" },
  archived: { label: "Stale", cls: "lab" },
};

function tint(name: string): string {
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return TINTS[sum % TINTS.length];
}

function statusDot(p: Project): string {
  const s = STATUS[p.status] ?? { label: p.status, cls: "lab" };
  return `<span class="dot ${s.cls}"></span>${s.label}`;
}

function card(p: Project): string {
  const desc = p.description && p.description !== "projet local (pas de repo GitHub)"
    ? p.description
    : "Experiment in the Memo Labs playground.";
  const lang = p.language ? `<span>${p.language}</span>` : "";
  const href = p.url ?? p.repo ?? "https://memolabs.dev";
  return `
  <a class="card" href="${href}" target="_blank" rel="noopener">
    <div class="thumb ${tint(p.name)}">${p.name}</div>
    <div class="cbody">
      <h3>${p.name}<span class="arrow">→</span></h3>
      <p>${desc}</p>
      <div class="stack">${lang}</div>
      <div class="curl">${statusDot(p)}<span class="arr">↗</span></div>
    </div>
  </a>`;
}

function section(title: string, lede: string, projects: Project[]): string {
  return `
  <section class="sec">
    <div class="wrap">
      <div class="shead">
        <h2>${title}</h2>
        <p>${lede}</p>
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
    section("Live", "Shipped and running on the lab.", live) +
    section("Playground", `WIP experiments — ${lab.length} prototypes and tools.`, lab);
}

main();
