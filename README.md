# My Second Brain

一个 Obsidian 风格的静态笔记站。基于 **Astro 6 + Tailwind v4 + Svelte 5 + MDX**，
内容来自 `obsidian-vault` 这个 git submodule。

支持：

- Wiki Link 双链 `[[…]]`（已存在 / 未创建两种样式）
- 图片嵌入 `![[…]]` 自动从 vault 复制到 `public/vault-assets/`
- Obsidian Callout（`> [!note]` 等）
- 反向链接 Backlinks
- 可折叠/可拖动/可最小化为悬浮球的 TOC
- 文件夹分组首页 + 2 级嵌套展开
- 暗黑模式
- LaTeX（KaTeX，自动归一化 `\( \)` / `\[ \]` / Obsidian 风格的多行 `$$ $$`）
- Mermaid（自托管 `mermaid@11`，懒渲染）
- 每篇笔记右下角显示「最后更新时间」（构建期从 git log --follow 抓取）

#  Obsidian Vault - 个人知识库与笔记系统

<div align="center">

![Astro](https://img.shields.io/badge/Astro-FF5D01?style=for-the-badge&logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Obsidian](https://img.shields.io/badge/Obsidian-7C3AED?style=for-the-badge&logo=obsidian&logoColor=white)

基于 Astro 构建的个人知识库网站，将 Obsidian 笔记转换为可浏览的在线文档

[在线预览](#) | [功能特性](#-功能特性) | [快速开始](#-快速开始)

</div>

---

##  项目简介

这是一个将 Obsidian 笔记库转换为静态网站的项目，支持：
-  Markdown 笔记渲染
-  全文搜索
-  响应式设计
-  多媒体内容（音频、视频、图片）
-  数据可视化
-  数学公式支持
-  编译器支持

---

##  项目架构

```
obsidian-vault/
├── 📁 obsidian-vault/          # Obsidian 笔记库
│   ├── 📂 _Inbox 入口/         # 待整理笔记
│   ├── 📂 .obsidian/           # Obsidian 配置
│   ├── 📂 .smart-env/          # 智能环境配置
│   ├── 📂 DATA1001/            # 数据科学笔记
│   ├── 📂 INFO1110/            # 信息技术笔记
│   ├── 📂 INFO1111/            # 编程基础笔记
│   ├── 📂 MATH/                # 数学笔记
│   └── 📂 计算机/              # 计算机科学笔记
│
├── 📁 public/                  # 静态资源
│   ├── 📂 music/               # 音频文件
│   ├── 📂 picture/             # 图片资源
│   ├── 📂 video/               # 视频文件
│   ├── 📂 voice/               # 语音文件
│   ├── 📂 vault-assets/        # Vault 资源
│   ├── 📄 _headers             # HTTP 头配置
│   ├── 🎨 favicon.ico          # 网站图标
│   └── 🎨 favicon.svg          # SVG 图标
│
├── 📁 src/                     # 源代码
│   ├── 📂 components/          # React/Astro 组件
│   │   ├── 🧩 Header.astro
│   │   ├── 🧩 Footer.astro
│   │   ├── 🧩 Navigation.astro
│   │   └── 🧩 SearchBar.astro
│   │
│   ├── 📂 data/                # 数据文件
│   │   ├── 📊 notes-index.json
│   │   └── 📊 metadata.json
│   │
│   ├── 📂 layouts/             # 页面布局
│   │   ├── 📐 BaseLayout.astro
│   │   ├── 📐 NoteLayout.astro
│   │   └── 📐 MarkdownLayout.astro
│   │
│   ├── 📂 lib/                 # 工具库
│   │   ├── 🔧 markdown-parser.ts
│   │   ├── 🔧 search-engine.ts
│   │   ├── 🔧 git-mtime.ts
│   │   └── 🔧 utils.ts
│   │
│   ├── 📂 pages/               # 页面路由
│   │   ├── 📄 index.astro      # 首页
│   │   ├── 📄 notes/[...slug].astro  # 笔记详情
│   │   ├── 📄 search.astro     # 搜索页面
│   │   └── 📄 api/             # API 路由
│   │
│   ├── 📂 styles/              # 样式文件
│   │   ├── 🎨 global.css
│   │   ├── 🎨 markdown.css
│   │   └── 🎨 syntax-highlight.css
│   │
│   └── 📄 content.config.ts    # 内容配置
│
├── 📁 scripts/                 # 构建脚本
│   └── 🔨 build-index.js       # 索引生成脚本
│
├── 📁 tools/                   # 开发工具
│   └── 🛠️ sync-vault.js        # Vault 同步工具
│
├── 📄 .gitignore               # Git 忽略配置
├── 📄 .gitmodules              # Git 子模块配置
├── 📄 .node-version            # Node 版本
├── 📄 .nvmrc                   # NVM 配置
├── 📄 astro.config.mjs         # Astro 配置
├── 📄 package.json             # 项目依赖
├── 📄 pnpm-lock.yaml           # pnpm 锁文件
├── 📄 pnpm-workspace.yaml      # pnpm 工作区
├── 📄 README.md                # 项目文档
├── 📄 svelte.config.js         # Svelte 配置
├── 📄 tailwind.config.ts       # Tailwind 配置
└── 📄 tsconfig.json            # TypeScript 配置
```

---

##  功能特性

###  笔记管理
- 支持 Markdown 语法
- 双向链接 `[[笔记名称]]`
- 标签系统 `#tag`
- 代码高亮
- 数学公式（LaTeX）
- Mermaid 图表

###  界面设计
- 响应式布局（移动端适配）
- 暗色/亮色主题切换
- 平滑滚动和动画
- 面包屑导航
- 目录自动生成

###  搜索功能
- 全文搜索
- 标签过滤
- 分类筛选
- 搜索结果高亮

###  多媒体支持
- 图片预览和缩放
- 音频播放器
- 视频嵌入
- PDF 预览

###  数据可视化
- 笔记关系图谱
- 标签云
- 统计面板

---

##  快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/yourusername/obsidian-vault.git
cd obsidian-vault

# 安装依赖
pnpm install
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:4321
```

### 构建部署

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 部署到 Vercel/Netlify
pnpm deploy
```

---

##  技术栈

| 技术 | 用途 | 版本 |
|-----|------|------|
| **Astro** | 静态站点生成器 | ^4.x |
| **TypeScript** | 类型安全 | ^5.x |
| **Tailwind CSS** | 样式框架 | ^3.x |
| **Svelte** | 交互组件 | ^4.x |
| **Markdown-it** | Markdown 解析 | ^14.x |
| **Shiki** | 代码高亮 | ^1.x |
| **KaTeX** | 数学公式渲染 | ^0.16.x |
| **Mermaid** | 图表渲染 | ^10.x |

---

##  核心模块说明

### 1. Markdown 解析器 (`src/lib/markdown-parser.ts`)

```typescript
// 解析 Obsidian 特有语法
- [[双向链接]]
- ![[嵌入内容]]
- #标签
- 代码块
- 数学公式
```

### 2. 搜索引擎 (`src/lib/search-engine.ts`)

```typescript
// 全文搜索功能
- 索引构建
- 关键词匹配
- 结果排序
- 高亮显示
```

### 3. Git 时间戳 (`src/lib/git-mtime.ts`)

```typescript
// 获取文件修改时间
- Git 提交历史
- 文件创建时间
- 最后修改时间
```

### 4. 内容配置 (`src/content.config.ts`)

```typescript
// 定义内容集合
- 笔记集合
- 元数据 schema
- 验证规则
```

---

##  自定义配置

### 修改主题颜色

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',    // 主色调
        secondary: '#EC4899',  // 辅助色
        accent: '#10B981',     // 强调色
      }
    }
  }
}
```

### 配置 Obsidian Vault 路径

```typescript
// astro.config.mjs
export default defineConfig({
  vaultPath: './obsidian-vault',  // Vault 路径
  publicPath: './public',          // 静态资源路径
});
```

### 添加自定义组件

```astro
---
// src/components/CustomWidget.astro
import { getCollection } from 'astro:content';
const notes = await getCollection('notes');
---

