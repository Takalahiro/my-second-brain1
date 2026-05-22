// 笔记名 / wiki link → 路由 slug
// 必须跟 Astro 6 glob loader 的 generateId 一致：
//   - 全小写
//   - 去掉半角/全角括号 (）
//   - 空白变 -（Astro 不会合并连续 -，比如 "ECMA-262 ) " → "ecma-262--"）
//
// 别乱加 trim、合并 --- 之类的，不然跟 Astro id 对不上会 404
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()（）]/g, '')
    .replace(/\s/g, '-');
}

// collection id（带子路径 + Astro 已归一化的 basename）→ URL 末段 slug
// 只取最后一段，别再 slugify 一遍——Astro 已经处理过 basename，
// 再 slugify 会把 -- 并成 -，跟实际 URL 对不上
export function noteIdToSlug(id: string): string {
  return id.split('/').pop() ?? id;
}
