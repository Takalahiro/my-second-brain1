<script lang="ts">
  import { DEFAULT_SETTINGS, type GraphSettings } from './graph-data';

  interface Props {
    settings: GraphSettings;
    onChange: (s: Partial<GraphSettings>) => void;
    onReset: () => void;
  }
  let { settings, onChange, onReset }: Props = $props();

  function setLabels(v: GraphSettings['showLabels']) { onChange({ showLabels: v }); }
</script>

<div class="sp-wrap">
  <header class="sp-head">
    <h2>关系图谱设置</h2>
    <button type="button" class="sp-reset" onclick={onReset} title="恢复全部默认">恢复默认</button>
  </header>

  <section class="sp-section">
    <h3>显示</h3>
    <label class="sp-row">
      <span class="sp-lbl">显示孤岛</span>
      <label class="sp-toggle">
        <input type="checkbox" checked={settings.showOrphans}
               onchange={(e) => onChange({ showOrphans: (e.currentTarget as HTMLInputElement).checked })} />
        <span></span>
      </label>
    </label>

    <div class="sp-row">
      <span class="sp-lbl">节点标签</span>
      <div class="sp-seg">
        {#each [{ k: 'always', n: '总是' }, { k: 'hover', n: '悬停' }, { k: 'never', n: '隐藏' }] as opt}
          <button
            type="button"
            class="sp-seg-btn"
            class:is-active={settings.showLabels === opt.k}
            onclick={() => setLabels(opt.k as GraphSettings['showLabels'])}
          >{opt.n}</button>
        {/each}
      </div>
    </div>
  </section>

  <section class="sp-section">
    <h3>交互</h3>
    <label class="sp-row">
      <span class="sp-lbl">单击节点直接跳转笔记</span>
      <label class="sp-toggle">
        <input type="checkbox" checked={settings.clickToOpen}
               onchange={(e) => onChange({ clickToOpen: (e.currentTarget as HTMLInputElement).checked })} />
        <span></span>
      </label>
    </label>
    <p class="sp-hint">关闭时：单击=选中显示邻居，双击=打开笔记</p>
  </section>

  <section class="sp-section">
    <h3>外观</h3>
    <div class="sp-row sp-slider">
      <span class="sp-lbl">节点大小</span>
      <input type="range" min="0.5" max="2.5" step="0.1" value={settings.nodeScale}
             oninput={(e) => onChange({ nodeScale: Number((e.currentTarget as HTMLInputElement).value) })} />
      <span class="sp-val">{settings.nodeScale.toFixed(1)}×</span>
    </div>
    <div class="sp-row sp-slider">
      <span class="sp-lbl">边宽</span>
      <input type="range" min="0.2" max="3" step="0.1" value={settings.edgeScale}
             oninput={(e) => onChange({ edgeScale: Number((e.currentTarget as HTMLInputElement).value) })} />
      <span class="sp-val">{settings.edgeScale.toFixed(1)}×</span>
    </div>
    <div class="sp-row sp-slider">
      <span class="sp-lbl">边透明度</span>
      <input type="range" min="0" max="1" step="0.05" value={settings.edgeOpacity}
             oninput={(e) => onChange({ edgeOpacity: Number((e.currentTarget as HTMLInputElement).value) })} />
      <span class="sp-val">{Math.round(settings.edgeOpacity * 100)}%</span>
    </div>
    <div class="sp-row sp-slider">
      <span class="sp-lbl">背景亮度</span>
      <input type="range" min="0" max="1" step="0.05" value={settings.bgDim}
             oninput={(e) => onChange({ bgDim: Number((e.currentTarget as HTMLInputElement).value) })} />
      <span class="sp-val">{Math.round(settings.bgDim * 100)}%</span>
    </div>
  </section>

  <section class="sp-section">
    <h3>力导向参数</h3>
    <p class="sp-hint">仅影响「力导向」视图布局</p>
    <div class="sp-row sp-slider">
      <span class="sp-lbl">斥力</span>
      <input type="range" min="200" max="2400" step="20" value={settings.forceRepel}
             oninput={(e) => onChange({ forceRepel: Number((e.currentTarget as HTMLInputElement).value) })} />
      <span class="sp-val">{settings.forceRepel}</span>
    </div>
    <div class="sp-row sp-slider">
      <span class="sp-lbl">弹簧</span>
      <input type="range" min="0.005" max="0.08" step="0.002" value={settings.forceSpring}
             oninput={(e) => onChange({ forceSpring: Number((e.currentTarget as HTMLInputElement).value) })} />
      <span class="sp-val">{settings.forceSpring.toFixed(3)}</span>
    </div>
    <div class="sp-row sp-slider">
      <span class="sp-lbl">边长</span>
      <input type="range" min="20" max="220" step="2" value={settings.forceEdgeLen}
             oninput={(e) => onChange({ forceEdgeLen: Number((e.currentTarget as HTMLInputElement).value) })} />
      <span class="sp-val">{settings.forceEdgeLen}</span>
    </div>
  </section>

  <footer class="sp-foot">
    <span>滚轮 / +- 按钮：缩放 · 拖动画布：平移</span>
  </footer>
</div>

<style>
  .sp-wrap {
    height: 100%;
    overflow: auto;
    padding: 20px 24px;
    background: linear-gradient(180deg, #110926, #06030f);
    color: #f3ecff;
    display: flex; flex-direction: column;
    gap: 18px;
  }
  .sp-head {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid rgb(255 255 255 / 0.1);
    padding-bottom: 10px;
  }
  .sp-head h2 { margin: 0; font-size: 1.05rem; }
  .sp-reset {
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.16);
    color: #f3ecff;
    border-radius: 8px;
    padding: 5px 12px;
    cursor: pointer;
    font-size: 0.78rem;
  }
  .sp-reset:hover { background: rgb(255 255 255 / 0.16); }

  .sp-section {
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.1);
    border-radius: 12px;
    padding: 14px 16px;
    display: flex; flex-direction: column;
    gap: 10px;
  }
  .sp-section h3 {
    margin: 0;
    font-size: 0.84rem;
    letter-spacing: 1px;
    color: rgb(255 255 255 / 0.65);
    text-transform: uppercase;
  }
  .sp-hint {
    margin: -4px 0 0;
    font-size: 0.72rem;
    color: #b6a8d3;
  }

  .sp-row {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px;
    font-size: 0.84rem;
  }
  .sp-lbl { color: #d6cae6; }
  .sp-slider {
    display: grid;
    grid-template-columns: 90px 1fr 60px;
    gap: 12px;
  }
  .sp-slider input[type='range'] {
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
    width: 100%;
  }
  .sp-slider input[type='range']::-webkit-slider-thumb {
    appearance: none; -webkit-appearance: none;
    width: 14px; height: 14px; border-radius: 50%;
    background: #f0e8ff;
    border: 1px solid rgb(180 140 255 / 0.7);
    cursor: pointer;
  }
  .sp-val {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: #fff;
    font-size: 0.82rem;
  }

  .sp-seg {
    display: inline-flex;
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.12);
    border-radius: 10px;
    padding: 2px;
  }
  .sp-seg-btn {
    background: transparent;
    border: 0;
    color: #d6cae6;
    border-radius: 8px;
    padding: 4px 12px;
    font-size: 0.78rem;
    cursor: pointer;
    transition: background 0.12s ease;
  }
  .sp-seg-btn:hover { background: rgb(255 255 255 / 0.08); }
  .sp-seg-btn.is-active {
    background: linear-gradient(135deg, rgba(255, 141, 232, 0.35), rgba(180, 140, 255, 0.35));
    color: #fff;
  }

  .sp-toggle {
    position: relative;
    width: 38px; height: 22px;
    display: inline-block;
  }
  .sp-toggle input { opacity: 0; width: 0; height: 0; }
  .sp-toggle span {
    position: absolute; inset: 0;
    background: rgb(255 255 255 / 0.18);
    border-radius: 999px;
    transition: background 0.2s ease;
    cursor: pointer;
  }
  .sp-toggle span::before {
    content: '';
    position: absolute;
    width: 16px; height: 16px; border-radius: 50%;
    background: #fff;
    top: 3px; left: 3px;
    transition: transform 0.2s ease;
  }
  .sp-toggle input:checked + span { background: rgb(180 140 255 / 0.8); }
  .sp-toggle input:checked + span::before { transform: translateX(16px); }

  .sp-foot {
    margin-top: auto;
    text-align: center;
    color: #aa97cf;
    font-size: 0.72rem;
    padding-top: 6px;
    border-top: 1px solid rgb(255 255 255 / 0.06);
  }
</style>
