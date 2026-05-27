<script lang="ts">
  import SkinSlider from '../../components/SkinSlider.svelte';
  import SkinSwitch from '../../components/SkinSwitch.svelte';
  import { resolveStructuralSkin } from '../../skin-context';
  import type { WhiteNoiseBodyProps } from './whitenoise-types';

  let { ui, tracks, masterVol, onToggleTrack, onSetVol, onMasterVol }: WhiteNoiseBodyProps = $props();
  const skin = resolveStructuralSkin();
</script>

<div class="skin-wn skin-wn--{skin}">
  <div class="skin-wn__master">
    <span class="skin-wn__master-label">{ui.masterVolume}</span>
    <SkinSlider value={masterVol} min={0} max={1} step={0.05} label={ui.masterVolume} oninput={onMasterVol} />
  </div>
  <ul class="skin-wn__list">
    {#each tracks as t (t.key)}
      <li class="skin-wn__row">
        <SkinSwitch checked={t.enabled} label={t.label} onchange={(v) => onToggleTrack(t.key, v)} />
        <span class="skin-wn__track-label">{t.label}</span>
        <SkinSlider value={t.volume} min={0} max={1} step={0.05} label={t.label} oninput={(v) => onSetVol(t.key, v)} />
      </li>
    {/each}
  </ul>
</div>
