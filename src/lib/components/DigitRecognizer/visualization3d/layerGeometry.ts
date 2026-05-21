import * as THREE from 'three';
import type { InferenceResult, LayerActivation } from '../model/types';
import {
  drawHeatmapToCanvas,
  normalizeMap,
  parseShape,
  pickRepresentativeMap,
} from './activationMaps';

export type Layer3DNode = {
  group: THREE.Group;
  width: number;
  heightField: THREE.Mesh | null;
  heatmapPlane: THREE.Mesh | null;
  bars: THREE.InstancedMesh | null;
};

export type Network3DBuild = {
  root: THREE.Group;
  layerNodes: Layer3DNode[];
  flowTubes: THREE.Mesh[];
  layerSpacing: number[];
};

const MINT = new THREE.Color(0x00ff9d);
const PURPLE = new THREE.Color(0xb48cff);

function activationColor(t: number, target: THREE.Color) {
  target.setRGB(0.12 + t * 0.55, 0.08 + t * 0.45, 0.22 + t * 0.65);
  return target;
}

function buildHeightField(
  data: Float32Array,
  h: number,
  w: number,
  cellSize: number,
  heightScale: number
): THREE.Mesh {
  const norm = normalizeMap(data);
  const geo = new THREE.PlaneGeometry(w * cellSize, h * cellSize, Math.max(1, w - 1), Math.max(1, h - 1));
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const ix = i % w;
    const iy = Math.floor(i / w);
    const sy = Math.min(h - 1, iy);
    const sx = Math.min(w - 1, ix);
    const t = norm[sy * w + sx] ?? 0;
    pos.setZ(i, t * heightScale);
    activationColor(t, color);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.25,
    roughness: 0.38,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.userData.isHeightField = true;
  return mesh;
}

function buildHeatmapPlane(data: Float32Array, h: number, w: number, cellSize: number): THREE.Mesh {
  const canvas = drawHeatmapToCanvas(data, h, w, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const planeW = w * cellSize;
  const planeH = h * cellSize;
  const geo = new THREE.PlaneGeometry(planeW, planeH);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  mesh.userData.isHeatmap = true;
  mesh.userData.canvas = canvas;
  mesh.userData.texture = tex;
  return mesh;
}

function buildDenseBars(layer: LayerActivation, boxGeo: THREE.BoxGeometry, maxBars: number) {
  const vals = layer.data instanceof Float32Array ? Array.from(layer.data) : layer.data;
  const n = Math.min(vals.length, maxBars);
  const step = Math.max(1, Math.floor(vals.length / n));
  const sampled: number[] = [];
  for (let i = 0; i < vals.length; i += step) sampled.push(vals[i] ?? 0);
  const max = Math.max(...sampled.map(Math.abs), 1e-6);
  const mesh = new THREE.InstancedMesh(
    boxGeo,
    new THREE.MeshStandardMaterial({ metalness: 0.2, roughness: 0.4, transparent: true, opacity: 0.92 }),
    sampled.length
  );
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const gap = 0.14;
  sampled.forEach((v, i) => {
    const t = Math.abs(v) / max;
    const bh = 0.15 + t * 2.2;
    dummy.position.set((i - sampled.length / 2) * gap, bh / 2, 0);
    dummy.scale.set(0.1, bh, 0.1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    activationColor(t, color);
    mesh.setColorAt(i, color);
  });
  mesh.count = sampled.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.userData.isBars = true;
  return { mesh, width: sampled.length * gap * 0.55 };
}

function addLayerLabel(group: THREE.Group, layer: LayerActivation, y: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(10,6,18,0.82)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#d4c0ff';
  ctx.font = '600 36px IBM Plex Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(layer.meta.name, canvas.width / 2, 52);
  ctx.fillStyle = '#9dffd0';
  ctx.font = '500 28px IBM Plex Mono, monospace';
  ctx.fillText(layer.meta.shapeLabel || layer.meta.typeLabel, canvas.width / 2, 98);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(3.6, 0.9, 1);
  sprite.position.set(0, y, 0);
  sprite.userData.isLabel = true;
  group.add(sprite);
}

function buildLayerNode(layer: LayerActivation, index: number, boxGeo: THREE.BoxGeometry): Layer3DNode {
  const group = new THREE.Group();
  group.userData.layerIndex = index;
  group.userData.layer = layer;

  const kind = layer.meta.kind;
  let width = 2.8;
  let heightField: THREE.Mesh | null = null;
  let heatmapPlane: THREE.Mesh | null = null;
  let bars: THREE.InstancedMesh | null = null;

  if (kind === 'input' || kind === 'conv2d' || kind === 'pool') {
    const { data, h, w } = pickRepresentativeMap(layer);
    const cellSize = kind === 'input' ? 0.1 : kind === 'pool' ? 0.14 : 0.11;
    const heightScale = kind === 'input' ? 1.8 : kind === 'pool' ? 1.2 : 1.5;
    heightField = buildHeightField(data, h, w, cellSize, heightScale);
    heatmapPlane = buildHeatmapPlane(data, h, w, cellSize);
    heatmapPlane.position.y = heightScale + 0.15;
    group.add(heightField);
    group.add(heatmapPlane);
    width = Math.max(w, h) * cellSize * 0.65;
  } else {
    const isOutput = layer.meta.name.includes('Softmax') || layer.meta.shapeLabel === '10';
    const result = buildDenseBars(layer, boxGeo, kind === 'flatten' ? 40 : isOutput ? 10 : 32);
    bars = result.mesh;
    group.add(bars);
    width = result.width;
    const { data, h, w } = pickRepresentativeMap(layer);
    heatmapPlane = buildHeatmapPlane(data, h, w, 0.12);
    heatmapPlane.position.y = 2.4;
    heatmapPlane.scale.setScalar(0.85);
    group.add(heatmapPlane);
  }

  addLayerLabel(group, layer, kind === 'dense' ? 3.2 : 2.6);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width * 2 + 0.5, 0.03, width * 2 + 0.5),
    new THREE.MeshStandardMaterial({ color: 0x1a1228, transparent: true, opacity: 0.4 })
  );
  frame.position.y = -0.08;
  frame.userData.isFrame = true;
  group.add(frame);

  return { group, width: width + 1.8, heightField, heatmapPlane, bars };
}

