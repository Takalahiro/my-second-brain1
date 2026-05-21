# My Second Brain

[中文版 README](./README.md)

A personal knowledge-base static site that publishes an Obsidian vault as a browsable, searchable web application—with a desktop widget shell, graph explorer, and in-browser interactive tools for Python, mathematics, and neural networks.

**Live demo:** [my-second-brain1.pages.dev](https://my-second-brain1.pages.dev)

---

## Overview

This project uses a **Static Site Generation (SSG) + Islands** architecture: note content is compiled from the `obsidian-vault` git submodule at build time; rich interactions (graphs, ML inference, Pyodide, etc.) load on the client without a custom backend.

---

## Technology Stack

### Core

| Layer | Technology | Version / Notes |
|-------|------------|-----------------|
| Meta-framework | [Astro](https://astro.build/) | 6.x — SSG, Content Collections, MDX |
| Interactive UI | [Svelte](https://svelte.dev/) | 5.x — Runes, client islands |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 4.x — `@tailwindcss/vite` |
| Language | TypeScript | 6.x |
| Package manager | pnpm | 11.x (`packageManager` field) |
| Runtime | Node.js | ≥ 22.12 (`.nvmrc` → 22.22.0) |

### Content & Markdown

| Feature | Dependencies |
|---------|--------------|
| Wiki links | `remark-wiki-link` |
| Obsidian callouts | `remark-obsidian-callout` |
| Image embeds `![[…]]` | Custom `remark-obsidian-image.mjs` |
| Math | `remark-math` + `rehype-katex` + `remark-normalize-math.mjs` |
| Mermaid | `remark-mermaid.mjs` + `mermaid@11` |
| Syntax highlighting | Astro built-in Shiki |

### Interactive & Compute

| Module | Technology |
|--------|------------|
| Graph explorer | Cytoscape.js, custom multi-view layouts |
| Matrix / expressions | `mathjs`, `fraction.js` |
| Handwritten digits (CNN) | TensorFlow.js, Three.js (3D viz) |
| Formula OCR | `@huggingface/transformers` (FormulaNet), Web Worker |
| Symbolic solver | Pyodide + SymPy (`formula-solver.py`) |
| Python IDE | Pyodide + `sys.settrace` + Python `ast` |
| Whiteboard | Excalidraw (embedded) |

### Deployment

- **Cloudflare Pages** — static hosting, cache rules in `public/_headers`
- **Git Submodule** — `obsidian-vault` as a separate repo, synced at build time

---

## Prerequisites for Reproduction

To develop, extend, or deploy locally, the following background is recommended (depth can vary by module):

### Required

| Area | Expectation |
|------|-------------|
| **HTML / CSS / JavaScript** | ES2022+, modules, async programming |
| **TypeScript** | Types, generics, module resolution |
| **Git** | Submodules, basic workflows |
| **Node.js ecosystem** | pnpm, npm scripts, Vite basics |
| **Markdown** | GFM, front matter |

### Framework-related

| Area | Expectation |
|------|-------------|
| **Astro** | Routing, `client:*` directives, Content Collections, MDX |
| **Svelte 5** | Runes (`$state` / `$derived` / `$effect`), component APIs |
| **Tailwind CSS** | Utility classes, responsive design, CSS variables |
| **remark / rehype** | Unified plugin pipelines, MDAST/HAST basics |

### By feature module

| Module | Suggested knowledge |
|--------|---------------------|
| Notes / WikiLinks | Obsidian syntax, slug normalization, static routing |
| Graph explorer | Graph theory basics, force-directed layouts, JSON graph data |
| MATLAB calculator | Linear algebra, calculus, probability; matrix algorithms |
| Python IDE | CPython execution model, `sys.settrace`, AST |
| Handwritten digits | CNN basics, MNIST, TensorFlow.js Layers API |
| Formula OCR | Image preprocessing, encoder-decoder OCR, LaTeX |
| Formula solver | Computer algebra systems (CAS), SymPy, LaTeX→expression |
| MNIST training | Keras / TF.js model export (optional) |

### Environment & tools

- **Python 3.10+** — for `pnpm model:export-mnist` (`tensorflow`, `Pillow`)
- **Obsidian** (optional) — editing vault content
- Modern browser — WebGL, WebGPU (optional), Web Workers, ES modules

---

## Quick Start

```bash
git clone --recursive https://github.com/Takalahiro/my-second-brain1.git
cd my-second-brain1
pnpm install
pnpm dev    # http://localhost:4321
```

```bash
pnpm build          # production build → dist/
pnpm preview        # local preview
pnpm check:25mib    # verify tracked files ≤ 25 MiB
pnpm check:self http://localhost:4321   # route smoke test (preview must be running)
```

---

## Repository Layout

```
my-second-brain/
├── astro.config.mjs       # Markdown plugins, Vite chunking
├── obsidian-vault/        # git submodule — note source
├── public/
│   ├── models/mnist/      # TF.js weights
│   └── _headers           # Cloudflare cache headers
├── scripts/               # build & vault maintenance
├── src/
│   ├── content.config.ts  # notes collection
│   ├── pages/             # routes
│   ├── components/        # UI components
│   ├── lib/               # business logic, ML, Markdown plugins
│   └── data/              # build-time JSON artifacts
└── docs/                  # vault sync docs, etc.
```

---

## Core Implementation Notes

### 1. Build pipeline (`prepare:vault`)

Runs before every `dev` / `build`:

1. Validate and initialize the `obsidian-vault` submodule
2. `git fetch --unshallow` in CI for accurate note git history
3. Sync vault assets → `public/vault-assets/`
4. Generate `notes-mtime.json`, `stats.json`, `wikilinks.json`, `media-manifest.json`

Astro Content Layer reads `**/*.md` from the vault and emits static HTML through the remark/rehype pipeline.

### 2. Notes & WikiLinks

```
obsidian-vault/*.md
  → remark-wiki-link ([[page]] → /notes/{slug})
  → remark-obsidian-image (![[img]] → /vault-assets/…)
  → rehype-katex ($…$ → KaTeX HTML)
  → static pages + Backlinks component
```

Existing notes render as blue links; missing targets as red “stub” links.

### 3. Python IDE — step-by-step explanation (`/python`)

```
User code
  → Pyodide runs run_traced()
  → sys.settrace captures line / call / return events
  → ast.parse generates human-readable step descriptions
  → JSON steps returned to the client
  → PythonStepPanel playback + editor line highlighting
```

Explanations are **rule-based AST templates**, not LLM-generated (assignments, loops, `print`, calls, etc.).

### 4. Neural Lab (`/digits`)

#### Handwritten digits · MNIST

```
280×280 canvas
  → mnist-preprocess (direct scale | crop + thicken)  // dual-path high accuracy
  → TF.js LeNet inference + vizModel layer outputs
  → NetworkPanel: SVG diagram / 2D feature maps / Three.js 3D
  → PredictionBars: Softmax confidence
```

Switching to the formula tab releases TF.js GPU to avoid contention with the OCR worker (WebGPU).

#### Math formulas · FormulaNet + SymPy

```
384×384 canvas
  → Web Worker: Transformers.js + FormulaNet OCR
  → dual preprocessing (thicken / no thicken) + latexQualityScore selection
  → MathJax LaTeX preview
  → Pyodide loads formula-solver.py
  → SymPy: integrals, derivatives, equations, normal CDF Φ(x)
```

FormulaNet is **downloaded at runtime** from Hugging Face (not in git); SymPy loads on demand via Pyodide CDN.

### 5. MATLAB calculator (`/matlab`)

| Tab | Implementation |
|-----|----------------|
| Matrix | Step-by-step elimination engine (`src/lib/matrix/`), KaTeX display |
| Calculus | Symbolic steps + Canvas 2D plots |
| Discrete math | Logic expression parsing & truth tables |
| Statistics | Distribution sampling, hypothesis-test steps |
| Expressions | `mathjs` evaluation & function plotting |

Sub-modules are lazy-loaded to reduce initial bundle size.

### 6. Graph explorer (`/graph`)

At build time, `build-wikilinks.mjs` scans all `[[wikilinks]]` and writes `wikilinks.json` (nodes + edges). `GraphExplorer` renders force-directed, radial, cluster, and other views entirely on the client.

---

## Routes

| Path | Feature |
|------|---------|
| `/` | Desktop home (WidgetHost) |
| `/notes/*` | Note pages |
| `/graph` | Graph explorer |
| `/python` | Python IDE |
| `/matlab` | Math calculator |
| `/digits` | Neural Lab |
| `/digits?demo=formula` | Formula OCR + SymPy |
| `/whiteboard` | Excalidraw whiteboard |

---

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm model:export-mnist` | Train & export MNIST TF.js model |
| `pnpm vault:sync "msg"` | Sync vault submodule |
| `pnpm check:25mib` | Single-file size audit |

See [docs/VAULT_SYNC.md](docs/VAULT_SYNC.md) for vault synchronization.

---

## Cloudflare Pages Deployment

| Setting | Value |
|---------|-------|
| Build command | `pnpm build` |
| Output directory | `dist` |
| Node version | 22.x |
| **Include git submodules** | **Required** |

---

## Models & Size Constraints

| Asset | Source | Notes |
|-------|--------|-------|
| MNIST LeNet | `public/models/mnist/` | In repo, ~879 KB |
| FormulaNet | Hugging Face CDN | Runtime download, ~77 MiB |
| SymPy | Pyodide CDN | ~10–20 MB on first solve |

Tracked files must be ≤ 25 MiB per file (Cloudflare Pages). See `scripts/check-25mib.mjs`.

---

## License

This project is licensed under the **[MIT License](./LICENSE)**.

You may use, modify, and distribute this software freely, provided the copyright notice and license text are included. Note content in `obsidian-vault` may be under separate terms—refer to that repository.

---

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/Takalahiro/my-second-brain1).

- Author: Takahiro
- Repository: [Takalahiro/my-second-brain1](https://github.com/Takalahiro/my-second-brain1)
