# 笔记英文化方案评估 / Note i18n Options

本文评估如何将 **Obsidian 笔记正文** 与当前 **UI 语言切换**（`localStorage` → `second-brain:locale`）对齐。

## 现状

| 项目 | 说明 |
|------|------|
| 内容源 | Git 子模块 `obsidian-vault/` |
| 构建 | Astro Content Collections（`src/content.config.ts`） |
| Schema | `title`, `date`, `tags`, `draft`, `description` — **无 `locale` 字段** |
| 路由 | 静态 `/notes/{slug}/`，约 128 篇，主体为中文 |
| UI i18n | 客户端切换中/EN，**不改变 URL** |

**结论：** 界面可以即时切英文，但笔记是独立 Markdown 资产，**无法仅靠 UI 开关自动变成英文**。

---

## 方案对比

### 1. 平行目录 + 第二 Collection（推荐）

```
obsidian-vault/
  zh/...          # 现有笔记迁移或保持根目录为 zh
obsidian-vault-en/   # 或 vault 内 en/ 子树
```

- 新增 collection `notesEn`，路由 `/en/notes/[slug]`
- frontmatter 增加 `translationOf: original-slug` 关联中英文
- UI 切 EN 时：笔记列表/搜索链到 `/en/notes/...`；无译文则显示「暂无英文版」并链到中文

| 优点 | 缺点 |
|------|------|
| 质量可控、可渐进翻译 | 需维护两套内容 |
| 与 Obsidian 工作流兼容 | 构建与 wikilink 要处理跨语言 slug |
| SEO 清晰（`/en/` 前缀） | 初期工作量大 |

**适合：** 长期维护、希望英文读者看到真实译文而非机翻。

---

### 2. 同 vault 内配对文件

每篇中文笔记旁放 `note.en.md` 或 frontmatter：

```yaml
locale: zh
title_en: "Hypothesis Testing"
slug_en: hypothesis-testing
```

- 单 collection，loader 按 `locale` 过滤
- 或通过 `getStaticPaths` 为每个 locale 生成页面

| 优点 | 缺点 |
|------|------|
| 一个 vault、关联直观 | 128+ 文件改动面大 |
| 双链可指向 `[[note|en]]` 扩展 | Obsidian 内中英混排可能乱 |

---

### 3. 独立英文子模块

`obsidian-vault-en` 作为第二个 submodule，结构与中文镜像。

| 优点 | 缺点 |
|------|------|
| 权限/同步可分离 | 双倍 submodule 运维 |
| 英文 Obsidian 库独立 | 文件夹结构需严格对齐 |

---

### 4. 构建时机器翻译（不推荐）

CI 中用 MT 生成 `dist/en/notes/...`。

| 优点 | 缺点 |
|------|------|
| 见效快 | 术语/公式/代码块质量差 |
| | PKM 内容不可信，难人工校对 |

---

### 5. 分阶段（当前建议路径）

**Phase A（已完成/进行中）：** UI 全站中/EN 切换，笔记仍中文。

**Phase B：** 高频笔记（10–20 篇 overview）手动英译 + `translationOf` 元数据。

**Phase C：** `/en/notes/` 路由 + 搜索索引分语言（`notes.json` → `notes.en.json`）。

**Phase D：** 按需扩展，不追求 1:1 全覆盖。

---

## 与现有管道的改动点

1. **`content.config.ts`** — 第二 loader 或 schema 增加 `locale` / `translationOf`
2. **`notes.json` 生成脚本** — 按语言输出 manifest；搜索组件读对应 locale
3. **Wikilinks** — `src/lib/wikilinks*` 解析时可选「同 slug 英文页」或保持中文 slug
4. **Graph / folder 视图** — 节点标题可显示 `title_en` 或随 locale 切换
5. **GitHub Actions vault sync** — 若英文为独立目录，同步逻辑需包含新路径

---

## 推荐决策

| 优先级 | 选择 |
|--------|------|
| 短期 | **Phase A + B**：UI 英文 + 少量手工英译入口页 |
| 中期 | **方案 1**：`/en/notes/` + `translationOf` 配对 |
| 避免 | 全库机翻 |

若你希望下一步落地，建议从 **1 篇试点**（如 `hypothesis-testing`）开始：加 `obsidian-vault-en/`、扩展 schema、生成 `/en/notes/hypothesis-testing/`，并在 UI 为 EN  locale 切换笔记区链接前缀。
