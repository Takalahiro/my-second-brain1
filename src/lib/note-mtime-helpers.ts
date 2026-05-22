import { getNoteLastUpdated, formatLastUpdated } from './git-mtime';
import type { FolderNode } from './folder-tree';

// 单篇笔记「最后更新」那行字
export function noteLastUpdatedText(noteId: string): string | undefined {
  const d = getNoteLastUpdated(noteId);
  return d ? formatLastUpdated(d) : undefined;
}

// note.id 是不是在 folderPath 下面（子目录也算）
export function noteInFolder(noteId: string, folderPath: string): boolean {
  if (!folderPath) return true;
  return noteId.startsWith(folderPath + '/');
}

// 文件夹里所有笔记里最新的更新时间，目录卡片用
export function maxMtimeForFolder(folderPath: string, noteIds: string[]): string {
  let max: Date | null = null;
  for (const id of noteIds) {
    if (!noteInFolder(id, folderPath)) continue;
    const d = getNoteLastUpdated(id);
    if (d && (!max || d.getTime() > max.getTime())) max = d;
  }
  return max ? formatLastUpdated(max) : '';
}

// 构建期给目录树笔记填 lastUpdated，按 git mtime 排好序（SSR / build 才调）
export function enrichFolderTreeMtime(node: FolderNode): void {
  for (const n of node.notes) {
    const d = getNoteLastUpdated(n.id);
    if (d) n.lastUpdated = formatLastUpdated(d);
  }
  node.notes.sort((a, b) => {
    const da = getNoteLastUpdated(a.id)?.getTime() ?? a.date?.getTime() ?? 0;
    const db = getNoteLastUpdated(b.id)?.getTime() ?? b.date?.getTime() ?? 0;
    if (da !== db) return db - da;
    return a.title.localeCompare(b.title, 'zh-CN');
  });
  for (const child of node.children) enrichFolderTreeMtime(child);
}
