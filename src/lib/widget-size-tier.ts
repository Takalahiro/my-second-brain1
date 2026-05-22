// 小组件三档尺寸，拖大拖小会自动换展示内容
export type WidgetTier = 'compact' | 'medium' | 'expanded';

export const TIER_LABEL: Record<WidgetTier, string> = {
  compact: '紧凑',
  medium: '标准',
  expanded: '宽屏',
};

export type WidgetTierInput = {
  width: number;
  height: number;
  minimized?: boolean;
  maximized?: boolean;
  // 某些小组件想自己调阈值的话用这个
  compactMax?: number;
  expandedMin?: number;
};

export function getWidgetTier(input: WidgetTierInput): WidgetTier {
  const { width: w, height: h, minimized, maximized } = input;
  if (minimized) return 'compact';
  if (maximized) return 'expanded';

  const minDim = Math.min(w, h);
  const area = w * h;
  const compactMax = input.compactMax ?? 320;
  const expandedMin = input.expandedMin ?? 500;

  if (minDim < compactMax || area < 120_000) return 'compact';
  if (minDim >= expandedMin || area >= 380_000 || w >= 780) return 'expanded';
  return 'medium';
}

export function tierClass(tier: WidgetTier) {
  return `widget-tier-${tier}`;
}
