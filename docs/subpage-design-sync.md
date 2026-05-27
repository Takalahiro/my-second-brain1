# 子页面设计语言同步 · 验收清单

与首页 mac 桌面皮肤对齐的设计系统见 `src/styles/design-system.css` 与 `src/styles/theme-tokens.css`。

共享基础设施：

| 项目 | 文件 |
|------|------|
| 主题预水合 | `src/components/ThemeBoot.astro` |
| 语义 Token | `src/styles/theme-tokens.css`（`--bg` / `--surface` / `--text` / `--accent-*` / `--color-success` / `--color-error`） |
| 间距 / 阴影 / 字号 | `src/styles/design-system.css`（`--space-*` / `--shadow-sm|md|lg` / `--text-*`） |
| 基础组件 | `src/components/ui/UiButton.svelte` · `UiCard.svelte` · `UiTag.svelte` · `UiInput.svelte` |
| 布局壳 | `BaseLayout.astro`（站点页）· `ToolLayout.astro`（工具页） |

---

## 1. 笔记 `/notes/` · 文件夹 · 标签 · 单篇笔记

### 布局 `BaseLayout`
- 新增 `wide` 属性：笔记首页与图谱使用全宽 `--space-4` 内边距
- `site-body` 使用 `--bg` / `--text` / `--font-body`
- `ThemeBoot` 保证深浅色切换前无闪烁

### 笔记首页 `NotesExplorer.svelte`
- 工具栏间距改为 `--space-*`
- 标题字体 `--font-display` + `--text-2xl`
- 图标底色/强调色改为 `--accent-out` color-mix
- 搜索框添加 `.ui-input`，焦点环与设计系统一致
- 折叠树面板仍用 `--tree-panel-*`（随主题）

### 导航搜索 `NoteSearch.svelte`（SiteNavBar 内）
- 输入框叠加 `.ui-input`
- 下拉面板 `--shadow-md` / `--radius-card` / `--surface-elevated`
- 高亮与选中态改用 `--accent-in` color-mix（移除硬编码粉紫 rgba）

### 标签 `/tags/` · `/tags/[tag]`
- `.subpage-title` / `.subpage-section` / `.ui-tag`
- 移除硬编码深色 hex

### 文件夹 `/folder/*`
- `.ui-list-card` / `.subpage-breadcrumb` / 语义文字色

### 单篇笔记 `/notes/[...slug]`
- 沿用 `BaseLayout` + Mermaid + 笔记工具 FAB（`NotesToolHost`）
- 正文样式来自全局 markdown / pixel 组件（已接 `--text-*`）

**验收：** 切换深浅色 → 背景、卡片、搜索框、Tag 同步变化；间距与首页 widget 卡片视觉密度接近。

---

## 2. 教学 `/teaching/`

### `TeachingHub.svelte`
- 面包屑 / 间距 `--space-*` / `--font-display`
- 文字色 `--text` / `--text-muted`
- 子 Lab（微积分、矩阵、统计等）继承 `ToolLayout` 主题变量

### 加载占位 `teaching.astro`
- 文字色 `--text-muted`，字号 `--text-sm`

**验收：** 教学页顶栏与 mac 导航一致；Lab 内卡片边框/圆角与 `--radius-card` 对齐。

---

## 3. Python `/python/`

### `PythonIDE.svelte`
- 容器高度 `100dvh - --site-nav-offset`
- 间距 / 圆角 / 阴影全部 token 化
- 成功态 `--color-success` / 错误 `--color-error`
- 主按钮渐变 `var(--color-success)` → `var(--accent-out)`
- 面板 `--surface` + `--shadow-sm`

**验收：** 深浅色下编辑器面板、终端、步骤 Tab 边框一致；运行/错误色可读。

---

## 4. MATLAB `/matlab/`

### `MatlabCalculator.svelte`
- 全页 CSS 硬编码色替换为语义变量
- 输入框 `.ui-input`；执行 `.ui-button--primary`；清空 `.ui-button--ghost`
- Tab / 预设 / 结果区使用 `--accent-out` color-mix
- 历史 ok/bad → `--color-success` / `--color-error`

> 画布 JS 绘制色（plot canvas）仍为运行时固定色，P2 可接 `readCssVar()`。

**验收：** 计算器 Tab、按键、错误提示随主题切换；与 Python 页按钮风格一致。

---

## 5. 神经网络 `/digits/`

### `NeuralLab.svelte`
- 页头字号 / 间距 token 化
- `.nl-demo-tag` / `.nl-tab` 使用 `--accent-out` 与 `--shadow-sm`
- Tab 激活渐变 `--accent-out` + `--accent-in`

### `digits.astro` fallback
- 虚线框与底色改为 accent color-mix；`--radius-card` / `--shadow-sm`

**验收：** MNIST / 公式 OCR 切换 Tab 时样式与 MATLAB/Python Tab 一致。

---

## 6. 白板 `/whiteboard/`

### `ExcalidrawBoard.svelte`
- 顶栏 `--surface` / `--border` / `--font-display`
- iframe 背景 `--surface-elevated`（非硬编码 `#fff`）
- 高度 `100dvh - --site-nav-offset`

**验收：** 深色模式下顶栏与页面背景协调；iframe 外缘不再白块突兀。

---

## 7. 图谱 `/graph/`

### `graph.astro`
- `BaseLayout wide` + `.subpage-section` 包裹

### `GraphExplorer.svelte`
- 标题 / Tab / KPI 卡片间距与 `--radius-card` / `--shadow-sm`
- 画布壳层此前已接 `graph-canvas.css` + theme tokens

**验收：** 切换视图 Tab、文件夹筛选、设置面板均响应主题；画布圆角阴影与首页 GraphWidget 一致。

---

## 8. 设置

无独立 `/settings/` 子路由。设置入口在**首页**：

- 控制中心 / `WidgetDrawer`
- 皮肤切换 `UiSkinInit` + `ThemeBoot`
- 字体 `data-font` · UI 皮肤 `data-ui`

子页面通过 `ThemeBoot` + `SiteNavBar` 内 `ThemeToggle` 同步主题，与首页共用 localStorage 键。

**验收：** 在子页切换深色 → 返回首页状态一致；反之亦然。

---

## 9. 共享组件复用情况

| 组件 | 使用位置 |
|------|----------|
| `.ui-input` | NoteSearch、NotesExplorer 搜索、Matlab 表达式输入 |
| `.ui-button--primary` / `--ghost` | Matlab 执行/清空 |
| `.ui-tag` | 标签列表页 |
| `.ui-list-card` | 文件夹 / 标签详情列表 |
| `.pixel-button` / `.pixel-card` | 笔记布局切换、教学/工具页卡片（与 mac 皮肤一致） |

Svelte 封装（可选逐步替换）：`src/components/ui/Ui*.svelte`

---

## 10. 已知 P2（未阻塞验收）

- `MatlabCalculator` plot canvas JS 颜色
- `NoteTiles.svelte` · `TerritoryMapCanvas.svelte` 部分硬编码
- 首页 legacy widgets（Calendar、Music 等）仍有个别 hex
- 详见 `docs/theme-color-audit.md`

---

## 构建验证

```bash
pnpm build
```

最后验证时间：2026-05-20
