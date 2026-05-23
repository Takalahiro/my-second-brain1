# My Second Brain

[English README](./README.en.md)

个人知识库静态站点：将 Obsidian vault 发布为可浏览、可搜索的 Web 应用，并集成桌面小组件、关系图谱，以及 Python / 数学 / 神经网络等浏览器内交互工具。

**在线演示：** [my-second-brain1.pages.dev](https://my-second-brain1.pages.dev)

---

## 项目概述

本项目采用 **静态站点生成（SSG）+ 客户端岛屿（Islands）** 架构：笔记内容在构建期从 `obsidian-vault` 子模块编译为 HTML；复杂交互（图谱、ML 推理、Pyodide 等）在浏览器端按需加载，无需自建后端。

---

## 技术栈

### 核心框架

| 层级 | 技术 | 版本 / 说明 |
|------|------|-------------|
| 元框架 | [Astro](https://astro.build/) | 6.x — SSG、Content Collections、MDX |
| 交互 UI | [Svelte](https://svelte.dev/) | 5.x — Runes、客户端岛屿 |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) | 4.x — `@tailwindcss/vite` |
| 语言 | TypeScript | 6.x |
| 包管理 | pnpm | 11.x（见 `packageManager` 字段） |
| 运行时 | Node.js | ≥ 22.12（`.nvmrc` → 22.22.0） |

### 内容与 Markdown

| 能力 | 依赖 |
|------|------|
| Wiki 双链 | `remark-wiki-link` |
| Obsidian Callout | `remark-obsidian-callout` |
| 图片嵌入 `![[…]]` | 自研 `remark-obsidian-image.mjs` |
| 数学公式 | `remark-math` + `rehype-katex` + `remark-normalize-math.mjs` |
| Mermaid | `remark-mermaid.mjs` + `mermaid@11` |
| 代码高亮 | Astro 内置 Shiki |

### 交互与计算

| 模块 | 技术 |
|------|------|
| 关系图谱 | Cytoscape.js、自研多视图布局 |
| 矩阵 / 表达式 | `mathjs`、`fraction.js` |
| 手写数字 CNN | TensorFlow.js、Three.js（3D 可视化） |
| **3DGS 点云壁纸** | `@mkkellogg/gaussian-splats-3d`、Three.js；构建期 `media-manifest.json` |
| 公式 OCR | `@huggingface/transformers`（FormulaNet）、Web Worker |
| 符号求解 | Pyodide + SymPy（`formula-solver.py`） |
| Python IDE | Pyodide + `sys.settrace` + Python `ast` |
| 白板 | Excalidraw（嵌入） |

### 部署

- **Cloudflare Pages** — 静态托管，`public/_headers` 配置缓存策略
- **Git Submodule** — `obsidian-vault` 独立仓库，构建时同步

---

## 复现所需知识

若要本地开发、二次开发或部署，建议具备以下背景（不必全部精通，可按模块深入）：

### 必备

| 领域 | 要求 |
|------|------|
| **HTML / CSS / JavaScript** | ES2022+、模块化、异步编程 |
| **TypeScript** | 类型、泛型、模块解析 |
| **Git** | submodule、基本工作流 |
| **Node.js 生态** | pnpm、npm scripts、Vite 基本概念 |
| **Markdown** | GFM、Front Matter |

### 框架相关

| 领域 | 要求 |
|------|------|
| **Astro** | 页面路由、`client:*` 指令、Content Collections、MDX |
| **Svelte 5** | Runes（`$state` / `$derived` / `$effect`）、组件通信 |
| **Tailwind CSS** | 工具类、响应式、CSS 变量 |
| **remark / rehype** | Unified 插件链、MDAST/HAST 基本概念 |

### 按功能模块

| 模块 | 建议知识 |
|------|----------|
| 笔记 / WikiLink | Obsidian 语法、slug 归一化、静态路由 |
| 关系图谱 | 图论基础、力导向布局、JSON 图数据 |
| MATLAB 计算器 | 线性代数、微积分、概率论；矩阵算法 |
| Python IDE | CPython 执行模型、`sys.settrace`、AST |
| 手写数字 | CNN 基础、MNIST、TensorFlow.js Layers API |
| 公式识别 | 图像预处理、Encoder-Decoder OCR、LaTeX |
| 公式求解 | 计算机代数系统（CAS）、SymPy、LaTeX→表达式 |
| MNIST 训练 | Keras / TF.js 模型导出（可选） |

### 环境与工具

- **Python 3.10+** — 运行 `pnpm model:export-mnist`（需 `tensorflow`、`Pillow`）
- **Obsidian**（可选）— 编辑 vault 内容
- 现代浏览器 — 支持 WebGL、WebGPU（可选）、Web Worker、ES Module

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

---

## 仓库结构

```
my-second-brain/
├── astro.config.mjs       # Markdown 插件链、Vite 分包
├── obsidian-vault/        # git submodule — 笔记源
├── public/
│   ├── models/mnist/      # TF.js 权重
│   ├── ply/               # 3DGS 场景（*.sog 入库；*.ply ~63MiB 部署时放入，见 .gitignore）
│   └── _headers           # Cloudflare 缓存
├── scripts/               # 构建与 vault 维护
├── src/
│   ├── content.config.ts  # notes 集合
│   ├── pages/             # 路由
│   ├── components/        # UI 组件
│   ├── lib/               # 业务逻辑、ML、Markdown 插件
│   └── data/              # 构建期生成的 JSON
└── docs/                  # Vault 同步、双链报告、技术报表等
```

---

## 核心功能实现逻辑

### 1. 构建流水线（`prepare:vault`）

每次 `dev` / `build` 前执行：

1. 校验并初始化 `obsidian-vault` submodule
2. CI 环境下 `git fetch --unshallow` 以获取笔记 git 历史
3. 同步 vault 资源 → `public/vault-assets/`
4. 生成 `notes-mtime.json`、`stats.json`、`wikilinks.json`、`media-manifest.json`

Astro Content Layer 读取 vault 中 `**/*.md`，经 remark/rehype 管道输出静态 HTML。

### 2. 笔记与 WikiLink

```
obsidian-vault/*.md
  → remark-wiki-link（[[page]] → /notes/{slug}）
  → remark-obsidian-image（![[img]] → /vault-assets/…）
  → rehype-katex（$…$ → KaTeX HTML）
  → 静态页面 + Backlinks 反向链接
```

已存在笔记渲染为蓝色链接，未创建笔记为红色「待建链」。

### 3. Python IDE — 逐步解释（`/python`）

```
用户代码
  → Pyodide 执行 run_traced()
  → sys.settrace 捕获 line / call / return 事件
  → ast.parse 按语句类型生成中文说明
  → JSON steps 返回前端
  → PythonStepPanel 逐步播放 + 编辑器行高亮
```

非 LLM 生成；解释来自 AST 规则模板（赋值、循环、`print`、函数调用等）。

### 4. 神经网络实验室（`/digits`）

#### 手写数字 · MNIST

```
280×280 画板
  → mnist-preprocess（直接缩放 | 居中裁剪+加粗）  // 双路高精度
  → TF.js LeNet 推理 + vizModel 中间层输出
  → NetworkPanel：SVG 结构图 / 2D 特征图 / Three.js 3D
  → PredictionBars：Softmax 置信度
```

切换至公式 Tab 时释放 TF.js GPU，避免与 OCR Worker 争抢 WebGPU。

#### 数学公式 · FormulaNet + SymPy

```
384×384 画板
  → Web Worker：Transformers.js + FormulaNet OCR
  → 双路预处理（加粗 / 不加粗）+ latexQualityScore 选优
  → MathJax 渲染 LaTeX
  → Pyodide 加载 formula-solver.py
  → SymPy：积分 / 求导 / 方程 / 正态分布 Φ(x)
```

FormulaNet 从 Hugging Face **运行时下载**（不入 git）；SymPy 经 Pyodide CDN 按需加载。

### 5. MATLAB 计算器（`/matlab`）

| Tab | 实现 |
|-----|------|
| 矩阵 | 分步行化简引擎（`src/lib/matrix/`），KaTeX 展示 |
| 微积分 | 符号步进 + Canvas 2D 曲线 |
| 离散数学 | 逻辑表达式解析与真值表 |
| 统计学 | 分布采样、假设检验步骤 |
| 表达式 | `mathjs` 求值与函数绘图 |

子模块按需 lazy import，降低首屏体积。

### 6. 关系图谱（`/graph`）

构建期 `build-wikilinks.mjs` 扫描全部 `[[wikilink]]`，输出 `wikilinks.json`（节点 + 边）。`GraphExplorer` 提供力导向、径向、聚类等多种视图，数据纯前端渲染。

### 7. 3D Gaussian Splatting 壁纸（桌面背景 · 点云模式）

将 **3DGS 场景作为全站沉浸式背景**，而非独立 3D 查看器：与视频 / 静态海报并列，由 `WidgetHost` → `BackgroundLayer` 统一调度。

```
public/ply/{scene}.ply   # ~63 MiB，gitignore，部署时放入
public/ply/{scene}.sog   # 压缩清单索引（~10 MiB）
  → build-media-manifest.mjs → media-manifest.json
  → BackgroundPlyLayer（lazy import）
  → gs3-wallpaper.ts（@mkkellogg/gaussian-splats-3d Viewer 封装）
  → CSS 后期：径向羽化 / 柔焦 / 缓入 / visionOS 毛玻璃联动
```

| 设计点 | 说明 |
|--------|------|
| 三模壁纸 | `video` / `poster` / `ply` 互斥切换，状态持久化到 `localStorage` |
| 固定机位 | 无轨道环绕；全量 PLY 解析完成后才显示，避免渐进加载时的画面漂移 |
| 视差 | 陀螺仪跟随（移动端）+ 极轻微鼠标视差（桌面），增益分离 |
| 体积策略 | 大 PLY 不入库；manifest 指向 `.sog`，运行时按需映射 `.ply` |
| 分包 | `wallpaper-three` chunk 按需加载 Three.js + gs3，不污染首屏 |

相关源码：`src/lib/wallpaper/gs3-wallpaper.ts`、`spatial-camera.ts`、`src/styles/gs-wallpaper.css`。

---

## 致谢

### 开源库与工具

本项目站在众多优秀开源项目之上，特别感谢：

| 项目 | 用途 | 链接 |
|------|------|------|
| [Astro](https://astro.build/) | 静态站点与 Islands 架构 | [License](https://github.com/withastro/astro/blob/main/LICENSE) |
| [Svelte](https://svelte.dev/) | 桌面小组件与交互 UI | MIT |
| [Three.js](https://threejs.org/) | 3D 渲染基础（图谱可视化、3DGS 壁纸） | MIT |
| [@mkkellogg/gaussian-splats-3d](https://github.com/mkkellogg/GaussianSplats3D) | **3D Gaussian Splatting 椭球溅射渲染**（点云壁纸主渲染器） | MIT |
| [antimatter15/splat](https://github.com/antimatter15/splat) | 早期 WebGL splat 方案探索（仓库内 `am15/` 参考实现） | 上游许可 |
| [PlayCanvas splat-transform](https://github.com/playcanvas/splat-transform) | PLY → SOG 离线转换脚本 | 上游许可 |
| [fflate](https://github.com/101arrowz/fflate) | SOG 压缩包解码（备用加载路径） | MIT |
| [Cytoscape.js](https://js.cytoscape.org/) | 关系图谱 | MIT / LGPL |
| [TensorFlow.js](https://www.tensorflow.org/js) | MNIST LeNet 浏览器推理 | Apache 2.0 |
| [@huggingface/transformers](https://github.com/huggingface/transformers.js) | FormulaNet 公式 OCR | Apache 2.0 |
| [Pyodide](https://pyodide.org/) | 浏览器内 Python / SymPy | MPL 2.0 |
| [KaTeX](https://katex.org/) | 数学公式渲染 | MIT |
| [Mermaid](https://mermaid.js.org/) | 图表渲染 | MIT |
| [Lucide](https://lucide.dev/) | 图标 | ISC |
| [Tailwind CSS](https://tailwindcss.com/) | 样式 | MIT |

笔记内容来自 Obsidian 工作流；vault 为独立 git submodule。

### 架构与设计灵感

| 灵感来源 | 在本项目中的体现 |
|----------|------------------|
| **Apple Vision Pro 环境壁纸**（Mt. Hood / Yosemite 等） | 3DGS 固定沉浸机位、径向羽化、电影感柔焦与缓入 |
| **visionOS 空间照片 / 液态玻璃** | 点云模式下 `body.ply-wallpaper-active` 联动全站毛玻璃材质 |
| **Obsidian 双链知识库** | WikiLink、Callout、构建期双链图 |
| **经典桌面 OS 小组件层** | `WidgetHost` 可拖拽、持久化、Rain / 樱花 / 白噪音等氛围层 |

详细架构与设计说明见 **[docs/TECHNICAL_REPORT.md](docs/TECHNICAL_REPORT.md)**。

---

## 路由

| 路径 | 功能 |
|------|------|
| `/` | 桌面首页（WidgetHost） |
| `/notes/*` | 笔记详情 |
| `/graph` | 关系图谱 |
| `/python` | Python IDE |
| `/matlab` | 数学计算器 |
| `/digits` | 神经网络实验室 |
| `/digits?demo=formula` | 公式 OCR + SymPy |
| `/whiteboard` | Excalidraw 白板 |

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm model:export-mnist` | 训练并导出 MNIST TF.js 模型 |
| `pnpm vault:sync "msg"` | 同步 vault 子模块 |
| `pnpm check:25mib` | 单文件体积审计 |

Vault 同步详见 [docs/VAULT_SYNC.md](docs/VAULT_SYNC.md)。

---

## Cloudflare Pages 部署

| 配置项 | 值 |
|--------|-----|
| Build command | `pnpm build` |
| Output directory | `dist` |
| Node version | 22.x |
| **Include git submodules** | **必须开启** |

---

## 模型与体积

| 资产 | 来源 | 说明 |
|------|------|------|
| MNIST LeNet | `public/models/mnist/` | 入库，~879 KB |
| 3DGS PLY | `public/ply/*.ply` | **不入库**（~63 MiB/场景），部署时上传 |
| 3DGS SOG | `public/ply/*.sog` | 入库索引，~10 MiB/场景 |
| FormulaNet | Hugging Face CDN | 运行时下载，~77 MiB |
| SymPy | Pyodide CDN | 首次求解 ~10–20 MB |

单文件入库限制 ≤ 25 MiB（Cloudflare Pages）。见 `scripts/check-25mib.mjs`。

---

## 专业技术要点

以下是在二次开发或排错时最常被问到的设计决策与实现细节。

### 架构与构建

- **无后端 SSG**：笔记在 `pnpm build` 时编译为静态 HTML；`wikilinks.json`、`stats.json` 等索引同样在构建期生成，运行时只读 JSON，不连数据库。
- **`prepare:vault` 前置钩子**：每次 `dev` / `build` 都会同步 submodule、拷贝 `vault-assets`、刷新 mtime / 统计 / 双链报告，保证 Content Layer 与静态资源一致。
- **Islands 分包**：桌面小组件、图谱、Pyodide、TF.js 等重模块通过 `client:load` / `client:idle` / 动态 `import()` 按需加载，工具页（`/matlab` 各 Tab）进一步 lazy import，避免首屏 JS 过大。

### Markdown 与内容

- **Unified 插件链**（见 `astro.config.mjs`）：Wiki 双链 → Obsidian 图片嵌入 → 数学归一化 → KaTeX → Mermaid → 表格外包，在 AST 层统一处理，而非运行时正则替换。
- **Slug 与双链解析**：`slugify` + `build-wikilinks.mjs` 在构建期解析 `[[link]]`，已存在笔记为有效链接，缺失目标记入 `broken` / `orphans` 供 UI 标红。
- **Git mtime**：笔记「最后更新」优先取 vault 内文件的 git 历史，而非文件系统 mtime，便于 CI 与子模块浅克隆场景。

### 浏览器内计算与内存

- **Python IDE**：Pyodide + `sys.settrace` + Python `ast`，按语句类型输出中文步骤说明（非 LLM）。
- **公式 OCR**：FormulaNet 在 Web Worker 中跑 Transformers.js；移动端跳过 WebGPU 预加载、Tab 隐藏时 terminate Worker，并定期 recycle 以防 Safari OOM。
- **SymPy 求解**：Pyodide 按需拉取 `formula-solver.py`（版本号 `FORMULA_SOLVER_VERSION` 用于缓存失效）；LaTeX → SymPy 字符串为启发式转换，复杂式子需人工核对。
- **MNIST / TF.js**：LeNet 权重入库（~879 KB）；离开 CNN Tab 时 `tf.dispose` 释放 WebGL，避免与 OCR 争抢 GPU。

### UI 与体验

- **字体绑定双图标**：非 `jp-pixel` 字体用 Lucide 描边图标（各字体 CSS 变量微调笔画）；「日式像素」字体切换为 16×16 块面图标（`PixelIcon` 双 SVG + `data-font` 切换）。
- **桌面小组件**：位置 / 尺寸 / 旋转持久化到 `localStorage`；触控手势与 `draggable` 模块分离，移动端抽屉模式禁用 transform 拖拽。
- **关系图谱**：力导向带 alpha 冷却防抖动；领土地图视图用 seed 可复现的随机轮廓与 LOD；前台每 5 分钟可选刷新 `wikilinks.json`。

### 部署与约束

- **Cloudflare Pages**：输出目录 `dist`；**必须开启 git submodule**；`public/_headers` 区分 HTML（短缓存）与静态资源（长缓存）。
- **体积审计**：`pnpm check:25mib` 扫描 git 跟踪文件，单文件 ≤ 25 MiB（大模型如 FormulaNet 走 CDN 运行时下载，不入库）。
- **自检**：`pnpm build && pnpm preview` 后运行 `pnpm check:self http://localhost:4321` 批量探测主要路由与 JSON 端点。

### 主要第三方许可

| 组件 | 许可 |
|------|------|
| 本站代码 | MIT（见 [LICENSE](./LICENSE)） |
| [Three.js](https://threejs.org/) | MIT |
| [@mkkellogg/gaussian-splats-3d](https://github.com/mkkellogg/GaussianSplats3D) | MIT |
| [Lucide](https://lucide.dev/) 图标 | ISC |
| FormulaNet / Transformers.js | 各自上游许可 |
| Pyodide / SymPy | 各自上游许可 |
| `obsidian-vault` 笔记内容 | 以 vault 仓库为准，可能与代码许可不同 |

完整致谢见上文 [致谢](#致谢) 章节；架构与设计详见 [docs/TECHNICAL_REPORT.md](docs/TECHNICAL_REPORT.md)。

---

## 开源协议

本项目采用 **[MIT License](./LICENSE)** 发布。

```
MIT License

Copyright (c) 2026 Takahiro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**你可以：** 自由使用、复制、修改、合并、发布、再许可和/或销售本软件副本。

**你需要：** 在所有副本或重要部分中保留上述版权声明与许可全文。

**免责声明：** 软件按「原样」提供，不提供任何明示或暗示担保；作者不对任何索赔或损害负责。

笔记内容（`obsidian-vault` 子模块）可能适用独立许可，请以 vault 仓库说明为准。

---

## 贡献

欢迎通过 [Issue](https://github.com/Takalahiro/my-second-brain1/issues) 或 Pull Request 参与贡献。

- 作者：Takahiro
- 仓库：[Takalahiro/my-second-brain1](https://github.com/Takalahiro/my-second-brain1)
