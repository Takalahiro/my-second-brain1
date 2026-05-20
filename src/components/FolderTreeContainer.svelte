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

<div class="folder-tree-toolbar pixel-card glass-container">
  <button type="button" class="tool-btn pixel-button" onclick={expandAll}>
    <span class="tool-icon">▼</span> 展开全部
  </button>
  <button type="button" class="tool-btn pixel-button" onclick={collapseAll}>
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
    border-width: 1px;
  }
  .tool-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    cursor: pointer;
    font-size: 0.8125rem;
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
