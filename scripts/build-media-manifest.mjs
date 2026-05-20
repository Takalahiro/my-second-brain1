#!/usr/bin/env node
/**
 * 扫描 public/video, public/picture/scenes, public/picture/mobile, public/music
 * 输出 src/data/media-manifest.json。
 *
 * 文件名里可能包含空格 / CJK 字符；这里只保留原始文件名，URL 编码留给前端组件做。
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
  // rel 形如 "video/usyd rain.mp4"
  return '/' + rel.split('/').map(encodeURIComponent).join('/');
}

// ---- 场景：以 5 个核心场景为基准，匹配视频和图片 ----
const SCENES = ['usyd', 'kyoto', 'shanghai', 'sydney', 'tokyo'];
const RAIN_SCENES = ['shanghai', 'tokyo', 'usyd'];

const videoFiles = listDir(join(PUBLIC, 'video'), VIDEO_EXT);
const sceneFiles = listDir(join(PUBLIC, 'picture', 'scenes'), IMAGE_EXT);
const mobileFiles = listDir(join(PUBLIC, 'picture', 'mobile'), IMAGE_EXT);
const musicFiles = listDir(join(PUBLIC, 'music'), AUDIO_EXT);

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

const scenes = SCENES.map((id) => ({
  id,
  label: titleize(id),
  poster: findScene(id),
  video: findVideo(id, false),
  videoRain: RAIN_SCENES.includes(id) ? findVideo(id, true) : null,
  hasRain: RAIN_SCENES.includes(id),
}));

const mobile = mobileFiles.map((name, idx) => ({
  id: `mobile-${idx}`,
  label: titleize(name).replace(/Mobile$/i, '').trim() || `Mobile ${idx + 1}`,
  src: publicUrl(`picture/mobile/${name}`),
}));

function inferArtist(name) {
  // ONE OK ROCK - title.flac / [Alexandros] - title_SQ.flac
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
