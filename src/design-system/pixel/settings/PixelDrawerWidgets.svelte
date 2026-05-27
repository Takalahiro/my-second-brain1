<script lang="ts">
  import PixelFcSwitch from '../components/PixelFcSwitch.svelte';
  import PixelIcon from '../../../components/PixelIcon.svelte';
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

<div class="pixel-drawer-pane">
  <p class="pixel-drawer-section__hint">{m.paneHint}</p>
  {#each groups as group (group.title)}
    <section class="pixel-drawer-section">
      <h3 class="pixel-drawer-section__label">{group.title}</h3>
      <ul class="pixel-drawer-widget-list">
        {#each group.ids as id (id)}
          {@const w = itemMap[id]}
          <li>
            <div
              class="pixel-menu-row pixel-drawer-widget-row"
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
              <span class="pixel-menu-row__cur">{enabled[w.id] ? '▶' : ' '}</span>
              <span class="pixel-drawer-widget-row__icon"><PixelIcon name={WIDGET_ICON_MAP[w.id]} size={16} /></span>
              <span class="pixel-drawer-widget-row__text">
                <span class="pixel-drawer-row__title">{w.name}</span>
                <span class="pixel-drawer-row__sub">{w.desc}</span>
              </span>
              <span data-no-drag>
                <PixelFcSwitch
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
