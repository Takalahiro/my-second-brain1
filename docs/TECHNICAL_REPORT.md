# My Second Brain — 技术文档

> **文档类型：** 架构与设计技术报告  
> **适用范围：** my-second-brain 全站（SSG 知识库 + 桌面 OS 壳 + 13 套 UI 皮肤 + 3DGS / HUD 壁纸 + 浏览器内计算工具）  
> **当前版本：** 1.4.0  
> **最后更新：** 2026-05-20  
> **用户文档：** [README.md](../README.md) · [README.en.md](../README.en.md)

---

## 目录

1. [摘要](#1-摘要)
2. [版本记录](#2-版本记录)
3. [技术栈总览](#3-技术栈总览)
4. [系统架构](#4-系统架构)
5. [构建与部署](#5-构建与部署)
6. [内容管道（Obsidian → Web）](#6-内容管道obsidian--web)
7. [桌面 OS 壳层](#7-桌面-os-壳层)
8. [UI 皮肤与 Skin Chrome](#8-ui-皮肤与-skin-chrome)
9. [壁纸子系统](#9-壁纸子系统)
10. [3DGS 环境壁纸](#10-3dgs-环境壁纸)
11. [HUD Canvas 壁纸](#11-hud-canvas-壁纸)
12. [笔记页工具层](#12-笔记页工具层)
13. [浏览器内计算栈](#13-浏览器内计算栈)
14. [国际化（i18n）](#14-国际化i18n)
15. [Vite 分包策略](#15-vite-分包策略)
16. [源码索引](#16-源码索引)
17. [测试与验证](#17-测试与验证)
18. [已知限制与后续方向](#18-已知限制与后续方向)

---

## 1. 摘要

本项目将 Obsidian vault 发布为 **静态 Web 知识库**，并在首页叠加 **可配置的桌面小组件层**（壁纸、时钟、音乐、图谱、ML 实验室等）。核心架构为 **Astro SSG + Svelte 5 Islands**：内容在构建期编译，重交互模块在浏览器按需加载，**无自建后端**。

与常见静态博客或 3DGS 演示站的区别：

| 维度 | 本项目 |
|------|--------|
| 内容与壳 | 知识库与「个人 OS」共用域名与 localStorage 状态 |
| 3DGS | **不可交互的全屏环境壁纸**，非独立漫游查看器 |
| UI | **13 套皮肤**，11 套沉浸式 NASA-punk 任务 chrome |
| 计算 | TF.js、Transformers.js、Pyodide、3DGS 通过 Tab / visibility **资源仲裁** 共存 |

---

## 2. 版本记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| **1.4.0** | 2026-05-20 | **13 套 UI 皮肤**与 **Skin Chrome** 体系统一（状态条、CLI 搜索、滚动高度计）；控制中心右侧固定锚点；沉浸式皮肤恢复视频/海报壁纸；重写 README 与中英文文档 |
| **1.3.0** | 2026-05-20 | NASA-punk **HUD 皮肤**（Canvas 壁纸、任务状态条、日全食 intro）；**NotesToolHost**（笔记页 Python / MATLAB / 白板）；修复笔记工具开关双触发 |
| 1.2.0 | 2026-05-15 | 3DGS 环境壁纸、媒体 manifest、vault 同步与 git mtime |

---

## 3. 技术栈总览

### 3.1 运行时与框架

| 类别 | 技术 | 版本 |
|------|------|------|
| 元框架 | Astro | 6.x |
| UI | Svelte | 5.x（Runes） |
| CSS | Tailwind CSS | 4.x |
| 语言 | TypeScript | 6.x |
| 包管理 | pnpm | 11.x |
| Node | Node.js | ≥ 22.12 |

### 3.2 内容与 Markdown

| 能力 | 包 / 模块 |
|------|-----------|
| Content Collections | `astro:content` + `glob` loader |
| Wiki 双链 | `remark-wiki-link` |
| Callout | `remark-obsidian-callout` |
| 图片嵌入 | `remark-obsidian-image.mjs` |
| 数学 | `remark-math`, `remark-normalize-math.mjs`, `rehype-katex` |
| Mermaid | `remark-mermaid.mjs`, `mermaid@11` |
| GFM | `remark-gfm` |
| 代码高亮 | Shiki（Astro 内置） |

### 3.3 交互与计算

| 模块 | 技术 |
|------|------|
| 关系图谱 | Cytoscape.js |
| 矩阵 / 表达式 | `mathjs`, `fraction.js`, 自研 matrix engine |
| MNIST | TensorFlow.js |
| 公式 OCR | `@huggingface/transformers` (FormulaNet) |
| 符号计算 | Pyodide + SymPy |
| Python 解释 | Pyodide + `sys.settrace` + `ast` |
| 3DGS 壁纸 | `@mkkellogg/gaussian-splats-3d`, Three.js |
| HUD 壁纸 | Canvas 2D 自研引擎 |
| 白板 | Excalidraw |
| 3D 可视化 | Three.js |

### 3.4 部署

- **Cloudflare Pages** — 静态输出 `dist/`
- **Git Submodule** — `obsidian-vault`
- **缓存** — `public/_headers`

---

## 4. 系统架构

### 4.1 分层模型

```
┌─────────────────────────────────────────────────────────────┐
│  路由层 pages/                                               │
│  index · notes/* · folder/* · tags/* · graph · python · …   │
├─────────────────────────────────────────────────────────────┤
│  布局层 layouts/                                             │
│  BaseLayout · DesktopLayout · ToolLayout                    │
├─────────────────────────────────────────────────────────────┤
│  组件层 components/                                          │
│  WidgetHost · NotesToolHost · GraphExplorer · *Lab · Notes  │
├─────────────────────────────────────────────────────────────┤
│  特性层 features/                                            │
│  ui/ (skins, chrome, effects) · wallpaper/ (GS3, mode)      │
├─────────────────────────────────────────────────────────────┤
│  逻辑层 lib/                                                 │
│  matrix · calculus · statistics · formula · python · i18n   │
├─────────────────────────────────────────────────────────────┤
│  皮肤层 DOM                                                  │
│  html[data-ui] · html[data-ui-immersive] · CSS 变量          │
├─────────────────────────────────────────────────────────────┤
│  状态层 localStorage                                         │
│  widgets · notes-tools · ui-skin · 各 widget 独立键          │
├─────────────────────────────────────────────────────────────┤
│  壁纸层 z-index: -1                                          │
│  BackgroundLayer · HudWallpaper · atmosphere                  │
├─────────────────────────────────────────────────────────────┤
│  构建期数据 src/data/ + public/data/                          │
│  wikilinks.json · stats.json · media-manifest.json · mtime   │
├─────────────────────────────────────────────────────────────┤
│  内容源 obsidian-vault/ (git submodule)                      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 数据流概览

```
obsidian-vault/**/*.md
        │
        ▼ prepare:vault
  vault-assets/ + JSON 索引
        │
        ▼ Astro build
  dist/**/*.html + dist/data/*.json
        │
        ▼ 浏览器
  Svelte Islands 按需 hydrate
  localStorage 恢复 UI 状态
```

### 4.3 PKM 与桌面壳的关系

| 维度 | 笔记系统 | 桌面壳 |
|------|----------|--------|
| 渲染 | 构建期 SSG | 客户端 Svelte |
| 路由 | `/notes/*`, `/folder/*`, `/tags/*` | `/` + 工具路由 |
| 数据 | Content Collections | JSON + localStorage |
| 目标 | 阅读、双链、大纲 | 氛围、工具、快捷入口 |

---

## 5. 构建与部署

### 5.1 `prepare:vault` 流水线

每次 `pnpm dev` / `pnpm build` 前执行 `scripts/prepare-vault.mjs`：

| 步骤 | 产出 |
|------|------|
| Submodule 校验 / 初始化 | vault 就绪 |
| CI 下 `git fetch --unshallow` | 准确 git mtime |
| 同步 vault 资源 | `public/vault-assets/` |
| `build-wikilinks.mjs` | `src/data/wikilinks.json` |
| `build-stats.mjs` | `src/data/stats.json` |
| `build-media-manifest.mjs` | `src/data/media-manifest.json` |
| `build-mtime-manifest.mjs` | `notes-mtime.json` |

### 5.2 Cloudflare Pages

| 配置 | 值 |
|------|-----|
| Build command | `pnpm build` |
| Output | `dist` |
| Node | 22.x |
| Submodules | **必须开启** |
| 大 PLY | 部署后手动上传 `public/ply/*.ply` |

### 5.3 体积约束

- Git 跟踪单文件 ≤ **25 MiB**（`pnpm check:25mib`）
- FormulaNet、SymPy 走 CDN 运行时下载
- 3DGS PLY ~63 MiB/场景不入库

---

## 6. 内容管道（Obsidian → Web）

### 6.1 Content Collection

`src/content.config.ts`：

```typescript
defineCollection({
  loader: glob({ pattern: '**/*.md', base: './obsidian-vault' }),
  schema: z.object({ title, date, tags, draft, description }),
});
```

### 6.2 Remark / Rehype 插件链

执行顺序（`astro.config.mjs`）：

| 顺序 | 插件 | 作用 |
|------|------|------|
| 1 | `remarkNormalizeMath` | 跨行 `$$…$$` 归一化 |
| 2 | `remarkObsidianImage` | `![[img]]` → vault-assets URL |
| 3 | `remarkWikiLink` | `[[page]]` → `/notes/{slug}` |
| 4 | `remarkObsidianCallout` | Callout 语法 |
| 5 | `remarkMermaid` | Mermaid 代码块 → HTML 占位 |
| 6 | `remarkGfm` | GFM 扩展 |
| 7 | `remarkMath` | 行内 / 块级数学 |
| 8 | `rehypeSlug` | 标题 id |
| 9 | `rehypeAutolinkHeadings` | 标题锚点链接 |
| 10 | `rehypeKatex` | KaTeX 渲染 |
| 11 | `rehypeWrapTables` | 表格外包滚动容器 |

**Slug 规则**必须与 `src/lib/slugify.ts` 及 `build-wikilinks.mjs` 一致。

### 6.3 双链图

- 构建期扫描全部 `[[wikilink]]`
- 输出节点、边、悬空链（broken）、孤岛（orphans）
- 运行时 `/data/wikilinks.json` 供 GraphExplorer 使用
- 详见 [WIKILINKS_REPORT.md](./WIKILINKS_REPORT.md)

### 6.4 Git mtime

笔记「最后更新」优先取 vault 内文件的 **git 历史**，而非文件系统 mtime，适配 CI 与子模块浅克隆。

---

## 7. 桌面 OS 壳层

### 7.1 WidgetHost

**入口：** `src/components/widgets/WidgetHost.svelte`  
**持久化键：** `second-brain:widgets`

职责：

- 管理 17 种小组件开关与壁纸状态（`bg`）
- MacMenuBar + MobileHomeDock + Control Center（WidgetDrawer）
- 全局静音、清屏 / 恢复快照
- 桌面模式 vs 普通页面模式（`desktopMode` prop）

### 7.2 小组件清单

| Key | 组件加载器 | 说明 |
|-----|-----------|------|
| background | `widgetLoaders.background` | 壁纸层 |
| clock | clock | 像素时钟 |
| music | music | 音乐播放器 |
| notes | notes | 笔记快捷 |
| todo | todo | 待办 |
| calendar | calendar | 日历 |
| pomodoro | pomodoro | 番茄钟 |
| weather | weather | 天气 |
| stats | stats | 站点统计 |
| world | world | 世界时钟 |
| graph | graph | 关系图谱 widget |
| territory | territory | 文件夹地图 |
| calculator | calculator | MATLAB |
| python | python | Python |
| whiteboard | whiteboard | 白板 |
| whitenoise | whitenoise | 白噪音 |
| network | network | 网络信息 |

小组件支持拖拽、缩放、旋转；位置持久化到各 widget 独立 localStorage 键。

### 7.3 控制中心（WidgetDrawer）

**入口：** `src/components/widgets/WidgetDrawer.svelte`

| 面板 | 内容 |
|------|------|
| home | 快捷开关、Spotlight |
| widgets | 小组件分类网格 |
| wallpaper | 场景、三模切换、亮度 / 速度 |
| desktop | 清屏 / 恢复 |
| ui | UiSkinPicker（13 套皮肤） |

**定位：** `skin-chrome-layout.css` 将 `.mac-settings` 固定于视口 **右侧**（`position: fixed; right: 12px`），沉浸式皮肤顶距由 `--cc-anchor-top`（状态条 + 菜单栏高度）计算。

### 7.4 MacMenuBar

**入口：** `src/components/desktop/MacMenuBar.svelte`

- 导航链接、语言切换、主题切换、时钟
- 控制中心开关、全局静音、清屏
- 沉浸式皮肤下叠加 `SkinMissionStatus` 状态条（22px）

---

## 8. UI 皮肤与 Skin Chrome

### 8.1 模块结构

```
src/features/ui/
├── types.ts              # UiSkinId, UiSkinMeta
├── registry.ts           # UI_SKINS（13 套）
├── apply-ui.ts           # applyUiSkin(), initUiSkin()
├── skin-chrome.ts        # SKIN_CHROME 配置表
├── skin-chrome.svelte.ts # useSkinChrome() hook
├── skin-effects.ts       # 蓝图 hover 尺寸标注等
├── hud-mode.svelte.ts    # HUD 主题响应
└── components/
    ├── UiSkinPicker.svelte
    └── UiSkinInit.svelte
```

### 8.2 皮肤清单

| ID | 类型 | immersive | canvasWallpaper | 搜索前缀示例 |
|----|------|-----------|-----------------|-------------|
| mac | 经典 | ✗ | ✗ | — |
| glass | 经典 | ✗ | ✗ | — |
| pixel | 沉浸式 | ✓ | ✗ | `>` |
| hud | 沉浸式 | ✓ | **✓** | `MSB://CMD>` |
| blueprint | 沉浸式 | ✓ | ✗ | `DIM>` |
| scholar | 沉浸式 | ✓ | ✗ | `Note:` |
| terminal | 沉浸式 | ✓ | ✗ | `:open ` |
| crt | 沉浸式 | ✓ | ✗ | `>` |
| observatory | 沉浸式 | ✓ | ✗ | `STAR>` |
| herbarium | 沉浸式 | ✓ | ✗ | `Spec:` |
| ink | 沉浸式 | ✓ | ✗ | `卷>` |
| rpg | 沉浸式 | ✓ | ✗ | `/quest ` |
| spacecraft | 沉浸式 | ✓ | ✗ | `CMD>` |

持久化：`localStorage['second-brain:ui-skin']`  
DOM：`html[data-ui='{id}']`，沉浸式额外 `html[data-ui-immersive]`

### 8.3 Skin Chrome 组件

| 组件 | 文件 | 作用 |
|------|------|------|
| 状态条 | `SkinMissionStatus.svelte` | 每皮肤独立 telemetry 文案（1s 刷新） |
| 滚动高度计 | `SkinScrollIndicator.svelte` | 右侧 ALT / LVL / DEC 等标签 |
| 布局锚点 | `skin-chrome-layout.css` | 控制中心右侧固定、双层顶栏 |
| 任务样式 | `skin-chrome-mission.css` | 状态条配色、CLI 搜索前缀 |
| 皮肤 CSS | `styles/ui/skins/*.css` | 每套主题 token 与 ambient 背景 |

### 8.4 应用流程

```
用户选择皮肤 / 页面加载
  → initUiSkin() / applyUiSkin(id)
  → document.documentElement.setAttribute('data-ui', id)
  → toggleAttribute('data-ui-immersive')
  → 设置 --skin-strip-h, --cc-anchor-top, --desktop-stage-top
  → initSkinEffects(id) / teardownSkinEffects()
  → dispatch UI_SKIN_CHANGE_EVENT
```

### 8.5 壁纸与皮肤的关系

| 皮肤 | 背景层 |
|------|--------|
| hud | `HudWallpaper` Canvas（`canvasWallpaper: true`） |
| 其他沉浸式 | CSS ambient + **可选** video/poster 壁纸（`enabled.background`） |
| mac / glass | video / poster / 3DGS 常规壁纸 |

---

## 9. 壁纸子系统

### 9.1 三模互斥

`src/features/wallpaper/state/mode.ts` / `src/lib/wallpaper-mode.ts`：

| 模式 | useVideo | usePly | 表现 |
|------|----------|--------|------|
| video | true | false | 循环 MP4 |
| poster | false | false | 静态海报 |
| ply | false | true | 3DGS 点云 |

切换经 `patchFromMode()` 写回 `second-brain:widgets` 中的 `bg` 状态。

### 9.2 BackgroundLayer

**入口：** `src/components/widgets/BackgroundLayer.svelte`

| 能力 | 实现 |
|------|------|
| 视频 crossfade | layerA / layerB 双缓冲 |
| 点云 lazy load | 动态 import BackgroundPlyLayer |
| 场景切换 | `{#key scene.ply}` remount |
| 移动降级 | UA 检测 → poster |
| 点云 body 类 | `ply-wallpaper-active` → 全站毛玻璃 |

### 9.3 媒体清单

`scripts/build-media-manifest.mjs` 扫描：

- `public/video/` — 场景视频与雨天变体
- `public/picture/scenes/` — 海报
- `public/picture/mobile/` — 移动端静态图
- `public/music/` — 音乐曲目
- `public/ply/` — 3DGS `.sog` / `.ply`

核心场景：`usyd`, `kyoto`, `shanghai`, `sydney`, `tokyo`

---

## 10. 3DGS 环境壁纸

### 10.1 设计目标

参考 Apple Vision Pro 环境壁纸：**沉浸、柔和、不抢戏**。

| 目标 | 手段 |
|------|------|
| 不抢交互 | `pointer-events: none`，关闭 OrbitControls |
| 不漂移 | `progressiveLoad: false` |
| 固定构图 | 常量机位 + 每帧 lockCamera |
| 深度感 | 陀螺仪（移动）/ 鼠标视差（桌面） |
| 电影感 | CSS 径向羽化、柔焦、缓入 |
| UI 统一 | `body.ply-wallpaper-active` 提升 glass 参数 |

### 10.2 渲染器

**主路径：** `@mkkellogg/gaussian-splats-3d`（`src/features/wallpaper/render/gs3/gs3-wallpaper.ts`）

```typescript
useBuiltInControls: false
selfDrivenMode: false
progressiveLoad: false
sceneRevealMode: Instant
integerBasedSort: false
ML_SHARP_ROTATION: X 轴 π  // MLSharp 导出朝向修正
```

**备用探索：** `legacy/am15/`（antimatter15/splat 风格，保留参考）

### 10.3 资产策略

| 文件 | 大小 | Git | 部署 |
|------|------|-----|------|
| `{scene}.ply` | ~63 MiB | gitignore | 手动上传 |
| `{scene}.sog` | ~10 MiB | 可入库 | manifest 索引 |

离线转换：`scripts/convert-ply-to-sog.mjs`

### 10.4 相机与视差

`spatial-camera.ts`：

| 输入 | 应用 |
|------|------|
| DeviceOrientationEvent | 陀螺仪视差（iOS 需用户授权） |
| pointermove | 极弱鼠标视差 |

### 10.5 生命周期

`BackgroundPlyLayer.svelte`：

- `disposeChain` — 旧 Viewer dispose 后再创建新实例
- `AbortController` — 场景切换 abort 加载
- `visibilitychange` — 隐藏 tab 暂停 rAF

---

## 11. HUD Canvas 壁纸

**仅 `data-ui='hud'` 启用。**

| 模块 | 文件 |
|------|------|
| 组件 | `HudWallpaper.svelte` |
| 引擎 | `hud-wallpaper-engine.ts` |
| 输入 | `hud-wallpaper-input.ts`（视差、glitch） |
| 样式 | `hud-wallpaper.css`, `hud-mission-chrome.css` |

能力：

- 深色：深空视窗（星场、星云、流星）
- 浅色：1970s 星图档案风格
- 实时 telemetry 驱动 overlay 文案
- 挂载时 `data-hud-wallpaper='1'` 关闭 body 伪元素网格

附属 chrome：

- `HudEclipseIntro.astro` — 日全食加载 intro
- `HudMissionStatus.svelte` / `SkinMissionStatus.svelte` — 任务状态条
- `HudScrollIndicator.svelte` / `SkinScrollIndicator.svelte` — 滚动高度计

---

## 12. 笔记页工具层

**入口：** `src/components/widgets/NotesToolHost.svelte`  
**挂载：** `BaseLayout` 在笔记相关路由

| 工具 | 组件 | 持久化 |
|------|------|--------|
| Python | PythonWidget | `second-brain:notes-tools` |
| MATLAB | CalculatorWidget | `second-brain:notes-tools` |
| 白板 | WhiteboardWidget | `second-brain:notes-tools` |

与桌面 `second-brain:widgets` **不共享**（桌面 MATLAB 键名为 `calculator`）。

**v1.3.0 修复：** `NotesToolDrawer` 开关需阻止 tile 级 pointer 冒泡，避免 checkbox + tile 双触发。

---

## 13. 浏览器内计算栈

### 13.1 模块矩阵

| 模块 | 路径 | 技术 | GPU |
|------|------|------|-----|
| MNIST | `/digits` | TensorFlow.js | WebGL |
| FormulaNet | `/digits?demo=formula` | Transformers.js Worker | WebGPU / WASM |
| SymPy | 公式求解面板 | Pyodide | WASM heap |
| Python IDE | `/python` | Pyodide | — |
| 3DGS | 壁纸 ply 模式 | gaussian-splats-3d | WebGL2 |
| MATLAB | `/matlab` | mathjs + 自研引擎 | Canvas 2D |

### 13.2 资源仲裁

| 策略 | 位置 |
|------|------|
| Tab 切换释放 TF.js | DigitRecognizer CNN ↔ Formula |
| Worker terminate | Formula tab hidden |
| `tf.dispose()` | 离开 CNN 视图 |
| 壁纸 rAF 暂停 | `document.hidden` |
| Lazy import | 工具页、点云层、Pyodide |

目标：避免移动端 Safari OOM 与 WebGL context 争用。

### 13.3 Python IDE 流程

```
用户代码
  → Pyodide run_traced()
  → sys.settrace(line/call/return)
  → ast.parse → 规则模板中文说明
  → JSON steps → PythonStepPanel
```

### 13.4 公式 OCR 流程

```
384×384 画板
  → Web Worker: Transformers.js + FormulaNet
  → 双路预处理 + latexQualityScore
  → MathJax 预览
  → Pyodide formula-solver.py → SymPy
```

FormulaNet **运行时**从 Hugging Face 下载（~77 MiB，不入 git）。

---

## 14. 国际化（i18n）

**模块：** `src/lib/i18n/`

| 文件 | 作用 |
|------|------|
| `locale.svelte.ts` | 响应式 locale 状态 |
| `messages/zh.ts` | 中文文案 |
| `messages/en.ts` | 英文文案 |
| `catalog.ts` | 抽屉 / 菜单 catalog |

皮肤名称、控制中心、小组件、工具页均走 i18n key。详见 [I18N_NOTES.md](./I18N_NOTES.md)。

---

## 15. Vite 分包策略

`astro.config.mjs` → `manualChunks`：

| Chunk | 包含 |
|-------|------|
| `widget-core` | wallpaper-mode, media |
| `wallpaper-three` | Three.js, gs3, BackgroundPlyLayer |
| `transformers` | @huggingface/transformers |
| `formula-ocr` | formula-recognizer |
| `pyodide` | Pyodide / SymPy |
| `tfjs` | TensorFlow.js |
| `digits` | DigitRecognizer |
| `graph-viz` | Cytoscape, GraphWidget |
| `matlab-labs` | matrix / calculus / discrete / statistics labs |
| `katex` | KaTeX |
| `svelte` | Svelte runtime |

`modulePreload: false` 避免首屏预加载过重 chunk。

---

## 16. 源码索引

### 16.1 页面与布局

| 路径 | 说明 |
|------|------|
| `src/pages/index.astro` | 桌面首页 |
| `src/pages/notes/[...slug].astro` | 笔记详情 |
| `src/pages/graph.astro` | 关系图谱 |
| `src/layouts/BaseLayout.astro` | 基础布局 + NotesToolHost |
| `src/layouts/DesktopLayout.astro` | 桌面模式布局 |

### 16.2 桌面与壁纸

| 路径 | 说明 |
|------|------|
| `src/components/widgets/WidgetHost.svelte` | 桌面壳主控 |
| `src/components/widgets/WidgetDrawer.svelte` | 控制中心 |
| `src/components/widgets/BackgroundLayer.svelte` | 壁纸调度 |
| `src/components/widgets/BackgroundPlyLayer.svelte` | 3DGS 挂载 |
| `src/components/wallpaper/HudWallpaper.svelte` | HUD Canvas 壁纸 |
| `src/features/wallpaper/render/gs3/` | GS3 渲染封装 |
| `src/styles/gs-wallpaper.css` | 壁纸 CSS 后期 |

### 16.3 UI 皮肤

| 路径 | 说明 |
|------|------|
| `src/features/ui/registry.ts` | 13 套皮肤注册 |
| `src/features/ui/skin-chrome.ts` | Skin Chrome 配置 |
| `src/styles/ui/skin-chrome-layout.css` | 控制中心锚点 |
| `src/styles/ui/skin-chrome-mission.css` | 任务 chrome 样式 |
| `src/styles/ui/skins/*.css` | 各皮肤 CSS |

### 16.4 内容与 Markdown

| 路径 | 说明 |
|------|------|
| `src/content.config.ts` | notes collection |
| `src/lib/remark-obsidian-image.mjs` | Obsidian 图片 |
| `src/lib/remark-normalize-math.mjs` | 数学归一化 |
| `src/lib/remark-mermaid.mjs` | Mermaid |
| `scripts/build-wikilinks.mjs` | 双链图构建 |

### 16.5 工具与实验室

| 路径 | 说明 |
|------|------|
| `src/lib/matrix/` | 矩阵引擎 |
| `src/lib/calculus/` | 微积分引擎 |
| `src/lib/statistics/` | 统计引擎 |
| `src/lib/formula-recognizer/` | 公式 OCR + 求解 |
| `src/lib/components/DigitRecognizer/` | MNIST |
| `src/components/python/` | Python IDE UI |

### 16.6 构建脚本

| 路径 | 说明 |
|------|------|
| `scripts/prepare-vault.mjs` | 构建入口 |
| `scripts/build-media-manifest.mjs` | 媒体清单 |
| `scripts/convert-ply-to-sog.mjs` | PLY → SOG |
| `scripts/check-25mib.mjs` | 体积审计 |
| `scripts/self-check.mjs` | 路由自检 |

---

## 17. 测试与验证

| 脚本 | 用途 |
|------|------|
| `pnpm check:25mib` | Git 跟踪文件 ≤ 25 MiB |
| `pnpm check:self <url>` | 主要路由 + JSON 端点探测 |
| `scripts/test-ply-wallpaper.mjs` | Playwright 3DGS 冒烟 |
| `scripts/diagnose-gs3.mjs` | GS3 诊断 |
| `scripts/verify-katex.mjs` | KaTeX 渲染验证 |
| `scripts/diagnose-notes.mjs` | 笔记路由诊断 |

推荐发布前流程：

```bash
pnpm build
pnpm preview
pnpm check:self http://localhost:4321
```

---

## 18. 已知限制与后续方向

| 限制 | 说明 |
|------|------|
| PLY 首载 | 全量 ~63 MiB 解析约 10–40s |
| 移动端 3DGS | UA 降级为 poster |
| iOS 陀螺仪 | 需用户授权 DeviceOrientation |
| FormulaNet | 首次下载 ~77 MiB，依赖 CDN |
| Pages 体积 | 大 PLY 必须部署期上传 |
| LaTeX→SymPy | 启发式转换，复杂式子需人工核对 |

可选后续：

- KSplat 离线预处理减载
- Service Worker 缓存 PLY
- 各皮肤专属 intro 动画（CRT BIOS、RPG XP popup 等）
- 更细的场景 LOD

---

## 附录 A：localStorage 键一览

| 键 | 用途 |
|----|------|
| `second-brain:widgets` | 桌面小组件与壁纸状态 |
| `second-brain:ui-skin` | 当前 UI 皮肤 |
| `second-brain:notes-tools` | 笔记页工具开关 |
| `second-brain:control-center-slot` | 控制中心快捷 widget |
| `second-brain:locale` | 语言偏好 |
| 各 widget `*-layout` / `*-state` | 位置、尺寸、业务数据 |

---

## 附录 B：依赖许可摘要

| 组件 | 许可 |
|------|------|
| 本站代码 | MIT |
| Three.js / gs3 / Cytoscape / KaTeX / Mermaid | MIT |
| TensorFlow.js | Apache 2.0 |
| Transformers.js | Apache 2.0 |
| Pyodide / SymPy | 各自上游许可 |
| Lucide | ISC |
| obsidian-vault 笔记 | 以 vault 仓库为准 |

---

*本文档随实现演进更新。用户-facing 快速入门见 [README.md](../README.md)。*
