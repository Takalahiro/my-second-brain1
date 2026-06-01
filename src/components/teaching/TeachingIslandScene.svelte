<script lang="ts">
  import type { TeachingBuildingId } from '../../lib/teaching/registry';

  interface Props {
    building: TeachingBuildingId;
    accent: string;
    active?: boolean;
    compact?: boolean;
  }

  let { building, accent, active = false, compact = false }: Props = $props();

  const uid = $derived(`bld-${building}`);
</script>

<svg
  class="island-scene"
  class:is-active={active}
  class:is-compact={compact}
  viewBox="0 0 140 96"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{uid}-land" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2a3348" />
      <stop offset="100%" stop-color="#141a28" />
    </linearGradient>
    <linearGradient id="{uid}-shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color={accent} stop-opacity="0.55" />
      <stop offset="100%" stop-color={accent} stop-opacity="0.05" />
    </linearGradient>
    <filter id="{uid}-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <ellipse cx="70" cy="82" rx="52" ry="11" fill="url(#{uid}-land)" opacity="0.95" />
  <ellipse cx="70" cy="80" rx="44" ry="8" fill="url(#{uid}-shine)" opacity="0.7" />

  {#if building === 'math-temple'}
    <g filter="url(#{uid}-glow)">
      <polygon points="70,18 98,38 42,38" fill="#1e2838" stroke={accent} stroke-width="1.2" />
      <rect x="48" y="38" width="10" height="28" rx="1" fill="#243044" stroke={accent} stroke-width="0.8" />
      <rect x="65" y="38" width="10" height="28" rx="1" fill="#243044" stroke={accent} stroke-width="0.8" />
      <rect x="82" y="38" width="10" height="28" rx="1" fill="#243044" stroke={accent} stroke-width="0.8" />
      <rect x="44" y="64" width="52" height="6" rx="1" fill="#1a2232" stroke={accent} stroke-width="0.6" />
      <text x="70" y="58" text-anchor="middle" fill={accent} font-size="10" opacity="0.7">π</text>
      <line x1="70" y1="18" x2="70" y2="10" stroke={accent} stroke-width="1.5" />
      <circle cx="70" cy="8" r="2.5" fill={accent} />
    </g>
  {:else if building === 'cs-cpu'}
    <g filter="url(#{uid}-glow)">
      <rect x="46" y="36" width="48" height="36" rx="3" fill="#1a2234" stroke={accent} stroke-width="1.2" />
      {#each [50, 58, 66, 74, 82] as px (px)}
        <rect x={px} y="32" width="4" height="6" rx="0.5" fill={accent} opacity="0.55" />
        <rect x={px} y="70" width="4" height="6" rx="0.5" fill={accent} opacity="0.55" />
      {/each}
      {#each [40, 48, 56, 64] as py (py)}
        <rect x="42" y={py} width="6" height="4" rx="0.5" fill={accent} opacity="0.45" />
        <rect x="92" y={py} width="6" height="4" rx="0.5" fill={accent} opacity="0.45" />
      {/each}
      <rect x="54" y="44" width="32" height="20" rx="2" fill="#12182a" stroke={accent} stroke-width="0.7" />
      <text x="70" y="57" text-anchor="middle" fill={accent} font-size="7" font-family="monospace">CPU</text>
    </g>
  {:else if building === 'cs-tree'}
    <g filter="url(#{uid}-glow)">
      <rect x="64" y="58" width="12" height="14" rx="1" fill="#1e2838" stroke={accent} stroke-width="0.8" />
      <line x1="70" y1="58" x2="70" y2="48" stroke={accent} stroke-width="1.4" />
      <line x1="70" y1="48" x2="58" y2="38" stroke={accent} stroke-width="1.2" />
      <line x1="70" y1="48" x2="82" y2="38" stroke={accent} stroke-width="1.2" />
      <line x1="58" y1="38" x2="50" y2="30" stroke={accent} stroke-width="1" opacity="0.85" />
      <line x1="58" y1="38" x2="66" y2="30" stroke={accent} stroke-width="1" opacity="0.85" />
      <line x1="82" y1="38" x2="74" y2="30" stroke={accent} stroke-width="1" opacity="0.85" />
      <line x1="82" y1="38" x2="90" y2="30" stroke={accent} stroke-width="1" opacity="0.85" />
      {#each [[50, 30], [66, 30], [74, 30], [90, 30], [58, 38], [82, 38], [70, 48]] as node, i (i)}
        <circle cx={node[0]} cy={node[1]} r="3.5" fill="#1c2436" stroke={accent} stroke-width="0.9" />
      {/each}
    </g>
  {:else if building === 'cs-graph'}
    <g filter="url(#{uid}-glow)">
      <rect x="48" y="62" width="44" height="8" rx="1" fill="#1a2232" stroke={accent} stroke-width="0.6" />
      {#each [[52, 34], [70, 26], [88, 34], [60, 50], [80, 50]] as [cx, cy], i (i)}
        <circle cx={cx} cy={cy} r="5" fill="#1e2838" stroke={accent} stroke-width="1" />
        <text x={cx} y={cy + 2.5} text-anchor="middle" fill={accent} font-size="6">{i + 1}</text>
      {/each}
      <line x1="52" y1="34" x2="70" y2="26" stroke={accent} stroke-width="0.9" opacity="0.7" />
      <line x1="70" y1="26" x2="88" y2="34" stroke={accent} stroke-width="0.9" opacity="0.7" />
      <line x1="52" y1="34" x2="60" y2="50" stroke={accent} stroke-width="0.9" opacity="0.7" />
      <line x1="88" y1="34" x2="80" y2="50" stroke={accent} stroke-width="0.9" opacity="0.7" />
      <line x1="60" y1="50" x2="80" y2="50" stroke={accent} stroke-width="0.9" opacity="0.7" />
      <path d="M 70 58 L 74 52 L 78 58 Z" fill={accent} opacity="0.5" />
    </g>
  {:else if building === 'cs-layers'}
    <g filter="url(#{uid}-glow)">
      {#each [0, 1, 2, 3] as layer (layer)}
        <rect
          x={44 + layer * 4}
          y={30 + layer * 10}
          width={52 - layer * 4}
          height="8"
          rx="1.5"
          fill="#1c2436"
          stroke={accent}
          stroke-width="0.8"
          opacity={0.55 + layer * 0.12}
        />
      {/each}
      <rect x="52" y="68" width="36" height="6" rx="1" fill="#141c2a" stroke={accent} stroke-width="0.5" />
      <text x="70" y="38" text-anchor="middle" fill={accent} font-size="5" opacity="0.8">APP</text>
      <text x="70" y="48" text-anchor="middle" fill={accent} font-size="5" opacity="0.75">OS</text>
      <text x="70" y="58" text-anchor="middle" fill={accent} font-size="5" opacity="0.7">HW</text>
    </g>
  {:else if building === 'cs-pipeline'}
    <g filter="url(#{uid}-glow)">
      <rect x="34" y="50" width="72" height="14" rx="2" fill="#1a2232" stroke={accent} stroke-width="0.8" />
      {#each ['词法', '语法', '语义', '生成'] as label, i (label)}
        <rect x={38 + i * 17} y="38" width="14" height="12" rx="1.5" fill="#1e2838" stroke={accent} stroke-width="0.7" />
        <text x={45 + i * 17} y="47" text-anchor="middle" fill={accent} font-size="4.5">{label}</text>
        {#if i < 3}
          <polygon
            points={`${52 + i * 17},44 ${56 + i * 17},44 ${54 + i * 17},48`}
            fill={accent}
            opacity="0.6"
          />
        {/if}
      {/each}
      <rect x="46" y="54" width="48" height="6" rx="1" fill={accent} opacity={active ? 0.35 : 0.18} />
    </g>
  {:else if building === 'cs-antenna'}
    <g filter="url(#{uid}-glow)">
      <rect x="52" y="48" width="36" height="22" rx="2" fill="#1e2838" stroke={accent} stroke-width="0.9" />
      <line x1="70" y1="48" x2="70" y2="28" stroke={accent} stroke-width="1.4" />
      <line x1="70" y1="32" x2="58" y2="38" stroke={accent} stroke-width="0.9" opacity="0.65" />
      <line x1="70" y1="32" x2="82" y2="38" stroke={accent} stroke-width="0.9" opacity="0.65" />
      <circle cx="70" cy="26" r="4" fill="#1c2436" stroke={accent} stroke-width="1" />
      <path d="M 76 24 Q 92 18 104 24" fill="none" stroke={accent} stroke-width="0.8" opacity="0.45" />
      <path d="M 64 24 Q 48 18 36 24" fill="none" stroke={accent} stroke-width="0.8" opacity="0.45" />
      <rect x="58" y="56" width="24" height="6" rx="1" fill={accent} opacity="0.25" />
      <circle cx="70" cy="59" r="1.5" fill={accent} />
    </g>
  {:else if building === 'cs-neural'}
    <g filter="url(#{uid}-glow)">
      <rect x="50" y="58" width="40" height="14" rx="2" fill="#1a2234" stroke={accent} stroke-width="0.8" />
      <ellipse cx="70" cy="42" rx="22" ry="14" fill="#1e2838" stroke={accent} stroke-width="1" />
      {#each [58, 70, 82] as ix, col (col)}
        {#each [36, 48] as iy, row (row)}
          <circle cx={ix} cy={iy} r="3" fill="#141c2a" stroke={accent} stroke-width="0.8" />
        {/each}
      {/each}
      <line x1="58" y1="48" x2="58" y2="58" stroke={accent} stroke-width="0.5" opacity={active ? 0.5 : 0.25} />
      <line x1="58" y1="48" x2="70" y2="58" stroke={accent} stroke-width="0.5" opacity={active ? 0.5 : 0.25} />
      <line x1="58" y1="48" x2="82" y2="58" stroke={accent} stroke-width="0.5" opacity={active ? 0.5 : 0.25} />
      <line x1="70" y1="48" x2="58" y2="58" stroke={accent} stroke-width="0.5" opacity={active ? 0.5 : 0.25} />
      <line x1="70" y1="48" x2="70" y2="58" stroke={accent} stroke-width="0.5" opacity={active ? 0.5 : 0.25} />
      <line x1="70" y1="48" x2="82" y2="58" stroke={accent} stroke-width="0.5" opacity={active ? 0.5 : 0.25} />
      <line x1="82" y1="48" x2="58" y2="58" stroke={accent} stroke-width="0.5" opacity={active ? 0.5 : 0.25} />
      <line x1="82" y1="48" x2="70" y2="58" stroke={accent} stroke-width="0.5" opacity={active ? 0.5 : 0.25} />
      <line x1="82" y1="48" x2="82" y2="58" stroke={accent} stroke-width="0.5" opacity={active ? 0.5 : 0.25} />
      <circle cx="70" cy="65" r="2.5" fill={accent} opacity="0.8" />
    </g>
  {:else if building === 'cs-terminal'}
    <g filter="url(#{uid}-glow)">
      <rect x="44" y="30" width="52" height="38" rx="3" fill="#12182a" stroke={accent} stroke-width="1.1" />
      <rect x="44" y="30" width="52" height="8" rx="3" fill="#1a2234" />
      <circle cx="50" cy="34" r="1.5" fill="#f87171" opacity="0.8" />
      <circle cx="55" cy="34" r="1.5" fill="#fbbf24" opacity="0.8" />
      <circle cx="60" cy="34" r="1.5" fill="#4ade80" opacity="0.8" />
      <text x="50" y="48" fill={accent} font-size="5.5" font-family="monospace" opacity="0.9">&gt; code</text>
      <text x="50" y="56" fill={accent} font-size="5" font-family="monospace" opacity="0.65">{ '{' }</text>
      <text x="54" y="62" fill={accent} font-size="5" font-family="monospace" opacity="0.55">run();</text>
      <rect x="44" y="66" width="52" height="6" rx="0" fill="#0e1420" />
      <line x1="48" y1="72" x2="92" y2="72" stroke={accent} stroke-width="0.5" opacity="0.3" />
    </g>
  {/if}

  <ellipse cx="70" cy="86" rx="28" ry="4" fill={accent} opacity="0.12" />
</svg>

<style>
  .island-scene {
    display: block;
    width: 148px;
    height: auto;
    overflow: visible;
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), filter 0.35s ease;
  }

  .island-scene.is-compact {
    width: 88px;
  }

  .island-scene.is-active {
    transform: translateY(-4px) scale(1.04);
    filter: drop-shadow(0 12px 28px rgb(0 0 0 / 0.45));
  }
</style>
