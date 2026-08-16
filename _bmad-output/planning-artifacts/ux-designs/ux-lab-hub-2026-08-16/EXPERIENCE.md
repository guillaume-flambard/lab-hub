---
name: lab-hub-experience
status: final
references: DESIGN.md (tokens via {colors.*} / {typography.*} / {spacing.*})
---

# EXPERIENCE.md — lab-hub

Contrat "how it works". Vue unique statique, FR/EN, servie sur lab.memolabs.dev/fr/ et /en/.
Le contrat visuel est DESIGN.md. Ce document décrit IA, voix, comportements, états,
interactions et accessibilité.

## Foundation

- Form-factor: web desktop-first (grille 3 colonnes), mobile single-column. Pas d'app.
- UI system: Vite+TS statique, sans framework. Design tokens dans style.css
  (voir {colors.*}, {typography.*}, {spacing.*}).
- Deux locales avec URLs propres (/fr/, /en/), redirection racine par Accept-Language.

## Information Architecture

```
nav (brand · work · lab · about · contact · lang)
hero: eyebrow + H1 "Proof, in public." + lede + live counter + 2 CTA (#live / #lab)
main#content
  section#live      → produits Memo Labs déployés et joignables (status=live)
  section#lab       → expérimentations en cours (lab_candidate)
  section#explorations → pistes explorées, en pause ou fermées (beta/archived, public)
footer: © Memo Labs · legal
```

Ancres: `#live`, `#lab` (boutons du hero). Sections séparées par filet 1px. Chaque section a
un titre + lede qui répond "qu'est-ce que c'est, pourquoi s'y intéresser" (FR-2).

## Voice and Tone

- Ton "preuve en public": concret, honnête, sans fioritures. L'expérimentation assumée
  ("parfois brut, mais réel"). Jamais corporate, jamais de survente.
- Microcopy clé:
  - H1 EN "Proof, in public." / FR "La preuve, en public."
  - Lede: le lab = où vivent les expérimentations Memo Labs: agents IA, outils, POCs,
    déployés et joignables. Les produits finis vivent sur le portfolio.
  - Live counter: "N reachable now" (FR "N joignables maintenant").
  - "How to read this lab" (FR-3): une phrase, chaque carte s'ouvre en live, le brut est
    voulu.
- Règle absolue: zéro em/en dash; passe humanizer sur toute nouvelle copy FR et EN.

## Component Patterns

- **Card** (le composant central, FR-4..7): quatre enrichissements.
  - Monogramme déterministe: initiale(s) du nom + anneaux concentriques (écho topo) dans la
    teinte du projet, ratio 16/9. Pas d'asset image.
  - Signal live (FR-5): date de dernier push GitHub + pulsation sur les projets live; si la
    source est injoignable (worker 503), afficher la date statique ou "no signal" sans casser
    la carte.
  - Note "why it matters" (FR-6): une ligne courte FR+EN venant de `notes` dans projects.json.
  - Méta (FR-7): chips de tags techniques, date (dernière mise à jour), badge statut, liens
    live + repo toujours présents. Carte entière cliquable (live en priorité).
- **Hero**: message net en 5s (FR-1): eyebrow, H1, lede, compteur live, 2 CTA ancrés.
- **Live pulse**: point circulaire animé (opacité) sur les badges live; décoratif, n'est
  jamais la seule source d'info (la date de push l'accompagne toujours).
- **Lang switcher**: dans la nav, lien vers l'autre locale (même page).

## State Patterns

- Chargement: squelettes discrets (monogramme en gris) ou placeholder; pas de flash.
- Erreur de fetch projects.json: message `loadError` existant, conservé.
- Signal indisponible (worker/API down): badge statique "no signal" + date si connue.
- Projet sans description: fallback `descFallback` existant; note "why" peut être vide → la
  carte montre la méta, jamais une carte vide.
- Hover (desktop): fond surface, flèche révélée, léger déplacement du monogramme.
- Focus-visible: contour 2px accent sur tous les interactifs.
- Reduced-motion: toute animation coupée (opacité finale à 1), pas de reveal.

## Interaction Primitives

- Reveal au scroll (gsap, existant dispo): sections et cartes apparaissent en douceur,
  uniquement si `prefers-reduced-motion` absent.
- Micro-interactions card: flèche glisse, monogramme se décale, badge live pulse.
- Dérive du backdrop (64s/96s) conservée et légèrement renforcée.
- Durées ~200-400ms, easing cohérent; jamais bloquant.

## Accessibility Floor

- Contraste AA sur tout texte (y compris live: `live-ink` sur fond vert, accent-encre AA).
- Aucune info portée par le hover seul (mobile-safe).
- Keyboard: tous les liens/cartes tabulables, focus-visible visible.
- `prefers-reduced-motion` coupé et testé.
- Landmarks: nav, header, main, footer déjà présents; cartes en `<a>`.
- Le monogramme et le pulse sont décoratifs (aria-hidden); le signal live a un texte réel
  (date / "no signal").

## Key Flows

- **Flow 1 — Recruteur depuis un CV (UJ-1).** Arrive sur /en/. Hero: "Proof, in public." +
  compteur. Scanne la grille; une carte live pulse. Clique → le projet s'ouvre en live sur
  son propre sous-domaine. Clé: climax = la carte s'ouvre sur une vraie app, pas un
  screenshot.
- **Flow 2 — Développeur curieux (UJ-2).** Note la ligne "why it matters", voit la date de
  push, ouvre le repo, lit le code. Clé: la méta honnête (dates) construit la confiance.
- **Flow 3 — Mobile (UJ-3).** Single column, même densité d'info, pas de hover, révélation
  en défilement. Clé: le compteur live et les badges lisibles en 5s.

## Anti-patterns

- Pas de placeholders de démo, pas d'images stock, pas de "coming soon".
- Pas d'info masquée au survol (mobile).
- Pas de carte qui ressemble à une pub (pas d'éclat, pas de dégradé).
- Le brut est assumé, jamais excusé par un lorem ipsum.
