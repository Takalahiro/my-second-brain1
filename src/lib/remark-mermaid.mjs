import { visit } from 'unist-util-visit';

/**
 * 在 markdown 阶段把 ```mermaid 代码块换成 HTML 节点：
 *
 *   <div class="mermaid-block" data-state="pending" data-src-encoded="…percent-encoded 原文…"></div>
 *
 * 为什么用 percent-encoded attribute：
 *   - HTML 属性值里的真实换行/制表会被规范化成空格，无法保留 mermaid 多行语法
 *   - Astro 会把 raw HTML 里的 `<script>` 标签剥离掉（SSR sanitizer）
 *   - `<template>` 在 Astro Markdown 中也不可靠
 *   percent-encoding 完全规避：原文只含 `[A-Za-z0-9%]`，不会被 normalize，客户端用
 *   `decodeURIComponent` 还原即可。
 *
 * 必须挂在 remark 阶段，且要在 shiki 把 code 节点高亮成 hast/raw html 之前。
 */
export default function remarkMermaid() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if ((node.lang || '').toLowerCase() !== 'mermaid') return;

      const source = node.value || '';
      if (!source.trim()) return;

      const encoded = encodeURIComponent(source);
      const html = `<div class="mermaid-block" data-state="pending" data-src-encoded="${encoded}"></div>`;

      parent.children.splice(index, 1, {
        type: 'html',
        value: html,
      });
    });
  };
}
