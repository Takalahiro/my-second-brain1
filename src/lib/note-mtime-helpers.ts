import { getNoteLastUpdated, formatLastUpdated } from './git-mtime';
import type { FolderNode } from './folder-tree';

/** 单篇笔记的「最后更新」展示文本 */
export function noteLastUpdatedText(noteId: string): string | undefined {
  const d = getNoteLastUpdated(noteId);
  return d ? formatLastUpdated(d) : undefined;
}

/** note.id 是否位于 folderPath 下（含子目录） */
export function noteInFolder(noteId: string, folderPath: string): boolean {
  if (!folderPath) return true;
  return noteId.startsWith(folderPath + '/');
}

/** 文件夹下所有笔记中最新的更新时间（用于目录卡片） */
export function maxMtimeForFolder(folderPath: string, noteIds: string[]): string {
  let max: Date | null = null;
  for (const id of noteIds) {
    if (!noteInFolder(id, folderPath)) continue;
    const d = getNoteLastUpdated(id);
    if (d && (!max || d.getTime() > max.getTime())) max = d;
  }
  return max ? formatLastUpdated(max) : '';
}

/** 构建期为目录树笔记填入 lastUpdated 并按 git mtime 排序（仅 SSR / build 调用） */
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
