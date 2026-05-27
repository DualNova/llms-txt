# @dualnova/llms-txt

> Parse, validate, and generate `/llms.txt` files — the emerging standard for guiding AI search crawlers (ChatGPT, Perplexity, Claude, Gemini).

[![npm](https://img.shields.io/npm/v/@dualnova/llms-txt.svg)](https://www.npmjs.com/package/@dualnova/llms-txt)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/DualNova/llms-txt.svg?style=social)](https://github.com/DualNova/llms-txt)

A tiny TypeScript library and CLI for working with `/llms.txt` files. Zero runtime dependencies, ESM-only, Node 20+.

> 🇪🇸 **¿Español?** Lee este README en [español más abajo](#-leeme-en-español).

---

## What is `llms.txt`?

`llms.txt` is an emerging convention (see [llmstxt.org](https://llmstxt.org)) that publishes a Markdown summary of a site at the well-known path `/llms.txt`. The goal is to give AI assistants and crawlers a curated, low-noise view of the site — the equivalent of `robots.txt` but for LLM-friendly content discovery.

A minimal example:

```markdown
# Example Site

> A short summary of what this site is and who it is for.

## Key pages

- [Home](https://example.com/): main landing page
- [About](https://example.com/about): team and mission
- [Pricing](https://example.com/pricing)
```

### Honest note on impact (May 2026)

As of this writing, primary sources from Google (John Mueller, Gary Illyes), the [SE Ranking 300k-domain study](https://seranking.com/blog/llms-txt-research/) and the OtterlyAI server-log audit report that **no major AI search engine currently uses `llms.txt` as a citation-ranking signal**. The file is still worth publishing as a low-cost, declarative statement of intent that may be adopted as the standard matures. This library treats `llms.txt` as a useful piece of site hygiene, not a silver bullet.

If you want measurable AI search visibility today, focus on these in order:

1. **Unblock AI crawlers in `robots.txt`** (`GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`).
2. **Publish 134-167 word citable passages** with the "X is [definition]" pattern on key pages.
3. **Build brand mentions on Reddit, YouTube, and Wikipedia** — these correlate 3× more strongly with AI citations than backlinks (Ahrefs Dec 2025 study, n=75,000 brands).
4. **Publish `llms.txt`** — this library.

## Install

```sh
npm install @dualnova/llms-txt
# or
pnpm add @dualnova/llms-txt
# or run the CLI without installing
npx @dualnova/llms-txt validate https://example.com/llms.txt
```

## CLI

```sh
# Validate the llms.txt in the current directory
llms-txt validate

# Validate a specific local file
llms-txt validate ./public/llms.txt

# Fetch and validate a remote one
llms-txt validate --url https://dualnova.org/llms.txt

# Show help
llms-txt --help
```

Sample output:

```
Validating /Users/me/site/public/llms.txt
  Title:        DualNova
  Description:  DualNova is a blockchain and AI software development company …
  Sections:     5
  Links:        18

WARN  Section "Recent client work" has no links and no content. (sections[3])

✓ 0 error(s), 1 warning(s)
```

Exit codes:

| Code | Meaning |
|------|---------|
| `0`  | No errors. Warnings may still be printed. |
| `1`  | Validation errors found, or invalid CLI arguments. |
| `2`  | Could not read the file or fetch the URL. |

## Programmatic API

### Validate

```typescript
import { validateLlmsTxt } from '@dualnova/llms-txt';
import { readFileSync } from 'node:fs';

const source = readFileSync('./public/llms.txt', 'utf8');
const { valid, issues, parsed } = validateLlmsTxt(source);

if (!valid) {
  for (const issue of issues.filter(i => i.severity === 'error')) {
    console.error(`✗ ${issue.message}`);
  }
  process.exit(1);
}

console.log(`Parsed ${parsed.sections.length} sections.`);
```

### Parse

```typescript
import { parseLlmsTxt } from '@dualnova/llms-txt';

const { title, description, sections } = parseLlmsTxt(source);
for (const section of sections) {
  console.log(`## ${section.heading}`);
  for (const link of section.links) {
    console.log(`  - ${link.title}: ${link.url}`);
  }
}
```

### Build

Generate `llms.txt` from typed input — useful in build pipelines that read from a CMS, sitemap, or MDX frontmatter.

```typescript
import { buildLlmsTxt } from '@dualnova/llms-txt';
import { writeFileSync } from 'node:fs';

const md = buildLlmsTxt({
  title: 'Acme Robotics',
  description: 'Acme Robotics builds autonomous mobile robots for warehouse logistics.',
  intro: 'Founded in 2021. HQ in Pittsburgh, PA.',
  sections: [
    {
      heading: 'Key pages',
      links: [
        { title: 'Home', url: 'https://acme-robotics.example/', description: 'overview' },
        { title: 'Products', url: 'https://acme-robotics.example/products' },
      ],
    },
  ],
});

writeFileSync('./public/llms.txt', md);
```

### Use in a Next.js build

Add a route at `app/llms.txt/route.ts`:

```typescript
import { buildLlmsTxt } from '@dualnova/llms-txt';

export function GET() {
  const body = buildLlmsTxt({
    title: 'My Site',
    description: 'One-sentence summary.',
    sections: [
      { heading: 'Pages', links: [{ title: 'Home', url: 'https://my-site.example/' }] },
    ],
  });
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

export const dynamic = 'force-static';
```

### Use in CI to fail builds on broken llms.txt

```yaml
# .github/workflows/llms-txt.yml
name: Validate llms.txt
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npx -y @dualnova/llms-txt validate ./public/llms.txt
```

## Types

```typescript
interface ParsedLlmsTxt {
  title: string;
  description?: string;
  intro: string;
  sections: LlmsSection[];
}

interface LlmsSection {
  heading: string;
  links: LlmsLink[];
  freeform: string;
}

interface LlmsLink {
  title: string;
  url: string;
  description?: string;
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  at?: string;
}
```

## Examples in this repo

- [`examples/minimal.txt`](examples/minimal.txt) — bare minimum that passes validation
- [`examples/full.txt`](examples/full.txt) — a realistic small-company example

## Contributing

PRs welcome — please open an issue first for non-trivial changes. The codebase is intentionally tiny (3 files in `src/`, no runtime deps). Tests use Node's built-in test runner.

## License

[MIT](LICENSE) © [DualNova LLC](https://dualnova.org)

---

## 🇪🇸 Léeme en español

### ¿Qué es `llms.txt`?

`llms.txt` es una convención emergente (ver [llmstxt.org](https://llmstxt.org)) que publica un resumen en Markdown del sitio en la ruta well-known `/llms.txt`. El objetivo es darle a los crawlers e IA una vista curada y de bajo ruido del sitio — el equivalente de `robots.txt` pero para descubrimiento de contenido amigable para LLMs.

### Nota honesta sobre impacto (mayo 2026)

A la fecha, fuentes primarias de Google (John Mueller, Gary Illyes), el [estudio de SE Ranking con 300k dominios](https://seranking.com/blog/llms-txt-research/) y la auditoría de logs de OtterlyAI reportan que **ningún motor de búsqueda AI mayor usa hoy `llms.txt` como señal de ranking de citaciones**. Vale la pena publicarlo igual como declaración de bajo costo de intención que puede adoptarse a medida que madura el standard. Esta librería trata a `llms.txt` como higiene útil del sitio, no como bala de plata.

Si quieres visibilidad medible en AI search HOY, prioriza en este orden:

1. **Desbloquea los AI crawlers en `robots.txt`** (`GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`).
2. **Publica pasajes citables de 134-167 palabras** con el patrón "X es [definición]" en páginas clave.
3. **Construye menciones de marca en Reddit, YouTube y Wikipedia** — estas correlacionan 3× más con citaciones AI que los backlinks (estudio Ahrefs Dic 2025, n=75,000 marcas).
4. **Publica `llms.txt`** — esta librería.

### Instalación y uso

Los ejemplos arriba aplican igual. La CLI tiene la misma sintaxis. Toda la documentación de la API es traducible directamente.

```sh
npm install @dualnova/llms-txt
npx @dualnova/llms-txt validate ./public/llms.txt
```

### Licencia

[MIT](LICENSE) © [DualNova LLC](https://dualnova.org) — equipo bilingüe (español + inglés) basado en Caracas, Bogotá y Miami. Construido como parte del esfuerzo abierto de Generative Engine Optimization (GEO) que mantenemos en [dualnova.org](https://dualnova.org).

---

**Built by [DualNova](https://dualnova.org)** — blockchain and AI software development for LATAM and the US.
