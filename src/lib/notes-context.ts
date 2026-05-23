/** 笔记相关路由：列表、详情、文件夹浏览、标签 */
export function isNotesContextPath(pathname: string): boolean {
  return (
    pathname === '/notes' ||
    pathname.startsWith('/notes/') ||
    pathname.startsWith('/folder/') ||
    pathname === '/tags' ||
    pathname.startsWith('/tags/')
  );
}
