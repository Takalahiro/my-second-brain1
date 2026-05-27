# My Second Brain

[English README](./README.en.md) · [技术文档](./docs/TECHNICAL_REPORT.md)

个人知识库静态站点：将 Obsidian vault 发布为可浏览、可搜索的 Web 应用，并叠加 **桌面 OS 壳**（壁纸、小组件、控制中心）与 **浏览器内交互工具**（Python、数学实验室、神经网络、关系图谱等）。

**在线演示：** [my-second-brain1.pages.dev](https://my-second-brain1.pages.dev)  
**当前版本：** 1.5.0 · **协议：** [MIT](./LICENSE)

---

## 目录

- [项目概述](#项目概述)
- [功能一览](#功能一览)
- [技术栈](#技术栈)
- [系统架构大纲](#系统架构大纲)
- [快速开始](#快速开始)
- [仓库结构](#仓库结构)
- [路由与页面](#路由与页面)
- [核心模块说明](#核心模块说明)
- [UI 皮肤（13 套）](#ui-皮肤13-套)
- [桌面小组件](#桌面小组件)
- [常用命令](#常用命令)
- [部署](#部署-cloudflare-pages)
- [模型与体积约束](#模型与体积约束)
- [文档索引](#文档索引)
- [复现所需知识](#复现所需知识)
- [开源协议](#开源协议)
- [贡献](#贡献)

---

## 项目概述

本项目采用 **静态站点生成（SSG）+ 客户端岛屿（Islands）** 架构：

| 维度 | 方案 |
|------|------|
| 内容 | Obsidian vault（git submodule）在 **构建期** 编译为 HTML |
| 交互 | Svelte 5 组件在浏览器 **按需加载**（图谱、ML、Pyodide、3DGS 等） |
| 后端 | **无自建后端**；运行时只读 JSON + localStorage |
| 部署 | Cloudflare Pages 静态托管 |

与常见静态博客或 3D 演示站的区别：

- **知识库 + 个人 OS 壳** 共用同一域名与状态持久化
- **3D Gaussian Splatting** 作为全屏环境壁纸，而非独立漫游查看器
- **13 套 UI 皮肤**，其中 11 套沉浸式主题带 NASA-punk 风格任务 chrome（状态条、CLI 搜索、滚动高度计）
- **统一设计系统**：语义 CSS 变量 + 子页面与首页 mac 皮肤对齐（配色 / 字体 / 间距 / 圆角 / 阴影）
- 多种 GPU / Worker 计算栈在同一 SPA 内通过 Tab 级与 visibility 级 **资源仲裁** 共存

---

## 功能一览

### 知识库（PKM）

- Obsidian Markdown → 静态笔记页（`/notes/*`）
- Wiki 双链 `[[page]]`、Callout、`![[image]]` 嵌入
- KaTeX 数学、Mermaid 图表、GFM 表格
- 反向链接、大纲、标签 / 文件夹浏览
- 构建期双链图 → 关系图谱 Explorer

### 桌面 OS 壳

- 可拖拽、可缩放、状态持久化的小组件层
- 三模互斥壁纸：**视频 / 海报 / 3DGS 点云**
- HUD 专属 Canvas 实时壁纸（星场、星云、视差）
- 控制中心：小组件开关、壁纸设置、UI 皮肤切换、Spotlight 搜索
- 氛围层：雨滴、樱花、白噪音、全局静音

### 浏览器内工具

| 工具 | 路径 | 技术要点 |
|------|------|----------|
| Python IDE | `/python` | Pyodide + `sys.settrace` + AST 逐步解释 |
| 数学计算器 | `/matlab` | 矩阵 / 微积分 / 离散 / 统计 / 表达式 |
| 神经网络实验室 | `/digits` | TF.js MNIST + Three.js 3D 可视化 |
| 公式 OCR + 求解 | `/digits?demo=formula` | Transformers.js FormulaNet + Pyodide SymPy |
| 关系图谱 | `/graph` | Cytoscape.js 多视图布局 |
| 白板 | `/whiteboard` | Excalidraw 嵌入 |
| 教学中心 | `/teaching` | 微积分等课程模块入口 |

### 笔记页工具（独立于桌面）

在 `/notes/*`、`/folder/*`、`/tags/*` 可通过 FAB 侧栏启用 Python、MATLAB、白板，状态键 `second-brain:notes-tools` 与桌面小组件分离。

---

## 技术栈

### 核心框架

| 层级 | 技术 | 版本 / 说明 |
|------|------|-------------|
| 元框架 | [Astro](https://astro.build/) | 6.x — SSG、Content Collections、MDX |
| 交互 UI | [Svelte](https://svelte.dev/) | 5.x — Runes（`$state` / `$derived` / `$effect`） |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) | 4.x — `@tailwindcss/vite` |
| 语言 | TypeScript | 6.x |
| 包管理 | pnpm | 11.x（见 `packageManager` 字段） |
| 运行时 | Node.js | ≥ 22.12（`.nvmrc` → 22.22.0） |

### 内容与 Markdown 管道

| 能力 | 依赖 / 模块 |
|------|-------------|
| Wiki 双链 | `remark-wiki-link` |
| Obsidian Callout | `remark-obsidian-callout` |
| 图片嵌入 `![[…]]` | 自研 `remark-obsidian-image.mjs` |
| 数学公式 | `remark-math` + `remark-normalize-math.mjs` + `rehype-katex` |
| Mermaid | `remark-mermaid.mjs` + `mermaid@11` |
| 标题锚点 | `rehype-slug` + `rehype-autolink-headings` |
| 表格外包 | `rehype-wrap-tables.mjs` |
| 代码高亮 | Astro 内置 Shiki |

### 交互、可视化与计算

| 模块 | 技术 |
|------|------|
| 关系图谱 | Cytoscape.js、自研多视图布局（力导向 / 径向 / 聚类 / 领地地图） |
| 矩阵 / 表达式 | `mathjs`、`fraction.js`、自研分步行化简引擎 |
| 手写数字 CNN | TensorFlow.js、Three.js（3D 可视化） |
| 3DGS 环境壁纸 | `@mkkellogg/gaussian-splats-3d`、Three.js、`spatial-camera.ts` |
| HUD Canvas 壁纸 | 自研 `hud-wallpaper-engine.ts`（Canvas 2D） |
| 公式 OCR | `@huggingface/transformers`（FormulaNet）、Web Worker |
| 符号求解 | Pyodide + SymPy（`formula-solver.py`） |
| Python IDE | Pyodide + `sys.settrace` + Python `ast` |
| 白板 | Excalidraw（嵌入） |
| 图标 | Lucide + 自研 PixelIcon（字体绑定双图标） |
| 国际化 | 自研 i18n（`zh` / `en`） |

### 部署与运维

| 项目 | 方案 |
|------|------|
| 托管 | Cloudflare Pages → `dist/` |
| 缓存 | `public/_headers`（HTML 短缓存 / 静态资源长缓存） |
| 笔记源 | Git Submodule `obsidian-vault` |
| 体积审计 | `pnpm check:25mib`（单文件 ≤ 25 MiB） |
| 路由自检 | `pnpm check:self`（Playwright 冒烟） |

---

## 系统架构大纲

```
┌─────────────────────────────────────────────────────────────┐
│  路由层：pages/（Astro）— index / notes / graph / tools …    │
├─────────────────────────────────────────────────────────────┤
│  布局层：layouts/ — BaseLayout / DesktopLayout / ToolLayout │
│  设计系统：theme-tokens.css + design-system.css + ui/ 组件   │
├─────────────────────────────────────────────────────────────┤
│  UI 层：WidgetHost / NotesToolHost / 笔记组件 / 工具页       │
├─────────────────────────────────────────────────────────────┤
│  皮肤层：features/ui — 13 skins + Skin Chrome 任务 chrome    │
├─────────────────────────────────────────────────────────────┤
│  状态层：localStorage — widgets / notes-tools / ui-skin / bg │
├─────────────────────────────────────────────────────────────┤
│  壁纸层：BackgroundLayer — video | poster | 3DGS | HUD      │
├─────────────────────────────────────────────────────────────┤
│  构建期数据：wikilinks.json / stats.json / media-manifest    │
├─────────────────────────────────────────────────────────────┤
│  内容源：obsidian-vault（git submodule）→ Content Collections │
└─────────────────────────────────────────────────────────────┘
```

**构建流水线（每次 `dev` / `build` 前）：**

```
pnpm prepare:vault
  → 校验 obsidian-vault submodule
  → 同步 vault-assets → public/vault-assets/
  → 生成 notes-mtime.json / stats.json / wikilinks.json / media-manifest.json
  → Astro Content Layer 读取 **/*.md → remark/rehype → 静态 HTML
```

详细设计见 **[docs/TECHNICAL_REPORT.md](./docs/TECHNICAL_REPORT.md)**。

---

## 快速开始

```bash
git clone --recursive https://github.com/Takalahiro/my-second-brain1.git
cd my-second-brain1
pnpm install
pnpm dev    # http://localhost:4321
```

```bash
pnpm build          # 生产构建 → dist/
pnpm preview        # 本地预览
pnpm check:25mib    # 校验 git 跟踪文件 ≤ 25 MiB
pnpm check:self http://localhost:4321   # 路由自检（需 preview 运行中）
```

> **注意：** 必须使用 `--recursive` 克隆以拉取 `obsidian-vault` 子模块；Cloudflare Pages 部署需开启 **Include git submodules**。

---

## 仓库结构

```
my-second-brain/
├── astro.config.mjs          # Markdown 插件链、Vite manualChunks 分包
├── package.json              # v1.5.0
├── obsidian-vault/           # git submodule — 笔记源
├── public/
│   ├── models/mnist/         # TF.js LeNet 权重（~879 KB）
│   ├── ply/                  # 3DGS 场景（*.sog 入库；*.ply 部署时放入）
│   ├── video/ picture/ music/ # 壁纸与媒体资源
│   ├── vault-assets/         # 构建期从 vault 同步的图片
│   └── _headers              # Cloudflare 缓存策略
├── scripts/                  # 构建、vault 同步、3DGS 转换、自检
├── docs/                     # 技术文档、Vault 同步、双链报告
└── src/
    ├── content.config.ts     # notes Content Collection
    ├── pages/                # Astro 路由
    │   ├── index.astro       # 桌面首页
    │   ├── notes/ folder/ tags/
    │   ├── graph/ python/ matlab/ digits/ whiteboard/ teaching/
    │   └── data/             # JSON API（notes / wikilinks / media）
    ├── layouts/              # BaseLayout / DesktopLayout / ToolLayout
    ├── components/
    │   ├── ui/               # UiButton / UiCard / UiTag / UiInput
    │   ├── ThemeBoot.astro   # 主题/字体预水合（全站子页）
    │   ├── widgets/          # WidgetHost、18 种小组件、控制中心
    │   ├── desktop/          # MacMenuBar、SkinMissionStatus、MobileDock
    │   ├── Notes/ graph/ python/ calculus/ matrix/ statistics/ discrete/
    │   ├── wallpaper/        # HudWallpaper / BackgroundPlyLayer
    │   └── teaching/         # TeachingHub
    ├── features/
    │   ├── ui/               # 皮肤注册、apply、chrome、effects
    │   └── wallpaper/        # GS3 渲染器、legacy AM15、mode 状态
    ├── design-system/        # pixel + structural 双轨 widget 实现
    ├── lib/                  # 引擎、ML、Markdown 插件、i18n、draggable
    │   ├── theme/            # readCssVar 等主题工具
    │   ├── matrix/ calculus/ statistics/ discrete/
    │   ├── formula-recognizer/ python/ components/DigitRecognizer/
    │   └── remark-*.mjs rehype-*.mjs
    ├── data/                 # 构建期生成的 JSON（wikilinks 等）
    └── styles/
        ├── globals.css site-nav.css graph-canvas.css
        ├── theme-tokens.css design-system.css
        └── ui/               # HUD chrome、skin-chrome、13 套 skins/*.css
```

### 设计系统与主题

子页面（笔记、工具、图谱等）与首页 mac 皮肤共用语义变量与组件类：

| 层级 | 文件 | 说明 |
|------|------|------|
| 语义 Token | `src/styles/theme-tokens.css` | `--bg` / `--surface` / `--text` / `--accent-*` / 成功/错误色 |
| 布局与组件类 | `src/styles/design-system.css` | `--space-*` / `--shadow-*` / `.ui-input` / `.subpage-shell` |
| 预水合 | `ThemeBoot.astro` | 深浅色、字体、`data-ui` 首屏前写入 |
| Svelte 封装 | `src/components/ui/` | UiButton / UiCard / UiTag / UiInput |
| 布局 | `BaseLayout` / `ToolLayout` | `subpage-shell`、`tool-shell`；`wide` 全宽模式 |

详见 [docs/subpage-design-sync.md](docs/subpage-design-sync.md) · [docs/theme-color-audit.md](docs/theme-color-audit.md)。

---

## 路由与页面

| 路径 | 功能 |
|------|------|
| `/` | 桌面首页（WidgetHost + MacMenuBar） |
| `/notes` | 笔记索引 |
| `/notes/*` | 笔记详情（双链、大纲、反向链接） |
| `/folder/*` | 按文件夹浏览 |
| `/tags` `/tags/*` | 标签索引与标签页 |
| `/graph` | 关系图谱 Explorer |
| `/python` | Python IDE（逐步解释） |
| `/matlab` | 数学计算器（矩阵 / 微积分 / 离散 / 统计） |
| `/digits` | 神经网络实验室（MNIST） |
| `/digits?demo=formula` | 公式 OCR + SymPy 求解 |
| `/formula` | 公式识别独立页 |
| `/whiteboard` | Excalidraw 白板 |
| `/teaching` | 教学中心 |
| `/data/notes.json` | 笔记元数据 API |
| `/data/wikilinks.json` | 双链图数据 API |
| `/data/media.json` | 媒体清单 API |

---

## 核心模块说明

### 1. 笔记与 WikiLink

```
obsidian-vault/**/*.md
  → remark-wiki-link（[[page]] → /notes/{slug}）
  → remark-obsidian-image（![[img]] → /vault-assets/…）
  → remark-normalize-math → rehype-katex
  → remark-mermaid → 静态 HTML + Backlinks
```

已存在笔记 → 蓝色链接；未创建目标 → 红色「待建链」。

### 2. Python IDE（`/python`）

```
用户代码 → Pyodide run_traced()
  → sys.settrace 捕获 line/call/return
  → ast.parse 按语句类型生成中文说明（非 LLM）
  → JSON steps → PythonStepPanel 逐步播放
```

### 3. 神经网络实验室（`/digits`）

**MNIST：** 280×280 画板 → 双路预处理 → TF.js LeNet → SVG / 2D / Three.js 3D 可视化  
**FormulaNet：** Web Worker + Transformers.js OCR → LaTeX → Pyodide SymPy 求解  
**资源仲裁：** 切换 Formula Tab 时释放 TF.js GPU，避免与 OCR Worker 争抢 WebGPU。

### 4. MATLAB 计算器（`/matlab`）

| Tab | 实现 |
|-----|------|
| 矩阵 | 分步行化简（`src/lib/matrix/`）+ KaTeX |
| 微积分 | 符号步进 + Canvas 2D 曲线 |
| 离散数学 | 逻辑表达式 + 真值表 |
| 统计学 | 分布采样、假设检验步骤 |
| 表达式 | `mathjs` 求值与函数绘图 |

### 5. 关系图谱（`/graph`）

构建期 `build-wikilinks.mjs` 扫描全部 `[[wikilink]]` → `wikilinks.json`。  
`GraphExplorer` 提供力导向、径向、聚类、领地地图等视图，纯前端渲染。

### 6. 三模壁纸 + 3DGS

| 模式 | 表现 |
|------|------|
| `video` | 循环 MP4（可选雨天变体） |
| `poster` | 静态场景海报 |
| `ply` | 3D Gaussian Splatting 全屏环境壁纸 |

```
public/ply/{scene}.sog（manifest 索引）
  → splatAssetUrl() 映射 .ply
  → @mkkellogg/gaussian-splats-3d Viewer
  → spatial-camera（陀螺仪 / 鼠标视差）
  → gs-wallpaper.css（羽化 / 柔焦 / visionOS 毛玻璃联动）
```

大 PLY（~63 MiB）不入 git；部署时放入 `public/ply/`。详见 [docs/TECHNICAL_REPORT.md §5](./docs/TECHNICAL_REPORT.md)。

---

## UI 皮肤（13 套）

控制中心 → **UI 切换** 可即时预览并持久化到 `second-brain:ui-skin`。

| ID | 名称 | 类型 | 特征 |
|----|------|------|------|
| `mac` | Classic Mac | 经典 | SF 风格圆角、原生菜单栏 |
| `glass` | Liquid Glass | 经典 | visionOS 毛玻璃、半透明 |
| `pixel` | Game Boy | 沉浸式 | 像素绿、RPG 式状态条与 XP 高度计 |
| `hud` | NASA-punk HUD | 沉浸式 | Canvas 实时壁纸、任务状态条、日全食 intro |
| `blueprint` | 工程蓝图 | 沉浸式 | 蓝图网格、hover 尺寸标注 |
| `scholar` | 学院手稿 | 沉浸式 | 羊皮纸、Garamond、装订线 |
| `terminal` | 终端 CLI | 沉浸式 | 磷光绿、`:open` 搜索前缀 |
| `crt` | CRT 复古 | 沉浸式 | 琥珀扫描线、轻微闪烁 |
| `observatory` | 天文台 | 沉浸式 | 午夜星图、DEC 高度计 |
| `herbarium` | 博物图鉴 | 沉浸式 | 标本网格、墨绿 |
| `ink` | 水墨古籍 | 沉浸式 | 宣纸、印章标题 |
| `rpg` | RPG 面板 | 沉浸式 | 金边技能框、XP 条 |
| `spacecraft` | 太空舱 | 沉浸式 | ISS 舷窗、仪表蓝 |

**沉浸式皮肤（11 套）** 共享 **Skin Chrome** 体系：

- 22px 顶栏状态条（`SkinMissionStatus` — 每套独立 telemetry 文案）
- 44px 完整菜单栏（导航 / 主题 / 语言 / 时钟全保留）
- 右侧滚动高度计（`SkinScrollIndicator`）
- CLI 风格搜索前缀
- 控制中心固定锚定在 **右侧**（`skin-chrome-layout.css`）

源码：`src/features/ui/`、`src/styles/ui/skins/`、`src/styles/ui/skin-chrome-*.css`

---

## 桌面小组件

由 `WidgetHost.svelte` 统一管理，持久化键 `second-brain:widgets`。

| 小组件 | 说明 |
|--------|------|
| background | 壁纸层（video / poster / 3DGS） |
| clock | 像素时钟（可拖拽、可固定） |
| music | 本地音乐播放器 |
| notes / todo / calendar | 笔记快捷、待办、日历 |
| pomodoro / weather / stats | 番茄钟、天气、站点统计 |
| world | 世界时钟 |
| graph / territory | 关系图谱、文件夹地图 |
| calculator / python / whiteboard | MATLAB、Python、白板 |
| whitenoise / network | 白噪音、网络信息 |

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器（含 `prepare:vault`） |
| `pnpm build` | 生产构建 → `dist/` |
| `pnpm preview` | 本地预览构建结果 |
| `pnpm prepare:vault` | 单独运行 vault 同步与 JSON 生成 |
| `pnpm vault:sync "msg"` | 提交并推送 vault 子模块 |
| `pnpm vault:pull` | 拉取 vault 更新 |
| `pnpm vault:audit` | vault 健康审计 |
| `pnpm model:export-mnist` | 训练并导出 MNIST TF.js 模型 |
| `pnpm check:25mib` | git 跟踪文件体积审计 |
| `pnpm check:self <url>` | 路由与 JSON 端点自检 |

Vault 同步详见 [docs/VAULT_SYNC.md](docs/VAULT_SYNC.md)。

---

## 部署（Cloudflare Pages）

| 配置项 | 值 |
|--------|-----|
| Build command | `pnpm build` |
| Output directory | `dist` |
| Node version | 22.x |
| **Include git submodules** | **必须开启** |
| 大 PLY 文件 | 部署后手动上传至 `public/ply/*.ply` |

---

## 模型与体积约束

| 资产 | 位置 | 说明 |
|------|------|------|
| MNIST LeNet | `public/models/mnist/` | 入库，~879 KB |
| 3DGS PLY | `public/ply/*.ply` | **不入库**（~63 MiB/场景），部署时上传 |
| 3DGS SOG | `public/ply/*.sog` | manifest 索引，~10 MiB/场景 |
| FormulaNet | Hugging Face CDN | 运行时下载，~77 MiB |
| SymPy | Pyodide CDN | 首次求解 ~10–20 MB |

单文件 git 跟踪限制 **≤ 25 MiB**（Cloudflare Pages）。见 `scripts/check-25mib.mjs`。

---

## 文档索引

| 文档 | 内容 |
|------|------|
| [docs/TECHNICAL_REPORT.md](./docs/TECHNICAL_REPORT.md) | 完整架构、模块设计、源码索引 |
| [docs/subpage-design-sync.md](./docs/subpage-design-sync.md) | 子页面设计语言同步验收清单 |
| [docs/theme-color-audit.md](./docs/theme-color-audit.md) | 硬编码色审计与迁移进度 |
| [docs/VAULT_SYNC.md](./docs/VAULT_SYNC.md) | Obsidian vault 子模块同步 |
| [docs/WIKILINKS_REPORT.md](./docs/WIKILINKS_REPORT.md) | 双链图构建报告 |
| [docs/I18N_NOTES.md](./docs/I18N_NOTES.md) | 国际化说明 |

---

## 复现所需知识

### 必备

HTML/CSS/JS（ES2022+）、TypeScript、Git（含 submodule）、pnpm、Markdown（GFM + Front Matter）

### 框架

Astro（路由、Content Collections、`client:*`）、Svelte 5 Runes、Tailwind CSS 4、remark/rehype Unified 管道

### 按模块深入

| 模块 | 建议背景 |
|------|----------|
| 笔记 / WikiLink | Obsidian 语法、slug 归一化 |
| 关系图谱 | 图论、力导向布局 |
| MATLAB 计算器 | 线性代数、微积分、概率论 |
| Python IDE | CPython、`sys.settrace`、AST |
| MNIST | CNN、TensorFlow.js |
| 公式 OCR | Encoder-Decoder OCR、LaTeX |
| 3DGS 壁纸 | WebGL、Gaussian Splatting 基础 |
| UI 皮肤 | CSS 变量、`data-ui` 属性切换 |

### 环境

- **Python 3.10+** — `pnpm model:export-mnist`（tensorflow、Pillow）
- **Obsidian**（可选）— 编辑 vault
- 现代浏览器 — WebGL、Web Worker、ES Module

---

## 致谢

| 项目 | 用途 |
|------|------|
| [Astro](https://astro.build/) / [Svelte](https://svelte.dev/) | 站点框架与交互 UI |
| [Three.js](https://threejs.org/) / [@mkkellogg/gaussian-splats-3d](https://github.com/mkkellogg/GaussianSplats3D) | 3D 渲染与 3DGS 壁纸 |
| [Cytoscape.js](https://js.cytoscape.org/) | 关系图谱 |
| [TensorFlow.js](https://www.tensorflow.org/js) | MNIST 推理 |
| [@huggingface/transformers](https://github.com/huggingface/transformers.js) | FormulaNet OCR |
| [Pyodide](https://pyodide.org/) | 浏览器 Python / SymPy |
| [KaTeX](https://katex.org/) / [Mermaid](https://mermaid.js.org/) | 公式与图表 |
| [Lucide](https://lucide.dev/) / [Tailwind CSS](https://tailwindcss.com/) | 图标与样式 |

笔记内容来自 Obsidian 工作流；`obsidian-vault` 为独立 git submodule，许可以该仓库为准。

---

## 开源协议

本项目采用 **[MIT License](./LICENSE)** 发布。

**你可以：** 自由使用、复制、修改、合并、发布、再许可和/或销售本软件副本。  
**你需要：** 在所有副本或重要部分中保留版权声明与许可全文。  
**免责声明：** 软件按「原样」提供，不提供任何明示或暗示担保。

---

## 贡献

欢迎通过 [Issue](https://github.com/Takalahiro/my-second-brain1/issues) 或 Pull Request 参与贡献。

- 作者：Takahiro
- 仓库：[Takalahiro/my-second-brain1](https://github.com/Takalahiro/my-second-brain1)
