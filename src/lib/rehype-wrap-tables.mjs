import { visit } from 'unist-util-visit';

// 每个 <table> 外包 .table-wrap，横向滚动和外边距统一
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
