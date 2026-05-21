<script lang="ts">
  import { onMount } from 'svelte';

  interface SyncInfo {
    noteCount: number;
    latestNoteUpdate: string | null;
    vaultSyncCommit: string | null;
  }

  interface Props {
    syncInfo?: SyncInfo;
    desktopMode?: boolean;
  }
  let { syncInfo, desktopMode = false }: Props = $props();

  const HERO_KEY = 'second-brain:hero-closed';
  const MANUAL_KEY = 'second-brain:manual-closed';
  const DESKTOP_MANUAL_KEY = 'second-brain:desktop-manual-v1';
  const INTRO_KEY = 'second-brain:desktop-intro-v1';

  let heroClosed = $state(false);
  let manualClosed = $state(true);
  let mounted = $state(false);
  let isFirstDesktopManual = $state(false);

  const showManual = $derived(mounted && !manualClosed);
  const showWelcome = $derived(mounted && !heroClosed && !showManual && !isFirstDesktopManual);

  onMount(() => {
    try {
      heroClosed = localStorage.getItem(HERO_KEY) === '1';
      manualClosed = localStorage.getItem(MANUAL_KEY) === '1';

      if (desktopMode && localStorage.getItem(DESKTOP_MANUAL_KEY) !== '1') {
        isFirstDesktopManual = true;
        heroClosed = true;
        manualClosed = true;

        const openFirstManual = () => {
          manualClosed = false;
        };

        if (localStorage.getItem(INTRO_KEY)) {
          queueMicrotask(openFirstManual);
        } else {
          window.addEventListener('second-brain:desktop-intro-done', openFirstManual, { once: true });
        }
      }
    } catch {}

    mounted = true;

    const onToggleManual = () => toggleHome();
    window.addEventListener('second-brain:toggle-manual', onToggleManual);
    return () => window.removeEventListener('second-brain:toggle-manual', onToggleManual);
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
    try {
      localStorage.setItem(MANUAL_KEY, '1');
      if (desktopMode && isFirstDesktopManual) {
        localStorage.setItem(DESKTOP_MANUAL_KEY, '1');
        isFirstDesktopManual = false;
      }
    } catch {}
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
  <section class="home-hero" class:desktop-overlay={desktopMode} aria-label="欢迎">
    <div class="hero-card pixel-card glass-container">
      <button
        type="button"
        class="card-close"
        aria-label="关闭欢迎卡片"
        title="关闭欢迎卡片"
        onclick={closeHero}
      >×</button>
      <h1 class="hero-title">My Second Brain</h1>
      <p class="hero-sub">简约桌面 · 毛玻璃 · 任你切换</p>
      <div class="hero-actions">
        <a class="pixel-button hero-btn" href="/notes">进入笔记</a>
        <a class="pixel-button hero-btn ghost" href="/tags">浏览标签</a>
        <button type="button" class="pixel-button hero-btn ghost" onclick={openManual}>使用说明</button>
      </div>
    </div>
  </section>
{/if}

{#if showManual}
  {#if desktopMode}
    <button
      type="button"
      class="desktop-manual-backdrop"
      class:is-first={isFirstDesktopManual}
      aria-label="关闭使用说明"
      onclick={closeManual}
    ></button>
  {/if}
  <section class="home-hero" class:desktop-overlay={desktopMode} class:is-first-manual={isFirstDesktopManual} aria-label="使用说明">
    <div class="manual-card pixel-card glass-container" class:is-first-manual={isFirstDesktopManual}>
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
          <h3>桌面与组件</h3>
          <p>顶栏 <strong>⚙</strong> 控制中心 · <strong>🧹</strong> 清屏；菜单栏可直达 <strong>笔记 / Python / MATLAB / 白板 / 图谱</strong>。</p>
          <ul>
            <li>主界面菜单栏与内容页顶栏导航样式统一</li>
            <li>雨滴默认跟随天气；控制中心 → 墙纸可改「跟随天气」</li>
            <li>樱花仅在控制中心 → 墙纸，且 <strong>Kyoto</strong> 场景可用</li>
            <li>控制中心 → 墙纸：圆角预览图点击切换场景</li>
            <li>窗口三圆点：<strong>红</strong>关闭 · <strong>黄</strong>最小化 · <strong>绿</strong>展开</li>
            <li>移动端：双指旋转 · 三指缩放组件窗口</li>
          </ul>
        </section>

        <section>
          <h3>笔记与工具</h3>
          <ul>
            <li><a href="/notes">笔记</a>：小组件 / 折叠树；文末显示 Git 最后更新时间</li>
            <li>阅读笔记时点 <strong>🛠</strong>：浮窗打开 Python / MATLAB / 白板</li>
            <li>顶栏 Logo 菜单：<a href="/python">Python</a> · <a href="/matlab">MATLAB</a> · <a href="/whiteboard">白板</a> · <a href="/graph">图谱</a></li>
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
        {#if heroClosed && !isFirstDesktopManual}
          <button type="button" class="pixel-button hero-btn ghost" onclick={reopenHero}>显示欢迎卡片</button>
        {/if}
        {#if isFirstDesktopManual}
          <button type="button" class="pixel-button hero-btn" onclick={closeManual}>开始使用</button>
        {:else}
          <a class="pixel-button hero-btn" href="/notes">进入笔记</a>
        {/if}
      </footer>
    </div>
  </section>
{/if}

{#if mounted && !desktopMode}
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
  :global(.mac-os-body) .home-hero.desktop-overlay {
    position: fixed;
    inset: 58px 0 16px;
    z-index: 118;
    min-height: 0;
    padding: 20px 16px;
  }
  :global(.mac-os-body) .home-hero.desktop-overlay.is-first-manual {
    z-index: 125;
    animation: manual-rise-in 0.55s cubic-bezier(0.34, 1.1, 0.64, 1) both;
  }

  @keyframes manual-rise-in {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .desktop-manual-backdrop {
    position: fixed;
    inset: 0;
    z-index: 117;
    border: 0;
    padding: 0;
    margin: 0;
    cursor: default;
    background: rgb(8 6 14 / 0.22);
    backdrop-filter: blur(6px) saturate(120%);
    -webkit-backdrop-filter: blur(6px) saturate(120%);
    animation: backdrop-in 0.45s ease both;
  }
  .desktop-manual-backdrop.is-first {
    z-index: 124;
    background: rgb(8 6 14 / 0.28);
    backdrop-filter: blur(10px) saturate(130%);
    -webkit-backdrop-filter: blur(10px) saturate(130%);
  }
  :global(:not(.dark)) .desktop-manual-backdrop {
    background: rgb(244 245 247 / 0.35);
  }
  :global(:not(.dark)) .desktop-manual-backdrop.is-first {
    background: rgb(244 245 247 / 0.42);
  }

  @keyframes backdrop-in {
    from { opacity: 0; }
    to { opacity: 1; }
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

  /* 使用说明卡片：毛玻璃文档 */
  .manual-card {
    position: relative;
    width: 100%;
    max-width: 560px;
    max-height: min(calc(100vh - 220px), 720px);
    display: flex;
    flex-direction: column;
    padding: 0;
    border-radius: 22px;
    text-align: left;
    color: var(--text-primary);
    background: var(--glass-bg-strong);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    box-shadow:
      var(--shadow-normal),
      inset 0 1px 0 rgb(255 255 255 / 0.45);
  }
  .manual-card.is-first-manual {
    max-width: min(580px, calc(100vw - 32px));
    border-color: rgb(180 140 255 / 0.28);
    box-shadow:
      0 24px 56px rgb(0 0 0 / 0.18),
      inset 0 1px 0 rgb(255 255 255 / 0.5),
      0 0 0 1px rgb(180 140 255 / 0.12);
  }
  :global(.dark) .manual-card {
    background: var(--glass-bg-strong);
    color: var(--text-primary);
    border-color: var(--glass-border);
    box-shadow:
      var(--shadow-normal),
      inset 0 1px 0 rgb(255 255 255 / 0.08);
  }
  :global(.dark) .manual-card.is-first-manual {
    border-color: rgb(180 140 255 / 0.22);
    box-shadow:
      0 24px 56px rgb(0 0 0 / 0.42),
      inset 0 1px 0 rgb(255 255 255 / 0.1),
      0 0 48px rgb(180 140 255 / 0.08);
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
    border-bottom: 1px solid var(--border-color);
    background: rgb(255 255 255 / 0.12);
  }
  :global(.dark) .manual-card-head {
    border-bottom-color: var(--border-color);
    background: rgb(255 255 255 / 0.04);
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
    background: var(--chrome-subtle);
    border: 1px solid var(--border-color);
    display: grid;
    gap: 6px;
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
    border-top: 1px solid var(--border-color);
    background: rgb(255 255 255 / 0.08);
  }
  :global(.dark) .manual-card-foot {
    border-top-color: var(--border-color);
    background: rgb(255 255 255 / 0.03);
  }

  .home-fab {
    position: fixed;
    left: max(env(safe-area-inset-left, 0px), 16px);
    bottom: max(env(safe-area-inset-bottom, 0px), 16px);
    z-index: 34;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--chrome-border);
    background: var(--glass-bg-strong);
    color: var(--text-primary);
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    box-shadow: var(--shadow-normal);
    cursor: pointer;
    font-size: 0.82rem;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .home-fab:hover,
  .home-fab.is-active {
    background: var(--glass-bg-hover);
    border-color: rgb(180 140 255 / 0.45);
    color: var(--text-primary);
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
