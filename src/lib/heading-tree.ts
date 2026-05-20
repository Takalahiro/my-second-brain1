import type { MarkdownHeading } from 'astro';

export interface HeadingNode {
  depth: number;
  slug: string;
  text: string;
  children: HeadingNode[];
}

/**
 * 把扁平的 headings（按文档顺序）按 depth 构造成嵌套树。
 * 例如：H2 - H3 - H3 - H4 - H2 → 两个 H2 兄弟节点，第一个 H2 下两个 H3，第二个 H3 下一个 H4。
 * 只保留 minDepth ~ maxDepth 范围的标题。
 */
export function buildHeadingTree(
  headings: MarkdownHeading[],
  minDepth = 2,
  maxDepth = 4
): HeadingNode[] {
  const filtered = headings.filter((h) => h.depth >= minDepth && h.depth <= maxDepth);
  const root: HeadingNode[] = [];
  const stack: HeadingNode[] = [];

  for (const h of filtered) {
    const node: HeadingNode = { depth: h.depth, slug: h.slug, text: h.text, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  }
  return root;
}
