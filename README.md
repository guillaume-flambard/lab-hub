# lab-hub

Le playground de Memo Labs, déployé sur [lab.memolabs.dev](https://lab.memolabs.dev).
Site statique (Vite + TypeScript, sans framework) qui lit `public/projects.json` et
affiche les projets par statut, avec l'identité « preuve vivante » : cartes riches
(monogramme déterministe, note FR/EN, signal live via la date de push GitHub), compteur
live, motion décorative (reveal au scroll, micro-interactions, pulse).

## Commandes

```bash
npm run dev      # serveur de dev (redirige / vers /fr/)
npm run build    # tsc + vite build -> dist/fr/ et dist/en/
npm run preview  # sert le build
npm run refresh  # recopie ../lab-infra/docs/projects.public.json dans public/
```

Le référentiel est généré par `lab-infra/scripts/audit-repos.py` : notes FR/EN curées
dans `lab-infra/docs/lab-notes.json`, date de push GitHub ajoutée au build. lab-hub est
un consommateur en lecture seule du fichier public (jamais le référentiel privé).

## Bilingue FR / EN

Le site est servi en deux locales, comme le portfolio (`next-intl`, `localePrefix: always`) :
`lab.memolabs.dev/fr/` et `lab.memolabs.dev/en/`. La racine `/` redirige en 302 vers
la locale du navigateur (`Accept-Language` commençant par `en` donne `/en/`, sinon `/fr/`).

Le mécanisme tient en quatre fichiers :

| Fichier | Rôle |
|---|---|
| `src/i18n.ts` | les deux dictionnaires, plus `currentLocale()` qui lit `<html lang>` |
| `src/page.template.html` | le balisage partagé, avec des marqueurs `{{clé}}`. Pas une entrée de build |
| `fr/index.html`, `en/index.html` | stubs, une entrée de build chacun. Ne rien y écrire |
| `vite.config.ts` | le plugin `i18n-html` rend le template pour chaque locale (hook `transformIndexHtml`, `order: "pre"`, donc avant que Vite ne parse le HTML et repère le point d'entrée JS) |

Pour ajouter ou changer une chaîne : la déclarer dans l'interface `Dict` de `src/i18n.ts`,
la remplir dans les deux dictionnaires, puis l'utiliser soit via `{{clé}}` dans le template
(en l'ajoutant à `values()` dans `vite.config.ts`), soit via `t()` dans `main.ts`.

Les notes « why it matters » viennent de `projects.json` (champ `notes`, FR/EN curées) ;
le champ `description` vient des repos GitHub, il n'est pas traduit.

## Design

Le contrat visuel : `_bmad-output/planning-artifacts/ux-designs/ux-lab-hub-2026-08-16/DESIGN.md`
(et `EXPERIENCE.md` pour les comportements). Maquette de référence Open Design +
captures dans `design/` (`lab-homepage-reference.html`, `preview-en*.png`).

## Déploiement

`Dockerfile` multi-étapes : build Node 22, puis nginx qui sert `dist/` avec `nginx.conf`
(redirection de langue à la racine, `/fr` et `/en` sans slash final redirigés en 301,
cache long sur `/assets/`, pas de cache sur `/projects.json`).
