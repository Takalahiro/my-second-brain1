/**
 * antimatter15/splat WebGL2 壁纸渲染器 (MIT)
 * 无交互 · 自动环绕 · visibilitychange 暂停
 */
import {
  defaultOrbitMatrix,
  getProjectionMatrix,
  invert4,
  multiply4,
  rotate4,
  translate4,
} from './math';
import { estimateOrbitDistance } from './process-ply';
import { fragmentShaderSource, vertexShaderSource } from './shaders';
import SplatWorker from './splat-worker?worker';

export type GSWallpaperStatus = 'loading' | 'ready' | 'failed';

export type GSWallpaperOptions = {
  plyUrl: string;
  speed?: number;
  maxSplats?: number;
  onStatus?: (status: GSWallpaperStatus, message?: string) => void;
};

function resolveUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

/** manifest 可能指向 .sog，am15 渲染器需要原始 .ply */
export function plyUrlForAm15(url: string): string {
  return url.replace(/\.sog(\?.*)?$/i, '.ply$1');
}

export function createAm15Wallpaper(host: HTMLElement, opts: GSWallpaperOptions) {
  const speed = opts.speed ?? 1;
  const report = (status: GSWallpaperStatus, message?: string) => opts.onStatus?.(status, message);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
  host.appendChild(canvas);

  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl) {
    report('failed', 'WebGL2 不可用');
    return { dispose: () => canvas.remove() };
  }

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed');
    }
    return sh;
  };

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShaderSource));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShaderSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    report('failed', gl.getProgramInfoLog(program) || 'program link failed');
    return { dispose: () => canvas.remove() };
  }
  gl.useProgram(program);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.ONE, gl.ONE_MINUS_DST_ALPHA, gl.ONE);
  gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

  const u_projection = gl.getUniformLocation(program, 'projection')!;
  const u_viewport = gl.getUniformLocation(program, 'viewport')!;
  const u_focal = gl.getUniformLocation(program, 'focal')!;
  const u_view = gl.getUniformLocation(program, 'view')!;
  gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);

  const triangleVertices = new Float32Array([-2, -2, 2, -2, 2, 2, -2, 2]);
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(a_position);
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const indexBuffer = gl.createBuffer();
  const a_index = gl.getAttribLocation(program, 'index');
  gl.enableVertexAttribArray(a_index);
  gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
  gl.vertexAttribIPointer(a_index, 1, gl.INT, false, 0, 0);
  gl.vertexAttribDivisor(a_index, 1);

  const worker = new SplatWorker();
  let vertexCount = 0;
  let projectionMatrix: number[] = [];
  let viewMatrix = defaultOrbitMatrix();
  let orbitBase = defaultOrbitMatrix();
  let orbitDistance = 6.5;
  let fx = 1000;
  let fy = 1000;
  let animStart = Date.now();
  let rafId = 0;
  let running = true;
  let disposed = false;
  const abortCtrl = new AbortController();

  worker.onmessage = (e: MessageEvent) => {
    if (disposed) return;
    if (e.data.error) {
      report('failed', e.data.error);
      return;
    }
    if (e.data.buffer) {
      orbitDistance = estimateOrbitDistance(e.data.buffer);
      orbitBase = defaultOrbitMatrix(orbitDistance);
      viewMatrix = orbitBase.slice();
    } else if (e.data.texdata) {
      const { texdata, texwidth, texheight } = e.data;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA32UI,
        texwidth,
        texheight,
        0,
        gl.RGBA_INTEGER,
        gl.UNSIGNED_INT,
        texdata,
      );
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    } else if (e.data.depthIndex) {
      gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, e.data.depthIndex, gl.DYNAMIC_DRAW);
      vertexCount = e.data.vertexCount;
      if (!disposed) report('ready');
    }
  };

  function resize() {
    const w = Math.max(host.clientWidth, 1);
    const h = Math.max(host.clientHeight, 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    canvas.width = cw;
    canvas.height = ch;
    gl.viewport(0, 0, cw, ch);

    const fov = (60 * Math.PI) / 180;
    fy = ch / 2 / Math.tan(fov / 2);
    fx = fy;
    gl.uniform2fv(u_focal, new Float32Array([fx, fy]));
    gl.uniform2fv(u_viewport, new Float32Array([cw, ch]));
    projectionMatrix = getProjectionMatrix(fx, fy, cw, ch);
    gl.uniformMatrix4fv(u_projection, false, projectionMatrix);
  }

  const resizeObs = new ResizeObserver(resize);
  resizeObs.observe(host);
  resize();

  function orbitViewMatrix(now: number): number[] {
    const t = Math.sin(((now - animStart) / 5000) * speed) * speed;
    const d = orbitDistance;
    let inv = invert4(orbitBase);
    if (!inv) return viewMatrix;
    inv = translate4(inv, (2.5 * d * t) / 6.5, 0, (d * (1 - Math.cos(t))) / 6.5 * 6);
    inv = rotate4(inv, (-0.6 * t * speed) / Math.max(speed, 0.5), 0, 1, 0);
    const next = invert4(inv);
    return next ?? viewMatrix;
  }

  function frame(now: number) {
    rafId = requestAnimationFrame(frame);
    if (!running || disposed) return;

    viewMatrix = orbitViewMatrix(now);
    const viewProj = multiply4(projectionMatrix, viewMatrix);
    worker.postMessage({ view: viewProj });

    if (vertexCount <= 0) return;

    gl.uniformMatrix4fv(u_view, false, viewMatrix);
    gl.clearColor(0.07, 0.07, 0.07, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, vertexCount);
  }

  const onVis = () => {
    running = !document.hidden;
    if (running && vertexCount > 0) frame(performance.now());
  };
  document.addEventListener('visibilitychange', onVis);

  report('loading');
  const url = resolveUrl(plyUrlForAm15(opts.plyUrl));
  fetch(url, { signal: abortCtrl.signal })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((buf) => {
      if (disposed) return;
      worker.postMessage({ ply: buf, maxSplats: opts.maxSplats ?? 200_000 });
      rafId = requestAnimationFrame(frame);
    })
    .catch((e) => {
      if (disposed || abortCtrl.signal.aborted) return;
      report('failed', e instanceof Error ? e.message : 'PLY 加载失败');
    });

  return {
    dispose() {
      disposed = true;
      abortCtrl.abort();
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVis);
      resizeObs.disconnect();
      worker.terminate();
      gl.deleteProgram(program);
      gl.deleteBuffer(vertexBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteTexture(texture);
      canvas.remove();
    },
  };
}
