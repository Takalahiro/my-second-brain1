/**
 * 把任意笔记名/wiki link 文本归一化为路由 slug。
 * 必须与 Astro 6 glob loader 内置的 generateId 行为保持一致：
 *   - 全部小写
 *   - 去掉半角/全角小括号 (）
 *   - 多个连续空白合并为单个 -（注意：Astro 不会合并连续 -，例如 "ECMA-262 ) " → "ecma-262--"）
 *
 * 不要做更激进的清理（比如 trim、合并 ---），否则会和 Astro 的 id 不一致导致 404。
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()（）]/g, '')
    .replace(/\s/g, '-');
}

/**
 * 把 Astro content collection 的 id（含子路径 + Astro 已经归一化的 basename）
 * 还原成 URL 末段 slug。
 * 这里只取最后一段，不要再二次 slugify —— Astro 自己已经归一化过 basename，
 * 再 slugify 会把潜在的 -- 合并成 -，导致和实际 URL 不一致。
 */
export function noteIdToSlug(id: string): string {
  return id.split('/').pop() ?? id;
}