<div class="custom-widget">
  <h2>最近更新</h2>
  <ul>
    {notes.slice(0, 5).map(note => (
      <li><a href={`/notes/${note.slug}`}>{note.data.title}</a></li>
    ))}
  </ul>
</div>
```

---

##  笔记分类

| 分类           | 说明     | 笔记数量 |
| ------------ | ------ | ---- |
| **DATA1001** | 数据科学基础 |      |
| **INFO1110** | 信息技术概论 |      |
| **INFO1111** | 编程入门   |      |
| **MATH**     | 数学笔记   |      |
| **计算机**      | 计算机科学  |      |

---

##  开发工具

### 同步 Obsidian Vault

```bash
# 从 Obsidian 同步笔记
pnpm run sync-vault

# 构建搜索索引
pnpm run build-index
```

### 代码检查

```bash
# TypeScript 类型检查
pnpm run type-check

# ESLint 检查
pnpm run lint

# 格式化代码
pnpm run format
```

---

##  使用指南

### 添加新笔记

1. 在 `obsidian-vault/` 目录下创建 `.md` 文件
2. 添加 Front Matter：

```markdown
---
title: 笔记标题
date: 2024-01-01
tags: [tag1, tag2]
category: 分类名
---

# 笔记内容
```

3. 运行 `pnpm run build-index` 更新索引

### 使用双向链接

```markdown
这是一个指向 [[其他笔记]] 的链接

