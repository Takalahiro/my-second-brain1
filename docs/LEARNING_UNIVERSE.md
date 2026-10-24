# 教学宇宙（Learning Universe）— 进行中

> 状态：骨架起步（方案 C：先稳定 → 再教学）  
> 分支：`feat/stable-learning-universe`  
> 约束：在现有站点上修复与增强，不推倒重来

## 产品原则

1. **纯前端**，可本地打开；进度与挑战记录默认只在浏览器。
2. **IndexedDB** 存学习进度等大数据；**localStorage** 只存设置（主题、语言、高级内容开关等）。
3. **高级 / 研究生 / 博士**内容默认隐藏：完成必要基础 **或** 用户开关后可见（`isAdvancedVisible`）。
4. 素材以程序化图形为主；第三方资源须审查许可证并本地化（见 [ASSET_ATTRIBUTION.md](./ASSET_ATTRIBUTION.md)）。

## 已落地

| 项 | 说明 |
|----|------|
| `/teaching/` | 学科岛屿入口大厅 |
| `/teaching/[island]` | 既有岛屿页 |
| `src/lib/teaching/progress.ts` | 进度 v2 → IndexedDB，迁移旧 localStorage |
| `src/lib/storage/safe-storage.ts` | 设置类读写容错 |
| `src/lib/storage/idb.ts` | KV IndexedDB |
| 桌面稳定 | WidgetHost `ready` finally、HomeHero intro 超时、LazyWidget 重试 |

## 下一步（按优先级）

1. 统一教学工作台 UI（左导航 / 主区 / 观察面板）
2. 章节数据 schema（Course → Unit → Chapter → Challenge）
3. 四级难度 Level 0–7 + 拓展开关
4. 第一门完整课：编程基础 / 算法入门（预测→操作→验证）
5. 多语言挑战适配器（先 Python + JS + 伪代码）

## 相关路由

- `/lab/?tab=teaching` — 知识之海地图
- `/teaching/` — 教学宇宙大厅
- `/avr/`、`/python/`、`/matlab/`、`/digits/` — 既有实验室
