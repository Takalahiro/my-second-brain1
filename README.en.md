# My Second Brain

[中文版 README](./README.md) · [Technical Report](./docs/TECHNICAL_REPORT.md)

A personal knowledge-base static site that publishes an Obsidian vault as a browsable, searchable web app—with a **desktop OS shell** (wallpaper, widgets, Control Center) and **in-browser interactive tools** (Python, math labs, neural networks, graph explorer, and more).

**Live demo:** [my-second-brain1.pages.dev](https://my-second-brain1.pages.dev)  
**Current version:** 1.5.0 · **License:** [MIT](./LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Outline](#architecture-outline)
- [Quick Start](#quick-start)
- [Repository Layout](#repository-layout)
- [Routes & Pages](#routes--pages)
- [Core Modules](#core-modules)
- [UI Skins (13 themes)](#ui-skins-13-themes)
- [Desktop Widgets](#desktop-widgets)
- [Common Commands](#common-commands)
- [Deployment](#deployment-cloudflare-pages)
- [Models & Size Constraints](#models--size-constraints)
- [Documentation Index](#documentation-index)
- [Prerequisites](#prerequisites)
- [License](#license)
- [Contributing](#contributing)

---

## Overview

This project uses a **Static Site Generation (SSG) + Islands** architecture:

| Dimension | Approach |
|-----------|----------|
| Content | Obsidian vault (git submodule) compiled to HTML at **build time** |
| Interaction | Svelte 5 components loaded **on demand** in the browser (graph, ML, Pyodide, 3DGS, etc.) |
| Backend | **No custom backend**; runtime reads JSON + localStorage only |
| Deployment | Cloudflare Pages static hosting |

What sets it apart from a typical static blog or 3D demo:

- **PKM + personal OS shell** share one domain and persistent state
- **3D Gaussian Splatting** as a full-screen ambient wallpaper, not a standalone viewer
- **13 UI skins**, 11 of them immersive with NASA-punk-style mission chrome (status strip, CLI search, scroll altimeter)
- **Unified design system**: semantic CSS variables align sub-pages with the mac desktop skin (color, type, spacing, radius, shadow)
- Multiple GPU / Worker compute stacks coexist via **tab-level and visibility-level resource arbitration**

---

## Features

### Knowledge base (PKM)

- Obsidian Markdown → static note pages (`/notes/*`)
- Wiki links `[[page]]`, callouts, `![[image]]` embeds
- KaTeX math, Mermaid diagrams, GFM tables
- Backlinks, outline, tag / folder browsing
- Build-time wikilink graph → Graph Explorer

### Desktop OS shell

- Draggable, resizable widgets with persistent layout
- Three mutually exclusive wallpaper modes: **video / poster / 3DGS point cloud**
- HUD-exclusive Canvas live wallpaper (starfield, nebula, parallax)
- Control Center: widget toggles, wallpaper settings, UI skin picker, Spotlight search
- Atmosphere layers: rain drops, sakura, white noise, global mute

### In-browser tools

| Tool | Path | Highlights |
|------|------|------------|
| Python IDE | `/python` | Pyodide + `sys.settrace` + AST step-by-step explanations |
| Math calculator | `/matlab` | Matrix / calculus / discrete / statistics / expressions |
| Neural Lab | `/digits` | TF.js MNIST + Three.js 3D visualization |
| Formula OCR + solver | `/digits?demo=formula` | Transformers.js FormulaNet + Pyodide SymPy |
| Graph explorer | `/graph` | Cytoscape.js multi-view layouts |
| Whiteboard | `/whiteboard` | Embedded Excalidraw |
| Teaching hub | `/teaching` | Calculus and other course module entry points |

### Note-page tools (separate from desktop)

On `/notes/*`, `/folder/*`, and `/tags/*`, a FAB drawer enables Python, MATLAB, and whiteboard tools. State key `second-brain:notes-tools` is independent from desktop widgets.

---

## Technology Stack

### Core

| Layer | Technology | Version / Notes |
|-------|------------|-----------------|
| Meta-framework | [Astro](https://astro.build/) | 6.x — SSG, Content Collections, MDX |
| Interactive UI | [Svelte](https://svelte.dev/) | 5.x — Runes (`$state` / `$derived` / `$effect`) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 4.x — `@tailwindcss/vite` |
| Language | TypeScript | 6.x |
| Package manager | pnpm | 11.x (`packageManager` field) |
| Runtime | Node.js | ≥ 22.12 (`.nvmrc` → 22.22.0) |

### Content & Markdown pipeline

| Feature | Dependency / Module |
|---------|---------------------|
| Wiki links | `remark-wiki-link` |
| Obsidian callouts | `remark-obsidian-callout` |
| Image embeds `![[…]]` | Custom `remark-obsidian-image.mjs` |
| Math | `remark-math` + `remark-normalize-math.mjs` + `rehype-katex` |
| Mermaid | `remark-mermaid.mjs` + `mermaid@11` |
| Heading anchors | `rehype-slug` + `rehype-autolink-headings` |
| Table wrappers | `rehype-wrap-tables.mjs` |
| Syntax highlighting | Astro built-in Shiki |

### Interactive, visualization & compute

| Module | Technology |
|--------|------------|
| Graph explorer | Cytoscape.js, custom layouts (force / radial / cluster / territory map) |
| Matrix / expressions | `mathjs`, `fraction.js`, custom step-by-step elimination engine |
| Handwritten digits (CNN) | TensorFlow.js, Three.js (3D viz) |
| 3DGS ambient wallpaper | `@mkkellogg/gaussian-splats-3d`, Three.js, `spatial-camera.ts` |
| HUD Canvas wallpaper | Custom `hud-wallpaper-engine.ts` (Canvas 2D) |
| Formula OCR | `@huggingface/transformers` (FormulaNet), Web Worker |
| Symbolic solver | Pyodide + SymPy (`formula-solver.py`) |
| Python IDE | Pyodide + `sys.settrace` + Python `ast` |
| Whiteboard | Embedded Excalidraw |
| Icons | Lucide + custom PixelIcon (font-bound dual icons) |
| i18n | Custom `zh` / `en` message catalogs |

### Deployment & ops

| Item | Approach |
|------|----------|
| Hosting | Cloudflare Pages → `dist/` |
| Caching | `public/_headers` (short HTML cache / long-lived assets) |
| Note source | Git submodule `obsidian-vault` |
| Size audit | `pnpm check:25mib` (≤ 25 MiB per tracked file) |
| Route smoke test | `pnpm check:self` (Playwright) |

---

## Architecture Outline

```
┌─────────────────────────────────────────────────────────────┐
│  Routes: pages/ (Astro) — index / notes / graph / tools …   │
├─────────────────────────────────────────────────────────────┤
│  Layouts: BaseLayout / DesktopLayout / ToolLayout             │
├─────────────────────────────────────────────────────────────┤
│  UI: WidgetHost / NotesToolHost / note components / tools   │
├─────────────────────────────────────────────────────────────┤
│  Skins: features/ui — 13 themes + Skin Chrome mission layer │
├─────────────────────────────────────────────────────────────┤
│  State: localStorage — widgets / notes-tools / ui-skin / bg │
├─────────────────────────────────────────────────────────────┤
│  Wallpaper: BackgroundLayer — video | poster | 3DGS | HUD     │
├─────────────────────────────────────────────────────────────┤
│  Build artifacts: wikilinks.json / stats.json / media-manifest│
├─────────────────────────────────────────────────────────────┤
│  Content: obsidian-vault (submodule) → Content Collections    │
└─────────────────────────────────────────────────────────────┘
```

**Build pipeline (before every `dev` / `build`):**

```
pnpm prepare:vault
  → validate obsidian-vault submodule
  → sync vault-assets → public/vault-assets/
  → generate notes-mtime.json / stats.json / wikilinks.json / media-manifest.json
  → Astro Content Layer reads **/*.md → remark/rehype → static HTML
```

Full design details: **[docs/TECHNICAL_REPORT.md](./docs/TECHNICAL_REPORT.md)**.

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

> **Note:** Clone with `--recursive` to fetch the `obsidian-vault` submodule. Cloudflare Pages must enable **Include git submodules**.

---

## Repository Layout

```
my-second-brain/
├── astro.config.mjs          # Markdown plugins, Vite manualChunks
├── package.json              # v1.4.0
├── obsidian-vault/           # git submodule — note source
├── public/
│   ├── models/mnist/         # TF.js LeNet weights (~879 KB)
│   ├── ply/                  # 3DGS scenes (*.sog in repo; *.ply at deploy time)
│   ├── video/ picture/ music/
│   ├── vault-assets/         # synced from vault at build time
│   └── _headers              # Cloudflare cache rules
├── scripts/                  # build, vault sync, 3DGS conversion, self-check
├── docs/                     # technical docs, vault sync, wikilink reports
└── src/
    ├── content.config.ts     # notes Content Collection
    ├── pages/                # Astro routes
    ├── layouts/              # BaseLayout / DesktopLayout / ToolLayout
    ├── components/           # widgets, desktop shell, labs, notes UI
    ├── features/             # ui skins, wallpaper engine
    ├── lib/                  # engines, ML, markdown plugins, i18n
    ├── data/                 # build-time JSON artifacts
    └── styles/               # globals + ui/skins/*.css (13 themes)
```

---

## Routes & Pages

| Path | Feature |
|------|---------|
| `/` | Desktop home (WidgetHost + MacMenuBar) |
| `/notes` | Note index |
| `/notes/*` | Note detail (wikilinks, outline, backlinks) |
| `/folder/*` | Folder browsing |
| `/tags` `/tags/*` | Tag index and tag pages |
| `/graph` | Graph explorer |
| `/python` | Python IDE (step-by-step explanations) |
| `/matlab` | Math calculator |
| `/digits` | Neural Lab (MNIST) |
| `/digits?demo=formula` | Formula OCR + SymPy solver |
| `/formula` | Standalone formula recognition page |
| `/whiteboard` | Excalidraw whiteboard |
| `/teaching` | Teaching hub |
| `/data/notes.json` | Note metadata API |
| `/data/wikilinks.json` | Wikilink graph API |
| `/data/media.json` | Media manifest API |

---

## Core Modules

### 1. Notes & WikiLinks

```
obsidian-vault/**/*.md
  → remark-wiki-link ([[page]] → /notes/{slug})
  → remark-obsidian-image (![[img]] → /vault-assets/…)
  → remark-normalize-math → rehype-katex
  → remark-mermaid → static HTML + Backlinks
```

Existing notes → blue links; missing targets → red stub links.

### 2. Python IDE (`/python`)

```
User code → Pyodide run_traced()
  → sys.settrace captures line/call/return
  → ast.parse generates rule-based step descriptions (not LLM)
  → JSON steps → PythonStepPanel playback
```

### 3. Neural Lab (`/digits`)

**MNIST:** 280×280 canvas → dual-path preprocessing → TF.js LeNet → SVG / 2D / Three.js 3D viz  
**FormulaNet:** Web Worker + Transformers.js OCR → LaTeX → Pyodide SymPy  
**Resource arbitration:** leaving the CNN tab calls `tf.dispose()` before OCR uses WebGPU.

### 4. MATLAB calculator (`/matlab`)

| Tab | Implementation |
|-----|----------------|
| Matrix | Step-by-step elimination (`src/lib/matrix/`) + KaTeX |
| Calculus | Symbolic steps + Canvas 2D plots |
| Discrete math | Logic expressions + truth tables |
| Statistics | Distribution sampling, hypothesis-test steps |
| Expressions | `mathjs` evaluation + function plotting |

### 5. Graph explorer (`/graph`)

Build-time `build-wikilinks.mjs` scans all `[[wikilinks]]` → `wikilinks.json`.  
`GraphExplorer` renders force-directed, radial, cluster, and territory map views on the client.

### 6. Three-mode wallpaper + 3DGS

| Mode | Behavior |
|------|----------|
| `video` | Looping MP4 (optional rain variant) |
| `poster` | Static scene poster |
| `ply` | 3D Gaussian Splatting full-screen ambient wallpaper |

Large PLY files (~63 MiB) are not committed; upload to `public/ply/` at deploy time. See [docs/TECHNICAL_REPORT.md §5](./docs/TECHNICAL_REPORT.md).

---

## UI Skins (13 themes)

Control Center → **UI Switch** previews and persists to `second-brain:ui-skin`.

| ID | Name | Type | Character |
|----|------|------|-----------|
| `mac` | Classic Mac | Classic | SF-style rounded chrome |
| `glass` | Liquid Glass | Classic | visionOS frosted glass |
| `pixel` | Game Boy | Immersive | Pixel green, RPG-style status strip |
| `hud` | NASA-punk HUD | Immersive | Canvas live wallpaper, mission status strip |
| `blueprint` | Engineering Blueprint | Immersive | Blueprint grid, hover dimension labels |
| `scholar` | Scholar Manuscript | Immersive | Parchment, Garamond, binding margin |
| `terminal` | Terminal CLI | Immersive | Phosphor green, `:open` search prefix |
| `crt` | CRT Retro | Immersive | Amber scanlines, subtle flicker |
| `observatory` | Observatory | Immersive | Midnight star chart, DEC altimeter |
| `herbarium` | Herbarium | Immersive | Specimen grid, botanical green |
| `ink` | Ink Classics | Immersive | Rice paper, seal-style headings |
| `rpg` | RPG Panel | Immersive | Gold-bordered skill frames, XP bar |
| `spacecraft` | Spacecraft | Immersive | ISS porthole, instrument blue |

**Immersive skins (11)** share the **Skin Chrome** system: 22px status strip, 44px full menu bar, right-side scroll altimeter, CLI search prefixes, Control Center pinned to the **right edge**.

Source: `src/features/ui/`, `src/styles/ui/skins/`, `src/styles/ui/skin-chrome-*.css`

---

## Desktop Widgets

Managed by `WidgetHost.svelte`, persisted under `second-brain:widgets`.

| Widget | Description |
|--------|-------------|
| background | Wallpaper layer (video / poster / 3DGS) |
| clock | Pixel clock (draggable, pinnable) |
| music | Local music player |
| notes / todo / calendar | Quick notes, todos, calendar |
| pomodoro / weather / stats | Pomodoro, weather, site stats |
| world | World clock |
| graph / territory | Graph explorer, folder map |
| calculator / python / whiteboard | MATLAB, Python, whiteboard |
| whitenoise / network | White noise, network info |

---

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server (runs `prepare:vault`) |
| `pnpm build` | Production build → `dist/` |
| `pnpm preview` | Preview build locally |
| `pnpm prepare:vault` | Run vault sync and JSON generation |
| `pnpm vault:sync "msg"` | Commit and push vault submodule |
| `pnpm vault:pull` | Pull vault updates |
| `pnpm vault:audit` | Vault health audit |
| `pnpm model:export-mnist` | Train and export MNIST TF.js model |
| `pnpm check:25mib` | Tracked file size audit |
| `pnpm check:self <url>` | Route and JSON endpoint smoke test |

See [docs/VAULT_SYNC.md](docs/VAULT_SYNC.md) for vault synchronization.

---

## Deployment (Cloudflare Pages)

| Setting | Value |
|---------|-------|
| Build command | `pnpm build` |
| Output directory | `dist` |
| Node version | 22.x |
| **Include git submodules** | **Required** |
| Large PLY files | Upload `public/ply/*.ply` after deploy |

---

## Models & Size Constraints

| Asset | Location | Notes |
|-------|----------|-------|
| MNIST LeNet | `public/models/mnist/` | In repo, ~879 KB |
| 3DGS PLY | `public/ply/*.ply` | **Not in repo** (~63 MiB/scene), upload at deploy |
| 3DGS SOG | `public/ply/*.sog` | Manifest index, ~10 MiB/scene |
| FormulaNet | Hugging Face CDN | Runtime download, ~77 MiB |
| SymPy | Pyodide CDN | ~10–20 MB on first solve |

Tracked files must be **≤ 25 MiB** each (Cloudflare Pages). See `scripts/check-25mib.mjs`.

---

## Documentation Index

| Document | Contents |
|----------|----------|
| [docs/TECHNICAL_REPORT.md](./docs/TECHNICAL_REPORT.md) | Full architecture, module design, source index |
| [docs/subpage-design-sync.md](./docs/subpage-design-sync.md) | Sub-page design sync acceptance checklist |
| [docs/theme-color-audit.md](./docs/theme-color-audit.md) | Hardcoded color audit and migration status |
| [docs/VAULT_SYNC.md](./docs/VAULT_SYNC.md) | Obsidian vault submodule sync |
| [docs/WIKILINKS_REPORT.md](./docs/WIKILINKS_REPORT.md) | Wikilink graph build report |
| [docs/I18N_NOTES.md](./docs/I18N_NOTES.md) | Internationalization notes |

---

## Prerequisites

### Required

HTML/CSS/JS (ES2022+), TypeScript, Git (including submodules), pnpm, Markdown (GFM + front matter)

### Frameworks

Astro (routing, Content Collections, `client:*`), Svelte 5 Runes, Tailwind CSS 4, remark/rehype Unified pipelines

### By module

| Module | Suggested background |
|--------|---------------------|
| Notes / WikiLinks | Obsidian syntax, slug normalization |
| Graph explorer | Graph theory, force-directed layouts |
| MATLAB calculator | Linear algebra, calculus, probability |
| Python IDE | CPython, `sys.settrace`, AST |
| MNIST | CNN basics, TensorFlow.js |
| Formula OCR | Encoder-decoder OCR, LaTeX |
| 3DGS wallpaper | WebGL, Gaussian Splatting basics |
| UI skins | CSS variables, `data-ui` attribute switching |

### Environment

- **Python 3.10+** — for `pnpm model:export-mnist` (tensorflow, Pillow)
- **Obsidian** (optional) — editing vault content
- Modern browser — WebGL, Web Workers, ES modules

---

## Acknowledgments

| Project | Role |
|---------|------|
| [Astro](https://astro.build/) / [Svelte](https://svelte.dev/) | Site framework and interactive UI |
| [Three.js](https://threejs.org/) / [@mkkellogg/gaussian-splats-3d](https://github.com/mkkellogg/GaussianSplats3D) | 3D rendering and 3DGS wallpaper |
| [Cytoscape.js](https://js.cytoscape.org/) | Graph explorer |
| [TensorFlow.js](https://www.tensorflow.org/js) | MNIST inference |
| [@huggingface/transformers](https://github.com/huggingface/transformers.js) | FormulaNet OCR |
| [Pyodide](https://pyodide.org/) | In-browser Python / SymPy |
| [KaTeX](https://katex.org/) / [Mermaid](https://mermaid.js.org/) | Math and diagrams |
| [Lucide](https://lucide.dev/) / [Tailwind CSS](https://tailwindcss.com/) | Icons and styling |

Note content comes from the Obsidian workflow; `obsidian-vault` is a separate git submodule with its own license terms.

---

## License

This project is licensed under the **[MIT License](./LICENSE)**.

**You may:** use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.  
**You must:** include the copyright notice and license text in all copies or substantial portions.  
**Disclaimer:** THE SOFTWARE IS PROVIDED “AS IS”, without warranty of any kind.

---

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/Takalahiro/my-second-brain1).

- Author: Takahiro
- Repository: [Takalahiro/my-second-brain1](https://github.com/Takalahiro/my-second-brain1)
