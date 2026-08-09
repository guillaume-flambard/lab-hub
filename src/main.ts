import { loadProjects, type Project } from "./projects";
import "./style.css";

const BADGES: Record<string, { label: string; cls: string }> = {
  live: { label: "Live", cls: "b-live" },
  internal: { label: "Internal", cls: "b-internal" },
  beta: { label: "Beta", cls: "b-beta" },
  lab: { label: "WIP", cls: "b-lab" },
  private: { label: "Private", cls: "b-private" },
  archived: { label: "Stale", cls: "b-stale" },
};

function badge(p: Project): string {
  const b = BADGES[p.status] ?? { label: p.status, cls: "b-internal" };
  return `<span class="badge ${b.cls}">${b.label}</span>`;
}

function card(p: Project): string {
  const desc = p.description && p.description !== "projet local (pas de repo GitHub)"
    ? p.description : p.name;
  const lang = p.language ? `<span class="chip">${p.language}</span>` : "";
  const href = p.url ?? p.repo ?? "#";
  const external = p.url ? "↗" : "→";
  return `
  <a class="card" href="${href}" target="_blank" rel="noopener">
    <div class="card-head">
      <span class="name">${p.name}</span>${badge(p)}
    </div>
    <p class="desc">${desc}</p>
    <div class="card-foot">
      ${lang}
      <span class="go">${external}</span>
    </div>
  </a>`;
}

function section(title: string, note: string, projects: Project[]): string {
  return `
  <section class="section">
    <div class="sec-head">
      <h2>${title}</h2>
      <span class="sec-note">${note}</span>
    </div>
    <div class="grid">${projects.map(card).join("")}</div>
  </section>`;
}

async function main() {
  const root = document.getElementById("content");
  if (!root) return;

  let projects: Project[];
  try {
    projects = await loadProjects();
  } catch (e) {
    root.innerHTML = `<p class="err">Failed to load projects.json: ${(e as Error).message}</p>`;
    return;
  }

  const live = projects.filter((p) => p.status === "live");
  const lab = projects.filter((p) => p.lab_candidate);

  root.innerHTML =
    section("Live", "shipped & running on the lab", live) +
    section("Playground", `${lab.length} WIP experiments`, lab);
}

main();
