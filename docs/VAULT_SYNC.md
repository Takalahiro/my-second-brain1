# Obsidian Vault 自动同步系统

## 仓库结构

```
my-second-brain1 (父仓库 - Astro 站点)
└── obsidian-vault/    ← git submodule，指向 Takalahiro/obsidian-vault
```

## 同步流向

```
┌──────────────────────┐                  ┌──────────────────────┐
│  本地 Obsidian       │   pnpm vault:sync│  GitHub: vault repo  │
│  (./obsidian-vault)  │ ───────────────► │  Takalahiro/         │
│                      │                  │  obsidian-vault      │
└──────────────────────┘                  └──────────┬───────────┘
                                                     │
                                                     │ ① 自动 (cron 5 分钟)
                                                     │ ② 即时 (repository_dispatch)
                                                     │ ③ CI build 拉远端最新（pointer 滞后也生效）
                                                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  GitHub: parent repo (my-second-brain1)                          │
│  ↓ workflows/sync-vault-submodule.yml                             │
│  自动 bump submodule pointer 并 git push                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │ push trigger
                             ▼
                ┌────────────────────────────┐
                │  Cloudflare Pages          │
                │  自动重新构建并部署        │
                └────────────────────────────┘
```

## 每小时自动同步（无人值守）

系统提供 **双层兜底** 的自动同步：

### 第一层：本地 Windows 计划任务（每 1 小时）

一次性安装：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-windows-scheduler.ps1
```

注册一个名为 `MySecondBrain-VaultAutoSync` 的计划任务：

- **触发**：安装 2 分钟后第一次跑，然后**每 1 小时**重复，开机会补跑错过的
- **动作**：`node scripts/auto-sync-vault.mjs`
- **行为**：
  1. 如果本地 vault 有未提交改动 → commit + push 到 GitHub vault
  2. fetch GitHub vault，能 fast-forward 就 reset 本地到远端（diverge 时跳过避免数据丢失）
  3. **若父仓库 pointer 落后 vault 远端，也会 checkout 最新并 bump pointer**
  4. 重新生成 `src/lib/notes-mtime.json`
  5. **仅** commit + push 白名单到父仓库：`obsidian-vault`、`notes-mtime.json`、`vault-sync-meta.json`
- **日志**：`logs/auto-sync.log`（自动保留最近 200 行）
- **并发保护**：lockfile（`logs/auto-sync.lock`）防止上一次未完又开新一次

常用操作：

```powershell
# 看下一次运行时间 / 上次状态
Get-ScheduledTaskInfo -TaskName MySecondBrain-VaultAutoSync

# 立即手动触发
Start-ScheduledTask -TaskName MySecondBrain-VaultAutoSync

# 卸载
powershell -ExecutionPolicy Bypass -File scripts/install-windows-scheduler.ps1 -Uninstall

# 不通过 task scheduler 直接跑一次（调试）
pnpm vault:auto --verbose
```

### 第二层：GitHub Actions（每 5 分钟，云端兜底）

`.github/workflows/sync-vault-submodule.yml` 每 5 分钟在 GitHub 上跑一次。对比**父仓库记录的 pointer** 与 **vault 远端 HEAD**，若落后则：

1. checkout vault 到远端最新
2. 重建 `notes-mtime.json` / `vault-sync-meta.json`
3. bump 父仓库 submodule pointer 并 push → 触发 Cloudflare 重部署

### 第三层：Cloudflare build 拉远端（最终兜底）

`scripts/prepare-vault.mjs` 在 CI/Cloudflare 环境（`CI` / `CF_PAGES`）下，**每次 build 都会 `fetch` vault 远端并用最新笔记构建**，即使父仓库 pointer 还没来得及 bump，网站也不会卡在旧内容。

本地 `pnpm dev` 不会自动改 pointer，仍用父仓库 pin 的版本；要手动对齐跑 `pnpm vault:sync`。

> **两层不会打架**：白名单 add（只 `obsidian-vault` + `notes-mtime.json`）+ 本地脚本 push 前先 `git pull --rebase` + lockfile，三重保险。

---

## 三种手动同步方式

### 方式 A：本地写笔记，一键全链路同步（最常用）

在本机用 Obsidian 编辑 `obsidian-vault/` 里的笔记后：

```bash
pnpm vault:sync                # 自动生成时间戳消息
pnpm vault:sync "新增 LSTM 笔记"  # 自定义消息
```

脚本会做：
1. 在 `obsidian-vault/` 子仓库内 `git add . && git commit && git push`
2. 在父仓库 `git add obsidian-vault && git commit && git push`（更新 submodule pointer）
3. Cloudflare Pages 几分钟后自动重部署

### 方式 B：在别处改了 vault（手机 / 网页 / 另一台机器），本地拉下来

```bash
pnpm vault:pull
```

脚本会做：
1. 检查本地 vault 是否有未提交改动，有就报错
2. `git fetch && git reset --hard origin/main` 同步到远程版本
3. 自动跑 `pnpm sync` 同步图片资源到 `public/vault-assets/`

### 方式 C：完全不动本地，远程 vault 改后自动部署

GitHub Action `.github/workflows/sync-vault-submodule.yml` 提供两种触发：

1. **定时**：每 10 分钟自动检查 vault 上游是否更新，有则 bump submodule pointer
2. **即时（推荐）**：在 `obsidian-vault` 仓库里也部署一个 notify workflow（模板见 `.github/templates/vault-push-notify.yml`），vault push 时即时调用父仓库的 `repository_dispatch`，0 延迟触发

## 启用「即时同步」（一次性配置）

如果想要 vault push 即时部署（而非等 10 分钟 cron）：

1. 在 GitHub 创建一个 fine-grained Personal Access Token：
   - Repository access: 仅限 `Takalahiro/my-second-brain1`
   - Permissions: Contents (read & write) + Metadata (read)
2. 把 token 加到 `Takalahiro/obsidian-vault` 仓库：
   - Settings → Secrets and variables → Actions → New repository secret
   - Name: `PARENT_REPO_TOKEN`
   - Value: 上一步的 token
3. 把 `.github/templates/vault-push-notify.yml` 复制到 `obsidian-vault` 仓库的 `.github/workflows/notify-parent.yml`
4. push 到 obsidian-vault 仓库即生效

## 故障排查

| 现象 | 原因 | 解决 |
|------|------|------|
| `pnpm vault:sync` 提示 `rejected (non-fast-forward)` | 远程 vault 有别人/另一台机器的新 commit | 先 `pnpm vault:pull` 再 `pnpm vault:sync` |
| 部署后笔记还是旧的 | pointer 滞后 + build 未跑 | CI 已兜底拉远端；仍异常则查 Cloudflare 最近一次 build 日志 |
| GitHub Action 跑了但没 commit | vault 上游没新 commit | 看 Action summary 里 `changed=false` 即正常 |
| Cloudflare 没重新部署 | 父仓库没 push 新 commit | 手动跑一次 workflow_dispatch 触发 |

## 命令速查

| 命令 | 作用 |
|------|------|
| `pnpm vault:sync ["msg"]` | 本地 vault → GitHub vault → 父仓库 submodule pointer |
| `pnpm vault:pull` | GitHub vault → 本地 vault |
| `pnpm vault:auto` | 双向自动同步（计划任务每小时调用，也可手动跑） |
| `pnpm vault:audit` | 看 vault 目录结构 / 散落笔记 |
| `pnpm vault:diagnose` | 检查 vault 笔记格式问题 |
| `pnpm dev` | 本地开发 |
| `pnpm build` | 生产构建 |
