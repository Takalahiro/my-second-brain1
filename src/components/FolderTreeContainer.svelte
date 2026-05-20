<script lang="ts">
  import type { FolderNode as FolderNodeType } from '../lib/folder-tree';
  import FolderNode from './FolderNode.svelte';

  interface Props {
    tree: FolderNodeType;
    defaultExpandDepth?: number;
    storagePrefix?: string;
  }

  let { tree, defaultExpandDepth = 0, storagePrefix }: Props = $props();

  let forceTick = $state(0);
  let forceAction = $state<'expand-all' | 'collapse-all' | null>(null);

  function expandAll() {
    forceAction = 'expand-all';
    forceTick++;
  }
  function collapseAll() {
    forceAction = 'collapse-all';
    forceTick++;
  }
</script>

<div class="folder-tree-toolbar">
  <button type="button" class="tool-btn" onclick={expandAll}>
    <span class="tool-icon">▼</span> 展开全部
  </button>
  <button type="button" class="tool-btn" onclick={collapseAll}>
    <span class="tool-icon">▶</span> 折叠全部
  </button>
  <span class="tool-hint">点击每个文件夹的 ▶ 三角可单独展开/折叠</span>
</div>

<FolderNode
  node={tree}
  depth={0}
  {defaultExpandDepth}
  {storagePrefix}
  {forceTick}
  {forceAction}
/>

<style>
  .folder-tree-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px 12px;
    border: 1px solid rgb(229 231 235);
    border-radius: 8px;
    background: rgb(249 250 251);
  }
  :global(.dark) .folder-tree-toolbar {
    background: rgb(17 24 39);
    border-color: rgb(31 41 55);
  }
  .tool-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid rgb(209 213 219);
    border-radius: 6px;
    background: white;
    color: rgb(31 41 55);
    cursor: pointer;
    font-size: 0.8125rem;
    transition: background 0.12s, border-color 0.12s;
  }
  :global(.dark) .tool-btn {
    background: rgb(31 41 55);
    border-color: rgb(55 65 81);
    color: rgb(229 231 235);
  }
  .tool-btn:hover {
    background: rgb(239 246 255);
    border-color: rgb(59 130 246);
  }
  :global(.dark) .tool-btn:hover {
    background: rgb(30 58 138 / 0.4);
    border-color: rgb(96 165 250);
  }
  .tool-icon {
    font-size: 0.7rem;
    opacity: 0.7;
  }
  .tool-hint {
    margin-left: auto;
    font-size: 0.8125rem;
    color: rgb(107 114 128);
  }
  @media (max-width: 640px) {
    .tool-hint { display: none; }
  }
</style>
