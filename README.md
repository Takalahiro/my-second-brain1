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

## 🚀 本地开发

```sh
# 第一次：克隆带 submodule
git clone --recursive https://github.com/Takalahiro/my-second-brain1.git
cd my-second-brain1

pnpm install
pnpm dev   # http://localhost:4321
```

## 🧞 命令

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
| **Include git submodules** | ✅ **必须开启**（否则 obsidian-vault 拿不到，build 会主动报可读错误） |

构建第一步是 `pnpm prepare:vault`：

1. 校验 `obsidian-vault` submodule 已 checkout（没有则尝试 `git submodule update --init --recursive`）
2. 浅克隆环境（Cloudflare 默认 `--depth=20`）下跑 `git fetch --unshallow`，让 `git log --follow` 拿得到每篇笔记的真实最后编辑时间
3. 同步 vault 里的图片/PDF 到 `public/vault-assets/`
4. 生成 `src/lib/notes-mtime.json` —— 每篇笔记的 ISO 时间戳 manifest，
   作为 SSR 时 `git-mtime.ts` 的主数据源（即使部署环境拿不到完整 git 历史，
   也已经从我们本地生成的 manifest 里直接读出）

## 🔄 与 obsidian-vault 仓库的实时同步

详见 [docs/VAULT_SYNC.md](docs/VAULT_SYNC.md)。

简要：

- 本地随时 `pnpm vault:sync "新增机器学习笔记"` —— 一键 commit + push vault + 更新父仓库 submodule pointer
- GitHub Actions `.github/workflows/sync-vault-submodule.yml` 每 10 分钟自动 poll vault 上游，发现新 commit 就 fast-forward 父仓库的 submodule pointer
- 也可以在 vault 仓库部署 `.github/templates/vault-push-notify.yml`：每次 push 触发 `repository_dispatch`，秒级同步

## 📁 关键目录

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
