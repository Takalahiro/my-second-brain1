import { noteIdToSlug } from './slugify';

export interface NoteRef {
  // Astro collection 里的 id，比如 "计算机/Machine Learning/基础机器学习 Machine Learning.md"
  id: string;
  // 显示标题，frontmatter.title 没有就用文件名
  title: string;
  // 路由 slug
  slug: string;
  // 可选元数据
  date?: Date;
  // 构建期 git/fs 算出来的最后更新，展示用
  lastUpdated?: string;
  tags?: string[];
  description?: string;
}

export interface FolderNode {
  name: string;
  // 完整路径，比如 "计算机/Machine Learning"
  path: string;
  children: FolderNode[];
  notes: NoteRef[];
}

interface MinimalCollectionEntry {
  id: string;
  data: {
    title?: string;
    date?: Date;
    tags?: string[];
    description?: string;
  };
}

// 把 Astro notes collection 按 id 里的 "/" 段拼成嵌套树，跟 vault 目录层级一致
export function buildFolderTree(notes: MinimalCollectionEntry[]): FolderNode {
  const root: FolderNode = { name: '根目录', path: '', children: [], notes: [] };

  const lookup = new Map<string, FolderNode>();
  lookup.set('', root);

  function ensureFolder(pathParts: string[]): FolderNode {
    if (pathParts.length === 0) return root;
    const path = pathParts.join('/');
    const cached = lookup.get(path);
    if (cached) return cached;
    const parent = ensureFolder(pathParts.slice(0, -1));
    const node: FolderNode = {
      name: pathParts[pathParts.length - 1],
      path,
      children: [],
      notes: [],
    };
    parent.children.push(node);
    lookup.set(path, node);
    return node;
  }

  for (const note of notes) {
    const parts = note.id.split('/');
    const folderParts = parts.slice(0, -1);
    const filename = parts[parts.length - 1];
    const folder = ensureFolder(folderParts);
    const title = note.data.title ?? filename.replace(/\.md$/, '');
    folder.notes.push({
      id: note.id,
      title,
      slug: noteIdToSlug(note.id),
      date: note.data.date,
      tags: note.data.tags,
      description: note.data.description,
    });
  }

  // 排序：先按文件夹名（zh-CN locale），再按笔记日期降序、其次按标题
  function sortRecursive(node: FolderNode) {
    node.children.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    node.notes.sort((a, b) => {
      const da = a.date?.getTime() ?? 0;
      const db = b.date?.getTime() ?? 0;
      if (da !== db) return db - da;
      return a.title.localeCompare(b.title, 'zh-CN');
    });
    node.children.forEach(sortRecursive);
  }
  sortRecursive(root);

  return root;
}

// 数一下文件夹下所有笔记（子文件夹里的也算）
export function countNotes(node: FolderNode): number {
  let count = node.notes.length;
  for (const child of node.children) count += countNotes(child);
  return count;
}
