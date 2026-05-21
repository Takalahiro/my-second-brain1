<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import type { InferenceResult, LayerActivation } from '../model/types';
  import { layerThumbnailDataUrl } from './activationMaps';
  import {
    buildNetwork3D,
    disposeNetwork3D,
    getLayerFocusY,
    setFlowTubePulse,
    setLayerFlowState,
    type Layer3DNode,
  } from './layerGeometry';

  interface Props {
    inference?: InferenceResult | null;
    activeLayerIndex?: number;
    hoverLayer?: number | null;
    flowPlaying?: boolean;
    onhover?: (i: number | null) => void;
  }
  let {
    inference = null,
    activeLayerIndex = 0,
    hoverLayer = null,
    flowPlaying = false,
    onhover,
  }: Props = $props();

  let container: HTMLDivElement | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let controls: OrbitControls | null = null;
  let networkRoot: THREE.Group | null = null;
  let layerNodes: Layer3DNode[] = [];
  let flowTubes: THREE.Mesh[] = [];
  let raycaster = new THREE.Raycaster();
  let pointer = new THREE.Vector2();
  let animId = 0;
  let resizeObs: ResizeObserver | null = null;
  let pulseT = 0;
  let cameraTargetY = 0;
  let flowState = { activeIndex: 0, playing: false };

  $effect(() => {
    flowState.activeIndex = activeLayerIndex;
    flowState.playing = flowPlaying;
  });

  const activeLayer = $derived(inference?.layers[activeLayerIndex] ?? null);
  const thumbUrl = $derived(activeLayer ? layerThumbnailDataUrl(activeLayer) : '');
  const focusIndex = $derived(hoverLayer ?? activeLayerIndex);

  function layerHint(layer: LayerActivation): string {
    switch (layer.meta.kind) {
      case 'input':
        return '原始 28×28 灰度输入，与 MNIST 对齐';
      case 'conv2d':
        return '卷积核扫描笔画，提取边缘与局部特征';
      case 'pool':
        return '下采样保留最强响应，轮廓更抽象';
      case 'flatten':
        return '多维特征图展平为一维向量';
      case 'dense':
        return layer.meta.shapeLabel === '10'
          ? 'Softmax 输出 0–9 分类概率'
          : '全连接组合高层语义特征';
      default:
        return layer.meta.detail;
    }
  }

  function resize() {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function initScene() {
    if (!container) return;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08050f);
    scene.fog = new THREE.Fog(0x08050f, 20, 48);

    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
    camera.position.set(14, 4, 16);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 8;
    controls.maxDistance = 36;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xb48cff, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(5, 14, 10);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x7ec8ff, 0.35);
    fill.position.set(-8, 6, -4);
    scene.add(fill);

    const grid = new THREE.GridHelper(32, 32, 0x3a2860, 0x14101f);
    grid.position.y = -0.15;
    scene.add(grid);

    resizeObs = new ResizeObserver(resize);
    resizeObs.observe(container);
    resize();

    const tick = (time: number) => {
      animId = requestAnimationFrame(tick);
      pulseT = (Math.sin(time * 0.004) + 1) / 2;
      if (controls && camera) {
        controls.target.y += (cameraTargetY - controls.target.y) * 0.06;
        controls.update();
      }
      if (flowTubes.length) {
        setFlowTubePulse(flowTubes, flowState.activeIndex, flowState.playing ? pulseT : 0.3);
      }
      renderer?.render(scene!, camera!);
    };
    tick(0);
  }

  function rebuildNetwork() {
    if (!scene) return;
    if (networkRoot) {
      scene.remove(networkRoot);
      disposeNetwork3D(networkRoot);
      networkRoot = null;
      layerNodes = [];
      flowTubes = [];
    }
    if (!inference?.layers.length) return;

    const built = buildNetwork3D(inference);
    networkRoot = built.root;
    layerNodes = built.layerNodes;
    flowTubes = built.flowTubes;
    scene.add(networkRoot);
    applyFlowState();
    cameraTargetY = getLayerFocusY(layerNodes, focusIndex);
  }

  function applyFlowState() {
    if (!layerNodes.length) return;
    setLayerFlowState(layerNodes, activeLayerIndex, hoverLayer, flowPlaying);
    cameraTargetY = getLayerFocusY(layerNodes, focusIndex);
  }

  function pickLayer(ev: PointerEvent) {
    if (!camera || !container || layerNodes.length === 0) return;
    const rect = container.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const groups = layerNodes.map((n) => n.group);
    const hits = raycaster.intersectObjects(groups, true);
    if (hits.length === 0) {
      onhover?.(null);
      return;
    }
    let node: THREE.Object3D | null = hits[0].object;
    while (node && node.userData.layerIndex == null) node = node.parent;
    if (node && typeof node.userData.layerIndex === 'number') {
      onhover?.(node.userData.layerIndex);
    }
  }

  onMount(() => {
    initScene();
    rebuildNetwork();
    return () => {
      cancelAnimationFrame(animId);
      resizeObs?.disconnect();
      if (networkRoot) disposeNetwork3D(networkRoot);
      controls?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  });

  $effect(() => {
    void inference;
    rebuildNetwork();
  });

  $effect(() => {
    void activeLayerIndex;
    void hoverLayer;
    void flowPlaying;
    void focusIndex;
    applyFlowState();
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="scene3d"
  bind:this={container}
  onpointermove={pickLayer}
  onpointerleave={() => onhover?.(null)}
>
  {#if !inference?.layers.length}
    <div class="scene3d-empty">
      <p>3D 竖向 · 每层实时展示数字如何被变换</p>
      <span>画数字后自动推理 · 数据流逐层点亮</span>
    </div>
  {:else if activeLayer}
    <aside class="layer-hud">
      <div class="lh-step">
        <span class="lh-idx">{activeLayerIndex + 1}</span>
        <span class="lh-total">/ {inference.layers.length}</span>
      </div>
      {#if thumbUrl}
        <img class="lh-thumb" src={thumbUrl} alt="" width="72" height="72" />
      {/if}
      <div class="lh-text">
        <strong>{activeLayer.meta.name}</strong>
        <span>{activeLayer.meta.typeLabel}</span>
        <span class="lh-shape">{activeLayer.meta.shapeLabel}</span>
        <p>{layerHint(activeLayer)}</p>
      </div>
    </aside>
  {/if}
</div>

<style>
  .scene3d {
    position: relative;
    flex: 1;
    min-height: 360px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgb(180 140 255 / 0.2);
    background: radial-gradient(circle at 50% 20%, rgb(180 140 255 / 0.08), rgb(8 5 15 / 0.95));
  }
  .scene3d :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
  .scene3d-empty {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    text-align: center;
    gap: 6px;
    color: var(--text-secondary);
    font-size: 0.82rem;
    pointer-events: none;
    z-index: 1;
  }
  .scene3d-empty span { font-size: 0.68rem; opacity: 0.75; }
  .layer-hud {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;
    display: flex;
    gap: 10px;
    align-items: flex-start;
    max-width: min(320px, calc(100% - 20px));
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgb(180 140 255 / 0.3);
    background: rgb(8 5 15 / 0.82);
    backdrop-filter: blur(8px);
    pointer-events: none;
  }
  .lh-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.1;
  }
  .lh-idx {
    font-size: 1.4rem;
    font-weight: 800;
    font-family: 'IBM Plex Mono', monospace;
    color: #00ff9d;
  }
  .lh-total { font-size: 0.62rem; color: var(--text-secondary); }
  .lh-thumb {
    border-radius: 8px;
    border: 1px solid rgb(180 140 255 / 0.35);
    image-rendering: pixelated;
    flex-shrink: 0;
  }
  .lh-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .lh-text strong { font-size: 0.78rem; color: #d4c0ff; }
  .lh-text span { font-size: 0.65rem; color: var(--text-secondary); font-family: 'IBM Plex Mono', monospace; }
  .lh-shape { color: #9dffd0 !important; }
  .lh-text p {
    margin: 4px 0 0;
    font-size: 0.68rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }
</style>
