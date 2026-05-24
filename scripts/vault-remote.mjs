/**
 * vault submodule 远程对齐 — prepare-vault / auto-sync / GitHub Action 共用
 */
import { execFileSync, spawnSync } from 'node:child_process';

export function isCiBuild() {
  return Boolean(
    process.env.CI ||
    process.env.CF_PAGES ||
    process.env.CLOUDFLARE_PAGES ||
    process.env.GITHUB_ACTIONS,
  );
}

export function gitOut(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function gitOk(args, cwd) {
  const r = spawnSync('git', args, { cwd, stdio: 'inherit' });
  return r.status === 0;
}

export function shortSha(sha) {
  return (sha || '').slice(0, 8);
}

/** 父仓库当前 commit 里记录的 submodule SHA */
export function getPinnedVaultSha(root, submodule = 'obsidian-vault') {
  try {
    const line = gitOut(['ls-tree', 'HEAD', submodule], root);
    return line.split(/\s+/)[2] || null;
  } catch {
    return null;
  }
}

/** vault 目录当前 checkout 的 HEAD */
export function getVaultHead(vaultPath) {
  return gitOut(['rev-parse', 'HEAD'], vaultPath);
}

/** obsidian-vault 远端默认分支 HEAD */
export function getRemoteVaultHead(vaultPath) {
  gitOk(['fetch', 'origin'], vaultPath);
  let branch = 'main';
  try {
    const show = gitOut(['remote', 'show', 'origin'], vaultPath);
    const m = show.match(/HEAD branch: (\S+)/);
    if (m) branch = m[1];
  } catch {
    /* 用 main 兜底 */
  }
  return gitOut(['rev-parse', `origin/${branch}`], vaultPath);
}

/**
 * 把 submodule 切到远端最新（detach HEAD）。
 * @returns {{ pinned, remote, head, updated }}
 */
export function alignVaultToRemote(root, vaultPath) {
  gitOk(['submodule', 'update', '--init', vaultPath], root);

  const pinned = getPinnedVaultSha(root);
  const remote = getRemoteVaultHead(vaultPath);

  if (remote) {
    gitOk(['checkout', '--detach', remote], vaultPath);
  }

  const head = getVaultHead(vaultPath);
  return {
    pinned,
    remote,
    head,
    updated: Boolean(remote && head === remote && pinned !== remote),
  };
}

/** 父仓库 submodule 指针是否落后于 vault 远端 */
export function isSubmodulePointerStale(root, vaultPath) {
  const pinned = getPinnedVaultSha(root);
  let remote = null;
  try {
    remote = getRemoteVaultHead(vaultPath);
  } catch {
    return false;
  }
  return Boolean(pinned && remote && pinned !== remote);
}
