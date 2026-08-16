---
title: "lab-hub: The Living Proof"
created: 2026-08-16
updated: 2026-08-16
status: final
---

# PRD: lab-hub: The Living Proof
Working title, confirm.

## 0. Document Purpose
For Guillaume (owner) and the downstream BMAD workflow (UX, architecture, epics/stories, build). The lab page at lab.memolabs.dev (FR/EN) is the public face of Memo Labs' experiments. This PRD sharpens the message, enriches the project cards, and gives the design system an "organic-technical, alive" character, without a redesign. It builds on the existing static site (Vite+TS, tokens mirrored from the portfolio); it does not duplicate the portfolio site.

## 1. Vision
Memo Labs ships real AI systems. The lab is where that shows: live agents, tools, prototypes, deployed, reachable, rough but real. Today the page is a clean shell that does not say this. This PRD makes the lab "the living proof": a visitor gets it in five seconds that every card is a real, working thing, and each card carries enough detail (visual, live signal, why it matters, dates/tags/links) to turn curiosity into a click. The design keeps its quiet identity (Oswald, rust accent, cream, hairline grid) and gains an organic-technical alive layer: the existing topographic/branch motif becomes more present, and the page moves with purpose (reveal, micro-interactions), not decoration.

## 2. Target User

### 2.1 Jobs To Be Done
- Guillaume: prove depth of AI engineering in production, to the job market (the lab is evidence, not a blog).
- Recruiter / hiring manager / founder arriving from a CV or LinkedIn: "within seconds, show me this person builds real, working AI systems."
- Developer: "find a real tool or agent I can actually try; see the source; borrow an idea."
- Existing client/partner: "a window into Memo Labs' range."

### 2.2 Non-Users (v1)
- General consumer SaaS marketing (this is a maker's vitrine, not a product site).
- Documentation hub / changelog.
- Corporate brochure.

### 2.3 Key User Journeys
- **UJ-1. A hiring manager lands from a CV.** Entry: direct link to `/en/`. 5s: the hero says "living proof" (deployed, reachable, real). Scans a 3-column grid; a card with a live pulse draws the eye; clicks; the project opens on its own subdomain, live. Resolution: the manager leaves with 2-3 concrete project names to discuss.
- **UJ-2. A developer wanders in.** Notices a card's "why it matters" line and last-push date, opens the repo, reads the code. Resolution: the lab reads as an honest workshop.
- **UJ-3. A mobile visitor (recruiter on a phone).** Single column; cards stay rich; the hero still lands in 5s; no hover dependence (motion is decorative only).

## 3. Features

### 3.1 Message and structure
- **FR-1.** Hero copy sharpened to the "living proof" idea (EN: "Proof, in public." plus lede; FR equivalent), with a live counter near the hero ("N projects reachable now").
- **FR-2.** Section titles and ledes reworked so each answers "what is this and why should I care": Live (reachable now), Lab (in progress), Explorations (parked/closed paths).
- **FR-3.** One-line "how to read this lab": every card opens live; rough is intended.

### 3.2 Richer cards (all four enrichments)
- **FR-4.** Visual per project: deterministic crafted monogram (initials + concentric topo rings + tint) replacing the plain tinted name block. No image assets.
- **FR-5.** Live signal per card: real "alive" indicator (last push date from GitHub, pulse on live projects), fetched at build, degrading to a static date or "no signal" when unavailable.
- **FR-6.** Context: curated one-line "why it matters" per project (FR+EN) from a new `notes` field in projects.json.
- **FR-7.** Meta: last-updated date, tech tags (extend the existing language chip where data exists), precise status label, live + repo links always present.

### 3.3 Design system: organic-technical alive
- **FR-8.** The topo/branch motif becomes a present, layered element (stronger on the hero, faint trace across sections), tied to motion.
- **FR-9.** Motion, always decorative and reduced-motion-safe: scroll reveal (gsap), card hover micro-interactions, live-pulse dot, refined hero drift (exists today).
- **FR-10.** Typography and edges: keep Oswald + rust accent; add editorial weight contrast and a consistent 1px-line vocabulary; focus-visible states everywhere.
- **FR-11.** No pure black/white; AA contrast maintained (matches existing tokens).

### 3.4 i18n and hygiene
- **FR-12.** All new copy in FR+EN in i18n.ts; curated notes bilingual; zero em/en dash in all copy.

## 4. Non-Functional Requirements
- Static-first: no SSR; gsap scoped; minimal added JS; no new runtime deps beyond gsap.
- Accessibility AA; prefers-reduced-motion honored; keyboard navigation; focus-visible.
- Performance: LCP unaffected (backdrop is fixed-position SVG); no layout shift from live signals.
- Data: the activity worker (activity.memolabs.dev) is currently DOWN (503); signals must degrade gracefully; GitHub push dates are the primary source.
- Deploy: Coolify auto-deploy on main; `/fr/` and `/en/` parity.

## 5. Success Metrics
- 5-second message: a first-time visitor can state "Memo Labs ships real, reachable AI things" (proxy: hero copy + live counter + card pulse).
- Card density: a visitor names at least two projects after 30s (proxy: richer cards shipped).
- Click-through from lab cards to live project pages increases vs current.
- Counter-metric: the lab must not become a brochure; no stock imagery, no corporate tone; roughness stays a feature.

## 6. Assumptions
- [ASSUMPTION] The "living proof" hero direction is approved (user chose it); exact wording iterated in build.
- [ASSUMPTION] The `notes` (why-it-matters) field is curated per project (FR+EN) in lab-infra/docs/projects.json.
- [ASSUMPTION] GitHub API (repo pushed_at) is available at build time; rate limits fine for ~20 repos.
- [BLOCKER] activity.memolabs.dev returns 503: per-project live traffic signals deferred; GitHub last-push is the live proxy for now.
- [ASSUMPTION] Projects list is ~15-25 entries; sections stay as today (live / lab / explorations).

## Open Questions
- Exact hero copy FR/EN (propose during build).
- Whether multi-tag tech data exists per repo (extend if audit-repos.py provides it).
