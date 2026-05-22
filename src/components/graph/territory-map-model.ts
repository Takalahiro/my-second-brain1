// 世界地图模型：国家 → 州 → 城市 → 笔记，缩放自动 LOD，wikilink 弧线动画
import type { RawLink, RawNode } from './graph-data';
import { folderColor, noteHref, PALETTE } from './graph-data';
import {
  buildTerritoryTree,
  type TerritoryTreeNode,
  COUNTRY_BORDER,
  STATE_BORDER,
  REGION_BORDER,
  encodeFolderPath,
  folderHref,
} from './folder-territory';

export { buildTerritoryTree, folderHref, encodeFolderPath, COUNTRY_BORDER, STATE_BORDER, REGION_BORDER };
export { noteHref };

export type EntityKind = 'country' | 'state' | 'city' | 'note' | 'orphan-island';

export type MapEntity = {
  id: string;
  kind: EntityKind;
  name: string;
  path: string; // folder path；note 实体则是笔记 id
  depth: number;
  parentId: string | null;
  pathD: string;
  cx: number;
  cy: number;
  bounds: { x: number; y: number; w: number; h: number };
  color: string;
  stroke: string;
  strokeWidth: number;
  minZoom: number; // 低于这个 zoom 就不画
  href?: string;
  r?: number;
  isOrphan?: boolean; // 没有双向链接的孤岛笔记
};

export type MapLink = {
  id: string;
  sourceId: string;
  targetId: string;
  pathD: string;
  minZoom: number;
};

export type TerritoryMapModel = {
  worldW: number;
  worldH: number;
  entities: MapEntity[];
  links: MapLink[];
};

export const LOD = {
  state: 1.2,
  city: 2.4,
  note: 5.5,
  link: 5.5,
  orphan: 0.35,
} as const;

const PROFILES = ['continental', 'peninsula', 'archipelago', 'island', 'crescent', 'rugged'] as const;