嵌入另一个笔记的内容：
![[笔记名称]]
```

### 插入多媒体

```markdown
# 图片
![描述](../public/picture/image.png)

# 音频
![[audio.mp3]]

# 视频
![[video.mp4]]
```

---

##  部署

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### Netlify 部署

```bash
# 构建命令
pnpm build

# 发布目录
dist/
```

### GitHub Pages 部署

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

##  贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

##  开源协议

本项目采用 [MIT License](LICENSE) 开源协议

---

##  致谢

- [Astro](https://astro.build/) - 静态站点生成器
- [Obsidian](https://obsidian.md/) - 知识管理工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Shiki](https://shiki.matsu.io/) - 代码高亮

---

##  联系方式

- 作者：Taka hiro
- 邮箱：984664170@qq.com
- GitHub：[@984664170@qq.com]

---

<div align="center">

**如果这个项目对你有帮助，请给个 Star！**

Made with Love by Takahiro

</div>

---

##  路线图

- [ ] 支持更多 Obsidian 插件语法
- [ ] 添加评论系统
- [ ] 实现笔记版本历史
- [ ] 支持多语言
- [ ] 添加 RSS 订阅
- [ ] 实现笔记导出功能
- [ ] 优化移动端体验
- [ ] 添加全局快捷键

---

##  项目统计

![GitHub stars](https://img.shields.io/github/stars/yourusername/obsidian-vault?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/obsidian-vault?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/obsidian-vault)
![GitHub license](https://img.shields.io/github/license/yourusername/obsidian-vault)

##  本地开发

```sh
# 第一次：克隆带 submodule
git clone --recursive https://github.com/Takalahiro/my-second-brain1.git
cd my-second-brain1

