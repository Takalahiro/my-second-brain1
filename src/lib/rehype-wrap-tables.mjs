import { visit } from 'unist-util-visit';

/** 给每个 <table> 外包一层 .table-wrap，统一横向滚动与外边距 */
export default function rehypeWrapTables() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || index == null || node.tagName !== 'table') return;
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'] },
        children: [node],
      };
    });
  };
}
