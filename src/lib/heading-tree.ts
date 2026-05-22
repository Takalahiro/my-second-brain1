import type { MarkdownHeading } from 'astro';

export interface HeadingNode {
  depth: number;
  slug: string;
  text: string;
  children: HeadingNode[];
}

// 扁平 headings 按 depth 拼成树
// 比如 H2-H3-H3-H4-H2 → 两个 H2 兄弟，第一个下面两个 H3，第二个 H3 带 H4
// 只留 minDepth ~ maxDepth 范围内的
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
