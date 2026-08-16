import { t } from "./i18n";
import { loadProjects, type Project } from "./projects";
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
  const dot = p.status === "live" && p.last_push_days != null ? `<span class="badge-dot" aria-hidden="true"></span>` : "";
  return `<span class="badge ${cls}">${dot}${label}</span>`;
}

/** Note "why it matters" : curated FR/EN, sinon la description GitHub. */
function note(p: Project): string {
  const d = t();
  const cur = (p.notes as Record<string, string> | null)?.[d.htmlLang] ?? "";
  if (cur.trim()) return cur.trim();
  return p.description && p.description !== "projet local (pas de repo GitHub)"
    ? p.description
    : d.descFallback;
}

/** Signal live : date de push, avec dégradation "no signal". */
function dateLabel(p: Project): string {
  const d = t();
  if (p.last_push_days == null) return `<span class="card-date nosig">${d.noSignal}</span>`;
  return `<span class="card-date">${d.lastPush(p.last_push_days)}</span>`;
}

/** Monogramme déterministe : initiales + anneaux topo dans la teinte du projet. */
function monogram(p: Project): string {
  const initials = p.name
    .split(/[-_\s]+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sum = [...p.name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const cx = 160, cy = 90;
  const rot = (sum % 12) - 6;
  const radii = [70, 110, 150].map((r, i) => r + ((sum >> i) % 7));
  const opacities = ["0.6", "0.38", "0.2"];
  const rings = radii
    .map(
      (r, i) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${Math.round(r * 0.63)}" transform="rotate(${rot} ${cx} ${cy})" stroke-opacity="${opacities[i]}"/>`
    )
    .join("");
  return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <g class="rings">${rings}</g>
    <text x="160" y="104" class="mono-name" text-anchor="middle">${initials}</text>
  </svg>`;
}

function card(p: Project): string {
  const live = p.url ?? p.repo ?? "#";
  const langChip = p.language ? `<span class="chip">${p.language}</span>` : "";
  const links =
    (p.url ? `<a class="card-link" href="${p.url}" target="_blank" rel="noopener noreferrer">${t().openLive} ↗</a>` : "") +
    (p.repo ? `<a class="card-link" href="${p.repo}" target="_blank" rel="noopener noreferrer">${t().openRepo}</a>` : "");
  return `
  <article class="card">
    <a class="mono ${tint(p.name)}" href="${live}" target="_blank" rel="noopener noreferrer" aria-hidden="true" tabindex="-1">${monogram(p)}</a>
    <div class="cbody">
      <div class="card-head">
        <h3><a href="${live}" target="_blank" rel="noopener noreferrer">${p.name}<span class="arrow">→</span></a></h3>
        ${badge(p)}
      </div>
      <p class="note">${note(p)}</p>
      <div class="meta">${langChip}${dateLabel(p)}</div>
      <div class="card-links">${links}</div>
    </div>
  </article>`;
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

  const counter = document.getElementById("liveNow");
  if (counter && live.length > 0) {
    counter.hidden = false;
    counter.innerHTML = `<i class="pulse" aria-hidden="true"></i>${d.liveNow(live.length)}`;
  }
  root.innerHTML =
    section("live", d.liveTitle, d.liveLede(live.length), live) +
    section("lab", d.labTitle, d.labLede(lab.length), lab) +
    section("explorations", d.explTitle, d.explLede, explorations);

  initReveal(root);
}

/** Révélation au scroll, décorative et coupée en reduced-motion (via CSS). */
function initReveal(root: HTMLElement) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = root.querySelectorAll<HTMLElement>(".sec, .grid .card");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12 }
  );
  targets.forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });
}

main();
