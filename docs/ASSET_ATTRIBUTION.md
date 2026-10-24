# 外部素材署名与许可证

> 下载日期以仓库引入日为准。未确认许可证的资源禁止使用。  
> **默认策略：** 教学示意图优先 SVG / Canvas / CSS 程序化生成，不依赖外链图片运行时加载。

| 资源 | 用途 | 来源 URL | 作者 | 许可证 | 本地路径 | 引入日期 |
|------|------|----------|------|--------|----------|----------|
| （暂无第三方位图） | — | — | — | — | — | — |
| KaTeX CSS（CDN） | 数学公式样式 | https://cdn.jsdelivr.net/npm/katex@0.16.9/ | KaTeX | MIT | CDN（后续可 vendor） | 既有 |
| Pyodide runtime | Python IDE | https://cdn.jsdelivr.net/pyodide/ | Pyodide | MPL-2.0 | CDN 按需 | 既有 |
| favicon / logo | 站点图标 | 项目自有 | 本仓库 | MIT | `public/favicon.*` `public/logo.png` | 既有 |

新增资源时必须补全上表，并写入本地 `public/` 或 `src/assets/`，禁止把未镜像的外链 URL 作为线上唯一依赖。
