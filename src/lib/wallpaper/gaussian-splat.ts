/**
 * 3DGS Instanced Splat 着色器 — 对齐 MLSharp viewer (localhost:8000)
 */
import type * as THREE from 'three';

export const DEFAULT_SPLAT_SCALE = 2.5;

export function createInstancedSplatMaterial(
  THREE: typeof import('three'),
  opts: { splatScale?: number; brightness?: number } = {},
) {
  const splatScale = opts.splatScale ?? DEFAULT_SPLAT_SCALE;
  const brightness = opts.brightness ?? 1;

  return new THREE.ShaderMaterial({
    uniforms: {
      uSplatScale: { value: splatScale },
      uOpacityMod: { value: 1 },
      uBrightness: { value: brightness },
    },
    vertexShader: /* glsl */ `
      uniform float uSplatScale;

      attribute vec3 instPosition;
      attribute vec4 instRotation;
      attribute vec3 instScale;
      attribute vec4 instColor;

      varying vec4 vColor;
      varying vec2 vUv;

      mat3 rotationMatrix(vec4 q) {
        float x = q.x, y = q.y, z = q.z, w = q.w;
        float x2 = x + x, y2 = y + y, z2 = z + z;
        float xx = x * x2, xy = x * y2, xz = x * z2;
        float yy = y * y2, yz = y * z2, zz = z * z2;
        float wx = w * x2, wy = w * y2, wz = w * z2;
        return mat3(
          1.0 - (yy + zz), xy - wz, xz + wy,
          xy + wz, 1.0 - (xx + zz), yz - wx,
          xz - wy, yz + wx, 1.0 - (xx + yy)
        );
      }

      void main() {
        vUv = uv;
        vColor = instColor;
        vec3 pos = rotationMatrix(instRotation) * (position * instScale * uSplatScale);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + instPosition, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacityMod;
      uniform float uBrightness;

      varying vec4 vColor;
      varying vec2 vUv;

      void main() {
        vec2 c = vUv * 2.0 - 1.0;
        if (dot(c, c) > 1.0) discard;
        float a = exp(-dot(c, c) * 2.0) * vColor.a * uOpacityMod;
        if (a < 0.05) discard;
        gl_FragColor = vec4(vColor.rgb * uBrightness, a);
      }
    `,
    side: THREE.DoubleSide,
    depthWrite: true,
    depthTest: true,
  });
}

export function buildInstancedSplatMesh(
  THREE: typeof import('three'),
  cloud: {
    positions: Float32Array;
    rotations: Float32Array;
    scales: Float32Array;
    colors: Float32Array;
    count: number;
    radius: number;
  },
  material: THREE.ShaderMaterial,
) {
  const baseGeo = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), Math.max(cloud.radius, 1));
  geo.frustumCulled = false;
  geo.index = baseGeo.index;
  geo.attributes.position = baseGeo.attributes.position;
  geo.attributes.uv = baseGeo.attributes.uv;

  geo.setAttribute('instPosition', new THREE.InstancedBufferAttribute(cloud.positions, 3));
  geo.setAttribute('instRotation', new THREE.InstancedBufferAttribute(cloud.rotations, 4));
  geo.setAttribute('instScale', new THREE.InstancedBufferAttribute(cloud.scales, 3));
  geo.setAttribute('instColor', new THREE.InstancedBufferAttribute(cloud.colors, 4));

  const mesh = new THREE.Mesh(geo, material);
  mesh.rotation.x = Math.PI;
  mesh.frustumCulled = false;
  return mesh;
}

/** 与 MLSharp autoFocusCamera 一致 */
export function estimateSceneRadius(positions: Float32Array, count: number): number {
  const samples = Math.min(300, count);
  let d = 0;
  for (let i = 0; i < samples; i++) {
    const ix = i * 3;
    d += Math.hypot(positions[ix], positions[ix + 1], positions[ix + 2]);
  }
  return d / samples || 10;
}

export function frameSplatCamera(
  cam: THREE.PerspectiveCamera,
  positions: Float32Array,
  count: number,
  aspect: number,
) {
  const radius = estimateSceneRadius(positions, count);
  cam.fov = 60;
  cam.near = 0.1;
  cam.far = Math.max(radius * 50, 500);
  cam.aspect = aspect;
  cam.position.set(0, 0, radius * 3);
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix();
}
