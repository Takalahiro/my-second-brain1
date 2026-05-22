const BASE = 'http://localhost:4321';

const urls = [
  '/notes/基础机器学习-machine-learning',
  '/notes/computer-science-foundation-note',
  '/notes/c-技术文档',
  '/notes/javascript-ecma-262--技术文档',
  '/notes/笔记',
];

for (const u of urls) {
  const r = await fetch(BASE + u);
  if (r.status !== 200) {
    console.log(`❌ ${u} → ${r.status}`);
    continue;
  }
  const t = await r.text();
  const articleH = {
    h2: (t.match(/<h2\s[^>]*id=/g) || []).length,
    h3: (t.match(/<h3\s[^>]*id=/g) || []).length,
    h4: (t.match(/<h4\s[^>]*id=/g) || []).length,
  };

  // 从 TableOfContents Svelte 那块 aside 里抠 toc-node 树
  const toc = t.match(/<aside[^>]*class="toc-floating[^"]*"[\s\S]*?<\/aside>/)?.[0] ?? '';
  const tocL1Nodes = (toc.match(/<li class="toc-node[^"]*"[^>]*data-depth="2"/g) || []).length;
  const tocL2Nodes = (toc.match(/<li class="toc-node[^"]*"[^>]*data-depth="3"/g) || []).length;
  const tocL3Nodes = (toc.match(/<li class="toc-node[^"]*"[^>]*data-depth="4"/g) || []).length;
  // Svelte 没挂 data-depth，上面可能全是 0；用 toc-children 嵌套层数当 proxy
  const tocChildrenLayers = (toc.match(/toc-children/g) || []).length;
  const tocItems = (toc.match(/class="toc-link[^"]*"/g) || []).length;

  console.log(`📄 ${u}`);
  console.log(`   article: H2=${articleH.h2} H3=${articleH.h3} H4=${articleH.h4}`);
  console.log(`   TOC: items=${tocItems}, nestedLayers=${tocChildrenLayers}`);
  console.log(`   预期 TOC items = H2+H3+H4 = ${articleH.h2 + articleH.h3 + articleH.h4}`);
  if (tocItems !== articleH.h2 + articleH.h3 + articleH.h4) {
    console.log(`   ⚠️  数量不匹配！`);
  }
}
