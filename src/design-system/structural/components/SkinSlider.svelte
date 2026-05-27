<script lang="ts">
  import { resolveStructuralSkin } from '../skin-context';
  import type { SkinSliderProps } from '../primitives/controls/types';

  let {
    label,
    value,
    min,
    max,
    step = 0.05,
    unit = '',
    formatValue,
    ariaLabel,
    oninput,
  }: SkinSliderProps = $props();

  const skin = resolveStructuralSkin();
  const pct = $derived(max > min ? ((value - min) / (max - min)) * 100 : 0);
  const display = $derived(formatValue ? formatValue(value) : `${value.toFixed(2)}${unit}`);

  function onRange(e: Event) {
    oninput(Number((e.currentTarget as HTMLInputElement).value));
  }
</script>

<div class="ctl-slider ctl-slider--{skin}">
  <div class="ctl-slider__head">
    <span class="ctl-slider__label">{label}</span>
    <span class="ctl-slider__val">{display}</span>
  </div>

  {#if skin === 'blueprint'}
    <div class="ctl-slider__dim">
      <span class="ctl-slider__tick">├</span>
      <div class="ctl-slider__track">
        <span class="ctl-slider__fill" style="width:{pct}%"></span>
        <span class="ctl-slider__cursor" style="left:{pct}%"></span>
      </div>
      <span class="ctl-slider__tick">┤</span>
    </div>
    <input type="range" class="ctl-slider__input" {min} {max} {step} {value} aria-label={ariaLabel} oninput={onRange} />
  {:else if skin === 'scholar'}
    <div class="ctl-slider__ribbon-track">
      <span class="ctl-slider__ribbon" style="left:{pct}%"></span>
    </div>
    <input type="range" class="ctl-slider__input" {min} {max} {step} {value} aria-label={ariaLabel} oninput={onRange} />
  {:else if skin === 'terminal'}
    <pre class="ctl-slider__bar">[{ '#'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10)) }] {Math.round(pct)}%</pre>
    <input type="range" class="ctl-slider__input" {min} {max} {step} {value} aria-label={ariaLabel} oninput={onRange} />
  {:else if skin === 'crt'}
    <pre class="ctl-slider__bar ctl-slider__bar--crt">{ '▮'.repeat(Math.round(pct / 12.5)) + '▯'.repeat(8 - Math.round(pct / 12.5)) }</pre>
    <input type="range" class="ctl-slider__input" {min} {max} {step} {value} aria-label={ariaLabel} oninput={onRange} />
  {:else if skin === 'observatory'}
    <div class="ctl-slider__ra">RA {Math.floor(pct * 0.24)}ʰ{Math.floor((pct % 10) * 6)}ᵐ</div>
    <input type="range" class="ctl-slider__input ctl-slider__input--obs" {min} {max} {step} {value} aria-label={ariaLabel} oninput={onRange} />
  {:else if skin === 'herbarium'}
    <div class="ctl-slider__ruler">
      <span>├</span><span class="ctl-slider__needle" style="left:{pct}%">▼</span><span>┤</span>
    </div>
    <input type="range" class="ctl-slider__input" {min} {max} {step} {value} aria-label={ariaLabel} oninput={onRange} />
  {:else if skin === 'ink'}
    <div class="ctl-slider__scroll">
      <span class="ctl-slider__roll"></span>
      <span class="ctl-slider__paper" style="width:{pct}%"></span>
      <span class="ctl-slider__roll"></span>
    </div>
    <input type="range" class="ctl-slider__input" {min} {max} {step} {value} aria-label={ariaLabel} oninput={onRange} />
  {:else if skin === 'rpg'}
    <div class="ctl-slider__exp">
      <div class="ctl-slider__exp-fill" style="width:{pct}%"></div>
    </div>
    <input type="range" class="ctl-slider__input" {min} {max} {step} {value} aria-label={ariaLabel} oninput={onRange} />
  {:else if skin === 'spacecraft'}
    <div class="ctl-slider__throttle">
      {#each Array(8) as _, i}
        <span class="ctl-slider__seg" class:is-on={i < Math.round(pct / 12.5)}></span>
      {/each}
    </div>
    <input type="range" class="ctl-slider__input" {min} {max} {step} {value} aria-label={ariaLabel} oninput={onRange} />
  {/if}
</div>
