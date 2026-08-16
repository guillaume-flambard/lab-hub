// Dictionnaires FR/EN du lab. Utilisés à deux endroits :
//  - au build, par le plugin vite qui rend page.template.html en /fr/ et /en/
//  - au runtime, par main.ts (locale lue sur <html lang>)
// Le portfolio (memolabs.dev) utilise next-intl avec les mêmes locales.

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export const SITE = "https://memolabs.dev";
export const LAB = "https://lab.memolabs.dev";

export interface Dict {
  htmlLang: string;
  title: string;
  metaDesc: string;
  ogLocale: string;
  // nav
  navWork: string;
  navLab: string;
  navAbout: string;
  navContact: string;
  // hero
  eyebrow: string;
  h1: string;
  h1accent: string;
  lede: string;
  liveNow: (n: number) => string;
  howToRead: string;
  btnLive: string;
  btnLab: string;
  // footer
  legal: string;
  // sections
  liveTitle: string;
  liveLede: (n: number) => string;
  labTitle: string;
  labLede: (n: number) => string;
  explTitle: string;
  explLede: string;
  // cartes
  descFallback: string;
  loadError: (msg: string) => string;
  lastPush: (days: number) => string;
  noSignal: string;
  openLive: string;
  openRepo: string;
  status: Record<string, string>;
  statusFallback: string;
}

const fr: Dict = {
  htmlLang: "fr",
  title: "Memo Labs · Le lab",
  metaDesc:
    "Memo Labs, le lab. Tous les projets : produits en ligne, prototypes et expérimentations WIP, avec descriptions.",
  ogLocale: "fr_FR",
  navWork: "Travail",
  navLab: "Lab",
  navAbout: "À propos",
  navContact: "Contact",
  eyebrow: "Memo Labs · Le lab",
  h1: "La preuve,",
  h1accent: "en public.",
  lede:
    "Le lab, c'est là où Memo Labs livre de l'IA réelle : agents, outils, prototypes. Déployés, joignables, bruts mais vrais. Les produits finis vivent sur le {portfolioLink}.",
  liveNow: (n) => `${n} joignables maintenant`,
  howToRead: "Chaque carte s'ouvre en direct. Le brut est voulu.",
  btnLive: "En ligne",
  btnLab: "Le lab",
  legal: "Mentions légales",
  liveTitle: "En ligne",
  liveLede: (n) => `Déployés et joignables aujourd'hui, ${n} au total.`,
  labTitle: "Le lab",
  labLede: (n) => `En cours, ouvert pendant qu'il se construit : ${n} prototypes, agents et outils.`,
  explTitle: "Explorations",
  explLede: "Des pistes explorées, en pause ou fermées. Le travail continue.",
  descFallback: "Expérimentation dans le lab Memo Labs.",
  loadError: (msg) => `Impossible de charger les projets : ${msg}`,
  lastPush: (d) =>
    d === 0 ? "poussé aujourd'hui" : d === 1 ? "hier" : `il y a ${d} j`,
  noSignal: "aucun signal",
  openLive: "En direct",
  openRepo: "Code",
  status: {
    live: "En ligne",
    beta: "Beta",
    lab: "WIP",
    internal: "Interne",
    private: "Privé",
    archived: "Archivé",
  },
  statusFallback: "WIP",
};

const en: Dict = {
  htmlLang: "en",
  title: "Memo Labs · The lab",
  metaDesc:
    "Memo Labs, the lab. Every project: live products, prototypes and WIP experiments, with descriptions.",
  ogLocale: "en_US",
  navWork: "Work",
  navLab: "Lab",
  navAbout: "About",
  navContact: "Contact",
  eyebrow: "Memo Labs · The lab",
  h1: "Proof,",
  h1accent: "in public.",
  lede:
    "The lab is where Memo Labs ships real AI: agents, tools, prototypes. Deployed, reachable, rough but real. The finished products live on the {portfolioLink}.",
  liveNow: (n) => `${n} reachable now`,
  howToRead: "Every card opens live. Rough is intended.",
  btnLive: "Live",
  btnLab: "The lab",
  legal: "Legal notice",
  liveTitle: "Live",
  liveLede: (n) => `Deployed and reachable today, ${n} in total.`,
  labTitle: "The lab",
  labLede: (n) => `In progress, opened while being built: ${n} prototypes, agents and tools.`,
  explTitle: "Explorations",
  explLede: "Paths explored, parked or closed. The work goes on.",
  descFallback: "An experiment in the Memo Labs lab.",
  loadError: (msg) => `Could not load the projects: ${msg}`,
  lastPush: (d) =>
    d === 0 ? "pushed today" : d === 1 ? "yesterday" : `${d}d ago`,
  noSignal: "no signal",
  openLive: "Live",
  openRepo: "Source",
  status: {
    live: "Live",
    beta: "Beta",
    lab: "WIP",
    internal: "Internal",
    private: "Private",
    archived: "Archived",
  },
  statusFallback: "WIP",
};

export const DICTS: Record<Locale, Dict> = { fr, en };

export function isLocale(v: string | null | undefined): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

/** Locale de la page, portée par <html lang> (posée au build par vite.config.ts). */
export function currentLocale(): Locale {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : null;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

export function t(): Dict {
  return DICTS[currentLocale()];
}
