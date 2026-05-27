# 主题颜色硬编码审计清单

> 生成日期：2026-05-20  
> 目标：消除组件内硬编码颜色，统一使用 `src/styles/theme-tokens.css`

## 已完成迁移（P0）

| 区域 | 文件 | 说明 |
|------|------|------|
| Token 层 | `theme-tokens.css`, `graph-canvas.css` | 语义 + 图谱 + 小组件 token；画布柔化边缘 |
| 全局接入 | `globals.css` | import token / graph-canvas |
| JS 读取 | `lib/theme/css-vars.ts`, `graph-data.ts`, `graph-hud-theme.ts` | 文件夹色 / HUD 色从 CSS 读 |
| 图谱页 | `GraphExplorer.svelte` | 标签、KPI、文件夹环、画布壳 |
| 图谱视图 | `ForceView`, `RadialView`, `ArcView`, `ClusterView` | SVG 渐变 / 边 / 标签 → CSS 变量 |
| 图谱辅助 | `SettingsPanel`, `ZoomControls` | 面板 / 控件 → `--widget-*` / `--graph-*` |
| 浮动图谱 | `GraphWidget.svelte` | 全壳层 + SVG + 画布融入 |

## 待迁移（按优先级）

### P1 — 图谱剩余

| 文件 | 约计 | 主要问题 |
|------|------|----------|
| `TerritoryMapCanvas.svelte` | ~41 | 地图渐变、标签、tooltip 硬编码 |
| `NoteTiles.svelte` | ~23 | 深色渐变背景 `#110926` |
| `folder-territory.ts` | ~4 | 领土着色辅助 |
| `territory-map-model.ts` | ~3 | 仍引用静态 `PALETTE` |

### P1 — 浮动小组件（legacy 深紫壳）

| 文件 | 约计 |
|------|------|
| `PixelClock.svelte` | ~101 |
| `WidgetDrawer.svelte` | ~95 |
| `MusicPlayer.svelte` | ~93 |
| `WorldClockWidget.svelte` | ~64 |
| `StatsWidget.svelte` | ~60 |
| `CalendarWidget.svelte` | ~57 |
| `TodoWidget.svelte` | ~57 |
| `NotesWidget.svelte` | ~46 |
| `PomodoroWidget.svelte` | ~45 |
| `NetworkWidget.svelte` | ~39 |
| `WeatherWidget.svelte` | ~52 |
| `WhiteNoiseWidget.svelte` | ~24 |
| `ControlCenterSlot.svelte` | ~21 |
| `RotateHandle.svelte` | ~17 |
| `TerritoryMapWidget.svelte` | ~12 |
| 其他 widgets | 各 1–18 |

### P2 — 结构 / 实验室

| 区域 | 说明 |
|------|------|
| `src/styles/structural/**` | 各皮肤 primitive 仍有 per-skin hex（属 token 层，可逐步 `color-mix`） |
| `src/styles/ui/skins/**` | 皮肤定义文件（合法硬编码） |
| Python IDE / 代码高亮 | 语义色可保留或抽 `--code-*` |
| `globals.css` light widget `!important` 补丁 | 小组件迁移完成后可删除 |

## Token 速查

```css
/* 语义 */
--bg, --surface, --text, --text-muted, --accent, --border

/* 图谱 */
--graph-canvas-bg, --graph-space-deep|mid|inner
--graph-link, --graph-link-dim, --graph-link-hi
--graph-label, --graph-label-stroke, --graph-folder-0…9
--graph-hud-* （HUD 星图专用）

/* 小组件 */
--widget-shell-bg, --widget-control-bg, --widget-muted, …
```

## 规范

见 `.cursor/rules/theme-colors.mdc` — **新组件必须使用变量，不允许硬编码**。
