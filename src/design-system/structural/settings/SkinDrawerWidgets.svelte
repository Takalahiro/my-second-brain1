<script lang="ts">
  import SkinSwitch from '../components/SkinSwitch.svelte';
  import SkinDrawerGlyph from '../components/SkinDrawerGlyph.svelte';
  import { WIDGET_ICON_MAP, type WidgetIconKey } from '../../../lib/pixel-icons';
  import type { DrawerWidget } from '../../../lib/i18n/drawer-catalog';
  import type { Messages } from '../../../lib/i18n/messages/zh';

  interface Props {
    m: Messages['drawer'];
    groups: Array<{ title: string; ids: WidgetIconKey[] }>;
    itemMap: Record<WidgetIconKey, DrawerWidget>;
    enabled: Record<WidgetIconKey, boolean>;
    dragKey: WidgetIconKey | null;
    dragging: boolean;
    onTileClick: (e: MouseEvent, w: DrawerWidget) => void;
    onTilePointerDown: (e: PointerEvent, w: DrawerWidget) => void;
    onTilePointerMove: (e: PointerEvent) => void;
    onTilePointerUp: (e: PointerEvent, w: DrawerWidget) => void;
    onToggle: (key: WidgetIconKey) => void;
  }

  let {
    m,
    groups,
    itemMap,
    enabled,
    dragKey,
    dragging,
    onTileClick,
    onTilePointerDown,
    onTilePointerMove,
    onTilePointerUp,
    onToggle,
  }: Props = $props();
</script>

<div class="structural-drawer-pane">
  <p class="structural-drawer-section__hint">{m.paneHint}</p>
  {#each groups as group (group.title)}
    <section class="structural-drawer-section">
      <h3 class="structural-drawer-section__label">{group.title}</h3>
      <ul class="structural-drawer-widget-list">
        {#each group.ids as id (id)}
          {@const w = itemMap[id]}
          <li>
            <div
              class="structural-menu-row structural-drawer-widget-row"
              class:is-on={enabled[w.id]}
              class:is-dragging={dragging && dragKey === w.id}
              role="button"
              tabindex="0"
              title={w.pinned ? m.tapToggle : m.tapToggleDrag}
              onclick={(e) => onTileClick(e, w)}
              onpointerdown={(e) => onTilePointerDown(e, w)}
              onpointermove={onTilePointerMove}
              onpointerup={(e) => onTilePointerUp(e, w)}
              onpointercancel={(e) => {
                (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
              }}
            >
              <span class="structural-menu-row__cur">{enabled[w.id] ? '▶' : ' '}</span>
              <span class="structural-drawer-widget-row__icon"><SkinDrawerGlyph name={WIDGET_ICON_MAP[w.id]} size={16} /></span>
              <span class="structural-drawer-widget-row__text">
                <span class="structural-drawer-row__title">{w.name}</span>
                <span class="structural-drawer-row__sub">{w.desc}</span>
              </span>
              <span data-no-drag>
                <SkinSwitch
                  checked={enabled[w.id]}
                  label={`${w.name} ${m.toggleSwitch}`}
                  onchange={() => onToggle(w.id)}
                />
              </span>
            </div>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>
