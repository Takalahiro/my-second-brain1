<script lang="ts">
  import { onMount } from 'svelte';

  interface SyncInfo {
    noteCount: number;
    latestNoteUpdate: string | null;
    vaultSyncCommit: string | null;
  }

  interface Props {
    syncInfo?: SyncInfo;
  }
  let { syncInfo }: Props = $props();

  const HERO_KEY = 'second-brain:hero-closed';
  const MANUAL_KEY = 'second-brain:manual-closed';

  let heroClosed = $state(false);
  let manualClosed = $state(true);
  let mounted = $state(false);

  const showWelcome = $derived(mounted && !heroClosed && !showManual);
  const showManual = $derived(mounted && !manualClosed);

  onMount(() => {
    try {
      heroClosed = localStorage.getItem(HERO_KEY) === '1';
      manualClosed = localStorage.getItem(MANUAL_KEY) === '1';
    } catch {}
    mounted = true;
  });

  function closeHero() {
    heroClosed = true;
    try { localStorage.setItem(HERO_KEY, '1'); } catch {}
  }
  function openManual() {
    manualClosed = false;
    try { localStorage.removeItem(MANUAL_KEY); } catch {}
  }
  function closeManual() {
    manualClosed = true;
    try { localStorage.setItem(MANUAL_KEY, '1'); } catch {}
  }
  function reopenHero() {
    heroClosed = false;
    manualClosed = true;
    try {
      localStorage.removeItem(HERO_KEY);
      localStorage.setItem(MANUAL_KEY, '1');
    } catch {}
  }
  function toggleHome() {
    if (showManual) {
      closeManual();
    } else {
      openManual();
    }
  }
</script>

