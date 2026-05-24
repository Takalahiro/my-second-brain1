<script lang="ts">
  import type { Snippet } from 'svelte';
  import { HUD_SEP } from '../../../lib/hud-widget-ui';

  interface Props {
    title: string;
    status?: string;
    children?: Snippet;
    footer?: Snippet;
  }
  let { title, status = '◉ ONLINE', children, footer }: Props = $props();
</script>

<div class="hud-mission">
  <div class="hud-mission-head">
    <span class="hud-bracket-title">[ {title} ]</span>
    <span class="hud-mission-status">{status}</span>
  </div>
  <div class="hud-mission-sep" aria-hidden="true">{HUD_SEP}</div>
  {#if children}
    <div class="hud-mission-body">
      {@render children()}
    </div>
  {/if}
  {#if footer}
    <div class="hud-mission-foot">
      {@render footer()}
    </div>
  {/if}
</div>

<style>
  .hud-mission {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  .hud-mission-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .hud-bracket-title {
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 0.68rem;
    color: var(--hud-navy, #0f1f3d);
  }
  .hud-mission-status {
    font-size: 0.58rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--hud-navy-muted, #3d5278);
    font-variant-numeric: tabular-nums;
  }
  .hud-mission-sep {
    font-size: 0.55rem;
    letter-spacing: 0.02em;
    color: var(--hud-navy-muted, #3d5278);
    opacity: 0.85;
    overflow: hidden;
    white-space: nowrap;
  }
  .hud-mission-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .hud-mission-foot {
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--hud-navy-muted, #3d5278);
  }
</style>
