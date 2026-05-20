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
                                                     │ ① 自动 (cron 10 分钟)
                                                     │ ② 即时 (repository_dispatch)
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

## 三种同步方式

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
| 部署后笔记还是旧的 | submodule pointer 没更新 | 检查父仓库 `git log -1` 看最新 commit 是否含 `obsidian-vault` 变更 |
| GitHub Action 跑了但没 commit | vault 上游没新 commit | 看 Action summary 里 `changed=false` 即正常 |
| Cloudflare 没重新部署 | 父仓库没 push 新 commit | 手动跑一次 workflow_dispatch 触发 |

## 命令速查

| 命令 | 作用 |
|------|------|
| `pnpm vault:sync ["msg"]` | 本地 vault → GitHub vault → 父仓库 submodule pointer |
| `pnpm vault:pull` | GitHub vault → 本地 vault |
| `pnpm vault:audit` | 看 vault 目录结构 / 散落笔记 |
| `pnpm vault:diagnose` | 检查 vault 笔记格式问题 |
| `pnpm dev` | 本地开发 |
| `pnpm build` | 生产构建 |