function seeded(seed: string, i = 0) {
  let h = 2166136261 ^ i;
  for (let c = 0; c < seed.length; c++) {
    h ^= seed.charCodeAt(c);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function shadeColor(hex: string, amt: number) {
  const n = hex.replace('#', '');
  if (n.length !== 6) return hex;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${mix(r)} ${mix(g)} ${mix(b)})`;
}

function catmullRomClosed(points: { x: number; y: number }[], tension = 0.48): string {
  const n = points.length;
  if (n < 3) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return `${d} Z`;
}

// 每个国家用不同的轮廓算法，看起来不像复制粘贴
function countryOutline(
  cx: number,
  cy: number,
  r: number,
  profile: (typeof PROFILES)[number],
  seed: string,
): string {
  const n = 44;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let rx = 1;
    let ry = 1;
    const s = seeded(seed, i);
    const s2 = seeded(seed + 'b', i);

    switch (profile) {
      case 'peninsula':
        rx = 0.55 + Math.abs(Math.cos(a)) * 0.65 + s * 0.12;
        ry = 0.75 + Math.sin(a * 2) * 0.18 + s2 * 0.1;
        break;
      case 'archipelago':
        rx = 0.7 + Math.max(0, Math.sin(a * 3 + s * 6)) * 0.45 + s * 0.08;
        ry = 0.65 + Math.max(0, Math.cos(a * 4)) * 0.4 + s2 * 0.08;
        break;
      case 'island':
        rx = 0.82 + s * 0.15;
        ry = 0.78 + s2 * 0.14;
        break;
      case 'crescent':
        rx = 0.9 + Math.cos(a) * 0.35 * (Math.sin(a) > 0 ? 1 : 0.3);
        ry = 0.55 + Math.abs(Math.sin(a)) * 0.35 + s * 0.1;
        break;
      case 'rugged':
        rx = 0.85 + Math.sin(a * 5 + s * 8) * 0.22 + s * 0.12;
        ry = 0.8 + Math.cos(a * 6 + s2 * 7) * 0.2 + s2 * 0.1;
        break;
      default: // continental
        rx = 0.92 + Math.sin(a * 2 + 1.2) * 0.28 + s * 0.14;
        ry = 0.78 + Math.cos(a * 3) * 0.22 + s2 * 0.12;
        if (Math.sin(a * 1.3 + 2) > 0.65) rx *= 0.72;
    }
    pts.push({ x: cx + Math.cos(a) * r * rx, y: cy + Math.sin(a) * r * ry });
  }
  return catmullRomClosed(pts);
}

function innerBlob(cx: number, cy: number, rx: number, ry: number, seed: string, points = 32): string {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const w1 = 0.86 + seeded(`${seed}:a:${i}`) * 0.24;
    const w2 = 0.84 + seeded(`${seed}:b:${i}`) * 0.2;
    pts.push({ x: cx + Math.cos(a) * rx * w1, y: cy + Math.sin(a) * ry * w2 });
  }
  return catmullRomClosed(pts);
}

function boundsFromPath(pathD: string, cx: number, cy: number, r: number) {
  return { x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
}

type OccupiedZone = { cx: number; cy: number; r: number };

// 国家/领土占用的区域，用来找还能放孤岛的空白洋面
function collectOccupiedZones(entities: MapEntity[], pad = 48): OccupiedZone[] {
  return entities
    .filter((e) => e.kind === 'country')
    .map((e) => {
      const br = Math.max(e.bounds.w, e.bounds.h) * 0.52;
      return { cx: e.cx, cy: e.cy, r: br + pad };
    });
}

function zoneClear(x: number, y: number, islandR: number, zones: OccupiedZone[], gap: number) {
  for (const z of zones) {
    if (Math.hypot(x - z.cx, y - z.cy) < z.r + islandR + gap) return false;
  }
  return true;
}

// Fisher-Yates 洗牌：落点顺序随机，但 seed 固定时结果可复现
function shuffleBySeed<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seeded(seed, i) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 在洋面上均匀随机采样落点，只要不和 occupied / placed 重叠就行
function findRandomOceanSlot(
  slotSeed: string,
  islandR: number,
  occupied: OccupiedZone[],
  placed: OccupiedZone[],
  worldW: number,
  worldH: number,
): { x: number; y: number } | null {
  const margin = islandR + 24;
  const gap = 6 + islandR * 0.22;
  const allZones = [...occupied, ...placed];
  const spanX = worldW - margin * 2;
  const spanY = worldH - margin * 2;
  if (spanX <= 0 || spanY <= 0) return null;

  for (let attempt = 0; attempt < 2400; attempt++) {
    const x = margin + seeded(slotSeed, attempt * 2) * spanX;
    const y = margin + seeded(slotSeed, attempt * 2 + 1) * spanY;
    if (zoneClear(x, y, islandR, allZones, gap)) return { x, y };
  }

  // 从随机洋面锚点向外螺旋搜索
  const ax = margin + seeded(slotSeed, 9001) * spanX;
  const ay = margin + seeded(slotSeed, 9002) * spanY;
  for (let ring = 1; ring <= 48; ring++) {
    const steps = 10 + ring * 2;
    for (let s = 0; s < steps; s++) {
      const ang = (s / steps) * Math.PI * 2 + seeded(slotSeed, 9100 + ring) * 0.6;
      const dist = ring * (islandR * 0.85 + 6);
      const x = ax + Math.cos(ang) * dist;
      const y = ay + Math.sin(ang) * dist;
      if (x < margin || x > worldW - margin || y < margin || y > worldH - margin) continue;
      if (zoneClear(x, y, islandR, allZones, gap * 0.85)) return { x, y };
    }
  }
  return null;
}

// 每座孤岛独立随机轮廓（点数、角度、半径都随机）
function randomIslandOutline(cx: number, cy: number, baseR: number, seed: string): string {
  const pointCount = 16 + Math.floor(seeded(seed, 0) * 24);
  const angleJitter = 0.35 + seeded(seed, 1) * 1.1;
  const tension = 0.28 + seeded(seed, 2) * 0.38;
  const rot = seeded(seed, 3) * Math.PI * 2;
  const skewX = 0.65 + seeded(seed, 4) * 0.75;
  const skewY = 0.55 + seeded(seed, 5) * 0.85;
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < pointCount; i++) {
    const a = rot + (i / pointCount) * Math.PI * 2 + (seeded(seed, 10 + i * 3) - 0.5) * angleJitter;
    const radial = 0.42 + seeded(seed, 11 + i * 3) * 0.72;
    const bump = seeded(seed, 12 + i * 3) > 0.82 ? 1.15 + seeded(seed, 200 + i) * 0.35 : 1;
    pts.push({
      x: cx + Math.cos(a) * baseR * radial * skewX * bump,
      y: cy + Math.sin(a) * baseR * radial * skewY * bump,
    });
  }
  return catmullRomClosed(pts, tension);
}

function weight(node: TerritoryTreeNode) {
  return Math.max(1, Math.sqrt(node.totalNotes) + node.children.length * 0.5);
}

type Pack = { node: TerritoryTreeNode; x: number; y: number; r: number };

function packInEllipse(
  nodes: TerritoryTreeNode[],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  pad: number,
): Pack[] {
  if (nodes.length === 0) return [];
  const area = rx * ry * Math.PI * 0.55;
  const total = nodes.reduce((s, n) => s + weight(n), 0);
  const items: Pack[] = nodes.map((node) => ({
    node,
    r: Math.sqrt((weight(node) / total) * area / Math.PI),
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
  const placed: Pack[] = [items[0]];
  for (let i = 1; i < items.length; i++) {
    const cur = items[i];
    let best = { x: cx, y: cy, score: Infinity };
    for (let s = 0; s < 64 + i * 6; s++) {
      const ang = (s / (64 + i * 6)) * Math.PI * 2;
      for (const p of placed) {
        const d = p.r + cur.r + pad;
        const x = p.x + Math.cos(ang) * d;
        const y = p.y + Math.sin(ang) * d;
        const ex = (x - cx) / rx;
        const ey = (y - cy) / ry;
        if (ex * ex + ey * ey > 0.92) continue;
        let score = 0;
        let ok = true;
        for (const q of placed) {
          const dist = Math.hypot(x - q.x, y - q.y);
          const need = q.r + cur.r + pad * 0.5;
          if (dist < need) ok = false;
          score += Math.max(0, need - dist);
        }
        if (ok && score < best.score) best = { x, y, score };
      }
    }
    cur.x = best.x;
    cur.y = best.y;
    placed.push(cur);
  }
  return items;
}

function kindForDepth(depth: number): EntityKind {
  if (depth === 1) return 'country';
  if (depth === 2) return 'state';
  return 'city';
}

function strokeForKind(kind: EntityKind) {
  if (kind === 'country') return { stroke: COUNTRY_BORDER, strokeWidth: 1.8 };
  if (kind === 'state') return { stroke: STATE_BORDER, strokeWidth: 1.2 };
  if (kind === 'city') return { stroke: REGION_BORDER, strokeWidth: 0.9 };
  return { stroke: 'rgb(255 255 255 / 0.35)', strokeWidth: 0.4 };
}

function minZoomForKind(kind: EntityKind) {
  if (kind === 'country') return 0;
  if (kind === 'state') return LOD.state;
  if (kind === 'city') return LOD.city;
  return LOD.note;
}

function notesDirectlyIn(folder: TerritoryTreeNode, nodes: RawNode[]): RawNode[] {
  return nodes.filter((n) => {
    const parts = n.id.split('/');
    const folderPath = parts.slice(0, -1).join('/');
    return folderPath === folder.path;
  });
}

function isOrphanNode(n: RawNode) {
  return n.inDegree + n.outDegree === 0;
}

function layoutNotesInFolder(
  folder: TerritoryTreeNode,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  allNodes: RawNode[],
  rootFolders: string[],
  out: MapEntity[],
  orphanIds: Set<string>,
) {
  const notes = notesDirectlyIn(folder, allNodes).filter((n) => !orphanIds.has(n.id));
  if (notes.length === 0) return;
  const pad = 2.5;
  const fakeNodes = notes.map((n) => ({
    name: n.title,
    path: n.id,
    depth: folder.depth + 1,
    noteCount: 0,
    totalNotes: 1,
    children: [],
  })) as TerritoryTreeNode[];
  const packed = packInEllipse(fakeNodes, cx, cy, rx * 0.85, ry * 0.85, pad);
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    const p = packed[i];
    const nr = Math.max(2.5, Math.min(5.5, p.r * 0.5));
    const rootFolder = folder.path.split('/')[0] || folder.name;
    const base = folderColor(rootFolder, rootFolders);
    out.push({
      id: `note:${n.id}`,
      kind: 'note',
      name: n.title,
      path: n.id,
      depth: folder.depth + 1,
      parentId: folder.path,
      pathD: '',
      cx: p.x,
      cy: p.y,
      r: nr,
      bounds: { x: p.x - nr, y: p.y - nr, w: nr * 2, h: nr * 2 },
      color: shadeColor(base, 0.35),
      ...strokeForKind('note'),
      minZoom: LOD.note,
      href: noteHref(n.id),
    });
  }
}

function layoutFolderRecursive(
  node: TerritoryTreeNode,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rootFolders: string[],
  allNodes: RawNode[],
  out: MapEntity[],
  orphanIds: Set<string>,
  profile?: (typeof PROFILES)[number],
) {
  const kind = kindForDepth(node.depth);
  const rootFolder = node.path.split('/')[0] || node.name;
  const base = folderColor(rootFolder, rootFolders);
  const pathD =
    kind === 'country' && profile
      ? countryOutline(cx, cy, Math.max(rx, ry), profile, node.path)
      : innerBlob(cx, cy, rx, ry, node.path, kind === 'country' ? 40 : 30);
  const r = Math.max(rx, ry);
  const stroke = strokeForKind(kind);

  out.push({
    id: node.path || `root:${node.name}`,
    kind,
    name: node.name,
    path: node.path,
    depth: node.depth,
    parentId: node.path.includes('/') ? node.path.split('/').slice(0, -1).join('/') : '',
    pathD,
    cx,
    cy,
    bounds: boundsFromPath(pathD, cx, cy, r),
    color: kind === 'country' ? base : shadeColor(base, Math.min(0.4, (node.depth - 1) * 0.09)),
    ...stroke,
    minZoom: minZoomForKind(kind),
    href: node.path ? folderHref(node.path) : undefined,
  });

  if (node.children.length === 0) {
    layoutNotesInFolder(node, cx, cy, rx * 0.9, ry * 0.9, allNodes, rootFolders, out, orphanIds);
    return;
  }

  const innerRx = rx * (kind === 'country' ? 0.72 : 0.68);
  const innerRy = ry * (kind === 'country' ? 0.68 : 0.64);
  const pad = kind === 'country' ? 10 : kind === 'state' ? 6 : 4;
  const packed = packInEllipse(node.children, cx, cy, innerRx, innerRy, pad);

  for (const p of packed) {
    const crx = p.r * (0.95 + seeded(p.node.path) * 0.08);
    const cry = p.r * (0.82 + seeded(p.node.path + 'y') * 0.1);
    layoutFolderRecursive(p.node, p.x, p.y, crx, cry, rootFolders, allNodes, out, orphanIds);
  }

  layoutNotesInFolder(node, cx, cy, innerRx * 0.35, innerRy * 0.35, allNodes, rootFolders, out, orphanIds);
}

// 孤岛笔记：落点全随机，只保证彼此（和国家）不重叠
function layoutOrphanArchipelago(
  orphanNodes: RawNode[],
  worldW: number,
  worldH: number,
  rootFolders: string[],
  occupiedEntities: MapEntity[],
  out: MapEntity[],
) {
  if (orphanNodes.length === 0) return;

  const occupied = collectOccupiedZones(occupiedEntities, 48);
  const placed: OccupiedZone[] = [];
  const order = shuffleBySeed(orphanNodes, `orphan-order:${orphanNodes.length}`);
  const sizeMul =
    order.length > 60 ? 0.65 : order.length > 40 ? 0.76 : order.length > 24 ? 0.88 : 1;

  for (let i = 0; i < order.length; i++) {
    const n = order[i];
    let islandR = (7 + seeded(n.id, 7) * 12) * sizeMul;
    let slot = findRandomOceanSlot(`slot:${i}:${n.id}`, islandR, occupied, placed, worldW, worldH);

    for (let shrink = 0; !slot && shrink < 6; shrink++) {
      islandR *= 0.86;
      slot = findRandomOceanSlot(`slot-retry:${i}:${shrink}:${n.id}`, islandR, occupied, placed, worldW, worldH);
    }
    if (!slot) {
      islandR = 5;
      slot = findRandomOceanSlot(`slot-force:${i}:${n.id}`, islandR, occupied, placed, worldW, worldH);
    }
    if (!slot) continue;

    const { x, y } = slot;
    placed.push({ cx: x, cy: y, r: islandR + 6 });

    const rootFolder = n.folder.split('/')[0] || n.folder;
    const base = folderColor(rootFolder, rootFolders);
    const pathD = randomIslandOutline(x, y, islandR, n.id);
    out.push({
      id: `note:${n.id}`,
      kind: 'orphan-island',
      name: n.title,
      path: n.id,
      depth: 0,
      parentId: 'orphan-sea',
      pathD,
      cx: x,
      cy: y,
      r: Math.max(2.5, islandR * 0.26),
      bounds: { x: x - islandR, y: y - islandR, w: islandR * 2, h: islandR * 2 },
      color: shadeColor(base, 0.18 + seeded(n.id, 9) * 0.12),
      stroke: 'rgb(255 255 255 / 0.72)',
      strokeWidth: 0.85 + seeded(n.id, 8) * 0.5,
      minZoom: LOD.orphan,
      isOrphan: true,
      href: noteHref(n.id),
    });
  }
}

// 国家在世界画布上的固定位置（故意分散，拟真一点）
function profileForCountry(path: string, i: number) {
  const h = Math.floor(seeded(path, 99) * PROFILES.length);
  return PROFILES[(h + i) % PROFILES.length];
}

function countryAnchor(i: number, n: number, worldW: number, worldH: number, path: string) {
  const profile = profileForCountry(path, i);
  const cols = Math.ceil(Math.sqrt(n));
  const row = Math.floor(i / cols);
  const col = i % cols;
  const cellW = worldW / (cols + 0.5);
  const cellH = worldH / (Math.ceil(n / cols) + 0.5);
  const jitterX = (seeded(`pos:${i}`, 0) - 0.5) * cellW * 0.25;
  const jitterY = (seeded(`pos:${i}`, 1) - 0.5) * cellH * 0.25;
  const cx = cellW * (col + 0.75) + jitterX;
  const cy = cellH * (row + 0.75) + jitterY;
  const r = Math.min(cellW, cellH) * (0.28 + seeded(`pos:${i}`, 2) * 0.12);
  return { cx, cy, r, profile };
}

export function buildTerritoryMapModel(nodes: RawNode[], links: RawLink[]): TerritoryMapModel {
  const worldW = 3600;
  const worldH = 2400;
  const orphanIds = new Set(nodes.filter(isOrphanNode).map((n) => n.id));
  const tree = buildTerritoryTree(nodes);
  const rootFolders = tree.children.map((c) => c.name);
  const entities: MapEntity[] = [];
  const countries = tree.children;
  const n = countries.length;

  for (let i = 0; i < n; i++) {
    const c = countries[i];
    const { cx, cy, r, profile } = countryAnchor(i, n, worldW, worldH, c.path);
    layoutFolderRecursive(c, cx, cy, r * 1.05, r * 0.9, rootFolders, nodes, entities, orphanIds, profile);
  }

  layoutOrphanArchipelago(nodes.filter((nd) => orphanIds.has(nd.id)), worldW, worldH, rootFolders, entities, entities);

  const noteById = new Map<string, MapEntity>();
  for (const e of entities) {
    if (e.kind === 'note' || e.kind === 'orphan-island') noteById.set(e.path, e);
  }

  const mapLinks: MapLink[] = [];
  let li = 0;
  for (const l of links) {
    const a = noteById.get(l.source);
    const b = noteById.get(l.target);
    if (!a || !b) continue;
    const mx = (a.cx + b.cx) / 2;
    const my = (a.cy + b.cy) / 2 - Math.hypot(b.cx - a.cx, b.cy - a.cy) * 0.22;
    mapLinks.push({
      id: `link:${li++}`,
      sourceId: a.id,
      targetId: b.id,
      pathD: `M ${a.cx.toFixed(1)} ${a.cy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.cx.toFixed(1)} ${b.cy.toFixed(1)}`,
      minZoom: LOD.link,
    });
  }

  return { worldW, worldH, entities, links: mapLinks };
}

export function depthLabel(kind: EntityKind) {
  if (kind === 'country') return '国家';
  if (kind === 'state') return '州/省';
  if (kind === 'city') return '城市';
  if (kind === 'orphan-island') return '孤岛';
  return '笔记';
}

export function worldFitScale(vbW: number, vbH: number, worldW: number, worldH: number) {
  return Math.min(vbW / worldW, vbH / worldH) * 0.92;
}

export function visibleWorldRect(
  panX: number,
  panY: number,
  zoom: number,
  vbW: number,
  vbH: number,
  worldW: number,
  worldH: number,
) {
  const cx = vbW / 2;
  const cy = vbH / 2;
  const s = zoom * worldFitScale(vbW, vbH, worldW, worldH);
  const inv = (sx: number, sy: number) => ({
    x: (sx - panX - cx) / s + worldW / 2,
    y: (sy - panY - cy) / s + worldH / 2,
  });
  const tl = inv(0, 0);
  const br = inv(vbW, vbH);
  return {
    x: Math.min(tl.x, br.x) - 40,
    y: Math.min(tl.y, br.y) - 40,
    w: Math.abs(br.x - tl.x) + 80,
    h: Math.abs(br.y - tl.y) + 80,
  };
}

export function entityVisible(e: MapEntity, zoom: number, view: { x: number; y: number; w: number; h: number }) {
  if (zoom < e.minZoom) return false;
  const b = e.bounds;
  return !(b.x + b.w < view.x || b.x > view.x + view.w || b.y + b.h < view.y || b.y > view.y + view.h);
}

export function linkVisible(l: MapLink, zoom: number) {
  return zoom >= l.minZoom;
}

export function lodLabel(zoom: number) {
  if (zoom < LOD.orphan + 0.2) return '世界 · 国家';
  if (zoom < LOD.state) return '世界 · 空白洋面 · 孤岛';
  if (zoom < LOD.city) return '国家 · 州/省';
  if (zoom < LOD.note) return '州 · 城市';
  return '城市 · 笔记 · 双链';
}

export function rootPalette() {
  return PALETTE;
}
