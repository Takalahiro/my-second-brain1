<script lang="ts">
  import type { InferenceResult } from '../model/types';
  import {
    buildDiagramLayout,
    nodeFill,
    nodeStroke,
    type DiagramLayout,
  } from './diagramLayout';

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

  const layout = $derived<DiagramLayout | null>(
    inference?.layers.length ? buildDiagramLayout(inference) : null
  );

  const showAll = $derived(
    !flowPlaying && (inference?.layers.length ?? 0) > 0 && activeLayerIndex >= (inference!.layers.length - 1)
  );

  function layerReached(i: number) {
    return showAll || i <= activeLayerIndex;
  }

  function edgeVisible(layerIndex: number) {
    return showAll || layerIndex < activeLayerIndex;
  }

  function onNodeEnter(layerIndex: number) {
    onhover?.(layerIndex);
  }
</script>

<section class="net-diagram">
  {#if !layout}
    <div class="nd-empty">
      <p>神经元示意图 · 竖向数据流</p>
      <span>画数字后查看各层节点如何传递激活</span>
    </div>
  {:else}
    <div class="nd-scroll">
      <svg
        class="nd-svg"
        viewBox="0 0 {layout.width} {layout.height}"
        preserveAspectRatio="xMidYMin meet"
        role="img"
        aria-label="神经网络神经元连接示意图"
      >
        <defs>
          <marker id="arrow-up" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,8 L4,0 L8,8 Z" fill="#5b9dff" />
          </marker>
          <marker id="arrow-down" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L4,8 L8,0 Z" fill="#ff6b7a" />
          </marker>
        </defs>

        <!-- 输入数字 -->
        <g transform="translate({layout.centerX - 28}, 12)">
          <rect x="-2" y="-2" width="60" height="60" rx="4" fill="none" stroke="#5b9dff" stroke-width="1.5" />
          <image href={layout.inputImageUrl} x="0" y="0" width="56" height="56" />
        </g>
        <line
          x1={layout.centerX}
          y1="74"
          x2={layout.centerX}
          y2={layout.layers[0]?.nodes[0]?.y - 8 ?? 88}
          stroke="rgba(180,140,255,0.4)"
          stroke-width="1.5"
        />

        <!-- 连接线 -->
        {#each layout.edges as edge}
          {@const vis = edgeVisible(edge.layerIndex)}
          <line
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={edge.sign > 0 ? 'rgba(91,157,255,0.35)' : 'rgba(255,107,122,0.35)'}
            stroke-width={vis ? 0.6 : 0.2}
            opacity={vis ? 0.7 : 0.12}
          />
        {/each}

        <!-- 各层节点列 -->
        {#each layout.layers as layer, li}
          {@const reached = layerReached(li)}
          {@const active = li === activeLayerIndex}
          {@const hovered = li === hoverLayer}

          <!-- 层标注 + 神经元数量括号 -->
          <text x="48" y={layer.y} class="nd-bracket" opacity={reached ? 1 : 0.3}>
            {layer.countLabel}
          </text>
          <path
            d="M 72 {layer.nodes[0]?.y ?? layer.y} L 72 {layer.nodes.at(-1)?.y ?? layer.y}"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            stroke-width="1"
            opacity={reached ? 0.8 : 0.2}
          />

          <text x={layout.centerX + 52} y={layer.y - 4} class="nd-layer-label" opacity={reached ? 1 : 0.35}>
            {layer.label}
          </text>

          {#each layer.nodes as node}
            <circle
              cx={node.x}
              cy={node.y}
              r={active ? 5.5 : 4.5}
              fill={nodeFill(node.act, reached)}
              stroke={nodeStroke(active, hovered)}
              stroke-width={active || hovered ? 2 : 1}
              class="nd-node"
              role="presentation"
              onmouseenter={() => onNodeEnter(li)}
              onmouseleave={() => onhover?.(null)}
            />
          {/each}

          {#if li < layout.layers.length - 1}
            <line
              x1={layout.centerX}
              y1={(layer.nodes.at(-1)?.y ?? layer.y) + 10}
              x2={layout.centerX}
              y2={(layout.layers[li + 1]?.nodes[0]?.y ?? layer.y + 40) - 10}
              stroke={active ? '#00ff9d' : 'rgba(180,140,255,0.35)'}
              stroke-width={active ? 2 : 1}
              opacity={reached ? 0.9 : 0.2}
            />
          {/if}
        {/each}

        <!-- Logits + 预测 -->
        {#if layout.layers.length > 0}
          {@const outNodes = layout.layers.at(-1)?.nodes ?? []}
          {#each layout.logits as log, i}
            {@const ny = outNodes[i]?.y ?? 200 + i * 14}
            <text x={layout.centerX + 88} y={ny + 4} class="nd-logit" fill={log.predicted ? '#fff' : 'rgba(255,255,255,0.5)'}>
              {(log.prob * 10).toFixed(1)}
            </text>
            <text x={layout.centerX + 118} y={ny + 4} class="nd-digit">{log.digit}</text>
            {#if log.predicted}
              <line
                x1={layout.centerX + 128}
                y1={ny - 6}
                x2={layout.centerX + 128}
                y2={ny - 16}
                stroke="#5b9dff"
                stroke-width="1.5"
                marker-end="url(#arrow-up)"
              />
            {:else}
              <line
                x1={layout.centerX + 128}
                y1={ny - 6}
                x2={layout.centerX + 128}
                y2={ny + 4}
                stroke="#ff6b7a"
                stroke-width="1.5"
                marker-end="url(#arrow-down)"
              />
            {/if}
          {/each}

          <text x={layout.centerX + 168} y={(layout.layers[0]?.y ?? 100) - 20} class="nd-pred-title">预测</text>
          {#each layout.logits as log, i}
            {@const ny = outNodes[i]?.y ?? 200 + i * 14}
            <text x={layout.centerX + 168} y={ny + 4} class="nd-digit">{log.digit}</text>
            <circle
              cx={layout.centerX + 188}
              cy={ny}
              r="5"
              fill={log.predicted ? '#ffffff' : 'none'}
              stroke="#ffffff"
              stroke-width={log.predicted ? 0 : 1.2}
              opacity={log.predicted ? 1 : 0.45}
            />
          {/each}
        {/if}
      </svg>
    </div>
    <p class="nd-legend">
      <span class="lg-b">蓝线</span> 正权重
      <span class="lg-r">红线</span> 负权重
      <span class="lg-g">节点亮度</span> = 激活强度
    </p>
  {/if}
</section>

<style>
  .net-diagram {
    flex: 1;
    min-height: 360px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-radius: 12px;
    border: 1px solid rgb(180 140 255 / 0.2);
    background: #050308;
    overflow: hidden;
  }
  .nd-scroll {
    flex: 1;
    overflow: auto;
    padding: 8px;
  }
  .nd-svg {
    display: block;
    width: 100%;
    min-height: 360px;
  }
  .nd-empty {
    flex: 1;
    display: grid;
    place-content: center;
    text-align: center;
    gap: 6px;
    color: var(--text-secondary);
    font-size: 0.82rem;
  }
  .nd-empty span { font-size: 0.68rem; opacity: 0.75; }
  .nd-bracket {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    fill: rgba(255, 255, 255, 0.55);
    text-anchor: end;
  }
  .nd-layer-label {
    font-size: 10px;
    fill: #d4c0ff;
    font-family: 'IBM Plex Mono', monospace;
  }
  .nd-logit {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
  }
  .nd-digit {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    fill: rgba(255, 255, 255, 0.75);
  }
  .nd-pred-title {
    font-size: 10px;
    fill: #9dffd0;
    font-weight: 700;
  }
  .nd-node {
    cursor: pointer;
    transition: r 0.2s ease;
  }
  .nd-legend {
    margin: 0;
    padding: 6px 12px 10px;
    font-size: 0.65rem;
    color: var(--text-secondary);
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    border-top: 1px solid rgb(255 255 255 / 0.06);
  }
  .lg-b::before { content: ''; display: inline-block; width: 10px; height: 2px; background: #5b9dff; margin-right: 4px; vertical-align: middle; }
  .lg-r::before { content: ''; display: inline-block; width: 10px; height: 2px; background: #ff6b7a; margin-right: 4px; vertical-align: middle; }
  .lg-g::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ccc; margin-right: 4px; vertical-align: middle; }
</style>
