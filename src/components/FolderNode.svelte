<script lang="ts">
  import { untrack, onMount } from 'svelte';
  import type { FolderNode } from '../lib/folder-tree';
  import { countNotes } from '../lib/folder-tree';
  import Self from './FolderNode.svelte';

  interface Props {
    node: FolderNode;
    depth?: number;
    /** 默认展开层级深度（含），更深的默认折叠 */
    defaultExpandDepth?: number;
    /** localStorage key 前缀，用于持久化折叠状态；不传则不持久化 */
    storagePrefix?: string;
    /** 总线版本：每次 +1 都会强制读对应 force action（'expand-all'/'collapse-all'） */
    forceTick?: number;
    /** 来自父级的强制动作 */
    forceAction?: 'expand-all' | 'collapse-all' | null;
  }

  let {
    node,
    depth = 0,
    defaultExpandDepth = 0,
    storagePrefix,
    forceTick = 0,
    forceAction = null,
  }: Props = $props();

  const storageKey = $derived(storagePrefix ? `${storagePrefix}:${node.path || '__root__'}` : null);
  const total = $derived(countNotes(node));

  // 初始折叠状态只在组件创建时读一次；用 untrack 抑制 svelte 5 关于"props 在顶级被读取"的告警
  let collapsed = $state(
    untrack(() => {
      if (depth === 0) return false;
      const key = storagePrefix ? `${storagePrefix}:${node.path || '__root__'}` : null;
      if (key && typeof localStorage !== 'undefined') {
        const v = localStorage.getItem(key);
        if (v === 'open')   return false;
        if (v === 'closed') return true;
      }
      return depth > defaultExpandDepth;
    })
  );

  // 监听 forceTick 触发批量展开/折叠（depth=0 始终展开，无需响应）
  let lastTick = $state(0);
  $effect(() => {
    if (forceTick !== lastTick && forceTick > 0 && depth > 0) {
      lastTick = forceTick;
      if (forceAction === 'expand-all') {
        collapsed = false;
        if (storageKey && typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, 'open');
        }
      } else if (forceAction === 'collapse-all') {
        collapsed = true;
        if (storageKey && typeof localStorage !== 'undefined') {
          localStorage.setItem(storageKey, 'closed');
        }
      }
    }
  });

  function toggle() {
    collapsed = !collapsed;
    if (storageKey && typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, collapsed ? 'closed' : 'open');
    }
  }
</script>

<div class="folder-block depth-{depth}">
  {#if depth === 0}
    <h1 class="root-title">{node.name === '根目录' ? '📚 全部笔记' : node.name}</h1>
    <p class="root-meta">共 {total} 篇</p>
  {:else}
    <button type="button" class="folder-row" onclick={toggle} aria-expanded={!collapsed}>
      <svg viewBox="0 0 10 10" class="folder-caret {collapsed ? 'collapsed' : ''}" aria-hidden="true">
        <path d="M3 1.5 L7 5 L3 8.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="folder-icon">{collapsed ? '📁' : '📂'}</span>
      <span class="folder-name">{node.name}</span>
      <span class="folder-count">{total}</span>
    </button>
  {/if}

  {#if !collapsed}
    <div class="folder-children">
      {#if node.notes.length > 0}
        <ul class="notes-list">
          {#each node.notes as n (n.slug)}
            <li>
              <a href={'/notes/' + n.slug} class="note-link">
                <span class="note-icon">📄</span>
                <span class="note-title">{n.title}</span>
                {#if n.date}
                  <time class="note-date">{n.date.toLocaleDateString('zh-CN')}</time>
                {/if}
              </a>
            </li>
          {/each}
        </ul>
      {/if}

      {#if node.children.length > 0}
        <div class="subfolders">
          {#each node.children as child (child.path)}
            <Self
              node={child}
              depth={depth + 1}
              {defaultExpandDepth}
              {storagePrefix}
              {forceTick}
              {forceAction}
            />
          {/each}
        </div>
      {/if}

      {#if node.notes.length === 0 && node.children.length === 0}
        <p class="empty-folder">（空文件夹）</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .folder-block {
    margin-bottom: 4px;
  }
  .folder-block.depth-0 > .folder-children {
    padding-left: 0;
  }
  .folder-block:not(.depth-0) > .folder-children {
    padding-left: 18px;
    margin-left: 6px;
    border-left: 1px solid rgb(229 231 235);
  }
  :global(.dark) .folder-block:not(.depth-0) > .folder-children {
    border-left-color: rgb(31 41 55);
  }

  .root-title {
    font-size: 1.875rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
  }
  .root-meta {
    font-size: 0.875rem;
    color: rgb(107 114 128);
    margin: 0 0 1rem;
  }

  .folder-row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-radius: 6px;
    font-weight: 600;
    color: rgb(31 41 55);
    transition: background 0.12s;
  }
  :global(.dark) .folder-row {
    color: rgb(229 231 235);
  }
  .folder-row:hover {
    background: rgb(243 244 246);
  }
  :global(.dark) .folder-row:hover {
    background: rgb(31 41 55);
  }

  .folder-block.depth-1 > .folder-row {
    font-size: 1.125rem;
  }
  .folder-block.depth-2 > .folder-row {
    font-size: 1rem;
  }
  .folder-block.depth-3 > .folder-row,
  .folder-block.depth-4 > .folder-row,
  .folder-block.depth-5 > .folder-row {
    font-size: 0.9375rem;
    font-weight: 500;
  }

  .folder-caret {
    width: 10px;
    height: 10px;
    color: rgb(107 114 128);
    transition: transform 0.15s ease;
    flex: 0 0 10px;
  }
  .folder-caret:not(.collapsed) {
    transform: rotate(90deg);
  }
  .folder-icon {
    flex: 0 0 auto;
  }
  .folder-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .folder-count {
    flex: 0 0 auto;
    font-size: 0.75rem;
    color: rgb(107 114 128);
    background: rgb(243 244 246);
    padding: 1px 6px;
    border-radius: 999px;
    font-weight: 400;
  }
  :global(.dark) .folder-count {
    background: rgb(31 41 55);
    color: rgb(156 163 175);
  }

  .notes-list {
    list-style: none;
    margin: 4px 0 8px;
    padding: 0;
  }

  .note-link {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 5px 8px;
    border-radius: 4px;
    color: rgb(55 65 81);
    text-decoration: none;
    font-size: 0.9375rem;
    transition: background 0.12s, color 0.12s;
  }
  :global(.dark) .note-link {
    color: rgb(209 213 219);
  }
  .note-link:hover {
    background: rgb(239 246 255);
    color: rgb(37 99 235);
  }
  :global(.dark) .note-link:hover {
    background: rgb(30 58 138 / 0.3);
    color: rgb(147 197 253);
  }
  .note-icon {
    flex: 0 0 auto;
    font-size: 0.875rem;
    opacity: 0.7;
  }
  .note-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .note-date {
    flex: 0 0 auto;
    font-size: 0.75rem;
    color: rgb(156 163 175);
  }

  .subfolders {
    margin: 4px 0;
  }

  .empty-folder {
    font-size: 0.875rem;
    color: rgb(156 163 175);
    margin: 6px 0 6px 24px;
    font-style: italic;
  }
</style>
