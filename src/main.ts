import { t } from "./i18n";
import { loadProjects, type Project } from "./projects";
import { renderScene } from "./scene";
import "./style.css";

const TINTS = ["t1", "t2", "t3", "t4", "t5"];

function tint(name: string): string {
  const sum = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return TINTS[sum % TINTS.length];
}

function badge(p: Project): string {
  const d = t();
  const label = d.status[p.status] ?? d.statusFallback;
  const cls = p.status === "live" ? "b-live" : p.status === "beta" ? "b-beta" : "b-lab";
  return `<span class="badge ${cls}">${label}</span>`;
}

function cleanDesc(p: Project): string {
  // les descriptions viennent de projects.json (GitHub), elles ne sont pas traduites
  return p.description && p.description !== "projet local (pas de repo GitHub)"
    ? p.description
    : t().descFallback;
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

  const d = t();

  let projects: Project[];
  try {
    projects = await loadProjects();
  } catch (e) {
    root.innerHTML = `<div class="wrap"><p class="err">${d.loadError((e as Error).message)}</p></div>`;
    return;
  }

    const live = projects.filter((p) => p.status === "live");
  const lab = projects.filter((p) => p.lab_candidate);
  const explorations = projects.filter(
    (p) => (p.status === "beta" || p.status === "archived") && p.visibility === "PUBLIC" && p.description
  ).slice(0, 12);

  root.innerHTML =
    sceneSection() +
    section("live", d.liveTitle, d.liveLede(live.length), live) +
    section("lab", d.labTitle, d.labLede(lab.length), lab) +
    section("explorations", d.explTitle, d.explLede, explorations);

  const sceneEl = document.getElementById("ia-scene");
  if (sceneEl) {
    // les repos visités par le worker d'abord (ordre de voyage réel), puis le reste
    const workerOrder = ["lab-infra", "weave", "ops-autopilot", "knockport", "fluxa", "memo-ui", "lab-hub"];
    const all: { name: string; status: string }[] = live.concat(lab);
    const merged: { name: string; status: string }[] = [...all];
    for (const w of workerOrder) {
      if (!merged.some((p) => p.name === w)) merged.push({ name: w, status: "lab" });
    }
    const sorted = workerOrder
      .map((n) => merged.find((p) => p.name === n))
      .filter(Boolean)
      .concat(merged.filter((p) => !workerOrder.includes(p.name)));
    renderScene(sceneEl, sorted.map((p) => ({ name: p!.name, status: p!.status })));
  }
}

function sceneSection(): string {
  const d = t();
  return `
  <section id="ia" class="sec ia">
    <div class="wrap">
      <div class="shead">
        <h2>${d.iaTitle} <span class="acc">${d.iaTitleAccent}</span></h2>
        <p>${d.iaLede}</p>
      </div>
      <div id="ia-scene"></div>
    </div>
  </section>`;
}

main();
