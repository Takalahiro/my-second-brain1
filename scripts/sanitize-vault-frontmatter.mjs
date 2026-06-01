#!/usr/bin/env node
/**
 * Remove orphan opening `---` lines that break Astro content collection YAML parsing.
 * Obsidian backups sometimes prepend `---` without a closing fence or YAML body.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = path.join(ROOT, 'obsidian-vault');

export function stripOrphanOpeningFence(raw) {
  const lines = raw.split(/\r?\n/);
  let start = 0;
  while (start < lines.length && lines[start].trim() === '') start += 1;
  if (start >= lines.length || lines[start].trim() !== '---') return raw;

  for (let i = start + 1; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed === '---') return raw;
    if (trimmed.startsWith('#') || (trimmed !== '' && !trimmed.includes(':'))) {
      return lines.slice(i).join('\n');
    }
  }

  return raw;
}

function walkMd(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkMd(full, out);
    else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

function main() {
  if (!statSync(VAULT, { throwIfNoEntry: false })?.isDirectory()) {
    console.log('▌ sanitize-vault-frontmatter: vault missing, skip');
    return;
  }

  let fixed = 0;
  for (const file of walkMd(VAULT)) {
    const raw = readFileSync(file, 'utf8');
    const next = stripOrphanOpeningFence(raw);
    if (next !== raw) {
      writeFileSync(file, next, 'utf8');
      fixed += 1;
      console.log(`  ↳ fixed orphan frontmatter: ${path.relative(VAULT, file)}`);
    }
  }

  if (fixed > 0) console.log(`✅ sanitize-vault-frontmatter: ${fixed} file(s) repaired`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
