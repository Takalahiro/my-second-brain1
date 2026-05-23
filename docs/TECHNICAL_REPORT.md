# My Second Brain — 技术报表

> **文档类型：** 架构与设计技术报表  
> **适用范围：** my-second-brain 全站（SSG 知识库 + 桌面小组件 + 3DGS 壁纸 + 浏览器内计算工具）  
> **最后更新：** 2026-05-23

---

## 1. 摘要

本项目将 Obsidian vault 发布为 **静态 Web 知识库**，并在首页叠加 **可配置的桌面小组件层**（壁纸、时钟、音乐、图谱、ML 实验室等）。核心架构为 **Astro SSG + Svelte Islands**：内容在构建期编译，重交互模块在浏览器按需加载，无自建后端。

与常见静态博客或 3DGS 演示站的区别在于：

- 知识内容与「个人 OS 壳」共用同一站点与状态持久化；
- 3D Gaussian Splatting 被实现为 **不可交互的全屏环境壁纸**，而非独立漫游查看器；
- 多种 GPU/Worker 计算栈（TF.js、Transformers.js、Pyodide、3DGS）在同一 SPA 内通过 **Tab 级与 visibility 级资源仲裁** 共存。

---

## 2. 系统架构

### 2.1 分层模型

```
┌─────────────────────────────────────────────────────────┐
│  UI 层：WidgetHost / 笔记页 / 工具页 (/python, /digits…) │
├─────────────────────────────────────────────────────────┤
│  状态层：localStorage (second-brain:widgets)             │
├─────────────────────────────────────────────────────────┤
│  壁纸层：BackgroundLayer (video | poster | 3DGS ply)     │  z-index: -1
├─────────────────────────────────────────────────────────┤
│  构建期数据：wikilinks.json / stats.json / media-manifest│
├─────────────────────────────────────────────────────────┤
│  内容源：obsidian-vault (git submodule)                  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 构建流水线（`prepare:vault`）

| 步骤 | 脚本 / 模块 | 产出 |
|------|-------------|------|
| Submodule 校验 | `scripts/prepare-vault.mjs` | vault 就绪 |
| 资源同步 | vault → `public/vault-assets/` | 图片等资源 |
| 双链图 | `build-wikilinks.mjs` | `wikilinks.json` |
| 统计 | — | `stats.json` |
| 媒体清单 | `build-media-manifest.mjs` | `media-manifest.json` |
| 笔记 mtime | — | `notes-mtime.json` |

Astro Content Layer 读取 vault 内 Markdown，经 Unified remark/rehype 链输出静态 HTML。

### 2.3 客户端分包（Vite manualChunks）

| Chunk | 包含 | 加载时机 |
|-------|------|----------|
| `widget-core` | `wallpaper-mode`, `media` | 首页 Widget |
| `wallpaper-three` | Three.js, `gs3-wallpaper` | 点云壁纸模式 |
| 各工具页 | Pyodide, TF.js, Cytoscape… | 路由 lazy import |

---

## 3. 桌面 OS 壳层

### 3.1 WidgetHost 职责

- 管理小组件开关、布局、全局静音、控制中心；
- 持久化键：`second-brain:widgets`（enabled、bg、各 widget 状态）；
- 响应式：桌面 draggable frame vs 移动 drawer / dock。

### 3.2 与 PKM 内容的关系

| 维度 | 笔记系统 | 桌面壳 |
|------|----------|--------|
| 渲染 | 构建期 SSG | 客户端 Svelte |
| 路由 | `/notes/*` | `/` + 工具路由 |
| 数据 | Content Collections | JSON + localStorage |
| 目标 | 阅读、双链、大纲 | 氛围、工具、快捷入口 |

同一域名下完成「读笔记」与「用桌面」，避免传统主题仅换皮、无 OS 感的问题。

---

## 4. 三模互斥壁纸子系统

### 4.1 模式定义

`src/lib/wallpaper-mode.ts`：

| 模式 | `useVideo` | `usePly` | 表现 |
|------|------------|----------|------|
| `video` | true | false | 循环 MP4（可选雨天变体） |
| `poster` | false | false | 静态场景海报 |
| `ply` | false | true | 3DGS 点云 |

三者互斥；切换经 `patchFromMode()` 写回 `localStorage`。

### 4.2 媒体清单（`media-manifest.json`）

构建期扫描 `public/video`、`picture/scenes`、`picture/mobile`、`music`、`ply`：

- 五个核心场景：`usyd`, `kyoto`, `shanghai`, `sydney`, `tokyo`；
- 每场景可含：`video`, `videoRain`, `poster`, `ply`, `sog`；
- URL 含空格/中文时由 `encodeURIComponent` 在前端处理。

### 4.3 BackgroundLayer 实现要点

| 能力 | 实现 |
|------|------|
| 视频 crossfade | `layerA` / `layerB` 双缓冲，`opacity` 过渡 |
| 点云 lazy load | `{#await import('./BackgroundPlyLayer.svelte')}` |
| 场景切换 | `{#key scene.ply}` 强制 remount |
| 移动降级 | UA 检测 → 静态 poster，不启 WebGL |
| 点云 body 类 | `ply-wallpaper-active` → 全站毛玻璃联动 |

### 4.4 数据流（点云模式）

```
scene.ply (manifest, .sog URL)
  → splatAssetUrl() 映射为 .ply
  → createGS3Wallpaper()
  → @mkkellogg/gaussian-splats-3d Viewer
  → spatial-camera（陀螺仪 / 鼠标视差）
  → gs-wallpaper.css（羽化 / 柔焦 / 缓入）
```

---

## 5. 3DGS 环境壁纸 — 详细设计

### 5.1 设计目标

参考 Apple Vision Pro 主屏环境（Mt. Hood / Yosemite）：**沉浸、柔和、不抢戏**。3DGS 作为背景，上层仍为可读 UI。

| 目标 | 手段 |
|------|------|
| 不抢交互 | `pointer-events: none`，关闭 OrbitControls |
| 不漂移 | `progressiveLoad: false`，全量加载后显示 canvas |
| 固定构图 | 常量机位 + 每帧 `lockCamera` 基准 |
| 轻微深度感 | 陀螺仪（移动）/ 极弱鼠标视差（桌面） |
| 电影感 | CSS 径向羽化、0.3px 柔焦、暖色映射、1.5s 缓入 |
| UI 统一 | `body.ply-wallpaper-active` 提升 glass 参数 |

### 5.2 渲染器选型

| 方案 | 路径 | 状态 |
|------|------|------|
| **主路径** | `@mkkellogg/gaussian-splats-3d` | 生产使用 |
| 备用探索 | `am15/`（antimatter15/splat 风格） | 软件 WebGL 兼容性差，保留参考 |
| SOG 自解码 | `gaussian-sog.ts` + fflate | 备用，非主路径 |

主渲染器配置摘要（`gs3-wallpaper.ts`）：

```typescript
useBuiltInControls: false
selfDrivenMode: false          // 自管 rAF
progressiveLoad: false         // 避免加载期画面漂移
sceneRevealMode: Instant
renderMode: OnChange
integerBasedSort: false          // 大场景排序稳定
ML_SHARP_ROTATION: X 轴 π      // MLSharp 导出 PLY 朝向修正
```

### 5.3 资产体积策略

| 文件 | 典型大小 | Git | 部署 |
|------|----------|-----|------|
| `{scene}.ply` | ~63 MiB | `.gitignore` | 手动放入 `public/ply/` |
| `{scene}.sog` | ~10–11 MiB | 可入库 | manifest 索引 |

`public/ply/*.ply` 单文件超过 Cloudflare Pages **25 MiB 跟踪限制**，故 PLY 不入库；manifest 中 `ply` / `sog` 字段指向 `.sog`，运行时 `splatAssetUrl()` 替换为 `.ply`。

离线转换：`scripts/convert-ply-to-sog.mjs`（PlayCanvas splat-transform）。

### 5.4 相机与视差（`spatial-camera.ts`）

| 输入 | 灵敏度 | 应用增益 |
|------|--------|----------|
| 陀螺仪 `DeviceOrientationEvent` | β/γ 映射，clamp ±0.14 | `GYRO_POS` / `GYRO_LOOK` |
| 鼠标 `pointermove` | `POINTER_SENSITIVITY = 0.004` | `POINTER_POS` / `POINTER_LOOK`（更弱） |
| 呼吸动画 | 默认 **关闭** | — |

iOS 13+ 需用户手势触发 `DeviceOrientationEvent.requestPermission()`；已在首次 click/touchstart 请求。

### 5.5 CSS 后期栈（`gs-wallpaper.css`）

与 WebGL 解耦，可独立调参：

| 效果 | 实现 |
|------|------|
| 径向羽化 | `.ply-layer.gs-wallpaper::after` radial-gradient |
| DOF 模拟 | `filter: blur(0.3px) …` |
| HDR 暖调 | `hue-rotate(-5deg) sepia(0.05)` |
| 缓入 | `@keyframes gs-fade-in` 1.5s |
| visionOS 玻璃 | `body.ply-wallpaper-active .glass-container` |

### 5.6 生命周期与并发

`BackgroundPlyLayer.svelte`：

- `disposeChain`：上一 Viewer `dispose` 完成后再创建新实例，避免同 host 双 canvas；
- `AbortController`：场景切换时 abort 加载；
- `visibilitychange`：隐藏 tab 时暂停 rAF，节省 CPU/GPU。

加载超时：120s → `report('failed')`；仅 **loading / failed** 显示 banner，成功无 toast。

---

## 6. Obsidian → Web 内容管道

### 6.1 Remark 插件链

| 插件 | 作用 |
|------|------|
| `remark-wiki-link` | `[[page]]` → `/notes/{slug}` |
| `remark-obsidian-callout` | Callout 语法 |
| `remark-obsidian-image.mjs` | `![[img]]` → vault-assets |
| `remark-normalize-math.mjs` | 数学定界符归一化 |
| `remark-math` + `rehype-katex` | KaTeX |
| `remark-mermaid.mjs` | Mermaid 图 |

构建期 AST 转换，运行时零补丁。

### 6.2 双链图

- 构建期扫描全部 wikilink；
- 输出节点、边、悬空链、孤岛笔记；
- 详见 [WIKILINKS_REPORT.md](./WIKILINKS_REPORT.md)。

---

## 7. 浏览器内多计算栈与资源仲裁

同一站点并存多种重资源模块：

| 模块 | 技术 | GPU / 内存 |
|------|------|------------|
| MNIST | TensorFlow.js WebGL | LeNet 推理 |
| FormulaNet | Transformers.js Worker | WebGPU / WASM |
| SymPy | Pyodide | WASM heap |
| 3DGS 壁纸 | gaussian-splats-3d | WebGL2 splat |

仲裁策略：

| 策略 | 位置 |
|------|------|
| Tab 切换释放 TF.js | `/digits` CNN ↔ Formula |
| Worker terminate | Formula OCR tab hidden |
| `tf.dispose()` | 离开 CNN 视图 |
| 壁纸 rAF 暂停 | `document.hidden` |
| Lazy import | 工具页、点云层、Pyodide |

目标：避免移动端 Safari OOM 与 WebGL context 争用。

---

## 8. 依赖与致谢

### 8.1 3DGS 壁纸相关

| 项目 | 角色 | 许可 |
|------|------|------|
| [@mkkellogg/gaussian-splats-3d](https://github.com/mkkellogg/GaussianSplats3D) | 椭球 splat 主渲染器 | MIT |
| [Three.js](https://threejs.org/) | 3D 基础 | MIT |
| [antimatter15/splat](https://github.com/antimatter15/splat) | 早期方案参考（`am15/`） | 上游许可 |
| [PlayCanvas splat-transform](https://github.com/playcanvas/splat-transform) | PLY→SOG 转换 | 上游许可 |
| [fflate](https://github.com/101arrowz/fflate) | SOG 解压（备用路径） | MIT |

### 8.2 全站核心

| 项目 | 角色 |
|------|------|
| Astro 6.x | SSG、Content Collections |
| Svelte 5 | 小组件、Runes |
| Tailwind CSS 4 | 样式 |
| Cytoscape.js | 关系图谱 |
| TensorFlow.js | MNIST |
| @huggingface/transformers | FormulaNet OCR |
| Pyodide + SymPy | 符号计算 |
| KaTeX / Mermaid | 公式与图表 |

### 8.3 设计参考（非代码依赖）

| 参考 | 体现 |
|------|------|
| Apple Vision Pro 环境壁纸 | 固定机位、羽化、电影感后期 |
| visionOS 液态玻璃 | 点云模式下全站 `backdrop-filter` 联动 |
| Obsidian PKM | 双链、Callout、vault 工作流 |
| 经典桌面 Widget | 可拖拽、持久化、氛围层（雨、樱花） |

---

## 9. 源码索引

| 路径 | 说明 |
|------|------|
| `src/components/widgets/WidgetHost.svelte` | 桌面壳、bg 状态 |
| `src/components/widgets/BackgroundLayer.svelte` | 壁纸调度 |
| `src/components/widgets/BackgroundPlyLayer.svelte` | 点云 Svelte 挂载层 |
| `src/lib/wallpaper/gs3-wallpaper.ts` | gs3 Viewer 封装 |
| `src/lib/wallpaper/spatial-camera.ts` | 陀螺仪 / 鼠标视差 |
| `src/lib/wallpaper-mode.ts` | 三模互斥 |
| `src/styles/gs-wallpaper.css` | 壁纸 CSS 后期 |
| `scripts/build-media-manifest.mjs` | 媒体清单 |
| `scripts/convert-ply-to-sog.mjs` | PLY 转换 |
| `astro.config.mjs` | Markdown 链、Vite 分包 |

---

## 10. 测试与验证

| 脚本 | 用途 |
|------|------|
| `scripts/test-ply-wallpaper.mjs` | Playwright 点云冒烟（`.ply-layer.is-ready`） |
| `scripts/compare-ply-wallpaper.mjs` | 多场景对比 |
| `scripts/diagnose-gs3.mjs` | gs3 诊断 |
| `pnpm check:25mib` | 入库体积审计 |
| `pnpm check:self` | 路由自检 |

---

## 11. 已知限制与后续方向

| 限制 | 说明 |
|------|------|
| PLY 首载耗时 | 全量 ~63 MiB 解析约 10–40s |
| 移动端 3DGS | UA 降级为 poster |
| iOS 陀螺仪 | 需用户授权 DeviceOrientation |
| software WebGL | gs3 优于 am15，但仍依赖 GPU 能力 |
| Pages 体积 | 大 PLY 必须部署期上传，不入 git |

可选后续：KSplat 离线预处理减载、Service Worker 缓存 PLY、更细的场景 LOD。

---

*本文档随实现演进更新；用户-facing 快速入门见 [README.md](../README.md)。*
