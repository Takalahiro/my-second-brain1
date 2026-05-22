<script lang="ts">
  import { getPixelIconRects, type PixelIconName } from '../lib/pixel-icons';
  import { getUiIconNodes, uiIconNodeProps } from '../lib/ui-icons';

  interface Props {
    name: PixelIconName;
    size?: number;
    label?: string;
    class?: string;
  }

  let { name, size = 16, label, class: className = '' }: Props = $props();

  const rects = $derived(getPixelIconRects(name));
  const uiNodes = $derived(getUiIconNodes(name));
</script>

<span
  class="app-icon {className}"
  style:width="{size}px"
  style:height="{size}px"
  aria-hidden={label ? undefined : true}
  role={label ? 'img' : undefined}
  aria-label={label}
>
  <svg
    class="app-icon-stroke"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    {#each uiNodes as node, i (i)}
      {@const { tag, attrs } = uiIconNodeProps(node)}
      {#if tag === 'path'}
        <path d={String(attrs.d ?? '')} />
      {:else if tag === 'circle'}
        <circle cx={attrs.cx} cy={attrs.cy} r={attrs.r} />
      {:else if tag === 'rect'}
        <rect
          x={attrs.x}
          y={attrs.y}
          width={attrs.width}
          height={attrs.height}
          rx={attrs.rx}
          ry={attrs.ry}
        />
      {:else if tag === 'line'}
        <line x1={attrs.x1} y1={attrs.y1} x2={attrs.x2} y2={attrs.y2} />
      {:else if tag === 'polyline'}
        <polyline points={String(attrs.points ?? '')} />
      {:else if tag === 'polygon'}
        <polygon points={String(attrs.points ?? '')} />
      {:else if tag === 'ellipse'}
        <ellipse cx={attrs.cx} cy={attrs.cy} rx={attrs.rx} ry={attrs.ry} />
      {/if}
    {/each}
  </svg>

  <svg
    class="app-icon-pixel px-icon"
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shape-rendering="crispEdges"
  >
    {#each rects as [x, y, w, h], i (i)}
      <rect {x} {y} width={w} height={h} fill="currentColor" />
    {/each}
  </svg>
</span>

<style>
  .app-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: -0.15em;
    flex-shrink: 0;
    color: inherit;
    line-height: 0;
  }

  .app-icon-stroke,
  .app-icon-pixel {
    display: block;
  }

  :global(html:not([data-font='jp-pixel'])) .app-icon-pixel {
    display: none;
  }

  :global(html[data-font='jp-pixel']) .app-icon-stroke {
    display: none;
  }

  .app-icon-stroke {
    stroke-width: var(--app-icon-stroke-width, 2);
    stroke-linecap: var(--app-icon-stroke-linecap, round);
    stroke-linejoin: var(--app-icon-stroke-linejoin, round);
  }
</style>
