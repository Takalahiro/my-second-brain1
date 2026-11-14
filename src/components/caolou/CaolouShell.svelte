<script lang="ts">
  type MountResult = {
    placeId: string;
    gearScheme: string;
    transport: string;
  };

  type CaolouWindow = Window & {
    caolouMount?: (input: { start?: string; date?: string }) => MountResult;
  };

  const SCRIPT_CHAIN = [
    'offtrack.js',
    'data.js',
    'field.js',
    'fine_gear.js',
    'media.js',
    'extra_media.js',
    'more-sites.js',
    'bios.js',
    'stops.js',
    'transit.js',
    'gear_photos.js',
    'planner.js',
    'app.js',
    'modes.js',
    'camp_closures.js',
    'camp_wild.js',
    'access_card.js',
    'brain_mount.js',
    'brief_nov.js',
    'permits.js',
    'overnight_facts.js',
    'flow.js',
    'gear_layers.js',
    'dive_kit.js',
    'transit_geom.js',
    'transit_map.js',
    'route_score.js',
    'place_facts.js',
    'atlas_fold.js',
    'tracks.js',
  ];

  let frame: HTMLIFrameElement | undefined;
  let start = $state('');
  let date = $state('');
  let placeId = $state('');
  let gearScheme = $state('');
  let transport = $state('');
  let status = $state('正在等子页脚本。');

  function childWindow(): CaolouWindow | null {
    try {
      return (frame?.contentWindow as CaolouWindow | null) ?? null;
    } catch {
      return null;
    }
  }

  function childDocument(): Document | null {
    try {
      return frame?.contentDocument ?? null;
    } catch {
      return null;
    }
  }

  function scriptFile(src: string) {
    return src.split('?')[0]?.split('/').pop() ?? '';
  }

  function missingScript(doc: Document) {
    const names = [...doc.querySelectorAll('script[src]')].map((node) => scriptFile(node.getAttribute('src') || ''));
    let at = 0;
    for (const name of names) {
      if (name === SCRIPT_CHAIN[at]) at += 1;
      if (at === SCRIPT_CHAIN.length) return '';
    }
    return SCRIPT_CHAIN[at] || '';
  }

  function readMount() {
    const child = childWindow();
    const doc = childDocument();
    if (!child || !doc || typeof child.caolouMount !== 'function') {
      status = '子页脚本还没跑完。';
      return;
    }
    const missing = missingScript(doc);
    if (missing) {
      status = `子页还缺 ${missing}。只挂 brain_mount.js 不够。`;
      return;
    }
    const sheets = [...doc.querySelectorAll('link[rel="stylesheet"]')].map((node) => node.getAttribute('href') || '');
    if (
      !sheets.some((href) => href.includes('styles.css')) ||
      !sheets.some((href) => href.includes('camp_wild.css')) ||
      !sheets.some((href) => href.includes('leaflet'))
    ) {
      status = '子页样式还没接上。';
      return;
    }
    const result = child.caolouMount({ start, date });
    placeId = result.placeId ?? '';
    gearScheme = result.gearScheme ?? '';
    transport = result.transport ?? '';
    status = '已从子窗口读到。';
  }

  function onFrameLoad() {
    readMount();
  }
</script>

<section class="shell">
  <iframe
    bind:this={frame}
    class="sheet"
    title="草楼野记"
    src="/caolou/index.html"
    onload={onFrameLoad}
  ></iframe>
  <form
    class="dock"
    onsubmit={(event) => {
      event.preventDefault();
      readMount();
    }}
  >
    <label>
      出发地
      <input name="start" bind:value={start} placeholder="空则是 Sydney Central" autocomplete="off" />
    </label>
    <label>
      日期
      <input name="date" type="date" bind:value={date} />
    </label>
    <button type="submit">读取挂载</button>
    <p class="status">{status}</p>
    <dl>
      <div>
        <dt>placeId</dt>
        <dd>{placeId}</dd>
      </div>
      <div>
        <dt>gearScheme</dt>
        <dd>{gearScheme}</dd>
      </div>
      <div class="wide">
        <dt>transport</dt>
        <dd>{transport}</dd>
      </div>
    </dl>
  </form>
</section>

<style>
  .shell {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    height: calc(100dvh - 10.2rem);
    min-height: 24rem;
    border: 1px solid var(--border);
    background: var(--bg);
  }
  .sheet {
    width: 100%;
    height: 100%;
    border: 0;
    background: var(--surface);
  }
  .dock {
    display: grid;
    grid-template-columns: minmax(10rem, 16rem) auto auto minmax(0, 1fr);
    gap: 0.6rem 0.8rem;
    align-items: end;
    max-height: 11rem;
    overflow: auto;
    padding: 0.7rem 0.85rem;
    border-top: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
  }
  label {
    display: grid;
    gap: 0.25rem;
    color: var(--text-muted);
    font-size: 0.78rem;
  }
  input {
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    padding: 0.35rem 0.5rem;
    font: inherit;
  }
  button {
    border: 1px solid var(--accent);
    background: var(--accent);
    color: var(--on-accent);
    padding: 0.4rem 0.75rem;
    font: inherit;
    cursor: pointer;
  }
  .status {
    margin: 0;
    align-self: center;
    color: var(--text-muted);
    font-size: 0.78rem;
  }
  dl {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 8rem 10rem minmax(0, 1fr);
    gap: 0.35rem 0.8rem;
    margin: 0;
  }
  dl div {
    min-width: 0;
  }
  .wide {
    grid-column: 1 / -1;
  }
  dt {
    color: var(--text-muted);
    font-size: 0.72rem;
  }
  dd {
    margin: 0;
    color: var(--text);
    font-size: 0.86rem;
    overflow-wrap: anywhere;
  }
  @media (max-width: 800px) {
    .dock,
    dl {
      grid-template-columns: 1fr;
    }
  }
</style>
