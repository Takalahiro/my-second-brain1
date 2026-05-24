#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
spawnSync(process.execPath, [join(root, 'tools/media/build-manifest.mjs')], {
  stdio: 'inherit',
  cwd: root,
});
