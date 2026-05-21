// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

import remarkObsidianImage from './src/lib/remark-obsidian-image.mjs';
import remarkWikiLink from 'remark-wiki-link';
import remarkObsidianCallout from 'remark-obsidian-callout';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkNormalizeMath from './src/lib/remark-normalize-math.mjs';
import remarkMermaid from './src/lib/remark-mermaid.mjs';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';
import rehypeWrapTables from './src/lib/rehype-wrap-tables.mjs';

import { getPermalinks } from './src/lib/permalinks.mjs';

// 扫描 vault 生成所有现存笔记的 slug 列表，给 remark-wiki-link，让"已存在"链接走 wiki-link 样式
// 而"未创建"链接走 wiki-link-new 样式（视觉上区分蓝色/红色）。
const vaultPermalinks = getPermalinks('./obsidian-vault');

export default defineConfig({
  site: 'https://my-second-brain1.pages.dev',
  integrations: [mdx(), svelte()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/@tensorflow')) return 'tfjs';
            if (id.includes('node_modules/three')) return 'three';
            if (id.includes('DigitRecognizer')) return 'digits';
            if (id.includes('pyodide')) return 'pyodide';
            if (id.includes('cytoscape') || id.includes('GraphWidget')) return 'graph-viz';
          },
        },
      },
    },
  },
  markdown: {
    remarkPlugins: [
      // 必须排在所有其它插件最前面：归一化跨行 $$...$$ 块后重新 parse mdast
      remarkNormalizeMath,
      remarkObsidianImage,
      [
        remarkWikiLink,
        {
          permalinks: vaultPermalinks,
          // 注意：这里的 slug 规则必须和 src/lib/slugify.ts / Astro glob loader 的 id 归一化一致
          pageResolver: (name) => {
            const base = name.split('#')[0].trim();
            const slug = base
              .toLowerCase()
              .replace(/[()（）]/g, '')
              .replace(/\s/g, '-');
            return [slug];
          },
          hrefTemplate: (permalink) => `/notes/${permalink}`,
          aliasDivider: '|',
          wikiLinkClassName: 'wiki-link',
          newClassName: 'wiki-link-new',
        },
      ],
      remarkObsidianCallout,
      // 必须在 shiki 之前：把 ```mermaid 代码块换成 raw HTML 占位 div
      remarkMermaid,
      remarkGfm,
      remarkMath,
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
          properties: { className: ['heading-anchor'] },
        },
      ],
      rehypeKatex,
      rehypeWrapTables,
    ],
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
      // 把 Obsidian 中常见的代码块语言别名映射到 Shiki 支持的语言，避免大量 "doesn't exist" 警告
      langAlias: {
        R: 'r',
        text: 'plaintext',
        txt: 'plaintext',
      },
    },
  },
});
