<script lang="ts">
  interface Props {
    x: number;
    y: number;
    r: number;
    color: string;
    core?: string;
    orphan?: boolean;
    center?: boolean;
    selected?: boolean;
  }
  let {
    x,
    y,
    r,
    color,
    core = '#f5f2eb',
    orphan = false,
    center = false,
    selected = false,
  }: Props = $props();

  const arm = $derived(r * (center ? 3.2 : 2.6));
  const halo = $derived(r * (center ? 4.2 : 3.4));
</script>

<g class="ghn-star" class:is-center={center} class:is-orphan={orphan} class:is-sel={selected}>
  {#if !orphan}
    <circle cx={x} cy={y} r={halo} fill={color} opacity="0.1" />
  {/if}
  <line
    x1={x - arm}
    y1={y}
    x2={x + arm}
    y2={y}
    stroke={color}
    stroke-width={center ? 0.5 : 0.35}
    stroke-opacity="0.82"
  />
  <line
    x1={x}
    y1={y - arm}
    x2={x}
    y2={y + arm}
    stroke={color}
    stroke-width={center ? 0.5 : 0.35}
    stroke-opacity="0.82"
  />
  {#if center}
    <line
      x1={x - arm * 0.7}
      y1={y - arm * 0.7}
      x2={x + arm * 0.7}
      y2={y + arm * 0.7}
      stroke={color}
      stroke-width="0.28"
      stroke-opacity="0.55"
    />
    <line
      x1={x + arm * 0.7}
      y1={y - arm * 0.7}
      x2={x - arm * 0.7}
      y2={y + arm * 0.7}
      stroke={color}
      stroke-width="0.28"
      stroke-opacity="0.55"
    />
  {/if}
  <circle cx={x} cy={y} r={r * (center ? 0.65 : 0.52)} fill={core} />
  <circle cx={x} cy={y} r={r * (center ? 0.32 : 0.24)} fill={color} />
  {#if orphan}
    <circle
      cx={x}
      cy={y}
      r={arm * 0.95}
      fill="none"
      stroke="#9aafc9"
      stroke-width="0.4"
      stroke-dasharray="2,2.5"
      opacity="0.75"
    />
  {/if}
  {#if selected}
    <rect
      x={x - arm - 2}
      y={y - arm - 2}
      width={(arm + 2) * 2}
      height={(arm + 2) * 2}
      fill="none"
      stroke="#ff4d6a"
      stroke-width="0.6"
    />
  {/if}
</g>
