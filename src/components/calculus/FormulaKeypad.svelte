<script lang="ts">
  import { EXPR_PRESETS, KEYPAD_ROWS, displayExpr, insertKeypadToken } from '../../lib/calculus/steps';

  interface Props {
    value?: string;
    onchange?: (v: string) => void;
    label?: string;
  }
  let { value = $bindable(''), onchange, label = 'f(x) =' }: Props = $props();

  function press(key: string) {
    value = insertKeypadToken(value, key);
    onchange?.(value);
  }

  function preset(expr: string) {
    value = expr;
    onchange?.(value);
  }
</script>

<div class="fkeypad">
  <div class="fk-display">
    <span class="fk-label">{label}</span>
    <span class="fk-expr">{displayExpr(value) || '点击按钮输入'}</span>
  </div>

  <div class="fk-presets">
    {#each EXPR_PRESETS as p}
      <button type="button" onclick={() => preset(p.expr)}>{p.label}</button>
    {/each}
  </div>

  <div class="fk-grid">
    {#each KEYPAD_ROWS as row}
      <div class="fk-row">
        {#each row as key}
          <button type="button" class:wide={key.length > 3} onclick={() => press(key)}>{key}</button>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .fkeypad { display: flex; flex-direction: column; gap: 8px; }
  .fk-display {
    padding: 10px 12px; border-radius: 10px;
    background: var(--code-bg); border: 1px solid var(--border-color);
    min-height: 44px;
  }
  .fk-label { display: block; font-size: 0.66rem; color: var(--text-secondary); margin-bottom: 4px; }
  .fk-expr { font-family: 'IBM Plex Mono', monospace; font-size: 1rem; color: #c8e8ff; word-break: break-all; }
  .fk-presets { display: flex; flex-wrap: wrap; gap: 4px; }
  .fk-presets button {
    padding: 4px 8px; border-radius: 6px; border: 1px solid rgb(126 200 255 / 0.25);
    background: rgb(126 200 255 / 0.08); color: inherit; font-size: 0.68rem; cursor: pointer;
  }
  .fk-presets button:hover { background: rgb(126 200 255 / 0.18); }
  .fk-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-bottom: 4px; }
  .fk-row button {
    padding: 8px 4px; border-radius: 8px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; font-size: 0.78rem; cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
  }
  .fk-row button:hover { background: rgb(126 200 255 / 0.15); }
  .fk-row button.wide { font-size: 0.68rem; }
</style>
