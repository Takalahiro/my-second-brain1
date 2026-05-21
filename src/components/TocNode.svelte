<script lang="ts">
  import type { HeadingNode } from '../lib/heading-tree';
  import Self from './TocNode.svelte';

  interface Props {
    node: HeadingNode;
    activeSlug: string | null;
    onNavigate: (slug: string) => void;
    /** 由父级统一管理的折叠状态 Map（key=slug, value=true 表示已折叠） */
    collapsedMap: Record<string, boolean>;
    /** 折叠状态变更回调 */
    onToggle: (slug: string) => void;
  }

  let { node, activeSlug, onNavigate, collapsedMap, onToggle }: Props = $props();

  const hasChildren = $derived(node.children.length > 0);
  const isActive = $derived(activeSlug === node.slug);
  const collapsed = $derived(!!collapsedMap[node.slug]);

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    onNavigate(node.slug);
  }

  function toggle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onToggle(node.slug);
  }
</script>

<li class="toc-node">
  <div
    class="toc-row {isActive ? 'is-active' : ''}"
    style="padding-left: {(node.depth - 2) * 10}px"
  >
    {#if hasChildren}
      <button
        type="button"
        class="toc-toggle"
        aria-label={collapsed ? '展开' : '折叠'}
        aria-expanded={!collapsed}
        onclick={toggle}
      >
        <svg viewBox="0 0 10 10" class="toc-caret {collapsed ? 'collapsed' : ''}" aria-hidden="true">
          <path d="M3 1.5 L7 5 L3 8.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    {:else}
      <span class="toc-toggle-spacer" aria-hidden="true"></span>
    {/if}

    <a href={'#' + node.slug} class="toc-link" onclick={handleClick} title={node.text}>
      {node.text}
    </a>
  </div>

  {#if hasChildren}
    <ul class="toc-children" hidden={collapsed}>
      {#each node.children as child (child.slug)}
        <Self node={child} {activeSlug} {onNavigate} {collapsedMap} {onToggle} />
      {/each}
    </ul>
  {/if}
</li>

<style>
  .toc-node {
    list-style: none;
  }

  .toc-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }

  .toc-toggle {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    border: none;
    background: transparent;
    color: rgb(107 114 128);
    cursor: pointer;
    border-radius: 8px;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  .toc-toggle:hover,
  .toc-toggle:active {
    background: rgb(243 244 246);
    color: rgb(37 99 235);
  }
  :global(.dark) .toc-toggle:hover {
    background: rgb(31 41 55);
    color: rgb(96 165 250);
  }
  .toc-toggle-spacer {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
  }
  .toc-caret {
    width: 10px;
    height: 10px;
    transition: transform 0.15s ease;
  }
  .toc-caret:not(.collapsed) {
    transform: rotate(90deg);
  }

  .toc-link {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    display: flex;
    align-items: center;
    padding: 6px 8px;
    border-radius: 8px;
    color: rgb(75 85 99);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  :global(.dark) .toc-link {
    color: rgb(156 163 175);
  }
  .toc-link:hover,
  .toc-link:active {
    color: rgb(37 99 235);
    background: rgb(243 244 246);
  }
  :global(.dark) .toc-link:hover {
    color: rgb(96 165 250);
    background: rgb(31 41 55);
  }

  .toc-row.is-active .toc-link {
    color: rgb(37 99 235);
    background: rgb(239 246 255);
    font-weight: 500;
  }
  :global(.dark) .toc-row.is-active .toc-link {
    color: rgb(147 197 253);
    background: rgb(30 58 138 / 0.3);
  }

  .toc-children {
    margin: 2px 0 2px 6px;
    padding-left: 6px;
    border-left: 1px solid rgb(229 231 235);
    list-style: none;
  }
  .toc-children[hidden] {
    display: none;
  }
  :global(.dark) .toc-children {
    border-color: rgb(31 41 55);
  }
</style>
