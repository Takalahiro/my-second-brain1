#!/usr/bin/env node
// 扫 public 目录，生成 media-manifest.json
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, basename, join, dirname } from 'node:path';
import {
  SCENES,
  RAIN_SCENES,
  VIDEO_EXT,
  IMAGE_EXT,
  AUDIO_EXT,
  PLY_EXT,
  SOG_EXT,
  COMPRESSED_PLY_SUFFIX,
  MANIFEST_OUT,
} from './schema.mjs';
import { PUBLIC, ROOT, publicUrl } from './paths.mjs';

const OUT = join(ROOT, ...MANIFEST_OUT);

function listDir(dir, allow) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((n) => allow.has(extname(n).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans'));
}

function titleize(name) {
  const base = basename(name, extname(name));
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .trim();
}

const videoFiles = listDir(join(PUBLIC, 'video'), VIDEO_EXT);
const sceneFiles = listDir(join(PUBLIC, 'picture', 'scenes'), IMAGE_EXT);
const mobileFiles = listDir(join(PUBLIC, 'picture', 'mobile'), IMAGE_EXT);
const musicFiles = listDir(join(PUBLIC, 'music'), AUDIO_EXT);
const plyFiles = listDir(join(PUBLIC, 'ply'), PLY_EXT).filter(
  (n) => !n.toLowerCase().endsWith(COMPRESSED_PLY_SUFFIX),
);
const sogFiles = listDir(join(PUBLIC, 'ply'), SOG_EXT);
const compressedPlyFiles = existsSync(join(PUBLIC, 'ply'))
  ? readdirSync(join(PUBLIC, 'ply'), { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(COMPRESSED_PLY_SUFFIX))
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b, 'zh-Hans'))
  : [];

function findVideo(scene, rain = false) {
  const target = rain ? `${scene} rain` : scene;
  const hit = videoFiles.find((f) => basename(f, extname(f)).toLowerCase() === target.toLowerCase());
  return hit ? publicUrl(`video/${hit}`) : null;
}

function findScene(scene) {
  const hit = sceneFiles.find((f) => basename(f, extname(f)).toLowerCase() === scene.toLowerCase());
  return hit ? publicUrl(`picture/scenes/${hit}`) : null;
}

function findSog(scene) {
  const hit = sogFiles.find((f) => basename(f, extname(f)).toLowerCase() === scene.toLowerCase());
  return hit ? publicUrl(`ply/${hit}`) : null;
}

function findCompressedPly(scene) {
  const hit = compressedPlyFiles.find((f) => {
    const stem = f.slice(0, -COMPRESSED_PLY_SUFFIX.length).toLowerCase();
    return stem === scene.toLowerCase();
  });
  return hit ? publicUrl(`ply/${hit}`) : null;
}

function findPly(scene) {
  const compressed = findCompressedPly(scene);
  if (compressed) return compressed;
  const sog = findSog(scene);
  if (sog) return sog;
  const hit = plyFiles.find((f) => basename(f, extname(f)).toLowerCase() === scene.toLowerCase());
  return hit ? publicUrl(`ply/${hit}`) : null;
}

const scenes = SCENES.map((id) => ({
  id,
  label: titleize(id),
  poster: findScene(id),
  video: findVideo(id, false),
  videoRain: RAIN_SCENES.includes(id) ? findVideo(id, true) : null,
  hasRain: RAIN_SCENES.includes(id),
  ply: findPly(id),
  hasPly: !!findPly(id),
  sog: findSog(id),
  hasSog: !!findSog(id),
  compressedPly: findCompressedPly(id),
  hasCompressedPly: !!findCompressedPly(id),
}));

const mobile = mobileFiles.map((name, idx) => ({
  id: `mobile-${idx}`,
  label: titleize(name).replace(/Mobile$/i, '').trim() || `Mobile ${idx + 1}`,
  src: publicUrl(`picture/mobile/${name}`),
}));

function inferArtist(name) {
  const m = name.match(/^(?:\[([^\]]+)\]|([^-]+?))\s*-\s*(.+)$/);
  if (m) {
    const artist = (m[1] || m[2] || '').trim();
    const title = m[3].replace(/_SQ$/i, '').trim();
    return { artist, title };
  }
  return { artist: '', title: titleize(name) };
}

const tracks = musicFiles.map((name, idx) => {
  const stem = basename(name, extname(name));
  const { artist, title } = inferArtist(stem);
  return {
    id: `track-${idx}`,
    src: publicUrl(`music/${name}`),
    title: title || stem,
    artist,
  };
});

const manifest = {
  generatedAt: new Date().toISOString(),
  scenes,
  mobile,
  tracks,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`media-manifest.json ok: scenes=${scenes.length} mobile=${mobile.length} tracks=${tracks.length}`);
