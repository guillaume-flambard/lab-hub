---
title: Sprint Status — lab-hub "The Living Proof"
created: 2026-08-16
updated: 2026-08-16
---

# Sprint Status — lab-hub

## Readiness gate: PASS
- PRD final (gate requise) ✅
- UX spines DESIGN.md + EXPERIENCE.md (gate recommandée) ✅
- Architecture spine AD-1..7 (gate requise) ✅
- Epics E1-E5 + stories S1.x-S5.x ✅
- Sources: projects.json (name/status/url/repo/desc/lang/lab_candidate/visibility) + gsap dispo + GitHub API (build-time). Blocker documenté: activity.memolabs.dev 503 (déféré, dégradation prévue AD-3).

## Plan du sprint (ordre)
1. **E4 (S4.1)** pipeline données: notes {fr,en} + last_push dans projects.json (refresh build).
2. **E2 (S2.1-S2.4)** cartes riches: monogramme SVG, signal live, note, méta.
3. **E1 (S1.1-S1.3)** message: hero + compteur + ledes sections.
4. **E3 (S3.1-S3.3)** DS vivant: backdrop renforcé, reveal gsap, micro-interactions, pulse, focus, reduced-motion.
5. **E5 (S5.1-S5.3)** i18n/humanizer + build/preview + deploy main.

## Exécution
- Ouvert en session unique (solo), pas de blocage cross-story.
- La référence visuelle: DESIGN.md / EXPERIENCE.md (spines win on conflict). Maquettes Open Design produites pour validation visuelle avant/avec build.
- Rétro BMAD en fin de sprint (bmad-retrospective).

## Risques
- GitHub API rate-limit sur ~20 repos au build → cache last_push dans projects.json, réécrit à chaque refresh.
- Contenu des notes: curation maison FR/EN (humanizer, zéro em-dash).
