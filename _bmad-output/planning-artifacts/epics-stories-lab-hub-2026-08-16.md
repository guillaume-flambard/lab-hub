---
title: Epics & Stories — lab-hub "The Living Proof"
created: 2026-08-16
updated: 2026-08-16
---

# Epics & Stories — lab-hub

## E1 — Message et structure (proof in public)
- S1.1 Récrire hero FR/EN: eyebrow, H1 "Proof, in public." / "La preuve, en public.", lede nette. (FR-1)
- S1.2 Ajouter le compteur live "N reachable now" près du hero (depuis projects.json). (FR-1)
- S1.3 Récrire titres et ledes des 3 sections (live/lab/explorations) + phrase "how to read this lab". (FR-2, FR-3)

## E2 — Cartes riches
- S2.1 Monogramme SVG déterministe (initiale + anneaux concentriques + teinte hash) remplaçant le bloc teinté. (FR-4, AD-4)
- S2.2 Signal live: afficher `last_push` (date) + pulsation sur les live; dégradation "no signal". (FR-5, AD-3)
- S2.3 Note "why it matters" depuis `notes.{fr,en}`, fallback si absente. (FR-6)
- S2.4 Méta complète: chips tags, date, badge statut précis, liens live/repo. (FR-7)

## E3 — Design system organique vivant
- S3.1 Renforcer le backdrop topo/branche (présent sur hero, trace sur sections). (FR-8)
- S3.2 Reveal au scroll (gsap ScrollTrigger) + micro-interactions cards (flèche, décalage monogramme). (FR-9)
- S3.3 Pulse live + focus-visible 2px accent + reduced-motion complet. (FR-10, FR-11, a11y)

## E4 — Pipeline de données
- S4.1 Étendre projects.json: `notes {fr,en}` + `last_push`, via refresh/audit-repos (build-time, cache). (FR-5, FR-6, AD-2, AD-3)
- S4.2 Curer les notes FR+EN pour les projets actuels (contenu maison, humanizer, zéro em-dash).
- S4.3 Vérifier la dégradation si GitHub API indisponible (date absente -> "no signal", pas de crash).

## E5 — i18n, qualité et livraison
- S5.1 Toute nouvelle copy dans i18n.ts FR/EN; lint em/en dash. (FR-12, AD-6)
- S5.2 `npm run build` + preview FR/EN + vérif desktop/mobile + reduced-motion.
- S5.3 Commit + push main -> auto-deploy Coolify -> vérif lab.memolabs.dev/en/ et /fr/.

## Définition of Done
- Chaque carte montre: monogramme, note, date, badge, liens. (E2)
- Le message du lab est net en 5s (hero + compteur + pulse). (E1, E3)
- Aucune régression FR/EN, a11y AA, reduced-motion OK. (E5)
