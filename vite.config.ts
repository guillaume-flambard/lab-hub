import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { DEFAULT_LOCALE, DICTS, LAB, LOCALES, SITE, isLocale, type Locale } from "./src/i18n";

const root = fileURLToPath(new URL(".", import.meta.url));
const TEMPLATE = `${root}src/page.template.html`;

function escapeAttr(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Locale déduite du chemin de l'entrée HTML ("/fr/index.html", "/en/"). */
function localeOf(path: string): Locale {
  const seg = path.split("/").filter(Boolean)[0];
  return isLocale(seg) ? seg : DEFAULT_LOCALE;
}

function langSwitch(current: Locale): string {
  return LOCALES.map(
    (l) => `<a href="/${l}/"${l === current ? ' class="on" aria-current="true"' : ""}>${l.toUpperCase()}</a>`
  ).join(" / ");
}

function values(locale: Locale): Record<string, string> {
  const d = DICTS[locale];
  const site = `${SITE}/${locale}`;
  return {
    htmlLang: d.htmlLang,
    title: escapeAttr(d.title),
    metaDesc: escapeAttr(d.metaDesc),
    ogLocale: d.ogLocale,
    canonical: `${LAB}/${locale}/`,
    siteLocale: site,
    labLocale: `/${locale}`,
    navWork: d.navWork,
    navLab: d.navLab,
    navAbout: d.navAbout,
    navContact: d.navContact,
    langSwitch: langSwitch(locale),
    eyebrow: d.eyebrow,
    h1: d.h1,
    h1accent: d.h1accent,
    lede: d.lede.replace(
      "{portfolioLink}",
      `<a class="txtlink" href="${site}/work">portfolio</a>`
    ),
    btnLive: d.btnLive,
    btnLab: d.btnLab,
    legal: d.legal,
  };
}

/**
 * Rend src/page.template.html pour chaque entrée locale (fr/, en/).
 * order "pre" : la substitution a lieu avant que Vite ne parse le HTML, donc
 * le <script type="module"> du template est bien pris comme point d'entrée.
 */
function i18nHtml(): Plugin {
  return {
    name: "i18n-html",
    transformIndexHtml: {
      order: "pre",
      handler(_html, ctx) {
        const vals = values(localeOf(ctx.path));
        return readFileSync(TEMPLATE, "utf8").replace(
          /\{\{(\w+)\}\}/g,
          (whole, key: string) => vals[key] ?? whole
        );
      },
    },
    configureServer(server) {
      // en dev, "/" n'existe pas (MPA) : on envoie vers la locale par défaut
      server.middlewares.use((req, res, next) => {
        if (req.url === "/" || req.url === "") {
          res.writeHead(302, { Location: `/${DEFAULT_LOCALE}/` });
          res.end();
          return;
        }
        next();
      });
    },
    handleHotUpdate({ file, server }) {
      if (file === TEMPLATE) server.ws.send({ type: "full-reload" });
    },
  };
}

export default defineConfig({
  appType: "mpa",
  plugins: [i18nHtml()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(LOCALES.map((l) => [l, `${root}${l}/index.html`])),
    },
  },
});
