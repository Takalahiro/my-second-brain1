#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
spawnSync(
  process.execPath,
  [join(root, 'tools/media/convert-sog-to-compressed-ply.mjs'), ...process.argv.slice(2)],
  { stdio: 'inherit', cwd: root },
);
