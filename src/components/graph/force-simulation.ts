/**
 * 力导向仿真（带 alpha 冷却）——解决 perpetual jitter。
 *
 * 抖动根因：
 * 1. 仿真永不停止 → 弹簧/斥力在平衡点附近持续振荡
 * 2. 阻尼不足（underdamped）+ 每帧 60fps 全量 SVG 重绘
 * 3. 速度未在收敛时清零 → 肉眼可见微颤
 */

export type ForceSimNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed?: boolean;
};

export type ForceLink = { source: string; target: string };

export type ForceSimOptions = {
  kRepel: number;
  kSpring: number;
  edgeLen: number;
  damping?: number;
  centerPull?: number;
  maxSpeed?: number;
  repelCutoff?: number;
  alphaDecay?: number;
  settleAlpha?: number;
  velocityEpsilon?: number;
};

export type ForceSimController = {
  alpha: number;
  running: boolean;
};

export function createForceController(): ForceSimController {
  return { alpha: 1, running: true };
}

export function reheatForce(ctrl: ForceSimController, alpha = 0.85) {
  ctrl.alpha = Math.max(ctrl.alpha, alpha);
  ctrl.running = true;
}

/** 单步仿真；返回是否发生了可见位移（供决定是否 bump 渲染帧） */
export function stepForceSimulation(
  nodes: ForceSimNode[],
  links: ForceLink[],
  nodeMap: Map<string, ForceSimNode>,
  ctrl: ForceSimController,
  opts: ForceSimOptions,
): boolean {
  if (!ctrl.running || nodes.length === 0) return false;

  const alphaDecay = opts.alphaDecay ?? 0.028;
  const settleAlpha = opts.settleAlpha ?? 0.004;
  const velocityEpsilon = opts.velocityEpsilon ?? 0.06;
  const dampingBase = opts.damping ?? 0.88;
  const centerPull = opts.centerPull ?? 0.0018;
  const maxSpeed = opts.maxSpeed ?? 12;
  const repelCutoff = opts.repelCutoff ?? 70000;

  if (ctrl.alpha < settleAlpha) {
    ctrl.running = false;
    for (const n of nodes) {
      n.vx = 0;
      n.vy = 0;
    }
    return false;
  }

  const alpha = ctrl.alpha;
  const kRepel = opts.kRepel * alpha;
  const kSpring = opts.kSpring * alpha;
  const edgeLen = opts.edgeLen;
  const damping = Math.min(0.96, dampingBase + (1 - alpha) * 0.1);

  const N = nodes.length;
  for (let i = 0; i < N; i++) {
    const a = nodes[i];
    if (a.fixed) continue;
    for (let j = i + 1; j < N; j++) {
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d2 = dx * dx + dy * dy + 0.01;
      if (d2 > repelCutoff) continue;
      const inv = kRepel / d2;
      const fx = dx * inv;
      const fy = dy * inv;
      a.vx += fx;
      a.vy += fy;
      if (!b.fixed) {
        b.vx -= fx;
        b.vy -= fy;
      }
    }
  }

  for (const l of links) {
    const a = nodeMap.get(l.source);
    const b = nodeMap.get(l.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    const diff = (d - edgeLen) * kSpring;
    const fx = (dx / d) * diff;
    const fy = (dy / d) * diff;
    if (!a.fixed) {
      a.vx += fx;
      a.vy += fy;
    }
    if (!b.fixed) {
      b.vx -= fx;
      b.vy -= fy;
    }
  }

  let moved = false;
  for (const n of nodes) {
    if (n.fixed) {
      n.vx = 0;
      n.vy = 0;
      continue;
    }
    n.vx -= n.x * centerPull * alpha;
    n.vy -= n.y * centerPull * alpha;
    n.vx *= damping;
    n.vy *= damping;

    const sp = Math.hypot(n.vx, n.vy);
    if (sp > maxSpeed) {
      n.vx = (n.vx / sp) * maxSpeed;
      n.vy = (n.vy / sp) * maxSpeed;
    }
    if (alpha < 0.08 && sp < velocityEpsilon) {
      n.vx = 0;
      n.vy = 0;
    }

    const ox = n.x;
    const oy = n.y;
    n.x += n.vx;
    n.y += n.vy;
    if (Math.abs(n.x - ox) > 0.02 || Math.abs(n.y - oy) > 0.02) moved = true;
  }

  ctrl.alpha += (0 - ctrl.alpha) * alphaDecay;
  if (!moved && ctrl.alpha < 0.05) {
    ctrl.running = false;
    for (const n of nodes) {
      n.vx = 0;
      n.vy = 0;
    }
  }
  return moved;
}
