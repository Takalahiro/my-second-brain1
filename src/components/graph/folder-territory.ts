import type { RawNode } from './graph-data';
import { folderColor, PALETTE } from './graph-data';

export type TerritoryTreeNode = {
  name: string;
  path: string;
  depth: number;
  noteCount: number;
  totalNotes: number;
  children: TerritoryTreeNode[];
};

export type TerritoryBounds = { x: number; y: number; w: number; h: number };

export type TerritoryRegion = {
  id: string;
  name: string;
  path: string;
  depth: number;
  rootFolder: string;
  noteCount: number;
  totalNotes: number;
  childCount: number;
  pathD: string;
  cx: number;
  cy: number;
  bounds: TerritoryBounds;
  color: string;
  borderKind: 'country' | 'state' | 'region';
};

export const COUNTRY_BORDER = '#d4c4a0';
export const STATE_BORDER = '#8faecf';
export const REGION_BORDER = '#6a8ab0';

export function encodeFolderPath(path: string) {
  return path
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

export function folderHref(path: string) {
  if (!path) return '/notes/';
  return `/folder/${encodeFolderPath(path)}/`;
}

export function buildTerritoryTree(nodes: RawNode[]): TerritoryTreeNode {
  const root: TerritoryTreeNode = {
    name: '世界',
    path: '',
    depth: 0,
    noteCount: 0,
    totalNotes: 0,
    children: [],
  };
  const lookup = new Map<string, TerritoryTreeNode>([['', root]]);

  function ensure(pathParts: string[]) {
    if (pathParts.length === 0) return root;
    const path = pathParts.join('/');
    const hit = lookup.get(path);
    if (hit) return hit;
    const parent = ensure(pathParts.slice(0, -1));
    const node: TerritoryTreeNode = {
      name: pathParts[pathParts.length - 1],
      path,
      depth: pathParts.length,
      noteCount: 0,
      totalNotes: 0,
      children: [],
    };
    parent.children.push(node);
    lookup.set(path, node);
    return node;
  }

  for (const n of nodes) {
    const parts = n.id.split('/');
    if (parts.length <= 1) {
      root.noteCount += 1;
      continue;
    }
    const folderParts = parts.slice(0, -1);
    ensure(folderParts);
    const leaf = lookup.get(folderParts.join('/'))!;
    leaf.noteCount += 1;
  }

  function sortAndCount(node: TerritoryTreeNode): number {
    node.children.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    let total = node.noteCount;
    for (const c of node.children) total += sortAndCount(c);
    node.totalNotes = total;
    return total;
  }
  sortAndCount(root);
  return root;
}

export function findTerritoryNode(tree: TerritoryTreeNode, path: string): TerritoryTreeNode | null {
  if (tree.path === path) return tree;
  for (const c of tree.children) {
    const hit = findTerritoryNode(c, path);
    if (hit) return hit;
  }
  return null;
}

function weightOf(node: TerritoryTreeNode) {
  return Math.max(1, Math.sqrt(node.totalNotes) + node.children.length * 0.6);
}

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function shadeColor(hex: string, depth: number) {
  const amt = Math.min(0.38, depth * 0.08);
  const n = hex.replace('#', '');
  if (n.length !== 6) return hex;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${mix(r)} ${mix(g)} ${mix(b)})`;
}

type PackItem = { node: TerritoryTreeNode; r: number; x: number; y: number };

function packCircles(
  nodes: TerritoryTreeNode[],
  width: number,
  height: number,
  padding: number,
): PackItem[] {
  if (nodes.length === 0) return [];
  const cx = width / 2;
  const cy = height / 2;
  const area = width * height * 0.52;
  const totalW = nodes.reduce((s, n) => s + weightOf(n), 0);
  const items = nodes.map((node) => ({
    node,
    r: Math.sqrt((weightOf(node) / totalW) * area / Math.PI),
    x: cx,
    y: cy,
  }));
  items.sort((a, b) => b.r - a.r);

  if (items.length === 1) {
    items[0].x = cx;
    items[0].y = cy;
    return items;
  }

  items[0].x = cx;
  items[0].y = cy;
  const placed: PackItem[] = [items[0]];

  for (let i = 1; i < items.length; i++) {
    const cur = items[i];
    let best = { x: cx, y: cy, score: Infinity };
    const steps = 48 + i * 8;
    for (let s = 0; s < steps; s++) {
      const ang = (s / steps) * Math.PI * 2 + seeded(cur.node.path) * 0.6;
      for (const p of placed) {
        const dist = p.r + cur.r + padding;
        const x = p.x + Math.cos(ang) * dist;
        const y = p.y + Math.sin(ang) * dist;
        let ok = true;
        let score = 0;
        for (const q of placed) {
          const dx = x - q.x;
          const dy = y - q.y;
          const d = Math.hypot(dx, dy);
          const need = q.r + cur.r + padding * 0.6;
          if (d < need) ok = false;
          score += Math.max(0, need - d);
        }
        const edge = Math.min(x - cur.r, y - cur.r, width - x - cur.r, height - y - cur.r);
        if (edge < 0) ok = false;
        score += Math.max(0, -edge) * 3;
        score += Math.hypot(x - cx, y - cy) * 0.02;
        if (ok && score < best.score) best = { x, y, score };
      }
    }
    cur.x = best.x;
    cur.y = best.y;
    placed.push(cur);
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of items) {
    minX = Math.min(minX, p.x - p.r);
    minY = Math.min(minY, p.y - p.r);
    maxX = Math.max(maxX, p.x + p.r);
    maxY = Math.max(maxY, p.y + p.r);
  }
  const bw = maxX - minX;
  const bh = maxY - minY;
  const scale = Math.min((width - padding * 2) / bw, (height - padding * 2) / bh, 1.15);
  const ox = (width - bw * scale) / 2 - minX * scale;
  const oy = (height - bh * scale) / 2 - minY * scale;
  for (const p of items) {
    p.x = p.x * scale + ox;
    p.y = p.y * scale + oy;
    p.r *= scale;
  }
  return items;
}

function catmullRomClosed(points: { x: number; y: number }[], tension = 0.42): string {
  const n = points.length;
  if (n < 3) return '';
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return `${d} Z`;
}

function organicBlob(cx: number, cy: number, rx: number, ry: number, seed: string, points = 28): string {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const w1 = 0.9 + seeded(`${seed}:w:${i}`) * 0.22;
    const w2 = 0.88 + seeded(`${seed}:v:${i}`) * 0.18;
    pts.push({ x: cx + Math.cos(a) * rx * w1, y: cy + Math.sin(a) * ry * w2 });
  }
  return catmullRomClosed(pts);
}

function boundsOfBlob(cx: number, cy: number, rx: number, ry: number): TerritoryBounds {
  return { x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2 };
}

function nodeToRegion(
  node: TerritoryTreeNode,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rootFolders: string[],
  borderKind: TerritoryRegion['borderKind'],
): TerritoryRegion {
  const rootFolder = node.path.split('/')[0] || node.name;
  const base = folderColor(rootFolder, rootFolders.length ? rootFolders : [rootFolder]);
  const depthFromCountry = Math.max(0, node.depth - 1);
  return {
    id: node.path,
    name: node.name,
    path: node.path,
    depth: node.depth,
    rootFolder,
    noteCount: node.noteCount,
    totalNotes: node.totalNotes,
    childCount: node.children.length,
    pathD: organicBlob(cx, cy, rx, ry, node.path),
    cx,
    cy,
    bounds: boundsOfBlob(cx, cy, rx, ry),
    color: node.depth === 1 ? base : shadeColor(base, depthFromCountry),
    borderKind,
  };
}

export function layoutWorldCountries(tree: TerritoryTreeNode, width = 1200, height = 760): TerritoryRegion[] {
  const rootFolders = tree.children.map((c) => c.name);
  const packed = packCircles(tree.children, width, height, 36);
  return packed.map((p) =>
    nodeToRegion(p.node, p.x, p.y, p.r * 1.02, p.r * 0.88, rootFolders, 'country'),
  );
}

export function layoutCountryStates(country: TerritoryTreeNode, width = 1200, height = 760): TerritoryRegion[] {
  const rootFolders = [country.name];
  const packed = packCircles(country.children, width, height, 28);
  const out: TerritoryRegion[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const coverR = Math.min(width, height) * 0.46;

  out.push({
    ...nodeToRegion(country, cx, cy, coverR * 1.05, coverR * 0.92, rootFolders, 'country'),
    color: shadeColor(folderColor(country.name, rootFolders), 0.12),
  });

  for (const p of packed) {
    out.push(nodeToRegion(p.node, p.x, p.y, p.r * 0.98, p.r * 0.84, rootFolders, 'state'));
  }
  return out;
}

export type TerritoryRect = TerritoryRegion & { x: number; y: number; w: number; h: number };

export function layoutTerritories(tree: TerritoryTreeNode, width = 1200, height = 760): TerritoryRect[] {
  return layoutWorldCountries(tree, width, height).map((r) => ({
    ...r,
    x: r.bounds.x,
    y: r.bounds.y,
    w: r.bounds.w,
    h: r.bounds.h,
  }));
}

export function depthLabel(depth: number) {
  if (depth === 1) return '国家';
  if (depth === 2) return '州/省';
  if (depth === 3) return '地区';
  return `L${depth}`;
}

export function borderColor(kind: TerritoryRegion['borderKind']) {
  if (kind === 'country') return COUNTRY_BORDER;
  if (kind === 'state') return STATE_BORDER;
  return REGION_BORDER;
}

export function rootPalette() {
  return PALETTE;
}

export function fitViewToBounds(bounds: TerritoryBounds, vbW: number, vbH: number, margin = 0.1) {
  const mx = vbW * margin;
  const my = vbH * margin;
  const zoom = Math.min((vbW - mx * 2) / Math.max(bounds.w, 1), (vbH - my * 2) / Math.max(bounds.h, 1), 6);
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  return { zoom, panX: vbW / 2 - cx * zoom, panY: vbH / 2 - cy * zoom };
}

export function unionBounds(regions: TerritoryRegion[]): TerritoryBounds {
  if (regions.length === 0) return { x: 0, y: 0, w: 1200, h: 760 };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of regions) {
    x0 = Math.min(x0, r.bounds.x);
    y0 = Math.min(y0, r.bounds.y);
    x1 = Math.max(x1, r.bounds.x + r.bounds.w);
    y1 = Math.max(y1, r.bounds.y + r.bounds.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
