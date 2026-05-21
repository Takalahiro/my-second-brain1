<script lang="ts">
  interface Props {
    active?: boolean;
  }
  let { active = false }: Props = $props();
</script>

<div class="flow-arrow" class:active aria-hidden="true">
  <span class="shaft"></span>
  <span class="head">▼</span>
  {#if active}
    <span class="pulse-dot"></span>
  {/if}
</div>

<style>
  .flow-arrow {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 28px;
    position: relative;
    opacity: 0.35;
    transition: opacity var(--motion-step);
  }
  .flow-arrow.active { opacity: 1; }
  .shaft {
    width: 2px;
    flex: 1;
    background: linear-gradient(180deg, rgb(180 140 255 / 0.2), rgb(180 140 255 / 0.8));
    border-radius: 1px;
  }
  .head { font-size: 0.55rem; color: #b48cff; line-height: 1; margin-top: -2px; }
  .pulse-dot {
    position: absolute;
    top: 4px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #00ff9d;
    box-shadow: 0 0 10px #00ff9d;
    animation: flow-drop 0.9s ease-in-out infinite;
  }
  @keyframes flow-drop {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(18px); opacity: 0; }
  }
</style>
