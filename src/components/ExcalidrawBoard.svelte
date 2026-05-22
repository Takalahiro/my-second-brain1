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
    height: calc(100vh - 72px);
    width: 100%;
  }
  .excal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
  .excal-head h1 { margin: 0; font-size: 1.1rem; }
  .excal-sub { margin: 2px 0 0; font-size: 0.78rem; color: var(--text-secondary); }
  .excal-loading { font-size: 0.8rem; color: var(--text-secondary); }
  .excal-frame {
    flex: 1;
    width: 100%;
    border: 0;
    background: #fff;
  }
</style>
