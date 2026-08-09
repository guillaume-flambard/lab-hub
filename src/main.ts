import { loadProjects, type Project } from "./projects";
import "./style.css";

const STATUS_LABEL: Record<string, string> = {
  live: "Live",
  beta: "Beta",
  lab: "WIP",
  internal: "Internal",
  private: "Private",
  archived: "Stale",
};

function statusBadge(p: Project): string {
  const label = STATUS_LABEL[p.status] ?? "WIP";
  const cls = p.status === "live" ? "s-live" : p.status === "beta" ? "s-beta" : "s-lab";
  return `<span class="status ${cls}"><span class="dot" aria-hidden></span>${label}</span>`;
}

function row(p: Project): string {
  const desc = p.description && p.description !== "projet local (pas de repo GitHub)"
    ? p.description
    : "—";
  const lang = p.language ? `<span class="meta-lang">${p.language}</span>` : "";
  const href = p.url ?? p.repo ?? "https://memolabs.dev";
  return `
  <a class="lrow" href="${href}" target="_blank" rel="noopener noreferrer">
    <span class="lrow-name">${p.name}</span>
    <span class="lrow-desc">${desc}</span>
    <span class="lrow-meta">${lang}${statusBadge(p)}</span>
  </a>`;
}

function group(title: string, note: string, projects: Project[]): string {
  return `
  <section class="lgroup">
    <div class="wrap">
      <div class="lghead">
        <h2>${title}</h2>
        <span class="lgcount">${projects.length}</span>
      </div>
      <p class="lglede">${note}</p>
      <div class="llist">${projects.map(row).join("")}</div>
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
    group("Live", "Shipped and running on the lab.", live) +
    group("Playground", "WIP experiments — prototypes, agents and tools.", lab);
}

main();
