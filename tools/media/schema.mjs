// build 脚本和前端 manifest 对齐用的常量

export const SCENES = ['usyd', 'kyoto', 'shanghai', 'sydney', 'tokyo'];
export const RAIN_SCENES = ['shanghai', 'tokyo', 'usyd'];

export const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov']);
export const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);
export const AUDIO_EXT = new Set(['.mp3', '.ogg', '.flac', '.wav', '.m4a']);
export const PLY_EXT = new Set(['.ply']);
export const SOG_EXT = new Set(['.sog']);
export const COMPRESSED_PLY_SUFFIX = '.compressed.ply';

export const MANIFEST_OUT = ['src', 'data', 'media-manifest.json'];