function addFlowTube(root: THREE.Group, from: THREE.Vector3, to: THREE.Vector3, index: number) {
  const curve = new THREE.LineCurve3(from, to);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 1, 0.05, 8, false),
    new THREE.MeshStandardMaterial({
      color: 0x6a4fa8,
      emissive: 0x2a1848,
      transparent: true,
      opacity: 0.45,
    })
  );
  tube.userData.flowIndex = index;
  tube.userData.isFlowTube = true;
  root.add(tube);
  return tube;
}

export function buildNetwork3D(inference: InferenceResult): Network3DBuild {
  const root = new THREE.Group();
  const layerNodes: Layer3DNode[] = [];
  const flowTubes: THREE.Mesh[] = [];
  const layerSpacing: number[] = [];
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const positions: THREE.Vector3[] = [];
  let y = 0;

  inference.layers.forEach((layer, i) => {
    const node = buildLayerNode(layer, i, boxGeo);
    node.group.position.y = -y;
    layerNodes.push(node);
    layerSpacing.push(node.width);
    positions.push(new THREE.Vector3(0, -y + 0.5, 0));
    root.add(node.group);
    y += node.width + 2.4;
  });

  for (let i = 0; i < positions.length - 1; i++) {
    const a = positions[i].clone();
    const b = positions[i + 1].clone();
    a.y -= layerSpacing[i] * 0.42;
    b.y += layerSpacing[i + 1] * 0.42;
    flowTubes.push(addFlowTube(root, a, b, i));
  }

  root.position.y = y / 2;
  boxGeo.dispose();
  return { root, layerNodes, flowTubes, layerSpacing };
}

/** 数据流渐进揭示：已到达层显示真实激活，未到达层为占位幽灵 */
export function setLayerFlowState(
  layerNodes: Layer3DNode[],
  activeIndex: number,
  hoverIndex: number | null,
  flowPlaying: boolean
) {
  const showAll = !flowPlaying && activeIndex >= layerNodes.length - 1;

  layerNodes.forEach((node, i) => {
    const reached = showAll || i <= activeIndex;
    const active = i === activeIndex;
    const hovered = i === hoverIndex;
    const lit = active || hovered;

    node.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        if (obj.userData.isFrame) {
          obj.material.opacity = reached ? 0.45 : 0.15;
          obj.material.emissive.set(lit ? MINT : 0x000000);
          obj.material.emissiveIntensity = lit ? 0.35 : 0;
          return;
        }
        if (obj.userData.isHeightField) {
          obj.material.opacity = reached ? (lit ? 1 : 0.88) : 0.12;
          obj.material.emissive.set(lit ? MINT : 0x000000);
          obj.material.emissiveIntensity = lit ? 0.25 : 0;
          obj.visible = true;
          return;
        }
      }
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshBasicMaterial && obj.userData.isHeatmap) {
        obj.visible = reached;
        obj.material.opacity = lit ? 0.95 : reached ? 0.75 : 0.1;
        return;
      }
      if (obj instanceof THREE.InstancedMesh && obj.material instanceof THREE.MeshStandardMaterial) {
        obj.visible = reached;
        obj.material.opacity = reached ? (lit ? 1 : 0.85) : 0.1;
        obj.material.emissive.set(lit ? MINT : 0x000000);
        obj.material.emissiveIntensity = lit ? 0.35 : 0;
      }
      if (obj instanceof THREE.Sprite) {
        obj.visible = reached || i === activeIndex + 1;
        const mat = obj.material as THREE.SpriteMaterial;
        mat.opacity = reached ? 1 : 0.35;
      }
    });

    node.group.scale.setScalar(lit ? 1.06 : reached ? 1 : 0.92);
    node.group.position.z = lit ? 0.25 : 0;
  });
}

export function setFlowTubePulse(tubes: THREE.Mesh[], activeIndex: number, pulse: number) {
  tubes.forEach((tube, i) => {
    const mat = tube.material as THREE.MeshStandardMaterial;
    if (i === activeIndex) {
      mat.opacity = 0.55 + pulse * 0.45;
      mat.emissive.set(PURPLE).multiplyScalar(0.3 + pulse * 0.5);
    } else if (i < activeIndex) {
      mat.opacity = 0.65;
      mat.emissive.set(MINT).multiplyScalar(0.15);
    } else {
      mat.opacity = 0.2;
      mat.emissive.set(0x000000);
    }
  });
}

export function getLayerFocusY(layerNodes: Layer3DNode[], index: number): number {
  const node = layerNodes[index];
  if (!node) return 0;
  return node.group.position.y + (node.group.parent?.position.y ?? 0);
}

export function disposeNetwork3D(root: THREE.Group) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
      obj.geometry.dispose();
      if (obj.userData.texture instanceof THREE.Texture) obj.userData.texture.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
    if (obj instanceof THREE.Sprite && obj.material instanceof THREE.SpriteMaterial) {
      obj.material.map?.dispose();
      obj.material.dispose();
    }
  });
}
