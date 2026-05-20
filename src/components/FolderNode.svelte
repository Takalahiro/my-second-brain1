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
              <a href={'/notes/' + n.slug} class="note-link">
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
    margin-bottom: 8px;
  }
  .folder-block.depth-0 > .folder-children {
    padding-left: 0;
  }
  .folder-block:not(.depth-0) > .folder-children {
    padding-left: 14px;
    margin-left: 8px;
    border-left: 1px solid rgb(132 122 166 / 0.28);
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
    gap: 8px;
    width: 100%;
    padding: 9px 12px;
    text-align: left;
    cursor: pointer;
    border: 1px solid rgb(126 116 158 / 0.36);
    font-weight: 600;
    color: #f3ecff;
    margin: 5px 0;
    box-sizing: border-box;
    appearance: none;
    -webkit-appearance: none;
    background: linear-gradient(180deg, rgb(36 31 53 / 0.88), rgb(29 25 43 / 0.88));
    box-shadow: 0 8px 18px rgb(0 0 0 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.04);
    border-radius: 14px;
    transition: background-color var(--motion-fast) var(--motion-ease),
      box-shadow var(--motion-fast) var(--motion-ease),
      border-color var(--motion-fast) var(--motion-ease);
  }
  .folder-row:hover {
    border-color: rgb(156 142 202 / 0.5);
    background: linear-gradient(180deg, rgb(42 36 62 / 0.94), rgb(33 28 50 / 0.94));
    box-shadow: 0 10px 22px rgb(0 0 0 / 0.24), inset 0 1px 0 rgb(255 255 255 / 0.05);
  }
  .folder-row:active {
    box-shadow: 0 5px 12px rgb(0 0 0 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.04);
  }

  .folder-block.depth-1 > .folder-row {
    font-size: 1rem;
  }
  .folder-block.depth-2 > .folder-row {
    font-size: 0.95rem;
  }
  .folder-block.depth-3 > .folder-row,
  .folder-block.depth-4 > .folder-row,
  .folder-block.depth-5 > .folder-row {
    font-size: 0.9rem;
    font-weight: 500;
  }

  .folder-caret {
    width: 0.86em;
    height: 0.86em;
    color: #d4c9ee;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-size: 1em;
    font-weight: 600;
    transition: transform var(--motion-fast) var(--motion-ease);
    flex: 0 0 1em;
  }
  .folder-caret:not(.collapsed) {
    transform: rotate(90deg);
  }
  .folder-icon {
    flex: 0 0 auto;
    font-size: 0.92rem;
  }
  .folder-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: clamp(0.74rem, 0.18vw + 0.82rem, 1rem);
    line-height: 1.2;
  }
  .folder-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    font-size: 0.66rem;
    line-height: 1;
    color: #e9e1fc;
    background: rgb(20 18 30 / 0.95);
    padding: 2px 7px;
    border-radius: 999px;
    border: 1px solid rgb(108 97 141 / 0.42);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
    font-weight: 600;
    letter-spacing: 0;
  }
  :global(.dark) .folder-count {
    color: #f1e9ff;
    background: rgb(14 12 21 / 0.98);
    border-color: rgb(85 74 116 / 0.52);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
  }

  .notes-list {
    list-style: none;
    margin: 4px 0 8px;
    padding: 0;
  }

  .note-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 12px;
    color: #ece4ff;
    border: 1px solid rgb(118 108 150 / 0.28);
    text-decoration: none;
    font-size: 0.9rem;
    margin: 5px 0;
    background: linear-gradient(180deg, rgb(34 30 50 / 0.78), rgb(27 24 40 / 0.78));
    box-shadow: 0 6px 14px rgb(0 0 0 / 0.18), inset 0 1px 0 rgb(255 255 255 / 0.03);
    transition: background-color var(--motion-fast) var(--motion-ease),
      box-shadow var(--motion-fast) var(--motion-ease),
      border-color var(--motion-fast) var(--motion-ease);
  }
  .note-link:hover {
    border-color: rgb(148 137 188 / 0.48);
    background: linear-gradient(180deg, rgb(40 35 58 / 0.86), rgb(32 28 47 / 0.86));
    box-shadow: 0 9px 18px rgb(0 0 0 / 0.22), inset 0 1px 0 rgb(255 255 255 / 0.04);
  }
  .note-link:active {
    box-shadow: 0 4px 10px rgb(0 0 0 / 0.16), inset 0 1px 0 rgb(255 255 255 / 0.03);
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
    font-size: clamp(0.72rem, 0.16vw + 0.8rem, 0.94rem);
  }
  .note-date {
    flex: 0 0 auto;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .subfolders {
    margin: 6px 0;
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
      padding: 8px 9px;
      margin: 3px 0;
    }
    .folder-caret {
      width: 1em;
      height: 1em;
      flex: 0 0 1em;
    }
    .folder-name {
      white-space: nowrap;
      font-size: clamp(0.64rem, 2.2vw, 0.86rem);
      line-height: 1.1;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .folder-count {
      font-size: 0.58rem;
      padding: 1px 5px;
    }

    .notes-list {
      margin: 2px 0 6px;
    }
    .note-link {
      gap: 5px;
      padding: 7px 9px;
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
