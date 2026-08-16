---
title: ARCHITECTURE-SPINE — lab-hub
created: 2026-08-16
updated: 2026-08-16
altitude: feature
---

# Architecture Spine — lab-hub

Paradigm: **static-first, deterministic at build, decorative motion at runtime.** The page
renders from a checked-in data file plus client-side deterministic visuals; the only runtime
code is rendering and decoration. Nothing the browser fetches decides the content.

## Invariants

- **AD-1 [ADOPTED] Static pure.** No runtime network except user-clicked external links.
  projects.json is fetched at page load (same-origin, cached) but produced at build.
- **AD-2 [ADOPTED] projects.json is the single source of project truth.** Extended with
  `notes: {fr, en}` (FR-6). Fed by `lab-infra/scripts/audit-repos.py`; `npm run refresh`
  regenerates it into `public/`. Never edited ad hoc in `public/`.
- **AD-3 [ASSUMPTION] GitHub push dates ingested at build.** The refresh step extends each
  project with `last_push` from the GitHub API (per-repo `pushed_at`). On API failure the
  field is absent; the UI shows the date when present and a "no signal" badge otherwise.
  The card must not break without it (FR-5, graceful degradation).
- **AD-4 [ADOPTED] No new runtime deps beyond gsap.** Monogram per project is a
  deterministic SVG (initials + concentric rings in the project tint, from a name hash)
  generated client-side; no image assets, no extra requests (FR-4).
- **AD-5 [ADOPTED] Motion is decorative and gated.** Reveal au scroll via IntersectionObserver
  (classe `.reveal`/`.in`), micro-interactions en CSS, pulse via keyframes. Toute animation ne
  tourne que hors `prefers-reduced-motion`. Motion jamais porteuse d'information (FR-9,
  EXPERIENCE Accessibility Floor). Note: gsap reste disponible dans les deps mais n'est pas
  requis pour ce périmètre.
- **AD-6 [ADOPTED] i18n.** All UI copy lives in `src/i18n.ts` (FR/EN). Bilingual notes in
  projects.json. Zero em/en dash in any string (lint).
- **AD-7 [ADOPTED] lab-hub is a read-only consumer.** No writes, no backend, no auth. Its
  contract with the outside world is `public/projects.json` (built) and outbound links.

## Deferred

- activity.memolabs.dev (per-project traffic worker) is down (503). Revisit when it is up:
  swap `last_push`-based signal for real activity. Deferred, not dropped.
- Multi-tag tech metadata per repo: only the primary `language` exists today. Extend
  `audit-repos.py` to gather topics/tags when needed; single chip stays for now (FR-7).
- Font: keep Oswald only (no new font). Revisit if the editorial contrast needs a serif
  companion for body copy.

## Data shape (seed, owned by code once it exists)

```
projects.json: Project[]
Project = {
  name, status(live|beta|lab|archived), url?, repo?, description,
  language, lab_candidate, visibility,
  notes: { fr: string, en: string },   // NEW (FR-6)
  last_push?: string                    // NEW (FR-5, build-time)
}
```

## Out of scope

- Redesign of the portfolio site; new pages; server-side rendering; CMS.
