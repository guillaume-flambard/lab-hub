---
name: lab-hub
status: final
colors:
  bg: "#faf9f7"
  ink: "#16130f"
  muted: "#6b6055"
  line: "#e7e2da"
  accent: "#ad4c16"
  accent-soft: "#e58a4a"
  surface: "#ffffff"
  live: "#3fb56b"
  live-ink: "#2f7d4f"
  t1: { bg: "#f4ede4", ink: "#c8672e" }
  t2: { bg: "#eef1f6", ink: "#5a6b8c" }
  t3: { bg: "#141210", ink: "#e58a4a" }
  t4: { bg: "#e9f0ea", ink: "#2f6b3f" }
  t5: { bg: "#15141a", ink: "#b48ee0" }
typography:
  font: "Oswald, Archivo Narrow, system-ui, sans-serif"
  weights: [300, 400, 500, 600]
  display: "600 / clamp(2.8rem,7vw,5.4rem) / 1.05 / 0"
  h2: "500 / clamp(1.8rem,4vw,2.8rem) / 1 / 0"
  card: "600 / 1.4rem / 1.1 / 0"
  body: "300 / clamp(1.1rem,1.8vw,1.45rem) / 1.4"
  label: "400 / 0.75-0.9rem / 1.4 / 0.18em uppercase"
rounded: 0
spacing:
  wrap: "1180px"
  sec: "clamp(80px,12vw,160px)"
  card: "26px 24px 28px"
  gap: 12
components: [backdrop, nav, hero, section, card, badge, button, footer]
---

# DESIGN.md — lab-hub

Source unique de l'identité visuelle du lab. Produite dans le run UX BMAD du 2026-08-16,
en prolongement des tokens du portfolio (memolabs.dev). Sert de contrat pour les maquettes
Open Design et l'implémentation (style.css). Referenced by EXPERIENCE.md.

## Brand & Style

Memo Labs, le lab. Vitrine technique "proof in public": des choses réelles, déployées,
atteignables, parfois brutes. Le style est un **relevé topographique** dessiné à la plume:
traits de 1px, ellipses concentriques, branche organique, fond crème papier. À la fois
précis (ligne technique) et vivant (dérive lente, pulsation, révélation au scroll). Pas de
corporate, pas de glossy. La marque est sobre, artisanale, un peu atelier d'ingénierie.

## Colors

- Fond unique `bg` (#faf9f7, crème). Pas de blanc pur, pas de noir pur (ink = brun foncé).
- Encre `ink`, texte secondaire `muted`, filets `line` (1px).
- Accent unique `accent` (rouille) + dérivé doux `accent-soft`. L'accent signale l'action
  et le vivant; jamais décoratif au-delà de la règle: au plus un élément chaud par zone.
- `live` (vert) réservé à la preuve de vie (badge live, pulsation, compteur "reachable now").
  Texte sur fond live toujours en `live-ink` (AA).
- Teintes `t1..t5` pour les monogrammes de cartes: chaque projet hérite d'une teinte
  déterministe (hash du nom), avec son couple bg/ink.
- Règle: un seul accent chaud par section; contraste AA partout; pas d'ombres.

## Typography

- Police unique Oswald (fallback Archivo Narrow/system) chargée côté Google Fonts, comme le
  portfolio. Graisses 300/400/500/600. Pas de nouvelle police.
- Hiérarchie par graisse + espacement de lettres, pas par couleur: `display` (hero, 600,
  uppercase), `h2` (500, uppercase), `card` (600), `body` (300, 56ch max), `label`
  (uppercase, letter-spacing 0.18em).
- Tout titre en uppercase; le corps reste en casse normale.
- Aucun em/en dash dans aucun texte (règle d'écriture Memo Labs).

## Layout & Spacing

- Colonne `wrap` 1180px, marges clamp(20px,4vw,48px).
- Rythme vertical de section `sec` = clamp(80px,12vw,160px), sections séparées par un filet
  1px `line`.
- Grille cartes: `repeat(auto-fit, minmax(320px,1fr))`, gap 1px sur fond `line` (grille
  hairline: le filet est la grille). Mobile: colonne unique.
- Espacements 4/8/12/16/24/32/48/64/96/128, base card = 26/24/28.

## Elevation & Depth

- Aucune ombre. La profondeur vient de: couches du backdrop (ellipses concentriques en
  dérive lente), teintes sombres t3/t5 des monogrammes, et l'effet de surface au survol
  (`surface` sur `bg`). "Alive" par le mouvement, pas par l'ombre.

## Shapes

- Rayon 0 partout. Seul le point de pulsation live et le sceau monogramme sont des cercles.
- Filets de 1px uniquement (bordure, grille, séparateurs, soulignés de liens).

## Components

- **Backdrop**: SVG topo (ellipses concentriques) + branche organique avec feuilles, fixe,
  z-index -1, desktop only (>=922px), dérive lente (64s/96s). Le motif devient plus présent
  (opacité hot ring renforcée), puis trace discrète sur les sections.
- **Nav**: sticky, 72px, bordure basse 1px. Marque "Memo Labs" (accent sur Labs). Liens
  uppercase 14px, séparés par filets verticaux. Lien courant en accent. Lang switcher.
- **Hero**: eyebrow (label accent + filet), display "Proof, in public." (FR: "La preuve, en
  public."), lede (56ch, muted). Compteur live "N reachable now". Deux boutons (plein accent
  / ghost line).
- **Section head**: h2 uppercase + lede muted 52ch.
- **Card**: monogramme (initiale + anneaux concentriques de la teinte du projet, 16/9),
  corps: titre 600 avec flèche, note "why it matters", ligne méta (tags chips, date de push),
  pied: badge statut + signal live (pulsation) + liens live/repo. Survol: fond `surface`,
  flèche révélée, léger déplacement du monogramme.
- **Badge**: statut en label; live = fond vert translucide + point pulsant; beta = ambre;
  lab = accent-soft.
- **Button**: rectangulaire, uppercase, letter-spacing 0.09em. Primaire: accent plein,
  survol ink. Secondaire: ghost line, survol bordure ink.
- **Footer**: filet haut, marque + lien legal, uppercase 13px muted.

## Do's and Don'ts

- DO: parler en preuve (compteurs, dates, pulsations, liens live); laisser la grille
  hairline respirer; utiliser un seul accent chaud par zone; garder Oswald uppercase pour
  les titres.
- DON'T: pas d'images stock, pas de dégradés, pas d'ombres, pas de rayons, pas de vert sur
  du texte hors `live-ink`, pas de hover-only info (mobile), pas de em/en dash.
