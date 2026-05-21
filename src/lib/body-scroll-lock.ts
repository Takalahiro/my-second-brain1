/** 移动端抽屉/弹层打开时锁定背景滚动（含 iOS） */
let lockCount = 0;
let scrollY = 0;

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  lockCount++;
  if (lockCount > 1) return;
  scrollY = window.scrollY;
  const { body } = document;
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.overflow = 'hidden';
  body.dataset.scrollLocked = '1';
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  const { body } = document;
  body.style.position = '';
  body.style.top = '';
  body.style.left = '';
  body.style.right = '';
  body.style.overflow = '';
  delete body.dataset.scrollLocked;
  window.scrollTo(0, scrollY);
}
