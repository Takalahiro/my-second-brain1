<script lang="ts">
  import SkinSlider from '../../components/SkinSlider.svelte';
  import SkinSwitch from '../../components/SkinSwitch.svelte';
  import { resolveStructuralSkin } from '../../skin-context';
  import type { GraphSettingsProps } from './graph-types';

  let {
    ui,
    bgAlpha,
    kRepel,
    edgeLen,
    folderFilter,
    folders,
    onlyConnected,
    clickToOpen,
    onBgAlpha,
    onKRepel,
    onEdgeLen,
    onFolderFilter,
    onOnlyConnected,
    onClickToOpen,
    onRekick,
    onResetView,
  }: GraphSettingsProps = $props();

  const skin = resolveStructuralSkin();
</script>

<div class="skin-graph-settings skin-graph-settings--{skin}">
  <SkinSlider label={ui.windowOpacity} value={bgAlpha} min={0.05} max={0.95} step={0.05} oninput={onBgAlpha} />
  <SkinSlider label="斥力" value={kRepel} min={200} max={2000} step={20} oninput={onKRepel} />
  <SkinSlider label="边长" value={edgeLen} min={30} max={200} step={2} oninput={onEdgeLen} />
  <label class="skin-graph-settings__row">
    <span>分组</span>
    <select
      class="skin-graph-settings__select"
      value={folderFilter ?? ''}
      onchange={(e) => onFolderFilter((e.currentTarget as HTMLSelectElement).value || null)}
    >
      <option value="">全部目录</option>
      {#each folders as f (f)}
        <option value={f}>{f}</option>
      {/each}
    </select>
  </label>
  <div class="skin-graph-settings__row">
    <span>孤岛</span>
    <SkinSwitch checked={!onlyConnected} label="显示无双链节点" onchange={(v) => onOnlyConnected(!v)} />
  </div>
  <div class="skin-graph-settings__row">
    <span>点击</span>
    <SkinSwitch checked={clickToOpen} label="单击节点直接跳转笔记" onchange={onClickToOpen} />
  </div>
  <div class="skin-graph-settings__toolbar">
    <button type="button" class="skin-graph__btn" onclick={onRekick}>重新布局</button>
    <button type="button" class="skin-graph__btn" onclick={onResetView}>居中视图</button>
  </div>
</div>
