import { visit } from 'unist-util-visit';

/**
 * 在 markdown 阶段把 ```mermaid 代码块换成 HTML 节点：
 *   <div class="mermaid-block" data-source="…原文…" data-state="pending"></div>
 *
 * 客户端 `Mermaid.svelte` 在 onMount 后扫描所有 `.mermaid-block`，
 * 动态 import('mermaid') 并把 `data-source` 渲染成 SVG。
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

      const html = `<div class="mermaid-block" data-source="${escapeAttr(source)}" data-state="pending"></div>`;
      parent.children.splice(index, 1, {
        type: 'html',
        value: html,
      });
    });
  };
}

function escapeAttr(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '&#10;');
}
