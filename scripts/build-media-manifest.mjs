#!/usr/bin/env node
/**
 * 扫 public/video、picture/scenes、picture/mobile、music、ply，
 * 输出 src/data/media-manifest.json 给背景切换和音乐播放器。
 *
 * 文件名可能有空格 / 中文 — 这里只存原始名，encodeURIComponent 交给前端。
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, basename, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const OUT = join(ROOT, 'src', 'data', 'media-manifest.json');

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);
const AUDIO_EXT = new Set(['.mp3', '.ogg', '.flac', '.wav', '.m4a']);
const PLY_EXT = new Set(['.ply']);
const SOG_EXT = new Set(['.sog']);
const COMPRESSED_PLY_SUFFIX = '.compressed.ply';

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

function publicUrl(rel) {
  // rel 像 "video/usyd rain.mp4"
  return '/' + rel.split('/').map(encodeURIComponent).join('/');
}

// 5 个 core scene — 视频和 poster 都靠 stem 名字 match
const SCENES = ['usyd', 'kyoto', 'shanghai', 'sydney', 'tokyo'];
const RAIN_SCENES = ['shanghai', 'tokyo', 'usyd'];

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
  const hit = videoFiles.find((f) => {
    const stem = basename(f, extname(f)).toLowerCase();
    return stem === target.toLowerCase();
  });
  return hit ? publicUrl(`video/${hit}`) : null;
}

function findScene(scene) {
  const hit = sceneFiles.find((f) => {
    const stem = basename(f, extname(f)).toLowerCase();
    return stem === scene.toLowerCase();
  });
  return hit ? publicUrl(`picture/scenes/${hit}`) : null;
}

function findSog(scene) {
  const hit = sogFiles.find((f) => {
    const stem = basename(f, extname(f)).toLowerCase();
    return stem === scene.toLowerCase();
  });
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
  const hit = plyFiles.find((f) => {
    const stem = basename(f, extname(f)).toLowerCase();
    return stem === scene.toLowerCase();
  });
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
  // 从文件名猜 artist — "ONE OK ROCK - xxx.flac" / "[Alexandros] - xxx_SQ.flac" 这类
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

console.log(
  `✅ media-manifest.json: scenes=${scenes.length} mobile=${mobile.length} tracks=${tracks.length}`,
);
