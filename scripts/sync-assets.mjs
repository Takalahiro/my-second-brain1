import { cp, mkdir, readdir } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';

const VAULT = './obsidian-vault';
const TARGET = './public/vault-assets';
const EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf', '.mp4', '.webm']);

if (!existsSync(VAULT) || readdirSync(VAULT).length === 0) {
  console.error('✗ obsidian-vault submodule 为空或不存在。');
  console.error('  本地：  git submodule update --init --recursive');
  console.error('  Cloudflare Pages：在 Settings → Builds & deployments 启用 "Include git submodules"');
  process.exit(1);
}

let copied = 0;

async function walk(dir, base) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await walk(full, base);
    } else if (EXTS.has(extname(e.name).toLowerCase())) {
      // flat copy：不管 vault 里嵌多深，图片都丢 public/vault-assets/ 根目录，靠文件名找
      const dest = join(TARGET, e.name);
      await mkdir(dirname(dest), { recursive: true });
      await cp(full, dest);
      copied++;
    }
  }
}

await mkdir(TARGET, { recursive: true });
await walk(VAULT, VAULT);
console.log(`✅ Assets synced to ${TARGET} (${copied} files)`);