pnpm install
pnpm dev   # http://localhost:4321
```

##  命令

| Command | 作用 |
| :--- | :--- |
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 启动本地 dev server |
| `pnpm build` | 生产构建到 `./dist/` |
| `pnpm preview` | 本地预览生产构建 |
| `pnpm prepare:vault` | 同步 vault 资源 + 生成 mtime manifest（dev/build 都会自动跑） |
| `pnpm vault:sync "msg"` | 把 vault 本地改动 commit + push 到 GitHub，并更新父仓库 submodule pointer |
| `pnpm vault:pull` | 拉取 vault 远程最新版 |
| `pnpm vault:audit` | 检查 vault 目录结构 |
| `pnpm vault:diagnose` | 扫描每篇笔记的常见问题 |

## ☁️ Cloudflare Pages 部署

仓库已配置好 Cloudflare Pages 静态部署，建议设置：

| Project 设置 | 值 |
| :--- | :--- |
| Framework preset | **Astro**（或 None） |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node version | 由 `.nvmrc` 锁到 **22.22.0** |
| Package manager | 由 `package.json` 的 `packageManager` 锁到 **pnpm@11.1.3** |
| **Include git submodules** |  **必须开启**（否则 obsidian-vault 拿不到，build 会主动报可读错误） |

构建第一步是 `pnpm prepare:vault`：

1. 校验 `obsidian-vault` submodule 已 checkout（没有则尝试 `git submodule update --init --recursive`）
2. 浅克隆环境（Cloudflare 默认 `--depth=20`）下跑 `git fetch --unshallow`，让 `git log --follow` 拿得到每篇笔记的真实最后编辑时间
3. 同步 vault 里的图片/PDF 到 `public/vault-assets/`
4. 生成 `src/lib/notes-mtime.json` —— 每篇笔记的 ISO 时间戳 manifest，
   作为 SSR 时 `git-mtime.ts` 的主数据源（即使部署环境拿不到完整 git 历史，
   也已经从我们本地生成的 manifest 里直接读出）

##  与 obsidian-vault 仓库的实时同步

详见 [docs/VAULT_SYNC.md](docs/VAULT_SYNC.md)。

简要：

- 本地随时 `pnpm vault:sync "新增机器学习笔记"` —— 一键 commit + push vault + 更新父仓库 submodule pointer
- GitHub Actions `.github/workflows/sync-vault-submodule.yml` 每 10 分钟自动 poll vault 上游，发现新 commit 就 fast-forward 父仓库的 submodule pointer
- 也可以在 vault 仓库部署 `.github/templates/vault-push-notify.yml`：每次 push 触发 `repository_dispatch`，秒级同步

##  关键目录

```
my-second-brain/
├── astro.config.mjs                # remark/rehype 插件链
├── obsidian-vault/                 # git submodule，所有 .md 源
├── public/
│   ├── _headers                    # Cloudflare 缓存策略
│   └── vault-assets/               # build 时从 vault 同步过来（.gitignore）
├── src/
│   ├── components/                 # Svelte/Astro UI（TOC、Backlinks、Mermaid、FolderTree…）
│   ├── layouts/BaseLayout.astro
│   ├── lib/
│   │   ├── remark-normalize-math.mjs   # KaTeX 前置归一化
│   │   ├── remark-mermaid.mjs          # ```mermaid 代码块 → 占位 div
│   │   ├── remark-obsidian-image.mjs   # ![[image.png]] → /vault-assets/...
│   │   ├── rehype-wrap-tables.mjs      # 表格滚动包裹
│   │   ├── git-mtime.ts                # 笔记最后更新时间
│   │   └── notes-mtime.json            # ← prepare:vault 自动生成 + commit
│   ├── pages/
│   │   ├── index.astro
│   │   ├── notes/[...slug].astro       # 单篇笔记
│   │   ├── notes/index.astro           # 笔记目录树
│   │   ├── tags/[tag].astro
│   │   └── folder/[folder].astro
│   └── styles/global.css
├── scripts/
│   ├── prepare-vault.mjs           # build 第一步
│   ├── sync-assets.mjs
│   ├── build-mtime-manifest.mjs
│   ├── sync-vault.mjs / pull-vault.mjs
│   ├── full-sweep.mjs              # 全站健康扫描
│   ├── verify-katex.mjs / verify-tables.mjs / scan-raw-latex.mjs
│   └── diagnose-notes.mjs / audit-vault.mjs / find-broken-wikilinks.mjs
└── .github/
    ├── workflows/sync-vault-submodule.yml
    └── templates/vault-push-notify.yml
```
