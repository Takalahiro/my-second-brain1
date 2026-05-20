import { visit } from 'unist-util-visit';

// 判断 URL 是否应该重写到 /vault-assets/
// 排除：以 http(s) 开头、以 / 开头（绝对路径）、以 # 开头（页内锚点）、以 data: 开头
function isBareLocalRef(url) {
  if (!url) return false;
  if (/^(https?:)?\/\//i.test(url)) return false;
  if (url.startsWith('/')) return false;
  if (url.startsWith('#')) return false;
  if (url.startsWith('data:')) return false;
  return true;
}

export default function remarkObsidianImage() {
  return (tree) => {
    // 1) 处理 Obsidian embed 语法 ![[image.png]]（出现在 text 节点里）
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value || !parent || index === null || index === undefined) return;
      const re = /!\[\[([^\]]+)\]\]/g;
      if (!re.test(node.value)) return;
      re.lastIndex = 0;

      const parts = [];
      let last = 0;
      let m;
      while ((m = re.exec(node.value)) !== null) {
        if (m.index > last) {
          parts.push({ type: 'text', value: node.value.slice(last, m.index) });
        }
        const filename = m[1].split('|')[0].trim();
        parts.push({
          type: 'image',
          url: `/vault-assets/${filename}`,
          alt: filename,
        });
        last = m.index + m[0].length;
      }
      if (last < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(last) });
      }
      parent.children.splice(index, 1, ...parts);
    });

    // 2) 处理标准 Markdown 图片 ![alt](image.png)：裸文件名 → /vault-assets/<filename>
    visit(tree, 'image', (node) => {
      if (isBareLocalRef(node.url)) {
        const filename = node.url.split('/').pop();
        node.url = `/vault-assets/${filename}`;
      }
    });
  };
}
