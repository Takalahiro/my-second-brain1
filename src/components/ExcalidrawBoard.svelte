<script lang="ts">
  // Excalidraw 白板 — 全屏 iframe 嵌官方站，数据存在 excalidraw.com 本地
  let loaded = $state(false);

  function onLoad() {
    loaded = true;
  }
</script>

<div class="excal-wrap">
  <header class="excal-head">
    <div>
      <h1>Excalidraw 白板</h1>
      <p class="excal-sub">手绘风格白板 · 数据保存在浏览器本地</p>
    </div>
    {#if !loaded}
      <span class="excal-loading">加载中…</span>
    {/if}
  </header>
  <iframe
    class="excal-frame"
    src="https://excalidraw.com"
    title="Excalidraw 白板"
    allow="clipboard-read; clipboard-write"
    onload={onLoad}
  ></iframe>
</div>

<style>
  .excal-wrap {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - var(--site-nav-offset, 88px));
    width: 100%;
  }
  .excal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border, var(--border-color));
    background: var(--surface, var(--bg-secondary));
    color: var(--text, var(--text-primary));
  }
  .excal-head h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
  }
  .excal-sub { margin: var(--space-1) 0 0; font-size: var(--text-sm); color: var(--text-muted, var(--text-secondary)); }
  .excal-loading { font-size: var(--text-sm); color: var(--text-muted, var(--text-secondary)); }
  .excal-frame {
    flex: 1;
    width: 100%;
    border: 0;
    background: var(--surface-elevated, var(--bg-secondary));
  }
</style>
