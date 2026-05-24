// three 包一层，legacy 代码用的
import * as THREE from 'three';

export { THREE };

export function createWebGLRenderer(opts: THREE.WebGLRendererParameters = {}) {
  try {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
      ...opts,
    });
    const gl = renderer.getContext();
    if (!gl) throw new Error('WebGL context is null');
    return renderer;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`WebGL 不可用：${msg}`);
  }
}
