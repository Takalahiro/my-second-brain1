import GithubSlugger from 'github-slugger';

// 单段标题 / [[wiki link]] 目标 → slug（与 github-slugger 一致）
export function slugify(name: string): string {
  return new GithubSlugger().slug(name);
}

// collection id（如 INFO1110/assessment/练习.md）→ URL slug
// 使用完整子路径，避免不同文件夹下同名笔记（如 MATH/练习 vs INFO1110/.../练习）冲突
export function noteIdToSlug(id: string): string {
  const withoutExt = id.replace(/\.md$/i, '');
  const slugger = new GithubSlugger();
  return withoutExt
    .split('/')
    .map((segment) => slugger.slug(segment))
    .join('/');
}
