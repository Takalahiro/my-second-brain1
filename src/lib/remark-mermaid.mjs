import { visit } from 'unist-util-visit';

// markdown 阶段把 ```mermaid 块换成 HTML：
//
//   <div class="mermaid-block" data-state="pending" data-src-encoded="…percent-encoded 原文…"></div>
//
// 为啥用 percent-encoded attribute：
//   - HTML 属性里的真换行/制表会被压成空格，mermaid 多行语法保不住
//   - Astro SSR sanitizer 会剥 raw HTML 里的 <script>
//   - Markdown 里 <template> 也不靠谱
//   percent-encoding 原文只有 [A-Za-z0-9%]，不会被 normalize，客户端 decodeURIComponent 还原
//
// 必须挂在 remark 阶段，且要在 shiki 把 code 高亮成 hast/raw html 之前
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
