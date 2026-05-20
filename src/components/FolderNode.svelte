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
    <button type="button" class="folder-row pixel-card glass-container" onclick={toggle} aria-expanded={!collapsed}>
      <span class="folder-caret {collapsed ? 'collapsed' : ''}" aria-hidden="true">›</span>
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
              <a href={'/notes/' + n.slug} class="note-link pixel-card glass-container">
                <span class="note-icon">📄</span>
                <span class="note-title">{n.title}</span>
                {#if n.date}
                  <time class="note-date pixel-digits">{n.date.toLocaleDateString('zh-CN')}</time>
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
    border-left: var(--border-thin) solid var(--border-color);
  }

  .root-title {
    font-size: 1.875rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
  }
  .root-meta {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 1rem;
  }

  .folder-row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 10px;
    text-align: left;
    cursor: pointer;
    border-width: var(--border-thin);
    font-weight: 600;
    color: var(--text-primary);
    margin: 4px 0;
    box-shadow: var(--shadow-normal);
    transition: transform var(--motion-fast) var(--motion-ease),
      box-shadow var(--motion-fast) var(--motion-ease),
      border-color var(--motion-fast) var(--motion-ease),
      background-color var(--motion-fast) var(--motion-ease);
  }
  .folder-row:hover {
    border-color: var(--accent-pink);
    box-shadow: var(--shadow-hover);
    transform: translateY(-1px);
  }
  .folder-row:active {
    box-shadow: var(--shadow-active);
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
    width: 1em;
    height: 1em;
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-size: 1em;
    font-weight: 700;
    transition: transform var(--motion-fast) var(--motion-ease);
    flex: 0 0 1em;
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
    color: var(--text-secondary);
    background: var(--accent-peach);
    padding: 1px 6px;
    border-radius: var(--radius-small);
    border: 1px solid var(--border-color);
    font-weight: 400;
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
    padding: 7px 10px;
    border-radius: var(--radius-small);
    color: var(--text-primary);
    border-width: var(--border-thin);
    text-decoration: none;
    font-size: 0.9375rem;
    margin: 6px 0;
    box-shadow: var(--shadow-normal);
    transition: transform var(--motion-fast) var(--motion-ease),
      box-shadow var(--motion-fast) var(--motion-ease),
      border-color var(--motion-fast) var(--motion-ease),
      background-color var(--motion-fast) var(--motion-ease);
  }
  .note-link:hover {
    border-color: var(--accent-lavender);
    transform: translateY(-1px);
    box-shadow: var(--shadow-hover);
  }
  .note-link:active {
    box-shadow: var(--shadow-active);
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
    color: var(--text-secondary);
  }

  .subfolders {
    margin: 4px 0;
  }

  .empty-folder {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 6px 0 6px 24px;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .folder-block:not(.depth-0) > .folder-children {
      padding-left: 10px;
      margin-left: 3px;
    }

    .root-title {
      font-size: 1.25rem;
      margin-bottom: 0.2rem;
    }
    .root-meta {
      font-size: 0.78rem;
      margin-bottom: 0.72rem;
    }

    .folder-row {
      gap: 5px;
      padding: 7px 8px;
      margin: 3px 0;
    }
    .folder-caret {
      width: 1em;
      height: 1em;
      flex: 0 0 1em;
    }
    .folder-block.depth-1 > .folder-row,
    .folder-block.depth-2 > .folder-row,
    .folder-block.depth-3 > .folder-row,
    .folder-block.depth-4 > .folder-row,
    .folder-block.depth-5 > .folder-row {
      font-size: 0.9rem;
      font-weight: 500;
    }
    .folder-name {
      white-space: normal;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-word;
    }
    .folder-count {
      font-size: 0.7rem;
      padding: 1px 5px;
    }

    .notes-list {
      margin: 2px 0 6px;
    }
    .note-link {
      gap: 5px;
      padding: 6px 8px;
      margin: 4px 0;
      align-items: flex-start;
    }
    .note-title {
      white-space: normal;
      line-height: 1.2;
      word-break: break-word;
    }
    .note-date {
      font-size: 0.68rem;
      margin-top: 1px;
    }
    .empty-folder {
      margin-left: 12px;
      font-size: 0.78rem;
    }
  }
</style>