{#if showWelcome}
  <section class="home-hero" aria-label="欢迎">
    <div class="hero-card pixel-card glass-container">
      <button
        type="button"
        class="card-close"
        aria-label="关闭欢迎卡片"
        title="关闭欢迎卡片"
        onclick={closeHero}
      >×</button>
      <h1 class="hero-title">My Second Brain</h1>
      <p class="hero-sub">日系像素 · 毛玻璃 · 任你切换</p>
      <div class="hero-actions">
        <a class="pixel-button hero-btn" href="/notes">进入笔记</a>
        <a class="pixel-button hero-btn ghost" href="/tags">浏览标签</a>
        <button type="button" class="pixel-button hero-btn ghost" onclick={openManual}>使用说明</button>
      </div>
    </div>
  </section>
{/if}

{#if showManual}
  <section class="home-hero" aria-label="使用说明">
    <div class="manual-card pixel-card glass-container">
      <button
        type="button"
        class="card-close"
        aria-label="关闭使用说明"
        title="关闭使用说明"
        onclick={closeManual}
      >×</button>
      <header class="manual-card-head">
        <span class="manual-emoji" aria-hidden="true">📖</span>
        <h1 class="manual-title">使用说明</h1>
        <p class="manual-sub">My Second Brain · 快速上手</p>
      </header>

      <div class="manual-body">
        <section>
          <h3>首页小组件</h3>
          <p>点右上角 <strong>⚙</strong> 打开组件抽屉，拖到画面即可添加。支持拖动标题栏移动、边缘拉伸、右下角 <strong>↻</strong> 旋转。</p>
          <ul>
            <li>移动端：<strong>双指旋转</strong>、<strong>三指缩放</strong></li>
            <li><strong>🧹</strong> 一键清屏，<strong>↩</strong> 可恢复布局</li>
          </ul>
        </section>

        <section>
          <h3>笔记与工具</h3>
          <ul>
            <li><a href="/notes">笔记</a>：小组件 / 折叠树；文末显示 Git 最后更新时间</li>
            <li>阅读笔记时点 <strong>🛠</strong>：浮窗打开 Python / MATLAB / 白板</li>
            <li>顶栏：<a href="/python">Python</a> · <a href="/matlab">MATLAB</a> · <a href="/whiteboard">白板</a> · <a href="/graph">图谱</a></li>
          </ul>
        </section>

        <section>
          <h3>笔记自动同步</h3>
          <p>Obsidian 笔记在子模块 <code>obsidian-vault</code> 中，通过两层机制与网站同步：</p>
          <ol>
            <li><strong>本机</strong>（可选）：计划任务每小时 <code>pnpm vault:auto</code></li>
            <li><strong>GitHub Actions</strong>：每 10 分钟检查 vault 并重建站点</li>
          </ol>
          {#if syncInfo}
            <dl class="sync-status">
              <div><dt>已索引笔记</dt><dd>{syncInfo.noteCount} 篇</dd></div>
              {#if syncInfo.latestNoteUpdate}
                <div><dt>manifest 最新更新</dt><dd class="pixel-digits">{syncInfo.latestNoteUpdate}</dd></div>
              {/if}
              {#if syncInfo.vaultSyncCommit}
                <div><dt>上次自动同步提交</dt><dd class="pixel-digits">{syncInfo.vaultSyncCommit}</dd></div>
              {/if}
            </dl>
          {/if}
          <p class="manual-note">本地改笔记后执行 <code>pnpm vault:sync</code> 或等待计划任务。</p>
        </section>
      </div>

      <footer class="manual-card-foot">
        {#if heroClosed}
          <button type="button" class="pixel-button hero-btn ghost" onclick={reopenHero}>显示欢迎卡片</button>
        {/if}
        <a class="pixel-button hero-btn" href="/notes">进入笔记</a>
      </footer>
    </div>
  </section>
{/if}

{#if mounted}
  <button
    type="button"
    class="home-fab"
    class:is-active={showManual}
    onclick={toggleHome}
    aria-label={showManual ? '关闭使用说明' : '打开使用说明'}
    title={showManual ? '关闭使用说明' : '主页 / 使用说明'}
  >主页</button>
{/if}

<style>
  .home-hero {
    min-height: calc(100vh - 200px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 12px;
    pointer-events: none;
  }
  .home-hero > * {
    pointer-events: auto;
  }

  /* 欢迎卡片 */
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

  /* 使用说明卡片：更低透明度毛玻璃 */
  .manual-card {
    position: relative;
    width: 100%;
    max-width: 560px;
    max-height: min(calc(100vh - 220px), 720px);
    display: flex;
    flex-direction: column;
    padding: 0;
    border-radius: 20px;
    text-align: left;
    color: var(--text-primary);
    background: rgb(255 255 255 / 0.28);
    backdrop-filter: blur(20px) saturate(140%);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    box-shadow: 0 16px 40px rgb(0 0 0 / 0.12);
  }
  :global(.dark) .manual-card {
    background: rgb(18 14 30 / 0.32);
    color: #f0e8ff;
    border-color: rgb(255 255 255 / 0.1);
    box-shadow: 0 16px 40px rgb(0 0 0 / 0.35);
  }

  .card-close {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    width: 28px;
    height: 28px;
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
  .card-close:hover {
    transform: scale(1.06);
  }
  :global(.dark) .card-close {
    background: rgb(255 255 255 / 0.08);
    border-color: rgb(255 255 255 / 0.14);
    color: #f4ecff;
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
  .hero-actions,
  .manual-card-foot {
    display: inline-flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .hero-btn.ghost {
    background: transparent;
  }

  .manual-card-head {
    padding: 24px 28px 12px;
    text-align: center;
    flex-shrink: 0;
    border-bottom: 1px solid rgb(0 0 0 / 0.05);
  }
  :global(.dark) .manual-card-head {
    border-bottom-color: rgb(255 255 255 / 0.06);
  }
  .manual-emoji {
    font-size: 1.6rem;
    display: block;
    margin-bottom: 6px;
  }
  .manual-title {
    margin: 0 0 4px;
    font-size: clamp(1.25rem, 1vw + 1rem, 1.75rem);
    letter-spacing: 0.5px;
  }
  .manual-sub {
    margin: 0;
    font-size: 0.82rem;
    color: var(--text-secondary);
    opacity: 0.85;
  }

  .manual-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 14px 24px 8px;
    font-size: 0.8rem;
    line-height: 1.55;
    opacity: 0.9;
  }
  .manual-body section {
    margin-bottom: 14px;
  }
  .manual-body h3 {
    margin: 0 0 6px;
    font-size: 0.78rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  :global(.dark) .manual-body h3 {
    color: #c8b9e2;
  }
  .manual-body p {
    margin: 0 0 8px;
  }
  .manual-body ul,
  .manual-body ol {
    margin: 0;
    padding-left: 1.15rem;
  }
  .manual-body li {
    margin-bottom: 4px;
  }
  .manual-body a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .manual-body code {
    font-size: 0.76rem;
    padding: 1px 5px;
    border-radius: 4px;
    background: rgb(0 0 0 / 0.06);
  }
  :global(.dark) .manual-body code {
    background: rgb(255 255 255 / 0.08);
  }

  .sync-status {
    margin: 10px 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgb(0 0 0 / 0.04);
    display: grid;
    gap: 6px;
  }
  :global(.dark) .sync-status {
    background: rgb(255 255 255 / 0.05);
  }
  .sync-status div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  .sync-status dt {
    margin: 0;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .sync-status dd {
    margin: 0;
    text-align: right;
  }
  .manual-note {
    font-size: 0.74rem;
    color: var(--text-secondary);
    opacity: 0.88;
  }

  .manual-card-foot {
    flex-shrink: 0;
    padding: 12px 24px 20px;
    border-top: 1px solid rgb(0 0 0 / 0.05);
  }
  :global(.dark) .manual-card-foot {
    border-top-color: rgb(255 255 255 / 0.06);
  }

  .home-fab {
    position: fixed;
    left: max(env(safe-area-inset-left, 0px), 16px);
    bottom: max(env(safe-area-inset-bottom, 0px), 16px);
    z-index: 34;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgb(255 255 255 / 0.18);
    background: rgb(20 16 32 / 0.38);
    color: rgb(245 237 255 / 0.88);
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    box-shadow: 0 10px 24px rgb(0 0 0 / 0.22);
    cursor: pointer;
    font-size: 0.82rem;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .home-fab:hover,
  .home-fab.is-active {
    background: rgb(40 28 60 / 0.52);
    border-color: rgb(180 140 255 / 0.45);
    color: #fff;
  }

  @media (max-width: 640px) {
    .manual-card {
      max-height: min(calc(100vh - 180px), 85vh);
    }
    .manual-card-head {
      padding: 20px 18px 10px;
    }
    .manual-body {
      padding: 12px 18px 8px;
    }
    .manual-card-foot {
      padding: 10px 18px 16px;
    }
  }
</style>
