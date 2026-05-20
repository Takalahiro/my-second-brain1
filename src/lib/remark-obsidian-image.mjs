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
    //    同时处理孤立的 [[_TOC_]] / [TOC] 标记（页面里的 Obsidian 风格目录占位符，直接删除）
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value || !parent || index === null || index === undefined) return;

      // 先剔除 [[_TOC_]] 与 [TOC] 占位符（大小写不敏感）
      let value = node.value.replace(/\[\[_TOC_\]\]|\[TOC\]/gi, '');
      if (value !== node.value) {
        node.value = value;
      }

      // 同时匹配两种语法：
      //   ![[image.png]]  —— 标准 Obsidian embed
      //   [[image.png]]   —— 无 ! 前缀但目标是图片（部分 Obsidian 工具粘贴时会丢失 !）
      // 仅当目标扩展名是图片时，[[...]] 才被视为图片嵌入；否则留给 remark-wiki-link 处理。
      const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;
      const re = /(!?)\[\[([^\]]+)\]\]/g;

      const parts = [];
      let last = 0;
      let m;
      let changed = false;
      while ((m = re.exec(node.value)) !== null) {
        const bang = m[1];
        const inner = m[2];
        const filename = inner.split('|')[0].trim();
        const isImage = IMG_EXT.test(filename);

        // 只处理 ![[xxx]] 或 [[xxx.png]]，其余 [[normal note]] 跳过让 remark-wiki-link 接管
        if (!bang && !isImage) continue;

        if (m.index > last) {
          parts.push({ type: 'text', value: node.value.slice(last, m.index) });
        }
        if (isImage) {
          parts.push({
            type: 'image',
            url: `/vault-assets/${filename}`,
            alt: filename,
          });
        } else {
          // ![[note name]] 不是图片：当作普通文本保留，让后续处理或显示原文
          parts.push({ type: 'text', value: m[0] });
        }
        last = m.index + m[0].length;
        changed = true;
      }
      if (!changed) return;
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
