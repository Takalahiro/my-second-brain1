#!/usr/bin/env node
/**
 * git 跟踪的文件有没有超过 25 MiB — pre-commit / CI 守门用。
 * FormulaNet 模型是 runtime 从 HF 拉的，不在这个检查范围里。
 */
import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';

const LIMIT = 25 * 1024 * 1024;
const root = process.cwd();

function listTrackedFiles() {
  const out = execSync('git ls-files -z', { cwd: root });
  return out.toString('utf8').split('\0').filter(Boolean);
}

const overs = [];
for (const rel of listTrackedFiles()) {
  const abs = path.join(root, rel);
  try {
    const { size } = statSync(abs);
    if (size > LIMIT) {
      overs.push({ rel, mib: (size / 1024 / 1024).toFixed(2) });
    }
  } catch {
    /* 文件没了就 skip */
  }
}

if (overs.length) {
  console.error('以下 git 跟踪文件超过 25 MiB:');
  for (const o of overs) console.error(`  ${o.rel} (${o.mib} MiB)`);
  process.exit(1);
}

console.log('OK: 所有 git 跟踪文件 ≤ 25 MiB');
console.log(
  '提示: FormulaNet 运行时从 HF 下载 encoder≈52MiB、decoder≈25MiB，由浏览器 Cache 缓存，不入库。'
);
