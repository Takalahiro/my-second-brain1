import type { TeachingMapNode, TeachingMapNodeId } from './registry';

export type MapPoint = { x: number; y: number };

/** 虚拟画布比视口更大，岛屿更分散 */
export const MAP_WORLD_SCALE = { x: 1.85, y: 1.7 };

export function getWorldSize(viewWidth: number, viewHeight: number) {
 return {
 width: Math.round(viewWidth * MAP_WORLD_SCALE.x),
 height: Math.round(viewHeight * MAP_WORLD_SCALE.y),
 };
}

export function computeMapLayout(
 nodes: TeachingMapNode[],
 worldWidth: number,
 worldHeight: number,
): Map<string, MapPoint> {
 const pos = new Map<string, MapPoint>();
 if (worldWidth < 40 || worldHeight < 40) return pos;

 const ids = new Set(nodes.map((n) => n.id));
 const w = worldWidth;
 const h = worldHeight;

 const hasHub = ids.has('hub');
 const csMinors = nodes.filter((n) => n.tier === 'minor' && n.category === 'cs');

 if (hasHub) {
 pos.set('hub', { x: w * 0.5, y: h * 0.5 });
 }

 if (ids.has('math')) {
 pos.set('math', { x: w * (hasHub ? 0.2 : 0.5), y: h * 0.38 });
 }

 let csCenter: MapPoint | null = null;
 if (ids.has('cs')) {
 csCenter = hasHub
 ? { x: w * 0.74, y: h * 0.44 }
 : { x: w * 0.5, y: h * 0.46 };
 pos.set('cs', csCenter);
 }

 /** 子岛围绕父岛（CS）中心 360° 均匀分布 */
 if (csMinors.length > 0) {
 const center = csCenter ?? { x: w * 0.5, y: h * 0.5 };
 const count = csMinors.length;
 const base = Math.min(w, h) * 0.36;
 const radius = Math.max(base, 240 + count * 14);
 const start = -Math.PI / 2;

 csMinors.forEach((node, i) => {
 const angle = start + ((Math.PI * 2) / count) * i;
 pos.set(node.id, {
 x: center.x + Math.cos(angle) * radius,
 y: center.y + Math.sin(angle) * radius,
 });
 });
 }

 if (nodes.length === 1) {
 pos.set(nodes[0].id, { x: w * 0.5, y: h * 0.5 });
 }

 return pos;
}

export function linkCurvePath(a: MapPoint, b: MapPoint, bend = 0.2): string {
 const mx = (a.x + b.x) / 2;
 const my = (a.y + b.y) / 2;
 const dx = b.x - a.x;
 const dy = b.y - a.y;
 const cx = mx - dy * bend;
 const cy = my + dx * bend;
 return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function panelSide(id: TeachingMapNodeId): 'left' | 'right' | 'bottom' {
 if (id === 'math') return 'left';
 if (id === 'cs') return 'right';
 return 'bottom';
}
