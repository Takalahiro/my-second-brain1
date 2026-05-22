#!/usr/bin/env node
/**
 * 扫 public/video、picture/scenes、picture/mobile、music，
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
