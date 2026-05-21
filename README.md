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
│   └── _headers           # Cloudflare 缓存
├── scripts/               # 构建与 vault 维护
├── src/
│   ├── content.config.ts  # notes 集合
│   ├── pages/             # 路由
│   ├── components/        # UI 组件
│   ├── lib/               # 业务逻辑、ML、Markdown 插件
│   └── data/              # 构建期生成的 JSON
└── docs/                  # Vault 同步等文档
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
| FormulaNet | Hugging Face CDN | 运行时下载，~77 MiB |
| SymPy | Pyodide CDN | 首次求解 ~10–20 MB |

单文件入库限制 ≤ 25 MiB（Cloudflare Pages）。见 `scripts/check-25mib.mjs`。

---

## 开源协议

本项目采用 **[MIT License](./LICENSE)** 发布。

您可以自由使用、修改、分发本软件，但需保留版权声明与许可全文。笔记内容（`obsidian-vault`）可能适用独立许可，请以 vault 仓库为准。

---

## 贡献

欢迎通过 [Issue](https://github.com/Takalahiro/my-second-brain1/issues) 或 Pull Request 参与贡献。

- 作者：Takahiro
- 仓库：[Takalahiro/my-second-brain1](https://github.com/Takalahiro/my-second-brain1)
