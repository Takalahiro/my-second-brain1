<script lang="ts">
  import { onMount } from 'svelte';

  const KEY = 'second-brain:hero-closed';
  let closed = $state(false);
  let mounted = $state(false);

  onMount(() => {
    try {
      closed = localStorage.getItem(KEY) === '1';
    } catch {}
    mounted = true;
  });

  function close() {
    closed = true;
    try { localStorage.setItem(KEY, '1'); } catch {}
  }
  function reopen() {
    closed = false;
    try { localStorage.removeItem(KEY); } catch {}
  }
</script>

{#if mounted && !closed}
  <section class="home-hero">
    <div class="hero-card pixel-card glass-container">
      <button
        type="button"
        class="hero-close"
        aria-label="关闭欢迎卡片"
        title="关闭欢迎卡片"
        onclick={close}
      >×</button>
      <h1 class="hero-title">My Second Brain</h1>
      <p class="hero-sub">日系像素 · 毛玻璃 · 任你切换</p>
      <div class="hero-actions">
        <a class="pixel-button hero-btn" href="/notes">进入笔记</a>
        <a class="pixel-button hero-btn ghost" href="/tags">浏览标签</a>
      </div>
    </div>
  </section>
{:else if mounted && closed}
  <button
    type="button"
    class="hero-reopen"
    onclick={reopen}
    aria-label="重新打开欢迎卡片"
    title="重新打开欢迎卡片"
  >主页</button>
{/if}

<style>
  .home-hero {
    min-height: calc(100vh - 200px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 12px;
  }
  .hero-card {
    position: relative;
    padding: 28px 32px;
    border-radius: 20px;
    text-align: center;
    color: var(--text-primary);
    max-width: 520px;
    width: 100%;
    background: rgb(255 255 255 / 0.45);
  }
  :global(.dark) .hero-card {
    background: rgb(18 14 30 / 0.55);
    color: #f4ecff;
    border-color: rgb(255 255 255 / 0.14);
  }
  .hero-title {
    margin: 0 0 6px;
    font-size: clamp(1.6rem, 1.4vw + 1.1rem, 2.4rem);
    letter-spacing: 1px;
  }
  .hero-sub {
    margin: 0 0 18px;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }
  .hero-actions {
    display: inline-flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .hero-btn.ghost { background: transparent; }

  .hero-close {
    position: absolute;
    top: 10px; right: 10px;
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 1px solid rgb(0 0 0 / 0.08);
    background: rgb(0 0 0 / 0.05);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 1.05rem;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .hero-close:hover { background: rgb(0 0 0 / 0.1); transform: scale(1.06); }
  :global(.dark) .hero-close {
    background: rgb(255 255 255 / 0.08);
    border-color: rgb(255 255 255 / 0.14);
    color: #f4ecff;
  }
  :global(.dark) .hero-close:hover { background: rgb(255 255 255 / 0.16); }

  .hero-reopen {
    position: fixed;
    left: max(env(safe-area-inset-left, 0px), 16px);
    bottom: max(env(safe-area-inset-bottom, 0px), 16px);
    z-index: 32;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgb(255 255 255 / 0.2);
    background: rgb(20 16 32 / 0.6);
    color: #f5edff;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 10px 24px rgb(0 0 0 / 0.3);
    cursor: pointer;
    font-size: 0.82rem;
  }
  .hero-reopen:hover { background: rgb(40 28 60 / 0.7); }
</style>
